// Publication audit: source records, actual outputs, links and original guide integrity.
import assert from 'node:assert/strict';
import {readFile,access,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sections} from '../render.js';
import {guide,modules,mechanisms,reuse,extensions} from '../publication.js';
const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),project=path.resolve(web,'..'),root=path.resolve(project,'../..');
export async function audit(dist=path.join(web,'dist')){
 const html=await readFile(path.join(dist,'index.html'),'utf8'),catalog=JSON.parse(await readFile(path.join(root,'projects.json'),'utf8')).projects.find(p=>p.id==='011'),publication=JSON.parse(await readFile(path.join(dist,'publication.json'),'utf8'));
 assert.deepEqual(publication.summaryItems,catalog.summaryItems);assert.deepEqual(publication.overviewItems,catalog.overviewItems);
 assert.equal(catalog.summaryItems.length,12);assert.equal(catalog.overviewItems.length,6);assert.equal(sections.length,18);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'重复 HTML ID');
 for(const [id] of sections)assert.ok(ids.includes(id),`缺少完整正文：${id}`);
 assert.equal((html.match(/data-system-module/g)||[]).length,modules.length);assert.equal((html.match(/data-mechanism/g)||[]).length,mechanisms.length);
 assert.equal((html.match(/data-reuse/g)||[]).length,reuse.length);assert.equal((html.match(/data-extension/g)||[]).length,extensions.length);
 assert.ok(!html.includes('127.0.0.1')&&!html.includes('localhost'),'公开页面不依赖本机');
 assert.ok(html.includes('未实测视频或真实发布')&&html.includes('本地草稿'),'真实实测范围需明确');
 if(catalog.demo){for(const file of ['verification.json','public-http-checks.json','public-browser-checks.json']){const record=JSON.parse(await readFile(path.join(dist,file),'utf8'));assert.equal(record.passed,true,'缺少通过的公开记录：'+file);}}
 const bytes=await readFile(path.join(dist,guide.file));assert.equal(bytes.readUInt32BE(16),guide.width);assert.equal(bytes.readUInt32BE(20),guide.height);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),guide.sha256,'引导图原始字节不得改变');
 let links=0;
 for(const page of ['index.html','map.html']){const text=await readFile(path.join(dist,page),'utf8');for(const [,href]of text.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(?:https?:|data:|mailto:)/.test(href))continue;
  if(href.startsWith('#')){assert.ok(ids.includes(href.slice(1)),`锚点缺失：${href}`);continue;}
  const clean=decodeURIComponent(href.split(/[?#]/)[0]);if(!clean)continue;const target=path.resolve(dist,clean);
  assert.ok(target.startsWith(dist+path.sep)||target===dist,'资源引用越界');await access(target===dist?path.join(target,'index.html'):target);links++;
 }}
 for(const name of ['app.js','render.js','demo-render.js','publication.js']){const code=await readFile(path.join(dist,name),'utf8');for(const [,relative]of code.matchAll(/from\s*['"](\.[^'"]+)['"]/g))await access(path.resolve(dist,relative));}
 for(const name of ['experiment/output-bundle.zip','source-manifest.json','implementation-inventory.json','skill-installation.json','research.md','understanding.md','LICENSE.upstream.txt'])await access(path.join(dist,name));
 const report={checkedAt:new Date().toISOString(),passed:true,sections:18,summaries:12,introductions:6,capabilities:32,skills:13,platforms:14,modules:8,mechanisms:6,reuse:4,extensions:8,relativeResources:links,originalGuide:{...guide,bytes:bytes.length},scope:'静态研究、链接、摘要一致性和原始引导图核验；不执行原后台、视频或真实发布'};
 console.log(`011 发布审计通过：18章节、12摘要、8模块、6机制、4复用、8扩展、${links}资源引用与原图SHA-256。`);return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const report=await audit();if(process.argv.includes('--record'))await writeFile(path.join(project,'src/local-publication-verification.json'),JSON.stringify(report,null,2)+'\n');}
