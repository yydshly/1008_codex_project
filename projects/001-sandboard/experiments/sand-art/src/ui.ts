import './style.css'

const paths = {
  sand: '<path d="m3 14 6-7 5 6 4-4 3 5M3 19h18M8 4h.01M18 3h.01M20 6h.01"/>',
  light: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15c1-3 3-5 5-3s3 2 5-2M12 2v1M12 21v1M1 12h1M22 12h1"/>',
  pour: '<path d="m5 5 6 2-2 6-6-2 2-6ZM11 7l6 3M14 13l1 1M18 15l1 1M11 17l1 1M15 20h.01M21 19h.01M8 21h.01"/>',
  push: '<path d="M4 14V9a2 2 0 0 1 4 0v3-6a2 2 0 0 1 4 0v6-4a2 2 0 0 1 4 0v5-2a2 2 0 0 1 4 0v5c0 4-3 6-7 6s-6-2-9-7"/>',
  scrape: '<path d="m5 19 3-8L18 1l5 5-10 10-8 3ZM8 11l5 5M3 22h17"/>',
  rake: '<path d="m6 18 9-9M11 5l8 8M10 6l-3 3M13 9l-3 3M16 12l-3 3M19 15l-3 3M4 20l2-2"/>',
  stamp: '<path d="M8 14V9l1-5h6l1 5v5M5 14h14l2 4H3l2-4ZM3 21h18"/>',
  smooth: '<path d="M3 13c4-6 6 6 10 0s6 1 8-2M3 19h18M7 5h10"/>',
  palm: '<path d="M4 13V9a1.6 1.6 0 0 1 3.2 0v3-7a1.6 1.6 0 0 1 3.2 0v7-8a1.6 1.6 0 0 1 3.2 0v8-6a1.6 1.6 0 0 1 3.2 0v8l1.1-2a1.8 1.8 0 0 1 3.1 1.8l-3.1 5.4a5 5 0 0 1-4.3 2.5H10a5 5 0 0 1-4.5-2.8L4 16v-3Z"/>',
  undo: '<path d="M8 5 3 10l5 5M3 10h11a7 7 0 0 1 7 7"/>',
  redo: '<path d="m16 5 5 5-5 5M21 10H10a7 7 0 0 0-7 7"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  circle: '<circle cx="12" cy="12" r="8"/><path d="m8 12 3 3 5-6"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  save: '<path d="M5 3h12l4 4v14H3V3h2ZM7 3v6h9V3M7 21v-8h10v8"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2m-3-9-1.5 1.5M6.5 17.5 5 19m14 0-1.5-1.5M6.5 6.5 5 5"/>',
  water: '<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13ZM8 15a4 4 0 0 0 4 4"/>',
  wind: '<path d="M3 7h13a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 17h5a2 2 0 1 1-2 2"/>',
} as const

function icon(name: keyof typeof paths, className = '') {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`
}

export function createArtInterface(root: HTMLElement) {
  root.innerHTML = `
    <main class="studio">
      <header class="studio-header">
        <a class="brand" href="#" aria-label="沙画工作室首页">
          <span class="brand-mark" aria-hidden="true">${icon('sand')}</span>
          <span><strong>沙画工作室</strong><small>SANDBOARD / EXPERIMENT 01</small></span>
        </a>
        <div class="experience-links"><a class="baseline-link" href="./gallery/">统一作品集 ${icon('arrow')}</a><a class="baseline-link" href="./atelier/">作品创作台 ${icon('arrow')}</a><a class="baseline-link stage-link" href="./stage/">舞台沙画 ${icon('arrow')}</a><a class="baseline-link" id="baseline-link" href="../">原版效果展示 ${icon('arrow')}</a></div>
      </header>

      <div class="studio-intro">
        <div class="intro-copy"><span class="eyebrow">一把沙，无数种表达</span><h1>让你的笔迹，留在沙里。</h1></div>
        <div class="mode-switch" role="group" aria-label="创作模式">
          <button class="mode-button active" data-mode="surface" aria-pressed="true">${icon('sand')}<span>沙面绘画</span></button>
          <button class="mode-button" data-mode="lightbox" aria-pressed="false">${icon('light')}<span>灯箱沙画</span></button>
        </div>
      </div>

      <section class="work-manager" aria-label="当前作品">
        <label class="painting-name" for="painting-title"><span>当前作品</span><input id="painting-title" type="text" maxlength="80" value="未命名的沙画" placeholder="给这幅沙画取个名字" /></label>
        <span id="autosave-status" class="autosave-status" role="status" aria-live="polite">画台准备中</span>
        <div class="work-actions"><button id="new-painting" class="subtle-button">新建</button><button id="gallery" class="subtle-button">手绘作品集</button></div>
      </section>

      <section id="example-panel" class="example-panel" aria-label="示例试画" hidden><div><span class="eyebrow">示例试画 / 原草稿保留</span><strong id="example-title"></strong><p>直接在原画台操作。修改独立暂存，点击「保存作品」加入你的收藏。</p></div><div class="example-actions"><button id="example-restart" class="subtle-button">恢复示例原貌</button><button id="example-return" class="subtle-button">返回原草稿</button><a href="./gallery/#examples" class="baseline-link">其他手绘示例 ↗</a></div></section>

      <div class="workspace">
        <section class="drawing-space" aria-label="沙画创作区">
          <section class="demo-panel" id="demo-panel" aria-labelledby="demo-title">
            <div class="demo-heading"><div class="demo-copy"><h2 id="demo-title">从抓沙到成画</h2><span id="demo-status" role="status" aria-live="polite">点击播放，观看完整创作</span></div><button class="demo-play" id="demo-play">${icon('play')}播放沙画演示</button></div>
            <div class="demo-footer"><details class="demo-steps"><summary><span class="demo-sequence">抓沙 → 散撒铺山 → 细流勾脊 → 落定 → 擦月刮河</span><span class="demo-steps-mobile">演示步骤</span></summary><p>分次抓沙，散撒铺出两山，一次撒开月旁云沙，再用细流勾脊。落定后掌形擦月，刮线描河，最后留画。<br />演示使用独立沙床，退出后可继续你的作品。</p></details><div class="demo-actions"><button id="demo-restart" class="text-button">重新演示</button><button id="demo-stop" class="text-button">退出演示</button></div></div>
          </section>
          <div class="preset-bar" role="group" aria-label="创作起点"><span>创作起点</span><button data-preset="moon">山月沙画</button><button data-preset="zen">沙纹园</button><button data-preset="blank">空白画台</button></div>
          <div class="canvas-heading"><span class="canvas-title"><i aria-hidden="true"></i><span id="canvas-label">沙面绘画</span></span><span class="canvas-aspect">4 : 3</span></div>
          <div class="canvas-frame" id="canvas-frame">
            <button class="expand-stage" id="fullscreen" title="放大画台；Esc 退出">↗ 放大画台</button>
            <div class="canvas-surface"><canvas id="sand-canvas" width="1024" height="768" tabindex="0" aria-label="交互沙画画布；在画布上按住并拖动进行创作"></canvas><img id="reference-image" class="reference-image" alt="临摹参考图" hidden /><div id="reference-grid-layer" class="reference-grid-layer" aria-hidden="true" hidden></div></div>
            <div class="quick-tools" role="group" aria-label="画台快捷工具">
              ${(['pour', 'push', 'scrape', 'rake', 'stamp', 'smooth', 'palm'] as const).map((tool, index) => `<button data-tool="${tool}" aria-pressed="false" aria-label="${['撒沙', '推沙', '刮线', '沙耙', '印章', '抹平', '掌形'][index]}" title="${['撒沙', '推沙', '刮线', '沙耙', '印章', '抹平', '掌形'][index]} · ${index + 1}">${icon(tool)}<span>${['撒沙', '推沙', '刮线', '沙耙', '印章', '抹平', '掌形'][index]}</span></button>`).join('')}
            </div>
            <div id="stage-overlay" class="stage-overlay" role="status"><span class="loading-mark" aria-hidden="true"></span><strong>沙面正在铺开</strong><span>准备你的第一笔</span></div>
          </div>
          <div class="canvas-caption"><span id="mode-hint">用沙脊和沟槽勾勒轮廓，光影会留下你的笔迹。</span><div class="history-actions"><button id="undo" class="text-button" title="撤销上一笔（Ctrl / ⌘ + Z）" aria-label="撤销上一笔">${icon('undo')}<span>撤销</span></button><button id="redo" class="text-button" title="重做刚撤销的一笔" aria-label="重做刚撤销的一笔">${icon('redo')}<span>重做</span></button></div></div>

          <div class="toolbox" role="group" aria-label="绘画工具">
            <button class="tool-button active" data-tool="pour" aria-pressed="true" title="撒沙 · 快捷键 1">${icon('pour')}<span>撒沙</span><kbd>1</kbd></button>
            <button class="tool-button" data-tool="push" aria-pressed="false" title="推沙 · 快捷键 2">${icon('push')}<span>推沙</span><kbd>2</kbd></button>
            <button class="tool-button" data-tool="scrape" aria-pressed="false" title="刮线 · 快捷键 3">${icon('scrape')}<span>刮线</span><kbd>3</kbd></button>
            <button class="tool-button" data-tool="rake" aria-pressed="false" title="沙耙 · 快捷键 4">${icon('rake')}<span>沙耙</span><kbd>4</kbd></button>
            <button class="tool-button" data-tool="stamp" aria-pressed="false" title="印章 · 快捷键 5">${icon('stamp')}<span>印章</span><kbd>5</kbd></button>
            <button class="tool-button" data-tool="smooth" aria-pressed="false" title="抹平 · 快捷键 6">${icon('smooth')}<span>抹平</span><kbd>6</kbd></button>
            <button class="tool-button" data-tool="palm" aria-pressed="false" title="掌形 · 快捷键 7">${icon('palm')}<span>掌形</span><kbd>7</kbd></button>
          </div>
          <div class="drawing-note"><span>抓一把沙 · 按住或拖动释放 · 松手后落完</span><span class="keyboard-note">1–7 切换工具 · Ctrl / ⌘ + Z 撤销</span></div>
          <section class="recording-panel" id="recording-panel" aria-labelledby="recording-title">
            <div class="recording-heading"><h2 id="recording-title">创作回放 <span>最长 3 分钟</span></h2><span id="record-status" role="status" aria-live="polite">尚未录制 · 0:00 / 3:00</span></div>
            <div class="recording-actions"><button id="record" class="subtle-button record-button"><i aria-hidden="true"></i>开始录制</button><button id="record-stop" class="subtle-button">结束录制</button><button id="replay-play" class="subtle-button">播放 / 暂停</button><button id="replay-exit" class="text-button">回到创作</button></div>
            <div class="replay-timeline-row"><input id="replay-timeline" type="range" min="0" max="0" step="1" value="0" aria-label="回放进度" /><span id="replay-time" class="replay-time">0:00 / 0:00</span><label class="replay-speed-label" for="replay-speed"><span class="sr-only">回放速度</span><select id="replay-speed" aria-label="回放速度"><option value="0.5">0.5 倍</option><option value="1" selected>1 倍</option><option value="2">2 倍</option><option value="4">4 倍</option></select></label></div>
            <details class="recording-more"><summary>录制文件与视频</summary><div class="recording-files"><button id="recording-export" class="subtle-button">保存录制文件</button><button id="recording-import" class="subtle-button">导入录制</button><input id="recording-file" type="file" accept=".sandrecord.json,application/json" hidden /><button id="video-export" class="subtle-button">实时导出 WebM</button><button id="video-cancel" class="text-button">取消导出</button></div><p class="range-description">视频为 1024 × 768，目标 30 帧/秒，按录制原时长实时导出，期间可取消。</p></details>
          </section>
        </section>

        <aside class="settings" aria-label="画笔与效果设置">
          <section class="setting-section brush-settings" aria-labelledby="brush-title">
            <div class="section-heading"><h2 id="brush-title">画笔</h2><span>TOOL SETTINGS</span></div>
            <label class="range-setting" for="radius"><span class="setting-label">笔触大小 <output for="radius" id="radius-value">14</output></span><input id="radius" type="range" min="3" max="42" value="14" /><span class="range-caps"><span>细</span><span>宽</span></span></label>
            <label class="range-setting" for="strength"><span class="setting-label">力度 <output for="strength" id="strength-value">55%</output></span><input id="strength" type="range" min="10" max="100" value="55" /><span class="range-caps"><span>轻柔</span><span>浓重</span></span></label>
            <details class="palm-settings" id="palm-settings"><summary>掌形设置</summary><label class="range-setting" for="palm-angle"><span class="setting-label">掌形方向 <output for="palm-angle" id="palm-angle-value">0°</output></span><input id="palm-angle" type="range" min="0" max="180" value="0" /></label><label class="range-setting" for="palm-aspect"><span class="setting-label">掌形宽窄 <output for="palm-aspect" id="palm-aspect-value">45%</output></span><input id="palm-aspect" type="range" min="30" max="100" value="45" /></label></details>
          </section>
          <section class="setting-section pour-settings" id="pour-settings" aria-labelledby="pour-title" hidden>
            <div class="section-heading"><h2 id="pour-title">传统撒沙</h2><span>HAND POUR</span></div>
            <label class="pour-style-label" for="pour-style"><span class="setting-label">撒沙手势</span><select id="pour-style"><option value="stream">指缝细流</option><option value="scatter" selected>掌心散撒</option><option value="handful">一把撒开</option></select></label>
            <p class="pour-gesture-guide"><span><b>指缝细流</b> · 按住画细线</span><span><b>掌心散撒</b> · 拖动铺明暗</span><span><b>一把撒开</b> · 点一下释放</span></p>
            <div class="hand-supply"><button id="grab-sand" class="subtle-button">${icon('push')}抓一把沙</button><span class="hand-status-label"><strong id="hand-status" role="status" aria-live="polite">手中余沙 100%</strong></span></div>
            <div class="pour-ranges"><label class="range-setting" for="pour-height"><span class="setting-label">抬手高度 <output for="pour-height" id="pour-height-value">55%</output></span><input id="pour-height" type="range" min="0" max="100" value="55" /><span class="range-caps"><span>贴近沙面</span><span>抬高</span></span></label><label class="range-setting" for="pour-spread"><span class="setting-label">撒开范围 <output for="pour-spread" id="pour-spread-value">50%</output></span><input id="pour-spread" type="range" min="0" max="100" value="50" /><span class="range-caps"><span>集中</span><span>铺开</span></span></label></div>
            <p class="range-description pour-instructions">先抓一把，再按住或拖动释放；一把撒开只需点一下。松手后空中的沙会继续落完，余沙用尽再抓一把。力度影响落沙量，笔触大小与撒开范围影响落区；高度与沙量均为相对数值。</p>
          </section>
          <section class="setting-section reference-settings" aria-labelledby="reference-title">
            <div class="section-heading"><h2 id="reference-title">参考与临摹</h2><span>REFERENCE</span></div>
            <button id="import" class="full-button subtle-button">导入参考图</button><input type="file" id="import-file" accept="image/png,image/jpeg,image/webp" hidden />
            <p class="range-description">参考图叠在画台上，先临摹或预览，应用后才会改变沙床。</p>
            <div class="reference-toggles"><label class="check-setting"><input id="reference-visible" type="checkbox" checked />显示参考</label><label class="check-setting"><input id="reference-grid" type="checkbox" />临摹网格</label></div>
            <label class="range-setting" for="ref-opacity"><span class="setting-label">参考透明度 <output for="ref-opacity" id="ref-opacity-value">35%</output></span><input id="ref-opacity" type="range" min="0" max="100" value="35" /></label>
            <button id="reference-remove" class="full-button subtle-button">移除参考图</button>
            <details class="conversion-settings"><summary>把参考图转换为沙量</summary>
              <label class="range-setting" for="black-point"><span class="setting-label">黑场 <output for="black-point" id="black-point-value">0</output></span><input id="black-point" type="range" min="0" max="254" value="0" /></label>
              <label class="range-setting" for="white-point"><span class="setting-label">白场 <output for="white-point" id="white-point-value">255</output></span><input id="white-point" type="range" min="1" max="255" value="255" /></label>
              <label class="range-setting" for="gamma"><span class="setting-label">中间调 <output for="gamma" id="gamma-value">1.40</output></span><input id="gamma" type="range" min="10" max="500" value="140" /></label>
              <label class="check-setting"><input id="invert" type="checkbox" />反转明暗</label>
              <div class="height-controls"><label class="range-setting" for="min-height"><span class="setting-label">最低厚度 <output for="min-height" id="min-height-value">0.00</output></span><input id="min-height" type="range" min="0" max="800" value="0" /></label><label class="range-setting" for="max-height"><span class="setting-label">最高厚度 <output for="max-height" id="max-height-value">1.25</output></span><input id="max-height" type="range" min="0" max="800" value="125" /></label></div>
              <canvas id="conversion-preview" class="conversion-preview" width="512" height="384" aria-label="图片转换明暗预览"></canvas><p class="range-description">此处预览厚薄与明暗，应用后使用画台的沙粒材质。</p>
              <button id="apply-conversion" class="full-button export-button">应用到沙床</button>
            </details>
          </section>
          <section class="setting-section effect-settings" aria-labelledby="effects-title">
            <div class="section-heading"><h2 id="effects-title">效果实验</h2><span>EXPERIMENTS</span></div>
            <label class="select-setting" for="light"><span class="setting-label">${icon('sun')}光照氛围</span><select id="light"><option value="noon">午后暖阳</option><option value="sunset">日落斜光</option><option value="moon">月下沙面</option></select></label>
            <label class="range-setting" for="wetness"><span class="setting-label"><span class="label-icon">${icon('water')}湿沙</span><output for="wetness" id="wetness-value">0%</output></span><input id="wetness" type="range" min="0" max="100" value="0" /><span class="range-description">让沙粒更紧实，留住清晰边缘。</span></label>
            <label class="range-setting" for="wind"><span class="setting-label"><span class="label-icon">${icon('wind')}风</span><output for="wind" id="wind-value">0%</output></span><input id="wind" type="range" min="0" max="100" value="0" /><span class="range-description">吹动松沙，观察纹路慢慢变化。</span></label>
            <label class="flow-setting"><input id="flow" type="checkbox" /> 沙面自然流动</label><p class="range-description">关闭时保留笔迹，工具与风仍可搬动沙。</p>
          </section>
          <section class="setting-section canvas-settings" aria-labelledby="canvas-title">
            <div class="section-heading"><h2 id="canvas-title">画布</h2><span>YOUR CANVAS</span></div>
            <button id="thin" class="full-button subtle-button">铺一层薄沙</button>
            <div class="button-pair"><button id="clear" class="subtle-button">清空</button><button id="reset" class="subtle-button">恢复沙面</button></div>
            <button id="save" class="full-button subtle-button">${icon('save')}保存作品</button>
            <button id="save-copy" class="full-button subtle-button">另存副本</button>
            <div class="button-pair project-files"><button id="project-export" class="subtle-button">导出工程</button><button id="project-import" class="subtle-button">导入工程</button><input id="project-file" type="file" accept=".sandart.json,application/json" hidden /></div>
            <button id="export" class="full-button export-button">${icon('download')}导出作品</button>
            <p class="storage-note">参考图和作品仅在本机处理。工程文件可继续编辑，PNG 用于分享。</p>
          </section>
        </aside>
      </div>

      <div class="studio-status"><span class="status-dot" aria-hidden="true"></span><span id="status" role="status" aria-live="polite">正在准备画布…</span></div>
      <footer class="studio-footer">
        <details class="principles"><summary>沙画背后的原理 <span aria-hidden="true">＋</span></summary><div class="principles-body"><p>沙面模式把沙量变成起伏、沟槽与阴影。灯箱模式让光穿过薄沙，用厚薄表达明暗。两种模式各自保留独立沙床与作品，切换后可以继续创作。</p><p>传统撒沙先从有限的手中余沙释放，用实时近似模型表现空中下落与散开，再把实际落下的沙量沉积到沙床。松手后空中的沙仍会落完；这不是逐颗真实沙粒的三维物理模拟。湿沙与风也是可调的效果实验。</p><p>录制保留创作过程，回放使用独立沙床；视频按原时长实时生成 WebM，不包含参考图和工具栏。石块与贝壳、水流侵蚀将作为后续研究方向。</p><p>本实验参考 <a href="https://github.com/scottstts/Sandboard" target="_blank" rel="noopener noreferrer">Sandboard</a> 的高度场设计，独立实现沙画工具与两种表现模式。上游来源固定于 <a href="https://github.com/scottstts/Sandboard/tree/489cb01e81b11ba575887f7c76760498eb41aaa8" target="_blank" rel="noopener noreferrer">489cb01</a>，保留 GPL-3.0-only 许可证。</p></div></details>
        <div class="footer-credit"><span>SAND IS YOUR CANVAS.</span><span>001 · 沙画创作实验</span></div>
      </footer>
      <dialog id="gallery-dialog" class="gallery-dialog" aria-labelledby="gallery-title"><header class="gallery-header"><div><span class="eyebrow">YOUR SAND PAINTINGS</span><h2 id="gallery-title">我的手绘作品</h2></div><button id="close-gallery" class="subtle-button" aria-label="关闭作品集">关闭 ×</button></header><p class="gallery-description">沙耙、撒沙与其他工具画出的作品，随时打开继续创作。<br><a class="baseline-link" href="./gallery/">查看统一作品集 ↗</a></p><div id="gallery-list" class="gallery-list"><div class="gallery-empty">${icon('sand')}<strong>把第一幅沙画留在这里</strong><p>在工作室点击「保存作品」，以后还能接着画。</p></div></div></dialog>
    </main>
  `
  const controls = Array.from(root.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('button, input, select'))
  for (const control of controls) control.disabled = true
  const element = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!
  for (const [id, unit, scale, digits] of [['radius', '', 1, 0], ['strength', '%', 1, 0], ['wetness', '%', 1, 0], ['wind', '%', 1, 0], ['palm-angle', '°', 1, 0], ['palm-aspect', '%', 1, 0], ['pour-height', '%', 1, 0], ['pour-spread', '%', 1, 0], ['ref-opacity', '%', 1, 0], ['black-point', '', 1, 0], ['white-point', '', 1, 0], ['gamma', '', 0.01, 2], ['min-height', '', 0.01, 2], ['max-height', '', 0.01, 2]] as const) {
    const input = element<HTMLInputElement>(id)
    const output = element<HTMLOutputElement>(`${id}-value`)
    const update = () => { output.value = `${(Number(input.value) * scale).toFixed(digits)}${unit}`; input.style.setProperty('--range-progress', `${(Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100}%`) }
    input.addEventListener('input', update)
    update()
  }
  return {
    controls,
    demoControls: Array.from(root.querySelectorAll<HTMLButtonElement>('#demo-panel button')),
    demoPanel: element<HTMLElement>('demo-panel'),
    demoPlay: element<HTMLButtonElement>('demo-play'),
    demoRestart: element<HTMLButtonElement>('demo-restart'),
    demoStop: element<HTMLButtonElement>('demo-stop'),
    demoStatus: element<HTMLElement>('demo-status'),
    recordingControls: Array.from(root.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('#recording-panel button, #recording-panel input, #recording-panel select')),
    recordingPanel: element<HTMLElement>('recording-panel'),
    record: element<HTMLButtonElement>('record'),
    recordStop: element<HTMLButtonElement>('record-stop'),
    recordStatus: element<HTMLElement>('record-status'),
    replayPlay: element<HTMLButtonElement>('replay-play'),
    replayExit: element<HTMLButtonElement>('replay-exit'),
    replayTimeline: element<HTMLInputElement>('replay-timeline'),
    replayTime: element<HTMLElement>('replay-time'),
    replaySpeed: element<HTMLSelectElement>('replay-speed'),
    recordingExport: element<HTMLButtonElement>('recording-export'),
    recordingImport: element<HTMLButtonElement>('recording-import'),
    recordingFile: element<HTMLInputElement>('recording-file'),
    videoExport: element<HTMLButtonElement>('video-export'),
    videoCancel: element<HTMLButtonElement>('video-cancel'),
    examplePanel: element<HTMLElement>('example-panel'),
    exampleTitle: element<HTMLElement>('example-title'),
    exampleRestart: element<HTMLButtonElement>('example-restart'),
    exampleReturn: element<HTMLButtonElement>('example-return'),
    canvas: element<HTMLCanvasElement>('sand-canvas'),
    modeButtons: Array.from(root.querySelectorAll<HTMLButtonElement>('[data-mode]')),
    toolButtons: Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tool]')),
    radius: element<HTMLInputElement>('radius'),
    strength: element<HTMLInputElement>('strength'),
    wetness: element<HTMLInputElement>('wetness'),
    wind: element<HTMLInputElement>('wind'),
    light: element<HTMLSelectElement>('light'),
    clear: element<HTMLButtonElement>('clear'),
    thin: element<HTMLButtonElement>('thin'),
    reset: element<HTMLButtonElement>('reset'),
    undo: element<HTMLButtonElement>('undo'),
    redo: element<HTMLButtonElement>('redo'),
    save: element<HTMLButtonElement>('save'),
    export: element<HTMLButtonElement>('export'),
    status: element<HTMLElement>('status'),
    modeHint: element<HTMLElement>('mode-hint'),
    canvasLabel: element<HTMLElement>('canvas-label'),
    overlay: element<HTMLElement>('stage-overlay'),
    baselineLink: element<HTMLAnchorElement>('baseline-link'),
    stage: element<HTMLElement>('canvas-frame'),
    fullscreen: element<HTMLButtonElement>('fullscreen'),
    flow: element<HTMLInputElement>('flow'),
    presetButtons: Array.from(root.querySelectorAll<HTMLButtonElement>('[data-preset]')),
    importButton: element<HTMLButtonElement>('import'),
    importFile: element<HTMLInputElement>('import-file'),
    palmAngle: element<HTMLInputElement>('palm-angle'),
    palmAspect: element<HTMLInputElement>('palm-aspect'),
    palmSettings: element<HTMLDetailsElement>('palm-settings'),
    pourStyle: element<HTMLSelectElement>('pour-style'),
    pourHeight: element<HTMLInputElement>('pour-height'),
    pourSpread: element<HTMLInputElement>('pour-spread'),
    grabSand: element<HTMLButtonElement>('grab-sand'),
    handStatus: element<HTMLElement>('hand-status'),
    pourSettings: element<HTMLElement>('pour-settings'),
    referenceImage: element<HTMLImageElement>('reference-image'),
    referenceGridLayer: element<HTMLElement>('reference-grid-layer'),
    referenceVisible: element<HTMLInputElement>('reference-visible'),
    refOpacity: element<HTMLInputElement>('ref-opacity'),
    referenceOpacity: element<HTMLInputElement>('ref-opacity'),
    referenceGrid: element<HTMLInputElement>('reference-grid'),
    blackPoint: element<HTMLInputElement>('black-point'),
    whitePoint: element<HTMLInputElement>('white-point'),
    gamma: element<HTMLInputElement>('gamma'),
    invert: element<HTMLInputElement>('invert'),
    minHeight: element<HTMLInputElement>('min-height'),
    maxHeight: element<HTMLInputElement>('max-height'),
    conversionPreview: element<HTMLCanvasElement>('conversion-preview'),
    applyConversion: element<HTMLButtonElement>('apply-conversion'),
    referenceRemove: element<HTMLButtonElement>('reference-remove'),
    paintingTitle: element<HTMLInputElement>('painting-title'),
    saveCopy: element<HTMLButtonElement>('save-copy'),
    gallery: element<HTMLButtonElement>('gallery'),
    galleryDialog: element<HTMLDialogElement>('gallery-dialog'),
    galleryList: element<HTMLElement>('gallery-list'),
    closeGallery: element<HTMLButtonElement>('close-gallery'),
    newPainting: element<HTMLButtonElement>('new-painting'),
    autosaveStatus: element<HTMLElement>('autosave-status'),
    projectExport: element<HTMLButtonElement>('project-export'),
    projectImport: element<HTMLButtonElement>('project-import'),
    projectFile: element<HTMLInputElement>('project-file'),
  }
}
