import { appRoot, escape } from '../platform/paths'
import { historicalWorks, historyGroups, historyKinds, historicalVersion, historicalRecord, selectHistoricalWorks, type HistoricalWork } from './history'
import { historyMedia } from './history-media'

const get = <E extends HTMLElement>(id: string) => document.getElementById(id) as E
const href = (path: string) => new URL(path, appRoot).href
const dialog = get<HTMLDialogElement>('history-dialog')
const video = get<HTMLVideoElement>('history-video')
const pageSize = 6
let expanded = false
let selected: HistoricalWork | undefined
const videoNotes: Record<string, string> = {
  v5: '20秒完整山月演示，使用有限三把沙预算；手形为程序提示。',
  v18: '10秒生成手部合成小样；手部纹理由AI生成。',
  v20: '20秒三维接触小样，保存于v20；不是实拍。',
  v22: '24秒取沙、握持与漏沙小样，保存于v23；不是实拍。',
  v24: '12秒无手芦苇完整小样。',
  v25: '保存于v25的完整雨窗无手过程，输入为AI虚构照片。',
  v29: '单笔收沙慢动作片段，不是完整成画录像。',
  v30: '细部撒沙片段，不是完整成画录像。',
  v31: '30秒茶杯九动作完整小样。',
  v34: '45秒杯身塑形纪念短片，含故事字幕。',
  v36: '45秒局部推拢纪念短片；真实沙画质感仍未达标。',
}
function renderHistory() {
  const matches = selectHistoricalWorks(get<HTMLSelectElement>('history-group').value, get<HTMLInputElement>('history-search').value,
    get<HTMLSelectElement>('history-kind').value)
  const visible = expanded ? matches : matches.slice(0, pageSize)
  get('history-count').textContent = String(historicalWorks.length)
  get('history-result').textContent = `显示 ${visible.length} / ${matches.length} 项 · 历史目录共 ${historicalWorks.length} 项，覆盖v1–v36`
  get('history-empty').hidden = matches.length > 0
  get('history-more').hidden = matches.length <= pageSize
  get('history-more').textContent = expanded ? '收起目录' : `展开其余 ${matches.length - visible.length} 项`
  get('history-grid').innerHTML = visible.map(work => {
    const version = historicalVersion(work), title = escape(work.title)
    return `<article class="saved-work history-card" data-history="${work.id}"><div class="work-picture"><button class="preview-button" data-history-open="${work.id}" aria-label="查看 ${title}"><img src="${historyMedia(work.image, appRoot)}" alt="${title} · ${escape(historyKinds[work.kind])} · ${version}" loading="lazy"></button><span class="kind-badge" data-material="${work.kind}">${historyKinds[work.kind]}</span></div><div class="work-copy"><p class="technique">${version} · ${historyGroups[work.group]}</p><h2>${title}</h2><p class="work-story">${escape(work.description)}</p><p class="source-label">${escape(work.source)}</p><div class="work-actions history-actions">${work.video ? `<button class="history-link" data-history-video="${work.id}">看保存录像 ▶</button>` : work.process ? `<a href="${href(work.process)}">打开成画过程 ↗</a>` : `<button class="history-link" data-history-open="${work.id}">查看作品</button>`}${work.platform ? `<a class="continue-link" href="${href(work.platform)}">${work.kind === 'editable' ? '打开对应画台' : '打开保留平台'} ↗</a>` : `<a href="${href(historicalRecord(work))}">来源与尝试 ↗</a>`}</div></div></article>`
  }).join('')
}
function stopVideo() { video.pause(); video.removeAttribute('src'); video.load(); video.hidden = true }
function showHistory(id: string, watch = false) {
  selected = historicalWorks.find(work => work.id === id)
  if (!selected) return
  stopVideo()
  const work = selected, image = get<HTMLImageElement>('history-image')
  image.src = historyMedia(work.image, appRoot); image.alt = work.title + ' · ' + historyKinds[work.kind]
  image.hidden = false
  get('history-title').textContent = work.title
  get('history-label').textContent = historicalVersion(work) + ' · ' + historyKinds[work.kind]
  get('history-caption').textContent = work.description + '\n' + work.source
  get<HTMLAnchorElement>('history-record').href = href(historicalRecord(work))
  const platform = get<HTMLAnchorElement>('history-platform')
  platform.hidden = !work.platform
  if (work.platform) platform.href = href(work.platform)
  platform.textContent = work.kind === 'editable' ? '打开对应画台，接着创作 ↗' : '打开保留平台 ↗'
  const process = get<HTMLAnchorElement>('history-process')
  process.hidden = !work.process
  if (work.process) process.href = href(work.process)
  get('history-watch').hidden = !work.video
  get('history-watch').textContent = '看保存录像 ▶'
  get('history-note').textContent = work.kind === 'target'
    ? '这张图是AI生成的美术目标，不是沙层模拟成品，也没有可接管的沙层。'
    : work.kind === 'editable' ? '打开画台后可播放、暂停，再点击「接过这幅画」修改。进入演示不会覆盖已有草稿。'
    : '图片与录像记录当时版本；原平台可能包含后续保留模式，打开后请按版本选择。'
  if (!dialog.open) dialog.showModal()
  if (watch && work.video) watchSelected()
}
function watchSelected() {
  if (!selected?.video) return
  const work = selected
  get('history-image').hidden = true; video.hidden = false
  video.src = historyMedia(work.video!, appRoot); video.poster = historyMedia(work.image, appRoot); video.load()
  get('history-note').textContent = videoNotes[work.id] ?? '当时版本保存的实际过程录像。'
  get('history-watch').hidden = true
  // Playback is requested by a click; browser codec/autoplay failures remain recoverable.
  void video.play().catch(() => { get('history-note').textContent += ' 请使用视频播放按钮继续。' })
}
get('history-grid').addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-history-open],[data-history-video]')
  if (button) showHistory(button.dataset.historyOpen ?? button.dataset.historyVideo!, !!button.dataset.historyVideo)
})
function filterHistory() {
  expanded = false; renderHistory()
  // Shorter results can clamp the old scroll offset into the private collection.
  // Keep the changed filter and its matching works together in view.
  get('history').scrollIntoView({ block: 'start' })
}
for (const id of ['history-group', 'history-kind']) get(id).addEventListener('change', filterHistory)
get('history-search').addEventListener('input', filterHistory)
get('history-more').addEventListener('click', () => {
  expanded = !expanded; renderHistory()
  if (!expanded) get('history').scrollIntoView({ block: 'start' })
})
get('history-watch').addEventListener('click', watchSelected)
get('history-close').addEventListener('click', () => dialog.close())
dialog.addEventListener('close', () => { stopVideo(); selected = undefined })
video.addEventListener('error', () => { if (video.getAttribute('src')) get('history-note').textContent = '录像未能播放，可以打开来源记录查看原文件；图片和原平台仍可访问。' })
document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause() })
window.addEventListener('pagehide', () => { if (dialog.open) dialog.close(); else stopVideo() })
renderHistory()
