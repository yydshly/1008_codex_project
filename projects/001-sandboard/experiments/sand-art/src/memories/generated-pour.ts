import { StageMaterial, type StagePoint } from '../stage/material'
import { clampUnit } from './generated-hand'

export const POUR_STEP=1/60, POUR_TICKS=600
export interface PourGesture {
  release:StagePoint; opening:number; lift:number; angle:number; flow:number; visible:boolean; phase:string; spread?:number
}
const smooth=(n:number)=>{const t=clampUnit(n);return t*t*(3-2*t)}
const hash=(n:number)=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v)}
function pulse(t:number){const n=Math.floor(t),p=smooth(t-n);return hash(n)*(1-p)+hash(n+1)*p}
/** 指缝开度决定流量；慢聚团与短暂堵塞使细流出现连续的疏密变化。 */
export function apertureFlow(opening:number,time:number,remaining=1){
  const aperture=clampUnit((opening-.09)/.91)
  return aperture*aperture*1.25*(.48+.72*pulse(time*5.3))*(.68+.32*pulse(time*19))*smooth(remaining/.18)
}
export function pourGesture(tick:number):PourGesture {
  const t=Math.max(0,Math.min(POUR_TICKS,tick))*POUR_STEP,p=clampUnit((t-1.4)/5.4)
  const arrival=smooth(t/1.4),exit=smooth((t-7.35)/1.5)
  const breathing=Math.sin(p*Math.PI)
  const releasing=t>=1.4&&t<6.8
  const fine=smooth((t-1.4)/.55)*(1-smooth((t-3.13)/.27))
  const wide=smooth((t-3.65)/.55)*(1-smooth((t-6.15)/.65))
  const opening=releasing?fine*(.56+.065*pulse(t*3.7))+wide*(.84+.05*pulse(t*4.1)):0
  const flow=releasing?apertureFlow(opening,t,1-p*.86):0
  return {
    release:{x:.32+.29*p+.004*Math.sin(p*14),y:(.35-.10*breathing)*arrival+1.16*(1-arrival)+exit*.84},
    opening:clampUnit(opening),lift:.14+smooth((t-3.4)/.7)*.32,angle:-.11+.22*p+.008*Math.sin(t*2.3),
    flow:Math.max(0,flow),spread:.14+smooth((t-3.4)/.7)*.66,visible:t<8.9,
    phase:t<1.4?'捏沙入场':t<1.95?'捻指松沙':t<3.13?'低手位 · 细流':t<3.65?'收指，抬手':t<6.15?'抬高手 · 散撒':t<6.8?'余沙落下':t<8.9?'收手离台':'沙粒落定',
  }
}
/** 与屏幕上同一释放点共用俯拍投影。供沙只走 StageMaterial，未写入目标画。 */
export function landingPoint(gesture:PourGesture,aspect=1.5):StagePoint {
  return {x:gesture.release.x,y:gesture.release.y+(.013+gesture.lift*.09)*aspect*.55}
}
export class GeneratedPour {
  readonly material:StageMaterial
  tick=0
  private previous:StagePoint|undefined
  constructor(width=640,height=426){this.material=new StageMaterial(width,height,0x18bc32,9000)}
  get gesture(){return pourGesture(this.tick)}
  reset(){this.material.clear();this.tick=0;this.previous=undefined}
  step(){
    if(this.tick>=POUR_TICKS)return
    this.emit(pourGesture(this.tick));this.tick++
  }
  emit(gesture:PourGesture,multiplier=1){
    const point=landingPoint(gesture,this.material.width/this.material.height)
    const from=this.previous?landingPoint({...gesture,release:this.previous},this.material.width/this.material.height):point
    this.material.step(POUR_STEP,gesture.flow>0?[{tool:'pour',from,to:point,radius:.0014+gesture.opening*.0018,strength:gesture.flow*multiplier,spread:gesture.spread??.3,height:gesture.lift,cluster:.55,ballistic:true}]:[])
    this.previous=gesture.flow>0?{...gesture.release}:undefined
  }
  seek(tick:number){this.reset();const target=Math.round(Math.max(0,Math.min(POUR_TICKS,tick)));while(this.tick<target)this.step()}
}

export type PourStyle='fine'|'scatter'
/** 可测试的手动动作状态：输入只设目标，手有惯性，一次按住有有限供沙预算。 */
export class ManualPour {
  private target:StagePoint={x:.4,y:.36}
  private point:StagePoint={...this.target}
  private velocity:StagePoint={x:0,y:0}
  private opening=0
  private angle=0
  private clock=0
  private budget=2.1
  private height=.18
  private desiredLift=.18
  style:PourStyle='fine'
  get remaining(){return clampUnit(this.budget/2.1)}
  get moving(){return Math.hypot(this.target.x-this.point.x,this.target.y-this.point.y)>.0002||Math.hypot(this.velocity.x,this.velocity.y)>.001||this.opening>.0005||Math.abs(this.desiredLift-this.height)>.0005||Math.abs(this.angle)>.0005}
  grab(){this.budget=2.1}
  targetAt(point:StagePoint){if(!Number.isFinite(point.x)||!Number.isFinite(point.y))return;this.target={x:Math.max(.12,Math.min(.76,point.x)),y:Math.max(.23,Math.min(.57,point.y))}}
  setStyle(style:PourStyle){this.style=style;this.desiredLift=style==='fine'?.18:.48}
  setLift(lift:number){if(Number.isFinite(lift))this.desiredLift=Math.max(.08,Math.min(.65,lift))}
  step(down:boolean,lift?:number):PourGesture {
    this.clock+=POUR_STEP
    for(const axis of ['x','y'] as const){
      this.velocity[axis]+=((this.target[axis]-this.point[axis])*90-this.velocity[axis]*19)*POUR_STEP
      this.velocity[axis]=Math.max(-.65,Math.min(.65,this.velocity[axis]))
      this.point[axis]+=this.velocity[axis]*POUR_STEP
    }
    this.opening+=((down&&this.budget>0?(this.style==='fine'?.60:.90):0)-this.opening)*.16
    if(!down&&this.opening<.0005)this.opening=0
    this.height+=((lift??this.desiredLift)-this.height)*.09
    const targetAngle=Math.max(-.22,Math.min(.22,this.velocity.x*.4))
    this.angle+=(targetAngle-this.angle)*.10
    const flow=down?Math.min(this.budget/POUR_STEP,apertureFlow(this.opening,this.clock,Math.max(.08,this.remaining))):0
    this.budget=Math.max(0,this.budget-flow*POUR_STEP)
    return {release:{...this.point},opening:this.opening,lift:this.height,angle:this.angle,flow,spread:this.style==='fine'?.16:.80,visible:true,
      phase:down?(this.budget===0?'这把沙已撒完，松手再抓一把':this.style==='fine'?'捻指细流':'抬手散撒'):'按住沙台，移动撒沙'}
  }
}
