import './style.css'
import sampleUrl from '../../../../assets/photo-memory-v12/sample-window.png?url'
import studyUrl from '../../../../assets/photo-structure-v14/window-score.json?url'
import postcardUrl from '../../../../assets/photo-guided-v15/sample-postcard.png?url'
import postcardScoreUrl from '../../../../assets/photo-guided-v15/postcard-score.json?url'
import filmedReferenceUrl from '../../../../assets/material-realism-v16/filmed-reference.webm?url'
import recordedPourUrl from '../../../../assets/material-realism-v17/recorded-pour.webm?url'
import recordedPourCalibration from '../../../../assets/material-realism-v17/pour-calibration.json'
import naturalScoreUrl from '../../../../assets/material-realism-v17/natural-window-score.json?url'
import { StageMaterial, type StageMaterialSnapshot, type StagePoint } from '../stage/material'
import { coverCrop, dimensions, focusFor, moods, photoStyles, photoToSnapshot, settingsFor, type Mood, type PhotoSettings } from './model'
import { PhotoPainting, paintingPhases, paintingNotes, PHOTO_STEP } from './painting'
import { StructuredPainting, decodePortraitPlan } from './structured-painting'
import { requestStructurePlan } from './structure-client'
import { restorePerformance } from './performance'
import { guideBounds, guideNames, guideColors, validGuides, postcardGuides, windowGuides, type GuideKind } from './structure'
import { drawStageHand } from '../stage/hand'
import { listPhotoWorks, readPhotoWork, savePhotoWork, type PhotoWork } from './storage'
import { blobDataUrl, canvasBlob, decodePhotoProject, encodePhotoProject, escapeHtml, granularAvailable, makePoster, renderSand, standaloneExhibition } from './export'
import { FilmedHand, type HandKey, type HandRole } from './filmed-hand'
import { readHandRecords, saveHandRecords } from './hand-storage'
import { HandContactDemo } from './hand-contact-demo'
import { openGeneratedHands } from './generated-hands-demo'

const app = document.querySelector<HTMLElement>('#app')!
const handDrawEntry = `<section class="handdraw-entry" aria-label="自由手绘沙画"><div><p class="eyebrow">也可以亲手画</p><h2>用沙耙、手掌与一把沙，自己创作。</h2><p>沙面与灯箱两种画台，撒沙、推沙、刮线、沙耙、印章、抹平和掌形七种工具。画过的作品可以保存、重开和继续画。</p></div><div class="handdraw-actions"><a class="handdraw-primary" href="../#mode=surface&tool=rake">试试沙耙 ↗</a><a href="../">进入手绘沙台 ↗</a><a href="../#gallery">打开手绘作品集 ↗</a></div></section>`
app.innerHTML = `
<div class="memory-app">
  <header class="site-header"><a href="#create" class="brand"><span>沙</span><div>光阴沙画<small>MEMORIES IN SAND</small></div></a>
    <nav aria-label="照片沙画导航"><button id="nav-create" aria-current="page">照片创作</button><button id="nav-gallery">照片作品集 <span id="work-count">0</span></button><a class="handdraw-nav" href="../#mode=surface&tool=rake">手绘沙台 · 沙耙 ↗</a><a href="../gallery/">统一作品集 ↗</a><a href="keepsake/handwork/">纪念短片 · 局部推拢试片 ↗</a><a href="keepsake/sandlight/">保留版 v35 ↗</a><a href="keepsake/composition/">保留版 v34 ↗</a><a href="keepsake/natural/">保留版 v33 ↗</a><a href="keepsake/">保留版 v32 ↗</a><a href="../atelier/">手势创作台 ↗</a><a href="../research/">研究历程 ↗</a></nav>
  </header>
  <main>
    <section id="create-view">
      <div class="intro"><div><p class="eyebrow">一张照片，一刻记忆</p><h1>把想留下的一刻，<br><em>留在沙里。</em></h1></div><p>用光影记住人，用留白记住心情。<br>选择照片，做成属于你的沙画作品。</p></div>
      ${handDrawEntry}
      <div class="editor">
        <div class="studio">
          <div class="stage-toolbar"><span id="source-label">正在准备示例…</span><label><input type="checkbox" id="compare"> 对比原照</label><button id="fullscreen">全屏 ↗</button></div>
          <div id="stage-guide-tools" class="stage-guide-tools" hidden><span>选择部位后，在原照拖框</span>${Object.entries(guideNames).map(([kind,name])=>`<button data-guide-kind="${kind}" aria-pressed="false">${name}</button>`).join('')}<button id="guide-done">完成框选</button></div>
          <div class="sand-frame" id="sand-frame"><canvas id="sand-canvas" width="768" height="512" tabindex="0" aria-label="照片沙画，框选模式下拖动标注，局部修画模式下拖动操作沙层"></canvas><canvas id="original-canvas" width="768" height="512" aria-hidden="true" hidden></canvas><canvas id="gesture-canvas" width="768" height="512" aria-hidden="true"></canvas><button id="exit-fullscreen">退出全屏 ×</button><p id="loading" role="status">正在准备照片沙画…</p></div>
          <label class="comparison" id="comparison" hidden><span>原照</span><input id="compare-range" type="range" min="0" max="100" value="50" aria-label="原照与沙画对比分界"><span>沙画</span></label>
          <div class="art-caption"><span id="stage-note">选择你想留下的情绪。</span><div class="stage-actions"><button id="undo" disabled>撤销</button><button id="edit-toggle" aria-pressed="false">局部修画</button></div></div>
          <section class="material-look" aria-label="沙与手的质感对照"><div><span class="eyebrow">沙与手 · 质感试镜</span><strong>近看沙粒，观察手的接触。</strong></div><div class="surface-choices" role="group" aria-label="沙面呈现"><button data-surface="tone" aria-pressed="true">原影调</button><button data-surface="granular" aria-pressed="false">颗粒灯箱</button></div><p id="surface-note">切换同一沙层的呈现方式，成画进度和修画笔迹都会保留。</p><div class="filmed-actions"><button id="hand-contact-demo">看真实手部 · 15 秒试镜 ▶</button></div><p id="hand-match" role="status">当前使用程序手势提示</p><details id="filmed-hand-panel"><summary>实拍手部 · 试合成</summary><p>使用俯拍的绿幕、蓝幕或带透明背景的手部短片。保留实拍细节，以你标定的指尖接触点跟随沙画动作。分别为撒沙、掌扫、指尖刻画配置素材。短片跟随每一笔的进度，可截取动作区间并逐帧标定接触点；先以 1 倍速度检查。</p><label>对应手法<select id="hand-role"><option value="pour">撒沙</option><option value="palm">掌扫 / 揉沙</option><option value="finger">指尖刻画</option><option value="edge">掌侧推沙</option></select></label><div class="filmed-actions"><button id="choose-hand">选择实拍手部短片 ＋</button><button id="clear-hand" disabled>移除当前素材</button><button id="save-hands">保存手部素材到本机</button><input id="hand-file" type="file" accept="video/mp4,video/webm" hidden></div><p id="hand-status" role="status">尚未载入实拍手部。现有手势提示为程序轮廓。</p><fieldset id="hand-calibration" hidden><legend>标定手指与沙台的接触点</legend><canvas id="hand-preview" width="240" height="180" aria-label="手部素材预览，点击设置指尖接触点"></canvas><label>动作起点（秒）<input id="hand-start" type="number" min="0" step=".05" value="0"></label><label>动作终点（秒）<input id="hand-end" type="number" min=".05" step=".05" value="1"></label><label>素材进度<input id="hand-progress" type="range" min="0" max="1" step=".005" value="0"></label><span id="hand-frame-note" role="status"></span><span id="hand-anchor-count"></span><button id="reset-hand-anchors">重置接触点</button><label>背景<select id="hand-key"><option value="green">绿幕</option><option value="blue">蓝幕</option><option value="alpha">素材自带透明背景</option></select></label><label>手部大小<input id="hand-size" type="range" min=".1" max=".8" step=".01" value=".3"></label><span>点击预览中的指尖或掌侧接触点。标定不同帧后接触点自动插值。点击保存可在刷新后恢复素材；手部视频只存于本机，不随照片工程导出。</span></fieldset></details><details class="filmed-reference"><summary>对照真人沙画的手与沙</summary><video src="${filmedReferenceUrl}" controls playsinline preload="none" aria-label="真人沙画实拍参考片段"></video><p>真人实拍参考，非本程序生成：Телеканал КРТ《Сказки на песке #5》，2019。节选 55–71 秒、移除音频、转码。<a href="https://commons.wikimedia.org/wiki/File:%D0%9F%D0%BE%D1%87%D0%B5%D0%BC%D1%83_%D0%BA%D0%BE%D1%82_%D0%BF%D0%BE%D1%81%D0%BB%D0%B5_%D0%BE%D0%B1%D0%B5%D0%B4%D0%B0_%D1%83%D0%BC%D1%8B%D0%B2%D0%B0%D0%B5%D1%82%D1%81%D1%8F_%E2%80%93_%D0%9B%D0%B8%D1%82%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F_%D1%81%D0%BA%D0%B0%D0%B7%D0%BA%D0%B0_%D0%A1%D0%BA%D0%B0%D0%B7%D0%BA%D0%B8_%D0%BD%D0%B0_%D0%BF%D0%B5%D1%81%D0%BA%D0%B5_-5.webm" target="_blank" rel="noopener">来源</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a></p></details></section>
          <section class="painting-controls" aria-label="照片沙画成画过程"><div class="painting-heading"><div><span class="eyebrow">从空台到成画</span><strong id="painting-phase">风格预览</strong></div><label><input type="checkbox" id="show-hand" checked> 手势提示</label></div><p id="painting-note">点击播放，看曲线笔触如何铺灰、塑形与留白。</p><div class="painting-buttons"><button id="painting-play" class="primary">看成画过程 ▶</button><button id="painting-restart" disabled>重新成画</button><button id="painting-finish">看演出成品</button><button id="painting-takeover" disabled>接管这一刻</button><label>速度<select id="painting-speed" aria-label="成画速度"><option value="1">1 倍</option><option value="2" selected>2 倍</option><option value="4">4 倍</option></select></label></div><label class="painting-timeline"><input id="painting-progress" type="range" min="0" max="1000" value="0" disabled aria-label="成画进度"><output id="painting-time">待播放</output></label><div class="painting-chapters">${paintingPhases.map((name,i)=>`<button data-phase="${i}" disabled>${name}</button>`).join('')}</div></section>
          <fieldset id="brushes" hidden><legend>用手整理这一刻</legend><div class="brush-tools" role="group" aria-label="局部修画工具">
            <button data-tool="pour" aria-pressed="false">添沙</button><button data-tool="sweep" aria-pressed="false">推沙</button><button data-tool="finger" aria-pressed="false">划光</button><button data-tool="collect" aria-pressed="false">收沙</button><button data-tool="rub" aria-pressed="true">揉沙</button>
          </div><div class="brush-controls"><label>宽度<input type="range" id="brush-width" min="3" max="90" value="28"></label><label>力度<input type="range" id="brush-strength" min=".2" max="3" step=".1" value="1.4"></label><label>掌形方向<input type="range" id="brush-angle" min="-180" max="180" step="5" value="0"></label></div><span>按住沙台拖动 · 最多保留 8 步撤销</span></fieldset>
          <section class="guided-create" aria-label="照片结构成画"><span class="eyebrow">把这张照片画出来</span><strong>告诉沙画，先画哪里。</strong><p>框出主体，再标出脸、手或重要物件。按你标的位置逐步塑形，未标出的类别会跳过。标注由你完成，演出效果还在验证。</p><div class="guide-actions"><button id="guide-edit">框选照片结构</button><button id="guided-generate" class="primary" disabled>生成这张照片的演出</button><button id="guide-cancel" hidden>取消规划</button></div><fieldset id="guide-panel" hidden><legend>在原照上拖动框选</legend><div class="guide-tools">${Object.entries(guideNames).map(([kind,name])=>`<button data-guide-kind="${kind}" aria-pressed="false">${name}</button>`).join('')}</div><p id="guide-hint"></p><div id="guide-list"></div><button id="guide-clear">清除标注</button></fieldset><label class="guide-quality">规划程度<select id="guide-quality" aria-label="结构规划程度"><option value="fine">完整塑形</option><option value="balanced">快速试画</option></select></label><p id="guide-status" role="status">选择你的照片，或体验不同构图的示例。</p><div class="guide-samples"><button id="guide-window">标注示例 · 雨窗与茶杯</button><button id="guide-postcard">标注示例 · 公园与明信片</button><button id="prepared-postcard">直接试播公园示例</button></div><p>直接试播使用已校验的示例动作谱。自己的照片首次规划可能需要几分钟；照片在本浏览器处理，可随时取消。示例输入为 AI 虚构照片。重新裁切后需重新标注。</p></section>
          <div class="structure-study"><span class="eyebrow">保留的效果基线</span><strong>雨窗人物 · 单图演出</strong><p>保留你认可的上一版效果，点击即可载入已编排的演出；也可以继续使用原曲线模式。</p><button id="natural-study">试播细笔落定 · 新版雨窗</button><button id="structured-study">试播单图塑形 · 雨窗人物</button><button id="generic-study">使用原曲线试验</button><p>载入示例会开启一幅新作品。</p></div>
          <p class="method">风格预览由照片影调转换得到；演出从空台执行实际添沙、揉沙、收沙，完成时不替换成预览图。手影为程序提示。结构成画需要人工标注，不自动识别人脸或情绪。</p>
        </div>
        <aside class="controls" aria-label="照片与作品设置">
          <section><div class="step-title"><span>01</span><h2>选一刻</h2></div><button class="primary upload" id="choose-photo">选择你的照片 ＋</button><input type="file" id="photo-file" accept="image/jpeg,image/png,image/webp" hidden><button class="sample-link" id="load-sample">体验示例 · 雨天与一杯茶</button><p class="hint">JPEG / PNG / WebP · 在本浏览器本地处理<br>示例照片为 AI 生成的虚构场景。</p></section>
          <section><div class="step-title"><span>02</span><h2>选择创作方式</h2></div><div class="photo-styles" role="group" aria-label="创作风格">${Object.entries(photoStyles).map(([key,style])=>`<button data-style="${key}" aria-pressed="false">${style.name}</button>`).join('')}</div><p id="style-note" class="hint"></p><div class="focus-controls" id="focus-controls" hidden><button id="pick-focus" aria-pressed="false">在沙台点选主体位置</button><label>主体范围<input id="focusSize" data-setting="focusSize" type="range" min=".15" max=".6" step=".01" value=".34"><output id="focusSize-value">0.34</output></label><span>按你选择的范围保留细节，外围减淡；不自动识别人脸。</span></div><h2 class="mood-label">留一种心情</h2><div class="moods" role="group" aria-label="选择情绪表达">${Object.entries(moods).map(([key, mood]) => `<button data-mood="${key}" aria-pressed="${key === 'warm'}">${mood.name}</button>`).join('')}</div><p id="mood-note" class="hint"></p>
            <details class="tuning"><summary>调整影调与构图</summary>
              <label>画幅<select id="ratio"><option value="landscape">横幅 · 3:2</option><option value="portrait">竖幅 · 4:5</option><option value="square">方形 · 1:1</option><option value="wide">宽幅 · 16:9</option></select></label>
              ${[['exposure','明暗','-1','1','.02'],['contrast','反差','.55','1.8','.01'],['detail','细节','0','1','.02'],['grain','沙粒','0','1','.01'],['white','留白','0','1','.02'],['zoom','裁切放大','1','2.5','.05'],['panX','水平构图','0','1','.02'],['panY','垂直构图','0','1','.02']].map(([id,name,min,max,step])=>`<label>${name}<output id="${id}-value"></output><input id="${id}" data-setting="${id}" type="range" min="${min}" max="${max}" step="${step}"></label>`).join('')}
              <p class="hint">调整会从照片重建沙层；修画前可先定好构图，重建也可撤销。</p>
            </details>
          </section>
          <section><div class="step-title"><span>03</span><h2>给它一个名字</h2></div><label class="text-label">作品名<input id="work-title" maxlength="80" value="雨天，和你的一杯茶"></label><label class="text-label">想记住的话<textarea id="work-caption" maxlength="300" rows="3">有些日常，在回想时才知道有多珍贵。</textarea></label><button id="save-work" class="primary">保存到作品集</button><button id="show-exhibit">作品展映 ↗</button><p id="save-note" class="hint">作品集保存在本浏览器。下载作品可另行备份。</p></section>
          <section class="exports"><h2>带走这幅作品</h2><button id="export-png">下载沙画 PNG ↓</button><button id="export-poster">下载纪念画卡 ↓</button><button id="export-html">下载独立展览页 ↓</button><label class="include-photo"><input id="include-photo" type="checkbox"> 导出展览 / 作品时包含原照</label><div class="project-actions"><button id="export-project">导出可编辑作品</button><button id="import-project">导入作品</button></div><input id="project-file" type="file" accept=".json,application/json" hidden></section>
        </aside>
      </div>
    </section>
    <section id="gallery-view" hidden><div class="view-heading"><div><p class="eyebrow">你的私人收藏</p><h1>把日常，慢慢留住。</h1></div><button id="gallery-create" class="primary">创作新照片作品 ＋</button></div><nav class="collection-switch" aria-label="作品集类型"><a href="../gallery/">全部作品 · 统一作品集 ↗</a><span aria-current="page">照片作品 · 当前</span><a href="../gallery/#type=hand">手绘作品 ↗</a></nav><p class="hint">这里展示你的照片作品。亲手用沙耙、撒沙等工具画出的作品，可从手绘作品集打开继续画。</p>${handDrawEntry}<div id="gallery-grid" class="gallery-grid"></div></section>
    <section id="exhibit-view" hidden><div class="exhibit-toolbar"><span>光阴沙画 / 一刻记忆</span><div><button id="exhibit-back">返回作品集</button><button id="exhibit-edit">继续修画</button></div></div><figure class="exhibit-art"><img id="exhibit-image" alt="沙画作品"></figure><div class="exhibit-caption"><div><p class="eyebrow" id="exhibit-mood"></p><h1 id="exhibit-title"></h1><p id="exhibit-text"></p></div><button id="exhibit-download">下载独立展览页 ↓</button></div><p class="hint" id="exhibit-source"></p></section>
  </main>
  <footer><span>光阴沙画 · 照片与记忆</span><span>本地创作 / 可编辑沙层 / 独立展览</span></footer>
  <p id="status" class="status" role="status" aria-live="polite"></p>
</div>`

const get = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const canvas = get<HTMLCanvasElement>('sand-canvas'), original = get<HTMLCanvasElement>('original-canvas')
const gesture = get<HTMLCanvasElement>('gesture-canvas')
const handLibrary:Record<HandRole,FilmedHand>={pour:new FilmedHand(),palm:new FilmedHand(),finger:new FilmedHand(),edge:new FilmedHand()}
let handRole:HandRole='pour',filmedHand=handLibrary.pour,handPreviewProgress=0
const handNames:Record<HandRole,string>={pour:'撒沙',palm:'掌扫 / 揉沙',finger:'指尖刻画',edge:'掌侧推沙'}
let handDemo:HandContactDemo|undefined
const sourceCanvas = document.createElement('canvas')
const title = get<HTMLInputElement>('work-title'), caption = get<HTMLTextAreaElement>('work-caption')
const photoFile = get<HTMLInputElement>('photo-file'), projectFile = get<HTMLInputElement>('project-file')
const compare = get<HTMLInputElement>('compare')
let settings = settingsFor(), material = new StageMaterial(768, 512)
let source: Blob | undefined, bitmap: ImageBitmap | undefined, sourceKind: PhotoWork['sourceKind'] = 'ai-sample'
let currentId: string | undefined, createdAt = '', busy = false, ready = false, editing = false, dirty = false, revision = 0
let tool: 'pour' | 'sweep' | 'finger' | 'collect' | 'rub' = 'rub'
let pointer: { id: number; last: StagePoint; point: StagePoint; pressure: number } | undefined
let showView: 'create' | 'gallery' | 'exhibit' = 'create'
let painting: PhotoPainting | StructuredPainting | undefined, playing = false, focusSelecting = false, seekRevision = 0, frameClock = 0, accumulator = 0
let guideEditing=false,guideKind:GuideKind='subject',guideDrag:{id:number;from:StagePoint;to:StagePoint}|undefined
let planJob:ReturnType<typeof requestStructurePlan>|undefined
let exhibitUrl: string | undefined, galleryUrls: string[] = []
const undo: { snapshot: StageMaterialSnapshot; settings: PhotoSettings }[] = []
let noticeTimer: number | undefined
const tell = (text: string) => { window.clearTimeout(noticeTimer); get('status').textContent = text; noticeTimer = window.setTimeout(()=>{get('status').textContent=''},9000) }
function setBusy(value: boolean, text = '正在准备沙画…') {
  busy = value; get('loading').hidden = !value; get('loading').textContent = text
  for (const id of ['nav-create', 'nav-gallery', 'gallery-create', 'exhibit-back', 'exhibit-edit', 'exhibit-download']) get<HTMLButtonElement>(id).disabled = value
  app.querySelectorAll<HTMLButtonElement>('#create-view button').forEach(b => { b.disabled = value || !ready && !['choose-photo', 'load-sample', 'import-project'].includes(b.id) })
  app.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.tuning input,.tuning select,.moods button,.photo-styles button,.focus-controls input,.focus-controls button').forEach(b => { b.disabled = value || !bitmap && b.id !== 'grain' })
  get<HTMLButtonElement>('undo').disabled = value || !undo.length
  get<HTMLSelectElement>('guide-quality').disabled=value
  get<HTMLButtonElement>('clear-hand').disabled=value||!filmedHand.ready
  updateGuideControls()
  updatePaintingControls()
  updateComparison()
}
function updateSettings() {
  for (const [key, value] of Object.entries(settings)) {
    const input = document.getElementById(key) as HTMLInputElement | HTMLSelectElement | null
    if (input) input.value = String(value)
    const output = document.getElementById(key + '-value')
    if (output) output.textContent = Number(value).toFixed(2)
  }
  app.querySelectorAll('[data-mood]').forEach(b => b.setAttribute('aria-pressed', String((b as HTMLElement).dataset.mood === settings.mood)))
  app.querySelectorAll('[data-style]').forEach(b=>b.setAttribute('aria-pressed',String((b as HTMLElement).dataset.style===(settings.style??'photo'))))
  get('style-note').textContent=photoStyles[settings.style??'photo'].note
  get('focus-controls').hidden=settings.style!=='portrait'
  get<HTMLInputElement>('focusSize').value=String(focusFor(settings).size)
  get('focusSize-value').textContent=focusFor(settings).size.toFixed(2)
  get('mood-note').textContent = moods[settings.mood].note
  get('stage-note').textContent = moods[settings.mood].note
  app.querySelectorAll<HTMLButtonElement>('[data-surface]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.surface===(settings.surface??'tone'))))
  updateGuideControls()
}
function updateGuideControls(){
  const guides=settings.structure??[]
  get<HTMLButtonElement>('guide-edit').disabled=busy||!bitmap
  get('guide-edit').textContent=guideEditing?'完成框选':'框选照片结构'
  get('stage-guide-tools').hidden=!guideEditing
  get<HTMLButtonElement>('guided-generate').disabled=busy||!bitmap||!guides.length
  get('guide-panel').hidden=!guideEditing&&!guides.length
  get('guide-cancel').hidden=!planJob;get<HTMLButtonElement>('guide-cancel').disabled=!planJob
  get('guide-hint').textContent=guideEditing?`正在框选${guideNames[guideKind]}。主体建议包含整个要保留的人或物；脸、手、物件可各标多个，最多 12 个区域。`:`已保留 ${guides.length} 个区域。可重新框选，或直接生成演出。`
  app.querySelectorAll<HTMLButtonElement>('[data-guide-kind]').forEach(b=>{b.disabled=busy||!bitmap;b.setAttribute('aria-pressed',String(b.dataset.guideKind===guideKind))})
  const counts:Record<string,number>={}
  get('guide-list').innerHTML=guides.map(g=>{const label=guideNames[g.kind]+(counts[g.kind]=(counts[g.kind]??0)+1);return `<button data-guide-remove="${g.id}" ${busy?'disabled':''} aria-label="移除${label}">${label} ×</button>`}).join('')
  get<HTMLButtonElement>('guide-clear').disabled=busy||!guides.length
}
function setGuideEditing(value:boolean){
  guideEditing=value&&!!bitmap;guideDrag=undefined
  if(guideEditing){pausePainting();pointer=undefined;editing=false;get('brushes').hidden=true;get('edit-toggle').textContent='局部修画';get('edit-toggle').setAttribute('aria-pressed','false');focusSelecting=false;get('pick-focus').setAttribute('aria-pressed','false')}
  updateGuideControls();updateComparison();paintGesture()
}
function drawGuides(ctx:CanvasRenderingContext2D){
  const counts:Record<string,number>={}
  const rectangles=(settings.structure??[]).map(g=>({kind:g.kind,bounds:g.bounds,label:guideNames[g.kind]+(counts[g.kind]=(counts[g.kind]??0)+1)}))
  if(guideDrag)rectangles.push({kind:guideKind,bounds:guideBounds(guideDrag.from,guideDrag.to),label:guideNames[guideKind]})
  ctx.save();ctx.font='14px Microsoft YaHei, sans-serif';ctx.lineWidth=2
  for(const r of rectangles){const [a,b,c,d]=r.bounds,x=a*gesture.width,y=b*gesture.height,w=(c-a)*gesture.width,h=(d-b)*gesture.height;ctx.strokeStyle=guideColors[r.kind];ctx.fillStyle=guideColors[r.kind]+'16';ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);const tw=ctx.measureText(r.label).width+12;ctx.fillStyle='#151512de';ctx.fillRect(x,y,tw,23);ctx.fillStyle=guideColors[r.kind];ctx.fillText(r.label,x+6,y+17)}
  ctx.restore()
}
function commitGuide(from:StagePoint,to:StagePoint){
  const guide={id:crypto.randomUUID(),kind:guideKind,bounds:guideBounds(from,to)}
  const next=[...(settings.structure??[]).filter(g=>guideKind!=='subject'||g.kind!=='subject'),guide]
  if(!validGuides(next)){tell('请框出至少占画幅 2% 宽和高的区域；最多保留 12 个区域。');return}
  remember();detachPainting();settings={...settings,structure:next};markChanged();updateGuideControls();paintGesture()
}
async function loadGuidedSample(kind:'window'|'postcard'){
  if(busy)return
  setBusy(true,'正在准备标注示例…')
  try{
    const response=await fetch(kind==='window'?sampleUrl:postcardUrl);if(!response.ok)throw new Error('示例读取失败。')
    const blob=await response.blob();setBusy(false)
    if(!await loadPhoto(blob,true))return
    settings={...settings,detail:.8,contrast:1.1,grain:.35,focusX:kind==='window'?.67:.30,focusY:kind==='window'?.57:.51,focusSize:kind==='window'?.34:.39,structure:structuredClone(kind==='window'?windowGuides:postcardGuides)}
    title.value=kind==='window'?'雨窗，与你的一杯茶':'公园里的一封信';caption.value=kind==='window'?'有些日常，在回想时才知道有多珍贵。':'有些话，读到时仍像初次收到。'
    updateSettings();convert();setGuideEditing(true);get('guide-status').textContent='示例已人工标注，可调整区域后生成实际演出。';tell('标注示例已准备；图中的区域是人工标注，可以重新框选。')
  }finally{setBusy(false)}
}
async function loadDefaultSample(){
  if(busy)return
  setBusy(true,'正在准备示例照片…')
  try{const response=await fetch(sampleUrl);if(!response.ok)throw new Error('示例载入失败。');const blob=await response.blob();setBusy(false);await loadPhoto(blob,true)}
  catch(error){tell(error instanceof Error?error.message:'示例载入失败，请选择你的照片。')}
  finally{setBusy(false)}
}
async function startGuidedPainting(){
  if(busy||!bitmap||!settings.structure?.length)return
  pausePainting();guideDrag=undefined;pointer=undefined
  const guides=structuredClone(settings.structure),nextSettings=settingsWithGuides(settings,guides)
  const target=photoToSnapshot(original.getContext('2d')!.getImageData(0,0,original.width,original.height).data,original.width,original.height,nextSettings)
  setBusy(true,'正在为这张照片校验实际笔触…');get('guide-status').textContent='后台规划开始，当前作品会保留到计算完成。'
  try{
    planJob=requestStructurePlan(target,{guides,quality:get<HTMLSelectElement>('guide-quality').value as 'fine'|'balanced',touch:'natural'},(fraction,phase)=>{const message=`正在校验 ${['场景','主体灰面','面部','手与物件','细部光影','落定'][phase]} · ${Math.round(fraction*100)}%`;get('loading').textContent=message;get('guide-status').textContent=message})
    updateGuideControls();const plan=await planJob.promise
    remember();settings=nextSettings;setGuideEditing(false);focusSelecting=false;editing=false;get('brushes').hidden=true;get('edit-toggle').textContent='局部修画';get('edit-toggle').setAttribute('aria-pressed','false');compare.checked=false;updateComparison()
    painting=new StructuredPainting(plan);material=painting.material;playing=false;frameClock=0;accumulator=0
    const speed=get<HTMLSelectElement>('painting-speed');for(const value of ['8','10'])if(!speed.querySelector(`[value="${value}"]`))speed.add(new Option(`${value} 倍 · 快速预览`,value));speed.value='10'
    resize();drawCrop();updateSettings();paint();markChanged();updatePaintingControls();get('guide-status').textContent=`已规划 ${plan.strokes.length} 笔 · 当前照片的结构演出已准备。`
    get('save-note').textContent=`点击开始成画，10 倍约 ${Math.round(plan.totalTicks/600)} 秒；可分段查看、接管修画和收藏。`
    tell('已为这张照片生成实际工具演出。点击开始成画，或先查看章节。')
  }catch(error){get('guide-status').textContent=error instanceof DOMException&&error.name==='AbortError'?'规划已取消，原来的作品与标注已保留。':error instanceof Error?error.message:'规划失败，请重试。';tell(get('guide-status').textContent!)}
  finally{planJob=undefined;setBusy(false);updateGuideControls()}
}
function settingsWithGuides(current:PhotoSettings,guides:NonNullable<PhotoSettings['structure']>){
  const subject=guides.find(g=>g.kind==='subject')?.bounds
  return {...current,...(subject&&current.style==='portrait'?{focusX:(subject[0]+subject[2])/2,focusY:(subject[1]+subject[3])/2,focusSize:Math.max(.15,Math.min(.6,Math.max((subject[2]-subject[0])*.55,(subject[3]-subject[1])/2.84)+.04))}:{}),structure:guides}
}
function resize() {
  original.width = material.width; original.height = material.height
  canvas.width = gesture.width = material.width * 2; canvas.height = gesture.height = material.height * 2
  get('sand-frame').style.setProperty('--photo-ratio', String(material.width / material.height))
}
function paint() { renderSand(canvas, material.read(), settings); if(settings.surface==='granular'&&!granularAvailable())get('surface-note').textContent='当前浏览器无法使用颗粒灯箱，已显示原影调。';paintGesture(); dirty = false }
function paintGesture() {
  const ctx=gesture.getContext('2d')!;ctx.clearRect(0,0,gesture.width,gesture.height)
  if(guideEditing){drawGuides(ctx);return}
  if(compare.checked) return
  const particles=material.airborne
  ctx.strokeStyle='rgba(77,48,26,.45)';ctx.lineWidth=.7;ctx.beginPath()
  for(let i=0;i<particles.length;i+=Math.max(1,Math.ceil(particles.length/1500))){const p=particles[i],x=p.x*gesture.width,y=p.y*gesture.height-p.z*gesture.width*.55;ctx.moveTo(x,y);ctx.lineTo(x,y+1.2)}ctx.stroke()
  const hand=painting?.hand??(pointer?{...pointer.point,down:true,pose:tool==='pour'?'pour' as const:tool==='sweep'||tool==='rub'?'palm' as const:'finger' as const,rotation:0}:undefined)
  const calibrating=get<HTMLDetailsElement>('filmed-hand-panel').open&&!playing&&!pointer
  if(calibrating)get('hand-match').textContent='手部素材标定中 · 演出已暂停'
  else if(!get<HTMLInputElement>('show-hand').checked)get('hand-match').textContent='手部显示已关闭'
  else if(!hand)get('hand-match').textContent=painting?'抬手，等待沙粒落定':'当前使用程序手势提示'
  if(hand && get<HTMLInputElement>('show-hand').checked&&!calibrating) {
    const clip=handLibrary[hand.pose],hasFootage=Object.values(handLibrary).some(c=>c.ready)
    if(clip.ready)clip.draw(ctx,hand,painting instanceof StructuredPainting?painting.handProgress:((painting?.tick??material.elapsedTime*60)%84)/84)
    else if(painting&&!hasFootage)drawStageHand(ctx,hand,painting.tick*PHOTO_STEP)
    get('hand-match').textContent=hasFootage?clip.ready?`当前手法：${handNames[hand.pose]} · 实拍片段跟随笔触`:`当前手法：${handNames[hand.pose]} · 缺少对应实拍素材，暂隐手部`:'当前使用程序手势提示'
  }
  if(filmedHand.ready){if(calibrating)filmedHand.sync(handPreviewProgress);filmedHand.preview(get<HTMLCanvasElement>('hand-preview'));get('hand-frame-note').textContent=filmedHand.frameReady?`当前素材帧 ${(filmedHand.calibration.start+filmedHand.decodedProgress*(filmedHand.calibration.end-filmedHand.calibration.start)).toFixed(2)} 秒 · 可点击标定`:'正在读取所选帧，请稍候标定…'}
  if(focusSelecting){const f=focusFor(settings);ctx.strokeStyle='#8f6540';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.ellipse(f.x*gesture.width,f.y*gesture.height,f.size*gesture.width,f.size*1.42*gesture.height,0,0,Math.PI*2);ctx.stroke()}
}
function pausePainting() { playing=false;Object.values(handLibrary).forEach(c=>c.pause());frameClock=0;accumulator=0;updatePaintingControls() }
function detachPainting() { pausePainting();painting=undefined;seekRevision++;updatePaintingControls();paintGesture() }
function updatePaintingControls() {
  const active=!!painting
  get<HTMLButtonElement>('painting-play').disabled=busy||!ready
  get('painting-play').textContent=playing?'暂停成画 Ⅱ':active&&painting!.tick===0?'开始成画 ▶':active&&painting!.tick<painting!.totalTicks?'继续成画 ▶':'看成画过程 ▶'
  for(const id of ['painting-restart','painting-takeover']) get<HTMLButtonElement>(id).disabled=busy||!active
  get<HTMLButtonElement>('painting-finish').disabled=busy||!ready
  get<HTMLInputElement>('painting-progress').disabled=busy||!active
  get<HTMLSelectElement>('painting-speed').disabled=busy
  const structured=painting instanceof StructuredPainting,names=painting instanceof StructuredPainting?painting.phaseNames:paintingPhases
  if(structured){const speed=get<HTMLSelectElement>('painting-speed');for(const value of ['8','10'])if(!speed.querySelector(`[value="${value}"]`))speed.add(new Option(`${value} 倍 · 快速预览`,value))}
  app.querySelectorAll<HTMLButtonElement>('[data-phase]').forEach(b=>{b.disabled=busy||!active;b.textContent=names[Number(b.dataset.phase)];b.setAttribute('aria-current',String(active&&Number(b.dataset.phase)===painting!.phase))})
  if(painting){get('painting-phase').textContent=names[painting.phase];get('painting-note').textContent=(painting instanceof StructuredPainting?painting.note:paintingNotes[painting.phase])+(painting instanceof StructuredPainting?' '+painting.toolNote:'');get<HTMLInputElement>('painting-progress').value=String(Math.round(painting.tick/painting.totalTicks*1000));get('painting-time').textContent=(painting.tick/60).toFixed(1)+' / '+(painting.totalTicks/60).toFixed(1)+' 秒'+(structured?' · 模拟时间':'')}
  else{get('painting-phase').textContent='风格预览 / 当前作品';get('painting-note').textContent='点击播放，看曲线笔触如何铺灰、塑形与留白。';get<HTMLInputElement>('painting-progress').value='0';get('painting-time').textContent='待播放'}
}
function startPainting() {
  if(!ready||busy)return
  setGuideEditing(false)
  remember();pointer=undefined;editing=false;get('brushes').hidden=true;get('edit-toggle').textContent='局部修画';get('edit-toggle').setAttribute('aria-pressed','false')
  focusSelecting=false;get('pick-focus').setAttribute('aria-pressed','false');compare.checked=false;updateComparison()
  const target=bitmap?photoToSnapshot(original.getContext('2d')!.getImageData(0,0,original.width,original.height).data,original.width,original.height,settings):material.read()
  painting=new PhotoPainting(target,settings);material=painting.material;playing=true;frameClock=0;accumulator=0
  markChanged();paint();updatePaintingControls();get('save-note').textContent='演出使用实际沙层 · 可暂停接管，也可撤销回到开始前的作品。'
}
async function startStructuredStudy(kind:'window'|'postcard'|'natural'='window') {
  if(busy)return
  setGuideEditing(false)
  pausePainting();setBusy(true,'正在载入单图塑形动作…')
  try {
    const [score,sample]=await Promise.all([fetch(kind==='natural'?naturalScoreUrl:kind==='window'?studyUrl:postcardScoreUrl).then(r=>{if(!r.ok)throw new Error('动作示例载入失败。');return r.text()}),fetch(kind==='postcard'?postcardUrl:sampleUrl).then(r=>{if(!r.ok)throw new Error('照片示例载入失败。');return r.blob()})])
    const plan=decodePortraitPlan(score)
    setBusy(false);if(!await loadPhoto(sample,true))throw new Error('示例照片未能打开。')
    if(!ready||sourceKind!=='ai-sample')throw new Error('示例照片未能打开。')
    settings={...settings,detail:.8,contrast:1.1,grain:.35}
    if(kind==='postcard'){settings=settingsWithGuides(settings,structuredClone(plan.guides!));title.value='公园里的一封信';caption.value='有些话，读到时仍像初次收到。'}
    if(kind==='natural'){settings={...settings,style:'portrait',focusX:.67,focusY:.57,focusSize:.34,structure:structuredClone(plan.guides!),surface:'granular'};title.value='雨窗与茶杯 · 细笔落定'}
    updateSettings();convert();remember()
    pointer=undefined;editing=false;get('brushes').hidden=true;get('edit-toggle').textContent='局部修画';get('edit-toggle').setAttribute('aria-pressed','false')
    focusSelecting=false;get('pick-focus').setAttribute('aria-pressed','false');compare.checked=false;updateComparison()
    painting=new StructuredPainting(plan);material=painting.material;playing=false;frameClock=0;accumulator=0
    const speed=get<HTMLSelectElement>('painting-speed');for(const value of ['8','10'])if(!speed.querySelector(`[value="${value}"]`))speed.add(new Option(`${value} 倍 · 快速预览`,value));speed.value='10'
    resize();drawCrop();updateSettings();paint();markChanged();updatePaintingControls();get('source-label').textContent=kind==='natural'?'细笔落定试验 · AI 雨窗人物':kind==='window'?'单图塑形验证 · AI 雨窗人物':'结构演出示例 · AI 公园人物'
    get('guide-status').textContent=kind==='postcard'?`已载入 ${plan.strokes.length} 笔公园示例动作，无需重新规划。`:'可为自己的照片重新标注并规划演出。'
    get('save-note').textContent=`从空台准备完成 · 10 倍约 ${Math.round(plan.totalTicks/60/10)} 秒，1 倍可细看动作；终态仍可修画、收藏与导出。`
    tell(kind==='natural'?'细笔落定已准备，1337 笔细节添沙后不再自动揉开。旧示例保留，可分别试播对照。':kind==='window'?'单图试验已准备。从薄灰、头发衣身、面部到双手杯子逐步成画；这是模拟时间，可选择加速。':'公园示例已准备。从空台执行已校验动作，可逐章查看或直接播放。')
    if(kind==='natural')history.replaceState(null,'','#natural')
  }catch(error){tell(error instanceof Error?error.message:'单图示例载入失败。')}
  finally{setBusy(false)}
}
async function seekPainting(tick:number) {
  if(!painting||busy)return
  const current=painting, revision=++seekRevision;pausePainting();setBusy(true,'正在从真实笔触重建这一刻…')
  try{const to=current.rewindTo(tick);while(current.tick<to&&revision===seekRevision){for(let n=0;n<160&&current.tick<to;n++)current.step();paint();updatePaintingControls();await new Promise<void>(resolve=>setTimeout(resolve,0))}if(revision===seekRevision){markChanged();paint()}}
  finally{setBusy(false);updatePaintingControls()}
}
function markChanged() {
  revision++; dirty = true
  get('save-note').textContent = '有未保存的调整 · 点击保存到作品集。'
}
function remember() {
  undo.push({ snapshot: material.read(), settings: { ...settings } })
  if (undo.length > 8) undo.shift()
  get<HTMLButtonElement>('undo').disabled = false
}
function drawCrop() {
  if (!bitmap) return
  const rect = coverCrop(bitmap.width, bitmap.height, material.width, material.height, settings.zoom, settings.panX, settings.panY)
  original.getContext('2d')!.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height, 0, 0, original.width, original.height)
}
function convert() {
  if (!bitmap) return
  detachPainting()
  const [width, height] = dimensions(settings.ratio)
  material = new StageMaterial(width, height); resize(); drawCrop()
  const pixels = original.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, width, height).data
  material.restore(photoToSnapshot(pixels, width, height, settings)); paint(); markChanged()
  get('stage-note').textContent = moods[settings.mood].note
}
async function decodePhoto(blob: Blob) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) || blob.size > 30 * 1024 * 1024) throw new Error('请选择 30 MB 以内的 JPEG、PNG 或 WebP 图片。')
  const image = await createImageBitmap(blob)
  if (image.width * image.height > 40000000 || Math.max(image.width, image.height) > 16000) { image.close(); throw new Error('照片尺寸过大，请缩小后再试。') }
  return image
}
async function loadPhoto(blob: Blob, sample: boolean, name = '') {
  if (busy) return false
  setGuideEditing(false)
  setBusy(true, '正在读取照片，整理光影…')
  try {
    const image = await decodePhoto(blob), scale = Math.min(1, 1600 / Math.max(image.width, image.height))
    sourceCanvas.width = Math.max(1, Math.round(image.width * scale)); sourceCanvas.height = Math.max(1, Math.round(image.height * scale))
    const ctx = sourceCanvas.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height)
    ctx.drawImage(image, 0, 0, sourceCanvas.width, sourceCanvas.height); image.close()
    const normalized = await canvasBlob(sourceCanvas, 'image/jpeg', .92)
    const nextBitmap = await decodePhoto(normalized)
    bitmap?.close(); bitmap = nextBitmap; source = normalized; sourceKind = sample ? 'ai-sample' : 'photo'
    detachPainting();currentId = undefined; createdAt = ''; settings = {...settingsFor('warm'),style:sample?'portrait':'photo',focusX:sample?.67:.5,focusY:sample?.57:.52,focusSize:.34}; undo.length = 0; ready = true
    title.value = sample ? '雨天，和你的一杯茶' : name.replace(/\.[^.]+$/, '').slice(0, 80) || '想留下的一刻'
    caption.value = sample ? '有些日常，在回想时才知道有多珍贵。' : ''
    get('source-label').textContent = sample ? 'AI 示例照片 · 虚构场景' : '你的照片 · 本地处理'
    get('guide-status').textContent='照片已准备，可框选主体和关键部位后生成演出。'
    compare.checked = false; updateComparison(); updateSettings(); convert(); showCreate()
    tell(sample ? '示例已转为可编辑沙画。你也可以选择自己的照片。' : '照片已转为沙画，可调整心情、光影与构图。')
    return true
  } catch (error) { tell(error instanceof Error ? error.message : '照片读取失败，请换一张图片。');return false }
  finally { setBusy(false) }
}
function updateComparison() {
  original.hidden = !bitmap||!guideEditing&&!compare.checked
  compare.disabled=busy||guideEditing
  get('comparison').hidden = original.hidden||guideEditing
  original.style.clipPath = guideEditing?'none':'inset(0 ' + (100 - Number(get<HTMLInputElement>('compare-range').value)) + '% 0 0)'
  paintGesture()
}
function selectView(view: typeof showView) {
  if(view!=='create')pausePainting()
  showView = view
  for (const name of ['create', 'gallery', 'exhibit']) get(name + '-view').hidden = name !== view
  get('nav-create').setAttribute('aria-current', view === 'create' ? 'page' : 'false')
  get('nav-gallery').setAttribute('aria-current', view !== 'create' ? 'page' : 'false')
  pointer = undefined
}
function showCreate() { selectView('create'); history.replaceState(null, '', '#create') }
async function showGallery() {
  if (busy) return
  selectView('gallery'); history.replaceState(null, '', '#gallery')
  try {
    const works = await listPhotoWorks(); galleryUrls.forEach(url => URL.revokeObjectURL(url)); galleryUrls = []
    get('work-count').textContent = String(works.length)
    get('gallery-grid').innerHTML = works.length ? works.map(work => {
      const url = URL.createObjectURL(work.image); galleryUrls.push(url)
      return `<article class="work-card"><button data-open="${escapeHtml(work.id)}" class="work-image" aria-label="展映 ${escapeHtml(work.title)}"><img src="${url}" alt="${escapeHtml(work.title)}的沙画"></button><div><span>${photoStyles[work.settings.style??'photo'].name} · ${moods[work.settings.mood].name} · ${new Date(work.updatedAt).toLocaleDateString('zh-CN')}</span><h2>${escapeHtml(work.title)}</h2><p>${escapeHtml(work.caption)}</p><button data-open="${escapeHtml(work.id)}">展映 ↗</button><button data-edit="${escapeHtml(work.id)}">继续修画</button></div></article>`
    }).join('') : '<div class="empty"><h2>这里会留下你的作品。</h2><p>选一张照片，为它命名，保存到作品集。</p><button id="empty-create" class="primary">开始创作 ＋</button></div>'
  } catch { tell('作品集读取失败。当前沙画仍可下载保存。') }
}
async function saveCurrent(): Promise<PhotoWork | undefined> {
  if (!ready || busy) return
  pausePainting()
  paint()
  const capturedRevision = revision
  setBusy(true, '正在收藏这一刻…')
  try {
    const image = await canvasBlob(canvas, 'image/jpeg', .94), now = new Date().toISOString()
    const work: PhotoWork = { version: 1, id: currentId ?? crypto.randomUUID(), title: title.value.trim() || '想留下的一刻',
      caption: caption.value.trim(), sourceKind, source, image, settings: { ...settings }, snapshot: material.read(),
      createdAt: createdAt || now, updatedAt: now,...(painting instanceof StructuredPainting?{performance:{plan:painting.plan,tick:painting.tick}}:{}) }
    await savePhotoWork(work); currentId = work.id; createdAt = work.createdAt
    const works = await listPhotoWorks(); get('work-count').textContent = String(works.length)
    if (capturedRevision === revision) get('save-note').textContent = '已保存 · 同一浏览器来源内可随时继续修改。'
    tell('作品已收藏。可以展映，或下载展览页带走。'); return work
  } catch { tell('浏览器未能保存作品，请下载 PNG 或可编辑作品备份。'); return undefined }
  finally { setBusy(false) }
}
async function displayExhibit(work: PhotoWork) {
  if (exhibitUrl) URL.revokeObjectURL(exhibitUrl)
  exhibitUrl = URL.createObjectURL(work.image); get<HTMLImageElement>('exhibit-image').src = exhibitUrl
  get<HTMLImageElement>('exhibit-image').alt = work.title + '的沙画成品'
  get('exhibit-title').textContent = work.title; get('exhibit-text').textContent = work.caption
  get('exhibit-mood').textContent = photoStyles[work.settings.style??'photo'].name+' · '+moods[work.settings.mood].name + ' / ' + new Date(work.updatedAt).toLocaleDateString('zh-CN')
  get('exhibit-source').textContent = work.sourceKind === 'ai-sample' ? '示例原照为 AI 生成的虚构场景。作品保存在本浏览器，下载展览页可离线展示。' : '由你的照片转成沙画。作品保存在本浏览器，下载展览页可离线展示。'
  selectView('exhibit'); history.replaceState(null, '', '#work=' + encodeURIComponent(work.id))
}
async function loadWork(id: string, exhibit: boolean) {
  if (busy) return
  setGuideEditing(false)
  setBusy(true, '正在打开作品…')
  try {
    const work = await readPhotoWork(id); if (!work) throw new Error('当前浏览器找不到这幅作品。')
    let nextBitmap: ImageBitmap | undefined
    if (work.source) nextBitmap = await decodePhoto(work.source)
    const nextPainting=work.performance?restorePerformance(work.performance,work.snapshot):undefined
    const nextMaterial = nextPainting?.material??new StageMaterial(work.snapshot.width, work.snapshot.height);if(!nextPainting)nextMaterial.restore(work.snapshot)
    detachPainting();painting=nextPainting;bitmap?.close(); bitmap = nextBitmap; material = nextMaterial; source = work.source; sourceKind = work.sourceKind
    currentId = work.id; createdAt = work.createdAt; settings = { ...work.settings }; title.value = work.title; caption.value = work.caption
    undo.length = 0; ready = true; resize(); drawCrop(); paint(); updateSettings()
    compare.checked = false; updateComparison(); get('source-label').textContent = work.sourceKind === 'ai-sample' ? 'AI 示例照片 · 虚构场景' : '你的照片 · 本地处理'
    get('save-note').textContent = nextPainting?'已恢复作品和原演出 · 可从这一刻继续，或从空台重新成画。':'已打开收藏作品 · 修改后保存将更新这幅作品。'
    if (exhibit) await displayExhibit(work); else { showCreate(); history.replaceState(null, '', '#edit=' + encodeURIComponent(work.id)) }
  } catch (error) { tell(error instanceof Error ? error.message : '作品打开失败。'); setBusy(false); await showGallery() }
  finally { setBusy(false) }
}
function download(blob: Blob, suffix: string) {
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = (title.value.trim() || '想留下的一刻').replace(/[<>:"/\\|?*]/g, '').slice(0, 80) + suffix
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000)
}
async function exportArtifact(kind: 'png' | 'poster' | 'html' | 'project') {
  if (!ready || busy) return
  pausePainting()
  paint()
  setBusy(true, '正在制作可带走的作品…')
  try {
    const state = material.read(), workTitle = title.value.trim() || '想留下的一刻', text = caption.value.trim()
    if (kind === 'project') {
      const data = { format: 'sandboard-photo' as const, version: 1 as const, title: workTitle, caption: text, sourceKind,
        settings, snapshot: state, source: get<HTMLInputElement>('include-photo').checked && source ? await blobDataUrl(source) : undefined,...(painting instanceof StructuredPainting?{performance:{plan:painting.plan,tick:painting.tick}}:{}) }
      download(new Blob([encodePhotoProject(data)], { type: 'application/json' }), '.sandphoto.json')
    } else if (kind === 'poster') download(await canvasBlob(makePoster(state, settings, workTitle, text)), '-纪念画卡.png')
    else {
      const output = document.createElement('canvas'); output.width = 1536; output.height = Math.round(1536 * state.height / state.width)
      renderSand(output, state, settings); const blob = await canvasBlob(output)
      if (kind === 'png') download(blob, '-沙画.png')
      else {
        const before = get<HTMLInputElement>('include-photo').checked && bitmap ? await blobDataUrl(await canvasBlob(original, 'image/jpeg', .92)) : undefined
        download(new Blob([standaloneExhibition(workTitle, text, settings.mood, await blobDataUrl(blob), before, sourceKind === 'ai-sample',settings.style??'photo')], { type: 'text/html;charset=utf-8' }), '-展览.html')
      }
    }
    tell(kind === 'html' ? '展览页已下载，内置作品图片，可离线打开或分享文件。' : '作品已下载。')
  } catch { tell('导出失败，请重试或选择其他导出方式。') }
  finally { setBusy(false) }
}

get('choose-photo').addEventListener('click', () => photoFile.click())
get('load-sample').addEventListener('click', () => { void loadDefaultSample() })
photoFile.addEventListener('change', () => { const file = photoFile.files?.[0]; if (file) void loadPhoto(file, false, file.name); photoFile.value = '' })
get('nav-create').addEventListener('click', () => { if (!busy) showCreate() })
app.querySelector('.brand')!.addEventListener('click', event => { event.preventDefault(); if (!busy) showCreate() })
get('nav-gallery').addEventListener('click', () => { void showGallery() })
get('gallery-create').addEventListener('click', showCreate)
get('gallery-grid').addEventListener('click', event => {
  const element = (event.target as HTMLElement).closest<HTMLButtonElement>('button')
  if (element?.id === 'empty-create') showCreate()
  else if (element?.dataset.open) void loadWork(element.dataset.open, true)
  else if (element?.dataset.edit) void loadWork(element.dataset.edit, false)
})
app.querySelectorAll<HTMLButtonElement>('[data-mood]').forEach(button => button.addEventListener('click', () => {
  if (!bitmap || busy) return
  remember(); const next = settingsFor(button.dataset.mood as Mood)
  settings = { ...settings, ...next, ratio: settings.ratio, zoom: settings.zoom, panX: settings.panX, panY: settings.panY }
  updateSettings(); convert()
}))
app.querySelectorAll<HTMLButtonElement>('[data-style]').forEach(button=>button.addEventListener('click',()=>{
  if(busy||!bitmap)return
  remember();settings={...settings,style:button.dataset.style as PhotoSettings['style']};updateSettings();convert()
}))
get('pick-focus').addEventListener('click',()=>{if(busy||!bitmap)return;setGuideEditing(false);pausePainting();focusSelecting=!focusSelecting;get('pick-focus').setAttribute('aria-pressed',String(focusSelecting));compare.checked=false;updateComparison();paintGesture();if(focusSelecting)tell('在沙台上点一下人物或你想留下的主体中心。')})
get('guide-edit').addEventListener('click',()=>{if(!busy){setGuideEditing(!guideEditing);if(guideEditing)get('stage-guide-tools').scrollIntoView({block:'start'})}})
get('guide-done').addEventListener('click',()=>{if(!busy)setGuideEditing(false)})
app.querySelectorAll<HTMLButtonElement>('[data-guide-kind]').forEach(button=>button.addEventListener('click',()=>{if(busy)return;guideKind=button.dataset.guideKind as GuideKind;setGuideEditing(true)}))
function removeGuides(id?:string){
  if(busy)return
  remember();detachPainting();settings={...settings,structure:id?(settings.structure??[]).filter(g=>g.id!==id):[]};markChanged();updateGuideControls();paintGesture()
}
get('guide-clear').addEventListener('click',()=>removeGuides())
get('guide-list').addEventListener('click',event=>{const id=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-guide-remove]')?.dataset.guideRemove;if(id)removeGuides(id)})
get('guided-generate').addEventListener('click',()=>{void startGuidedPainting()})
get('guide-cancel').addEventListener('click',()=>planJob?.cancel())
for(const kind of ['window','postcard'] as const)get('guide-'+kind).addEventListener('click',()=>{void loadGuidedSample(kind).catch(error=>tell(error instanceof Error?error.message:'示例读取失败。'))})
get('structured-study').addEventListener('click',()=>{void startStructuredStudy()})
get('natural-study').addEventListener('click',()=>{void startStructuredStudy('natural')})
get('prepared-postcard').addEventListener('click',()=>{void startStructuredStudy('postcard')})
get('generic-study').addEventListener('click',()=>{if(!busy)startPainting()})
get('painting-play').addEventListener('click',()=>{if(busy)return;if(playing)pausePainting();else if(painting){if(painting.tick===painting.totalTicks)painting.rewindTo(0);playing=true;frameClock=0;updatePaintingControls()}else startPainting()})
get('painting-restart').addEventListener('click',()=>{if(!painting||busy)return;pausePainting();painting.rewindTo(0);playing=true;frameClock=0;accumulator=0;markChanged();paint();updatePaintingControls()})
get('painting-finish').addEventListener('click',()=>{if(!painting)startPainting();if(painting)void seekPainting(painting.totalTicks)})
get('painting-progress').addEventListener('change',()=>{if(painting)void seekPainting(Number(get<HTMLInputElement>('painting-progress').value)/1000*painting.totalTicks)})
app.querySelectorAll<HTMLButtonElement>('[data-phase]').forEach(button=>button.addEventListener('click',()=>{if(painting)void seekPainting(painting.phaseStarts[Number(button.dataset.phase)])}))
get('show-hand').addEventListener('change',paintGesture)
app.querySelectorAll<HTMLButtonElement>('[data-surface]').forEach(button=>button.addEventListener('click',()=>{
  if(busy)return
  remember();settings={...settings,surface:button.dataset.surface as PhotoSettings['surface']}
  updateSettings();paint();markChanged()
  get('surface-note').textContent=settings.surface==='granular'&&granularAvailable()?'已切换颗粒灯箱。薄沙透光、粒形与沙脊随当前沙层呈现，可与原影调对照。':settings.surface==='granular'?'当前浏览器无法使用颗粒灯箱，已显示原影调。':'已切回原影调，实际沙层与成画进度保留。'
}))
get('choose-hand').addEventListener('click',()=>get<HTMLInputElement>('hand-file').click())
function updateHandControls(){
  get('hand-calibration').hidden=!filmedHand.ready;get<HTMLButtonElement>('clear-hand').disabled=busy||!filmedHand.ready
  get<HTMLSelectElement>('hand-key').value=filmedHand.key;get<HTMLInputElement>('hand-size').value=String(filmedHand.width)
  get<HTMLInputElement>('hand-start').value=String(filmedHand.calibration.start);get<HTMLInputElement>('hand-end').value=String(filmedHand.calibration.end)
  handPreviewProgress=0;get<HTMLInputElement>('hand-progress').value='0';filmedHand.sync(0)
  get('hand-anchor-count').textContent=`已标定 ${filmedHand.calibration.anchors.length} 个接触点，帧间会自动插值。`
  get<HTMLSelectElement>('hand-role').querySelectorAll<HTMLOptionElement>('option').forEach(o=>{o.textContent=handNames[o.value as HandRole]+(handLibrary[o.value as HandRole].ready?' · 已配置':' · 待配置')})
  paintGesture()
}
get<HTMLSelectElement>('hand-role').addEventListener('change',()=>{
  pausePainting();handRole=get<HTMLSelectElement>('hand-role').value as HandRole;filmedHand=handLibrary[handRole];updateHandControls()
  get('hand-status').textContent=filmedHand.ready?`${handNames[handRole]}：${filmedHand.name}`:`请为${handNames[handRole]}选择对应短片。`
})
get<HTMLInputElement>('hand-progress').addEventListener('input',()=>{
  pausePainting();handPreviewProgress=Number(get<HTMLInputElement>('hand-progress').value);filmedHand.sync(handPreviewProgress);paintGesture()
})
for(const id of ['hand-start','hand-end'])get<HTMLInputElement>(id).addEventListener('change',()=>{
  const start=Number(get<HTMLInputElement>('hand-start').value),end=Number(get<HTMLInputElement>('hand-end').value)
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>filmedHand.duration||end-start<.05){get('hand-status').textContent='截取区间须在素材时长以内，且至少保留 0.05 秒。';get<HTMLInputElement>('hand-start').value=String(filmedHand.calibration.start);get<HTMLInputElement>('hand-end').value=String(filmedHand.calibration.end);return}
  pausePainting();filmedHand.calibration.start=start;filmedHand.calibration.end=end;filmedHand.calibration.anchors=[{progress:0,x:.5,y:.23}];updateHandControls()
  get('hand-status').textContent='截取区间已更新，请在新区间重新标定接触点。'
})
get('reset-hand-anchors').addEventListener('click',()=>{filmedHand.calibration.anchors=[{progress:0,x:.5,y:.23}];get('hand-anchor-count').textContent='已重置，请在素材预览中标定接触点。';paintGesture()})
get('save-hands').addEventListener('click',()=>{void(async()=>{
  const button=get<HTMLButtonElement>('save-hands');button.disabled=true
  try{await saveHandRecords((Object.keys(handLibrary) as HandRole[]).flatMap(role=>{const r=handLibrary[role].record(role);return r?[r]:[]}));get('hand-status').textContent='手部素材及标定已保存到本机，刷新后可继续使用。'}catch(error){get('hand-status').textContent=error instanceof Error?error.message:'手部素材保存失败。'}finally{button.disabled=busy}
})()})
async function restoreHandLibrary(){
  try{
    const records=await readHandRecords();let restored=0,failed=0
    for(const r of records){if(!Object.hasOwn(handLibrary,r.role)||handLibrary[r.role].ready)continue;try{if(await handLibrary[r.role].load(new File([r.blob],r.name,{type:r.blob.type}),r.calibration))restored++}catch{failed++}}
    updateHandControls();if(restored||failed)get('hand-status').textContent=`已恢复 ${restored} 种手法素材。`+(failed?`${failed} 个素材无法解码，请重新选择。`:'')
  }catch{get('hand-status').textContent='本机手部存储暂不可用，仍可在当前页面载入试镜。'}
}
get('hand-contact-demo').addEventListener('click',()=>{void(async()=>{
  const button=get<HTMLButtonElement>('hand-contact-demo');button.disabled=true;pausePainting()
  try{
    if(!handDemo){const response=await fetch(recordedPourUrl);if(!response.ok)throw new Error('实拍试镜素材载入失败。');const clip=new FilmedHand();await clip.load(new File([await response.blob()],'КРТ-真人撒沙片段.webm',{type:'video/webm'}),{...recordedPourCalibration,key:'alpha'});handDemo=new HandContactDemo(clip)}
    handDemo.open()
  }catch(error){tell(error instanceof Error?error.message:'试镜未能打开。')}finally{button.disabled=busy}
})()})
const captureLook=document.createElement('button');captureLook.id='capture-look';captureLook.textContent='下载当前试镜 PNG ↓';get('surface-note').insertAdjacentElement('afterend',captureLook)
const generatedDemoButton=document.createElement('button');generatedDemoButton.id='generated-hand-demo';generatedDemoButton.textContent='看生成手部 · 10 秒撒沙 ▶';get('hand-contact-demo').insertAdjacentElement('beforebegin',generatedDemoButton)
generatedDemoButton.onclick=()=>{pausePainting();handDemo?.close();void openGeneratedHands()}
captureLook.addEventListener('click',()=>{void(async()=>{
  if(busy||!ready)return
  pausePainting();setGuideEditing(false);compare.checked=false;updateComparison();paint()
  const output=document.createElement('canvas');output.width=canvas.width;output.height=canvas.height
  const ctx=output.getContext('2d')!;ctx.drawImage(canvas,0,0);ctx.drawImage(gesture,0,0)
  try{download(await canvasBlob(output),'-手与沙试镜.png');tell('已下载当前沙台与手部合成画面。')}catch{tell('试镜导出失败，请重试。')}
})()})
get<HTMLInputElement>('hand-file').addEventListener('change',()=>{void(async()=>{
  const input=get<HTMLInputElement>('hand-file'),file=input.files?.[0],clip=filmedHand,role=handRole;input.value='';if(!file||busy)return
  get('hand-status').textContent='正在读取实拍手部…'
  try {
    if(!await clip.load(file))return
    updateHandControls();get('hand-status').textContent=`已为${handNames[role]}载入 ${file.name} · ${clip.duration.toFixed(1)} 秒。拖动素材进度，标定不同帧的接触点。`
    get<HTMLInputElement>('show-hand').checked=true;paintGesture()
  }catch(error){get('hand-status').textContent=error instanceof Error?error.message:'素材读取失败。'}
})()})
get('clear-hand').addEventListener('click',()=>{
  filmedHand.clear();updateHandControls();get('hand-status').textContent=`已移除${handNames[handRole]}素材。点击保存到本机，将同步删除已保存的片段。`;paintGesture()
})
get<HTMLSelectElement>('hand-key').addEventListener('change',()=>{filmedHand.key=get<HTMLSelectElement>('hand-key').value as HandKey;paintGesture()})
get<HTMLInputElement>('hand-size').addEventListener('input',()=>{filmedHand.width=Number(get<HTMLInputElement>('hand-size').value);paintGesture()})
get<HTMLCanvasElement>('hand-preview').addEventListener('pointerdown',event=>{
  const rect=get('hand-preview').getBoundingClientRect()
  try{filmedHand.setAnchor((event.clientX-rect.left)/rect.width,(event.clientY-rect.top)/rect.height);get('hand-anchor-count').textContent=`已标定 ${filmedHand.calibration.anchors.length} 个接触点，帧间会自动插值。`;paintGesture()}catch(error){tell(error instanceof Error?error.message:'标定失败。')}
})
get<HTMLDetailsElement>('filmed-hand-panel').addEventListener('toggle',()=>{if(get<HTMLDetailsElement>('filmed-hand-panel').open)pausePainting();paintGesture()})
get('painting-takeover').addEventListener('click',()=>{if(busy||!painting)return;detachPainting();if(!editing)get<HTMLButtonElement>('edit-toggle').click();tell('已经接管当前实际沙层。按住拖动继续创作；撤销可回到演出前。')})
app.querySelectorAll<HTMLInputElement>('[data-setting]').forEach(input => {
  input.addEventListener('input', () => { get(input.id + '-value').textContent = Number(input.value).toFixed(2) })
  input.addEventListener('change', () => {
    if (busy || !bitmap && input.id !== 'grain') return
    remember(); settings = { ...settings, [input.dataset.setting!]: Number(input.value) }
    if(['zoom','panX','panY'].includes(input.id)){settings={...settings,structure:[]};updateGuideControls();get('guide-status').textContent='构图已改变，请在新的原照画幅上重新标注。'}
    if (input.id === 'grain') { paint(); markChanged() } else convert()
  })
})
get<HTMLSelectElement>('ratio').addEventListener('change', () => {if(busy||!bitmap)return;remember();settings={...settings,ratio:get<HTMLSelectElement>('ratio').value as PhotoSettings['ratio'],structure:[]};updateGuideControls();get('guide-status').textContent='画幅已改变，请在新的原照画幅上重新标注。';convert() })
compare.addEventListener('change', updateComparison); get('compare-range').addEventListener('input', updateComparison)
get('save-work').addEventListener('click', () => { void saveCurrent() })
get('show-exhibit').addEventListener('click', () => { void saveCurrent().then(work => { if (work) void displayExhibit(work) }) })
get('exhibit-back').addEventListener('click', () => { void showGallery() })
get('exhibit-edit').addEventListener('click', showCreate)
get('exhibit-download').addEventListener('click', () => { void exportArtifact('html') })
title.addEventListener('input', markChanged); caption.addEventListener('input', markChanged)
for (const kind of ['png', 'poster', 'html', 'project'] as const) get('export-' + kind).addEventListener('click', () => { void exportArtifact(kind) })
get('import-project').addEventListener('click', () => projectFile.click())
projectFile.addEventListener('change', () => { void (async () => {
  const file = projectFile.files?.[0]; if (!file || busy) return
  setGuideEditing(false)
  setBusy(true, '正在恢复可编辑作品…')
  try {
    if (file.size > 20 * 1024 * 1024) throw new Error('作品文件过大。')
    const data = decodePhotoProject(await file.text())
    const nextSource = data.source ? await fetch(data.source).then(r => r.blob()) : undefined
    const nextBitmap = nextSource ? await decodePhoto(nextSource) : undefined
    const nextPainting=data.performance?restorePerformance(data.performance,data.snapshot):undefined
    const nextMaterial = nextPainting?.material??new StageMaterial(data.snapshot.width, data.snapshot.height);if(!nextPainting)nextMaterial.restore(data.snapshot)
    detachPainting();painting=nextPainting;bitmap?.close(); bitmap = nextBitmap; material = nextMaterial; source = nextSource; sourceKind = data.sourceKind
    settings = data.settings; title.value = data.title; caption.value = data.caption
    currentId = undefined; createdAt = ''; undo.length = 0; ready = true; resize(); drawCrop(); paint(); updateSettings(); markChanged()
    compare.checked = false; updateComparison(); get('source-label').textContent = '导入的可编辑沙画'
    showCreate(); tell(nextPainting?'沙层与原演出已恢复，可继续播放或从空台重播。'+(data.source?'包含原照，可重新规划。':'文件未包含原照，可修画和重播，但不能重新裁切。'):data.source ? '作品和原照已恢复，可以调节构图或继续修画。' : '沙层已恢复，可继续修画。文件未包含原照，不能重新裁切或转换影调。')
  } catch (error) { tell(error instanceof Error ? error.message : '作品导入失败。') }
  finally { projectFile.value = ''; setBusy(false) }
})() })
get('edit-toggle').addEventListener('click', () => {
  if(busy)return
  setGuideEditing(false)
  if(painting)detachPainting()
  focusSelecting=false;get('pick-focus').setAttribute('aria-pressed','false');paintGesture()
  editing = !editing; get('brushes').hidden = !editing; get('edit-toggle').setAttribute('aria-pressed', String(editing))
  get('edit-toggle').textContent = editing ? '结束修画' : '局部修画'
  if (editing) { compare.checked = false; updateComparison() }
})
app.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(button => button.addEventListener('click', () => {
  tool = button.dataset.tool as typeof tool
  app.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b === button)))
}))
get('undo').addEventListener('click', () => {
  if(busy)return
  const saved = undo.pop(); if (!saved) return
  setGuideEditing(false)
  detachPainting();focusSelecting=false;get('pick-focus').setAttribute('aria-pressed','false')
  pointer = undefined; material = new StageMaterial(saved.snapshot.width, saved.snapshot.height); material.restore(saved.snapshot)
  settings = saved.settings; resize(); drawCrop(); updateSettings(); paint(); markChanged()
  get('guide-status').textContent=settings.structure?.length?`已恢复当前构图的 ${settings.structure.length} 个标注。`:'当前构图暂无标注，可以重新框选。'
  get<HTMLButtonElement>('undo').disabled = !undo.length; tell('已撤销最近一次调整。')
})
function pointAt(event: PointerEvent): StagePoint {
  const rect = canvas.getBoundingClientRect()
  return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) }
}
function brushStep(from: StagePoint, to: StagePoint, dt: number, pressure: number) {
  const radius = Number(get<HTMLInputElement>('brush-width').value) / material.width * (tool === 'finger' ? .24 : 1)
  const strength = Number(get<HTMLInputElement>('brush-strength').value) * Math.max(.15, pressure)
  if (tool === 'collect') { material.step(dt, []); material.collect(from, to, radius, strength * .18, dt) }
  else material.step(dt, [{ tool, from, to, radius, strength, spread: .7, height: .12,
    ...(tool === 'rub' || tool === 'sweep' ? { angle: Number(get<HTMLInputElement>('brush-angle').value) * Math.PI / 180, aspect: .65 } : {}) }])
  dirty = true
}
canvas.addEventListener('pointerdown', event => {
  if(guideEditing&&!busy&&bitmap){event.preventDefault();const from=pointAt(event);guideDrag={id:event.pointerId,from,to:from};canvas.setPointerCapture(event.pointerId);paintGesture();return}
  if(focusSelecting&&!busy&&bitmap){event.preventDefault();remember();const p=pointAt(event);settings={...settings,focusX:p.x,focusY:p.y};focusSelecting=false;get('pick-focus').setAttribute('aria-pressed','false');convert();updateSettings();tell('已更新主体位置，可播放新的留白人像成画。');return}
  if (!editing || busy || !ready) return
  event.preventDefault(); remember()
  pointer = { id: event.pointerId, point: pointAt(event), last: pointAt(event), pressure: event.pointerType === 'pen' ? event.pressure : 1 }
  canvas.setPointerCapture(event.pointerId); brushStep(pointer.last, pointer.point, 1 / 60, pointer.pressure); markChanged()
})
canvas.addEventListener('pointermove', event => {
  if(guideDrag?.id===event.pointerId){guideDrag.to=pointAt(event);paintGesture();return}
  if (pointer?.id === event.pointerId) { pointer.point = pointAt(event); pointer.pressure = event.pointerType === 'pen' ? event.pressure : 1 }
})
function endStroke(event: PointerEvent) {
  if(guideDrag?.id===event.pointerId){const drag=guideDrag;guideDrag=undefined;if(event.type==='pointerup')commitGuide(drag.from,pointAt(event));paintGesture();return}
  if (pointer?.id !== event.pointerId) return
  brushStep(pointer.last, pointAt(event), 1 / 60, pointer.pressure)
  pointer = undefined
  for (let i = 0; i < 60 && material.pending; i++) material.step(1 / 60, [])
  markChanged(); paint()
}
canvas.addEventListener('pointerup', endStroke); canvas.addEventListener('pointercancel', endStroke)
canvas.addEventListener('lostpointercapture', () => { pointer = undefined;guideDrag=undefined;paintGesture() })
canvas.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); get<HTMLButtonElement>('undo').click() } })
get('fullscreen').addEventListener('click', () => { void (document.fullscreenElement ? document.exitFullscreen() : get('sand-frame').requestFullscreen()).catch(() => tell('当前浏览器无法全屏，仍可直接创作。')) })
get('exit-fullscreen').addEventListener('click', () => { if (document.fullscreenElement) void document.exitFullscreen() })
document.addEventListener('visibilitychange', () => { pointer = undefined;guideDrag=undefined;paintGesture();if(document.hidden)pausePainting() })
window.addEventListener('hashchange',()=>{
  if(location.hash==='#generated-hands'){pausePainting();handDemo?.close();void openGeneratedHands();return}
  if(busy||!ready)return
  if(location.hash==='#hands')get<HTMLButtonElement>('hand-contact-demo').click()
  else if(location.hash==='#natural'){handDemo?.close();void startStructuredStudy('natural')}
})
function frame(time:number) {
  if (!busy && showView === 'create') {
    if(playing&&painting){const elapsed=frameClock?Math.min(.1,(time-frameClock)/1000):0;frameClock=time;accumulator+=elapsed*Number(get<HTMLSelectElement>('painting-speed').value);let steps=0;while(accumulator>=PHOTO_STEP&&steps++<24){accumulator-=PHOTO_STEP;if(!painting.step()){pausePainting();break}}dirty=true;updatePaintingControls();if(painting.tick===painting.totalTicks){pausePainting();get('save-note').textContent='演出成品已落定 · 可接管修画、收藏或下载。'}}
    else if (pointer) { brushStep(pointer.last, pointer.point, 1 / 60, pointer.pressure); pointer.last = { ...pointer.point } }
    else if (!painting&&material.pending) { material.step(1 / 60, []); dirty = true }
    if (dirty) paint()
    if(Object.values(handLibrary).some(c=>c.ready)&&(playing||pointer||get<HTMLDetailsElement>('filmed-hand-panel').open))paintGesture()
  }
  handDemo?.frame(time)
  requestAnimationFrame(frame)
}
updateSettings(); setBusy(true,'正在准备照片示例…'); requestAnimationFrame(frame)
void (async () => {
  try {
    get('work-count').textContent = String((await listPhotoWorks()).length)
    void restoreHandLibrary()
    if (location.hash.startsWith('#work=')) { setBusy(false);await loadWork(decodeURIComponent(location.hash.slice(6)), true); return }
    if (location.hash.startsWith('#edit=')) { setBusy(false);await loadWork(decodeURIComponent(location.hash.slice(6)), false); return }
    if (location.hash === '#gallery') { setBusy(false);await showGallery(); return }
    if(location.hash==='#postcard'){setBusy(false);await loadGuidedSample('postcard');return}
    if(location.hash==='#postcard-study'||location.hash==='#texture'){const texture=location.hash==='#texture';setBusy(false);await startStructuredStudy('postcard');if(texture){pausePainting();settings={...settings,surface:'granular'};updateSettings();paint();get('surface-note').textContent='已打开颗粒灯箱，从空台播放可观察落沙；也可查看演出成品。'}return}
    if(location.hash==='#guided'){setBusy(false);await loadGuidedSample('window');return}
    if(location.hash==='#natural'){setBusy(false);await startStructuredStudy('natural');return}
    const generatedHandsRequested=location.hash==='#generated-hands'
    if(generatedHandsRequested)void openGeneratedHands()
    const sample = await fetch(sampleUrl).then(r => r.blob())
    const processRequested=location.hash==='#process',studyRequested=location.hash==='#study',handsRequested=location.hash==='#hands'
    setBusy(false)
    if (!ready && !busy && showView === 'create') {if(studyRequested){await startStructuredStudy()}else{await loadPhoto(sample, true);if(processRequested)startPainting();if(handsRequested){history.replaceState(null,'','#hands');get<HTMLButtonElement>('hand-contact-demo').click()}if(generatedHandsRequested)history.replaceState(null,'','#generated-hands')}}
  } catch { tell('示例或作品集不可用，仍可选择照片开始创作。') }
  finally{setBusy(false)}
})()
