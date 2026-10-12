import sampleURL from '../../../../assets/photo-memory-v12/sample-window.png?url'
import {DEFAULT_SHAPE,SAMPLE_SHAPE,FILM_DT,FILM_TICKS,normalizeShape,validateDraft,type KeepsakeDraft} from './keepsake-model'
import {KeepsakeStudy} from './keepsake-composition-material'
import {KeepsakeScene,type KeepsakeView} from './keepsake-composition-scene'
import {FILM_WIDTH,FILM_HEIGHT,paintFilm,giftHTML} from './keepsake-film'
import {saveKeepsake,readKeepsake} from './keepsake-composition-storage'
import {finalizeWebMDuration} from '../webm-duration'
import {buildCompositionPlan as buildKeepsakePlan} from './keepsake-composition-model'
import {readKeepsake as readPreviousKeepsake} from './keepsake-natural-storage'
import './keepsake.css'

const root=document.querySelector<HTMLElement>('#app')!
root.innerHTML=[
  '<header><a class="brand" href="../../"><span>沙</span><div>光阴沙画<small>MEMORIES IN SAND</small></div></a><nav><a href="../natural/">保留版 v33 ↗</a><a href="../">保留版 v32 ↗</a><a href="../../hands/contact/cup/">茶杯手法小样 ↗</a><a href="../../">照片工作室 ↗</a></nav></header>',
  '<main><div class="intro"><span class="eyebrow">一件旧物，一段时光</span><h1>把回忆，慢慢画进沙里。</h1><p>一张杯子照片，一段想留下的故事。为自己珍藏，也为重要的人制作一份礼物。</p><span class="edition">杯子 · 沙层与体积 / v34</span></div>',
  '<nav class="steps" aria-label="纪念短片制作步骤"><button data-step="1" aria-current="step"><b>01</b> 照片与故事</button><button data-step="2"><b>02</b> 确认杯子</button><button data-step="3"><b>03</b> 观看成画</button><button data-step="4"><b>04</b> 留下这份礼物</button></nav>',
  '<section data-panel="1"><div class="form-layout"><div class="photo-card"><span class="section-label">从一张照片开始</span><div class="photo-placeholder"><img data-photo alt="待确认的纪念物照片" hidden><div data-empty><span class="cup-icon">◡</span><h2>你想记住哪一只杯子？</h2><p>选择有清楚杯身轮廓的照片<br>杯子可以在生活场景里，也可以单独拍摄</p></div></div><div class="buttons"><label class="button primary upload">选择杯子照片<input data-file type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label><button data-sample>用雨窗茶杯试做</button></div><small data-source>支持 JPG、PNG、WebP、AVIF，最大 20 MB。照片和草稿保存在本机。</small></div>',
  '<div class="story-card"><span class="section-label">让物件有自己的故事</span><label>作品名字<input data-field="title" maxlength="36" placeholder="例如：奶奶的那只茶杯"></label><label>献给谁 <small>可留空</small><input data-field="recipient" maxlength="28" placeholder="一个名字，或一个称呼"></label><label>这件东西，让你想起什么？<textarea data-field="story" maxlength="240" rows="4" placeholder="那天发生了什么？它为什么对你重要？写下你自己的回忆。"></textarea><small data-count>0 / 240</small></label><label>最后想说的一句话 <small>可留空</small><input data-field="dedication" maxlength="80" placeholder="例如：愿每一杯茶，都有人陪你慢慢喝。"></label><label>影片氛围<select data-field="mood"><option value="warm">暖纸 · 温暖珍藏</option><option value="quiet">深夜 · 安静回忆</option></select></label><button class="primary wide" data-next>下一步 · 确认照片里的杯子 →</button></div></div></section>',
  '<section data-panel="2" hidden><div class="section-heading"><div><span class="section-label">确认值得留下的形状</span><h2>圈出杯身，再调一调。</h2><p>在照片上拖出杯身范围：从杯口左上到杯底右下，不包括杯把和碟子。</p></div><button data-step-back>← 照片与故事</button></div><div class="composition-layout"><div><canvas class="photo-editor" aria-label="照片杯身框选，拖动确定杯口到杯底范围" tabindex="0"></canvas><p class="hint" data-shape-info></p></div><aside class="shape-card"><label>杯身下沿宽度<input data-shape="taper" type="range" min=".45" max="1" step=".01"></label><label>杯口弧度<input data-shape="lip" type="range" min=".05" max=".32" step=".01"></label><label>杯把<select data-shape="handle"><option value="right">右侧</option><option value="left">左侧</option><option value="none">不画杯把</option></select></label><label>杯把大小<input data-shape="handleSize" type="range" min=".6" max="1.35" step=".01"></label><label class="check"><input data-shape="saucer" type="checkbox"> 保留托碟</label><details><summary>用数值微调框选</summary><label>左侧位置<input data-box="x" type="range" min="0" max=".95" step=".005"></label><label>顶部位置<input data-box="y" type="range" min="0" max=".95" step=".005"></label><label>杯身宽度<input data-box="width" type="range" min=".035" max=".9" step=".005"></label><label>杯身高度<input data-box="height" type="range" min=".035" max=".9" step=".005"></label></details><p class="hint">第一版保留杯子的轮廓与体积。花纹、文字和照片背景暂不进入沙画。</p><button class="primary wide" data-compose>确认构图 · 编排短片 →</button></aside></div></section>',
  '<section data-panel="3" hidden><div class="section-heading"><div><span class="section-label">45 秒，回忆慢慢成形</span><h2 data-preview-title>你的纪念短片</h2><p>整把铺出杯身，收净外缘，拂出亮面，再落沙形成有深度的杯口。</p></div><button data-edit>← 调整构图</button></div><div class="film-shell"><canvas class="film" aria-label="纪念短片实际成画预览"></canvas></div><div class="playbar"><button class="primary" data-play>播放完整短片 ▶</button><select data-speed aria-label="短片播放速度"><option value="1">1 倍 · 正常</option><option value=".25">¼ 倍 · 细看手法</option><option value="2">2 倍 · 快速</option></select><span data-time>0 / 45 秒</span><button data-finish>查看成品</button></div><input class="timeline" aria-label="纪念短片进度" type="range" min="0" max="2700" value="0"><div class="process-caption"><strong data-action>片头 · 故事开始</strong><span data-motion></span></div><div class="action-list" aria-label="纪念物成画手法"></div><div class="inspect" hidden><span>慢看收沙：</span><button data-inspect="push">沙在聚拢</button><button data-inspect="hold">停驻沙堆</button><button data-inspect="after">拾起之后</button></div><div class="view-row"><span>观察镜头</span><button data-view="top" aria-pressed="true">俯视全景</button><button data-view="angle" aria-pressed="false">斜视堆积</button><button data-view="close" aria-pressed="false">杯身近景</button><button data-light aria-pressed="false">侧光看沙脊</button></div><div class="buttons end-row"><button data-replay>从头再看</button><button class="primary" data-deliver>满意了 · 制作赠礼短片 →</button></div></section>',
  '<section data-panel="4" hidden><div class="section-heading"><div><span class="section-label">留给重要的人</span><h2>让这段回忆，可以被收藏。</h2><p>成片包含片头、故事字幕与结尾赠言。沙画完整过程会录入视频。</p></div><button data-preview-back>← 返回预览</button></div><div class="delivery-layout"><div><div data-live-film hidden></div><video controls playsinline aria-label="已制作的纪念短片" hidden></video><img class="poster" data-poster alt="纪念短片实际成品海报" hidden><p class="hint" data-video-info>确认预览后，点击右侧按钮制作完整视频。</p></div><aside class="delivery-card"><span class="section-label">你的赠礼包</span><h3 data-delivery-title></h3><p data-delivery-recipient></p><button class="primary wide" data-record>制作 45 秒纪念短片</button><button class="wide" data-cancel hidden>取消制作，保留草稿</button><progress max="2700" value="0" hidden></progress><a class="button wide" data-video-download hidden>下载短片 ↓</a><button class="wide" data-poster-download>保存成品海报 ↓</button><label class="check"><input data-include-photo type="checkbox"> 赠礼网页附上原照片</label><button class="wide" data-gift disabled>保存赠礼网页 ↓</button><p class="hint">赠礼网页内含视频，可离线观看并发送文件给对方。默认不附原照片；当前尚未提供在线分享链接。视频为 WebM 格式，无配乐。</p><hr><button class="wide" data-project>备份照片与故事工程 ↓</button><label class="button wide upload">打开已有工程<input data-import type="file" accept=".json,application/json"></label></aside></div></section>',
  '<div class="save-row"><p role="status" data-status>正在准备纪念短片工作台…</p><span data-saved></span></div><div class="project-access"><label class="button upload">打开工程备份<input data-import-start type="file" accept=".json,application/json"></label></div><footer>数字沙画 · 杯身塑形版 v34 <span>旧版照片创作与茶杯动作小样继续保留</span></footer></main>'
].join('')
const get=<E extends HTMLElement>(s:string)=>root.querySelector<E>(s)!
const film=get<HTMLCanvasElement>('.film'),filmPaint=film.getContext('2d',{alpha:false,colorSpace:'srgb'})!
film.width=FILM_WIDTH;film.height=FILM_HEIGHT
const editor=get<HTMLCanvasElement>('.photo-editor'),editorPaint=editor.getContext('2d')!
editor.width=960;editor.height=640
const sandCanvas=document.createElement('canvas')
const emptyDraft=():KeepsakeDraft=>({version:1,title:'',recipient:'',story:'',dedication:'',mood:'warm',sourceKind:'upload',photo:'',imageWidth:0,imageHeight:0,shape:{...DEFAULT_SHAPE}})
let draft=emptyDraft(),photo:HTMLImageElement|undefined,scene:KeepsakeScene|undefined
let step=1,maxStep=1,busy=true,playing=false,seeking=false,active=true,revision=0,selectedAction:number|undefined
let last=0,accumulator=0,stopAt=FILM_TICKS,saveTimer:ReturnType<typeof setTimeout>|undefined
let videoBlob:Blob|undefined,videoURL:string|undefined,poster='',recorder:MediaRecorder|undefined,recordStart=0,recordLead=0,recordTail=0,cancelled=false
let imageRect={x:0,y:0,width:960,height:640},drag:{x:number;y:number}|undefined
const status=(text:string)=>{get('[data-status]').textContent=text}
const errorText=(e:unknown)=>e instanceof Error?e.message:'操作未完成，请重试。'
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),4000)}
const filename=()=> (draft.title.trim()||'我的纪念短片').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_')
function invalidate(){
  revision++;playing=false;last=0;accumulator=0;selectedAction=undefined;scene?.dispose();scene=undefined;maxStep=photo?2:1
  if(videoURL)URL.revokeObjectURL(videoURL);videoURL=undefined;videoBlob=undefined;poster=''
  const video=get<HTMLVideoElement>('video');video.pause();video.removeAttribute('src');video.load();video.hidden=true
  get('[data-poster]').hidden=true;get('[data-video-download]').hidden=true;get<HTMLButtonElement>('[data-gift]').disabled=true
}
function updateControls(){
  root.querySelectorAll<HTMLButtonElement>('button:not([data-cancel])').forEach(b=>b.disabled=busy||seeking)
  root.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('input,textarea,select').forEach(e=>e.disabled=busy||seeking)
  root.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(b=>{const n=Number(b.dataset.step);b.disabled=busy||seeking||n>maxStep;b.setAttribute('aria-current',n===step?'step':'false')})
  get<HTMLButtonElement>('[data-gift]').disabled=busy||seeking||!videoBlob
  get('[data-cancel]').hidden=!recorder;get<HTMLProgressElement>('progress').hidden=!recorder
  get<HTMLButtonElement>('[data-record]').textContent=videoBlob?'重新制作完整短片':'制作 45 秒纪念短片'
}
function go(n:number){
  if(busy||seeking||n>maxStep)return
  playing=false;last=0;step=n
  get<HTMLVideoElement>('video').pause()
  updatePlayback()
  root.querySelectorAll<HTMLElement>('[data-panel]').forEach(panel=>panel.hidden=Number(panel.dataset.panel)!==n)
  if(n===2)drawPhoto();if(n===3)renderFilm();updateControls()
  root.querySelector('[data-panel="'+n+'"]')?.scrollIntoView({behavior:'auto',block:'start'})
}
function fillForm(){
  for(const key of ['title','recipient','story','dedication','mood'] as const)get<HTMLInputElement|HTMLSelectElement>('[data-field="'+key+'"]').value=draft[key]
  get('[data-count]').textContent=draft.story.length+' / 240'
  get<HTMLImageElement>('[data-photo]').src=draft.photo;get('[data-photo]').hidden=!photo;get('[data-empty]').hidden=!!photo
  get('[data-source]').textContent=photo?(draft.sourceKind==='sample'?'示例为 AI 生成的雨窗照片，故事为虚构示范。可换成你自己的照片。':'你的照片 · '+draft.imageWidth+' × '+draft.imageHeight+' · 在本机处理与保存。'):'支持 JPG、PNG、WebP、AVIF，最大 20 MB。照片和草稿保存在本机。'
  fillShape()
}
function fillShape(){
  const s=draft.shape
  root.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-shape]').forEach(e=>{const key=e.dataset.shape as keyof typeof s;if(e instanceof HTMLInputElement&&e.type==='checkbox')e.checked=!!s[key];else e.value=String(s[key])})
  root.querySelectorAll<HTMLInputElement>('[data-box]').forEach(e=>e.value=String(s[e.dataset.box as 'x'|'y'|'width'|'height']))
}
function saveSoon(){
  if(saveTimer)clearTimeout(saveTimer)
  get('[data-saved]').textContent='有未保存的修改'
  saveTimer=setTimeout(()=>{void saveNow()},450)
}
async function saveNow(){
  if(!photo)return
  try{await saveKeepsake({...draft,shape:{...draft.shape}});get('[data-saved]').textContent='照片与故事已存本机'}
  catch(e){get('[data-saved]').textContent='本机保存失败，可下载工程备份';status(errorText(e))}
}
function drawPhoto(){
  if(!photo)return
  const ctx=editorPaint,s=draft.shape,scale=Math.min(960/photo.width,640/photo.height),w=photo.width*scale,h=photo.height*scale
  imageRect={x:(960-w)/2,y:(640-h)/2,width:w,height:h}
  ctx.fillStyle='#ddd9cf';ctx.fillRect(0,0,960,640);ctx.drawImage(photo,imageRect.x,imageRect.y,w,h)
  const x=imageRect.x+s.x*w,y=imageRect.y+s.y*h,bw=s.width*w,bh=s.height*h,cx=x+bw/2
  ctx.fillStyle='#e4c89822';ctx.fillRect(x,y,bw,bh);ctx.strokeStyle='#e7c66a';ctx.lineWidth=2;ctx.setLineDash([8,5]);ctx.strokeRect(x,y,bw,bh);ctx.setLineDash([])
  ctx.lineWidth=3;ctx.shadowColor='#111';ctx.shadowBlur=4
  ctx.beginPath();ctx.ellipse(cx,y+bh*s.lip*.5,bw/2,bh*s.lip*.5,0,0,Math.PI*2);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x,y+bh*s.lip*.5);ctx.bezierCurveTo(x,y+bh*.65,cx-bw*s.taper*.5,y+bh,cx,y+bh)
  ctx.bezierCurveTo(cx+bw*s.taper*.5,y+bh,x+bw,y+bh*.65,x+bw,y+bh*s.lip*.5);ctx.stroke()
  if(s.handle!=='none'){
    const side=s.handle==='right'?1:-1,hx=cx+side*bw*.5
    ctx.beginPath();ctx.moveTo(hx,y+bh*.22);ctx.bezierCurveTo(hx+side*bw*.5*s.handleSize,y+bh*.05,hx+side*bw*.55*s.handleSize,y+bh*.77,cx+side*bw*s.taper*.5,y+bh*.76);ctx.stroke()
  }
  ctx.shadowBlur=0
  get('[data-shape-info]').textContent='杯身框选：宽 '+Math.round(s.width*draft.imageWidth)+' × 高 '+Math.round(s.height*draft.imageHeight)+' 像素。黄色线是将保留的概括轮廓。'
}
function photoPoint(event:PointerEvent){
  const r=editor.getBoundingClientRect(),x=(event.clientX-r.left)*960/r.width,y=(event.clientY-r.top)*640/r.height
  return {x:Math.max(0,Math.min(1,(x-imageRect.x)/imageRect.width)),y:Math.max(0,Math.min(1,(y-imageRect.y)/imageRect.height))}
}
editor.onpointerdown=e=>{if(busy||!photo)return;drag=photoPoint(e);editor.setPointerCapture(e.pointerId)}
editor.onpointermove=e=>{if(!drag)return;const p=photoPoint(e);draft.shape=normalizeShape({...draft.shape,x:Math.min(drag.x,p.x),y:Math.min(drag.y,p.y),width:Math.abs(p.x-drag.x),height:Math.abs(p.y-drag.y)});fillShape();drawPhoto()}
editor.onpointerup=e=>{if(!drag)return;drag=undefined;editor.releasePointerCapture(e.pointerId);invalidate();saveSoon();updateControls()}
editor.onpointercancel=()=>{drag=undefined;invalidate();saveSoon();updateControls()}
async function decode(data:string){const img=new Image();img.src=data;await img.decode();return img}
async function preparePhoto(blob:Blob){
  if(blob.size>20*1024*1024)throw new Error('照片超过 20 MB，请选择小一些的照片。')
  if(!['image/jpeg','image/png','image/webp','image/avif'].includes(blob.type))throw new Error('请选择 JPG、PNG、WebP 或 AVIF 照片。')
  const url=URL.createObjectURL(blob)
  try{
    const image=await decode(url);if(image.naturalWidth*image.naturalHeight>60_000_000)throw new Error('照片像素过大，请先缩小再选择。')
    const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas')
    canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale)
    const c=canvas.getContext('2d')!;c.fillStyle='#f4f0e7';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(image,0,0,canvas.width,canvas.height)
    const data=canvas.toDataURL('image/jpeg',.91)
    return {data,image:await decode(data),width:canvas.width,height:canvas.height}
  }finally{URL.revokeObjectURL(url)}
}
async function choosePhoto(blob:Blob,sample=false){
  if(busy)return
  busy=true;updateControls();status('正在准备照片…')
  try{
    const result=await preparePhoto(blob);invalidate();photo=result.image
    draft={...draft,photo:result.data,imageWidth:result.width,imageHeight:result.height,sourceKind:sample?'sample':'upload',shape:{...(sample?SAMPLE_SHAPE:DEFAULT_SHAPE)}}
    if(sample&&!draft.story.trim())draft={...draft,title:'奶奶的那只茶杯',recipient:'奶奶',story:'小时候，下雨天总会坐在你身边。那只旧茶杯里，盛着热茶，也盛着慢慢陪我长大的时光。',dedication:'愿每一杯茶，都有人陪你慢慢喝。'}
    maxStep=2;fillForm();await saveNow();status(sample?'示例已准备。下一步确认照片中的杯子，手与人物不会进入这幅纪念物沙画。':'照片已准备。下一步圈出杯身，并填写这件物品的回忆。')
  }catch(e){status(errorText(e))}
  finally{busy=false;updateControls()}
}
get<HTMLInputElement>('[data-file]').onchange=e=>{const input=e.target as HTMLInputElement,file=input.files?.[0];if(file)void choosePhoto(file);input.value=''}
get('[data-sample]').onclick=()=>{void(async()=>{try{const response=await fetch(sampleURL);if(!response.ok)throw new Error('示例照片暂时无法载入。');await choosePhoto(await response.blob(),true)}catch(e){status(errorText(e))}})()}
root.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('[data-field]').forEach(e=>{e.oninput=()=>{
  const key=e.dataset.field as 'title'|'recipient'|'story'|'dedication'|'mood'
  if(key==='mood')draft.mood=e.value==='quiet'?'quiet':'warm';else draft[key]=e.value
  invalidate();get('[data-count]').textContent=draft.story.length+' / 240';saveSoon();updateControls()
}})
root.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-shape],[data-box]').forEach(e=>{e.oninput=()=>{
  const key=e.dataset.shape||e.dataset.box,s=draft.shape
  if(key==='handle')s.handle=e.value as typeof s.handle
  else if(key==='saucer')s.saucer=(e as HTMLInputElement).checked
  else s[key as 'x'|'y'|'width'|'height'|'taper'|'lip'|'handleSize']=Number(e.value)
  draft.shape=normalizeShape(s);invalidate();fillShape();drawPhoto();saveSoon();updateControls()
}})
root.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(b=>b.onclick=()=>go(Number(b.dataset.step)))
get('[data-next]').onclick=()=>{
  if(!photo){status('请先选择杯子照片，或使用示例试做。');get<HTMLInputElement>('[data-file]').focus();return}
  if(!draft.story.trim()){status('请写下一段你想留下的回忆。');get<HTMLTextAreaElement>('[data-field="story"]').focus();return}
  if(!draft.title.trim()){draft.title='我的那只杯子';fillForm();saveSoon()}
  go(2);status('拖动圈出杯身，再用右侧选项确认杯口、杯把与托碟。')
}
get('[data-step-back]').onclick=()=>go(1)
function liveFilm(show:boolean){
  const slot=get('[data-live-film]'),shell=get('.film-shell'),preview=get('[data-panel="3"]')
  if(show){slot.hidden=false;slot.append(shell);get('video').hidden=true;get('[data-poster]').hidden=true}
  else{preview.insertBefore(shell,get('.playbar'));slot.hidden=true;get('video').hidden=!videoBlob;get('[data-poster]').hidden=!!videoBlob||!poster}
}
function renderFilm(){if(scene){scene.render();paintFilm(filmPaint,sandCanvas,draft,scene.study.tick);updatePlayback()}}
function updatePlayback(){
  if(!scene)return
  const study=scene.study,tick=study.tick,phase=selectedAction!==undefined&&!playing&&tick===stopAt?selectedAction:study.phase
  get<HTMLInputElement>('.timeline').value=String(tick);get('[data-time]').textContent=(tick/60).toFixed(1)+' / 45 秒'
  get('[data-play]').textContent=playing?'暂停 Ⅱ':tick===FILM_TICKS?'再看一次 ▶':tick?'继续播放 ▶':'播放完整短片 ▶'
  get('[data-action]').textContent=tick<240?'片头 · 故事开始':tick>=2340?'留画 · 结尾赠言':phase<0?'余沙落定':scene.study.plan.actions[phase].name
  const labels={falling:'沙流疏密起落，余粒落台后才成痕',pushing:'沿接触前缘推拢，沿途拾走余沙，留下薄沙与亮面',holding:'停驻，沙堆仍在台面，坡面松落',lifting:'缓缓拾起，沙堆分次离台，留下一点细沙',settling:'停沙，等待余粒落定'}
  get('[data-motion]').textContent=tick>=240&&tick<2340?labels[study.state]:''
  get('.inspect').hidden=phase<0||study.plan.actions[phase].tool!=='gather'
  root.querySelectorAll<HTMLButtonElement>('[data-action-index]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.actionIndex)===phase)))
  get<HTMLProgressElement>('progress').value=tick
}
get('[data-compose]').onclick=()=>{
  if(!photo||!draft.story.trim()){go(1);status('先准备照片和故事，再确认构图。');return}
  invalidate();const plan=buildKeepsakePlan(draft)
  try{
    scene=new KeepsakeScene(sandCanvas,new KeepsakeStudy(plan));maxStep=3
    get('[data-preview-title]').textContent=draft.title;get('[data-delivery-title]').textContent=draft.title
    get('[data-delivery-recipient]').textContent=draft.recipient?'献给 '+draft.recipient:'献给值得记住的人'
    get('.action-list').replaceChildren(...plan.actions.map((a,i)=>{const b=document.createElement('button');b.dataset.actionIndex=String(i);b.textContent=String(i+1).padStart(2,'0')+' '+a.name;b.onclick=()=>{void watchAction(i)};return b}))
    get('[data-video-info]').textContent='确认预览后，点击右侧按钮制作完整视频。'
    go(3);renderFilm();void saveNow();status('短片已编排。照片中的比例与构图用于杯子造型，故事将在演出中出现。')
  }catch(e){scene?.dispose();scene=undefined;status('沙台无法准备：'+errorText(e));updateControls()}
}
get('[data-edit]').onclick=()=>go(2)
function pause(){playing=false;last=0;accumulator=0;updatePlayback()}
async function seek(tick:number){
  if(!scene||busy)return false
  const study=scene.study,id=++revision;pause();seeking=true;selectedAction=undefined;stopAt=FILM_TICKS;updateControls()
  const target=Math.max(0,Math.min(FILM_TICKS,Math.round(tick)))
  if(study.tick>target)study.reset()
  while(study.tick<target&&id===revision&&active){
    const until=performance.now()+9;do{study.step()}while(study.tick<target&&performance.now()<until)
    renderFilm();await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()))
  }
  if(id!==revision||!active)return false
  seeking=false;renderFilm();updateControls();return true
}
async function watchAction(i:number){
  if(!scene||!await seek(scene.study.plan.starts[i])||!scene)return
  selectedAction=i;stopAt=scene.study.plan.starts[i+1];playing=true;last=0;status('慢看“'+scene.study.plan.actions[i].name+'”，这一笔结束自动暂停。')
}
get('[data-play]').onclick=()=>{if(!scene)return;if(playing)pause();else{if(scene.study.tick===FILM_TICKS)scene.study.reset();selectedAction=undefined;stopAt=FILM_TICKS;playing=true;last=0}}
get('[data-replay]').onclick=()=>{void(async()=>{if(await seek(0)){playing=true;last=0}})()}
get('[data-finish]').onclick=()=>{void seek(2580)}
get<HTMLInputElement>('.timeline').onchange=()=>{void seek(Number(get<HTMLInputElement>('.timeline').value))}
get<HTMLSelectElement>('[data-speed]').onchange=()=>{last=0;accumulator=0}
root.querySelectorAll<HTMLButtonElement>('[data-inspect]').forEach(b=>b.onclick=()=>{void(async()=>{
  if(!scene)return;const i=selectedAction??scene.study.phase,a=scene.study.plan.actions[i]
  if(!a||a.tool!=='gather')return
  const time=b.dataset.inspect==='push'?(a.seconds-1)*.78:b.dataset.inspect==='hold'?a.seconds-.88:a.seconds-.12
  if(await seek(scene.study.plan.starts[i]+Math.round(time*60)))status(a.name+' · '+b.textContent)
})()})
root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>{scene?.view(b.dataset.view as KeepsakeView);root.querySelectorAll('[data-view]').forEach(other=>other.setAttribute('aria-pressed',String(other===b)));renderFilm()})
get('[data-light]').onclick=()=>{const b=get('[data-light]'),on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));scene?.lighting(on?'raking':'transmitted');renderFilm()}
get('[data-deliver]').onclick=()=>{void(async()=>{if(!await seek(2580))return;poster=film.toDataURL('image/png');const img=get<HTMLImageElement>('[data-poster]');img.src=poster;img.hidden=false;maxStep=4;go(4);status('成品海报已准备。制作视频会从片头开始录制全部实际过程。')})()}
get('[data-preview-back]').onclick=()=>go(3)
get('[data-poster-download]').onclick=()=>{if(!poster){status('请先完成成品预览。');return}void fetch(poster).then(r=>r.blob()).then(b=>download(b,filename()+'-海报.png'))}
get('[data-project]').onclick=()=>{try{download(new Blob([JSON.stringify(validateDraft(draft),null,2)],{type:'application/json'}),filename()+'.sandmemory.json');status('工程包含照片、故事和构图，可在此入口重新制作。')}catch(e){status(errorText(e))}}
get<HTMLInputElement>('[data-import]').onchange=e=>{void(async()=>{
  const input=e.target as HTMLInputElement,file=input.files?.[0];input.value='';if(!file||busy)return
  busy=true;updateControls()
  try{if(file.size>9_000_000)throw new Error('工程文件过大。');const value=validateDraft(JSON.parse(await file.text())),image=await decode(value.photo)
    if(image.naturalWidth!==value.imageWidth||image.naturalHeight!==value.imageHeight)throw new Error('照片尺寸与工程信息不一致。')
    invalidate();draft=value;photo=image;maxStep=2;fillForm();await saveNow();status('工程已打开。确认构图后可重新制作短片。')
  }catch(err){status(errorText(err))}finally{busy=false;updateControls();go(1)}
})()}
get<HTMLInputElement>('[data-import-start]').onchange=get<HTMLInputElement>('[data-import]').onchange
get('[data-gift]').onclick=()=>{void(async()=>{
  if(!videoBlob||busy)return;busy=true;updateControls();status('正在打包可离线观看的赠礼网页…')
  try{const html=await giftHTML(draft,videoBlob,poster,get<HTMLInputElement>('[data-include-photo]').checked);download(new Blob([html],{type:'text/html;charset=utf-8'}),filename()+'-赠礼.html');status('赠礼网页已保存。发送这个 HTML 文件，对方可打开观看。')}
  catch(e){status(errorText(e))}finally{busy=false;updateControls()}
})()}
get('[data-cancel]').onclick=()=>{cancelled=true;pause();recorder?.stop()}
get('[data-record]').onclick=()=>{void(async()=>{
  if(!scene||busy)return
  if(!('MediaRecorder' in window)||!film.captureStream){status('浏览器不支持视频制作，仍可保存海报与工程。');return}
  const mime=['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'].find(v=>MediaRecorder.isTypeSupported(v))
  if(!mime){status('浏览器不支持 WebM 视频制作，仍可保存海报与工程。');return}
  const previousInfo=get('[data-video-info]').textContent||''
  if(!await seek(0)||!scene)return
  // 成片固定使用俯视灯箱，观察近景不改变交付构图。
  scene.view('top');scene.lighting('transmitted');get<HTMLSelectElement>('[data-speed]').value='1';renderFilm()
  root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='top')))
  get('[data-light]').setAttribute('aria-pressed','false')
  const stream=film.captureStream(30),chunks:Blob[]=[]
  try{
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10_000_000});cancelled=false;busy=true
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)}
    recorder.onerror=()=>{cancelled=true;status('视频制作遇到错误，照片与故事已保留。');if(recorder?.state==='recording')recorder.stop()}
    recorder.onstop=()=>{void(async()=>{
      const elapsed=performance.now()-recordStart;stream.getTracks().forEach(t=>t.stop());recorder=undefined;pause();liveFilm(false)
      if(cancelled){get('[data-video-info]').textContent=videoBlob?previousInfo:'制作已取消，可以重新制作完整视频。';busy=false;updateControls();status('制作已取消，草稿与之前的成片保留。');return}
      try{
        const result=await finalizeWebMDuration(new Blob(chunks,{type:'video/webm'}),elapsed)
        if(videoURL)URL.revokeObjectURL(videoURL);videoBlob=result.blob;videoURL=URL.createObjectURL(videoBlob)
        // 最终海报采用留画帧，末尾只停留，不从参考图替换成品。
        paintFilm(filmPaint,sandCanvas,draft,2580);poster=film.toDataURL('image/png')
        const video=get<HTMLVideoElement>('video');video.src=videoURL;video.poster=poster;video.hidden=false;get('[data-poster]').hidden=true
        const link=get<HTMLAnchorElement>('[data-video-download]');link.href=videoURL;link.download=filename()+'.webm';link.hidden=false
        get('[data-video-info]').textContent='WebM · 1920 × 1080 · '+(elapsed/1000).toFixed(1)+' 秒 · '+(videoBlob.size/1024/1024).toFixed(1)+' MB · 含完整过程与字幕'
        status('纪念短片已完成。可以下载视频，或打包成可离线观看的赠礼网页。')
      }catch(e){status('视频打包失败：'+errorText(e))}
      finally{busy=false;updateControls();void saveNow()}
    })()}
    liveFilm(true);recorder.start(1000);recordStart=performance.now();recordLead=recordStart+200;recordTail=0;accumulator=0;last=0;stopAt=FILM_TICKS;playing=true;selectedAction=undefined
    get('[data-video-info]').textContent='正在录制实际沙画过程。请保持页面可见，完成后可下载。'
    status('正在制作完整短片：片头 → 撒沙与收沙 → 结尾赠言。');updateControls()
  }catch(e){stream.getTracks().forEach(t=>t.stop());recorder=undefined;busy=false;pause();liveFilm(false);updateControls();status('无法开始视频制作：'+errorText(e))}
})()}
function frame(now:number){
  if(!active)return
  if(scene&&playing){
    if(document.hidden){pause();if(recorder){cancelled=true;recorder.stop();status('页面进入后台，制作已停止；请回到页面重新制作。')}}
    else{
      if(last&&(!recorder||now>=recordLead))accumulator+=Math.min(.2,(now-last)/1000)*(recorder?1:Number(get<HTMLSelectElement>('[data-speed]').value))
      let steps=0;while(accumulator>=FILM_DT&&scene.study.tick<stopAt&&steps++<12){scene.study.step();accumulator-=FILM_DT}
      renderFilm()
      if(scene.study.tick>=stopAt){if(recorder){recordTail ||=now+400;if(now>=recordTail){pause();recorder.stop()}}else{pause();status(stopAt===FILM_TICKS?'短片播放完毕。满意后可以制作赠礼短片。':'这一笔已完成，可以慢看收沙或继续完整演出。')}}
    }
  }
  last=now;requestAnimationFrame(frame)
}
sandCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();if(recorder){cancelled=true;recorder.stop()}status('沙台图形中断，请刷新后从本机草稿恢复。')})
window.addEventListener('pagehide',()=>{active=false;revision++;if(saveTimer)clearTimeout(saveTimer);if(recorder){cancelled=true;recorder.stop()}if(videoURL)URL.revokeObjectURL(videoURL);scene?.dispose()},{once:true})
void(async()=>{
  updateControls()
  try{const own=await readKeepsake(),saved=own??await readPreviousKeepsake();if(saved){const image=await decode(saved.photo);if(image.naturalWidth!==saved.imageWidth||image.naturalHeight!==saved.imageHeight)throw new Error('保存的照片尺寸不正确。');draft=saved;photo=image;maxStep=2;fillForm();if(!own)await saveKeepsake(saved);get('[data-saved]').textContent=own?'已恢复本机照片与故事':'已复制 v33 草稿，旧版草稿保留';status('已恢复照片、故事和构图。确认后可重新制作短片。')}else status('选择一张杯子照片，或用雨窗示例体验完整流程。')}
  catch(e){status('无法恢复本机草稿：'+errorText(e)+' 仍可开始新作品。')}
  finally{busy=false;updateControls();requestAnimationFrame(frame)}
})()
