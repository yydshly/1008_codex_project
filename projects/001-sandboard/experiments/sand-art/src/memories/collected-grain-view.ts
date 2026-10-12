import type {StageGrain} from '../stage/material'

const hash=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)}
/** 收沙包是格点沙量的显示样本。按出生格点作稳定偏移，避免整齐点阵，不能每帧重抽随机数。 */
export function collectedGrainView(grain:StageGrain,width:number,height:number){
  const age=Math.max(0,(grain.z-.0004)/Math.max(1e-8,grain.vz))
  const x=Math.round((grain.x-grain.vx*age)*width),y=Math.round((grain.y-grain.vy*age)*height)
  const seed=hash(x,y)
  return {x:grain.x+(seed-.5)*1.4/width,y:grain.y+(hash(y+17,x+83)-.5)*1.4/height,seed}
}
