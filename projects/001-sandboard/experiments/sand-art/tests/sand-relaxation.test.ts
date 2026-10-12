import { expect, test } from 'vitest'
import { relaxSand } from '../src/memories/sand-relaxation'

const mass = (density: Float32Array) => density.reduce((total, value) => total + value, 0)
const gradient = (density: Float32Array, width: number) => density.reduce((total, value, index) => {
  if (index % width < width - 1) total += Math.max(0, Math.abs(value - density[index + 1]) - .62)
  if (index + width < density.length) total += Math.max(0, Math.abs(value - density[index + width]) - .62)
  return total
}, 0)

test('陡峭沙堆逐步滑落，保持非负与总沙量', () => {
  const density = new Float32Array(15 * 11)
  density[5 * 15 + 7] = 48
  const initialMass = mass(density), initialSlope = gradient(density, 15)
  expect(relaxSand(density, 15, 11, .001, .001, .001, 0)).toBeGreaterThan(0)
  expect(gradient(density, 15)).toBeLessThan(initialSlope)
  for (let phase = 1; phase < 200; phase++) relaxSand(density, 15, 11, .001, .001, .001, phase)
  expect(Math.min(...density)).toBeGreaterThanOrEqual(0)
  expect(mass(density)).toBeCloseTo(initialMass, 4)
  expect(gradient(density, 15)).toBeLessThan(.01)
})

test('平坦及低于坡度阈值的沙层保持原样', () => {
  const density = Float32Array.from([.2, .3, .4, .3, .4, .5])
  const before = density.slice()
  expect(relaxSand(density, 3, 2, .001, .001, .001, 0)).toBe(0)
  expect(density).toEqual(before)
})

test('边角沙堆不会从封闭台沿损失，行末不会绕到下一行', () => {
  const density = new Float32Array(20), width = 5
  density[4] = 12
  relaxSand(density, width, 4, .001, .001, .001, 0)
  expect(density[5]).toBe(0)
  for (let phase = 1; phase < 120; phase++) relaxSand(density, width, 4, .001, .001, .001, phase)
  expect(mass(density)).toBeCloseTo(12, 4)
  expect(Math.min(...density)).toBeGreaterThanOrEqual(0)
})
