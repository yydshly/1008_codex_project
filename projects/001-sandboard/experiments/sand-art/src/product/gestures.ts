import { StageMaterial, type StageMaterialSnapshot, type StagePoint, type StageContact, type StageTool } from '../stage/material'
import type { StageHand } from '../stage/show'
import { PRODUCT_HEIGHT, PRODUCT_STEP, PRODUCT_WIDTH } from './planner'

export type Path = (t: number) => StagePoint
export type Value = number | ((t: number) => number)
export type GestureTool = StageTool | 'collect'
export interface Stroke {
  start: number; end: number; chapter: number; label: string; explanation: string
  tool: GestureTool; path: Path; radius: Value; amount: Value; spread: number; height: number; budget: number
  angle?: Value; aspect?: Value; cluster?: number
}
export interface GestureScore { id: string; title: string; description: string; chapters: readonly { tick: number; label: string }[]; strokes: readonly Stroke[]; totalTicks: number; seed?: number }
export interface GestureSnapshot { tick: number; active: number; remaining: number; material: StageMaterialSnapshot; scoreId?: string }
const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const value = (v: Value, t: number) => typeof v === 'number' ? v : v(t)
export const p = (x: number, y: number): StagePoint => ({ x, y })
export const line = (a: StagePoint, b: StagePoint): Path => t => p(mix(a.x, b.x, t), mix(a.y, b.y, t))
export const bezier = (a: StagePoint, b: StagePoint, c: StagePoint, d: StagePoint): Path => t => {
  const u = 1 - t
  return p(u ** 3 * a.x + 3 * u ** 2 * t * b.x + 3 * u * t ** 2 * c.x + t ** 3 * d.x,
    u ** 3 * a.y + 3 * u ** 2 * t * b.y + 3 * u * t ** 2 * c.y + t ** 3 * d.y)
}
export const curve = (points: readonly StagePoint[]): Path => t => {
  const at = clamp(t) * (points.length - 1), i = Math.min(points.length - 2, Math.floor(at)), f = at - i
  const point = (offset: number) => points[clamp(i + offset, 0, points.length - 1)]
  const a = point(-1), b = point(0), c = point(1), d = point(2)
  const axis = (key: 'x' | 'y') => .5 * (2 * b[key] + (-a[key] + c[key]) * f
    + (2 * a[key] - 5 * b[key] + 4 * c[key] - d[key]) * f * f + (-a[key] + 3 * b[key] - 3 * c[key] + d[key]) * f ** 3)
  return p(clamp(axis('x'), .005, .995), clamp(axis('y'), .005, .995))
}
const strokes: Stroke[] = []
let clock = 1.1, chapter = 0
export const gestureChapters: { tick: number; label: string }[] = []
function section(label: string) { chapter = gestureChapters.length; gestureChapters.push({ tick: Math.ceil(clock / PRODUCT_STEP), label }) }
function stroke(label: string, explanation: string, tool: GestureTool, path: Path, duration: number, radius: Value, amount: Value,
  spread = .12, height = .035) {
  let reserve = 0, previous = path(0)
  if (tool === 'pour') for (let i = 1; i <= 80; i++) {
    const t = i / 80, next = path(t), sigma = value(radius, t) * PRODUCT_WIDTH * (.2 + spread * .55)
    reserve += value(amount, t) * Math.sqrt(2 * Math.PI) * sigma * Math.hypot((next.x - previous.x) * PRODUCT_WIDTH, (next.y - previous.y) * PRODUCT_HEIGHT)
    previous = next
  }
  strokes.push({ start: clock, end: clock + duration, chapter, label, explanation, tool, path, radius, amount, spread, height,
    budget: Math.max(120, Math.ceil(reserve * 1.25 + 150)) })
  clock += duration + (tool === 'pour' ? .36 : .28)
}
function pour(label: string, path: Path, duration: number, radius: Value, amount: Value, explanation: string, spread = .12) {
  stroke(label, explanation, 'pour', path, duration, radius, amount, spread, spread > .5 ? .28 : .035)
}

// 原创手势脚本：按景物的结构作画，完全不读取目标图片或扫描像素。
section('天光与远岸')
pour('抓沙，薄撒一层天光', bezier(p(.08, .21), p(.29, .03), p(.58, .36), p(.96, .18)), 3.5, .18, .12,
  '手掌沿弧线放开，云气有厚有薄；中央留出水雾。', .95)
pour('反手添一带淡云', bezier(p(.92, .09), p(.64, .27), p(.44, .05), p(.21, .17)), 2.3, .12, .11,
  '这把沙只给天空添灰，不急着描轮廓。', .9)
pour('薄沙带出远岸', curve([p(.29, .46), p(.43, .405), p(.57, .46), p(.68, .40), p(.96, .43)]), 2.8,
  t => .044 + Math.sin(t * 9) * .012, t => .25 + Math.sin(t * 13) * .06,
  '远处用宽而薄的灰面，避免与近岸一样黑。', .8)
for (let i = 0; i < 5; i++) {
  const x = .39 + i * .092, y = .432 - Math.sin(i * 1.7) * .022
  pour('捏撒远处屋脊', curve([p(x - .035, y), p(x, y - .035 - i % 2 * .018), p(x + .036, y + .006)]), .55, .009, .48,
    '屋舍只留轻淡轮廓，大小和高低错开，退到水雾后面。', .45)
  pour('薄撒屋舍与岸影', line(p(x, y + .012), p(x + .025, y + .049)), .45, .022, .21,
    '薄灰连接屋脊与远岸，轮廓逐渐融进雾里。', .85)
}

section('近岸与水路')
pour('一把深沙压出近岸', curve([p(.015, .54), p(.077, .58), p(.14, .69), p(.255, .82), p(.35, .98)]), 3.7,
  t => .076 + .02 * Math.sin(t * 14), t => 1.25 + .18 * Math.sin(t * 11),
  '用不规则的大块暗部压住左下角，先建立空间。', .85)
pour('叠沙加深岸脚', curve([p(.03, .93), p(.08, .78), p(.15, .79), p(.19, .9), p(.30, .96)]), 2.6,
  t => .057 + .01 * Math.sin(t * 10), 1.1, '岸脚比岸边深，边缘散开，不铺成均匀色块。', .85)
stroke('掌侧推出河岸的亮边', '把已有沙推到岸边，水路从暗部旁边打开。', 'sweep',
  bezier(p(.20, .65), p(.17, .78), p(.30, .85), p(.43, .94)), 2.4, t => .015 + .012 * Math.sin(t * 8) ** 2, .015)
stroke('掌面推开江面', '沿江面的弧线推沙，让中央成为画面的呼吸空间。', 'sweep',
  bezier(p(.32, .66), p(.49, .58), p(.62, .75), p(.94, .68)), 2.7, t => .032 + .013 * Math.sin(t * 7) ** 2, .012)
stroke('再用掌侧整理水光', '第二道水光与第一道错开，保留柔灰而非擦成整齐横条。', 'sweep',
  bezier(p(.94, .86), p(.78, .78), p(.56, .91), p(.35, .86)), 2.3, .04, .011)

section('柳干与垂枝')
const trunk = curve([p(.09, .91), p(.061, .70), p(.069, .48), p(.119, .27), p(.174, .09), p(.218, .015)])
for (let i = 0; i < 3; i++) {
  const a = i / 3, b = (i + 1) / 3
  pour(i === 0 ? '收拢指缝，撒出苍劲柳干' : '接着柳干，向上生长', t => trunk(mix(a, b, t)), 2.7,
    t => mix(.09, .018, mix(a, b, t)), 2.1, '顺着树的生长方向落沙：下段粗重，向上收细，不用轮廓描边。', .20)
}
pour('粗枝探向画面上方', bezier(p(.085, .42), p(.087, .21), p(.22, .13), p(.46, .10)), 2.6,
  t => mix(.045, .005, t), 1.55, '先有枝的力量，再垂下细柳丝。')
pour('向画外分一枝', bezier(p(.09, .36), p(.06, .22), p(.04, .16), p(.009, .13)), 1.1,
  t => mix(.022, .006, t), 1.6, '短枝向画外延伸，让树超出画框。')
for (let i = 0; i < 4; i++) {
  const x = .16 + i * .079, y = .14 + Math.sin(i * 2.5) * .024
  pour('指间放松，撒出疏密叶影', curve([p(x - .035, y - .018), p(x + .009, y + .016), p(x + .051, y + .030), p(x + .037, y + .066)]),
    .8, t => .014 + .019 * Math.sin(t * 13) ** 2, t => .50 + .55 * Math.sin(t * 11) ** 2,
    '叶影先成松散的块，再用垂枝把这些块连起来。', .92)
}
const branches = [
  [.13, .15, .19, .45], [.18, .125, .245, .53], [.247, .115, .287, .47], [.29, .105, .347, .59], [.376, .104, .39, .46], [.422, .108, .465, .39],
]
for (const [i, [x, y, ex, ey]] of branches.entries()) {
  pour('指缝细流，一丝垂柳落下来', bezier(p(x, y), p(x + .027, y + .045), p(ex - .018, ey - .15), p(ex, ey)),
    1.15, t => .002 + .003 * Math.sin(Math.PI * t), .90, '这一笔从枝头连续落到枝梢，抬手后再换下一枝。')
  const leafCount = [3, 4, 2, 4, 2, 3][i]
  for (let leaf = 0; leaf < leafCount; leaf++) {
    const t = .24 + leaf * .51 / Math.max(1, leafCount - 1) + Math.sin(i * 3 + leaf) * .025
    const bx = mix(x, ex, t), by = mix(y, ey, t), side = (i + leaf) % 2 ? -1 : 1
    pour('轻捏一点，给柳枝添叶', bezier(p(bx, by), p(bx + side * .006, by + .016), p(bx + side * .021, by + .041), p(bx + side * .028, by + .063)),
      .35, u => .0015 + .006 * Math.sin(Math.PI * u), 1.1, '叶子沿枝生长，用收放的小动作留出疏密。', .22)
  }
}
stroke('指尖挑出树皮的光', '从深沙里移出一条细光，让树干有体积。', 'finger',
  curve([p(.078, .86), p(.060, .68), p(.071, .48), p(.109, .33)]), 2.1, .003, .07)

section('石桥与月色')
const bridge = bezier(p(.65, .55), p(.71, .39), p(.86, .39), p(.97, .52))
pour('沿弧线落沙，先塑石桥的体块', bridge, 2.8, t => .036 - .012 * Math.sin(t * Math.PI), 1.3,
  '先落一条有厚度的沙带，桥洞随后从这块沙里移出来。', .35)
stroke('指腹打开桥洞', '把拱形内部的沙移向两侧；看到亮底，才成为桥洞。', 'finger',
  bezier(p(.685, .55), p(.744, .445), p(.85, .446), p(.938, .546)), 2.4, .017, .13)
stroke('掌心收去桥洞底部的余沙', '收走底部杂沙，让江面的亮度通过桥洞。', 'collect',
  bezier(p(.691, .59), p(.749, .484), p(.851, .486), p(.934, .586)), 1.3, .028, .42)
pour('左桥脚落在岸边', line(p(.662, .533), p(.637, .58)), .65, .012, 1.05, '桥脚接住桥身，透光的洞口保持。')
pour('右桥脚落定', line(p(.953, .514), p(.98, .565)), .65, .011, 1.05, '两侧桥脚错开，保留远近关系。')
stroke('指尖带出桥面的亮边', '亮边顺着桥拱走，显示石桥的厚薄。', 'finger',
  t => { const q = bridge(t); return p(q.x, q.y - .012) }, 1.6, .002, .08)
for (let i = 0; i < 6; i++) {
  const q = bridge(.10 + i * .15)
  pour('捏撒一根桥栏', line(p(q.x, q.y - .045), p(q.x, q.y - .010)), .28, .0026, .8,
    '栏杆逐根添上，细节落在已有体块上。')
}
pour('细流牵起桥栏', t => { const q = bridge(mix(.08, .87, t)); return p(q.x, q.y - .045) }, 1.3, .002, .85,
  '沿桥面的弧度收拢栏杆，不加一层整齐网格。')
stroke('指腹揉开月光', '在天空薄沙中一点点移沙，让月色透出来。', 'finger',
  t => p(.645 + Math.sin(t * Math.PI * 4) * .003, .17 + Math.cos(t * Math.PI * 4) * .003), 1.4,
  t => .011 + .013 * Math.sin(Math.PI * t / 2), .4)

section('归舟与水纹')
pour('一把沙落成舟身', bezier(p(.69, .79), p(.75, .89), p(.86, .88), p(.91, .80)), 2.1,
  t => .008 + Math.sin(t * Math.PI) * .022, 1.8, '沿舟底的弧线放沙，中间厚，两端收尖。', .25)
pour('放低手掌，加厚船腹', bezier(p(.705, .804), p(.76, .833), p(.84, .828), p(.895, .81)), 1.6,
  t => .009 + Math.sin(t * Math.PI) * .037, 1.45, '船腹是一块厚沙，靠两端收细的沙量形成舟形。', .56)
pour('撒出乌篷的弯顶', bezier(p(.775, .81), p(.785, .64), p(.87, .66), p(.873, .812)), 1.9,
  t => .01 + Math.sin(t * Math.PI) * .012, 1.5, '篷顶从船身上生长，几条线随后给它体积。')
pour('向内添沙，乌篷成为暗面', bezier(p(.83, .716), p(.826, .746), p(.825, .774), p(.826, .81)), 1.3,
  t => .031 + .010 * Math.sin(t * Math.PI), 1.9, '在篷内添厚沙，亮线只在这块暗面里轻轻挑出。', .68)
for (let i = 0; i < 3; i++) {
  stroke('指尖挑亮篷上的弧线', '在深沙里刻出弯曲细光，让篷顶看出圆拱。', 'finger',
    bezier(p(.79 + i * .025, .79), p(.787 + i * .021, .723), p(.81 + i * .023, .715), p(.82 + i * .022, .795)), .55, .002, .085)
}
pour('撑篙人的衣身立起来', curve([p(.747, .794), p(.730, .757), p(.732, .691)]), 1.05,
  t => .016 - t * .004, 2.1, '先画背与衣身，让人的重心站在舟上。', .40)
pour('一撮沙塑出衣身的体积', bezier(p(.733, .721), p(.738, .75), p(.75, .772), p(.745, .795)), .8, .015, 1.8,
  '衣身有前后厚度，人物用深沙剪影承接近景。', .58)
pour('捏出斗笠', curve([p(.711, .692), p(.731, .671), p(.753, .694)]), .70,
  t => .006 + .005 * Math.sin(Math.PI * t), 1.8, '斗笠用一小撮沙捏成，人物保持剪影。', .4)
pour('斗笠下面添出头影', line(p(.733, .688), p(.733, .708)), .45, .010, 1.6, '头影接住斗笠和肩背，保持小而明确的重心。')
pour('肩手接向船篙', curve([p(.73, .714), p(.756, .731), p(.79, .699)]), .65, .0038, 1.35,
  '手臂与船篙连成有方向的动作。')
pour('细流放下一根船篙', line(p(.785, .65), p(.72, .91)), .95, .0018, 1.35, '这一笔连续牵出长篙，接近水面时抬手。')
stroke('指尖擦亮船沿', '舟身上的细光与江面连在一起。', 'finger', line(p(.711, .802), p(.888, .819)), 1.2, .0025, .10)
for (let i = 0; i < 6; i++) {
  const y = .855 + i * .018, x = .68 + Math.sin(i * 2.2) * .04, length = .11 - i * .008
  pour('轻带一段舟影水纹', bezier(p(x, y), p(x + length * .35, y - .003), p(x + length * .7, y + .006), p(x + length, y)),
    .4, .0035, .22, '水纹短长不一、断续出现，留住水面的亮。', .42)
}
stroke('掌侧轻收中央水雾', '最后整理留白，保留水岸与归舟；抬手留画。', 'collect',
  bezier(p(.40, .62), p(.49, .66), p(.58, .76), p(.67, .75)), 1.5, .029, .10)

export const GESTURE_TICKS = Math.ceil((clock + 1.2) / PRODUCT_STEP)
export const gestureStrokes: readonly Stroke[] = strokes
export const originalGestureScore: GestureScore = { id: 'boat', title: '烟雨归舟 · 原手势版', description: '保留 v10 完整归舟编排，便于对照线条与沙块的差别。', chapters: gestureChapters, strokes, totalTicks: GESTURE_TICKS }
export interface GestureSample { chapter: number; label: string; explanation: string; hand: StageHand | null; stroke: Stroke | null; index: number; fraction: number }
export function sampleGestures(tick: number, score: GestureScore = originalGestureScore): GestureSample {
  const strokes = score.strokes
  const seconds = clamp(Number.isFinite(tick) ? tick : 0, 0, score.totalTicks) * PRODUCT_STEP
  const index = strokes.findIndex(s => seconds >= s.start && seconds < s.end)
  if (index >= 0) {
    const s = strokes[index], fraction = (seconds - s.start) / (s.end - s.start), q = s.path(fraction)
    return { chapter: s.chapter, label: s.label, explanation: s.explanation, stroke: s, index, fraction,
      hand: { ...q, pose: s.tool === 'collect' || s.tool === 'sweep' || s.tool === 'rub' ? 'palm' : s.tool === 'pour' ? 'pour' : s.tool === 'edge' ? 'edge' : 'finger', rotation: s.angle === undefined ? -.15 : value(s.angle, fraction), down: true } }
  }
  const next = strokes.findIndex(s => s.start > seconds), previous = next > 0 ? strokes[next - 1] : strokes.at(-1)!
  if (next === -1) return { chapter: score.chapters.length - 1, label: '抬手，留住当前沙画', explanation: '这张沙台由连续手势留下。可以接管继续创作，或导出当前沙画。', stroke: null, index: -1, fraction: 0, hand: null }
  const following = strokes[next], start = next === 0 ? 0 : previous.end, t = clamp((seconds - start) / (following.start - start)), eased = t * t * (3 - 2 * t)
  const a = next === 0 ? p(.5, .985) : previous.path(1), b = following.path(0)
  return { chapter: following.chapter, label: next === 0 ? '抓一把沙，准备薄撒' : '抬手，移到下一笔', explanation: `接下来：${following.label}。抬手期间不在沙台上留下连线。`, stroke: null, index: next, fraction: 0,
    hand: { x: mix(a.x, b.x, eased), y: mix(a.y, b.y, eased), pose: following.tool === 'pour' ? 'pour' : 'palm', rotation: -.15, down: false } }
}

/** 独立手势演出：只执行接触路径，不读取位图、不进行像素误差扫描。 */
export class GesturePainting {
  readonly material: StageMaterial
  readonly totalTicks: number
  readonly score: GestureScore
  constructor(score: GestureScore = originalGestureScore) {
    this.score = score
    this.material = new StageMaterial(PRODUCT_WIDTH, PRODUCT_HEIGHT, score.seed ?? 0x7a10c9, 40000)
    this.totalTicks = score.totalTicks
  }
  tick = 0
  private active = -1
  private remaining = 0
  get sample() { return sampleGestures(this.tick, this.score) }
  get hand() { return this.sample.hand }
  get sandFraction() { return this.active >= 0 ? clamp(this.remaining / this.score.strokes[this.active].budget) : 1 }
  step() {
    if (this.tick >= this.totalTicks) return false
    const sample = sampleGestures(this.tick + 1, this.score), s = sample.stroke
    if (!s) this.material.step(PRODUCT_STEP, [])
    else {
      const duration = s.end - s.start, t = sample.fraction, from = s.path(Math.max(0, t - PRODUCT_STEP / duration)), to = s.path(t)
      if (this.active !== sample.index) { this.active = sample.index; this.remaining = s.budget }
      const radius = value(s.radius, t), amount = value(s.amount, t)
      if (s.tool === 'pour') {
        const sigma = Math.sqrt((radius * PRODUCT_WIDTH * (.2 + s.spread * .55)) ** 2 + 1)
        const travel = Math.hypot((to.x - from.x) * PRODUCT_WIDTH, (to.y - from.y) * PRODUCT_HEIGHT)
        const requested = amount * Math.sqrt(2 * Math.PI) * sigma * travel + amount * Math.PI * sigma ** 2 * PRODUCT_STEP / duration * .15
        const clock = this.material.elapsedTime + PRODUCT_STEP
        const flow = clamp(.8 + .24 * Math.sin(clock * 8.1 + to.x * 6) + .19 * Math.sin(clock * 3.37 + 1.1), .35, 1.3)
        const base = PRODUCT_WIDTH * PRODUCT_HEIGHT * .016 * PRODUCT_STEP * flow
        const mass = Math.min(requested, base * 3, this.remaining)
        this.material.step(PRODUCT_STEP, mass > 0 ? [{ tool: 'pour', from, to, radius, strength: mass / base, spread: s.spread, height: s.height,
          angle: s.angle === undefined ? undefined : value(s.angle, t), aspect: s.aspect === undefined ? undefined : value(s.aspect, t), cluster: s.cluster }] : [])
        this.remaining = Math.max(0, this.remaining - mass)
      } else if (s.tool === 'collect') { this.material.step(PRODUCT_STEP, []); this.material.collect(from, to, radius, amount, PRODUCT_STEP) }
      else {
        const contact: StageContact = { tool: s.tool, from, to, radius, strength: amount,
          angle: s.angle === undefined ? undefined : value(s.angle, t), aspect: s.aspect === undefined ? undefined : value(s.aspect, t) }
        this.material.step(PRODUCT_STEP, [contact])
      }
    }
    this.tick++; return true
  }
  read(): GestureSnapshot { return { tick: this.tick, active: this.active, remaining: this.remaining, material: this.material.read(), scoreId: this.score.id } }
  restore(state: GestureSnapshot) {
    if (!Number.isInteger(state.tick) || state.tick < 0 || state.tick > this.totalTicks || !Number.isInteger(state.active)
      || state.active < -1 || state.active >= this.score.strokes.length || !Number.isFinite(state.remaining) || state.remaining < 0
      || (state.scoreId ?? 'boat') !== this.score.id
      || state.active >= 0 && state.remaining > this.score.strokes[state.active].budget) throw new Error('手势演出状态不正确。')
    this.material.restore(state.material); this.tick = state.tick; this.active = state.active; this.remaining = state.remaining
  }
}
