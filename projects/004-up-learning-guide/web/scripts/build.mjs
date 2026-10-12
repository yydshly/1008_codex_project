// 本地独立静态出版脚本；输入为已完成的研究文档，不复制上游网站程序。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const web = fileURLToPath(new URL('../', import.meta.url));
const project = path.resolve(web, '..');
const dist = path.join(web, 'dist');
await fs.mkdir(path.join(dist, 'data'), { recursive: true });
const readJson = file => fs.readFile(path.join(project, file), 'utf8').then(JSON.parse);
const [inventory, resources, wordLists] = await Promise.all([
  readJson('sources/inventory.json'), readJson('sources/resources.json'), readJson('sources/word-lists.json'),
]);
const guides = [
  ['01-learning-system', '学习系统与方法原理', '先定义任务，再用证据判断改变。', '任务 · 基线 · 反馈 · 迁移', '学习方法'],
  ['02-english', '英语训练与求职协作', '让词汇、听读说写进入真正的沟通任务。', 'CEFR · 六项训练 · 岗位英语', '英语训练'],
  ['03-ai-and-projects', 'AI、项目、创业与评测', '限定工具范围，把想法变为可验收的交付。', 'AI 协作 · 开发 · 创业 · 可靠性', 'AI 与项目'],
  ['04-life-and-long-term', '生活、家庭与长期改变', '把容量、关系和现实责任放进计划。', '经历 · 恢复 · 家庭 · 九十天', '生活与长期'],
  ['05-templates', '全部工作纸使用说明', '选一张表，完成一次真实行动与复查。', '25 张工作纸 · 填写 · 交接', '工作纸'],
  ['06-publishing', '网站与电子书实现', '看清内容如何成为双语网站、EPUB 与 PDF。', 'VitePress · Vue · 出版 · 许可', '实现原理'],
  ['07-glossary-and-resources', '术语、词表与阅读路线', '从眼前的问题找到概念、资料和下一步。', '方法术语 · 技术英语 · 路线', '术语与路线'],
  ['sources', '来源、版本与许可', '原始作者、研究改写、验证范围与复用条件。', '固定版本 · 证据边界 · CC BY-NC', '来源与许可'],
];
const guidePaths = new Map(guides.map(([id]) => [id === 'sources' ? 'SOURCES.md' : `guides/${id}.md`, id]));
const special = { 'sources/coverage.md': '/catalog', 'sources/resources.md': '/resources', 'sources/word-lists.md': '/words', 'README.md': '/overview' };
const plain = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').trim();
const render = (raw, file) => {
  const marked = new Marked({ gfm: true, breaks: false, walkTokens(token) {
    if (token.type !== 'link' || /^(https?:|mailto:|#)/.test(token.href)) return;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), token.href.split('#')[0]));
    if (guidePaths.has(target)) token.href = `#/guide/${guidePaths.get(target)}`;
    else if (special[target]) token.href = `#${special[target]}`;
    else if (!target.startsWith('../')) token.href = `./research/${target}`;
  }});
  let body = raw.replace(/^# .+\r?\n/, '').replace(/^\s*\[[^\n]+\r?\n/, '');
  let html = marked.parse(body);
  const toc = [];
  html = html.replace(/<h([2-6])>([\s\S]*?)<\/h\1>/g, (_, depth, title) => {
    const id = `section-${toc.length + 1}`;
    toc.push({ id, depth: Number(depth), title: plain(title) });
    return `<h${depth} id="${id}">${title}</h${depth}>`;
  }).replace(/<a href="(https?:[^\"]+)"/g, '<a target="_blank" rel="noopener noreferrer" href="$1"');
  const chunks = html.split(/(?=<h[2-6] id=)/).map(chunk => ({ id: chunk.match(/^<h[2-6] id="([^"]+)"/)?.[1] || '',
    title: plain(chunk.match(/^<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/)?.[1] || ''), text: plain(chunk) }));
  return { html, toc, chunks };
};
const documents = await Promise.all(guides.map(async ([id, title, description, tags, label], index) => {
  const file = id === 'sources' ? 'SOURCES.md' : `guides/${id}.md`;
  const raw = await fs.readFile(path.join(project, file), 'utf8');
  return { id, title, description, tags, label, number: index + 1, file, characters: raw.length, ...render(raw, file) };
}));
const toolGuide = documents.find(doc => doc.id === '05-templates');
const toolSectionMap = {
  'learning-state': '01 ·', 'english-diagnostic': '02 ·', 'family-learning-agreement': '03 ·', '90-day-cycle': '04 ·',
  'rhythm-ledger': '05 ·', 'weekly-review': '06 ·', 'evidence-chain': '07 ·', 'reader-field-note': '08 ·',
  'vocabulary-audit': '09 ·', 'grammar-evidence': '10 ·', 'listening-audit': '11 ·', 'reading-evidence': '12 ·',
  'speaking-evidence': '13 ·', 'writing-evidence': '14 ·', 'interview-evidence': '15 ·', 'ai-learning-log': '16 ·',
  'ai-task-brief': '17 ·', 'ai-trend-radar': '18 ·', 'artifact-brief': '19 ·', 'ai-case-review': '20 ·',
  'ai-project-scorecard': '21 ·', 'startup-experiment': '22 ·', 'consistency-plan': '23 ·', 'ai-evaluation': '24 ·',
  'life-practice-toolkit': '25 ·',
};
const worksheets = inventory.items.filter(item => item.source.startsWith('docs/templates/') && !['docs/templates/toolkit.md','docs/templates/toolkit-walkthrough.md'].includes(item.source)).map(item => {
  const stem = path.basename(item.source, '.md');
  const section = toolGuide.toc.find(heading => heading.title.startsWith(toolSectionMap[stem]));
  if (!section) throw new Error(`缺少工作纸阅读入口：${stem}`);
  const number = Number(toolSectionMap[stem].slice(0, 2));
  const category = number <= 4 ? '定位与计划' : number <= 8 ? '节律与证据' : number <= 15 ? '英语训练' : number === 25 ? '生活与恢复' : 'AI 与交付';
  return { ...item, stem, number, category, section: section.id, label: section.title.replace(/^\d+ · /, '') };
}).sort((a,b) => a.number - b.number);
const content = { commit: inventory.commit, researchDate: inventory.researchDate, counts: inventory.counts,
  groups: inventory.groups, pages: inventory.items, guides: documents, worksheets,
  resources: resources.resources, wordLists: wordLists.wordLists };
await fs.writeFile(path.join(dist, 'data/content.json'), JSON.stringify(content), 'utf8');
for (const file of ['index.html', 'app.js', 'styles.css']) await fs.copyFile(path.join(web, file), path.join(dist, file));
for (const directory of ['guides','sources','licenses']) {
  await fs.cp(path.join(project, directory), path.join(dist,'research',directory), { recursive: true });
}
for (const file of ['README.md','SOURCES.md','notes.md']) await fs.copyFile(path.join(project,file), path.join(dist,'research',file));
await fs.mkdir(path.join(dist,'research/web'),{recursive:true});
await fs.copyFile(path.join(web,'README.md'),path.join(dist,'research/web/README.md'));
await fs.cp(path.join(project,'assets'),path.join(dist,'research/assets'),{recursive:true});
console.log(`网页已构建：${documents.length-1}篇专题、${content.pages.length}页目录、${worksheets.length}张工作纸、${content.counts.wordListEntries}个词条、${content.resources.length}个引用链接。`);
