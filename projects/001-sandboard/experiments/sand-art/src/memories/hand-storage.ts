import type { HandRecord } from './filmed-hand'

async function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('sandboard-recorded-hands-v1', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('clips', { keyPath: 'role' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('本机手部素材存储不可用。'))
  })
}
export async function readHandRecords(): Promise<HandRecord[]> {
  const db = await open()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('clips').objectStore('clips').getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}
/** Atomic replacement: a failed write leaves the previous saved library intact. */
export async function saveHandRecords(records: HandRecord[]) {
  const db = await open()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('clips', 'readwrite'), store = tx.objectStore('clips')
      store.clear(); records.forEach(record => store.put(record))
      tx.oncomplete = () => resolve()
      tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('手部素材未能保存，请检查本机空间。'))
    })
  } finally { db.close() }
}
