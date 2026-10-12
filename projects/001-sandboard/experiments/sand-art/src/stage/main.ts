import './style.css'
import { createStageInterface } from './interface'
import { StageMaterial, type StageContact, type StageMaterialSnapshot, type StagePoint } from './material'
import { chapters, sampleShow, SHOW_DURATION, SHOW_STEP, type StageHand } from './show'
import { drawStageHand } from './hand'
import { loadStageDraft, saveStageDraft } from './storage'

const ui = createStageInterface(document.querySelector<HTMLElement>('#app')!)
const context = ui.canvas.getContext('2d', { alpha: false })
if (!context) throw new Error('此浏览器不能创建沙画灯箱。')
const ctx = context
const TOTAL_TICKS = Math.round(SHOW_DURATION / SHOW_STEP)
const CHECKPOINT_INTERVAL = Math.round(8 / SHOW_STEP)
const checkpoints = new Map<number, StageMaterialSnapshot>()
let showMaterial = new StageMaterial()
const manualMaterial = new StageMaterial()
checkpoints.set(0, showMaterial.read())
let tick = 0, playing = false, seeking = false, ready = false, disposed = false
let generation = 0, previousTime = 0, accumulator = 0, frameId = 0
let scene: 'show' | 'manual' = 'show'
let manualTool = 'scatter'
let manualHand: StageHand | null = null
let draggingTimeline = false
let saveTimer: ReturnType<typeof setTimeout> | undefined
let savedDraft = false
let paintNeeded = true
let saveQueue: Promise<void> = Promise.resolve()
const history: StageMaterialSnapshot[] = []
type Pointer = { point: StagePoint; pressure: number; held: boolean; queue: StageContact[] }
const pointers = new Map<number, Pointer>()
const listeners = new AbortController()
const signal = listeners.signal
ui.timeline.max = String(TOTAL_TICKS)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  if (location.port === '4174' || location.port === '4176') ui.baselineLink.href = `http://${location.hostname}:4173/1008_codex_project/001-sandboard/`
}
for (const [index, button] of ui.chapterButtons.entries()) button.querySelector('strong')!.textContent = chapters[index].label.split(' · ')[1]
const tell = (text: string) => { ui.status.textContent = text }
const setText = (element: HTMLElement, value: string) => { if (element.textContent !== value) element.textContent = value }
const errorText = (error: unknown) => error instanceof Error ? error.message : String(error)
const timeLabel = (ticks: number) => `${String(Math.floor(ticks * SHOW_STEP / 60)).padStart(1, '0')}:${String(Math.floor(ticks * SHOW_STEP) % 60).padStart(2, '0')}`

function updateControls() {
  const sample = sampleShow(tick * SHOW_STEP), manual = scene === 'manual'
  ui.play.disabled = !ready || seeking || manual
  ui.restart.disabled = !ready
  ui.timeline.disabled = !ready || manual
  ui.speed.disabled = !ready || manual
  ui.manual.disabled = !ready
  setText(ui.manual, manual ? '返回演出' : '我也来画一幅')
  ui.manualPanel.hidden = !manual
  setText(ui.play, playing ? '暂停表演' : tick === TOTAL_TICKS ? '再看一次' : tick ? '继续表演' : '播放表演')
  setText(ui.chapterLabel, manual ? '你的灯箱 · 自由沙画' : sample.title)
  setText(ui.instruction, manual ? '散撒铺明暗，细流画轮廓；用指尖和手掌移沙留白。手绘草稿单独保存在此浏览器。' : sample.instruction)
  if (!draggingTimeline && !seeking) ui.timeline.value = String(tick)
  ui.timelineTime.value = `${timeLabel(draggingTimeline || seeking ? Number(ui.timeline.value) : tick)} / ${timeLabel(TOTAL_TICKS)}`
  ui.timeline.style.setProperty('--range-progress', `${Number(ui.timeline.value) / TOTAL_TICKS * 100}%`)
  for (let index = 0; index < ui.chapterButtons.length; index++) { const selected = !manual && sample.chapter === index; ui.chapterButtons[index].disabled = !ready; ui.chapterButtons[index].setAttribute('aria-pressed', String(selected)); ui.chapterButtons[index].classList.toggle('active', selected) }
  for (const button of ui.toolButtons) { const selected = button.dataset.tool === manualTool; button.disabled = !manual || !ready; button.setAttribute('aria-pressed', String(selected)); button.classList.toggle('active', selected) }
  ui.brushSize.disabled = !manual; ui.brushStrength.disabled = !manual; ui.clear.disabled = !manual; ui.undo.disabled = !manual || !history.length
  ui.exportPng.disabled = !ready || seeking
  ui.canvas.setAttribute('aria-label', manual ? '独立手绘沙画灯箱，按住并拖动铺沙或移沙' : '月下江南连续沙画表演，可暂停或拖动时间轴')
}
function resize() {
  const rect = ui.canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 2)
  const width = Math.max(1, Math.round(rect.width * ratio)), height = Math.max(1, Math.round(rect.height * ratio))
  if (ui.canvas.width !== width || ui.canvas.height !== height) { ui.canvas.width = width; ui.canvas.height = height }
}
function render() {
  paintNeeded = false
  resize()
  ;(scene === 'manual' ? manualMaterial : showMaterial).render(ctx)
  const sample = sampleShow(tick * SHOW_STEP)
  const hand = scene === 'manual' ? manualHand : sample.hand
  if (ui.showHand.checked && hand) {
    const height = scene === 'manual' ? manualTool === 'scatter' ? 0.45 : 0.04 : sample.contacts.find(contact => contact.tool === 'pour')?.height ?? 0
    const projectedHand = hand.pose === 'pour' ? { ...hand, y: hand.y - (0.013 + height * 0.09) * ui.canvas.width / ui.canvas.height * 0.55 } : hand
    drawStageHand(ctx, projectedHand, scene === 'manual' ? manualMaterial.elapsedTime : tick * SHOW_STEP)
  }
}
function cacheCheckpoint(material: StageMaterial, at: number) {
  if (at % CHECKPOINT_INTERVAL === 0 && !checkpoints.has(at)) checkpoints.set(at, material.read())
}
async function seek(target: number, resume = false) {
  const action = ++generation
  target = Math.max(0, Math.min(TOTAL_TICKS, Math.round(target)))
  ui.timeline.value = String(target)
  if (scene === 'manual') settleManual()
  scene = 'show'; playing = false; seeking = true; accumulator = 0; finishPointers(); updateControls(); tell('正在从实际手势重建这一刻…')
  const material = new StageMaterial()
  let from = Math.max(...[...checkpoints.keys()].filter(value => value <= target))
  material.restore(checkpoints.get(from)!)
  try {
    while (from < target) {
      const end = Math.min(target, from + 240)
      while (from < end) { from++; material.step(SHOW_STEP, sampleShow(from * SHOW_STEP).contacts); if (action === generation) cacheCheckpoint(material, from) }
      if (action !== generation || disposed) return
      if (from < target) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    }
    if (action !== generation || disposed) return
    showMaterial = material; tick = target; seeking = false; playing = resume && tick < TOTAL_TICKS; previousTime = 0
    render(); updateControls(); tell(tick === TOTAL_TICKS ? '江南已成画。可重播、导出成品，或到另一张灯箱亲手试画。' : '已到这一刻。可继续表演，或暂停观察沙层和留白。')
  } catch (error) { if (action === generation) { seeking = false; playing = false; tell(errorText(error)); updateControls() } }
}
function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (manualMaterial.pending || pointers.size) { scheduleSave(); return }
    const snapshot = manualMaterial.read()
    saveQueue = saveQueue.catch(() => {}).then(() => saveStageDraft(snapshot)).then(() => { savedDraft = true; if (scene === 'manual') tell('手绘草稿已单独保存，可返回演出或继续画。') }).catch(error => { if (scene === 'manual') tell(`草稿未保存：${errorText(error)}，可先导出 PNG。`) })
  }, 500)
}
function captureUndo() { history.push(manualMaterial.read()); if (history.length > 6) history.shift() }
function point(event: PointerEvent): StagePoint { const rect = ui.canvas.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) } }
function contact(from: StagePoint, to: StagePoint, pressure: number): StageContact {
  const tool = manualTool === 'scatter' || manualTool === 'stream' ? 'pour' : manualTool === 'palm' ? 'sweep' : manualTool === 'finger' ? 'finger' : 'edge'
  return { tool, from, to, radius: Number(ui.brushSize.value) / 768 * (tool === 'finger' ? 0.25 : 1), strength: Number(ui.brushStrength.value) * pressure, spread: manualTool === 'scatter' ? 0.72 : 0.09, height: manualTool === 'scatter' ? 0.45 : 0.04, angle: Math.atan2(to.y - from.y, to.x - from.x) }
}
function pose(contact: StageContact): StageHand { return { ...contact.to, pose: contact.tool === 'pour' ? 'pour' : contact.tool === 'sweep' || contact.tool === 'rub' ? 'palm' : contact.tool, rotation: contact.angle ?? 0, down: true } }
function nextContacts() {
  const contacts: StageContact[] = []
  for (const [id, pointer] of pointers) {
    const next = pointer.queue.shift() ?? (pointer.held ? contact(pointer.point, pointer.point, pointer.pressure) : undefined)
    if (next) { contacts.push(next); manualHand = { ...pose(next), down: pointer.held } }
    if (!pointer.held && !pointer.queue.length) pointers.delete(id)
  }
  return contacts
}
function finishPointers() {
  for (const [id, pointer] of pointers) { pointer.held = false; if (ui.canvas.hasPointerCapture(id)) ui.canvas.releasePointerCapture(id) }
  while ([...pointers.values()].some(pointer => pointer.queue.length)) manualMaterial.step(SHOW_STEP, nextContacts())
  pointers.clear(); manualHand = null; paintNeeded = true
}
function settleManual() {
  const changed = manualMaterial.pending || pointers.size > 0
  finishPointers()
  for (let tail = 0; manualMaterial.pending && tail < 120; tail++) manualMaterial.step(SHOW_STEP, [])
  if (changed || savedDraft || history.length) scheduleSave()
}
function enterManual() {
  ++generation; seeking = false; playing = false; scene = 'manual'; accumulator = 0; previousTime = 0; updateControls(); render()
  tell(savedDraft ? '已恢复独立手绘草稿。原工作室和演出的沙床都保留。' : '这是一张独立空白灯箱。按住拖动散撒，或用细流铺出轮廓。')
}
function frame(now: number) {
  if (disposed) return
  frameId = requestAnimationFrame(frame)
  if (document.hidden || !ready) { previousTime = 0; return }
  const elapsed = previousTime ? Math.min(0.12, (now - previousTime) / 1000) : 0
  previousTime = now
  if (!seeking) {
    accumulator += elapsed * (scene === 'show' ? playing ? Number(ui.speed.value) : 0 : 1)
    const steps = Math.min(12, Math.floor(accumulator / SHOW_STEP)); accumulator -= steps * SHOW_STEP
    for (let index = 0; index < steps; index++) {
      if (scene === 'show') {
        if (tick < TOTAL_TICKS) { tick++; showMaterial.step(SHOW_STEP, sampleShow(tick * SHOW_STEP).contacts); cacheCheckpoint(showMaterial, tick) }
        if (tick === TOTAL_TICKS) { playing = false; accumulator = 0; tell('月下江南已成画。可重播、切换章节或导出 PNG。'); break }
      } else {
        const falling = manualMaterial.pending, contacts = nextContacts()
        if (falling || contacts.length) { manualMaterial.step(SHOW_STEP, contacts); paintNeeded = true }
        if (contacts.length || (falling && !manualMaterial.pending)) scheduleSave()
      }
    }
    if ((scene === 'show' && steps > 0) || (scene === 'manual' && (pointers.size || manualMaterial.pending)) || paintNeeded) { render(); updateControls() }
  }
}
ui.play.addEventListener('click', () => { if (scene !== 'show' || seeking) return; if (tick === TOTAL_TICKS) { void seek(0, true); return }; playing = !playing; accumulator = 0; previousTime = 0; updateControls() }, { signal })
ui.restart.addEventListener('click', () => { void seek(0, true) }, { signal })
for (const button of ui.chapterButtons) button.addEventListener('click', () => { const chapter = chapters[Number(button.dataset.chapter)]; if (chapter) void seek(Math.round(chapter.time / SHOW_STEP), false) }, { signal })
ui.timeline.addEventListener('pointerdown', () => { draggingTimeline = true; playing = false }, { signal })
ui.timeline.addEventListener('input', () => { playing = false; ui.timelineTime.value = `${timeLabel(Number(ui.timeline.value))} / ${timeLabel(TOTAL_TICKS)}` }, { signal })
ui.timeline.addEventListener('change', () => { draggingTimeline = false; void seek(Number(ui.timeline.value), false) }, { signal })
ui.timeline.addEventListener('pointercancel', () => { draggingTimeline = false; updateControls() }, { signal })
ui.speed.addEventListener('change', () => { accumulator = 0; previousTime = 0 }, { signal })
ui.showHand.addEventListener('change', render, { signal })
ui.manual.addEventListener('click', () => { if (scene === 'show') enterManual(); else { settleManual(); scene = 'show'; accumulator = 0; previousTime = 0; updateControls(); render(); tell('已返回暂停的演出，手绘作品仍单独保留。') } }, { signal })
for (const button of ui.toolButtons) button.addEventListener('click', () => { finishPointers(); manualTool = button.dataset.tool!; updateControls() }, { signal })
ui.clear.addEventListener('click', () => { if (scene !== 'manual') return; finishPointers(); captureUndo(); manualMaterial.clear(); render(); scheduleSave(); updateControls(); tell('独立手绘灯箱已清空，可以撤销。') }, { signal })
ui.undo.addEventListener('click', () => { if (scene !== 'manual') return; const state = history.pop(); if (state) { finishPointers(); manualMaterial.restore(state); render(); scheduleSave(); updateControls(); tell('已撤销上一笔。') } }, { signal })
ui.fullscreen.addEventListener('click', () => { const action = document.fullscreenElement ? document.exitFullscreen() : ui.canvasFrame.requestFullscreen(); void action.catch(error => tell(errorText(error))) }, { signal })
document.addEventListener('fullscreenchange', () => {
  const label = document.fullscreenElement ? '退出全屏' : '灯箱全屏'
  ui.fullscreen.textContent = label; ui.fullscreen.setAttribute('aria-label', label); ui.fullscreen.title = label; render()
}, { signal })
ui.exportPng.addEventListener('click', () => {
  if (scene === 'manual') settleManual()
  const filename = `${scene === 'manual' ? '舞台手绘' : '月下江南'}-沙画.png`
  const material = scene === 'manual' ? manualMaterial : showMaterial
  const canvas = document.createElement('canvas'); canvas.width = 1536; canvas.height = 1152
  material.render(canvas.getContext('2d')!)
  canvas.toBlob(blob => { if (!blob) { tell('成品导出失败，请重试。'); return }; const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); tell('已导出 1536 × 1152 PNG，成品中没有手影与界面。') }, 'image/png')
  if (scene === 'manual') scheduleSave()
}, { signal })
ui.canvas.addEventListener('pointerdown', event => {
  if (scene !== 'manual' || (event.pointerType === 'mouse' && event.button !== 0)) return
  if (!pointers.size) captureUndo()
  const position = point(event), pressure = event.pointerType === 'pen' ? Math.max(0.15, event.pressure) : 0.85
  pointers.set(event.pointerId, { point: position, pressure, held: true, queue: [contact(position, position, pressure)] }); paintNeeded = true; ui.canvas.setPointerCapture(event.pointerId); ui.canvas.focus({ preventScroll: true }); updateControls(); tell('用手成画中…')
}, { signal })
ui.canvas.addEventListener('pointermove', event => {
  const pointer = pointers.get(event.pointerId); if (!pointer?.held || scene !== 'manual') return
  const samples = event.getCoalescedEvents?.() ?? []
  for (const sample of samples.length ? samples : [event]) {
    const position = point(sample), pressure = sample.pointerType === 'pen' ? Math.max(0.15, sample.pressure) : 0.85
    if (Math.hypot((position.x - pointer.point.x) * 768, (position.y - pointer.point.y) * 576) < 0.25 && Math.abs(pressure - pointer.pressure) < 0.01) continue
    pointer.pressure = pressure; pointer.queue.push(contact(pointer.point, position, pressure)); pointer.point = position
  }
}, { signal })
const release = (event: PointerEvent) => { const pointer = pointers.get(event.pointerId); if (pointer) { pointer.held = false; if (ui.canvas.hasPointerCapture(event.pointerId)) ui.canvas.releasePointerCapture(event.pointerId); if (manualHand) manualHand.down = false; paintNeeded = true; scheduleSave() } }
ui.canvas.addEventListener('pointerup', release, { signal }); ui.canvas.addEventListener('pointercancel', release, { signal })
ui.canvas.addEventListener('pointerleave', () => { if (!pointers.size) { manualHand = null; paintNeeded = true } }, { signal })
window.addEventListener('resize', () => { paintNeeded = true }, { signal })
window.addEventListener('blur', () => { settleManual(); draggingTimeline = false; previousTime = 0 }, { signal })
window.addEventListener('pagehide', () => { settleManual(); if (savedDraft || manualMaterial.suppliedMass > 0) void saveStageDraft(manualMaterial.read()).catch(() => {}); disposed = true; generation++; clearTimeout(saveTimer); listeners.abort(); cancelAnimationFrame(frameId) }, { once: true })
updateControls()
void loadStageDraft().then(draft => { if (draft) { manualMaterial.restore(draft); savedDraft = true } }).catch(error => tell(`手绘草稿未恢复：${errorText(error)}`)).finally(() => {
  ready = true; playing = location.hash !== '#pause'; updateControls(); render(); frameId = requestAnimationFrame(frame); tell('月下江南已就绪。演出、手绘草稿与原工作室分别保留。')
})
