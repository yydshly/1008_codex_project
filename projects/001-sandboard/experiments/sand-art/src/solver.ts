import { GRID_HEIGHT, GRID_WIDTH, MAX_CONTACTS, MAX_STEPS, clamp, toolCodes, type ArtMode, type ArtStep } from './model'
import { artSolverShader } from './solver-shaders'
import { AirborneSand } from './airborne'

// Sand-art solver adapted from Sandboard's ping-pong GPU architecture,
// commit 489cb01e81b11ba575887f7c76760498eb41aaa8; GPL-3.0 (project LICENSE).
const paramFloats = 12 + MAX_CONTACTS * 12
type Fill = 'empty' | 'thin' | 'full'
type PipelineName = 'reset' | 'contact' | 'transport' | 'capacity' | 'integrate'
const fills: Record<Fill, number> = { empty: 0, thin: 0.24, full: 2 }

export class ArtSolver {
  readonly device: GPUDevice
  readonly mode: ArtMode
  readonly width: number
  readonly height: number
  readonly byteLength: number
  readonly buffers: [GPUBuffer, GPUBuffer]
  /** CPU flight reservoir; checkpoint it alongside GPU state during replay. */
  readonly airborne: AirborneSand
  /** Fixed thickness baseline for ridge budgets; snapshot alongside both states. */
  readonly referenceBuffer: GPUBuffer
  private readonly flux: GPUBuffer
  private readonly contacts: GPUBuffer
  private readonly receiverBudget: GPUBuffer
  private readonly uniforms: GPUBuffer[]
  private readonly depositions: GPUBuffer[]
  private readonly resetUniforms: Record<Fill, GPUBuffer>
  private pipelines!: Record<PipelineName, GPUComputePipeline>
  private groups: GPUBindGroup[][] = []
  private resetGroups!: Record<Fill, GPUBindGroup[]>
  private current = 0
  private initialized = false

  constructor(device: GPUDevice, mode: ArtMode, width = GRID_WIDTH, height = GRID_HEIGHT) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new RangeError('沙画网格尺寸必须为正整数')
    this.device = device
    this.mode = mode
    this.width = width
    this.height = height
    this.byteLength = width * height * 16
    this.airborne = new AirborneSand(width, height)
    const stateBuffer = (index: number) => device.createBuffer({ label: `Sand-art ${mode} state ${index}`, size: this.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST })
    this.buffers = [stateBuffer(0), stateBuffer(1)]
    this.referenceBuffer = device.createBuffer({ label: 'Sand-art loaded thickness reference', size: this.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST })
    this.flux = device.createBuffer({ label: 'Sand-art free and deformation flux', size: this.byteLength * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
    this.contacts = device.createBuffer({ label: 'Sand-art pressure and deposition field', size: this.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
    this.receiverBudget = device.createBuffer({ label: 'Sand-art deformation receiver budget', size: this.byteLength / 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
    const uniform = (label: string) => device.createBuffer({ label, size: paramFloats * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
    // Each encoded substep owns a distinct uniform: queue.writeBuffer happens
    // before queue.submit, so overwriting a shared buffer would corrupt batching.
    this.uniforms = Array.from({ length: MAX_STEPS }, (_, slot) => uniform(`Sand-art step ${slot}`))
    this.depositions = Array.from({ length: MAX_STEPS }, (_, slot) => device.createBuffer({ label: `Sand-art landed packets ${slot}`, size: width * height * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }))
    this.resetUniforms = { empty: uniform('Empty sand reset'), thin: uniform('Thin sand reset'), full: uniform('Full sand reset') }
  }

  get state() { return this.buffers[this.current] }
  get stateIndex() { return this.current }

  async initialize() {
    if (this.initialized) return
    const module = this.device.createShaderModule({ label: 'Sand-art conservative solver WGSL', code: artSolverShader })
    const compilation = await module.getCompilationInfo()
    const errors = compilation.messages.filter((message) => message.type === 'error')
    if (errors.length) throw new Error(errors.map((message) => `${message.lineNum}:${message.linePos} ${message.message}`).join('\n'))
    const layout = this.device.createBindGroupLayout({ entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 6, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 7, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
    ] })
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [layout] })
    const makePipeline = (entryPoint: PipelineName) => this.device.createComputePipelineAsync({ label: `Sand-art ${entryPoint}`, layout: pipelineLayout, compute: { module, entryPoint } })
    const [reset, contact, transport, capacity, integrate] = await Promise.all(['reset', 'contact', 'transport', 'capacity', 'integrate'].map((name) => makePipeline(name as PipelineName)))
    this.pipelines = { reset, contact, transport, capacity, integrate }
    const makeGroups = (uniform: GPUBuffer, deposition: GPUBuffer) => [0, 1].map((index) => this.device.createBindGroup({ layout, entries: [
      { binding: 0, resource: { buffer: uniform } },
      { binding: 1, resource: { buffer: this.buffers[index] } },
      { binding: 2, resource: { buffer: this.buffers[1 - index] } },
      { binding: 3, resource: { buffer: this.flux } },
      { binding: 4, resource: { buffer: this.contacts } },
      { binding: 5, resource: { buffer: this.receiverBudget } },
      { binding: 6, resource: { buffer: this.referenceBuffer } },
      { binding: 7, resource: { buffer: deposition } },
    ] }))
    this.groups = this.uniforms.map((uniform, slot) => makeGroups(uniform, this.depositions[slot]))
    this.resetGroups = { empty: makeGroups(this.resetUniforms.empty, this.depositions[0]), thin: makeGroups(this.resetUniforms.thin, this.depositions[0]), full: makeGroups(this.resetUniforms.full, this.depositions[0]) }
    for (const fill of Object.keys(fills) as Fill[]) {
      const data = new Float32Array(paramFloats)
      data.set([this.width, this.height, 0, this.mode === 'lightbox' ? 1 : 0])
      data[9] = fills[fill]
      this.device.queue.writeBuffer(this.resetUniforms[fill], 0, data)
    }
    this.initialized = true
    const encoder = this.device.createCommandEncoder()
    this.reset(encoder, this.mode === 'surface' ? 'full' : 'thin')
    this.device.queue.submit([encoder.finish()])
    await this.device.queue.onSubmittedWorkDone()
  }

  encodeStep(encoder: GPUCommandEncoder, input: ArtStep, slot: number) {
    if (!this.initialized) throw new Error('请先初始化沙画求解器')
    if (!Number.isInteger(slot) || slot < 0 || slot >= MAX_STEPS) throw new RangeError(`沙画计算 slot 应在 0 到 ${MAX_STEPS - 1} 之间`)
    const data = new Float32Array(paramFloats)
    const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback
    const dt = clamp(finite(input.dt), 0, 1 / 30)
    const eligible = input.contacts.filter((item) => item.pressure > 0 && item.strength > 0).slice(0, MAX_CONTACTS)
    const deposition = this.airborne.advance({ ...input, dt, contacts: eligible })
    this.device.queue.writeBuffer(this.depositions[slot], 0, deposition as Float32Array<ArrayBuffer>)
    // Traditional hand pouring deposits only after flight. Old recordings whose
    // contacts omit the pour configuration keep their direct-deposition model.
    const active = eligible.filter((item) => item.tool !== 'pour' || !item.pour)
    // A few local contact substeps let displaced sand reach available ridge
    // cells even on a thick imported image. Each uses one third of dt, so pour,
    // wind and natural relaxation keep their original elapsed-time rates.
    const iterations = active.some((item) => item.tool !== 'pour') ? 3 : 1
    data.set([
      this.width, this.height, dt / iterations, this.mode === 'lightbox' ? 1 : 0,
      clamp(finite(input.wetness), 0, 1), clamp(finite(input.wind), 0, 1), Math.cos(finite(input.windAngle)), Math.sin(finite(input.windAngle)),
      active.length, 0, input.preserve ? 1 : 0, dt,
    ])
    active.forEach((item, index) => {
      const offset = 12 + index * 12
      data.set([finite(item.from.x), finite(item.from.y), Math.max(0.25, finite(item.radius, 1)), clamp(finite(item.pressure), 0, 1)], offset)
      data.set([finite(item.to.x), finite(item.to.y), toolCodes[item.tool], clamp(finite(item.strength), 0, 4)], offset + 4)
      data.set([finite(item.velocity.x), finite(item.velocity.y), finite(item.angle ?? 0), clamp(finite(item.aspect ?? 0.45, 0.45), 0.3, 1)], offset + 8)
    })
    this.device.queue.writeBuffer(this.uniforms[slot], 0, data)
    const pass = encoder.beginComputePass({ label: 'Sand-art contact and conservative transport' })
    for (let iteration = 0; iteration < iterations; iteration++) {
      pass.setBindGroup(0, this.groups[slot][this.current])
      for (const name of ['contact', 'transport', 'capacity', 'integrate'] as const) {
        if (name === 'contact' && iteration > 0) continue
        pass.setPipeline(this.pipelines[name])
        pass.dispatchWorkgroups(Math.ceil(this.width / 8), Math.ceil(this.height / 8))
      }
      this.current = 1 - this.current
    }
    pass.end()
  }

  reset(encoder: GPUCommandEncoder, fill: Fill) {
    if (!this.initialized) throw new Error('请先初始化沙画求解器')
    this.airborne.clear()
    encoder.clearBuffer(this.flux)
    encoder.clearBuffer(this.contacts)
    encoder.clearBuffer(this.receiverBudget)
    const pass = encoder.beginComputePass({ label: `Sand-art ${fill} reset` })
    pass.setPipeline(this.pipelines.reset)
    for (const group of this.resetGroups[fill]) {
      pass.setBindGroup(0, group)
      pass.dispatchWorkgroups(Math.ceil(this.width / 8), Math.ceil(this.height / 8))
    }
    pass.end()
    encoder.copyBufferToBuffer(this.buffers[0], 0, this.referenceBuffer, 0, this.byteLength)
    this.current = 0
  }

  /** Loading a draft treats its current sand thickness as the new material bed. */
  loadState(data: Float32Array) {
    if (data.byteLength !== this.byteLength || !data.every(Number.isFinite)) throw new Error('沙画状态尺寸或数值无效')
    for (let index = 0; index < data.length; index += 4) if (data[index] < 0) throw new Error('沙量不能为负数')
    this.airborne.clear()
    for (const buffer of [...this.buffers, this.referenceBuffer]) this.device.queue.writeBuffer(buffer, 0, data)
  }

  async readState(): Promise<Float32Array> {
    const staging = this.device.createBuffer({ label: 'Sand-art state readback', size: this.byteLength, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
    try {
      const encoder = this.device.createCommandEncoder()
      encoder.copyBufferToBuffer(this.state, 0, staging, 0, this.byteLength)
      this.device.queue.submit([encoder.finish()])
      await staging.mapAsync(GPUMapMode.READ)
      const copy = new Float32Array(staging.getMappedRange()).slice()
      staging.unmap()
      return copy
    } finally { staging.destroy() }
  }

  destroy() {
    for (const buffer of [...this.buffers, this.referenceBuffer, this.flux, this.contacts, this.receiverBudget, ...this.uniforms, ...this.depositions, ...Object.values(this.resetUniforms)]) buffer.destroy()
    this.airborne.clear()
    this.initialized = false
  }
}
