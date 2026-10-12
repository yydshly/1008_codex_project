import { GRID_HEIGHT, GRID_WIDTH, toolCodes } from './model'
import type { SavedArt } from './storage'

export const MAX_PROJECT_BYTES = 60 * 1024 * 1024
const MAX_REFERENCE_BYTES = 20 * 1024 * 1024
const STATE_BYTES = GRID_WIDTH * GRID_HEIGHT * 16
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}格式无效。`)
  return value as Record<string, unknown>
}
function number(value: unknown, low: number, high: number, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high) throw new Error(`${label}超出允许范围 ${low}–${high}。`)
  return value
}
function boolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label}必须是布尔值。`)
  return value
}
function text(value: unknown, limit: number, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > limit || value.includes('\0')) throw new Error(`${label}无效。`)
  return value
}
function stateBuffer(value: unknown, label: string): ArrayBuffer {
  if (!(value instanceof ArrayBuffer) || value.byteLength !== STATE_BYTES) throw new Error(`${label}必须匹配 ${GRID_WIDTH}×${GRID_HEIGHT} 四通道沙量网格。`)
  const values = new Float32Array(value)
  for (let index = 0; index < values.length; index++) {
    const channel = index % 4
    if (!Number.isFinite(values[index]) || Math.abs(values[index]) > 1_000_000 || (channel < 2 && values[index] < 0)) throw new Error(`${label}含无效沙量、活动量或速度。`)
  }
  return value
}

/** 校验持久化数据；不替换沙床、不重新生成 reference，也不修改原对象。 */
export function validateSavedArt(value: unknown): SavedArt {
  const art = record(value, '沙画项目')
  if (art.version !== 1) throw new Error('不支持该沙画项目版本。')
  if (art.width !== GRID_WIDTH || art.height !== GRID_HEIGHT) throw new Error(`沙画项目尺寸必须为 ${GRID_WIDTH}×${GRID_HEIGHT}。`)
  if (art.mode !== 'surface' && art.mode !== 'lightbox') throw new Error('沙画模式无效。')
  const savedAt = text(art.savedAt, 80, '保存时间')
  if (!Number.isFinite(Date.parse(savedAt))) throw new Error('保存时间无效。')
  const source = record(art.settings, '创作设置')
  const allowed = ['tool', 'radius', 'strength', 'wetness', 'wind', 'light', 'flow', 'palmAngle', 'palmAspect', 'pourStyle', 'pourHeight', 'pourSpread', 'referenceVisible', 'referenceOpacity', 'referenceGrid']
  if (Object.keys(source).some(key => !allowed.includes(key))) throw new Error('创作设置含不支持的字段。')
  if (typeof source.tool !== 'string' || !Object.hasOwn(toolCodes, source.tool)) throw new Error('创作工具无效。')
  if (source.light !== 'noon' && source.light !== 'sunset' && source.light !== 'moon') throw new Error('光照设置无效。')
  const settings: SavedArt['settings'] = {
    tool: source.tool as SavedArt['settings']['tool'], light: source.light,
    radius: number(source.radius, 3, 42, '笔触大小'), strength: number(source.strength, 0.1, 1, '力度'),
    wetness: number(source.wetness, 0, 1, '湿度'), wind: number(source.wind, 0, 1, '风力'),
  }
  if (source.flow !== undefined) settings.flow = boolean(source.flow, '沙流开关')
  if (source.palmAngle !== undefined) settings.palmAngle = number(source.palmAngle, -Math.PI * 2, Math.PI * 2, '掌形角度')
  if (source.palmAspect !== undefined) settings.palmAspect = number(source.palmAspect, 0.3, 1, '掌形比例')
  if (source.pourStyle !== undefined) {
    if (source.pourStyle !== 'stream' && source.pourStyle !== 'scatter' && source.pourStyle !== 'handful') throw new Error('撒沙手势无效。')
    settings.pourStyle = source.pourStyle
  }
  if (source.pourHeight !== undefined) settings.pourHeight = number(source.pourHeight, 0, 1, '抬手高度')
  if (source.pourSpread !== undefined) settings.pourSpread = number(source.pourSpread, 0, 1, '撒开范围')
  if (source.referenceVisible !== undefined) settings.referenceVisible = boolean(source.referenceVisible, '参考图开关')
  if (source.referenceOpacity !== undefined) settings.referenceOpacity = number(source.referenceOpacity, 0, 1, '参考图透明度')
  if (source.referenceGrid !== undefined) settings.referenceGrid = boolean(source.referenceGrid, '参考网格开关')
  const checked: SavedArt = { version: 1, width: GRID_WIDTH, height: GRID_HEIGHT, mode: art.mode, savedAt, settings, state: stateBuffer(art.state, '沙床状态') }
  if (art.referenceState !== undefined) checked.referenceState = stateBuffer(art.referenceState, '工具参考状态')
  if (art.referenceImage !== undefined) {
    const image = record(art.referenceImage, '参考图片')
    if (!(image.blob instanceof Blob) || !image.blob.size || image.blob.size > MAX_REFERENCE_BYTES || !IMAGE_TYPES.includes(image.blob.type)) throw new Error('参考图片必须是小于 20 MB 的 PNG、JPEG 或 WebP。')
    checked.referenceImage = { blob: image.blob, name: text(image.name, 255, '参考图片名称') }
  }
  if (art.title !== undefined) checked.title = text(art.title, 80, '作品名称')
  if (art.paintingId !== undefined) {
    const id = text(art.paintingId, 120, '作品编号')
    if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('作品编号无效。')
    checked.paintingId = id
  }
  if (art.conversion !== undefined) {
    const sourceConversion = record(art.conversion, '图像转换设置')
    if (Object.keys(sourceConversion).some(key => !['blackPoint', 'whitePoint', 'gamma', 'invert', 'minHeight', 'maxHeight'].includes(key))) throw new Error('图像转换设置含不支持的字段。')
    const blackPoint = number(sourceConversion.blackPoint, 0, 255, '黑场')
    const whitePoint = number(sourceConversion.whitePoint, 0, 255, '白场')
    if (blackPoint >= whitePoint) throw new Error('黑场必须小于白场。')
    const minHeight = number(sourceConversion.minHeight, 0, 8, '最薄沙量')
    const maxHeight = number(sourceConversion.maxHeight, 0, 8, '最厚沙量')
    if (minHeight > maxHeight) throw new Error('最薄沙量不能大于最厚沙量。')
    checked.conversion = { blackPoint, whitePoint, minHeight, maxHeight, gamma: number(sourceConversion.gamma, 0.1, 5, '灰度曲线'), invert: boolean(sourceConversion.invert, '明暗反转') }
  }
  return checked
}

function encodeBytes(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunks: string[] = []
  // 块长是 3 的倍数，分段 btoa 不在中途添加 padding；不对大数组使用 spread。
  for (let start = 0; start < bytes.length; start += 24576) {
    let binary = ''
    const end = Math.min(start + 24576, bytes.length)
    for (let index = start; index < end; index++) binary += String.fromCharCode(bytes[index])
    chunks.push(btoa(binary))
  }
  return chunks.join('')
}
function decodeBytes(value: unknown, label: string, expectedBytes?: number): ArrayBuffer {
  if (typeof value !== 'string' || !value.length || value.length % 4 || /[^A-Za-z0-9+/=]/.test(value)) throw new Error(`${label}的 base64 编码无效。`)
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0
  if (value.indexOf('=') !== (padding ? value.length - padding : -1)) throw new Error(`${label}的 base64 补位无效。`)
  const length = value.length / 4 * 3 - padding
  if ((expectedBytes !== undefined && length !== expectedBytes) || length > MAX_REFERENCE_BYTES) throw new Error(`${label}的数据尺寸无效。`)
  const bytes = new Uint8Array(length)
  let offset = 0
  try {
    for (let start = 0; start < value.length; start += 32768) {
      const binary = atob(value.slice(start, start + 32768))
      for (let index = 0; index < binary.length; index++) bytes[offset++] = binary.charCodeAt(index)
    }
  } catch { throw new Error(`${label}的 base64 编码无效。`) }
  return bytes.buffer
}

/** 可携带到另一设备的无损 JSON；本地 gallery 编号不会写入文件。 */
export async function exportArtProject(art: SavedArt): Promise<Blob> {
  const checked = validateSavedArt(art)
  const { state, referenceState, referenceImage, paintingId: localId, ...metadata } = checked
  void localId
  const document = {
    format: 'sandboard-sand-art', version: 1, art: {
      ...metadata, state: encodeBytes(state),
      ...(referenceState ? { referenceState: encodeBytes(referenceState) } : {}),
      ...(referenceImage ? { referenceImage: { name: referenceImage.name, type: referenceImage.blob.type, data: encodeBytes(await referenceImage.blob.arrayBuffer()) } } : {}),
    },
  }
  const file = new Blob([JSON.stringify(document)], { type: 'application/json' })
  if (file.size >= MAX_PROJECT_BYTES) throw new Error('沙画项目文件必须小于 60 MB。')
  return file
}

export async function importArtProject(file: Blob | string): Promise<SavedArt> {
  if ((typeof file !== 'string' && !(file instanceof Blob)) || (typeof file === 'string' ? file.length >= MAX_PROJECT_BYTES || new TextEncoder().encode(file).byteLength >= MAX_PROJECT_BYTES : file.size >= MAX_PROJECT_BYTES)) throw new Error('请选择小于 60 MB 的沙画项目文件。')
  const contents = typeof file === 'string' ? file : await file.text()
  let document: Record<string, unknown>
  try { document = record(JSON.parse(contents), '沙画项目文件') } catch { throw new Error('沙画项目文件不是有效的 JSON。') }
  if (document.format !== 'sandboard-sand-art' || document.version !== 1) throw new Error('不支持该沙画项目文件格式或版本。')
  const source = record(document.art, '沙画项目')
  // 在解码前确认网格，避免为不兼容文件分配大数组。
  if (source.width !== GRID_WIDTH || source.height !== GRID_HEIGHT) throw new Error(`沙画项目尺寸必须为 ${GRID_WIDTH}×${GRID_HEIGHT}。`)
  const decoded: Record<string, unknown> = { ...source, state: decodeBytes(source.state, '沙床状态', STATE_BYTES) }
  if (source.referenceState !== undefined) decoded.referenceState = decodeBytes(source.referenceState, '工具参考状态', STATE_BYTES)
  if (source.referenceImage !== undefined) {
    const image = record(source.referenceImage, '参考图片')
    if (typeof image.type !== 'string' || !IMAGE_TYPES.includes(image.type)) throw new Error('参考图片类型不支持。')
    decoded.referenceImage = { name: image.name, blob: new Blob([decodeBytes(image.data, '参考图片')], { type: image.type }) }
  }
  // 外部文件导入是独立作品，不沿用来源设备的编号覆盖本地作品。
  delete decoded.paintingId
  return validateSavedArt(decoded)
}
