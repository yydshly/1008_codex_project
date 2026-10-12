// 原创静态生成器；网页本身没有第三方依赖。
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { meta, sources, methods, capabilities, principles, scenarios, faqs } from '../content.js';
import { publication, guide } from '../publication.mjs';
import { renderPublication, renderUnderstanding } from './render-publication.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sourceMap = new Map(sources.map(s => [s.id, s]));
const cite = id => {
  const s = sourceMap.get(id);
  if (!s) throw new Error(`来源不存在：${id}`);
  return `<a class="cite" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} <span aria-hidden="true">↗</span></a>`;
};
if (!/^[a-f0-9]{40}$/.test(meta.commit) || sourceMap.size !== sources.length) throw new Error('提交或来源标识无效');
const blocks = {
  ...renderPublication(cite),
  METHODS: methods.map(m => `<tr><th scope="row">${esc(m[0])}</th><td>${esc(m[1])}</td><td>${esc(m[2])}</td><td>${esc(m[3])}</td><td>${esc(m[4])}${cite(m[5])}</td></tr>`).join(''),
  CAPABILITIES: capabilities.map(c => `<article class="capability"><div class="card-top"><span>${c.n}</span><span class="badge">${esc(c.tag)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.desc)}</p><p class="example">${esc(c.example)}</p>${cite(c.source)}</article>`).join(''),
  PRINCIPLE_TABS: principles.map((p, i) => `<button type="button" id="tab-${p.id}" role="tab" aria-controls="principle-${p.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-principle="${p.id}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(p.name)}</button>`).join(''),
  PRINCIPLES: principles.map(p => `<article id="principle-${p.id}" class="principle-panel" role="tabpanel" aria-labelledby="tab-${p.id}" tabindex="0"><div class="eyebrow">${esc(p.label)}</div><h3>${esc(p.title)}</h3><p class="intro">${esc(p.intro)}</p><ol class="mechanism-flow">${p.steps.map(([title, text], i) => `<li><span class="step-no">${i + 1}</span><div><h4>${esc(title)}</h4><p>${esc(text)}</p></div></li>`).join('')}</ol><div class="effect"><b>带来的收益</b><p>${esc(p.effect)}</p></div><p class="small-note">${esc(p.detail)}</p>${cite(p.source)}</article>`).join(''),
  SCENARIO_TABS: scenarios.map((s, i) => `<button type="button" id="scenario-tab-${s.id}" role="tab" aria-controls="scenario-${s.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-scenario="${s.id}">${esc(s.title)}</button>`).join(''),
  SCENARIOS: scenarios.map(s => `<article id="scenario-${s.id}" class="scenario-panel" role="tabpanel" aria-labelledby="scenario-tab-${s.id}" tabindex="0"><span class="badge green">${esc(s.category)}</span><h3>${esc(s.method)}</h3><p>${esc(s.goal)}</p><div class="scenario-flow">${s.path.map((p, i) => `<div><span>0${i + 1}</span><b>${esc(p)}</b></div>`).join('')}</div><div class="scenario-columns"><div><h4>需要准备</h4><p>${esc(s.input)}</p></div><div><h4>例子</h4><p>${esc(s.example)}</p></div></div><div class="boundary-note"><b>选用前需要确认</b><p>${esc(s.caution)}</p></div></article>`).join(''),
  FAQS: faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join(''),
  SOURCES: sources.map((s, i) => `<article id="source-${s.id}" class="source-item"><span class="source-no">${String(i + 1).padStart(2, '0')}</span><div><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><p>${esc(s.note)}</p><small>${esc(s.type)}</small></div></article>`).join(''),
};
let html = await readFile(path.join(root, 'index.template.html'), 'utf8');
for (const [key, value] of Object.entries(blocks)) {
  const marker = `<!-- ${key} -->`;
  if (!html.includes(marker)) throw new Error(`缺失模板区域：${key}`);
  html = html.replace(marker, value);
}
if (/<!-- [A-Z_]+ -->/.test(html)) throw new Error('未完成模板替换');
if (/\b(?:src|href)=["']\/(?!\/)/.test(html)) throw new Error('存在指向域名根路径的资源');
await mkdir(output, { recursive: true });
for (const name of ['styles.css', 'app.js']) {
  const version = createHash('sha256').update(await readFile(path.join(root,name))).digest('hex').slice(0,12);
  html = html.replace(`./${name}`, `./${name}?v=${version}`);
}
await writeFile(path.join(output, 'index.html'), html);
for (const name of ['styles.css', 'app.js', 'favicon.svg', 'map.html', 'map.js', 'map.css']) await copyFile(path.join(root, name), path.join(output, name));
await writeFile(path.join(output, 'sources.json'), JSON.stringify({ meta, sources }, null, 2) + '\n');
await writeFile(path.join(output, 'publication.json'), JSON.stringify(publication, null, 2) + '\n');
await writeFile(path.join(output, 'understanding.md'), renderUnderstanding());
await copyFile(path.resolve(root, '..', 'verification.json'), path.join(output, 'verification.json'));
for (const [from, to] of [['README.md', 'research.md'], ['notes.md', 'notes.md']]) await copyFile(path.resolve(root, '..', from), path.join(output, to));
await mkdir(path.join(output, 'assets'), { recursive: true });
for (const name of ['cover.png', 'mobile.png', 'unsloth-overview.png', 'unsloth-overview.html', 'unsloth-overview-content.md', 'unsloth-overview-prompt.txt', 'unsloth-overview-imagegen-attempt.txt', 'unsloth-overview-generation.json']) await copyFile(path.resolve(root, '..', 'assets', name), path.join(output, 'assets', name));
const image = await readFile(path.join(output, 'assets', guide.file));
if (image.length !== guide.bytes || image.readUInt32BE(16) !== guide.width || image.readUInt32BE(20) !== guide.height || createHash('sha256').update(image).digest('hex') !== guide.sha256) throw new Error('已有引导图的原始字节发生变化');
console.log(`Unsloth 中文研究页：${output}；${methods.length} 种处理，${principles.length} 个机制，${scenarios.length} 个场景，${sources.length} 项来源。`);
