// 中文理解总览为本项目的独立研究整理；能力与出处固定在 content.js 的研究提交。
export const researchPoster = {
  url: new URL('./assets/repository-map.png', import.meta.url).href,
  width: 1086,
  height: 1448,
  alt: '编程面试指南完整内容总览图：原库的系统复习、教程与资源导航，九个中文分类及全部50主题，本地增强、使用顺序和能力边界',
};

const sourceCapabilities = [
  { title: '建立复习范围', text: '把算法、语言机制、工程原则、架构、数据库与面试资源放到同一个目录，帮助按岗位选择要复习的主题。' },
  { title: '阅读概念与例子', text: '固定原文中有11篇详细教程，讲解复杂度、工程原则和三个JavaScript专题；另外39篇以资源入口、目录或技术对照为主。' },
  { title: '找到进一步学习的资料', text: '通过文档、代码仓库、文章、题库与可视化工具链接继续深入。原文的273条元数据引用与3条正文引用，经本地核对后合并为209个地址。' },
  { title: '浏览静态文档', text: '原站采用Astro、MDX与Tailwind，提供章节目录、移动端菜单与深浅主题切换，主要内容为西班牙语，外部资料也包含英语。' },
];

const learningValues = [
  { title: '把零散资料变成复习清单', text: '先从九个方向检查覆盖范围，再用主题和相关知识定位短板。目录完整表示已对应固定版本的全部页面，讲解深度仍要逐项看。' },
  { title: '从定义走到可解释的行为', text: '读完概念后预测示例输出、修改边界条件，再解释为什么这样设计。100条参考答法用于组织思路，可以结合自己的项目进一步展开。' },
  { title: '为选择提供出处与证据', text: '保留固定提交的原文、逐页引用和覆盖核对。遇到不确定的概念可以回到原文及外部资料，区分事实、学习补充和个人取舍。' },
];

const scenarios = [
  { title: '准备技术面试', text: '根据目标岗位选择通用基础、前端或后端路线，补齐语言、工程和设计问题，再去外部题库进行实际练习。', link: '#paths', label: '查看三条复习路线' },
  { title: '学习或切换技术栈', text: '用语言与框架主题建立概念清单，对照13种语言、8个前端和15个后端技术入口，再阅读对应文档与示例。', link: '#topic=interview-index', label: '阅读技术对照表' },
  { title: '讨论代码与架构', text: '从SOLID、GRASP、整洁架构和数据库主题整理评审问题，用真实项目说明职责、依赖、事务与性能取舍。', link: '#category=engineering', label: '进入工程原则' },
  { title: '制作自己的知识站', text: '复用MDX元数据与静态出版思路，或者参考本地数据模块、全文搜索和引用审计，为自己的技术资料建立可追溯目录。', link: '#coverage', label: '查看内容核对方法' },
];

const directions = [
  { title: '个人进度与收藏', text: '把学习状态、笔记和待复习主题保存在浏览器本机，再提供导入导出；当前页面以阅读和检索为主。' },
  { title: '更细的面试练习', text: '将题目关联到概念、答法与例子，增加分阶段复习和自测反馈；判题或运行环境需要单独实现。' },
  { title: '双语内容与更新对照', text: '增加西中对照、上游新旧提交差异和翻译校核流程，让新增页面、改动原文和引用变化都能被发现。' },
  { title: '可维护的资源质量', text: '为外部资料补充人工摘要、语言与适用范围，并保存可达性检查日期；当前资源类型按网址归类。' },
];

export function renderPoster({ esc, compact = false } = {}) {
  const poster = researchPoster;
  return `<figure class="research-poster${compact ? ' compact-poster' : ''}"><a class="poster-image-link" href="${esc(poster.url)}" target="_blank" rel="noopener noreferrer" aria-label="查看完整编程面试指南总览图，原图${poster.width}乘${poster.height}像素，在新标签打开"><img src="${esc(poster.url)}" width="${poster.width}" height="${poster.height}" alt="${esc(poster.alt)}" decoding="async"></a><figcaption><strong>一图看懂能力与全部主题</strong><span>本项目独立生成的内容图 · ${poster.width} × ${poster.height} px</span><div class="poster-actions"><a href="${esc(poster.url)}" target="_blank" rel="noopener noreferrer">查看原图</a><a href="${esc(poster.url)}" download="interview-guide-repository-map.png">下载 PNG</a></div></figcaption></figure>`;
}

export function renderResearch({ categories, topics, meta, esc, icon }) {
  const sourceLink = (file, label) => `<a href="${esc(meta.repo)}/blob/${esc(meta.commit)}/${esc(file)}" target="_blank" rel="noopener noreferrer">${esc(label)} ${icon('external')}</a>`;
  const count = category => topics.filter(topic => topic.category === category.id).length;
  return `<section class="research-hero"><div class="research-introduction"><p class="eyebrow">UNDERSTAND THE REPOSITORY</p><h1>把开源指南，<br>读成一张<em>完整地图。</em></h1><p class="research-lead">它帮助你梳理面试知识、理解技术概念，并找到进一步学习的资料。先看能力与原理，再进入主题、练习和表达。</p><div class="research-keyfacts"><span><strong>50</strong> 篇原文</span><span><strong>9</strong> 个中文方向</span><span><strong>209</strong> 个资源入口</span></div><p class="research-baseline">基于 DevCaress 的西班牙语指南 · 固定提交 ${esc(meta.commit.slice(0, 7))} · 上游 ${esc(meta.license)} 许可</p><div class="research-actions"><a class="research-primary" href="#overview">开始查找知识 ${icon('search')}</a><a href="#coverage">查看内容覆盖 ${icon('check')}</a></div></div>${renderPoster({ esc })}</section>
  <nav class="research-jump-links" aria-label="理解总览阅读顺序"><button data-research-section="research-capabilities">原库能力</button><button data-research-section="research-modules">九类内容</button><button data-research-section="research-principles">如何工作</button><button data-research-section="research-value">价值与场景</button><button data-research-section="research-directions">可扩展方向</button></nav>
  <section id="research-capabilities" class="research-section"><div class="research-heading"><p class="eyebrow">UPSTREAM CAPABILITIES</p><h2>原库能帮助你做什么</h2><p>这是一个技术面试指南与资源导航站。能力依据固定源码与内容核对，详细知识和外部练习分别通过对应入口访问。</p></div><div class="research-capability-grid">${sourceCapabilities.map((item, index) => `<article class="research-card"><span class="research-number">0${index + 1} / 原库</span><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('')}</div></section>
  <section id="research-modules" class="research-section"><div class="research-heading"><p class="eyebrow">NINE CONNECTED DIRECTIONS</p><h2>九个方向，完整对应50个主题</h2><p>下列九类是本地中文重组。点击一个方向，进入全部主题的中文讲解、复习问题与固定原文。</p></div><div class="research-module-grid">${categories.map((category, index) => `<a class="research-module" href="#category=${encodeURIComponent(category.id)}"><div>${icon(category.id)}<span>${String(index + 1).padStart(2, '0')}</span><strong>${count(category)} 个主题</strong></div><h3>${esc(category.name)}</h3><p class="module-purpose">${esc(category.description)}</p><p class="module-topics">${topics.filter(topic => topic.category === category.id).map(topic => esc(topic.title)).join(' · ')}</p><span class="module-entry">阅读这个方向 →</span></a>`).join('')}</div></section>
  <section id="research-principles" class="research-section"><div class="research-heading"><p class="eyebrow">FROM CONTENT TO PAGES</p><h2>原库怎样出版，本地怎样组织</h2><p>两套实现共享同一个固定内容来源；原库负责静态文档出版，本地增强版将主题、讲解和引用组织成可检索的数据。</p></div><div class="research-principle-grid"><article class="research-flow"><span class="scope-label">原库 · 构建期出版</span><h3>MDX 章节 → 静态文档站</h3><ol><li><strong>书写内容与元数据</strong><p>MDX 保存正文与代码例子，frontmatter 记录标题、描述、分类、侧栏顺序和引用。</p></li><li><strong>读取内容集合</strong><p>内容配置从 guide 目录匹配 MDX，并用 schema 检查字段；分类与顺序提供目录组织依据。</p></li><li><strong>生成章节页面</strong><p>动态路径组件在构建时列出全部章节路径，render 渲染正文，文档布局组合导航、代码展示与参考资料。</p></li><li><strong>交付 HTML 与静态资源</strong><p>Astro 构建结果可由静态站点托管；浏览器脚本处理菜单和主题等阅读交互，知识正文来自构建产物。</p></li></ol><div class="research-source-links">${sourceLink('src/content.config.ts', '内容配置')}${sourceLink('src/pages/guia/[...slug].astro', '页面生成')}${sourceLink('astro.config.mjs', 'Astro 配置')}</div></article><article class="research-flow"><span class="scope-label local-scope">本地 · 数据与浏览器交互</span><h3>固定快照 → 中文知识地图</h3><ol><li><strong>保存可核对的原文</strong><p>JSON 快照保留50篇 MDX 的完整文本、路径与引用，研究基线固定到完整 Git 提交。</p></li><li><strong>分别维护概要和补充</strong><p>content.js 提供分类与主题；enrichment 模块补上113节讲解、38个例子、100个误区和100条参考答法。</p></li><li><strong>建立检索与引用关联</strong><p>catalog-utils 汇总可见正文，按关键词、分类、标签和原文类型查找；元数据与正文资料共同关联回主题。</p></li><li><strong>审计后复制静态文件</strong><p>Node 审计比较原文路径、引用、答法和主题关联，再打包页面与配图。Hash 路由、详情弹窗和筛选在浏览器运行。</p></li></ol><div class="research-source-links"><a href="#coverage">查看机器核对结果 ${icon('check')}</a><a href="#resources">浏览209个资料入口 ${icon('link')}</a></div></article></div></section>
  <section class="research-section"><div class="research-heading"><p class="eyebrow">CLEAR OWNERSHIP OF EACH CAPABILITY</p><h2>哪些已经存在，哪些由谁提供</h2></div><div class="research-scope-table" tabindex="0" role="region" aria-label="能力所在层对照表，可横向滚动"><table><thead><tr><th scope="col">所在层</th><th scope="col">当前内容与能力</th><th scope="col">使用方式</th></tr></thead><tbody><tr><th scope="row">原库</th><td>MDX内容、11篇详细教程、39篇资源或问题导航，Astro文档出版与阅读交互。</td><td>回到固定原文理解源码和上下文。</td></tr><tr><th scope="row">本地新增</th><td>中文九类地图、展开讲解、独立例子与答法、全文检索、三条路线、引用与覆盖核对。</td><td>在本站阅读、筛选和复制示例。</td></tr><tr><th scope="row">外部平台</th><td>完整外链文章、文档、题库判题、算法动画和AI工具服务。</td><td>通过资料入口进入各自的网站或工具。</td></tr><tr><th scope="row">可开发方向</th><td>进度收藏、细分自测、双语对照、增量更新与资源质量记录。</td><td>下方为研究建议，尚未实现为本站功能。</td></tr></tbody></table></div></section>
  <section id="research-value" class="research-section"><div class="research-heading"><p class="eyebrow">VALUE IN LEARNING AND PRACTICE</p><h2>它为什么值得学习和复用</h2></div><div class="research-value-grid">${learningValues.map(item => `<article class="research-card"><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('')}</div><h3 class="research-subheading">把地图用到具体场景</h3><div class="research-scenario-grid">${scenarios.map(item => `<article class="research-card"><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p><a href="${esc(item.link)}">${esc(item.label)} →</a></article>`).join('')}</div></section>
  <section id="research-directions" class="research-section"><div class="research-heading"><p class="eyebrow">POSSIBLE NEXT STEPS</p><h2>沿着现有结构继续扩展</h2><p>以下是本研究提出的开发方向，当前功能清单仍以知识、资料和覆盖页为准。</p></div><div class="research-direction-grid">${directions.map(item => `<article class="research-card planned-card"><span class="scope-label planned-scope">研究建议 · 待开发</span><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('')}</div></section>
  <aside class="research-provenance"><p>总览文字与配图为本项目独立整理；配图依据2026-10-08核对的固定版本生成，完整图中的九类为中文重组。逐页原文、许可证与引用保留固定出处。</p><div><a href="#about">来源与许可</a><a href="#coverage">逐主题覆盖核对</a><a href="${esc(meta.repo)}/tree/${esc(meta.commit)}" target="_blank" rel="noopener noreferrer">固定上游源码 ${icon('external')}</a></div></aside>`;
}
