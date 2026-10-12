import './style.css'
import baselineImage from '../../../../assets/art-stage-jiangnan-v7.png?url'
import { mountGestureLab } from './gesture-lab'
import { mountSandProduct } from '../product/main'

// 首屏为实时沙台；下方目标图仅用于构图与分镜对照，不作为沙层模拟结果。
const scenes = [
  {
    title: '烟雨归舟', subtitle: '远景 · 水雾与归途', image: 'scene-1.png',
    alt: '原创沙画美术目标：暖色灯箱上的江南归舟，前景柳树、中景舟桥与远处水雾形成空间层次',
    text: '近岸压深，水雾留亮。让柳枝、舟桥和远处屋舍依次退入灰色，归舟成为画面的视觉落点。',
    gesture: '细撒铺灰 → 掌侧推出水岸 → 指尖勾出枝条与舟桥',
    transition: '转场设计：沿桥拱聚沙形成斗笠，让江面的亮带延展为衣袖，再组织归人的侧脸和手部。',
  },
  {
    title: '归人近景', subtitle: '中景 · 人物与情绪', image: 'scene-2.png',
    alt: '原创沙画美术目标：江南归人的近景，以侧脸、手部和衣褶的黑白灰表现人物体积与情绪',
    text: '人物从风景中浮现。侧脸与手部承接情绪，衣褶用软灰塑形，细线只落在需要被看见的位置。',
    gesture: '聚沙塑形 → 掌侧提亮衣褶 → 指尖刻画侧脸和手部',
    transition: '转场设计：把左侧柳干整理为窗框，将斗笠的沙移到桌面，再在右上方留出灯火并调整人物位置。',
  },
  {
    title: '灯下思念', subtitle: '近景 · 灯火与记忆', image: 'scene-3.png',
    alt: '原创沙画美术目标：窗边人物与一盏暖灯，深色窗框、柔和面部与远处江南景色形成安静的思念画面',
    text: '灯火落在人物与窗边，外面的江南退入夜色。用大块暗部托起小面积的光，让画面安静下来。',
    gesture: '掌侧组织窗框 → 薄沙柔化面部 → 指尖留出灯火',
    transition: '收束设计：保留灯火与窗外水面，停留在静帧，再用一次掌扫结束。',
  },
] as const
const SCENE_SECONDS = 8
const DURATION = scenes.length * SCENE_SECONDS
const artUrl = (name: string) => new URL(`../generated-sandboard/${name}`, location.href).href
const app = document.querySelector<HTMLElement>('#app')!
app.innerHTML = `
  <div class="atelier-page">
    <a class="skip-link" href="#sand-product">跳到沙台</a>
    <header class="atelier-header">
      <a class="atelier-brand" href="../" aria-label="沙画工作室"><span class="brand-mark" aria-hidden="true">沙</span><span>沙画创作台<small>SAND ART ATELIER</small></span></a>
      <nav aria-label="沙画版本导航"><a href="../memories/">照片沙画</a><a href="../">创作工作室</a><a href="../stage/">基础演示</a><a id="original-link" href="../../">Sandboard 原版 ↗</a></nav>
    </header>
    <main>
      <section id="sand-product" aria-label="实时沙画创作台"></section>
      <details class="product-references"><summary>美术目标、分镜与局部手法试验（保留）</summary>
      <section class="art-intro" aria-labelledby="collection-title">
        <div><p class="eyebrow">原创美术研究 · 第一组作品</p><h2 id="collection-title">月下归舟<span>从一幅画，走向一段故事。</span></h2></div>
        <p class="intro-note">先让造型、明暗与留白成立，<br>再让手势带着画面连续变化。</p>
      </section>
      <section class="art-layout" id="artwork" aria-label="沙画目标作品">
        <div class="art-main">
          <div class="art-toolbar"><span id="art-kind" class="source-label">AI 美术目标图</span><div><button type="button" id="compare" aria-pressed="false">与基础演示对照</button><button type="button" id="open-viewer">放大细节 ↗</button></div></div>
          <button type="button" class="art-frame" id="art-frame" aria-label="放大查看烟雨归舟的细节">
            <img id="main-art" src="${artUrl(scenes[0].image)}" alt="${scenes[0].alt}" fetchpriority="high" />
            <span class="art-load-state" id="art-load-state">正在载入作品…</span><span class="art-frame-hint">点击查看细节</span>
          </button>
          <div class="art-caption"><span id="art-caption">原创构图 · AI 美术参考，实时成品见首屏沙台</span><button type="button" id="download-art">下载目标图 ↓</button></div>
        </div>
        <aside class="scene-note" aria-labelledby="scene-title">
          <p class="scene-number" id="scene-number">第一幕 <span>01 / 03</span></p>
          <h2 id="scene-title">${scenes[0].title}</h2><p class="scene-subtitle" id="scene-subtitle">${scenes[0].subtitle}</p>
          <p class="scene-description" id="scene-description">${scenes[0].text}</p>
          <div class="scene-action"><span>拟用手法</span><p id="scene-gesture">${scenes[0].gesture}</p></div>
          <p class="scene-transition" id="scene-transition">${scenes[0].transition}</p>
          <div class="scene-pager"><button type="button" id="previous-scene" aria-label="上一幕">←</button><span>三幕 · 连续变画设计</span><button type="button" id="next-scene" aria-label="下一幕">→</button></div>
        </aside>
      </section>
      <section class="storyboard" aria-labelledby="storyboard-title">
        <div class="storyboard-heading"><div><p class="eyebrow">构图与转场设计</p><h2 id="storyboard-title">三幕分镜</h2></div><p>预览按顺序切换目标图，<br>用于评估叙事与构图。</p></div>
        <div class="scene-strip" role="group" aria-label="选择分镜">${scenes.map((scene, index) => `
          <button class="scene-choice${index === 0 ? ' active' : ''}" type="button" data-scene="${index}" aria-pressed="${index === 0}"><img src="${artUrl(scene.image)}" alt="" loading="lazy" /><span><small>0${index + 1}</small><strong>${scene.title}</strong><em>${scene.subtitle}</em></span><i aria-hidden="true">↗</i></button>`).join('')}
        </div>
        <div class="preview-controls"><button type="button" id="preview-play" aria-label="播放三幕分镜预览">播放分镜预览</button><button type="button" id="preview-restart" aria-label="回到分镜预览开头">重置</button><label class="preview-timeline"><span class="sr-only">分镜预览进度</span><input type="range" id="preview-time" min="0" max="${DURATION}" step="0.1" value="0" /><output id="preview-time-label">0:00 / 0:24</output></label></div>
        <p class="preview-note">这里保留静帧分镜预览。首屏可分别演示真实成画；三幕连续移沙转场仍待编排。</p>
      </section>
      <section class="gesture-section" aria-labelledby="gesture-title"><div class="storyboard-heading"><div><p class="eyebrow">把明暗落实到手法</p><h2 id="gesture-title">在灯箱上试一试</h2></div><p>细撒、掌推、指刻，<br>从局部痕迹开始。</p></div><div id="gesture-lab"></div></section>
      </details>
    </main>
    <footer class="atelier-footer"><span>原创沙画实验 · 实时成画与手动创作</span><span>原版、工作室与基础演示均保留</span></footer>
    <p class="atelier-status" id="atelier-status" role="status" aria-live="polite"></p>
    <dialog class="detail-dialog" id="detail-dialog" aria-labelledby="detail-title">
      <div class="viewer-shell" id="viewer-shell"><div class="viewer-toolbar"><div><span class="eyebrow" id="detail-kind">AI 美术目标图</span><h2 id="detail-title">烟雨归舟 · 细节</h2></div><button type="button" id="close-viewer" aria-label="关闭细节查看">关闭 ×</button></div>
        <div class="viewer-viewport" id="viewer-viewport" tabindex="0" aria-label="作品细节，可拖动平移，用滚轮或下方按钮缩放"><img id="detail-art" src="${artUrl(scenes[0].image)}" alt="${scenes[0].alt}" draggable="false" /></div>
        <div class="viewer-bottom"><span>拖动平移 · 滚轮缩放 · Esc 关闭</span><div class="zoom-controls"><button type="button" id="zoom-out" aria-label="缩小作品">−</button><output id="zoom-value">100%</output><button type="button" id="zoom-in" aria-label="放大作品">＋</button><button type="button" id="zoom-reset">适合窗口</button><button type="button" id="viewer-fullscreen">全屏</button></div></div>
      </div>
    </dialog>
  </div>`

const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const mainArt = get<HTMLImageElement>('main-art')
const loadState = get<HTMLSpanElement>('art-load-state')
const frame = get<HTMLButtonElement>('art-frame')
const compare = get<HTMLButtonElement>('compare')
const play = get<HTMLButtonElement>('preview-play')
const timeline = get<HTMLInputElement>('preview-time')
const dialog = get<HTMLDialogElement>('detail-dialog')
const viewport = get<HTMLDivElement>('viewer-viewport')
const detailArt = get<HTMLImageElement>('detail-art')
const choices = [...app.querySelectorAll<HTMLButtonElement>('[data-scene]')]
let sceneIndex = 0, showBaseline = false, playing = false, elapsed = 0, lastFrame = 0, animationFrame = 0
let scale = 1, panX = 0, panY = 0
let drag: { id: number; x: number; y: number; initialX: number; initialY: number } | null = null
let statusTimeout: ReturnType<typeof setTimeout> | undefined
const minuteTime = (seconds: number) => `0:${String(Math.floor(seconds)).padStart(2, '0')}`
const tell = (message: string) => {
  get('atelier-status').textContent = message
  if (statusTimeout) clearTimeout(statusTimeout)
  statusTimeout = setTimeout(() => { get('atelier-status').textContent = '' }, 5000)
}

function updateTransport() {
  timeline.value = String(elapsed)
  timeline.style.setProperty('--preview-progress', `${elapsed / DURATION * 100}%`)
  get<HTMLOutputElement>('preview-time-label').value = `${minuteTime(elapsed)} / ${minuteTime(DURATION)}`
  play.textContent = playing ? '暂停分镜预览' : elapsed >= DURATION ? '再看一次分镜' : elapsed > 0 ? '继续分镜预览' : '播放分镜预览'
  play.setAttribute('aria-label', play.textContent)
}

function pausePreview() {
  playing = false
  cancelAnimationFrame(animationFrame)
  lastFrame = 0
  updateTransport()
}

function updateArtwork() {
  const scene = scenes[sceneIndex]
  const source = showBaseline ? baselineImage : artUrl(scene.image)
  loadState.hidden = false
  loadState.textContent = '正在载入作品…'
  mainArt.src = source
  mainArt.alt = showBaseline ? 'v7 基础舞台演示的真实沙层模拟导出：月下江南，包含柳树、桥、舟和月亮' : scene.alt
  frame.setAttribute('aria-label', `放大查看${showBaseline ? '基础演示' : scene.title}的细节`)
  compare.setAttribute('aria-pressed', String(showBaseline))
  compare.textContent = showBaseline ? '返回美术目标图' : '与基础演示对照'
  get('art-kind').textContent = showBaseline ? 'v7 真实模拟导出' : 'AI 美术目标图'
  get('art-caption').textContent = showBaseline ? '《月下江南》· 现有基础演示的真实 PNG 导出' : '原创构图 · AI 美术参考，实时成品见首屏沙台'
  get('download-art').textContent = showBaseline ? '下载基础演示图 ↓' : '下载目标图 ↓'
  get('scene-number').innerHTML = showBaseline ? '保留版本 <span>v7</span>' : `${['第一幕', '第二幕', '第三幕'][sceneIndex]} <span>0${sceneIndex + 1} / 03</span>`
  get('scene-title').textContent = showBaseline ? '月下江南' : scene.title
  get('scene-subtitle').textContent = showBaseline ? '基础演示 · 真实手势成画' : scene.subtitle
  get('scene-description').textContent = showBaseline ? '这是当前保留的基础舞台演示。可对照人物造型、灰阶组织、景物层次与边缘变化，观察下一版需要提升的位置。' : scene.text
  get('scene-gesture').textContent = showBaseline ? '抓沙散撒、细流铺沙、手掌与指尖移沙' : scene.gesture
  get('scene-transition').textContent = showBaseline ? '完整演出与自由绘画可从顶部「基础演示」进入。' : scene.transition
  for (const [index, button] of choices.entries()) {
    const selected = !showBaseline && index === sceneIndex
    button.classList.toggle('active', selected)
    button.setAttribute('aria-pressed', String(selected))
  }
  if (mainArt.complete && mainArt.naturalWidth) loadState.hidden = true
}

function chooseScene(index: number, adjustTimeline = true) {
  pausePreview()
  sceneIndex = (index + scenes.length) % scenes.length
  showBaseline = false
  if (adjustTimeline) elapsed = sceneIndex * SCENE_SECONDS
  updateArtwork()
  updateTransport()
}

function previewFrame(time: number) {
  if (!playing) return
  if (lastFrame) elapsed = Math.min(DURATION, elapsed + Math.min((time - lastFrame) / 1000, 0.15))
  lastFrame = time
  const next = Math.min(scenes.length - 1, Math.floor(elapsed / SCENE_SECONDS))
  if (sceneIndex !== next || showBaseline) { sceneIndex = next; showBaseline = false; updateArtwork() }
  updateTransport()
  if (elapsed >= DURATION) { pausePreview(); tell('三幕分镜预览结束。目标图的连续沙层转场待编排。'); return }
  animationFrame = requestAnimationFrame(previewFrame)
}

play.addEventListener('click', () => {
  if (playing) { pausePreview(); return }
  if (elapsed >= DURATION) elapsed = 0
  sceneIndex = Math.min(scenes.length - 1, Math.floor(elapsed / SCENE_SECONDS))
  showBaseline = false
  updateArtwork()
  playing = true
  updateTransport()
  animationFrame = requestAnimationFrame(previewFrame)
})
get('preview-restart').addEventListener('click', () => chooseScene(0))
timeline.addEventListener('input', () => {
  elapsed = Number(timeline.value)
  chooseScene(Math.min(scenes.length - 1, Math.floor(elapsed / SCENE_SECONDS)), false)
})
choices.forEach((button, index) => button.addEventListener('click', () => chooseScene(index)))
get('previous-scene').addEventListener('click', () => chooseScene(sceneIndex - 1))
get('next-scene').addEventListener('click', () => chooseScene(sceneIndex + 1))
compare.addEventListener('click', () => { pausePreview(); showBaseline = !showBaseline; updateArtwork() })
mainArt.addEventListener('load', () => { loadState.hidden = true })
mainArt.addEventListener('error', () => { loadState.hidden = false; loadState.textContent = '作品暂未载入，请稍后刷新重试。' })

get('download-art').addEventListener('click', () => {
  if (!mainArt.naturalWidth) { tell('请等待作品载入后再下载。'); return }
  const link = document.createElement('a')
  link.href = mainArt.src
  link.download = showBaseline ? '月下江南-v7真实模拟.png' : `月下归舟-${sceneIndex + 1}-${scenes[sceneIndex].title}-AI美术目标.png`
  document.body.append(link)
  link.click()
  link.remove()
  tell(showBaseline ? '已开始下载基础演示导出图。' : '已开始下载 AI 美术目标图。')
})

function updateZoom() {
  const rect = viewport.getBoundingClientRect()
  // 以 object-fit: contain 后的真实图片边界限制平移，避免留白区域被拖入视野。
  const imageWidth = detailArt.naturalWidth || rect.width, imageHeight = detailArt.naturalHeight || rect.height
  const fit = Math.min(rect.width / imageWidth, rect.height / imageHeight)
  const limitX = Math.max(0, (imageWidth * fit * scale - rect.width) / 2)
  const limitY = Math.max(0, (imageHeight * fit * scale - rect.height) / 2)
  panX = Math.max(-limitX, Math.min(limitX, panX))
  panY = Math.max(-limitY, Math.min(limitY, panY))
  detailArt.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`
  get<HTMLOutputElement>('zoom-value').value = `${Math.round(scale * 100)}%`
  get<HTMLButtonElement>('zoom-out').disabled = scale <= 1
  get<HTMLButtonElement>('zoom-in').disabled = scale >= 4
  viewport.classList.toggle('zoomed', scale > 1)
}
function setZoom(value: number) { scale = Math.max(1, Math.min(4, value)); updateZoom() }
function openViewer() {
  if (!mainArt.naturalWidth) { tell('请等待作品载入后再查看细节。'); return }
  pausePreview()
  detailArt.src = mainArt.src
  detailArt.alt = mainArt.alt
  get('detail-title').textContent = `${showBaseline ? '月下江南 · 基础演示' : scenes[sceneIndex].title} · 细节`
  get('detail-kind').textContent = showBaseline ? 'v7 真实模拟导出' : 'AI 美术目标图'
  scale = 1; panX = 0; panY = 0
  dialog.showModal()
  updateZoom()
}
frame.addEventListener('click', openViewer)
get('open-viewer').addEventListener('click', openViewer)
get('close-viewer').addEventListener('click', () => dialog.close())
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close() })
dialog.addEventListener('close', () => {
  drag = null
  if (document.fullscreenElement && get('viewer-shell').contains(document.fullscreenElement)) void document.exitFullscreen().catch(() => {})
})
get('zoom-out').addEventListener('click', () => setZoom(scale / 1.25))
get('zoom-in').addEventListener('click', () => setZoom(scale * 1.25))
get('zoom-reset').addEventListener('click', () => { panX = 0; panY = 0; setZoom(1) })
detailArt.addEventListener('load', updateZoom)
viewport.addEventListener('wheel', event => { event.preventDefault(); setZoom(scale * Math.exp(-event.deltaY * 0.0015)) }, { passive: false })
viewport.addEventListener('pointerdown', event => {
  if (event.button !== 0 || scale <= 1) return
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, initialX: panX, initialY: panY }
  viewport.setPointerCapture(event.pointerId)
})
viewport.addEventListener('pointermove', event => {
  if (drag?.id !== event.pointerId) return
  panX = drag.initialX + event.clientX - drag.x
  panY = drag.initialY + event.clientY - drag.y
  updateZoom()
})
const endDrag = () => { drag = null }
viewport.addEventListener('pointerup', endDrag)
viewport.addEventListener('pointercancel', endDrag)
viewport.addEventListener('lostpointercapture', endDrag)
viewport.addEventListener('keydown', event => {
  if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoom(scale * 1.25) }
  if (event.key === '-') { event.preventDefault(); setZoom(scale / 1.25) }
  if (event.key.startsWith('Arrow')) {
    event.preventDefault()
    if (event.key === 'ArrowLeft') panX += 40
    if (event.key === 'ArrowRight') panX -= 40
    if (event.key === 'ArrowUp') panY += 40
    if (event.key === 'ArrowDown') panY -= 40
    updateZoom()
  }
})
get('viewer-fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await get('viewer-shell').requestFullscreen()
  } catch { tell('此浏览器暂不支持全屏，可使用放大与拖动查看作品。') }
})
document.addEventListener('fullscreenchange', () => {
  get('viewer-fullscreen').textContent = document.fullscreenElement ? '退出全屏' : '全屏'
  updateZoom()
})
document.addEventListener('visibilitychange', () => { if (document.hidden) pausePreview() })
document.addEventListener('keydown', event => {
  if (dialog.open || event.target instanceof HTMLElement && event.target.closest('button, input, textarea, select, a, canvas, [contenteditable]')) return
  if (event.key === 'ArrowLeft') { event.preventDefault(); chooseScene(sceneIndex - 1) }
  if (event.key === 'ArrowRight') { event.preventDefault(); chooseScene(sceneIndex + 1) }
})
window.addEventListener('resize', () => { if (dialog.open) updateZoom() })
window.addEventListener('pagehide', event => {
  pausePreview()
  if (statusTimeout) clearTimeout(statusTimeout)
  // 缓存返回时保留练习状态；离开并卸载文档时释放实验的事件监听和动画。
  if (!event.persisted) { disposeGestureLab(); disposeProduct() }
})

if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') && (location.port === '4174' || location.port === '4176')) {
  get<HTMLAnchorElement>('original-link').href = `http://${location.hostname}:4173/1008_codex_project/001-sandboard/`
}
updateArtwork()
updateTransport()
const disposeGestureLab = mountGestureLab(get('gesture-lab'))
const disposeProduct = mountSandProduct(get('sand-product'), scenes.map(scene => ({ title: scene.title, image: artUrl(scene.image) })))
