import { beforeEach, expect, test } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { FIXED_STEP, GRID_HEIGHT, GRID_WIDTH } from '../src/model'
import type { ArtPour, ArtStep } from '../src/model'
import type { SavedArt } from '../src/storage'
import { listPaintings, loadArt, saveArt } from '../src/storage'
import {
  MAX_RECORDING_BYTES, MAX_RECORDING_EVENTS, MAX_RECORDING_SNAPSHOTS, MAX_RECORDING_TICKS,
  RecordingBuilder, exportRecording, importRecording, loadRecording, saveRecording, validateRecording,
} from '../src/recording'
import type { Recording } from '../src/recording'

beforeEach(() => { globalThis.indexedDB = new IDBFactory() })
function art(mode: SavedArt['mode'] = 'lightbox', amount = 0.24): SavedArt {
  const state = new Float32Array(GRID_WIDTH * GRID_HEIGHT * 4)
  const reference = new Float32Array(state.length)
  state.set([amount, 0.5, -123.125, 3.1415927])
  state[state.length - 4] = 2.125
  reference.set([1.125, 0, 4.5, -6.25])
  return {
    version: 1, width: GRID_WIDTH, height: GRID_HEIGHT, mode, state: state.buffer, referenceState: reference.buffer,
    savedAt: '2026-10-08T12:00:00.000Z', title: '中文沙画', paintingId: 'secret-local-id',
    settings: { tool: 'palm', radius: 32, strength: 0.7, wetness: 0, wind: 0, light: 'noon', flow: false, palmAngle: Math.PI / 2, palmAspect: 0.45, referenceVisible: true },
    referenceImage: { name: '原图.webp', blob: new Blob([new Uint8Array([3, 5, 7])], { type: 'image/webp' }) },
  }
}
function input(): ArtStep {
  return {
    dt: FIXED_STEP, wetness: 0.2, wind: 0.1, windAngle: 0.2, preserve: true,
    contacts: [{ tool: 'palm', from: { x: 166, y: 319 }, to: { x: 380, y: 311 }, velocity: { x: 2140, y: -80 }, radius: 42, pressure: 0.8, strength: 0.7, angle: Math.PI / 2, aspect: 0.45 }],
  }
}
function recording(): Recording {
  return { format: 'sandboard-sand-recording', version: 1, title: '沙画表演', createdAt: '2026-10-08T12:00:00.000Z', initial: art(), events: [{ type: 'step', step: input(), repeat: 1 }], ticks: 1 }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

test('the builder copies buffers and nested contacts, strips attachments, and merges equal fixed steps', async () => {
  const initial = art()
  const builder = new RecordingBuilder(initial)
  const first = input()
  builder.recordStep(first)
  first.contacts[0].from.x = 2
  first.contacts[0].velocity.y = 999
  new Float32Array(initial.state)[0] = 9
  new Float32Array(initial.referenceState!)[0] = 10
  initial.settings.light = 'moon'
  builder.recordStep(input())
  const changed = input(); changed.preserve = false
  builder.recordStep(changed)
  const result = await builder.finish('  一段掌形表演  ')
  expect(result.title).toBe('一段掌形表演')
  expect(result.ticks).toBe(3)
  expect(result.events).toEqual([{ type: 'step', step: input(), repeat: 2 }, { type: 'step', step: changed, repeat: 1 }])
  expect(new Float32Array(result.initial.state)[0]).toBeCloseTo(0.24, 6)
  expect(new Float32Array(result.initial.referenceState!)[0]).toBe(1.125)
  expect(result.initial.settings.light).toBe('noon')
  expect(result.initial.referenceImage).toBeUndefined()
  expect(result.initial.paintingId).toBeUndefined()
  expect(builder.stopped).toBe(true)
  expect(builder.recordStep(input())).toBe(false)
})

test('snapshot reservations preserve event order when readbacks resolve backwards', async () => {
  const builder = new RecordingBuilder(art())
  const first = deferred<SavedArt>(), second = deferred<SavedArt>()
  builder.recordStep(input())
  builder.recordSnapshot(first.promise)
  builder.recordStep(input())
  builder.recordSnapshot(second.promise)
  // The first look after an unresolved snapshot cannot be deduplicated against
  // the initial look: the snapshot may introduce another lighting preset.
  builder.recordLook({ light: 'noon', wetness: 0, wind: 0 })
  builder.recordStep(input())
  let finished = false
  const pending = builder.finish().then(result => { finished = true; return result })
  second.resolve(art('lightbox', 0.9))
  await Promise.resolve()
  expect(finished).toBe(false)
  first.resolve(art('lightbox', 0.4))
  const result = await pending
  expect(result.events.map(event => event.type)).toEqual(['step', 'snapshot', 'step', 'snapshot', 'look', 'step'])
  expect(result.ticks).toBe(3)
  const snapshots = result.events.filter(event => event.type === 'snapshot')
  expect(snapshots.map(event => new Float32Array(event.art.state)[0])).toEqual([Math.fround(0.4), Math.fround(0.9)])
  expect(snapshots.every(event => !event.art.referenceImage && !event.art.paintingId)).toBe(true)
})

test('unchanged looks do not split idle RLE and consecutive untimed looks retain their last value', async () => {
  const builder = new RecordingBuilder(art())
  const idle = { ...input(), contacts: [] }
  builder.recordStep(idle)
  builder.recordLook(art().settings)
  builder.recordStep(idle)
  builder.recordLook({ light: 'sunset', wetness: 0.1, wind: 0.1 })
  builder.recordLook({ light: 'moon', wetness: 0.8, wind: 0.2 })
  const result = await builder.finish()
  expect(result.ticks).toBe(2)
  expect(result.events).toEqual([{ type: 'step', step: idle, repeat: 2 }, { type: 'look', settings: { light: 'moon', wetness: 0.8, wind: 0.2 } }])
})

test('a failed snapshot stops recording and makes finishing fail with its Chinese error', async () => {
  const builder = new RecordingBuilder(art())
  builder.recordSnapshot(Promise.reject(new Error('GPU 读回中断')))
  await expect(builder.finish()).rejects.toThrow('录制快照读取失败：GPU 读回中断')
  expect(builder.stopped).toBe(true)
  expect(builder.error?.message).toContain('GPU 读回中断')
  expect(builder.recordStep(input())).toBe(false)
})

test('changing mode through a snapshot is rejected rather than creating a mixed simulation', async () => {
  const builder = new RecordingBuilder(art('lightbox'))
  builder.recordSnapshot(Promise.resolve(art('surface')))
  await expect(builder.finish()).rejects.toThrow('同一种')
})

test('the 180 second limit accepts exactly 21600 ticks and retains its final step', async () => {
  const builder = new RecordingBuilder(art())
  const idle = { dt: FIXED_STEP, contacts: [], wetness: 0, wind: 0, windAngle: 0, preserve: true }
  for (let index = 0; index < MAX_RECORDING_TICKS; index++) expect(builder.recordStep(idle)).toBe(true)
  expect(builder.limitReached).toBe(true)
  expect(builder.stopped).toBe(true)
  expect(builder.ticks).toBe(MAX_RECORDING_TICKS)
  expect(builder.recordStep(idle)).toBe(false)
  const result = await builder.finish()
  expect(result.events).toEqual([{ type: 'step', step: idle, repeat: MAX_RECORDING_TICKS }])
})

test('the eighth total snapshot is accepted and a ninth request stops without a partial event', async () => {
  const initial = art()
  const builder = new RecordingBuilder(initial)
  for (let count = 1; count < MAX_RECORDING_SNAPSHOTS; count++) expect(builder.recordSnapshot(Promise.resolve(initial))).toBe(true)
  expect(builder.recordStep(input())).toBe(true)
  expect(builder.limitReached).toBe(false)
  expect(builder.recordSnapshot(Promise.reject(new Error('unaccepted readback')))).toBe(false)
  expect(builder.limitReached).toBe(true)
  const result = await builder.finish()
  expect(result.events.filter(event => event.type === 'snapshot')).toHaveLength(7)
  expect(result.ticks).toBe(1)
})

test('recording files preserve exact state/reference bytes, looks, angle, aspect and preserve', async () => {
  const builder = new RecordingBuilder(art())
  builder.recordStep(input()); builder.recordStep(input())
  builder.recordLook({ light: 'moon', wetness: 0.6, wind: 0.2 })
  builder.recordSnapshot(Promise.resolve(art('lightbox', 0.75)))
  const result = await builder.finish('可携带的沙画')
  const file = await exportRecording(result)
  const contents = await file.text()
  expect(contents).not.toContain('原图.webp')
  expect(contents).not.toContain('secret-local-id')
  expect(contents).not.toContain('referenceImage')
  expect(await importRecording(file)).toEqual(result)
  expect(file.type).toBe('application/json')
})

test('an initial legacy state without a reference bed remains portable', async () => {
  const initial = art(); delete initial.referenceState
  const original = await new RecordingBuilder(initial).finish()
  expect((await importRecording(await exportRecording(original))).initial.referenceState).toBeUndefined()
})

test.each(['stream', 'scatter', 'handful'] as const)('%s gestures are deeply copied, keep single-release boundaries, and round trip in recordings', async style => {
  const initial = art()
  Object.assign(initial.settings, { pourStyle: style, pourHeight: 0.55, pourSpread: 0.5 })
  const builder = new RecordingBuilder(initial)
  const first = input()
  first.contacts[0].tool = 'pour'
  first.contacts[0].pour = { style, height: 0.55, spread: 0.5, burst: 1 }
  const originalFirst = structuredClone(first)
  builder.recordStep(first)
  first.contacts[0].pour.height = 1
  first.contacts[0].pour.style = 'stream'
  const next = structuredClone(originalFirst)
  next.contacts[0].pour!.burst = 0
  builder.recordStep(next)
  builder.recordStep(next)
  const result = await builder.finish()
  expect(result.events).toEqual([{ type: 'step', step: originalFirst, repeat: 1 }, { type: 'step', step: next, repeat: 2 }])
  expect(result.initial.settings.pourStyle).toBe(style)
  expect(await importRecording(await exportRecording(result))).toEqual(result)
})

test('legacy direct-deposit pour contacts remain portable without an airborne configuration', async () => {
  const original = recording()
  if (original.events[0].type === 'step') original.events[0].step.contacts[0].tool = 'pour'
  const checked = validateRecording(original)
  expect(checked.events[0].type === 'step' && checked.events[0].step.contacts[0].pour).toBeUndefined()
  expect(await importRecording(await exportRecording(checked))).toEqual(checked)
})

test('natural pouring flow is copied exactly, changes split step runs, and new files round trip', async () => {
  const builder = new RecordingBuilder(art())
  const first = input()
  first.contacts[0].tool = 'pour'
  first.contacts[0].pour = { style: 'scatter', height: 0.55, spread: 0.5, natural: true, flow: 1.25 }
  const originalFirst = structuredClone(first)
  builder.recordStep(first)
  first.contacts[0].pour.natural = false
  first.contacts[0].pour.flow = 0
  builder.recordStep(first)
  builder.recordStep(first)
  const increased = structuredClone(first)
  increased.contacts[0].pour!.flow = 2
  builder.recordStep(increased)
  const result = await builder.finish()
  expect(result.events).toEqual([
    { type: 'step', step: originalFirst, repeat: 1 },
    { type: 'step', step: first, repeat: 2 },
    { type: 'step', step: increased, repeat: 1 },
  ])
  expect(await importRecording(await exportRecording(result))).toEqual(result)
})

test('legacy airborne contacts omit natural and flow after validation and file round trip', async () => {
  const original = recording()
  const event = original.events[0]
  if (event.type !== 'step') throw new Error('fixture')
  event.step.contacts[0].tool = 'pour'
  event.step.contacts[0].pour = { style: 'scatter', height: 0.55, spread: 0.5 }
  const checked = validateRecording(original)
  const restored = await importRecording(await exportRecording(checked))
  expect(restored).toEqual(checked)
  if (restored.events[0].type !== 'step') throw new Error('fixture')
  expect(Object.hasOwn(restored.events[0].step.contacts[0].pour!, 'natural')).toBe(false)
  expect(Object.hasOwn(restored.events[0].step.contacts[0].pour!, 'flow')).toBe(false)
})

test.each([
  ['unknown style', { style: 'spray', height: 0.5, spread: 0.5 }],
  ['negative height', { style: 'scatter', height: -0.01, spread: 0.5 }],
  ['excess height', { style: 'scatter', height: 1.01, spread: 0.5 }],
  ['non-numeric height', { style: 'scatter', height: '0.5', spread: 0.5 }],
  ['NaN spread', { style: 'scatter', height: 0.5, spread: Number.NaN }],
  ['negative spread', { style: 'scatter', height: 0.5, spread: -0.01 }],
  ['excess spread', { style: 'scatter', height: 0.5, spread: 1.01 }],
  ['negative burst', { style: 'handful', height: 0.5, spread: 0.5, burst: -0.01 }],
  ['excess burst', { style: 'handful', height: 0.5, spread: 0.5, burst: 1.01 }],
  ['infinite burst', { style: 'handful', height: 0.5, spread: 0.5, burst: Infinity }],
  ['non-boolean natural', { style: 'scatter', height: 0.5, spread: 0.5, natural: 1 }],
  ['null natural', { style: 'scatter', height: 0.5, spread: 0.5, natural: null }],
  ['negative flow', { style: 'stream', height: 0.5, spread: 0.5, flow: -0.01 }],
  ['excess flow', { style: 'stream', height: 0.5, spread: 0.5, flow: 2.01 }],
  ['NaN flow', { style: 'stream', height: 0.5, spread: 0.5, flow: Number.NaN }],
  ['infinite flow', { style: 'stream', height: 0.5, spread: 0.5, flow: Infinity }],
  ['non-numeric flow', { style: 'stream', height: 0.5, spread: 0.5, flow: '1' }],
  ['unknown field', { style: 'scatter', height: 0.5, spread: 0.5, inventory: 3500 }],
  ['missing height', { style: 'scatter', spread: 0.5 }],
  ['null configuration', null],
  ['array configuration', []],
] as const)('invalid pour %s is rejected before file state decoding', async (_name, pour) => {
  const original = recording()
  const initial = { ...original.initial, state: '!!!!' } as Record<string, unknown>
  delete initial.referenceState; delete initial.referenceImage; delete initial.paintingId
  const document = JSON.parse(JSON.stringify({ ...original, initial: { format: 'sandboard-sand-art', version: 1, art: initial } }))
  document.events[0].step.contacts[0].tool = 'pour'
  document.events[0].step.contacts[0].pour = pour
  await expect(importRecording(JSON.stringify(document))).rejects.toThrow(/撒沙|撒开|抬手|释放|字段/)
})

test('pour configuration is forbidden on other tools and valid endpoints stay exact', () => {
  const original = recording()
  const first = original.events[0]
  if (first.type !== 'step') throw new Error('fixture')
  first.step.contacts[0].pour = { style: 'stream', height: 0, spread: 1, natural: false, flow: 0 }
  expect(() => validateRecording(original)).toThrow('只有撒沙')
  first.step.contacts[0].tool = 'pour'
  const checked = validateRecording(original)
  expect(checked.events[0].type === 'step' && checked.events[0].step.contacts[0].pour).toEqual({ style: 'stream', height: 0, spread: 1, natural: false, flow: 0 } satisfies ArtPour)
})

test.each([
  ['non-fixed dt', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].step.dt = 1 / 60 }],
  ['unknown tool', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].step.contacts[0].tool = 'eraser' as never }],
  ['outside point', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].step.contacts[0].to.x = GRID_WIDTH + 1 }],
  ['infinite speed', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].step.contacts[0].velocity.y = Infinity }],
  ['unsafe pressure', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].step.contacts[0].pressure = 2 }],
  ['invalid aspect', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].step.contacts[0].aspect = 0.1 }],
  ['unsafe angle', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].step.contacts[0].angle = 180 }],
  ['NaN wetness', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].step.wetness = NaN }],
  ['wrong preserve type', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].step.preserve = 'yes' as never }],
  ['too many contacts', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].step.contacts = Array(9).fill(value.events[0].step.contacts[0]) }],
  ['zero repeat', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].repeat = 0 }],
  ['fractional repeat', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].repeat = 1.5 }],
  ['overlong repeat', (value: Recording) => { if (value.events[0].type === 'step') value.events[0].repeat = MAX_RECORDING_TICKS + 1 }],
  ['wrong tick count', (value: Recording) => { value.ticks = 2 }],
  ['unknown event', (value: Recording) => { value.events.push({ type: 'network' } as never) }],
  ['invalid look', (value: Recording) => { value.events.push({ type: 'look', settings: { light: 'moon', wetness: 0.2, wind: -1 } }) }],
  ['mixed snapshot mode', (value: Recording) => { value.events.push({ type: 'snapshot', art: art('surface') }) }],
  ['excess snapshots', (value: Recording) => { value.events.push(...Array(8).fill({ type: 'snapshot', art: value.initial })) }],
  ['excess events', (value: Recording) => { value.events = Array(MAX_RECORDING_EVENTS + 1).fill({ type: 'look', settings: { light: 'noon', wetness: 0, wind: 0 } }) }],
  ['invalid date', (value: Recording) => { value.createdAt = 'today' }],
] as const)('%s is rejected without treating it as a usable recording', (_, mutate) => {
  const value = recording()
  mutate(value)
  expect(() => validateRecording(value)).toThrow()
})

test('file import rejects invalid JSON, oversize, attached original images and invalid base64', async () => {
  await expect(importRecording('{')).rejects.toThrow('JSON')
  class OversizedFile extends Blob { override get size() { return MAX_RECORDING_BYTES } }
  await expect(importRecording(new OversizedFile(['small']))).rejects.toThrow('128 MB')
  const document = JSON.parse(await (await exportRecording(recording())).text())
  document.initial.art.referenceImage = { name: 'foreign-original.png', type: 'image/png', data: 'AAAA' }
  await expect(importRecording(JSON.stringify(document))).rejects.toThrow('不支持')
  delete document.initial.art.referenceImage
  document.initial.art.state = '!!!!'
  await expect(importRecording(JSON.stringify(document))).rejects.toThrow('base64')
  document.ticks = 10
  // Structural/timing errors are reported before attempting the invalid state.
  await expect(importRecording(JSON.stringify(document))).rejects.toThrow('总步数')
})

test('recording storage retains only the latest recording and cannot modify drafts or the gallery', async () => {
  const initial = art()
  await saveArt(initial)
  expect(await loadRecording()).toBeUndefined()
  const first = await new RecordingBuilder(initial).finish('第一段')
  const saving = saveRecording(first)
  new Float32Array(first.initial.state)[0] = 9
  await saving
  expect(new Float32Array((await loadRecording())!.initial.state)[0]).toBeCloseTo(0.24, 6)
  const second = await new RecordingBuilder(art('surface', 2)).finish('最新一段')
  await saveRecording(second)
  expect(await loadRecording()).toEqual(second)
  expect(await loadArt('lightbox')).toEqual(initial)
  expect(await listPaintings()).toEqual([])
  await expect(saveRecording({ ...second, ticks: 1 })).rejects.toThrow('总步数')
  expect((await loadRecording())?.title).toBe('最新一段')
})

test('corrupt local recordings fail visibly instead of being returned to the player', async () => {
  await loadRecording()
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('sandboard-art-recordings', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction('recordings', 'readwrite')
      transaction.oncomplete = () => { db.close(); resolve() }
      transaction.onerror = () => { db.close(); reject(transaction.error) }
      transaction.objectStore('recordings').put({ format: 'unknown' }, 'latest')
    }
  })
  await expect(loadRecording()).rejects.toThrow('本地录制无法读取')
})
