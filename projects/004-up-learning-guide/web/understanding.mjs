// 本研究独立实现；同一内容用于静态HTML与浏览器增强。
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function understandingHtml(data){
  return `<section id="understanding" class="understanding">
  <div class="section-title"><h2><small>COMPLETE UNDERSTANDING</small>完整引导图与项目理解</h2><a href="#/map">一图阅读</a></div>
  <p>沿用我们2026-10-09生成的完整行动图。回看核心方向、能力、学习闭环与价值观，再用底部三问确定下一步。</p>
  <figure class="core-map"><a href="./research/assets/up-core-map.png" target="_blank" rel="noopener noreferrer" aria-label="打开完整Up引导图，放大阅读"><img src="./research/assets/up-core-map.png" width="2400" height="1600" alt="Up学习与成长行动图：真实任务与成长证据、三类能力、六步闭环、五项价值观和回看三问"></a><figcaption>2400×1600 · 原始PNG完整保留 · 研究归纳与改写 · byoungd and contributors · CC BY-NC 4.0</figcaption></figure>
  <div class="intro-actions"><a class="button primary" href="./research/assets/up-core-map.png" download="up-core-map.png">保存完整引导图</a><a class="button light" href="./research/assets/up-core-map.png" target="_blank" rel="noopener noreferrer">打开原图，放大阅读</a><a class="text-link" href="./research/UNDERSTANDING.md" download>下载完整理解 Markdown</a><a class="text-link" href="./data/content.json" download="up-research.json">下载研究 JSON</a></div>
  <details class="understanding-summary" open><summary>完整摘要 · 能力、模块、原理、价值与方向</summary><dl>${data.summaryItems.map(item=>`<div><dt>${escape(item.title)}</dt><dd>${escape(item.text)}</dd></div>`).join('')}</dl></details>
  <details class="understanding-detail"><summary>深入阅读完整理解 · 十个章节</summary><nav class="understanding-toc" aria-label="完整理解章节">${data.understanding.toc.filter(h=>h.depth===2).map(h=>`<a href="#/overview?section=${h.id}">${escape(h.title)}</a>`).join('')}</nav><div class="prose">${data.understanding.html}</div></details>
  </section>`;
}
export function staticOverview(data){
  return `<section class="intro"><div><div class="eyebrow">004 / 开放内容研究</div><h1>Up 的能力与<em>知识地图</em></h1><p class="lead">一套以真实任务、反馈和证据为核心的终身学习指南。<br>从英语训练到AI协作，从作品交付到生活复盘。</p></div><div class="intro-note"><span class="note-label">关于这个项目</span><strong>个人经历，让方法有来路。<br>行动与证据，让方法可检验。</strong>双语书稿、工作纸与出版代码帮助读者实践。</div></section>${understandingHtml(data)}<noscript><section class="prose"><h2>详细专题下载</h2><p>本页完整摘要与章节支持直接阅读。详细资料可以保存到自己的文件中。</p><ul>${data.guides.map(guide=>`<li><a href="./research/${escape(guide.file)}" download>${escape(guide.title)}</a></li>`).join('')}</ul></section></noscript>`;
}

