import type {CupAction} from './cup-score'
import {normalizeShape,type KeepsakeDraft,type KeepsakePlan} from './keepsake-model'

export interface HandworkAction extends CupAction {
  angle?:number
  aspect?:number
  fan?:boolean
  endRadius?:number
  pickup?:number
  /** 宽掌接触的横向宽度与纵向厚度。只作用于工具，不限制成品像素。 */
  carveAspect?:number
  profile?:'bowl'
}
export interface HandworkPlan extends KeepsakePlan {actions:HandworkAction[]}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
const curve=(a:number[],b:number[],c:number[],d:number[])=>Array.from({length:61},(_,i)=>{
  const t=i/60,u=1-t;return {x:u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0],y:u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1]}
})
const oval=(x:number,y:number,rx:number,ry:number,from:number,to:number)=>Array.from({length:97},(_,i)=>{const a=from+(to-from)*i/96;return {x:x+Math.cos(a)*rx,y:y+Math.sin(a)*ry}})

/** 灯台上的负形雕刻：先铺已有沙，再推开透光处。没有目标纹理、逐行显影或结尾换图。 */
export function buildHandworkPlan(d:Pick<KeepsakeDraft,'shape'|'imageWidth'|'imageHeight'>):HandworkPlan {
  const s=normalizeShape(d.shape),ratio=clamp(s.width*d.imageWidth/(s.height*d.imageHeight),.65,1.8)
  const h=clamp(.43/Math.sqrt(ratio),.31,.45),w=clamp(ratio*h*.4/.58,.27,.43)
  const x=.50,top=.54-h*.5,bottom=top+h,lip=h*s.lip*.62
  const actions:HandworkAction[]=[
    {name:'落下第一把沙',note:'近台的松散沙团先形成浓淡不一的底层。',tool:'pour',seconds:3.6,
      path:curve([x-w*.65,top-h*.16],[x-w*.42,top+h*.2],[x-w*.50,bottom+h*.28],[x-w*.32,bottom+h*.33]),
      radius:w*.78,strength:1.2,spread:.13,height:.05,angle:0,aspect:.66},
    {name:'续撒另一把沙',note:'另一把沙叠到右侧，边缘保留自然散落。',tool:'pour',seconds:3.8,
      path:curve([x+w*.55,top-h*.12],[x+w*.62,top+h*.22],[x+w*.50,bottom+h*.28],[x+w*.28,bottom+h*.33]),
      radius:w*.74,strength:1.3,spread:.13,height:.043,angle:0,aspect:.72},
    {name:'横撒台面余沙',note:'一道低落沙把两侧厚沙连接起来。',tool:'pour',seconds:2.7,
      path:curve([x-w*.4,bottom+h*.08],[x-w*.15,bottom+h*.22],[x+w*.19,bottom+h*.21],[x+w*.42,bottom+h*.05]),
      radius:w*.59,strength:.8,spread:.11,height:.031,angle:0,aspect:.32},
    {name:'散撒杯上薄沙',note:'指缝松开一把薄沙，让热气随后能从薄沙中透出来。',tool:'pour',seconds:2.1,
      path:curve([x-w*.18,top-h*.38],[x-w*.10,top-h*.47],[x+w*.14,top-h*.34],[x+w*.21,top-h*.39]),
      radius:w*.65,strength:.30,spread:.14,height:.045,angle:0,aspect:.66},
    {name:'拇指推开左亮面',note:'先推左侧一片弯曲亮面，前缘沙堆向杯底滚动，停下再收。',tool:'gather',seconds:3.0,
      path:curve([x-w*.18,top+h*.20],[x-w*.28,top+h*.35],[x-w*.18,top+h*.60],[x-w*.10,bottom-h*.17]),
      radius:w*.24,endRadius:w*(.10+s.taper*.10),carveAspect:.48,strength:.72,pickup:.80},
    {name:'掌侧推开右亮面',note:'从杯底向上反向推拢，局部留白与左侧逐步连起来。',tool:'gather',seconds:3.0,
      path:curve([x+w*.12,bottom-h*.17],[x+w*.28,top+h*.59],[x+w*.26,top+h*.33],[x+w*.16,top+h*.20]),
      radius:w*(.10+s.taper*.10),endRadius:w*.25,carveAspect:.48,strength:.75,pickup:.82},
    {name:'指腹连出杯身',note:'一笔斜弧推开中部余沙，留下薄沙与两次推拢交接的指痕。',tool:'gather',seconds:2.8,
      path:curve([x-w*.025,top+h*.20],[x-w*.045,top+h*.43],[x+w*.075,top+h*.57],[x+w*.02,bottom-h*.22]),
      radius:w*.26,endRadius:w*(.15+s.taper*.11),carveAspect:.48,strength:.60,pickup:.70},
    {name:'指腹勾出杯口',note:'从杯内侧推开一条透光弧，余沙留成不齐整的杯沿。',tool:'gather',seconds:3.8,
      path:oval(x,top,w*.43,lip,Math.PI*.07,Math.PI*1.93),radius:w*.021,carveAspect:.52,strength:.70,pickup:.80},
    {name:'捻沙落下茶面',note:'少量细沙落在杯内，茶面保持暗，亮口保持透光。',tool:'pour',seconds:2.3,
      path:curve([x-w*.08,top],[x-w*.04,top-lip*.08],[x+w*.04,top-lip*.06],[x+w*.08,top]),
      radius:w*.72,aspect:clamp(lip/(w*.72),.12,.30),angle:0,strength:.20,spread:.025,height:.011},
    {name:'细撒杯沿前弧',note:'一小撮细沙连出杯口前沿，保留自然断续的粒痕。',tool:'pour',seconds:1.5,
      path:oval(x,top,w*.44,lip*.82,Math.PI*.03,Math.PI*.95),radius:w*.012,strength:.052,spread:.035,height:.010},
    {name:'侧掌收出杯底',note:'一笔推开杯底的灯光，沙量停在下方形成托住杯子的暗带。',tool:'gather',seconds:3.8,
      path:curve([x-w*.50,bottom+h*.22],[x-w*.20,bottom+h*.20],[x+w*.23,bottom+h*.24],[x+w*.55,bottom+h*.22]),
      radius:w*.018,strength:.70,pickup:.80,carveAspect:.50},
    {name:'指尖拂出热气',note:'在剩余薄沙中推开一条轻弯，表现热茶的气息。',tool:'gather',seconds:3.6,
      path:curve([x-w*.11,top-h*.12],[x-w*.27,top-h*.31],[x+w*.15,top-h*.40],[x-w*.06,top-h*.66]),
      radius:w*.029,endRadius:w*.014,strength:.65,pickup:.75,carveAspect:.50},
    {name:'捻下杯侧余粒',note:'最后一小撮沙留在杯侧，亮面不是全无沙粒的剪纸。',tool:'pour',seconds:1.6,
      path:curve([x-w*.27,top+h*.14],[x-w*.25,top+h*.29],[x-w*.21,top+h*.42],[x-w*.15,top+h*.52]),
      radius:w*.13,endRadius:w*.075,strength:.020,spread:.10,height:.019,angle:Math.PI/2,aspect:.40},
  ]
  if(s.handle!=='none'){
    const side=s.handle==='right'?1:-1,edge=x+side*w*.44,size=w*.31*s.handleSize
    actions.splice(9,0,{name:'勾出透光杯把',note:'弯指推开杯把轮廓，弧外仍留厚沙。',tool:'gather',seconds:3.0,
      path:curve([edge,top+h*.20],[edge+side*size,top+h*.04],[edge+side*size,top+h*.74],[x+side*w*s.taper*.44,top+h*.72]),
      radius:w*.040,strength:.65,pickup:.80})
  }
  if(s.saucer)actions.push({name:'推开托碟亮弧',note:'指腹扫出托碟，留下沙的边缘。',tool:'gather',seconds:2.7,
    path:oval(x,bottom+h*.12,w*.67,h*.08,Math.PI*.02,Math.PI*1.98),radius:w*.022,strength:.65,pickup:.80})
  const scale=33/actions.reduce((n,a)=>n+a.seconds,0),starts=[240]
  const areaScale=h*w/(.34*.35)
  for(const a of actions){const ticks=Math.round(a.seconds*scale*60);if(a.tool==='pour')a.strength*=areaScale;a.seconds=ticks/60;starts.push(starts.at(-1)!+ticks)}
  return {actions,starts,ticks:2700,intro:240,outro:2340}
}

