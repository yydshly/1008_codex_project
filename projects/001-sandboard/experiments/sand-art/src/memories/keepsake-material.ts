import {StageMaterial,type StageContact,type StagePoint} from '../stage/material'
import {GroundGather} from './cup-material'
import {cupPoint} from './cup-score'
import {FILM_DT,type KeepsakePlan} from './keepsake-model'

/** 独立产品演出，复用 v31 守恒推拢；不修改原版材料和九动作小样。 */
export class KeepsakeStudy {
  readonly sand:StageMaterial
  private readonly gather:GroundGather
  readonly plan:KeepsakePlan
  tick=0
  point:StagePoint={x:.5,y:.5}
  state:'falling'|'pushing'|'holding'|'lifting'|'settling'='settling'
  constructor(plan:KeepsakePlan,width=768,height=512) {
    this.plan=plan;this.sand=new StageMaterial(width,height,0x32c0ffee,18000);this.gather=new GroundGather(this.sand)
  }
  get phase(){return this.plan.starts.findIndex((v,i)=>i<this.plan.actions.length&&this.tick>=v&&this.tick<this.plan.starts[i+1])}
  reset(){this.sand.clear();this.tick=0;this.point={x:.5,y:.5};this.state='settling'}
  step(){
    if(this.tick>=this.plan.ticks)return
    const phase=this.phase,action=this.plan.actions[phase],contacts:StageContact[]=[]
    this.state='settling'
    if(action){
      const local=(this.tick-this.plan.starts[phase])*FILM_DT,active=action.seconds-(action.tool==='gather'?1:.3)
      const t=Math.min(1,local/active),previous=cupPoint(action,Math.max(0,(local-FILM_DT)/active))
      this.point=cupPoint(action,t)
      if(action.tool==='pour'&&local<active){
        // 固定、低幅的自然摆动；连续供沙与力度起落，不做逐像素描摹。
        const drift=.0012*Math.sin(local*4.1+phase)*Math.sin(Math.PI*t)
        this.point={x:this.point.x+drift,y:this.point.y+drift*.42}
        const priorDrift=.0012*Math.sin((local-FILM_DT)*4.1+phase)*Math.sin(Math.PI*Math.max(0,(local-FILM_DT)/active))
        const from={x:previous.x+priorDrift,y:previous.y+priorDrift*.42}
        const strength=action.strength*(.16+.84*Math.sin(Math.PI*t)**.65)*(1+.13*Math.sin(local*7.3)+.07*Math.sin(local*17.1))
        contacts.push({tool:'pour',from,to:this.point,radius:action.radius*(.88+.12*Math.sin(Math.PI*t)),strength,
          spread:action.spread,ballistic:true,continuousEmission:true,emissionHeight:action.height,velocityInheritance:.035,cluster:.35})
        this.state='falling'
      }else if(action.tool==='gather'){
        if(local<active){this.gather.push(previous,this.point,action.radius,action.strength*(.35+.65*Math.sin(Math.PI*t)));this.state='pushing'}
        else if(local<active+.25)this.state='holding'
        else if(local<active+.72){
          const last=action.path.at(-1)!,before=action.path.at(-2)!,dx=last.x-before.x,dy=last.y-before.y,length=Math.hypot(dx,dy)||1
          const pickup=action.name==='收出杯内光'?1.15:1.55
          this.sand.collect(last,{x:last.x+dx/length*action.radius*.48,y:last.y+dy/length*action.radius*.48},action.radius*pickup,.30,FILM_DT,.06,true)
          this.state='lifting'
        }
        this.gather.settle(this.point,action.radius,this.tick)
      }
    }
    this.sand.step(FILM_DT,contacts);this.tick++
  }
}
