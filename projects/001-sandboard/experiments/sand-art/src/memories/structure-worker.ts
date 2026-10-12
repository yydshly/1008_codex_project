import { planStructuredPortrait, type StructureOptions } from './structured-painting'
import type { StageMaterialSnapshot } from '../stage/material'

self.onmessage=async(event:MessageEvent<{target:StageMaterialSnapshot;options:StructureOptions}>)=>{
  try {
    const plan=await planStructuredPortrait(event.data.target,(fraction,phase)=>self.postMessage({kind:'progress',fraction,phase}),event.data.options)
    self.postMessage({kind:'ready',plan})
  }catch(error){self.postMessage({kind:'error',message:error instanceof Error?error.message:'结构规划失败。'})}
}
