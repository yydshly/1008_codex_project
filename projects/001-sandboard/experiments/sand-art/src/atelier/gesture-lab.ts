/** 原创手法试验区：只通过 StageMaterial 的供料和守恒移沙接触改变沙面。 */
import { StageMaterial, type StageContact, type StagePoint } from '../stage/material'
import './gesture-lab.css'

export type LabTool = 'pour' | 'edge' | 'finger'
export const LAB_DEMO_SECONDS = 8.4
const DT = 1 / 60
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))

interface LabStroke {
  start: number
  end: number
  point: (progress: number) => StagePoint
  radius: number
  strength: number
}

const shore = (progress: number): StagePoint => ({
  x: 0.13 + progress * 0.74,
  y: 0.46 + Math.sin(progress * Math.PI * 1.35) * 0.12 - progress * 0.09,
})
const branch = (progress: number): StagePoint => ({
  x: 0.25 + progress * 0.5,
  y: 0.83 - progress * 0.58 + Math.sin(progress * Math.PI) * 0.07,
})
const strokes: Record<LabTool, LabStroke[]> = {
  pour: Array.from({ length: 5 }, (_, index) => ({
    start: index * 1.35,
    end: index * 1.35 + 1.3,
    point: (progress: number) => ({
      x: 0.2 + progress * 0.57,
      y: 0.46 + index * 0.035 + Math.sin(progress * Math.PI) * (-0.16 + index * 0.014)
        + Math.sin(progress * 11 + index) * 0.012,
    }),
    radius: 0.056 + index * 0.009,
    strength: 1.5 - index * 0.13,
  })),
  edge: [
    { start: 0.3, end: 3.1, point: shore, radius: 0.065, strength: 0.72 },
    { start: 3.45, end: 5.5, point: progress => ({ x: 0.2 + progress * 0.65, y: 0.72 + Math.sin(progress * 4.8) * 0.024 }), radius: 0.028, strength: 0.65 },
    { start: 5.85, end: 7.25, point: progress => ({ x: 0.32 + progress * 0.45, y: 0.81 + Math.sin(progress * 5.7) * 0.015 }), radius: 0.014, strength: 0.52 },
  ],
  finger: [
    { start: 0.25, end: 2.75, point: branch, radius: 0.018, strength: 1.25 },
    ...[0.32, 0.51, 0.7].flatMap((root, index) => {
      const origin = branch(root)
      return [-1, 1].map((side, twig) => ({
        start: 3 + index * 1.35 + twig * 0.57,
        end: 3.5 + index * 1.35 + twig * 0.57,
        point: (progress: number) => ({
          x: origin.x + progress * (side === -1 ? -0.14 : 0.125),
          y: origin.y - progress * (side === -1 ? 0.11 : 0.14) + progress * progress * 0.035,
        }),
        radius: 0.01 - index * 0.001,
        strength: 1.18,
      }))
    }),
  ],
}

/** 可复现的手法练习轨迹；演示与手绘使用同一组材料操作。 */
export function labDemoContacts(tool: LabTool, time: number, dt = DT): StageContact[] {
  if (!Number.isFinite(time) || !Number.isFinite(dt) || time < 0 || dt <= 0 || time > LAB_DEMO_SECONDS) return []
  return strokes[tool].filter(stroke => time >= stroke.start && time < stroke.end).map(stroke => {
    const progress = clamp((time - stroke.start) / (stroke.end - stroke.start), 0, 1)
    const previous = clamp((time - dt - stroke.start) / (stroke.end - stroke.start), 0, 1)
    const pressure = tool === 'finger' ? 0.94 - progress * 0.69 : 0.65 + Math.sin(progress * Math.PI) * 0.3
    return {
      tool, from: stroke.point(previous), to: stroke.point(progress),
      radius: stroke.radius * (tool === 'finger' ? 0.3 + pressure * 0.7 : 1),
      strength: stroke.strength * pressure,
      spread: 0.92, height: 0.35, aspect: tool === 'edge' ? 0.22 : 1,
    }
  })
}

/** 铺底也逐把供料。网格只是供料路线，实际落点仍由材料的粒流随机性决定。 */
export function labBedContact(index: number): StageContact {
  const row = Math.floor(index / 12)
  const column = row % 2 ? 11 - index % 12 : index % 12
  const from = { x: (column - 0.35) / 11, y: (row + 0.18) / 10 }
  const to = { x: (column + 0.35) / 11, y: (row + 0.82) / 10 }
  return { tool: 'pour', from, to, radius: 0.145, strength: 3, spread: 1, height: 0.18 }
}

const descriptions: Record<LabTool, { name: string; hint: string; width: number }> = {
  pour: { name: '细撒铺灰', hint: '按住拖动细撒；停留会积厚，快速移动留下薄灰。叠撒几次，观察浓淡和软边。', width: 115 },
  edge: { name: '掌侧留白', hint: '在有沙底上拖动，用掌侧推开沙层。亮带旁会留下聚沙边，可练岸线与衣褶。', width: 76 },
  finger: { name: '指尖刻画', hint: '在有沙底上拖动刻出亮线。慢行较宽，提速收细，适合枝干与细节。', width: 15 },
}

/** 不读取旧作品、不建立存储；卸载时停止动画并解除事件。 */
export function mountGestureLab(container: HTMLElement): () => void {
  container.innerHTML = `
    <div class="al-heading"><div><p class="al-kicker">真实接触 · 手法练习</p><h2>先把沙的浓淡与留白练出来</h2></div><p>此处是可操作的材料试验，三种手法都实际供沙或移沙。作品目标图与这里的沙面独立。</p></div>
    <div class="al-layout">
      <div class="al-board-column"><div class="al-board"><canvas width="640" height="480" tabindex="0" aria-label="沙画手法试验区，按住并拖动进行创作"></canvas><span class="al-board-label">手法试验区</span><span class="al-cursor" aria-hidden="true"></span></div><p class="al-status" role="status" aria-live="polite">空灯箱已就绪。</p></div>
      <div class="al-controls">
        <div class="al-tool-list" role="group" aria-label="沙画手法"><button type="button" data-tool="pour" aria-pressed="true">01 细撒铺灰</button><button type="button" data-tool="edge" aria-pressed="false">02 掌侧留白</button><button type="button" data-tool="finger" aria-pressed="false">03 指尖刻画</button></div>
        <p class="al-hint"></p>
        <label class="al-range">手势宽度 <output data-value="width">115</output><span>像素</span><input data-slider="width" type="range" min="6" max="150" value="115" aria-label="手势宽度"></label>
        <label class="al-range">供沙 / 推沙力度 <output data-value="flow">100</output><span>%</span><input data-slider="flow" type="range" min="15" max="180" value="100" aria-label="供沙或推沙力度"></label>
        <p class="al-pressure">鼠标按移动速度变化力度；压感笔直接使用压力。</p>
        <div class="al-reset" role="group" aria-label="重置沙台"><button type="button" data-action="bed">重置为有沙底</button><button type="button" data-action="clear">重置为空台</button></div>
        <div class="al-demo"><button type="button" data-action="demo">演示当前手法</button><button type="button" data-action="pause" disabled>暂停</button></div>
        <p class="al-demo-note">演示会重置本试验区：细撒从空台开始，留白与刻画先铺沙底。可暂停后接着手绘。</p>
        <button class="al-export" type="button" data-action="export">导出试验区 PNG</button>
      </div>
    </div>`
  const canvas = container.querySelector<HTMLCanvasElement>('canvas')!
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) {
    container.querySelector('.al-status')!.textContent = '当前浏览器无法创建沙台画布。'
    return () => { container.innerHTML = '' }
  }
  const board = container.querySelector<HTMLElement>('.al-board')!
  const cursor = container.querySelector<HTMLElement>('.al-cursor')!
  const status = container.querySelector<HTMLElement>('.al-status')!
  const hint = container.querySelector<HTMLElement>('.al-hint')!
  const widthInput = container.querySelector<HTMLInputElement>('[data-slider="width"]')!
  const flowInput = container.querySelector<HTMLInputElement>('[data-slider="flow"]')!
  const pauseButton = container.querySelector<HTMLButtonElement>('[data-action="pause"]')!
  const demoButton = container.querySelector<HTMLButtonElement>('[data-action="demo"]')!
  const material = new StageMaterial(640, 480, 0xa17e11)
  const abort = new AbortController()
  const options = { signal: abort.signal }
  let tool: LabTool = 'pour'
  let drawing: { id: number; from: StagePoint; to: StagePoint; pressure: number; lastTime: number } | undefined
  let disposed = false
  let busy = false
  let generation = 0
  let demoTime = 0
  let demoActive = false
  let paused = false
  let frame = 0
  let accumulator = 0
  let lastFrame = 0
  let dirty = true
  let lastReportedSecond = -1

  const report = (text: string) => { status.textContent = text }
  const setBusy = (value: boolean) => {
    busy = value
    for (const button of container.querySelectorAll<HTMLButtonElement>('button')) button.disabled = value
    pauseButton.disabled = value || !demoActive
    board.classList.toggle('al-busy', value)
  }
  const stopDemo = () => {
    demoActive = false
    paused = false
    pauseButton.disabled = true
    pauseButton.textContent = '暂停'
    demoButton.textContent = '演示当前手法'
  }
  const cancelDrawing = () => {
    if (drawing && canvas.hasPointerCapture(drawing.id)) canvas.releasePointerCapture(drawing.id)
    drawing = undefined
  }
  const render = () => {
    material.render(ctx)
    dirty = false
  }
  const selectTool = (next: LabTool) => {
    stopDemo()
    cancelDrawing()
    tool = next
    widthInput.value = String(descriptions[tool].width)
    container.querySelector('[data-value="width"]')!.textContent = widthInput.value
    hint.textContent = descriptions[tool].hint
    for (const button of container.querySelectorAll<HTMLButtonElement>('[data-tool]')) button.setAttribute('aria-pressed', String(button.dataset.tool === tool))
    report(tool === 'pour' ? '细撒已选中；按住沙台拖动。' : `${descriptions[tool].name}已选中；需要有沙底才能看见移沙。`)
  }
  const reset = async (withBed: boolean): Promise<boolean> => {
    const token = ++generation
    stopDemo()
    cancelDrawing()
    material.clear()
    accumulator = 0
    dirty = true
    if (!withBed) { render(); report('已重置为空灯箱。'); return true }
    setBusy(true)
    report('正在逐把铺沙底…')
    for (let index = 0; index < 120; index++) {
      if (disposed || token !== generation) return false
      material.step(0.1, [labBedContact(index)])
      if (index % 5 === 4) {
        render()
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      }
    }
    for (let index = 0; index < 30 && material.pending; index++) material.step(DT, [])
    dirty = true
    setBusy(false)
    report('沙底已铺好；按住拖动练习留白与刻画。')
    return true
  }
  const point = (event: PointerEvent): StagePoint => {
    const rect = canvas.getBoundingClientRect()
    return { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1) }
  }
  const showCursor = (event: PointerEvent) => {
    const position = point(event)
    cursor.style.left = `${position.x * 100}%`
    cursor.style.top = `${position.y * 100}%`
    const scale = canvas.getBoundingClientRect().width / 640
    const diameter = Number(widthInput.value) * scale
    cursor.style.width = `${diameter}px`
    cursor.style.height = `${tool === 'edge' ? diameter * 0.28 : diameter}px`
    cursor.style.opacity = '1'
  }
  const manualContact = (allowStationary = false): StageContact[] => {
    if (!drawing) return []
    const pressure = drawing.pressure
    const moving = Math.hypot(drawing.to.x - drawing.from.x, drawing.to.y - drawing.from.y) > 0.0004
    const contacts: StageContact[] = tool === 'pour' || moving || allowStationary ? [{
      tool, from: drawing.from, to: drawing.to,
      radius: Number(widthInput.value) / 1280 * (tool === 'finger' ? 0.45 + pressure * 0.55 : 1),
      strength: Number(flowInput.value) / 100 * pressure * (tool === 'pour' ? 1.6 : 1.3),
      spread: 0.9, height: 0.35, aspect: tool === 'edge' ? 0.22 : 1,
    }] : []
    drawing.from = { ...drawing.to }
    return contacts
  }
  canvas.addEventListener('pointerdown', event => {
    if (busy || (event.pointerType === 'mouse' && event.button !== 0)) return
    event.preventDefault()
    stopDemo()
    canvas.setPointerCapture(event.pointerId)
    const position = point(event)
    drawing = { id: event.pointerId, from: position, to: position, pressure: event.pointerType === 'pen' ? Math.max(0.1, event.pressure) : 0.7, lastTime: event.timeStamp }
    // 一次短点按也形成真实接触，避免按下和抬起都落在同一帧时没有痕迹。
    material.step(DT, manualContact(true))
    dirty = true
    showCursor(event)
    report(`正在${descriptions[tool].name}…`)
  }, options)
  canvas.addEventListener('pointermove', event => {
    showCursor(event)
    if (!drawing || drawing.id !== event.pointerId || busy) return
    event.preventDefault()
    const position = point(event)
    const distance = Math.hypot(position.x - drawing.to.x, (position.y - drawing.to.y) * 0.75)
    const velocity = distance / Math.max(0.001, (event.timeStamp - drawing.lastTime) / 1000)
    const pressure = event.pointerType === 'pen' ? clamp(event.pressure, 0.1, 1) : clamp(0.95 - velocity * 0.65, 0.25, 0.95)
    drawing.pressure = drawing.pressure * 0.55 + pressure * 0.45
    drawing.to = position
    drawing.lastTime = event.timeStamp
  }, options)
  const endDrawing = (event: PointerEvent) => {
    if (drawing?.id !== event.pointerId) return
    if (event.type === 'pointerup') {
      drawing.to = point(event)
      const contacts = manualContact()
      if (contacts.length) { material.step(DT, contacts); dirty = true }
    }
    cancelDrawing()
    report(`已完成一次${descriptions[tool].name}；可以继续叠加或重置试验区。`)
  }
  canvas.addEventListener('pointerup', endDrawing, options)
  canvas.addEventListener('pointercancel', endDrawing, options)
  canvas.addEventListener('lostpointercapture', event => { if (drawing?.id === event.pointerId) drawing = undefined }, options)
  canvas.addEventListener('pointerleave', () => { if (!drawing) cursor.style.opacity = '0' }, options)
  for (const button of container.querySelectorAll<HTMLButtonElement>('[data-tool]')) button.addEventListener('click', () => selectTool(button.dataset.tool as LabTool), options)
  for (const slider of [widthInput, flowInput]) slider.addEventListener('input', () => { container.querySelector(`[data-value="${slider.dataset.slider}"]`)!.textContent = slider.value }, options)
  container.querySelector('[data-action="clear"]')!.addEventListener('click', () => { void reset(false) }, options)
  container.querySelector('[data-action="bed"]')!.addEventListener('click', () => { void reset(true) }, options)
  demoButton.addEventListener('click', async () => {
    if (!await reset(tool !== 'pour') || disposed) return
    demoTime = 0
    lastReportedSecond = -1
    demoActive = true
    paused = false
    pauseButton.disabled = false
    demoButton.textContent = '重新演示'
    report(`开始演示${descriptions[tool].name}。`)
  }, options)
  pauseButton.addEventListener('click', () => {
    paused = !paused
    pauseButton.textContent = paused ? '继续' : '暂停'
    report(paused ? '演示已暂停；可按住沙台接着手绘。' : `继续演示${descriptions[tool].name}。`)
  }, options)
  container.querySelector('[data-action="export"]')!.addEventListener('click', () => {
    const result = document.createElement('canvas')
    result.width = material.width
    result.height = material.height
    const exportContext = result.getContext('2d')!
    material.render(exportContext)
    result.toBlob(blob => {
      if (!blob || disposed) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `沙画手法试验-${descriptions[tool].name}.png`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      report('已导出当前试验区 PNG，640 × 480。')
    })
  }, options)
  document.addEventListener('visibilitychange', () => {
    lastFrame = 0
    accumulator = 0
    if (document.hidden) cancelDrawing()
  }, options)
  const animate = (now: number) => {
    if (disposed) return
    frame = requestAnimationFrame(animate)
    if (document.hidden) { lastFrame = 0; return }
    const elapsed = lastFrame ? Math.min((now - lastFrame) / 1000, 0.08) : DT
    lastFrame = now
    if (busy) return
    accumulator = Math.min(accumulator + elapsed, DT * 4)
    while (accumulator >= DT) {
      accumulator -= DT
      let contacts: StageContact[] = []
      if (demoActive && !paused) {
        contacts = labDemoContacts(tool, demoTime)
        demoTime += DT
        const second = Math.floor(demoTime)
        if (second !== lastReportedSecond) {
          report(`${descriptions[tool].name}演示 · ${Math.min(demoTime, LAB_DEMO_SECONDS).toFixed(1)} / ${LAB_DEMO_SECONDS} 秒`)
          lastReportedSecond = second
        }
        if (demoTime >= LAB_DEMO_SECONDS) {
          stopDemo()
          report('手法演示完成；现在可以直接在沙面上继续练习。')
        }
      } else if (drawing) {
        contacts = manualContact()
      }
      if (contacts.length || material.pending) {
        material.step(DT, contacts)
        dirty = true
      }
    }
    if (dirty) render()
  }
  selectTool('pour')
  render()
  frame = requestAnimationFrame(animate)
  return () => {
    disposed = true
    generation++
    cancelDrawing()
    abort.abort()
    cancelAnimationFrame(frame)
    container.innerHTML = ''
  }
}
