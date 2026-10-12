// 原创研究排版。浏览器与构建共用，关键理解在无脚本时仍可阅读。
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const section = (title,body,id='') => `<section class="section"${id?` id="${id}"`:''}><div class="section-title"><h2>${esc(title)}</h2></div>${body}</section>`;
const paragraph = (label,text) => `<p><strong>${esc(label)}：</strong>${esc(text)}</p>`;
const skillLinks = ids => `<div class="evidence-links">${ids.map(id=>`<a href="#capabilities?skill=${encodeURIComponent(id)}"><code>${esc(id)}</code></a>`).join('')}</div>`;

export function renderUnderstanding(publication) {
  return `<div class="callout"><strong>${esc(publication.goal)}</strong><p>账号定位 → 信息获取与选题 → 策划和脚本 → 图文／音视频制作 → 检查与多平台发布 → 数据、评论与互动分析 → 调整后续策略</p></div>`+
    section('完整理解 · 先看目标、原理与价值',`<div class="publication-introduction" data-publication-introduction>${publication.overviewItems.map(item=>paragraph(item.title,item.text)).join('')}</div><details class="publication-summary"><summary>展开 ${publication.summaryItems.length} 项完整摘要：能力、模块、原理、来源、场景与方向</summary><dl>${publication.summaryItems.map(item=>`<div data-summary-item><dt>${esc(item.title)}</dt><dd>${esc(item.text)}</dd></div>`).join('')}</dl></details><div class="publication-actions"><a class="button primary" href="#value">使用场景、复用与扩展 →</a><a class="button" href="./capability-map.png">打开完整引导图</a><a class="button" href="./capability-map.png" download="easel-capability-map.png">保存原图 ↓</a></div>`)+
    section('七个环节如何连成闭环？',`<div class="publication-flow">${publication.flow.map(item=>`<article class="module" data-flow-step><span class="finding-no">STEP ${esc(item.number)}</span><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p>${paragraph('产出',item.output)}${skillLinks(item.skills)}</article>`).join('')}</div><p class="coverage">真实数据与用户判断反哺下一轮定位、选题和策略；长期记忆写回按规则获得用户同意。每个任务可以只选择其中一段。</p>`);
}

export function renderGuide(publication) {
  return section('一张图看全流程与全部技能',`<figure class="capability-map"><a href="./capability-map.png" aria-label="打开 Easel 能力全景图原图"><img src="./capability-map.png" width="${publication.meta.guide.width}" height="${publication.meta.guide.height}" alt="Easel 能力全景图：账号画像、七步运营闭环、国内信息来源、114 个技能、执行原理、使用场景、扩展价值与研究用途" loading="lazy" decoding="async"></a><figcaption>沿用我们 2026-10-09 生成的研究说明图，保留完整画面和原始 PNG 字节。图中名称采用简写；精确 Skill ID、原理和源码证据见完整目录。扩展与研究价值属于建议。</figcaption></figure>`);
}

export function renderValueBody(publication) {
  return section('使用场景 · 输入、动作和产出',`<div class="grid2">${publication.scenarios.map(item=>`<article class="module" data-scenario><h3>${esc(item.title)}</h3>${paragraph('输入',item.input)}${paragraph('过程',item.process)}${paragraph('产出',item.output)}<p class="coverage">${esc(item.conditions)}</p></article>`).join('')}</div>`,'use-cases')+
    section('对你的意义 · 从开源研究到持续内容',`<div class="grid2">${publication.values.map(item=>`<article class="module" data-personal-value><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p>${paragraph('例子',item.example)}</article>`).join('')}</div>`,'personal-value')+
    section('四条复用路线 · 按需要选入口',`<div class="grid2">${publication.reuseRoutes.map(item=>`<article class="module" data-reuse-route><h3>${esc(item.title)}</h3>${paragraph('复用范围',item.scope)}${paragraph('准备条件',item.requirements)}${paragraph('第一步',item.start)}</article>`).join('')}</div>`,'reuse-routes')+
    section('八项扩展方向 · 在已有基础上继续开发',`<p class="demo-note">以下均为本项目的研究建议。每项分别说明现有基础、需要补充的工程和预期用途。</p><div class="grid2">${publication.extensions.map(item=>`<article class="module" data-extension><span class="tag agent">${esc(item.status)}</span><h3>${esc(item.title)}</h3>${paragraph('现有基础',item.basis)}${paragraph('需要补充',item.work)}${paragraph('价值',item.benefit)}</article>`).join('')}</div>`,'extension-directions')+
    section('边界与验证 · 阅读能力时一起核对',`<ol class="publication-boundaries">${publication.boundaries.map(item=>`<li>${esc(item)}</li>`).join('')}</ol><div class="publication-actions"><a class="button" href="#evidence">回到源码与实际核验 →</a><a class="button" href="./publication.json">下载完整理解资料</a><a class="button" href="./research.md">研究说明与复现记录</a></div>`,'research-boundaries');
}

export function renderValuePage(publication) {
  return `<div class="page-head"><div class="eyebrow">Easel / Source Atlas · 05</div><h1>怎样使用、复用与继续扩展？</h1><p class="page-lead">沿用已核对的能力，为自己的研究、知识传播和账号运营选择入口。场景说明具体产物；扩展方向标注需要补充的工作。</p></div>`+renderValueBody(publication);
}

export function renderStaticLanding(publication,facts) {
  const modules = facts.components.map(item=>`<article class="module" data-system-module><h3>${esc(item.title)}</h3><div class="tech">${esc(item.tech)}</div><p>${esc(item.text)}</p><div class="evidence-links">${item.evidence.map(ref=>`<a href="${esc(ref.url)}">${esc(ref.label)}:${ref.line} ↗</a>`).join('')}</div></article>`).join('');
  return `<div class="page-head"><div class="eyebrow">Easel / Source Atlas · 01</div><h1>${esc(publication.meta.title)}</h1><p class="page-lead">${esc(publication.summary)}</p></div>`+renderUnderstanding(publication)+renderGuide(publication)+section('八个系统模块 · 能力与执行原理',`<div class="grid2">${modules}</div>`)+renderValueBody(publication)+`<noscript><p class="callout">本页完整理解、引导图、模块、场景与扩展可直接阅读。启用 JavaScript 后可使用全部 114 项技能的检索、筛选、详情和离线过滤实验。</p></noscript>`;
}
