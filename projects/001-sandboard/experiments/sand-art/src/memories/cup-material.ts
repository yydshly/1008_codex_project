import { StageMaterial, type StagePoint, type StageContact } from '../stage/material'
import { CUP_ACTIONS, CUP_DT, CUP_TICKS, CUP_STARTS, cupPhase, cupPoint } from './cup-score'

const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x))
/** 独立的台面拖拢：小步守恒平流，堆沙仍属于原密度，不是光效或粒子遮罩。 */
export class GroundGather {
  readonly sand:StageMaterial
  private readonly transfer:Float64Array
  private readonly touched:number[]=[]
  constructor(sand:StageMaterial) {this.sand=sand;this.transfer=new Float64Array(sand.density.length)}
  push(from:StagePoint,to:StagePoint,radius:number,strength:number) {
    if(![from.x,from.y,to.x,to.y,radius,strength].every(Number.isFinite)||radius<=0||strength<=0)return
    const {width:w,height:h,density}=this.sand
    const dx=(to.x-from.x)*w,dy=(to.y-from.y)*h,length=Math.hypot(dx,dy)
    if(length<1e-8)return
    const cx=to.x*w,cy=to.y*h,r=radius*w,nx=dx/length,ny=dy/length
    const travel=Math.min(3.5,length*2.4),sideX=-ny,sideY=nx
    const add=(x:number,y:number,mass:number)=>{
      // 闭合台边；每次迁移只到相邻数个网格，不将整笔的沙瞬移到末端。
      x=clamp(x,0,w-1);y=clamp(y,0,h-1)
      const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy
      for(const [tx,ty,weight] of [[ix,iy,(1-fx)*(1-fy)],[Math.min(w-1,ix+1),iy,fx*(1-fy)],
        [ix,Math.min(h-1,iy+1),(1-fx)*fy],[Math.min(w-1,ix+1),Math.min(h-1,iy+1),fx*fy]]){
        if(weight<=0)continue
        const index=ty*w+tx
        if(this.transfer[index]===0)this.touched.push(index)
        this.transfer[index]+=mass*weight
      }
    }
    for(let y=Math.max(0,Math.floor(cy-r));y<=Math.min(h-1,Math.ceil(cy+r));y++)
      for(let x=Math.max(0,Math.floor(cx-r));x<=Math.min(w-1,Math.ceil(cx+r));x++){
        const dist=Math.hypot(x-cx,y-cy)/r
        if(dist>=1)continue
        const index=y*w+x,amount=density[index]
        if(amount<1e-10)continue
        const weight=(1-dist*dist)**2,moved=amount*clamp(strength*weight*.72,0,.94)
        density[index]-=moved
        const side=(x-cx)*sideX+(y-cy)*sideY
        // 少量向掌缘中部聚拢，前缘自然变厚；无需读取任何图形边界。
        const converge=clamp(side*.06,-.45,.45)
        const shiftX=nx*travel-sideX*converge,shiftY=ny*travel-sideY*converge
        const limit=Math.min(1,3.5/Math.hypot(shiftX,shiftY))
        add(x+shiftX*limit,y+shiftY*limit,moved)
      }
    for(const index of this.touched){density[index]+=this.transfer[index];this.transfer[index]=0}
    this.touched.length=0
  }
  /** 只松落接触附近过陡的坡面；闭合边界与成对移沙保持质量。 */
  settle(point:StagePoint,radius:number,phase:number){
    const {width:w,height:h,density:d}=this.sand,r=radius*w*2.2
    const x0=Math.max(0,Math.floor(point.x*w-r)),x1=Math.min(w-1,Math.ceil(point.x*w+r))
    const y0=Math.max(0,Math.floor(point.y*h-r)),y1=Math.min(h-1,Math.ceil(point.y*h+r))
    // 沿用台面的米制宽深与每单位密度 .8mm 厚度；静止摩擦近似 .62。
    const limitX=.62*(.58/w)/.0008,limitY=.62*(.4/h)/.0008
    const transfer=(a:number,b:number,limit:number)=>{
      const difference=d[a]-d[b],excess=Math.abs(difference)-limit
      if(excess<=.0001)return
      const flow=excess*.22*Math.sign(difference);d[a]-=flow;d[b]+=flow
    }
    for(let pass=0;pass<4;pass++){
      if((phase+pass)%2===0){
        for(let y=y0;y<=y1;y++)for(let x=x0;x<x1;x++)transfer(y*w+x,y*w+x+1,limitX)
        for(let y=y0;y<y1;y++)for(let x=x0;x<=x1;x++)transfer(y*w+x,(y+1)*w+x,limitY)
      }else{
        for(let y=y1;y>=y0;y--)for(let x=x1;x>x0;x--)transfer(y*w+x,y*w+x-1,limitX)
        for(let y=y1;y>y0;y--)for(let x=x1;x>=x0;x--)transfer(y*w+x,(y-1)*w+x,limitY)
      }
    }
  }
}

export class CupStudy {
  readonly sand:StageMaterial
  private readonly gather:GroundGather
  tick=0
  point:StagePoint={x:.5,y:.5}
  state:'falling'|'pushing'|'holding'|'lifting'|'settling'='settling'
  constructor(width=768,height=512) {
    this.sand=new StageMaterial(width,height,0x31c0ffee,18000)
    this.gather=new GroundGather(this.sand)
  }
  get phase(){return cupPhase(this.tick)}
  reset(){this.sand.clear();this.tick=0;this.point={x:.5,y:.5};this.state='settling'}
  step(){
    if(this.tick>=CUP_TICKS)return
    const phase=cupPhase(this.tick),action=CUP_ACTIONS[phase]
    this.state='settling'
    const contacts:StageContact[]=[]
    if(action){
      const local=(this.tick-CUP_STARTS[phase])*CUP_DT
      const active=action.seconds-(action.tool==='gather'?1:.3)
      const t=clamp(local/active,0,1),prev=cupPoint(action,clamp((local-CUP_DT)/active,0,1))
      this.point=cupPoint(action,t)
      if(action.tool==='pour'&&local<active){
        const envelope=.16+.84*Math.sin(Math.PI*t)**.65
        const pulse=1+.13*Math.sin(local*7.3)+.07*Math.sin(local*17.1)
        const strength=action.strength*envelope*pulse
        contacts.push({tool:'pour',from:prev,to:this.point,radius:action.radius*(.88+.12*Math.sin(Math.PI*t)),strength,
          spread:action.spread,ballistic:true,continuousEmission:true,emissionHeight:action.height,
          velocityInheritance:.035,cluster:.35})
        this.state='falling'
      }else if(action.tool==='gather'){
        if(local<active){this.gather.push(prev,this.point,action.radius,action.strength*(.35+.65*Math.sin(Math.PI*t)));this.state='pushing'}
        else if(local<active+.25){this.state='holding'}
        else if(local<active+.72){
          const last=action.path.at(-1)!,before=action.path.at(-2)!
          const dx=last.x-before.x,dy=last.y-before.y,length=Math.hypot(dx,dy)||1
          const tip={x:last.x+dx/length*action.radius*.48,y:last.y+dy/length*action.radius*.48}
          this.sand.collect(last,tip,action.radius*1.55,.30,CUP_DT,.06,true)
          this.state='lifting'
        }
        this.gather.settle(this.point,action.radius,this.tick)
      }
    }
    this.sand.step(CUP_DT,contacts)
    this.tick++
  }
}
