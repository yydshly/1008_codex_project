import {escapeHTML,storyLines,type KeepsakeDraft,FILM_TICKS} from './keepsake-model'
export const FILM_WIDTH=1920,FILM_HEIGHT=1080
const font='"PingFang SC","Microsoft YaHei",sans-serif'
function wrap(ctx:CanvasRenderingContext2D,text:string,width:number):string[]{
  const lines:string[]=[];let line=''
  for(const char of Array.from(text)){if(ctx.measureText(line+char).width>width&&line){lines.push(line);line=char}else line+=char}
  if(line)lines.push(line);return lines
}
export function paintFilm(ctx:CanvasRenderingContext2D,sand:HTMLCanvasElement,d:KeepsakeDraft,tick:number){
  const dark=d.mood==='quiet',bg=dark?'#19221e':'#f4f0e7',ink=dark?'#eee4cd':'#343a2f',muted=dark?'#a3af9f':'#78806d'
  ctx.fillStyle=bg;ctx.fillRect(0,0,FILM_WIDTH,FILM_HEIGHT)
  ctx.textAlign='center';ctx.textBaseline='middle'
  const seconds=tick/60
  if(tick<240){
    const alpha=Math.min(1,seconds/.65,(4-seconds)/.45)
    ctx.globalAlpha=Math.max(0,alpha);ctx.fillStyle=muted;ctx.font='24px '+font
    ctx.fillText('光 阴 沙 画  /  一 件 旧 物，一 段 时 光',960,335)
    ctx.fillStyle=ink;ctx.font='58px '+font
    const title=wrap(ctx,d.title||'留在时光里',1300)
    title.slice(0,2).forEach((line,i)=>ctx.fillText(line,960,475+i*78))
    ctx.fillStyle=muted;ctx.font='30px '+font;ctx.fillText(d.recipient?'献给 '+d.recipient:'献给值得记住的人',960,660)
    ctx.globalAlpha=1;return
  }
  // 沙台始终来自同一实际 WebGL 材料，不贴照片或成品。
  ctx.drawImage(sand,324,46,1272,848)
  ctx.fillStyle=muted;ctx.font='20px '+font;ctx.textAlign='left';ctx.fillText('光阴沙画 · 纪念物',84,65)
  ctx.textAlign='right';ctx.fillText(d.title||'留在时光里',1836,65)
  ctx.textAlign='center';ctx.fillStyle=ink
  if(tick<2340){
    const lines=storyLines(d.story),index=Math.min(lines.length-1,Math.floor((seconds-4)/35*lines.length))
    const duration=35/lines.length,local=(seconds-4)%duration
    ctx.globalAlpha=Math.min(1,local/.35,(duration-local)/.35);ctx.font='34px '+font
    ctx.fillText(lines[index],960,984);ctx.globalAlpha=1
  }else{
    ctx.font='34px '+font
    wrap(ctx,d.dedication||'愿这段时光，一直留在心里。',1600).slice(0,2).forEach((line,i)=>ctx.fillText(line,960,949+i*49))
    ctx.fillStyle=muted;ctx.font='22px '+font;ctx.fillText(d.recipient?'献给 '+d.recipient:'献给值得记住的人',960,1050)
  }
  if(tick>FILM_TICKS-30){ctx.fillStyle=bg;ctx.globalAlpha=(tick-(FILM_TICKS-30))/30*.08;ctx.fillRect(0,0,1920,1080);ctx.globalAlpha=1}
}
export async function giftHTML(d:KeepsakeDraft,video:Blob,poster:string,includePhoto=false):Promise<string>{
  if(!['video/webm','video/mp4'].includes(video.type)||video.size>120_000_000)throw new Error('视频格式不支持或文件过大。')
  if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(poster))throw new Error('海报格式不正确。')
  const buffer=new Uint8Array(await video.arrayBuffer()),parts:string[]=[]
  for(let i=0;i<buffer.length;i+=16384)parts.push(String.fromCharCode(...buffer.subarray(i,i+16384)))
  const src='data:'+video.type+';base64,'+btoa(parts.join(''))
  return '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHTML(d.title)+'</title><style>body{margin:0;background:#f4f0e7;color:#343a2f;font-family:system-ui,sans-serif}main{max-width:960px;margin:48px auto;padding:24px}small{color:#78806d;letter-spacing:.1em}h1{font-weight:500}p{line-height:1.9;white-space:pre-wrap}video,img{width:100%;border-radius:6px}footer{margin-top:36px;font-size:12px;color:#78806d}</style></head><body><main><small>光阴沙画 · 纪念短片</small><h1>'+escapeHTML(d.title)+'</h1><p>'+escapeHTML(d.recipient?'献给 '+d.recipient:'')+'</p><video controls playsinline preload="metadata" poster="'+poster+'" src="'+src+'"></video><p>'+escapeHTML(d.story)+'</p><p>'+escapeHTML(d.dedication)+'</p>'+(includePhoto?'<details><summary>我们的原照片</summary><img alt="纪念物参考照片" src="'+d.photo+'"></details>':'')+'<footer>数字沙画纪念短片 · 此网页可离线观看</footer></main></body></html>'
}
