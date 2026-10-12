import type {CupAction} from './cup-score'
import {normalizeShape,type KeepsakeDraft,type KeepsakePlan} from './keepsake-model'

export interface SandlightAction extends CupAction {
  angle?:number
  aspect?:number
  fan?:boolean
  endRadius?:number
  pickup?:number
  /** 宽掌接触的横向宽度与纵向厚度。只作用于工具，不限制成品像素。 */
  carveAspect?:number
  profile?:'bowl'
}
export interface SandlightPlan extends KeepsakePlan {actions:SandlightAction[]}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
const curve=(a:number[],b:number[],c:number[],d:number[])=>Array.from({length:61},(_,i)=>{
  const t=i/60,u=1-t;return {x:u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0],y:u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1]}
})
const oval=(x:number,y:number,rx:number,ry:number,from:number,to:number)=>Array.from({length:97},(_,i)=>{const a=from+(to-from)*i/96;return {x:x+Math.cos(a)*rx,y:y+Math.sin(a)*ry}})

/** 灯台上的负形雕刻：先铺已有沙，再推开透光处。没有目标纹理、逐行显影或结尾换图。 */
export function buildSandlightPlan(d:Pick<KeepsakeDraft,'shape'|'imageWidth'|'imageHeight'>):SandlightPlan {
  const s=normalizeShape(d.shape),ratio=clamp(s.width*d.imageWidth/(s.height*d.imageHeight),.65,1.8)
  const h=clamp(.43/Math.sqrt(ratio),.31,.45),w=clamp(ratio*h*.4/.58,.27,.43)
  const x=.50,top=.54-h*.5,bottom=top+h,lip=h*s.lip*.62
  const actions:SandlightAction[]=[
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
    {name:'掌缘推开杯身',note:'在厚沙上推开一整片亮面，两侧保留被挤开的沙脊。',tool:'gather',seconds:5.0,
      path:curve([x-.006,top+lip*1.8],[x-.004,top+h*.33],[x+.004,top+h*.66],[x+.003,bottom-h*.10]),
      radius:w*.46,endRadius:w*(.16+s.taper*.19),profile:'bowl',carveAspect:.30,strength:.15,pickup:.36},
    {name:'指腹勾出杯口',note:'从杯内侧推开一条透光弧，余沙留成不齐整的杯沿。',tool:'gather',seconds:3.8,
      path:oval(x,top,w*.47,lip,Math.PI*.98,Math.PI*2.99),radius:w*.021,carveAspect:1,strength:.22,pickup:.6},
    {name:'捻沙落下茶面',note:'少量细沙落在杯内，茶面保持暗，亮口保持透光。',tool:'pour',seconds:2.3,
      path:curve([x-w*.08,top],[x-w*.04,top-lip*.08],[x+w*.04,top-lip*.06],[x+w*.08,top]),
      radius:w*.72,aspect:clamp(lip/(w*.72),.12,.30),angle:0,strength:.20,spread:.025,height:.011},
    {name:'侧掌收出杯底',note:'一笔推开杯底的灯光，沙量停在下方形成托住杯子的暗带。',tool:'gather',seconds:3.8,
      path:curve([x-w*.50,bottom+h*.22],[x-w*.20,bottom+h*.20],[x+w*.23,bottom+h*.24],[x+w*.55,bottom+h*.22]),
      radius:w*.018,strength:.2,pickup:.48,carveAspect:.75},
    {name:'指尖拂出热气',note:'在剩余薄沙中推开一条轻弯，表现热茶的气息。',tool:'gather',seconds:3.6,
      path:curve([x-w*.11,top-h*.12],[x-w*.27,top-h*.31],[x+w*.15,top-h*.40],[x-w*.06,top-h*.66]),
      radius:w*.029,endRadius:w*.014,strength:.12,pickup:.45,carveAspect:.78},
    {name:'捻下杯侧余粒',note:'最后一小撮沙留在杯侧，亮面不是全无沙粒的剪纸。',tool:'pour',seconds:1.6,
      path:curve([x-w*.27,top+h*.14],[x-w*.25,top+h*.29],[x-w*.21,top+h*.42],[x-w*.15,top+h*.52]),
      radius:w*.17,endRadius:w*.11,strength:.065,spread:.10,height:.019,angle:Math.PI/2,aspect:.40},
  ]
  if(s.handle!=='none'){
    const side=s.handle==='right'?1:-1,edge=x+side*w*.44,size=w*.31*s.handleSize
    actions.splice(7,0,{name:'勾出透光杯把',note:'弯指推开杯把轮廓，弧外仍留厚沙。',tool:'gather',seconds:3.0,
      path:curve([edge,top+h*.20],[edge+side*size,top+h*.04],[edge+side*size,top+h*.74],[x+side*w*s.taper*.44,top+h*.72]),
      radius:w*.040,strength:.18,pickup:.55})
  }
  if(s.saucer)actions.push({name:'推开托碟亮弧',note:'指腹扫出托碟，留下沙的边缘。',tool:'gather',seconds:2.7,
    path:oval(x,bottom+h*.12,w*.67,h*.08,Math.PI*.02,Math.PI*1.98),radius:w*.022,strength:.15,pickup:.5})
  const scale=33/actions.reduce((n,a)=>n+a.seconds,0),starts=[240]
  const areaScale=h*w/(.34*.35)
  for(const a of actions){const ticks=Math.round(a.seconds*scale*60);if(a.tool==='pour')a.strength*=areaScale;a.seconds=ticks/60;starts.push(starts.at(-1)!+ticks)}
  return {actions,starts,ticks:2700,intro:240,outro:2340}
}
