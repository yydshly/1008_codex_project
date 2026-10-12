import type { StageMaterial, StagePoint } from '../stage/material'
import type { StructuredStroke } from './structured-painting'
import { PHOTO_STEP } from './painting'

const lengths=new WeakMap<StructuredStroke,Map<number,Float64Array>>()
/** 弧长采样与温和起停；多个路径点的疏密不会造成移动速度跳变。 */
export function gesturePoint(s:StructuredStroke,t:number,aspect=2/3):StagePoint {
  let shapes=lengths.get(s);if(!shapes){shapes=new Map();lengths.set(s,shapes)}
  let arc=shapes.get(aspect)
  if(!arc){arc=new Float64Array(s.path.length);for(let i=1;i<s.path.length;i++)arc[i]=arc[i-1]+Math.hypot(s.path[i].x-s.path[i-1].x,(s.path[i].y-s.path[i-1].y)*aspect);shapes.set(aspect,arc)}
  t=Math.max(0,Math.min(1,t));const eased=t-.065*Math.sin(t*Math.PI*2),distance=eased*arc.at(-1)!
  let i=0;while(i<arc.length-2&&arc[i+1]<distance)i++
  const f=(distance-arc[i])/Math.max(1e-12,arc[i+1]-arc[i])
  return {x:s.path[i].x+(s.path[i+1].x-s.path[i].x)*f,y:s.path[i].y+(s.path[i+1].y-s.path[i].y)*f}
}
export function gestureEnvelope(n:number,ticks:number){return Math.sin(Math.PI*(n+.5)/ticks)*Math.PI/2}
/** 指缝开合/接触力度沿同一弧线渐变，不将长笔拆成一串定量小点。 */
export function gesturePressure(s:StructuredStroke,t:number,aspect=2/3){
  if(!s.pressure)return 1
  gesturePoint(s,t,aspect)
  const arc=lengths.get(s)!.get(aspect)!,eased=t-.065*Math.sin(t*Math.PI*2),distance=eased*arc.at(-1)!
  let i=0;while(i<arc.length-2&&arc[i+1]<distance)i++
  const f=(distance-arc[i])/Math.max(1e-12,arc[i+1]-arc[i])
  return s.pressure[i]+(s.pressure[i+1]-s.pressure[i])*f
}
/** 新谱独立启用；供沙近台下落，停沙不自动揉散，收沙留少量沿迹沙脊。 */
export function gestureTick(material:StageMaterial,s:StructuredStroke,n:number,profile:'flow'|'sculpt'|'performance'='flow'){
  if(n>=s.ticks){material.step(PHOTO_STEP,[]);return}
  const aspect=material.height/material.width,from=gesturePoint(s,n/s.ticks,aspect),to=gesturePoint(s,(n+1)/s.ticks,aspect)
  const performance=profile==='performance',sculpt=profile!=='flow'
  const envelope=performance?(.22+.78*Math.sin(Math.PI*(n+.5)/s.ticks))/(.22+.78*2/Math.PI):gestureEnvelope(n,s.ticks)
  const flow=envelope*(1+.07*Math.sin(material.elapsedTime*6.3)+.035*Math.sin(material.elapsedTime*10.7))*(performance?gesturePressure(s,(n+.5)/s.ticks,aspect):1)
  if(s.tool==='collect'){
    material.step(PHOTO_STEP,[]);material.collect(from,to,s.sigma*2/material.width,s.budget*flow,PHOTO_STEP,sculpt?.12:.08,sculpt)
  }else if(s.tool==='rub')material.step(PHOTO_STEP,[{tool:'rub',from,to,radius:s.sigma/material.width,strength:s.budget*flow}])
  else{
    const spread=sculpt?.075:.16,base=material.width*material.height*.016*PHOTO_STEP
    material.step(PHOTO_STEP,[{tool:'pour',from,to,radius:s.sigma/(.2+spread*.55)/material.width,
      strength:Math.min(3,s.budget/s.ticks/base*flow),spread,ballistic:true,emissionHeight:performance?.008+.010*s.sigma/(s.sigma+3):sculpt?.018:.007,
      velocityInheritance:.018,continuousEmission:true,height:0}])
  }
}
