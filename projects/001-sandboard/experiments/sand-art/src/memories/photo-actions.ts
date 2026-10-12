import type {PortraitPlan,StructuredStroke} from './structured-painting'
import {gestureLength} from './gesture-photo-plan'

const impact=(s:StructuredStroke)=>gestureLength(s)*Math.sqrt(s.budget)*Math.min(4,s.sigma)
/** 取实际谱中有较长轨迹、较大沙量的动作，不另造展示用成品。 */
export function photoActionWindow(plan:PortraitPlan,tool:'pour'|'collect',scope:'shape'|'fine'='shape'){
  const candidates=plan.strokes.map((s,index)=>({s,index})).filter(({s})=>s.tool===tool&&(scope==='fine'?s.phase===4&&s.sigma<2:s.phase===2||s.phase===3))
  candidates.sort((a,b)=>impact(b.s)-impact(a.s)||a.index-b.index)
  const chosen=candidates[0];if(!chosen)return undefined
  const start=plan.strokes.slice(0,chosen.index).reduce((n,s)=>n+s.ticks+10,0)
  return {start,end:start+chosen.s.ticks+10,phase:chosen.s.phase,focus:chosen.s.region==='face'?'face' as const:'hands' as const}
}
/** 每章各保留两次明显撒沙/收沙动作，以原速观看接触；其余仍执行每一步。 */
export function photoHeroWindows(plan:PortraitPlan){
  const starts:number[]=[];let tick=0
  for(const s of plan.strokes){starts.push(tick);tick+=s.ticks+10}
  return [2,3].flatMap(phase=>(['pour','collect'] as const).flatMap(tool=>plan.strokes.map((s,index)=>({s,index}))
    .filter(({s})=>s.phase===phase&&s.tool===tool).sort((a,b)=>impact(b.s)-impact(a.s)||a.index-b.index).slice(0,2)
    .map(({s,index})=>({start:starts[index],end:starts[index]+s.ticks+10}))))
}
