import type { ArtMode, ArtTool, LightPreset, PourStyle } from './model'
import { validateSavedArt } from './project-file'

export type SavedArt = {
  version: 1
  width: number
  height: number
  mode: ArtMode
  state: ArrayBuffer
  referenceState?: ArrayBuffer
  referenceImage?: { blob: Blob; name: string }
  savedAt: string
  title?: string
  paintingId?: string
  settings: {
    tool: ArtTool; radius: number; strength: number; wetness: number; wind: number; light: LightPreset; flow?: boolean
    palmAngle?: number; palmAspect?: number; referenceVisible?: boolean; referenceOpacity?: number; referenceGrid?: boolean
    pourStyle?: PourStyle; pourHeight?: number; pourSpread?: number
  }
  conversion?: { blackPoint: number; whitePoint: number; gamma: number; invert: boolean; minHeight: number; maxHeight: number }
}
export type PaintingMetadata = { id: string; title: string; mode: ArtMode; date: string; thumbnail?: Blob }
type PaintingRecord = PaintingMetadata & { art: SavedArt }

async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sandboard-art-experiment', 2)
    let blocked = false
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('paintings')) request.result.createObjectStore('paintings', { keyPath: 'mode' })
      if (!request.result.objectStoreNames.contains('gallery')) request.result.createObjectStore('gallery', { keyPath: 'id' })
    }
    request.onsuccess = () => {
      if (blocked) { request.result.close(); return }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => reject(request.error ?? new Error('无法打开本地作品存储'))
    request.onblocked = () => { blocked = true; reject(new Error('另一个页面正在使用旧版作品存储，请刷新该页面后重试。')) }
  })
}

export async function saveArt(art: SavedArt) {
  const checked = validateSavedArt(art)
  const db = await database()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('paintings', 'readwrite')
      transaction.objectStore('paintings').put(checked)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('保存草稿失败'))
      transaction.onabort = () => reject(transaction.error ?? new Error('保存草稿被中断'))
    })
  } finally { db.close() }
}

export async function loadArt(mode: ArtMode): Promise<SavedArt | undefined> {
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('paintings', 'readonly').objectStore('paintings').get(mode)
      request.onsuccess = () => { try { resolve(request.result === undefined ? undefined : validateSavedArt(request.result)) } catch (error) { reject(error) } }
      request.onerror = () => reject(request.error ?? new Error('读取草稿失败'))
    })
  } finally { db.close() }
}

function paintingTitle(title: string) {
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 80) throw new Error('作品名称应为 1–80 个字符。')
  return title.trim()
}
function paintingId(id: string) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(id)) throw new Error('作品编号无效。')
  return id
}
function thumbnailImage(blob?: Blob) {
  if (blob !== undefined && (!(blob instanceof Blob) || blob.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(blob.type))) throw new Error('作品缩略图须为小于 5 MB 的 PNG、JPEG 或 WebP。')
  return blob
}
function transactionDone(transaction: IDBTransaction, failure: string): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error(failure))
    transaction.onabort = () => reject(transaction.error ?? new Error(`${failure}：操作被中断`))
  })
}

/** id 省略即另存副本；传入明确的 id 才覆盖原作品。自动草稿不会调用此接口。 */
export async function savePainting(art: SavedArt, title: string, id?: string, thumbnailBlob?: Blob): Promise<string> {
  const checked = validateSavedArt(art)
  const name = paintingTitle(title)
  const key = id === undefined ? crypto.randomUUID() : paintingId(id)
  const thumbnail = thumbnailImage(thumbnailBlob)
  const db = await database()
  try {
    const transaction = db.transaction('gallery', 'readwrite')
    const complete = transactionDone(transaction, '保存作品失败')
    const store = transaction.objectStore('gallery')
    const previous = store.get(key)
    previous.onsuccess = () => {
      const record: PaintingRecord = { id: key, title: name, mode: checked.mode, date: checked.savedAt, art: { ...checked, title: name, paintingId: key } }
      const retainedThumbnail = thumbnail ?? (previous.result as PaintingRecord | undefined)?.thumbnail
      if (retainedThumbnail) record.thumbnail = retainedThumbnail
      store.put(record)
    }
    await complete
    return key
  } finally { db.close() }
}

export async function listPaintings(): Promise<PaintingMetadata[]> {
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const paintings: PaintingMetadata[] = []
      const request = db.transaction('gallery', 'readonly').objectStore('gallery').openCursor()
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) { resolve(paintings.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))); return }
        const record = cursor.value as PaintingRecord
        paintings.push({ id: record.id, title: record.title, mode: record.mode, date: record.date, ...(record.thumbnail ? { thumbnail: record.thumbnail } : {}) })
        cursor.continue()
      }
      request.onerror = () => reject(request.error ?? new Error('读取作品集失败'))
    })
  } finally { db.close() }
}

export async function loadPainting(id: string): Promise<SavedArt | undefined> {
  const key = paintingId(id)
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('gallery', 'readonly').objectStore('gallery').get(key)
      request.onsuccess = () => { try {
        const record = request.result as PaintingRecord | undefined
        resolve(record ? validateSavedArt({ ...record.art, title: record.title, paintingId: record.id }) : undefined)
      } catch (error) { reject(error) } }
      request.onerror = () => reject(request.error ?? new Error('读取作品失败'))
    })
  } finally { db.close() }
}

export async function deletePainting(id: string) {
  const key = paintingId(id)
  const db = await database()
  try {
    const transaction = db.transaction('gallery', 'readwrite')
    const complete = transactionDone(transaction, '删除作品失败')
    transaction.objectStore('gallery').delete(key)
    await complete
  } finally { db.close() }
}
