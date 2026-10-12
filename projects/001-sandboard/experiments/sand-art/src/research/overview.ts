import preview from '../../../../assets/understanding/preview.jpg?url'
import full from '../../../../assets/understanding/overview.png?url'
import text from '../../../../assets/understanding/content.txt?url'
import layout from '../../../../assets/understanding/layout.json'

const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T
const dialog=get<HTMLDialogElement>('overview-dialog')
const stage=get('overview-pan')
const image=get<HTMLImageElement>('overview-full')
const status=get('overview-status')
const width=layout.width
let zoom=1,pointer:number|undefined,startX=0,startY=0,scrollX=0,scrollY=0

get<HTMLImageElement>('overview-preview').src=preview
for(const link of document.querySelectorAll<HTMLAnchorElement>('[data-overview-download]'))link.href=full
get<HTMLAnchorElement>('overview-text').href=text
get('overview-sections').innerHTML=layout.sections.map((item,index)=>`<button data-overview-section="${index}">${String(index+1).padStart(2,'0')} ${item.title.split('：')[0]}</button>`).join('')

function resize(value:number){
  const previous=zoom
  const centerX=(stage.scrollLeft+stage.clientWidth/2)/previous
  const centerY=(stage.scrollTop+stage.clientHeight/2)/previous
  zoom=Math.max(.08,Math.min(1,value))
  image.style.width=Math.round(width*zoom)+'px'
  stage.scrollLeft=Math.max(0,centerX*zoom-stage.clientWidth/2)
  stage.scrollTop=Math.max(0,centerY*zoom-stage.clientHeight/2)
  get('overview-zoom').textContent=Math.round(zoom*100)+'%'
  get<HTMLButtonElement>('overview-minus').disabled=zoom<=.08
  get<HTMLButtonElement>('overview-plus').disabled=zoom>=1
}
function fit(){resize(Math.min(1,(stage.clientWidth-24)/width))}
get('overview-open').addEventListener('click',()=>{
  dialog.showModal()
  image.src=full
  fit();stage.scrollTop=0;stage.scrollLeft=0
  status.textContent='正在载入高清图…'
})
image.addEventListener('load',()=>{status.textContent='拖动画面或滚动查看；选择章节可直接定位。'})
image.addEventListener('error',()=>{status.textContent='高清图未能载入，可以关闭后重试，或下载原图。'})
get('overview-fit').addEventListener('click',fit)
get('overview-detail').addEventListener('click',()=>resize(.5))
get('overview-minus').addEventListener('click',()=>resize(zoom/1.25))
get('overview-plus').addEventListener('click',()=>resize(zoom*1.25))
get('overview-sections').addEventListener('click',event=>{
  const button=(event.target as Element).closest<HTMLButtonElement>('[data-overview-section]')
  if(!button)return
  const section=layout.sections[Number(button.dataset.overviewSection)]
  stage.scrollTop=Math.max(0,section.y*zoom-20)
  stage.scrollLeft=0
  for(const item of document.querySelectorAll('[data-overview-section]'))item.setAttribute('aria-pressed',String(item===button))
})
get('overview-close').addEventListener('click',()=>dialog.close())
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()})
dialog.addEventListener('close',()=>{
  if(pointer!==undefined&&stage.hasPointerCapture(pointer))stage.releasePointerCapture(pointer)
  pointer=undefined;stage.classList.remove('dragging')
  image.removeAttribute('src')
})
stage.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='mouse'||event.button!==0)return
  pointer=event.pointerId;startX=event.clientX;startY=event.clientY;scrollX=stage.scrollLeft;scrollY=stage.scrollTop
  stage.setPointerCapture(pointer);stage.classList.add('dragging')
})
stage.addEventListener('pointermove',event=>{
  if(pointer!==event.pointerId)return
  stage.scrollLeft=scrollX-(event.clientX-startX)
  stage.scrollTop=scrollY-(event.clientY-startY)
})
for(const type of ['pointerup','pointercancel'] as const)stage.addEventListener(type,event=>{
  if(pointer!==event.pointerId)return
  if(stage.hasPointerCapture(pointer))stage.releasePointerCapture(pointer)
  pointer=undefined;stage.classList.remove('dragging')
})
