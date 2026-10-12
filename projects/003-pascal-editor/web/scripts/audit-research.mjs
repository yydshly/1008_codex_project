import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = process.argv.includes('--site') ? path.resolve(process.argv[process.argv.indexOf('--site') + 1]) : path.join(root, 'out');
const data = JSON.parse(await readFile(path.join(root, 'app/overview/research.json'), 'utf8'));
const html = await readFile(path.join(output, 'overview/index.html'), 'utf8');
const sections = ['overview-top', 'capabilities', 'modules', 'principles', 'scenarios', 'value', 'extensions', 'evidence', 'references'];
for (const id of sections) assert.ok(html.includes(`id="${id}"`), `静态正文缺少 ${id}`);
const counts = { capabilities: 9, modules: 8, steps: 5, useCases: 6, reuseRoutes: 4, extensions: 8, summaryItems: 10 };
for (const [key, expected] of Object.entries(counts)) assert.equal(data[key].length, expected, `${key} 研究内容缺失`);
for (const item of data.summaryItems) assert.ok(html.includes(item.text), `完整摘要缺少 ${item.title}`);
for (const key of ['capabilities', 'useCases', 'reuseRoutes', 'extensions']) {
  for (const item of data[key]) assert.ok(html.includes(item.title), `无脚本静态正文缺少 ${item.title}`);
}
for (const item of data.modules) assert.ok(html.includes(item.title), `模块缺少 ${item.name}`);
const guide = await readFile(path.join(output, 'research/pascal-summary.png'));
assert.equal(createHash('sha256').update(guide).digest('hex'), data.meta.guide.sha256, '已生成引导图原字节被改变');
assert.equal(guide.readUInt32BE(16), 1536);
assert.equal(guide.readUInt32BE(20), 1024);
for (const file of ['cover.jpg', 'edit-wall.jpg', 'place-item.jpg', 'official.jpg', 'pascal-summary.png']) {
  const original = await readFile(path.join(root, '../assets', file));
  const published = await readFile(path.join(output, 'research', file));
  assert.ok(original.equals(published), `研究图片副本不一致 ${file}`);
}
assert.deepEqual(JSON.parse(await readFile(path.join(output, 'research/research.json'), 'utf8')), data, '研究 JSON 下载与正文源不一致');
const markdown = await readFile(path.join(output, 'research/understanding.md'), 'utf8');
for (const item of data.extensions) assert.ok(markdown.includes(item.verify), `下载全文缺少 ${item.title} 验收`);
const prefix = process.env.PASCAL_BASE_PATH ?? '/1008_codex_project/003-pascal-editor';
const refs = new Set([...html.matchAll(/(?:src|href)="([^"#]+)(?:#[^"]*)?"/g)].map(match => match[1]).filter(ref => ref.startsWith(prefix + '/')));
for (const ref of refs) {
  const local = ref.slice(prefix.length + 1).split('?')[0];
  const target = path.resolve(output, !local || local.endsWith('/') ? local + 'index.html' : local);
  assert.ok(target.startsWith(output + path.sep), `资源越界 ${ref}`);
  await access(target);
}
for (const file of ['index.html', 'demos/house.json', 'demos/demo_1.json', 'demos/asset-manifest.json', 'LICENSE.upstream.txt', 'basis/LICENSE']) await access(path.join(output, file));
console.log(JSON.stringify({ sections: sections.length, counts, checkedReferences: refs.size, guidePreserved: true, guideSHA256: data.meta.guide.sha256, downloadsMatch: true }));
