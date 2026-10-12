import { expect, test } from 'vitest'
import { AirborneSand, naturalFlowAt } from '../src/airborne'
import { FIXED_STEP, type ArtContact, type ArtStep } from '../src/model'

function contact(overrides: Partial<ArtContact> = {}): ArtContact {
  return {
    tool: 'pour', from: { x: 256, y: 192 }, to: { x: 256, y: 192 },
    velocity: { x: 0, y: 0 }, radius: 10, pressure: 1, strength: 1,
    pour: { style: 'stream', height: 0.5, spread: 0.2 }, ...overrides,
  }
}
function step(contacts: readonly ArtContact[] = [], overrides: Partial<ArtStep> = {}): ArtStep {
  return { dt: FIXED_STEP, contacts, wetness: 0, wind: 0, windAngle: 0, ...overrides }
}
function sum(values: Float32Array) {
  let total = 0
  for (const value of values) total += value
  return total
}
function airMass(air: AirborneSand) { return air.particles.reduce((total, grain) => total + grain.mass, 0) }
function expectMass(actual: number, expected: number) {
  // A deposited packet may be distributed across Float32 cells; allow rounding,
  // while keeping the tolerance far below the mass of one emitted packet.
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(Math.max(1e-4, expected * 2e-6))
}
function settle(air: AirborneSand) {
  let deposited = 0
  for (let tick = 0; tick < 240 && air.pending; tick++) deposited += sum(air.advance(step()))
  expect(air.pending).toBe(false)
  return deposited
}

test('new sand stays airborne on the emission tick and gravity lands its full mass later', () => {
  const air = new AirborneSand(64, 48)
  const first = air.advance(step([contact()]))
  expect(sum(first)).toBe(0)
  expect(air.pending).toBe(true)
  expect(air.particles.length).toBeGreaterThan(0)
  expect(air.particles.every(grain => grain.z === 60)).toBe(true)
  expectMass(airMass(air), 3000 * FIXED_STEP)
  const initialHeight = air.particles[0].z
  const secondDeposit = sum(air.advance(step()))
  expect(air.particles[0].z).toBeLessThan(initialHeight)
  expectMass(secondDeposit + settle(air), 3000 * FIXED_STEP)
})

test('stream and scatter conserve the same continuous supply but produce different airborne paths', () => {
  const stream = new AirborneSand(64, 48)
  const scatter = new AirborneSand(64, 48)
  let streamDeposit = 0, scatterDeposit = 0
  for (let tick = 0; tick < 20; tick++) {
    streamDeposit += sum(stream.advance(step([contact({ pour: { style: 'stream', height: 1, spread: 0.9 } })])))
    scatterDeposit += sum(scatter.advance(step([contact({ pour: { style: 'scatter', height: 1, spread: 0.9 } })])))
  }
  const emitted = 3000 * FIXED_STEP * 20
  expectMass(streamDeposit + airMass(stream), emitted)
  expectMass(scatterDeposit + airMass(scatter), emitted)
  expect(scatter.particles).not.toEqual(stream.particles)
  expectMass(streamDeposit + settle(stream), emitted)
  expectMass(scatterDeposit + settle(scatter), emitted)
})

test('handful emits one pressure-scaled burst and does not keep pouring without another burst event', () => {
  const air = new AirborneSand(64, 48)
  const held = contact({ strength: 0.4, pressure: 0.7, pour: { style: 'handful', height: 0.4, spread: 0.7 } })
  expect(sum(air.advance(step([held])))).toBe(0)
  expect(air.pending).toBe(false)
  const burst = { ...held, pour: { ...held.pour!, burst: 0.6 } }
  let deposited = sum(air.advance(step([burst])))
  const expected = 1500 * 0.6 * 0.4 * 0.7
  expectMass(airMass(air), expected)
  for (let tick = 0; tick < 80; tick++) deposited += sum(air.advance(step([held])))
  expectMass(deposited + airMass(air), expected)
  expectMass(deposited + settle(air), expected)
})

test('snapshots and restored particles are independent copies and preserve future emission deterministically', () => {
  const original = new AirborneSand(64, 48, 128)
  original.advance(step([contact({ pour: { style: 'scatter', height: 0.7, spread: 0.8 } })]))
  const saved = original.snapshot()
  const pristine = original.snapshot()
  const restored = new AirborneSand(64, 48, 128)
  restored.restore(saved)
  saved.particles[0].x = -99
  saved.particles[0].mass = 9999
  saved.randomState = 1
  saved.overflowCursor = 999
  expect(original.snapshot()).toEqual(pristine)
  expect(restored.snapshot()).toEqual(pristine)
  for (let tick = 0; tick < 60; tick++) {
    const contacts = tick % 4 === 0 ? [contact({ pour: { style: 'scatter', height: 0.3, spread: 0.5 } })] : []
    const input = step(contacts, { wind: 0.6, windAngle: 0.8 })
    expect(restored.advance(input)).toEqual(original.advance(input))
    expect(restored.snapshot()).toEqual(original.snapshot())
  }
})

test('clear resets all airborne mass and the random and overflow sequences', () => {
  const used = new AirborneSand(64, 48, 1)
  const fresh = new AirborneSand(64, 48, 1)
  const input = step([contact({ pour: { style: 'scatter', height: 0.5, spread: 0.9 } })])
  for (let tick = 0; tick < 12; tick++) used.advance(input)
  expect(used.pending).toBe(true)
  used.clear()
  expect(used.pending).toBe(false)
  expect(used.particles).toHaveLength(0)
  expect(used.snapshot()).toEqual(fresh.snapshot())
  expect(used.advance(input)).toEqual(fresh.advance(input))
  expect(used.snapshot()).toEqual(fresh.snapshot())
})

test('a full particle capacity merges supply without losing mass, including grains near canvas edges', () => {
  const bounded = new AirborneSand(64, 48, 1)
  const roomy = new AirborneSand(64, 48, 8192)
  const contacts = [
    contact({ from: { x: 1, y: 1 }, to: { x: 1, y: 1 }, pour: { style: 'scatter', height: 0.3, spread: 1 } }),
    contact({ from: { x: 511, y: 383 }, to: { x: 511, y: 383 }, pour: { style: 'stream', height: 0.6, spread: 1 } }),
    contact({ pressure: 0.3, strength: 0.5 }),
  ]
  let boundedDeposit = 0, roomyDeposit = 0
  const emittedPerTick = 3000 * FIXED_STEP * (1 + 1 + 0.3 * 0.5)
  for (let tick = 1; tick <= 70; tick++) {
    const input = step(contacts, { wind: 0.8, windAngle: Math.PI / 4 })
    boundedDeposit += sum(bounded.advance(input))
    roomyDeposit += sum(roomy.advance(input))
    expect(bounded.particles.length).toBeLessThanOrEqual(1)
    expectMass(boundedDeposit + airMass(bounded), emittedPerTick * tick)
    expectMass(roomyDeposit + airMass(roomy), emittedPerTick * tick)
  }
  expectMass(boundedDeposit + settle(bounded), emittedPerTick * 70)
  expectMass(roomyDeposit + settle(roomy), emittedPerTick * 70)
})

test('a custom deposition grid maps canvas coordinates to the corresponding grid location', () => {
  const width = 64, height = 48
  const air = new AirborneSand(width, height, 8)
  const snapshot = air.snapshot()
  snapshot.particles = [{ x: 256, y: 192, z: 0.001, vx: 0, vy: 0, vz: -10, mass: 3, seed: 0.5 }]
  air.restore(snapshot)
  const deposited = air.advance(step())
  expect(deposited).toHaveLength(width * height)
  expectMass(sum(deposited), 3)
  let xMoment = 0, yMoment = 0
  for (let index = 0; index < deposited.length; index++) {
    xMoment += (index % width) * deposited[index]
    yMoment += Math.floor(index / width) * deposited[index]
    expect(deposited[index]).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(deposited[index])).toBe(true)
  }
  expect(Math.abs(xMoment / 3 - width / 2)).toBeLessThanOrEqual(0.6)
  expect(Math.abs(yMoment / 3 - height / 2)).toBeLessThanOrEqual(0.6)
  expect(air.pending).toBe(false)
})

test('the reusable deposition buffer is cleared so a landed packet is applied only once', () => {
  const air = new AirborneSand(32, 24, 8)
  const snapshot = air.snapshot()
  snapshot.particles = [{ x: 256, y: 192, z: 0.001, vx: 0, vy: 0, vz: -10, mass: 7, seed: 0.5 }]
  air.restore(snapshot)
  const first = air.advance(step())
  expectMass(sum(first), 7)
  const second = air.advance(step([contact({ tool: 'push' })]))
  expect(second).toBe(first)
  expect(sum(second)).toBe(0)
  expect(air.pending).toBe(false)
})

test('natural flow has visible slow pulses while adjacent simulation steps remain correlated', () => {
  for (const style of ['stream', 'scatter'] as const) {
    const values = Array.from({ length: 1200 }, (_, tick) => naturalFlowAt(tick * FIXED_STEP, style, 256, 192))
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.8)
    let greatestJump = 0
    for (let index = 1; index < values.length; index++) greatestJump = Math.max(greatestJump, Math.abs(values[index] - values[index - 1]))
    expect(greatestJump).toBeLessThan(0.04)
    expect(values.every(value => value >= 0 && value <= 2)).toBe(true)
    const lagA = values.slice(0, -1), lagB = values.slice(1)
    const mean = (array: number[]) => array.reduce((total, value) => total + value, 0) / array.length
    const a = mean(lagA), b = mean(lagB)
    let covariance = 0, varianceA = 0, varianceB = 0
    lagA.forEach((value, index) => { covariance += (value - a) * (lagB[index] - b); varianceA += (value - a) ** 2; varianceB += (lagB[index] - b) ** 2 })
    expect(covariance / Math.sqrt(varianceA * varianceB)).toBeGreaterThan(0.995)
  }
  expect(naturalFlowAt(7.1, 'handful')).toBe(1)
})

function landingMap(air: AirborneSand, input: ArtContact, count = 1) {
  const result = new Float64Array(air.width * air.height)
  const add = (grid: Float32Array) => grid.forEach((value, index) => { result[index] += value })
  for (let index = 0; index < count; index++) add(air.advance(step([input])))
  for (let index = 0; index < 240 && air.pending; index++) add(air.advance(step()))
  expect(air.pending).toBe(false)
  return result
}

function spreadMoments(grid: Float64Array, width = 512) {
  let mass = 0, x = 0, y = 0
  grid.forEach((value, index) => { mass += value; x += value * (index % width); y += value * Math.floor(index / width) })
  x /= mass; y /= mass
  let xx = 0, yy = 0, xy = 0
  grid.forEach((value, index) => { const dx = index % width - x, dy = Math.floor(index / width) - y; xx += value * dx * dx; yy += value * dy * dy; xy += value * dx * dy })
  xx /= mass; yy /= mass; xy /= mass
  const difference = Math.sqrt((xx - yy) ** 2 + 4 * xy * xy)
  return { mass, x, y, ratio: (xx + yy + difference) / (xx + yy - difference), angle: Math.atan2(2 * xy, xx - yy) / 2 }
}

test('natural scatter has directional dense jets and sparse fringes rather than a uniform round footprint', () => {
  const oldAir = new AirborneSand(), naturalAir = new AirborneSand()
  const input = contact({ radius: 24, pour: { style: 'scatter', height: 0.6, spread: 0.7 } })
  const oldMap = landingMap(oldAir, input, 60)
  const naturalMap = landingMap(naturalAir, { ...input, pour: { ...input.pour!, natural: true } }, 60)
  const oldMoments = spreadMoments(oldMap), naturalMoments = spreadMoments(naturalMap)
  expectMass(naturalMoments.mass, oldMoments.mass)
  expect(oldMoments.ratio).toBeLessThan(1.4)
  expect(naturalMoments.ratio).toBeGreaterThan(2.5)
  // Coarse patches measure density, not individual packets or subpixel splats.
  const patches = new Float64Array(128 * 96)
  naturalMap.forEach((value, index) => { patches[Math.floor(Math.floor(index / 512) / 4) * 128 + Math.floor(index % 512 / 4)] += value })
  const occupied = Array.from(patches).filter(value => value > 0.02).sort((a, b) => a - b)
  expect(occupied[Math.floor(occupied.length * 0.9)] / occupied[Math.floor(occupied.length * 0.1)]).toBeGreaterThan(15)
})

test('successive natural handfuls vary their whole shape and parcel size while each budget is exact', () => {
  const air = new AirborneSand()
  const input = contact({ radius: 24, pour: { style: 'handful', height: 1, spread: 0.7, burst: 1, natural: true, flow: 1 } })
  air.advance(step([input]))
  const parcels = air.particles.map(grain => grain.mass)
  expect(Math.max(...parcels) / Math.min(...parcels)).toBeGreaterThan(10)
  expectMass(airMass(air), 1500)
  const first = new Float64Array(512 * 384)
  while (air.pending) air.advance(step()).forEach((value, index) => { first[index] += value })
  const second = landingMap(air, input)
  expectMass(spreadMoments(first).mass, 1500)
  expectMass(spreadMoments(second).mass, 1500)
  let difference = 0
  first.forEach((value, index) => { difference += Math.abs(value - second[index]) })
  expect(difference).toBeGreaterThan(1500)
  expect(Math.abs(spreadMoments(first).angle - spreadMoments(second).angle)).toBeGreaterThan(0.2)
})

test('natural snapshots preserve the drifting source clock, RNG and all later deposits', () => {
  const original = new AirborneSand(64, 48, 128), clone = new AirborneSand(64, 48, 128)
  const input = (air: AirborneSand) => contact({ pour: { style: 'scatter', height: 0.7, spread: 0.8, natural: true, flow: naturalFlowAt(air.elapsedTime, 'scatter') } })
  for (let tick = 0; tick < 30; tick++) original.advance(step([input(original)]))
  expect(original.elapsedTime).toBeCloseTo(0.25, 12)
  clone.restore(original.snapshot())
  for (let tick = 0; tick < 90; tick++) {
    expect(clone.advance(step([input(clone)]))).toEqual(original.advance(step([input(original)])))
    expect(clone.snapshot()).toEqual(original.snapshot())
  }
  original.clear()
  expect(original.elapsedTime).toBe(0)
})

test('natural supply including recorded flow stays conserved with a full pool and clamped edges', () => {
  const air = new AirborneSand(64, 48, 1)
  let landed = 0, emitted = 0
  for (let tick = 0; tick < 80; tick++) {
    const flow = naturalFlowAt(air.elapsedTime, 'scatter', 511, 383)
    landed += sum(air.advance(step([contact({ from: { x: 511, y: 383 }, to: { x: 511, y: 383 }, radius: 42, pour: { style: 'scatter', height: 1, spread: 1, natural: true, flow } })])))
    emitted += 3000 * FIXED_STEP * flow
    expectMass(landed + airMass(air), emitted)
    expect(air.particles.length).toBeLessThanOrEqual(1)
  }
  expectMass(landed + settle(air), emitted)
  expectMass(air.emittedMass, emitted)
})

test('only natural packets use a compact subcell deposit; legacy packets retain their exact landing cell', () => {
  const natural = new AirborneSand(64, 48), legacy = new AirborneSand(64, 48)
  for (const air of [natural, legacy]) {
    const snapshot = air.snapshot()
    snapshot.particles = [{ x: 256, y: 192, z: 0.001, vx: 0, vy: 0, vz: -10, mass: 8, seed: 0.5, ...(air === natural ? { natural: true } : {}) }]
    air.restore(snapshot)
  }
  const smoothed = natural.advance(step()).slice(), direct = legacy.advance(step()).slice()
  expect(Array.from(smoothed).filter(value => value > 0)).toEqual([2, 2, 2, 2])
  expect(Array.from(direct).filter(value => value > 0)).toEqual([8])
  expect(sum(smoothed)).toBe(sum(direct))
})
