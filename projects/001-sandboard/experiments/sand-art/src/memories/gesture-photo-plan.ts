import { StageMaterial } from '../stage/material'
import { StructuredPainting, portraitRegions, type PortraitPlan, type StructuredStroke } from './structured-painting'
import { gestureTick } from './gesture-motion'
import { choreographPhoto } from './photo-choreography'
import {performanceCurve} from './performance-curve'

const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
export function gestureLength(s:StructuredStroke,w=768,h=512){let length=0;for(let i=1;i<s.path.length;i++)length+=Math.hypot((s.path[i].x-s.path[i-1].x)*w,(s.path[i].y-s.path[i-1].y)*h);return length}
/** 仅在离线规划时使用的局部对比目标；不作为网页的密度终态或贴图。 */
export function sharpenSandTarget(density:Float32Array,w:number,h:number){
  const light=Float32Array.from(density,d=>Math.exp(-d*1.35)),horizontal=new Float32Array(light.length),blur=new Float32Array(light.length)
  const radius=4
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let sum=0;for(let k=-radius;k<=radius;k++)sum+=light[y*w+clamp(x+k,0,w-1)];horizontal[y*w+x]=sum/9}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let sum=0;for(let k=-radius;k<=radius;k++)sum+=horizontal[clamp(y+k,0,h-1)*w+x];blur[y*w+x]=sum/9}
  return Float32Array.from(light,(l,i)=>-Math.log(clamp(l+.75*(l-blur[i]),.014,1))/1.35)
}
function sample(field:Float32Array,x:number,y:number,w:number,h:number){return field[clamp(Math.round(y),0,h-1)*w+clamp(Math.round(x),0,w-1)]}
function smooth(field:Float32Array,x:number,y:number,r:number,w:number,h:number){let sum=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)sum+=sample(field,x+dx*r,y+dy*r,w,h)*(dx?1:2)*(dy?1:2);return sum/16}
function blurred(field:Float32Array,r:number,w:number,h:number,scale=1){
  const horizontal=new Float32Array(field.length),out=new Float32Array(field.length),size=2*r+1
  for(let y=0;y<h;y++){let sum=0;for(let k=-r;k<=r;k++)sum+=sample(field,k,y,w,h);for(let x=0;x<w;x++){horizontal[y*w+x]=sum/size;sum+=sample(field,x+r+1,y,w,h)-sample(field,x-r,y,w,h)}}
  for(let x=0;x<w;x++){let sum=0;for(let k=-r;k<=r;k++)sum+=sample(horizontal,x,k,w,h);for(let y=0;y<h;y++){out[y*w+x]=sum/size*scale;sum+=sample(horizontal,x,y+r+1,w,h)-sample(horizontal,x,y-r,w,h)}}
  return out
}
function trace(target:Float32Array,current:Float32Array,x:number,y:number,sigma:number,w:number,h:number){
  const read=(f:Float32Array,a:number,b:number)=>f===current?smooth(f,a,b,sigma*.45,w,h):sample(f,a,b,w,h),centre=read(target,x,y),residue=centre-read(current,x,y)
  const gradient=(a:number,b:number)=>[read(target,a+2,b)-read(target,a-2,b),read(target,a,b+2)-read(target,a,b-2)]
  const g=gradient(x,y),angle=Math.hypot(...g)>.012?Math.atan2(g[1],g[0])+Math.PI/2:.7+Math.sin(x*.017+y*.021)*.4
  const walk=(sign:number)=>{
    const points:{x:number,y:number}[]=[];let px=x,py=y,previous=angle
    for(let n=0;n<9;n++){
      const [gx,gy]=gradient(px,py);let a=Math.hypot(gx,gy)>.012?Math.atan2(gy,gx)+Math.PI/2:previous
      if(Math.cos(a-previous)<0)a+=Math.PI
      a=previous+Math.atan2(Math.sin(a-previous),Math.cos(a-previous))*.48
      const nx=px+Math.cos(a)*Math.max(.9,sigma*.85)*sign,ny=py+Math.sin(a)*Math.max(.9,sigma*.85)*sign
      const wanted=read(target,nx,ny),error=wanted-read(current,nx,ny)
      if(nx<2||ny<2||nx>w-3||ny>h-3||error*residue<=0||Math.abs(wanted-centre)>.32||Math.abs(error)<Math.abs(residue)*.12)break
      points.push({x:nx/w,y:ny/h});px=nx;py=ny;previous=a
    }
    return points
  }
  return [...walk(-1).reverse(),{x:x/w,y:y/h},...walk(1)]
}

/** 重新拟合长曲线：短于接触宽度的残差不退回点状印章。 */
export async function buildGesturePhoto(original:PortraitPlan,progress?:(done:number,total:number)=>void,options?:{target:Float32Array;motion:'sculpt'|'performance'}){
  const baseline=new StructuredPainting(original);while(baseline.step()){}
  const w=baseline.material.width,h=baseline.material.height,target=options?.target??sharpenSandTarget(baseline.material.density,w,h),motion=options?.motion??'flow'
  if(target.length!==w*h||!target.every(n=>Number.isFinite(n)&&n>=0))throw new Error('原照结构目标格式不正确。')
  const sand=new StageMaterial(w,h,0x91e6b3,50000),strokes:StructuredStroke[]=[]
  const passes=options?[
    [0,'context',19,65,.4],[0,'context',8,160,1],[1,'coat',8,120,.85],[1,'hair',5,90,.9],
    [2,'face',3,150,1],[3,'hands',3,145,1],[3,'cup',2.5,60,1],
    [4,'coat',3,130,1],[4,'hair',2.5,85,1],[4,'face',.9,600,1],[4,'hands',1.2,480,1],[4,'cup',.9,180,1],
  ] as const:[
    [0,'context',19,65,.4],[0,'context',8,160,1],[1,'coat',8,120,.85],[1,'hair',5,90,.9],
    [2,'face',3,120,1],[3,'hands',3,110,1],[3,'cup',2.5,45,1],
    [4,'coat',3,130,1],[4,'hair',2.5,85,1],[4,'face',1.2,240,1],[4,'hands',1.6,200,1],[4,'cup',1.2,65,1],
  ] as const
  const total=passes.reduce((sum,p)=>sum+p[3],0);let done=0
  for(const [phase,region,sigma,count,scale] of passes){
    const wanted=blurred(target,Math.max(1,Math.round(sigma*.5)),w,h,scale)
    const bounds=portraitRegions[region],tried=new Set<number>(),spacing=Math.max(2,sigma)
    for(let n=0;n<count;n++){
      let x=0,y=0,best=0
      for(let py=bounds[1]*h+2;py<bounds[3]*h-2;py+=spacing)for(let px=bounds[0]*w+2;px<bounds[2]*w-2;px+=spacing){
        const index=Math.round(py)*w+Math.round(px);if(tried.has(index))continue
        const e=Math.abs(Math.exp(-smooth(sand.density,px,py,sigma*.45,w,h)*1.35)-Math.exp(-sample(wanted,px,py,w,h)*1.35))
        if(e>best){best=e;x=px;y=py}
      }
      if(best<.026){done+=count-n;break}
      tried.add(Math.round(y)*w+Math.round(x))
      const continuous=motion==='performance'?performanceCurve(wanted,sand.density,x,y,sigma,w,h):undefined
      const path=continuous?.path??trace(wanted,sand.density,x,y,sigma,w,h)
      if(path.length<2){done++;continue}
      const residue=sample(wanted,x,y,w,h)-smooth(sand.density,x,y,sigma*.45,w,h)
      const tool=residue>0?'pour':'collect'
      const s:StructuredStroke={phase,region,tool,path,sigma,budget:0,ticks:Math.max(36,Math.round(sigma>=3?54:42)),finish:'settle'}
      const length=gestureLength(s,w,h)
      if(continuous){s.pressure=continuous.pressure;s.ticks=Math.round(clamp(60+length*.7,64,150))}
      if(length<Math.max(options?2.8:4,sigma*.8)){done++;continue}
      const margin=Math.ceil(sigma*5+4),xs=path.map(p=>p.x*w),ys=path.map(p=>p.y*h)
      const a=Math.max(0,Math.floor(Math.min(...xs)-margin)),b=Math.max(0,Math.floor(Math.min(...ys)-margin)),c=Math.min(w-1,Math.ceil(Math.max(...xs)+margin)),d=Math.min(h-1,Math.ceil(Math.max(...ys)+margin))
      const before=sand.read()
      const error=()=>{let sum=0;for(let py=b;py<=d;py++)for(let px=a;px<=c;px++){const i=py*w+px,delta=Math.exp(-sand.density[i]*1.35)-Math.exp(-wanted[i]*1.35);sum+=delta*delta}return sum}
      const oldError=error(),execute=()=>{for(let t=0;t<s.ticks+10;t++)gestureTick(sand,s,t,motion)}
      if(tool==='pour'){
        const budget=residue*(Math.sqrt(2*Math.PI)*sigma*length+2*Math.PI*sigma*sigma)*.8
        s.budget=budget;execute();let numerator=0,denominator=0
        for(let py=b;py<=d;py++)for(let px=a;px<=c;px++){const i=py*w+px,delta=sand.density[i]-before.density[i],weight=Math.exp(-wanted[i]*2.7);numerator+=delta*(wanted[i]-before.density[i])*weight;denominator+=delta*delta*weight}
        s.budget=budget*clamp(numerator/Math.max(1e-12,denominator),0,1.8);sand.restore(before);execute()
      }else{
        const actual=sample(before.density,x,y,w,h),fraction=clamp(residue/-Math.max(.02,actual),0,.94)
        const budget=-Math.log(1-fraction)/(s.ticks/60*120*Math.min(1,sigma*4/length)*.38)
        let lowest=oldError,bestBudget=0
        for(const factor of [.5,1,1.8]){sand.restore(before);s.budget=Math.min(3,budget*factor);execute();const e=error();if(e<lowest){lowest=e;bestBudget=s.budget}}
        sand.restore(before);s.budget=bestBudget;execute()
      }
      if(error()<oldError*.999&&s.budget>0)strokes.push(s);else sand.restore(before)
      done++;if(done%12===0){progress?.(done,total);await new Promise<void>(resolve=>setTimeout(resolve,0))}
    }
  }
  const phaseStarts:number[]=[];let clock=0
  for(const s of strokes){phaseStarts[s.phase]??=clock;clock+=s.ticks+10}
  phaseStarts[5]=clock;for(let n=4;n>=0;n--)phaseStarts[n]??=phaseStarts[n+1]
  for(let i=0;i<60;i++)sand.step(1/60,[])
  let faceError=0,count=0;const r=portraitRegions.face
  for(let y=Math.ceil(r[1]*h);y<r[3]*h;y++)for(let x=Math.ceil(r[0]*w);x<r[2]*w;x++){const i=y*w+x;faceError+=Math.abs(Math.exp(-sand.density[i]*1.35)-Math.exp(-target[i]*1.35));count++}
  const emptyError=target.reduce((sum,d,i)=>{const x=i%w/w,y=Math.floor(i/w)/h;return x>=r[0]&&x<r[2]&&y>=r[1]&&y<r[3]?sum+1-Math.exp(-d*1.35):sum},0)/count
  const raw:PortraitPlan={...original,motion,strokes,phaseStarts,totalTicks:clock+60,initialError:emptyError,finalError:faceError/count}
  const plan=choreographPhoto(raw).plan
  const replay=new StructuredPainting(plan);while(replay.step()){}
  faceError=0;for(let y=Math.ceil(r[1]*h);y<r[3]*h;y++)for(let x=Math.ceil(r[0]*w);x<r[2]*w;x++){const i=y*w+x;faceError+=Math.abs(Math.exp(-replay.material.density[i]*1.35)-Math.exp(-target[i]*1.35))}
  plan.finalError=faceError/count
  progress?.(total,total)
  return {plan,baseline:baseline.material.read(),target,snapshot:replay.material.read()}
}
