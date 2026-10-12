import { mkdir, copyFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
  execFileSync(process.execPath, [path.join(root, 'scripts/audit-content.mjs'), '--require-enrichment'], { stdio: 'pipe' });
} catch (error) {
  process.stderr.write(error.stdout?.toString() ?? error.message);
  throw new Error('内容覆盖审计失败，请先修复报告中的问题。');
}
const { categories, topics, learningPaths, meta } = await import('../content.js');
if (!meta.commit || !topics.length || !categories.length) throw new Error('知识数据缺失。');
const categoryIds = new Set(categories.map(category => category.id));
const topicIds = new Set(topics.map(topic => topic.id));
if (topicIds.size !== topics.length) throw new Error('知识主题 ID 重复。');
for (const topic of topics) {
  if (!categoryIds.has(topic.category) || !topic.title || !topic.sourceUrl || !topic.points?.length) {
    throw new Error(`知识主题不完整：${topic.id}`);
  }
  for (const reference of [{ url: topic.sourceUrl }, ...topic.references]) {
    if (!['https:', 'http:'].includes(new URL(reference.url).protocol)) throw new Error(`非法链接：${reference.url}`);
  }
}
for (const learningPath of learningPaths) {
  for (const step of learningPath.steps) {
    if (step.topicIds.some(id => !topicIds.has(id))) throw new Error(`学习路线引用了不存在的主题：${learningPath.id}`);
  }
}
const snapshot = JSON.parse(await readFile(path.join(root, '../src/upstream-guide.json'), 'utf8'));
const pages = snapshot.pages;
if (snapshot.commit !== meta.commit || !Array.isArray(pages)) throw new Error('研究快照版本或格式不匹配。');
if (pages.length !== topics.length) throw new Error(`上游 ${pages.length} 页与中文 ${topics.length} 主题数量不一致。`);
const sourcePages = new Map(pages.map(page => [page.path, page]));
if (new Set(topics.map(topic => topic.sourcePath)).size !== topics.length) throw new Error('主题对应了重复上游页面。');
for (const topic of topics) {
  const source = sourcePages.get(topic.sourcePath);
  if (!source || JSON.stringify(topic.references) !== JSON.stringify(source.references)) throw new Error(`来源或引用不一致：${topic.id}`);
  if (topic.sourceUrl !== `${meta.repo}/blob/${meta.commit}/${topic.sourcePath}`) throw new Error(`原文入口没有固定到研究提交：${topic.id}`);
}
const destination = path.join(root, 'dist');
await mkdir(destination, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'content.js', 'favicon.svg', 'research.js', 'enrichment.js', 'enrichment-foundations.js', 'enrichment-practice.js', 'extra-resources.js', 'catalog-utils.js', 'reader.js', 'coverage-view.js', 'coverage.json']) {
  await copyFile(path.join(root, file), path.join(destination, file));
}
await mkdir(path.join(destination, 'assets'), { recursive: true });
// 复用既有原图，按原字节复制；网页和生产产物使用同一相对资源路径。
await copyFile(path.join(root, 'assets/repository-map.png'), path.join(destination, 'assets/repository-map.png'));
await copyFile(path.join(root, '../src/LICENSE.upstream'), path.join(destination, 'LICENSE.upstream.txt'));
const report = JSON.parse(await readFile(path.join(root, 'coverage.json'), 'utf8'));
console.log(`审计与构建完成：${topics.length} 个主题，${report.summary.allUniqueResourceUrls} 个资源，${report.summary.enrichmentExamples} 个示例，${report.summary.answerRecords} 个参考答法 → web/dist/`);
