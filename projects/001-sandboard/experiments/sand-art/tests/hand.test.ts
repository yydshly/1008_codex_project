import { expect, test } from 'vitest'
import { allocateHand, HAND_CAPACITY } from '../src/hand'
import { FIXED_STEP, type ArtContact } from '../src/model'

const pouring: ArtContact = { from: { x: 80, y: 90 }, to: { x: 80, y: 90 }, velocity: { x: 0, y: 0 }, radius: 16, pressure: 0.8, strength: 0.7, tool: 'pour', pour: { style: 'scatter', height: 0.55, spread: 0.5 } }

test('a finite handful is shared across simultaneous pours without overspending', () => {
  const result = allocateHand(Array.from({ length: 8 }, () => pouring), 20, FIXED_STEP)
  const emitted = result.contacts.reduce((sum, c) => sum + 3000 * FIXED_STEP * c.strength * c.pressure, 0)
  expect(emitted).toBeCloseTo(20)
  expect(result.remaining).toBe(0)
  expect(pouring.pressure).toBe(0.8)
})
test('a click releases one burst and subsequent held samples use no inventory', () => {
  const burst = { ...pouring, pour: { ...pouring.pour!, style: 'handful' as const, burst: 1 } }
  const result = allocateHand([burst, { ...burst, pour: { ...burst.pour, burst: undefined } }], HAND_CAPACITY, FIXED_STEP)
  expect(result.remaining).toBeCloseTo(HAND_CAPACITY - 1500 * 0.7 * 0.8)
})
test('the last partial burst and an empty hand produce reproducible pressure', () => {
  const burst = { ...pouring, pour: { ...pouring.pour!, style: 'handful' as const, burst: 1 } }
  expect(allocateHand([burst], 100, FIXED_STEP).contacts[0].pressure).toBeCloseTo(100 / (1500 * 0.7))
  expect(allocateHand([pouring], 0, FIXED_STEP).contacts[0].pressure).toBe(0)
})
test('legacy pouring and surface tools do not consume a virtual handful', () => {
  const { pour: _pour, ...legacy } = pouring
  const result = allocateHand([legacy, { ...pouring, tool: 'palm', pour: undefined }], HAND_CAPACITY, FIXED_STEP)
  expect(result.remaining).toBe(HAND_CAPACITY)
  expect(result.contacts[0]).toBe(legacy)
})
test('variable supply consumes the same volume that actually enters the airborne simulation', () => {
  const contacts = [0, 0.3, 1.8].map(flow => ({ ...pouring, pour: { ...pouring.pour!, natural: true, flow } }))
  const result = allocateHand(contacts, 15, FIXED_STEP)
  const emitted = result.contacts.reduce((sum, c) => sum + 3000 * FIXED_STEP * c.strength * c.pressure * c.pour!.flow!, 0)
  expect(emitted).toBeCloseTo(15)
  expect(result.remaining).toBe(0)
  expect(result.contacts[0]).toBe(contacts[0])
  expect(contacts[2].pressure).toBe(0.8)
})
test('a natural burst also respects variable supply and the final partial handful', () => {
  const burst = { ...pouring, pour: { ...pouring.pour!, style: 'handful' as const, burst: 1, natural: true, flow: 1.5 } }
  const result = allocateHand([burst], 100, FIXED_STEP)
  expect(1500 * 1.5 * result.contacts[0].strength * result.contacts[0].pressure).toBeCloseTo(100)
  expect(result.remaining).toBe(0)
})
