import { beforeEach, expect, test, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { GRID_WIDTH, GRID_HEIGHT } from '../src/model'
import { StageMaterial } from '../src/stage/material'

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); vi.resetModules() })
test('同名编号的手绘和照片合并展示，读取后原沙层、草稿与照片工程仍完整', async () => {
  const { saveArt, savePainting, loadArt, loadPainting } = await import('../src/storage')
  const { savePhotoWork, readPhotoWork, listPhotoWorkMetadata } = await import('../src/memories/storage')
  const { readCollection, selectWorks, workPath } = await import('../src/gallery/collection')
  const manual = { version: 1 as const, width: GRID_WIDTH, height: GRID_HEIGHT, mode: 'surface' as const,
    state: new Float32Array(GRID_WIDTH * GRID_HEIGHT * 4).buffer, savedAt: '2026-10-09T09:00:00Z',
    settings: { tool: 'rake' as const, radius: 16, strength: .7, wetness: 0, wind: 0, light: 'noon' as const } }
  await saveArt(manual)
  await savePainting(manual, '沙耙纹路', 'same-id', new Blob(['manual'], { type: 'image/png' }))
  const photo = { version: 1 as const, id: 'same-id', title: '雨窗记忆', caption: '等雨停的一刻',
    createdAt: '2026-10-09T09:00:00Z', updatedAt: '2026-10-10T09:00:00Z', sourceKind: 'photo' as const,
    source: new Blob(['source'], { type: 'image/jpeg' }), image: new Blob(['photo'], { type: 'image/jpeg' }),
    settings: { mood: 'warm' as const, ratio: 'landscape' as const, style: 'portrait' as const, exposure: 0,
      contrast: 1, detail: .5, grain: .5, white: .2, zoom: 1, panX: .5, panY: .5 },
    snapshot: new StageMaterial(16, 9).read() }
  await savePhotoWork(photo)
  const before = await loadPainting('same-id')
  const { works, unavailable } = await readCollection()
  expect(unavailable).toEqual([])
  expect(works.map(work => work.key)).toEqual(['photo:same-id', 'hand:same-id'])
  expect(selectWorks(works, 'hand').map(work => work.title)).toEqual(['沙耙纹路'])
  expect(selectWorks(works, 'all', '等雨停').map(work => work.title)).toEqual(['雨窗记忆'])
  expect(selectWorks(works, 'all', '', 'oldest')[0].kind).toBe('hand')
  expect(workPath(works[0])).toBe('memories/#edit=same-id')
  expect(workPath(works[0], true)).toBe('memories/#work=same-id')
  expect(workPath(works[1])).toBe('#work=same-id')
  const metadata = (await listPhotoWorkMetadata())[0]
  expect(metadata).not.toHaveProperty('snapshot')
  expect(metadata).not.toHaveProperty('source')
  expect(await loadPainting('same-id')).toEqual(before)
  expect(await loadArt('surface')).toEqual(manual)
  expect(await readPhotoWork('same-id')).toEqual(photo)
})
test('其中一个旧作品库读取失败时，另一类作品仍可显示与打开', async () => {
  const { readCollection, workPath } = await import('../src/gallery/collection')
  const result = await readCollection({
    hand: async () => [{ id: 'art-1', title: '旧灯箱', mode: 'lightbox', date: '2026-10-09T10:00:00Z' }],
    photo: async () => { throw new Error('unavailable') }
  })
  expect(result.unavailable).toEqual(['photo'])
  expect(result.works).toHaveLength(1)
  expect(result.works[0].preview).toBeUndefined()
  expect(workPath(result.works[0])).toBe('#work=art-1')
})
