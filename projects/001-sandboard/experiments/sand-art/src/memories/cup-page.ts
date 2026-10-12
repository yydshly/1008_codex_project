import {CupScene,type CupView} from './cup-scene'
import {CUP_ACTIONS,CUP_STARTS,CUP_TICKS,CUP_DT} from './cup-score'
import {finalizeWebMDuration} from '../webm-duration'
import type {PhotoLighting} from './photo-surface'
import './cup.css'

const root=document.querySelector<HTMLElement>('#app')!
root.innerHTML=`<header><a href="../">← 雨窗与茶杯 · v30 保留</a><a href="../../../">光阴沙画 ↗</a></header><main>
  <div class="heading"><div><span class="eyebrow">SAND ACTION STUDY / 31</span><h1>一杯茶，九次落笔。</h1><p>先撒沙，再推拢、拾起。30 秒，观察沙怎样成为一只茶杯。</p></div><span class="tag">无手镜头 · 实际沙层</span></div>
  <div class="toolbar"><button class="primary" data-play>播放 30 秒 ▶</button><button data-reset>回到空台</button><label><select aria-label="播放速度"><option value="1">1 倍 · 正常速度</option><option value="0.25">¼ 倍 · 细看手法</option><option value="2">2 倍 · 快速观看</option></select></label><span class="time" data-time>0.0 / 30.0 秒</span></div>
  <div class="layout"><section><div class="stage"><canvas aria-label="茶杯沙画实际过程"></canvas><span class="stamp">TEA CUP · 9 ACTIONS · MATERIAL STUDY</span></div>
    <div class="caption"><strong data-action>空台 · 准备散撒</strong><span data-state>等待播放</span></div>
    <input class="timeline" aria-label="成画进度" type="range" min="0" max="1800" value="0">
    <div class="view-controls" role="group" aria-label="镜头与光线"><button data-view="top" aria-pressed="true">完整俯视</button><button data-view="angle" aria-pressed="false">斜视看堆积</button><button data-view="close" aria-pressed="false">杯身近景</button><button data-light="transmitted" aria-pressed="true">灯箱透光</button><button data-light="raking" aria-pressed="false">侧光看沙脊</button></div>
    <p class="description" data-note>从空台开始；细粒先在空中下落，落地后才变成沙层。</p><div class="view-controls" data-gather-controls hidden role="group" aria-label="收沙前后对照"><button data-gather-state="push">推拢中</button><button data-gather-state="hold">停驻时</button><button data-gather-state="after">拾起后</button></div>
    <div class="ledger" aria-label="实际沙量去向"><div>台面沙量<strong data-bed>0.0%</strong></div><div>空中移动<strong data-air>0.0%</strong></div><div>台外 / 已收走<strong data-out>0.0%</strong></div><div>已供沙量<strong data-supplied>0.0</strong></div></div>
    <div class="exports"><button data-png>保存当前画面 ↓</button><button data-video>下载完整过程 ↓</button><a data-download hidden>再次下载过程 ↓</a><button data-cancel hidden>取消录制</button></div><p class="status" role="status">正在准备沙台…</p>
  </section><aside><p>点击一笔，从它的起点观察。撒沙结束留出落定时间；收沙分为拖拢、停驻、拾起。</p><div class="actions" aria-label="九个主要手法">${CUP_ACTIONS.map((action,i)=>`<button data-action-index="${i}" aria-current="false"><b>${String(i+1).padStart(2,'0')}</b><span>${action.name}<small>${action.tool==='pour'?'撒沙 · 停沙落定':'推拢 · 停驻 · 拾起'}</small></span></button>`).join('')}<button data-final><b>完</b><span>余沙落定<small>查看实际成画</small></span></button></div></aside></div>
  <details><summary>这版验证什么？</summary><p>这是独立的茶杯动作小样，v30 与旧模式从上方入口返回。九个主要动作手工编排，不读取照片、目标灰度或成品遮罩。每一帧只执行供沙、局部移沙和拾起；画面、近景、沙量统计与导出都读取同一份 768 × 512 材料。</p><p>拖拢时，已有沙以每步最多 3.5 个网格的距离移动，前缘形成实际堆积；此时不计为收走。停止移动 0.25 秒后，才在末端分次拾起。拾起颗粒离台后计入已收走。供沙具有重力下落、宽窄与力度变化，最后 3.5 秒等待落定。</p><p>当前是程序材料近似与概括造型，不是真人手法采集或逐颗碰撞模拟，也不代表任意照片已能自动转成这种动作。这个小样用于先检查动作是否可理解，再决定是否回接照片创作。</p></details>
</main>`
const get=<E extends HTMLElement>(selector:string)=>root.querySelector<E>(selector)!
const canvas=get<HTMLCanvasElement>('canvas'),play=get<HTMLButtonElement>('[data-play]'),slider=get<HTMLInputElement>('.timeline'),speed=get<HTMLSelectElement>('select')
const stateLabels={falling:'放沙中 · 细粒下落',pushing:'贴台推拢 · 沙量仍在台上',holding:'停驻聚沙 · 尚未收走',lifting:'分次拾起 · 移出台面',settling:'停沙 · 等待余粒落定'}
let scene:CupScene|undefined,playing=false,seeking=false,active=true,last=0,accumulator=0,stopAt=CUP_TICKS,seekId=0
let selectedAction:number|undefined
let recorder:MediaRecorder|undefined,videoURL:string|undefined,cancelled=false,recordStart=0,lead=0,tail=0
let recordingPaint:CanvasRenderingContext2D|undefined
const status=(s:string)=>{get('.status').textContent=s}
function update(){
  if(!scene)return
  const study=scene.study,t=study.tick,busy=!!recorder||seeking
  const completed=selectedAction!==undefined&&!playing&&!seeking&&t===stopAt
  const phase=completed?selectedAction!:study.phase
  play.textContent=playing?'暂停 Ⅱ':t===CUP_TICKS?'再看一次 ▶':t?'继续播放 ▶':'播放 30 秒 ▶'
  get('[data-time]').textContent=`${(t*CUP_DT).toFixed(1)} / 30.0 秒 · ${Number(speed.value)===.25?'¼':speed.value} 倍`
  slider.value=String(t)
  get('[data-action]').textContent=t===0?'空台 · 准备散撒':phase<0?'余沙落定 · 留画':`${String(phase+1).padStart(2,'0')} · ${CUP_ACTIONS[phase].name}${completed?' · 本笔完成':''}`
  get('[data-state]').textContent=t===0?'等待播放':stateLabels[study.state]
  get('[data-note]').textContent=phase<0?'余沙自然落定，保留推拢后的薄沙脊；结尾不替换为目标图片。':CUP_ACTIONS[phase].note
  get('[data-gather-controls]').hidden=phase<0||CUP_ACTIONS[phase].tool!=='gather'
  const sand=study.sand,total=sand.suppliedMass
  for(const [selector,mass] of [['bed',sand.mass],['air',sand.inAirMass],['out',sand.removedMass]] as const)get(`[data-${selector}]`).textContent=`${(total?mass/total*100:0).toFixed(1)}%`
  get('[data-supplied]').textContent=(total/1000).toFixed(1)+'k'
  root.querySelectorAll<HTMLButtonElement>('button:not([data-cancel])').forEach(b=>b.disabled=busy)
  slider.disabled=speed.disabled=busy
  root.querySelectorAll<HTMLButtonElement>('[data-action-index]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.actionIndex)===phase)))
  get('[data-final]').setAttribute('aria-current',String(phase<0&&t>0))
  get('[data-cancel]').hidden=!recorder
  get('[data-download]').hidden=!videoURL||!!recorder
}
function pause(){playing=false;last=0;accumulator=0;update()}
async function seek(tick:number){
  if(!scene||recorder)return false
  const id=++seekId;pause();selectedAction=undefined;seeking=true;stopAt=CUP_TICKS;update();scene.study.reset()
  const target=Math.max(0,Math.min(CUP_TICKS,Math.round(tick)))
  while(scene.study.tick<target&&id===seekId&&active){
    const until=performance.now()+8
    do{scene.study.step()}while(scene.study.tick<target&&performance.now()<until)
    scene.render();update();await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()))
  }
  if(id===seekId){seeking=false;scene.render();update();return true}
  return false
}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function frame(now:number){
  if(!active)return
  if(scene&&playing){
    if(last&&(!recorder||now>=lead))accumulator+=Math.min(.2,(now-last)/1000)*Number(speed.value)
    let steps=0
    while(accumulator>=CUP_DT&&scene.study.tick<stopAt&&steps++<12){scene.study.step();accumulator-=CUP_DT}
    scene.render();recordingPaint?.drawImage(canvas,0,0);update()
    if(scene.study.tick>=stopAt){
      if(recorder){tail ||= now+650;if(now>=tail){pause();recorder.stop()}}
      else{pause();status(stopAt===CUP_TICKS?'已完成。可以切换侧光与近景，查看同一份实际沙层。':'这笔已完成。可以慢看下一笔，或继续完整过程。')}
    }
  }
  last=now;requestAnimationFrame(frame)
}
play.onclick=()=>{if(!scene||recorder)return;if(playing)pause();else{if(scene.study.tick===CUP_TICKS)scene.study.reset();selectedAction=undefined;stopAt=CUP_TICKS;playing=true;last=0;update()}}
get('[data-reset]').onclick=()=>{if(!scene)return;++seekId;pause();selectedAction=undefined;scene.study.reset();stopAt=CUP_TICKS;scene.render();update();status('已回到空台。')}
slider.oninput=()=>{void seek(Number(slider.value))}
speed.onchange=()=>{last=0;accumulator=0;update()}
root.querySelectorAll<HTMLButtonElement>('[data-action-index]').forEach(button=>{button.onclick=()=>{void(async()=>{
  const index=Number(button.dataset.actionIndex);if(!await seek(CUP_STARTS[index])||!scene)return
  selectedAction=index;stopAt=CUP_STARTS[index+1];playing=true;last=0;status(`观察“${CUP_ACTIONS[index].name}”，本笔结束自动暂停。`);update()
})()}})
get('[data-final]').onclick=()=>{void seek(CUP_TICKS)}
root.querySelectorAll<HTMLButtonElement>('[data-gather-state]').forEach(button=>{button.onclick=()=>{void(async()=>{
  const index=selectedAction??scene?.study.phase
  if(index===undefined||index<0||CUP_ACTIONS[index].tool!=='gather')return
  const action=CUP_ACTIONS[index],move=action.seconds-1
  const time=button.dataset.gatherState==='push'?move*.78:button.dataset.gatherState==='hold'?move+.12:action.seconds-.12
  if(await seek(CUP_STARTS[index]+Math.round(time*60)))status(`已定位到“${action.name} · ${button.textContent}”。可以切换光线观察沙量，再继续播放。`)
})()}})
root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button=>{button.onclick=()=>{scene?.view(button.dataset.view as CupView);root.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}})
root.querySelectorAll<HTMLButtonElement>('[data-light]').forEach(button=>{button.onclick=()=>{scene?.lighting(button.dataset.light as PhotoLighting);root.querySelectorAll('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}})
get('[data-png]').onclick=()=>{scene?.render();canvas.toBlob(blob=>{if(blob)download(blob,`茶杯手法-v31-${scene?.study.tick}.png`)})}
get('[data-cancel]').onclick=()=>{cancelled=true;pause();recorder?.stop()}
get('[data-video]').onclick=()=>{void(async()=>{
  if(!scene||!('MediaRecorder' in window)||!canvas.captureStream){status('当前浏览器不支持画布录像，可以保存 PNG。');return}
  if(!await seek(0))return;speed.value='1';stopAt=CUP_TICKS
  const mime=['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'].find(x=>MediaRecorder.isTypeSupported(x))
  if(!mime){status('当前浏览器不支持 WebM 录制，可以保存 PNG。');return}
  // 从明确的 sRGB 2D 表面录制同一帧，避开本机 WebGL captureStream 的色阶差异。
  const output=document.createElement('canvas');output.width=canvas.width;output.height=canvas.height
  const paint=output.getContext('2d',{alpha:false,colorSpace:'srgb'})
  if(!paint){status('录像画布不可用，可以保存 PNG。');return}
  paint.drawImage(canvas,0,0);recordingPaint=paint
  const stream=output.captureStream(30),chunks:Blob[]=[]
  try{
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:9_000_000});cancelled=false
    recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data)}
    recorder.onerror=()=>{cancelled=true;status('录制遇到错误；当前沙层仍可保存。');if(recorder?.state==='recording')recorder.stop()}
    recorder.onstop=()=>{void(async()=>{
      const duration=performance.now()-recordStart;stream.getTracks().forEach(track=>track.stop());recordingPaint=undefined;recorder=undefined;pause()
      if(cancelled){update();status('录制已取消，当前版本与沙层保留。');return}
      const {blob}=await finalizeWebMDuration(new Blob(chunks,{type:'video/webm'}),duration)
      if(videoURL)URL.revokeObjectURL(videoURL);videoURL=URL.createObjectURL(blob)
      const a=get<HTMLAnchorElement>('[data-download]');a.href=videoURL;a.download='茶杯手法-完整过程-v31.webm'
      download(blob,a.download);update();status('完整过程已录制；视频来自当前镜头的实际材料过程。')
    })()}
    recorder.start(1000);recordStart=performance.now();lead=recordStart+350;tail=0;last=0;accumulator=0;playing=true
    status('正在录制 30 秒完整过程，请保持页面可见。');update()
  }catch(error){stream.getTracks().forEach(track=>track.stop());recordingPaint=undefined;recorder=undefined;pause();status(`无法开始录制：${error instanceof Error?error.message:'浏览器限制'}`)}
})()}
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();cancelled=true;if(recorder?.state==='recording')recorder.stop();status('图形上下文已中断，请刷新恢复。');root.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true)})
window.addEventListener('pagehide',()=>{active=false;++seekId;if(recorder?.state==='recording'){cancelled=true;recorder.stop()}if(videoURL)URL.revokeObjectURL(videoURL);scene?.dispose()},{once:true})
try{scene=new CupScene(canvas);update();status('沙台已就绪。播放完整过程，或选择一笔观察。');requestAnimationFrame(frame)}catch(error){status(`沙台加载失败：${error instanceof Error?error.message:'图形不可用'}`)}
