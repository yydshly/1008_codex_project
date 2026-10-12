import { expect, test } from 'vitest'
import { create, globals } from 'webgpu'
import { ArtHistory } from '../src/history'

test('undo restores both simulation states and their matching tool reference after an imported composition', async () => {
  Object.assign(globalThis, globals)
  const gpu = create([])
  const adapter = await gpu.requestAdapter()
  if (!adapter) throw new Error('历史回归需要硬件 WebGPU adapter')
  expect(adapter.info.isFallbackAdapter).toBe(false)
  const device = await adapter.requestDevice()
  const errors: string[] = []
  device.addEventListener('uncapturederror', event => errors.push(event.error.message))
  const buffers = Array.from({ length: 3 }, () => device.createBuffer({ size: 16, usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST }))
  const staging = device.createBuffer({ size: 48, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ })
  const history = new ArtHistory(device, 16, 1)
  try {
    const oldState = new Float32Array([0.24, 0.2, 2, 3]), oldReference = new Float32Array([0.24, 0, 0, 0])
    device.queue.writeBuffer(buffers[0], 0, oldState)
    device.queue.writeBuffer(buffers[2], 0, oldReference)
    history.capture(buffers[0], buffers[2])
    device.queue.writeBuffer(buffers[0], 0, new Float32Array([1.25, 0, 0, 0]))
    device.queue.writeBuffer(buffers[2], 0, new Float32Array([1.25, 0, 0, 0]))
    expect(history.restore(buffers.slice(0, 2), buffers[2])).toEqual({ metadata: undefined })
    expect(history.restore(buffers.slice(0, 2), buffers[2])).toBe(false)
    const encoder = device.createCommandEncoder()
    buffers.forEach((buffer, index) => encoder.copyBufferToBuffer(buffer, 0, staging, index * 16, 16))
    device.queue.submit([encoder.finish()])
    await staging.mapAsync(GPUMapMode.READ)
    const actual = new Float32Array(staging.getMappedRange())
    expect(Array.from(actual.slice(0, 4))).toEqual(Array.from(oldState))
    expect(Array.from(actual.slice(4, 8))).toEqual(Array.from(oldState))
    expect(Array.from(actual.slice(8, 12))).toEqual(Array.from(oldReference))
    staging.unmap()
    expect(errors).toEqual([])
  } finally {
    history.destroy(); staging.destroy(); buffers.forEach(buffer => buffer.destroy()); device.destroy()
  }
})

test('redo captures the actual active buffer, restores reference and settings, and a new branch clears redo', async () => {
  Object.assign(globalThis, globals)
  const gpu = create([])
  const adapter = await gpu.requestAdapter()
  if (!adapter) throw new Error('重做回归需要硬件 WebGPU adapter')
  const device = await adapter.requestDevice()
  const errors: string[] = []
  device.addEventListener('uncapturederror', event => errors.push(event.error.message))
  const buffers = Array.from({ length: 3 }, () => device.createBuffer({ size: 16, usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST }))
  const history = new ArtHistory<{ settings: { radius: number }; source: string }>(device, 16, 2)
  const read = async () => {
    const staging = device.createBuffer({ size: 48, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ })
    try {
      const encoder = device.createCommandEncoder()
      buffers.forEach((buffer, index) => encoder.copyBufferToBuffer(buffer, 0, staging, index * 16, 16))
      device.queue.submit([encoder.finish()])
      await staging.mapAsync(GPUMapMode.READ)
      const values = new Float32Array(staging.getMappedRange()).slice()
      staging.unmap()
      return [values[0], values[4], values[8]]
    } finally { staging.destroy() }
  }
  const write = (index: number, amount: number) => device.queue.writeBuffer(buffers[index], 0, new Float32Array([amount, 0, 0, 0]))
  try {
    const original = { settings: { radius: 9 }, source: 'old.jpg' }
    write(0, 2); write(2, 2.5)
    history.capture(buffers[0], buffers[2], original)
    original.settings.radius = 42
    // ping-pong 的 0 号缓冲区是过期值，实际新作品在 1 号。
    write(0, 4); write(1, 9); write(2, 9.5)
    const current = { settings: { radius: 16 }, source: 'new.jpg' }
    expect(history.restore(buffers.slice(0, 2), buffers[2], buffers[1], current)).toEqual({ metadata: { settings: { radius: 9 }, source: 'old.jpg' } })
    expect(await read()).toEqual([2, 2, 2.5])
    expect(history.size).toBe(0)
    expect(history.redoSize).toBe(1)
    expect(history.redo(buffers.slice(0, 2), buffers[2], buffers[1], { settings: { radius: 9 }, source: 'old.jpg' })).toEqual({ metadata: current })
    expect(await read()).toEqual([9, 9, 9.5])
    expect(history.size).toBe(1)
    expect(history.redoSize).toBe(0)
    history.restore(buffers.slice(0, 2), buffers[2], buffers[1], current)
    history.capture(buffers[1], buffers[2], current)
    expect(history.redoSize).toBe(0)
    expect(history.redo(buffers.slice(0, 2), buffers[2], buffers[1], current)).toBe(false)
    // 总容量包含两个方向；超过容量保留最近两个动作。
    for (const amount of [11, 12, 13]) { write(1, amount); history.capture(buffers[1], buffers[2], current) }
    expect(history.size + history.redoSize).toBe(2)
    history.restore(buffers.slice(0, 2), buffers[2], buffers[1], current)
    expect(await read()).toEqual([13, 13, 2.5])
    history.restore(buffers.slice(0, 2), buffers[2], buffers[1], current)
    expect(await read()).toEqual([12, 12, 2.5])
    expect(history.size + history.redoSize).toBe(2)
    history.destroy()
    expect(history.size + history.redoSize).toBe(0)
    history.capture(buffers[1], buffers[2], current)
    expect(history.size).toBe(1)
    expect(errors).toEqual([])
  } finally { history.destroy(); buffers.forEach(buffer => buffer.destroy()); device.destroy() }
})
