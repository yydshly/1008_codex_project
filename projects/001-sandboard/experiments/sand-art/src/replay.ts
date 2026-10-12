import { ArtSolver } from './solver'
import { ArtRenderer } from './render'
import { MAX_STEPS, type ArtCursor, type LightPreset } from './model'
import type { SavedArt } from './storage'
import type { Recording } from './recording'
import type { AirSnapshot } from './airborne'

export type ReplayLook = { light: LightPreset; wetness: number; wind: number }
type Checkpoint = { tick: number; event: number; repeat: number; state: GPUBuffer; reference: GPUBuffer; look: ReplayLook; airborne: AirSnapshot }
const CHECKPOINT_LIMIT = 4
const cancelled = () => new DOMException('回放操作已取消或被新的时间轴跳转取代。', 'AbortError')

/** 独立 GPU 沙床：回放、导出与时间轴跳转都不写入当前创作画台。 */
export class ReplaySession {
  readonly solver: ArtSolver
  readonly renderer: ArtRenderer
  private readonly device: GPUDevice
  private readonly recording: Recording
  private readonly checkpointTicks: Set<number>
  private readonly checkpoints = new Map<number, Checkpoint>()
  private currentTick = 0
  private eventIndex = 0
  private repeatIndex = 0
  private currentLook: ReplayLook
  private generation = 0
  private disposed = false
  private tail: Promise<void> = Promise.resolve()

  private constructor(device: GPUDevice, format: GPUTextureFormat, recording: Recording) {
    this.device = device
    this.recording = recording
    this.solver = new ArtSolver(device, recording.initial.mode, recording.initial.width, recording.initial.height)
    this.renderer = new ArtRenderer(device, format, this.solver.buffers, this.solver.width, this.solver.height, this.solver.airborne)
    this.currentLook = this.lookFrom(recording.initial)
    this.checkpointTicks = new Set(Array.from({ length: CHECKPOINT_LIMIT }, (_, index) => Math.floor(recording.ticks * index / (CHECKPOINT_LIMIT - 1))))
  }

  static async create(device: GPUDevice, format: GPUTextureFormat, recording: Recording): Promise<ReplaySession> {
    const computedTicks = recording.events.reduce((sum, event) => sum + (event.type === 'step' ? event.repeat : 0), 0)
    if (!Number.isSafeInteger(recording.ticks) || recording.ticks < 0 || recording.ticks !== computedTicks) throw new Error('录制总步数无效。')
    const session = new ReplaySession(device, format, recording)
    try {
      await session.solver.initialize()
      await session.renderer.initialize()
      session.load(recording.initial)
      session.consumeBoundaries()
      await device.queue.onSubmittedWorkDone()
      await session.checkpoint()
      return session
    } catch (error) { session.destroy(); throw error }
  }

  get tick() { return this.currentTick }
  get durationTicks() { return this.recording.ticks }
  get look(): ReplayLook { return { ...this.currentLook } }

  private lookFrom(art: SavedArt): ReplayLook { return { light: art.settings.light, wetness: art.settings.wetness, wind: art.settings.wind } }
  private guard(generation: number) { if (this.disposed || generation !== this.generation) throw cancelled() }
  private load(art: SavedArt) {
    if (art.mode !== this.solver.mode || art.width !== this.solver.width || art.height !== this.solver.height || art.state.byteLength !== this.solver.byteLength || (art.referenceState && art.referenceState.byteLength !== this.solver.byteLength)) throw new Error('录制快照的模式或网格不匹配。')
    this.solver.loadState(new Float32Array(art.state))
    if (art.referenceState) this.device.queue.writeBuffer(this.solver.referenceBuffer, 0, art.referenceState)
    this.currentLook = this.lookFrom(art)
  }

  // 零时长操作属于当前 tick，必须全部按原顺序执行，包括最后一计算步之后的操作。
  private consumeBoundaries() {
    while (this.eventIndex < this.recording.events.length) {
      const event = this.recording.events[this.eventIndex]
      if (event.type === 'step') {
        if (!Number.isSafeInteger(event.repeat) || event.repeat < 1) throw new Error('录制重复步数无效。')
        if (this.repeatIndex < event.repeat) return
        this.repeatIndex = 0
      } else if (event.type === 'snapshot') this.load(event.art)
      else this.currentLook = { ...event.settings }
      this.eventIndex++
    }
  }

  private async checkpoint() {
    if (!this.checkpointTicks.has(this.currentTick) || this.checkpoints.has(this.currentTick) || this.disposed) return
    const create = (label: string) => this.device.createBuffer({ label, size: this.solver.byteLength, usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST })
    const checkpoint: Checkpoint = { tick: this.currentTick, event: this.eventIndex, repeat: this.repeatIndex, state: create('Replay checkpoint state'), reference: create('Replay checkpoint reference'), look: { ...this.currentLook }, airborne: this.solver.airborne.snapshot() }
    const encoder = this.device.createCommandEncoder()
    encoder.copyBufferToBuffer(this.solver.state, 0, checkpoint.state, 0, this.solver.byteLength)
    encoder.copyBufferToBuffer(this.solver.referenceBuffer, 0, checkpoint.reference, 0, this.solver.byteLength)
    this.device.queue.submit([encoder.finish()])
    this.checkpoints.set(this.currentTick, checkpoint)
    await this.device.queue.onSubmittedWorkDone()
  }

  private async restore(checkpoint: Checkpoint) {
    const encoder = this.device.createCommandEncoder()
    for (const buffer of this.solver.buffers) encoder.copyBufferToBuffer(checkpoint.state, 0, buffer, 0, this.solver.byteLength)
    encoder.copyBufferToBuffer(checkpoint.reference, 0, this.solver.referenceBuffer, 0, this.solver.byteLength)
    this.device.queue.submit([encoder.finish()])
    this.currentTick = checkpoint.tick
    this.eventIndex = checkpoint.event
    this.repeatIndex = checkpoint.repeat
    this.currentLook = { ...checkpoint.look }
    this.solver.airborne.restore(checkpoint.airborne)
    await this.device.queue.onSubmittedWorkDone()
  }

  private async runTo(target: number, generation: number) {
    this.guard(generation)
    this.consumeBoundaries()
    let yieldedAt = this.currentTick
    let yieldedTime = performance.now()
    while (this.currentTick < target) {
      this.guard(generation)
      const event = this.recording.events[this.eventIndex]
      if (!event || event.type !== 'step') throw new Error('录制步数与事件内容不一致。')
      const nextCheckpoint = [...this.checkpointTicks].filter(tick => tick > this.currentTick).sort((a, b) => a - b)[0] ?? target
      const count = Math.min(MAX_STEPS, event.repeat - this.repeatIndex, target - this.currentTick, nextCheckpoint - this.currentTick)
      const encoder = this.device.createCommandEncoder()
      for (let slot = 0; slot < count; slot++) this.solver.encodeStep(encoder, event.step, slot)
      // 一批独立提交，之后才能复用 slot uniform，不能把长回放编码进同一个 encoder。
      this.device.queue.submit([encoder.finish()])
      this.currentTick += count
      this.repeatIndex += count
      this.consumeBoundaries()
      await this.device.queue.onSubmittedWorkDone()
      this.guard(generation)
      await this.checkpoint()
      this.guard(generation)
      if (this.currentTick - yieldedAt >= 16 || performance.now() - yieldedTime > 12) {
        await new Promise<void>(resolve => setTimeout(resolve, 0))
        this.guard(generation)
        yieldedAt = this.currentTick; yieldedTime = performance.now()
      }
    }
    this.consumeBoundaries()
    await this.device.queue.onSubmittedWorkDone()
    this.guard(generation)
  }

  private enqueue(generation: number, action: () => Promise<void>): Promise<void> {
    const task = this.tail.catch(() => {}).then(async () => { this.guard(generation); await action() })
    this.tail = task
    return task
  }

  seek(targetTick: number): Promise<void> {
    if (!Number.isFinite(targetTick)) return Promise.reject(new RangeError('回放时间必须是有限数。'))
    const target = Math.max(0, Math.min(this.durationTicks, Math.floor(targetTick)))
    const generation = ++this.generation
    return this.enqueue(generation, async () => {
      const checkpoint = [...this.checkpoints.values()].filter(point => point.tick <= target).sort((a, b) => b.tick - a.tick)[0]
      if (!checkpoint) throw new Error('回放初始检查点不存在。')
      if (this.currentTick > target || this.currentTick < checkpoint.tick) { await this.restore(checkpoint); this.guard(generation) }
      await this.runTo(target, generation)
    })
  }

  advance(ticks: number): Promise<void> {
    if (!Number.isFinite(ticks) || ticks < 0) return Promise.reject(new RangeError('回放增量必须是非负有限数。'))
    const generation = this.generation
    return this.enqueue(generation, () => this.runTo(Math.min(this.durationTicks, this.currentTick + Math.floor(ticks)), generation))
  }

  encodeRender(encoder: GPUCommandEncoder, view: GPUTextureView, timeSeconds: number, cursor: ArtCursor | null = null) {
    if (this.disposed) throw cancelled()
    this.renderer.encode(encoder, view, this.solver.stateIndex, { mode: this.solver.mode, ...this.currentLook, time: timeSeconds, cursor })
  }

  destroy() {
    if (this.disposed) return
    this.disposed = true; this.generation++
    const cleanup = () => {
      for (const checkpoint of this.checkpoints.values()) { checkpoint.state.destroy(); checkpoint.reference.destroy() }
      this.checkpoints.clear(); this.renderer.destroy(); this.solver.destroy()
    }
    // 先让已提交的 GPU 工作停止/完成，再释放缓冲区，避免取消长 seek 造成设备错误。
    void this.tail.catch(() => {}).then(() => this.device.queue.onSubmittedWorkDone()).then(cleanup, cleanup).catch(() => {})
  }
}
