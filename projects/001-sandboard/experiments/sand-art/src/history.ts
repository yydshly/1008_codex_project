// 沙床、工具参考与可选创作设置一起撤销/重做；状态来自实际活动缓冲区。
type Snapshot<T> = { state: GPUBuffer; reference: GPUBuffer; metadata: T | undefined }
export type HistoryRestore<T> = { metadata: T | undefined }

export class ArtHistory<T = unknown> {
  private readonly undoStack: Snapshot<T>[] = []
  private readonly redoStack: Snapshot<T>[] = []
  private readonly device: GPUDevice
  private readonly bytes: number
  private readonly capacity: number
  constructor(device: GPUDevice, bytes: number, capacity = 10) {
    if (!Number.isInteger(bytes) || bytes < 4 || bytes % 4) throw new RangeError('历史缓冲区大小必须是正的 4 字节倍数。')
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('历史容量必须是正整数。')
    this.device = device
    this.bytes = bytes
    this.capacity = capacity
  }
  get size() { return this.undoStack.length }
  get redoSize() { return this.redoStack.length }
  private release(snapshot: Snapshot<T>) { snapshot.state.destroy(); snapshot.reference.destroy() }
  private clear(stack: Snapshot<T>[]) { for (const snapshot of stack) this.release(snapshot); stack.length = 0 }
  private snapshot(state: GPUBuffer, reference: GPUBuffer, metadata?: T): Snapshot<T> {
    const storedMetadata = metadata === undefined ? undefined : structuredClone(metadata)
    if (state.size < this.bytes || reference.size < this.bytes) throw new RangeError('历史源缓冲区尺寸不足。')
    const create = (label: string) => this.device.createBuffer({ label, size: this.bytes, usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST })
    const snapshot = { state: create('Sand art history state'), reference: create('Sand art history reference'), metadata: storedMetadata }
    const encoder = this.device.createCommandEncoder()
    encoder.copyBufferToBuffer(state, 0, snapshot.state, 0, this.bytes)
    encoder.copyBufferToBuffer(reference, 0, snapshot.reference, 0, this.bytes)
    this.device.queue.submit([encoder.finish()])
    return snapshot
  }

  capture(state: GPUBuffer, reference: GPUBuffer, metadata?: T) {
    const snapshot = this.snapshot(state, reference, metadata)
    this.clear(this.redoStack)
    this.undoStack.push(snapshot)
    while (this.undoStack.length + this.redoStack.length > this.capacity) this.release(this.undoStack.shift()!)
  }

  private move(source: Snapshot<T>[], destination: Snapshot<T>[], buffers: readonly GPUBuffer[], reference: GPUBuffer, currentState: GPUBuffer | undefined, currentMetadata?: T): HistoryRestore<T> | false {
    if (!source.length) return false
    if (!buffers.length || !currentState) throw new Error('历史恢复需要状态缓冲区及实际活动状态。')
    if (buffers.some(buffer => buffer.size < this.bytes) || reference.size < this.bytes) throw new RangeError('历史目标缓冲区尺寸不足。')
    const present = this.snapshot(currentState, reference, currentMetadata)
    const snapshot = source.pop()!
    destination.push(present)
    const encoder = this.device.createCommandEncoder()
    for (const buffer of buffers) encoder.copyBufferToBuffer(snapshot.state, 0, buffer, 0, this.bytes)
    encoder.copyBufferToBuffer(snapshot.reference, 0, reference, 0, this.bytes)
    this.device.queue.submit([encoder.finish()])
    void this.device.queue.onSubmittedWorkDone().then(() => this.release(snapshot), () => this.release(snapshot))
    return { metadata: snapshot.metadata === undefined ? undefined : structuredClone(snapshot.metadata) }
  }

  /** currentState 应传 solver.state；省略仅为兼容旧版单缓冲区调用。 */
  restore(buffers: readonly GPUBuffer[], reference: GPUBuffer, currentState: GPUBuffer = buffers[0], currentMetadata?: T) {
    return this.move(this.undoStack, this.redoStack, buffers, reference, currentState, currentMetadata)
  }
  redo(buffers: readonly GPUBuffer[], reference: GPUBuffer, currentState: GPUBuffer = buffers[0], currentMetadata?: T) {
    return this.move(this.redoStack, this.undoStack, buffers, reference, currentState, currentMetadata)
  }
  /** 清空历史并释放 GPU 快照，同一实例之后仍可 capture。 */
  destroy() { this.clear(this.undoStack); this.clear(this.redoStack) }
}
