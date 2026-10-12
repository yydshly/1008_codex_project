// Aggregate independently built projects; the root has no frontend dependencies.
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { ROOT, readCatalog, validateCatalog, projectDirectory } from './catalog.mjs';

// Publication is an explicit allowlist. Local research projects must not become
// public merely because they are registered in projects.json.
const publication = [{ id: '001', slug: 'sandboard' }, { id: '002', slug: 'interview-guide' }, { id: '003', slug: 'pascal-editor' }, { id: '004', slug: 'up-learning-guide' }, { id: '013', slug: 'aihot' }];
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
const site = path.resolve(ROOT, '.cache/pages-site');
if (path.dirname(site) !== path.resolve(ROOT, '.cache') || path.basename(site) !== 'pages-site') throw new Error('发布目录越界。');
await rm(site, { recursive: true, force: true });
await mkdir(path.join(site, 'assets'), { recursive: true });
await cp(path.join(app, '.cache/platform-site'), path.join(site, '001-sandboard'), { recursive: true });
await cp(path.join(interviewWeb, 'dist'), path.join(site, '002-interview-guide'), { recursive: true });
await cp(path.join(pascalWeb, 'out'), path.join(site, '003-pascal-editor'), { recursive: true });
await cp(path.join(aihotWeb, 'dist'), path.join(site, '013-aihot'), { recursive: true });
await cp(path.join(upWeb,'dist'),path.join(site,'004-up-learning-guide'),{recursive:true});
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
:root{color-scheme:dark;font-family:system-ui,"Microsoft YaHei",sans-serif;background:#141310;color:#ece5d7}*{box-sizing:border-box}body{margin:0}main{max-width:1200px;margin:auto;padding:36px 28px 70px}a{color:#f0c37d;text-decoration:none}a:hover{text-decoration:underline}nav{display:flex;gap:20px;justify-content:space-between;font-size:14px;border-bottom:1px solid #393328;padding-bottom:22px}.eyebrow{color:#cfaa72;font-size:13px;letter-spacing:.16em;margin-top:50px}h1{font-size:clamp(32px,5vw,58px);line-height:1.2;max-width:850px;margin:20px 0}p{line-height:1.9;color:#c9c0ae}.lead{max-width:900px;font-size:18px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0 40px}.button{padding:13px 18px;border:1px solid #807052;border-radius:6px}.button.primary{background:#e1b673;color:#201a11;border-color:#e1b673}.table-wrap{overflow:auto;border:1px solid #454033;border-radius:8px}table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.8}th,td{text-align:left;padding:16px;vertical-align:top;border-bottom:1px solid #393328}th{color:#b5a787;background:#211e18}td.summary{min-width:310px}.visual{display:grid;grid-template-columns:1.15fr 1fr;gap:28px;margin:35px 0}figure{margin:0;border:1px solid #393328;padding:12px;border-radius:8px;background:#1b1915}figure img{display:block;width:100%;height:auto;border-radius:4px}figcaption{color:#a89d89;line-height:1.8;font-size:13px;margin-top:12px}.guide-frame{display:block;border-radius:4px}.guide-frame img{width:100%;height:auto}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.entry{display:flex;flex-direction:column;gap:12px;border:1px solid #494033;border-radius:8px;padding:20px;background:#201c16}.entry span{font-size:13px;line-height:1.7;color:#b6aa97}.number{font-size:13px;color:#cba972}article{border-top:1px solid #393328;padding:25px 0 13px;margin-top:24px}article h2{font-size:23px;margin:12px 0}.project-block{margin-top:64px;scroll-margin-top:24px}.project-heading{font-size:clamp(25px,4vw,38px);line-height:1.35}.project-map{max-width:900px;margin:28px auto}.project-map img{height:auto;object-fit:contain}.research-text{margin-top:30px}.research-text summary{cursor:pointer;color:#f0c37d;padding:16px;border:1px solid #494033;border-radius:6px}footer{overflow-wrap:anywhere;border-top:1px solid #393328;margin-top:40px;padding-top:24px;color:#958b79;font-size:13px;line-height:1.9}@media(max-width:700px){main{padding:24px 17px 45px}.visual,.grid{grid-template-columns:1fr}.eyebrow{margin-top:35px}.lead{font-size:16px}nav{font-size:12px;gap:10px}}
</style></head><body><main>
<nav><span>GitHub 项目研究集</span><a href="${repository}">仓库与研究文档 ↗</a></nav>
<div class="eyebrow">OPEN SOURCE · RESEARCH · REAL EXPERIENCE</div><h1>GitHub 项目研究集</h1><p class="lead">先看清开源项目的能力与原理，再通过完整引导图、实际体验和研究依据选择下一步。这里汇总已发布的沙画平台、中文面试知识指南、Pascal 空间编辑、Up 学习与成长指南和 AIHOT 资讯引擎研究。</p>
<div class="actions"><a class="button primary" href="${entrance}art/home/">001 · 光阴沙画平台 ↗</a><a class="button primary" href="${interviewEntrance}#research">002 · 面试知识研究 ↗</a><a class="button primary" href="${pascalResearchEntrance}">003 · Pascal 空间设计研究 ↗</a><a class="button primary" href="${upEntrance}">004 · Up 学习与成长研究 ↗</a><a class="button primary" href="${aihotEntrance}">013 · AIHOT 信源与资讯研究 ↗</a><a class="button" href="#published-projects">项目摘要与完整引导图</a></div>
<h2 id="published-projects">已发布的项目研究</h2><div class="table-wrap"><table><thead><tr><th>编号 / 研究</th><th>源库</th><th>摘要</th><th>Web 演示</th></tr></thead><tbody>${projectRows}</tbody></table></div>
<section class="project-block" id="sandboard"><div class="eyebrow">001 / WEBGPU · MATERIAL · SAND ART</div><h2 class="project-heading">${escape(research.title)}</h2><p class="lead">${escape(research.intro)}</p><div class="actions"><a class="button primary" href="${entrance}art/home/">进入光阴沙画平台 ↗</a><a class="button" href="${entrance}art/research/#overview">放大阅读完整总览图</a><a class="button" href="${escape(project.upstream)}">源库 Sandboard</a></div>
<div class="visual"><figure><a href="${entrance}original/"><img src="./assets/original.jpg" alt="${escape(original.alt)}" loading="lazy"></a><figcaption>${escape(original.caption)}<br><a href="${entrance}original/">操作 Sandboard 原版效果 ↗</a></figcaption></figure><figure><a class="guide-frame" href="${entrance}art/research/#overview"><img src="./assets/understanding.jpg" alt="Sandboard 能力、原理、输入输出、历史探索与七类产品方向的完整总览图" loading="lazy"></a><figcaption>${escape(research.guideCaption)}<br><a href="${entrance}art/research/#overview">展开全部七个章节与高清图 ↗</a></figcaption></figure></div><h2>先看效果，再看研究</h2><div class="grid">${links}</div><details class="research-text"><summary>阅读 Sandboard 能力、探索过程与研究结论</summary>${sections}</details></section>
<section class="project-block" id="interview-guide"><div class="eyebrow">002 / KNOWLEDGE · ARCHITECTURE · LEARNING</div><h2 class="project-heading">002 · ${escape(interview.name)}</h2><p class="lead">${escape(interview.summary)}</p><p>从源库能力、模块、底层原理与使用场景了解这份指南，区分上游已有内容与我们的中文增强，再按基础、前端或后端路线进入知识主题。</p><div class="actions"><a class="button primary" href="${interviewEntrance}#research">阅读完整项目研究 ↗</a><a class="button" href="${interviewEntrance}#overview">进入中文知识地图</a><a class="button" href="${interviewEntrance}#coverage">查看逐主题覆盖核对</a><a class="button" href="${escape(interview.upstream)}">源库 guia-entrevistas-de-programacion</a></div>
<figure class="project-map"><a class="guide-frame" href="${interviewMap}"><img src="${interviewMap}" alt="${escape(interview.coverAlt || '编程面试知识指南完整引导图：能力、模块、原理、增强内容、场景、价值、方向与边界')}" width="${mapWidth}" height="${mapHeight}" loading="lazy" decoding="async"></a><figcaption>${escape(interview.coverCaption || '本研究项目的完整理解引导图，保留全部画面，不裁切。')}<br><a href="${interviewMap}">打开完整原图</a> · <a href="${interviewEntrance}#research">在线阅读能力、原理与扩展方向 ↗</a></figcaption></figure></section>
<section class="project-block" id="pascal"><div class="eyebrow">003 / SPACE · PARAMETRIC · EDITOR</div><h2 class="project-heading">003 · ${escape(pascal.name)}</h2><p class="lead">${escape(pascal.summary)}</p><p>九类能力、八个模块、参数—几何—视图的更新原理、六类场景、四条复用路线与八个扩展方向，区分原库能力、本次宿主和待开发服务。中文理解页保留完整静态正文，真实编辑器提供可继续操作的住宅与官方场景。</p><div class="actions"><a class="button primary" href="${pascalResearchEntrance}">阅读完整 Pascal 项目理解 ↗</a><a class="button" href="${pascalEntrance}">操作真实编辑器</a><a class="button" href="${pascalResearchEntrance}#extensions">查看八个扩展方向</a><a class="button" href="${escape(pascal.upstream)}">源库 editor</a></div><figure class="project-map"><a class="guide-frame" href="${pascalMap}"><img src="${pascalMap}" alt="${escape(pascal.coverAlt)}" width="${pascalMapWidth}" height="${pascalMapHeight}" loading="lazy" decoding="async"></a><figcaption>${escape(pascal.coverCaption)}<br><a href="${pascalMap}">打开完整原图</a> · <a href="${pascalMap}" download="pascal-summary.png">下载原图</a> · <a href="${pascalResearchEntrance}">在线阅读能力、模块、原理与价值 ↗</a></figcaption></figure></section>
<section class="project-block" id="up-learning-guide"><div class="eyebrow">004 / LEARNING · EVIDENCE · LIFE</div><h2 class="project-heading">004 · ${escape(up.name)}</h2><p class="lead">${escape(up.summary)}</p><p>用真实任务学习，用证据判断成长。完整说明能力、模块、方法与技术原理、五项价值观、实践路线和八个扩展方向，保留七篇专题、97页目录与全部工作纸和引用入口。</p><div class="actions"><a class="button primary" href="${upEntrance}">阅读完整Up项目理解 ↗</a><a class="button" href="${upEntrance}#/map">一图理解与保存</a><a class="button" href="${upEntrance}#/guide/01-learning-system">阅读学习系统</a><a class="button" href="${escape(up.upstream)}">源库 up</a></div><figure class="project-map"><a class="guide-frame" href="${upMap}"><img src="${upMap}" alt="${escape(up.coverAlt)}" width="2400" height="1600" loading="lazy" decoding="async"></a><figcaption>${escape(up.coverCaption)}<br><a href="${upMap}">打开完整原图</a> · <a href="${upMap}" download="up-core-map.png">下载原图</a> · <a href="${upEntrance}">在线阅读能力、模块、原理与价值 ↗</a></figcaption></figure></section>
<section class="project-block" id="aihot"><div class="eyebrow">013 / SOURCES · EDITORIAL · EVENTS</div><h2 class="project-heading">013 · ${escape(aihot.name)}</h2><p class="lead">${escape(aihot.summary)}</p><p>从信源清单与采集入口开始，沿着材料、精选、写作、事件归组、热度和出刊理解 AIHOT。完整研究解释模块与原理，比较使用场景、复用方向和运行边界，并保留固定提交与源码依据。</p><div class="actions"><a class="button primary" href="${aihotEntrance}">阅读完整 AIHOT 研究 ↗</a><a class="button" href="${aihotEntrance}#sources">查看 18 个示范信源</a><a class="button" href="${aihotMap}">打开完整原图</a><a class="button" href="${escape(aihot.upstream)}">源库 AIHOT</a></div>
<figure class="project-map"><a class="guide-frame" href="${aihotMap}"><img src="${aihotPreview}" alt="${escape(aihot.coverAlt || 'AIHOT 完整引导图：能力、模块、原理、信源、使用场景、价值、复用方向与边界')}" width="${aihotMapWidth}" height="${aihotMapHeight}" loading="lazy" decoding="async"></a><figcaption>${escape(aihot.coverCaption || '复用已有完整研究引导图，预览保留全部画面，高清 PNG 保留原始字节。')}<br><a href="${aihotMap}">打开完整原图</a> · <a href="${aihotMap}" download="aihot-overview.png">下载高清引导图</a> · <a href="${aihotEntrance}">在线阅读能力、信源与复用方向 ↗</a></figcaption></figure></section>
<footer>001 研究基线：<a href="${escape(project.upstream)}/tree/${research.baseline}">${research.baseline}</a><br>Sandboard 上游和对应衍生代码遵循 ${escape(research.license)}；照片、手部与其他引用素材分别保留署名。AI 目标和材料概念图明确标注。<br><a href="${repository}/blob/main/${directory}/experiments/sand-art/ATTRIBUTION.md">Sandboard 来源、许可与改动范围</a><br><br>002 研究基线：<a href="${escape(interview.upstream)}/tree/${escape(interviewReport.baseline.commit)}">${escape(interviewReport.baseline.commit)}</a><br>上游指南遵循 <a href="${interviewEntrance}LICENSE.upstream.txt">MIT 许可</a>；中文讲解与示例为独立补充，第三方教程仅保留资料入口。<br><a href="${repository}/blob/main/${interviewDirectory}/README.md">面试指南来源与实现说明</a><br><br>003 研究基线：<a href="https://github.com/pascalorg/editor/tree/c5eaf51e161ba8653204d543666f5839d6020874">c5eaf51e161ba8653204d543666f5839d6020874</a><br>四个运行包固定 1.0.3；上游代码 <a href="./003-pascal-editor/LICENSE.upstream.txt">MIT 许可</a>，材质独立来源和许可尚未逐项核实；Basis 解码器保留 Apache 2.0。<br><a href="https://github.com/yydshly/1008_codex_project/blob/main/projects/003-pascal-editor/README.md">Pascal 来源、许可与改动范围</a><br><br>013 研究基线：<a href="${escape(aihot.upstream)}/tree/${escape(aihotBaseline)}">${escape(aihotBaseline)}</a><br>AIHOT 上游遵循 MIT 许可；研究网页保留来源和独立解读，未运行原库采集与模型服务。<br><a href="${repository}/blob/main/${aihotDirectory}/README.md">AIHOT 来源、许可与研究范围</a><br><br>004 研究基线：<a href="https://github.com/byoungd/up/tree/35e2aa9ad3a076fe4e8405877cc560df2593838f">35e2aa9ad3a076fe4e8405877cc560df2593838f</a><br>内容原作者 byoungd and contributors；本地改写与引导图保留 <a href="${upEntrance}research/licenses/LICENSE-CONTENT.md">CC BY-NC 4.0</a>，上游程序另为MIT。本研究网页为独立实现，没有提供教学、模型服务或云同步。<br><a href="${upEntrance}#/guide/sources">Up来源、许可与验证范围</a> · <a href="${repository}/blob/main/docs/DEPLOYMENT.md">构建与发布方式</a></footer>
</main></body></html>`;
await writeFile(path.join(site, 'index.html'), html);
await writeFile(path.join(site, '.nojekyll'), '');
console.log(`发布站点：${site}；总入口 + Sandboard 十六页 + 编程面试指南 + Pascal 总结和真实编辑器 + AIHOT 研究；仅发布 001、002、003、004、013，原版路径保留。`);
