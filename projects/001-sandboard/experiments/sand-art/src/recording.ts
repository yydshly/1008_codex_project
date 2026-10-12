import { FIXED_STEP, GRID_HEIGHT, GRID_WIDTH, MAX_CONTACTS, toolCodes } from './model'
import type { ArtContact, ArtStep, LightPreset } from './model'
import { exportArtProject, importArtProject, validateSavedArt } from './project-file'
import type { SavedArt } from './storage'

export const MAX_RECORDING_SECONDS = 180
export const MAX_RECORDING_TICKS = 21600
export const MAX_RECORDING_SNAPSHOTS = 8
export const MAX_RECORDING_EVENTS = MAX_RECORDING_TICKS * 2 + MAX_RECORDING_SNAPSHOTS
// Eight full state/reference snapshots need about 64 MiB of base64. Leave room
// for changing eight-contact steps; image attachments never enter a recording.
export const MAX_RECORDING_BYTES = 128 * 1024 * 1024
export const RECORDING_EXTENSION = '.sandrecord.json'
export type RecordingLook = { light: LightPreset; wetness: number; wind: number }
export type RecordingEvent =
  | { type: 'step'; step: ArtStep; repeat: number }
  | { type: 'look'; settings: RecordingLook }
  | { type: 'snapshot'; art: SavedArt }
export type Recording = {
  format: 'sandboard-sand-recording'
  version: 1
  title: string
  createdAt: string
  initial: SavedArt
  events: RecordingEvent[]
  ticks: number
}
type SnapshotSlot = { type: 'snapshot'; art?: SavedArt }
type PendingEvent = Exclude<RecordingEvent, { type: 'snapshot' }> | SnapshotSlot
const databaseName = 'sandboard-art-recordings'
const storeName = 'recordings'

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}格式无效。`)
  return value as Record<string, unknown>
}
function fields(value: Record<string, unknown>, allowed: readonly string[], label: string) {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error(`${label}含不支持的字段。`)
}
function number(value: unknown, low: number, high: number, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high) throw new Error(`${label}必须在 ${low}–${high} 范围内。`)
  return value
}
function integer(value: unknown, low: number, high: number, label: string): number {
  const checked = number(value, low, high, label)
  if (!Number.isInteger(checked)) throw new Error(`${label}必须是整数。`)
  return checked
}
function title(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 80 || value.includes('\0')) throw new Error('录制名称应为 1–80 个字符。')
  return value.trim()
}
function look(value: unknown): RecordingLook {
  const source = object(value, '录制画面设置')
  fields(source, ['light', 'wetness', 'wind'], '录制画面设置')
  if (source.light !== 'noon' && source.light !== 'sunset' && source.light !== 'moon') throw new Error('录制光照设置无效。')
  return { light: source.light, wetness: number(source.wetness, 0, 1, '录制湿度'), wind: number(source.wind, 0, 1, '录制风力') }
}
function point(value: unknown, velocity = false): { x: number; y: number } {
  const source = object(value, velocity ? '笔触速度' : '笔触坐标')
  fields(source, ['x', 'y'], '笔触坐标')
  return {
    x: number(source.x, velocity ? -4000 : 0, velocity ? 4000 : GRID_WIDTH, velocity ? '横向速度' : '横向坐标'),
    y: number(source.y, velocity ? -4000 : 0, velocity ? 4000 : GRID_HEIGHT, velocity ? '纵向速度' : '纵向坐标'),
  }
}
function contact(value: unknown): ArtContact {
  const source = object(value, '录制笔触')
  fields(source, ['from', 'to', 'velocity', 'radius', 'pressure', 'strength', 'tool', 'angle', 'aspect', 'pour'], '录制笔触')
  if (typeof source.tool !== 'string' || !Object.hasOwn(toolCodes, source.tool)) throw new Error('录制创作工具无效。')
  const result: ArtContact = {
    from: point(source.from), to: point(source.to), velocity: point(source.velocity, true),
    radius: number(source.radius, 0.25, 128, '录制笔触大小'),
    pressure: number(source.pressure, 0, 1, '录制接触压力'),
    strength: number(source.strength, 0, 4, '录制力度'), tool: source.tool as ArtContact['tool'],
  }
  if (source.angle !== undefined) result.angle = number(source.angle, -Math.PI * 2, Math.PI * 2, '录制掌形角度')
  if (source.aspect !== undefined) result.aspect = number(source.aspect, 0.3, 1, '录制掌形比例')
  if (source.pour !== undefined) {
    if (source.tool !== 'pour') throw new Error('只有撒沙笔触可以包含撒沙手势。')
    const pour = object(source.pour, '录制撒沙手势')
    fields(pour, ['style', 'height', 'spread', 'burst', 'natural', 'flow'], '录制撒沙手势')
    if (pour.style !== 'stream' && pour.style !== 'scatter' && pour.style !== 'handful') throw new Error('录制撒沙手势无效。')
    result.pour = { style: pour.style, height: number(pour.height, 0, 1, '录制抬手高度'), spread: number(pour.spread, 0, 1, '录制撒开范围') }
    if (pour.burst !== undefined) result.pour.burst = number(pour.burst, 0, 1, '录制单次释放量')
    if (pour.natural !== undefined) {
      if (typeof pour.natural !== 'boolean') throw new Error('录制自然撒沙开关必须是布尔值。')
      result.pour.natural = pour.natural
    }
    if (pour.flow !== undefined) result.pour.flow = number(pour.flow, 0, 2, '录制撒沙流量')
  }
  return result
}
function step(value: unknown): ArtStep {
  const source = object(value, '录制计算步')
  fields(source, ['dt', 'contacts', 'wetness', 'wind', 'windAngle', 'preserve'], '录制计算步')
  if (source.dt !== FIXED_STEP) throw new Error('录制必须使用 1/120 秒的固定计算步。')
  if (!Array.isArray(source.contacts) || source.contacts.length > MAX_CONTACTS) throw new Error(`每个录制计算步最多包含 ${MAX_CONTACTS} 个笔触。`)
  const result: ArtStep = {
    dt: FIXED_STEP, contacts: source.contacts.map(contact),
    wetness: number(source.wetness, 0, 1, '录制湿度'), wind: number(source.wind, 0, 1, '录制风力'),
    windAngle: number(source.windAngle, -Math.PI * 2, Math.PI * 2, '录制风向'),
  }
  if (source.preserve !== undefined) {
    if (typeof source.preserve !== 'boolean') throw new Error('录制笔迹保留开关必须是布尔值。')
    result.preserve = source.preserve
  }
  return result
}
function recordingArt(value: unknown, copy = false): SavedArt {
  const source = { ...object(value, '录制沙床') }
  delete source.referenceImage
  delete source.paintingId
  const checked = validateSavedArt(source)
  return {
    ...checked, state: copy ? checked.state.slice(0) : checked.state,
    ...(checked.referenceState ? { referenceState: copy ? checked.referenceState.slice(0) : checked.referenceState } : {}),
    settings: { ...checked.settings }, ...(checked.conversion ? { conversion: { ...checked.conversion } } : {}),
  }
}
function metadata(value: unknown) {
  const source = object(value, '沙画录制')
  fields(source, ['format', 'version', 'title', 'createdAt', 'initial', 'events', 'ticks'], '沙画录制')
  if (source.format !== 'sandboard-sand-recording' || source.version !== 1) throw new Error('不支持该沙画录制格式或版本。')
  if (typeof source.createdAt !== 'string' || source.createdAt.length > 80 || !Number.isFinite(Date.parse(source.createdAt))) throw new Error('录制创建时间无效。')
  if (!Array.isArray(source.events) || source.events.length > MAX_RECORDING_EVENTS) throw new Error('录制事件数量超出上限。')
  return { source, title: title(source.title), createdAt: source.createdAt, ticks: integer(source.ticks, 0, MAX_RECORDING_TICKS, '录制总步数'), events: source.events }
}
function events(value: unknown[], decodeArt: (value: unknown) => SavedArt): RecordingEvent[] {
  let snapshots = 1
  let ticks = 0
  return value.map((value) => {
    const source = object(value, '录制事件')
    if (source.type === 'step') {
      fields(source, ['type', 'step', 'repeat'], '录制计算事件')
      const repeat = integer(source.repeat, 1, MAX_RECORDING_TICKS, '录制重复步数')
      ticks += repeat
      if (ticks > MAX_RECORDING_TICKS) throw new Error('录制不能超过 180 秒。')
      return { type: 'step', step: step(source.step), repeat }
    }
    if (source.type === 'look') {
      fields(source, ['type', 'settings'], '录制画面事件')
      return { type: 'look', settings: look(source.settings) }
    }
    if (source.type === 'snapshot') {
      fields(source, ['type', 'art'], '录制快照事件')
      if (++snapshots > MAX_RECORDING_SNAPSHOTS) throw new Error('录制最多保留 8 个沙床快照（包括起始画面）。')
      return { type: 'snapshot', art: decodeArt(source.art) }
    }
    throw new Error('录制事件类型无效。')
  })
}
export function validateRecording(value: unknown): Recording {
  const checked = metadata(value)
  const initial = recordingArt(checked.source.initial)
  const parsed = events(checked.events, recordingArt)
  if (parsed.some(event => event.type === 'snapshot' && event.art.mode !== initial.mode)) throw new Error('一份录制只能使用同一种沙画模式。')
  const ticks = parsed.reduce((sum, event) => sum + (event.type === 'step' ? event.repeat : 0), 0)
  if (ticks !== checked.ticks) throw new Error('录制总步数与计算事件不一致。')
  return { format: 'sandboard-sand-recording', version: 1, title: checked.title, createdAt: checked.createdAt, initial, events: parsed, ticks }
}

/** CPU event stream; async GPU snapshots reserve their place immediately. */
export class RecordingBuilder {
  private readonly initial: SavedArt
  private readonly createdAt = new Date().toISOString()
  private readonly events: PendingEvent[] = []
  private readonly pending: Promise<void>[] = []
  private count = 0
  private snapshots = 1
  private closed = false
  private limited = false
  private failure?: Error
  private lastStep?: string
  private lastLook?: string
  private finished?: Promise<Recording>

  constructor(initial: SavedArt) {
    this.initial = recordingArt(initial, true)
    this.lastLook = JSON.stringify(look({ light: initial.settings.light, wetness: initial.settings.wetness, wind: initial.settings.wind }))
  }
  get ticks() { return this.count }
  get stopped() { return this.closed }
  get limitReached() { return this.limited }
  get error() { return this.failure }

  private limit() { this.closed = true; this.limited = true; return false }
  private canAppend() { return this.events.length < MAX_RECORDING_EVENTS || this.limit() }
  recordStep(input: ArtStep): boolean {
    if (this.closed) return false
    const copied = step(input)
    const signature = JSON.stringify(copied)
    const previous = this.events.at(-1)
    if (previous?.type === 'step' && signature === this.lastStep) previous.repeat++
    else {
      if (!this.canAppend()) return false
      this.events.push({ type: 'step', step: copied, repeat: 1 })
    }
    this.lastStep = signature
    if (++this.count === MAX_RECORDING_TICKS) this.limit()
    return true
  }
  recordLook(settings: RecordingLook): boolean {
    if (this.closed) return false
    // The live workspace passes a complete Settings object; only these three
    // values affect the recording's appearance. File parsing remains strict.
    const copied = look({ light: settings.light, wetness: settings.wetness, wind: settings.wind })
    const signature = JSON.stringify(copied)
    if (signature === this.lastLook) return true
    const previous = this.events.at(-1)
    if (previous?.type === 'look') previous.settings = copied
    else {
      if (!this.canAppend()) return false
      this.events.push({ type: 'look', settings: copied })
    }
    this.lastLook = signature
    this.lastStep = undefined
    return true
  }
  recordSnapshot(art: Promise<SavedArt>): boolean {
    if (this.closed || this.snapshots === MAX_RECORDING_SNAPSHOTS || !this.canAppend()) {
      // The caller has already started a readback. Consume its rejection even
      // when this snapshot cannot be accepted, without retaining its payload.
      void art.catch(() => undefined)
      if (!this.closed) this.limit()
      return false
    }
    const slot: SnapshotSlot = { type: 'snapshot' }
    this.events.push(slot)
    this.snapshots++
    this.lastStep = undefined
    this.lastLook = undefined
    this.pending.push(art.then(value => {
      const copied = recordingArt(value, true)
      if (copied.mode !== this.initial.mode) throw new Error('一份录制只能使用同一种沙画模式。')
      slot.art = copied
    }).catch(error => {
      this.failure ??= new Error(`录制快照读取失败：${error instanceof Error ? error.message : String(error)}`)
      this.closed = true
    }))
    return true
  }
  finish(name = this.initial.title ?? '沙画表演'): Promise<Recording> {
    this.closed = true
    this.finished ??= Promise.all(this.pending).then(() => {
      if (this.failure) throw this.failure
      return validateRecording({ format: 'sandboard-sand-recording', version: 1, title: name, createdAt: this.createdAt, initial: this.initial, events: this.events, ticks: this.count })
    })
    return this.finished
  }
}

async function projectDocument(art: SavedArt): Promise<unknown> {
  return JSON.parse(await (await exportArtProject(art)).text()) as unknown
}
/** Portable recording. Each snapshot uses the lossless sand-art file codec. */
export async function exportRecording(recording: Recording): Promise<Blob> {
  const checked = validateRecording(recording)
  const initial = await projectDocument(checked.initial)
  const encoded: unknown[] = []
  for (const event of checked.events) encoded.push(event.type === 'snapshot' ? { type: 'snapshot', art: await projectDocument(event.art) } : event)
  const file = new Blob([JSON.stringify({ ...checked, initial, events: encoded })], { type: 'application/json' })
  if (file.size >= MAX_RECORDING_BYTES) throw new Error('沙画录制文件必须小于 128 MB。')
  return file
}
function project(value: unknown) {
  const document = object(value, '录制沙床文件')
  fields(document, ['format', 'version', 'art'], '录制沙床文件')
  if (document.format !== 'sandboard-sand-art' || document.version !== 1) throw new Error('录制沙床文件格式或版本无效。')
  const art = object(document.art, '录制沙床')
  fields(art, ['version', 'width', 'height', 'mode', 'savedAt', 'title', 'settings', 'state', 'referenceState', 'conversion'], '录制沙床')
  if (art.mode !== 'surface' && art.mode !== 'lightbox') throw new Error('录制沙床模式无效。')
  return document
}
export async function importRecording(file: Blob | string): Promise<Recording> {
  if ((typeof file !== 'string' && !(file instanceof Blob)) || (typeof file === 'string' ? file.length >= MAX_RECORDING_BYTES || new TextEncoder().encode(file).byteLength >= MAX_RECORDING_BYTES : file.size >= MAX_RECORDING_BYTES)) throw new Error('请选择小于 128 MB 的沙画录制文件。')
  let document: unknown
  try { document = JSON.parse(typeof file === 'string' ? file : await file.text()) as unknown }
  catch { throw new Error('沙画录制文件不是有效的 JSON。') }
  const checked = metadata(document)
  const initialDocument = project(checked.source.initial)
  const mode = object(initialDocument.art, '录制沙床').mode
  // Validate the complete event structure and tick budget before decoding any
  // large base64 state. Placeholder buffers stay outside the returned result.
  const placeholders = events(checked.events, value => {
    const source = project(value)
    if (object(source.art, '录制沙床').mode !== mode) throw new Error('一份录制只能使用同一种沙画模式。')
    return source as unknown as SavedArt
  })
  const ticks = placeholders.reduce((sum, event) => sum + (event.type === 'step' ? event.repeat : 0), 0)
  if (ticks !== checked.ticks) throw new Error('录制总步数与计算事件不一致。')
  const initial = await importArtProject(JSON.stringify(initialDocument))
  const decoded: RecordingEvent[] = []
  for (const event of placeholders) decoded.push(event.type === 'snapshot' ? { type: 'snapshot', art: await importArtProject(JSON.stringify(event.art)) } : event)
  return validateRecording({ format: 'sandboard-sand-recording', version: 1, title: checked.title, createdAt: checked.createdAt, initial, events: decoded, ticks })
}

function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error) }
async function database(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') throw new Error('此浏览器暂不支持本地录制存储。')
  return new Promise((resolve, reject) => {
    let blocked = false
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName) }
    request.onsuccess = () => {
      if (blocked) { request.result.close(); return }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => reject(new Error(`无法打开本地录制存储：${errorMessage(request.error)}`))
    request.onblocked = () => { blocked = true; reject(new Error('另一个页面正在使用录制存储，请刷新该页面后重试。')) }
  })
}
export async function saveRecording(recording: Recording): Promise<void> {
  const checked = structuredClone(validateRecording(recording))
  const db = await database()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      transaction.objectStore(storeName).put(checked, 'latest')
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(new Error(`保存录制失败：${errorMessage(transaction.error)}`))
      transaction.onabort = () => reject(new Error('保存录制被中断，请重试。'))
    })
  } finally { db.close() }
}
export async function loadRecording(): Promise<Recording | undefined> {
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(storeName, 'readonly').objectStore(storeName).get('latest')
      request.onsuccess = () => {
        try { resolve(request.result === undefined ? undefined : validateRecording(request.result)) }
        catch (error) { reject(new Error(`本地录制无法读取：${errorMessage(error)}`)) }
      }
      request.onerror = () => reject(new Error(`读取录制失败：${errorMessage(request.error)}`))
    })
  } finally { db.close() }
}
