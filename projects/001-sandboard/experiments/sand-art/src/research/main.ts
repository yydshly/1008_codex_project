import './style.css'
import './overview'
import catalog from './catalog.json'
import comparisons from './comparisons.json'
import versionRecords from './version-records.json'
import {media} from './media'

type Attempt=(typeof catalog)[number]
const get=<E extends HTMLElement>(id:string)=>document.getElementById(id) as E
const groups:Record<string,string>={foundation:'基础与舞台',photo:'照片作品',hands:'手部与接触',motion:'无手演出',keepsake:'纪念短片'}
const label=(entry:Attempt)=>entry.versions.length===1?'v'+entry.versions[0]:'v'+entry.versions[0]+'–v'+entry.versions.at(-1)
const record=(entry:Attempt)=>'../research-records/'+entry.id+'.md'
const versionRecord=(version:number)=>'../research-records/'+(versionRecords as Record<string,{record:string}>)[String(version)].record
const supplementalKinds:Record<string,string>={
  'art-direction-v8/atelier-preview-v8.jpg':'AI 目标在网页中的展示 · 不是材料成品',
  'photo-portrait-v13/style-preview.png':'照片风格预览 · 不是实际演出成品',
}
const escapes:Record<string,string>={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}
const escape=(value:string)=>value.replace(/[&<>"']/g,char=>escapes[char])
const notes:Record<string,string>={v5:'v6 · 20 秒完整山月演示，有限三把沙预算，带程序手形提示。',v18:'v19 · 10 秒生成手部与数字沙合成，展示低手细流、停沙与抬手散撒。手部纹理为 AI 生成。',v20:'v20 · 20 秒三维接触小样。保存录像属于当时版本，现演示入口已迭代。',v22:'v23 · 24 秒台上取沙、翻掌握持、细漏与散漏完整小样。不是实拍。',v24:'v24 · 12 秒无手芦苇完整小样，观察画外落沙与材料形成。',v25:'v25 · 完整雨窗无手照片过程录像，输入为 AI 虚构照片，仍有碎笔与模糊。',v29:'v29 · 单笔收沙慢动作片段，观察已有沙的贴台移出；不是完整成画影片。',v30:'v30 · 细部撒沙片段，观察沿形供料与渐变力度；不是约 468 秒完整演出。',v31:'v31 · 30 秒茶杯九动作完整小样，推拢、停驻与拾起使用同一沙层。',v34:'v34 · 45 秒纪念短片完整录像，包含实际沙层过程、故事字幕与结尾赠言。',v36:'v36 · 45 秒局部推拢版完整录像，先聚堆、停驻，再拾起。成品仍未通过真实沙画目标。'}
get<HTMLImageElement>('hero-image').src=media['photo-structure-v14/performance.png']
get<HTMLImageElement>('hold-image').src=media['keepsake-handwork-v36/film-hold.jpg']
get<HTMLImageElement>('after-image').src=media['keepsake-handwork-v36/film-after.jpg']

let group='all',query='',selected:Attempt|undefined,imageIndex=0
function renderAttempts(){
  const word=query.trim().toLowerCase()
  const matches=catalog.filter(entry=>(group==='all'||group===entry.group)&&[entry.title,entry.goal,entry.change,entry.result,entry.lesson,...entry.versions.map(v=>'v'+v)].join(' ').toLowerCase().includes(word))
  get('attempt-grid').innerHTML=matches.map(entry=>`<article class="attempt-card" id="${entry.id}"><button class="card-image" data-open="${entry.id}" aria-label="查看 ${escape(label(entry)+' '+entry.title)}"><img src="${media[entry.image]}" loading="lazy" width="1536" height="1024" alt="${escape(label(entry)+' '+entry.title+'，'+entry.kind)}"><span>${escape(entry.kind)}</span></button><div class="card-body"><p class="card-meta"><span>${label(entry)}</span><span>${groups[entry.group]}</span></p><h3>${escape(entry.title)}</h3><p>${escape(entry.result)}</p><button class="text-button" data-open="${entry.id}">展开尝试与理解 <span>↗</span></button></div></article>`).join('')
  get('result-count').textContent='显示 '+matches.length+' / '+catalog.length+' 项尝试 · 记录覆盖 v1–v36'
  get('empty-results').hidden=matches.length>0
  get('clear-filters').hidden=group==='all'&&!query
  document.querySelectorAll<HTMLButtonElement>('[data-group]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.group===group)))
}
get('search').addEventListener('input',()=>{query=get<HTMLInputElement>('search').value;renderAttempts()})
document.querySelectorAll<HTMLButtonElement>('[data-group]').forEach(button=>button.addEventListener('click',()=>{group=button.dataset.group!;renderAttempts()}))
get('clear-filters').addEventListener('click',()=>{group='all';query='';get<HTMLInputElement>('search').value='';renderAttempts()})
get('version-rows').innerHTML=catalog.flatMap(entry=>entry.versions.map(version=>`<tr><th>v${version}</th><td>${groups[entry.group]}</td><td><button class="text-button" data-open="${entry.id}">${escape(entry.title)}</button></td><td><a href="${versionRecord(version)}">记录 ↗</a></td></tr>`)).join('')

const dialog=get<HTMLDialogElement>('detail-dialog')
function renderDetailImage(){
  if(!selected)return
  const images=[selected.image,...selected.extra],path=images[imageIndex],image=get<HTMLImageElement>('detail-image')
  image.src=media[path];image.alt=label(selected)+' '+selected.title+' · 保存图 '+(imageIndex+1)
  get('image-count').textContent=(imageIndex+1)+' / '+images.length
  get('detail-kind').textContent=imageIndex===0?selected.kind:(supplementalKinds[path]??'实际网页截图 / 过程或补充效果')
  get<HTMLButtonElement>('previous-image').disabled=images.length<2
  get<HTMLButtonElement>('next-image').disabled=images.length<2
}
function showDetail(id:string){
  const entry=catalog.find(item=>item.id===id);if(!entry)return
  selected=entry;imageIndex=0
  get('detail-version').textContent=label(entry)+' / '+groups[entry.group]
  get('detail-title').textContent=entry.title
  for(const key of ['goal','change','result','lesson'] as const)get('detail-'+key).textContent=entry[key]
  const demo=get<HTMLAnchorElement>('detail-demo');demo.hidden=!entry.demo;if(entry.demo)demo.href=entry.demo
  get<HTMLAnchorElement>('detail-record').href=record(entry)
  get('detail-video').hidden=!entry.video
  get('detail-provenance').textContent=entry.group==='hands'?'手部来源与试验范围见原始记录。v16/v17 为带署名的实拍素材派生合成，v18/v19 为生成纹理，v20–v23 为三维实验。':entry.group==='photo'||entry.group==='motion'?'照片示例来自此前 AI 虚构输入；图像是所标版本的转换或材料输出，未使用真实用户照片作为质量验收。':'素材类型按图注标明；AI 目标、过程截图与实际成品分别保留。'
  renderDetailImage();dialog.showModal()
}
document.addEventListener('click',event=>{const target=(event.target as Element).closest<HTMLButtonElement>('[data-open]');if(target)showDetail(target.dataset.open!)})
get('previous-image').addEventListener('click',()=>{if(selected){imageIndex=(imageIndex+selected.extra.length)%(selected.extra.length+1);renderDetailImage()}})
get('next-image').addEventListener('click',()=>{if(selected){imageIndex=(imageIndex+1)%(selected.extra.length+1);renderDetailImage()}})
dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return
  const bounds=dialog.getBoundingClientRect()
  if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close()
})

function setCompare(id:string){
  const item=comparisons.find(entry=>entry.id===id)??comparisons[0]
  const left=get<HTMLImageElement>('compare-left'),right=get<HTMLImageElement>('compare-right')
  left.src=media[item.left];left.alt=item.leftLabel;right.src=media[item.right];right.alt=item.rightLabel
  get('compare-label-left').textContent=item.leftLabel;get('compare-label-right').textContent=item.rightLabel
  get('compare-note').textContent=item.note
  get<HTMLInputElement>('compare-range').value='50';updateDivider()
  document.querySelectorAll<HTMLButtonElement>('[data-compare]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.compare===item.id)))
}
function updateDivider(){const value=get<HTMLInputElement>('compare-range').value;get('compare-overlay').style.clipPath=`inset(0 ${100-Number(value)}% 0 0)`;get('compare-line').style.left=value+'%';get('compare-output').textContent=value+'%'}
get('compare-range').addEventListener('input',updateDivider)
document.querySelectorAll<HTMLButtonElement>('[data-compare]').forEach(button=>button.addEventListener('click',()=>setCompare(button.dataset.compare!)))

const video=get<HTMLVideoElement>('archive-video'),videoEntries=catalog.filter(entry=>entry.video)
get('video-list').innerHTML=videoEntries.map(entry=>`<button data-video="${entry.id}" aria-pressed="false"><span>${escape(label(entry))}</span><strong>${escape(entry.title)}</strong><small>${escape(notes[entry.id])}</small></button>`).join('')
function loadVideo(id:string){
  const entry=catalog.find(item=>item.id===id);if(!entry?.video)return
  video.pause();video.src=media[entry.video];video.poster=media[entry.image];video.hidden=false;video.load()
  get('video-empty').hidden=true;get('video-title').textContent=label(entry)+' · '+entry.title;get('video-note').textContent=notes[entry.id]
  const link=get<HTMLAnchorElement>('video-download');link.href=media[entry.video];link.download=entry.id+'-'+entry.video.split('/').at(-1);link.hidden=false
  document.querySelectorAll<HTMLButtonElement>('[data-video]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.video===id)))
}
get('video-list').addEventListener('click',event=>{const button=(event.target as Element).closest<HTMLButtonElement>('[data-video]');if(button)loadVideo(button.dataset.video!)})
get('detail-video').addEventListener('click',()=>{if(selected){loadVideo(selected.id);dialog.close();get('process').scrollIntoView({behavior:'auto',block:'start'})}})
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause()})
video.addEventListener('error',()=>{get('video-note').textContent='这段视频未能加载或浏览器不支持其编码。可以下载原文件查看；其他归档仍可浏览。'})
renderAttempts();setCompare('photo')
