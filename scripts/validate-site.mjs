import { readFile, access, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { ROOT, readCatalog } from './catalog.mjs';

const site = path.resolve(ROOT, '.cache/pages-site');
const html = await readFile(path.join(site, 'index.html'), 'utf8');
assert.ok(html.includes('<title>GitHub 项目研究集</title>'), '公开总入口需要项目研究集标题');
assert.ok(html.includes('>Sandboard</a>'), '来源链接需要显示源库自己的名字');
assert.ok(html.includes('>guia-entrevistas-de-programacion</a>'), '002 来源链接需要显示源库自己的名字');
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
assert.deepEqual(publishedDirectories, ['001-sandboard', '002-interview-guide'], '发布允许名单仅包含 001 与 002');

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
console.log(JSON.stringify({ entrance: 'index.html', sections: sections.length, checkedInternalLinks: links.size,
  publishedProjects: publishedDirectories, preservedSandboardPages: sandboardPages.length + 1,
  interview: { requiredFiles: files.length, checkedRelativeAssets: interviewAssets, topics: topics.length,
    resourceUrls: report.summary.allUniqueResourceUrls, answers: report.summary.answerRecords, originalGuidePreserved: true } }));
