import type { StageMaterialSnapshot } from '../stage/material'
import type { PhotoSettings } from './model'
import type { PhotoPerformance } from './performance'

export interface PhotoWork {
  version: 1; id: string; title: string; caption: string; createdAt: string; updatedAt: string
  sourceKind: 'photo' | 'ai-sample'; source: Blob | undefined; image: Blob
  settings: PhotoSettings; snapshot: StageMaterialSnapshot
  performance?:PhotoPerformance
}
let database: Promise<IDBDatabase> | undefined
function open() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('sandboard-photo-memory', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('works', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => { database = undefined; reject(request.error ?? new Error('作品集存储不可用。')) }
  })
}
export async function savePhotoWork(work: PhotoWork): Promise<void> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('works', 'readwrite')
    tx.objectStore('works').put(work)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('作品保存失败。'))
    tx.onabort = () => reject(tx.error ?? new Error('作品保存中止。'))
  })
}
export async function listPhotoWorks(): Promise<PhotoWork[]> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const request = db.transaction('works', 'readonly').objectStore('works').getAll()
    request.onsuccess = () => resolve((request.result as PhotoWork[]).filter(w => w.version === 1).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
    request.onerror = () => reject(request.error ?? new Error('作品集读取失败。'))
  })
}
export type PhotoWorkMetadata = Pick<PhotoWork, 'id' | 'title' | 'caption' | 'updatedAt' | 'sourceKind' | 'image'> & {
  mood: PhotoSettings['mood']; style: PhotoSettings['style']
}
// The shared gallery retains previews and labels, rather than all original photos,
// material snapshots and performance plans. Existing records remain in their store.
export async function listPhotoWorkMetadata(): Promise<PhotoWorkMetadata[]> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('works', 'readonly'), works: PhotoWorkMetadata[] = []
    const request = tx.objectStore('works').openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) return
      const work = cursor.value as PhotoWork
      if (work.version === 1) works.push({ id: work.id, title: work.title, caption: work.caption,
        updatedAt: work.updatedAt, sourceKind: work.sourceKind, image: work.image,
        mood: work.settings.mood, style: work.settings.style })
      cursor.continue()
    }
    tx.oncomplete = () => resolve(works.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
    tx.onerror = () => reject(tx.error ?? new Error('照片作品集读取失败。'))
    tx.onabort = () => reject(tx.error ?? new Error('照片作品集读取中止。'))
  })
}
export async function readPhotoWork(id: string): Promise<PhotoWork | undefined> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const request = db.transaction('works', 'readonly').objectStore('works').get(id)
    request.onsuccess = () => resolve(request.result?.version === 1 ? request.result : undefined)
    request.onerror = () => reject(request.error ?? new Error('作品读取失败。'))
  })
}
