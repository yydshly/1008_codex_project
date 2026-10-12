import {HandworkSand,type StageContact,type StagePoint} from './keepsake-handwork-sand'
import {cupPoint} from './cup-score'
import {FILM_DT} from './keepsake-model'
import type {HandworkPlan} from './keepsake-handwork-model'
import {naturalProgress as handworkProgress} from './keepsake-natural-model'

const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
const grainHash=(x:number,y:number)=>{let n=Math.imul(x^Math.imul(y,374761393),668265263);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967296}

/** 掌缘的守恒推拢：保留细沙，粗糙边缘移沙，沙堆沿每个小步前进。 */
export class HandworkGather {
  readonly sand:HandworkSand
  private readonly delta:Float64Array
  readonly mobile:Float32Array
  private readonly touched:number[]=[]
  constructor(sand:HandworkSand){this.sand=sand;this.delta=new Float64Array(sand.density.length);this.mobile=new Float32Array(sand.density.length)}
  clear(){this.mobile.fill(0)}
  push(from:StagePoint,to:StagePoint,radius:number,strength:number,aspect=.48){
    if(![from.x,from.y,to.x,to.y,radius,strength,aspect].every(Number.isFinite)||radius<=0||strength<=0||aspect<=0)return
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
        const dist=Math.hypot(side/edge,forward/(r*aspect))
        if(dist>=1)continue
        const index=y*w+x,amount=d[index],residue=Math.min(amount,.008+rough*.022)
        const moved=(amount-residue)*clamp(strength*(1-dist**6)*(.88+rough*.24),0,.90)
        if(moved<1e-10)continue
        this.mobile[index]=Math.max(0,this.mobile[index]-moved*Math.min(1,this.mobile[index]/amount))
        d[index]-=moved
        // 接触内沙量推到掌缘前方，形成随路径移动的弧形沙堆；推拢期不拾沙、不删沙。
        const front=r*aspect*(1.035+rough*.09)*Math.sqrt(Math.max(.14,1-(side/edge)**2))
        const lateral=side*(.98+rough*.02)+(rough-.5)*Math.min(1,r*.012)
        add(cx+nx*front+sx*lateral,cy+ny*front+sy*lateral,moved)
      }
    for(const index of this.touched){d[index]+=this.delta[index];this.mobile[index]+=this.delta[index];this.delta[index]=0}this.touched.length=0
  }
  settle(point:StagePoint,radius:number,phase:number){
    const {width:w,height:h,density:d}=this.sand,r=radius*w*1.8
    const x0=Math.max(0,Math.floor(point.x*w-r)),x1=Math.min(w-1,Math.ceil(point.x*w+r)),y0=Math.max(0,Math.floor(point.y*h-r)),y1=Math.min(h-1,Math.ceil(point.y*h+r))
    const transfer=(a:number,b:number,limit:number)=>{
      const difference=d[a]-d[b],excess=Math.abs(difference)-limit
      if(excess<=.001)return
      const flow=excess*.15*Math.sign(difference),source=flow>0?a:b,target=flow>0?b:a
      const tagged=Math.abs(flow)*Math.min(1,this.mobile[source]/Math.max(1e-9,d[source]))
      this.mobile[source]=Math.max(0,this.mobile[source]-tagged);this.mobile[target]+=tagged
      d[a]-=flow;d[b]+=flow
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
  readonly plan:HandworkPlan
  readonly sand:HandworkSand
  private readonly gather:HandworkGather
  tick=0
  point:StagePoint={x:.5,y:.5}
  state:'falling'|'pushing'|'holding'|'lifting'|'settling'='settling'
  constructor(plan:HandworkPlan,width=1152,height=768){this.plan=plan;this.sand=new HandworkSand(width,height,0x36c0ffee,40000);this.gather=new HandworkGather(this.sand)}
  get phase(){return this.plan.starts.findIndex((v,i)=>i<this.plan.actions.length&&this.tick>=v&&this.tick<this.plan.starts[i+1])}
  reset(){this.sand.clear();this.gather.clear();this.tick=0;this.point={x:.5,y:.5};this.state='settling'}
  step(){
    if(this.tick>=this.plan.ticks)return
    const phase=this.phase,action=this.plan.actions[phase],contacts:StageContact[]=[]
    this.state='settling'
    if(action){
      const local=(this.tick-this.plan.starts[phase])*FILM_DT,active=action.tool==='gather'?action.seconds*.67:action.seconds-.45
      const hold=action.seconds*.12,lift=action.seconds*.17
      const t=clamp(local/active,0,1),prior=clamp((local-FILM_DT)/active,0,1)
      const pathPoint=(p:number,time:number)=>{
        const point=cupPoint(action,handworkProgress(p,phase)),drift=.0018*Math.sin(time*3.3+phase)*Math.sin(Math.PI*p)
        return {x:point.x+drift,y:point.y+drift*.5}
      }
      const previous=pathPoint(prior,local-FILM_DT);this.point=pathPoint(t,local)
      if(action.tool==='pour'&&local<active){
        // 连续一把沙，流量与指缝宽度缓慢变化；起收笔近乎断流，停笔后仍有落沙。
        const envelope=action.fan?Math.min(1,t/.065,(1-t)/.055)*(.83+.17*Math.sin(Math.PI*t)):Math.sin(Math.PI*t)**.72
        const pulse=1+.24*Math.sin(local*4.7+phase)+.14*Math.sin(local*11.8+.7)
        const width=action.fan?1+.015*Math.sin(local*2.8+phase):.91+.065*Math.sin(local*2.8+phase)+.025*Math.sin(local*9.1)
        contacts.push({tool:'pour',from:previous,to:this.point,radius:(action.radius+((action.endRadius??action.radius)-action.radius)*t)*width,fan:action.fan,strength:action.strength*envelope*pulse,
          spread:action.spread,angle:action.angle,aspect:action.aspect,ballistic:true,continuousEmission:true,emissionHeight:(action.height??.028)*(1+.14*Math.sin(local*3.1)),velocityInheritance:.06,cluster:.22})
        this.state='falling'
      }else if(action.tool==='gather'){
        const profile=action.profile==='bowl'?t**2.5:t
        const radius=(action.radius+((action.endRadius??action.radius)-action.radius)*profile)*( .994+.006*Math.sin(local*2.4))
        if(local<active){
          const pressure=.35+.65*Math.sin(Math.PI*t)**.7
          this.gather.push(previous,this.point,radius,action.strength*pressure,action.carveAspect??.48)
          this.state='pushing'
        }
        else if(local<active+hold)this.state='holding'
        else if(local<active+hold+lift){
          const p=(local-active-hold)/lift,last=this.point,before=pathPoint(.97,active*.97)
          const dx=(last.x-before.x)*this.sand.width,dy=(last.y-before.y)*this.sand.height,len=Math.hypot(dx,dy)||1
          const offset=radius*(action.carveAspect??.48)*(1.04+.14*p)
          const front={x:last.x+dx/len*offset,y:last.y+dy/len*offset*this.sand.width/this.sand.height}
          // 停驻之后只拾前缘已聚起的沙堆。不会沿整条路径再次清空亮面。
          this.sand.pickupTagged(this.gather.mobile,front,radius*1.12,(action.pickup??.50)*Math.sin(Math.PI*p)**.8,FILM_DT);this.state='lifting'
        }
        this.gather.settle(this.point,radius,this.tick)
      }
    }
    this.sand.step(FILM_DT,contacts);this.tick++
  }
}

