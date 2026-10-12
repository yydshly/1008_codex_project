import { expect, test } from 'vitest'
import { Buffer } from 'node:buffer'
import { GRID_HEIGHT, GRID_WIDTH } from '../src/model'
import { exportArtProject, importArtProject, MAX_PROJECT_BYTES, validateSavedArt } from '../src/project-file'
import type { SavedArt } from '../src/storage'

function fixture(): SavedArt {
  const state = new Float32Array(GRID_WIDTH * GRID_HEIGHT * 4)
  const reference = new Float32Array(state.length)
  state.set([0.24000001, 0.3, -123.456, 3.14159265])
  state[state.length - 4] = 6.123456
  reference.set([1.12345, 0, 0, 0])
  reference[reference.length - 4] = 2.5
  return {
    version: 1, width: GRID_WIDTH, height: GRID_HEIGHT, mode: 'surface', state: state.buffer, referenceState: reference.buffer,
    savedAt: '2026-10-08T12:00:00.000Z', title: '中文沙画作品', paintingId: 'existing-local-id',
    settings: { tool: 'palm', radius: 19, strength: 0.6, wetness: 0.2, wind: 0.1, light: 'moon', flow: false, palmAngle: -Math.PI / 2, palmAspect: 0.45, referenceVisible: true, referenceOpacity: 0.32, referenceGrid: true },
    conversion: { blackPoint: 15, whitePoint: 230, gamma: 1.6, invert: true, minHeight: 0.05, maxHeight: 2.5 },
    referenceImage: { name: '原图.webp', blob: new Blob([new Uint8Array([0, 1, 255, 254, 253, 100, 128])], { type: 'image/webp' }) },
  }
}

test('project JSON round trip preserves exact float bytes, reference bed, image and settings', async () => {
  const original = fixture()
  const file = await exportArtProject(original)
  const restored = await importArtProject(file)
  expect(Buffer.compare(Buffer.from(restored.state), Buffer.from(original.state))).toBe(0)
  expect(Buffer.compare(Buffer.from(restored.referenceState!), Buffer.from(original.referenceState!))).toBe(0)
  expect(restored.settings).toEqual(original.settings)
  expect(restored.conversion).toEqual(original.conversion)
  expect(restored.title).toBe(original.title)
  expect(restored.paintingId).toBeUndefined()
  expect(restored.referenceImage?.name).toBe(original.referenceImage?.name)
  expect(restored.referenceImage?.blob.type).toBe('image/webp')
  expect(await restored.referenceImage?.blob.arrayBuffer()).toEqual(await original.referenceImage?.blob.arrayBuffer())
  expect((await file.text()).includes('existing-local-id')).toBe(false)
})

test('legacy v1 drafts without reference fields remain valid and portable', async () => {
  const original = fixture()
  delete original.referenceState
  delete original.referenceImage
  delete original.conversion
  delete original.paintingId
  expect(await importArtProject(await exportArtProject(original))).toEqual(original)
  expect(original.settings.pourStyle).toBeUndefined()
  expect(original.settings.pourHeight).toBeUndefined()
  expect(original.settings.pourSpread).toBeUndefined()
})

test.each(['stream', 'scatter', 'handful'] as const)('portable projects preserve %s pouring settings without persisting hand inventory', async pourStyle => {
  const original = fixture()
  original.settings.pourStyle = pourStyle
  original.settings.pourHeight = 0
  original.settings.pourSpread = 1
  const file = await exportArtProject(original)
  const restored = await importArtProject(file)
  expect(restored.settings).toEqual(original.settings)
  expect(await file.text()).not.toContain('handRemaining')
  expect(Buffer.compare(Buffer.from(restored.state), Buffer.from(original.state))).toBe(0)
})

test.each([
  ['invalid dimensions', (art: SavedArt) => { art.width = 1024 }],
  ['unknown tool', (art: SavedArt) => { art.settings.tool = 'erase' as never }],
  ['unsafe radius', (art: SavedArt) => { art.settings.radius = 1000 }],
  ['wrong palm units', (art: SavedArt) => { art.settings.palmAngle = 180 }],
  ['invalid palm aspect', (art: SavedArt) => { art.settings.palmAspect = 0.1 }],
  ['unknown pour style', (art: SavedArt) => { art.settings.pourStyle = 'spray' as never }],
  ['negative pour height', (art: SavedArt) => { art.settings.pourHeight = -0.01 }],
  ['excess pour height', (art: SavedArt) => { art.settings.pourHeight = 1.01 }],
  ['NaN pour height', (art: SavedArt) => { art.settings.pourHeight = Number.NaN }],
  ['negative pour spread', (art: SavedArt) => { art.settings.pourSpread = -0.01 }],
  ['excess pour spread', (art: SavedArt) => { art.settings.pourSpread = 1.01 }],
  ['non-numeric pour spread', (art: SavedArt) => { art.settings.pourSpread = '0.5' as never }],
  ['invalid opacity', (art: SavedArt) => { art.settings.referenceOpacity = 2 }],
  ['invalid light', (art: SavedArt) => { art.settings.light = 'none' as never }],
  ['invalid black/white order', (art: SavedArt) => { art.conversion!.whitePoint = 10 }],
  ['invalid conversion gamma', (art: SavedArt) => { art.conversion!.gamma = Number.NaN }],
  ['negative height', (art: SavedArt) => { new Float32Array(art.state)[0] = -0.001 }],
  ['infinite velocity', (art: SavedArt) => { new Float32Array(art.state)[2] = Infinity }],
  ['NaN reference', (art: SavedArt) => { new Float32Array(art.referenceState!)[0] = Number.NaN }],
  ['truncated reference', (art: SavedArt) => { art.referenceState = new ArrayBuffer(16) }],
  ['unsupported image', (art: SavedArt) => { art.referenceImage!.blob = new Blob(['<svg/>'], { type: 'image/svg+xml' }) }],
] as const)('%s is rejected', (_, mutate) => {
  const art = fixture()
  mutate(art)
  expect(() => validateSavedArt(art)).toThrow()
})

test('malformed JSON, oversized input and invalid base64 are rejected', async () => {
  await expect(importArtProject('{')).rejects.toThrow('JSON')
  await expect(importArtProject(new Blob([new Uint8Array(MAX_PROJECT_BYTES)]))).rejects.toThrow('60 MB')
  const document = JSON.parse(await (await exportArtProject(fixture())).text())
  document.art.state = document.art.state.slice(4)
  await expect(importArtProject(JSON.stringify(document))).rejects.toThrow('尺寸')
  document.art.state = '!!!!!===' 
  await expect(importArtProject(JSON.stringify(document))).rejects.toThrow('base64')
})
