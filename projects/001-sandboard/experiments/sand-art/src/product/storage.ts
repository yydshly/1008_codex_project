import type { StageMaterialSnapshot } from '../stage/material'
export interface ProductDraft { version: 1; title: string; snapshot: StageMaterialSnapshot; savedAt: string }
let database: Promise<IDBDatabase> | undefined
function open() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('sandboard-atelier-product', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('drafts')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => { database = undefined; reject(request.error ?? new Error('创作台草稿存储不可用。')) }
  })
}
export async function readProductDraft(): Promise<ProductDraft | undefined> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const request = db.transaction('drafts', 'readonly').objectStore('drafts').get('current')
    request.onsuccess = () => resolve(request.result?.version === 1 ? request.result : undefined)
    request.onerror = () => reject(request.error ?? new Error('草稿读取失败。'))
  })
}
export async function writeProductDraft(draft: ProductDraft): Promise<void> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', 'readwrite')
    transaction.objectStore('drafts').put(draft, 'current')
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('草稿保存失败。'))
    transaction.onabort = () => reject(transaction.error ?? new Error('草稿保存被中止。'))
  })
}
