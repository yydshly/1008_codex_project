import { meta, categories, topics, learningPaths } from './content.js';
import { topicDetails } from './enrichment.js';
import { matches, topicReferences, topicSearchText, resourceType, resourceTypes } from './catalog-utils.js';
import { renderTopicReader } from './reader.js';
import { renderCoverage } from './coverage-view.js';
import { renderResearch } from './research.js';

const coverageReport = await fetch(new URL('./coverage.json', import.meta.url)).then(response => {
  if (!response.ok) throw new Error('覆盖报告加载失败');
  return response.json();
}).catch(() => null);

// 独立实现的中文知识汇总界面。内容来源与固定研究版本见 content.js 和 ../src/。
const iconPaths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  route: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 6h8"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  external: '<path d="M14 3h7v7M21 3l-10 10M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
  github: '<path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-2.7c3.3-.4 6.7-1.6 6.7-7a5.5 5.5 0 0 0-1.5-3.8 5 5 0 0 0-.1-3.7S17.8.4 15 2.3a13 13 0 0 0-6 0C6.2.4 4.9 1.8 4.9 1.8a5 5 0 0 0-.1 3.7 5.5 5.5 0 0 0-1.5 3.8c0 5.4 3.4 6.6 6.7 7A3.5 3.5 0 0 0 9 19v3"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  book: '<path d="M12 5v15M12 5C8 2 4 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-2-1-6-2-10 1z"/>',
  code: '<path d="m7 6-6 6 6 6m10-12 6 6-6 6M14 3l-4 18"/>',
  layers: '<path d="m12 3 10 6-10 6L2 9l10-6zM2 13l10 6 10-6M2 17l10 6 10-6"/>',
  algorithm: '<circle cx="12" cy="4" r="2"/><circle cx="5" cy="20" r="2"/><circle cx="19" cy="20" r="2"/><path d="M12 6v6M5 18v-6h14v6"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0"/>',
  server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/>',
  terminal: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m6 9 3 3-3 3M13 15h5"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-3 2V11.5a8.5 8.5 0 0 1 17-1M8 10h8M8 14h5"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  back: '<path d="m14 5-7 7 7 7"/>',
};
const aliases = { engineering: 'book', algorithms: 'algorithm', languages: 'code', architecture: 'layers', system: 'server', data: 'database', devops: 'terminal', interview: 'chat', ai: 'spark', 'git-branch': 'route', workflow: 'route', cpu: 'algorithm', braces: 'code', 'message-circle': 'chat', 'graduation-cap': 'book', network: 'server', 'file-code': 'code' };
const icon = name => `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${iconPaths[name] ?? iconPaths[aliases[name]] ?? iconPaths.book}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const topicMap = new Map(topics.map(topic => [topic.id, topic]));
const categoryMap = new Map(categories.map(category => [category.id, category]));
const refs = new Map();
let referenceCount = 0;
topics.forEach(topic => topicReferences(topic).forEach(reference => {
  referenceCount++;
  if (!refs.has(reference.url)) refs.set(reference.url, { ...reference, topics: [], categories: new Set() });
  const resource = refs.get(reference.url);
  if (!resource.topics.includes(topic.id)) resource.topics.push(topic.id);
  resource.categories.add(topic.category);
}));
const resources = [...refs.values()];
const state = { query: '', filter: 'all', tag: 'all', kind: 'all', resourceType: 'all', resourceLimit: 40, view: 'research', category: null, path: learningPaths[0]?.id, lastPageHash: '#research', activeTopic: null, topicTrigger: null };
const page = document.querySelector('#page');
const dialog = document.querySelector('#topic-dialog');
document.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
document.querySelector('#category-count').textContent = categories.length;
document.querySelector('#category-nav').innerHTML = categories.map(category => `<a href="#category=${encodeURIComponent(category.id)}" data-category="${esc(category.id)}">${icon(category.id)}<span>${esc(category.name)}</span><span class="count">${topics.filter(topic => topic.category === category.id).length}</span></a>`).join('');

function matchTopic(topic, query = state.query) {
  return matches(topicSearchText(topic, topicDetails[topic.id]), query);
}

function filteredTopics(entries) {
  return entries.filter(topic => matchTopic(topic) && (state.tag === 'all' || topic.tags.includes(state.tag)) && (state.kind === 'all' || topicDetails[topic.id].kind === state.kind));
}

function topicControls(entries) {
  const tags = [...new Set(entries.flatMap(topic => topic.tags))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  return `<div class="filter-bar"><label><span>知识标签</span><select id="tag-filter"><option value="all">全部标签</option>${tags.map(tag => `<option value="${esc(tag)}" ${state.tag === tag ? 'selected' : ''}>${esc(tag)}</option>`).join('')}</select></label><label><span>原文内容</span><select id="kind-filter"><option value="all" ${state.kind === 'all' ? 'selected' : ''}>全部主题</option><option value="tutorial" ${state.kind === 'tutorial' ? 'selected' : ''}>上游详细教程</option><option value="resource-guide" ${state.kind === 'resource-guide' ? 'selected' : ''}>上游资源或问题导航</option></select></label>${state.query || state.tag !== 'all' || state.kind !== 'all' ? '<button class="reset-filters" data-action="reset-filters">重置筛选</button>' : ''}</div>`;
}

function searchBox(placeholder = '搜索知识点、技术或关键词…') {
  return `<label class="search">${icon('search')}<input id="search" type="search" aria-label="${esc(placeholder)}" placeholder="${esc(placeholder)}" value="${esc(state.query)}" autocomplete="off">${state.query ? '<button class="clear-search" type="button" data-action="clear-search" aria-label="清空搜索">×</button>' : '<kbd aria-hidden="true">/</kbd>'}</label>`;
}

function topicCard(topic) {
  const category = categoryMap.get(topic.category);
  return `<button class="topic-card" type="button" data-topic="${esc(topic.id)}"><span class="topic-category">${esc(category.name)} <span class="source-kind">· ${topicDetails[topic.id].kind === 'tutorial' ? '上游教程' : '上游导航'}</span></span><h3>${esc(topic.title)}</h3><p>${esc(topic.summary)}</p><div class="topic-tags">${topic.tags.slice(0, 3).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div><span class="topic-bottom"><span>展开讲解 · ${topicReferences(topic).length} 条资料</span>${icon('book')}</span></button>`;
}

function emptyResults() {
  return `<div class="empty-state"><h3>还没有找到相关内容</h3><p>试试「JavaScript」「架构」「算法」等关键词，或切换知识分类。</p><button class="text-button" type="button" data-action="clear-search">清空关键词</button></div>`;
}

function filterChips() {
  return `<div class="filters" role="group" aria-label="筛选知识分类"><button class="filter-chip ${state.filter === 'all' ? 'active' : ''}" data-filter="all" aria-pressed="${state.filter === 'all'}">全部</button>${categories.map(category => `<button class="filter-chip ${state.filter === category.id ? 'active' : ''}" data-filter="${esc(category.id)}" aria-pressed="${state.filter === category.id}">${esc(category.name)}</button>`).join('')}</div>`;
}

function overview() {
  const showResults = state.query.trim() || state.filter !== 'all' || state.tag !== 'all' || state.kind !== 'all';
  const scope = topics.filter(topic => state.filter === 'all' || topic.category === state.filter);
  const filtered = filteredTopics(scope);
  const featured = ['call-apply-bind', 'cadena-de-prototipos', 'crear-objetos'].map(fragment => topics.find(topic => topic.sourcePath.includes(fragment))).filter(Boolean);
  return `<section class="hero"><div><p class="eyebrow">A MAP FOR YOUR NEXT INTERVIEW</p><h1>把知识串起来，<br>把面试<em>准备好。</em></h1><p class="hero-intro">从算法基础到系统设计，把开源指南整理成清晰的中文知识地图。<br>找到要学的主题，理解关键概念，再回到原始资料深入。</p></div><a class="hero-card" href="#paths"><div class="hero-card-top">${icon('route')}LEARN WITH A DIRECTION</div><h2>让复习有一条清晰的路线</h2><div class="mini-route"><span>理解概念</span><i></i><span>动手练习</span><i></i><span>表达思路</span></div><p>通用基础 · 前端方向 · 后端方向<br>按知识的联系，安排下一步。</p></a></section><div class="stats"><div class="stat"><strong>${topics.length}</strong><span>知识主题</span></div><div class="stat"><strong>${categories.length}</strong><span>学习方向</span></div><div class="stat"><strong>${resources.length}</strong><span>原始资源</span></div><div class="stat"><strong class="small-stat">DevCaress</strong><span>开源内容来源</span></div></div><div class="content-scope">${icon('check')}<span>核对全部 ${topics.length} 篇原文，保留 ${referenceCount} 条引用，补充讲解、示例与复习答法。</span><a href="#coverage">查看覆盖清单</a></div><div class="toolbar"><div class="section-title"><h2>${showResults ? '找到你的知识点' : '从一个方向开始'}</h2><p>${showResults ? `共 ${filtered.length} 个相关主题 · 搜索包含展开讲解、表格与答法` : '一张知识地图，连接面试中常见的技术主题'}</p></div>${searchBox()}</div>${topicControls(scope)}${showResults ? filterChips() + (filtered.length ? `<div class="feature-grid" aria-live="polite">${filtered.map(topicCard).join('')}</div>` : emptyResults()) : `<div class="category-grid">${categories.map((category, index) => {
    const entries = topics.filter(topic => topic.category === category.id);
    const tags = [...new Set(entries.flatMap(topic => topic.tags))].slice(0, 3);
    return `<button class="category-card" type="button" data-go="category=${esc(category.id)}"><div class="card-top"><span class="category-icon">${icon(category.id)}</span><span class="card-index">${String(index + 1).padStart(2, '0')}</span></div><h3>${esc(category.name)}</h3><p class="category-english">${esc(category.english)}</p><p class="category-description">${esc(category.description)}</p><div class="topic-tags">${tags.map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div><div class="card-footer"><span>${entries.length} 个主题 · ${entries.reduce((sum, topic) => sum + topicReferences(topic).length, 0)} 条参考</span>${icon('book')}</div></button>`;
  }).join('')}</div><div class="section-heading"><h2>从一道题开始理解</h2><a href="#category=interview">查看面试主题 ${icon('external')}</a></div><div class="feature-grid">${(featured.length ? featured : topics.slice(0, 3)).map(topicCard).join('')}</div>`}`;
}

function researchPage() {
  return renderResearch({ categories, topics, meta, esc, icon });
}

function categoryPage() {
  const category = categoryMap.get(state.category);
  if (!category) return '<div class="empty-state"><h3>这个分类不存在</h3><a href="#overview">返回知识总览</a></div>';
  const scope = topics.filter(topic => topic.category === category.id);
  const entries = filteredTopics(scope);
  return `<a class="back-button" href="#overview">${icon('back')}返回知识总览</a><div class="page-heading"><p class="eyebrow">${esc(category.english)}</p><h1>${esc(category.name)}</h1><p>${esc(category.description)}每个主题均补充展开讲解、常见误区与参考答法；原文教程和资源导航分别标注。</p></div><div class="toolbar"><span class="result-count" aria-live="polite">${entries.length} 个主题</span>${searchBox('在这个方向中搜索…')}</div>${topicControls(scope)}${entries.length ? `<div class="feature-grid">${entries.map(topicCard).join('')}</div>` : emptyResults()}`;
}

function pathsPage() {
  const learningPath = learningPaths.find(item => item.id === state.path) ?? learningPaths[0];
  return `<div class="page-heading"><p class="eyebrow">FOLLOW THE CONNECTIONS</p><h1>复习，从一条路线开始。</h1><p>按知识之间的联系安排学习顺序。先能解释概念，再动手练习，最后尝试讲清自己的选择。这些路线是本项目根据上游主题整理的建议。</p></div><div class="path-tabs" role="group" aria-label="选择学习路线">${learningPaths.map((item, index) => `<button class="path-tab ${item.id === learningPath.id ? 'active' : ''}" data-path="${esc(item.id)}" aria-pressed="${item.id === learningPath.id}">${icon(['book', 'code', 'server'][index] || 'route')}${esc(item.title)}</button>`).join('')}</div><div class="path-intro"><div><h2>${esc(learningPath.title)}</h2><p>${esc(learningPath.description)}</p></div><span class="path-badge">${learningPath.steps.length} 个阶段 · 按自己的节奏</span></div><div class="path-steps">${learningPath.steps.map((step, index) => `<section class="path-step"><div class="step-number">${String(index + 1).padStart(2, '0')}</div><div class="step-content"><h3>${esc(step.title)}</h3><p>${esc(step.description)}</p><div class="step-links">${step.topicIds.map(id => `<button type="button" data-topic="${esc(id)}">${esc(topicMap.get(id).title)}</button>`).join('')}</div></div></section>`).join('')}</div><p class="resource-note">练习主题中的 LeetCode、CodeWars 等链接通向外部平台。本站提供复习概要和资料导航。</p>`;
}

function resourcePage() {
  const filtered = resources.filter(resource => {
    const categoryMatch = state.filter === 'all' || resource.categories.has(state.filter);
    const typeMatch = state.resourceType === 'all' || resourceType(resource.url) === state.resourceType;
    const haystack = [resource.label, resource.url, ...resource.topics.map(id => topicMap.get(id).title)].join(' ');
    return categoryMatch && typeMatch && matches(haystack, state.query);
  });
  return `<div class="page-heading"><p class="eyebrow">GO TO THE ORIGINAL SOURCES</p><h1>好资料，留一份入口。</h1><p>保留章节元数据与正文中的全部参考链接，合并重复地址，并关联回知识主题。资料包含西班牙语和英语，可按学习用途筛选。</p></div><div class="toolbar"><span class="result-count" aria-live="polite">${filtered.length} 个资源 · 上游共 ${referenceCount} 条引用</span>${searchBox('搜索资源名称、网址或主题…')}</div>${filterChips()}<div class="filter-bar"><label><span>资源类型</span><select id="resource-type">${resourceTypes.map(type => `<option value="${type.id}" ${state.resourceType === type.id ? 'selected' : ''}>${type.name}</option>`).join('')}</select></label>${state.query || state.filter !== 'all' || state.resourceType !== 'all' ? '<button class="reset-filters" data-action="reset-filters">重置筛选</button>' : ''}</div>${filtered.length ? `<div class="resource-list">${filtered.slice(0, state.resourceLimit).map(resource => {
    const host = new URL(resource.url).hostname;
    const type = resourceTypes.find(type => type.id === resourceType(resource.url));
    return `<article class="resource-row"><div><a href="${esc(resource.url)}" target="_blank" rel="noopener noreferrer">${esc(resource.label)}${icon('external')}</a><p>${esc(host)} <span class="resource-kind">${esc(type.name)}</span>${resource.origin === 'body' ? '<span class="body-reference-label">原文正文资料</span>' : ''}</p><div class="resource-topics">${resource.topics.map(id => `<button data-topic="${esc(id)}">${esc(topicMap.get(id).title)}</button>`).join('<span aria-hidden="true"> · </span>')}</div></div><span class="resource-category">${[...resource.categories].map(id => esc(categoryMap.get(id).name)).join(' / ')}</span></article>`;
  }).join('')}</div>${filtered.length > state.resourceLimit ? `<button class="load-more" data-action="more-resources">继续查看 · 还有 ${filtered.length - state.resourceLimit} 个资源</button>` : ''}` : emptyResults()}<p class="resource-note">资源类型按网址归类；原始链接依据固定上游提交整理，未对所有外部网址逐一验证可达性。遇到失效链接，可从主题原文查找上下文。</p>`;
}

function aboutPage() {
  const repo = meta.repo ?? 'https://github.com/DevCaress/guia-entrevistas-de-programacion';
  return `<div class="page-heading"><p class="eyebrow">RESEARCH PROJECT / 002</p><h1>把开源指南，整理成可用的知识。</h1><p>这是 GitHub 项目研究集的第 002 个子项目。围绕 DevCaress 的编程面试指南，补充中文知识概要、复习问题与学习顺序，方便按主题阅读。</p></div><div class="about-grid"><section class="about-panel"><h2>内容如何整理</h2><p>上游 ${topics.length} 个 MDX 页面全部对应到本站主题，按 ${categories.length} 个方向组织。每个主题提供中文概要、展开讲解、独立示例、常见误区、复习参考答法和原文入口，保留全部 ${referenceCount} 条上游引用；资源索引合并为 ${resources.length} 个唯一链接。</p><p>中文内容是本项目的独立提炼与学习补充，并非逐字翻译。已核对上游 11 篇详细教程与 39 篇资源或问题导航，补上正文里的资源链接和技术对照表。详细讲解、例子、常见误区与参考答法均可在本站阅读；来源逐项列在内容覆盖清单。</p><div class="tagline">这张地图适合整理复习范围。理解概念之后，仍需要通过编码、设计讨论和表达练习检验掌握程度。</div></section><section class="about-panel"><h2>研究基线</h2><dl><dt>原仓库</dt><dd><a href="${esc(repo)}" target="_blank" rel="noopener noreferrer">DevCaress / guia-entrevistas-de-programacion</a></dd><dt>固定研究提交</dt><dd><a href="${esc(repo)}/tree/${esc(meta.commit)}" target="_blank" rel="noopener noreferrer"><code>${esc(meta.commit)}</code></a></dd><dt>整理日期</dt><dd>${esc(meta.date)}</dd><dt>上游许可证</dt><dd><a href="${esc(repo)}/blob/${esc(meta.commit)}/LICENSE" target="_blank" rel="noopener noreferrer">${esc(meta.license)} · Copyright © 2026 Daniel Enriquez</a></dd></dl></section><section class="about-panel about-full"><h2>原库能力与本项目的整理</h2><div class="capability-row"><div><h3>原库提供</h3><ul><li>Astro 静态文档网站和 MDX 章节。</li><li>分类导航、移动端菜单、深浅主题切换。</li><li>技术学习资源和部分 JavaScript 教程。</li><li>练习平台与算法可视化工具的外部链接。</li></ul></div><div><h3>本项目补充</h3><ul><li>覆盖全部上游页面的中文概要与展开讲解。</li><li>详细正文检索、标签与原文类型筛选、资源类型筛选。</li><li>三条学习路线、38 个独立示例和 100 条参考答法。</li><li>相关主题、固定原文入口、正文引用关联和覆盖核对。</li></ul></div></div><p>独立示例可在本站阅读与复制；练习平台和算法动画通过外部链接访问。本站提供学习笔记，没有内置判题、代码运行或 AI 模拟面试。外部文章、视频和第三方仓库分别遵守各自的版权与许可。</p></section></div>`;
}

function render() {
  const currentFocus = document.activeElement;
  const restoreSearch = currentFocus?.id === 'search';
  const selection = restoreSearch ? [currentFocus.selectionStart, currentFocus.selectionEnd] : null;
  page.innerHTML = ({ research: researchPage, overview, category: categoryPage, paths: pathsPage, resources: resourcePage, about: aboutPage, coverage: () => renderCoverage({ report: coverageReport, categories, topics, meta, esc, icon }) }[state.view] ?? researchPage)();
  document.querySelectorAll('[data-view]').forEach(link => {
    const active = link.dataset.view === (state.view === 'category' ? 'overview' : state.view);
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-category]').forEach(link => {
    const active = state.view === 'category' && state.category === link.dataset.category;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  if (restoreSearch) {
    const input = document.querySelector('#search');
    input?.focus();
    if (input && selection[0] !== null) input.setSelectionRange(...selection);
  }
}

function openTopic(id) {
  const topic = topicMap.get(id);
  if (!topic) {
    if (dialog.open) dialog.close();
    state.activeTopic = null;
    document.body.classList.remove('dialog-open');
    page.innerHTML = '<div class="empty-state"><h3>这个知识主题不存在</h3><a href="#overview">返回知识总览</a></div>';
    return;
  }
  const category = categoryMap.get(topic.category);
  if (!dialog.open) state.topicTrigger = document.activeElement;
  state.activeTopic = id;
  document.querySelector('#topic-detail').innerHTML = renderTopicReader({ topic, detail: topicDetails[id], category, references: topicReferences(topic), topics, meta, esc, icon });
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add('dialog-open');
  dialog.querySelector('.close-dialog').focus();
}

function closeTopic() {
  dialog.close();
  document.body.classList.remove('dialog-open');
  if (location.hash.startsWith('#topic=')) {
    history.replaceState(null, '', state.lastPageHash);
    navigate();
  }
}

function setMenu(open) {
  const sidebar = document.querySelector('#sidebar');
  sidebar.classList.toggle('open', open);
  sidebar.inert = window.matchMedia('(max-width:800px)').matches && !open;
  document.querySelector('#sidebar-backdrop').hidden = !open;
  const button = document.querySelector('#mobile-menu');
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
}

function navigate() {
  const hash = location.hash.slice(1) || 'research';
  if (hash.startsWith('topic=')) {
    if (!page.innerHTML) render();
    openTopic(safeDecode(hash.slice(6)));
    return;
  }
  const [view, value] = hash.split('=');
  const returningToPage = state.activeTopic && state.lastPageHash === '#' + hash;
  state.activeTopic = null;
  if (returningToPage) {
    if (dialog.open) dialog.close();
    document.body.classList.remove('dialog-open');
    state.topicTrigger?.focus({ preventScroll: true });
    setMenu(false);
    return;
  }
  if (state.lastPageHash !== '#' + hash) {
    state.query = '';
    state.filter = 'all';
    state.tag = 'all'; state.kind = 'all'; state.resourceType = 'all';
    state.resourceLimit = 40;
  }
  state.view = ['research', 'overview', 'category', 'paths', 'resources', 'about', 'coverage'].includes(view) ? view : 'research';
  state.category = view === 'category' ? safeDecode(value ?? '') : null;
  if (view === 'paths' && value) state.path = safeDecode(value);
  state.lastPageHash = '#' + hash;
  if (dialog.open) dialog.close();
  document.body.classList.remove('dialog-open');
  setMenu(false);
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelector('#main').focus({ preventScroll: true });
}

function safeDecode(value) {
  try { return decodeURIComponent(value); } catch { return ''; }
}

async function copyText(value, button) {
  try {
    await navigator.clipboard.writeText(value);
    button.textContent = '已复制';
  } catch {
    const feedback = document.querySelector('.copy-feedback');
    if (feedback) feedback.textContent = '未能访问剪贴板，可选中代码或地址栏链接复制。';
  }
}

document.addEventListener('click', event => {
  if (event.target.closest('.skip-link')) {
    event.preventDefault();
    document.querySelector('#main').focus();
    document.querySelector('#main').scrollIntoView();
    return;
  }
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.topic) { location.hash = 'topic=' + encodeURIComponent(button.dataset.topic); return; }
  if (button.dataset.go) { location.hash = button.dataset.go; return; }
  if (button.dataset.path) { location.hash = 'paths=' + encodeURIComponent(button.dataset.path); return; }
  if (button.dataset.filter) { state.filter = button.dataset.filter; state.tag = 'all'; state.resourceLimit = 40; render(); return; }
  if (button.dataset.researchSection) {
    const section = document.getElementById(button.dataset.researchSection);
    if (section) { section.setAttribute('tabindex', '-1'); section.focus({ preventScroll: true }); section.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
    return;
  }
  if (button.dataset.section) { document.getElementById(button.dataset.section)?.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
  if (button.dataset.copyExample !== undefined) {
    const example = topicDetails[state.activeTopic]?.examples[Number(button.dataset.copyExample)];
    if (example) copyText(example.code, button);
    return;
  }
  if (button.dataset.action === 'copy-topic-link') { copyText(location.href, button); return; }
  if (button.dataset.action === 'reset-filters') { state.query = ''; state.filter = 'all'; state.tag = 'all'; state.kind = 'all'; state.resourceType = 'all'; state.resourceLimit = 40; render(); return; }
  if (button.dataset.action === 'close-dialog') closeTopic();
  if (button.dataset.action === 'clear-search') { state.query = ''; render(); document.querySelector('#search')?.focus(); }
  if (button.dataset.action === 'more-resources') { state.resourceLimit += 40; const y = window.scrollY; render(); window.scrollTo(0, y); }
});
document.addEventListener('change', event => {
  if (event.target.id === 'tag-filter') state.tag = event.target.value;
  else if (event.target.id === 'kind-filter') state.kind = event.target.value;
  else if (event.target.id === 'resource-type') state.resourceType = event.target.value;
  else return;
  state.resourceLimit = 40;
  const controlId = event.target.id;
  render();
  document.getElementById(controlId)?.focus();
});
document.addEventListener('input', event => {
  if (event.target.id === 'search') {
    state.query = event.target.value; state.resourceLimit = 40;
    if (!event.isComposing) render();
  }
});
document.addEventListener('compositionend', event => {
  if (event.target.id === 'search') { state.query = event.target.value; state.resourceLimit = 40; render(); }
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && !dialog.open) {
    const input = document.querySelector('#search');
    if (input) { event.preventDefault(); input.focus(); }
  }
  if (event.key === 'Escape' && !dialog.open) setMenu(false);
});
dialog.addEventListener('cancel', event => { event.preventDefault(); closeTopic(); });
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rectangle = dialog.getBoundingClientRect();
    if (event.clientX < rectangle.left || event.clientX > rectangle.right || event.clientY < rectangle.top || event.clientY > rectangle.bottom) closeTopic();
  }
});
document.querySelector('#mobile-menu').addEventListener('click', () => setMenu(!document.querySelector('#sidebar').classList.contains('open')));
document.querySelector('#sidebar-backdrop').addEventListener('click', () => setMenu(false));
window.addEventListener('hashchange', navigate);
window.addEventListener('resize', () => {
  const sidebar = document.querySelector('#sidebar');
  const narrow = window.matchMedia('(max-width:800px)').matches;
  if (!narrow) setMenu(false);
  else sidebar.inert = !sidebar.classList.contains('open');
});
navigate();
