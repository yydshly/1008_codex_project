import '../platform/home.css'
import './style.css'
import './history-view'
import { appRoot, escape } from '../platform/paths'
import { readCollection, selectWorks, workPath, type GalleryWork, type WorkKind } from './collection'
import { handExamples, examplePath } from '../examples/catalog'
import { examplePreview } from '../examples/media'
import { modeLabels, toolLabels, type ArtTool } from '../model'

const get = <E extends HTMLElement>(id: string) => document.getElementById(id) as E
let works: GalleryWork[] = [], unavailable: WorkKind[] = [], kind: WorkKind | 'all' = 'all'
let query = '', order = 'newest', loading = false
const urls = new Map<string, string>()
const dialog = get<HTMLDialogElement>('preview-dialog')
const workURL = (work: GalleryWork, exhibit = false) => new URL(workPath(work, exhibit), appRoot).href
const dateLabel = (date: string) => Number.isNaN(Date.parse(date)) ? '保存时间未记录' : new Date(date).toLocaleDateString('zh-CN')
function releasePreviews() { urls.forEach(url => URL.revokeObjectURL(url)); urls.clear() }
function render() {
  const visible = selectWorks(works, kind, query, order)
  for (const name of ['all', 'hand', 'photo'] as const) get(`count-${name}`).textContent = String(name === 'all' ? works.length : works.filter(work => work.kind === name).length)
  get('jump-saved-count').textContent = String(works.length)
  document.querySelectorAll<HTMLButtonElement>('button[data-kind]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.kind === kind)))
  get('work-result').textContent = loading ? '正在读取作品…' : `显示 ${visible.length} / ${works.length} 件作品${unavailable.length ? ' · 部分作品库暂不可用' : ''}`
  get('work-grid').innerHTML = visible.map(work => {
    const preview = urls.get(work.key), key = escape(work.key), title = escape(work.title)
    return `<article class="saved-work" data-kind="${work.kind}"><div class="work-picture">${preview ? `<button class="preview-button" data-preview="${key}" aria-label="预览 ${title}"><img src="${preview}" alt="${title}的沙画作品" loading="lazy"></button>` : `<div class="missing-preview"><span>沙</span><p>这件早期作品未保存缩略图</p><a href="${workURL(work)}">打开原画台查看 ↗</a></div>`}<span class="kind-badge">${work.kind === 'hand' ? '手绘' : '照片'}</span></div><div class="work-copy"><p class="technique">${escape(work.technique)}<time datetime="${escape(work.date)}">${dateLabel(work.date)}</time></p><h2>${title}</h2><p class="work-story">${escape(work.caption || (work.kind === 'hand' ? '你的沙层与工具设置一起保留，随时可以继续画。' : '收藏的照片沙画。'))}</p><p class="source-label">${escape(work.sourceLabel)}</p><div class="work-actions"><a class="continue-link" href="${workURL(work)}" aria-label="继续创作 ${title}">继续创作 ↗</a>${work.kind === 'photo' ? `<a href="${workURL(work, true)}" aria-label="展映 ${title}">展映 ↗</a>` : ''}</div></div></article>`
  }).join('')
  get('empty').hidden = loading || visible.length > 0
  const filtered = kind !== 'all' || !!query.trim()
  get('empty-title').textContent = unavailable.length ? '部分作品尚未读到。' : works.length && filtered ? '没有找到匹配的作品。' : kind === 'hand' ? '留下一幅亲手画的沙画。' : kind === 'photo' ? '留住照片里的那一刻。' : '你的第一幅作品，从这里开始。'
  get('empty-text').textContent = unavailable.length ? '点击“刷新作品”重试。你仍可以回到原作品集查看收藏。' : works.length && filtered ? '试试其他名称或故事关键词，也可以查看全部作品。' : '在画台中点击保存，作品就会出现在这里。'
  get('reset-filters').hidden = !filtered
}
async function refresh() {
  if (loading) return
  loading = true; get<HTMLButtonElement>('refresh').disabled = true
  get('work-grid').setAttribute('aria-busy', 'true'); render()
  try {
    const result = await readCollection()
    works = result.works; unavailable = result.unavailable
    dialog.close(); releasePreviews()
    works.forEach(work => { if (work.preview) urls.set(work.key, URL.createObjectURL(work.preview)) })
    get('load-warning').hidden = unavailable.length === 0
    get('load-warning').textContent = unavailable.map(name => name === 'hand' ? '手绘作品库暂时读取失败。' : '照片作品库暂时读取失败。').join(' ') + ' 可以刷新重试，或打开页面底部的原作品集。'
  } finally {
    loading = false; get<HTMLButtonElement>('refresh').disabled = false
    get('work-grid').setAttribute('aria-busy', 'false'); render()
  }
}
function updateFilter() {
  const params = new URLSearchParams(location.hash.slice(1)), requested = params.get('type')
  kind = requested === 'hand' || requested === 'photo' ? requested : 'all'
  render()
  // Existing hand/photo collection links should still land on saved works.
  if (kind !== 'all') get('works').scrollIntoView({ block: 'start' })
}
get('kind-filters').addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-kind]')
  if (!button) return
  kind = button.dataset.kind as typeof kind
  history.replaceState(null, '', kind === 'all' ? location.pathname + location.search : '#type=' + kind); render()
})
get('work-search').addEventListener('input', () => { query = get<HTMLInputElement>('work-search').value; render() })
get('work-sort').addEventListener('change', () => { order = get<HTMLSelectElement>('work-sort').value; render() })
get('reset-filters').addEventListener('click', () => { kind = 'all'; query = ''; get<HTMLInputElement>('work-search').value = ''; history.replaceState(null, '', location.pathname + location.search); render() })
get('refresh').addEventListener('click', () => { void refresh() })
get('work-grid').addEventListener('click', event => {
  const key = (event.target as Element).closest<HTMLButtonElement>('[data-preview]')?.dataset.preview
  const work = works.find(work => work.key === key), preview = key && urls.get(key)
  if (!work || !preview) return
  get('preview-title').textContent = work.title
  get<HTMLImageElement>('preview-image').src = preview; get<HTMLImageElement>('preview-image').alt = work.title + '的沙画作品'
  get('preview-caption').textContent = work.caption || work.technique
  get<HTMLAnchorElement>('preview-edit').href = workURL(work)
  get<HTMLAnchorElement>('preview-exhibit').href = workURL(work, true); get('preview-exhibit').hidden = work.kind !== 'photo'
  dialog.showModal()
})
get('close-preview').addEventListener('click', () => dialog.close())
function renderExamples() {
  const tool = get<HTMLSelectElement>('example-tool').value as ArtTool | 'all'
  const visible = handExamples.filter(example => tool === 'all' || example.tool === tool)
  get('example-count').textContent = String(handExamples.length)
  get('example-grid').innerHTML = visible.map(example => {
    const href = new URL(examplePath(example.id), appRoot).href, preview = examplePreview(example.id)
    return `<article class="saved-work example-card" data-example="${example.id}"><a class="work-picture example-picture" href="${href}" aria-label="试画 ${escape(example.title)}">${preview ? `<img src="${preview}" alt="${escape(example.title)}在原画台中的实际沙层效果" width="1536" height="1152" loading="lazy">` : `<span class="missing-preview">${toolLabels[example.tool]} · 可直接试画</span>`}<span class="kind-badge">示例 · ${toolLabels[example.tool]}</span><span class="try-overlay">点击画面，进入原画台 ↗</span></a><div class="work-copy"><p class="technique">${modeLabels[example.mode]} · ${toolLabels[example.tool]}</p><h2>${escape(example.title)}</h2><p class="work-story">${escape(example.description)}</p><p class="source-label">${escape(example.source)}</p><div class="work-actions"><a class="continue-link" href="${href}" aria-label="进入原画台 ${escape(example.title)}">打开示例，动手试画 ↗</a></div></div></article>`
  }).join('')
}
get('example-tool').addEventListener('change', renderExamples)
renderExamples()
window.addEventListener('hashchange', updateFilter)
window.addEventListener('pageshow', event => { if (event.persisted) void refresh() })
window.addEventListener('pagehide', event => { if (!event.persisted) releasePreviews() })
const scrollSavedCollection = () => { if (kind !== 'all') get('works').scrollIntoView({ block: 'start' }) }
window.addEventListener('load', scrollSavedCollection, { once: true })
updateFilter(); void refresh().then(scrollSavedCollection)
