import { GRID_HEIGHT, GRID_WIDTH, type ArtMode } from './model'

export type CompositionPreset = 'moon' | 'zen' | 'blank'

export interface ConversionOptions {
  blackPoint: number
  whitePoint: number
  gamma: number
  invert: boolean
  minHeight: number
  maxHeight: number
}

export interface ReferenceImage {
  pixels: Uint8ClampedArray
  url: string
  name: string
  blob: Blob
}

export function defaultConversion(mode: ArtMode): ConversionOptions {
  return mode === 'lightbox'
    ? { blackPoint: 0, whitePoint: 255, gamma: 1.4, invert: false, minHeight: 0, maxHeight: 1.25 }
    : { blackPoint: 0, whitePoint: 255, gamma: 1, invert: false, minHeight: 1.4, maxHeight: 2.55 }
}

function validateConversion(options: ConversionOptions) {
  const { blackPoint, whitePoint, gamma, invert, minHeight, maxHeight } = options
  if (!Number.isFinite(blackPoint) || !Number.isFinite(whitePoint) || blackPoint < 0 || whitePoint > 255 || whitePoint <= blackPoint) {
    throw new Error('黑场与白场必须在 0–255 内，白场需大于黑场。')
  }
  if (!Number.isFinite(gamma) || gamma <= 0) throw new Error('中间调必须是大于零的数值。')
  if (typeof invert !== 'boolean') throw new Error('明暗反转需要明确开启或关闭。')
  if (!Number.isFinite(minHeight) || !Number.isFinite(maxHeight) || minHeight < 0 || maxHeight < minHeight) {
    throw new Error('厚度必须是非负数，最高厚度需大于或等于最低厚度。')
  }
}

// 灰度素材转换为真实可编辑厚度场，显示和后续笔触都使用同一份沙量。
export function pixelsToSand(pixels: Uint8ClampedArray, mode: ArtMode, options = defaultConversion(mode)): Float32Array {
  validateConversion(options)
  if (pixels.length % 4 !== 0) throw new Error('参考图像素需要完整的 RGBA 数据。')
  const { blackPoint, whitePoint, gamma, invert, minHeight, maxHeight } = options
  const result = new Float32Array(pixels.length)
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255
    const luminance = (pixels[index] * 2126 + pixels[index + 1] * 7152 + pixels[index + 2] * 722) / 10000
    const normalized = Math.max(0, Math.min(1, (luminance - blackPoint) / (whitePoint - blackPoint)))
    // 先反转颜色再乘透明度，透明像素和 contain 留白始终只有最低厚度。
    const darkness = (invert ? normalized : 1 - normalized) * alpha
    result[index] = minHeight + Math.pow(darkness, gamma) * (maxHeight - minHeight)
  }
  return result
}

// 与画台参考层的 object-fit: contain 使用同一居中比例。
export function referencePlacement(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('参考图尺寸无效。')
  const scale = Math.min(GRID_WIDTH / width, GRID_HEIGHT / height)
  const containedWidth = width * scale, containedHeight = height * scale
  return { left: (GRID_WIDTH - containedWidth) / 2, top: (GRID_HEIGHT - containedHeight) / 2, width: containedWidth, height: containedHeight }
}

export async function readReferenceImage(blob: Blob, name?: string): Promise<ReferenceImage> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(blob.type)) throw new Error('请选择 PNG、JPEG 或 WebP 图片。')
  if (blob.size > 20 * 1024 * 1024) throw new Error('请选择小于 20 MB 的图片。')
  const bitmap = await createImageBitmap(blob, { resizeWidth: 1536, resizeQuality: 'high' })
  try {
    const canvas = document.createElement('canvas')
    canvas.width = GRID_WIDTH; canvas.height = GRID_HEIGHT
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器未能准备参考图预览。')
    context.clearRect(0, 0, GRID_WIDTH, GRID_HEIGHT)
    const placement = referencePlacement(bitmap.width, bitmap.height)
    context.drawImage(bitmap, placement.left, placement.top, placement.width, placement.height)
    return {
      pixels: context.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT).data,
      url: URL.createObjectURL(blob),
      name: name?.trim() || (blob instanceof File ? blob.name : '参考图'),
      blob,
    }
  } finally { bitmap.close() }
}

// 仅预览沙量对应的明暗；真实颗粒、起伏和光照仍由画台的 GPU 渲染器呈现。
export function previewSand(state: Float32Array, mode: ArtMode): Uint8ClampedArray {
  if (state.length % 4 !== 0) throw new Error('沙量预览需要完整的状态数据。')
  const pixels = new Uint8ClampedArray(state.length)
  const low = mode === 'lightbox' ? [255, 241, 205] : [153, 112, 57]
  const high = mode === 'lightbox' ? [80, 64, 49] : [234, 209, 143]
  for (let index = 0; index < state.length; index += 4) {
    const thickness = state[index]
    if (!Number.isFinite(thickness) || thickness < 0) throw new Error('沙量预览包含无效厚度。')
    const weight = mode === 'lightbox' ? 1 - Math.exp(-thickness * 3.6) : thickness / (thickness + 1.5)
    for (let channel = 0; channel < 3; channel++) pixels[index + channel] = low[channel] + (high[channel] - low[channel]) * weight
    pixels[index + 3] = 255
  }
  return pixels
}

export function createComposition(mode: ArtMode, preset: CompositionPreset): Float32Array {
  const result = new Float32Array(GRID_WIDTH * GRID_HEIGHT * 4)
  if (preset === 'blank') {
    for (let index = 0; index < result.length; index += 4) result[index] = mode === 'lightbox' ? 0 : 2
    return result
  }
  if (preset === 'zen') {
    for (let y = 0; y < GRID_HEIGHT; y++) for (let x = 0; x < GRID_WIDTH; x++) {
      const d1 = Math.hypot(x - 175, (y - 195) * 1.2)
      const d2 = Math.hypot(x - 335, (y - 145) * 1.4)
      const waves = Math.cos(Math.min(d1, d2) * 0.29 + 0.13 * Math.sin(y * 0.07))
      const mounds = Math.exp(-d1 * d1 / 850) * 0.6 + Math.exp(-d2 * d2 / 500) * 0.5
      result[(y * GRID_WIDTH + x) * 4] = mode === 'surface' ? 2 + waves * 0.25 + mounds : 0.12 + (waves + 1) * 0.15 + mounds
    }
    return result
  }
  const canvas = document.createElement('canvas')
  canvas.width = GRID_WIDTH; canvas.height = GRID_HEIGHT
  const context = canvas.getContext('2d')!
  const sky = context.createLinearGradient(0, 0, 0, GRID_HEIGHT)
  sky.addColorStop(0, '#cccccc'); sky.addColorStop(1, '#ededed')
  context.fillStyle = sky; context.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT)
  const mountain = (points: number[][], color: string) => {
    context.beginPath(); context.moveTo(0, GRID_HEIGHT)
    context.lineTo(points[0][0], points[0][1])
    for (let index = 1; index < points.length; index++) {
      const [x, y] = points[index - 1], [nextX, nextY] = points[index]
      context.quadraticCurveTo(x, y, (x + nextX) / 2, (y + nextY) / 2)
    }
    const [lastX, lastY] = points[points.length - 1]
    context.lineTo(lastX, lastY)
    context.lineTo(GRID_WIDTH, GRID_HEIGHT); context.closePath(); context.fillStyle = color; context.fill()
  }
  mountain([[0, 236], [80, 178], [122, 206], [220, 113], [315, 235], [410, 162], [512, 232]], '#a0a0a0')
  mountain([[0, 305], [75, 235], [156, 292], [310, 202], [375, 270], [452, 239], [512, 294]], '#585858')
  mountain([[0, 340], [85, 306], [168, 352], [262, 293], [348, 335], [440, 300], [512, 334]], '#171717')
  context.fillStyle = '#ffffff'; context.beginPath(); context.arc(367, 81, 37, 0, Math.PI * 2); context.fill()
  context.strokeStyle = '#202020'; context.lineWidth = 7; context.lineCap = 'round'
  context.beginPath(); context.moveTo(78, 330); context.bezierCurveTo(87, 270, 72, 209, 92, 157); context.stroke()
  for (const [x, y, endX, endY] of [[85, 212, 46, 175], [81, 253, 123, 202], [86, 280, 40, 239], [84, 186, 123, 164]]) {
    context.lineWidth = 3; context.beginPath(); context.moveTo(x, y); context.lineTo(endX, endY); context.stroke()
  }
  context.fillStyle = '#2c2c2c'
  for (let index = 0; index < 22; index++) {
    const x = 47 + ((index * 37) % 85), y = 158 + ((index * 29) % 98)
    context.beginPath(); context.ellipse(x, y, 13, 5, index * 1.4, 0, Math.PI * 2); context.fill()
  }
  return pixelsToSand(context.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT).data, mode)
}

export async function importComposition(file: File, mode: ArtMode): Promise<Float32Array> {
  const reference = await readReferenceImage(file)
  try { return pixelsToSand(reference.pixels, mode) }
  finally { URL.revokeObjectURL(reference.url) }
}
