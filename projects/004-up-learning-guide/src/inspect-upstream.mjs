// 独立研究脚本；不执行上游构建、不修改上游文件。
// 来源与使用方式见 ../SOURCES.md。仅依赖 Node.js 标准库。
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const upstreamRoot = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(upstreamRoot, 'docs/.vitepress/navigation.mjs'))) {
  throw new Error('用法：node src/inspect-upstream.mjs <上游 checkout 绝对路径>');
}
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstreamRoot, encoding: 'utf8' }).trim();
const expectedCommit = '35e2aa9ad3a076fe4e8405877cc560df2593838f';
if (commit !== expectedCommit) throw new Error(`研究版本不符：预期 ${expectedCommit}，实际 ${commit}`);
const { zhNavigation, enNavigation, publicationSections } = await import(
  pathToFileURL(path.join(upstreamRoot, 'docs/.vitepress/navigation.mjs')).href
);
const flatten = groups => groups.flatMap(group => group.items.map(page => ({ ...page, group: group.text })));
const zh = flatten(zhNavigation);
const en = flatten(enNavigation);
if (zh.length !== en.length) throw new Error('中英文页面数量不一致');
const hash = text => createHash('sha256').update(text).digest('hex');
const withoutCode = text => text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
  .replace(/^(?:```|~~~)[\s\S]*?^(?:```|~~~)[^\n]*$/gm, '');
const referenceMap = new Map();
const items = zh.map((page, index) => {
  const source = `docs/${page.source}`;
  const counterpart = `docs/${en[index].source}`;
  if (counterpart !== `docs/en/${page.source}`) throw new Error(`中英文路径未配对：${source} / ${counterpart}`);
  const text = fs.readFileSync(path.join(upstreamRoot, source), 'utf8');
  const englishText = fs.readFileSync(path.join(upstreamRoot, counterpart), 'utf8');
  const clean = withoutCode(text);
  for (const match of clean.matchAll(/\[([^\]\n]*)\]\((https?:\/\/[^\s)]+)(?:\s+[^)]*)?\)/g)) {
    const [, label, url] = match;
    const entry = referenceMap.get(url) || { url, labels: [], citedBy: [], verifiedInThisResearch: false };
    if (label && !entry.labels.includes(label)) entry.labels.push(label);
    if (!entry.citedBy.includes(source)) entry.citedBy.push(source);
    referenceMap.set(url, entry);
  }
  return {
    order: index + 1, group: page.group, title: page.text, source, counterpart,
    sourceUrl: `https://github.com/byoungd/up/blob/${commit}/${source}`,
    englishUrl: `https://github.com/byoungd/up/blob/${commit}/${counterpart}`,
    onlineUrl: `https://byoungd.github.io/up${page.link}`,
    updated: text.match(/^updated:\s*(.+)$/m)?.[1]?.trim() || null,
    sourcesChecked: text.match(/^sources_checked:\s*(.+)$/m)?.[1]?.trim() || null,
    characters: text.length, sha256: hash(text), englishSha256: hash(englishText),
    headings: [...clean.matchAll(/^(#{1,6})\s+(.+)$/gm)].map(match => ({ level: match[1].length, title: match[2].trim() })),
  };
});
const resources = [...referenceMap.values()].sort((a, b) => a.url.localeCompare(b.url));
const summaries = JSON.parse(fs.readFileSync(path.join(projectRoot, 'sources/summaries.json'), 'utf8'));
const missing = items.filter(item => !summaries[item.source]);
if (missing.length) throw new Error(`缺少逐页摘要：${missing.map(item => item.source).join(', ')}`);
const extras = Object.keys(summaries).filter(source => !items.some(item => item.source === source));
if (extras.length) throw new Error(`摘要包含目录外页面：${extras.join(', ')}`);
for (const item of items) {
  const entry = summaries[item.source];
  if (!entry.summary?.trim() || !fs.existsSync(path.join(projectRoot, entry.guide))) {
    throw new Error(`摘要或汇总文档不存在：${item.source}`);
  }
  item.summary = entry.summary;
  item.guide = entry.guide;
}
const inventory = {
  upstream: 'https://github.com/byoungd/up', commit, researchDate: '2026-10-09',
  scope: '当前导航的全部中文页面及英文对应文件；英文不作为第二套独立知识重复计数。',
  counts: { chinesePages: zh.length, englishPages: en.length,
    publicationPagesPerLanguage: publicationSections(zhNavigation).flatMap(group => group.items).length,
    worksheetPairs: zh.filter(page => page.source.startsWith('templates/') && !['templates/toolkit.md', 'templates/toolkit-walkthrough.md'].includes(page.source)).length,
    uniqueExternalMarkdownLinks: resources.length },
  groups: zhNavigation.map(group => ({ title: group.text, pages: group.items.length })), items,
};
const write = (name, value) => fs.writeFileSync(path.join(projectRoot, 'sources', name), value, 'utf8');
const wordLists = items.filter(item => item.source.startsWith('docs/threads/word-list/')).map(item => {
  const raw = withoutCode(fs.readFileSync(path.join(upstreamRoot, item.source), 'utf8'));
  const body = raw.trim().replace(/^# .+\r?\n/, '').split('本页是查阅清单')[0];
  const terms = body.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!terms.length || terms.some(term => term.startsWith('#'))) throw new Error(`词表提取异常：${item.source}`);
  return { title: item.title, source: item.source, sourceUrl: item.sourceUrl, terms };
});
inventory.counts.wordListEntries = wordLists.reduce((total, list) => total + list.terms.length, 0);
inventory.counts.uniqueWordListTerms = new Set(wordLists.flatMap(list => list.terms)).size;
write('inventory.json', `${JSON.stringify(inventory, null, 2)}\n`);
write('word-lists.json', `${JSON.stringify({ commit, attribution: 'byoungd and contributors',
  license: 'CC BY-NC 4.0', changes: '按导航提取原始词条，改为分组附录；不增补逐词定义。', wordLists }, null, 2)}\n`);
let words = '# 十组技术英语词表：完整词条附录\n\n[返回概览](../README.md) · [使用方式](../guides/07-glossary-and-resources.md) · [来源与许可](../SOURCES.md)\n\n';
words += `共 ${wordLists.length} 组、${inventory.counts.wordListEntries} 个分组词条；跨组去重为 ${inventory.counts.uniqueWordListTerms} 个。重复术语保留其领域语境。原始作者：byoungd and contributors；内容许可 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)。改动：从固定提交提取词条并重排为附录，未增加释义或学习效果主张。\n\n`;
for (const list of wordLists) {
  words += `## ${list.title}（${list.terms.length} 项）\n\n[固定来源](${list.sourceUrl})\n\n`;
  words += list.terms.map(term => `- ${term}`).join('\n') + '\n\n';
}
write('word-lists.md', words);
write('resources.json', `${JSON.stringify({ upstream: inventory.upstream, commit, researchDate: inventory.researchDate,
  note: '保留上游中文正文 Markdown 外链、标签与所在页面。只核对上游引用存在，未逐一访问外站；含论文、官方文档、产品及作者关联入口，不表示推荐或当前可用。HTML 外链与图片权属另见上游 ATTRIBUTIONS.md。', resources }, null, 2)}\n`);
let coverage = '# 完整内容目录与逐页摘要\n\n[返回概览](../README.md) · [研究来源](../SOURCES.md)\n\n';
coverage += `研究提交：\`${commit}\`。覆盖 ${zh.length} 个中文导航页面及 ${en.length} 个英文对应文件；当前导航选择的出版源页为每种语言 ${inventory.counts.publicationPagesPerLanguage} 页。逐页摘要是本研究的中文改写，详细知识见各专题。\n\n`;
for (const group of zhNavigation) {
  coverage += `## ${group.text}（${group.items.length} 页）\n\n`;
  for (const page of group.items) {
    const item = items.find(item => item.source === `docs/${page.source}`);
    coverage += `### ${String(item.order).padStart(2, '0')} · ${item.title}\n\n`;
    coverage += `${item.summary}\n\n[固定版本原文](${item.sourceUrl}) · [英文对应](${item.englishUrl}) · [本地专题](../${item.guide})\n\n`;
  }
}
write('coverage.md', coverage);
let refs = '# 上游引用资源索引\n\n[返回概览](../README.md) · [来源与许可](../SOURCES.md)\n\n';
refs += `共 ${resources.length} 个去重 Markdown 外链。核查范围为上游引用存在，未把原文的来源核验日期更新为本研究日期，也未逐一验证外站内容。资源入口按来源域名排列；关联商业入口和历史资源均保留其语境。\n\n`;
for (const resource of resources) {
  const label = resource.labels[0] || new URL(resource.url).hostname;
  refs += `- [${label.replaceAll('[', '(').replaceAll(']', ')')}](${resource.url}) — ${resource.citedBy.map(source => `[${source.replace('docs/', '')}](https://github.com/byoungd/up/blob/${commit}/${source})`).join('、')}\n`;
}
write('resources.md', refs);
console.log(JSON.stringify(inventory.counts, null, 2));
console.log('逐页摘要、来源哈希、英文对应与本地专题路径检查通过。');
