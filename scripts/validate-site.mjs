import { readFile, access, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ROOT, readCatalog } from './catalog.mjs';

const site = path.resolve(ROOT, '.cache/pages-site');
const html = await readFile(path.join(site, 'index.html'), 'utf8');
assert.ok(html.includes('<title>GitHub 项目研究集</title>'), '公开总入口需要项目研究集标题');
assert.ok(html.includes('>Sandboard</a>'), '来源链接需要显示源库自己的名字');
assert.ok(html.includes('>guia-entrevistas-de-programacion</a>'), '002 来源链接需要显示源库自己的名字');
assert.ok(html.includes('>AIHOT</a>'), '013 来源链接需要显示源库自己的名字');
assert.ok(!html.includes('127.0.0.1') && !html.includes('localhost'), '公开入口不引用本机地址');
const sections = ['源库的能力与底层原理', '我们的探索与实际输入输出', '使用场景与研究价值', '可扩展产品方向与推进顺序', '当前边界与失败结论'];
for (const title of sections) assert.ok(html.includes(title), `缺少说明：${title}`);
const links = new Set([...html.matchAll(/(?:src|href)="(\.\/[^"#]+)(?:#[^"]*)?"/g)].map(match => match[1]));
for (const link of links) {
  const local = path.resolve(site, link.endsWith('/') ? link + 'index.html' : link);
  assert.ok(local.startsWith(site + path.sep), `链接越界：${link}`);
  await access(local);
}
const publishedDirectories = (await readdir(site, { withFileTypes: true }))
  .filter(entry => entry.isDirectory() && /^\d{3,}-/.test(entry.name)).map(entry => entry.name).sort();
assert.deepEqual(publishedDirectories, ['001-sandboard', '002-interview-guide', '003-pascal-editor', '004-up-learning-guide','005-threejs-game-skills','006-easel','007-octogent','008-ghosttrack','009-cove','010-unsloth','011-aitoearn','012-huashu-art-motion','013-aihot'], '发布允许名单包含 001–013');

// Introductions must be readable before each guide and use the catalog text.
const introductionSections = { '001': 'sandboard', '002': 'interview-guide', '003': 'pascal', '004': 'up-learning-guide', '005':'threejs-game-skills', '006':'easel', '007':'octogent', '008':'ghosttrack', '009':'cove', '010':'unsloth', '011':'aitoearn', '012':'huashu-art-motion', '013': 'aihot' };
const escapeIntroduction = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
for (const [id, sectionId] of Object.entries(introductionSections)) {
  const project = readCatalog().projects.find(project => project.id === id);
  const block = html.match(new RegExp(`<section class="project-block" id="${sectionId}">([\\s\\S]*?)</section>`))?.[1] ?? '';
  const introduction = block.match(new RegExp(`<div class="project-introduction" data-project-introduction="${id}">([\\s\\S]*?)</div>`))?.[1] ?? '';
  assert.ok(project?.overviewItems?.length && introduction, `${id} 需要图前项目介绍`);
  assert.ok(block.indexOf('data-project-introduction') < block.indexOf('<figure'), `${id} 项目介绍必须出现在引导图前`);
  assert.equal((introduction.match(/<p>/g) ?? []).length, project.overviewItems.length, `${id} 项目介绍应独立成段`);
  for (const item of project.overviewItems) {
    assert.ok(introduction.includes(`<strong>${escapeIntroduction(item.title)}</strong>：${escapeIntroduction(item.text)}`), `${id} 图前介绍缺少 ${item.title}`);
  }
}

// Verify the copied 001 aggregate as well as its independently validated build.
const sandboard = path.join(site, '001-sandboard');
const sandboardPages = JSON.parse(await readFile(path.join(ROOT, 'projects/001-sandboard/experiments/sand-art/src/platform/pages.json'), 'utf8'));
assert.equal(sandboardPages.length, 15, '001 的十五个功能页清单必须保留');
for (const page of sandboardPages) {
  const folder = page.id === 'original' ? 'original' : path.posix.join('art', page.path);
  const pageHtml = await readFile(path.join(sandboard, folder, 'index.html'), 'utf8');
  assert.ok(pageHtml.includes(`data-platform-page="${page.id}"`), `001 页面身份丢失：${page.id}`);
}
assert.ok((await readFile(path.join(sandboard, 'art/home/index.html'), 'utf8')).includes('data-platform-page="home"'), '001 平台首页丢失');
assert.ok((await readFile(path.join(sandboard, 'index.html'), 'utf8')).includes('url=./art/home/'), '001 根入口跳转丢失');
await access(path.join(sandboard, 'original/LICENSE'));
await access(path.join(sandboard, 'art/LICENSE'));

const interview = path.join(site, '002-interview-guide');
const files = ['index.html', 'styles.css', 'app.js', 'content.js', 'favicon.svg', 'enrichment.js',
  'enrichment-foundations.js', 'enrichment-practice.js', 'extra-resources.js', 'catalog-utils.js',
  'reader.js', 'coverage-view.js', 'research.js', 'coverage.json', 'LICENSE.upstream.txt', 'assets/repository-map.png'];
for (const file of files) {
  const information = await stat(path.join(interview, file));
  assert.ok(information.isFile() && information.size > 0, `002 发布文件缺失或为空：${file}`);
}
const interviewHtml = await readFile(path.join(interview, 'index.html'), 'utf8');
assert.ok(interviewHtml.includes('编程面试'), '002 入口标题丢失');
assert.ok(!interviewHtml.includes('127.0.0.1') && !interviewHtml.includes('localhost'), '002 入口不引用本机地址');

// Check direct assets and module imports without executing the browser app.
let interviewAssets = 0;
async function checkRelative(sourceFile, relative) {
  const target = path.resolve(path.dirname(sourceFile), relative.split(/[?#]/, 1)[0]);
  assert.ok(target.startsWith(interview + path.sep), `002 资源引用越界：${relative}`);
  await access(target);
  interviewAssets++;
}
for (const match of interviewHtml.matchAll(/(?:src|href)=["'](\.[^"']+)["']/g)) {
  if (!match[1].endsWith('/')) await checkRelative(path.join(interview, 'index.html'), match[1]);
}
for (const entry of await readdir(interview, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
  const sourceFile = path.join(interview, entry.name);
  const code = await readFile(sourceFile, 'utf8');
  for (const match of code.matchAll(/^\s*import\s+(?:[^'"\r\n]+?\s+from\s*)?["'](\.[^"']+)["']/gm)) {
    await checkRelative(sourceFile, match[1]);
  }
  if (['app.js', 'research.js', 'reader.js', 'coverage-view.js', 'catalog-utils.js'].includes(entry.name)) {
    for (const match of code.matchAll(/\b(?:import|fetch)\s*\(\s*["'](\.[^"']+)["']/g)) await checkRelative(sourceFile, match[1]);
  }
}
const report = JSON.parse(await readFile(path.join(interview, 'coverage.json'), 'utf8'));
assert.equal(report.checks.passed, true, '002 内容审计必须通过');
assert.equal(report.checks.enrichmentComplete, true, '002 展开内容必须完整');
assert.equal(report.summary.sourcePages, 50, '002 原文页面数应为 50');
assert.equal(report.summary.mappedTopics, 50, '002 中文主题数应为 50');
assert.equal(report.summary.enrichedTopics, 50, '002 展开讲解需覆盖 50 个主题');
assert.equal(report.summary.allUniqueResourceUrls, 209, '002 应保留 209 个去重资源入口');
assert.equal(report.summary.answerRecords, 100, '002 应保留 100 条复习答法');
assert.equal(report.pages.length, 50, '002 覆盖清单需要逐页记录');
assert.ok(report.pages.every(page => page.coverage.enriched && page.coverage.answersMatchQuestions && page.coverage.frontmatterReferencesMatch && page.coverage.bodyReferencesMapped), '002 存在内容或引用未覆盖主题');
const { topics } = await import(pathToFileURL(path.join(interview, 'content.js')).href);
const { topicDetails } = await import(pathToFileURL(path.join(interview, 'enrichment.js')).href);
const { extraResources } = await import(pathToFileURL(path.join(interview, 'extra-resources.js')).href);
assert.equal(topics.length, 50);
assert.equal(Object.keys(topicDetails).length, 50);
assert.equal(new Set([...topics.flatMap(topic => topic.references), ...extraResources].map(reference => reference.url)).size, 209);
assert.equal(Object.values(topicDetails).reduce((count, detail) => count + detail.answers.length, 0), 100);
assert.ok((await readFile(path.join(interview, 'LICENSE.upstream.txt'), 'utf8')).includes('Copyright (c) 2026 Daniel Enriquez'), '002 上游许可与版权必须保留');

const originalMap = await readFile(path.join(ROOT, 'projects/002-interview-guide/assets/repository-map.png'));
const publishedMap = await readFile(path.join(interview, 'assets/repository-map.png'));
assert.ok(publishedMap.equals(originalMap), '002 引导图必须与完整原图逐字节一致');
assert.ok(html.includes('src="./002-interview-guide/assets/repository-map.png"'), '公开首页需要展示 002 完整引导图');
assert.ok(html.includes('href="./002-interview-guide/#research"'), '公开首页需要 002 在线研究入口');
const guideStyle = html.match(/\.guide-frame\{([^}]+)\}/)?.[1] ?? '';
assert.ok(!/max-height|overflow\s*:\s*hidden/.test(guideStyle), '引导图不得通过高度限制裁切');
const metadata = readCatalog().projects.find(project => project.id === '002' && project.slug === 'interview-guide');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
for (const title of ['能力', '模块', '原理', '增强', '价值', '方向', '边界']) {
  const item = metadata?.summaryItems?.find(item => item.title === title);
  assert.ok(item && html.includes(`<strong>${escape(title)}</strong>：${escape(item.text)}`), `002 首页摘要缺少 ${title}`);
}

// AIHOT is a complete static research publication, with its original guide and source evidence.
const aihot = path.join(site, '013-aihot');
const aihotFiles = ['index.html', 'data/research.json', 'data/source-list.json', 'assets/aihot-overview.png', 'assets/aihot-preview.jpg'];
for (const file of aihotFiles) {
  const information = await stat(path.join(aihot, file));
  assert.ok(information.isFile() && information.size > 0, `013 发布文件缺失或为空：${file}`);
}
const aihotHtml = await readFile(path.join(aihot, 'index.html'), 'utf8');
assert.ok(aihotHtml.includes('AIHOT'), '013 入口标题丢失');
assert.ok(!aihotHtml.includes('127.0.0.1') && !aihotHtml.includes('localhost'), '013 入口不引用本机地址');
const aihotResearch = JSON.parse(await readFile(path.join(aihot, 'data/research.json'), 'utf8'));
const aihotSourceList = JSON.parse(await readFile(path.join(aihot, 'data/source-list.json'), 'utf8'));
const aihotSources = aihotSourceList.sources;
assert.ok(Array.isArray(aihotSources), '013 信源资料需要完整 sources 数组');
assert.equal(aihotSources.length, 18, '013 应保留 18 个示范信源');
assert.equal(new Set(aihotSources.map(source => source.id)).size, 18, '013 信源 id 必须唯一');
const aihotOriginalMap = await readFile(path.join(ROOT, 'projects/013-aihot/assets/aihot-overview.png'));
const aihotPublishedMap = await readFile(path.join(aihot, 'assets/aihot-overview.png'));
assert.ok(aihotPublishedMap.equals(aihotOriginalMap), '013 引导图必须与完整原图逐字节一致');
assert.ok(html.includes('href="./013-aihot/assets/aihot-overview.png"'), '公开首页需要 013 完整原图入口');
assert.ok(html.includes('src="./013-aihot/assets/aihot-preview.jpg"'), '公开首页需要展示 013 完整引导图的轻量预览');
assert.ok(html.includes('href="./013-aihot/"'), '公开首页需要 013 在线研究入口');
assert.ok(html.includes('href="./013-aihot/#sources"'), '公开首页需要 013 信源入口');
const aihotMetadata = readCatalog().projects.find(project => project.id === '013' && project.slug === 'aihot');
assert.match(aihotResearch.meta?.commit ?? '', /^[0-9a-f]{40}$/, '013 研究资料需要完整基线提交');
assert.equal(aihotResearch.meta?.upstream, aihotMetadata?.upstream, '013 研究资料与项目索引的上游来源应一致');
assert.ok(Array.isArray(aihotResearch.summaryItems) && aihotResearch.summaryItems.length > 0, '013 研究资料需要完整分项摘要');
assert.deepEqual(aihotMetadata?.summaryItems, aihotResearch.summaryItems, '013 项目索引摘要必须与研究资料逐项一致');
assert.equal(new Set(aihotResearch.summaryItems.map(item => item.title)).size, aihotResearch.summaryItems.length, '013 分项摘要标题必须唯一');
for (const item of aihotResearch.summaryItems) {
  assert.ok(typeof item.title === 'string' && item.title.trim() && typeof item.text === 'string' && item.text.trim(), '013 分项摘要标题与内容不得为空');
  assert.ok(html.includes(`<strong>${escape(item.title)}</strong>：${escape(item.text)}`), `013 首页摘要缺少 ${item.title}`);
}
let aihotAssets = 0;
for (const match of aihotHtml.matchAll(/(?:src|href)=["'](\.[^"']+)["']/g)) {
  const relative = match[1].split(/[?#]/, 1)[0];
  const target = path.resolve(aihot, relative.endsWith('/') ? relative + 'index.html' : relative);
  assert.ok(target.startsWith(site + path.sep), `013 资源引用越界：${relative}`);
  await access(target);
  aihotAssets++;
}
const aihotSections = [
  ['overview', '概览引导图'], ['capabilities', '完整能力'], ['modules', '模块架构'], ['pipeline', '处理原理'],
  ['sources', '18个示范信源'], ['acquisition', '六种获取方式'], ['scenarios', '使用场景'], ['reuse', '复用价值'],
  ['extensions', '扩展方向'], ['limits', '边界与判断'], ['references', '源码证据与研究记录'],
];
for (const [id, title] of aihotSections) {
  assert.ok(aihotHtml.includes(`id="${id}"`), `013 静态章节缺失：${id}`);
  assert.ok(aihotHtml.includes(title), `013 静态章节标题缺失：${title}`);
}
for (const key of ['capabilities', 'modules', 'pipeline', 'acquisition', 'scenarios', 'reuse', 'extensions', 'limits', 'references']) {
  assert.ok(Object.hasOwn(aihotResearch, key), `013 研究 JSON 缺少内容模块：${key}`);
}
// Pascal publishes its complete research route alongside the genuine editor.
const pascal = path.join(site, '003-pascal-editor');
const pascalHtml = await readFile(path.join(pascal, 'overview/index.html'), 'utf8');
const pascalMetadata = readCatalog().projects.find(project => project.id === '003');
for (const item of pascalMetadata.summaryItems) assert.ok(html.includes(`<strong>${escape(item.title)}</strong>：${escape(item.text)}`), `003 首页完整摘要缺少 ${item.title}`);
assert.ok(html.includes('href="./003-pascal-editor/overview/"'), '003 公开入口应直接进入理解页');
assert.ok(html.includes('src="./003-pascal-editor/research/pascal-summary.png"'), '003 首页应使用已有完整引导图');
for (const id of ['capabilities', 'modules', 'principles', 'scenarios', 'value', 'extensions', 'evidence', 'references']) assert.ok(pascalHtml.includes(`id="${id}"`), `003 发布静态正文缺少 ${id}`);
const pascalGuide = await readFile(path.join(pascal, 'research/pascal-summary.png'));
assert.ok(pascalGuide.equals(await readFile(path.join(ROOT, 'projects/003-pascal-editor/assets/pascal-summary.png'))), '003 引导图必须保留原始字节');
const manifest = JSON.parse(await readFile(path.join(pascal, 'demos/asset-manifest.json'), 'utf8'));
assert.equal(manifest.assets.length, 460, '003 原库素材清单应完整保留');
for (const asset of manifest.assets) {
  const target = path.resolve(pascal, asset.file);
  assert.ok(target.startsWith(pascal + path.sep), `003 素材路径越界 ${asset.file}`);
  const bytes = await readFile(target);
  assert.equal(bytes.length, asset.bytes, `003 发布素材大小错误 ${asset.file}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, `003 发布素材校验失败 ${asset.file}`);
}
await access(path.join(pascal, 'index.html'));
await access(path.join(pascal, 'demos/house.json'));
await access(path.join(pascal, 'demos/demo_1.json'));
await access(path.join(pascal, 'research/research.json'));
await access(path.join(pascal, 'research/understanding.md'));
await access(path.join(pascal, 'LICENSE.upstream.txt'));

// Up publishes its complete research with the same original guide and no backend.
const up = path.join(site,'004-up-learning-guide');
const upHtml = await readFile(path.join(up,'index.html'),'utf8');
const upData = JSON.parse(await readFile(path.join(up,'data/content.json'),'utf8'));
const upMetadata = readCatalog().projects.find(project=>project.id==='004');
const upGuideOriginal = await readFile(path.join(ROOT,'projects/004-up-learning-guide/assets/up-core-map.png'));
assert((await readFile(path.join(up,'research/assets/up-core-map.png'))).equals(upGuideOriginal),'004必须保留原引导图字节');
assert.equal(upData.pages.length,97);
assert.equal(upData.worksheets.length,25);
assert.equal(upData.summaryItems.length,11);
assert.equal(upData.understanding.toc.filter(heading=>heading.depth===2).length,10);
for(const item of upMetadata.summaryItems){assert(upHtml.includes(item.text),`004静态网页缺少${item.title}`);assert(html.includes(`<strong>${escape(item.title)}</strong>：${escape(item.text)}`),`004总入口缺少${item.title}`);}
assert(html.includes('src="./004-up-learning-guide/research/assets/up-core-map.png"'),'总入口需要004原引导图');
assert(html.includes('href="./004-up-learning-guide/"'),'总入口需要004理解网页');
for(const file of ['app.js','understanding.mjs','research/UNDERSTANDING.md','research/assets/up-core-map.svg','research/sources/guide-manifest.json','research/licenses/LICENSE-CONTENT.md','research/licenses/LICENSE-CODE.md'])await access(path.join(up,file));
// Three.js publishes the static research and all three playable projects.
const threejs = path.join(site,'005-threejs-game-skills');
const threejsHtml = await readFile(path.join(threejs,'index.html'),'utf8');
const threejsData = JSON.parse(await readFile(path.join(threejs,'data/publication.json'),'utf8'));
const threejsMetadata = readCatalog().projects.find(project=>project.id==='005');
assert.deepEqual(threejsData.summaryItems,threejsMetadata.summaryItems);
assert.deepEqual(threejsData.overviewItems,threejsMetadata.overviewItems);
assert.equal(threejsData.summaryItems.length,12);assert.equal(threejsData.expansionDirections.length,8);
for(const item of threejsData.summaryItems){assert(threejsHtml.includes(escape(item.text)),`005静态摘要缺少${item.title}`);assert(html.includes(`<strong>${escape(item.title)}</strong>：${escape(item.text)}`),`005总入口缺少${item.title}`);}
assert((await readFile(path.join(threejs,'assets/capability-overview-v1.png'))).equals(await readFile(path.join(ROOT,'projects/005-threejs-game-skills/assets/capability-overview-v1.png'))),'005原引导图字节必须保留');
assert(html.includes('src="./005-threejs-game-skills/assets/capability-overview-v1.png"'),'总入口需要005原引导图');
for(const route of ['starter','play','ink'])await access(path.join(threejs,route,'index.html'));
for(const file of ['research.md','LICENSE.upstream.txt','assets/ink-input-run.webm','assets/harbor-input-run.webm'])await access(path.join(threejs,file));
console.log(JSON.stringify({ entrance: 'index.html', sections: sections.length, checkedInternalLinks: links.size,
  threejs:{summaryItems:12,moduleParts:4,expansionDirections:8,playableRoutes:3,originalGuidePreserved:true},
  up:{summaryItems:11,understandingSections:10,pages:97,worksheets:25,originalGuidePreserved:true},
  publishedProjects: publishedDirectories, preservedSandboardPages: sandboardPages.length + 1,
  interview: { requiredFiles: files.length, checkedRelativeAssets: interviewAssets, topics: topics.length,
    resourceUrls: report.summary.allUniqueResourceUrls, answers: report.summary.answerRecords, originalGuidePreserved: true },
  aihot: { requiredFiles: aihotFiles.length, checkedRelativeAssets: aihotAssets, sections: aihotSections.length,
    sources: aihotSources.length, summaryItems: aihotResearch.summaryItems.length, originalGuidePreserved: true },
  pascal: { researchSections: 8, summaryItems: pascalMetadata.summaryItems.length, originalGuidePreserved: true,
    editorPreserved: true, verifiedLibraryAssets: manifest.assets.length } }));

// 006: 静态完整理解、资源和生成原图是本次发布的核心契约。
const easelRoot=path.join(site,'006-easel');
const easelPage=await readFile(path.join(easelRoot,'index.html'),'utf8');
const easelPublication=JSON.parse(await readFile(path.join(easelRoot,'publication.json'),'utf8'));
assert.equal(easelPublication.summaryItems.length,12);
assert.equal(easelPublication.overviewItems.length,6);
assert.equal(easelPublication.flow.length,7);
assert.equal(easelPublication.extensions.length,8);
assert.equal(easelPublication.meta.commit,'fb80ae6dd6fc26f5553efcb293ee6d93ef253f02');
assert.ok(easelPage.includes('data-publication-introduction')&&easelPage.includes('data-system-module')&&easelPage.includes('data-extension'));
const easelMapBytes=await readFile(path.join(easelRoot,'capability-map.png'));
assert.equal(createHash('sha256').update(easelMapBytes).digest('hex'),'41a28113c166c901143ac01abedb05e6ac7a72f5d4b3add507510d615fe35152');
const easelCapabilities=JSON.parse(await readFile(path.join(easelRoot,'capabilities.json'),'utf8'));
assert.equal(easelCapabilities.items.length,114);
for(const resource of ['app.js','research-view.mjs','style.css','publication.css','facts.json','verification.json','publication.json','capability-map-prompt.md','LICENSE.upstream.txt','research.md'])await access(path.join(easelRoot,resource));
assert.ok(html.includes('>Easel</a>'),'006来源链接应使用原库名称');
console.log('006 Easel总入口、完整理解、114技能与原图聚合验证通过。');

// 007: 研究正文完整、索引一致、原始引导图未改变，不发布 Agent 运行后端。
const octogentRoot=path.join(site,'007-octogent');
const octogentPage=await readFile(path.join(octogentRoot,'index.html'),'utf8');
const octogentData=JSON.parse(await readFile(path.join(octogentRoot,'publication.json'),'utf8'));
const octogentMetadata=readCatalog().projects.find(project=>project.id==='007');
assert.deepEqual(octogentData.summaryItems,octogentMetadata.summaryItems);
assert.equal(octogentData.summaryItems.length,12);assert.equal(octogentData.modules.length,8);
assert.equal(octogentData.scenarios.length,6);assert.equal(octogentData.extensions.length,8);
for(const item of octogentMetadata.summaryItems)assert.ok(html.includes(`<strong>${escape(item.title)}</strong>：${escape(item.text)}`),`007总入口摘要缺少${item.title}`);
for(const id of ['summary','overview','capabilities','modules','principles','scenarios','value','reuse','extensions','evidence'])assert.ok(octogentPage.includes(`id="${id}"`),`007静态章节缺少${id}`);
const octogentGuide=await readFile(path.join(octogentRoot,'assets/octogent-understanding-map.png'));
assert.equal(createHash('sha256').update(octogentGuide).digest('hex'),'a630623ede3b9582791f3965eaeb70023a2cb579fb4e781138c5f378e63bc242');
assert.ok(octogentGuide.equals(await readFile(path.join(ROOT,'projects/007-octogent/assets/octogent-understanding-map.png'))));
assert.ok(html.includes('src="./007-octogent/assets/octogent-understanding-map-preview.jpg"'),'007总入口使用已有完整图预览');
for(const file of ['map.html','map.js','app.js','interactive-sections.mjs','publication.css','publication.json','understanding.md','LICENSE.upstream.txt','research.md'])await access(path.join(octogentRoot,file));
console.log('007 Octogent完整摘要、静态正文、原图、研究资料与缩放页聚合验证通过。');

const ghosttrackRoot=path.join(site,'008-ghosttrack');
const ghosttrackPage=await readFile(path.join(ghosttrackRoot,'index.html'),'utf8');
const ghosttrackData=JSON.parse(await readFile(path.join(ghosttrackRoot,'publication.json'),'utf8'));
const ghosttrackMetadata=readCatalog().projects.find(project=>project.id==='008');
assert.deepEqual(ghosttrackData.summaryItems,ghosttrackMetadata.summaryItems);
assert.deepEqual(ghosttrackData.overviewItems,ghosttrackMetadata.overviewItems);
for(const item of ghosttrackMetadata.summaryItems){
 assert.ok(html.includes(`<strong>${escape(item.title)}</strong>：${escape(item.text)}`),`008总入口缺少${item.title}`);
 assert.ok(ghosttrackPage.includes(escape(item.text)),`008静态正文缺少${item.title}`);
}
const ghosttrackGuide=await readFile(path.join(ghosttrackRoot,'assets/ghosttrack-overview.png'));
assert.equal(createHash('sha256').update(ghosttrackGuide).digest('hex'),'e740c55e3b86231aa15e1bd31356c6e593723f6be287bbf37f4c51922d61283c');
assert.ok(ghosttrackGuide.equals(await readFile(path.join(ROOT,'projects/008-ghosttrack/assets/ghosttrack-overview.png'))));
assert.ok(html.includes('src="./008-ghosttrack/assets/ghosttrack-overview.png"'));
for(const file of ['map.html','map.js','map.css','understanding.md','research.md','notes.md','assets/ghosttrack-overview-content.md','assets/ghosttrack-overview.html'])await access(path.join(ghosttrackRoot,file));
console.log('008 GhostTrack完整摘要、正文、既有原图、缩放阅读与下载聚合验证通过。');

// 010 独立审计同样应用于复制后的统一发布产物。
const { auditUnsloth } = await import('../projects/010-unsloth/web/scripts/audit.mjs');
await auditUnsloth(path.join(site,'010-unsloth'));
const unslothMetadata=readCatalog().projects.find(project=>project.id==='010');
for(const item of unslothMetadata.summaryItems)assert.ok(html.includes(`<strong>${escapeIntroduction(item.title)}</strong>：${escapeIntroduction(item.text)}`),`010 总入口缺少摘要 ${item.title}`);
assert.ok(html.includes('src="./010-unsloth/assets/unsloth-overview.png"'),'010 总入口使用已有完整引导图');
assert.ok(html.includes('>unsloth</a>'),'010 来源链接使用原库名');
const {auditCove}=await import('../projects/009-cove/web/scripts/audit.mjs');
await auditCove(path.join(site,'009-cove'));
const coveMetadata=readCatalog().projects.find(project=>project.id==='009');
for(const item of coveMetadata.summaryItems)assert.ok(html.includes('<strong>'+escapeIntroduction(item.title)+'</strong>：'+escapeIntroduction(item.text)),'009 总入口缺少摘要 '+item.title);
assert.ok(html.includes('src="./009-cove/assets/cove-overview.png"'),'009 总入口使用已有完整引导图');
assert.ok(html.includes('>cove</a>'),'009 来源链接使用原库名');

// Validate the exact copied 011 artifact, including its original guide.
const {audit:auditAiToEarn}=await import('../projects/011-aitoearn/web/scripts/audit.mjs');
await auditAiToEarn(path.join(site,'011-aitoearn'));
const {audit:auditHuashu}=await import('../projects/012-huashu-art-motion/web/scripts/audit.mjs');
await auditHuashu(path.join(site,'012-huashu-art-motion'));
const huashuMetadata=readCatalog().projects.find(project=>project.id==='012');
for(const item of huashuMetadata.summaryItems)assert.ok(html.includes('<strong>'+escapeIntroduction(item.title)+'</strong>：'+escapeIntroduction(item.text)),'012 总入口缺少摘要 '+item.title);
assert.ok(html.includes('src="./012-huashu-art-motion/assets/understanding/overview.png"'),'012 总入口必须使用已有完整引导图');
