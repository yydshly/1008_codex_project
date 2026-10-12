import { decodePortraitPlan, type PortraitPlan, type StructureOptions } from './structured-painting'
import type { StageMaterialSnapshot } from '../stage/material'

/** 后台校验照片笔触；取消只结束这个计算，不改变编辑器里的材料。 */
export function requestStructurePlan(target:StageMaterialSnapshot,options:StructureOptions,onProgress:(fraction:number,phase:number)=>void){
  const worker=new Worker(new URL('./structure-worker.ts',import.meta.url),{type:'module'})
  let cancel=()=>{},settled=false
  const promise=new Promise<PortraitPlan>((resolve,reject)=>{
    const end=(error?:Error,plan?:PortraitPlan)=>{if(settled)return;settled=true;worker.terminate();if(error)reject(error);else resolve(plan!)}
    cancel=()=>end(new DOMException('结构规划已取消。','AbortError'))
    worker.onmessage=event=>{
      if(settled)return
      const result=event.data
      if(result.kind==='progress'){onProgress(Math.max(0,Math.min(1,result.fraction)),Math.max(0,Math.min(5,result.phase??0)));return}
      if(result.kind==='ready'){try{end(undefined,decodePortraitPlan(JSON.stringify(result.plan)))}catch(error){end(error instanceof Error?error:new Error('动作数据不正确。'))}}
      else if(result.kind==='error')end(new Error(result.message))
    }
    worker.onerror=()=>end(new Error('后台规划失败，请重试或使用原曲线试验。'))
    worker.onmessageerror=()=>end(new Error('后台规划数据无法读取。'))
    try{worker.postMessage({target,options},[target.density.buffer])}catch(error){end(error instanceof Error?error:new Error('规划沙层无法传入后台。'))}
  })
  return {promise,cancel:()=>cancel()}
}
