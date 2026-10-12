import type { StagePoint } from '../stage/material'

/** 原创手法谱：只含几何路径与材料力度，不接收照片、目标灰度或残差。 */
export interface CupAction {
  name: string
  note: string
  tool: 'pour' | 'gather'
  seconds: number
  path: StagePoint[]
  radius: number
  strength: number
  spread?: number
  height?: number
}
const p = (x: number, y: number): StagePoint => ({ x, y })
function bezier(a: StagePoint, b: StagePoint, c: StagePoint, d: StagePoint) {
  return Array.from({ length: 65 }, (_, i) => {
    const t = i / 64, u = 1 - t
    return p(u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,
      u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y)
  })
}
function arc(cx: number, cy: number, rx: number, ry: number, start: number, end: number) {
  return Array.from({ length: 97 }, (_, i) => {
    const t = start + (end-start)*i/96
    return p(cx+Math.cos(t)*rx, cy+Math.sin(t)*ry)
  })
}
export const CUP_ACTIONS: readonly CupAction[] = [
  {name:'薄撒台面',note:'抬高散撒，留下疏密不齐的薄灰与桌面阴影。',tool:'pour',seconds:3,
    path:bezier(p(.24,.52),p(.37,.77),p(.68,.77),p(.79,.52)),radius:.20,strength:.48,spread:.52,height:.055},
  {name:'聚沙成杯身',note:'一笔弯过杯底，边走边放沙；杯身由实际堆积形成。',tool:'pour',seconds:4,
    path:bezier(p(.38,.43),p(.35,.78),p(.68,.78),p(.62,.43)),radius:.108,strength:1.10,spread:.20,height:.022},
  {name:'推拢杯身亮面',note:'贴台拖拢已有沙，先形成前缘沙堆，停驻后再拾起。',tool:'gather',seconds:3.3,
    path:bezier(p(.415,.46),p(.40,.54),p(.45,.61),p(.50,.625)),radius:.042,strength:1.6},
  {name:'细撒杯口',note:'沿椭圆连续细撒，供沙在起笔与收笔时减弱。',tool:'pour',seconds:2.4,
    path:arc(.50,.422,.128,.047,Math.PI,Math.PI*3),radius:.013,strength:.14,spread:.08,height:.016},
  {name:'收出杯内光',note:'在杯口内短弧推沙，移动结束后才收走聚拢的沙。',tool:'gather',seconds:3,
    path:bezier(p(.416,.421),p(.455,.444),p(.535,.449),p(.57,.429)),radius:.015,strength:1.7},
  {name:'弯撒杯把',note:'从杯口下方弯到杯身，用连续弧线留出把手的空心。',tool:'pour',seconds:2.4,
    path:bezier(p(.625,.458),p(.80,.39),p(.81,.64),p(.615,.59)),radius:.017,strength:.20,spread:.07,height:.019},
  {name:'添深右侧',note:'只补右侧与杯底暗部，让亮面与厚沙形成体积差。',tool:'pour',seconds:2.1,
    path:bezier(p(.604,.48),p(.612,.58),p(.578,.655),p(.50,.658)),radius:.036,strength:.40,spread:.14,height:.018},
  {name:'落沙成碟',note:'低位细流绕过碟沿，停沙时仍能看到余粒落下。',tool:'pour',seconds:2.7,
    path:arc(.51,.715,.218,.054,Math.PI*.9,Math.PI*2.9),radius:.017,strength:.19,spread:.11,height:.021},
  {name:'收亮碟沿',note:'沿前沿推拢薄沙，沙堆到达右端，停驻并分次带走。',tool:'gather',seconds:3.6,
    path:arc(.51,.708,.193,.041,Math.PI*.92,Math.PI*.08),radius:.017,strength:1.55},
]
export const CUP_DT = 1/60
export const CUP_TICKS = 1800
export const CUP_STARTS = CUP_ACTIONS.reduce<number[]>((a, action) => [...a, a.at(-1)!+Math.round(action.seconds*60)], [0])

/** 按弧长推进，曲线稀密不决定移动速度。 */
export function cupPoint(action: CupAction, progress: number): StagePoint {
  const distances=[0]
  for(let i=1;i<action.path.length;i++) distances.push(distances[i-1]+Math.hypot(action.path[i].x-action.path[i-1].x,(action.path[i].y-action.path[i-1].y)*2/3))
  const target=Math.max(0,Math.min(1,progress))*distances.at(-1)!
  let i=1
  while(i<distances.length-1&&distances[i]<target)i++
  const t=(target-distances[i-1])/Math.max(1e-12,distances[i]-distances[i-1]),a=action.path[i-1],b=action.path[i]
  return p(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)
}
export function cupPhase(tick: number) {
  return CUP_STARTS.findIndex((start,i)=>i<CUP_ACTIONS.length&&tick>=start&&tick<CUP_STARTS[i+1])
}
