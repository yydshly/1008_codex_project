import { decodePortraitPlan,StructuredPainting,type PortraitPlan } from './structured-painting'
import type { StageMaterialSnapshot } from '../stage/material'

export interface PhotoPerformance {plan:PortraitPlan;tick:number}
export function restorePerformance(value:PhotoPerformance,snapshot:StageMaterialSnapshot){
  if(!value||typeof value!=='object'||!Number.isInteger(value.tick))throw new Error('收藏演出游标不正确。')
  const plan=decodePortraitPlan(JSON.stringify(value.plan)),painting=new StructuredPainting(plan)
  painting.resumeAt(value.tick,snapshot)
  return painting
}
