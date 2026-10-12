import { findHandExample } from './catalog'
import { validateSavedArt } from '../project-file'
import { saveArt, type SavedArt } from '../storage'

function checkedId(id: string) { if (!findHandExample(id)) throw new Error('没有这个手绘示例。'); return id }
function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('sandboard-handdraw-examples', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'id' })
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result) }
    request.onerror = () => reject(request.error ?? new Error('示例试画暂存不可用。'))
    request.onblocked = () => reject(new Error('示例试画存储被另一个页面占用。'))
  })
}
export async function readExampleDraft(id: string): Promise<SavedArt | undefined> {
  checkedId(id); const db = await open()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('drafts', 'readonly').objectStore('drafts').get(id)
      request.onsuccess = () => { try { resolve(request.result ? validateSavedArt(request.result.art) : undefined) } catch (error) { reject(error) } }
      request.onerror = () => reject(request.error ?? new Error('试画暂存读取失败。'))
    })
  } finally { db.close() }
}
export async function writeWorkspaceDraft(art: SavedArt, exampleId?: string) {
  if (!exampleId) return saveArt(art)
  checkedId(exampleId); validateSavedArt(art)
  const db = await open()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite'); tx.objectStore('drafts').put({ id: exampleId, art })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('试画暂存保存失败。'))
      tx.onabort = () => reject(tx.error ?? new Error('试画暂存保存中止。'))
    })
  } finally { db.close() }
}
