import { StageMaterial, type StageMaterialSnapshot, type StagePoint } from '../stage/material'
import type { StageHand } from '../stage/show'
import { PHOTO_STEP } from './painting'
import { validGuides, type StructureGuide, type GuideBounds } from './structure'
import {gestureTick,gesturePoint} from './gesture-motion'

/** 本示例的人工结构标注。只是规划范围，不参与材料遮罩或渲染。 */
export const portraitRegions = {
  context: [.30,.025,.88,.96], hair: [.58,.12,.79,.46], coat: [.44,.47,.87,.94],
  face: [.545,.19,.718,.486], hands: [.478,.535,.707,.813], cup: [.541,.512,.643,.636],
} as const
type Region=keyof typeof portraitRegions
export const structuredPhases=['薄灰与场景','头发和衣身','面部塑形','双手与杯子','五官和光影','抬手留画']
export const structuredNotes=['先薄撒窗光与环境，人物暂不刻画。','头发和衣身先建立大暗面。','围绕人工标注的面部范围添沙、收沙，形成额鼻颊颏。','在衣身暗面中收出双手与杯身，再整理灰面。','围绕脸、手与杯口的局部明暗，逐笔整理细部。','实际工具已完成，等待细沙落定。']
export interface StructuredStroke {phase:number;region:Region;tool:'pour'|'collect'|'rub';path:StagePoint[];sigma:number;budget:number;ticks:number;finish?:'settle';pressure?:number[]}
export interface PortraitPlan {strokes:StructuredStroke[];totalTicks:number;phaseStarts:number[];initialError:number;finalError:number;width?:number;height?:number;guides?:StructureGuide[];motion?:'flow'|'sculpt'|'performance'}
export interface StructureOptions {guides:StructureGuide[];quality?:'balanced'|'fine';touch?:'natural'|'legacy'}
export const guidedPhases=['薄灰与场景','主体灰面','面部塑形','双手与物件','细部光影','落定留画']
export const guidedNotes=['围绕你框选的主体铺灰。','先建立主体与头发的大明暗。','优先整理你标出的面部；没有面部标注时跳过。','整理标出的双手和物件；未标出的类别跳过。','从大灰面到小笔触整理关键结构。','工具已完成，等待实际细沙落定。']
const W=768,H=512,SEED=0x91e6b3,GAP=10
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
export function regionsForGuides(guides:StructureGuide[]):Record<Region,GuideBounds[]> {
  if(!validGuides(guides)||!guides.length)throw new Error('创作区域不正确。')
  const faces=guides.filter(g=>g.kind==='face').map(g=>g.bounds)
  const union:GuideBounds=[Math.min(...guides.map(g=>g.bounds[0])),Math.min(...guides.map(g=>g.bounds[1])),Math.max(...guides.map(g=>g.bounds[2])),Math.max(...guides.map(g=>g.bounds[3]))]
  const subject=guides.find(g=>g.kind==='subject')?.bounds??union
  const coat:GuideBounds=[subject[0],faces.length?Math.max(subject[1],Math.min(...faces.map(r=>r[3]-(r[3]-r[1])*.1))):subject[1],subject[2],subject[3]]
  if(coat[3]-coat[1]<.02)coat[1]=subject[1]
  return {
    context:[[Math.max(.01,union[0]-.08),Math.max(.01,union[1]-.08),Math.min(.99,union[2]+.08),Math.min(.99,union[3]+.04)]],
    coat:[coat],face:faces,
    hair:faces.map(r=>[Math.max(.01,r[0]-(r[2]-r[0])*.2),Math.max(.01,r[1]-(r[3]-r[1])*.5),Math.min(.99,r[2]+(r[2]-r[0])*.2),Math.min(.99,r[1]+(r[3]-r[1])*.35)]),
    hands:guides.filter(g=>g.kind==='hands').map(g=>g.bounds),cup:guides.filter(g=>g.kind==='object').map(g=>g.bounds),
  }
}
function guidedRubs(hair:readonly number[]|undefined,coat:readonly number[]|undefined,phase:number,width:number):StructuredStroke[]{
  const strokes:StructuredStroke[]=[]
  for(const [region,r,ticks] of [['hair',hair,150],['coat',coat,240]] as const){
    if(!r)continue;const [a,b,c,d]=r
    strokes.push({phase,region,tool:'rub',path:[{x:a+(c-a)*.38,y:b+(d-b)*.3},{x:a+(c-a)*.64,y:b+(d-b)*.75}],sigma:clamp((c-a)*width*.45,4,150),budget:3,ticks})
  }
  return strokes
}
/** 示例文件只允许工具几何与预算，不接受成品厚度或图片遮罩。 */
export function decodePortraitPlan(text:string):PortraitPlan {
  if(text.length>5_000_000)throw new Error('单图动作文件过大。')
  const p=JSON.parse(text) as PortraitPlan
  const finite=(n:unknown,a:number,b:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b
  if(!p||typeof p!=='object'||Object.keys(p).some(k=>!['strokes','totalTicks','phaseStarts','initialError','finalError','width','height','guides','motion'].includes(k))||(p.motion!==undefined&&!['flow','sculpt','performance'].includes(p.motion))
    ||!Array.isArray(p.strokes)||!p.strokes.length||p.strokes.length>12000||!Array.isArray(p.phaseStarts)||p.phaseStarts.length!==6
    ||!finite(p.initialError,0,1)||!finite(p.finalError,0,1))throw new Error('单图动作格式不正确。')
  if(p.width!==undefined||p.height!==undefined||p.guides!==undefined){if(!Number.isInteger(p.width)||!finite(p.width,4,2048)||!Number.isInteger(p.height)||!finite(p.height,4,1536)||!validGuides(p.guides)||!p.guides.length)throw new Error('结构动作画幅或标注不正确。')}
  let time=0,lastPhase=0;const starts:number[]=[]
  for(const s of p.strokes){
    if(!s||Object.keys(s).some(k=>!['phase','region','tool','path','sigma','budget','ticks','finish','pressure'].includes(k))||(s.finish!==undefined&&s.finish!=='settle')||!Number.isInteger(s.phase)||s.phase<lastPhase||s.phase>4||!Object.hasOwn(portraitRegions,s.region)||!['pour','collect','rub'].includes(s.tool)
      ||!finite(s.sigma,.5,s.tool==='rub'?160:40)||!finite(s.budget,0,1_000_000)||!Number.isInteger(s.ticks)||s.ticks<1||s.ticks>600
      ||!Array.isArray(s.path)||s.path.length<2||s.path.length>(p.motion==='performance'?64:20)||!s.path.every(q=>q&&finite(q.x,0,1)&&finite(q.y,0,1))
      ||(s.pressure!==undefined&&(p.motion!=='performance'||!Array.isArray(s.pressure)||s.pressure.length!==s.path.length||!s.pressure.every(n=>finite(n,.05,2.5)))))throw new Error('单图笔触格式不正确。')
    starts[s.phase]??=time;lastPhase=s.phase;time+=s.ticks+GAP
  }
  starts[5]=time;for(let n=4;n>=0;n--)starts[n]??=starts[n+1]
  if(p.totalTicks!==time+60||p.totalTicks>250000||p.phaseStarts.some((n,i)=>n!==starts[i]))throw new Error('单图动作时间不正确。')
  return p
}
function sampleField(field:Float32Array,x:number,y:number,W=768,H=512){
  x=clamp(x,0,W-1);y=clamp(y,0,H-1);const ax=Math.floor(x),ay=Math.floor(y),bx=Math.min(W-1,ax+1),by=Math.min(H-1,ay+1),fx=x-ax,fy=y-ay
  return (field[ay*W+ax]*(1-fx)+field[ay*W+bx]*fx)*(1-fy)+(field[by*W+ax]*(1-fx)+field[by*W+bx]*fx)*fy
}
function at(path:StagePoint[],fraction:number){const n=clamp(fraction,0,1)*(path.length-1),i=Math.min(path.length-2,Math.floor(n)),t=n-i;return {x:path[i].x+(path[i+1].x-path[i].x)*t,y:path[i].y+(path[i+1].y-path[i].y)*t}}
function smoothField(field:Float32Array,x:number,y:number,sigma:number,W=768,H=512){let sum=0,weight=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const w=(dx?1:2)*(dy?1:2);sum+=sampleField(field,x+dx*sigma,y+dy*sigma,W,H)*w;weight+=w}return sum/weight}
function fieldCurve(target:Float32Array,current:Float32Array,x:number,y:number,sigma:number,W=768,H=512):StagePoint[]{
  const sample=(f:Float32Array,a:number,b:number)=>sampleField(f,a,b,W,H),smoothAt=(f:Float32Array,a:number,b:number,s:number)=>smoothField(f,a,b,s,W,H)
  const wanted=smoothAt(target,x,y,sigma*.5),error=wanted-smoothAt(current,x,y,sigma*.5)
  const gx=sample(target,x+2,y)-sample(target,x-2,y),gy=sample(target,x,y+2)-sample(target,x,y-2)
  const angle=Math.hypot(gx,gy)>.008?Math.atan2(gy,gx)+Math.PI/2:.65
  const walk=(sign:number)=>{const points:StagePoint[]=[];let px=x,py=y,previous=angle
    for(let n=0;n<5;n++){
      const dx=sample(target,px+2,py)-sample(target,px-2,py),dy=sample(target,px,py+2)-sample(target,px,py-2)
      let a=Math.hypot(dx,dy)>.008?Math.atan2(dy,dx)+Math.PI/2:previous;if(Math.cos(a-previous)<0)a+=Math.PI
      a=previous+Math.atan2(Math.sin(a-previous),Math.cos(a-previous))*.65
      const nx=px+Math.cos(a)*sigma*.85*sign,ny=py+Math.sin(a)*sigma*.85*sign
      const next=smoothAt(target,nx,ny,sigma*.5),residual=next-smoothAt(current,nx,ny,sigma*.5)
      if(nx<1||ny<1||nx>W-2||ny>H-2||Math.abs(next-wanted)>.18||residual*error<=0||Math.abs(residual-error)>Math.max(.08,Math.abs(error)*.45))break
      px=nx;py=ny;previous=a;points.push({x:px/W,y:py/H})
    }return points}
  const points=[...walk(-1).reverse(),{x:x/W,y:y/H},...walk(1)]
  if(points.length<2)points.push({x:(x+.2)/W,y:(y+.15)/H})
  return points
}
function basis(path:StagePoint[],sigma:number,W=768,H=512){
  const margin=Math.ceil(sigma*3+2),xs=path.map(p=>p.x*W),ys=path.map(p=>p.y*H)
  const lowX=Math.max(0,Math.floor(Math.min(...xs)-margin)),highX=Math.min(W-1,Math.ceil(Math.max(...xs)+margin)),lowY=Math.max(0,Math.floor(Math.min(...ys)-margin)),highY=Math.min(H-1,Math.ceil(Math.max(...ys)+margin))
  const entries:{index:number;k:number}[]=[];let sum=0
  const effective=Math.sqrt(sigma*sigma+.6)
  for(let y=lowY;y<=highY;y++)for(let x=lowX;x<=highX;x++){
    let k=0;for(let n=0;n<9;n++){const p=at(path,n/8);k+=Math.exp(-((x-p.x*W)**2+(y-p.y*H)**2)/(2*effective*effective))/9}
    if(k<.0005)continue;sum+=k;entries.push({index:y*W+x,k})
  }
  for(const e of entries)e.k/=sum
  return entries
}
export function rubsAfterStroke(s:StructuredStroke){return s.tool==='pour'&&s.finish!=='settle'}
function runTick(material:StageMaterial,s:StructuredStroke,n:number){
  const W=material.width,H=material.height
  if(n>=s.ticks){
    material.step(PHOTO_STEP,n>=s.ticks+6&&rubsAfterStroke(s)?[{tool:'rub',from:s.path[0],to:s.path.at(-1)!,radius:(s.sigma*3+2)/W,strength:3}]:[])
    return
  }
  const from=at(s.path,n/s.ticks),to=at(s.path,(n+1)/s.ticks)
  if(s.tool==='rub'){material.step(PHOTO_STEP,[{tool:'rub',from,to,radius:s.sigma/W,strength:s.budget}])}
  else if(s.tool==='pour'){
    const time=material.elapsedTime+PHOTO_STEP,flow=clamp(.8+.24*Math.sin(time*8.1+to.x*6)+.19*Math.sin(time*3.37+1.1),.35,1.3)
    const base=W*H*.016*PHOTO_STEP*flow
    const spread=s.sigma>=3?.32:.13
    material.step(PHOTO_STEP,[{tool:'pour',from,to,radius:s.sigma/(.2+spread*.55)/W,strength:Math.min(3,s.budget/s.ticks/base),spread,height:0,cluster:0}])
  }else{material.step(PHOTO_STEP,[]);material.collect(from,to,s.sigma*2.0/W,s.budget,PHOTO_STEP)}
}
export function portraitLightError(current:Float32Array,target:Float32Array,region:Region='face',W=768,H=512,bounds:readonly number[]=portraitRegions[region]){
  const [a,b,c,d]=bounds;let sum=0,count=0
  for(let y=Math.ceil(b*H);y<d*H;y++)for(let x=Math.ceil(a*W);x<c*W;x++){const i=y*W+x;sum+=Math.abs(Math.exp(-current[i]*1.35)-Math.exp(-target[i]*1.35));count++}return sum/count
}
/** 先在同一个真实材料模型中校验动作，再交给网页逐步执行；计划不带成品厚度。 */
export async function planStructuredPortrait(target:StageMaterialSnapshot,onProgress?:(fraction:number,phase?:number)=>void,options?:StructureOptions):Promise<PortraitPlan>{
  if(!options&&(target.width!==768||target.height!==512))throw new Error('受控示例固定为横幅 3:2。')
  if(options&&(!validGuides(options.guides)||!options.guides.length))throw new Error('请先标出主体或关键结构。')
  const W=target.width,H=target.height
  if(!Number.isInteger(W)||!Number.isInteger(H)||W<4||H<4||W>2048||H>1536||target.density.length!==W*H||!target.density.every(n=>Number.isFinite(n)&&n>=0))throw new Error('结构规划的目标沙层不正确。')
  const sample=(f:Float32Array,a:number,b:number)=>sampleField(f,a,b,W,H),smoothAt=(f:Float32Array,a:number,b:number,s:number)=>smoothField(f,a,b,s,W,H)
  const regions:Record<Region,readonly (readonly number[])[]>=options?regionsForGuides(options.guides):{context:[portraitRegions.context],hair:[portraitRegions.hair],coat:[portraitRegions.coat],face:[portraitRegions.face],hands:[portraitRegions.hands],cup:[portraitRegions.cup]}
  const focus=regions.face.length?regions.face:regions.coat
  const lightError=()=>focus.reduce((sum,r)=>sum+portraitLightError(material.density,target.density,'face',W,H,r),0)/Math.max(1,focus.length)
  const material=new StageMaterial(W,H,SEED,50000),strokes:StructuredStroke[]=[]
  const initialError=lightError()
  const specs:{phase:number;region:Region;sigma:number;count:number;scale:number}[]=[
    {phase:0,region:'context',sigma:19,count:50,scale:.4},
    {phase:0,region:'context',sigma:8,count:120,scale:1},
    {phase:1,region:'coat',sigma:10,count:120,scale:.85},{phase:1,region:'hair',sigma:5,count:120,scale:.9},
    {phase:2,region:'face',sigma:4.5,count:150,scale:1},
    {phase:3,region:'hands',sigma:4.5,count:125,scale:1},{phase:3,region:'cup',sigma:3.5,count:50,scale:1},
    {phase:4,region:'coat',sigma:4.5,count:250,scale:1},{phase:4,region:'hair',sigma:3.5,count:160,scale:1},
    {phase:4,region:'face',sigma:2.0,count:500,scale:1},{phase:4,region:'hands',sigma:2.5,count:250,scale:1},
    {phase:4,region:'cup',sigma:2.0,count:80,scale:1},
    {phase:4,region:'face',sigma:1.0,count:900,scale:1},{phase:4,region:'hands',sigma:1.5,count:550,scale:1},
  ]
  const passes=specs.flatMap(p=>regions[p.region].map(bounds=>{
    const original=portraitRegions[p.region],area=(bounds[2]-bounds[0])*(bounds[3]-bounds[1])*W*H,oldArea=(original[2]-original[0])*(original[3]-original[1])*768*512
    return {...p,bounds,sigma:options?clamp(p.sigma*W/768,.75,40):p.sigma,count:options?Math.max(12,Math.round(p.count*clamp(area/oldArea,.3,1.5)*(options.quality==='balanced'?.55:1))):p.count}
  }))
  const total=passes.reduce((sum,p)=>sum+p.count,0);let work=0
  for(const pass of passes){
    const wanted=Float32Array.from(target.density,n=>n*pass.scale)
    const [a,b,c,d]=pass.bounds,spacing=Math.max(2,pass.sigma*.7)
    const tried=new Set<number>()
    for(let n=0;n<pass.count;n++){
      let x=0,y=0,best=0
      for(let py=b*H+1;py<d*H-1;py+=spacing)for(let px=a*W+1;px<c*W-1;px+=spacing){
        if(tried.has(Math.round(py)*W+Math.round(px)))continue
        const desired=smoothAt(wanted,px,py,pass.sigma*.5),actual=smoothAt(material.density,px,py,pass.sigma*.5)
        const error=Math.abs(Math.exp(-actual*1.35)-Math.exp(-desired*1.35))
        if(error>best){best=error;x=px;y=py}
      }
      if(best<.025){work+=pass.count-n;break}
      tried.add(Math.round(y)*W+Math.round(x))
      let path=fieldCurve(wanted,material.density,x,y,pass.sigma,W,H)
      let kernel=basis(path,pass.sigma,W,H),numerator=0,denominator=0
      for(const e of kernel){const weight=Math.exp(-wanted[e.index]*2.7);numerator+=weight*e.k*(wanted[e.index]-material.density[e.index]);denominator+=weight*e.k*e.k}
      let amount=numerator/Math.max(1e-12,denominator)
      // 等值线穿过相反残差时缩短接触，避免在同一区域反复添暗、收亮却不收敛。
      if(Math.sign(amount)!==Math.sign(sample(wanted,x,y)-sample(material.density,x,y))){
        path=[{x:x/W,y:y/H},{x:(x+.2)/W,y:(y+.15)/H}];kernel=basis(path,pass.sigma,W,H);numerator=denominator=0
        for(const e of kernel){const weight=Math.exp(-wanted[e.index]*2.7);numerator+=weight*e.k*(wanted[e.index]-material.density[e.index]);denominator+=weight*e.k*e.k}amount=numerator/Math.max(1e-12,denominator)
      }
      const tool=amount>=0?'pour':'collect',ticks=tool==='pour'?Math.max(7,Math.ceil(amount/(W*H*.016/60*.35*2.8))):9
      let budget=Math.max(0,amount)*.8
      if(tool==='collect'){
        const actual=smoothAt(material.density,x,y,pass.sigma*.5),desired=smoothAt(wanted,x,y,pass.sigma*.5)
        const fraction=clamp((actual-desired)/Math.max(.02,actual)*.85,0,.9)
        budget=-Math.log(1-fraction)/(ticks*PHOTO_STEP*120*.38)
      }
      const s:StructuredStroke={phase:pass.phase,region:pass.region,tool,path,sigma:pass.sigma,budget,ticks,...(options?.touch==='natural'&&pass.sigma<3?{finish:'settle' as const}:{})}
      const before=material.read()
      const error=()=>{let sum=0;for(const e of kernel){const d=Math.exp(-material.density[e.index]*1.35)-Math.exp(-wanted[e.index]*1.35);sum+=d*d}return sum}
      const oldError=error()
      const execute=()=>{for(let t=0;t<ticks+GAP;t++)runTick(material,s,t)}
      if(tool==='pour'){
        // 用实际落点响应校正供料；包括撒沙偏移、粉末核与揉沙，不假设理想高斯等于真实工具。
        s.budget=0;execute();const base=material.density.slice();material.restore(before)
        s.budget=budget;execute();let num=0,den=0
        for(const e of kernel){const delta=material.density[e.index]-base[e.index],weight=Math.exp(-wanted[e.index]*2.7);num+=delta*(wanted[e.index]-base[e.index])*weight;den+=delta*delta*weight}
        s.budget=budget*clamp(num/Math.max(1e-12,den),0,1.35)
        material.restore(before);execute()
      }else{
        let bestError=oldError,bestBudget=0
        for(const factor of [.3,.65,1,1.6]){material.restore(before);s.budget=budget*factor;execute();const next=error();if(next<bestError){bestError=next;bestBudget=s.budget}}
        s.budget=bestBudget;material.restore(before);execute()
      }
      if(error()<oldError*.999){strokes.push(s)}else material.restore(before)
      work++;if(onProgress&&work%8===0){onProgress(work/total,pass.phase);await new Promise<void>(resolve=>setTimeout(resolve,0))}
    }
    if((pass.region==='hair'||options&&pass.region==='coat'&&!regions.hair.length)&&(pass.phase===1||pass.phase===4&&options?.touch!=='natural')){
      const rubs=options?guidedRubs(pass.region==='hair'?pass.bounds:undefined,regions.coat[0],pass.phase,W):[
        {phase:pass.phase,region:'hair',tool:'rub',path:[{x:.65,y:.21},{x:.7,y:.4}],sigma:76,budget:3,ticks:150},
        {phase:pass.phase,region:'coat',tool:'rub',path:[{x:.54,y:.57},{x:.77,y:.82}],sigma:108,budget:3,ticks:240},
      ] satisfies StructuredStroke[]
      for(const s of rubs){strokes.push(s);for(let t=0;t<s.ticks+GAP;t++)runTick(material,s,t)}
    }
  }
  const totalTicks=strokes.reduce((sum,s)=>sum+s.ticks+GAP,0)+60
  if(strokes.length>12000||totalTicks>250000)throw new Error('这幅照片的区域过多，请减少标注或选择快速试画。')
  let clock=0;const phaseStarts:number[]=[]
  for(const s of strokes){if(phaseStarts[s.phase]===undefined)phaseStarts[s.phase]=clock;clock+=s.ticks+GAP}
  phaseStarts[5]=clock;for(let n=0;n<60;n++)material.step(PHOTO_STEP,[])
  for(let n=4;n>=0;n--)if(phaseStarts[n]===undefined)phaseStarts[n]=phaseStarts[n+1]
  onProgress?.(1)
  return {strokes,totalTicks,phaseStarts,initialError,finalError:lightError(),...(options?{width:W,height:H,guides:options.guides}: {})}
}
interface Cursor {tick:number;index:number;within:number;material:StageMaterialSnapshot}
export class StructuredPainting {
  readonly material:StageMaterial
  readonly totalTicks:number;readonly phaseStarts:number[]
  get phaseNames(){return this.plan.guides?guidedPhases:structuredPhases}
  readonly plan:PortraitPlan
  tick=0;hand:StageHand|null=null;phase=0
  /** Recorded motion follows the active contact, including seek and pause. */
  handProgress=0
  private index=0;private within=0;private checkpoints:Cursor[]=[]
  constructor(plan:PortraitPlan){this.plan=plan;this.material=new StageMaterial(plan.width??W,plan.height??H,SEED,50000);this.totalTicks=plan.totalTicks;this.phaseStarts=plan.phaseStarts;this.checkpoints.push(this.read())}
  get note(){return (this.plan.guides?guidedNotes:structuredNotes)[this.phase]}
  get toolNote(){const s=this.plan.strokes[this.index];if(!s)return '等待落沙。';const names:Record<Region,string>={context:'场景',hair:'头发',coat:this.plan.guides?'主体':'衣身',face:'面部',hands:'双手',cup:this.plan.guides?'物件':'杯子'};return `${names[s.region]} · ${this.within>=s.ticks+6&&rubsAfterStroke(s)?'掌面揉沙':this.within>=s.ticks?'抬手落沙':s.tool==='pour'?'细流添沙':s.tool==='rub'?'掌面揉沙':'指腹收沙'} · 第 ${this.index+1} / ${this.plan.strokes.length} 笔`}
  step(){
    if(this.tick>=this.totalTicks)return false
    const s=this.plan.strokes[this.index];this.hand=null
    if(s){if(!!this.plan.motion)gestureTick(this.material,s,this.within,this.plan.motion);else runTick(this.material,s,this.within);this.phase=s.phase
      if(this.within<s.ticks){const p=!!this.plan.motion?gesturePoint(s,(this.within+1)/s.ticks,this.material.height/this.material.width):at(s.path,(this.within+1)/s.ticks),before=!!this.plan.motion?gesturePoint(s,this.within/s.ticks,this.material.height/this.material.width):at(s.path,this.within/s.ticks);this.handProgress=(this.within+1)/s.ticks;this.hand={...p,pose:s.tool==='pour'?'pour':s.tool==='collect'?'finger':'palm',rotation:Math.atan2(p.y-before.y,p.x-before.x),down:true}}
      else if(this.within>=s.ticks+6&&rubsAfterStroke(s)){const p=at(s.path,.5);this.handProgress=(this.within-s.ticks-5)/4;this.hand={...p,pose:'palm',rotation:0,down:true}}
      this.within++;if(this.within===s.ticks+GAP){this.within=0;this.index++;this.phase=this.plan.strokes[this.index]?.phase??5}
    }else{this.phase=5;this.material.step(PHOTO_STEP,[])}
    this.tick++;if(this.tick%600===0&&!this.checkpoints.some(c=>c.tick===this.tick))this.checkpoints.push(this.read())
    return true
  }
  read():Cursor{return {tick:this.tick,index:this.index,within:this.within,material:this.material.read()}}
  restore(c:Cursor){
    const index=c.index,s=this.plan.strokes[index],start=this.plan.strokes.slice(0,index).reduce((n,p)=>n+p.ticks+GAP,0)
    if(!Number.isInteger(c.tick)||c.tick<0||c.tick>this.totalTicks||!Number.isInteger(index)||index<0||index>this.plan.strokes.length
      ||!Number.isInteger(c.within)||c.within<0||(s?c.within>=s.ticks+GAP||c.tick!==start+c.within:c.within!==0||c.tick<start))throw new Error('单图演出检查点不正确。')
    this.material.restore(c.material);this.tick=c.tick;this.index=index;this.within=c.within;this.phase=s?.phase??5;this.hand=null
  }
  /** 收藏保留当前材料和动作游标，重播仍从空台执行原来的几何动作。 */
  resumeAt(tick:number,snapshot:StageMaterialSnapshot){
    if(snapshot.width!==this.material.width||snapshot.height!==this.material.height)throw new Error('演出和收藏画幅不一致。')
    let index=0,start=0
    while(index<this.plan.strokes.length&&start+this.plan.strokes[index].ticks+GAP<=tick){start+=this.plan.strokes[index].ticks+GAP;index++}
    this.restore({tick,index,within:index<this.plan.strokes.length?tick-start:0,material:snapshot})
    if(tick>0)this.checkpoints.push(this.read())
  }
  rewindTo(tick:number){const to=clamp(Math.floor(tick),0,this.totalTicks);this.restore(this.checkpoints.filter(c=>c.tick<=to).reduce((best,c)=>c.tick>best.tick?c:best));return to}
}
