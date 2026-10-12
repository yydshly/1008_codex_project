import { StageMaterial, type StageMaterialSnapshot } from '../stage/material'
import type { StageHand } from '../stage/show'

export const PRODUCT_STEP = 1 / 60
export const POINTS_PER_TICK = 8
export const PRODUCT_WIDTH = 768
export const PRODUCT_HEIGHT = 432
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
type Mark = { x: number; y: number; sigma: number; target: number; gain: number; phase: number; region: number }
export interface PaintingState { tick: number; lastPhase: number; material: StageMaterialSnapshot; predicted: Float32Array }
export const phaseNames = ['薄撒铺灰', '组织大形', '刻画造型', '收沙提亮', '落定留画'] as const

/** 图像只规划手势的局部浓淡；渲染器只读取实际供料/收沙后的沙层。 */
export class SandPainting {
  readonly material: StageMaterial
  readonly marks: Mark[] = []
  readonly predicted: Float32Array
  readonly totalTicks: number
  tick = 0
  hand: StageHand | null = null
  phase = 0
  private readonly target: Float32Array
  private readonly sourceWidth: number
  private readonly sourceHeight: number
  readonly width: number
  readonly height: number
  private lastPhase = 0

  constructor(pixels: Uint8ClampedArray, sourceWidth: number, sourceHeight: number,
    width = PRODUCT_WIDTH, height = PRODUCT_HEIGHT, scene = 0) {
    if (pixels.length !== sourceWidth * sourceHeight * 4 || sourceWidth < 2 || sourceHeight < 2) throw new Error('参考图像尺寸不正确。')
    this.sourceWidth = sourceWidth; this.sourceHeight = sourceHeight
    this.width = width; this.height = height
    this.material = new StageMaterial(width, height, 0x912fa7 + scene, 40000)
    this.predicted = new Float32Array(width * height)
    this.target = new Float32Array(sourceWidth * sourceHeight)
    for (let i = 0; i < this.target.length; i++) {
      const p = i * 4
      const light = pixels[p] * .2126 + pixels[p + 1] * .7152 + pixels[p + 2] * .0722
      this.target[i] = clamp(-Math.log(clamp((light - 33) / 205, .023, 1)) / 1.35, 0, 2.8)
    }
    const specs = [
      { step: 24, sigma: 11, scale: .20, gain: .72 },
      { step: 8, sigma: 4.2, scale: .70, gain: .63 },
      { step: 4, sigma: 1.85, scale: 1, gain: .62 },
      { step: 3, sigma: 1.30, scale: 1, gain: .48 },
    ]
    specs.forEach((spec, phase) => {
      const phaseMarks: Mark[] = []
      for (let y = spec.step / 2; y < height; y += spec.step) {
        for (let x = spec.step / 2; x < width; x += spec.step) {
          const nx = x / width, ny = y / height
          const offset = phase < 2 ? spec.sigma * .9 : 0
          const target = offset ? (this.targetAt(x, y) * 4 + this.targetAt(x - offset, y) + this.targetAt(x + offset, y)
            + this.targetAt(x, y - offset) + this.targetAt(x, y + offset)) / 8 : this.targetAt(x, y)
          // 分区先构成轮廓和体块；每区使用连续往返落沙路线。
          const region = phase === 0 ? 0 : scene === 0
            ? nx < .38 ? 1 : ny < .34 ? 0 : ny < .62 ? 2 : nx > .64 ? 3 : 4
            : nx < .46 ? 0 : ny < .32 ? 1 : ny < .68 ? 2 : 3
          phaseMarks.push({ x, y, sigma: spec.sigma, target: target * spec.scale, gain: spec.gain, phase, region })
        }
      }
      phaseMarks.sort((a, b) => a.region - b.region || a.y - b.y || (Math.floor(a.y / spec.step) % 2 ? b.x - a.x : a.x - b.x))
      this.marks.push(...phaseMarks)
    })
    this.totalTicks = Math.ceil(this.marks.length / POINTS_PER_TICK) + 45
  }

  private targetAt(x: number, y: number) {
    const sx = clamp(x / this.width * this.sourceWidth - .5, 0, this.sourceWidth - 1)
    const sy = clamp(y / this.height * this.sourceHeight - .5, 0, this.sourceHeight - 1)
    const ax = Math.floor(sx), ay = Math.floor(sy), bx = Math.min(ax + 1, this.sourceWidth - 1), by = Math.min(ay + 1, this.sourceHeight - 1)
    const fx = sx - ax, fy = sy - ay
    return (this.target[ay * this.sourceWidth + ax] * (1 - fx) + this.target[ay * this.sourceWidth + bx] * fx) * (1 - fy)
      + (this.target[by * this.sourceWidth + ax] * (1 - fx) + this.target[by * this.sourceWidth + bx] * fx) * fy
  }

  private estimate(x: number, y: number, sigma: number) {
    let sum = 0
    const offsets = [[0, 0, 4], [-.5, 0, 1], [.5, 0, 1], [0, -.5, 1], [0, .5, 1]]
    for (const [dx, dy, weight] of offsets) {
      const px = clamp(Math.round(x + dx * sigma), 0, this.width - 1)
      const py = clamp(Math.round(y + dy * sigma), 0, this.height - 1)
      sum += this.predicted[py * this.width + px] * weight
    }
    return sum / 8
  }

  private predictPour(mark: Mark, mass: number, sigma: number) {
    const r = Math.ceil(sigma * 3), weights: [number, number][] = []
    let total = 0
    for (let y = Math.floor(mark.y) - r; y <= Math.floor(mark.y) + r; y++) {
      for (let x = Math.floor(mark.x) - r; x <= Math.floor(mark.x) + r; x++) {
        const weight = Math.exp(-((x - mark.x) ** 2 + (y - mark.y) ** 2) / (2 * sigma * sigma))
        total += weight
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) weights.push([y * this.width + x, weight])
      }
    }
    for (const [i, weight] of weights) this.predicted[i] += mass * weight / total
  }

  private predictCollect(mark: Mark, radius: number, strength: number, dt: number) {
    const force = strength * dt * 120
    for (let y = Math.max(0, Math.floor(mark.y - radius)); y <= Math.min(this.height - 1, Math.ceil(mark.y + radius)); y++) {
      for (let x = Math.max(0, Math.floor(mark.x - radius)); x <= Math.min(this.width - 1, Math.ceil(mark.x + radius)); x++) {
        const d = Math.hypot(x - mark.x, y - mark.y) / radius
        if (d >= 1) continue
        const t = 1 - d, smooth = t * t * (3 - 2 * t)
        this.predicted[y * this.width + x] *= Math.exp(-force * smooth)
      }
    }
  }

  step() {
    if (this.tick >= this.totalTicks) return false
    this.hand = null
    const dt = PRODUCT_STEP / POINTS_PER_TICK
    const start = this.tick * POINTS_PER_TICK
    for (let n = 0; n < POINTS_PER_TICK; n++) {
      const mark = this.marks[start + n]
      if (!mark) { this.material.step(dt, []); continue }
      this.phase = mark.phase
      if (mark.phase !== this.lastPhase) {
        // 让前一把沙实际落定后校准预测，预测场永远不写回沙层。
        for (let settle = 0; settle < 6; settle++) this.material.step(.05, [])
        this.predicted.set(this.material.density)
        this.lastPhase = mark.phase
      }
      const current = this.estimate(mark.x, mark.y, mark.sigma)
      const error = mark.target - current
      const p = { x: mark.x / this.width, y: mark.y / this.height }
      if (error > .012) {
        const spread = mark.phase < 2 ? .85 : .10
        const clock = this.material.elapsedTime + dt
        const flow = clamp(.8 + .24 * Math.sin(clock * 8.1 + p.x * 6) + .19 * Math.sin(clock * 3.37 + 1.1), .35, 1.3)
        const base = this.width * this.height * .016 * dt * flow
        const sigma = Math.sqrt(mark.sigma ** 2 + (spread >= .3 ? 1.3 : .6) ** 2)
        const mass = Math.min(base * 3, error * 2 * Math.PI * sigma * sigma * mark.gain)
        this.material.step(dt, [{
          tool: 'pour', from: p, to: p, radius: mark.sigma / (.2 + spread * .55) / this.width,
          strength: mass / base, spread, height: .015,
        }])
        this.predictPour(mark, mass, sigma)
        this.hand = { ...p, pose: 'pour', rotation: -.15, down: true }
      } else if (mark.phase === 3 && error < -.07 && current > .06) {
        const radius = mark.sigma * 2.4
        const fraction = clamp(-error / current * .48, .01, .45)
        const strength = Math.min(3, -Math.log(1 - fraction) / (dt * 120))
        this.material.step(dt, [])
        this.material.collect(p, p, radius / this.width, strength, dt)
        this.predictCollect(mark, radius, strength, dt)
        this.hand = { ...p, pose: 'palm', rotation: -.2, down: true }
      } else this.material.step(dt, [])
    }
    this.tick++
    if (this.tick * POINTS_PER_TICK >= this.marks.length) { this.phase = 4; this.hand = null }
    return true
  }

  read(): PaintingState { return { tick: this.tick, lastPhase: this.lastPhase, material: this.material.read(), predicted: this.predicted.slice() } }
  restore(state: PaintingState) {
    if (!Number.isInteger(state.tick) || state.tick < 0 || state.tick > this.totalTicks || !Number.isInteger(state.lastPhase)
      || state.lastPhase < 0 || state.lastPhase > 3 || state.predicted.length !== this.predicted.length
      || !state.predicted.every(n => Number.isFinite(n) && n >= 0)) throw new Error('成画回放状态不正确。')
    this.material.restore(state.material)
    this.predicted.set(state.predicted)
    this.tick = state.tick
    const mark = this.marks[Math.min(this.marks.length - 1, state.tick * POINTS_PER_TICK)]
    this.phase = state.tick * POINTS_PER_TICK >= this.marks.length ? 4 : mark.phase
    this.lastPhase = state.lastPhase
    this.hand = null
  }
}
