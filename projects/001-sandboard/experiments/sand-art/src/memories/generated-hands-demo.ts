import handUrl from '../../../../assets/generated-hand-v19/hand-pinch.png?url'
import { StableHand } from './stable-hand'
import { GeneratedPour, ManualPour, POUR_STEP, POUR_TICKS, type PourGesture, type PourStyle } from './generated-pour'
import { renderSand, canvasBlob } from './export'
import { settingsFor } from './model'
import { finalizeWebMDuration } from '../webm-duration'
import './generated-hands.css'

/** 独立试镜，不读取照片，也不改变已有作品和实拍素材库。 */
export class GeneratedHandsDemo {
  readonly element:HTMLElement
  private readonly canvas:HTMLCanvasElement
  private readonly sand=document.createElement('canvas')
  private readonly scene=new GeneratedPour()
  private hand:StableHand|undefined
  private playing=false
  private last=0
  private accumulator=0
  private manual=false
  private pointer:number|undefined
  private manualActor=new ManualPour()
  private gesture:PourGesture=this.scene.gesture
  private dirty=true
  private raf=0
  private recorder:MediaRecorder|undefined
  private recordingCancelled=false
  private active=true
  private finishTimer:number|undefined
  private readonly visibility=()=>{if(document.hidden){this.pause();this.pointer=undefined;this.cancelRecording()}}
  private readonly buttons:Record<string,HTMLButtonElement>={}
  constructor(parent:HTMLElement){
    const root=document.createElement('section');root.className='generated-hands';root.setAttribute('aria-label','生成手部与数字沙台演示');this.element=root
    root.innerHTML=`<div class="gh-heading"><div><span class="gh-eyebrow">手与沙 · 动作试验</span><h1>一把沙，慢慢松开。</h1><p>先捻指成细流，再抬手散撒。看沙从指缝落到灯箱。</p></div><span class="gh-tag">10 秒 · 正常速度</span></div>
      <div class="gh-table"><canvas width="1280" height="852" aria-label="生成手部撒沙演示；切换自己撒沙后，按住沙台拖动"></canvas><span class="gh-loading" role="status">正在载入手部…</span><span class="gh-table-note">${'暖光灯箱'}</span></div>
      <div class="gh-transport"><button data-play disabled>开始演示 ▶</button><button data-restart disabled>重新开始 ↺</button><button data-manual disabled aria-pressed="false">自己撒沙</button><span data-phase role="status">准备素材</span></div>
      <div class="gh-manual-controls" data-controls hidden><div role="group" aria-label="出沙手法"><button data-style="fine" aria-pressed="true">捻指细流</button><button data-style="scatter" aria-pressed="false">抬手散撒</button></div><label>抬手高度 <input data-height type="range" min="8" max="65" value="18" aria-label="抬手高度"></label><label class="gh-supply">手中余沙 <meter data-supply min="0" max="1" value="1" aria-label="手中余沙"></meter><span data-supply-text>100%</span></label></div>
      <label class="gh-timeline"><span data-time>0.0 / 10.0 秒</span><input data-progress type="range" min="0" max="600" step="1" value="0" disabled aria-label="生成手部演示进度"></label>
      <div class="gh-inspect"><label><input data-hand type="checkbox" checked> 显示手部</label><label><input data-emitter type="checkbox"> 查看出沙点</label><button data-png disabled>保存当前画面 ↓</button><button data-video disabled>下载 10 秒过程 ↓</button></div>
      <p class="gh-status" data-status role="status">手部为 AI 生成素材，沙由程序发射和沉积；当前验证撒沙动作。</p>
      <details class="gh-about"><summary>这个小样验证什么？</summary><p>单张生成的手部素材保持皮肤和前臂比例，通过小幅指节变形控制出沙口。沙从窄指缝发射，随高度和速度散开，实际沉积到沙层。当前能验证捻指撒沙；完整握拳、掌面推沙和真人动作仍需要进一步制作。</p><p data-renderer></p></details>`
    parent.append(root);this.canvas=root.querySelector('canvas')!;this.sand.width=this.canvas.width;this.sand.height=this.canvas.height
    for(const name of ['play','restart','manual','png','video'])this.buttons[name]=root.querySelector<HTMLButtonElement>(`[data-${name}]`)!
    this.buttons.play.onclick=()=>{if(this.manual){this.manual=false;this.reset()}if(this.scene.tick===POUR_TICKS)this.reset();this.playing=!this.playing;this.last=0;this.update()}
    this.buttons.restart.onclick=()=>{this.manual=false;this.reset();this.playing=true;this.update()}
    this.buttons.manual.onclick=()=>{
      this.pause();this.manual=!this.manual;this.reset();this.input('progress').value='0';this.pointer=undefined;this.manualActor=new ManualPour();this.setStyle('fine')
      if(this.manual){this.gesture=this.manualActor.step(false);this.status('按住拖动撒沙，松手停止；可切换细流与散撒、调整高度。每次按下重新抓一把。')}
      else this.status('手部为 AI 生成素材，沙由程序发射和沉积；当前验证撒沙动作。')
      this.dirty=true;this.update()
    }
    this.input('progress').oninput=()=>{const target=Number(this.input('progress').value);this.pause();this.manual=false;this.scene.seek(target);this.gesture=this.scene.gesture;this.dirty=true;this.update()}
    for(const name of ['hand','emitter'])this.input(name).onchange=()=>{this.dirty=true}
    this.element.querySelectorAll<HTMLButtonElement>('[data-style]').forEach(button=>button.onclick=()=>this.setStyle(button.dataset.style as PourStyle))
    this.input('height').oninput=()=>{this.manualActor.setLift(Number(this.input('height').value)/100);this.dirty=true}
    this.buttons.png.onclick=()=>{void this.capture()};this.buttons.video.onclick=()=>this.record()
    this.canvas.addEventListener('pointerdown',event=>{if(!this.manual||this.recorder||event.button!==0||this.pointer!==undefined)return;this.pointer=event.pointerId;this.manualActor.grab();this.setPoint(event);this.canvas.setPointerCapture(event.pointerId);event.preventDefault()})
    this.canvas.addEventListener('pointermove',event=>{if(this.pointer===event.pointerId)this.setPoint(event)})
    const up=(event:PointerEvent)=>{if(this.pointer===event.pointerId){this.pointer=undefined;this.accumulator=0}}
    this.canvas.addEventListener('pointerup',up);this.canvas.addEventListener('pointercancel',up);this.canvas.addEventListener('lostpointercapture',up)
    this.canvas.addEventListener('contextmenu',event=>{if(this.manual)event.preventDefault()})
    document.addEventListener('visibilitychange',this.visibility)
  }
  private input(name:string){return this.element.querySelector<HTMLInputElement>(`[data-${name}]`)!}
  private status(text:string){this.element.querySelector<HTMLElement>('[data-status]')!.textContent=text}
  async load(){
    this.hand=await StableHand.load(handUrl)
    if(!this.active){this.hand.dispose();return}
    this.element.querySelector<HTMLElement>('.gh-loading')!.hidden=true
    for(const button of Object.values(this.buttons))button.disabled=false
    this.input('progress').disabled=false
    this.element.querySelector<HTMLElement>('[data-renderer]')!.textContent=this.hand.morphAvailable?'当前使用单纹理局部指节变形，无跨姿态溶解；素材为 AI 生成，并非实拍。':'当前浏览器不支持指节变形，已使用固定手部姿态；落沙模拟仍可运行。'
    this.playing=true;this.update();this.raf=requestAnimationFrame(this.frame)
  }
  pause(){this.playing=false;this.last=0;this.update()}
  stop(){this.active=false;this.pause();this.pointer=undefined;this.cancelRecording();this.hand?.dispose();cancelAnimationFrame(this.raf);document.removeEventListener('visibilitychange',this.visibility)}
  private reset(){this.scene.reset();this.gesture=this.scene.gesture;this.last=0;this.accumulator=0;this.dirty=true}
  private setPoint(event:PointerEvent){const rect=this.canvas.getBoundingClientRect();this.manualActor.targetAt({x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height})}
  private setStyle(style:PourStyle){
    this.manualActor.setStyle(style);this.input('height').value=style==='fine'?'18':'48'
    this.element.querySelectorAll<HTMLButtonElement>('[data-style]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.style===style)));this.dirty=true
  }
  private manualStep(){
    this.gesture=this.manualActor.step(this.pointer!==undefined)
    this.scene.emit(this.gesture);this.dirty=true
  }
  private frame=(time:number)=>{
    if(!this.active)return
    const elapsed=this.last?Math.min(.12,(time-this.last)/1000):0;this.last=time
    if(this.playing||(this.manual&&(this.pointer!==undefined||this.manualActor.moving||this.scene.material.pending))){
      this.accumulator+=elapsed
      while(this.accumulator>=POUR_STEP){this.accumulator-=POUR_STEP;if(this.manual)this.manualStep();else if(this.scene.tick<POUR_TICKS){this.scene.step();this.gesture=this.scene.gesture;this.dirty=true}}
      if(!this.manual&&this.scene.tick===POUR_TICKS){this.playing=false;this.update();if(this.recorder&&!this.finishTimer)this.finishTimer=window.setTimeout(()=>{this.finishTimer=undefined;this.recorder?.stop()},300)}
    }
    if(this.dirty)this.paint()
    this.updateTime();this.raf=requestAnimationFrame(this.frame)
  }
  private paint(){
    renderSand(this.sand,this.scene.material.read(),{...settingsFor(),surface:'granular',grain:.68,white:0})
    const ctx=this.canvas.getContext('2d')!;ctx.clearRect(0,0,this.canvas.width,this.canvas.height);ctx.drawImage(this.sand,0,0)
    const width=this.canvas.width,height=this.canvas.height
    // 投影与 StageMaterial 使用同一高度；空中粒子随后沉积到同一沙层。
    // 不同供料包显示为大小不一的细粒；沿下落方向少量拖影，细流不再像黑色矩形团。
    const packetScale=this.scene.material.width*this.scene.material.height*.0000016
    for(let bin=0;bin<6;bin++){
      ctx.fillStyle=`rgba(68,45,26,${.06+bin*.105})`;ctx.beginPath()
      for(const grain of this.scene.material.airborne){
        const n=Math.sin(grain.mass*97319.7)*43758.5,r=n-Math.floor(n)
        if(Math.min(5,Math.floor(grain.mass/packetScale*6))!==bin)continue
        const x=grain.x*width,y=grain.y*height-grain.z*width*.55,radius=.22+r*.39
        ctx.moveTo(x+radius,y);ctx.ellipse(x,y,radius,radius+Math.min(.9,Math.abs(grain.vz)*.9),0,0,Math.PI*2)
      }
      ctx.fill()
    }
    if(this.input('hand').checked&&this.gesture.visible)this.hand?.draw(ctx,this.gesture.opening,this.gesture.release.x*width,this.gesture.release.y*height,width*.50,this.gesture.angle,this.gesture.lift)
    if(this.input('emitter').checked&&this.gesture.visible){ctx.strokeStyle='#9a4527';ctx.lineWidth=1.5;const x=this.gesture.release.x*width,y=this.gesture.release.y*height;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.stroke()}
    this.dirty=false
  }
  private updateTime(){
    this.element.querySelector<HTMLElement>('[data-time]')!.textContent=this.manual?'自由撒沙 · 松手停止出沙':`${(this.scene.tick/60).toFixed(1)} / 10.0 秒`
    if(!this.manual)this.input('progress').value=String(this.scene.tick)
    this.element.querySelector<HTMLElement>('[data-phase]')!.textContent=this.gesture.phase
    if(this.manual){this.element.querySelector<HTMLMeterElement>('[data-supply]')!.value=this.manualActor.remaining;this.element.querySelector<HTMLElement>('[data-supply-text]')!.textContent=`${Math.round(this.manualActor.remaining*100)}%`}
  }
  private update(){
    this.buttons.play.textContent=this.playing?'暂停 Ⅱ':this.scene.tick===POUR_TICKS?'再看一次 ▶':'继续演示 ▶'
    this.buttons.manual.setAttribute('aria-pressed',String(this.manual));this.canvas.classList.toggle('gh-manual',this.manual)
    this.element.querySelector<HTMLElement>('[data-controls]')!.hidden=!this.manual
    this.input('progress').disabled=this.manual||!!this.recorder||!this.hand
    for(const name of ['play','restart','manual','video'])this.buttons[name].disabled=!!this.recorder||!this.hand
    this.buttons.png.disabled=!!this.recorder||!this.hand
    for(const name of ['hand','emitter'])this.input(name).disabled=!!this.recorder
    this.updateTime()
  }
  private async capture(){
    this.pause();this.paint()
    try{this.download(await canvasBlob(this.canvas),'生成手部与数字沙台-当前画面.png');this.status('已保存实际演示画面。')}catch(error){this.status(error instanceof Error?error.message:'画面导出失败。')}
  }
  private download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)}
  private record(){
    if(this.recorder||!this.hand)return
    if(typeof MediaRecorder==='undefined'||typeof this.canvas.captureStream!=='function'){this.status('当前浏览器无法导出过程视频，仍可播放和保存画面。');return}
    const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))
    if(!mime){this.status('当前浏览器没有可用的 WebM 编码器。');return}
    let stream:MediaStream|undefined
    try{
      stream=this.canvas.captureStream(30);const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6_000_000}),chunks:Blob[]=[],started=performance.now()
      this.recorder=recorder;this.recordingCancelled=false
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data)}
      recorder.onerror=()=>{this.recordingCancelled=true;this.status('视频编码失败，可重试或保存当前画面。')}
      recorder.onstop=()=>{void(async()=>{
        stream?.getTracks().forEach(track=>track.stop());this.recorder=undefined;this.update()
        if(this.recordingCancelled||!chunks.length)return
        try{const duration=performance.now()-started,result=await finalizeWebMDuration(new Blob(chunks,{type:recorder.mimeType}),duration);if(!this.active)return;this.download(result.blob,'生成手部-10秒撒沙过程.webm');this.status(result.updated?'已保存完整撒沙过程。手部为生成素材，沙为程序演算。':'已保存过程视频；此浏览器未补齐容器时长，拖动定位可能受限。')}catch{this.status('视频导出失败，请重试。')}
      })()}
      this.manual=false;this.reset();this.paint();recorder.start(250);this.playing=true;this.status('正在录制正常速度的过程，请保持本页可见…');this.update()
    }catch{stream?.getTracks().forEach(track=>track.stop());this.recorder=undefined;this.update();this.status('浏览器未能启动视频录制，仍可播放和保存画面。')}
  }
  private cancelRecording(){if(this.finishTimer){clearTimeout(this.finishTimer);this.finishTimer=undefined}if(this.recorder&&this.recorder.state!=='inactive'){this.recordingCancelled=true;this.recorder.stop();this.status('过程录制已取消，请保持页面可见后重试。')}}
}

let modal:HTMLDialogElement|undefined
export async function openGeneratedHands(){
  if(modal?.open)return
  const dialog=document.createElement('dialog');modal=dialog;dialog.className='gh-dialog';dialog.innerHTML='<button class="gh-close" aria-label="关闭生成手部演示">关闭 ×</button>'
  document.body.append(dialog);dialog.showModal();const demo=new GeneratedHandsDemo(dialog)
  dialog.querySelector<HTMLButtonElement>('.gh-close')!.onclick=()=>dialog.close()
  dialog.addEventListener('close',()=>{demo.stop();dialog.remove();if(modal===dialog)modal=undefined},{once:true})
  try{await demo.load()}catch(error){dialog.querySelector<HTMLElement>('[data-status]')!.textContent=error instanceof Error?error.message:'手部演示载入失败。';dialog.querySelector<HTMLElement>('.gh-loading')!.hidden=true}
}
