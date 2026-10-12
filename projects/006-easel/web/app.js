import {renderUnderstanding,renderGuide,renderValuePage} from './research-view.mjs';
const resourceVersion = ''; // 生产构建注入内容哈希，避免旧缓存混用。
const $ = (selector, root = document) => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let facts, skills, verification, publication;
let capLayer = 'all', capQuery = '', sourceGroup = 'hot', sourceQuery = '';
const groups = {hot:'Web 热榜',news:'资讯 11 源',reference:'文档可选源',custom:'自定义订阅',agent:'研究与资料输入'};
const main = $('#main'), dialog = $('#skill-dialog');
const sourceUrl = path => `https://github.com/ZJU-REAL/Easel/blob/${facts.commit}/${path}`;
const layerName = id => facts.layers.find(x => x.id === id)?.name || id;
const evidence = refs => `<div class="evidence-links">${refs.map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener" title="${esc(x.path)}">${esc(x.label)}:${x.line} ↗</a>`).join('')}</div>`;
const tag = (text, type='') => `<span class="tag ${type}">${esc(text)}</span>`;
const section = (title, body, extra='') => `<section class="section"><div class="section-title"><h2>${title}</h2>${extra}</div>${body}</section>`;
const pageHead = (number,title,lead) => `<div class="page-head"><div class="eyebrow">Easel / Source Atlas · ${number}</div><h1>${title}</h1><p class="page-lead">${lead}</p></div>`;
const callout = (title, text) => `<div class="callout"><strong>${title}</strong><p>${text}</p></div>`;
const table = (heads, rows, wide=false) => `<div class="table-wrap"><table class="${wide?'wide-table':''}"><thead><tr>${heads.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

function overview() {
  return pageHead('01','Easel 到底能做什么？','一个由 OpenClaw Agent 编排的社媒内容工作台。它用账号画像组织上下文，把检索、策划、创作工具、平台分发和复盘接在一起。这里逐项核对它如何实现。')+
    renderUnderstanding(publication)+renderGuide(publication)+
    `<div class="tags">${tag('固定提交 fb80ae6','code')}${tag('Apache-2.0')}${tag('源码研究 · 非全功能运行演示','agent')}</div>
    <div class="stats"><div class="stat"><strong>114<span>个技能</span></strong><p>逐项功能、原理、流程与来源</p></div><div class="stat"><strong>6<span>类能力</span></strong><p>五层工作流＋基础与画像</p></div><div class="stat"><strong>6 + 11<span>配置源</span></strong><p>Web 热榜与资讯脚本，独立路径</p></div></div>`+
    section('真正的执行结构',`<div class="architecture" aria-label="用户和画像进入 OpenClaw Agent，由技能文档指导并调用工具、输出产物"><div class="arch-top"><div class="arch-box"><strong>用户任务＋账号画像</strong><p>运营意图、素材、六维 Markdown<br>可编辑的定位与长期记忆</p></div><div class="arch-box center"><strong>OpenClaw Agent</strong><p>读取所需 SKILL → 选择工具 → 检查结果<br>按任务组合，支持文件产物与续作</p></div><div class="arch-box"><strong>程序工具＋外部服务</strong><p>抓取、媒体处理、模型客户端<br>平台登录、发布与数据记录</p></div></div><div class="arch-layers">${facts.layers.filter(x=>x.id!=='general').map(x=>`<a href="#capabilities?layer=${x.id}"><strong>${x.name.split('与')[0]}</strong><span>${x.count} 个技能</span></a>`).join('')}</div><p class="arch-caption">五层是能力组织方式。每次任务不必从发现一直执行到发布；Agent 也可以只做图文、剪辑或复盘。</p></div>`)+
    callout('“定账号方向 → 搜索 → 制视频 → 发布”可以作为一种任务组合','但它覆盖不了全部能力，也不是后端写死的必经五步。源码入口把“请执行 /技能”交给 Agent；实际取数、制作和发布由不同工具承担。')+
    section('系统模块 · 能力与原理',`<div class="grid2">${facts.components.map(x=>`<article class="module"><h3>${x.title}</h3><div class="tech">${esc(x.tech)}</div><p>${esc(x.text)}</p>${evidence(x.evidence)}</article>`).join('')}</div>`,`<a href="#capabilities">查看全部 114 个技能 →</a>`)+
    section('适合哪些工作？',`<div class="grid2">${facts.scenarios.map(([title,text])=>`<article class="scenario"><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>`)+
    section('从这里继续',`<div class="grid2"><article class="module"><h3>先看搜索和过滤</h3><p>逐源查看端点、获取、解析、时间窗、关键词、缓存、补充策略，以及哪些筛选依赖 Agent。</p><a class="button primary" href="#search">打开信息源研究 →</a></article><article class="module"><h3>再看实现与承诺的边界</h3><p>人设低分、预检、草稿箱和定时派发的实际行为；保留离线核验通过项与 Windows 自检失败项。</p><a class="button" href="#evidence">打开源码与验证 →</a></article></div>`);
}

function searchPage() {
  return pageHead('02','信息从哪来，又如何筛选？','Easel 的“搜索”包含几条不同路径：第三方热榜、资讯抓取、用户订阅，以及 Agent 的网页研究。获取和过滤不是同一个步骤。')+
    `<div class="tags">${tag('接口与脚本获取','code')}${tag('画像相关度由 Agent 判断','agent')}${tag('在线可用性未逐源实测','external')}</div>`+
    section('信息源清单',`<div class="filters" id="source-filters">${Object.entries(groups).map(([id,name])=>`<button class="filter" data-source-group="${id}" aria-pressed="${id===sourceGroup}">${name}<span>${facts.sources.filter(x=>x.group===id).length}</span></button>`).join('')}</div><div class="toolbar"><label class="search-field"><span class="hidden">检索信息源</span><input id="source-search" type="search" placeholder="查媒体、域名、关键词或获取方式" value="${esc(sourceQuery)}" aria-label="检索信息源"></label><button class="button" id="expand-sources">展开当前来源</button></div><div class="result-line"><span id="source-result-count"></span><span>点击一行看获取与过滤细节</span></div><div class="source-list" id="source-list"></div>`)+
    section('四种过滤，分别在做什么？',table(['路径','关键词／语义','时间判断','去重与排序','截取与降级'],facts.filterRules.map(x=>x.map(esc)),true))+
    callout('特别容易误读：Web 热榜 ≠ 画像语义搜索','Web 默认微博、抖音、知乎；热榜 Skill 默认微博、抖音，文档另列小红书等可选端点。Web 接口没有画像参数，标题相关度和推荐二创方案由 Agent 按 Skill 继续分析。')+
    section('看一遍程序规则的影响',`<div class="demo-panel"><div class="demo-top"><h3>离线过滤实验台</h3>${tag('原创样本 · 不是真实资讯')}</div><p class="demo-note">用同一组虚构条目，对照标题过滤、摘要过滤、时间窗、去重和 smart_fill。这里只演示核对过的规则；不向上游服务发送请求，不模拟 Agent 语义评分。</p><div class="demo-controls"><label>处理路径<select id="demo-mode"><option value="news">资讯脚本 · 以 AIHOT 24h 为例</option><option value="rss">自定义 RSS · 最近 2 天</option><option value="hot">Web 热榜 · 原顺序前 3 条</option></select></label><label>关键词（逗号 OR）<input id="demo-keyword" value="AI,大模型" aria-label="实验关键词"></label><label class="check"><input id="demo-fill" type="checkbox" checked>资讯不足 5 条时 smart_fill</label></div><div id="demo-results" aria-live="polite"></div></div>`)+
    section('资讯预设如何选源？',`<p class="demo-note">daily_briefing.py 内置五个固定组合。这里的 profile 是简报预设 key，和用户创建的账号画像名是两个概念。</p>${table(['命令 key','方向','实际来源'],facts.briefings.map(x=>[ `<code>${esc(x[0])}</code>`,esc(x[1]),esc(x[2])]))}<div class="evidence-links"><a href="${sourceUrl('skills/openclaw/skill-news-intelligence/scripts/daily_briefing.py')}" target="_blank" rel="noopener">daily_briefing.py ↗</a></div>`)+
    section('正文、语义和可信度在哪里补上？',`<div class="grid2"><article class="module"><h3>正文补充：--deep</h3><p>${esc(facts.deep.text)}</p>${evidence(facts.deep.evidence)}</article><article class="module"><h3>画像与需求判断：Agent</h3><p>竞品、UGC、算法更新和内容缺口技能依靠 web_search / web_fetch 获取证据，再由 Agent 核对相关度、需求与来源。不是后端自动执行的统一语义过滤服务。</p><a href="#capabilities?layer=discover">查看 9 个发现技能 →</a></article></div>`)+
    section('Agent 网页研究：具体如何搜？',`<div class="grid2">${facts.agentResearch.map(x=>`<article class="module"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p><h4>文档中的查询组合</h4><ul>${x.queries.map(q=>`<li><code>${esc(q)}</code></li>`).join('')}</ul><p class="coverage">${esc(x.boundary)}</p>${evidence(x.evidence)}</article>`).join('')}</div>`)+
    section('平台规则研究的参考来源',`<p class="demo-note">以下是 Skill 参考文档列出的查询目标。它们与上面的 6 个热榜和 11 个资讯 source key 属于不同路径；公众号和站内公告可能需要额外的访问条件。</p>${table(['平台／类型','上游列出的域名与账号'],facts.ruleSources.map(x=>x.map(esc)))}${evidence(facts.ruleSourcesEvidence)}`);
}

function renderSources() {
  const query=sourceQuery.toLowerCase().trim();
  const rows=facts.sources.filter(x=>x.group===sourceGroup && (!query || JSON.stringify(x).toLowerCase().includes(query)));
  $('#source-result-count').textContent=`${groups[sourceGroup]} · ${rows.length} 条路径`;
  $('#source-list').innerHTML=rows.length?rows.map((x,i)=>`<details class="source" ${i===0?'open':''}><summary><div class="source-title"><div><strong>${esc(x.name)}</strong><div class="source-key">${esc(x.key)}</div></div></div><div class="source-method">${esc(x.method)}</div><div class="source-state">${x.group==='reference'?'文档参考，未接入雷达':x.group==='hot'||x.group==='news'?'源码已核对 · 未实时请求':'按输入／环境执行'}</div></summary><div class="source-body"><div class="wide"><h4>获取地址</h4><div class="endpoint">${esc(x.url)}${x.backup?`<br><b>备用：</b>${esc(x.backup)}`:''}</div></div><div><h4>返回结构与提取</h4><p>${esc(x.parse)}</p></div><div><h4>如何过滤</h4><p>${esc(x.filter)}</p></div><div><h4>权限与依赖</h4><p>${esc(x.auth)}</p></div><div><h4>失败与边界</h4><p>${esc(x.limits)}</p></div><div class="wide">${evidence(x.evidence)}</div></div></details>`).join(''):`<div class="empty">当前分类中没有匹配来源。换个关键词或分类试试。</div>`;
  document.querySelectorAll('[data-source-group]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.sourceGroup===sourceGroup));
  $('#expand-sources').textContent=rows.length===1?'收起当前来源':'展开当前来源';
}

const samples=[
 {id:'a',title:'AI 工具新功能',summary:'介绍效率工具',age:2,url:'a',heat:20},
 {id:'b',title:'效率工具周报',summary:'摘要提到大模型与 AI',age:5,url:'b',heat:99},
 {id:'c',title:'AI 历史回顾',summary:'旧资讯',age:90,url:'c',heat:85},
 {id:'d',title:'AI 工具转载',summary:'与第 1 条同一链接',age:1,url:'a',heat:75},
 {id:'e',title:'大模型应用观察',summary:'日期字段无法解析',age:null,url:'e',heat:60},
 {id:'f',title:'摄影与日常记录',summary:'没有指定主题词',age:4,url:'f',heat:40},
];
function demo() {
  const mode=$('#demo-mode').value, keyword=$('#demo-keyword').value;
  const keys=keyword.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean), fill=$('#demo-fill').checked;
  const match=x=>!keys.length||keys.some(k=>(x.title+(mode==='rss'?' '+x.summary:'')).toLowerCase().includes(k));
  let keep=[],reasons={},fillIds=new Set();
  if(mode==='hot') {
    keep=samples.slice(0,3);samples.forEach((x,i)=>reasons[x.id]=i<3?'保留原榜单位置':'超出前 3 条');
  } else {
    const hours=mode==='rss'?48:24, seen=new Set();
    for(const x of samples) {
      if(!match(x))reasons[x.id]=mode==='rss'?'标题＋摘要未命中':'标题未命中';
      else if(x.age!==null && x.age>hours)reasons[x.id]='超过时间窗';
      else if(mode==='rss' && seen.has(x.url))reasons[x.id]='重复链接';
      else{keep.push(x);seen.add(x.url);reasons[x.id]=x.age===null?'日期无效仍保留':'关键词命中保留';}
    }
    if(mode==='rss')keep.sort((a,b)=>(a.age??Infinity)-(b.age??Infinity));
    if(mode==='news'&&keys.length&&keep.length<5&&fill) {
      const urls=new Set(keep.map(x=>x.url)),titles=new Set(keep.map(x=>x.title));
      for(const x of samples.filter(x=>x.age===null||x.age<=24).slice(0,5)) {
        if(keep.length>=5)break;
        if(!urls.has(x.url)&&!titles.has(x.title)){keep.push(x);urls.add(x.url);titles.add(x.title);fillIds.add(x.id);reasons[x.id]='放宽后补充 smart_fill';}
      }
    }
  }
  $('#demo-keyword').disabled=mode==='hot';$('#demo-fill').disabled=mode!=='news';
  const selected=new Set(keep.map(x=>x.id));
  const outputOrder=keep.map(x=>samples.indexOf(x)+1).join(' → ')||'无';
  $('#demo-results').innerHTML=`<div class="demo-summary">6 条输入 → ${keep.length} 条输出${fillIds.size?`（${fillIds.size} 条为放宽补充）`:''} · 输出顺序 ${outputOrder}</div>${samples.map((x,i)=>`<div class="sample-row ${selected.has(x.id)?'':'discard'}"><span class="sample-order">0${i+1}</span><div><strong>${esc(x.title)}</strong><p>${esc(x.summary)} · ${x.age===null?'未知时间':x.age+' 小时前'} · 链接 ${x.url} · 热度 ${x.heat}</p></div><span class="reason">${esc(reasons[x.id])}</span></div>`).join('')}`;
}

function capabilitiesPage() {
  return pageHead('03','114 个技能，逐项展开','完整对应固定提交的 skills/openclaw/*/SKILL.md。每项包含能力描述、机制说明、技能规定的流程、引用工具与完整原文。目录数量不代表逐项端到端运行成功。')+
    `<div class="filters" id="cap-filters"><button class="filter" data-layer="all" aria-pressed="${capLayer==='all'}">全部<span>114</span></button>${facts.layers.map(x=>`<button class="filter" data-layer="${x.id}" aria-pressed="${capLayer===x.id}">${x.name}<span>${x.count}</span></button>`).join('')}</div><div class="toolbar"><label class="search-field"><input id="cap-search" type="search" placeholder="查能力、技术、skill id 或原文，如：搜索、FFmpeg、草稿" value="${esc(capQuery)}" aria-label="检索所有技能与原文"></label><button class="button" id="clear-caps">重置</button></div><div class="result-line"><span id="cap-result-count" aria-live="polite"></span><span>搜索包含完整 Skill 原文</span></div><div class="skill-grid" id="skill-list"></div>`;
}
function renderSkills() {
  const q=capQuery.toLowerCase().trim();
  const rows=skills.filter(x=>(capLayer==='all'||x.layer===capLayer)&&(!q||[x.id,x.title,x.description,x.mechanism,x.document].join(' ').toLowerCase().includes(q)));
  $('#cap-result-count').textContent=`${capLayer==='all'?'全部能力':layerName(capLayer)} · ${rows.length} / 114 项`;
  $('#skill-list').innerHTML=rows.length?rows.map(x=>`<article class="skill-card"><header><h3>${esc(x.title)}</h3>${tag(layerName(x.layer).split('与')[0])}</header><div class="skill-id">${esc(x.id)}</div><p>${esc(x.description)}</p><p class="mechanism">${esc(x.mechanism)}</p><button data-skill="${x.id}" aria-label="展开${esc(x.title)}的原理与流程">原理、流程与源码 ↗</button></article>`).join(''):`<div class="empty">没有匹配技能。换个关键词，或重置筛选。</div>`;
  document.querySelectorAll('[data-layer]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.layer===capLayer));
}
function updateCapsUrl() {
  const params=new URLSearchParams();if(capLayer!=='all')params.set('layer',capLayer);if(capQuery)params.set('q',capQuery);
  history.replaceState(null,'','#capabilities'+(params.size?'?'+params:''));
}

function showSkill(id, tab='summary') {
  const x=skills.find(x=>x.id===id);if(!x)return;
  const files=[...new Set([...x.scripts,...x.references])];
  const inputOutput=x.sections.filter(s=>/输入|输出|产物|Inputs|Output|Deliver|参数|交付/i.test(s.title));
  const rules=x.sections.filter(s=>/注意|约束|红线|边界|质量|规则|检查|Gotchas|限制|费用|依赖/i.test(s.title));
  const renderSections=sections=>sections.map((s,i)=>`<details class="doc-section" ${i===0?'open':''}><summary>${esc(s.title)}</summary><pre>${esc(s.text)}</pre></details>`).join('');
  let body;
  if(tab==='document')body=`<p class="doc-note">上游 Skill 正文，按固定提交保留。这里展示文档内容；其中要求执行的动作没有在本研究站运行。</p><pre class="original-doc">${esc(x.document)}</pre>`;
  else if(tab==='workflow')body=`<p class="doc-note">以下为技能文档规定的流程。是否执行、能否成功，仍取决于 Agent、环境和工具结果。</p>${renderSections(x.workflow.length?x.workflow:x.sections)}${rules.length?`<h3>约束与注意事项</h3>${renderSections(rules.filter(s=>!x.workflow.includes(s)))}`:''}`;
  else body=`<p class="intro">${esc(x.description)}</p><h3>处理原理与执行边界</h3><div class="mechanism-box"><p>${esc(x.mechanism)}</p></div><h3>源码与引用工具</h3><p class="doc-note">工具列表来自技能目录及文档提及，不表示每次任务必然调用全部工具，也不表示本研究已运行它们。</p><div class="tools-list"><a href="${sourceUrl(x.path)}" target="_blank" rel="noopener">${esc(x.path)} ↗</a>${files.map(path=>`<a href="${sourceUrl(path)}" target="_blank" rel="noopener">${esc(path)} ↗</a>`).join('')}</div>${x.missingReferences.length?`<div class="missing"><strong>文档引用缺失</strong><br>该提交中没有以下被提及的文件；不能把其内容视为仓库已附带资料。<br>${x.missingReferences.map(esc).join('<br>')}</div>`:''}${inputOutput.length?`<h3>输入、输出与交付规定</h3>${renderSections(inputOutput)}`:`<h3>技能正文中的关键规定</h3>${renderSections(x.sections.slice(0,3))}`}`;
  $('#dialog-content').innerHTML=`<div class="dialog-head"><div class="dialog-title-row"><div><div class="eyebrow">${layerName(x.layer)} / Skill</div><h2 id="dialog-title">${esc(x.title)}</h2><code>${esc(x.id)}</code></div><button class="close" aria-label="关闭技能详情">×</button></div><div class="dialog-tabs" role="tablist" aria-label="技能资料"><button role="tab" data-detail-tab="summary" aria-selected="${tab==='summary'}" class="${tab==='summary'?'active':''}">能力与原理</button><button role="tab" data-detail-tab="workflow" aria-selected="${tab==='workflow'}" class="${tab==='workflow'?'active':''}">执行流程</button><button role="tab" data-detail-tab="document" aria-selected="${tab==='document'}" class="${tab==='document'?'active':''}">完整原文</button></div></div><div class="dialog-body" data-id="${x.id}" role="tabpanel">${body}</div>`;
  if(!dialog.open)dialog.showModal();
  dialog.scrollTop=0;
}

function productionPage() {
  const routes=[
    ['HTML → 图片','卡片、金句、海报、对比图','Agent 编写排版 HTML / CSS → Playwright Chromium 截图 → 图片审计。文字以浏览器排版，便于改稿。'],
    ['主题 → 短视频','auto-short-video + FFmpeg','主题 → 台词和分镜 → 配图／可选 AI 片段 → TTS、字幕、BGM → storyboard JSON → assemble.py 合成。默认配图缓动。'],
    ['原片 → 包装整片','video-production + Remotion','已有本地视频 → SDK 运行态 → 转录／分场 → 设计表与代码 → 程序门／预览人审 → Remotion 渲染与交付包。']];
  return pageHead('04','从账号方向，到制作和发布','你提到的五个关键点都有对应实现。但每一步用了不同技术，且自动化程度因入口而异。下面按实际调用链看一遍。')+
    section('一条可能的完整任务链',`<div class="steps">${facts.pipeline.map(x=>`<article class="step"><span class="step-num">${x.number}</span><div><h3>${x.title}</h3><p>${esc(x.text)}</p><span class="mode">${x.mode}</span>${evidence(x.evidence)}</div></article>`).join('')}</div>`)+
    section('制作有三条代表路线',`<div class="routes">${routes.map(([title,tech,text])=>`<article class="route"><span>${tech}</span><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>`)+
    section('视频技术具体负责什么？',table(['环节','实际技术','处理方式与条件'],[
      ['脚本／分镜','Agent + video-script','按时长、平台与画像生成台词、镜头、字幕、Hook；字数工具校验，创作判断来自 LLM。'],
      ['AI 动态镜头','ai_video.py + 外部 provider','Wan / Seedance / 可灵等任务提交、轮询、下载；用户自备 key，各 API 支持与费用不同。'],
      ['配音／字幕','云 TTS 或 Edge；faster-whisper','配置 VOICE_PROVIDER 走云端，否则 Edge 在线兜底；已有台词可分句字幕，真实语音转录需 ASR。'],
      ['合成／后期','FFmpeg + ffprobe','storyboard 指定图片／视频、时长、旁白与 BGM，做缩放、补边、Ken Burns、拼接、混音、字幕，编码 H.264 / AAC。'],
      ['原片重包装','内置 SDK + Remotion','是可续跑的产线接口，带设计表、预览确认和质量门；不能推广成所有普通技能都具备同样硬门。']
    ].map(x=>x.map(esc)),true))+
    section('点击 Web 发布按钮，实际发生什么？',`<div class="module"><div class="tags">${tag('母版正文预检','agent')}${tag('浏览器确认','code')}${tag('各平台独立发送','code')}</div><p style="margin-top:15px">performPrecheck 并行请求合规／钩子分析与人设一致性，报告显示在页面。publishAll 随后弹出 window.confirm，用户确认后按选中平台依次提交各自 effective 正文。预检异常也只记录提醒；程序不解析报告内容来决定阻断。</p><p>“一稿多改”是单独按钮，调用内容改编技能后写入各平台覆盖正文；发布按钮不会自动先做这步。预检检查母版 title / body，因此不能当作覆盖文案、封面与视频的逐平台完整复审。</p>${evidence(facts.findings[5].evidence)}</div>`)+
    section('各平台的真实执行方式',table(['平台','Web／脚本路线','实际结果与条件'],[
      ['小红书','xhs_publish.py · Playwright','持久化登录态；上传图文／视频、话题填写和成功校验；敏感凭证 guard 可硬拦。'],
      ['抖音','douyin_publish.py · Playwright','持久化登录态；转码等待、异步状态／短信流程及发布回读。'],
      ['B 站','Web 使用 biliup CLI','cookies.json、视频参数；Web 分区与默认标签有固定回退值，不是统一浏览器路线。'],
      ['公众号','HTML 转换＋weixin_mp_stats','登录与封面条件满足后创建草稿。Web 明确返回草稿箱，不等于直接群发。'],
      ['快手／视频号／知乎','web_publisher.py · Playwright','依各平台创作者页面、登录态和 DOM 选择器；验证码或页面更新可使自动化停下。'],
      ['定时排期','publish_queue.py + 上层执行','JSON 队列计算到期；run --exec 只输出派发计划和备注，实际发送与周期唤醒依赖 Agent／调度。']
    ].map(x=>x.map(esc)),true))+
    callout('“决定发布”分为建议、程序约束和用户确认','人设分低于 80 只警告；平台媒体类型、文件路径、登录与敏感凭证有程序检查。Agent 技能的质量／版权判断属于建议流程，Web 最后由用户确认。不同入口不能混为同一发布闸门。')+
    `<a class="button" href="#capabilities?layer=publish">展开 20 个发布技能 →</a>`;
}

function valuePage() { return renderValuePage(publication); }

function evidencePage() {
  const missing=skills.filter(x=>x.missingReferences.length);
  return pageHead('06','结论有依据，也有验证范围','关键结论连接到固定提交的具体行号。文档写了什么、程序执行什么、在当前环境测了什么，在这里分别列出。')+
    `<div class="tags">${tag('114 / 114 Skill 已整理','code')}${tag(`${verification.results.filter(x=>x.status==='pass').length} 项离线核验通过`,'pass')}${tag('1 项上游 Windows 自检失败','fail')}</div>`+
    section('关键结论 · 回到源码核对',`<div class="grid2">${facts.findings.map((x,i)=>`<article class="finding"><span class="finding-no">FINDING 0${i+1}</span><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p>${evidence(x.evidence)}</article>`).join('')}</div>`)+
    section('实际核验记录',`<p class="demo-note">环境：${esc(verification.platform)} · Python ${esc(verification.python)}。UTC 运行时间：${esc(verification.date)}。测试代码和原始摘要随研究产物保留。</p>${verification.results.map(x=>`<details class="verification"><summary>${tag(x.status==='pass'?'通过':'失败',x.status)}<strong>${esc(x.name)}</strong><span>+</span></summary><pre>${esc(x.detail)}</pre><div class="evidence-links"><a href="${sourceUrl(x.path)}" target="_blank" rel="noopener">${esc(x.path)} ↗</a></div></details>`).join('')}${callout('RSS 自检失败的准确含义',esc(verification.rssFailure))}<p class="coverage">${esc(verification.scope)}</p><div class="evidence-links"><a href="./verification.json" target="_blank">查看机器可读核验记录 ↗</a></div>`)+
    section('覆盖、引用和可重复性',table(['研究项','覆盖与保存方式'],[
      ['技能目录','完整 114 个；6／9／16／52／20／11，逐项机制说明、流程分区、完整上游正文。'],
      ['核心源码','账号画像、Agent 入口、热榜、资讯、RSS、媒体合成、发布预检／适配器、派发和队列逐路径核对。'],
      ['源清单','6 个 Web 热榜、11 个资讯源、5 条文档补充、用户 feed 和 4 类研究／资料输入；列出端点与边界。'],
      ['验证边界','源码核对与离线测试；未逐源请求当前线上接口，未调用付费模型，未登录或真实发稿。'],
      ['引用路径核对',missing.length?`${missing.length} 个技能的引用路径未找到；详情列出待核对项。`:'按仓库根路径、技能相对路径和跨技能路径解析；本次提及的 references/*.md 未发现缺失文件。'],
      ['原始文件校验','src/upstream-manifest.json 保存获取的文本文件路径、字节数和 SHA-256；源缓存忽略提交，可按固定 commit 重建。']
    ].map(x=>x.map(esc))))+
    section('来源与许可',`<div class="module"><h3>ZJU-REAL / Easel</h3><p>研究基线：<code>${facts.commit}</code>，上游提交时间 2026-10-07；整理日期 2026-10-09。保留上游 Apache-2.0 许可及 Easel 贡献者署名。</p><p>本子项目新增的是研究整理脚本、事实清单、逐项机制说明、离线实验和静态网页。没有修改上游执行逻辑。Skill 正文和展示名来自该固定提交，按许可提供供读者核对。</p><div class="evidence-links"><a href="./LICENSE.upstream.txt" target="_blank">Apache-2.0 原始许可 ↗</a><a href="./research.md" target="_blank">研究说明 ↗</a><a href="./capabilities.json" target="_blank">114 项完整资料 JSON ↗</a><a href="https://github.com/ZJU-REAL/Easel/commit/${facts.commit}" target="_blank" rel="noopener">固定提交 ↗</a></div></div>`);
}

function route() {
  const [rawView,query='']=location.hash.slice(1).split('?');
  const view=['overview','search','capabilities','production','value','evidence'].includes(rawView)?rawView:'overview';
  const params=new URLSearchParams(query);
  if(dialog.open)dialog.close();
  if(view==='capabilities'){capLayer=facts.layers.some(x=>x.id===params.get('layer'))?params.get('layer'):'all';capQuery=params.get('q')||'';}
  document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x.dataset.view===view);if(x.dataset.view===view)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});
  main.innerHTML=({overview,search:searchPage,capabilities:capabilitiesPage,production:productionPage,value:valuePage,evidence:evidencePage}[view])();
  document.title=({overview:'项目与架构',search:'搜索与过滤',capabilities:'全部能力',production:'制作与发布',value:'场景与扩展',evidence:'源码与验证'}[view])+' · Easel 源码能力图谱';
  if(view==='search'){renderSources();demo();}
  if(view==='capabilities'){renderSkills();if(params.get('skill'))showSkill(params.get('skill'));}
  window.scrollTo({top:0,left:0,behavior:'instant'});
  if(view==='value'&&params.get('section')==='extensions')document.getElementById('extension-directions')?.scrollIntoView({behavior:'instant',block:'start'});
}

main.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.layer){capLayer=button.dataset.layer;renderSkills();updateCapsUrl();}
  if(button.dataset.sourceGroup){sourceGroup=button.dataset.sourceGroup;sourceQuery='';$('#source-search').value='';renderSources();}
  if(button.dataset.skill){showSkill(button.dataset.skill);}
  if(button.id==='clear-caps'){capLayer='all';capQuery='';$('#cap-search').value='';renderSkills();updateCapsUrl();}
  if(button.id==='expand-sources'){
    const details=[...document.querySelectorAll('.source')],expand=details.some(x=>!x.open);details.forEach(x=>x.open=expand);button.textContent=expand?'收起当前来源':'展开当前来源';
  }
});
main.addEventListener('input',event=>{
  if(event.target.id==='cap-search'){capQuery=event.target.value;renderSkills();updateCapsUrl();}
  if(event.target.id==='source-search'){sourceQuery=event.target.value;renderSources();}
  if(event.target.id.startsWith('demo-'))demo();
});
main.addEventListener('change',event=>{if(event.target.id.startsWith('demo-'))demo();});
dialog.addEventListener('click',event=>{
  if(event.target.closest('.close'))dialog.close();
  const button=event.target.closest('[data-detail-tab]');if(button)showSkill($('.dialog-body',dialog).dataset.id,button.dataset.detailTab);
  if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}
});
$('.skip').addEventListener('click',event=>{event.preventDefault();main.focus();});
try {
  const responses=await Promise.all(['facts.json','capabilities.json','verification.json','publication.json'].map(x=>fetch('./'+x+(resourceVersion?'?v='+resourceVersion:''))));
  if(responses.some(x=>!x.ok))throw new Error('研究资料加载失败');
  [facts,{items:skills},verification,publication]=await Promise.all(responses.map(x=>x.json()));
  window.addEventListener('hashchange',route);route();
} catch(error) { main.insertAdjacentHTML('afterbegin',`<div class="callout"><strong>未能载入研究资料</strong><p>请通过本地预览服务打开网页，并检查构建产物是否完整。${esc(error.message)}</p></div>`); }
