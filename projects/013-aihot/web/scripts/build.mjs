// Independent static publication. Upstream runtime and paid services are not bundled.
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(project, 'web/dist');
const load = async file => JSON.parse(await readFile(path.join(project, file), 'utf8'));
const research = await load('src/research.json');
const sourceList = await load('src/source-list.json');
const feeds = await load('src/feed-verification.json');
const provenance = await load('assets/guide-provenance.json');
const { meta } = research;
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const text = value => typeof value === 'string' ? value : JSON.stringify(value, null, 2);
const list = items => items?.length ? `<ul>${items.map(item => `<li>${escape(text(item))}</li>`).join('')}</ul>` : '';
const upstreamLink = relative => /^https:\/\//.test(relative) ? relative : `${meta.upstream}/blob/${meta.commit}/${relative}`;
const evidence = items => items?.length ? `<div class="evidence">源码依据：${items.map(item => `<a href="${escape(upstreamLink(item.path))}" target="_blank" rel="noopener">${escape(item.label || item.path)} ↗</a>`).join(' · ')}</div>` : '';
const sections = [
  ['overview', '概览引导图'], ['capabilities', '完整能力'], ['modules', '模块架构'],
  ['pipeline', '处理原理'], ['sources', '18个示范信源'], ['acquisition', '六种获取方式'],
  ['scenarios', '使用场景'], ['reuse', '复用价值'], ['extensions', '扩展方向'],
  ['limits', '边界与判断'], ['references', '源码证据与研究记录']
];
const section = (id, label, intro, body) => `<section id="${id}" aria-labelledby="${id}-heading"><header class="section-heading"><span class="section-no">${String(sections.findIndex(item => item[0] === id) + 1).padStart(2, '0')}</span><div><h2 id="${id}-heading">${label}</h2><p>${intro}</p></div></header>${body}</section>`;
const groupNames = { institution: '机构与技术生态', media: '专业媒体', community: '作者与社区' };
const feedResults = new Map(feeds.results.map(item => [item.id, item]));
const checkedOk = feeds.results.filter(item => item.status === 'ok').length;
const cards = research.capabilities.map(item => `<article class="card" data-capability="${escape(item.id)}"><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p>${list(item.details)}${evidence(item.evidence)}</article>`).join('');
const modules = research.modules.map(item => `<details class="module" data-module="${escape(item.id)}"><summary><strong>${escape(item.name)}</strong><span>${escape(item.role)}</span></summary><div class="details-body"><a class="code-link" href="${escape(upstreamLink(item.path))}" target="_blank" rel="noopener">${escape(item.path)} ↗</a>${list(item.details)}</div></details>`).join('');
const pipeline = research.pipeline.map((item, i) => `<li data-step="${escape(item.id)}"><span class="step-number">${String(i + 1).padStart(2, '0')}</span><div><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p>${list(item.details)}${evidence(item.evidence)}</div></li>`).join('');
const sources = sourceList.sources.map((source, i) => {
  const status = feedResults.get(source.id);
  const result = status?.status === 'ok' ? `实测解析成功 · ${status.format} · ${status.itemCount} 条` : `实测 ${status?.httpStatus ? 'HTTP ' + status.httpStatus : status?.status || '未记录'}，需复查`;
  return `<article class="source-card" data-source-id="${escape(source.id)}" data-group="${source.group}" data-format="${source.format}" data-search="${escape([source.name,source.focus,source.value,source.owner,source.feedUrl,source.tags.join(' ')].join(' ').toLowerCase())}"><div class="source-top"><span class="source-number">${String(i+1).padStart(2,'0')}</span><div><span class="badge">${escape(groupNames[source.group])}</span> <span class="badge quiet">${source.format} · ${source.tier}</span></div></div><h3><a href="${escape(source.homepage)}" target="_blank" rel="noopener">${escape(source.name)} ↗</a></h3><p>${escape(source.focus)}</p><p class="source-value">${escape(source.value)}</p><dl class="source-meta"><div><dt>上游获取</dt><dd>rss 适配器 · ${source.intervalMinutes} 分钟轮询</dd></div><div><dt>归属实体</dt><dd>${escape(source.owner || '上游未配置')}</dd></div></dl><div class="feed-url"><a href="${escape(source.feedUrl)}" target="_blank" rel="noopener">${escape(source.feedUrl)}</a><button class="copy-feed" data-copy="${escape(source.feedUrl)}" aria-label="复制 ${escape(source.name)} 订阅地址" hidden>复制订阅</button></div><p class="feed-status ${status?.status === 'ok' ? 'ok' : 'unverified'}">${escape(result)}</p><details><summary>阅读边界与注意点</summary>${list(source.limitations)}<p class="small">原配置 site_fulltext=false、syndicate_fulltext=false；内部获取不等于公开全文分发授权。</p></details></article>`;
}).join('');
const adapters = research.acquisition.map(item => `<article class="adapter" data-adapter="${escape(item.id)}"><div class="adapter-heading"><span class="badge">${escape(item.id)}</span><h3>${escape(item.name)}</h3></div><p>${escape(item.mechanism)}</p><p><strong>接入条件：</strong>${escape(text(item.requirements))}</p><details><summary>查看获取配置 / 接口示例</summary><pre><code>${escape(text(item.example))}</code></pre></details>${list(item.notes)}${evidence(item.evidence)}</article>`).join('');
const scenarios = research.scenarios.map(item => `<article class="card"><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><p><strong>工作方式：</strong>${escape(text(item.workflow))}</p><p class="accent-text"><strong>价值：</strong>${escape(item.value)}</p></article>`).join('');
const reuse = research.reuse.map(item => `<article class="card"><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p>${list(item.items)}</article>`).join('');
const extensions = research.extensions.map(item => `<article class="card"><span class="badge amber">${escape(item.status || '待开发方向')}</span><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><p class="small"><strong>前提：</strong>${escape(text(item.prerequisite))}</p></article>`).join('');
const limits = research.limits.map(item => `<article class="limit"><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p></article>`).join('');
const references = research.references.map(item => `<li><a href="${escape(upstreamLink(item.path))}" target="_blank" rel="noopener">${escape(item.label)} ↗</a><p>${escape(item.description)}</p><code>${escape(item.path)}</code></li>`).join('');
const summaryItems = research.summaryItems.map(item => `<div><dt>${escape(item.title)}</dt><dd>${escape(item.text)}</dd></div>`).join('');
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(meta.description)}"><meta name="theme-color" content="#103b4b"><title>AIHOT｜信源、能力、原理与复用研究</title><link rel="icon" href="./favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="./styles.css"><script type="module" src="./app.js"></script></head>
<body><a class="skip-link" href="#main">跳到正文</a><header class="topbar"><a class="brand" href="#">AIHOT<span>开源研究 · 013</span></a><nav aria-label="主要入口"><a href="#sources">信源清单</a><a href="#acquisition">获取方式</a><a href="../">项目总览 ↗</a></nav></header>
<main id="main"><div class="hero"><div class="hero-copy"><p class="eyebrow">SOURCE → CONTENT → EVENT → PUBLICATION</p><h1>从信源获取，<br>到可持续的行业资讯。</h1><p class="lead">AIHOT 把分散材料接入同一条资讯生产流程。对我们最直接的复用价值，是它选了哪些源、怎样获取，再加上筛选、归组与出刊的工程参考。</p><div class="actions"><a class="button primary" href="#overview">先看完整引导图 ↓</a><a class="button" href="#sources">查阅 18 个源</a><a class="text-link" href="${escape(meta.upstream)}" target="_blank" rel="noopener">原仓库 ↗</a></div><p class="hero-note">基于固定提交 ${meta.commit.slice(0,7)} · 原始研究与引导图 ${escape(meta.originalResearchDate)} · 整理发布 ${escape(meta.researchDate)}</p></div><aside class="hero-aside"><span class="aside-label">一条资讯生产线</span><ol><li><span>01</span>采集材料与正文</li><li><span>02</span>相关性、精选与写作</li><li><span>03</span>事实、故事与热度</li><li><span>04</span>页面、报告与接口</li></ol><p>当前网页是研究成果。源库运行需要 worker、数据库与模型服务。</p></aside></div>
<div class="stats"><div><strong>18</strong><span>公开示范信源<br>10 机构 / 5 媒体 / 3 社区</span></div><div><strong>6</strong><span>接入方式<br>示范清单全部为 RSS/Atom</span></div><div><strong>2</strong><span>同一模型独立评分调用<br>取均值后与分层阈值比较</span></div><div><strong>3</strong><span>内容聚合层<br>文章 → 事实 → 故事</span></div></div>
<div class="reading-layout"><aside class="toc"><p>阅读导航</p><nav aria-label="章节导航">${sections.map(([id,label]) => `<a href="#${id}">${label}</a>`).join('')}</nav><a class="toc-download" href="./data/source-list.json" download>下载信源 JSON ↓</a></aside><div class="reading-content">
${section('overview','概览引导图','沿用我们已生成的这张图，保留完整画面。图展示信源、获取与复用关系，细节以本页固定提交的源码分析为准。',`<figure class="guide"><a class="guide-open" href="./assets/aihot-overview.png" aria-label="打开完整 AIHOT 引导图"><img src="./assets/aihot-preview.jpg" alt="AIHOT 信源、获取与复用全景图：18个示范源、RSS与正文获取、六种接入和完整处理链路" width="1448" height="1086" fetchpriority="high" decoding="async"></a><figcaption>2026-10-08 生成的研究引导图 · 本次原图逐字节保留。<span><a class="guide-open" href="./assets/aihot-overview.png">放大阅读</a> · <a href="./assets/aihot-overview.png" download="aihot-overview.png">下载原图</a></span></figcaption></figure><details class="summary-panel" open><summary>我们对这个库的完整理解</summary><dl>${summaryItems}</dl></details>`)}
${section('capabilities','完整能力','能力从获取材料开始，持续到精选、中文写作、事件视图、报告与公开访问；每一项都附有对应源码。',`<div class="card-grid">${cards}</div>`)}
${section('modules','模块架构','原库使用 Node.js、Fastify、React Router、PostgreSQL 与 pg-boss。模块围绕后台生产、编辑管理与统一出版组织。',`<div class="architecture"><div><strong>采集 / worker</strong><span>接入、抽取、队列与重试</span></div><b aria-hidden="true">→</b><div><strong>编辑 / 数据库</strong><span>筛选、写作、事实、故事与热度</span></div><b aria-hidden="true">→</b><div><strong>统一出版</strong><span>网页、RSS、API、MCP、Markdown</span></div></div><div class="modules">${modules}</div>`)}
${section('pipeline','处理原理','先发现链接，再拿正文；先判断单篇材料的阅读价值，再聚合事件。后台预先生成结果，读者访问不会触发模型调用。',`<ol class="pipeline">${pipeline}</ol><div class="callout"><strong>评分、归组、热度解决不同问题</strong><p>精选评分回答“这篇材料是否值得读”；事实归组回答“是否在说同一件事”；故事归组连接同一事件的直接进展；热度根据独立参与者和时间衰减衡量关注信号。它们不能替代事实核验。</p></div>`)}
${section('sources','18个示范信源','这是 industry/sources.json 的公开示范清单，按来源定位重新整理。18 个源全部配置为 rss，适配器兼容 RSS 和 Atom；并不代表 AIHOT 线上站全部信源。',`<div class="source-intro"><p><strong>获取链路：</strong>订阅发现标题 / 链接 / 时间 → Feed 自带内容或抓取文章页 → Readability 提取正文 → 可选 Jina 补救。订阅地址可复用，正文成功率需要逐源验证。</p><div class="actions compact"><a href="./data/source-list.json" download>信源 JSON ↓</a><a href="./data/sources.csv" download>信源 CSV ↓</a><a href="./data/sources.upstream.json" download>上游原始配置 ↓</a></div></div><div class="source-controls" hidden><label>搜索信源<input id="source-search" type="search" placeholder="名称、主题、机构或订阅地址" autocomplete="off"></label><label>类别<select id="source-group"><option value="all">全部类别</option><option value="institution">机构与技术生态 · 10</option><option value="media">专业媒体 · 5</option><option value="community">作者与社区 · 3</option></select></label><label>格式<select id="source-format"><option value="all">RSS + Atom</option><option value="RSS">RSS</option><option value="Atom">Atom</option></select></label><button id="reset-filters">重置</button></div><p id="source-count" class="small" aria-live="polite">显示全部 18 个示范信源</p><div class="sources-grid">${sources}</div><p id="source-empty" hidden>没有符合筛选的信源。可清空搜索或重置类别。</p><div class="callout"><strong>获取实测：${checkedOk}/18 个订阅在本次环境成功解析</strong><p>检测日期 ${escape(sourceList.meta.cataloguedOn)}；HTTP / XML 检查只说明这次订阅请求的结果，不代表完整正文可用。错误可能与访问限制、网络环境或地址变化有关；保留原配置并单独列出结果，方便后续维护。</p><a href="./data/feed-verification.json" download>下载逐源实测记录 ↓</a></div>`)}
${section('acquisition','六种获取方式','RSS 是示范清单已经配置的路径。其他五种是源码提供的接入能力，使用时仍需配置目标、凭据、选择器或字段映射。',`<div class="adapters">${adapters}</div>`)}
${section('scenarios','使用场景','适合需要持续发现、筛选和跟踪外部变化的团队。选择场景后，应先定义读者、观察对象与有效信息的判断标准。',`<div class="card-grid">${scenarios}</div>`)}
${section('reuse','复用价值','优先复用“信源参考 + 获取能力”。再根据产品需求，引入编辑、归组与出版。完整搬用全部管线会增加模型、数据和运维成本。',`<div class="reuse-route"><span>① 选源与分类</span><b>→</b><span>② 接入与正文验证</span><b>→</b><span>③ 统一材料格式</span><b>→</b><span>④ 按需增加精选 / 归组</span></div><div class="card-grid">${reuse}</div>`)}
${section('extensions','扩展方向','以下是我们基于源码提出的后续方向。每个方向都列出接入前提，便于决定投入顺序。',`<div class="card-grid">${extensions}</div>`)}
${section('limits','边界与判断','源覆盖、正文质量、成本与模型误差会共同影响结果。研究结论与可运行服务应分别验收。',`<div class="limits">${limits}</div>`)}
${section('references','源码证据与研究记录','研究基线固定到以下提交，避免后续上游变化影响本页解释。所有源码依据都链接这个版本。',`<div class="baseline"><span>KKKKhazix / AIHOT</span><a href="${escape(meta.upstream)}/tree/${meta.commit}" target="_blank" rel="noopener"><code>${meta.commit}</code> ↗</a></div><ul class="references">${references}</ul><div class="downloads"><a href="./data/research.json" download>完整研究数据</a><a href="./data/guide-provenance.json" download>引导图来源与校验</a><a href="./docs/README.md">研究说明 Markdown</a><a href="./docs/notes.md">研究与验证记录</a><a href="./LICENSE.upstream.txt">上游 MIT 许可证</a><a href="./NOTICE.upstream.txt">上游 NOTICE</a></div><p class="small">本页为独立中文研究整理与静态发布，源码摘录保留上游许可。AIHOT 名称仅用于识别研究对象。18 个外部信源的内容与分发权遵循各自网站的条件。</p>`)}
</div></div></main><footer><span>013 · AIHOT 信源与资讯引擎研究</span><a href="#">回到顶部 ↑</a><a href="https://github.com/yydshly/1008_codex_project/tree/main/projects/013-aihot">本研究源码 ↗</a></footer><dialog id="guide-dialog" aria-label="完整引导图"><div class="dialog-bar"><strong>AIHOT 完整引导图</strong><div><button id="guide-zoom" aria-pressed="false">按原尺寸阅读</button><a href="./assets/aihot-overview.png" download>下载原图</a><button id="guide-close" aria-label="关闭引导图">关闭 ×</button></div></div><div class="dialog-image"><img src="./assets/aihot-overview.png" alt="AIHOT 信源、获取与复用全景图高清原图" loading="lazy"></div></dialog><span id="copy-status" class="toast" role="status" hidden></span></body></html>`;

if (!/^[0-9a-f]{40}$/.test(meta.commit)) throw new Error('研究基线必须为完整提交。');
await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'data'), { recursive: true });
await mkdir(path.join(output, 'docs'), { recursive: true });
await writeFile(path.join(output, 'index.html'), html);
for (const file of ['styles.css','app.js','favicon.svg']) await cp(path.join(project, 'web', file), path.join(output, file));
await cp(path.join(project, 'assets'), path.join(output, 'assets'), { recursive: true });
for (const name of ['research','source-list','feed-verification']) await cp(path.join(project, 'src', name + '.json'), path.join(output, 'data', name + '.json'));
for (const name of ['evidence-verification','content-audit','browser-verification','publication-verification']) {
  try { await cp(path.join(project, 'src', name + '.json'), path.join(output, 'data', name + '.json')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
await cp(path.join(project, 'assets/guide-provenance.json'), path.join(output, 'data/guide-provenance.json'));
await cp(path.join(project, 'src/upstream/sources.json'), path.join(output, 'data/sources.upstream.json'));
await cp(path.join(project, 'src/upstream/LICENSE'), path.join(output, 'LICENSE.upstream.txt'));
await cp(path.join(project, 'src/upstream/NOTICE'), path.join(output, 'NOTICE.upstream.txt'));
for (const name of ['README.md','notes.md']) await cp(path.join(project, name), path.join(output, 'docs', name));
const csvEscape = value => `"${String(value ?? '').replaceAll('"','""')}"`;
const columns = ['name','group','kind','format','tier','feedUrl','homepage','intervalMinutes','owner','focus','value'];
await writeFile(path.join(output, 'data/sources.csv'), '\uFEFF' + [columns,...sourceList.sources.map(source => columns.map(key => source[key]))].map(row => row.map(csvEscape).join(',')).join('\r\n') + '\r\n');
await writeFile(path.join(output, '.nojekyll'), '');
console.log(JSON.stringify({ output, sources: sourceList.sources.length, capabilities: research.capabilities.length, modules: research.modules.length, acquisition: research.acquisition.length, baseline: meta.commit, guideProvenance: !!provenance }));
