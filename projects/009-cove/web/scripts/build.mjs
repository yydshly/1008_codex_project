// 原创静态构建：研究数据生成正文、交互架构图与独立 SVG，无第三方依赖。
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { meta, source, diagrams, capabilities, principles, scenarios, extensions, directory, versions, references, docs } from '../content.js';
import { createOverviewHtml } from '../overview.js';
import { publication, guide } from '../publication.mjs';
import { renderPublication, renderGuide, renderUnderstanding } from './render-publication.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const project = path.resolve(root, '..');
const out = path.join(root, 'dist');
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const link = (file, label = file) => '<a href="' + esc(source(file)) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>';
const sourceLinks = files => '<div class="source-links">' + files.map(file => link(file)).join('') + '</div>';
const position = (x, y, w, h, d) => 'left:' + (x / d.width * 100) + '%;top:' + (y / d.height * 100) + '%;width:' + (w / d.width * 100) + '%;height:' + (h / d.height * 100) + '%';
if (!/^[a-f0-9]{40}$/.test(meta.commit) || diagrams.length !== 4 || capabilities.length !== 8 || scenarios.length !== 6) throw new Error('研究数据不完整。');
for (const d of diagrams) {
  if (new Set(d.nodes.map(n => n.id)).size !== d.nodes.length) throw new Error('重复模块 ID。');
  for (const n of d.nodes) if (!n.detail || !n.files.length || n.x < 0 || n.y < 0 || n.x + n.w > d.width || n.y + n.h > d.height) throw new Error('模块位置或来源不完整：' + n.id);
}
const tabs = diagrams.map((d, i) => '<button class="diagram-tab" id="tab-' + d.id + '" type="button" role="tab" aria-selected="' + !i + '" aria-controls="diagram-' + d.id + '" tabindex="' + (i ? -1 : 0) + '">' + esc(d.title) + '</button>').join('');
function wires(d, standalone = false) {
  const marker = 'arrow-' + d.id + (standalone ? '-export' : '');
  return '<defs><marker id="' + marker + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" style="fill:#8b9faf;stroke:none"/></marker></defs>' +
    d.edges.map(e => '<path d="' + esc(e.path) + '" class="' + esc(e.kind) + '" marker-end="url(#' + marker + ')" />' + (e.label ? '<text x="' + e.x + '" y="' + e.y + '" text-anchor="middle">' + esc(e.label) + '</text>' : '')).join('');
}
function renderDiagram(d, index) {
  const groups = d.groups.map(([x,y,w,h,label,kind]) => '<div class="diagram-group ' + kind + '" style="' + position(x,y,w,h,d) + '"><span class="diagram-group-label">' + esc(label) + '</span></div>').join('');
  const buttons = d.nodes.map((n,i) => '<button class="diagram-node ' + n.kind + '" type="button" style="' + position(n.x,n.y,n.w,n.h,d) + '" aria-pressed="' + !i + '" aria-controls="detail-' + d.id + '-' + n.id + '"><b>' + esc(n.title) + '</b><span>' + esc(n.subtitle) + '</span></button>').join('');
  const details = d.nodes.map((n,i) => '<div class="node-detail" id="detail-' + d.id + '-' + n.id + '" ' + (i ? 'hidden' : '') + '><div><span class="detail-kind">' + (n.kind === 'attach' ? '已有中间件 · 需要挂载' : '模板模块 · 源码已核对') + '</span><h4>' + esc(n.title) + '</h4></div><div><p>' + esc(n.detail) + '</p>' + sourceLinks(n.files) + '</div></div>').join('');
  return '<article class="diagram-panel" id="diagram-' + d.id + '" role="tabpanel" aria-labelledby="tab-' + d.id + '" ' + (index ? 'hidden' : '') + '><div class="diagram-heading"><div><h3>' + esc(d.title) + '</h3><p>' + esc(d.caption) + '</p></div><a href="./assets/architecture-' + d.id + '.svg" download>下载 SVG 图</a></div><div class="diagram-scroll" tabindex="0" aria-label="' + esc(d.title) + '，窄屏可横向滚动"><div class="diagram-stage" style="--diagram-height:' + d.height + '">' + groups +
    '<svg class="diagram-wires" aria-hidden="true" viewBox="0 0 ' + d.width + ' ' + d.height + '">' + wires(d) + '</svg>' + buttons + '</div></div><div class="diagram-legend">' + d.notes.map(note => '<span>' + esc(note) + '</span>').join('') + '</div>' + details + '</article>';
}
function exportDiagram(d) {
  const colors = { browser:['#f1f6fb','#d7e2eb'],server:['#edf7f4','#c8e4db'],data:['#f4f2fa','#dbd7e9'] };
  const groups = d.groups.map(([x,y,w,h,label,kind]) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="' + colors[kind][0] + '" stroke="' + colors[kind][1] + '"/><text x="' + (x+16) + '" y="' + (y+23) + '" class="group-label">' + esc(label) + '</text>').join('');
  const nodes = d.nodes.map(n => '<a href="' + esc(source(n.files[0])) + '"><rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="7" fill="white" stroke="#b7c9d7" ' + (n.kind === 'attach' ? 'stroke-dasharray="5 4"' : '') + '/><text x="' + (n.x+14) + '" y="' + (n.y+n.h/2-2) + '" class="node-title">' + esc(n.title) + '</text><text x="' + (n.x+14) + '" y="' + (n.y+n.h/2+20) + '" class="node-sub">' + esc(n.subtitle) + '</text><title>' + esc(n.detail) + '</title></a>').join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + d.width + '" height="' + (d.height+120) + '" viewBox="0 0 ' + d.width + ' ' + (d.height+120) + '" role="img" aria-labelledby="title desc"><title id="title">Cove：' + esc(d.title) + '</title><desc id="desc">' + esc(d.caption) + '。固定提交 ' + meta.commit + '；原创源码解读。</desc><style>text{font-family:"Microsoft YaHei","Segoe UI",sans-serif;fill:#152438}.group-label{font-size:13px;fill:#637286}.node-title{font-size:15px;font-weight:600}.node-sub{font-size:12px;fill:#607187}path{fill:none;stroke:#8b9faf;stroke-width:1.6}path.dashed{stroke-dasharray:5 4}path+text{font-size:12px;fill:#587080;paint-order:stroke;stroke:white;stroke-width:4px}.title{font-size:24px;font-weight:700}.caption{font-size:14px;fill:#56667a}</style><rect width="100%" height="100%" fill="white"/><text class="title" x="25" y="35">Cove · ' + esc(d.title) + '</text><text class="caption" x="25" y="64">' + esc(d.caption) + '</text><g transform="translate(0 80)">' + groups + wires(d,true) + nodes + '</g><text class="caption" x="25" y="' + (d.height+108) + '">研究 009 · 2026-10-09 · e7d40d5 · 实线为已有关系；虚线为需要接入的中间件</text></svg>';
}
const overviewRender = JSON.parse(await readFile(path.join(project,'assets','cove-overview-render.json'),'utf8'));
const overviewHtml = createOverviewHtml(exportDiagram(diagrams[0]));
const blocks = {
  ...renderPublication(),
  SUMMARY_FIGURE: renderGuide(overviewRender),
  DIAGRAM_TABS: tabs, DIAGRAMS: diagrams.map(renderDiagram).join(''),
  CAPABILITIES: capabilities.map(c => '<article class="cap-card"><div class="cap-top"><h3>' + esc(c.title) + '</h3><span>' + esc(c.status) + '</span></div><p class="cap-tech">' + esc(c.tech) + '</p><p>' + esc(c.text) + '</p><p class="cap-boundary"><b>还需要明确的边界</b>' + esc(c.boundary) + '</p>' + sourceLinks(c.files) + '</article>').join(''),
  PRINCIPLES: principles.map(([title,text,files],i) => '<article class="principle"><span class="principle-number">' + String(i+1).padStart(2,'0') + '</span><div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + sourceLinks(files) + '</div></article>').join(''),
  SCENARIOS: scenarios.map(c => '<article class="scenario"><span class="fit">' + esc(c.fit) + '</span><h3>' + esc(c.title) + '</h3><p class="examples">' + esc(c.examples) + '</p><p>' + esc(c.why) + '</p><p class="add"><b>继续开发</b>' + esc(c.add) + '</p></article>').join(''),
  FILES: directory.map(([file,role,text]) => '<tr><td>' + (file.includes(' 与 ') ? link('.agents/') + ' / ' + link('AGENTS.md') : link(file)) + '</td><td>' + esc(role) + '</td><td>' + esc(text) + '</td></tr>').join(''),
  VERSIONS: versions.map(([name,version]) => '<div class="version"><b>' + esc(name) + '</b><code>' + esc(version) + '</code></div>').join(''),
  SOURCES: references.map(([file,note]) => '<div class="source-entry">' + link(file) + '<p>' + esc(note) + '</p></div>').concat(docs.map(([title,url,note]) => '<div class="source-entry"><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(title) + '</a><p>' + esc(note) + '</p></div>')).join(''),
};
let html = await readFile(path.join(root,'index.template.html'),'utf8');
for (const [key,value] of Object.entries(blocks)) {
  const marker = '<!-- ' + key + ' -->';
  if (!html.includes(marker)) throw new Error('缺少标记：' + key);
  html = html.replace(marker,value);
}
if (/<!-- [A-Z_]+ -->/.test(html) || /\b(?:src|href)=["']\/(?!\/)/.test(html)) throw new Error('未替换内容或绝对根路径资源。');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
if (new Set(ids).size !== ids.length) throw new Error('重复 HTML ID。');
for (const m of html.matchAll(/\b(?:aria-controls|aria-labelledby)="([^"]+)"/g)) for (const id of m[1].split(' ')) if (!ids.includes(id)) throw new Error('失效的可访问性关系：' + id);
await mkdir(path.join(out,'assets'),{recursive:true});
for (const d of diagrams) {
  const svg = exportDiagram(d);
  await writeFile(path.join(project,'assets','architecture-' + d.id + '.svg'),svg);
  await writeFile(path.join(out,'assets','architecture-' + d.id + '.svg'),svg);
}
if (createHash('sha256').update(overviewHtml).digest('hex') !== overviewRender.sourceSha256) throw new Error('总览图内容已变化：运行 npm run figure:source，再运行 scripts/render-overview.mjs 重新生成 PNG。');
const overviewPng = await readFile(path.join(project,'assets','cove-overview.png'));
if (createHash('sha256').update(overviewPng).digest('hex') !== overviewRender.outputSha256 || overviewPng.readUInt32BE(16) !== overviewRender.width || overviewPng.readUInt32BE(20) !== overviewRender.height) throw new Error('总览图 PNG 与生成记录不一致。');
await writeFile(path.join(project,'assets','cove-overview.html'),overviewHtml);
await writeFile(path.join(out,'assets','cove-overview.html'),overviewHtml);
for (const file of ['cove-overview.png','cove-overview-render.json']) await copyFile(path.join(project,'assets',file),path.join(out,'assets',file));
for (const file of ['styles.css','app.js']) {
  const version=createHash('sha256').update(await readFile(path.join(root,file))).digest('hex').slice(0,12);
  html=html.replace('./'+file,'./'+file+'?v='+version);
}
await writeFile(path.join(out,'index.html'),html);
for (const file of ['styles.css','app.js','map.html','map.js','map.css']) await copyFile(path.join(root,file),path.join(out,file));
await writeFile(path.join(out,'publication.json'),JSON.stringify(publication,null,2)+'\n');
await writeFile(path.join(project,'understanding.md'),renderUnderstanding());
await copyFile(path.join(project,'understanding.md'),path.join(out,'understanding.md'));
await copyFile(path.join(project,'assets','verification.json'),path.join(out,'assets','verification.json'));
if(overviewPng.length!==guide.bytes || createHash('sha256').update(overviewPng).digest('hex')!==guide.sha256)throw new Error('已有引导图原始字节发生变化。');
await copyFile(path.join(project,'assets','favicon.svg'),path.join(out,'assets','favicon.svg'));
for (const [input,output] of [['README.md','research.md'],['notes.md','notes.md'],['src/LICENSE.upstream.txt','LICENSE.upstream.txt'],['src/source-manifest.json','source-manifest.json']]) await copyFile(path.join(project,input),path.join(out,output));
console.log('Cove 研究页已构建：' + out);
console.log('1 张完整高清总览；4 张交互架构图；' + diagrams.reduce((sum,d) => sum+d.nodes.length,0) + ' 个模块；8 类能力；6 类场景；8 个扩展方向；完整摘要与价值复用。');
