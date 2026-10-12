import { beforeEach, expect, test, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import type { StageMaterialSnapshot } from '../src/stage/material'
import { GRID_HEIGHT, GRID_WIDTH } from '../src/model'
import { listPaintings, loadArt, loadPainting, saveArt, savePainting, type SavedArt } from '../src/storage'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  // The stage caches its own open connection. Import it fresh for each isolated database.
  vi.resetModules()
})

function snapshot(amount = 2): StageMaterialSnapshot {
  const density = new Float32Array(8 * 6)
  density[0] = amount
  density[9] = amount / 4
  return {
    version: 1, width: 8, height: 6, density,
    particles: [{ x: 0.3, y: 0.4, z: 0.2, vx: 0.1, vy: -0.1, vz: -0.4, mass: amount / 2, soft: true }],
    randomState: 135792468, elapsedTime: 3.5, suppliedMass: amount * 3, removedMass: 0.25,
  }
}

function studioDraft(): SavedArt {
  const state = new Float32Array(GRID_WIDTH * GRID_HEIGHT * 4)
  state.set([0.24, 0.5, 2, -3])
  return {
    version: 1, width: GRID_WIDTH, height: GRID_HEIGHT, mode: 'lightbox', state: state.buffer,
    savedAt: '2026-10-08T12:00:00.000Z', title: '工作室原有草稿',
    settings: { tool: 'pour', radius: 16, strength: 0.7, wetness: 0, wind: 0, light: 'noon', pourStyle: 'handful', pourHeight: 0.55, pourSpread: 0.5 },
  }
}

async function draftCount() {
  return new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('sandboard-stage-drafts', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction('drafts', 'readonly')
      const count = transaction.objectStore('drafts').count()
      count.onsuccess = () => resolve(count.result)
      count.onerror = () => reject(count.error)
      transaction.oncomplete = () => db.close()
    }
  })
}

test('a new independent stage store has no manual draft', async () => {
  const { loadStageDraft } = await import('../src/stage/storage')
  expect(await loadStageDraft()).toBeUndefined()
  expect(await draftCount()).toBe(0)
})

test('stage persistence deep-copies density, airborne packets and deterministic material state', async () => {
  const { loadStageDraft, saveStageDraft } = await import('../src/stage/storage')
  const original = snapshot()
  const expected = structuredClone(original)
  await saveStageDraft(original)
  original.density.fill(99)
  original.particles[0].mass = 99
  original.randomState = 1
  original.elapsedTime = 99
  const first = await loadStageDraft()
  expect(first).toEqual(expected)
  expect(first?.density).toBeInstanceOf(Float32Array)
  expect(first?.density.buffer).not.toBe(original.density.buffer)
  expect(first?.particles[0]).not.toBe(original.particles[0])
  first!.density[0] = 123
  first!.particles[0].x = 0.99
  first!.particles.length = 0
  first!.suppliedMass = 1000
  expect(await loadStageDraft()).toEqual(expected)
})

test('saving again replaces only the latest manual stage draft', async () => {
  const { loadStageDraft, saveStageDraft } = await import('../src/stage/storage')
  await saveStageDraft(snapshot(2))
  const latest = snapshot(8)
  latest.elapsedTime = 12
  latest.randomState = 246813579
  latest.particles = []
  await saveStageDraft(latest)
  expect(await loadStageDraft()).toEqual(latest)
  expect(await draftCount()).toBe(1)
})

test('stage reads and overwrites preserve the existing v6 studio draft and named artwork', async () => {
  const { loadStageDraft, saveStageDraft } = await import('../src/stage/storage')
  const original = studioDraft()
  await saveArt(original)
  const galleryId = await savePainting(original, '工作室原有作品')
  const draftBefore = await loadArt('lightbox')
  const namedBefore = await loadPainting(galleryId)
  const galleryBefore = await listPaintings()
  expect(await loadStageDraft()).toBeUndefined()
  await saveStageDraft(snapshot(2))
  await saveStageDraft(snapshot(7))
  expect(await loadArt('lightbox')).toEqual(draftBefore)
  expect(await loadPainting(galleryId)).toEqual(namedBefore)
  expect(await listPaintings()).toEqual(galleryBefore)
  expect(await loadArt('surface')).toBeUndefined()
  expect(await loadStageDraft()).toEqual(snapshot(7))
})
