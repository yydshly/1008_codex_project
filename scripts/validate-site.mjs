import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { ROOT } from './catalog.mjs';

const site = path.resolve(ROOT, '.cache/pages-site');
const html = await readFile(path.join(site, 'index.html'), 'utf8');
assert.ok(html.includes('>Sandboard</a>'), '来源链接需要显示源库自己的名字');
assert.ok(!html.includes('127.0.0.1') && !html.includes('localhost'), '公开入口不引用本机地址');
const sections = ['源库的能力与底层原理', '我们的探索与实际输入输出', '使用场景与研究价值', '可扩展产品方向与推进顺序', '当前边界与失败结论'];
for (const title of sections) assert.ok(html.includes(title), `缺少说明：${title}`);
const links = new Set([...html.matchAll(/(?:src|href)="(\.\/[^"#]+)(?:#[^"]*)?"/g)].map(match => match[1]));
for (const link of links) {
  const local = path.resolve(site, link.endsWith('/') ? link + 'index.html' : link);
  assert.ok(local.startsWith(site + path.sep), `链接越界：${link}`);
  await access(local);
}
console.log(JSON.stringify({ entrance: 'index.html', sections: sections.length, checkedInternalLinks: links.size, sourceLabel: 'Sandboard' }));
