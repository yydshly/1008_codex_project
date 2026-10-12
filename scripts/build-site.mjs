// Aggregate independently built projects; the root has no frontend dependencies.
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { ROOT, readCatalog, validateCatalog, projectDirectory } from './catalog.mjs';
import { renderOctogentCard } from '../projects/007-octogent/web/scripts/render-site-card.mjs';
import { renderSiteCard as renderUnslothCard } from '../projects/010-unsloth/web/scripts/render-publication.mjs';
import { renderSiteCard as renderGhostTrackCard } from '../projects/008-ghosttrack/web/scripts/render-publication.mjs';

// Publication is an explicit allowlist. Local research projects must not become
// public merely because they are registered in projects.json.
const publication = [{ id: '001', slug: 'sandboard' }, { id: '002', slug: 'interview-guide' }, { id: '003', slug: 'pascal-editor' }, { id: '004', slug: 'up-learning-guide' }, { id: '005', slug: 'threejs-game-skills' }, { id: '006', slug: 'easel' }, { id: '007', slug: 'octogent' }, { id: '008', slug: 'ghosttrack' }, { id: '010', slug: 'unsloth' }, { id: '013', slug: 'aihot' }];
const catalog = readCatalog();
if (!Array.isArray(catalog.projects)) throw new Error('发布清单缺少 projects 数组。');
const selected = publication.map(({ id, slug }) => {
  const matches = catalog.projects.filter(project => project.id === id && project.slug === slug);
  if (matches.length !== 1) throw new Error(`发布清单需要唯一的 ${id} ${slug}。`);
  return matches[0];
});
const projects = validateCatalog({ schemaVersion: catalog.schemaVersion, projects: selected }, ROOT, { requireFiles: false });
for (const published of projects) {
  const directory = path.join(ROOT, projectDirectory(published));
  await access(path.join(directory, 'README.md'));
  await access(path.join(directory, 'web'));
}
const project = projects.find(project => project.id === '001' && project.slug === 'sandboard');
const interview = projects.find(project => project.id === '002' && project.slug === 'interview-guide');
const pascal = projects.find(project => project.id === '003' && project.slug === 'pascal-editor');
const aihot = projects.find(project => project.id === '013' && project.slug === 'aihot');
const up = projects.find(project => project.id === '004' && project.slug === 'up-learning-guide');
const threejs = projects.find(project => project.id === '005' && project.slug === 'threejs-game-skills');
const easel = projects.find(project => project.id === '006' && project.slug === 'easel');
const octogent = projects.find(project => project.id === '007' && project.slug === 'octogent');
const octogentWeb = path.join(ROOT,projectDirectory(octogent),'web');
const unsloth = projects.find(project => project.id === '010');
const unslothWeb = path.join(ROOT,projectDirectory(unsloth),'web');
const ghosttrack = projects.find(project => project.id === '008');
const ghosttrackWeb = path.join(ROOT,projectDirectory(ghosttrack),'web');
const easelDirectory = projectDirectory(easel);
const easelWeb = path.join(ROOT,easelDirectory,'web');
const directory = projectDirectory(project);
const app = path.join(ROOT, directory, 'experiments/sand-art');
const interviewDirectory = projectDirectory(interview);
const interviewWeb = path.join(ROOT, interviewDirectory, 'web');
const pascalDirectory = projectDirectory(pascal);
const pascalWeb = path.join(ROOT, pascalDirectory, 'web');
const aihotDirectory = projectDirectory(aihot);
const aihotWeb = path.join(ROOT, aihotDirectory, 'web');
const upDirectory = projectDirectory(up);
const upWeb = path.join(ROOT,upDirectory,'web');
const threejsDirectory = projectDirectory(threejs);
const threejsWeb = path.join(ROOT,threejsDirectory,'web');
async function build(script, label, args = []) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { stdio: 'inherit', windowsHide: true });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${label}构建失败 (${code})`)));
  });
}
await build(path.join(app, 'scripts/build-platform.mjs'), '001 Sandboard', process.argv.includes('--pack-only') ? ['--pack-only'] : []);
await build(path.join(interviewWeb, 'scripts/build.mjs'), '002 编程面试知识指南');
if (process.argv.includes('--pack-only')) {
  await access(path.join(pascalWeb, 'out/overview/index.html'));
} else {
  await build(path.join(pascalWeb, 'scripts/build.mjs'), '003 Pascal');
}
await build(path.join(aihotWeb, 'scripts/build.mjs'), '013 AIHOT 信源与资讯引擎研究');
await build(path.join(upWeb,'scripts/build.mjs'),'004 Up 完整理解与学习指南');
await build(path.join(threejsWeb,'scripts/build-games.mjs'),'005 三个独立 Three.js 游戏');
await build(path.join(threejsWeb,'scripts/build.mjs'),'005 完整理解与真实试玩');
await build(path.join(easelWeb,'scripts/build.mjs'),'006 Easel 社媒运营完整理解');
await build(path.join(octogentWeb,'scripts/build.mjs'),'007 Octogent 完整理解与原图');
await build(path.join(ghosttrackWeb,'scripts/build.mjs'),'008 GhostTrack 完整理解与原图');
await build(path.join(unslothWeb,'scripts/build.mjs'),'010 Unsloth 完整理解与原图');
const site = path.resolve(ROOT, '.cache/pages-site');
if (path.dirname(site) !== path.resolve(ROOT, '.cache') || path.basename(site) !== 'pages-site') throw new Error('发布目录越界。');
await rm(site, { recursive: true, force: true });
await mkdir(path.join(site, 'assets'), { recursive: true });
await cp(path.join(app, '.cache/platform-site'), path.join(site, '001-sandboard'), { recursive: true });
await cp(path.join(interviewWeb, 'dist'), path.join(site, '002-interview-guide'), { recursive: true });
await cp(path.join(pascalWeb, 'out'), path.join(site, '003-pascal-editor'), { recursive: true });
await cp(path.join(aihotWeb, 'dist'), path.join(site, '013-aihot'), { recursive: true });
await cp(path.join(upWeb,'dist'),path.join(site,'004-up-learning-guide'),{recursive:true});
await cp(path.join(threejsWeb,'dist'),path.join(site,'005-threejs-game-skills'),{recursive:true});
await cp(path.join(easelWeb,'dist'),path.join(site,'006-easel'),{recursive:true});
await cp(path.join(octogentWeb,'dist'),path.join(site,'007-octogent'),{recursive:true});
await cp(path.join(ghosttrackWeb,'dist'),path.join(site,'008-ghosttrack'),{recursive:true});
await cp(path.join(unslothWeb,'dist'),path.join(site,'010-unsloth'),{recursive:true});
// README uses the guide cover; the website keeps its original demo figure.
const original = {
  image: 'assets/original-fine-v2.jpg',
  alt: 'Sandboard 原版精细画质下的字母 A 沙槽、沙脊和椰树阴影',
  caption: '2026-10-08 本地原版精细画质实测：2560 × 1440 绘制后截图，保留上游 489cb01 的沙床与渲染算法。',
};
await cp(path.join(ROOT, directory, original.image), path.join(site, 'assets/original.jpg'));
await cp(path.join(ROOT, directory, 'assets/understanding/preview.jpg'), path.join(site, 'assets/understanding.jpg'));
const research = JSON.parse(await readFile(path.join(ROOT, directory, 'assets/understanding/publication.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const repository = 'https://github.com/yydshly/1008_codex_project';
const summary = published => published.summaryItems
  ? published.summaryItems.map(item => `<strong>${escape(item.title)}</strong>：${escape(item.text)}`).join('<br>')
  : escape(published.summary);
// The README and website both read the same substantive guide introduction.
const introduction = published => published.overviewItems
  ? '<div class="project-introduction" data-project-introduction="' + escape(published.id) + '">' + published.overviewItems.map(item => '<p><strong>' + escape(item.title) + '</strong>：' + escape(item.text) + '</p>').join('') + '</div>'
  : '<p class="lead">' + escape(published.summary) + '</p>';
const entrance = './001-sandboard/';
const interviewEntrance = './002-interview-guide/';
const interviewMap = `${interviewEntrance}assets/repository-map.png`;
const mapBytes = await readFile(path.join(site, '002-interview-guide/assets/repository-map.png'));
if (!mapBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('002 完整引导图必须是有效 PNG。');
const interviewReport = JSON.parse(await readFile(path.join(site, '002-interview-guide/coverage.json'), 'utf8'));
const mapWidth = mapBytes.readUInt32BE(16);
const mapHeight = mapBytes.readUInt32BE(20);
const aihotEntrance = './013-aihot/';
const upEntrance = './004-up-learning-guide/';
const threejsEntrance = './005-threejs-game-skills/';
const threejsMap = `${threejsEntrance}assets/capability-overview-v1.png`;
const easelEntrance = './006-easel/';
const easelMap = `${easelEntrance}capability-map.png`;
const easelResearch = JSON.parse(await readFile(path.join(site,'006-easel/publication.json'),'utf8'));
const easelBytes = await readFile(path.join(site,'006-easel/capability-map.png'));
if (!easelBytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('006 必须保留完整PNG引导图');
const threejsResearch = JSON.parse(await readFile(path.join(site,'005-threejs-game-skills/data/publication.json'),'utf8'));
const upMap = `${upEntrance}research/assets/up-core-map.png`;
const aihotMap = `${aihotEntrance}assets/aihot-overview.png`;
const aihotMapBytes = await readFile(path.join(site, '013-aihot/assets/aihot-overview.png'));
if (!aihotMapBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('013 完整引导图必须是有效 PNG。');
const aihotMapWidth = aihotMapBytes.readUInt32BE(16);
const aihotMapHeight = aihotMapBytes.readUInt32BE(20);
const aihotPreview = `${aihotEntrance}assets/aihot-preview.jpg`;
const pascalEntrance = './003-pascal-editor/';
const pascalResearchEntrance = `${pascalEntrance}overview/`;
const pascalMap = `${pascalEntrance}research/pascal-summary.png`;
const pascalMapBytes = await readFile(path.join(site, '003-pascal-editor/research/pascal-summary.png'));
if (!pascalMapBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('003 引导图必须是有效的完整 PNG。');
const pascalMapWidth = pascalMapBytes.readUInt32BE(16);
const pascalMapHeight = pascalMapBytes.readUInt32BE(20);
await access(path.join(site, '013-aihot/assets/aihot-preview.jpg'));
const aihotReport = JSON.parse(await readFile(path.join(site, '013-aihot/data/research.json'), 'utf8'));
const aihotBaseline = aihotReport.meta?.commit;
if (typeof aihotBaseline !== 'string' || !/^[0-9a-f]{40}$/.test(aihotBaseline)) throw new Error('013 研究资料缺少完整基线提交。');
if (aihotReport.meta?.upstream !== aihot.upstream) throw new Error('013 研究资料与项目索引的上游来源不一致。');
const projectRows = projects.map(published => {
  const upstreamName = new URL(published.upstream).pathname.split('/').filter(Boolean).at(-1);
  const local = `./${published.id}-${published.slug}/${published.id === '003' ? 'overview/' : ''}`;
  return `<tr><td>${escape(published.id)}<br><a href="${repository}/blob/main/${projectDirectory(published)}/README.md">${escape(published.name)}</a></td><td><a href="${escape(published.upstream)}">${escape(upstreamName)}</a></td><td class="summary">${summary(published)}</td><td><a href="${local}">在线体验 ↗</a></td></tr>`;
}).join('');
const links = research.entries.map(entry => `<a class="entry" href="${entrance}${escape(entry.path)}"><strong>${escape(entry.label)} ↗</strong><span>${escape(entry.note)}</span></a>`).join('');
const sections = research.sections.map((section, index) => `<article><span class="number">0${index + 1}</span><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></article>`).join('');
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(projects.map(published => published.summary).join(' '))}"><title>GitHub 项目研究集</title><style>
:root{color-scheme:dark;font-family:system-ui,"Microsoft YaHei",sans-serif;background:#141310;color:#ece5d7}*{box-sizing:border-box}body{margin:0}main{max-width:1200px;margin:auto;padding:36px 28px 70px}a{color:#f0c37d;text-decoration:none}a:hover{text-decoration:underline}nav{display:flex;gap:20px;justify-content:space-between;font-size:14px;border-bottom:1px solid #393328;padding-bottom:22px}.eyebrow{color:#cfaa72;font-size:13px;letter-spacing:.16em;margin-top:50px}h1{font-size:clamp(32px,5vw,58px);line-height:1.2;max-width:850px;margin:20px 0}p{line-height:1.9;color:#c9c0ae}.lead{max-width:900px;font-size:18px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0 40px}.button{padding:13px 18px;border:1px solid #807052;border-radius:6px}.button.primary{background:#e1b673;color:#201a11;border-color:#e1b673}.table-wrap{overflow:auto;border:1px solid #454033;border-radius:8px}table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.8}th,td{text-align:left;padding:16px;vertical-align:top;border-bottom:1px solid #393328}th{color:#b5a787;background:#211e18}td.summary{min-width:310px}.visual{display:grid;grid-template-columns:1.15fr 1fr;gap:28px;margin:35px 0}figure{margin:0;border:1px solid #393328;padding:12px;border-radius:8px;background:#1b1915}figure img{display:block;width:100%;height:auto;border-radius:4px}figcaption{color:#a89d89;line-height:1.8;font-size:13px;margin-top:12px}.guide-frame{display:block;border-radius:4px}.guide-frame img{width:100%;height:auto}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.entry{display:flex;flex-direction:column;gap:12px;border:1px solid #494033;border-radius:8px;padding:20px;background:#201c16}.entry span{font-size:13px;line-height:1.7;color:#b6aa97}.number{font-size:13px;color:#cba972}article{border-top:1px solid #393328;padding:25px 0 13px;margin-top:24px}article h2{font-size:23px;margin:12px 0}.project-introduction{max-width:950px}.project-introduction strong{color:#ece5d7}.project-introduction p{margin:16px 0;overflow-wrap:anywhere}.project-block{margin-top:64px;scroll-margin-top:24px}.project-heading{font-size:clamp(25px,4vw,38px);line-height:1.35}.project-map{max-width:900px;margin:28px auto}.project-map img{height:auto;object-fit:contain}.research-text{margin-top:30px}.research-text summary{cursor:pointer;color:#f0c37d;padding:16px;border:1px solid #494033;border-radius:6px}footer{overflow-wrap:anywhere;border-top:1px solid #393328;margin-top:40px;padding-top:24px;color:#958b79;font-size:13px;line-height:1.9}@media(max-width:700px){main{padding:24px 17px 45px}.visual,.grid{grid-template-columns:1fr}.eyebrow{margin-top:35px}.lead{font-size:16px}nav{font-size:12px;gap:10px}}
</style></head><body><main>
<nav><span>GitHub 项目研究集</span><a href="${repository}">仓库与研究文档 ↗</a></nav>
<div class="eyebrow">OPEN SOURCE · RESEARCH · REAL EXPERIENCE</div><h1>GitHub 项目研究集</h1><p class="lead">先看清开源项目的能力与原理，再通过完整引导图、实际体验和研究依据选择下一步。这里汇总已发布的沙画平台、中文面试知识指南、Pascal 空间编辑、Up 学习与成长指南、Three.js游戏技能、Easel 社媒运营、Octogent 多智能体、GhostTrack 查询工具、Unsloth 模型训练与 AIHOT 资讯引擎研究。</p>
<div class="actions"><a class="button primary" href="${entrance}art/home/">001 · 光阴沙画平台 ↗</a><a class="button primary" href="${interviewEntrance}#research">002 · 面试知识研究 ↗</a><a class="button primary" href="${pascalResearchEntrance}">003 · Pascal 空间设计研究 ↗</a><a class="button primary" href="${upEntrance}">004 · Up 学习与成长研究 ↗</a><a class="button primary" href="${easelEntrance}">006 · Easel 社媒运营研究 ↗</a><a class="button primary" href="${aihotEntrance}">013 · AIHOT 信源与资讯研究 ↗</a><a class="button" href="#published-projects">项目摘要与完整引导图</a></div>
<h2 id="published-projects">已发布的项目研究</h2><div class="table-wrap"><table><thead><tr><th>编号 / 研究</th><th>源库</th><th>摘要</th><th>Web 演示</th></tr></thead><tbody>${projectRows}</tbody></table></div>
<section class="project-block" id="sandboard"><div class="eyebrow">001 / WEBGPU · MATERIAL · SAND ART</div><h2 class="project-heading">${escape(research.title)}</h2>${introduction(project)}<div class="actions"><a class="button primary" href="${entrance}art/home/">进入光阴沙画平台 ↗</a><a class="button" href="${entrance}art/research/#overview">放大阅读完整总览图</a><a class="button" href="${escape(project.upstream)}">源库 Sandboard</a></div>
<div class="visual"><figure><a href="${entrance}original/"><img src="./assets/original.jpg" alt="${escape(original.alt)}" loading="lazy"></a><figcaption>${escape(original.caption)}<br><a href="${entrance}original/">操作 Sandboard 原版效果 ↗</a></figcaption></figure><figure><a class="guide-frame" href="${entrance}art/research/#overview"><img src="./assets/understanding.jpg" alt="Sandboard 能力、原理、输入输出、历史探索与七类产品方向的完整总览图" loading="lazy"></a><figcaption>${escape(research.guideCaption)}<br><a href="${entrance}art/research/#overview">展开全部七个章节与高清图 ↗</a></figcaption></figure></div><h2>先看效果，再看研究</h2><div class="grid">${links}</div><details class="research-text"><summary>阅读 Sandboard 能力、探索过程与研究结论</summary>${sections}</details></section>
<section class="project-block" id="interview-guide"><div class="eyebrow">002 / KNOWLEDGE · ARCHITECTURE · LEARNING</div><h2 class="project-heading">002 · ${escape(interview.name)}</h2>${introduction(interview)}<div class="actions"><a class="button primary" href="${interviewEntrance}#research">阅读完整项目研究 ↗</a><a class="button" href="${interviewEntrance}#overview">进入中文知识地图</a><a class="button" href="${interviewEntrance}#coverage">查看逐主题覆盖核对</a><a class="button" href="${escape(interview.upstream)}">源库 guia-entrevistas-de-programacion</a></div>
<figure class="project-map"><a class="guide-frame" href="${interviewMap}"><img src="${interviewMap}" alt="${escape(interview.coverAlt || '编程面试知识指南完整引导图：能力、模块、原理、增强内容、场景、价值、方向与边界')}" width="${mapWidth}" height="${mapHeight}" loading="lazy" decoding="async"></a><figcaption>${escape(interview.coverCaption || '本研究项目的完整理解引导图，保留全部画面，不裁切。')}<br><a href="${interviewMap}">打开完整原图</a> · <a href="${interviewEntrance}#research">在线阅读能力、原理与扩展方向 ↗</a></figcaption></figure></section>
<section class="project-block" id="pascal"><div class="eyebrow">003 / SPACE · PARAMETRIC · EDITOR</div><h2 class="project-heading">003 · ${escape(pascal.name)}</h2>${introduction(pascal)}<div class="actions"><a class="button primary" href="${pascalResearchEntrance}">阅读完整 Pascal 项目理解 ↗</a><a class="button" href="${pascalEntrance}">操作真实编辑器</a><a class="button" href="${pascalResearchEntrance}#extensions">查看八个扩展方向</a><a class="button" href="${escape(pascal.upstream)}">源库 editor</a></div><figure class="project-map"><a class="guide-frame" href="${pascalMap}"><img src="${pascalMap}" alt="${escape(pascal.coverAlt)}" width="${pascalMapWidth}" height="${pascalMapHeight}" loading="lazy" decoding="async"></a><figcaption>${escape(pascal.coverCaption)}<br><a href="${pascalMap}">打开完整原图</a> · <a href="${pascalMap}" download="pascal-summary.png">下载原图</a> · <a href="${pascalResearchEntrance}">在线阅读能力、模块、原理与价值 ↗</a></figcaption></figure></section>
<section class="project-block" id="up-learning-guide"><div class="eyebrow">004 / LEARNING · EVIDENCE · LIFE</div><h2 class="project-heading">004 · ${escape(up.name)}</h2>${introduction(up)}<div class="actions"><a class="button primary" href="${upEntrance}">阅读完整Up项目理解 ↗</a><a class="button" href="${upEntrance}#/map">一图理解与保存</a><a class="button" href="${upEntrance}#/guide/01-learning-system">阅读学习系统</a><a class="button" href="${escape(up.upstream)}">源库 up</a></div><figure class="project-map"><a class="guide-frame" href="${upMap}"><img src="${upMap}" alt="${escape(up.coverAlt)}" width="2400" height="1600" loading="lazy" decoding="async"></a><figcaption>${escape(up.coverCaption)}<br><a href="${upMap}">打开完整原图</a> · <a href="${upMap}" download="up-core-map.png">下载原图</a> · <a href="${upEntrance}">在线阅读能力、模块、原理与价值 ↗</a></figcaption></figure></section>
<section class="project-block" id="aihot"><div class="eyebrow">013 / SOURCES · EDITORIAL · EVENTS</div><h2 class="project-heading">013 · ${escape(aihot.name)}</h2>${introduction(aihot)}<div class="actions"><a class="button primary" href="${aihotEntrance}">阅读完整 AIHOT 研究 ↗</a><a class="button" href="${aihotEntrance}#sources">查看 18 个示范信源</a><a class="button" href="${aihotMap}">打开完整原图</a><a class="button" href="${escape(aihot.upstream)}">源库 AIHOT</a></div>
<figure class="project-map"><a class="guide-frame" href="${aihotMap}"><img src="${aihotPreview}" alt="${escape(aihot.coverAlt || 'AIHOT 完整引导图：能力、模块、原理、信源、使用场景、价值、复用方向与边界')}" width="${aihotMapWidth}" height="${aihotMapHeight}" loading="lazy" decoding="async"></a><figcaption>${escape(aihot.coverCaption || '复用已有完整研究引导图，预览保留全部画面，高清 PNG 保留原始字节。')}<br><a href="${aihotMap}">打开完整原图</a> · <a href="${aihotMap}" download="aihot-overview.png">下载高清引导图</a> · <a href="${aihotEntrance}">在线阅读能力、信源与复用方向 ↗</a></figcaption></figure></section>
<section class="project-block" id="threejs-game-skills"><div class="eyebrow">005 / GAME SKILLS · WORKFLOW · EVIDENCE</div><h2 class="project-heading">005 · ${escape(threejs.name)}</h2>${introduction(threejs)}<div class="actions"><a class="button primary" href="${threejsEntrance}">阅读完整能力与价值 ↗</a><a class="button" href="${threejsEntrance}ink/">试玩竹影问剑</a><a class="button" href="${threejsEntrance}play/">试玩暴风港</a><a class="button" href="${threejsEntrance}#extensions">八项扩展方向</a><a class="button" href="${escape(threejs.upstream)}">源库 threejs-game-skills</a></div><figure class="project-map"><a class="guide-frame" href="${threejsMap}"><img src="${threejsMap}" alt="${escape(threejs.coverAlt)}" width="1024" height="1536" loading="lazy" decoding="async"></a><figcaption>${escape(threejs.coverCaption)}<br><a href="${threejsMap}">打开完整原图</a> · <a href="${threejsMap}" download="capability-overview-v1.png">下载原图</a> · <a href="${threejsEntrance}">在线阅读能力、原理、实践和价值 ↗</a></figcaption></figure></section>
<section class="project-block" id="easel"><div class="eyebrow">006 / PROFILE · MEDIA · SOCIAL OPERATIONS</div><h2 class="project-heading">006 · ${escape(easel.name)}</h2>${introduction(easel)}<div class="actions"><a class="button primary" href="${easelEntrance}">阅读完整能力与原理 ↗</a><a class="button" href="${easelEntrance}#search">国内来源与搜索过滤</a><a class="button" href="${easelEntrance}#capabilities">全部114个技能</a><a class="button" href="${easelEntrance}#value">场景、价值与复用</a><a class="button" href="${easelEntrance}#value?section=extensions">八项扩展建议</a><a class="button" href="${escape(easel.upstream)}">源库 Easel</a></div><figure class="project-map"><a class="guide-frame" href="${easelMap}"><img src="${easelMap}" alt="${escape(easel.coverAlt)}" width="941" height="1672" loading="lazy" decoding="async"></a><figcaption>${escape(easel.coverCaption)}<br><a href="${easelMap}">打开完整原图</a> · <a href="${easelMap}" download="easel-capability-map.png">下载原图</a> · <a href="${easelEntrance}">在线阅读完整理解与源码依据 ↗</a></figcaption></figure></section>
${renderOctogentCard(octogent)}
${renderGhostTrackCard(ghosttrack)}
${renderUnslothCard(unsloth)}
<footer>006 研究基线：<a href="${escape(easel.upstream)}/tree/${escape(easelResearch.meta.commit)}">${escape(easelResearch.meta.commit)}</a><br>上游遵循 <a href="${easelEntrance}LICENSE.upstream.txt">Apache-2.0许可</a>。公开网页仅提供研究，未运行模型或社媒发布；扩展方向是建议，离线5项通过与1项失败记录保留。<br><a href="${easelEntrance}research.md">Easel完整研究与验证范围</a><br><br>005 研究基线：<a href="${escape(threejs.upstream)}/tree/${escape(threejsResearch.meta.commit)}">${escape(threejsResearch.meta.commit)}</a><br>上游代码 <a href="${threejsEntrance}LICENSE.upstream.txt">MIT 许可</a>；作者独立游戏素材不自动受源码许可覆盖。总览图、原始截图和两款实验分别说明来源与验证边界；静态站点不调用生成 API。<br><a href="${threejsEntrance}asset-sources.md">图片与素材署名</a> · <a href="${threejsEntrance}research.md">完整研究记录</a><br><br>001 研究基线：<a href="${escape(project.upstream)}/tree/${research.baseline}">${research.baseline}</a><br>Sandboard 上游和对应衍生代码遵循 ${escape(research.license)}；照片、手部与其他引用素材分别保留署名。AI 目标和材料概念图明确标注。<br><a href="${repository}/blob/main/${directory}/experiments/sand-art/ATTRIBUTION.md">Sandboard 来源、许可与改动范围</a><br><br>002 研究基线：<a href="${escape(interview.upstream)}/tree/${escape(interviewReport.baseline.commit)}">${escape(interviewReport.baseline.commit)}</a><br>上游指南遵循 <a href="${interviewEntrance}LICENSE.upstream.txt">MIT 许可</a>；中文讲解与示例为独立补充，第三方教程仅保留资料入口。<br><a href="${repository}/blob/main/${interviewDirectory}/README.md">面试指南来源与实现说明</a><br><br>003 研究基线：<a href="https://github.com/pascalorg/editor/tree/c5eaf51e161ba8653204d543666f5839d6020874">c5eaf51e161ba8653204d543666f5839d6020874</a><br>四个运行包固定 1.0.3；上游代码 <a href="./003-pascal-editor/LICENSE.upstream.txt">MIT 许可</a>，材质独立来源和许可尚未逐项核实；Basis 解码器保留 Apache 2.0。<br><a href="https://github.com/yydshly/1008_codex_project/blob/main/projects/003-pascal-editor/README.md">Pascal 来源、许可与改动范围</a><br><br>013 研究基线：<a href="${escape(aihot.upstream)}/tree/${escape(aihotBaseline)}">${escape(aihotBaseline)}</a><br>AIHOT 上游遵循 MIT 许可；研究网页保留来源和独立解读，未运行原库采集与模型服务。<br><a href="${repository}/blob/main/${aihotDirectory}/README.md">AIHOT 来源、许可与研究范围</a><br><br>004 研究基线：<a href="https://github.com/byoungd/up/tree/35e2aa9ad3a076fe4e8405877cc560df2593838f">35e2aa9ad3a076fe4e8405877cc560df2593838f</a><br>内容原作者 byoungd and contributors；本地改写与引导图保留 <a href="${upEntrance}research/licenses/LICENSE-CONTENT.md">CC BY-NC 4.0</a>，上游程序另为MIT。本研究网页为独立实现，没有提供教学、模型服务或云同步。<br><a href="${upEntrance}#/guide/sources">Up来源、许可与验证范围</a> · <a href="${repository}/blob/main/docs/DEPLOYMENT.md">构建与发布方式</a></footer>
</main></body></html>`;
await writeFile(path.join(site, 'index.html'), html);
await writeFile(path.join(site, '.nojekyll'), '');
console.log(`发布站点：${site}；总入口 + Sandboard 十六页 + 编程面试指南 + Pascal 总结和真实编辑器 + AIHOT 研究；仅发布 001、002、003、004、005、006、007、008、010、013，原版路径保留。`);
