import { beforeEach, expect, test } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { GRID_HEIGHT, GRID_WIDTH } from '../src/model'
import { deletePainting, listPaintings, loadArt, loadPainting, saveArt, savePainting, type SavedArt } from '../src/storage'

function art(mode: SavedArt['mode'] = 'lightbox'): SavedArt {
  const state = new Float32Array(GRID_WIDTH * GRID_HEIGHT * 4)
  state.set([0.24, 0.5, 2, -3])
  return { version: 1, width: GRID_WIDTH, height: GRID_HEIGHT, mode, state: state.buffer, savedAt: '2026-10-08T12:00:00.000Z', settings: { tool: 'pour', radius: 16, strength: 0.7, wetness: 0, wind: 0, light: 'noon' } }
}
beforeEach(() => { globalThis.indexedDB = new IDBFactory() })

test('v1 mode drafts survive the v2 gallery upgrade', async () => {
  const legacy = art()
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('sandboard-art-experiment', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('paintings', { keyPath: 'mode' })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction('paintings', 'readwrite')
      transaction.objectStore('paintings').put(legacy)
      transaction.oncomplete = () => { db.close(); resolve() }
      transaction.onerror = () => { db.close(); reject(transaction.error) }
    }
  })
  expect(await loadArt('lightbox')).toEqual(legacy)
  expect(await listPaintings()).toEqual([])
  expect(await loadArt('surface')).toBeUndefined()
})

test('automatic drafts stay separate from named paintings; explicit ids overwrite and omission creates a copy', async () => {
  const first = art()
  const reference = new Float32Array(GRID_WIDTH * GRID_HEIGHT * 4)
  reference[0] = 3.125
  first.referenceState = reference.buffer
  first.referenceImage = { name: '参考.png', blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }) }
  first.settings.palmAngle = Math.PI / 3
  first.settings.referenceVisible = true
  const thumbnail = new Blob([new Uint8Array([4, 5])], { type: 'image/webp' })
  await saveArt(first)
  expect(await listPaintings()).toEqual([])
  const originalId = await savePainting(first, '  第一幅作品  ', undefined, thumbnail)
  const second = { ...first, savedAt: '2026-10-08T12:10:00.000Z', title: '另一副本' }
  const copyId = await savePainting(second, '另一副本')
  expect(copyId).not.toBe(originalId)
  const overwritten = { ...first, savedAt: '2026-10-08T12:20:00.000Z' }
  expect(await savePainting(overwritten, '第一幅改名', originalId)).toBe(originalId)
  const gallery = await listPaintings()
  expect(gallery.map(entry => [entry.id, entry.title])).toEqual([[originalId, '第一幅改名'], [copyId, '另一副本']])
  expect(gallery[0].thumbnail).toEqual(thumbnail)
  const loaded = await loadPainting(originalId)
  expect(loaded?.paintingId).toBe(originalId)
  expect(loaded?.title).toBe('第一幅改名')
  expect(loaded?.referenceState).toEqual(first.referenceState)
  expect(loaded?.referenceImage).toEqual(first.referenceImage)
  expect(loaded?.settings).toEqual(first.settings)
  await saveArt({ ...first, title: '第一幅改名', paintingId: originalId })
  expect((await loadArt('lightbox'))?.paintingId).toBe(originalId)
  await deletePainting(copyId)
  expect(await loadPainting(copyId)).toBeUndefined()
  expect((await listPaintings()).map(entry => entry.id)).toEqual([originalId])
  expect((await loadArt('lightbox'))?.state).toEqual(first.state)
})

test('invalid names and malformed art are rejected before modifying the gallery', async () => {
  await expect(savePainting(art(), ' ')).rejects.toThrow('名称')
  await expect(savePainting({ ...art(), settings: { ...art().settings, tool: 'unknown' as never } }, '无效')).rejects.toThrow('工具')
  await expect(loadPainting('../other')).rejects.toThrow('编号')
  expect(await listPaintings()).toEqual([])
})

test('pouring settings survive draft and gallery round trips, and invalid updates preserve previous data', async () => {
  const original = art()
  Object.assign(original.settings, { pourStyle: 'scatter', pourHeight: 0.55, pourSpread: 0.5 })
  await saveArt(original)
  const id = await savePainting(original, '传统撒沙')
  expect((await loadArt('lightbox'))?.settings).toEqual(original.settings)
  expect((await loadPainting(id))?.settings).toEqual(original.settings)
  const invalid = { ...original, settings: { ...original.settings, pourHeight: Infinity } }
  await expect(saveArt(invalid)).rejects.toThrow('抬手高度')
  await expect(savePainting(invalid, '无效覆盖', id)).rejects.toThrow('抬手高度')
  expect(await loadArt('lightbox')).toEqual(original)
  expect((await loadPainting(id))?.title).toBe('传统撒沙')
})
