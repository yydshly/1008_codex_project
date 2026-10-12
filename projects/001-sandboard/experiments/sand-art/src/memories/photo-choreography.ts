import type { PortraitPlan, StructuredStroke } from './structured-painting'

export type PhotoArrangement = 'performance' | 'sculpt' | 'gesture' | 'coherent' | 'original'

/** 新谱章长不同，用章节内进度对照；旧两谱仍映射到完全相同的时间步。 */
export function mapPhotoProgress(from:PortraitPlan,to:PortraitPlan,tick:number){
  if(tick>=from.totalTicks)return to.totalTicks
  let phase=0;while(phase<5&&tick>=from.phaseStarts[phase+1])phase++
  const start=from.phaseStarts[phase],end=from.phaseStarts[phase+1]??from.totalTicks
  const next=to.phaseStarts[phase+1]??to.totalTicks
  return Math.round(to.phaseStarts[phase]+(next-to.phaseStarts[phase])*Math.max(0,Math.min(1,(tick-start)/Math.max(1,end-start))))
}
type Bounds = readonly [number, number, number, number]

function bounds(stroke: StructuredStroke, width: number, height: number): Bounds {
  // 高斯落沙有尾部；这是保守的局部影响估计，不能据此声称材料逐值不变。
  const margin = stroke.sigma * 5 + 4
  const xs = stroke.path.map(p => p.x * width), ys = stroke.path.map(p => p.y * height)
  return [Math.min(...xs) - margin, Math.min(...ys) - margin, Math.max(...xs) + margin, Math.max(...ys) + margin]
}
function overlaps(a: Bounds, b: Bounds) { return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3] }
export function strokeTravel(strokes: readonly StructuredStroke[], width = 768, height = 512) {
  let distance = 0
  for (let i = 1; i < strokes.length; i++) {
    const a = strokes[i - 1].path.at(-1)!, b = strokes[i].path[0]
    distance += Math.hypot((b.x - a.x) * width, (b.y - a.y) * height)
  }
  return distance
}

/** 只编排最后的细笔段；重叠动作保留先后关系，其余优先延续当前局部。 */
export function choreographPhoto(plan: PortraitPlan) {
  const width = plan.width ?? 768, height = plan.height ?? 512
  // 原有大面塑形、揉沙与各章时长都保留。没有细笔落定段的工程直接沿用。
  const first = plan.strokes.findIndex(s => s.phase === 4 && s.finish === 'settle')
  if (first < 0 || plan.strokes.slice(first).some(s => s.phase !== 4 || s.finish !== 'settle')) {
    return { plan, order: plan.strokes.map((_, i) => i), before: 0, after: 0, moved: 0 }
  }
  const fine = plan.strokes.slice(first), boxes = fine.map(s => bounds(s, width, height))
  const successors: number[][] = fine.map(() => []), incoming = new Uint16Array(fine.length)
  for (let i = 0; i < fine.length; i++) for (let j = i + 1; j < fine.length; j++) {
    if (overlaps(boxes[i], boxes[j])) { successors[i].push(j); incoming[j]++ }
  }
  const ready = new Set<number>()
  incoming.forEach((count, i) => { if (!count) ready.add(i) })
  const order = plan.strokes.slice(0, first).map((_, i) => i)
  let previous = plan.strokes[first - 1]
  while (ready.size) {
    let best = -1, cost = Infinity
    for (const index of ready) {
      const stroke = fine[index], start = stroke.path[0], end = previous?.path.at(-1) ?? start
      const travel = Math.hypot((start.x - end.x) * width, (start.y - end.y) * height)
      // 保持脸、手或杯子的一组动作，仍允许必须先做的相邻动作跨区。
      const score = travel + (previous && previous.region !== stroke.region ? 24 : 0)
      if (score < cost || score === cost && index < best) { best = index; cost = score }
    }
    ready.delete(best); order.push(first + best); previous = fine[best]
    for (const next of successors[best]) if (--incoming[next] === 0) ready.add(next)
  }
  const strokes = order.map(i => plan.strokes[i])
  const before = strokeTravel(plan.strokes.slice(first), width, height), after = strokeTravel(strokes.slice(first), width, height)
  // 以真实空移距离作最低门槛；原谱已经更连贯时不采用新排序。
  if (after >= before) return { plan, order: plan.strokes.map((_, i) => i), before, after: before, moved: 0 }
  return { plan: { ...plan, strokes }, order, before, after, moved: order.filter((index, i) => index !== i).length }
}
