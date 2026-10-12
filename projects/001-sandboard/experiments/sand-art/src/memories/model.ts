import { StageMaterial, type StageMaterialSnapshot } from '../stage/material'
import { validGuides, type StructureGuide } from './structure'

export type Mood = 'warm' | 'memory' | 'quiet' | 'bold'
export type Ratio = 'landscape' | 'portrait' | 'square' | 'wide'
export type PhotoStyle = 'photo' | 'portrait'
export interface PhotoSettings {
  mood: Mood; ratio: Ratio; exposure: number; contrast: number; detail: number
  grain: number; white: number; zoom: number; panX: number; panY: number
  /** 可选字段保持 v12 工程兼容；无此字段时仍用照片影调。 */
  style?: PhotoStyle; focusX?: number; focusY?: number; focusSize?: number
  structure?: StructureGuide[]
  /** 新颗粒呈现仅改变外观，旧工程无此字段时沿用旧影调。 */
  surface?: 'tone' | 'granular'
}
export const photoStyles = {
  photo: { name: '照片影调', note: '保留照片细节，用沙层承接原来的光影。' },
  portrait: { name: '留白人像', note: '保留主体灰面与关键光影，背景概括成薄沙与留白。' },
} as const
export const focusFor = (settings: PhotoSettings) => ({ x: settings.focusX ?? .5, y: settings.focusY ?? .52, size: settings.focusSize ?? .34 })
export const moods: Record<Mood, { name: string; note: string; paper: number[]; sand: number[]; values: number[] }> = {
  warm: { name: '温暖', note: '柔和暖光，留下亲近的一刻。', paper: [250, 239, 216], sand: [54, 35, 23], values: [.12, .95, .42, .55, .12] },
  memory: { name: '怀旧', note: '收敛细节，像记忆里的旧照片。', paper: [238, 223, 191], sand: [58, 46, 32], values: [.08, 1.08, .3, .72, .18] },
  quiet: { name: '静谧', note: '淡灰与留白，让画面安静下来。', paper: [242, 243, 235], sand: [46, 51, 48], values: [.2, .84, .25, .45, .3] },
  bold: { name: '强烈', note: '压深暗部，用光影承接力量。', paper: [249, 240, 220], sand: [23, 23, 21], values: [-.08, 1.3, .65, .6, .05] },
}
export function settingsFor(mood: Mood = 'warm'): PhotoSettings {
  const [exposure, contrast, detail, grain, white] = moods[mood].values
  return { mood, ratio: 'landscape', exposure, contrast, detail, grain, white, zoom: 1, panX: .5, panY: .5 }
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
export function validSettings(value: unknown): value is PhotoSettings {
  if (!value || typeof value !== 'object') return false
  const s = value as PhotoSettings
  return Object.hasOwn(moods, s.mood) && ['landscape', 'portrait', 'square', 'wide'].includes(s.ratio)
    && [[s.exposure, -1, 1], [s.contrast, .55, 1.8], [s.detail, 0, 1], [s.grain, 0, 1],
      [s.white, 0, 1], [s.zoom, 1, 2.5], [s.panX, 0, 1], [s.panY, 0, 1]]
      .every(([n, a, b]) => typeof n === 'number' && Number.isFinite(n) && n >= a && n <= b)
    && (s.style === undefined || Object.hasOwn(photoStyles, s.style))
    && (s.structure === undefined || validGuides(s.structure))
    && (s.surface === undefined || ['tone', 'granular'].includes(s.surface))
    && [[s.focusX, 0, 1], [s.focusY, 0, 1], [s.focusSize, .15, .6]]
      .every(([n, a, b]) => n === undefined || typeof n === 'number' && Number.isFinite(n) && n >= a! && n <= b!)
}
export function dimensions(ratio: Ratio) {
  return ({ landscape: [768, 512], portrait: [640, 800], square: [720, 720], wide: [768, 432] } as const)[ratio]
}
/** 按同一裁切矩形读取原照与沙层，避免原照对比时主体被拉伸或错位。 */
export function coverCrop(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number, zoom = 1, panX = .5, panY = .5) {
  if (![sourceWidth, sourceHeight, targetWidth, targetHeight, zoom, panX, panY].every(Number.isFinite)
    || Math.min(sourceWidth, sourceHeight, targetWidth, targetHeight) <= 0 || zoom < 1 || zoom > 2.5) throw new Error('裁切尺寸不正确。')
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight) * zoom
  const width = targetWidth / scale, height = targetHeight / scale
  return { x: (sourceWidth - width) * clamp(panX, 0, 1), y: (sourceHeight - height) * clamp(panY, 0, 1), width, height }
}
function blur(values: Float32Array, width: number, height: number, r = 3) {
  const horizontal = new Float32Array(values.length), output = new Float32Array(values.length)
  for (let y = 0; y < height; y++) {
    let total = 0
    for (let n = -r; n <= r; n++) total += values[y * width + clamp(n, 0, width - 1)]
    for (let x = 0; x < width; x++) {
      horizontal[y * width + x] = total / (r * 2 + 1)
      total += values[y * width + clamp(x + r + 1, 0, width - 1)] - values[y * width + clamp(x - r, 0, width - 1)]
    }
  }
  for (let x = 0; x < width; x++) {
    let total = 0
    for (let n = -r; n <= r; n++) total += horizontal[clamp(n, 0, height - 1) * width + x]
    for (let y = 0; y < height; y++) {
      output[y * width + x] = total / (r * 2 + 1)
      total += horizontal[clamp(y + r + 1, 0, height - 1) * width + x] - horizontal[clamp(y - r, 0, height - 1) * width + x]
    }
  }
  return output
}
/** 照片明暗映射为可编辑厚度场；这是图像转换，不伪称真人手势成画。 */
export function photoToSnapshot(pixels: Uint8ClampedArray, width: number, height: number, settings: PhotoSettings): StageMaterialSnapshot {
  if (!validSettings(settings) || pixels.length !== width * height * 4) throw new Error('照片或影调参数不正确。')
  const material = new StageMaterial(width, height), values = new Float32Array(width * height), histogram = new Uint32Array(256)
  for (let i = 0; i < values.length; i++) {
    const a = pixels[i * 4 + 3] / 255
    const light = (pixels[i * 4] * .2126 + pixels[i * 4 + 1] * .7152 + pixels[i * 4 + 2] * .0722) / 255
    values[i] = light * a + 1 - a
    histogram[Math.round(values[i] * 255)]++
  }
  const percentile = (fraction: number) => {
    let n = 0
    for (let i = 0; i < histogram.length; i++) { n += histogram[i]; if (n >= values.length * fraction) return i / 255 }
    return 1
  }
  const low = percentile(.015), high = percentile(.985), range = Math.max(.35, high - low)
  const smoothed = blur(values, width, height)
  for (let i = 0; i < values.length; i++) {
    const gray = smoothed[i] + (values[i] - smoothed[i]) * (.2 + settings.detail * 1.6)
    const normalized = high - low < .08 ? gray : (gray - low * .7) / (range + low * .3)
    let light = normalized * Math.pow(2, settings.exposure)
    light = (light - .5) * settings.contrast + .5 + settings.white * .14
    material.density[i] = Math.max(0, Math.min(2.8, -Math.log(clamp(light, .025, 1)) / 1.35))
  }
  if (settings.style === 'portrait') {
    const soft = blur(material.density, width, height, Math.max(2, Math.round(width / 110)))
    const broad = blur(soft, width, height, Math.max(4, Math.round(width / 32)))
    const focus = focusFor(settings)
    const smooth = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t) }
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x
      const distance = Math.hypot((x / width - focus.x) / focus.size, (y / height - focus.y) / (focus.size * 1.42))
      const weight = 1 - smooth((distance - .55) / .65)
      // 主体范围由创作者选择，未做自动人脸识别。外围保留淡的环境光影。
      const value = broad[i] * (1 - weight) + (soft[i] * .68 + material.density[i] * .32) * weight
      const tone = value * .84 + Math.round(value * 5) / 5 * .16
      const border = smooth(Math.min(x / width, 1 - x / width, y / height, 1 - y / height) / .065)
      material.density[i] = Math.max(0, tone * (.12 + .88 * weight) * border - .022 * (1 - weight))
    }
  }
  const state = material.read()
  state.suppliedMass = state.density.reduce((sum, n) => sum + n, 0)
  return state
}
/** 独立照片调色，不改变原舞台 / 工作室的默认渲染。 */
export function sandPixels(state: StageMaterialSnapshot, settings: PhotoSettings): Uint8ClampedArray {
  const { paper, sand } = moods[settings.mood], pixels = new Uint8ClampedArray(state.density.length * 4)
  for (let i = 0; i < state.density.length; i++) {
    let n = Math.imul(i ^ 0x68bc21eb, 0x45d9f3b)
    n = Math.imul(n ^ n >>> 16, 0x45d9f3b)
    const noise = ((n ^ n >>> 16) >>> 0) / 0xffffffff
    const amount = state.density[i]
    const light = Math.exp(-amount * (1 + (noise - .5) * settings.grain * .25) * 1.35)
    const texture = (noise - .5) * settings.grain * Math.min(amount, 1) * 9
    for (let c = 0; c < 3; c++) pixels[i * 4 + c] = sand[c] + (paper[c] - sand[c]) * light + texture
    pixels[i * 4 + 3] = 255
  }
  return pixels
}
