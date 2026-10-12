// 本项目原创构建脚本。资产来自固定提交的 Octogent，保留许可及来源说明。
import { cp, copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { meta, screens, layers, stages } from '../content.js';
import { renderInteractiveSections } from '../interactive-sections.mjs';
import { publicationMeta, makePublication, renderIntroduction, renderPublication, renderUnderstanding } from '../publication.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const project = path.resolve(root, '..');
const dest = path.join(root, 'dist');
const catalog = JSON.parse(await readFile(path.resolve(project, '../../projects.json'), 'utf8'));
const entry = catalog.projects.find(entry => entry.id === '007');
if (!entry?.summaryItems?.length || !entry?.overviewItems?.length) throw new Error('007 完整摘要及图前介绍缺失');
const guide = await readFile(path.join(project, publicationMeta.guide.file));
if (createHash('sha256').update(guide).digest('hex') !== publicationMeta.guide.sha256) throw new Error('引导图原始字节已改变');
if (!/^[a-f0-9]{40}$/.test(meta.commit) || screens.length !== 6) throw new Error('研究版本或截图清单不完整');
for (const screen of screens) if ((await stat(path.join(project, 'assets', screen.image))).size < 1000) throw new Error('截图缺失');
for (const asset of ['octogent-understanding-map.png', 'octogent-understanding-map.svg', 'octogent-understanding-map-preview.jpg', 'octogent-understanding-map-content.md', 'octogent-understanding-map-layout.json']) await stat(path.join(project, 'assets', asset));
let html = await readFile(path.join(root, 'index.html'), 'utf8');
if (/\b(?:src|href)="\/assets\//.test(html)) throw new Error('资源必须支持部署子路径');
await mkdir(dest, { recursive: true });
for (const file of ['styles.css', 'app.js', 'content.js', 'map.html', 'map.css', 'map.js', 'publication.css', 'interactive-sections.mjs', 'publication.mjs']) await copyFile(path.join(root, file), path.join(dest, file));
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
let interactive = renderInteractiveSections()
  .replace('id="stage-title"></h3>', `id="stage-title">${escape(stages[0].title)}</h3>`)
  .replace('id="stage-explanation"></p>', `id="stage-explanation">${escape(stages[0].explanation)}</p>`);
const layer = layers[0];
interactive = interactive.replace('<div class="layer-detail" id="layer-detail" role="tabpanel"></div>', `<div class="layer-detail" id="layer-detail" role="tabpanel" aria-labelledby="layer-tab-0"><p class="eyebrow">${escape(layer.technology)}</p><h3>${escape(layer.title)}</h3><p>${escape(layer.text)}</p><pre><code>${escape(layer.example)}</code></pre></div>`);
html = html.replace('<!-- PUBLICATION_INTRODUCTION -->', renderIntroduction(entry))
  .replace('<div id="research-sections"></div>', `<div id="research-sections">${interactive}</div>`)
  .replace('<!-- PUBLICATION_DETAILS -->', renderPublication());
html = html.replace('</main>', '<noscript><p class="wrap source-note">完整研究、引导图、能力与来源可直接阅读；截图切换、协作预设播放和缩放控件需要 JavaScript。高清 PNG 和 SVG 可以直接打开。</p></noscript></main>');
await writeFile(path.join(dest, 'index.html'), html);
await writeFile(path.join(dest, 'publication.json'), JSON.stringify(makePublication(entry), null, 2)+'\n');
await writeFile(path.join(dest, 'understanding.md'), renderUnderstanding(entry));
await writeFile(path.join(project, 'UNDERSTANDING.md'), renderUnderstanding(entry));
await cp(path.join(project, 'assets'), path.join(dest, 'assets'), { recursive: true });
for (const [input, output] of [['README.md', 'research.md'], ['notes.md', 'notes.md'], ['src/LICENSE.upstream', 'LICENSE.upstream.txt'], ['src/verification.json', 'verification.json']]) await copyFile(path.join(project, input), path.join(dest, output));
await copyFile(path.join(project,'src/local-publication-verification.json'),path.join(dest,'local-publication-verification.json'));
// 内容版本避免发布后继续读取旧的脚本或数据；引导图原文件不作改写。
const resources = ['styles.css','app.js','content.js','map.css','map.js','publication.css','interactive-sections.mjs','publication.mjs','assets/octogent-understanding-map-layout.json'];
const releaseHash = createHash('sha256');
for (const file of [...resources,'publication.json']) releaseHash.update(await readFile(path.join(dest,file)));
const releaseVersion = releaseHash.digest('hex').slice(0,12);
const versions = new Map(resources.map(file => [file,releaseVersion]));
for (const file of ['index.html','map.html','app.js','interactive-sections.mjs','map.js']) {
  let code = await readFile(path.join(dest,file),'utf8');
  for (const [resource,version] of versions) code = code.replaceAll(`./${resource}'`,`./${resource}?v=${version}'`).replaceAll(`./${resource}"`,`./${resource}?v=${version}"`);
  await writeFile(path.join(dest,file),code);
}
console.log('Octogent 中文研究页已构建：web/dist/；6 张上游截图、高清全景图及缩放阅读页，资源均使用相对路径。');
