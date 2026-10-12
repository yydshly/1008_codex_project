import { expect, test } from 'vitest'
import { subdivideContact, type ArtContact } from '../src/model'

test('distance resampling retains both endpoints and bounds segment length', () => {
  const contact: ArtContact = { from: { x: 4, y: 10 }, to: { x: 480, y: 320 }, velocity: { x: 100, y: 70 }, radius: 12, pressure: 0.75, strength: 0.5, tool: 'scrape' }
  const segments = subdivideContact(contact)
  expect(segments[0].from).toEqual(contact.from)
  expect(segments.at(-1)!.to).toEqual(contact.to)
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index]
    expect(Math.hypot(segment.to.x - segment.from.x, segment.to.y - segment.from.y)).toBeLessThanOrEqual(5.4 + 1e-8)
    if (index > 0) expect(segment.from).toEqual(segments[index - 1].to)
    expect(segment.velocity).toEqual(contact.velocity)
  }
})

test('a stationary contact remains a valid pour sample', () => {
  const contact: ArtContact = { from: { x: 120, y: 100 }, to: { x: 120, y: 100 }, velocity: { x: 0, y: 0 }, radius: 10, pressure: 1, strength: 0.5, tool: 'pour' }
  expect(subdivideContact(contact)).toEqual([contact])
})
