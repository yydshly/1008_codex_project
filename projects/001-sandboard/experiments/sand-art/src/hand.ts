import { clamp, type ArtContact } from './model'

/** A handful is an interaction budget in sand-volume units, not physical grams. */
export const HAND_CAPACITY = 3500
export const POUR_RATE = 3000
export const HANDFUL_AMOUNT = 1500

// Allocate the same finite handful across simultaneous pointers and queued
// samples. The allocated pressure goes into the recording, so replay never
// depends on the creator's current inventory or on browser event frequency.
export function allocateHand(contacts: readonly ArtContact[], remaining: number, dt: number) {
  let available = clamp(Number.isFinite(remaining) ? remaining : 0, 0, HAND_CAPACITY)
  const allocated = contacts.map(contact => {
    if (contact.tool !== 'pour' || !contact.pour) return contact
    const amount = contact.pour.style === 'handful'
      ? HANDFUL_AMOUNT * clamp(contact.pour.burst ?? 0, 0, 1)
      : POUR_RATE * clamp(dt, 0, 1 / 30)
    const cost = amount * clamp(contact.pour.flow ?? 1, 0, 2) * clamp(contact.strength, 0, 4) * clamp(contact.pressure, 0, 1)
    if (cost <= 0) return contact
    const fraction = Math.min(1, available / cost)
    available = Math.max(0, available - cost * fraction)
    return { ...contact, pressure: contact.pressure * fraction }
  })
  return { contacts: allocated, remaining: available }
}
