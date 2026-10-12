import {NaturalSand,type StageContact,type StagePoint} from './keepsake-natural-sand'
import {cupPoint} from './cup-score'
import {FILM_DT,type KeepsakePlan} from './keepsake-model'
import {naturalProgress} from './keepsake-natural-model'

const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
const grainHash=(x:number,y:number)=>{let n=Math.imul(x^Math.imul(y,374761393),668265263);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967296}

/** 掌缘的守恒推拢：保留细沙，粗糙边缘移沙，沙堆沿每个小步前进。 */
export class NaturalGather {
  readonly sand:NaturalSand
  private readonly delta:Float64Array
  private readonly touched:number[]=[]
  constructor(sand:NaturalSand){this.sand=sand;this.delta=new Float64Array(sand.density.length)}
  push(from:StagePoint,to:StagePoint,radius:number,strength:number){
    if(![from.x,from.y,to.x,to.y,radius,strength].every(Number.isFinite)||radius<=0||strength<=0)return
    const {width:w,height:h,density:d}=this.sand,dx=(to.x-from.x)*w,dy=(to.y-from.y)*h,length=Math.hypot(dx,dy)
    if(length<1e-8)return
    const nx=dx/length,ny=dy/length,sx=-ny,sy=nx,cx=to.x*w,cy=to.y*h,r=radius*w
    const add=(x:number,y:number,mass:number)=>{
      x=clamp(x,0,w-1);y=clamp(y,0,h-1)
      const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy
      for(const [px,py,weight] of [[ix,iy,(1-fx)*(1-fy)],[Math.min(w-1,ix+1),iy,fx*(1-fy)],
        [ix,Math.min(h-1,iy+1),(1-fx)*fy],[Math.min(w-1,ix+1),Math.min(h-1,iy+1),fx*fy]]){
        if(weight<=0)continue
        const index=py*w+px;if(this.delta[index]===0)this.touched.push(index);this.delta[index]+=mass*weight
      }
    }
    for(let y=Math.max(0,Math.floor(cy-r*1.2));y<=Math.min(h-1,Math.ceil(cy+r*1.2));y++)
      for(let x=Math.max(0,Math.floor(cx-r*1.2));x<=Math.min(w-1,Math.ceil(cx+r*1.2));x++){
        const forward=(x-cx)*nx+(y-cy)*ny,side=(x-cx)*sx+(y-cy)*sy
        // 有宽掌缘和窄前沿，而非圆形橡皮擦；压力随接触方向分布。
        const rough=grainHash(x,y),edge=r*(.93+.09*Math.sin(side*.13)+.06*(rough-.5))
        const dist=Math.hypot(side/edge,forward/(r*.80))
        if(dist>=1)continue
        const index=y*w+x,amount=d[index],residue=Math.min(amount,.008+rough*.022)
        const moved=(amount-residue)*clamp(strength*(1-dist*dist)**1.4*.62*(.82+rough*.30),0,.94)
        if(moved<1e-10)continue
        d[index]-=moved
        const travel=Math.min(4.5,length*(2.6+.45*rough)),converge=clamp(side*.065,-.7,.7)
        add(x+nx*travel-sx*converge,y+ny*travel-sy*converge,moved)
      }
    for(const index of this.touched){d[index]+=this.delta[index];this.delta[index]=0}this.touched.length=0
  }
  settle(point:StagePoint,radius:number,phase:number){
    const {width:w,height:h,density:d}=this.sand,r=radius*w*1.8
    const x0=Math.max(0,Math.floor(point.x*w-r)),x1=Math.min(w-1,Math.ceil(point.x*w+r)),y0=Math.max(0,Math.floor(point.y*h-r)),y1=Math.min(h-1,Math.ceil(point.y*h+r))
    const transfer=(a:number,b:number,limit:number)=>{
      const difference=d[a]-d[b],excess=Math.abs(difference)-limit
      if(excess<=.001)return
      const flow=excess*.15*Math.sign(difference);d[a]-=flow;d[b]+=flow
    }
    // 仅释放过陡坡面，静止薄沙不做整幅平滑。
    const limitX=.66*(.58/w)/.0008,limitY=.66*(.4/h)/.0008
    for(let pass=0;pass<4;pass++){
      if((phase+pass)%2===0){for(let y=y0;y<=y1;y++)for(let x=x0;x<x1;x++)transfer(y*w+x,y*w+x+1,limitX)
        for(let y=y0;y<y1;y++)for(let x=x0;x<=x1;x++)transfer(y*w+x,(y+1)*w+x,limitY)}
      else{for(let y=y1;y>=y0;y--)for(let x=x1;x>x0;x--)transfer(y*w+x,y*w+x-1,limitX)
        for(let y=y1;y>y0;y--)for(let x=x1;x>=x0;x--)transfer(y*w+x,(y-1)*w+x,limitY)}
    }
  }
}

export class KeepsakeStudy {
  readonly plan:KeepsakePlan
  readonly sand:NaturalSand
  private readonly gather:NaturalGather
  tick=0
  point:StagePoint={x:.5,y:.5}
  state:'falling'|'pushing'|'holding'|'lifting'|'settling'='settling'
  constructor(plan:KeepsakePlan,width=1152,height=768){this.plan=plan;this.sand=new NaturalSand(width,height,0x33c0ffee,8500);this.gather=new NaturalGather(this.sand)}
  get phase(){return this.plan.starts.findIndex((v,i)=>i<this.plan.actions.length&&this.tick>=v&&this.tick<this.plan.starts[i+1])}
  reset(){this.sand.clear();this.tick=0;this.point={x:.5,y:.5};this.state='settling'}
  step(){
    if(this.tick>=this.plan.ticks)return
    const phase=this.phase,action=this.plan.actions[phase],contacts:StageContact[]=[]
    this.state='settling'
    if(action){
      const local=(this.tick-this.plan.starts[phase])*FILM_DT,active=action.seconds-(action.tool==='gather'?1.25:.45)
      const t=clamp(local/active,0,1),prior=clamp((local-FILM_DT)/active,0,1)
      const pathPoint=(p:number,time:number)=>{
        const point=cupPoint(action,naturalProgress(p,phase)),drift=.0018*Math.sin(time*3.3+phase)*Math.sin(Math.PI*p)
        return {x:point.x+drift,y:point.y+drift*.5}
      }
      const previous=pathPoint(prior,local-FILM_DT);this.point=pathPoint(t,local)
      if(action.tool==='pour'&&local<active){
        // 连续一把沙，流量与指缝宽度缓慢变化；起收笔近乎断流，停笔后仍有落沙。
        const envelope=Math.sin(Math.PI*t)**.72
        const pulse=1+.24*Math.sin(local*4.7+phase)+.14*Math.sin(local*11.8+.7)
        const width=.82+.16*Math.sin(local*2.8+phase)+.06*Math.sin(local*9.1)
        contacts.push({tool:'pour',from:previous,to:this.point,radius:action.radius*width,strength:action.strength*envelope*pulse,
          spread:action.spread,ballistic:true,continuousEmission:true,emissionHeight:(action.height??.028)*(1+.14*Math.sin(local*3.1)),velocityInheritance:.11,cluster:.58})
        this.state='falling'
      }else if(action.tool==='gather'){
        const radius=action.radius*(.94+.06*Math.sin(local*2.4))
        if(local<active){this.gather.push(previous,this.point,radius,action.strength*(.28+.72*Math.sin(Math.PI*t)**.7));this.state='pushing'}
        else if(local<active+.40)this.state='holding'
        else if(local<active+1.05){
          const p=(local-active-.4)/.65,last=this.point,before=pathPoint(.97,active*.97),dx=last.x-before.x,dy=last.y-before.y,len=Math.hypot(dx,dy)||1
          const pickup=action.name==='收出杯内光'?1.05:1.32,tip={x:last.x+dx/len*radius*(.18+.38*p),y:last.y+dy/len*radius*(.18+.38*p)}
          this.sand.collect(last,tip,radius*pickup,.19*Math.sin(Math.PI*p)**.8,FILM_DT,.10,true);this.state='lifting'
        }
        this.gather.settle(this.point,radius,this.tick)
      }
    }
    this.sand.step(FILM_DT,contacts);this.tick++
  }
}
