import type { StageContact, StageTool } from './material'

/** An original sand-table performance. Every mark is a moving hand tool. */
export const SHOW_DURATION = 56
export const SHOW_STEP = 1 / 60
export const chapters = [
  { time: 0, label: '第一幕 · 沙起月明' },
  { time: 18, label: '第二幕 · 江水成岸' },
  { time: 36, label: '第三幕 · 灯火归舟' },
] as const

type Point = { x: number; y: number }
export type StageHand = Point & { pose: 'pour' | 'palm' | 'finger' | 'edge'; rotation: number; down: boolean }
export interface ShowSample {
  chapter: number
  title: string
  instruction: string
  contacts: StageContact[]
  hand: StageHand | null
}
type Curve = (fraction: number) => Point
type Variation = number | ((fraction: number) => number)
interface Gesture {
  start: number
  end: number
  label: string
  tool: StageTool
  path: Curve
  radius: Variation
  strength: Variation
  spread?: number
  height?: number
  angle?: number
  aspect?: number
  pose?: StageHand['pose']
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
const lerp = (a: number, b: number, fraction: number) => a + (b - a) * fraction
const point = (x: number, y: number): Point => ({ x, y })
const valueAt = (value: Variation, fraction: number) => typeof value === 'number' ? value : value(fraction)

function curve(points: readonly Point[]): Curve {
  return fraction => {
    const p = clamp(fraction) * (points.length - 1)
    const index = Math.min(points.length - 2, Math.floor(p)), t = p - index
    const at = (offset: number) => points[Math.max(0, Math.min(points.length - 1, index + offset))]
    const a = at(-1), b = at(0), c = at(1), d = at(2)
    const axis = (key: 'x' | 'y') => 0.5 * (2 * b[key] + (-a[key] + c[key]) * t + (2 * a[key] - 5 * b[key] + 4 * c[key] - d[key]) * t * t + (-a[key] + 3 * b[key] - 3 * c[key] + d[key]) * t * t * t)
    return point(clamp(axis('x'), 0.015, 0.985), clamp(axis('y'), 0.015, 0.985))
  }
}
function cubic(a: Point, b: Point, c: Point, d: Point): Curve {
  return fraction => {
    const t = clamp(fraction), u = 1 - t
    return point(u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y)
  }
}
function line(from: Point, to: Point): Curve {
  return fraction => point(lerp(from.x, to.x, fraction), lerp(from.y, to.y, fraction))
}
const gestures: Gesture[] = []
function gesture(start: number, end: number, label: string, tool: StageTool, path: Curve,
  radius: Variation, strength: Variation, options: Partial<Pick<Gesture, 'spread' | 'height' | 'angle' | 'aspect' | 'pose'>> = {}) {
  gestures.push({ start, end, label, tool, path, radius, strength, ...options })
}
function fine(start: number, end: number, label: string, path: Curve, radius: Variation = 0.004, strength: Variation = 1.0) {
  gesture(start, end, label, 'pour', path, radius, strength, { spread: 0.10, height: 0.018 })
}

// First scene: empty glass receives several sweeping handfuls. The full frame
// is never initialized from a finished density image or from a shape mask.
gesture(0.8, 8.4, '一把一把散撒，铺出深浅不齐的底沙', 'pour', curve([
  point(0.07, 0.12), point(0.33, 0.16), point(0.65, 0.11), point(0.92, 0.18),
  point(0.78, 0.34), point(0.47, 0.29), point(0.16, 0.34), point(0.06, 0.47),
  point(0.31, 0.48), point(0.62, 0.44), point(0.92, 0.49), point(0.87, 0.64),
  point(0.59, 0.62), point(0.28, 0.67), point(0.08, 0.67), point(0.13, 0.83),
  point(0.44, 0.86), point(0.73, 0.82), point(0.94, 0.89),
]), fraction => 0.145 + Math.sin(fraction * 13) * 0.012, 2.8, { spread: 0.85, height: 0.34 })
gesture(8.65, 10.45, '侧掌擦开天光，让沙留在云边', 'edge', cubic(
  point(0.06, 0.13), point(0.22, 0.10), point(0.39, 0.19), point(0.51, 0.15)), 0.034, 0.025,
  { pose: 'edge', angle: -0.18, aspect: 0.85 })
gesture(10.65, 12.10, '掌面压下再轻轻揉开，擦出透亮的月', 'finger', () => point(0.765, 0.195),
  fraction => 0.016 + 0.036 * Math.sin(fraction * Math.PI * 0.5), 0.9, { pose: 'palm' })
gesture(12.45, 15.85, '以散沙叠出远山，薄处留成雾', 'pour', curve([
  point(0.035, 0.48), point(0.15, 0.40), point(0.25, 0.32), point(0.36, 0.43),
  point(0.47, 0.36), point(0.59, 0.49), point(0.73, 0.41), point(0.94, 0.51),
  point(0.80, 0.56), point(0.61, 0.55), point(0.43, 0.50), point(0.25, 0.49), point(0.05, 0.55),
]), fraction => 0.04 + Math.sin(fraction * Math.PI) * 0.016, 2.5, { spread: 0.57, height: 0.10 })
gesture(16.1, 17.65, '指腹沿山脊轻挑，留下雾光', 'finger', curve([
  point(0.075, 0.45), point(0.16, 0.392), point(0.25, 0.325), point(0.355, 0.438),
  point(0.465, 0.365), point(0.58, 0.483),
]), 0.006, 0.18)

// Second scene keeps that same sand. A darker bank, a broad palm-cleared
// river, and the willow slowly turn the moon study into a Jiangnan landscape.
gesture(18.25, 21.10, '再撒近岸，前后山色渐渐分开', 'pour', curve([
  point(0.025, 0.625), point(0.17, 0.57), point(0.28, 0.51), point(0.41, 0.60),
  point(0.56, 0.52), point(0.69, 0.61), point(0.81, 0.59), point(0.96, 0.66),
  point(0.76, 0.69), point(0.51, 0.65), point(0.27, 0.68), point(0.06, 0.70),
]), 0.042, 2.85, { spread: 0.44, height: 0.07 })
gesture(21.35, 23.00, '掌心抹开江水，把岸边沙推成柔暗的边', 'sweep', cubic(
  point(0.26, 0.725), point(0.47, 0.64), point(0.78, 0.79), point(0.97, 0.735)),
  0.075, 0.75, { pose: 'palm', angle: 0.10, aspect: 1.7 })
gesture(23.10, 24.45, '再向近处擦一道，留出舟行的水路', 'sweep', cubic(
  point(0.91, 0.875), point(0.71, 0.80), point(0.45, 0.92), point(0.24, 0.87)),
  0.072, 0.6, { pose: 'palm', angle: 0.05, aspect: 1.55 })
gesture(24.55, 25.05, '指尖轻带一线水光', 'finger', cubic(
  point(0.32, 0.73), point(0.44, 0.70), point(0.56, 0.75), point(0.68, 0.725)), 0.0035, 0.9)
gesture(25.15, 25.70, '水光从岸边延开', 'finger', cubic(
  point(0.69, 0.865), point(0.79, 0.845), point(0.86, 0.88), point(0.95, 0.87)), 0.003, 0.8)
fine(26.0, 28.0, '收拢指缝，撒出苍劲的柳干', curve([
  point(0.115, 0.98), point(0.14, 0.83), point(0.125, 0.69), point(0.168, 0.55), point(0.202, 0.365),
]), fraction => lerp(0.019, 0.008, fraction), 2.8)
fine(28.10, 29.0, '伸出第一枝，枝头向江上生长', cubic(
  point(0.164, 0.575), point(0.19, 0.36), point(0.29, 0.255), point(0.445, 0.325)),
  fraction => lerp(0.010, 0.0026, fraction), 1.7)
fine(29.10, 29.8, '另一枝探向画外', cubic(
  point(0.17, 0.53), point(0.175, 0.335), point(0.106, 0.255), point(0.025, 0.265)),
  fraction => lerp(0.009, 0.003, fraction), 1.6)
const willowStarts = [point(0.06, 0.275), point(0.115, 0.292), point(0.23, 0.305), point(0.274, 0.293), point(0.322, 0.285), point(0.370, 0.297), point(0.420, 0.315)]
const willowLengths = [0.29, 0.35, 0.38, 0.43, 0.39, 0.36, 0.30]
function willowPoint(index: number, fraction: number): Point {
  const start = willowStarts[index]
  return point(start.x + Math.sin(fraction * 3.2 + index * 0.4) * 0.021 * fraction + Math.sin(fraction * 29) * 0.0015,
    start.y + fraction * willowLengths[index])
}
for (const index of willowStarts.keys()) {
  fine(30.0 + index * 0.6, 30.53 + index * 0.6, '细沙沿指缝流下，垂柳一丝一丝生长',
    fraction => willowPoint(index, fraction), fraction => 0.0018 + Math.sin(fraction * Math.PI * 11) ** 4 * 0.0055 * (1 - fraction * 0.55), 1.25)
}
gesture(34.40, 35.25, '指甲轻挑树皮，苍干里透出一线光', 'finger', curve([
  point(0.12, 0.925), point(0.136, 0.822), point(0.127, 0.70), point(0.157, 0.595),
]), 0.0028, 0.75)
for (let index = 0; index < 4; index++) {
  const base = willowPoint(index * 2, 0.34 + index * 0.075), side = index % 2 ? -1 : 1
  fine(35.28 + index * 0.17, 35.41 + index * 0.17, '指缝轻点斜落，给柳丝添一片细叶', cubic(base,
    point(base.x + side * 0.008, base.y + 0.004), point(base.x + side * 0.017, base.y + 0.017), point(base.x + side * 0.016, base.y + 0.027)),
    fraction => 0.0012 + Math.sin(fraction * Math.PI) * 0.0035, 0.45)
}

// Third scene: a stone bridge grows out of the river bank. The empty arch is
// scraped from real deposited sand; rails, joints, boat and figures follow.
const bridgeTop = cubic(point(0.405, 0.735), point(0.51, 0.535), point(0.75, 0.52), point(0.915, 0.695))
const bridgeArch = cubic(point(0.46, 0.758), point(0.525, 0.613), point(0.737, 0.61), point(0.845, 0.754))
fine(36.3, 38.75, '沿掌缘落沙，拱桥从水岸上弯起', bridgeTop, 0.026, 2.9)
gesture(38.95, 40.5, '用指腹刮开桥洞，让月色穿过石拱', 'finger', bridgeArch, 0.021, 1.3)
fine(40.6, 41.10, '桥脚接住左岸', line(point(0.412, 0.716), point(0.39, 0.798)), 0.012, 2)
fine(41.18, 41.65, '另一桥脚落在江边', line(point(0.887, 0.681), point(0.915, 0.77)), 0.012, 2)
gesture(41.75, 42.65, '手指擦出桥面的细亮边', 'finger', fraction => {
  const p = bridgeTop(fraction)
  return point(p.x, p.y - 0.015)
}, 0.0032, 0.85)
for (let index = 0; index < 7; index++) {
  const u = 0.12 + index * 0.12, base = bridgeTop(u)
  fine(42.8 + index * 0.23, 42.99 + index * 0.23, '逐根捏撒桥栏，给石桥添上人的尺度',
    line(point(base.x, base.y - 0.066), point(base.x, base.y - 0.007)), 0.0039, 1.0)
}
fine(44.55, 45.6, '一笔牵起栏杆，桥上有了路', fraction => {
  const p = bridgeTop(lerp(0.10, 0.88, fraction))
  return point(p.x, p.y - 0.065)
}, 0.0036, 1.2)
gesture(45.8, 46.65, '指尖斜挑几道石缝', 'finger', curve([
  point(0.49, 0.679), point(0.512, 0.645), point(0.567, 0.617), point(0.561, 0.651),
  point(0.625, 0.641), point(0.628, 0.607), point(0.69, 0.615), point(0.688, 0.65),
  point(0.757, 0.668), point(0.765, 0.637), point(0.807, 0.680),
]), 0.0020, 0.55)
fine(46.9, 47.70, '细沙勾出一叶乌篷舟', cubic(
  point(0.47, 0.84), point(0.51, 0.888), point(0.61, 0.897), point(0.675, 0.837)),
  fraction => 0.007 + Math.sin(fraction * Math.PI) * 0.010, 1.8)
fine(47.85, 48.60, '舟上搭起弯弯的篷', cubic(
  point(0.519, 0.846), point(0.53, 0.754), point(0.59, 0.752), point(0.607, 0.853)), 0.008, 1.7)
gesture(48.7, 49.05, '指尖擦出船沿的光', 'finger', line(
  point(0.485, 0.845), point(0.645, 0.857)), 0.0025, 0.9)
fine(49.15, 49.47, '船尾站起撑篙人', curve([
  point(0.641, 0.844), point(0.631, 0.801), point(0.633, 0.765),
]), 0.0045, 1.25)
fine(49.50, 49.80, '添一粒圆沙作为人影的头', fraction => point(
  0.633 + Math.sin(fraction * Math.PI * 2) * 0.0018,
  0.752 + Math.cos(fraction * Math.PI * 2) * 0.003), 0.007, 0.62)
fine(49.85, 50.30, '竹篙斜探入水', line(point(0.626, 0.786), point(0.691, 0.928)), 0.0021, 0.9)
gesture(50.4, 50.85, '舟后的水光轻轻荡开', 'finger', cubic(
  point(0.48, 0.91), point(0.535, 0.89), point(0.595, 0.925), point(0.635, 0.910)), 0.0025, 0.65)
gesture(51.0, 51.55, '最后一线波纹，月下江南留在沙上', 'finger', cubic(
  point(0.68, 0.955), point(0.76, 0.94), point(0.845, 0.965), point(0.91, 0.95)), 0.0022, 0.7)

const chapterTitles = ['沙起月明', '江水成岸', '灯火归舟']
const pauses = [
  { start: 0, end: 0.8, label: '掌心抓沙，空灯箱即将成为一幅画', position: point(0.06, 0.93) },
  { start: 17.65, end: 18.25, label: '月与远山留在画台，换一把沙继续生长', position: point(0.06, 0.94) },
  { start: 35.25, end: 36.3, label: '不换画面，在这片江水上接着画桥与舟', position: point(0.94, 0.96) },
]

/** Sample after advancing one SHOW_STEP. Seeking must replay the same steps. */
export function sampleShow(time: number): ShowSample {
  const t = clamp(Number.isFinite(time) ? time : 0, 0, SHOW_DURATION)
  const chapter = t < chapters[1].time ? 0 : t < chapters[2].time ? 1 : 2
  const active = gestures.find(item => t >= item.start && t < item.end)
  if (!active) {
    const pause = pauses.find(item => t >= item.start && t < item.end)
    const complete = t >= 51.55
    return { chapter, title: chapterTitles[chapter],
      instruction: complete ? '月、远山、垂柳、石桥与归舟。手离开，沙画留在灯箱上。' : pause?.label ?? '抬手，看一看沙的疏密，再接下一笔。',
      contacts: [], hand: pause ? { ...pause.position, pose: 'pour', rotation: -0.22, down: false } : null }
  }
  const fraction = clamp((t - active.start) / (active.end - active.start))
  const previous = clamp((t - SHOW_STEP - active.start) / (active.end - active.start))
  const to = active.path(fraction), from = active.path(previous)
  const radius = valueAt(active.radius, fraction), strength = valueAt(active.strength, fraction)
  const contact: StageContact = {
    tool: active.tool, from, to, radius, strength,
    ...(active.spread === undefined ? {} : { spread: active.spread }),
    ...(active.height === undefined ? {} : { height: active.height }),
    ...(active.angle === undefined ? {} : { angle: active.angle }),
    ...(active.aspect === undefined ? {} : { aspect: active.aspect }),
  }
  const pose = active.pose ?? (active.tool === 'sweep' || active.tool === 'rub' ? 'palm' : active.tool)
  const rotation = active.angle ?? (Math.atan2(to.y - from.y, to.x - from.x) * 0.16 - 0.25)
  return { chapter, title: chapterTitles[chapter], instruction: active.label, contacts: [contact],
    hand: { ...to, pose, rotation, down: true } }
}
