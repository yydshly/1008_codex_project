import { afterAll, beforeAll, expect, test } from 'vitest'
import { Buffer } from 'node:buffer'
import { create, globals } from 'webgpu'
import { FIXED_STEP, type ArtStep } from '../src/model'
import { ArtSolver } from '../src/solver'
import { ReplaySession } from '../src/replay'
import type { Recording, RecordingEvent } from '../src/recording'
import type { SavedArt } from '../src/storage'

let gpu: GPU
let device: GPUDevice
const errors: string[] = []
const width = 64
const height = 48
beforeAll(async () => {
  Object.assign(globalThis, globals)
  gpu = create([])
  const adapter = await gpu.requestAdapter()
  if (!adapter) throw new Error('回放测试需要硬件 WebGPU adapter。')
  expect(adapter.info.isFallbackAdapter).toBe(false)
  device = await adapter.requestDevice()
  device.addEventListener('uncapturederror', event => errors.push(event.error.message))
})
afterAll(() => device?.destroy())

function art(amount: number, referenceAmount = amount): SavedArt {
  const data = new Float32Array(width * height * 4)
  const reference = new Float32Array(data.length)
  for (let index = 0; index < data.length; index += 4) { data[index] = amount; reference[index] = referenceAmount }
  return { version: 1, mode: 'surface', width, height, state: data.buffer, referenceState: reference.buffer, savedAt: '2026-10-08T12:00:00.000Z', settings: { tool: 'palm', radius: 16, strength: 0.7, wetness: 0.1, wind: 0, light: 'noon' } }
}
function recording(initial: SavedArt, events: RecordingEvent[]): Recording {
  return { format: 'sandboard-sand-recording', version: 1, title: '回放硬件回归', createdAt: '2026-10-08T12:00:00.000Z', initial, events, ticks: events.reduce((sum, event) => sum + (event.type === 'step' ? event.repeat : 0), 0) }
}
function step(tool: ArtStep['contacts'][number]['tool'], x = 12): ArtStep {
  return { dt: FIXED_STEP, wetness: 0.1, wind: 0.1, windAngle: 0.2, preserve: true, contacts: [{ tool, from: { x, y: 22 }, to: { x: 48, y: 26 }, radius: 9, pressure: 0.8, strength: 0.7, velocity: { x: 150, y: 8 }, angle: Math.PI / 4, aspect: 0.4 }] }
}
function load(solver: ArtSolver, saved: SavedArt) {
  solver.loadState(new Float32Array(saved.state))
  if (saved.referenceState) device.queue.writeBuffer(solver.referenceBuffer, 0, saved.referenceState)
}
async function reference(solver: ArtSolver): Promise<ArrayBuffer> {
  const staging = device.createBuffer({ size: solver.byteLength, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
  try {
    const encoder = device.createCommandEncoder()
    encoder.copyBufferToBuffer(solver.referenceBuffer, 0, staging, 0, solver.byteLength)
    device.queue.submit([encoder.finish()])
    await staging.mapAsync(GPUMapMode.READ)
    const data = staging.getMappedRange().slice(0)
    staging.unmap()
    return data
  } finally { staging.destroy() }
}
const bytesEqual = (actual: ArrayBuffer, expected: ArrayBuffer) => expect(Buffer.compare(Buffer.from(actual), Buffer.from(expected))).toBe(0)

test('independent replay exactly matches original GPU steps including palm tails, keeps reference and live art intact', async () => {
  const initial = art(2, 1.9)
  const snap = art(1.4, 1.6)
  const events: RecordingEvent[] = [
    { type: 'step', step: step('pour'), repeat: 5 },
    { type: 'step', step: step('palm'), repeat: 9 },
    { type: 'look', settings: { light: 'sunset', wetness: 0.3, wind: 0.2 } },
    { type: 'step', step: { ...step('palm'), contacts: [] }, repeat: 3 },
    { type: 'snapshot', art: snap },
    { type: 'step', step: step('scrape'), repeat: 7 },
    { type: 'step', step: step('rake'), repeat: 1 },
    { type: 'step', step: step('palm', 20), repeat: 1 },
  ]
  const script = recording(initial, events)
  const live = new ArtSolver(device, initial.mode, width, height)
  await live.initialize()
  load(live, initial)
  for (const event of events) {
    if (event.type === 'snapshot') load(live, event.art)
    if (event.type === 'step') for (let repeat = 0; repeat < event.repeat; repeat++) {
      const encoder = device.createCommandEncoder()
      live.encodeStep(encoder, event.step, 0)
      device.queue.submit([encoder.finish()])
    }
  }
  const expected = (await live.readState()).buffer as ArrayBuffer
  const expectedReference = await reference(live)
  const session = await ReplaySession.create(device, 'rgba8unorm', script)
  try {
    await session.seek(session.durationTicks)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, expected)
    bytesEqual(await reference(session.solver), expectedReference)
    const texture = device.createTexture({ size: [64, 48], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT })
    const encoder = device.createCommandEncoder()
    session.encodeRender(encoder, texture.createView(), 0)
    device.queue.submit([encoder.finish()]); await device.queue.onSubmittedWorkDone(); texture.destroy()
    await session.seek(0)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, initial.state)
    bytesEqual(await reference(session.solver), initial.referenceState!)
    await session.seek(13)
    const middle = (await session.solver.readState()).buffer as ArrayBuffer
    const middleReference = await reference(session.solver)
    await session.seek(0); await session.advance(13)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, middle)
    bytesEqual(await reference(session.solver), middleReference)
    await session.advance(session.durationTicks - 13)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, expected)
    bytesEqual(await reference(session.solver), expectedReference)
    bytesEqual((await live.readState()).buffer as ArrayBuffer, expected)
    bytesEqual(await reference(live), expectedReference)
    expect(errors).toEqual([])
  } finally { session.destroy(); live.destroy(); await device.queue.onSubmittedWorkDone() }
})

test('all snapshot and look events at tick zero, step boundaries and the final tick keep their original order', async () => {
  const zero = art(0.6, 0.7), first = art(1.1, 1.2), second = art(1.6, 1.7), end = art(2.6, 2.7)
  const script = recording(art(2), [
    { type: 'look', settings: { light: 'sunset', wetness: 0.4, wind: 0.2 } },
    { type: 'snapshot', art: zero },
    { type: 'look', settings: { light: 'moon', wetness: 0.6, wind: 0.3 } },
    { type: 'step', step: step('pour'), repeat: 1 },
    { type: 'snapshot', art: first },
    { type: 'look', settings: { light: 'moon', wetness: 0.8, wind: 0 } },
    { type: 'snapshot', art: second },
    { type: 'look', settings: { light: 'sunset', wetness: 0.4, wind: 0.1 } },
    { type: 'step', step: step('palm'), repeat: 2 },
    { type: 'snapshot', art: end },
    { type: 'look', settings: { light: 'moon', wetness: 0.9, wind: 0.5 } },
  ])
  const session = await ReplaySession.create(device, 'rgba8unorm', script)
  try {
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, zero.state)
    expect(session.look).toEqual({ light: 'moon', wetness: 0.6, wind: 0.3 })
    await session.seek(1)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, second.state)
    bytesEqual(await reference(session.solver), second.referenceState!)
    expect(session.look).toEqual({ light: 'sunset', wetness: 0.4, wind: 0.1 })
    await session.seek(3)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, end.state)
    bytesEqual(await reference(session.solver), end.referenceState!)
    expect(session.look).toEqual({ light: 'moon', wetness: 0.9, wind: 0.5 })
    await session.seek(1); await session.seek(3)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, end.state)
    expect(session.look.light).toBe('moon')
    expect(errors).toEqual([])
  } finally { session.destroy(); await device.queue.onSubmittedWorkDone() }
})

test('new seeks cancel older long jobs and destruction cancels queued advances without corrupting the GPU', async () => {
  const initial = art(2)
  const session = await ReplaySession.create(device, 'rgba8unorm', recording(initial, [{ type: 'step', step: step('pour'), repeat: 1000 }]))
  const old = session.seek(1000).then(() => ({ name: 'completed' }), error => error as Error)
  await new Promise(resolve => setTimeout(resolve, 5))
  await session.seek(0)
  expect((await old).name).toBe('AbortError')
  expect(session.tick).toBe(0)
  bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, initial.state)
  const queued = session.advance(900).then(() => ({ name: 'completed' }), error => error as Error)
  session.destroy()
  expect((await queued).name).toBe('AbortError')
  await device.queue.onSubmittedWorkDone()
  expect(errors).toEqual([])
})

test('production 512 by 384 recording replays long idle tails, snapshots and checkpoint seeks byte for byte', async () => {
  const productionArt = (amount: number, baseline: number): SavedArt => {
    const data = new Float32Array(512 * 384 * 4)
    const bed = new Float32Array(data.length)
    for (let row = 0; row < 384; row++) for (let column = 0; column < 512; column++) {
      const index = (row * 512 + column) * 4
      data[index] = amount + Math.exp(-((column - 230) ** 2 + (row - 190) ** 2) / 3500) * 0.65
      data[index + 1] = 0.2
      bed[index] = baseline
    }
    return { ...art(amount), width: 512, height: 384, state: data.buffer, referenceState: bed.buffer }
  }
  const initial = productionArt(1.5, 1.8), snapshot = productionArt(2.2, 2.0)
  const idle: ArtStep = { dt: FIXED_STEP, contacts: [], wetness: 0.2, wind: 0.15, windAngle: 0.3, preserve: false }
  const palm: ArtStep = { ...idle, preserve: true, contacts: [{ tool: 'palm', from: { x: 110, y: 180 }, to: { x: 325, y: 196 }, velocity: { x: 200, y: 16 }, radius: 27, strength: 0.8, pressure: 0.9, angle: 0.5, aspect: 0.45 }] }
  const events: RecordingEvent[] = [
    { type: 'step', step: idle, repeat: 49 },
    { type: 'snapshot', art: snapshot },
    { type: 'look', settings: { light: 'sunset', wetness: 0.2, wind: 0.15 } },
    { type: 'step', step: palm, repeat: 5 },
    { type: 'step', step: idle, repeat: 73 },
  ]
  const expectedSolver = new ArtSolver(device, 'surface')
  await expectedSolver.initialize(); load(expectedSolver, initial)
  for (const event of events) {
    if (event.type === 'snapshot') load(expectedSolver, event.art)
    if (event.type === 'step') for (let repeat = 0; repeat < event.repeat; repeat++) {
      const encoder = device.createCommandEncoder()
      expectedSolver.encodeStep(encoder, event.step, 0); device.queue.submit([encoder.finish()])
    }
  }
  const expected = (await expectedSolver.readState()).buffer as ArrayBuffer
  const session = await ReplaySession.create(device, 'rgba8unorm', recording(initial, events))
  try {
    await session.seek(session.durationTicks)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, expected)
    bytesEqual(await reference(session.solver), snapshot.referenceState!)
    await session.seek(49)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, snapshot.state)
    bytesEqual(await reference(session.solver), snapshot.referenceState!)
    expect(session.look).toEqual({ light: 'sunset', wetness: 0.2, wind: 0.15 })
    await session.seek(0); await session.seek(49)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, snapshot.state)
    await session.advance(session.durationTicks - 49)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, expected)
    bytesEqual((await expectedSolver.readState()).buffer as ArrayBuffer, expected)
    expect(errors).toEqual([])
  } finally { session.destroy(); expectedSolver.destroy(); await device.queue.onSubmittedWorkDone() }
})

test('cleanup remains safe when the owning page destroys the device immediately', async () => {
  const adapter = await gpu.requestAdapter()
  if (!adapter) throw new Error('设备清理测试需要 WebGPU adapter。')
  const temporaryDevice = await adapter.requestDevice()
  const deviceErrors: string[] = []
  temporaryDevice.addEventListener('uncapturederror', event => deviceErrors.push(event.error.message))
  const session = await ReplaySession.create(temporaryDevice, 'rgba8unorm', recording(art(2), [{ type: 'step', step: step('palm'), repeat: 100 }]))
  const advance = session.advance(100).catch(error => error as Error)
  session.destroy(); temporaryDevice.destroy()
  expect((await advance)?.name).toBe('AbortError')
  await new Promise(resolve => setTimeout(resolve, 10))
  expect(deviceErrors).toEqual([])
})

test('airborne checkpoints restore grains and emitter randomness exactly before replaying all landed mass', async () => {
  const initial = art(0, 0)
  const stream: ArtStep = { dt: FIXED_STEP, wetness: 0, wind: 0.35, windAngle: 0.3, preserve: true, contacts: [{
    tool: 'pour', from: { x: 245, y: 225 }, to: { x: 265, y: 225 }, radius: 18, pressure: 0.85, strength: 0.7,
    velocity: { x: 35, y: 0 }, pour: { style: 'stream', height: 0.6, spread: 0.3 },
  }] }
  const handful: ArtStep = { ...stream, contacts: [{ ...stream.contacts[0], from: { x: 330, y: 225 }, to: { x: 330, y: 225 }, pour: { style: 'handful', height: 0.9, spread: 0.7, burst: 0.8 } }] }
  const idle: ArtStep = { ...stream, contacts: [] }
  const script = recording(initial, [
    { type: 'step', step: stream, repeat: 60 },
    { type: 'look', settings: { light: 'sunset', wetness: 0, wind: 0.35 } },
    { type: 'step', step: handful, repeat: 1 },
    { type: 'step', step: idle, repeat: 119 },
  ])
  const original = new ArtSolver(device, 'surface', width, height)
  await original.initialize(); load(original, initial)
  for (let tick = 0; tick < 60; tick++) {
    const encoder = device.createCommandEncoder()
    original.encodeStep(encoder, stream, 0); device.queue.submit([encoder.finish()])
  }
  const middle = await original.readState()
  const middleAir = original.airborne.snapshot()
  expect(middleAir.particles.length).toBeGreaterThan(100)
  for (let tick = 60; tick < 180; tick++) {
    const encoder = device.createCommandEncoder()
    original.encodeStep(encoder, tick === 60 ? handful : idle, 0); device.queue.submit([encoder.finish()])
  }
  const final = await original.readState()
  const finalAir = original.airborne.snapshot()
  expect(finalAir.particles).toEqual([])
  expect(final.some((value, index) => index % 4 === 0 && value > 0)).toBe(true)
  const session = await ReplaySession.create(device, 'rgba8unorm', script)
  try {
    await session.seek(180)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, final.buffer as ArrayBuffer)
    expect(session.solver.airborne.snapshot()).toEqual(finalAir)
    // Tick 60 is a GPU/CPU checkpoint with airborne sand, not a settled image.
    await session.seek(60)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, middle.buffer as ArrayBuffer)
    expect(session.solver.airborne.snapshot()).toEqual(middleAir)
    expect(session.look.light).toBe('sunset')
    // Mutating the active particle simulation must not mutate saved checkpoints.
    await session.advance(10)
    await session.seek(60)
    expect(session.solver.airborne.snapshot()).toEqual(middleAir)
    await session.advance(120)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, final.buffer as ArrayBuffer)
    expect(session.solver.airborne.snapshot()).toEqual(finalAir)
    await session.seek(0); await session.advance(60)
    expect(session.solver.airborne.snapshot()).toEqual(middleAir)
    bytesEqual((await original.readState()).buffer as ArrayBuffer, final.buffer as ArrayBuffer)
    expect(original.airborne.snapshot()).toEqual(finalAir)
    expect(errors).toEqual([])
  } finally { session.destroy(); original.destroy(); await device.queue.onSubmittedWorkDone() }
})

test('recorded snapshots clear live airborne sand and prevent delayed deposits after that boundary', async () => {
  const initial = art(0, 0), replacement = art(0.2, 0.3)
  const pour: ArtStep = { dt: FIXED_STEP, wetness: 0, wind: 0, windAngle: 0, contacts: [{ tool: 'pour',
    from: { x: 256, y: 225 }, to: { x: 256, y: 225 }, velocity: { x: 0, y: 0 }, radius: 16, pressure: 1, strength: 1,
    pour: { style: 'handful', height: 1, spread: 0.5, burst: 1 },
  }] }
  const session = await ReplaySession.create(device, 'rgba8unorm', recording(initial, [
    { type: 'step', step: pour, repeat: 1 },
    { type: 'snapshot', art: replacement },
    { type: 'step', step: { ...pour, contacts: [] }, repeat: 100 },
  ]))
  try {
    await session.seek(1)
    expect(session.solver.airborne.pending).toBe(false)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, replacement.state)
    bytesEqual(await reference(session.solver), replacement.referenceState!)
    await session.seek(101)
    expect(session.solver.airborne.pending).toBe(false)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, replacement.state)
    await session.seek(0); await session.seek(101)
    bytesEqual((await session.solver.readState()).buffer as ArrayBuffer, replacement.state)
    expect(errors).toEqual([])
  } finally { session.destroy(); await device.queue.onSubmittedWorkDone() }
})
