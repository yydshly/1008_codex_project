import { listPaintings, type PaintingMetadata } from '../storage'
import { listPhotoWorkMetadata, type PhotoWorkMetadata } from '../memories/storage'

export type WorkKind = 'hand' | 'photo'
export interface GalleryWork {
  key: string; id: string; kind: WorkKind; title: string; caption: string; date: string
  preview?: Blob; technique: string; sourceLabel: string
}
const moodNames = { warm: '温暖', memory: '怀旧', quiet: '静谧', bold: '强烈' }
export async function readCollection(readers: {
  hand: () => Promise<PaintingMetadata[]>; photo: () => Promise<PhotoWorkMetadata[]>
} = { hand: listPaintings, photo: listPhotoWorkMetadata }) {
  const [hand, photo] = await Promise.allSettled([readers.hand(), readers.photo()])
  const works: GalleryWork[] = [], unavailable: WorkKind[] = []
  if (hand.status === 'fulfilled') works.push(...hand.value.map(work => ({
    key: `hand:${work.id}`, id: work.id, kind: 'hand' as const, title: work.title, caption: '', date: work.date,
    preview: work.thumbnail, technique: work.mode === 'surface' ? '沙面绘画' : '灯箱沙画', sourceLabel: '手绘作品'
  })))
  else unavailable.push('hand')
  if (photo.status === 'fulfilled') works.push(...photo.value.map(work => ({
    key: `photo:${work.id}`, id: work.id, kind: 'photo' as const, title: work.title, caption: work.caption,
    date: work.updatedAt, preview: work.image, technique: `${work.style === 'portrait' ? '留白人像' : '照片影调'} · ${moodNames[work.mood] ?? '沙画'}`,
    sourceLabel: work.sourceKind === 'ai-sample' ? '照片作品 · AI 示例原照' : '照片作品 · 自有照片'
  })))
  else unavailable.push('photo')
  return { works: selectWorks(works), unavailable }
}
export function selectWorks(works: GalleryWork[], kind: WorkKind | 'all' = 'all', query = '', order = 'newest') {
  const term = query.trim().toLocaleLowerCase()
  const timestamp = (work: GalleryWork) => Date.parse(work.date) || 0
  return works.filter(work => (kind === 'all' || work.kind === kind) &&
    [work.title, work.caption, work.technique, work.sourceLabel].join(' ').toLocaleLowerCase().includes(term))
    .sort((a, b) => order === 'title' ? a.title.localeCompare(b.title, 'zh-CN') :
      (order === 'oldest' ? 1 : -1) * (timestamp(a) - timestamp(b)) || a.key.localeCompare(b.key))
}
export function workPath(work: GalleryWork, exhibit = false) {
  return work.kind === 'hand' ? `#work=${encodeURIComponent(work.id)}` :
    `memories/#${exhibit ? 'work' : 'edit'}=${encodeURIComponent(work.id)}`
}
