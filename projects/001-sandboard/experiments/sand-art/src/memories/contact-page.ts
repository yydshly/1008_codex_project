import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import modelUrl from '../../../../assets/hand-contact-v20/hand-posable.glb?url'
import skinUrl from '../../../../assets/hand-contact-v20/skin-diffuse.png?url'
import photoScoreUrl from '../../../../assets/material-realism-v17/natural-window-score.json?url'
import gestureScoreUrl from '../../../../assets/no-hand-photo-v28/gesture-window-score.json?url'
import sculptScoreUrl from '../../../../assets/no-hand-photo-v29/sculpt-window-score.json?url'
import performanceScoreUrl from '../../../../assets/no-hand-photo-v30/performance-window-score.json?url'
import {photoActionWindow} from './photo-actions'
import { decodePortraitPlan } from './structured-painting'
import type { PhotoFocus } from './photo-study'
import type { PhotoPace } from './photo-timing'
import type { PhotoLighting } from './photo-surface'
import {mapPhotoProgress,type PhotoArrangement} from './photo-choreography'
import { ContactScene } from './contact-scene'
import { CONTACT_DT } from './contact-score'
import { finalizeWebMDuration } from '../webm-duration'
import './contact.css'

document.body.className = 'contact-page'
const root = document.querySelector<HTMLElement>('#app')!
root.innerHTML = `<header><a href="../">光阴沙画 / 手与沙</a><a href="../">返回原小样 ↗</a></header>
<main><div class="ct-heading"><div><span class="ct-eyebrow" data-study>无手照片试镜 / 06</span><h1>雨窗与茶杯，慢慢成画。</h1><p data-intro>从空台添沙、塑形与留白。先看画面怎样形成，再靠近看沙。</p></div><span class="ct-tag">可暂停 · 可换视角</span></div>
<div class="ct-sequences" role="group" aria-label="演示流程"><button data-sequence="photo" aria-pressed="true">雨窗与茶杯 · 无手成画</button><button data-sequence="pour" aria-pressed="false">无手落沙 · 12 秒</button><button data-sequence="pickup" aria-pressed="false">取沙与漏沙 · 24 秒</button><button data-sequence="contact" aria-pressed="false">接触演示 · 20 秒</button><a class="ct-work-link" href="./cup/">茶杯手法 · 30 秒 ↗</a><a class="ct-work-link" href="../../#natural">进入照片创作 ↗</a></div>
<div class="ct-arrangement" data-arrangement-control><div role="group" aria-label="成画编排"><button data-arrangement="performance" aria-pressed="true">沿形撒收 · 新实验</button><button data-arrangement="sculpt" aria-pressed="false">细节撒收 · v29</button><button data-arrangement="gesture" aria-pressed="false">连续撒收 · v28</button><button data-arrangement="coherent" aria-pressed="false">局部连续 · 保留版</button><button data-arrangement="original" aria-pressed="false">原版逐笔</button></div><p data-arrangement-note>长曲线撒沙，沿迹收出亮面。旧版保留，按章节进度对照。</p><button data-detail>细看撒收 · 12 秒</button><button data-observe="pour">看撒沙 · 慢动作</button><button data-observe="collect">看收沙 · 慢动作</button><button data-observe="fine-pour">看细部撒沙</button><button data-observe="fine-collect">看细部收沙</button></div>
<div class="ct-transport"><button data-play disabled>播放成画 ▶</button><button data-restart disabled>从头开始 ↺</button><label data-speed-control>速度<select data-speed aria-label="播放速度"><option value="guided" selected>分章节奏</option><option value="1">1 倍 · 细看动作</option><option value="0.25">¼ 倍 · 看沙粒移动</option><option value="4">4 倍</option><option value="10">10 倍 · 约 63 秒</option></select></label><span data-time>空台</span><input data-progress type="range" min="0" max="37826" value="0" step="1" aria-label="演示进度" disabled></div>
<div class="ct-display"><span data-pace-note>塑形放慢，细笔加快</span><div data-light-control role="group" aria-label="沙台光线"><button data-light="transmitted" aria-pressed="true">透光成画</button><button data-light="raking" aria-pressed="false">侧光看沙</button></div><button data-theater aria-pressed="false">专注观看 ↗</button></div>
<div class="ct-layout"><section class="ct-stage"><canvas aria-label="沙台过程演示"></canvas><span class="ct-loading" role="status">正在准备沙台…</span><span class="ct-overlay" data-label>空台 · 等待第一缕沙</span><span class="ct-stamp" data-stamp>REED STUDY · 12s</span></section>
<aside><span class="ct-eyebrow" data-actions-title>成画章节</span><button data-jump="168"><b>01</b><span>薄灰与场景<small>先铺出环境</small></span></button><button data-jump="390"><b>02</b><span>主体灰面<small>建立大明暗</small></span></button><button data-jump="630"><b>03</b><span>面部塑形<small>添暗，收出亮面</small></span></button><button data-jump="960"><b>04</b><span>双手与茶杯<small>整理局部光影</small></span></button><button data-jump="1230"><b>05</b><span>细部光影<small>继续刻画</small></span></button><button data-jump="37826"><b>06</b><span>落定留画<small>查看实际成品</small></span></button>
<div class="ct-watch" data-watch-control><span>慢看塑形</span><button data-watch="face">细看面部 · 25 秒</button><button data-watch="hands">细看手与杯 · 28 秒</button></div><div class="ct-views" role="group" aria-label="观察视角"><button data-view="angle" aria-pressed="false">斜视</button><button data-view="top" aria-pressed="true">俯视</button><button data-view="close" aria-pressed="false">局部近景</button><button data-view="flow" aria-pressed="false">跟随笔触</button></div><div class="ct-focus" data-focus-control><span>近景位置</span><div role="group" aria-label="近景位置"><button data-focus="face" aria-pressed="true">人物</button><button data-focus="hands" aria-pressed="false">手与杯</button><button data-focus="coat" aria-pressed="false">衣身</button></div></div><label data-hand-control><input data-hand type="checkbox" checked> 显示手部</label><label data-contact-control><input data-contact type="checkbox"> 查看接触位置</label><p class="ct-view-help" data-view-help>俯视看完整构图；局部近景固定看人物或杯子，播放时不会追着笔触跳动。</p><div class="ct-models"><span>接触对照</span><div role="group" aria-label="移沙方式"><button data-model="skin" aria-pressed="true">皮肤接触</button><button data-model="brush" aria-pressed="false">固定工具</button></div><small>切换后重算到当前时刻。</small></div><div class="ct-reserve"><span><span data-reserve-label>供沙余量</span> <output data-reserve>100%</output></span><meter min="0" max="1" value="1" aria-label="供沙余量"></meter><small data-reserve-help>有限供沙，停沙后保留自然落定的时间。</small></div></aside></div>
<div class="ct-ledger" aria-label="沙量去向"><span>台上 <output data-table>100%</output></span><span>手中 <output data-held>0%</output></span><span><span data-air-label>下落</span> <output data-air>0%</output></span><span><span data-outside-label>台外</span> <output data-outside>0%</output></span></div>
<div class="ct-bottom"><p data-status role="status">正在准备成画。</p><div><button data-reload hidden>重新载入</button><button data-png disabled>保存画面 ↓</button><button data-clip hidden>保存本段视频 ↓</button><button data-video disabled>下载完整过程 ↓</button><a data-recording hidden download>再次下载刚才录像 ↓</a></div></div>
  <details><summary>关于这个试验</summary><p>“沿形撒收”保留原照细节目标，重新沿明暗轮廓规划较长曲线，并在一笔内渐变供沙与收沙力度。细部不再统一以十倍速度闪过：完整观看按路径长度留出动作时间，换笔先停沙，章节之间停留。实际材料仍逐步计算，未使用成品贴图显影。“看细部撒沙/收沙”抽取同一动作谱里的细笔，以慢动作近景观看。v29 的动作谱、材料、画质与节奏保留。这仍是受控照片的材料动画实验，细碎区域会有短笔，尚不能替代真实沙画表演。</p><p>“细节撒收”从原照重新规划人物、指节和杯口明暗，缩窄沙流散布，以减少柔化。收沙从已有沙层带起颗粒，移出后才计台外；边缘保留薄沙脊。它是无手镜头下的移沙近似，尚不是完整手与沙物理模拟。慢动作入口抽取实际动作谱中的一笔，以 ¼ 倍播放，到停沙末端暂停；材料的每个时间步不变。“连续撒收 · v28”以及更早两版保留。</p><p>“连续撒收”独立重新规划动作：先建立大灰面，再沿结构曲线添沙、收出亮面。移动按弧长采样，供沙渐起渐停，近台下落；停沙后等待落定，不再自动揉散。收沙保留少量沿迹薄沙脊。它仍是算法规划与材料近似，尚未达到人工大师或实拍效果。新旧章长不同，切换按章节内进度对照。</p><p>“局部连续 · 保留版”保持 v27 的 2,042 笔、材料规则与章节时长：只重编排最后的细笔，重叠动作保留先后关系。它和“原版逐笔”仍有大量短笔修正，重编排会改变随机落点，两者成品接近但不逐值相同。各版本保留独立定位检查点，切换保持镜头位置与光线。</p><p>原照是此前的 AI 虚构示例。目标只用于离线规划动作，不是网页里的成品贴图或显影遮罩；所有视角读取实际生成的同一份 768×512 沙量。默认按章节调节速度，章间停留 0.8 秒；每个材料时间步都完整执行，设备较慢时可能更久。保留 1/4/10 倍匀速，“慢看塑形”到章末暂停，“细看撒收”播放 12 秒后暂停。透光与侧光只改变观看方式，不改沙量。</p><p>无手芦苇是独立的 12 秒小样，曲线供沙从台面上方 29 厘米下落。侧面镜头只拍落点附近，供沙口在取景范围外。颗粒是读取已有密度的稳定渲染采样，不额外增加材料。原取沙与接触演示保留，台上、手中、下落和台外按初始总沙量显示。</p><p><a href="https://www.innerscene.com/tools/library/3d-parts/posable-anatomical-right-hand-f6098b4f" target="_blank" rel="noopener">模型：Innerscene / MakeHuman · CC0</a>；皮肤：jartur69 / MakeHuman · CC0。现有生成手、照片创作与沙画模式保留。</p></details></main>`
const get = <E extends HTMLElement>(selector: string) => root.querySelector<E>(selector)!
const canvas = get<HTMLCanvasElement>('canvas'), play = get<HTMLButtonElement>('[data-play]'), restart = get<HTMLButtonElement>('[data-restart]')
const progress = get<HTMLInputElement>('[data-progress]'), png = get<HTMLButtonElement>('[data-png]'), video = get<HTMLButtonElement>('[data-video]')
const speed = get<HTMLSelectElement>('[data-speed]')
root.querySelectorAll<HTMLButtonElement>('[data-arrangement], [data-detail], [data-observe], [data-watch], [data-jump], [data-sequence], [data-view], [data-focus], [data-light], [data-theater]').forEach(button=>button.disabled=true)
let scene: ContactScene | undefined, playing = false, active = true, last = 0, accumulator = 0, raf = 0, seekId = 0
let recorder: MediaRecorder | undefined, cancelled = false, seeking = false,contextLost=false
let recordingLeadUntil=0,recordingTailUntil=0
let playbackEnd:number|undefined
let playbackStart=0
let playbackPhase=0,chapterPreview:number|undefined
let playbackSection:'chapter'|'detail'='chapter'
let clipTool:'pour'|'collect'|undefined
let recordingURL:string|undefined
const status = (text: string) => { get('[data-status]').textContent = text }
const pace=():PhotoPace=>speed.value==='guided'?'guided':Number(speed.value) as .25|1|4|10
const elapsed=(tick:number)=>scene?.sequence==='photo'?scene.photo.timing.elapsed(tick,pace()):tick*CONTACT_DT
const duration=()=>scene?elapsed(scene.ticks):0
const stepSeconds=()=>scene?.sequence==='photo'?scene.photo.timing.stepSeconds(scene.tick,pace()):CONTACT_DT
const paceLabel=()=>scene?.sequence==='photo'?(pace()==='guided'?'分章节奏':pace()+' 倍预览'):'原速'
function configureSequence() {
  if(!scene)return
  const pickup=scene.sequence==='pickup',pour=scene.sequence==='pour',photo=scene.sequence==='photo',noHand=scene.noHand
  get('[data-study]').textContent=photo?'无手照片试镜 / 11':pour?'无手落沙试镜 / 05':'三维接触试验 / 04'
  get('h1').textContent=photo?'雨窗与茶杯，慢慢成画。':pour?'风过芦苇，只看沙。':pickup?'这一把沙，从台上来。':'看手怎样改变沙。'
  get('[data-intro]').textContent=photo?'从空台添沙、塑形与留白。先看画面怎样形成，再靠近看沙。':pour?'细流、弯曲枝条与短弧聚沙。12 秒，从空台到一株芦苇。':pickup?'取沙、握持、松指漏沙，再落回台面。24 秒，跟随同一把沙。':'松指落沙，掌缘推沙，指腹留痕。20 秒，观察每一次接触。'
  get('[data-stamp]').textContent=photo?`WINDOW STUDY · ${scene.photo.painting.plan.strokes.length.toLocaleString()} STROKES`:pour?'REED STUDY · 12s':pickup?'HANDFUL STUDY · 24s':'CONTACT STUDY · 20s'
  get('[data-actions-title]').textContent=photo?'逐章看成画':pour?'四个成画阶段':pickup?'跟随这一把沙':'四个动作'
  get('[data-reserve-label]').textContent=pour?'供沙余量':'手中沙量'
  get('meter').setAttribute('aria-label',pour?'供沙余量':'手中余沙')
  get('[data-reserve-help]').textContent=pour?'有限供沙，停沙后保留自然落定的时间。':pickup?'占初始沙量；取沙增加，漏沙减少。':'预装预算，细撒与散撒共用，重播补满。'
  get('[data-view="close"]').textContent=photo?'局部近景':pour?'沙粒近景':'手部近景'
  get('[data-view="flow"]').textContent=photo?'跟随笔触':pour?'落沙特写':'漏沙侧视'
  get('[data-hand-control]').hidden=noHand;get('[data-contact-control]').hidden=noHand;get('.ct-models').hidden=noHand
  get('[data-view-help]').hidden=!noHand
  get('[data-view-help]').textContent=photo?'俯视看完整构图；局部近景固定看人物或杯子，播放时不会追着笔触跳动。': '俯视看构图；落沙特写只看沙流末段，源头在画面外。'
  get('[data-watch-control]').hidden=!photo;get('[data-light-control]').hidden=!photo;get('[data-pace-note]').hidden=!photo;
  get('[data-arrangement-control]').hidden=!photo
  get('[data-focus-control]').hidden=!photo;get('[data-speed-control]').hidden=!photo;get('.ct-reserve').hidden=photo
  scene.showHand(!noHand&&get<HTMLInputElement>('[data-hand]').checked)
  scene.showContact(!noHand&&get<HTMLInputElement>('[data-contact]').checked)
  scene.view('top');root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view==='top')))
  get('.ct-ledger').hidden=!pickup&&!photo
  get('[data-held]').parentElement!.hidden=photo
  get('[data-air-label]').textContent=photo?'移动中':'下落'
  get('[data-outside-label]').textContent=photo?'已移出':'台外'
  progress.max=String(scene.ticks)
  speed.options[0].textContent=`分章节奏 · 约 ${Math.ceil(scene.photo.timing.duration('guided'))} 秒`
  speed.querySelector<HTMLOptionElement>('option[value="10"]')!.textContent=`10 倍 · 约 ${Math.ceil(scene.photo.ticks*CONTACT_DT/10)} 秒`
  get('[data-watch="face"]').textContent=`细看面部 · ${Math.round((scene.photo.painting.phaseStarts[3]-scene.photo.painting.phaseStarts[2])*CONTACT_DT)} 秒`
  get('[data-watch="hands"]').textContent=`细看手与杯 · ${Math.round((scene.photo.painting.phaseStarts[4]-scene.photo.painting.phaseStarts[3])*CONTACT_DT)} 秒`
  const starts=scene.photo.painting.phaseStarts
  const stages=photo?[[starts[1],'薄灰与场景','先铺出环境'],[starts[2],'主体灰面','头发与衣身成形'],[starts[3],'面部塑形','添暗，收出亮面'],[starts[4],'双手与茶杯','整理局部光影'],[starts[5],'细部光影','细笔添沙与留白'],[scene.ticks,'落定留画','查看实际成品']]:pour?[[180,'主干细流','连续下落形成第一笔'],[360,'弯曲枝条','停沙换笔后继续'],[555,'穗部聚沙','短弧与疏密变化'],[720,'余沙落定','看完整成画']]:pickup?[[168,'指腹取沙','从沙堆收进手中'],[390,'掌内握持','翻掌看沙量'],[630,'松指细漏','手中减少，台上增加'],[960,'张指散漏','余沙落回台面'],[1230,'掌缘推沙','接触、移动与堆积']]:[[180,'捻指细撒','沙从指缝落下'],[510,'抬手散撒','散落与深浅变化'],[810,'掌缘推沙','接触、移动与堆积'],[1035,'指腹划线','亮槽与两侧沙脊']]
  root.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach((button,index)=>{
    const stage=stages[index];button.hidden=!stage
    if(stage){button.dataset.jump=String(stage[0]);button.innerHTML=`<b>${String(index+1).padStart(2,'0')}</b><span>${stage[1]}<small>${stage[2]}</small></span>`}
  })
  root.querySelectorAll<HTMLButtonElement>('[data-sequence]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sequence===scene!.sequence)))
}
function update() {
  if (!scene) return
  play.textContent = playing ? '暂停 Ⅱ' : scene.tick === scene.ticks ? '再看一次 ▶' : scene.tick ? '继续播放 ▶' : scene.sequence==='photo'?'播放成画 ▶':`播放 ${scene.ticks*CONTACT_DT} 秒 ▶`
  progress.value = String(scene.tick)
  get('[data-time]').textContent=playbackEnd===undefined?`${elapsed(scene.tick).toFixed(1)} / ${duration().toFixed(1)} 秒 · ${paceLabel()}`:`${playbackSection==='detail'?'片段':'章节'} ${(elapsed(scene.tick)-elapsed(playbackStart)).toFixed(1)} / ${(elapsed(playbackEnd)-elapsed(playbackStart)).toFixed(1)} 秒`
  get('[data-label]').textContent = chapterPreview===undefined?scene.action().label:`${scene.photo.painting.phaseNames[chapterPreview]} · ${playbackEnd!==undefined&&playbackSection==='detail'?'本段已完成':'本章已完成'}`
  get('[data-pace-note]').textContent=playbackEnd!==undefined?paceLabel()+` · ${playbackSection==='detail'?'本段':'本章'}结束暂停`:pace()==='guided'?(scene.photoArrangement==='performance'?'细部沿形缓画 · 换笔停沙':scene.photoArrangement==='sculpt'?'关键撒收以原速观看 · 章间停留':'塑形放慢，细笔加快 · 章间停留'):pace()+' 倍匀速回放'
  get('[data-reserve]').textContent = `${Math.round(scene.driver.remaining * 100)}%`
  get<HTMLMeterElement>('meter').value = scene.driver.remaining
  if(scene.sequence==='pickup') {
    const ledger=scene.driver.accounting
    for(const [label,mass] of [['table',ledger.table],['held',ledger.hand],['air',ledger.air],['outside',ledger.outside]] as const) get(`[data-${label}]`).textContent=`${(mass/ledger.initial*100).toFixed(1)}%`
  }else if(scene.sequence==='photo'){
    const sand=scene.photo.material,total=sand.suppliedMass
    for(const [label,mass] of [['table',sand.mass],['air',sand.inAirMass],['outside',sand.removedMass]] as const)get(`[data-${label}]`).textContent=`${(total?mass/total*100:0).toFixed(1)}%`
  }
  const busy = !!recorder||contextLost
  root.querySelectorAll<HTMLButtonElement>('[data-arrangement], [data-detail], [data-observe]').forEach(button=>button.disabled=busy||seeking)
  root.querySelectorAll<HTMLButtonElement>('[data-arrangement]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.arrangement===scene!.photoArrangement)))
  get('[data-arrangement-note]').textContent=scene.photoArrangement==='performance'?'沿明暗轮廓连续撒收，力度渐变；完整播放为每笔细部留出时间。v29 与更早版本保留。':scene.photoArrangement==='sculpt'?'从原照恢复细节，沙粒可见下落与带走。v28 与更早版本均保留。':scene.photoArrangement==='gesture'?'长曲线撒沙，沿迹收出亮面。按章节进度对照旧版。':scene.photoArrangement==='coherent'?'保留上一版：细笔沿相邻区域接着画。':'沿用最初动作顺序。按章节进度切换对照。'
  get('[data-recording]').hidden=busy||!recordingURL
  speed.disabled=busy||seeking
  get<HTMLButtonElement>('[data-clip]').hidden=scene.sequence!=='photo'||playbackEnd===undefined
  get<HTMLButtonElement>('[data-clip]').disabled=busy||seeking
  progress.disabled = busy; restart.disabled = busy; play.disabled = busy || seeking; png.disabled = busy || seeking; video.disabled = busy || seeking
  root.querySelectorAll<HTMLButtonElement>('[data-jump], [data-view], [data-focus], [data-watch], [data-light], [data-theater]').forEach(button => button.disabled = busy||seeking)
  root.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach((button,index)=>button.setAttribute('aria-current',String(scene!.sequence==='photo'&&index===(chapterPreview??scene!.photo.painting.phase))))
  root.querySelectorAll<HTMLButtonElement>('[data-model], [data-sequence]').forEach(button => button.disabled = busy||seeking)
  root.querySelectorAll<HTMLInputElement>('[data-hand], [data-contact]').forEach(control => control.disabled = busy)
}
function pause() { playing = false; accumulator = 0; last = 0; update() }
function frame(now: number) {
  if (!active) return
  if (scene && playing) {
    if (last&&(!recorder||now>=recordingLeadUntil)) accumulator += Math.min(.25, (now - last) / 1000)
    let steps=0
    const end=playbackEnd??scene.ticks
    while (scene.tick < end && steps++<24) {
      const cost=stepSeconds();if(accumulator+1e-9<cost)break
      scene.step();accumulator=Math.max(0,accumulator-cost)
    }
    scene.paint(); scene.render(); update()
    if (scene.tick === end && recorder?.state==='recording') {
      recordingTailUntil ||= now+500
      if(now>=recordingTailUntil){pause();chapterPreview=playbackEnd===undefined?undefined:playbackPhase;recorder.stop()}
    } else if(playbackEnd!==undefined&&scene.tick>=playbackEnd){pause();chapterPreview=playbackPhase;status(playbackSection==='detail'?`这段${scene.photo.painting.plan.motion?'撒收':'细笔'}已回放完。可保存本段视频，或继续观看后续动作。`:'这一章已回放完。可以换光线观察，或继续播放后续章节。');update()}
    else if (scene.tick === scene.ticks) {
      if(recorder?.state==='recording'&&scene.sequence==='photo'){
        recordingTailUntil ||= now+500
        if(now>=recordingTailUntil){pause();recorder.stop()}
      }else{pause();if(recorder?.state==='recording')recorder.stop()}
    }
  }
  last = now; raf = requestAnimationFrame(frame)
}
async function seek(tick: number) {
  if (!scene || recorder) return false
  playbackEnd=undefined
  clipTool=undefined
  chapterPreview=undefined
  const id = ++seekId; pause(); seeking = true
  const target = Math.max(0, Math.min(scene.ticks, tick))
  if(scene.sequence==='photo'){scene.photo.rewindTo(target);scene.tick=scene.photo.tick}else scene.reset()
  status(`正在定位到 ${elapsed(target).toFixed(1)} 秒…`); update()
  while (scene.tick < target && id === seekId && active) {
    // 定位按帧内时间预算推进，慢设备保持可响应；避免每帧固定 30 步造成长等待。
    const until=performance.now()+8
    do { scene.step() } while(scene.tick<target&&performance.now()<until)
    scene.paint(); scene.render(); update()
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  }
  if (id === seekId) { seeking = false; accumulator = 0; last = 0; status('定位完成。可以继续播放、换视角或保存画面。'); update();return true }
  return false
}
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500) }
play.onclick = () => { if (!scene) return; ++seekId;playbackEnd=undefined;chapterPreview=undefined; if (playing) pause(); else { if (scene.tick === scene.ticks) scene.reset(); playing = true; last = 0; update() } }
restart.onclick = () => { if (!scene) return; ++seekId;playbackEnd=undefined;chapterPreview=undefined; seeking = false; pause(); scene.reset(); status(scene.sequence==='photo'?'已回到照片空台，可以重新观看完整成画。':scene.sequence==='pour'?'已回到空台，可以重新观看 12 秒落沙。':scene.sequence==='pickup'?'已恢复初始沙堆，手中没有预装沙。':'已回到空台，这一把沙已补满。'); update() }
speed.onchange=()=>{accumulator=0;last=0;update();status(pace()==='guided'?'已切换分章节奏，面部与杯子放慢，章间停留，所有笔触完整执行。':`已切换 ${pace()} 倍匀速。1 倍可细看添沙与收沙。`)}
progress.oninput = () => { void seek(Number(progress.value)) }
root.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach((button,index) => { button.onclick = () => { void(async()=>{
  if(await seek(Number(button.dataset.jump))&&scene?.sequence==='photo'){chapterPreview=index;update()}
})() } })
root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => { button.onclick = () => { scene?.view(button.dataset.view as 'top' | 'angle'|'close'|'flow'); root.querySelectorAll('[data-view]').forEach(value => value.setAttribute('aria-pressed', String(value === button))) } })
root.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach(button=>{button.onclick=()=>{
  scene?.focus(button.dataset.focus as PhotoFocus);scene?.view('close')
  root.querySelectorAll('[data-focus]').forEach(value=>value.setAttribute('aria-pressed',String(value===button)))
  root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(value=>value.setAttribute('aria-pressed',String(value.dataset.view==='close')))
}})
root.querySelectorAll<HTMLButtonElement>('[data-watch]').forEach(button=>{button.onclick=()=>{void(async()=>{
  if(!scene||recorder||seeking||scene.sequence!=='photo')return
  const focus=button.dataset.watch as PhotoFocus,phase=focus==='face'?2:3
  const start=scene.photo.painting.phaseStarts[phase],end=scene.photo.painting.phaseStarts[phase+1]
  speed.value='1';scene.focus(focus);scene.view('close')
  root.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach(value=>value.setAttribute('aria-pressed',String(value.dataset.focus===focus)))
  root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(value=>value.setAttribute('aria-pressed',String(value.dataset.view==='close')))
  if(!await seek(start))return
  playbackStart=start;playbackEnd=end;playbackPhase=phase;playbackSection='chapter';playing=true;last=0
  status(`正在以 1 倍回放${focus==='face'?'面部':'双手与茶杯'}塑形，本章结束自动暂停。`);update()
})()}})
root.querySelectorAll<HTMLButtonElement>('[data-light]').forEach(button=>{button.onclick=()=>{
  scene?.lighting(button.dataset.light as PhotoLighting)
  root.querySelectorAll('[data-light]').forEach(value=>value.setAttribute('aria-pressed',String(value===button)))
}})
root.querySelectorAll<HTMLButtonElement>('[data-arrangement]').forEach(button=>{button.onclick=()=>{void(async()=>{
  if(!scene||recorder||seeking||scene.sequence!=='photo')return
  const mode=button.dataset.arrangement as PhotoArrangement
  if(mode===scene.photoArrangement)return
  const previous=scene.photo.painting.plan,tick=scene.tick;pause();playbackEnd=undefined;chapterPreview=undefined
  scene.arrangePhoto(mode);const target=mapPhotoProgress(previous,scene.photo.painting.plan,tick)
  // 更新章长与速度，保持原镜头、近景焦点及光线。
  const view=root.querySelector<HTMLButtonElement>('[data-view][aria-pressed="true"]')?.dataset.view??'top'
  configureSequence();scene.view(view as 'top'|'angle'|'close'|'flow')
  root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)))
  update();if(await seek(target))status('已切换编排，定位到相同章节进度。镜头与光线保留。')
})()}})
root.querySelectorAll<HTMLButtonElement>('[data-observe]').forEach(button=>{button.onclick=()=>{void(async()=>{
  if(!scene||recorder||seeking||scene.sequence!=='photo')return
  const fine=button.dataset.observe!.startsWith('fine-'),tool=button.dataset.observe!.replace('fine-','') as 'pour'|'collect',window=photoActionWindow(scene.photo.painting.plan,tool,fine?'fine':'shape')
  if(!window){status('这一版没有可单独观看的塑形动作。');return}
  const view=fine?'close':'flow';speed.value='0.25';scene.focus(window.focus);scene.view(view)
  root.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach(value=>value.setAttribute('aria-pressed',String(value.dataset.focus===window.focus)))
  root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(value=>value.setAttribute('aria-pressed',String(value.dataset.view===view)))
  if(!await seek(window.start))return
  playbackStart=window.start;playbackEnd=window.end;playbackPhase=window.phase;playbackSection='detail';clipTool=tool;playing=true;last=0
  status(`以 ¼ 倍看这一笔${tool==='pour'?'沙流下落、堆起暗面':'沙粒被带起、留下亮面'}，停沙末端自动暂停。`);update()
})()}})
get<HTMLButtonElement>('[data-detail]').onclick=()=>{void(async()=>{
  if(!scene||recorder||seeking||scene.sequence!=='photo')return
  const strokes=scene.photo.painting.plan.strokes
  const index=strokes.findIndex(s=>s.phase===4&&s.finish==='settle'&&(!scene!.photo.painting.plan.motion||s.region==='face'))
  if(index<0){status('这份动作谱没有连续细笔段。');return}
  const start=strokes.slice(0,index).reduce((time,s)=>time+s.ticks+10,0)
  const end=Math.min(start+720,scene.photo.painting.phaseStarts[5])
  speed.value='1';scene.focus(strokes[index].region==='hands'||strokes[index].region==='cup'?'hands':'face');scene.view('close')
  root.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.focus===scene!.photo.focus)))
  root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view==='close')))
  if(!await seek(start))return
  playbackStart=start;playbackEnd=end;playbackPhase=4;playbackSection='detail';playing=true;last=0
  status('以 1 倍细看撒沙与收沙，12 秒后暂停；可按章节进度切换保留版对照。');update()
})()}
function theater(show:boolean){
  if(recorder)return
  document.body.classList.toggle('ct-theater',show)
  const button=get<HTMLButtonElement>('[data-theater]');button.setAttribute('aria-pressed',String(show));button.textContent=show?'退出专注 · Esc':'专注观看 ↗'
}
get<HTMLButtonElement>('[data-theater]').onclick=()=>theater(!document.body.classList.contains('ct-theater'))
document.addEventListener('keydown',event=>{if(event.key==='Escape')theater(false)})
root.querySelectorAll<HTMLButtonElement>('[data-model]').forEach(button=>{button.onclick=()=>{
  if(!scene||recorder)return
  const tick=scene.tick;scene.contactMode=button.dataset.model as 'skin'|'brush'
  root.querySelectorAll('[data-model]').forEach(value=>value.setAttribute('aria-pressed',String(value===button)))
  void seek(tick)
}})
get<HTMLInputElement>('[data-hand]').onchange = event => scene?.showHand((event.target as HTMLInputElement).checked)
get<HTMLInputElement>('[data-contact]').onchange = event => scene?.showContact((event.target as HTMLInputElement).checked)
get<HTMLButtonElement>('[data-reload]').onclick=()=>location.reload()
root.querySelectorAll<HTMLButtonElement>('[data-sequence]').forEach(button=>{button.onclick=()=>{
  if(!scene||recorder||seeking)return
  ++seekId;playbackEnd=undefined;chapterPreview=undefined;pause();scene.sequence=button.dataset.sequence as 'photo'|'pour'|'pickup'|'contact';scene.reset();configureSequence();update()
  status(scene.sequence==='photo'?'已回到照片空台，点击播放，或逐章看添沙与留白。':scene.sequence==='pour'?'已回到无手落沙：俯视看成画，落沙特写看沙流末段。':scene.sequence==='pickup'?'已切换取沙流程：先收沙，再看掌内握持与漏沙。':'已切换原 20 秒接触演示。')
}})
const exportLabel=()=>scene?.sequence==='photo'?'无手照片':scene?.sequence==='pour'?'无手落沙':scene?.sequence==='pickup'?'取沙漏沙':'原接触演示'
const exportMode=()=>scene?.sequence==='photo'?`雨窗与茶杯-${scene.photoArrangement==='performance'?'沿形撒收-v30':scene.photoArrangement==='sculpt'?'细节撒收-v29':scene.photoArrangement==='gesture'?'连续撒收-v28':scene.photoArrangement==='coherent'?'局部连续':'原版逐笔'}`:scene?.sequence==='pour'?'芦苇':scene?.contactMode==='skin'?'皮肤接触':'固定工具'
png.onclick = () => { scene?.render();const mode=exportMode(),label=exportLabel(); canvas.toBlob(blob => { if (blob) { download(blob, `沙台-${scene?.photoArrangement==='performance'?'v30':'v29'}-${label}-${mode}-当前画面.png`); status('已保存当前实际画面。') } else status('画面导出失败。') }, 'image/png') }
video.onclick = () => {void recordVideo()}
get<HTMLButtonElement>('[data-clip]').onclick=()=>{if(playbackEnd!==undefined)void recordVideo({start:playbackStart,end:playbackEnd})}
async function recordVideo(clip?:{start:number;end:number}) {
  if (!scene || recorder) return
  if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) { status('当前浏览器不支持过程录像，可播放或保存画面。'); return }
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(value => MediaRecorder.isTypeSupported(value))
  if (!mime) { status('当前浏览器没有可用的视频编码器。'); return }
  let stream: MediaStream | undefined
  try {
    const tool=clipTool,recordedMode=exportMode()+(clip?tool==='pour'?'-撒沙慢动作':tool==='collect'?'-收沙慢动作':'-慢看片段':''),recordedLabel=exportLabel(),recordedDuration=(clip?elapsed(clip.end)-elapsed(clip.start):duration()).toFixed(1),recordedPace=paceLabel()
    const phase=playbackPhase,section=playbackSection
    if(clip){if(!await seek(clip.start))return;playbackStart=clip.start;playbackEnd=clip.end;playbackPhase=phase;playbackSection=section;clipTool=tool}
    else {++seekId; playbackEnd=undefined;chapterPreview=undefined;pause(); scene.reset()}
    scene.render()
    stream = canvas.captureStream(30)
    const recording = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 7_000_000 }), chunks: Blob[] = [], started = performance.now()
    recorder = recording; cancelled = false;recordingLeadUntil=scene.sequence==='photo'?performance.now()+900:0;recordingTailUntil=0
    recording.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
    recording.onerror = () => { cancelled = true; pause(); if (recording.state !== 'inactive') recording.stop(); status('视频编码失败，可重试。') }
    recording.onstop = () => { void (async () => {
      stream?.getTracks().forEach(track => track.stop()); recorder = undefined; update()
      if (cancelled || !active || !chunks.length) return
      const result = await finalizeWebMDuration(new Blob(chunks, { type: recording.mimeType }), performance.now() - started)
      if (!active) return
      if(recordingURL)URL.revokeObjectURL(recordingURL)
      recordingURL=URL.createObjectURL(result.blob)
      const link=get<HTMLAnchorElement>('[data-recording]');link.href=recordingURL
      link.download=`沙台-${scene?.photoArrangement==='performance'?'v30':'v29'}-${recordedLabel}-${recordedMode}-${recordedPace}-${recordedDuration}秒预览.webm`
      link.textContent=`再次下载 · ${recordedMode} ↓`;link.hidden=false;link.click()
      status('录像已生成。可再次下载刚才录像，无需重新录制。')
    })().catch(() => status('视频导出失败，请重试。')) }
    recording.start(250); playing = true; last = 0; update(); status(clip?'正在记录当前片段，结束后自动下载…':'正在记录完整过程，请保持本页可见…')
  } catch { stream?.getTracks().forEach(track => track.stop()); recorder = undefined; pause(); status('视频录制未能启动，可保存画面。') }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); if (recorder?.state === 'recording') { cancelled = true; recorder.stop(); status('页面离开前台，已取消录制。') } } })
canvas.addEventListener('webglcontextlost', event => { event.preventDefault();contextLost=true;++seekId;seeking=false; pause(); if (recorder?.state === 'recording') { cancelled = true; recorder.stop() }get('[data-reload]').hidden=false;status('图形上下文已中断。重新载入后可恢复演示。');update() })
window.addEventListener('pagehide', event => { if (!event.persisted) { active = false; ++seekId; cancelAnimationFrame(raf); if (recorder?.state === 'recording') { cancelled = true; recorder.stop() }if(recordingURL)URL.revokeObjectURL(recordingURL); scene?.dispose() } })
try {
  const loadPlan=async(url:string)=>{const response=await fetch(url);if(!response.ok)throw new Error('照片动作谱载入失败。');return decodePortraitPlan(await response.text())}
  const [model,skin,plan,gesturePlan,sculptPlan,performancePlan]=await Promise.all([new GLTFLoader().loadAsync(modelUrl),new T.TextureLoader().loadAsync(skinUrl),loadPlan(photoScoreUrl),loadPlan(gestureScoreUrl),loadPlan(sculptScoreUrl),loadPlan(performanceScoreUrl)])
  skin.colorSpace = T.SRGBColorSpace; skin.flipY = false; skin.anisotropy = 8
  scene = new ContactScene(canvas, model.scene, skin,plan,gesturePlan,sculptPlan,performancePlan)
  configureSequence()
  get('.ct-loading').hidden = true; [play, restart, progress, png, video].forEach(control => control.disabled = false)
  status('准备好了。从空台播放雨窗人物，也可以逐章查看或切换保留的小样。'); update(); raf = requestAnimationFrame(frame)
} catch (error) { get('.ct-loading').textContent = '暂时无法载入'; status(error instanceof Error ? error.message : '演示载入失败。') }
