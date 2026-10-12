import { naturalFlowAt } from './airborne'
import { allocateHand, HAND_CAPACITY } from './hand'
import { FIXED_STEP, GRID_HEIGHT, GRID_WIDTH, clamp, type ArtContact, type ArtCursor, type ArtPoint, type ArtPour, type ArtStep } from './model'
import { validateRecording, type Recording, type RecordingEvent } from './recording'
import type { SavedArt } from './storage'

export const DEMO_DURATION_TICKS = 2400
export type DemoPhase = { label: string; description: string; cursor?: ArtCursor | null; handPercent?: number; settings?: Pick<ArtContact, 'tool' | 'radius' | 'strength' | 'pour'> }
type Phase = { start: number; end: number; label: string; description: string; refill?: boolean; gesture?: 'left' | 'right' | 'moon' | 'ridge' | 'wipe' | 'river'; prepare?: ArtPoint }
const phases: readonly Phase[] = [
  { start: 0, end: 72, label: '抓起第一把沙', description: '掌心备沙，空灯箱等待第一笔。', refill: true, prepare: { x: 85, y: 300 } },
  { start: 72, end: 408, label: '掌心散撒 · 左山', description: '沿山势绕行，轻重不齐的沙簇慢慢铺出近山。', gesture: 'left' },
  { start: 408, end: 480, label: '让沙落下', description: '松手，空中沙粒继续落到山影里。' },
  { start: 480, end: 552, label: '再抓一把沙', description: '换一把沙，准备右侧更高的山。', refill: true, prepare: { x: 245, y: 315 } },
  { start: 552, end: 900, label: '掌心散撒 · 右山', description: '手掌抬高再收拢，深浅沙层形成远近山势。', gesture: 'right' },
  { start: 900, end: 972, label: '山影落定', description: '暂停一下，观察稀疏沙尾与密集山影。' },
  { start: 972, end: 1044, label: '第三把 · 留给月与山脊', description: '最后一把沙，分给月旁的暗部和指缝细线。', refill: true, prepare: { x: 381, y: 105 } },
  { start: 1044, end: 1104, label: '一把撒开 · 月旁云沙', description: '一次释放，聚团与散尾铺出月亮周围的暗部。', gesture: 'moon' },
  { start: 1104, end: 1440, label: '指缝细流 · 勾出山脊', description: '手指捏合，细沙沿两座山脊缓缓落下。', gesture: 'ridge' },
  { start: 1440, end: 1524, label: '细沙落定', description: '不再加料，等待最后的山线落到画台。' },
  { start: 1524, end: 1716, label: '掌心擦出一轮月', description: '圆润掌面移开细沙，透亮玻璃露出月光。', gesture: 'wipe' },
  { start: 1716, end: 1992, label: '指尖刮出曲河', description: '从山谷向下蜿蜒，亮线把两侧山影连成山水。', gesture: 'river' },
  { start: 1992, end: DEMO_DURATION_TICKS, label: '山月 · 留画', description: '沙已落定，山脊、月光与曲河留在同一张灯箱上。' },
]

// These are drawing gestures, not masks: the recording contains only the
// resulting contacts, and every dark region must come from airborne mass.
const leftPath: readonly ArtPoint[] = [
  { x: 78, y: 309 }, { x: 111, y: 282 }, { x: 141, y: 249 }, { x: 163, y: 201 },
  { x: 173, y: 231 }, { x: 187, y: 270 }, { x: 220, y: 305 }, { x: 180, y: 318 },
  { x: 132, y: 295 }, { x: 141, y: 259 }, { x: 164, y: 244 }, { x: 170, y: 288 },
  { x: 143, y: 324 }, { x: 92, y: 316 },
]
const rightPath: readonly ArtPoint[] = [
  { x: 236, y: 325 }, { x: 271, y: 291 }, { x: 292, y: 248 }, { x: 316, y: 184 },
  { x: 336, y: 227 }, { x: 371, y: 281 }, { x: 414, y: 321 }, { x: 364, y: 329 },
  { x: 313, y: 295 }, { x: 310, y: 251 }, { x: 337, y: 274 }, { x: 332, y: 322 },
  { x: 288, y: 340 }, { x: 247, y: 328 },
]
const ridgePath: readonly ArtPoint[] = [
  { x: 80, y: 284 }, { x: 119, y: 239 }, { x: 157, y: 189 }, { x: 174, y: 208 },
  { x: 218, y: 270 }, { x: 246, y: 282 }, { x: 280, y: 228 }, { x: 314, y: 168 },
  { x: 341, y: 211 }, { x: 380, y: 269 }, { x: 414, y: 300 },
]
const riverPath: readonly ArtPoint[] = [
  { x: 295, y: 242 }, { x: 283, y: 264 }, { x: 294, y: 282 }, { x: 263, y: 298 },
  { x: 250, y: 315 }, { x: 276, y: 334 }, { x: 250, y: 354 },
]

function pathAt(path: readonly ArtPoint[], fraction: number): ArtPoint {
  const coordinate = clamp(fraction, 0, 1) * (path.length - 1)
  const index = Math.min(path.length - 2, Math.floor(coordinate)), t = coordinate - index
  const at = (offset: number) => path[Math.max(0, Math.min(path.length - 1, index + offset))]
  const a = at(-1), b = at(0), c = at(1), d = at(2)
  const axis = (key: 'x' | 'y') => 0.5 * (2 * b[key] + (-a[key] + c[key]) * t + (2 * a[key] - 5 * b[key] + 4 * c[key] - d[key]) * t * t + (-a[key] + 3 * b[key] - 3 * c[key] + d[key]) * t * t * t)
  return { x: clamp(axis('x'), 0.5, GRID_WIDTH - 0.5), y: clamp(axis('y'), 0.5, GRID_HEIGHT - 0.5) }
}
function rawContact(phase: Phase, tick: number): ArtContact | undefined {
  if (!phase.gesture) return
  const fraction = (tick - phase.start + 1) / (phase.end - phase.start)
  const previous = Math.max(0, fraction - 1 / (phase.end - phase.start))
  const time = tick * FIXED_STEP
  const gesture = phase.gesture
  const moving = gesture === 'left' || gesture === 'right' || gesture === 'ridge' || gesture === 'river'
  const path = gesture === 'left' ? leftPath : gesture === 'right' ? rightPath : gesture === 'ridge' ? ridgePath : riverPath
  const to = moving ? pathAt(path, fraction) : { x: 381 + (gesture === 'wipe' ? Math.sin(fraction * Math.PI * 2) * 1.1 : 0), y: 105 }
  const from = moving ? pathAt(path, previous) : to
  const velocity = { x: (to.x - from.x) / FIXED_STEP, y: (to.y - from.y) / FIXED_STEP }
  if (gesture === 'wipe') return { tool: 'palm', from, to, velocity: { x: 0, y: 0 }, radius: 24, pressure: 0.97, strength: 1, angle: 0, aspect: 1 }
  if (gesture === 'river') return { tool: 'scrape', from, to, velocity, radius: 9 + Math.sin(fraction * Math.PI * 1.4) * 2, pressure: 0.97, strength: 1 }
  const style = gesture === 'moon' ? 'handful' : gesture === 'ridge' ? 'stream' : 'scatter'
  const pour: ArtPour = { style, natural: true, flow: naturalFlowAt(time, style, to.x, to.y),
    height: style === 'handful' ? 0.2 : style === 'stream' ? 0.12 + Math.sin(fraction * Math.PI) * 0.13 : 0.30 + (0.5 + Math.sin(fraction * Math.PI * 3.1 + (gesture === 'right' ? 1.3 : 0)) * 0.5) * 0.32,
    spread: style === 'handful' ? 0.42 : style === 'stream' ? 0.28 : 0.35 + (0.5 + Math.sin(fraction * 11.0) * 0.5) * 0.20,
    ...(style === 'handful' ? { burst: tick === phase.start ? 1 : 0 } : {}),
  }
  return { tool: 'pour', from, to, velocity, pour, radius: style === 'handful' ? 31 : style === 'stream' ? 17 : 26 + Math.sin(fraction * 7.0) * 3,
    pressure: style === 'handful' ? 1 : 0.76 + Math.sin(fraction * 9.0) * 0.11,
    strength: style === 'handful' ? 1 : style === 'stream' ? 0.24 : 0.72,
  }
}

type Timeline = { events: RecordingEvent[]; cues: DemoPhase[] }
let timeline: Timeline | undefined
function buildTimeline(): Timeline {
  const events: RecordingEvent[] = [], cues: DemoPhase[] = []
  let remaining = HAND_CAPACITY, lastSignature = ''
  let settings: DemoPhase['settings'] = { tool: 'pour', radius: 26, strength: 0.72, pour: { style: 'scatter', height: 0.45, spread: 0.5, natural: true } }
  for (let tick = 0; tick < DEMO_DURATION_TICKS; tick++) {
    const phase = phases.find(item => tick >= item.start && tick < item.end)!
    if (phase.refill && tick === phase.start) remaining = HAND_CAPACITY
    const raw = rawContact(phase, tick)
    const allocated = allocateHand(raw ? [raw] : [], remaining, FIXED_STEP)
    remaining = allocated.remaining
    const step: ArtStep = { dt: FIXED_STEP, contacts: allocated.contacts, wetness: 0, wind: 0, windAngle: 0.2, preserve: true }
    const signature = JSON.stringify(step), last = events.at(-1)
    if (signature === lastSignature && last?.type === 'step') last.repeat++
    else events.push({ type: 'step', step, repeat: 1 })
    lastSignature = signature
    const contact = allocated.contacts[0]
    if (contact) settings = { tool: contact.tool, radius: contact.radius, strength: contact.strength, ...(contact.pour ? { pour: { ...contact.pour } } : {}) }
    const preparing = phase.prepare
    const cursor: ArtCursor | null = contact ? { ...contact.to, radius: contact.radius, tool: contact.tool, active: true,
      down: contact.pressure > 0, angle: contact.angle, aspect: contact.aspect, ...(contact.pour ? { pour: { ...contact.pour } } : {}),
    } : preparing ? { ...preparing, radius: 26, tool: 'pour', active: true, down: false,
      pour: { style: phase.start === 972 ? 'handful' : 'scatter', height: 0.45, spread: 0.5, natural: true, flow: 0 },
    } : null
    cues.push({ label: phase.label, description: phase.description, cursor, handPercent: Math.round(remaining / HAND_CAPACITY * 100), settings })
  }
  return { events, cues }
}
function getTimeline() { return timeline ??= buildTimeline() }

/** Twenty seconds of real sand deposition and sculpting on a blank lightbox. */
export function createSandDemo(): Recording {
  const state = new Float32Array(GRID_WIDTH * GRID_HEIGHT * 4)
  const createdAt = '2026-10-08T00:00:00.000Z'
  const initial: SavedArt = { version: 1, width: GRID_WIDTH, height: GRID_HEIGHT, mode: 'lightbox', state: state.buffer,
    referenceState: state.buffer.slice(0), savedAt: createdAt, title: '山月 · 传统撒沙演示',
    settings: { tool: 'pour', radius: 26, strength: 0.72, wetness: 0, wind: 0, light: 'noon', flow: false,
      palmAngle: 0, palmAspect: 1, pourStyle: 'scatter', pourHeight: 0.45, pourSpread: 0.5, referenceVisible: false, referenceOpacity: 0.35, referenceGrid: false },
  }
  return validateRecording({ format: 'sandboard-sand-recording', version: 1, title: initial.title!, createdAt, initial, events: getTimeline().events, ticks: DEMO_DURATION_TICKS })
}

/** Pure timeline cue; returned cursor values may be changed by the UI safely. */
export function demoPhaseAt(tick: number): DemoPhase {
  const index = clamp(Number.isFinite(tick) ? Math.floor(tick) : 0, 0, DEMO_DURATION_TICKS - 1)
  const cue = getTimeline().cues[index]
  return { ...cue, settings: cue.settings ? { ...cue.settings, ...(cue.settings.pour ? { pour: { ...cue.settings.pour } } : {}) } : undefined, cursor: cue.cursor ? { ...cue.cursor, ...(cue.cursor.pour ? { pour: { ...cue.cursor.pour } } : {}) } : null }
}
