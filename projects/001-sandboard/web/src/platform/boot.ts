import type { InterfaceElements } from '../ui/interface'

export class BootMonitor {
  private currentStage = 'Starting'
  private failure: Error | undefined
  private stop: (() => void) | undefined
  private adapter = 'unavailable'
  private readonly ui: InterfaceElements

  constructor(ui: InterfaceElements) { this.ui = ui }
  stage(stage: string) {
    this.assertHealthy()
    this.currentStage = stage
    const labels: Record<string, string> = {
      'Loading simulation': '正在加载沙盘', 'Requesting GPU': '正在连接图形设备',
      'Initializing sand transport': '正在铺好沙面', 'Compiling granular lighting': '正在准备阳光与细沙',
      'Rendering the first surface': '沙滩即将就绪',
    }
    this.ui.status.textContent = `${labels[stage] ?? stage}…`
  }
  setAdapter(description: string) { this.adapter = description }
  setStop(stop: () => void) { this.stop = stop }
  assertHealthy() { if (this.failure) throw this.failure }

  async run(start: () => Promise<void>) {
    try {
      await start()
      this.assertHealthy()
      this.currentStage = 'Running'
      this.ui.overlay.classList.add('ready')
      this.ui.overlay.setAttribute('aria-hidden', 'true')
    } catch (error) { this.fail(error) }
  }

  fail(reason: unknown) {
    if (this.failure) return
    const error = reason instanceof Error ? reason : new Error(String(reason))
    this.failure = error
    this.stop?.()
    this.ui.overlay.classList.remove('ready')
    this.ui.overlay.classList.add('failed')
    this.ui.overlay.removeAttribute('aria-hidden')
    this.ui.title.textContent = '这片沙滩需要图形设备支持。'
    this.ui.status.textContent = '实时划沙需要支持 WebGPU 的浏览器并开启硬件加速。可在新版 Chrome 或 Edge 中打开此页；下方是上游真实效果截图。'
    document.querySelector<HTMLElement>('.fallback-preview')!.hidden = false
    document.querySelector<HTMLElement>('.fallback-actions')!.hidden = false
    document.querySelector<HTMLElement>('.error-details')!.hidden = false
    this.ui.radius.disabled = true
    this.ui.reset.disabled = true
    this.ui.diagnostics.hidden = false
    this.ui.diagnostics.textContent = [
      `Stage: ${this.currentStage}`, `Error: ${error.message}`,
      `Viewport: ${window.innerWidth} × ${window.innerHeight}; device DPR: ${window.devicePixelRatio}`,
      `Drawing buffer: ${this.ui.canvas.width} × ${this.ui.canvas.height}`,
      `Adapter: ${this.adapter}`, `Platform: ${navigator.userAgent}`,
    ].join('\n')
    this.ui.reload.hidden = false
    console.error(`[Sandboard: ${this.currentStage}]`, error)
  }
}
