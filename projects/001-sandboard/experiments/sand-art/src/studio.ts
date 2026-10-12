import './style.css'
import { createArtInterface } from './ui'
import { ArtSolver } from './solver'
import { ArtRenderer } from './render'
import { allocateHand, HAND_CAPACITY } from './hand'
import { ArtHistory } from './history'
import { loadArt, savePainting, listPaintings, loadPainting, type SavedArt } from './storage'
import { findHandExample } from './examples/catalog'
import { readExampleDraft, writeWorkspaceDraft } from './examples/storage'
import { exportArtProject, importArtProject } from './project-file'
import { exportPainting } from './export'
import { RecordingBuilder, MAX_RECORDING_TICKS, loadRecording, saveRecording, exportRecording, importRecording, type Recording } from './recording'
import { ReplaySession } from './replay'
import { createSandDemo, demoPhaseAt } from './demo'
import { naturalFlowAt } from './airborne'
import { exportReplayVideo } from './video-export'
import { extendStroke, sampleContactQueues, type StrokeAnchor } from './input'
import { createComposition, defaultConversion, pixelsToSand, previewSand, readReferenceImage, type CompositionPreset, type ConversionOptions } from './composition'
import { FIXED_STEP, GRID_HEIGHT, GRID_WIDTH, MAX_CONTACTS, MAX_STEPS, clamp, modeLabels, toolLabels, type ArtContact, type ArtCursor, type ArtMode, type ArtPoint, type ArtRenderOptions, type ArtTool, type LightPreset } from './model'

const ui = createArtInterface(document.querySelector<HTMLElement>('#app')!)
const modes: ArtMode[] = ['surface', 'lightbox']
const tools: ArtTool[] = ['pour', 'push', 'scrape', 'rake', 'stamp', 'smooth', 'palm']
type Settings = SavedArt['settings']
type Reference = Awaited<ReturnType<typeof readReferenceImage>>
type HistoryMeta = { settings: Settings; reference: Omit<Reference, 'url'> | null; conversion: ConversionOptions; title: string; paintingId?: string }
type Workspace = Omit<HistoryMeta, 'reference'> & { reference: Reference | null; mode: ArtMode; solver: ArtSolver; renderer: ArtRenderer; history: ArtHistory<HistoryMeta>; handRemaining: number; revision: number; savedRevision: number; saveTimer?: ReturnType<typeof setTimeout>; autoTask?: Promise<void>; autosaveMessage: string; exampleId?: string }
type PointerTrack = { point: ArtPoint; time: number; pressure: number; held: boolean; tool: ArtTool; angle: number; aspect: number; palmFinishQueued: boolean; queue: ArtContact[]; anchor: StrokeAnchor }
const workspaces = new Map<ArtMode, Workspace>()
const pointers = new Map<number, PointerTrack>()
const pendingPalmFinishes: ArtContact[] = []
const listeners = new AbortController()
const referenceUrls = new Set<string>()
const galleryUrls = new Set<string>()
let mode: ArtMode = 'lightbox'
let cursor: ArtCursor | null = null
let device: GPUDevice | undefined
let format: GPUTextureFormat
let context: GPUCanvasContext | null = null
let animation = 0
let ready = false
let stopped = false
let suspended = false
let updating = false
let framesInFlight = 0
let previousTime = 0
let accumulator = 0
let roundRobin = 0
let lastDynamicsDirty = 0
let recording: RecordingBuilder | undefined
let lastRecording: Recording | undefined
let demoRecording: Recording | undefined
let demoActive = false
const selectedRecording = () => demoActive ? demoRecording : lastRecording
let recordingFinishing = false
let replay: ReplaySession | undefined
let replayPlaying = false
let replayBusy = false
let replayAction = 0
let replayAccumulator = 0
let timelineDragging = false
let replayTarget: number | undefined
let videoAbort: AbortController | undefined

const defaults = (artMode: ArtMode): Settings => ({ tool: artMode === 'lightbox' ? 'pour' : 'push', radius: 16, strength: 0.7, wetness: 0, wind: 0, light: 'noon', flow: false, palmAngle: Math.PI / 2, palmAspect: 0.45, pourStyle: 'scatter', pourHeight: 0.55, pourSpread: 0.5, referenceVisible: true, referenceOpacity: 0.35, referenceGrid: false })
const active = () => workspaces.get(mode)!
const canWork = () => ready && !suspended && !stopped && !replay
const tell = (text: string) => { ui.status.textContent = text }
const message = (error: unknown) => error instanceof Error ? error.message : String(error)
const options = (time: number, workspace = active()): ArtRenderOptions => ({ mode: workspace.mode, light: workspace.settings.light, wetness: workspace.settings.wetness, wind: workspace.settings.wind, time: time / 1000, cursor: workspace === active() ? cursor : null })
const meta = (workspace = active()): HistoryMeta => ({ settings: { ...workspace.settings }, reference: workspace.reference ? { pixels: workspace.reference.pixels, blob: workspace.reference.blob, name: workspace.reference.name } : null, conversion: { ...workspace.conversion }, title: workspace.title, paintingId: workspace.paintingId })
const hasPointers = () => [...pointers.values()].some((track) => track.held || track.queue.length)
const pourSettings = (): NonNullable<ArtContact['pour']> => ({ style: active().settings.pourStyle ?? 'scatter', height: active().settings.pourHeight ?? 0.55, spread: active().settings.pourSpread ?? 0.5, natural: true })
function updateHand() {
  const percent = Math.round(active().handRemaining / HAND_CAPACITY * 100)
  const text = percent ? `手中余沙 ${percent}%` : active().handRemaining > 0 ? '手中余沙不到 1%' : '手中沙已撒完 · 再抓一把'
  if (ui.handStatus.textContent !== text) ui.handStatus.textContent = text
}

function setReference(workspace: Workspace, reference: Reference | null) {
  if (workspace.reference?.url && workspace.reference.url !== reference?.url) { URL.revokeObjectURL(workspace.reference.url); referenceUrls.delete(workspace.reference.url) }
  workspace.reference = reference
  if (reference) referenceUrls.add(reference.url)
}

function updateHistory() {
  ui.undo.disabled = !canWork() || active().history.size === 0
  ui.redo.disabled = !canWork() || active().history.redoSize === 0
}

function updateReference() {
  const workspace = active(), reference = workspace.reference
  ui.referenceImage.hidden = !!replay || !reference || !workspace.settings.referenceVisible
  if (reference && ui.referenceImage.getAttribute('src') !== reference.url) ui.referenceImage.src = reference.url
  if (!reference) ui.referenceImage.removeAttribute('src')
  ui.referenceImage.style.opacity = String(workspace.settings.referenceOpacity ?? 0.35)
  ui.referenceImage.alt = reference ? `${reference.name}，临摹参考图` : ''
  ui.referenceGridLayer.hidden = !!replay || !workspace.settings.referenceGrid
  for (const control of [ui.referenceVisible, ui.refOpacity, ui.referenceRemove, ui.blackPoint, ui.whitePoint, ui.gamma, ui.invert, ui.minHeight, ui.maxHeight, ui.applyConversion]) control.disabled = !canWork() || !reference
  const preview = ui.conversionPreview.getContext('2d')!
  if (reference) preview.putImageData(new ImageData(new Uint8ClampedArray(previewSand(pixelsToSand(reference.pixels, mode, workspace.conversion), mode)), GRID_WIDTH, GRID_HEIGHT), 0, 0)
  else preview.clearRect(0, 0, GRID_WIDTH, GRID_HEIGHT)
}

function updateControls() {
  if (!workspaces.size) return
  const workspace = active(), settings = workspace.settings
  updating = true
  for (const button of ui.modeButtons) { const selected = button.dataset.mode === mode; button.setAttribute('aria-pressed', String(selected)); button.classList.toggle('active', selected) }
  for (const button of ui.toolButtons) { const selected = button.dataset.tool === settings.tool; button.setAttribute('aria-pressed', String(selected)); button.classList.toggle('active', selected) }
  ui.radius.value = String(settings.radius); ui.strength.value = String(Math.round(settings.strength * 100))
  ui.wetness.value = String(Math.round(settings.wetness * 100)); ui.wind.value = String(Math.round(settings.wind * 100))
  ui.light.value = settings.light; ui.flow.checked = settings.flow ?? false
  ui.pourStyle.value = settings.pourStyle ?? 'scatter'; ui.pourHeight.value = String(Math.round((settings.pourHeight ?? 0.55) * 100)); ui.pourSpread.value = String(Math.round((settings.pourSpread ?? 0.5) * 100))
  ui.pourSettings.hidden = settings.tool !== 'pour'
  for (const control of [ui.pourStyle, ui.pourHeight, ui.pourSpread, ui.grabSand]) control.disabled = !canWork() || settings.tool !== 'pour'
  updateHand()
  const palmDegrees = (settings.palmAngle ?? 0) * 180 / Math.PI
  ui.palmAngle.value = String(Math.round((palmDegrees % 180 + 180) % 180)); ui.palmAspect.value = String(Math.round((settings.palmAspect ?? 0.45) * 100))
  ui.referenceVisible.checked = settings.referenceVisible ?? true; ui.refOpacity.value = String(Math.round((settings.referenceOpacity ?? 0.35) * 100)); ui.referenceGrid.checked = settings.referenceGrid ?? false
  ui.blackPoint.value = String(workspace.conversion.blackPoint); ui.whitePoint.value = String(workspace.conversion.whitePoint)
  ui.gamma.value = String(Math.round(workspace.conversion.gamma * 100)); ui.invert.checked = workspace.conversion.invert
  ui.minHeight.value = String(Math.round(workspace.conversion.minHeight * 100)); ui.maxHeight.value = String(Math.round(workspace.conversion.maxHeight * 100))
  ui.paintingTitle.value = workspace.title; ui.autosaveStatus.textContent = workspace.autosaveMessage
  ui.examplePanel.hidden = !workspace.exampleId
  ui.exampleTitle.textContent = workspace.exampleId ? findHandExample(workspace.exampleId)?.title ?? '手绘示例' : ''
  ui.canvasLabel.textContent = modeLabels[mode]
  ui.canvas.setAttribute('aria-label', `${modeLabels[mode]}创作画布。当前工具${toolLabels[settings.tool]}，${settings.tool === 'pour' && settings.pourStyle === 'handful' ? '点一下释放一把沙，松手后继续落完。' : '按住并拖动绘画；撒沙可以按住不动。'}`)
  ui.modeHint.textContent = mode === 'lightbox' ? '撒沙画暗部，刮沙画亮线。薄厚之间，是你的明暗。' : '沿着沙面慢慢画，观察沟槽、沙脊和细沙的流动。'
  document.body.dataset.mode = mode; document.body.dataset.tool = settings.tool
  for (const control of [ui.radius, ui.strength, ui.wetness, ui.wind, ui.palmAngle, ui.palmAspect, ui.pourHeight, ui.pourSpread, ui.refOpacity, ui.blackPoint, ui.whitePoint, ui.gamma, ui.minHeight, ui.maxHeight]) control.dispatchEvent(new Event('input'))
  updating = false; updateHistory(); updateReference(); updateRecordingControls()
}

function setAutosave(workspace: Workspace, text: string) { workspace.autosaveMessage = text; if (workspace === active()) ui.autosaveStatus.textContent = text }
function scheduleSave(workspace: Workspace, delay = 900) {
  clearTimeout(workspace.saveTimer)
  if (stopped) return
  workspace.saveTimer = setTimeout(() => {
    if (suspended || workspace.solver.airborne.pending || (workspace === active() && hasPointers())) { scheduleSave(workspace, 200); return }
    void autosave(workspace)
  }, delay)
}
function markDirty(workspace = active()) { workspace.revision++; setAutosave(workspace, '有新修改 · 即将自动保存'); scheduleSave(workspace); if (workspace === active() && recording) { recording.recordLook(workspace.settings); checkRecordingLimit() } }

function encodeStep(encoder: GPUCommandEncoder, contacts: ArtContact[], slot: number) {
  if (recording?.stopped) return
  const workspace = active(), settings = workspace.settings
  // Reserve the last second for airborne sand to finish falling. All tools
  // stop emitting contacts here, including queued sculpting samples and tails.
  // Once the builder closes, later slots must not change the recorded live bed.
  const payable = recording && recording.ticks >= MAX_RECORDING_TICKS - 120
    ? []
    : contacts.map(contact => contact.pour?.natural ? { ...contact, pour: { ...contact.pour, flow: naturalFlowAt(workspace.solver.airborne.elapsedTime, contact.pour.style, contact.to.x, contact.to.y) } } : contact)
  const allocated = allocateHand(payable, workspace.handRemaining, FIXED_STEP)
  workspace.handRemaining = allocated.remaining
  const step = { dt: FIXED_STEP, contacts: allocated.contacts, wetness: settings.wetness, wind: settings.wind, windAngle: 0.2, preserve: !settings.flow }
  active().solver.encodeStep(encoder, step, slot)
  if (recording) { recording.recordStep(step); checkRecordingLimit() }
}
function recordState() { if (recording && !recording.stopped) { recording.recordSnapshot(captureArt(active())); checkRecordingLimit() } }
function checkRecordingLimit() {
  if (!recording || (!recording.limitReached && !recording.error) || recordingFinishing) return
  recordingFinishing = true
  queueMicrotask(() => { recordingFinishing = false; void finishRecording() })
}

function cancelPointers() {
  for (const pointerId of pointers.keys()) if (ui.canvas.hasPointerCapture(pointerId)) ui.canvas.releasePointerCapture(pointerId)
  pointers.clear(); cursor = null
}
function contact(track: PointerTrack, from: ArtPoint, to: ArtPoint, velocity: ArtPoint): ArtContact {
  const settings = active().settings
  return { from, to, velocity, radius: settings.radius, pressure: track.pressure, strength: settings.strength, tool: track.tool, angle: track.angle, aspect: track.aspect, ...(track.tool === 'pour' ? { pour: pourSettings() } : {}) }
}
const anchored = (tool: ArtTool) => tool === 'scrape' || tool === 'rake' || tool === 'palm'
function nextContacts(): ArtContact[] {
  const sampled = sampleContactQueues(pointers, roundRobin, (track) => contact(track, anchored(track.tool) ? track.anchor.origin : track.point, track.point, { x: 0, y: 0 }))
  roundRobin = sampled.next; return sampled.contacts
}
// Finish queued samples before a command captures the previous artwork. Every
// batch submits separately, so uniforms cannot overwrite unsubmitted GPU work.
function finishStroke(settle = true) {
  if (recording?.stopped) { cancelPointers(); pendingPalmFinishes.length = 0; updateHand(); return }
  for (const track of pointers.values()) {
    if (track.tool === 'palm' && !track.palmFinishQueued) pendingPalmFinishes.push(contact(track, track.anchor.origin, track.point, { x: 0, y: 0 }))
    track.held = false
  }
  let changed = false
  while (pointers.size && device && ready) {
    const contacts = nextContacts(); if (!contacts.length) break
    const encoder = device.createCommandEncoder()
    encodeStep(encoder, contacts, 0)
    device.queue.submit([encoder.finish()]); changed = true
  }
  // A broad palm finishes its last capsule with a short contact tail. Separate
  // fixed steps move the remaining sand; ten contacts in one step would merely
  // repeat the same pressure field. Readback/history are queued after this tail.
  while (pendingPalmFinishes.length && device && ready) {
    const contacts = pendingPalmFinishes.splice(0, MAX_CONTACTS)
    for (let step = 0; step < 10; step++) {
      const encoder = device.createCommandEncoder()
      encodeStep(encoder, contacts, 0)
      device.queue.submit([encoder.finish()])
    }
    changed = true
  }
  const hovering = !settle && cursor ? { ...cursor, down: false } : null
  cancelPointers(); cursor = hovering
  // Commands capture only landed sand. Mouse-up leaves the reservoir alive so
  // a quick tap visibly continues falling in normal animation frames.
  if (settle && device && ready) {
    for (let batch = 0; batch < 60 && active().solver.airborne.pending; batch++) {
      const encoder = device.createCommandEncoder()
      for (let slot = 0; slot < MAX_STEPS && active().solver.airborne.pending; slot++) encodeStep(encoder, [], slot)
      device.queue.submit([encoder.finish()]); changed = true
    }
    if (active().solver.airborne.pending) throw new Error('落沙尚未完成，请稍后重试。')
  }
  updateHand(); if (changed) markDirty()
}
function captureEdit() { finishStroke(); active().history.capture(active().solver.state, active().solver.referenceBuffer, meta()); updateHistory() }
function point(event: PointerEvent): ArtPoint {
  const rect = ui.canvas.getBoundingClientRect()
  return { x: clamp((event.clientX - rect.left) / rect.width * GRID_WIDTH, 0.5, GRID_WIDTH - 0.5), y: clamp((event.clientY - rect.top) / rect.height * GRID_HEIGHT, 0.5, GRID_HEIGHT - 0.5) }
}
function trackMove(event: PointerEvent) {
  const current = point(event), track = pointers.get(event.pointerId), settings = active().settings
  cursor = { ...current, radius: settings.radius, tool: settings.tool, active: true, down: !!track?.held, angle: settings.palmAngle, aspect: settings.palmAspect, ...(settings.tool === 'pour' ? { pour: pourSettings() } : {}) }
  if (!track?.held) return
  const time = event.timeStamp > performance.timeOrigin ? event.timeStamp - performance.timeOrigin : event.timeStamp
  const seconds = Math.max(FIXED_STEP / 2, (time - track.time) / 1000)
  const velocity = { x: clamp((current.x - track.point.x) / seconds, -4000, 4000), y: clamp((current.y - track.point.y) / seconds, -4000, 4000) }
  track.pressure = event.pointerType === 'pen' ? Math.max(0.1, event.pressure) : 0.8
  if (Math.hypot(current.x - track.point.x, current.y - track.point.y) > 0.05) track.queue.push(contact(track, anchored(track.tool) ? extendStroke(track.anchor, track.point, current, settings.radius) : track.point, current, velocity))
  track.point = current; track.time = Math.max(track.time, time)
}
function reset(fill: 'empty' | 'thin' | 'full', fresh = false) {
  if (!canWork()) return
  captureEdit(); const encoder = device!.createCommandEncoder(); active().solver.reset(encoder, fill); device!.queue.submit([encoder.finish()])
  if (fresh) { active().handRemaining = HAND_CAPACITY; active().paintingId = undefined; active().title = '未命名作品'; setReference(active(), null); active().conversion = defaultConversion(mode); active().settings.flow = false; active().settings.wind = 0 }
  recordState(); markDirty(); updateControls()
  tell(fresh ? '新画台已准备好，旧画台可撤销恢复；保存后会加入作品集。' : fill === 'empty' ? '画台已清空。选「撒沙」开始创作。' : fill === 'thin' ? '薄沙底稿已铺好。试着刮出一条亮线。' : '沙面已铺平，可以重新绘画。')
}
function restoreHistory(redo: boolean) {
  if (!canWork()) return
  finishStroke(); const workspace = active()
  const restored = redo ? workspace.history.redo(workspace.solver.buffers, workspace.solver.referenceBuffer, workspace.solver.state, meta()) : workspace.history.restore(workspace.solver.buffers, workspace.solver.referenceBuffer, workspace.solver.state, meta())
  if (restored) {
    workspace.solver.airborne.clear()
    if (restored.metadata) {
      const { reference, ...settings } = restored.metadata
      Object.assign(workspace, settings)
      setReference(workspace, reference ? { ...reference, url: URL.createObjectURL(reference.blob) } : null)
    }
    recordState(); markDirty(); updateControls(); tell(redo ? '已重做上一步。' : '已撤销上一步，可点击重做恢复。')
  }
  else updateHistory()
}
async function runTask(text: string, action: () => Promise<void>) {
  if (!canWork()) return
  finishStroke(); suspended = true; for (const control of ui.controls) control.disabled = true; tell(text)
  try { await action() } catch (error) { tell(message(error)) }
  finally { suspended = false; previousTime = 0; if (!stopped) { for (const control of ui.controls) control.disabled = false; updateControls() } }
}

const timeLabel = (ticks: number) => { const seconds = Math.floor(ticks * FIXED_STEP); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}.${Math.floor(ticks % 120 / 12)}` }
function updateRecordingControls() {
  const available = ready && !stopped && !suspended
  const selected = selectedRecording()
  const hasRecording = !!selected && selected.ticks > 0
  ui.demoPlay.disabled = !available || !!recording || recordingFinishing || (replayBusy && !replayPlaying)
  ui.demoRestart.disabled = !available || !demoActive || !!recording || recordingFinishing
  ui.demoStop.disabled = !available || !demoActive
  ui.demoPanel.dataset.state = !demoActive ? 'idle' : !replay ? 'preparing' : replayPlaying ? 'playing' : replay.tick === replay.durationTicks ? 'finished' : 'paused'
  ui.demoPlay.textContent = demoActive && replayPlaying ? '暂停演示' : demoActive && replay && replay.tick < replay.durationTicks ? '继续演示' : demoActive ? '再看一次' : '播放沙画演示'
  const displayedTick = timelineDragging ? Number(ui.replayTimeline.value) : replayTarget ?? replay?.tick ?? 0
  const phase = demoActive && replay ? demoPhaseAt(displayedTick) : undefined
  const demoStatus = phase ? `${phase.label} · ${phase.description}` : '点击播放，观看完整创作'
  if (ui.demoStatus.textContent !== demoStatus) ui.demoStatus.textContent = demoStatus
  if (phase?.handPercent !== undefined) ui.handStatus.textContent = `演示手中余沙 ${Math.round(phase.handPercent)}%`
  if (replay) {
    document.body.dataset.mode = selected!.initial.mode
    for (const button of ui.modeButtons) { const pressed = button.dataset.mode === selected!.initial.mode; button.setAttribute('aria-pressed', String(pressed)); button.classList.toggle('active', pressed) }
  }
  if (phase?.settings) {
    const gesture = phase.settings
    document.body.dataset.tool = gesture.tool
    for (const button of ui.toolButtons) { const pressed = button.dataset.tool === gesture.tool; button.setAttribute('aria-pressed', String(pressed)); button.classList.toggle('active', pressed) }
    updating = true
    const showValue = (control: HTMLInputElement, value: number) => { if (control.value !== String(value)) { control.value = String(value); control.dispatchEvent(new Event('input')) } }
    showValue(ui.radius, Math.round(gesture.radius))
    showValue(ui.strength, Math.round(gesture.strength * 100))
    ui.pourSettings.hidden = gesture.tool !== 'pour'
    if (gesture.pour) { ui.pourStyle.value = gesture.pour.style; showValue(ui.pourHeight, Math.round(gesture.pour.height * 100)); showValue(ui.pourSpread, Math.round(gesture.pour.spread * 100)) }
    updating = false
  }
  ui.record.disabled = !canWork() || !!recording || recordingFinishing
  ui.recordStop.disabled = !available || !recording || recordingFinishing
  ui.replayPlay.disabled = !available || !hasRecording || !!recording || (replayBusy && !replayPlaying)
  ui.replayExit.disabled = !available || !replay
  ui.replayTimeline.disabled = !available || !hasRecording || !!recording
  ui.replaySpeed.disabled = !available || !!recording
  ui.recordingExport.disabled = !available || !hasRecording || !!recording
  ui.recordingImport.disabled = !available || !!recording || !!replay
  ui.recordingFile.disabled = ui.recordingImport.disabled
  ui.videoExport.disabled = !available || !hasRecording || !!recording || (replayBusy && !replayPlaying)
  ui.videoCancel.disabled = !videoAbort
  ui.recordingPanel.dataset.state = recording ? 'recording' : replay ? 'replay' : 'idle'
  ui.replayPlay.textContent = replayPlaying ? '暂停回放' : replay && replay.tick < replay.durationTicks ? '继续回放' : '播放回放'
  ui.replayTimeline.max = String(selected?.ticks ?? 0)
  if (!timelineDragging) ui.replayTimeline.value = String(replayTarget ?? replay?.tick ?? 0)
  ui.replayTimeline.style.setProperty('--range-progress', `${selected?.ticks ? Number(ui.replayTimeline.value) / selected.ticks * 100 : 0}%`)
  ui.replayTime.textContent = `${timeLabel(displayedTick)} / ${timeLabel(selected?.ticks ?? 0)}`
  const recordingStatus = videoAbort ? ui.recordStatus.textContent : recording ? `正在录制 · ${timeLabel(recording.ticks)} / 3:00` : replay ? `${demoActive ? '沙画演示' : '创作回放'} · ${selected?.title ?? ''}` : lastRecording ? `已保留「${lastRecording.title}」 · ${timeLabel(lastRecording.ticks)} · 可回放或导出` : '先开始录制，再在画台上创作 · 最长 3 分钟'
  if (ui.recordStatus.textContent !== recordingStatus) ui.recordStatus.textContent = recordingStatus
  if (recording || replay) {
    for (const button of ui.modeButtons) button.disabled = true
    ui.gallery.disabled = true; ui.projectImport.disabled = true; ui.projectFile.disabled = true
  }
  if (replay) { ui.canvasLabel.textContent = `${modeLabels[selected!.initial.mode]} · ${demoActive ? '抓沙成画演示' : '创作回放'}`; ui.canvas.setAttribute('aria-label', demoActive ? '传统撒沙效果演示画布，使用独立沙床。可暂停、跳转和退出演示。' : '创作回放画布，可暂停、跳转和回到创作。'); ui.modeHint.textContent = demoActive ? '暂停或拖动时间轴观察沙粒落下，退出演示可继续当前作品。' : '拖动时间轴查看过程，退出回放回到当前作品。' }
}
function refreshControls() {
  for (const control of ui.controls) control.disabled = !canWork()
  if (ready && !suspended && !stopped) ui.fullscreen.disabled = false
  updateControls()
}
async function beginRecording() {
  if (!canWork() || recording || recordingFinishing) return
  await runTask('正在准备录制起点…', async () => {
    // Initial recordings save a settled bed, so start a fresh deterministic
    // emitter as well. Prior unrecorded pours must not alter replay's seed.
    active().solver.airborne.clear()
    recording = new RecordingBuilder(await captureArt(active()))
    accumulator = 0; tell('录制已开始。笔触、光照与沙床重建都会保留；结束后可回放。')
  })
}
async function finishRecording() {
  if (!recording || suspended || stopped) return
  await runTask('正在保存创作录制…', async () => {
    const builder = recording!; recording = undefined; recordingFinishing = true
    try {
      const result = await builder.finish(active().title.trim() || '未命名作品')
      if (!result.ticks) { tell('此次录制没有沙画步骤，请重新开始并绘画。'); return }
      lastRecording = result
      try { await saveRecording(result); tell(builder.limitReached ? '录制已达到时间或快照上限并保存，可回放、导出文件或视频。' : '创作录制已保存到此浏览器，可回放、导出文件或视频。') }
      catch (error) { tell(`录制已就绪，本地保存失败：${message(error)}。可先导出录制文件。`) }
    } finally { recordingFinishing = false }
  })
  refreshControls()
}
async function enterReplay(target = 0, play = true) {
  const selected = selectedRecording()
  if (!selected?.ticks || !ready || stopped || suspended || recording || replayBusy) return
  if (replay) { const session = replay, task = seekReplay(target), action = replayAction; await task; if (replay === session && replayAction === action) { replayPlaying = play && session.tick < session.durationTicks; updateRecordingControls() }; return }
  const restoreTimelineFocus = document.activeElement === ui.replayTimeline
  finishStroke(); suspended = true; refreshControls(); tell('正在准备独立回放画台…')
  let session: ReplaySession | undefined
  try {
    session = await ReplaySession.create(device!, format, selected)
    await session.seek(target)
    if (stopped) { session.destroy(); return }
    replay = session; cursor = null; replayPlaying = play && session.tick < session.durationTicks; replayAccumulator = 0
    tell(demoActive ? '抓沙成画演示已开始。可暂停、变速、拖动时间轴，或退出继续原作品。' : '回放画台已就绪。暂停、变速或拖动时间轴查看创作过程。')
  } catch (error) { session?.destroy(); tell(message(error)) }
  finally { if (!replay) demoActive = false; suspended = false; previousTime = 0; refreshControls(); if (restoreTimelineFocus && replay && !stopped) ui.replayTimeline.focus({ preventScroll: true }) }
}
async function seekReplay(target: number) {
  if (!replay || suspended) return
  const session = replay
  const action = ++replayAction
  replayTarget = target; replayPlaying = false; replayBusy = true; replayAccumulator = 0; updateRecordingControls(); tell('正在重建时间轴上的沙画…')
  try { await session.seek(target); if (replay === session && replayAction === action) tell('已跳转，点击继续回放可接着观看。') }
  catch (error) { if (replay === session && replayAction === action && !(error instanceof DOMException && error.name === 'AbortError')) tell(message(error)) }
  finally { if (replay === session && replayAction === action) { replayTarget = undefined; replayBusy = false; previousTime = 0; updateRecordingControls() } }
}
function exitReplay() {
  if (!replay || suspended) return
  replay.destroy(); replay = undefined; demoActive = false; replayTarget = undefined; replayAction++; replayBusy = false; replayPlaying = false; replayAccumulator = 0; timelineDragging = false; previousTime = 0; accumulator = 0
  refreshControls(); tell('已回到创作，当前作品与撤销历史保留。')
}
async function exportVideo() {
  const selected = selectedRecording()
  if (!selected?.ticks || recording || suspended || (replayBusy && !replayPlaying) || stopped) return
  finishStroke(); replayPlaying = false; suspended = true; videoAbort = new AbortController(); refreshControls()
  tell('正在实时导出 WebM 视频，耗时约等于录制时长；可以取消。')
  let videoWarning: string | undefined
  let shownProgress = -1
  try {
    const blob = await exportReplayVideo(device!, format, selected, { signal: videoAbort.signal, ...(demoActive ? { cursorAt: (tick: number) => demoPhaseAt(tick).cursor ?? null } : {}), onWarning: (warning) => { videoWarning = warning }, onProgress: (progress) => { const percent = Math.round(progress * 100); if (percent !== shownProgress && !stopped) { shownProgress = percent; ui.recordStatus.textContent = `视频导出中 · ${percent}%`; tell(`正在导出视频 ${percent}% · 请保持页面可见`) } } })
    if (!stopped) { downloadBlob(blob, `${safeName(selected.title)}-创作回放.webm`); tell(videoWarning ? `WebM 已导出。${videoWarning}` : 'WebM 视频已导出，包含完整创作过程。') }
  } catch (error) { if (!stopped) tell(error instanceof DOMException && error.name === 'AbortError' ? '已取消视频导出，可继续创作或回放。' : message(error)) }
  finally { videoAbort = undefined; suspended = false; previousTime = 0; if (!stopped) refreshControls() }
}

function attachRecordingInputs() {
  const signal = listeners.signal
  ui.record.addEventListener('click', () => { void beginRecording() }, { signal })
  ui.recordStop.addEventListener('click', () => { void finishRecording() }, { signal })
  ui.replayPlay.addEventListener('click', () => {
    if (suspended || recording) return
    if (!replay) { if (!replayBusy) void enterReplay(); return }
    if (replayPlaying) { replayPlaying = false; replayAccumulator = 0; previousTime = 0; updateRecordingControls(); return }
    if (replayBusy) return
    if (replay.tick >= replay.durationTicks) { void enterReplay(0); return }
    replayPlaying = !replayPlaying; previousTime = 0; updateRecordingControls()
  }, { signal })
  ui.replayExit.addEventListener('click', exitReplay, { signal })
  ui.replayTimeline.addEventListener('pointerdown', () => { timelineDragging = true; replayPlaying = false; updateRecordingControls() }, { signal })
  ui.replayTimeline.addEventListener('input', () => { const selected = selectedRecording(); replayPlaying = false; ui.replayTimeline.style.setProperty('--range-progress', `${selected?.ticks ? Number(ui.replayTimeline.value) / selected.ticks * 100 : 0}%`); ui.replayTime.textContent = `${timeLabel(Number(ui.replayTimeline.value))} / ${timeLabel(selected?.ticks ?? 0)}` }, { signal })
  ui.replayTimeline.addEventListener('change', () => { const target = Number(ui.replayTimeline.value); timelineDragging = false; if (replay) void seekReplay(target); else void enterReplay(target, false) }, { signal })
  ui.replayTimeline.addEventListener('pointercancel', () => { timelineDragging = false; updateRecordingControls() }, { signal })
  window.addEventListener('pointerup', () => { timelineDragging = false }, { signal })
  window.addEventListener('blur', () => { timelineDragging = false }, { signal })
  ui.replaySpeed.addEventListener('change', () => { replayAccumulator = 0; previousTime = 0 }, { signal })
  ui.recordingExport.addEventListener('click', () => {
    const result = selectedRecording()
    if (!result || suspended || recording) return
    void exportRecording(result).then((blob) => { downloadBlob(blob, `${safeName(result.title)}.sandrecord.json`); tell('录制文件已导出，包含起始沙床与实际操作过程。') }).catch((error) => tell(message(error)))
  }, { signal })
  ui.recordingImport.addEventListener('click', () => { if (canWork() && !recording) ui.recordingFile.click() }, { signal })
  ui.recordingFile.addEventListener('change', () => {
    const file = ui.recordingFile.files?.[0]
    if (file && !recording) void runTask('正在读取创作录制…', async () => {
      const result = await importRecording(file); if (!result.ticks) throw new Error('录制没有计算步骤，请选择包含创作过程的录制文件。')
      lastRecording = result
      try { await saveRecording(result); tell('录制已导入，可播放或拖动时间轴查看；当前作品保留。') }
      catch (error) { tell(`录制已导入并可回放，本地保存失败：${message(error)}。`) }
    })
    ui.recordingFile.value = ''
  }, { signal })
  ui.videoExport.addEventListener('click', () => { void exportVideo() }, { signal })
  ui.videoCancel.addEventListener('click', () => videoAbort?.abort(), { signal })
}

async function startDemo(restart = false) {
  if (!ready || stopped || suspended || recording || recordingFinishing) return
  if (demoActive && replay && !restart) { ui.replayPlay.click(); return }
  if (replay) exitReplay()
  demoRecording ??= createSandDemo()
  demoActive = true
  ui.replaySpeed.value = '1'
  await enterReplay(0, true)
  if (replay) ui.demoPanel.scrollIntoView({ block: 'start', behavior: 'smooth' })
}
function attachDemoInputs() {
  const signal = listeners.signal
  ui.demoPlay.addEventListener('click', () => { void startDemo() }, { signal })
  ui.demoRestart.addEventListener('click', () => { void startDemo(true) }, { signal })
  ui.demoStop.addEventListener('click', exitReplay, { signal })
  window.addEventListener('hashchange', openWorkspaceEntry, { signal })
}

function openWorkspaceEntry() {
  if (location.hash === '#demo') { void startDemo(); return }
  if (!canWork()) return
  if (location.hash === '#gallery') { void openGallery().catch(error => tell(message(error))); return }
  const entry = new URLSearchParams(location.hash.slice(1))
  const exampleId = entry.get('example')
  if (exampleId) { void openHandExample(exampleId); return }
  const paintingId = entry.get('work')
  if (paintingId) {
    if (recording) { tell('请先结束录制，再打开收藏作品。'); return }
    void runTask('正在载入收藏作品…', async () => {
      const art = await loadPainting(paintingId)
      if (!art) throw new Error('当前浏览器找不到这幅手绘作品。可以从作品集重新选择。')
      await applySaved(art, paintingId, art.title)
      tell(`已载入「${art.title || '手绘作品'}」，可以继续编辑。`)
    })
    return
  }
  const entryMode = entry.get('mode') as ArtMode | null
  const entryTool = entry.get('tool') as ArtTool | null
  if (entryMode && modes.includes(entryMode)) ui.modeButtons.find(button => button.dataset.mode === entryMode)?.click()
  if (entryTool && tools.includes(entryTool)) {
    ui.toolButtons.find(button => button.dataset.tool === entryTool)?.click()
    ui.canvas.scrollIntoView({ block: 'center' })
    ui.canvas.focus({ preventScroll: true })
  }
}

function attachInputs() {
  const signal = listeners.signal
  ui.exampleRestart.addEventListener('click', () => { if (active().exampleId) void openHandExample(active().exampleId!, true) }, { signal })
  ui.exampleReturn.addEventListener('click', () => { void returnOriginalDraft() }, { signal })
  ui.canvas.addEventListener('pointerdown', (event) => {
    if (!canWork() || (event.pointerType === 'mouse' && event.button !== 0)) return
    const position = point(event), settings = active().settings
    if (settings.tool === 'pour' && active().handRemaining <= 0) { tell('手中沙已撒完，点击「抓一把沙」后继续。'); updateHand(); return }
    if (![...pointers.values()].some((track) => track.held)) captureEdit()
    const track: PointerTrack = { point: position, time: event.timeStamp, pressure: event.pointerType === 'pen' ? Math.max(0.1, event.pressure) : 0.8, held: true, tool: settings.tool, angle: settings.palmAngle ?? 0, aspect: settings.palmAspect ?? 0.45, palmFinishQueued: false, queue: [], anchor: { origin: position, direction: null } }
    const first = contact(track, position, position, { x: 0, y: 0 })
    if (first.pour?.style === 'handful') first.pour = { ...first.pour, burst: 1 }
    track.queue.push(first); pointers.set(event.pointerId, track)
    cursor = { ...position, radius: settings.radius, tool: settings.tool, active: true, down: true, angle: track.angle, aspect: track.aspect, ...(settings.tool === 'pour' ? { pour: pourSettings() } : {}) }
    ui.canvas.setPointerCapture(event.pointerId); ui.canvas.focus({ preventScroll: true }); tell(`${modeLabels[mode]} · ${toolLabels[track.tool]}创作中`)
  }, { signal })
  ui.canvas.addEventListener('pointermove', (event) => { if (!canWork()) return; const samples = event.getCoalescedEvents?.() ?? []; for (const sample of samples.length ? samples : [event]) trackMove(sample) }, { signal })
  ui.canvas.addEventListener('pointerup', (event) => {
    if (!canWork()) return
    const lastPressure = pointers.get(event.pointerId)?.pressure ?? 0.8
    trackMove(event); const track = pointers.get(event.pointerId)
    if (track) {
      track.held = false
      if (track.tool === 'palm' && !track.palmFinishQueued) { track.pressure = lastPressure; pendingPalmFinishes.push(contact(track, track.anchor.origin, track.point, { x: 0, y: 0 })); track.palmFinishQueued = true }
    }
    if (cursor) cursor.down = false
    if (ui.canvas.hasPointerCapture(event.pointerId)) ui.canvas.releasePointerCapture(event.pointerId)
    markDirty()
    if (![...pointers.values()].some((pointer) => pointer.held)) { finishStroke(false); scheduleSave(active(), 0) }
    tell(active().solver.airborne.pending ? '松手后沙粒会继续落完，落定后自动保存。' : '这一笔已留下，正在自动保存。')
  }, { signal })
  ui.canvas.addEventListener('pointercancel', (event) => { if (canWork()) { pointers.delete(event.pointerId); cursor = null; markDirty() } }, { signal })
  ui.canvas.addEventListener('pointerleave', () => { if (![...pointers.values()].some((track) => track.held)) cursor = null }, { signal })
  window.addEventListener('blur', () => { if (ready && !stopped) finishStroke() }, { signal })
  for (const button of ui.modeButtons) button.addEventListener('click', () => {
    if (!canWork()) return
    const selected = button.dataset.mode as ArtMode; if (recording || !modes.includes(selected) || selected === mode) return
    finishStroke(); mode = selected; previousTime = 0; accumulator = 0; updateControls(); tell(`已切换至${modeLabels[mode]}，两种模式的作品分别保留。`)
  }, { signal })
  for (const button of ui.toolButtons) button.addEventListener('click', () => {
    if (!canWork()) return
    const selected = button.dataset.tool as ArtTool; if (!tools.includes(selected) || selected === active().settings.tool) return
    captureEdit(); active().settings.tool = selected
    if (selected === 'palm') active().settings.radius = Math.max(32, active().settings.radius)
    markDirty(); updateControls()
    tell(selected === 'pour' ? '手中已备沙。细流与散撒按住释放；一把撒开点一下，沙粒会继续落完。' : selected === 'palm' ? '掌形可以扫开大片沙；调整角度与宽窄，沿轮廓塑形。' : `已选择${toolLabels[selected]}。按住并拖动创作。`)
  }, { signal })
  ui.pourStyle.addEventListener('change', () => { if (canWork()) { captureEdit(); active().settings.pourStyle = ui.pourStyle.value as NonNullable<Settings['pourStyle']>; markDirty(); updateControls(); tell(ui.pourStyle.value === 'handful' ? '一把撒开：在画台上点一下，沙会散开落下。' : ui.pourStyle.value === 'stream' ? '指缝细流：按住并缓慢拖动，勾勒细线。' : '掌心散撒：按住铺沙，拖动铺出明暗。') } }, { signal })
  ui.grabSand.addEventListener('click', () => { if (canWork()) { finishStroke(); active().handRemaining = HAND_CAPACITY; updateHand(); tell('已抓满一把沙，可以继续撒。') } }, { signal })
  const ranges = [ui.radius, ui.strength, ui.wetness, ui.wind, ui.palmAngle, ui.palmAspect, ui.pourHeight, ui.pourSpread, ui.refOpacity, ui.blackPoint, ui.whitePoint, ui.gamma, ui.minHeight, ui.maxHeight]
  for (const control of ranges) {
    control.addEventListener('pointerdown', () => { if (canWork()) captureEdit() }, { signal })
    control.addEventListener('keydown', (event) => { if (canWork() && !event.repeat && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) captureEdit() }, { signal })
    control.addEventListener('change', () => { if (canWork() && !updating) scheduleSave(active(), 0) }, { signal })
  }
  for (const [control, name, scale] of [[ui.radius, 'radius', 1], [ui.strength, 'strength', 0.01], [ui.wetness, 'wetness', 0.01], [ui.wind, 'wind', 0.01], [ui.palmAngle, 'palmAngle', Math.PI / 180], [ui.palmAspect, 'palmAspect', 0.01], [ui.pourHeight, 'pourHeight', 0.01], [ui.pourSpread, 'pourSpread', 0.01], [ui.refOpacity, 'referenceOpacity', 0.01]] as const) control.addEventListener('input', () => {
    if (!canWork() || updating) return
    active().settings[name] = Number(control.value) * scale; cursor = null; markDirty(); updateReference()
  }, { signal })
  for (const control of [ui.blackPoint, ui.whitePoint, ui.gamma, ui.minHeight, ui.maxHeight]) control.addEventListener('input', () => {
    if (!canWork() || updating) return
    if (Number(ui.blackPoint.value) >= Number(ui.whitePoint.value)) { if (control === ui.blackPoint) ui.whitePoint.value = String(Math.min(255, Number(ui.blackPoint.value) + 1)); else ui.blackPoint.value = String(Math.max(0, Number(ui.whitePoint.value) - 1)) }
    if (Number(ui.minHeight.value) > Number(ui.maxHeight.value)) { if (control === ui.minHeight) ui.maxHeight.value = ui.minHeight.value; else ui.minHeight.value = ui.maxHeight.value }
    active().conversion = { blackPoint: Number(ui.blackPoint.value), whitePoint: Number(ui.whitePoint.value), gamma: Number(ui.gamma.value) / 100, invert: ui.invert.checked, minHeight: Number(ui.minHeight.value) / 100, maxHeight: Number(ui.maxHeight.value) / 100 }
    markDirty(); updateControls()
  }, { signal })
  ui.invert.addEventListener('change', () => { if (canWork()) { captureEdit(); active().conversion.invert = ui.invert.checked; markDirty(); updateReference() } }, { signal })
  ui.referenceVisible.addEventListener('change', () => { if (canWork()) { captureEdit(); active().settings.referenceVisible = ui.referenceVisible.checked; markDirty(); updateReference() } }, { signal })
  ui.referenceGrid.addEventListener('change', () => { if (canWork()) { captureEdit(); active().settings.referenceGrid = ui.referenceGrid.checked; markDirty(); updateReference() } }, { signal })
  ui.referenceRemove.addEventListener('click', () => { if (canWork()) { captureEdit(); setReference(active(), null); markDirty(); updateControls(); tell('参考图已移除，沙画保留。') } }, { signal })
  ui.light.addEventListener('change', () => { if (canWork()) { captureEdit(); active().settings.light = ui.light.value as LightPreset; markDirty(); tell('光照已更新。') } }, { signal })
  ui.flow.addEventListener('change', () => { if (canWork()) { captureEdit(); active().settings.flow = ui.flow.checked; markDirty(); tell(ui.flow.checked ? '自然流动已开启。' : '保持笔迹已开启。') } }, { signal })
  for (const button of ui.presetButtons) button.addEventListener('click', () => {
    if (!canWork()) return
    captureEdit(); active().solver.loadState(createComposition(mode, button.dataset.preset as CompositionPreset)); active().settings.flow = false; active().settings.wind = 0; recordState(); markDirty(); updateControls(); tell('示范已载入，可继续撒、刮、推；撤销可返回原作品。')
  }, { signal })
  ui.importButton.addEventListener('click', () => { if (canWork()) ui.importFile.click() }, { signal })
  ui.importFile.addEventListener('change', () => {
    const file = ui.importFile.files?.[0]
    if (file) void runTask('正在准备参考图与明暗预览…', async () => {
      const reference = await readReferenceImage(file, file.name)
      active().history.capture(active().solver.state, active().solver.referenceBuffer, meta()); setReference(active(), reference); active().conversion = defaultConversion(mode); active().settings.referenceVisible = true
      markDirty(); tell('参考图已导入。可以直接临摹，或调节预览后「应用到沙床」。')
    })
    ui.importFile.value = ''
  }, { signal })
  ui.applyConversion.addEventListener('click', () => {
    if (!canWork() || !active().reference) return
    captureEdit(); active().solver.loadState(pixelsToSand(active().reference!.pixels, mode, active().conversion)); active().settings.referenceVisible = false; active().settings.flow = false; active().settings.wind = 0
    recordState(); markDirty(); updateControls(); tell('预览已应用为真实沙层，参考图暂时隐藏。可以继续雕刻，撤销可恢复原画。')
  }, { signal })
  ui.fullscreen.addEventListener('click', () => { void (document.fullscreenElement ? document.exitFullscreen() : ui.stage.requestFullscreen()).catch(() => tell('当前浏览器不支持画台全屏。')) }, { signal })
  document.addEventListener('fullscreenchange', () => { ui.fullscreen.textContent = document.fullscreenElement === ui.stage ? '↙ 返回工作室' : '↗ 放大画台' }, { signal })
  ui.clear.addEventListener('click', () => reset('empty'), { signal }); ui.thin.addEventListener('click', () => reset('thin'), { signal }); ui.reset.addEventListener('click', () => reset(mode === 'surface' ? 'full' : 'thin'), { signal })
  ui.newPainting.addEventListener('click', () => reset(mode === 'surface' ? 'full' : 'empty', true), { signal }); ui.undo.addEventListener('click', () => restoreHistory(false), { signal }); ui.redo.addEventListener('click', () => restoreHistory(true), { signal })
  window.addEventListener('keydown', (event) => {
    if (!canWork() || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || ui.galleryDialog.open) return
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); restoreHistory(event.shiftKey) }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); restoreHistory(true) }
    else if (tools[Number(event.key) - 1] && /^[1-7]$/.test(event.key)) ui.toolButtons.find((button) => button.dataset.tool === tools[Number(event.key) - 1])?.click()
  }, { signal })
  ui.paintingTitle.addEventListener('input', () => { if (canWork()) { active().title = ui.paintingTitle.value.slice(0, 80); markDirty() } }, { signal })
  ui.save.addEventListener('click', () => { void runTask('正在保存到作品集…', () => persistPainting(false)) }, { signal }); ui.saveCopy.addEventListener('click', () => { void runTask('正在另存作品副本…', () => persistPainting(true)) }, { signal })
  ui.gallery.addEventListener('click', () => { void openGallery().catch((error) => tell(message(error))) }, { signal }); ui.closeGallery.addEventListener('click', () => ui.galleryDialog.close(), { signal }); ui.galleryDialog.addEventListener('close', clearGalleryUrls, { signal })
  ui.export.addEventListener('click', () => { void runTask('正在生成作品图片…', download) }, { signal })
  ui.projectExport.addEventListener('click', () => { void runTask('正在打包可编辑作品文件…', async () => { const art = await captureArt(active()); downloadBlob(await exportArtProject(art), `${safeName(active().title)}.sandart.json`); tell('可编辑作品文件已导出，包含沙层、参考图和创作设置。') }) }, { signal })
  ui.projectImport.addEventListener('click', () => { if (canWork()) ui.projectFile.click() }, { signal }); ui.projectFile.addEventListener('change', () => {
    const file = ui.projectFile.files?.[0]
    if (file) void runTask('正在恢复可编辑作品…', async () => { const art = await importArtProject(file); await applySaved(art, undefined, art.title || file.name.replace(/\.sandart\.json$/i, '')); tell('作品文件已恢复，可继续编辑；保存后加入本地作品集。') })
    ui.projectFile.value = ''
  }, { signal })
  document.addEventListener('visibilitychange', () => { if (ready && document.hidden) { finishStroke(); for (const workspace of workspaces.values()) void autosave(workspace) } }, { signal })
}

async function readBuffer(buffer: GPUBuffer, bytes: number): Promise<ArrayBuffer> {
  const staging = device!.createBuffer({ label: 'Sand art reference readback', size: bytes, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
  try { const encoder = device!.createCommandEncoder(); encoder.copyBufferToBuffer(buffer, 0, staging, 0, bytes); device!.queue.submit([encoder.finish()]); await staging.mapAsync(GPUMapMode.READ); const result = staging.getMappedRange().slice(0); staging.unmap(); return result }
  finally { staging.destroy() }
}
async function captureArt(workspace: Workspace): Promise<SavedArt> {
  const data = meta(workspace), savedAt = new Date().toISOString()
  const [state, referenceState] = await Promise.all([workspace.solver.readState(), readBuffer(workspace.solver.referenceBuffer, workspace.solver.byteLength)])
  return { version: 1, width: GRID_WIDTH, height: GRID_HEIGHT, mode: workspace.mode, state: state.buffer as ArrayBuffer, referenceState, savedAt, settings: data.settings, conversion: data.conversion, referenceImage: data.reference ? { blob: data.reference.blob, name: data.reference.name } : undefined, title: data.title.trim() || '未命名作品', paintingId: data.paintingId }
}
async function autosave(workspace: Workspace) {
  if (stopped || !ready || workspace.savedRevision === workspace.revision) return
  if (workspace.autoTask) return workspace.autoTask
  if (suspended || workspace.solver.airborne.pending || (workspace === active() && hasPointers())) { scheduleSave(workspace, 200); return }
  const revision = workspace.revision; setAutosave(workspace, '正在自动保存…')
  workspace.autoTask = (async () => {
    try {
      const art = await captureArt(workspace); if (stopped) return
      await writeWorkspaceDraft(art, workspace.exampleId); workspace.savedRevision = revision
      if (workspace.revision === revision) setAutosave(workspace, `${workspace.exampleId ? '示例试画已独立暂存' : '已自动保存'} · ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`)
      else scheduleSave(workspace)
    } catch (error) { if (!stopped) setAutosave(workspace, `自动保存失败：${message(error)}，可导出作品文件备份。`) }
    finally { workspace.autoTask = undefined }
  })()
  return workspace.autoTask
}
async function persistPainting(copy: boolean) {
  const workspace = active(); await workspace.autoTask
  const originalTitle = workspace.title.trim() || '未命名作品'
  const title = copy ? `${originalTitle.replace(/ · 副本$/, '')} · 副本`.slice(0, 80) : originalTitle
  const art = await captureArt(workspace), png = await exportPainting(device!, workspace.renderer, format, workspace.solver.stateIndex, options(performance.now(), workspace))
  const id = await savePainting({ ...art, title }, title, copy ? undefined : workspace.paintingId, await thumbnailOf(png))
  workspace.paintingId = id; workspace.title = title; workspace.revision++; await writeWorkspaceDraft({ ...art, title, paintingId: id }, workspace.exampleId); workspace.savedRevision = workspace.revision
  setAutosave(workspace, workspace.exampleId ? '你的试画已加入作品集 · 原示例与原草稿保留' : '已保存到作品集 · 草稿同步完成'); tell(copy ? '副本已加入作品集，原作品保留。' : '作品已保存，可从作品集中继续创作。')
}
async function thumbnailOf(png: Blob) {
  const image = await createImageBitmap(png)
  try { const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 192; canvas.getContext('2d')!.drawImage(image, 0, 0, 256, 192); return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('无法生成作品缩略图')), 'image/webp', 0.8)) }
  finally { image.close() }
}
function finite(value: number | undefined, fallback: number, min: number, max: number) { return Number.isFinite(value) ? clamp(value!, min, max) : fallback }
function loadedSettings(saved: Settings, artMode: ArtMode): Settings {
  const base = defaults(artMode)
  return { ...base, tool: tools.includes(saved.tool) ? saved.tool : base.tool, radius: finite(saved.radius, 16, 3, 42), strength: finite(saved.strength, 0.7, 0.1, 1), wetness: finite(saved.wetness, 0, 0, 1), wind: finite(saved.wind, 0, 0, 1), light: ['noon', 'sunset', 'moon'].includes(saved.light) ? saved.light : 'noon', flow: saved.flow === true, palmAngle: finite(saved.palmAngle, Math.PI / 2, -Math.PI * 2, Math.PI * 2), palmAspect: finite(saved.palmAspect, 0.45, 0.3, 1), pourStyle: ['stream', 'scatter', 'handful'].includes(saved.pourStyle ?? '') ? saved.pourStyle : 'scatter', pourHeight: finite(saved.pourHeight, 0.55, 0, 1), pourSpread: finite(saved.pourSpread, 0.5, 0, 1), referenceVisible: saved.referenceVisible ?? true, referenceOpacity: finite(saved.referenceOpacity, 0.35, 0, 1), referenceGrid: saved.referenceGrid === true }
}
function validateState(art: SavedArt, workspace: Workspace) {
  if (art.version !== 1 || art.width !== GRID_WIDTH || art.height !== GRID_HEIGHT || art.mode !== workspace.mode || !(art.state instanceof ArrayBuffer) || art.state.byteLength !== workspace.solver.byteLength) throw new Error('作品网格或版本不兼容。')
  for (const buffer of [art.state, art.referenceState].filter((value): value is ArrayBuffer => !!value)) {
    if (buffer.byteLength !== workspace.solver.byteLength) throw new Error('作品参考沙床尺寸不兼容。')
    const data = new Float32Array(buffer); if (!data.every(Number.isFinite)) throw new Error('作品包含无效数值。')
    for (let index = 0; index < data.length; index += 4) if (data[index] < 0) throw new Error('作品沙量不能为负数。')
  }
}
async function loadIntoWorkspace(art: SavedArt, workspace: Workspace, paintingId?: string, title?: string, capture = false) {
  validateState(art, workspace)
  const reference = art.referenceImage ? await readReferenceImage(art.referenceImage.blob, art.referenceImage.name) : null
  try { if (art.conversion) pixelsToSand(new Uint8ClampedArray(4), workspace.mode, art.conversion) }
  catch (error) { if (reference) URL.revokeObjectURL(reference.url); throw error }
  if (capture) workspace.history.capture(workspace.solver.state, workspace.solver.referenceBuffer, meta(workspace))
  workspace.solver.loadState(new Float32Array(art.state)); if (art.referenceState) device!.queue.writeBuffer(workspace.solver.referenceBuffer, 0, art.referenceState)
  workspace.settings = loadedSettings(art.settings, workspace.mode); setReference(workspace, reference); workspace.conversion = art.conversion ? { ...art.conversion } : defaultConversion(workspace.mode)
  workspace.title = (title ?? art.title ?? '未命名作品').slice(0, 80); workspace.paintingId = paintingId
}
async function applySaved(art: SavedArt, paintingId?: string, title?: string) {
  const workspace = workspaces.get(art.mode); if (!workspace) throw new Error('无法识别作品模式。')
  if (workspace.exampleId) {
    clearTimeout(workspace.saveTimer); await workspace.autoTask
    await writeWorkspaceDraft(await captureArt(workspace), workspace.exampleId)
  }
  await workspace.autoTask; await loadIntoWorkspace(art, workspace, paintingId, title, true)
  workspace.exampleId = undefined
  mode = art.mode; previousTime = 0; accumulator = 0; markDirty(workspace)
}
async function openHandExample(id: string, restart = false) {
  const example = findHandExample(id)
  if (!example) { tell('没有这个手绘示例，可以回到作品集重新选择。'); return }
  if (!canWork() || recording) { tell('请先结束录制或回放，再打开示例。'); return }
  await runTask('正在准备可编辑的手绘示例…', async () => {
    const workspace = workspaces.get(example.mode)!
    clearTimeout(workspace.saveTimer); await workspace.autoTask
    await writeWorkspaceDraft(await captureArt(workspace), workspace.exampleId)
    const saved = restart ? undefined : await readExampleDraft(id)
    const art = saved ?? await (await import('./examples/material')).makeExampleArt(device!, example)
    await loadIntoWorkspace(art, workspace, saved?.paintingId, art.title)
    workspace.history.destroy(); workspace.exampleId = id; workspace.handRemaining = HAND_CAPACITY
    mode = example.mode; previousTime = 0; accumulator = 0; cursor = null
    // Commit the loaded example before enabling navigation. In particular,
    // restoring its original state must survive an immediate page change.
    await writeWorkspaceDraft({ ...art, paintingId: saved?.paintingId }, id)
    workspace.revision++; workspace.savedRevision = workspace.revision
    setAutosave(workspace, '示例试画已独立暂存 · 原草稿保留')
    history.replaceState(null, '', '#example=' + encodeURIComponent(id))
    tell(saved ? `已恢复「${example.title}」的试画。可以继续操作；原草稿保留。` : `「${example.title}」已载入原画台。按住拖动试画，保存后加入你的作品集。`)
  })
  if (active().exampleId === id) { ui.canvas.scrollIntoView({ block: 'center' }); ui.canvas.focus({ preventScroll: true }) }
}
async function returnOriginalDraft() {
  if (!canWork() || recording || !active().exampleId) return
  await runTask('正在返回原草稿…', async () => {
    const workspace = active(); clearTimeout(workspace.saveTimer); await workspace.autoTask
    await writeWorkspaceDraft(await captureArt(workspace), workspace.exampleId)
    const art = await loadArt(workspace.mode)
    if (!art) throw new Error('原草稿暂时不可读，试画已独立暂存。')
    await loadIntoWorkspace(art, workspace, art.paintingId); workspace.history.destroy(); workspace.exampleId = undefined
    workspace.revision++; workspace.savedRevision = workspace.revision
    setAutosave(workspace, '已返回原草稿 · 示例试画独立保留')
    history.replaceState(null, '', '#mode=' + mode); tell('原来的沙层、名称与设置已恢复。')
  })
}
function clearGalleryUrls() { for (const url of galleryUrls) URL.revokeObjectURL(url); galleryUrls.clear() }
async function openGallery() {
  if (!canWork() || recording || ui.galleryDialog.open) return
  finishStroke(); clearGalleryUrls(); ui.galleryList.replaceChildren(); const paintings = await listPaintings()
  if (!canWork() || recording || stopped) return
  if (!paintings.length) { const empty = document.createElement('p'); empty.className = 'gallery-empty'; empty.textContent = '作品集还是空的。为作品起个名字，点击「保存作品」即可加入。'; ui.galleryList.append(empty) }
  for (const painting of paintings) {
    const card = document.createElement('article'); card.className = 'gallery-card'
    if (painting.thumbnail) { const image = document.createElement('img'); image.className = 'gallery-thumbnail'; image.src = URL.createObjectURL(painting.thumbnail); galleryUrls.add(image.src); image.alt = `${painting.title}的沙画缩略图`; card.append(image) }
    const copy = document.createElement('div'); copy.className = 'gallery-copy'
    const title = document.createElement('h3'); title.textContent = painting.title
    const detail = document.createElement('p'); detail.textContent = `${modeLabels[painting.mode]} · ${new Date(painting.date).toLocaleString('zh-CN')}`
    const open = document.createElement('button'); open.className = 'gallery-open'; open.textContent = '继续创作'; open.setAttribute('aria-label', `继续创作 ${painting.title}`)
    open.addEventListener('click', () => { if (!canWork() || recording) return; ui.galleryDialog.close(); void runTask('正在载入作品…', async () => { const art = await loadPainting(painting.id); if (!art) throw new Error('作品未找到。'); await applySaved(art, painting.id, painting.title); tell(`已载入「${painting.title}」，可以继续编辑。`) }) }, { signal: listeners.signal })
    copy.append(title, detail, open); card.append(copy); ui.galleryList.append(card)
  }
  if (!stopped) ui.galleryDialog.showModal()
}
const safeName = (title: string) => (title.trim() || '沙画作品').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80)
function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000) }
async function download() { const blob = await exportPainting(device!, active().renderer, format, active().solver.stateIndex, options(performance.now())); downloadBlob(blob, `${safeName(active().title)}-${modeLabels[mode]}.png`); tell('作品已导出为 1536 × 1152 PNG，参考图与工具栏不包含在成品中。') }
function fail(reason: unknown) {
  ready = false; stopped = true; cancelAnimationFrame(animation); ui.overlay.hidden = false
  ui.overlay.textContent = `画台暂时无法运行：${message(reason)}。需要支持 WebGPU 的浏览器与图形设备。可以通过右上角入口查看原版效果。`
  tell('画台初始化失败'); console.error('[Sand art]', reason)
}
function resize() {
  const rect = ui.canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.max(1, Math.round(rect.width * dpr)), height = Math.max(1, Math.round(rect.height * dpr))
  if (ui.canvas.width !== width || ui.canvas.height !== height) { ui.canvas.width = width; ui.canvas.height = height }
}
function renderReplayFrame() {
  if (!replay || stopped) return
  const encoder = device!.createCommandEncoder()
  const view = context!.getCurrentTexture().createView()
  replay.encodeRender(encoder, view, replay.tick * FIXED_STEP, demoActive ? demoPhaseAt(replay.tick).cursor ?? null : null)
  device!.queue.submit([encoder.finish()]); framesInFlight++
  void device!.queue.onSubmittedWorkDone().then(() => { framesInFlight = Math.max(0, framesInFlight - 1) }).catch(fail)
}
function frame(now: number) {
  if (stopped) return
  animation = requestAnimationFrame(frame); if (document.hidden) { previousTime = 0; return }; if (framesInFlight > 0 || !ready) return
  try {
    resize(); const elapsed = previousTime ? Math.max(0, (now - previousTime) / 1000) : 0
    previousTime = now
    if (replay) {
      if (replayBusy) { previousTime = 0; return }
      if (replayPlaying && !suspended) {
        replayAccumulator += Math.min(elapsed, 0.1) * Number(ui.replaySpeed.value) / FIXED_STEP
        const ticks = Math.min(16, Math.floor(replayAccumulator), replay.durationTicks - replay.tick)
        if (ticks > 0) {
          replayAccumulator -= ticks; replayBusy = true
          const session = replay
          const action = ++replayAction
          void session.advance(ticks).then(() => {
            if (replay !== session || replayAction !== action) return
            if (session.tick >= session.durationTicks) { replayPlaying = false; replayAccumulator = 0; tell(demoActive ? '山月沙画已落定。可以重新演示，或退出后自己抓沙试画。' : '回放已结束。可以重新播放或回到创作。') }
            renderReplayFrame()
          }).catch((error) => { if (replay === session && replayAction === action) { replayPlaying = false; if (!(error instanceof DOMException && error.name === 'AbortError')) tell(message(error)) } }).finally(() => { if (replay === session && replayAction === action) { replayBusy = false; updateRecordingControls() } })
          return
        }
      }
      renderReplayFrame()
      return
    }
    accumulator += Math.min(elapsed, FIXED_STEP * MAX_STEPS)
    const count = Math.min(MAX_STEPS, Math.floor((accumulator + 1e-9) / FIXED_STEP)); accumulator -= count * FIXED_STEP
    const encoder = device!.createCommandEncoder(); let changed = false
    const falling = active().solver.airborne.pending
    if (!suspended) for (let slot = 0; slot < count; slot++) { const contacts = nextContacts(); changed ||= contacts.length > 0 || active().solver.airborne.pending; encodeStep(encoder, contacts, slot) }
    active().renderer.encode(encoder, context!.getCurrentTexture().createView(), active().solver.stateIndex, options(now)); device!.queue.submit([encoder.finish()]); framesInFlight++
    if (changed) markDirty()
    updateHand()
    if (falling && !active().solver.airborne.pending && !hasPointers()) { scheduleSave(active(), 0); tell(active().handRemaining > 0 ? '沙已落定，可以推、刮或再撒一笔。' : '沙已落定。手中沙已撒完，再抓一把继续。') }
    if (!suspended && (active().settings.flow || active().settings.wind > 0) && now - lastDynamicsDirty > 10000) { markDirty(); lastDynamicsDirty = now }
    if (recording) updateRecordingControls()
    void device!.queue.onSubmittedWorkDone().then(() => { framesInFlight = Math.max(0, framesInFlight - 1) }).catch(fail)
  } catch (error) { fail(error) }
}
async function start() {
  if (!navigator.gpu) throw new Error('此浏览器没有启用 WebGPU')
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }); if (!adapter) throw new Error('没有找到可用的 GPU')
  device = await adapter.requestDevice({ label: 'Independent sand art experiment' }); device.addEventListener('uncapturederror', (event) => fail(event.error), { signal: listeners.signal }); void device.lost.then((info) => { if (!stopped) fail(new Error(info.message)) })
  context = ui.canvas.getContext('webgpu'); if (!context) throw new Error('无法创建 WebGPU 画布')
  format = navigator.gpu.getPreferredCanvasFormat(); context.configure({ device, format, alphaMode: 'opaque' })
  for (const artMode of modes) {
    const solver = new ArtSolver(device, artMode); await solver.initialize(); const renderer = new ArtRenderer(device, format, solver.buffers, solver.width, solver.height, solver.airborne); await renderer.initialize()
    if (artMode === 'lightbox') { const empty = device.createCommandEncoder(); solver.reset(empty, 'empty'); device.queue.submit([empty.finish()]) }
    workspaces.set(artMode, { mode: artMode, solver, renderer, history: new ArtHistory<HistoryMeta>(device, solver.byteLength), handRemaining: HAND_CAPACITY, settings: defaults(artMode), reference: null, conversion: defaultConversion(artMode), title: '未命名作品', revision: 0, savedRevision: 0, autosaveMessage: '笔画与设置会自动保存到此浏览器' })
  }
  try { lastRecording = await loadRecording() } catch (error) { tell(`上次录制未恢复：${message(error)}`) }
  let restored = 0
  for (const artMode of modes) {
    try { const saved = await loadArt(artMode); if (saved) { const workspace = workspaces.get(artMode)!; await loadIntoWorkspace(saved, workspace, saved.paintingId); setAutosave(workspace, '已恢复此浏览器的自动草稿'); restored++ } }
    catch (error) { setAutosave(workspaces.get(artMode)!, `草稿未恢复：${message(error)}，仍可开始新作品。`) }
  }
  ui.baselineLink.href = location.hostname === '127.0.0.1' || location.hostname === 'localhost' ? 'http://127.0.0.1:4173/1008_codex_project/001-sandboard/' : new URL('../', location.href).href
  attachInputs(); attachRecordingInputs(); attachDemoInputs(); ready = true; ui.overlay.hidden = true; for (const control of ui.controls) control.disabled = false
  updateControls(); tell(restored ? '已恢复本地草稿。参考图、参数与沙层一同保留。' : '画台已就绪。导入参考图临摹，或直接开始沙画。'); resize(); animation = requestAnimationFrame(frame)
  openWorkspaceEntry()
}
function stop() {
  stopped = true; ready = false; cancelAnimationFrame(animation); listeners.abort()
  videoAbort?.abort(); replay?.destroy(); replay = undefined
  for (const workspace of workspaces.values()) { clearTimeout(workspace.saveTimer); workspace.history.destroy(); workspace.renderer.destroy(); workspace.solver.destroy() }
  for (const url of referenceUrls) URL.revokeObjectURL(url); clearGalleryUrls(); context?.unconfigure(); device?.destroy()
}
// Start the final readback before releasing GPU resources. Closing a browser
// cannot guarantee asynchronous storage finishes; normal completed strokes save
// immediately, and this adds a best-effort flush for pending setting changes.
async function closeStudio() {
  if (stopped) return
  if (!ready) { stop(); return }
  finishStroke()
  for (const workspace of workspaces.values()) clearTimeout(workspace.saveTimer)
  const pending = [...workspaces.values()].map((workspace) => {
    if (workspace.savedRevision === workspace.revision) return workspace.autoTask
    const prior = workspace.autoTask, snapshot = captureArt(workspace)
    const exampleId = workspace.exampleId
    return (async () => { const art = await snapshot; await prior; await writeWorkspaceDraft(art, exampleId) })()
  })
  if (recording) { const builder = recording; recording = undefined; pending.push(builder.finish(active().title.trim() || '未命名作品').then((result) => result.ticks ? saveRecording(result) : undefined)) }
  suspended = true; cancelAnimationFrame(animation)
  try { await Promise.allSettled(pending) } finally { stop() }
}
window.addEventListener('pagehide', () => { void closeStudio() }, { once: true }); import.meta.hot?.dispose(stop); void start().catch(fail)
