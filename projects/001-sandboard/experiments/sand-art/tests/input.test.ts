import { expect, test } from 'vitest'
import { extendStroke, sampleContactQueues, type StrokeAnchor } from '../src/input'
import type { ArtContact } from '../src/model'

const pour: ArtContact = { from: { x: 40, y: 40 }, to: { x: 40, y: 40 }, velocity: { x: 0, y: 0 }, radius: 14, strength: 0.55, pressure: 0.8, tool: 'pour' }

test('a handful burst retains its amount when same-tick movement samples are queued', () => {
  const initial = { ...pour, pour: { style: 'handful' as const, height: 0.5, spread: 0.5, burst: 1 } }
  const movement = { ...initial, pour: { ...initial.pour, burst: undefined } }
  const pointers = new Map([[1, { held: true, tool: 'pour' as const, queue: [initial, movement, movement] }]])
  const result = sampleContactQueues(pointers, 0, () => movement)
  expect(result.contacts).toHaveLength(3)
  expect(result.contacts[0].strength).toBe(pour.strength)
  expect(result.contacts.filter(contact => contact.pour?.burst)).toHaveLength(1)
})

test('stationary pouring has the same budget for each finger, regardless of pointer count', () => {
  for (const count of [1, 2, 5, 8]) {
    const pointers = new Map(Array.from({ length: count }, (_, index) => [index, { held: true, tool: 'pour' as const, queue: [] }]))
    const result = sampleContactQueues(pointers, 0, () => pour)
    expect(result.contacts).toHaveLength(count)
    expect(result.contacts.every((item) => item.strength === pour.strength)).toBe(true)
  }
})

test('overlapping movement samples share one pouring budget without an extra stationary deposit', () => {
  const pointers = new Map([[1, { held: true, tool: 'pour' as const, queue: Array.from({ length: 5 }, () => ({ ...pour })) }]])
  const result = sampleContactQueues(pointers, 0, () => pour)
  expect(result.contacts).toHaveLength(5)
  expect(result.contacts.reduce((sum, item) => sum + item.strength, 0)).toBeCloseTo(pour.strength)
})

test('lifting a finger keeps the last queued stroke until it has been sampled', () => {
  const pointers = new Map([[2, { held: false, tool: 'scrape' as const, queue: [{ ...pour, tool: 'scrape' as const }] }]])
  const result = sampleContactQueues(pointers, 0, () => pour)
  expect(result.contacts).toHaveLength(1)
  expect(result.contacts[0].tool).toBe('scrape')
  expect(pointers.size).toBe(0)
})

test('collinear drawing keeps a shared sweep origin across consumed pointer samples', () => {
  const anchor: StrokeAnchor = { origin: { x: 10, y: 10 }, direction: null }
  expect(extendStroke(anchor, { x: 10, y: 10 }, { x: 30, y: 10 }, 14)).toEqual({ x: 10, y: 10 })
  expect(extendStroke(anchor, { x: 30, y: 10 }, { x: 60, y: 10.3 }, 14)).toEqual({ x: 10, y: 10 })
  expect(extendStroke(anchor, { x: 60, y: 10.3 }, { x: 90, y: 10 }, 14)).toEqual({ x: 10, y: 10 })
})

test('a corner or reversal starts a new sweep at the actual preceding point', () => {
  const anchor: StrokeAnchor = { origin: { x: 10, y: 10 }, direction: { x: 1, y: 0 } }
  expect(extendStroke(anchor, { x: 40, y: 10 }, { x: 40, y: 35 }, 14)).toEqual({ x: 40, y: 10 })
  expect(extendStroke(anchor, { x: 40, y: 35 }, { x: 40, y: 20 }, 14)).toEqual({ x: 40, y: 35 })
})
