import { afterAll, beforeAll, expect, test } from 'vitest'
import { Buffer } from 'node:buffer'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { deflateSync } from 'node:zlib'
import { create, globals } from 'webgpu'
import { createSandDemo, DEMO_DURATION_TICKS, demoPhaseAt } from '../src/demo'
import { ReplaySession } from '../src/replay'
import { FIXED_STEP } from '../src/model'

let gpu: GPU, device: GPUDevice
const errors: string[] = []
beforeAll(async () => {
  Object.assign(globalThis, globals)
  gpu = create([])
  const adapter = await gpu.requestAdapter()
  if (!adapter) throw new Error('撒沙演示验证需要真实硬件 WebGPU adapter。')
  expect(adapter.info.isFallbackAdapter).toBe(false)
  device = await adapter.requestDevice()
  device.addEventListener('uncapturederror', event => errors.push(event.error.message))
})
afterAll(() => device?.destroy())

function region(state: Float32Array, x: number, y: number, radius: number) {
  let amount = 0, count = 0
  for (let row = Math.max(0, y - radius); row <= Math.min(383, y + radius); row++) for (let column = Math.max(0, x - radius); column <= Math.min(511, x + radius); column++) {
    if ((column - x) ** 2 + (row - y) ** 2 <= radius ** 2) { amount += state[(row * 512 + column) * 4]; count++ }
  }
  return amount / count
}
function mass(state: Float32Array) { let total = 0; for (let index = 0; index < state.length; index += 4) total += state[index]; return total }
function png(pixels: Uint8Array, width: number, height: number) {
  const crc = (bytes: Uint8Array) => {
    let value = 0xffffffff
    for (const byte of bytes) { value ^= byte; for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0) }
    return (value ^ 0xffffffff) >>> 0
  }
  const chunk = (name: string, bytes: Uint8Array) => {
    const type = Buffer.from(name), data = Buffer.from(bytes), output = Buffer.alloc(data.length + 12)
    output.writeUInt32BE(data.length, 0); type.copy(output, 4); data.copy(output, 8)
    output.writeUInt32BE(crc(Buffer.concat([type, data])), output.length - 4)
    return output
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6
  const rows = Buffer.alloc((width * 4 + 1) * height)
  for (let row = 0; row < height; row++) Buffer.from(pixels.buffer, pixels.byteOffset + row * width * 4, width * 4).copy(rows, row * (width * 4 + 1) + 1)
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', new Uint8Array())])
}
async function capture(session: ReplaySession, name: string) {
  if (!process.env.ART_DEMO_CAPTURE) return
  const width = 1024, height = 768
  const texture = device.createTexture({ size: [width, height], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC })
  const staging = device.createBuffer({ size: width * height * 4, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
  try {
    const encoder = device.createCommandEncoder()
    session.renderer.encode(encoder, texture.createView(), session.solver.stateIndex, { mode: 'lightbox', ...session.look, time: session.tick * FIXED_STEP, cursor: demoPhaseAt(session.tick).cursor ?? null })
    encoder.copyTextureToBuffer({ texture }, { buffer: staging, bytesPerRow: width * 4 }, [width, height])
    device.queue.submit([encoder.finish()]); await staging.mapAsync(GPUMapMode.READ)
    const pixels = new Uint8Array(staging.getMappedRange()).slice(); staging.unmap()
    mkdirSync(process.env.ART_DEMO_CAPTURE, { recursive: true })
    writeFileSync(join(process.env.ART_DEMO_CAPTURE, `${name}.png`), png(pixels, width, height))
  } finally { staging.destroy(); texture.destroy() }
}

test('the production demo builds mountains from real airborne mass, sculpts moon and river, and replays deterministically', async () => {
  const session = await ReplaySession.create(device, 'rgba8unorm', createSandDemo())
  try {
    await session.seek(408)
    const left = await session.solver.readState()
    expect(mass(left)).toBeGreaterThan(2000)
    expect(region(left, 156, 266, 35)).toBeGreaterThan(region(left, 325, 260, 35) + 0.04)
    await capture(session, 'demo-left')
    await session.seek(972)
    const mountains = await session.solver.readState()
    expect(mass(mountains)).toBeGreaterThan(mass(left) + 2000)
    expect(region(mountains, 325, 260, 35)).toBeGreaterThan(region(left, 325, 260, 35) + 0.04)
    await capture(session, 'demo-mountains')
    await session.seek(1524)
    const beforeMoon = await session.solver.readState()
    expect(session.solver.airborne.pending).toBe(false)
    expect(region(beforeMoon, 381, 105, 12)).toBeGreaterThan(0.02)
    await capture(session, 'demo-before-moon')
    await session.seek(1716)
    const moon = await session.solver.readState()
    expect(region(moon, 381, 105, 12)).toBeLessThan(region(beforeMoon, 381, 105, 12) * 0.55)
    await session.seek(DEMO_DURATION_TICKS)
    const finished = await session.solver.readState()
    expect(session.solver.airborne.pending).toBe(false)
    expect(mass(finished)).toBeGreaterThan(7000)
    expect(mass(finished)).toBeLessThanOrEqual(10505)
    expect(Math.abs(mass(finished) - session.solver.airborne.emittedMass)).toBeLessThan(5)
    expect(region(finished, 255, 298, 4)).toBeLessThan(region(moon, 255, 298, 4))
    expect(region(finished, 150, 270, 35)).toBeGreaterThan(region(finished, 60, 70, 35) + 0.04)
    expect(region(finished, 324, 272, 35)).toBeGreaterThan(region(finished, 60, 70, 35) + 0.04)
    expect(region(finished, 60, 70, 35)).toBeLessThan(0.001)
    await capture(session, 'demo-final')
    // Rewind through an airborne checkpoint and reconstruct the same full state.
    await session.seek(850)
    expect(session.solver.airborne.pending).toBe(true)
    await session.seek(DEMO_DURATION_TICKS)
    const replayed = await session.solver.readState()
    expect(Buffer.compare(Buffer.from(replayed.buffer), Buffer.from(finished.buffer))).toBe(0)
    expect(session.solver.airborne.pending).toBe(false)
    expect(errors).toEqual([])
  } finally { session.destroy(); await device.queue.onSubmittedWorkDone() }
})
