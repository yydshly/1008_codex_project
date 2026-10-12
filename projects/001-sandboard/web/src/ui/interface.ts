export type InterfaceElements = ReturnType<typeof createInterface>

export function createInterface(root: HTMLDivElement) {
  root.innerHTML = `
    <canvas class="surface" aria-label="交互沙面。按住鼠标或用手指拖动划沙。方向键移动虚拟手指，按住空格绘画，方括号调整粗细，R 键用海浪重置。" tabindex="0"></canvas>
    <header class="masthead">
      <p class="project-number">原版效果展示 / 001</p>
      <h1 class="brand" aria-label="Sandboard">
        <span aria-hidden="true">s</span><span aria-hidden="true">a</span><span aria-hidden="true">n</span><span aria-hidden="true">d</span><span aria-hidden="true">b</span><span aria-hidden="true">o</span><span aria-hidden="true">a</span><span aria-hidden="true">r</span><span aria-hidden="true">d</span>
      </h1>
      <p class="tagline">把手指划过一小片沙滩。</p>
    </header>
    <div class="top-actions"><a id="art-link" class="art-link" href="./art/">沙画工作室 <span aria-hidden="true">↗</span></a><details class="guide">
      <summary>操作说明 <span aria-hidden="true">＋</span></summary>
      <div class="guide-content">
        <p class="guide-eyebrow">一片沙，随你画。</p>
        <h2>从一条线开始</h2>
        <ul>
          <li><strong>慢慢划</strong><span>按住鼠标拖动，刻下沟槽，观察两侧堆起的沙脊。</span></li>
          <li><strong>快速扫</strong><span>加快划动，看细沙被推起、飞散，然后落回沙面。</span></li>
          <li><strong>重新开始</strong><span>点击「海浪重置」，让一阵海浪抚平你的画。</span></li>
        </ul>
        <p class="guide-note">触屏可多指同时绘画。首次操作会开启声音。</p>
        <div class="quality-setting"><label for="quality">画质 <select id="quality"><option value="detail">精细</option><option value="balanced">均衡</option><option value="smooth">流畅</option></select></label><p>精细保留更多颗粒。划沙跟手较慢时，可以切换流畅。</p><p id="render-performance" class="render-performance">正在准备画面…</p></div>
        <div class="guide-keyboard"><span>键盘也能玩</span><p>先点击沙面。方向键移动，按住空格划沙，<kbd>[</kbd> <kbd>]</kbd> 调整粗细，<kbd>R</kbd> 重置。</p></div>
        <div class="guide-principle"><span>沙子如何动起来？</span><p>网格高度场记录沟槽与沙堆，沙量在邻格间转移；飞沙使用独立粒子，落地后回填。细沙纹理和光照共同呈现颗粒质感。</p></div>
        <a class="source-link" href="https://github.com/scottstts/Sandboard" target="_blank" rel="noopener noreferrer">查看原仓库 ↗</a>
      </div>
    </details></div>
    <nav class="toolbar" aria-label="划沙工具">
      <label>划沙粗细 <input id="radius" type="range" min="6" max="22" step="1" value="12" aria-label="手指半径，单位毫米" disabled /><output id="radius-value" for="radius">12</output></label>
      <span class="divider" aria-hidden="true"></span>
      <button id="reset" type="button" title="用海浪抚平沙面（R）" disabled><span id="reset-label">海浪重置</span> <span aria-hidden="true">↺</span></button>
    </nav>
    <p id="interaction-status" class="interaction-status" role="status" aria-live="polite">沙面准备中…</p>
    <footer class="credit">原作 <a href="https://github.com/scottstts/Sandboard" target="_blank" rel="noopener noreferrer">scottstts / Sandboard ↗</a><span>GPL-3.0 · 效果复现</span></footer>
    <section class="overlay" aria-live="polite">
      <div class="boot-panel"><p class="guide-eyebrow">SAND / 001</p><h2>稍等，沙滩正在铺好。</h2><p class="status">正在准备沙面…</p><div class="boot-line"></div><figure class="fallback-preview" hidden><img src="${import.meta.env.BASE_URL}preview.jpeg" alt="上游真实效果截图：沙面上的立体沟槽、沙脊与椰树阴影" /><figcaption>原仓库效果截图 · scottstts/Sandboard · 489cb01</figcaption></figure><div class="fallback-actions" hidden><a href="https://sand.scottsun.io" target="_blank" rel="noopener noreferrer">打开原版体验 ↗</a><button id="reload" type="button">重新尝试</button></div><details class="error-details" hidden><summary>查看诊断信息</summary><pre class="diagnostics"></pre></details></div>
    </section>`
  const element = <ElementType extends HTMLElement>(selector: string) => root.querySelector<ElementType>(selector)!
  element<HTMLButtonElement>('#reload').onclick = () => window.location.reload()
  const radius = element<HTMLInputElement>('#radius')
  const radiusValue = element<HTMLOutputElement>('#radius-value')
  radius.addEventListener('input', () => { radiusValue.value = radius.value })
  const artLink = element<HTMLAnchorElement>('#art-link')
  if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') {
    const port = location.port === '5173' ? '5174' : '4174'
    artLink.href = `${location.protocol}//${location.hostname}:${port}/1008_codex_project/001-sandboard/art/`
    if (port === '5174') artLink.href = `${location.protocol}//${location.hostname}:5174/`
  }
  return {
    canvas: element<HTMLCanvasElement>('canvas'), overlay: element<HTMLElement>('.overlay'),
    title: element<HTMLElement>('.boot-panel h2'), status: element<HTMLElement>('.status'),
    diagnostics: element<HTMLElement>('.diagnostics'), reload: element<HTMLButtonElement>('#reload'),
    radius, reset: element<HTMLButtonElement>('#reset'), radiusValue,
    resetLabel: element<HTMLElement>('#reset-label'),
    interactionStatus: element<HTMLElement>('#interaction-status'),
    quality: element<HTMLSelectElement>('#quality'),
    renderPerformance: element<HTMLElement>('#render-performance'), artLink,
  }
}
