import { StageMaterial } from '../stage/material'
import { FilmedHand, handAnchor } from './filmed-hand'
import { renderSand, canvasBlob } from './export'
import { settingsFor } from './model'

/** Short material trial, composed from recorded hand frames and actual emitted grains. */
export class HandContactDemo {
  private readonly dialog = document.createElement('dialog')
  private readonly sand = document.createElement('canvas')
  private readonly handCanvas = document.createElement('canvas')
  private readonly material = new StageMaterial(640, 426, 0x17ab82)
  private readonly play: HTMLButtonElement
  private readonly clock: HTMLElement
  private readonly progress:HTMLInputElement
  private tick = 0
  private lastTime = 0
  private accumulator = 0
  private playing = false
  private dirty = true
  private readonly hand:FilmedHand
  constructor(hand: FilmedHand) {
    this.hand=hand
    this.dialog.className = 'hand-demo'
    this.dialog.innerHTML = `<div class="hand-demo-heading"><div><span class="eyebrow">手与沙 · 15 秒接触试镜</span><h2>看一把沙如何落下。</h2></div><button data-close aria-label="关闭手与沙试镜">关闭 ×</button></div><p>真人手部片段与数字沙台合成。三次短撒，随后抬手落定；以正常速度观察抓沙的动作、落沙延迟与不均匀的堆积。</p><div class="hand-demo-stage"></div><div class="filmed-actions"><button data-play>开始试镜 ▶</button><button data-restart>从头再看 ↺</button><button data-png>下载试镜画面 ↓</button><span data-clock></span></div><label class="hand-demo-progress">试镜进度<input data-progress type="range" min="0" max="900" step="30" value="0" aria-label="手与沙试镜进度"></label><p>手部来源：<a href="https://commons.wikimedia.org/wiki/File:Почему_кот_после_обеда_умывается_–_Литовская_сказка_Сказки_на_песке_-5.webm" target="_blank" rel="noopener">Телеканал КРТ，2019</a>，<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>。节选 135–136.4 秒，抠除背景并重新标定接触点。背光手部偏暗，边缘仍需精修；这段只验证撒沙，完整照片演出的手势尚需分别录制和编排。</p>`
    const stage = this.dialog.querySelector<HTMLElement>('.hand-demo-stage')!
    this.sand.width = this.handCanvas.width = 1280; this.sand.height = this.handCanvas.height = 852
    // Preserve the recorded camera plane: the forearm ends outside the lower table edge.
    this.hand.width=(800/720)*(this.handCanvas.height/this.handCanvas.width)
    this.sand.setAttribute('aria-label', '实际沙粒从手部落下并堆积的试镜画面')
    stage.append(this.sand, this.handCanvas); document.body.append(this.dialog)
    this.play = this.dialog.querySelector<HTMLButtonElement>('[data-play]')!
    this.clock = this.dialog.querySelector<HTMLElement>('[data-clock]')!
    this.progress=this.dialog.querySelector<HTMLInputElement>('[data-progress]')!
    this.progress.oninput=()=>{const to=Number(this.progress.value);this.reset();this.playing=false;while(this.tick<to)this.step();this.update()}
    this.play.onclick = () => { if (this.tick === 900) this.reset(); this.playing = !this.playing; this.lastTime = 0; this.update() }
    this.dialog.querySelector<HTMLButtonElement>('[data-restart]')!.onclick = () => { this.reset(); this.playing = true; this.update() }
    this.dialog.querySelector<HTMLButtonElement>('[data-close]')!.onclick = () => this.dialog.close()
    this.dialog.addEventListener('close', () => { this.playing = false; this.lastTime = 0; this.hand.pause() })
    this.dialog.querySelector<HTMLButtonElement>('[data-png]')!.onclick = () => { void this.capture() }
  }
  open() { if(!this.dialog.open)this.dialog.showModal(); this.reset(); this.playing = true; this.update() }
  close(){this.dialog.close()}
  private reset() { this.material.clear(); this.tick = 0; this.lastTime = 0; this.accumulator = 0; this.dirty = true }
  private contact() {
    const starts = [30, 210, 390], index = starts.findIndex(start => this.tick >= start && this.tick < start + 84)
    if (index < 0) return undefined
    const progress = (this.tick - starts[index]) / 84
    const anchor=handAnchor(progress,this.hand.calibration.anchors)
    return { x:anchor.x*this.hand.width+[.03,.17,.31][index],
      y:anchor.y+(.013+.16*.09)*this.handCanvas.width*.55/this.handCanvas.height,progress }
  }
  private step(){
    const c=this.contact()
    const flow=c?.progress===undefined?0:.22+.35*Math.sin(c.progress*Math.PI)**2+.1*Math.sin(c.progress*9+.5)
    this.material.step(1/60,c?[{tool:'pour',from:c,to:c,radius:.032,strength:flow,spread:.66,height:.16,cluster:.82}]:[])
    this.tick++;this.dirty=true
  }
  frame(time: number) {
    if (!this.dialog.open) return
    if (document.hidden) { this.playing = false; this.lastTime = 0; this.update() }
    if (this.playing && this.tick < 900) {
      this.accumulator += this.lastTime ? Math.min(.12, (time - this.lastTime) / 1000) : 0
      this.lastTime = time
      while (this.accumulator >= 1 / 60 && this.tick < 900) {
        this.step();this.accumulator -= 1 / 60
      }
      if (this.tick === 900) { this.playing = false; this.update() }
    }
    if (this.dirty) { renderSand(this.sand, this.material.read(), { ...settingsFor(), surface: 'granular', grain: .55 }); this.dirty = false }
    const ctx = this.handCanvas.getContext('2d')!; ctx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height)
    ctx.strokeStyle = 'rgba(51,34,20,.55)'; ctx.lineWidth = .9; ctx.beginPath()
    for (const p of this.material.airborne) {
      const x = p.x * this.handCanvas.width, y = p.y * this.handCanvas.height - p.z * this.handCanvas.width * .55
      ctx.moveTo(x, y); ctx.lineTo(x, y + 1.8)
    }
    ctx.stroke()
    const c = this.contact()
    // Same camera projection as airborne grains: the release point sits above the landing point.
    if (c) this.hand.draw(ctx, { ...c, y:c.y-(.013+.16*.09)*this.handCanvas.width*.55/this.handCanvas.height, pose: 'pour', rotation: 0, down: false }, c.progress)
    this.clock.textContent = (this.tick / 60).toFixed(1) + ' / 15.0 秒 · 正常速度'
    this.progress.value=String(this.tick)
  }
  private update() { this.play.textContent = this.playing ? '暂停试镜 Ⅱ' : this.tick === 900 ? '重播试镜 ▶' : '继续试镜 ▶' }
  private async capture() {
    this.playing = false; this.lastTime = 0; this.update()
    const output = document.createElement('canvas'); output.width = this.sand.width; output.height = this.sand.height
    const ctx = output.getContext('2d')!; ctx.drawImage(this.sand, 0, 0); ctx.drawImage(this.handCanvas, 0, 0)
    const url = URL.createObjectURL(await canvasBlob(output)), a = document.createElement('a')
    a.href = url; a.download = '真实手部与数字沙台-当前试镜.png'; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
