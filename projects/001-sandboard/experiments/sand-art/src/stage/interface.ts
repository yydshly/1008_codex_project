import './style.css'

const paths = {
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  restart: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
  arrow: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  hand: '<path d="M4 13V9a1.6 1.6 0 0 1 3.2 0v3-7a1.6 1.6 0 0 1 3.2 0v7-8a1.6 1.6 0 0 1 3.2 0v8-6a1.6 1.6 0 0 1 3.2 0v8l1.1-2a1.8 1.8 0 0 1 3.1 1.8l-3.1 5.4a5 5 0 0 1-4.3 2.5H10a5 5 0 0 1-4.5-2.8L4 16v-3Z"/>',
  scatter: '<path d="m4 5 8 2-2 5-7-2 1-5Zm8 2 7 3M6 16h.01M11 18h.01M17 16h.01M20 21h.01M7 22h.01M14 22h.01"/>',
  stream: '<path d="m5 3 8 3-2 5-8-3 2-5Zm8 3 7 3M14 13v2m0 3v3"/>',
  finger: '<path d="M10 20V5a2 2 0 0 1 4 0v8l3-1 3 3-3 7H11l-5-5a2 2 0 0 1 3-2l1 1"/>',
  edge: '<path d="m5 20 5-14a3 3 0 0 1 5-1l5 13M3 22h18M9 13l8 2"/>',
  undo: '<path d="M8 5 3 10l5 5M3 10h11a7 7 0 0 1 7 7"/>',
  clear: '<path d="m6 15 8-10 6 5-8 10H9l-3-5ZM3 21h18M11 9l6 5"/>',
  export: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
} as const

function icon(name: keyof typeof paths) {
  return `<svg class="stage-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`
}

export function createStageInterface(root: HTMLElement) {
  root.innerHTML = `
    <main class="stage-page">
      <header class="stage-header">
        <a class="stage-brand" href="./" aria-label="舞台沙画首页"><span class="stage-brand-mark" aria-hidden="true">沙</span><span><strong>舞台沙画</strong><small>手绘灯箱 · 表演实验</small></span></a>
        <nav class="stage-navigation" aria-label="Sandboard 展示入口"><a href="../atelier/">作品创作台</a><a href="../">${icon('arrow')}<span>沙画工作室</span></a><a id="stage-baseline-link" href="../../">原版展示</a></nav>
      </header>

      <section class="stage-performance" aria-labelledby="performance-title">
        <div class="performance-heading"><div class="performance-title"><span class="performance-eyebrow">一把沙，慢慢讲一个故事</span><h1 id="performance-title">月下江南</h1></div><div class="performance-meta"><span class="stage-live-dot" aria-hidden="true"></span><span>三幕原创演示</span><span class="performance-divider">/</span><span>约 56 秒</span></div></div>
        <div class="stage-layout">
          <div class="stage-main">
            <div class="lightbox-surround" id="stage-frame">
              <div class="lightbox-inner"><canvas id="stage-canvas" width="1024" height="768" tabindex="0" aria-label="月下江南灯箱沙画舞台"></canvas></div>
              <div class="stage-canvas-caption"><span id="stage-chapter-label">第一幕 · 月出山间</span><button class="stage-fullscreen" id="stage-fullscreen" aria-label="全屏观看沙画" title="全屏观看">${icon('expand')}</button></div>
            </div>
            <div class="stage-playback" aria-label="沙画表演播放控制">
              <div class="stage-transport"><button class="stage-primary" id="stage-play">${icon('play')}<span>开始表演</span></button><button class="stage-icon-button" id="stage-restart" aria-label="重新表演" title="重新表演">${icon('restart')}</button></div>
              <div class="stage-timeline-wrap"><label class="sr-only" for="stage-timeline">表演时间轴</label><input id="stage-timeline" class="stage-timeline" type="range" min="0" max="6720" value="0" step="1" /><output id="stage-timeline-time" for="stage-timeline">00:00 / 00:56</output></div>
              <label class="stage-speed" for="stage-speed"><span class="sr-only">播放速度</span><select id="stage-speed"><option value="0.5">0.5 倍</option><option value="1" selected>1 倍</option><option value="1.5">1.5 倍</option><option value="2">2 倍</option></select></label>
            </div>
          </div>

          <aside class="stage-sidebar" aria-label="演出章节与手绘工具">
            <div class="stage-story-heading"><span class="stage-overline">THE SAND STORY</span><h2>沙会流动，画也会变。</h2><p id="stage-instruction">从铺沙到勾线，用手掌与指尖，让月色、山水和小舟慢慢出现。</p></div>
            <div class="stage-chapters" role="group" aria-label="演出章节">
              <button class="stage-chapter active" data-chapter="0" aria-pressed="true"><span class="chapter-number">01</span><span><strong>月出山间</strong><small>散撒铺山 · 指尖擦月</small></span><span class="chapter-arrow" aria-hidden="true">↗</span></button>
              <button class="stage-chapter" data-chapter="1" aria-pressed="false"><span class="chapter-number">02</span><span><strong>江南烟雨</strong><small>侧掌推沙 · 勾出水岸</small></span><span class="chapter-arrow" aria-hidden="true">↗</span></button>
              <button class="stage-chapter" data-chapter="2" aria-pressed="false"><span class="chapter-number">03</span><span><strong>一叶归舟</strong><small>细流落沙 · 留白成舟</small></span><span class="chapter-arrow" aria-hidden="true">↗</span></button>
            </div>

            <label class="stage-hand-toggle" for="stage-show-hand"><input id="stage-show-hand" type="checkbox" checked /><span>显示手势</span></label>
            <div class="stage-manual-entry"><button class="stage-secondary" id="stage-manual">${icon('hand')}我也来画一幅</button><p>在独立的空白灯箱上手绘。</p></div>
            <section class="stage-manual-panel" id="stage-manual-panel" aria-labelledby="manual-title" hidden>
              <h2 id="manual-title">用手成画</h2><div class="stage-tool-buttons" role="group" aria-label="手绘沙画工具">
                <button class="stage-tool active" data-tool="scatter" aria-pressed="true">${icon('scatter')}<span>散撒</span></button><button class="stage-tool" data-tool="stream" aria-pressed="false">${icon('stream')}<span>细流</span></button><button class="stage-tool" data-tool="palm" aria-pressed="false">${icon('hand')}<span>手掌</span></button><button class="stage-tool" data-tool="finger" aria-pressed="false">${icon('finger')}<span>指尖</span></button><button class="stage-tool" data-tool="edge" aria-pressed="false">${icon('edge')}<span>侧掌</span></button>
              </div>
              <label class="stage-range-label" for="stage-brush-size"><span>手势大小</span><input id="stage-brush-size" type="range" min="12" max="70" step="1" value="32" /></label>
              <label class="stage-range-label" for="stage-brush-strength"><span>落沙 / 手势力度</span><input id="stage-brush-strength" type="range" min="0.2" max="2" step="0.05" value="1" /></label>
              <div class="stage-edit-actions"><button id="stage-undo">${icon('undo')}撤销</button><button id="stage-clear">${icon('clear')}清台</button></div>
            </section>
            <div class="stage-export-action"><button class="stage-secondary" id="stage-export-png">${icon('export')}导出成品 PNG</button></div>
            <div id="stage-status" class="stage-status" role="status" aria-live="polite">画台准备中</div>
          </aside>
        </div>
      </section>

      <footer class="stage-footer"><span>独立舞台实验 · 原创《月下江南》</span><a href="../">工作室完整保留 ${icon('arrow')}</a></footer>
    </main>
  `

  function get<T extends HTMLElement>(selector: string) {
    const element = root.querySelector<T>(selector)
    if (!element) throw new Error(`舞台界面缺少控件：${selector}`)
    return element
  }

  return {
    canvas: get<HTMLCanvasElement>('#stage-canvas'),
    play: get<HTMLButtonElement>('#stage-play'),
    restart: get<HTMLButtonElement>('#stage-restart'),
    timeline: get<HTMLInputElement>('#stage-timeline'),
    speed: get<HTMLSelectElement>('#stage-speed'),
    chapterButtons: Array.from(root.querySelectorAll<HTMLButtonElement>('[data-chapter]')),
    chapterLabel: get<HTMLElement>('#stage-chapter-label'),
    instruction: get<HTMLElement>('#stage-instruction'),
    status: get<HTMLElement>('#stage-status'),
    manual: get<HTMLButtonElement>('#stage-manual'),
    toolButtons: Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tool]')),
    brushSize: get<HTMLInputElement>('#stage-brush-size'),
    brushStrength: get<HTMLInputElement>('#stage-brush-strength'),
    clear: get<HTMLButtonElement>('#stage-clear'),
    undo: get<HTMLButtonElement>('#stage-undo'),
    exportPng: get<HTMLButtonElement>('#stage-export-png'),
    manualPanel: get<HTMLElement>('#stage-manual-panel'),
    timelineTime: get<HTMLOutputElement>('#stage-timeline-time'),
    fullscreen: get<HTMLButtonElement>('#stage-fullscreen'),
    canvasFrame: get<HTMLElement>('#stage-frame'),
    showHand: get<HTMLInputElement>('#stage-show-hand'),
    baselineLink: get<HTMLAnchorElement>('#stage-baseline-link'),
  }
}
