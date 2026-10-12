// 发布验收：检查静态正文、索引一致性、原始引导图和三个完整游戏产物。
import { readFile, readdir, stat, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { summaryItems, overviewItems, moduleParts, reuseRoutes, expansionDirections } from '../publication-content.js';
import { overview } from '../extension-content.js';
import { skills, meta } from '../content.js';
const project=fileURLToPath(new URL('../../',import.meta.url));
const built=path.join(project,'web/dist');
const html=await readFile(path.join(built,'index.html'),'utf8');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
assert(!/localhost|127\.0\.0\.1/.test(html),'公开入口不得引用本机地址');
assert.equal(summaryItems.length,12);assert.equal(moduleParts.length,4);assert.equal(reuseRoutes.length,4);assert.equal(expansionDirections.length,8);
for(const item of summaryItems)assert(html.includes(`<h3>${escape(item.title)}</h3><p>${escape(item.text)}</p>`),`静态摘要缺少 ${item.title}`);
for(const list of [moduleParts,reuseRoutes,expansionDirections])for(const item of list)assert(html.includes(escape(item.name??item.title)),`静态内容缺少 ${item.name??item.title}`);
for(const id of ['overview','summary','modules','mechanism','understanding','practice','harbor','showcase','capabilities','tools','boundaries','scenarios','value','extensions'])assert(html.includes(`id="${id}"`),`章节缺失 ${id}`);
const catalog=JSON.parse(await readFile(path.resolve(project,'../../projects.json'),'utf8'));
const metadata=catalog.projects.find(p=>p.id==='005');
assert.deepEqual(metadata.summaryItems,summaryItems,'索引与正文摘要不一致');
assert.deepEqual(metadata.overviewItems,overviewItems,'图前介绍不一致');
assert.equal(metadata.cover,`projects/005-threejs-game-skills/assets/${overview.image}`);
assert.equal(metadata.coverFull,metadata.cover);
const original=await readFile(path.join(project,'assets',overview.image));
const deployed=await readFile(path.join(built,'assets',overview.image));
assert(deployed.equals(original),'原始引导图被改变');
assert.equal(original.readUInt32BE(16),1024);assert.equal(original.readUInt32BE(20),1536);
const guideSha256=createHash('sha256').update(original).digest('hex');
const provenance=JSON.parse(await readFile(path.join(project,'assets/overview/provenance.json'),'utf8'));
assert.equal(guideSha256,provenance.sha256,'引导图与原记录不一致');
assert.equal(skills.length,9);assert.match(meta.commit,/^[0-9a-f]{40}$/);
let references=0;
for(const relative of new Set([...html.matchAll(/(?:src|href)="(\.\/[^"#]+)(?:#[^"]*)?"/g)].map(m=>m[1]))){
  const target=path.resolve(built,relative.endsWith('/')?relative+'index.html':relative.split(/[?#]/,1)[0]);
  assert(target.startsWith(built+path.sep),'资源越界');await access(target);references++;
}
for(const file of ['app.js','extensions.js','content.js','extension-content.js']){
  const code=await readFile(path.join(built,file),'utf8');
  for(const match of code.matchAll(/(?:from|import)\s*['"](\.\/[^'"]+)['"]/g))await access(path.join(built,match[1]));
}
for(const game of ['starter','play','ink']){
  const gameHtml=await readFile(path.join(built,game,'index.html'),'utf8');
  for(const match of gameHtml.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))await access(path.resolve(built,game,match[1]));
  assert((await readdir(path.join(built,game,'assets'))).length>0,`${game} 资源缺失`);
}
for(const file of ['research.md','notes.md','LICENSE.upstream.txt','asset-sources.md','data/publication.json','practice.md','practice-evidence.md','ink-practice.md','ink-evidence.md','assets/ink-input-run.webm','assets/harbor-input-run.webm','assets/ink-v1-active.png'])assert((await stat(path.join(built,file))).size>0,`交付缺失 ${file}`);
console.log(JSON.stringify({status:'PASS',summaryItems:12,moduleParts:4,reuseRoutes:4,expansionDirections:8,skills:9,sections:14,checkedPageReferences:references,playableRoutes:['starter/','play/','ink/'],originalGuide:{width:1024,height:1536,bytes:original.length,sha256:guideSha256}},null,2));
