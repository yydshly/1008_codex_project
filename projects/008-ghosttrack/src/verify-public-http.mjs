// 只核验公开研究资源与已发布研究入口，不请求上游查询 API。
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { guide, summaryItems } from '../web/publication.mjs';
import { escape } from '../web/scripts/render-publication.mjs';
const base='https://yydshly.github.io/1008_codex_project/008-ghosttrack/';
const urls=new Set([base,...['map.html','map.js','map.css','styles.css','app.js','publication.json','research.md','understanding.md','README.md','UNDERSTANDING.md','PUBLICATION.md','notes.md','assets/ghosttrack-overview.png','assets/ghosttrack-overview.html','assets/ghosttrack-overview-content.md','assets/ghosttrack-overview-prompt.txt','assets/README.md','assets/cover.png','assets/publication/desktop.png','assets/publication/mobile.png'].map(p=>base+p)]);
const checks=[];
async function read(url){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});const bytes=Buffer.from(await r.arrayBuffer());assert.equal(r.status,200,`资源状态 ${url}`);checks.push({url,status:r.status,bytes:bytes.length,contentType:r.headers.get('content-type')});return bytes;}
const html=(await read(base)).toString();
for(const item of summaryItems)assert(html.includes(escape(item.text)),`公开摘要缺少 ${item.title}`);
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)(?:#[^"]*)?"/g))urls.add(new URL(match[1],base).href);
let mapBytes;
for(const url of urls){if(url===base)continue;const bytes=await read(url);if(url.endsWith(guide.file))mapBytes=bytes;}
assert.equal(createHash('sha256').update(mapBytes).digest('hex'),guide.sha256);
const entrance='https://yydshly.github.io/1008_codex_project/';
const rootHtml=(await read(entrance)).toString();
assert(rootHtml.includes('id="ghosttrack"'));assert(rootHtml.includes('href="./008-ghosttrack/"'));
for(const item of summaryItems)assert(rootHtml.includes(escape(item.text)));
for(const route of ['001-sandboard','002-interview-guide','003-pascal-editor','004-up-learning-guide','005-threejs-game-skills','006-easel','007-octogent','013-aihot'])await read(entrance+route+'/');
const report={date:new Date().toISOString(),base,passed:true,checks,originalGuide:{width:guide.width,height:guide.height,sha256:guide.sha256},summaryItems:summaryItems.length,preservedExistingProjects:8};
await writeFile(fileURLToPath(new URL('./public-http-checks.json',import.meta.url)),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,resources:checks.length,originalGuide:report.originalGuide,preservedExistingProjects:8}));
