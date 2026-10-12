// 本项目原创、零第三方依赖：将研究数据生成静态 HTML，保留子路径兼容性。
import { copyFile, cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { meta, capabilities, platforms, sources } from '../content.js';
import * as publication from '../publication.mjs';
import { renderPublication } from './render-publication.mjs';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const project = path.resolve(root, '..');
const output = path.join(root, 'dist');
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
if (capabilities.length !== 4 || new Set(capabilities.map(c => c.id)).size !== 4 || !/^[a-f0-9]{40}$/.test(meta.commit)) throw new Error('能力清单或研究提交不完整。');
const tabs = capabilities.map((c, i) => `<button id="tab-${c.id}" class="cap-tab" type="button" role="tab" aria-selected="${i === 0}" aria-controls="${c.id}" tabindex="${i === 0 ? 0 : -1}" data-capability="${c.id}"><span class="tab-top"><span class="tab-number">${c.number}</span><span class="tab-type">${esc(c.mechanism)}</span></span><span class="tab-title">${esc(c.name)}</span><span class="tab-desc">${esc(c.short)}</span></button>`).join('\n');
const panels = capabilities.map((c, i) => `<article id="${c.id}" class="panel" role="tabpanel" aria-labelledby="tab-${c.id}" tabindex="0" ${i ? 'hidden' : ''}>
  <div class="panel-top"><div class="panel-identity"><b>${esc(c.english)}</b><span class="kind-tag">${esc(c.kind)}</span></div><a href="${esc(c.source)}" target="_blank" rel="noopener noreferrer">${esc(c.function)} · 源码 ${c.lines} 行</a></div>
  <div class="panel-main"><div class="panel-copy"><h3>${esc(c.title)}</h3><p class="panel-intro">${esc(c.intro)}</p><div class="io-row"><span class="io-label">输入</span><span class="io-value">${esc(c.input)}</span></div><div class="io-row"><span class="io-label">输出</span><div class="output-list">${c.output.map(item => `<span>${esc(item)}</span>`).join('')}</div></div><div class="boundary"><p><strong>可以说明</strong>${esc(c.explains)}</p><p><strong>能力边界</strong>${esc(c.cannot)}</p></div><p class="usage"><b>适用场景</b>　${esc(c.use)}</p></div>
  <div class="panel-technical"><p class="technical-label">调用路径</p><div class="flow">${c.flow.map(([label, title, desc]) => `<div class="flow-node"><small>${esc(label)}</small><b>${esc(title)}</b><p>${esc(desc)}</p></div>`).join('')}</div><p class="technical-label">往下看一层：真正的底层技术</p><ol class="tech-list">${c.layers.map(([title, desc], index) => `<li><span class="tech-index" aria-hidden="true">${index + 1}</span><div><h4>${esc(title)}</h4><p>${esc(desc)}</p></div></li>`).join('')}</ol></div></div>
  <div class="panel-bottom"><div class="reading-example"><h4>一个常见的结果解读</h4><p><strong>${esc(c.example[0])}</strong>：${esc(c.example[1])}</p></div><div class="code-note"><h4>源码中的具体局限</h4><p>${esc(c.caveat)}</p><a href="${esc(c.docs[1])}" target="_blank" rel="noopener noreferrer">${esc(c.docs[0])}</a></div></div>
</article>`).join('\n');
const bibliography = sources.map(([title, url, note], i) => `<div class="source-item"><span>${String(i + 1).padStart(2, '0')}</span><div><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a><p>${esc(note)}</p></div></div>`).join('\n');
let html = await readFile(path.join(root, 'index.template.html'), 'utf8');
for (const [marker, value] of [...Object.entries(renderPublication()), ['CAPABILITY_TABS', tabs], ['CAPABILITY_PANELS', panels], ['PLATFORMS', platforms.map(p => `<span>${esc(p)}</span>`).join('')], ['SOURCES', bibliography]]) {
  if (!html.includes(`<!-- ${marker} -->`)) throw new Error(`模板缺失 ${marker}`);
  html = html.replace(`<!-- ${marker} -->`, value);
}
if (/\b(?:src|href)=["']\/(?!\/)/.test(html) || /<!-- (CAPABILITY_|PLATFORMS|SOURCES)/.test(html)) throw new Error('模板未完成或存在域名根路径资源。');
const originalGuide = await readFile(path.join(project, 'assets', publication.guide.file));
if (createHash('sha256').update(originalGuide).digest('hex') !== publication.guide.sha256) throw new Error('原始引导图发生变化。');
const version = createHash('sha256').update(html).update(await readFile(path.join(root,'app.js'))).update(await readFile(path.join(root,'styles.css'))).digest('hex').slice(0,12);
html = html.replace('./styles.css"',`./styles.css?v=${version}"`).replace('./app.js"',`./app.js?v=${version}"`);
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'index.html'), html);
for (const file of ['styles.css', 'app.js', 'map.html', 'map.js', 'map.css']) await copyFile(path.join(root, file), path.join(output, file));
await cp(path.join(project, 'assets'), path.join(output, 'assets'), { recursive: true });
for (const [input, dest] of [['README.md', 'research.md'], ['notes.md', 'notes.md']]) await copyFile(path.join(project, input), path.join(output, dest));
const data = { meta, ...publication, capabilities, platforms, sources };
await writeFile(path.join(output,'publication.json'),JSON.stringify(data,null,2)+'\n');
await copyFile(path.join(project,'UNDERSTANDING.md'),path.join(output,'understanding.md'));
for(const file of ['README.md','UNDERSTANDING.md','PUBLICATION.md']) await copyFile(path.join(project,file),path.join(output,file));
await mkdir(path.join(output,'src'),{recursive:true});
for(const file of await readdir(path.join(project,'src'))) if(file.endsWith('.json')) await copyFile(path.join(project,'src',file),path.join(output,'src',file));
console.log(`GhostTrack 研究网页已构建：${output}；4 项能力，${platforms.length} 个配置平台，${sources.length} 项来源。`);
