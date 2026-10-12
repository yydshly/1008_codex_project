import './style.css'
import { StageMaterial, type StageMaterialSnapshot, type StagePoint, type StageContact } from '../stage/material'
import { drawStageHand } from '../stage/hand'
import type { StageHand } from '../stage/show'
import { SandPainting, PRODUCT_WIDTH, PRODUCT_HEIGHT, PRODUCT_STEP, phaseNames, type PaintingState } from './planner'
import { readProductDraft, writeProductDraft, type ProductDraft } from './storage'
import { GesturePainting, type GestureSnapshot } from './gestures'
import { gestureScores } from './studies'
import { readProductEntry, type ProductEntry } from './entry'

type Source = { title: string; image: string }
type Tool = 'scatter' | 'stream' | 'palm' | 'finger' | 'collect' | 'rub'
type ReplayState = { reference?: PaintingState; gesture?: GestureSnapshot }
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

/** 可回放的供沙演示与独立保存的手动作品，共用材料模拟和透光渲染。 */
export function mountSandProduct(root: HTMLElement, sources: readonly Source[]) {
  root.innerHTML = `
    <div class="sp-heading"><div><p class="eyebrow">实时沙画 · 创作与演示</p><h1><span id="sp-heading-title">沙块塑形</span><small>先有沙块，再长出形体。</small></h1></div><p>看一幅画逐渐形成，<br>也可以随时接过沙台。</p></div>
    <div class="sp-workspace">
      <div class="sp-stage">
        <div class="sp-stage-top"><span id="sp-mode">手势演出</span><span id="sp-phase">正在准备沙台…</span><label><input id="sp-hand" type="checkbox" checked> 显示手势</label></div>
        <div class="sp-bed" id="sp-bed"><canvas id="sp-canvas" width="1152" height="648" tabindex="0" aria-label="实时灯箱沙台，接管后按住并拖动绘画"></canvas><button id="sp-exit-fullscreen" type="button" class="sp-exit-fullscreen">退出全屏 ×</button><p id="sp-loading" role="status">正在分析参考构图…</p></div>
        <div class="sp-transport"><button id="sp-play" type="button" class="sp-primary" disabled>播放成画</button><button id="sp-restart" type="button" disabled>从空台开始</button><button id="sp-finish" type="button" disabled>观看成品</button><label class="sp-speed">速度 <select id="sp-speed"><option value="0.5">0.5×</option><option value="1">1×</option><option value="2" selected>2×</option><option value="4">4×</option></select></label><button id="sp-fullscreen" type="button">全屏 ↗</button></div>
        <label class="sp-timeline"><span class="sr-only">成画进度</span><input id="sp-time" type="range" min="0" max="100" step="1" value="0" disabled><output id="sp-clock">0:00</output></label>
        <div class="sp-stage-bottom"><span id="sp-account">空台 · 等待供沙</span><span>画面由沙层透光生成</span></div>
        <div class="sp-action" aria-live="off"><strong id="sp-action-title">抓沙，准备作画</strong><p id="sp-action-note">先铺大形，再推开亮面，最后添细节。</p><div id="sp-chapters" class="sp-chapters" role="group" aria-label="手势演出章节"></div></div>
      </div>
      <aside class="sp-panel" aria-label="作品和创作工具">
        <p class="sp-label">观看方式</p><div class="sp-demo-modes" role="group" aria-label="成画方式"><button type="button" data-demo="gesture" aria-pressed="true">手势演出</button><button type="button" data-demo="reference" aria-pressed="false">参考还原</button></div><p id="sp-demo-note" class="sp-help">一笔一笔塑造景物。当前手势版演示归舟构图；原来的三幅参考还原继续保留。</p>
        <div id="sp-gesture-works"><p class="sp-label">局部塑形与原演出</p><div class="sp-works" role="group" aria-label="选择手势演出">${gestureScores.map((score, i) => `<button type="button" data-score="${score.id}" aria-pressed="${i === 0}"><span>0${i + 1}</span>${score.title}</button>`).join('')}</div><p class="sp-help" id="sp-score-note"></p></div>
        <div id="sp-reference-works" hidden><p class="sp-label">三幅参考还原</p><div class="sp-works" role="group" aria-label="选择成画作品">${sources.map((source, i) => `<button type="button" data-work="${i}" aria-pressed="${i === 0}"><span>0${i + 1}</span>${source.title}</button>`).join('')}</div></div>
        <div class="sp-divider"></div><button id="sp-takeover" class="sp-primary sp-wide" type="button" disabled>接过这幅画，亲手修改</button><button id="sp-return" class="sp-wide" type="button" hidden>返回成画演示</button>
        <p id="sp-help" class="sp-help">播放中可暂停，接过当前沙层继续撒沙、推沙与留白。演示不会覆盖你的草稿。</p>
        <fieldset id="sp-tools" disabled><legend>手上的动作</legend><div class="sp-tools" role="group" aria-label="沙画工具"><button type="button" data-tool="scatter" aria-pressed="true">抓沙散撒</button><button type="button" data-tool="stream" aria-pressed="false">指缝细流</button><button type="button" data-tool="palm" aria-pressed="false">掌侧推沙</button><button type="button" data-tool="finger" aria-pressed="false">指尖划光</button><button type="button" data-tool="collect" aria-pressed="false">掌心收沙</button><button type="button" data-tool="rub" aria-pressed="false">掌腹揉沙</button></div>
          <label class="sp-slider">手势宽度 <output id="sp-width-label">22</output><input id="sp-width" type="range" min="2" max="90" value="22"></label><label class="sp-slider">力度 / 沙量 <output id="sp-strength-label">1.6</output><input id="sp-strength" type="range" min="0.2" max="3" step="0.1" value="1.6"></label>
          <div id="sp-contact-shape"><label class="sp-slider">掌形方向 <output id="sp-angle-label">0°</output><input id="sp-angle" type="range" min="-180" max="180" step="5" value="0"></label><label class="sp-slider">掌形宽厚比 <output id="sp-aspect-label">0.65</output><input id="sp-aspect" type="range" min="0.25" max="1.4" step="0.05" value="0.65"></label></div>
          <div class="sp-edit-actions"><button id="sp-undo" type="button" disabled>撤销</button><button id="sp-clear" type="button">清空沙台</button></div><label class="sp-title">作品名<input id="sp-title" maxlength="60" value="我的沙画"></label><button id="sp-save" type="button" class="sp-wide">保存草稿</button>
        </fieldset>
        <button id="sp-restore" type="button" class="sp-wide" disabled>恢复上次草稿</button><button id="sp-export" type="button" class="sp-wide" disabled>导出当前沙画 PNG ↓</button>
        <div class="sp-file-actions"><button id="sp-file-save" type="button" disabled>导出可编辑作品</button><button id="sp-file-open" type="button">导入作品</button><input id="sp-file" type="file" accept=".json,application/json" hidden></div>
        <p id="sp-status" class="sp-status" role="status" aria-live="polite">草稿仅保存在当前浏览器。</p>
      </aside>
    </div><p class="sp-method" id="sp-method">手势演出按天光、近岸、柳树、石桥与归舟的造型顺序作画，每一笔连续撒沙或移沙。程序手影提示动作，可关闭；原来的参考还原在另一观看方式中保留。</p>`
  const find = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#sp-${id}`)!
  const canvas = find<HTMLCanvasElement>('canvas'), ctx = canvas.getContext('2d')!
  const loading = find('loading'), play = find<HTMLButtonElement>('play'), time = find<HTMLInputElement>('time')
  const tools = find<HTMLFieldSetElement>('tools'), title = find<HTMLInputElement>('title')
  const speed = find<HTMLSelectElement>('speed'), width = find<HTMLInputElement>('width'), strength = find<HTMLInputElement>('strength')
  const angle = find<HTMLInputElement>('angle'), aspect = find<HTMLInputElement>('aspect')
  const showHand = find<HTMLInputElement>('hand')
  const controller = new AbortController(), signal = controller.signal
  const on = (element: EventTarget, name: string, listener: EventListener) => element.addEventListener(name, listener, { signal })
  let disposed = false, generation = 0, frameId = 0, previousTime = 0, accumulator = 0
  let painting: SandPainting | GesturePainting | undefined, playing = false, busy = true, manual = false, activeWork = 0, tool: Tool = 'scatter'
  let demoMode: 'gesture' | 'reference' = 'gesture'
  let activeScore = gestureScores[2]
  let checkpoint = new Map<number, ReplayState>()
  const material = new StageMaterial(PRODUCT_WIDTH, PRODUCT_HEIGHT, 0x61a911, 20000)
  let draft: ProductDraft | undefined, saveTimer: ReturnType<typeof setTimeout> | undefined, saveQueue = Promise.resolve()
  let dirty = true, revision = 0, savedRevision = -1, accountTime = 0
  const undo: StageMaterialSnapshot[] = []
  let pointer: { id: number; point: StagePoint; last: StagePoint; pressure: number } | undefined
  let hand: StageHand | null = null
  const activeMaterial = () => manual ? material : painting?.material ?? material
  const tell = (message: string) => { find('status').textContent = message }
  const setBusy = (value: boolean, message = '') => { busy = value; loading.hidden = !value; loading.textContent = message; updateControls() }
  function updateControls() {
    const gesture = painting instanceof GesturePainting ? painting : undefined
    play.disabled = busy || manual || !painting
    play.textContent = playing ? '暂停成画' : painting && painting.tick >= painting.totalTicks ? '再演示一次' : painting?.tick ? '继续成画' : '播放成画'
    find<HTMLButtonElement>('restart').disabled = busy || manual || !painting
    find<HTMLButtonElement>('finish').disabled = busy || manual || !painting
    find<HTMLButtonElement>('takeover').disabled = busy || manual || !painting
    find('takeover').hidden = manual
    find('return').hidden = !manual
    const shownTitle = demoMode === 'gesture' ? activeScore.title : sources[activeWork].title
    find('heading-title').textContent = shownTitle
    find('mode').textContent = manual ? '手动创作' : `${demoMode === 'gesture' ? '手势演出' : '参考还原'} · ${shownTitle}`
    find('phase').textContent = manual ? '按住沙台并拖动 · 支持触控与笔压' : gesture ? gesture.score.chapters[gesture.sample.chapter].label : painting instanceof SandPainting ? phaseNames[painting.phase] : '准备中'
    root.querySelectorAll<HTMLButtonElement>('[data-demo]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.demo === demoMode)); b.disabled = busy })
    root.querySelectorAll<HTMLButtonElement>('[data-work]').forEach(b => { b.disabled = busy })
    root.querySelectorAll<HTMLButtonElement>('button[data-score]').forEach(b => { b.disabled = busy; b.setAttribute('aria-pressed', String(b.dataset.score === activeScore.id)) })
    find('gesture-works').hidden = demoMode !== 'gesture'; find('reference-works').hidden = demoMode !== 'reference'
    find('score-note').textContent = activeScore.description
    find('demo-note').textContent = demoMode === 'gesture' ? '先看沙块怎样塑成形，再接过来继续画。可直接观看成品，或按章节观察每一遍修整。' : '按参考图的局部明暗还原沙层。保留原来的效果，作画轨迹采用扫描式规划。'
    find('method').textContent = demoMode === 'gesture' ? '三个局部手势示范使用撒沙、守恒揉沙、推沙与收沙塑形；原归舟演出另行保留。全部画面来自真实材料，程序手影仅提示动作。目前是原创编排，仍需改善造型与表演节奏。' : '参考还原使用本地目标图规划落沙位置与沙量，实际供沙和收沙生成画面。这种方式擅长还原明暗，轨迹具有扫描特征。'
    find('action-title').textContent = manual ? '由你接着创作' : gesture?.sample.label ?? '参考明暗还原'
    find('action-note').textContent = manual ? '按住沙台拖动，撒出暗面、推开亮面或收走局部沙量。' : gesture?.sample.explanation ?? '此模式保留参考还原效果。切换「手势演出」可观看按造型顺序推进的连续动作。'
    find('chapters').hidden = !gesture || manual
    if (gesture && find('chapters').dataset.chapterScore !== gesture.score.id) {
      find('chapters').dataset.chapterScore = gesture.score.id
      find('chapters').innerHTML = gesture.score.chapters.map((item, i) => `<button type="button" data-chapter="${item.tick}" data-chapter-index="${i}">${item.label}</button>`).join('')
    }
    root.querySelectorAll<HTMLButtonElement>('[data-chapter]').forEach(b => { b.disabled = busy; b.setAttribute('aria-pressed', String(gesture?.sample.chapter === Number(b.dataset.chapterIndex))) })
    find('help').textContent = manual
      ? '散撒塑暗部，推沙与指尖搬沙留光，揉沙整理灰面；揉沙不添沙。掌形可以调整方向和宽厚比，可撤销最近 8 次操作。'
      : '播放中可暂停，接过当前沙层继续撒沙、推沙与留白。演示不会覆盖你的草稿。'
    tools.disabled = !manual || busy
    tools.hidden = !manual
    find('contact-shape').hidden = tool !== 'palm' && tool !== 'rub'
    find<HTMLButtonElement>('undo').disabled = undo.length === 0
    find<HTMLButtonElement>('restore').disabled = !draft || busy
    find<HTMLButtonElement>('export').disabled = busy || !painting
    find<HTMLButtonElement>('file-save').disabled = busy || !painting
    find<HTMLButtonElement>('file-open').disabled = busy
    time.disabled = busy || manual || !painting
    if (painting) {
      time.max = String(painting.totalTicks); time.value = String(painting.tick)
      find<HTMLOutputElement>('clock').value = `${timeLabel(painting.tick * PRODUCT_STEP)} / ${timeLabel(painting.totalTicks * PRODUCT_STEP)}`
    }
  }
  function remember() { undo.push(material.read()); if (undo.length > 8) undo.shift(); updateControls() }
  function changed() { revision++; dirty = true; scheduleSave() }
  function scheduleSave() {
    if (!manual) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { void saveDraft() }, 650)
  }
  async function saveDraft() {
    if (!manual || savedRevision === revision) return
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = undefined }
    const capturedRevision = revision
    const captured: ProductDraft = { version: 1, title: title.value.trim() || '我的沙画', snapshot: material.read(), savedAt: new Date().toISOString() }
    saveQueue = saveQueue.then(async () => {
      try {
        await writeProductDraft(captured)
        draft = captured; savedRevision = capturedRevision
        if (!disposed) { tell(`草稿已保存 · ${new Date(captured.savedAt).toLocaleTimeString('zh-CN')}`); updateControls() }
      } catch { if (!disposed) tell('浏览器无法保存草稿，请导出可编辑作品保留进度。') }
    })
    await saveQueue
  }
  function enterManual(snapshot: StageMaterialSnapshot, name: string) {
    material.restore(snapshot)
    generation++; playing = false; accumulator = 0; pointer = undefined; hand = null; manual = true
    title.value = name; undo.length = 0; revision++; savedRevision = -1
    dirty = true; updateControls(); scheduleSave()
  }
  async function loadWork(index: number, autoplay = location.hash !== '#pause') {
    const token = ++generation
    setBusy(true, '正在准备落沙路线…')
    if (manual) await saveDraft()
    if (disposed || token !== generation) return
    playing = false; manual = false; pointer = undefined; hand = null; accumulator = 0; activeWork = index
    painting = undefined; checkpoint = new Map(); dirty = true
    find('account').textContent = '空台 · 等待供沙'; accountTime = 0
    root.querySelectorAll<HTMLButtonElement>('[data-work]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.work) === index)))
    if (demoMode === 'gesture') {
      painting = new GesturePainting(activeScore)
      checkpoint.set(0, { gesture: painting.read() })
      showHand.checked = true; speed.value = '1'
      playing = autoplay
      setBusy(false); dirty = true
      tell('从沙块到形体：可按章节观看、直接查看成品，或接过当前沙层继续画。')
      return
    }
    try {
      const image = new Image(); image.src = sources[index].image; await image.decode()
      if (disposed || token !== generation) return
      // 参考图只在离屏画布中提取明暗，显示画布只调用 StageMaterial.render。
      const analysis = document.createElement('canvas'); analysis.width = 384; analysis.height = 216
      const analysisCtx = analysis.getContext('2d', { willReadFrequently: true })!
      analysisCtx.drawImage(image, 0, 0, 384, 216)
      const pixels = analysisCtx.getImageData(0, 0, 384, 216).data
      painting = new SandPainting(pixels, 384, 216, PRODUCT_WIDTH, PRODUCT_HEIGHT, index)
      checkpoint.set(0, { reference: painting.read() })
      showHand.checked = false; speed.value = '2'
      playing = autoplay
      setBusy(false); dirty = true
      tell('从空台开始供沙。可拖动进度查看成画阶段，或接过当前画面继续创作。')
    } catch { if (token === generation && !disposed) { setBusy(false); tell('参考构图载入失败，点击作品名称重试。') } }
  }
  async function seek(tick: number, resume = false) {
    if (!painting || manual) return
    const token = ++generation
    playing = false; accumulator = 0; pointer = undefined
    const destination = clamp(Math.round(tick), 0, painting.totalTicks)
    let nearest = 0
    for (const key of checkpoint.keys()) if (key <= destination && key > nearest) nearest = key
    const saved = checkpoint.get(nearest)!
    if (painting instanceof GesturePainting) painting.restore(saved.gesture!)
    else painting.restore(saved.reference!)
    setBusy(true, '正在重新落沙，恢复这一刻的沙层…')
    try {
      while (painting.tick < destination) {
        const start = performance.now()
        do { painting.step(); cacheCheckpoint() } while (painting.tick < destination && performance.now() - start < 12)
        dirty = true; updateControls()
        loading.textContent = `正在恢复沙层… ${Math.round(painting.tick / Math.max(destination, 1) * 100)}%`
        await nextFrame()
        if (disposed || token !== generation) return
      }
      playing = resume && destination < painting.totalTicks
      setBusy(false); dirty = true
    } catch { if (token === generation) { setBusy(false); tell('这一刻恢复失败，请从空台重新演示。') } }
  }
  function cacheCheckpoint() {
    if (painting && painting.tick % 600 === 0 && !checkpoint.has(painting.tick)) checkpoint.set(painting.tick,
      painting instanceof GesturePainting ? { gesture: painting.read() } : { reference: painting.read() })
  }
  function manualStep(from: StagePoint, to: StagePoint, dt: number, pressure = 1) {
    const radius = Number(width.value) / PRODUCT_WIDTH
    const power = Number(strength.value) * clamp(pressure, .15, 1)
    if (tool === 'collect') { material.step(dt, []); material.collect(from, to, radius, power, dt) }
    else {
      const contact: StageContact = { from, to, radius, strength: power, tool: tool === 'palm' ? 'sweep' : tool === 'finger' ? 'finger' : tool === 'rub' ? 'rub' : 'pour',
        spread: tool === 'scatter' ? .92 : .10, height: tool === 'scatter' ? .25 : .04,
        angle: tool === 'palm' || tool === 'rub' ? Number(angle.value) * Math.PI / 180 : undefined,
        aspect: tool === 'palm' || tool === 'rub' ? Number(aspect.value) : undefined }
      material.step(dt, [contact])
    }
    hand = { ...to, down: true, pose: tool === 'palm' || tool === 'collect' || tool === 'rub' ? 'palm' : tool === 'finger' ? 'finger' : 'pour', rotation: tool === 'palm' || tool === 'rub' ? Number(angle.value) * Math.PI / 180 : -.2 }
    dirty = true
  }
  function render() {
    activeMaterial().render(ctx)
    const shownHand = manual ? hand : painting?.hand
    if (showHand.checked && shownHand) drawStageHand(ctx, shownHand, activeMaterial().elapsedTime)
    dirty = false
  }
  function frame(now: number) {
    if (disposed) return
    const elapsed = previousTime ? Math.min(.1, (now - previousTime) / 1000) : 0
    previousTime = now
    if (!document.hidden && !busy) {
      if (!manual && playing && painting) {
        accumulator = Math.min(accumulator + elapsed * Number(speed.value), PRODUCT_STEP * 16)
        let steps = 0
        while (accumulator >= PRODUCT_STEP && steps++ < 16) {
          if (!painting.step()) { playing = false; accumulator = 0; tell('成画已完成。接过这幅画可以继续修改，或导出当前沙画。'); break }
          cacheCheckpoint(); accumulator -= PRODUCT_STEP; dirty = true
        }
        updateControls()
      } else if (manual && (pointer || material.pending)) {
        accumulator = Math.min(accumulator + elapsed, PRODUCT_STEP * 6)
        let steps = 0
        while (accumulator >= PRODUCT_STEP && steps++ < 6) {
          if (pointer) { manualStep(pointer.last, pointer.point, PRODUCT_STEP, pointer.pressure); pointer.last = { ...pointer.point } }
          else { material.step(PRODUCT_STEP, []); dirty = true }
          accumulator -= PRODUCT_STEP
        }
        // 最后一颗沙落定后补存，保证刷新恢复的是最终沙层。
        if (steps) changed()
      } else if (manual) accumulator = 0
    }
    if (dirty) render()
    if (now - accountTime > 600) {
      const m = activeMaterial()
      const held = !manual && painting instanceof GesturePainting && painting.sample.stroke?.tool === 'pour' ? ` · 手中余沙 ${Math.round(painting.sandFraction * 100)}%` : ''
      find('account').textContent = `已供沙 ${Math.round(m.suppliedMass).toLocaleString()} · 收走 / 台外 ${Math.round(m.removedMass).toLocaleString()}${held}`
      accountTime = now
    }
    frameId = requestAnimationFrame(frame)
  }
  const pointAt = (event: PointerEvent): StagePoint => {
    const rect = canvas.getBoundingClientRect()
    return { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1) }
  }
  on(canvas, 'pointerdown', event => {
    const e = event as PointerEvent
    if (!manual || busy || pointer || e.button !== 0) return
    e.preventDefault(); canvas.focus(); remember()
    const p = pointAt(e); pointer = { id: e.pointerId, point: p, last: p, pressure: e.pointerType === 'pen' ? e.pressure : 1 }
    canvas.setPointerCapture(e.pointerId); manualStep(p, p, PRODUCT_STEP, pointer.pressure); changed()
  })
  on(canvas, 'pointermove', event => {
    const e = event as PointerEvent
    if (pointer?.id !== e.pointerId) return
    pointer.point = pointAt(e); pointer.pressure = e.pointerType === 'pen' ? e.pressure : 1
  })
  const endPointer: EventListener = event => {
    const e = event as PointerEvent
    if (pointer?.id !== e.pointerId) return
    manualStep(pointer.last, pointAt(e), PRODUCT_STEP, pointer.pressure)
    pointer = undefined; hand = null; changed()
  }
  on(canvas, 'pointerup', endPointer); on(canvas, 'pointercancel', endPointer)
  on(canvas, 'lostpointercapture', () => { if (pointer) { pointer = undefined; hand = null; changed() } })
  on(play, 'click', () => {
    if (!painting) return
    if (painting.tick >= painting.totalTicks) { void seek(0, true); return }
    playing = !playing; accumulator = 0; updateControls()
  })
  on(find('restart'), 'click', () => { void seek(0, false) })
  on(find('finish'), 'click', () => { if (painting) void seek(painting.totalTicks) })
  on(time, 'input', () => { if (!manual && painting) { const requested = time.value; playing = false; updateControls(); time.value = requested; find<HTMLOutputElement>('clock').value = `${timeLabel(Number(requested) * PRODUCT_STEP)} / ${timeLabel(painting.totalTicks * PRODUCT_STEP)}` } })
  on(time, 'change', () => { void seek(Number(time.value)) })
  on(find('takeover'), 'click', () => { if (painting) enterManual(painting.material.read(), `我的${demoMode === 'gesture' ? activeScore.title : sources[activeWork].title}`) })
  on(find('return'), 'click', () => { void saveDraft(); manual = false; pointer = undefined; hand = null; dirty = true; updateControls(); tell('回到接管前的演示位置。手动修改已单独保存为草稿。') })
  root.querySelectorAll<HTMLButtonElement>('[data-work]').forEach(b => on(b, 'click', () => {
    if (busy) return
    const index = Number(b.dataset.work)
    if (index > 0) demoMode = 'reference'
    void loadWork(index)
  }))
  root.querySelectorAll<HTMLButtonElement>('[data-demo]').forEach(b => on(b, 'click', () => {
    if (busy || b.dataset.demo === demoMode && !manual) return
    demoMode = b.dataset.demo as typeof demoMode
    void loadWork(demoMode === 'gesture' ? 0 : activeWork)
  }))
  root.querySelectorAll<HTMLButtonElement>('button[data-score]').forEach(b => on(b, 'click', () => {
    if (busy) return
    activeScore = gestureScores.find(score => score.id === b.dataset.score)!
    void loadWork(0)
  }))
  on(find('chapters'), 'click', event => {
    const b = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-chapter]')
    if (b && !busy) void seek(Number(b.dataset.chapter))
  })
  root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b => on(b, 'click', () => {
    tool = b.dataset.tool as Tool
    root.querySelectorAll('[data-tool]').forEach(t => t.setAttribute('aria-pressed', String(t === b)))
    width.value = tool === 'stream' ? '4' : tool === 'finger' ? '5' : tool === 'palm' || tool === 'collect' || tool === 'rub' ? '34' : '22'
    find<HTMLOutputElement>('width-label').value = width.value
    updateControls()
  }))
  on(width, 'input', () => { find<HTMLOutputElement>('width-label').value = width.value })
  on(strength, 'input', () => { find<HTMLOutputElement>('strength-label').value = strength.value })
  on(angle, 'input', () => { find<HTMLOutputElement>('angle-label').value = `${angle.value}°` })
  on(aspect, 'input', () => { find<HTMLOutputElement>('aspect-label').value = aspect.value })
  on(showHand, 'change', () => { dirty = true })
  on(find('undo'), 'click', () => {
    const state = undo.pop(); if (!state) return
    pointer = undefined; hand = null; material.restore(state); changed(); updateControls(); tell('已撤销最近一次手势。')
  })
  on(find('clear'), 'click', () => { remember(); material.clear(); pointer = undefined; hand = null; changed(); tell('沙台已清空，可以撤销。') })
  on(title, 'input', () => changed())
  on(find('save'), 'click', () => { savedRevision = -1; void saveDraft() })
  on(find('restore'), 'click', () => {
    if (!draft) return
    try { enterManual(draft.snapshot, draft.title); tell('已恢复上次草稿，可以继续创作。') } catch { tell('上次草稿无法恢复，请导入已导出的作品文件。') }
  })
  function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = name
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
  const workName = () => (manual ? title.value.trim() : demoMode === 'gesture' ? activeScore.title : sources[activeWork].title).replace(/[<>:"/\\|?*]/g, '').slice(0, 60) || '我的沙画'
  on(find('export'), 'click', () => {
    const output = document.createElement('canvas'); output.width = 1536; output.height = 864
    activeMaterial().render(output.getContext('2d')!)
    output.toBlob(blob => { if (blob) { download(blob, `${workName()}-实时沙画.png`); tell('已导出 1536 × 864 的真实沙层图。') } }, 'image/png')
  })
  on(find('file-save'), 'click', () => {
    const snapshot = activeMaterial().read()
    const data = { format: 'sandboard-atelier', version: 1, title: workName(), savedAt: new Date().toISOString(), snapshot: { ...snapshot, density: [...snapshot.density] } }
    download(new Blob([JSON.stringify(data)], { type: 'application/json' }), `${workName()}.sand.json`)
    tell('已导出可编辑作品，包含真实沙层和未落定的沙粒。')
  })
  const file = find<HTMLInputElement>('file')
  on(find('file-open'), 'click', () => file.click())
  on(file, 'change', () => { void (async () => {
    const selected = file.files?.[0]; if (!selected) return
    try {
      if (selected.size > 12 * 1024 * 1024) throw new Error()
      const data = JSON.parse(await selected.text())
      if (data.format !== 'sandboard-atelier' || data.version !== 1 || !data.snapshot || !Array.isArray(data.snapshot.density)
        || data.snapshot.density.length !== PRODUCT_WIDTH * PRODUCT_HEIGHT || typeof data.title !== 'string') throw new Error()
      const snapshot = { ...data.snapshot, density: Float32Array.from(data.snapshot.density) }
      const validator = new StageMaterial(PRODUCT_WIDTH, PRODUCT_HEIGHT); validator.restore(snapshot)
      if (manual) await saveDraft()
      setBusy(false); enterManual(snapshot, data.title.slice(0, 60)); tell('作品已导入，现在可以继续创作。')
    } catch { tell('作品文件无效，请选择本创作台导出的 .sand.json 文件。') }
    finally { file.value = '' }
  })() })
  on(find('fullscreen'), 'click', () => { void (async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await find('bed').requestFullscreen() }
    catch { tell('当前浏览器无法进入全屏，可直接在沙台上创作。') }
  })() })
  on(document, 'fullscreenchange', () => { find('fullscreen').textContent = document.fullscreenElement ? '退出全屏' : '全屏 ↗' })
  on(find('exit-fullscreen'), 'click', () => { if (document.fullscreenElement) void document.exitFullscreen() })
  on(document, 'visibilitychange', () => { if (document.hidden) { playing = false; pointer = undefined; hand = null; void saveDraft(); updateControls() } previousTime = 0 })
  on(canvas, 'keydown', event => {
    const e = event as KeyboardEvent
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && manual) { e.preventDefault(); find<HTMLButtonElement>('undo').click() }
    if (e.code === 'Space' && !manual && !busy) { e.preventDefault(); play.click() }
  })
  on(window, 'pagehide', () => { void saveDraft() })
  void readProductDraft().then(value => { if (!disposed && value) { draft = value; updateControls() } }).catch(() => tell('草稿存储不可用，可通过导出作品保存。'))
  const readEntry = () => readProductEntry(location.hash, gestureScores.map(score => score.id), sources.length)
  let entryRevision = 0
  async function openEntry(entry: ProductEntry) {
    const revision = ++entryRevision
    demoMode = entry.mode
    if (entry.score) activeScore = gestureScores.find(score => score.id === entry.score)!
    await loadWork(entry.reference ?? 0, entry.view === 'process')
    if (disposed || revision !== entryRevision || !painting) return
    if (entry.view === 'finished') await seek(painting.totalTicks)
    if (!disposed && revision === entryRevision) {
      find('bed').scrollIntoView({ block: 'center' })
      if (entry.view === 'finished') tell('已恢复这件作品的完整沙层。点击「接过这幅画，亲手修改」可继续创作；演示不改写你的草稿。')
    }
  }
  on(window, 'hashchange', () => {
    const entry = readEntry()
    if (entry) void openEntry(entry)
    else if (location.hash === '#pause') { playing = false; updateControls() }
  })
  const entry = readEntry()
  if (entry) void openEntry(entry)
  else void loadWork(0)
  frameId = requestAnimationFrame(frame)
  return () => { disposed = true; generation++; cancelAnimationFrame(frameId); if (saveTimer) clearTimeout(saveTimer); controller.abort() }
}
