import type {CupAction} from './cup-score'
import {normalizeShape,type KeepsakeDraft,type KeepsakePlan} from './keepsake-model'

export interface CompositionAction extends CupAction {
  /** 指缝展宽方向和宽高比，作用于供料，非成品遮罩。 */
  angle?:number
  aspect?:number
  fan?:boolean
  endRadius?:number
  /** 收拢后随路径拾沙，区别于只把沙堆留在终点。 */
  pickup?:number
}
export interface CompositionPlan extends KeepsakePlan {actions:CompositionAction[]}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
const curve=(a:number[],b:number[],c:number[],d:number[],count=60)=>Array.from({length:count+1},(_,i)=>{
  const t=i/count,u=1-t;return {x:u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0],y:u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1]}
})
const oval=(x:number,y:number,rx:number,ry:number,from:number,to:number)=>Array.from({length:97},(_,i)=>{const a=from+(to-from)*i/96;return {x:x+Math.cos(a)*rx,y:y+Math.sin(a)*ry}})

/** 几次宽撒与收边构成体积；不遍历照片像素，也不按扫描行显影。 */
export function buildCompositionPlan(d:Pick<KeepsakeDraft,'shape'|'imageWidth'|'imageHeight'>):CompositionPlan {
  const s=normalizeShape(d.shape),ratio=clamp(s.width*d.imageWidth/(s.height*d.imageHeight),.65,1.8)
  const h=clamp(.53/Math.sqrt(ratio),.40,.56),w=clamp(ratio*h*.4/.58,.27,.53)
  const x=.48,top=.50-h*.5,bottom=top+h,lip=h*s.lip*.58,left=x-w*.5,right=x+w*.5
  const footL=x-w*s.taper*.5,footR=x+w*s.taper*.5
  const actions:CompositionAction[]=[
    {name:'轻撒接地灰',note:'一把薄沙托住杯底，背景保持安静。',tool:'pour',seconds:2.0,
      path:curve([x-w*.18,bottom+.023],[x-w*.07,bottom+.045],[x+w*.13,bottom+.035],[x+w*.28,bottom+.022]),
      radius:w*.53,strength:.13,spread:.10,height:.034,angle:0,aspect:.24},
    {name:'整把铺杯身',note:'局部指缝三次弧形落沙，灰面相互叠接。',tool:'pour',seconds:5.9,
      path:[...curve([x-w*.23,top+lip*.9],[x-w*.27,top+h*.35],[x-w*.15,top+h*.66],[x-w*.12,bottom-h*.09]),
        ...curve([x-w*.12,bottom-h*.09],[x+w*.02,top+h*.65],[x+w*.18,top+h*.28],[x+w*.23,top+lip*.9]).slice(1),
        ...curve([x+w*.23,top+lip*.9],[x-w*.05,top+h*.23],[x+w*.05,top+h*.61],[x+w*.08,bottom-h*.05]).slice(1)],
      radius:w*.53,endRadius:w*.49,fan:true,strength:.29,spread:.085,height:.025,angle:0,aspect:.63},
    {name:'侧撒塑体积',note:'右侧叠一把沙，与正面薄沙形成体积。',tool:'pour',seconds:3.0,
      path:curve([right-w*.15,top+lip],[right-w*.12,top+h*.36],[footR-w*.03,bottom-h*.14],[x+w*.15,bottom-h*.06]),
      radius:w*.29,strength:.23,spread:.06,height:.017,angle:Math.PI/2,aspect:.67},
    {name:'收净左外缘',note:'向外推拢余沙，沿途拾起，保留少量碎粒。',tool:'gather',seconds:3.9,
      path:curve([left-w*.18,top-h*.06],[left-w*.19,top+h*.47],[footL-w*.18,bottom+h*.04],[x-w*.10,bottom+h*.16]),
      radius:w*.23,strength:.30,pickup:.11},
    {name:'收净右外缘',note:'整理右侧边界，杯底留下薄薄的接触阴影。',tool:'gather',seconds:3.9,
      path:curve([right+w*.18,top-h*.06],[right+w*.18,top+h*.48],[footR+w*.18,bottom+h*.04],[x+w*.10,bottom+h*.16]),
      radius:w*.23,strength:.30,pickup:.11},
    {name:'拂出杯身光',note:'在已有灰面上轻收一道宽亮面，留下有沙量的明暗过渡。',tool:'gather',seconds:3.3,
      path:curve([x-w*.23,top+lip*1.7],[x-w*.28,top+h*.38],[x-w*.23,top+h*.63],[x-w*.13,bottom-h*.13]),
      radius:w*.135,strength:.027,pickup:.006},
    {name:'落沙成杯内',note:'扁而宽的细流压出杯口深处，杯内有暗面。',tool:'pour',seconds:3.0,
      path:curve([x-w*.065,top-lip*.07],[x-w*.02,top-lip*.19],[x+w*.02,top-lip*.08],[x+w*.055,top]),
      radius:w*.65,strength:.25,spread:.035,height:.012,angle:0,aspect:clamp(lip/(w*.65),.15,.34)},
    {name:'细撒杯口前沿',note:'沿一条弧落少量沙，保留前沿的明暗和不齐整边缘。',tool:'pour',seconds:2.0,
      path:oval(x,top,w*.48,lip,Math.PI,Math.PI*3),radius:w*.020,strength:.040,spread:.035,height:.010},
    {name:'压住杯底',note:'浅弧收尾，让杯底与接地灰相连。',tool:'pour',seconds:1.7,
      path:curve([footL+w*.01,bottom-h*.075],[x-w*.23,bottom+h*.005],[x+w*.23,bottom+h*.005],[footR-w*.01,bottom-h*.075]),
      radius:w*.036,strength:.075,spread:.035,height:.014},
  ]
  actions.splice(6,0,{name:'补齐杯身侧沿',note:'少量细沙沿杯身连到杯底，让轮廓与灰面衔接。',tool:'pour',seconds:2.6,
    path:[...curve([left+w*.015,top+lip*.85],[left+w*.015,top+h*.43],[footL,bottom-h*.05],[x,bottom-h*.015]),
      ...curve([x,bottom-h*.015],[footR,bottom-h*.04],[right-w*.02,top+h*.46],[right-w*.015,top+lip*.85]).slice(1)],
    radius:w*.032,strength:.050,spread:.035,height:.012})
  if(s.handle!=='none'){
    const side=s.handle==='right'?1:-1,edge=x+side*w*.48,size=w*.34*s.handleSize
    actions.splice(7,0,{name:'弯撒杯把',note:'一笔弯撒与杯身相接，杯把内侧透光。',tool:'pour',seconds:2.6,
      path:curve([edge,top+h*.19],[edge+side*size,top+h*.02],[edge+side*size,top+h*.76],[x+side*w*s.taper*.47,top+h*.72]),
      radius:w*.045,strength:.13,spread:.04,height:.016})
  }
  if(s.saucer)actions.push({name:'落沙成碟',note:'浅弧托碟与接地灰连起来。',tool:'pour',seconds:2.2,
    path:oval(x,bottom+.034,w*.68,h*.095,Math.PI*.02,Math.PI*1.98),radius:w*.03,strength:.070,spread:.04,height:.012})
  const scale=33/actions.reduce((n,a)=>n+a.seconds,0),starts=[240]
  const areaScale=(h*w)/(.36*.355)
  for(const a of actions){const ticks=Math.round(a.seconds*scale*60);if(a.tool==='pour')a.strength*=areaScale;a.seconds=ticks/60;starts.push(starts.at(-1)!+ticks)}
  return {actions,starts,ticks:2700,intro:240,outro:2340}
}
