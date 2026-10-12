import type {CupAction} from './cup-score'
import {CUP_ACTIONS} from './cup-score'

export interface ObjectShape {
  x:number; y:number; width:number; height:number
  taper:number; lip:number; handle:'none'|'left'|'right'; handleSize:number; saucer:boolean
}
export interface KeepsakeDraft {
  version:1
  title:string; recipient:string; story:string; dedication:string
  mood:'warm'|'quiet'; sourceKind:'sample'|'upload'; photo:string
  imageWidth:number; imageHeight:number; shape:ObjectShape
}
export interface KeepsakePlan {actions:CupAction[]; starts:number[]; ticks:number; intro:number; outro:number}
export const FILM_DT=1/60
export const FILM_TICKS=2700
export const DEFAULT_SHAPE:ObjectShape={x:.29,y:.25,width:.36,height:.48,taper:.76,lip:.17,handle:'right',handleSize:1,saucer:true}
export const SAMPLE_SHAPE:ObjectShape={x:.542,y:.519,width:.088,height:.092,taper:.84,lip:.11,handle:'none',handleSize:1,saucer:false}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
export function normalizeShape(s:ObjectShape):ObjectShape {
  const width=clamp(s.width,.035,.9),height=clamp(s.height,.035,.9)
  return {...s,width,height,x:clamp(s.x,0,1-width),y:clamp(s.y,0,1-height),
    taper:clamp(s.taper,.45,1),lip:clamp(s.lip,.05,.32),handleSize:clamp(s.handleSize,.6,1.35)}
}
export function validateDraft(value:unknown):KeepsakeDraft {
  if(!value||typeof value!=='object')throw new Error('工程格式不正确。')
  const d=value as KeepsakeDraft,s=d.shape
  if(d.version!==1||!s||!['warm','quiet'].includes(d.mood)||!['sample','upload'].includes(d.sourceKind))
    throw new Error('无法识别这个纪念短片工程。')
  for(const [text,max] of [[d.title,36],[d.recipient,28],[d.story,240],[d.dedication,80]] as const)
    if(typeof text!=='string'||text.length>max)throw new Error('文字格式或长度不符合要求。')
  if(typeof d.photo!=='string'||d.photo.length>8_000_000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(d.photo))
    throw new Error('工程照片格式不正确。')
  if(![d.imageWidth,d.imageHeight].every(v=>Number.isInteger(v)&&v>0&&v<=4096))throw new Error('照片尺寸不正确。')
  if(![s.x,s.y,s.width,s.height,s.taper,s.lip,s.handleSize].every(Number.isFinite)||typeof s.saucer!=='boolean'||!['none','left','right'].includes(s.handle))
    throw new Error('杯子构图参数不正确。')
  const shape=normalizeShape(s)
  if(Object.keys(shape).some(k=>shape[k as keyof ObjectShape]!==s[k as keyof ObjectShape]))throw new Error('杯子构图超出照片范围。')
  return {...d,shape:{...shape}}
}

/** 照片中用户确认的杯身比例驱动模板；照片像素不进入材料或渲染器。 */
export function buildKeepsakePlan(d:Pick<KeepsakeDraft,'shape'|'imageWidth'|'imageHeight'>):KeepsakePlan {
  const s=normalizeShape(d.shape)
  const aspect=s.width*d.imageWidth/(s.height*d.imageHeight)
  const height=clamp(.40/Math.sqrt(clamp(aspect,.65,1.8)),.30,.45)
  const width=clamp(aspect*height*.4/.58,.20,.38)
  const top=.52-height*.5,bottom=top+height,center=.46
  const areaScale=(width/.256)*(height/.26)
  const selected=CUP_ACTIONS.filter((_,i)=>(i!==5||s.handle!=='none')&&(i<7||s.saucer))
  const stretch=33/selected.reduce((sum,a)=>sum+a.seconds,0)
  const actions=selected.map(a=>{
    const index=CUP_ACTIONS.indexOf(a),isHandle=index===5
    const path=a.path.map(p=>{
      const v=clamp((p.y-.422)/.26,0,1),bodyScale=1-(1-s.taper)*v
      let x=center+(p.x-.50)/.256*width*(index===1||index===2||index===6?bodyScale:1)
      if(isHandle){x=center+width*.5+(x-center-width*.5)*s.handleSize;if(s.handle==='left')x=2*center-x}
      let y=top+(p.y-.422)/.26*height
      if(index===3||index===4)y=top+(p.y-.422)/.047*(height*s.lip*.5)
      if(index===7||index===8)y=bottom+.045+(p.y-.715)/.054*.045
      return {x:clamp(x,.08,.90),y:clamp(y,.08,.90)}
    })
    const seconds=Math.round(a.seconds*stretch*60)/60
    const oldActive=a.seconds-(a.tool==='gather'?1:.3),newActive=seconds-(a.tool==='gather'?1:.3)
    const radius=index===4?Math.min(a.radius*width/.256,height*s.lip*.20*2/3):a.radius*width/.256
    return {...a,path,seconds,radius,
      strength:a.tool==='pour'?a.strength*oldActive/newActive*areaScale:a.strength}
  })
  const starts=actions.reduce<number[]>((list,a)=>[...list,list.at(-1)!+Math.round(a.seconds*60)],[240])
  return {actions,starts,ticks:FILM_TICKS,intro:240,outro:2340}
}
export function storyLines(story:string):string[] {
  const clean=story.trim()
  if(!clean)return ['一件旧物，留住一段时光。']
  const parts=clean.match(/[^。！？!?\n]+[。！？!?]?/g)||[clean]
  const grouped=parts.map(p=>p.trim()).filter(Boolean).flatMap(p=>{
    const chars=Array.from(p),lines:string[]=[]
    for(let i=0;i<chars.length;i+=30)lines.push(chars.slice(i,i+30).join(''))
    return lines
  })
  if(grouped.length<=8)return grouped
  // 短句很多时合并分段，不能为了限制字幕段数丢掉用户故事。
  const chars=Array.from(clean.replace(/\n/g,' ')),lines:string[]=[]
  for(let i=0;i<chars.length;i+=30)lines.push(chars.slice(i,i+30).join(''))
  return lines
}
export function escapeHTML(text:string):string {
  return text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
}
