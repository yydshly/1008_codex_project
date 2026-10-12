const main = document.querySelector('#main');
const escape = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const routeLink = (id, section='') => `#/guide/${id}${section ? `?section=${encodeURIComponent(section)}` : ''}`;
const guideId = file => file.split('/').at(-1).replace('.md','');
const guideLink = file => routeLink(guideId(file));
const pad = value => String(value).padStart(2,'0');
let data;
let cleanup = () => {};
const views = {};
const methodSteps = [
  ['定义任务','把愿望缩到一个可以完成的动作','写清真实场景、受众、输入、期限与完成标准。一次只处理一个问题，才能知道下一步该学什么。','例：20 分钟写一份项目更新，让同事知道进展、阻塞和下一检查点。'],
  ['保存基线','先留下未经修饰的第一版','在 AI、翻译或答案介入前尝试一次，记录材料、时限、允许工具和实际错误。基线保护比较的起点。','例：保留英文邮件初稿与实际用时，暂不让工具润色。'],
  ['诊断缺口','找到最影响结果的一个问题','区分语言、概念、策略、容量与环境障碍。选一至三个高影响问题，避免用“粗心”或“没天赋”结束分析。','例：邮件的问题是责任人不清楚，先修意思与结构，再修措辞。'],
  ['练习反馈','用最少的输入，完成自己的修改','补必要材料，合上资料主动输出。核对来源、测试或真实读者反馈，说明采纳与拒绝的理由。','例：同事复述邮件后指出遗漏，自己改写并保存版本差异。'],
  ['保持迁移','撤掉提示，再换一个场景','即时表现、过几天的保持和新条件下的迁移分别检查，防止把熟悉感或漂亮终稿当成稳定能力。','例：第七天换一个项目，不看旧稿再写邮件，请另一位同事确认。'],
  ['写回状态','让证据决定下一次行动','把完成、证据、错误、边界和下一任务保存在会话外的文件。根据容量决定继续、调整、降档或停止。','例：更新学习状态 v2，下一轮只练风险说明，新会话从文件接续。'],
];
const heading = (eyebrow,title,description) => `<div class="view-heading"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>`;
const topicRows = () => data.guides.filter(guide=>guide.id!=='sources').map(guide=>`<a class="topic-row" href="${routeLink(guide.id)}"><span class="topic-number">${pad(guide.number)}</span><div><h3>${escape(guide.title)}</h3><p>${escape(guide.description)}</p></div><span class="topic-tags">${escape(guide.tags)}</span><span class="topic-open">阅读</span></a>`).join('');

function renderOverview(){
  main.innerHTML = `<section class="intro"><div><div class="eyebrow">004 / 开放内容研究</div><h1>Up 的能力与<em>知识地图</em></h1><p class="lead">一套以真实任务、反馈和证据为核心的终身学习指南。<br>从英语训练到 AI 协作，从作品交付到生活复盘。</p><div class="intro-actions"><a class="button primary" href="${routeLink('01-learning-system')}">阅读方法原理</a><a class="button light" href="#/catalog">浏览全部内容</a></div></div><div class="intro-note"><span class="note-label">关于这个项目</span><strong>个人经历，让方法有来路。<br>行动与证据，让方法可检验。</strong>双语书稿、工具模板和出版代码共同组成 Up；读者通过自己的实践把内容用起来。</div></section>
  <div class="metrics"><div class="metric"><strong>97</strong><span>原文页面完整对应</span></div><div class="metric"><strong>7</strong><span>中文详细专题</span></div><div class="metric"><strong>25</strong><span>工作纸使用说明</span></div><div class="metric"><strong>392</strong><span>分组技术词条</span></div></div>
  <section><div class="section-title"><h2><small>CAPABILITIES</small>这个库能帮你做什么？</h2><a href="#/topics">展开全部专题</a></div><div class="capabilities">
  <article class="capability"><div class="cap-number">01 / LANGUAGE</div><h3>训练可用的英语</h3><p>从真实沟通任务诊断起点，把词汇、语法和听读说写，练到能够独立使用。</p><ul><li class="tag">词汇八维</li><li class="tag">听读五遍</li><li class="tag">求职与协作</li></ul><a class="text-link" href="${routeLink('02-english')}">阅读英语训练</a></article>
  <article class="capability"><div class="cap-number">02 / AI & PROJECTS</div><h3>协作、制作与交付</h3><p>限定 AI 的帮助与权限，核验输出，用作品、客户反馈和评测验证真实结果。</p><ul><li class="tag">AI 工作流</li><li class="tag">创业验证</li><li class="tag">可靠性评测</li></ul><a class="text-link" href="${routeLink('03-ai-and-projects')}">阅读 AI 与项目</a></article>
  <article class="capability"><div class="cap-number">03 / LIFE & RHYTHM</div><h3>持续行动与生活复盘</h3><p>看见身体、关系和责任的代价，在容量变化与计划中断后，仍知道怎样回来。</p><ul><li class="tag">恢复与边界</li><li class="tag">家庭学习</li><li class="tag">九十天周期</li></ul><a class="text-link" href="${routeLink('04-life-and-long-term')}">阅读生活与长期</a></article></div></section>
  <section><div class="section-title"><h2><small>HOW IT WORKS</small>用一条学习闭环连接所有内容</h2><a href="${routeLink('01-learning-system')}">完整方法说明</a></div><div class="method"><div class="method-steps" role="tablist" aria-label="学习闭环的六个步骤">${methodSteps.map(([title],index)=>`<button id="step-${index}" class="method-step${index===0?' active':''}" role="tab" aria-selected="${index===0}" aria-controls="method-panel" tabindex="${index===0?0:-1}" data-step="${index}"><span>${pad(index+1)}</span>${title}</button>`).join('')}</div><div class="method-detail" id="method-panel" role="tabpanel" aria-labelledby="step-0"></div></div></section>
  <section><div class="section-title"><h2><small>READING MAP</small>七个专题，完整展开</h2><a href="#/catalog">97 页逐项目录</a></div><div class="topic-list">${topicRows()}</div></section>
  <section class="architecture"><div><h3>内容，也有自己的出版系统</h3><p>Markdown 保存书稿，导航连接双语页面与工作纸；静态网站提供阅读和搜索，脚本生成离线电子书。</p><a class="text-link" style="color:#7bd5c8;display:inline-block;margin-top:13px" href="${routeLink('06-publishing')}">查看实现原理与许可</a></div><div class="pipeline" aria-label="Markdown 经导航组织，输出网站和电子书"><span>Markdown</span><b>+</b><span>统一导航</span><b>/</b><div class="outputs"><span>双语网站 · VitePress</span><span>工作纸 · Markdown</span><span>电子书 · EPUB / PDF</span></div></div></section>`;
  const setStep = index => {
    const [,title,text,example]=methodSteps[index];
    const panel=main.querySelector('#method-panel');
    main.querySelectorAll('[data-step]').forEach((button,i)=>{button.classList.toggle('active',i===index);button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;});
    panel.setAttribute('aria-labelledby',`step-${index}`);
    panel.innerHTML=`<div><h3>${escape(title)}</h3><p>${escape(text)}</p><a class="text-link" href="${routeLink('01-learning-system')}">阅读对应方法</a></div><div class="method-example"><span>一个可检查的例子</span>${escape(example)}</div>`;
  };
  setStep(0);
  main.querySelectorAll('[data-step]').forEach(button=>{
    button.addEventListener('click',()=>setStep(Number(button.dataset.step)));
    button.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const current=Number(button.dataset.step);const next=event.key==='Home'?0:event.key==='End'?5:(current+(event.key==='ArrowRight'?1:5))%6;setStep(next);main.querySelector(`[data-step="${next}"]`).focus();}});
  });
}
views.overview=renderOverview;
views.map=()=>{
  main.innerHTML=heading('CORE MAP / 一图理解','学习与成长行动图','按核心方向、能力、行动闭环与价值观回看，最后用三个问题选出一个具体行动。')+
    `<div class="intro-actions"><a class="button primary" href="./research/assets/up-core-map.png" download="up-core-map.png">保存原图</a><a class="button light" href="./research/assets/up-core-map.png" target="_blank" rel="noopener noreferrer">打开原图，放大阅读</a><a class="text-link" href="${routeLink('01-learning-system')}">阅读方法原理</a></div>
    <figure class="core-map"><a href="./research/assets/up-core-map.png" target="_blank" rel="noopener noreferrer" aria-label="打开学习与成长行动图原图，可放大阅读"><img src="./research/assets/up-core-map.png" alt="Up学习与成长行动图：用真实任务学习，用证据判断成长。三类能力为英语、AI与真实项目、生活与长期成长；六步为定义任务、保存首版、定向练习、接受反馈、复测迁移、更新状态；价值观为真实、诚实、主体性、可持续与负责。"></a><figcaption>本研究对 byoungd/up 的归纳与改写 · byoungd and contributors · CC BY-NC 4.0 · <a href="${routeLink('sources')}">来源与许可</a></figcaption></figure>
    <details class="core-map-text"><summary>展开文字版</summary><div class="prose"><h2>用真实任务学习，用证据判断成长</h2><p>把学习转化为独立能力，让行动服务真实生活。</p><h3>三类核心能力</h3><ul><li>英语能力：词汇、语法、听读说写，以及求职沟通与远程协作。</li><li>AI与真实项目：受限协作、作品交付、需求验证、成本与评测。</li><li>生活与长期成长：自我认识、选择与关系、恢复、家庭与长期行动。</li></ul><p>共同实践工具：学习状态、任务简报、证据链与每周复盘。内容通过双语书稿、工作纸、网站与电子书提供。</p><h3>六步行动闭环</h3><ol><li>定义任务：谁需要什么结果？</li><li>保存首版：先自己做，再用工具。</li><li>定向练习：修一个高影响缺口。</li><li>接受反馈：核验来源，自己修改。</li><li>复测迁移：过几天重做，换场景再用。</li><li>更新状态：保存证据，决定下一步，再选择继续、调整或恢复。</li></ol><h3>五项价值观</h3><ul><li>真实：用任务与作品检验。</li><li>诚实：分清事实、解释与假设。</li><li>主体性：保留首版与最终判断。</li><li>可持续：尊重容量，允许恢复。</li><li>负责：守住隐私、边界与责任。</li></ul><h3>回看时问自己</h3><p>我在解决什么？证据在哪里？下一步能小到什么程度？</p></div></details>`;
};
views.topics=()=>{main.innerHTML=heading('READING / 详细专题','选择一个问题，深入阅读','七篇专题完整保留研究正文。先从眼前的任务进入，读完一节就留下一份自己的样本。')+`<div class="topic-list">${topicRows()}</div><section class="architecture"><div><h3>原文与证据，都有回访入口</h3><p>所有中文导航页面都有逐页摘要、固定版本原文与英文对应；来源、许可与研究范围单独记录。</p></div><div class="intro-actions"><a class="button" href="#/catalog">原文完整目录</a><a class="button" href="${routeLink('sources')}">来源与许可</a></div></section>`;};

function renderGuide(id,params){
  const guide=data.guides.find(item=>item.id===id);
  if(!guide){renderMissing();return;}
  const sections=guide.toc.filter(item=>item.depth<=3);
  const tocLinks=sections.map(item=>`<a href="${routeLink(id,item.id)}" data-toc="${item.id}" class="${item.depth===3?'sub':''}">${escape(item.title)}</a>`).join('');
  const next=data.guides[guide.number] || data.guides[0];
  main.innerHTML=`<div class="mobile-toc"><details><summary>本篇目录 · ${sections.length} 节</summary>${tocLinks}</details></div><div class="article-layout"><article class="article"><header class="article-head"><div class="eyebrow">${id==='sources'?'REFERENCE / 研究来源':`CHAPTER ${pad(guide.number)} / ${escape(guide.label)}`}</div><h1>${escape(guide.title)}</h1><div class="article-meta"><span>研究版 · ${escape(data.researchDate)}</span><span>正文约 ${Math.round(guide.characters/1000)} 千字符</span><span>${sections.length} 节目录</span></div><div class="article-actions"><a href="./research/${guide.file}" download>下载本篇 Markdown</a><a href="#/catalog">对应原文目录</a></div></header><div class="prose">${guide.html}</div><div class="article-next"><a href="#/topics">返回专题列表</a><a href="${routeLink(next.id)}">继续阅读：${escape(next.title)}</a></div></article><aside class="article-toc" aria-label="本篇目录"><p class="toc-title">本篇目录</p>${tocLinks}</aside></div>`;
  main.querySelectorAll('.prose table').forEach(table=>{const wrapper=document.createElement('div');wrapper.className='table-wrap';wrapper.tabIndex=0;wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','表格，可横向滚动');table.before(wrapper);wrapper.append(table);});
  const observer=new IntersectionObserver(entries=>{const entry=entries.find(item=>item.isIntersecting);if(entry)main.querySelectorAll('[data-toc]').forEach(link=>link.classList.toggle('active',link.dataset.toc===entry.target.id));},{rootMargin:'-85px 0px -66% 0px'});
  main.querySelectorAll('.prose h2,.prose h3').forEach(node=>observer.observe(node));
  cleanup=()=>observer.disconnect();
  const section=params.get('section');
  if(section)requestAnimationFrame(()=>document.getElementById(section)?.scrollIntoView({behavior:'instant',block:'start'}));
}
function renderMissing(){main.innerHTML=heading('READING / 内容入口','没有找到这个页面','请从完整目录或专题列表选择内容。')+'<a class="button primary" href="#/topics">打开专题列表</a>';}

const normalize = value => String(value).toLocaleLowerCase().trim();
const matches = (text,query) => normalize(query).split(/\s+/).filter(Boolean).every(token=>normalize(text).includes(token));
const empty = () => '<div class="empty-state">没有找到匹配内容。可以缩短关键词，或切换为全部分类。</div>';

views.catalog = params => {
  main.innerHTML=heading('CONTENTS / 97 页完整对应','原始内容，一页也不跳过','六部正文、开卷入口、实操、工具箱、后记、历史归档与技术词表。每页都有中文摘要、固定原文和英文对应。')+
    `<div class="toolbar"><label class="input-search"><span class="search-icon" aria-hidden="true"></span><input id="catalog-query" type="search" value="${escape(params.get('q')||'')}" placeholder="搜索页面标题或摘要" aria-label="搜索完整目录"></label><select class="filter-select" id="catalog-group" aria-label="筛选目录分组"><option value="">全部分组</option>${data.groups.map(group=>`<option value="${escape(group.title)}">${escape(group.title)} · ${group.pages} 页</option>`).join('')}</select><span class="filter-count" id="catalog-count" aria-live="polite"></span></div><div id="catalog-results"></div>`;
  const update=()=>{
    const query=document.querySelector('#catalog-query').value;
    const selected=document.querySelector('#catalog-group').value;
    const pages=data.pages.filter(item=>(!selected || item.group===selected) && matches(`${item.title} ${item.summary}`,query));
    document.querySelector('#catalog-count').textContent=`${pages.length} / 97 页`;
    document.querySelector('#catalog-results').innerHTML=pages.length?data.groups.filter(group=>pages.some(item=>item.group===group.title)).map(group=>{
      const items=pages.filter(item=>item.group===group.title);
      return `<section class="catalog-group"><h2 class="group-heading">${escape(group.title)}<small>${items.length} 页</small></h2><div class="catalog-grid">${items.map(item=>`<article class="catalog-card"><span class="page-id">PAGE ${pad(item.order)}</span><h3>${escape(item.title)}</h3><p>${escape(item.summary)}</p><div class="card-links"><a href="${guideLink(item.guide)}">阅读中文专题</a><a class="secondary" href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">原文</a><a class="secondary" href="${item.englishUrl}" target="_blank" rel="noopener noreferrer">英文对应</a></div></article>`).join('')}</div></section>`;
    }).join(''):empty();
  };
  document.querySelector('#catalog-query').addEventListener('input',update);
  document.querySelector('#catalog-group').addEventListener('change',update);
  update();
};

views.worksheets = params => {
  const categories=['全部','定位与计划','节律与证据','英语训练','AI 与交付','生活与恢复'];
  let category='全部';
  main.innerHTML=heading('TOOLKIT / 25 张工作纸','从一个卡点，选一张工作纸','这里只需要一次真实使用。查看适用场景、必填字段、可检查产出与复查方式，再到原文取得中英文模板。')+
    `<div class="worksheet-note"><span>第一次使用？跟着合成 Python 案例，走完状态、任务、证据与新会话交接。</span><a class="text-link" href="${routeLink('05-templates',data.guides.find(g=>g.id==='05-templates').toc.find(h=>h.title.includes('合成 Python'))?.id || '')}">阅读工具箱演示</a></div><div class="toolbar"><label class="input-search"><span class="search-icon" aria-hidden="true"></span><input id="tools-query" type="search" value="${escape(params.get('q')||'')}" placeholder="搜索问题或工作纸" aria-label="搜索工作纸"></label><span class="filter-count" id="tools-count" aria-live="polite"></span></div><div class="filter-chips" role="group" aria-label="工作纸分类">${categories.map((name,index)=>`<button class="chip${index===0?' active':''}" aria-pressed="${index===0}" data-tool-category="${name}">${name}</button>`).join('')}</div><div class="worksheet-grid" id="tools-results"></div>`;
  const update=()=>{
    const query=document.querySelector('#tools-query').value;
    const items=data.worksheets.filter(item=>(category==='全部'||item.category===category)&&matches(`${item.label} ${item.summary}`,query));
    document.querySelector('#tools-count').textContent=`${items.length} / 25 张`;
    document.querySelector('#tools-results').innerHTML=items.length?items.map(item=>`<article class="worksheet-card"><div class="tool-top"><span class="tool-no">${pad(item.number)}</span><span class="tag">${item.category}</span></div><h3>${escape(item.label)}</h3><p>${escape(item.summary)}</p><div class="card-links"><a class="button light" href="${routeLink('05-templates',item.section)}">查看填写说明</a><a class="secondary" href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">上游工作纸</a></div></article>`).join(''):empty();
  };
  document.querySelector('#tools-query').addEventListener('input',update);
  main.querySelectorAll('[data-tool-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.toolCategory;main.querySelectorAll('[data-tool-category]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});update();}));
  update();
};

views.words = params => {
  main.innerHTML=heading('VOCABULARY / 十组完整词表','把技术术语，放回真实任务','392 个分组词条，跨组去重为 340 个。保留原始拼写和领域语境；从当前任务选词，再练释义、搭配、回忆与独立调用。')+
    `<div class="study-links"><a href="${routeLink('02-english',data.guides.find(g=>g.id==='02-english').toc.find(h=>h.title.includes('词汇'))?.id || '')}">如何训练词汇</a><a href="./research/sources/word-lists.md" download>下载完整词表</a></div><div class="toolbar"><label class="input-search"><span class="search-icon" aria-hidden="true"></span><input id="words-query" type="search" value="${escape(params.get('q')||'')}" placeholder="搜索英文术语，例如 context 或 async" aria-label="搜索技术词条"></label><select id="words-group" class="filter-select" aria-label="筛选技术领域"><option value="">全部领域</option>${data.wordLists.map(list=>`<option value="${escape(list.source)}">${escape(list.title)} · ${list.terms.length}</option>`).join('')}</select><span class="filter-count" id="words-count" aria-live="polite"></span></div><div id="words-results"></div>`;
  const update=()=>{
    const query=document.querySelector('#words-query').value;
    const selected=document.querySelector('#words-group').value;
    const lists=data.wordLists.filter(list=>!selected||list.source===selected).map(list=>({...list,terms:list.terms.filter(term=>matches(term,query))})).filter(list=>list.terms.length);
    document.querySelector('#words-count').textContent=`${lists.reduce((total,list)=>total+list.terms.length,0)} / 392 个分组词条`;
    document.querySelector('#words-results').innerHTML=lists.length?lists.map(list=>`<section class="words-group"><div class="words-header"><h2>${escape(list.title)}</h2><small>${list.terms.length} 项</small><a href="${list.sourceUrl}" target="_blank" rel="noopener noreferrer">原始词表</a></div><div class="word-grid">${list.terms.map(term=>`<div class="word-item">${escape(term)}</div>`).join('')}</div></section>`).join(''):empty();
  };
  document.querySelector('#words-query').addEventListener('input',update);
  document.querySelector('#words-group').addEventListener('change',update);
  update();
};

views.resources = params => {
  const domains=[...new Set(data.resources.map(item=>new URL(item.url).hostname))].sort();
  main.innerHTML=heading('REFERENCES / 67 个引用链接','知道观点，从哪里来','保留上游中文正文的去重 Markdown 外链与引用位置。研究论文、官方文档、作者关联入口和历史资源均保留原有语境；外站未逐一重新核验。')+
    `<div class="study-links"><a href="${routeLink('sources')}">来源与证据边界</a><a href="./research/sources/resources.md" download>下载引用索引</a></div><div class="toolbar"><label class="input-search"><span class="search-icon" aria-hidden="true"></span><input id="resources-query" type="search" value="${escape(params.get('q')||'')}" placeholder="搜索资源标题、域名或引用章节" aria-label="搜索引用资源"></label><select id="resources-domain" class="filter-select" aria-label="筛选资源域名"><option value="">全部来源域名</option>${domains.map(domain=>`<option value="${escape(domain)}">${escape(domain)}</option>`).join('')}</select><span class="filter-count" id="resources-count" aria-live="polite"></span></div><div class="resource-list" id="resources-results"></div>`;
  const update=()=>{
    const query=document.querySelector('#resources-query').value;
    const selected=document.querySelector('#resources-domain').value;
    const items=data.resources.filter(item=>(!selected||new URL(item.url).hostname===selected)&&matches(`${item.labels.join(' ')} ${new URL(item.url).hostname} ${item.citedBy.map(source=>data.pages.find(page=>page.source===source)?.title||source).join(' ')}`,query));
    document.querySelector('#resources-count').textContent=`${items.length} / 67 个链接`;
    document.querySelector('#resources-results').innerHTML=items.length?items.map(item=>`<article class="resource-row"><div><h3>${escape(item.labels[0] || new URL(item.url).hostname)}</h3><div class="resource-meta"><span>${escape(new URL(item.url).hostname)}</span><span>引用于 ${item.citedBy.length} 页</span>${item.citedBy.map(source=>{const page=data.pages.find(page=>page.source===source);return `<a href="${page?.sourceUrl||item.url}" target="_blank" rel="noopener noreferrer">${escape(page?.title || source)}</a>`;}).join('')}</div></div><a class="text-link" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">访问资料</a></article>`).join(''):empty();
  };
  document.querySelector('#resources-query').addEventListener('input',update);
  document.querySelector('#resources-domain').addEventListener('change',update);
  update();
};

function initializeSearch(){
  const dialog=document.querySelector('#search-dialog');
  const input=document.querySelector('#search-input');
  const results=document.querySelector('#search-results');
  const status=document.querySelector('#search-status');
  const records=[
    {type:'理解导图',title:'一图理解 · 核心能力与价值观',text:'用真实任务学习，用证据判断成长。英语、AI与真实项目、生活与长期成长。定义任务、保存首版、定向练习、接受反馈、复测迁移、更新状态。真实、诚实、主体性、可持续、负责。',href:'#/map'},
    ...data.guides.flatMap(guide=>guide.chunks.map(chunk=>({type:'专题正文',title:chunk.title?`${guide.label} · ${chunk.title}`:guide.title,text:chunk.text,href:routeLink(guide.id,chunk.id)}))),
    ...data.pages.map(page=>({type:'原文目录',title:page.title,text:page.summary,href:`#/catalog?q=${encodeURIComponent(page.title)}`})),
    ...data.worksheets.map(item=>({type:'工作纸',title:item.label,text:item.summary,href:routeLink('05-templates',item.section)})),
    ...data.wordLists.flatMap(list=>list.terms.map(term=>({type:'技术词表',title:term,text:list.title,href:`#/words?q=${encodeURIComponent(term)}`}))),
    ...data.resources.map(item=>({type:'引用资源',title:item.labels[0]||new URL(item.url).hostname,text:item.labels.join(' '),href:`#/resources?q=${encodeURIComponent(item.labels[0]||new URL(item.url).hostname)}`})),
  ];
  let returnFocus;
  function open(){returnFocus=document.activeElement;if(!dialog.open)dialog.showModal();document.body.style.overflow='hidden';input.value='';update();input.focus();}
  function close(){dialog.close();}
  function highlight(text,query){
    if(!query)return escape(text);
    const needle=normalize(query).split(/\s+/)[0];
    const start=normalize(text).indexOf(needle);
    return start<0?escape(text):`${escape(text.slice(0,start))}<mark>${escape(text.slice(start,start+needle.length))}</mark>${escape(text.slice(start+needle.length))}`;
  }
  function update(){
    const query=input.value.trim();
    if(!query){status.textContent='搜索专题正文、97 页摘要、工作纸和技术词表';results.innerHTML=[['英语训练','02-english'],['跨会话学习与工作纸','05-templates'],['AI 项目与可靠性','03-ai-and-projects']].map(([label,id])=>`<a class="search-result" href="${routeLink(id)}"><small>阅读入口</small><strong>${label}</strong></a>`).join('');return;}
    const matched=records.filter(record=>matches(`${record.title} ${record.text}`,query)).map(record=>({...record,score:(normalize(record.title)===normalize(query)?100:normalize(record.title).includes(normalize(query))?40:0)+(record.type==='专题正文'?5:0)})).sort((a,b)=>b.score-a.score);
    status.textContent=matched.length?`找到 ${matched.length} 项${matched.length>40?'，显示前 40 项':''}`:'没有找到匹配内容，可以缩短关键词或换一个说法';
    results.innerHTML=matched.slice(0,40).map(record=>{const index=normalize(record.text).indexOf(normalize(query).split(/\s+/)[0]);const start=Math.max(0,index-25);const snippet=record.text.slice(start,start+145);return `<a class="search-result" href="${record.href}"><small>${record.type}</small><strong>${highlight(record.title,query)}</strong><p>${start?'…':''}${highlight(snippet,query)}${start+145<record.text.length?'…':''}</p></a>`;}).join('');
  }
  document.querySelector('#open-search').addEventListener('click',open);
  document.querySelector('#close-search').addEventListener('click',close);
  dialog.addEventListener('close',()=>{document.body.style.overflow='';returnFocus?.focus();});
  dialog.addEventListener('click',event=>{if(event.target===dialog)close();else if(event.target.closest('a'))close();});
  input.addEventListener('input',update);
  document.addEventListener('keydown',event=>{const editing=/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);if((event.key==='/'&&!editing)||((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k')){event.preventDefault();open();}});
}

const mobileMedia=matchMedia('(max-width:700px)');
function closeMenu(){document.querySelector('#sidebar').classList.remove('open');document.querySelector('#sidebar').inert=mobileMedia.matches;document.querySelector('.workspace').inert=false;document.querySelector('#menu-toggle').setAttribute('aria-expanded','false');document.querySelector('#menu-toggle').textContent='打开导航';document.querySelector('#menu-scrim').hidden=true;}
mobileMedia.addEventListener('change',closeMenu);
closeMenu();
document.querySelector('#menu-toggle').addEventListener('click',()=>{const open=document.querySelector('#sidebar').classList.toggle('open');document.querySelector('#sidebar').inert=!open;document.querySelector('.workspace').inert=open;document.querySelector('#menu-toggle').setAttribute('aria-expanded',String(open));document.querySelector('#menu-toggle').textContent=open?'关闭导航':'打开导航';document.querySelector('#menu-scrim').hidden=!open;});
document.querySelector('#menu-scrim').addEventListener('click',closeMenu);
document.querySelector('#sidebar').addEventListener('click',event=>{if(mobileMedia.matches&&event.target.closest('a[href^="#/"]')){closeMenu();main.focus({preventScroll:true});}});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
function renderRoute(){
  cleanup();cleanup=()=>{};
  const parsed=new URL((location.hash.slice(1)||'/overview'),'https://local.invalid');
  const parts=parsed.pathname.split('/').filter(Boolean);
  const view=parts[0] || 'overview';
  const guide=data.guides.find(item=>item.id===parts[1]);
  document.querySelectorAll('[data-nav]').forEach(link=>link.classList.toggle('active',link.dataset.nav===(view==='guide'?'topics':view)));
  document.querySelectorAll('[data-guide-nav]').forEach(link=>link.classList.toggle('active',view==='guide' && link.dataset.guideNav===parts[1]));
  const labels={overview:'能力总览',map:'一图理解',topics:'详细专题',catalog:'完整内容目录',worksheets:'工作纸',words:'技术词表',resources:'引用资源'};
  document.querySelector('#breadcrumb').textContent=`UP / ${view==='guide' ? (guide?.title || '专题') : (labels[view] || '内容入口')}`;
  document.title=`${view==='guide'?(guide?.title||'专题'):(labels[view]||'知识地图')} · Up 知识地图`;
  closeMenu();
  if(view==='guide')renderGuide(parts[1],parsed.searchParams);
  else if(views[view])views[view](parsed.searchParams);
  else renderMissing();
  if(!parsed.searchParams.has('section'))window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('hashchange',()=>data && renderRoute());
async function init(){
  try{
    const response=await fetch('./data/content.json');
    if(!response.ok)throw new Error('读取失败');
    data=await response.json();
    document.querySelector('#guide-nav').innerHTML=data.guides.filter(guide=>guide.id!=='sources').map(guide=>`<a href="${routeLink(guide.id)}" data-guide-nav="${guide.id}"><span>${pad(guide.number)}</span>${escape(guide.label)}</a>`).join('');
    renderRoute();
    if(typeof initializeSearch==='function')initializeSearch();
  }catch(error){main.innerHTML='<div class="error-state"><h1>内容暂时无法读取</h1><p>请确认预览服务正在运行，再重新打开页面。</p><button class="button" onclick="location.reload()">重新读取</button></div>';console.error(error);}
}
init();
