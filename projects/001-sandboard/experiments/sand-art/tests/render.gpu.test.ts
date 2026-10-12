import { afterAll, beforeAll, expect, test } from 'vitest'
import { create, globals } from 'webgpu'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { deflateSync } from 'node:zlib'
import { ArtRenderer } from '../src/render'
import type { ArtRenderOptions } from '../src/model'
import { AirborneSand } from '../src/airborne'

const width = 32
const height = 24
const stride = 256
let gpu: GPU
let device: GPUDevice
let state: GPUBuffer
let texture: GPUTexture
let renderer: ArtRenderer
const errors: string[] = []
const defaults: ArtRenderOptions = { mode: 'surface', light: 'noon', wetness: 0, wind: 0, time: 0, cursor: null }

beforeAll(async () => {
  Object.assign(globalThis, globals)
  gpu = create([])
  const adapter = await gpu.requestAdapter()
  if (!adapter) throw new Error('沙画渲染验证需要真实 WebGPU 适配器。')
  device = await adapter.requestDevice()
  device.addEventListener('uncapturederror', (event) => errors.push(event.error.message))
  state = device.createBuffer({ size: width * height * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
  texture = device.createTexture({ size: [width, height], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC })
  renderer = new ArtRenderer(device, 'rgba8unorm', [state], width, height)
  await renderer.initialize()
})

afterAll(() => {
  renderer?.destroy()
  texture?.destroy()
  state?.destroy()
  device?.destroy()
})

async function render(heightAt: number | ((x: number, y: number) => number), options: Partial<ArtRenderOptions> = {}) {
  const values = new Float32Array(width * height * 4)
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) values[(row * width + column) * 4] = typeof heightAt === 'number' ? heightAt : heightAt(column, row)
  }
  device.queue.writeBuffer(state, 0, values)
  const staging = device.createBuffer({ size: stride * height, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ })
  try {
    const encoder = device.createCommandEncoder()
    renderer.encode(encoder, texture.createView(), 0, { ...defaults, ...options })
    encoder.copyTextureToBuffer({ texture }, { buffer: staging, bytesPerRow: stride }, [width, height])
    device.queue.submit([encoder.finish()])
    await staging.mapAsync(GPUMapMode.READ)
    const bytes = new Uint8Array(staging.getMappedRange())
    const pixels = new Uint8Array(width * height * 4)
    for (let row = 0; row < height; row++) pixels.set(bytes.subarray(row * stride, row * stride + width * 4), row * width * 4)
    staging.unmap()
    expect(errors).toEqual([])
    for (let index = 3; index < pixels.length; index += 4) expect(pixels[index]).toBe(255)
    return pixels
  } finally { staging.destroy() }
}

function luminance(pixels: Uint8Array, x?: number) {
  let sum = 0
  let count = 0
  for (let row = 4; row < height - 4; row++) {
    for (let column = x ?? 4; column < (x === undefined ? width - 4 : x + 1); column++) {
      const offset = (row * width + column) * 4
      sum += pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722
      count++
    }
  }
  return sum / count
}

test('lightbox exposes clear glass at zero sand and darkens monotonically with real thickness', async () => {
  const empty = await render(0, { mode: 'lightbox' })
  const thin = await render(0.24, { mode: 'lightbox' })
  const heavy = await render(1.0, { mode: 'lightbox' })
  expect(luminance(empty)).toBeGreaterThan(225)
  expect(luminance(empty) - luminance(thin)).toBeGreaterThan(35)
  expect(luminance(thin) - luminance(heavy)).toBeGreaterThan(65)
  // 清沙后的中央玻璃没有颗粒噪声，薄层沙有颗粒明暗。
  const pixelA = (12 * width + 10) * 4
  const pixelB = (12 * width + 16) * 4
  expect(Array.from(empty.slice(pixelA, pixelA + 3))).toEqual(Array.from(empty.slice(pixelB, pixelB + 3)))
  const thinLevels = new Set<number>()
  for (let row = 5; row < height - 5; row++) {
    for (let column = 5; column < width - 5; column++) thinLevels.add(thin[(row * width + column) * 4])
  }
  expect(thinLevels.size).toBeGreaterThan(8)
})

test('surface shading makes the lit ridge face brighter than its shadow side', async () => {
  const flat = await render(2.0)
  const ridge = await render((x) => x >= 15 && x <= 16 ? 3.0 : 2.0)
  expect(luminance(flat)).toBeGreaterThan(155)
  expect(luminance(flat)).toBeLessThan(235)
  expect(luminance(ridge, 14) - luminance(ridge, 17)).toBeGreaterThan(25)
  expect(luminance(ridge, 17)).toBeLessThan(luminance(flat, 17) - 20)
})

test('clearing the surface exposes the matte worktable instead of a false layer of sand', async () => {
  const cleared = await render(0)
  const bed = await render(2.0)
  expect(luminance(bed) - luminance(cleared)).toBeGreaterThan(105)
  let minimum = 255
  let maximum = 0
  for (let row = 5; row < height - 5; row++) {
    for (let column = 5; column < width - 5; column++) {
      const red = cleared[(row * width + column) * 4]
      minimum = Math.min(minimum, red)
      maximum = Math.max(maximum, red)
    }
  }
  expect(maximum - minimum).toBeLessThan(5)
})

test('wetness and three light presets change the rendered material consistently in both modes', async () => {
  const dry = await render(2.0)
  const wet = await render(2.0, { wetness: 1 })
  const sunset = await render(2.0, { light: 'sunset' })
  const moon = await render(2.0, { light: 'moon' })
  expect(luminance(dry) - luminance(wet)).toBeGreaterThan(20)
  expect(luminance(dry) - luminance(moon)).toBeGreaterThan(30)
  const sums = (pixels: Uint8Array) => {
    const channels = [0, 0, 0]
    for (let index = 0; index < pixels.length; index += 4) for (let channel = 0; channel < 3; channel++) channels[channel] += pixels[index + channel]
    return channels
  }
  const sunChannels = sums(sunset)
  const moonChannels = sums(moon)
  expect(sunChannels[0] - sunChannels[2]).toBeGreaterThan(width * height * 60)
  expect(moonChannels[2]).toBeGreaterThan(moonChannels[0])
  const lampSun = sums(await render(0, { mode: 'lightbox', light: 'sunset' }))
  const lampMoon = sums(await render(0, { mode: 'lightbox', light: 'moon' }))
  expect(lampSun[0]).toBeGreaterThan(lampSun[2])
  expect(lampMoon[2]).toBeGreaterThan(lampMoon[0])
})

test('cursor overlay is optional and survives small render targets', async () => {
  const hidden = await render(2.0)
  const visible = await render(2.0, { cursor: { x: 16, y: 12, radius: 6, tool: 'rake', active: true } })
  expect(Array.from(visible)).not.toEqual(Array.from(hidden))
  const inactive = await render(2.0, { cursor: { x: 16, y: 12, radius: 6, tool: 'rake', active: false } })
  expect(Array.from(inactive)).toEqual(Array.from(hidden))
})

function encodePng(pixels: Uint8Array, imageWidth: number, imageHeight: number) {
  const checksum = (bytes: Uint8Array) => {
    let value = 0xffffffff
    for (const byte of bytes) {
      value ^= byte
      for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0)
    }
    return (value ^ 0xffffffff) >>> 0
  }
  const chunk = (kind: string, bytes: Uint8Array) => {
    const output = Buffer.alloc(12 + bytes.length)
    output.writeUInt32BE(bytes.length, 0)
    output.write(kind, 4, 4)
    output.set(bytes, 8)
    output.writeUInt32BE(checksum(output.subarray(4, bytes.length + 8)), bytes.length + 8)
    return output
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(imageWidth, 0)
  header.writeUInt32BE(imageHeight, 4)
  header[8] = 8
  header[9] = 6
  const scanlines = Buffer.alloc((imageWidth * 4 + 1) * imageHeight)
  for (let row = 0; row < imageHeight; row++) scanlines.set(pixels.subarray(row * imageWidth * 4, (row + 1) * imageWidth * 4), row * (imageWidth * 4 + 1) + 1)
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', new Uint8Array())])
}

test('full-size grains avoid directional banding and thin lightbox sand has resolved dark grains', async () => {
  const gridWidth = 512
  const gridHeight = 384
  const imageWidth = 1024
  const imageHeight = 768
  const previewState = device.createBuffer({ size: gridWidth * gridHeight * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
  const previewTexture = device.createTexture({ size: [imageWidth, imageHeight], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC })
  const previewRenderer = new ArtRenderer(device, 'rgba8unorm', [previewState], gridWidth, gridHeight)
  await previewRenderer.initialize()
  const capture = async (mode: 'surface' | 'lightbox', sculpt = false) => {
    const data = new Float32Array(gridWidth * gridHeight * 4)
    for (let row = 0; row < gridHeight; row++) {
      for (let column = 0; column < gridWidth; column++) {
        let amount = mode === 'surface' ? 2 : 0.24
        if (sculpt) {
          const ring = Math.hypot(column - 145, row - 155)
          const groove = Math.exp(-(((ring - 64) / 5) ** 2))
          const dune = Math.exp(-(((column - 355) / 43) ** 2) - ((row - 205) / 53) ** 2)
          const fineLines = Math.exp(-(((row - 288 - Math.sin(column / 40) * 13) / 3) ** 2))
          amount = mode === 'surface' ? 2 - groove * 0.65 + dune * 1.55 - fineLines * 0.46 : Math.max(0, 0.24 - groove * 0.24 + dune * 0.95 - fineLines * 0.24)
        }
        data[(row * gridWidth + column) * 4] = amount
      }
    }
    device.queue.writeBuffer(previewState, 0, data)
    const staging = device.createBuffer({ size: imageWidth * imageHeight * 4, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
    try {
      const encoder = device.createCommandEncoder()
      previewRenderer.encode(encoder, previewTexture.createView(), 0, { ...defaults, mode })
      encoder.copyTextureToBuffer({ texture: previewTexture }, { buffer: staging, bytesPerRow: imageWidth * 4 }, [imageWidth, imageHeight])
      device.queue.submit([encoder.finish()])
      await staging.mapAsync(GPUMapMode.READ)
      const bytes = new Uint8Array(staging.getMappedRange()).slice()
      staging.unmap()
      return bytes
    } finally { staging.destroy() }
  }
  try {
    const flat = await capture('surface')
    let horizontal = 0
    let vertical = 0
    for (let row = 64; row < imageHeight - 64; row++) {
      for (let column = 64; column < imageWidth - 64; column++) {
        const offset = (row * imageWidth + column) * 4
        horizontal += Math.abs(flat[offset] - flat[offset + 4])
        vertical += Math.abs(flat[offset] - flat[offset + imageWidth * 4])
      }
    }
    expect(horizontal / vertical).toBeGreaterThan(0.75)
    expect(horizontal / vertical).toBeLessThan(1.30)
    const lamp = await capture('lightbox')
    let bright = 0
    let dark = 0
    let black = 0
    for (let row = 64; row < imageHeight - 64; row++) {
      for (let column = 64; column < imageWidth - 64; column++) {
        const red = lamp[(row * imageWidth + column) * 4]
        if (red > 220) bright++
        if (red < 135) dark++
        if (red < 85) black++
      }
    }
    const total = (imageWidth - 128) * (imageHeight - 128)
    expect(bright / total).toBeGreaterThan(0.30)
    expect(dark / total).toBeGreaterThan(0.08)
    expect(black / total).toBeLessThan(0.03)
    // 可选调试输出是真实 WebGPU 高度场渲染，用于肉眼检验，不作为展示预置贴图。
    if (process.env.ART_RENDER_CAPTURE) {
      mkdirSync(process.env.ART_RENDER_CAPTURE, { recursive: true })
      writeFileSync(join(process.env.ART_RENDER_CAPTURE, 'render-flat.png'), encodePng(flat, imageWidth, imageHeight))
      writeFileSync(join(process.env.ART_RENDER_CAPTURE, 'render-surface.png'), encodePng(await capture('surface', true), imageWidth, imageHeight))
      writeFileSync(join(process.env.ART_RENDER_CAPTURE, 'render-lightbox.png'), encodePng(await capture('lightbox', true), imageWidth, imageHeight))
    }
    expect(errors).toEqual([])
  } finally {
    previewRenderer.destroy()
    previewTexture.destroy()
    previewState.destroy()
  }
})

test('pour grain feedback animates only while contact is held down', async () => {
  const cursor = { x: 16, y: 12, radius: 6, tool: 'pour' as const, active: true }
  const hover = await render(2.0, { cursor, time: 0 })
  const hoverLater = await render(2.0, { cursor, time: 0.2 })
  const held = await render(2.0, { cursor: { ...cursor, down: true }, time: 0 })
  const heldLater = await render(2.0, { cursor: { ...cursor, down: true }, time: 0.2 })
  expect(Array.from(hover)).toEqual(Array.from(hoverLater))
  expect(Array.from(held)).not.toEqual(Array.from(heldLater))
  expect(Array.from(held)).not.toEqual(Array.from(hover))
})

test('the palm cursor follows its rotated ellipse rather than a circular radius', async () => {
  const hidden = await render(2.0)
  const bounds = (pixels: Uint8Array) => {
    let left = width, right = -1, top = height, bottom = -1
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4
        if (Math.max(...[0, 1, 2].map((channel) => Math.abs(pixels[offset + channel] - hidden[offset + channel]))) > 5) {
          left = Math.min(left, x); right = Math.max(right, x)
          top = Math.min(top, y); bottom = Math.max(bottom, y)
        }
      }
    }
    return { width: right - left + 1, height: bottom - top + 1 }
  }
  const cursor = { x: 16, y: 12, radius: 8, tool: 'palm' as const, active: true, aspect: 0.45 }
  const horizontal = bounds(await render(2.0, { cursor: { ...cursor, angle: 0 } }))
  const vertical = bounds(await render(2.0, { cursor: { ...cursor, angle: Math.PI / 2 } }))
  expect(horizontal.width / horizontal.height).toBeGreaterThan(1.4)
  expect(vertical.height / vertical.width).toBeGreaterThan(1.4)
  expect(horizontal.width).toBe(vertical.height)
  expect(horizontal.height).toBe(vertical.width)
  expect(errors).toEqual([])
})

test('actual airborne instances render without a cursor, project height and keep their ground shadow separate', async () => {
  const air = new AirborneSand(width, height)
  const airborneRenderer = new ArtRenderer(device, 'rgba8unorm', [state], width, height, air)
  await airborneRenderer.initialize()
  const imageWidth = 512, imageHeight = 384
  const output = device.createTexture({ size: [imageWidth, imageHeight], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC })
  const values = new Float32Array(width * height * 4)
  device.queue.writeBuffer(state, 0, values)
  const capture = async () => {
    const staging = device.createBuffer({ size: imageWidth * imageHeight * 4, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ })
    try {
      const encoder = device.createCommandEncoder()
      airborneRenderer.encode(encoder, output.createView(), 0, { ...defaults, mode: 'lightbox', cursor: null })
      encoder.copyTextureToBuffer({ texture: output }, { buffer: staging, bytesPerRow: imageWidth * 4 }, [imageWidth, imageHeight])
      device.queue.submit([encoder.finish()])
      await staging.mapAsync(GPUMapMode.READ)
      const pixels = new Uint8Array(staging.getMappedRange()).slice()
      staging.unmap()
      return pixels
    } finally { staging.destroy() }
  }
  const at = (pixels: Uint8Array, x: number, y: number) => pixels[(y * imageWidth + x) * 4]
  try {
    const empty = await capture()
    const snapshot = air.snapshot()
    snapshot.particles = [{ x: 256.5, y: 220.5, z: 80, vx: 0, vy: 0, vz: -100, mass: 1, seed: 0.4 }]
    snapshot.emittedMass = 1
    air.restore(snapshot)
    const flying = await capture()
    // xyz remains in the 512 x 384 drawing domain, even for a 32 x 24 solver.
    expect(at(empty, 256, 180) - at(flying, 256, 180)).toBeGreaterThan(15)
    expect(at(empty, 261, 224) - at(flying, 261, 224)).toBeGreaterThan(1)
    expect(at(flying, 256, 100)).toBe(at(empty, 256, 100))
    snapshot.particles[0].z = 20
    air.restore(snapshot)
    const lower = await capture()
    expect(at(lower, 256, 180)).toBe(at(empty, 256, 180))
    expect(at(empty, 256, 210) - at(lower, 256, 210)).toBeGreaterThan(15)
    air.clear()
    expect(Array.from(await capture())).toEqual(Array.from(empty))
    for (let index = 3; index < flying.length; index += 4) expect(flying[index]).toBe(255)
    expect(errors).toEqual([])
  } finally { airborneRenderer.destroy(); output.destroy() }
})
