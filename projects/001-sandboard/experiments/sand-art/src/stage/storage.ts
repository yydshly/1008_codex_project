import type { StageMaterialSnapshot } from './material'

// A separate database: stage drafts never write the studio's artworks/recordings.
let database: Promise<IDBDatabase> | undefined
function open() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('sandboard-stage-drafts', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('drafts')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => { database = undefined; reject(request.error ?? new Error('舞台草稿存储不可用。')) }
  })
}
export async function loadStageDraft(): Promise<StageMaterialSnapshot | undefined> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const request = db.transaction('drafts', 'readonly').objectStore('drafts').get('manual')
    request.onsuccess = () => { const value = request.result; resolve(value?.version === 1 ? value.snapshot : undefined) }
    request.onerror = () => reject(request.error ?? new Error('舞台草稿读取失败。'))
  })
}
export async function saveStageDraft(snapshot: StageMaterialSnapshot): Promise<void> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', 'readwrite')
    transaction.objectStore('drafts').put({ version: 1, savedAt: new Date().toISOString(), snapshot }, 'manual')
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('舞台草稿保存失败。'))
    transaction.onabort = () => reject(transaction.error ?? new Error('舞台草稿保存被中止。'))
  })
}
