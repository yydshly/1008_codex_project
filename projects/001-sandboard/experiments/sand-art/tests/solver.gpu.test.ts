import { afterAll, beforeAll, expect, test } from 'vitest'
import { create, globals } from 'webgpu'
import { FIXED_STEP, type ArtContact, type ArtMode, type ArtStep, type ArtTool } from '../src/model'
import { ArtSolver } from '../src/solver'
import { naturalFlowAt } from '../src/airborne'
import { ReplaySession } from '../src/replay'
import type { Recording, RecordingEvent } from '../src/recording'
import { artSolverShader } from '../src/solver-shaders'
import { extendStroke, type StrokeAnchor } from '../src/input'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'

let device: GPUDevice
let gpu: GPU
const errors: string[] = []

beforeAll(async () => {
  Object.assign(globalThis, globals)
  gpu = create([])
  const adapter = await gpu.requestAdapter()
  if (!adapter) throw new Error('沙画硬件测试需要可用的 WebGPU adapter')
  expect(adapter.info.isFallbackAdapter, 'GPU 测试应使用硬件 adapter').toBe(false)
  device = await adapter.requestDevice()
  device.addEventListener('uncapturederror', (event) => errors.push(event.error.message))
})
afterAll(() => device?.destroy())

function volume(state: Float32Array) {
  let value = 0
  for (let index = 0; index < state.length; index += 4) value += state[index]
  return value
}
function centroid(state: Float32Array, width: number) {
  let weighted = 0
  for (let index = 0; index < state.length; index += 4) weighted += (index / 4 % width) * state[index]
  return weighted / volume(state)
}
function contact(tool: ArtTool, overrides: Partial<ArtContact> = {}): ArtContact {
  return {
    from: { x: 140, y: 190 }, to: { x: 370, y: 190 },
    velocity: { x: 250, y: 0 }, radius: 65, pressure: 1, strength: 1, tool,
    ...overrides,
  }
}
function step(solver: ArtSolver, contacts: ArtContact[], count = 1, options: Partial<ArtStep> = {}) {
  for (let index = 0; index < count; index++) {
    const encoder = device.createCommandEncoder()
    solver.encodeStep(encoder, { dt: FIXED_STEP, contacts, wetness: 0, wind: 0, windAngle: 0, ...options }, 0)
    device.queue.submit([encoder.finish()])
  }
}
function expectConserved(initial: Float32Array, current: Float32Array) {
  expect(Math.abs(volume(current) / volume(initial) - 1)).toBeLessThan(0.00001)
  for (let index = 0; index < current.length; index += 4) {
    expect(current[index]).toBeGreaterThanOrEqual(0)
    for (let channel = 0; channel < 4; channel++) expect(Number.isFinite(current[index + channel])).toBe(true)
  }
}

test.each(['surface', 'lightbox'] as ArtMode[])('%s hand pouring stays airborne before landing and deposits its full mass once', async (mode) => {
  const solver = new ArtSolver(device, mode, 64, 48)
  await solver.initialize()
  try {
    const empty = device.createCommandEncoder(); solver.reset(empty, 'empty'); device.queue.submit([empty.finish()])
    const pouring = contact('pour', { from: { x: 256, y: 192 }, to: { x: 256, y: 192 }, velocity: { x: 0, y: 0 }, radius: 16, strength: 0.7, pressure: 0.8, pour: { style: 'handful', height: 0.5, spread: 0.5, burst: 1 } })
    step(solver, [pouring], 1, { preserve: true })
    expect(volume(await solver.readState())).toBe(0)
    expect(solver.airborne.pending).toBe(true)
    const emitted = solver.airborne.emittedMass
    expect(emitted).toBeCloseTo(840, 8)
    step(solver, [], 20, { preserve: true })
    expect(volume(await solver.readState())).toBe(0)
    step(solver, [], 65, { preserve: true })
    const landed = await solver.readState()
    expect(solver.airborne.pending).toBe(false)
    expect(volume(landed) / emitted).toBeCloseTo(1, 6)
    for (let index = 0; index < landed.length; index += 4) expect(landed[index]).toBeGreaterThanOrEqual(0)
    step(solver, [], 8, { preserve: true })
    expect(volume(await solver.readState())).toBeCloseTo(volume(landed), 6)
    step(solver, [pouring], 1)
    const reset = device.createCommandEncoder(); solver.reset(reset, 'empty'); device.queue.submit([reset.finish()])
    expect(solver.airborne.pending).toBe(false)
    expect(solver.airborne.emittedMass).toBe(0)
    step(solver, [], 80, { preserve: true })
    expect(volume(await solver.readState())).toBe(0)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('a short default-strength scatter leaves perceptible broad coverage after flight on the full-size lightbox', async () => {
  const solver = new ArtSolver(device, 'lightbox')
  await solver.initialize()
  try {
    const empty = device.createCommandEncoder(); solver.reset(empty, 'empty'); device.queue.submit([empty.finish()])
    step(solver, [contact('pour', { from: { x: 256, y: 192 }, to: { x: 256, y: 192 }, velocity: { x: 0, y: 0 }, radius: 16, pressure: 0.8, strength: 0.7, pour: { style: 'scatter', height: 0.5, spread: 0.55 } })], 18, { preserve: true })
    expect(volume(await solver.readState())).toBe(0)
    const emitted = solver.airborne.emittedMass
    step(solver, [], 80, { preserve: true })
    const state = await solver.readState()
    let covered = 0, peak = 0
    for (let index = 0; index < state.length; index += 4) { if (state[index] > 0.1) covered++; peak = Math.max(peak, state[index]) }
    expect(emitted).toBeCloseTo(252, 7)
    expect(volume(state) / emitted).toBeCloseTo(1, 6)
    expect(covered).toBeGreaterThan(250)
    expect(peak).toBeGreaterThan(0.5)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('four batched airborne landing grids remain distinct with three conservative contact iterations', async () => {
  const solver = new ArtSolver(device, 'lightbox', 64, 48)
  await solver.initialize()
  try {
    const empty = device.createCommandEncoder(); solver.reset(empty, 'empty'); device.queue.submit([empty.finish()])
    const snapshot = solver.airborne.snapshot()
    const masses = [2, 3, 5, 7]
    snapshot.particles = [0.001, 0.05, 0.17, 0.3].map((z, index) => ({ x: 84 + index * 80, y: 100, z, vx: 0, vy: 0, vz: 0, mass: masses[index], seed: 0.4 }))
    snapshot.emittedMass = 17
    solver.airborne.restore(snapshot)
    const encoder = device.createCommandEncoder()
    for (let slot = 0; slot < 4; slot++) solver.encodeStep(encoder, { dt: FIXED_STEP, contacts: [contact('push', { from: { x: 500, y: 370 }, to: { x: 500, y: 370 }, radius: 8 })], wetness: 0, wind: 0, windAngle: 0, preserve: true }, slot)
    device.queue.submit([encoder.finish()])
    const state = await solver.readState()
    expect(volume(state)).toBeCloseTo(17, 5)
    // Landing locally relaxes a pile even when idle patterns are preserved.
    // Measure each separated deposit's neighborhood, not just its center cell.
    const deposited = [0, 0, 0, 0]
    for (let index = 0; index < state.length; index += 4) deposited[clampRegion(index / 4 % 64)] += state[index]
    masses.forEach((mass, index) => expect(deposited[index]).toBeCloseTo(mass, 5))
    expect(solver.airborne.pending).toBe(false)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

function clampRegion(x: number) { return x < 15 ? 0 : x < 25 ? 1 : x < 35 ? 2 : 3 }

test('natural subcell landings conserve all four slot masses even with three brush iterations', async () => {
  const solver = new ArtSolver(device, 'lightbox', 64, 48)
  await solver.initialize()
  try {
    const empty = device.createCommandEncoder(); solver.reset(empty, 'empty'); device.queue.submit([empty.finish()])
    const snapshot = solver.airborne.snapshot(), masses = [2, 3, 5, 7]
    snapshot.particles = [0.001, 0.05, 0.17, 0.3].map((z, index) => ({ x: 84 + index * 80, y: 100, z, vx: 0, vy: 0, vz: 0, mass: masses[index], seed: 0.4, natural: true }))
    snapshot.emittedMass = 17
    solver.airborne.restore(snapshot)
    const encoder = device.createCommandEncoder()
    for (let slot = 0; slot < 4; slot++) solver.encodeStep(encoder, { dt: FIXED_STEP, contacts: [contact('push', { from: { x: 500, y: 370 }, to: { x: 500, y: 370 }, radius: 8 })], wetness: 0, wind: 0, windAngle: 0, preserve: true }, slot)
    device.queue.submit([encoder.finish()])
    const state = await solver.readState(), deposited = [0, 0, 0, 0]
    for (let index = 0; index < state.length; index += 4) { expect(state[index]).toBeGreaterThanOrEqual(0); deposited[clampRegion(index / 4 % 64)] += state[index] }
    masses.forEach((mass, index) => expect(deposited[index]).toBeCloseTo(mass, 5))
    expect(volume(state)).toBeCloseTo(17, 5)
    expect(solver.airborne.pending).toBe(false)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('recorded natural flow and different handfuls replay exactly after seeking backward through a flying checkpoint', async () => {
  const live = new ArtSolver(device, 'lightbox', 64, 48)
  await live.initialize()
  const initial = await live.readState()
  const events: RecordingEvent[] = []
  let session: ReplaySession | undefined
  try {
    for (let tick = 0; tick < 120; tick++) {
      const contacts: ArtContact[] = []
      if (tick < 30) contacts.push(contact('pour', { from: { x: 220, y: 220 }, to: { x: 260, y: 220 }, radius: 24, pour: { style: 'scatter', height: 1, spread: 0.7, natural: true, flow: naturalFlowAt(live.airborne.elapsedTime, 'scatter', 260, 220) } }))
      if (tick === 8 || tick === 36) contacts.push(contact('pour', { from: { x: 360, y: 160 }, to: { x: 360, y: 160 }, velocity: { x: 0, y: 0 }, radius: 24, pour: { style: 'handful', height: 0.6, spread: 0.7, burst: 0.6, natural: true, flow: 1 } }))
      // Include a conservative tool so landing also exercises dt/3 integration.
      if (tick >= 55 && tick < 80) contacts.push(contact('push', { from: { x: 240, y: 220 }, to: { x: 245, y: 220 }, radius: 12 }))
      const input: ArtStep = { dt: FIXED_STEP, contacts, wetness: 0.2, wind: 0, windAngle: 0.2, preserve: true }
      events.push({ type: 'step', step: input, repeat: 1 })
      const encoder = device.createCommandEncoder(); live.encodeStep(encoder, input, 0); device.queue.submit([encoder.finish()])
    }
    const expected = await live.readState(), emitted = live.airborne.emittedMass
    expect(live.airborne.pending).toBe(false)
    expect(Math.abs(volume(expected) - volume(initial) - emitted)).toBeLessThan(0.002)
    const recording: Recording = {
      format: 'sandboard-sand-recording', version: 1, title: '自然流沙物理回归', createdAt: '2026-10-08T12:00:00.000Z', ticks: 120, events,
      initial: { version: 1, mode: 'lightbox', width: 64, height: 48, state: initial.buffer as ArrayBuffer, referenceState: initial.slice().buffer, savedAt: '2026-10-08T12:00:00.000Z', settings: { tool: 'pour', radius: 24, strength: 1, wetness: 0.2, wind: 0, light: 'noon' } },
    }
    session = await ReplaySession.create(device, 'rgba8unorm', recording)
    await session.seek(120)
    expect(Array.from(await session.solver.readState())).toEqual(Array.from(expected))
    expect(session.solver.airborne.snapshot()).toEqual(live.airborne.snapshot())
    await session.seek(40)
    expect(session.solver.airborne.pending).toBe(true)
    expect(session.solver.airborne.elapsedTime).toBeCloseTo(40 * FIXED_STEP, 12)
    await session.seek(120)
    expect(Array.from(await session.solver.readState())).toEqual(Array.from(expected))
    expect(session.solver.airborne.snapshot()).toEqual(live.airborne.snapshot())
    expect(errors).toEqual([])
  } finally { session?.destroy(); live.destroy(); await device.queue.onSubmittedWorkDone() }
})

test('legacy pouring still deposits immediately when sharing a step with configured airborne pouring', async () => {
  const legacy = new ArtSolver(device, 'lightbox', 64, 48)
  const mixed = new ArtSolver(device, 'lightbox', 64, 48)
  await Promise.all([legacy.initialize(), mixed.initialize()])
  try {
    const direct = contact('pour', { from: { x: 128, y: 192 }, to: { x: 128, y: 192 }, radius: 24 })
    const airborne = contact('pour', { from: { x: 380, y: 192 }, to: { x: 380, y: 192 }, radius: 24, pour: { style: 'stream', height: 0.5, spread: 0.3 } })
    step(legacy, [direct], 1, { preserve: true }); step(mixed, [direct, airborne], 1, { preserve: true })
    expect(Array.from(await mixed.readState())).toEqual(Array.from(await legacy.readState()))
    expect(mixed.airborne.pending).toBe(true)
    mixed.loadState(new Float32Array(mixed.width * mixed.height * 4))
    expect(mixed.airborne.pending).toBe(false)
    step(mixed, [], 80, { preserve: true })
    expect(volume(await mixed.readState())).toBe(0)
    expect(errors).toEqual([])
  } finally { legacy.destroy(); mixed.destroy() }
})

test('the actual sand-art WGSL compiles on a hardware GPU', async () => {
  const module = device.createShaderModule({ code: artSolverShader })
  const compilation = await module.getCompilationInfo()
  expect(compilation.messages.filter((message) => message.type === 'error')).toEqual([])
})

test.each(['surface', 'lightbox'] as ArtMode[])('%s initializes its own thickness and can reset to exactly empty', async (mode) => {
  // Non-workgroup-multiple dimensions also exercise rectangular bounds checks.
  const solver = new ArtSolver(device, mode, 33, 25)
  await solver.initialize()
  try {
    const initial = await solver.readState()
    const height = mode === 'surface' ? 2 : 0.24
    for (let index = 0; index < initial.length; index += 4) expect(initial[index]).toBeCloseTo(height, 6)
    step(solver, [contact('push')], 3)
    const encoder = device.createCommandEncoder()
    solver.reset(encoder, 'empty')
    device.queue.submit([encoder.finish()])
    expect(Array.from(await solver.readState())).toEqual(Array.from(new Float32Array(33 * 25 * 4)))
    step(solver, [], 4, { wind: 1 })
    expect(volume(await solver.readState())).toBe(0)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test.each(['push', 'scrape', 'rake', 'stamp'] as ArtTool[])('%s moves sand conservatively, cuts a groove and deposits a bank', async (tool) => {
  const solver = new ArtSolver(device, 'lightbox', 64, 48)
  await solver.initialize()
  try {
    const initial = await solver.readState()
    step(solver, [contact(tool)], 35)
    const current = await solver.readState()
    expectConserved(initial, current)
    let minimum = Infinity
    let maximum = 0
    for (let index = 0; index < current.length; index += 4) {
      minimum = Math.min(minimum, current[index])
      maximum = Math.max(maximum, current[index])
    }
    expect(minimum).toBeLessThan(0.13)
    expect(maximum).toBeGreaterThan(0.3)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test.each([
  { mode: 'lightbox', tool: 'push', maximumCenter: 0.10 },
  { mode: 'lightbox', tool: 'scrape', maximumCenter: 0.10 },
  { mode: 'lightbox', tool: 'rake', maximumCenter: 0.08 },
  { mode: 'surface', tool: 'push', maximumCenter: 1.75 },
  { mode: 'surface', tool: 'scrape', maximumCenter: 1.60 },
  { mode: 'surface', tool: 'rake', maximumCenter: 1.70 },
] as const)('a single fast $tool segment with default UI strength is visible in $mode', async ({ mode, tool, maximumCenter }) => {
  // A short coalesced pointer sample may touch a cell for only one 120 Hz step,
  // unlike repeated stationary test strokes.
  const solver = new ArtSolver(device, mode)
  await solver.initialize()
  try {
    const initial = await solver.readState()
    step(solver, [contact(tool, {
      from: { x: 180, y: 192 }, to: { x: 186, y: 192 }, velocity: { x: 1000, y: 0 },
      radius: 14, pressure: 0.8, strength: 0.55,
    })])
    const current = await solver.readState()
    expect(current[(192 * 512 + 183) * 4]).toBeLessThan(maximumCenter)
    expect(Math.abs(volume(current) / volume(initial) - 1)).toBeLessThan(0.00001)
    expect(current.every(Number.isFinite)).toBe(true)
    let minimum = Infinity
    for (let index = 0; index < current.length; index += 4) minimum = Math.min(minimum, current[index])
    expect(minimum).toBeGreaterThanOrEqual(0)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('an anchored real-sample stroke has connected width and continuous side banks', async () => {
  const solver = new ArtSolver(device, 'lightbox')
  await solver.initialize()
  try {
    const initial = new Float32Array(512 * 384 * 4)
    for (let index = 0; index < initial.length; index += 4) initial[index] = 0.7
    solver.loadState(initial)
    const anchor: StrokeAnchor = { origin: { x: 100, y: 192 }, direction: null }
    let previous = { ...anchor.origin }
    // Sparse real pointer samples plus a stationary second 120 Hz step mimic
    // a 60 Hz gesture. Testing only the centerline misses circular endpoint dams.
    for (let x = 126; x <= 386; x += 26) {
      const current = { x, y: 192 }
      const from = extendStroke(anchor, previous, current, 16)
      step(solver, [contact('scrape', {
        from, to: current, velocity: { x: 1000, y: 0 }, radius: 16, pressure: 0.8, strength: 0.7,
      })], 1, { preserve: true })
      step(solver, [contact('scrape', {
        from: anchor.origin, to: current, velocity: { x: 0, y: 0 }, radius: 16, pressure: 0.8, strength: 0.7,
      })], 1, { preserve: true })
      previous = current
    }
    const current = await solver.readState()
    const widths: number[] = []
    const ridges: number[] = []
    for (let x = 145; x < 350; x++) {
      let top = 192
      let bottom = 192
      while (top >= 166 && current[(top * 512 + x) * 4] < 0.24) top--
      while (bottom <= 218 && current[(bottom * 512 + x) * 4] < 0.24) bottom++
      widths.push(bottom - top - 1)
      let ridge = 0
      for (let y = 166; y <= 218; y++) {
        if (Math.abs(y - 192) >= 12) ridge = Math.max(ridge, current[(y * 512 + x) * 4])
      }
      ridges.push(ridge)
    }
    // Every full cross section has a connected bright channel. Isolated round
    // endpoint impressions produce zero-width necks and oscillating banks. The
    // most recently drawn portion may still taper before reaching full depth.
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(10)
    expect(Math.max(...widths)).toBeLessThanOrEqual(24)
    expect(Math.max(...widths) / Math.min(...widths)).toBeLessThan(2.5)
    expect(Math.max(...ridges) - Math.min(...ridges)).toBeLessThan(0.02)
    expect(Math.abs(volume(current) / volume(initial) - 1)).toBeLessThan(0.00001)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('a fast default lightbox line remains bright after the next render step and settling', async () => {
  const solver = new ArtSolver(device, 'lightbox')
  await solver.initialize()
  try {
    const initial = await solver.readState()
    step(solver, [contact('scrape', {
      from: { x: 180, y: 192 }, to: { x: 186, y: 192 }, velocity: { x: 1000, y: 0 },
      radius: 14, pressure: 0.8, strength: 0.55,
    })])
    // A 60 Hz display commonly encodes two 120 Hz steps before first rendering.
    step(solver, [])
    expect((await solver.readState())[(192 * 512 + 183) * 4]).toBeLessThan(0.10)
    step(solver, [], 119)
    const settled = await solver.readState()
    expect(settled[(192 * 512 + 183) * 4]).toBeLessThan(0.14)
    expect(Math.abs(volume(settled) / volume(initial) - 1)).toBeLessThan(0.00001)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('one second of stamping clears the heart lobes and tip while preserving its notch', async () => {
  const solver = new ArtSolver(device, 'lightbox')
  await solver.initialize()
  try {
    const initial = await solver.readState()
    step(solver, [contact('stamp', {
      from: { x: 256, y: 192 }, to: { x: 256, y: 192 }, velocity: { x: 0, y: 0 },
      radius: 25, pressure: 0.8, strength: 1,
    })], 120)
    const current = await solver.readState()
    expect(current[(167 * 512 + 243) * 4]).toBeLessThan(0.05)
    expect(current[(167 * 512 + 268) * 4]).toBeLessThan(0.05)
    expect(current[(208 * 512 + 256) * 4]).toBeLessThan(0.05)
    expect(current[(167 * 512 + 256) * 4]).toBeGreaterThan(0.24)
    let inside = 0
    let insideClear = 0
    let outsideClear = 0
    for (let y = 158; y < 223; y++) {
      for (let x = 222; x < 290; x++) {
        const qx = (x + 0.5 - 256) / 25
        const qy = -(y + 0.5 - 192) / 25
        const a = qx * qx + qy * qy - 0.72
        const isInside = a * a * a - qx * qx * qy * qy * qy < 0
        if (isInside) {
          inside++
          if (current[(y * 512 + x) * 4] < 0.12) insideClear++
        } else if (current[(y * 512 + x) * 4] < 0.12) outsideClear++
      }
    }
    // A circular bright patch fails the upper-lobe/notch checks and footprint
    // coverage. The result is produced solely through conserved sand flux.
    // The limited ridge receiver keeps a softer border instead of concentrating
    // evacuated sand into the narrow notch. Most of the full heart remains clear.
    expect(insideClear / inside).toBeGreaterThan(0.80)
    expect(outsideClear).toBe(0)
    expect(Math.abs(volume(current) / volume(initial) - 1)).toBeLessThan(0.00001)
    expect(current.every(Number.isFinite)).toBe(true)
    let highest = 0
    for (let index = 0; index < current.length; index += 4) highest = Math.max(highest, current[index])
    expect(highest).toBeLessThanOrEqual(0.801)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('the rake leaves separated tooth traces instead of one broad groove', async () => {
  const solver = new ArtSolver(device, 'lightbox', 64, 48)
  await solver.initialize()
  try {
    step(solver, [contact('rake')], 12)
    const state = await solver.readState()
    // The center tooth lies at y=190, the next one at y=216. Grid cell
    // centers y=188 and y=204 sample a tooth and the gap between teeth.
    expect(state[(23 * 64 + 32) * 4]).toBeLessThan(0.13)
    expect(state[(25 * 64 + 32) * 4]).toBeGreaterThan(0.22)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test.each([[0, 0], [16, 12], [31, 23]])('the shared limiter conserves an extreme pile at (%s,%s)', async (x, y) => {
  const solver = new ArtSolver(device, 'surface', 32, 24)
  await solver.initialize()
  try {
    const initial = new Float32Array(32 * 24 * 4)
    initial[(y * 32 + x) * 4] = 100
    device.queue.writeBuffer(solver.state, 0, initial)
    step(solver, [], 1, { dt: 1 / 30, wind: 1 })
    const moved = await solver.readState()
    const dx = x === 31 ? -1 : 1
    const dy = y === 23 ? -1 : 1
    expect(moved[((y + dy) * 32 + x + dx) * 4]).toBeGreaterThan(1)
    expectConserved(initial, moved)
    step(solver, [], 40, { wind: 1 })
    expectConserved(initial, await solver.readState())
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('stationary pouring adds external sand proportionally to elapsed time', async () => {
  const oneStep = new ArtSolver(device, 'lightbox', 32, 24)
  const twoSteps = new ArtSolver(device, 'lightbox', 32, 24)
  await Promise.all([oneStep.initialize(), twoSteps.initialize()])
  try {
    const pour = contact('pour', { from: { x: 256, y: 192 }, to: { x: 256, y: 192 }, velocity: { x: 0, y: 0 }, radius: 75 })
    const initial = volume(await oneStep.readState())
    step(oneStep, [pour], 1, { dt: 1 / 60 })
    step(twoSteps, [pour], 2)
    const one = volume(await oneStep.readState()) - initial
    const two = volume(await twoSteps.readState()) - initial
    expect(one).toBeGreaterThan(0.1)
    expect(Math.abs(one - two)).toBeLessThan(0.00003)
    expect(errors).toEqual([])
  } finally { oneStep.destroy(); twoSteps.destroy() }
})

test.each(['surface', 'lightbox'] as ArtMode[])('a 0.15 second default pour leaves visible coverage in %s', async (mode) => {
  const solver = new ArtSolver(device, mode)
  await solver.initialize()
  try {
    const initial = await solver.readState()
    step(solver, [contact('pour', {
      from: { x: 256, y: 192 }, to: { x: 256, y: 192 }, velocity: { x: 0, y: 0 },
      radius: 14, pressure: 0.8, strength: 0.55,
    })], 18, { preserve: true })
    const current = await solver.readState()
    const gain = current[(192 * 512 + 256) * 4] - initial[(192 * 512 + 256) * 4]
    expect(gain).toBeGreaterThan(mode === 'lightbox' ? 0.65 : 1.25)
    expect(current[(192 * 512 + 264) * 4] - initial[(192 * 512 + 264) * 4]).toBeGreaterThan(mode === 'lightbox' ? 0.20 : 0.40)
    expect(volume(current)).toBeGreaterThan(volume(initial))
    expect(current[(192 * 512 + 280) * 4]).toBe(initial[(192 * 512 + 280) * 4])
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('one long moving pour covers the whole swept path instead of isolated end dots', async () => {
  const solver = new ArtSolver(device, 'lightbox')
  await solver.initialize()
  try {
    const initial = await solver.readState()
    step(solver, [contact('pour', {
      from: { x: 100, y: 192 }, to: { x: 400, y: 192 }, velocity: { x: 1200, y: 0 },
      radius: 14, pressure: 0.8, strength: 0.55,
    })], 1, { preserve: true })
    const current = await solver.readState()
    const gains = [130, 180, 230, 280, 330, 370].map((x) => current[(192 * 512 + x) * 4] - initial[(192 * 512 + x) * 4])
    for (const gain of gains) expect(gain).toBeGreaterThan(0.04)
    expect(Math.max(...gains) - Math.min(...gains)).toBeLessThan(0.001)
    expect(volume(current)).toBeGreaterThan(volume(initial))
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('a complete diagonal scrape segment has a smooth connected centerline', async () => {
  const solver = new ArtSolver(device, 'lightbox')
  await solver.initialize()
  try {
    const initial = await solver.readState()
    step(solver, [contact('scrape', {
      from: { x: 100, y: 110 }, to: { x: 400, y: 260 }, velocity: { x: 1200, y: 600 },
      radius: 14, pressure: 0.8, strength: 0.55,
    })], 1, { preserve: true })
    const current = await solver.readState()
    const samples = [130, 180, 230, 280, 330, 370].map((x) => current[(Math.round(110 + (x - 100) * 0.5) * 512 + x) * 4])
    for (const value of samples) expect(value).toBeLessThan(0.12)
    expect(Math.max(...samples) - Math.min(...samples)).toBeLessThan(0.015)
    expect(Math.abs(volume(current) / volume(initial) - 1)).toBeLessThan(0.00001)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test.each([
  { thickness: 0.7, pattern: 'long' }, { thickness: 0.7, pattern: 'sequential' }, { thickness: 0.7, pattern: 'batched8' },
  { thickness: 1.1, pattern: 'long' }, { thickness: 1.1, pattern: 'sequential' }, { thickness: 1.1, pattern: 'batched8' },
])('default scraping stays continuous on thickness $thickness with $pattern input', async ({ thickness, pattern }) => {
  const solver = new ArtSolver(device, 'lightbox')
  await solver.initialize()
  try {
    const initial = new Float32Array(512 * 384 * 4)
    for (let index = 0; index < initial.length; index += 4) initial[index] = thickness
    solver.loadState(initial)
    const segment = (from: number, to: number) => contact('scrape', {
      from: { x: from, y: 192 }, to: { x: to, y: 192 }, velocity: { x: 1000, y: 0 },
      radius: 14, pressure: 0.8, strength: 0.55,
    })
    if (pattern === 'long') step(solver, [segment(100, 400)], 1, { preserve: true })
    else if (pattern === 'sequential') {
      for (let x = 100; x < 400; x += 10) step(solver, [segment(x, x + 10)], 1, { preserve: true })
    } else {
      for (let x = 100; x < 400; x += 80) {
        const contacts = Array.from({ length: Math.min(8, (400 - x) / 10) }, (_, index) => segment(x + index * 10, x + (index + 1) * 10))
        step(solver, contacts, 1, { preserve: true })
      }
    }
    const current = await solver.readState()
    // Include queue-batch boundaries and segment midpoints. Every point of the
    // centerline must be visibly clear, not just repeatedly pressed endpoints.
    const samples = [130, 180, 230, 280, 330, 370].map((x) => current[(192 * 512 + x) * 4])
    for (const value of samples) expect(value).toBeLessThan(0.12)
    if (pattern !== 'batched8') expect(Math.max(...samples) - Math.min(...samples)).toBeLessThan(0.01)
    expect(Math.abs(volume(current) / volume(initial) - 1)).toBeLessThan(0.00001)
    expect(current.every(Number.isFinite)).toBe(true)
    let minimum = Infinity
    let maximum = 0
    for (let index = 0; index < current.length; index += 4) {
      minimum = Math.min(minimum, current[index])
      maximum = Math.max(maximum, current[index])
    }
    expect(minimum).toBeGreaterThanOrEqual(0)
    expect(maximum).toBeLessThanOrEqual(thickness + Math.max(0.56, thickness * 1.2) + 0.001)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('preserve keeps a sharp imported pattern unchanged while idle', async () => {
  const solver = new ArtSolver(device, 'lightbox', 32, 24)
  await solver.initialize()
  try {
    const pattern = new Float32Array(32 * 24 * 4)
    for (let row = 0; row < 24; row++) {
      for (let column = 0; column < 32; column++) pattern[(row * 32 + column) * 4] = (column + row) % 2 ? 0.05 : 0.70
    }
    device.queue.writeBuffer(solver.state, 0, pattern)
    step(solver, [], 120, { preserve: true })
    expect(Array.from(await solver.readState())).toEqual(Array.from(pattern))
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('preserve still allows pouring, sculpting and wind', async () => {
  const solver = new ArtSolver(device, 'lightbox', 64, 48)
  await solver.initialize()
  try {
    const initial = await solver.readState()
    step(solver, [contact('scrape')], 8, { preserve: true })
    const cut = await solver.readState()
    expectConserved(initial, cut)
    expect(cut[(23 * 64 + 32) * 4]).toBeLessThan(0.12)
    step(solver, [contact('pour')], 8, { preserve: true })
    const poured = await solver.readState()
    expect(volume(poured)).toBeGreaterThan(volume(cut) + 5)
    step(solver, [], 60, { preserve: true, wind: 1 })
    const blown = await solver.readState()
    expectConserved(poured, blown)
    expect(centroid(blown, 64)).toBeGreaterThan(centroid(poured, 64) + 0.5)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('the smooth brush flattens a local pile without excavating or changing its mass', async () => {
  const solver = new ArtSolver(device, 'surface', 64, 48)
  await solver.initialize()
  try {
    const initial = new Float32Array(64 * 48 * 4)
    for (let index = 0; index < initial.length; index += 4) initial[index] = 1
    const center = (24 * 64 + 32) * 4
    initial[center] = 3
    device.queue.writeBuffer(solver.state, 0, initial)
    step(solver, [contact('smooth', {
      from: { x: 256, y: 192 }, to: { x: 256, y: 192 }, velocity: { x: 0, y: 0 },
      radius: 45, pressure: 0.8, strength: 0.55,
    })], 30, { preserve: true })
    const smoothed = await solver.readState()
    expectConserved(initial, smoothed)
    expect(smoothed[center]).toBeLessThan(1.25)
    expect(smoothed[center + 4]).toBeGreaterThan(1.01)
    for (let index = 0; index < smoothed.length; index += 4) expect(smoothed[index]).toBeGreaterThanOrEqual(0.999)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('wind moves a pile downwind while conserving it at closed grid boundaries', async () => {
  const calm = new ArtSolver(device, 'lightbox', 32, 24)
  const windy = new ArtSolver(device, 'lightbox', 32, 24)
  await Promise.all([calm.initialize(), windy.initialize()])
  try {
    const initial = new Float32Array(32 * 24 * 4)
    // A low pile below repose isolates wind from gravity-driven relaxation.
    for (let row = 9; row < 15; row++) {
      for (let column = 10; column < 16; column++) initial[(row * 32 + column) * 4] = 0.08
    }
    device.queue.writeBuffer(calm.state, 0, initial)
    device.queue.writeBuffer(windy.state, 0, initial)
    step(calm, [], 300)
    step(windy, [], 300, { wind: 1, windAngle: 0 })
    const still = await calm.readState()
    const blown = await windy.readState()
    expectConserved(initial, still)
    expectConserved(initial, blown)
    expect(centroid(blown, 32)).toBeGreaterThan(centroid(still, 32) + 1)
    expect(errors).toEqual([])
  } finally { calm.destroy(); windy.destroy() }
})

test('wet sand resists the same contact more than dry sand', async () => {
  const dry = new ArtSolver(device, 'surface', 32, 24)
  const wet = new ArtSolver(device, 'surface', 32, 24)
  await Promise.all([dry.initialize(), wet.initialize()])
  try {
    const initial = await dry.readState()
    step(dry, [contact('push')], 4)
    step(wet, [contact('push')], 4, { wetness: 1 })
    const dryState = await dry.readState()
    const wetState = await wet.readState()
    expectConserved(initial, dryState)
    expectConserved(initial, wetState)
    const lowest = (state: Float32Array) => Math.min(...Array.from(state).filter((_, index) => index % 4 === 0))
    expect(lowest(dryState)).toBeLessThan(lowest(wetState) - 0.05)
    expect(errors).toEqual([])
  } finally { dry.destroy(); wet.destroy() }
})

test('four distinct uniforms preserve contact input across a batched command submission', async () => {
  const batched = new ArtSolver(device, 'lightbox', 32, 24)
  const sequential = new ArtSolver(device, 'lightbox', 32, 24)
  await Promise.all([batched.initialize(), sequential.initialize()])
  try {
    const inputs = [100, 200, 300, 400].map((x) => ({
      dt: FIXED_STEP, wetness: 0, wind: 0, windAngle: 0,
      contacts: [contact('pour', { from: { x, y: 192 }, to: { x, y: 192 }, radius: 45 })],
    }))
    const encoder = device.createCommandEncoder()
    inputs.forEach((input, slot) => batched.encodeStep(encoder, input, slot))
    device.queue.submit([encoder.finish()])
    for (const input of inputs) step(sequential, input.contacts, 1, input)
    const one = await batched.readState()
    const two = await sequential.readState()
    expect(Array.from(one)).toEqual(Array.from(two))
    expect(errors).toEqual([])
  } finally { batched.destroy(); sequential.destroy() }
})

test.each([
  { mode: 'lightbox' as const, thickness: 1.1, angle: 0 },
  { mode: 'lightbox' as const, thickness: 1.1, angle: Math.PI / 2 },
  { mode: 'surface' as const, thickness: 2.55, angle: 0 },
  { mode: 'surface' as const, thickness: 2.55, angle: Math.PI / 2 },
])('a rotated palm makes a connected wide channel on a thick $mode bed at $angle', async ({ mode, thickness, angle }) => {
  const solver = new ArtSolver(device, mode)
  await solver.initialize()
  try {
    const initial = new Float32Array(512 * 384 * 4)
    for (let index = 0; index < initial.length; index += 4) initial[index] = thickness
    solver.loadState(initial)
    // Sparse growing segments follow a real straight gesture. The wide major
    // axis crosses the path at PI/2; rotating it to zero makes the channel
    // narrower, while keeping the same sand and the same tool strength.
    for (let x = 164; x <= 372; x += 26) {
      step(solver, [contact('palm', {
        from: { x: 138, y: 192 }, to: { x, y: 192 }, velocity: { x: 1000, y: 0 },
        radius: 42, pressure: 0.8, strength: 0.55, angle, aspect: 0.45,
      })], 2, { preserve: true })
    }
    // A deliberate palm gesture keeps the completed sweep in contact for a
    // further 50 ms. Sand must reach the capacity-limited banks before lifting.
    step(solver, [contact('palm', {
      from: { x: 138, y: 192 }, to: { x: 372, y: 192 }, velocity: { x: 0, y: 0 },
      radius: 42, pressure: 0.8, strength: 0.55, angle, aspect: 0.45,
    })], 6, { preserve: true })
    const current = await solver.readState()
    const threshold = mode === 'lightbox' ? 0.18 : thickness - 0.35
    const widths: number[] = []
    const banks: number[] = []
    for (let x = 194; x < 310; x++) {
      let top = 192
      let bottom = 192
      while (top >= 138 && current[(top * 512 + x) * 4] < threshold) top--
      while (bottom <= 246 && current[(bottom * 512 + x) * 4] < threshold) bottom++
      widths.push(bottom - top - 1)
      let bank = 0
      for (let y = 138; y <= 246; y++) {
        if (Math.abs(y - 192) >= 12) bank = Math.max(bank, current[(y * 512 + x) * 4])
      }
      banks.push(bank)
    }
    // A centerline-only assertion misses round endpoint dams and narrowing
    // between samples. Every full transverse section must stay connected.
    const minimumWidth = angle === 0 ? 12 : 30
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(minimumWidth)
    expect(Math.max(...widths) / Math.min(...widths)).toBeLessThan(1.6)
    expect(Math.max(...banks) - Math.min(...banks)).toBeLessThan(0.05)
    expect(Math.abs(volume(current) / volume(initial) - 1)).toBeLessThan(0.00001)
    let minimum = Infinity
    let maximum = 0
    for (let index = 0; index < current.length; index += 4) {
      minimum = Math.min(minimum, current[index])
      maximum = Math.max(maximum, current[index])
    }
    expect(current.every(Number.isFinite)).toBe(true)
    expect(minimum).toBeGreaterThanOrEqual(0)
    expect(maximum).toBeGreaterThan(thickness + 0.1)
    expect(maximum).toBeLessThanOrEqual(thickness + (mode === 'lightbox' ? thickness * 1.2 : 1.2) + 0.001)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test('an oblique palm sweeps its entire ellipse at capsule joins', async () => {
  const solver = new ArtSolver(device, 'lightbox')
  await solver.initialize()
  try {
    const initial = await solver.readState()
    step(solver, [contact('palm', {
      from: { x: 224, y: 192 }, to: { x: 288, y: 192 }, velocity: { x: 0, y: 0 },
      radius: 32, pressure: 0.8, strength: 0.55, angle: Math.PI / 4, aspect: 0.3,
    })], 12, { preserve: true })
    const current = await solver.readState()
    // These two points lie in ellipses whose centers are just inside the swept
    // path, but outside the ellipse placed at the Euclidean nearest endpoint.
    // Projecting before ellipse normalization incorrectly leaves these joins dark.
    expect(current[(178 * 512 + 224) * 4]).toBeLessThan(0.17)
    expect(current[(206 * 512 + 288) * 4]).toBeLessThan(0.17)
    // This point lies beyond the short axis and outside the swept segment.
    expect(current[(192 * 512 + 210) * 4]).toBeGreaterThanOrEqual(0.22)
    expect(Math.abs(volume(current) / volume(initial) - 1)).toBeLessThan(0.00001)
    let minimum = Infinity
    for (let index = 0; index < current.length; index += 4) minimum = Math.min(minimum, current[index])
    expect(minimum).toBeGreaterThanOrEqual(0)
    expect(current.every(Number.isFinite)).toBe(true)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test.each(['lightbox', 'surface'] as ArtMode[])('a diagonal stationary palm preserves its long and short axes in %s', async (mode) => {
  const solver = new ArtSolver(device, mode, 128, 96)
  await solver.initialize()
  try {
    const initial = await solver.readState()
    step(solver, [contact('palm', {
      from: { x: 256, y: 192 }, to: { x: 256, y: 192 }, velocity: { x: 0, y: 0 },
      radius: 48, pressure: 0.8, strength: 0.55, angle: Math.PI / 4, aspect: 0.45,
    })], 12, { preserve: true })
    const current = await solver.readState()
    const amount = (x: number, y: number) => current[(Math.floor(y / 4) * 128 + Math.floor(x / 4)) * 4]
    const bed = mode === 'lightbox' ? 0.24 : 2
    // A circular footprint would excavate both positions. The first lies on
    // the major diagonal, while the second is beyond the short ellipse axis.
    expect(amount(276, 212)).toBeLessThan(bed - (mode === 'lightbox' ? 0.07 : 0.20))
    expect(amount(236, 212)).toBeGreaterThanOrEqual(bed - 0.001)
    expectConserved(initial, current)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})

test.each(['single', 'batched8'] as const)('a fast palm clears an imported grainy bed without comb stripes with %s input', async (pattern) => {
  const solver = new ArtSolver(device, 'lightbox')
  await solver.initialize()
  try {
    // Actual image-import regression from assets/art-lightbox-v2.png, black=1,
    // gamma=1.4 and thickness=0–1.25. The fixture keeps exact imported f32
    // heights (0.0128–1.154); using a uniform bed concealed the pressure stripes.
    const unpacked = gunzipSync(readFileSync(new URL('./fixtures/palm-import-height.f32.gz', import.meta.url)))
    const heights = new Float32Array(unpacked.buffer.slice(unpacked.byteOffset, unpacked.byteOffset + unpacked.byteLength))
    const initial = new Float32Array(512 * 384 * 4)
    heights.forEach((height, index) => { initial[index * 4] = height })
    solver.loadState(initial)
    const stroke = (fraction: number) => contact('palm', {
      from: { x: 166, y: 319 }, to: { x: 166 + 214 * fraction, y: 319 - 8 * fraction },
      velocity: { x: 2140, y: -80 }, radius: 42, pressure: 0.8, strength: 0.7,
      angle: Math.PI / 2, aspect: 0.45,
    })
    // Six 60 Hz frames form a 100 ms gesture. A coalesced batch contains eight
    // growing, overlapping capsules; the next fixed step uses its held endpoint.
    for (let frame = 1; frame <= 6; frame++) {
      const contacts = pattern === 'single' ? [stroke(frame / 6)]
        : Array.from({ length: 8 }, (_, index) => stroke((frame - 1 + (index + 1) / 8) / 6))
      step(solver, contacts, 1, { preserve: true })
      step(solver, [stroke(frame / 6)], 1, { preserve: true })
    }
    const evaluate = (current: Float32Array) => {
      const core: number[] = []
      let maximumColumnDark = 0
      for (let x = 196; x <= 350; x++) {
        const y = Math.round(319 - (x - 166) * 8 / 214)
        let dark = 0
        for (let offset = -16; offset <= 16; offset++) {
          const height = current[((y + offset) * 512 + x) * 4]
          core.push(height)
          if (height > 0.14) dark++
        }
        maximumColumnDark = Math.max(maximumColumnDark, dark)
      }
      core.sort((a, b) => a - b)
      return { p95: core[Math.floor(core.length * 0.95)], maximum: core.at(-1)!, maximumColumnDark }
    }
    // The final 80 ms contact is the intended release settling period. It moves
    // sand into the same capacity-limited banks; it never replaces it with alpha.
    step(solver, [stroke(1)], 10, { preserve: true })
    const current = await solver.readState()
    const shape = evaluate(current)
    expect(shape.p95).toBeLessThan(0.06)
    expect(shape.maximumColumnDark).toBeLessThanOrEqual(1)
    expect(shape.maximum).toBeLessThan(0.18)
    expect(Math.abs(volume(current) / volume(initial) - 1)).toBeLessThan(0.00001)
    let minimum = Infinity
    let maximum = 0
    let maximumExcess = 0
    for (let index = 0; index < current.length; index += 4) {
      minimum = Math.min(minimum, current[index])
      maximum = Math.max(maximum, current[index])
      const limit = Math.max(0.8, initial[index] + Math.max(0.56, initial[index] * 1.2))
      maximumExcess = Math.max(maximumExcess, current[index] - limit)
    }
    expect(minimum).toBeGreaterThanOrEqual(0)
    expect(current.every(Number.isFinite)).toBe(true)
    expect(maximum).toBeGreaterThan(1.2)
    expect(maximumExcess).toBeLessThan(0.001)
    expect(errors).toEqual([])
  } finally { solver.destroy() }
})
