// 对已经完成部署的公开 HTTPS 站点进行只读检查；无账号或 Agent 调用。
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const project=fileURLToPath(new URL('../../',import.meta.url));
const base='https://yydshly.github.io/1008_codex_project/';
const entry=base+'007-octogent/';
const metadata=JSON.parse(await readFile(path.resolve(project,'../../projects.json'),'utf8')).projects.find(p=>p.id==='007');
const checks=[];
const bytesByResource=new Map();
const resources=['','index.html','map.html','app.js','content.js','interactive-sections.mjs','styles.css','publication.css','map.js','map.css','publication.json','understanding.md','research.md','notes.md','LICENSE.upstream.txt','local-publication-verification.json','publication-verification.json','public-http-checks.json','public-browser-checks.json','assets/octogent-understanding-map.png','assets/octogent-understanding-map.svg','assets/octogent-understanding-map-preview.jpg','assets/octogent-understanding-map-layout.json','assets/octogent-understanding-map-content.md',...Array.from({length:6},(_,i)=>`assets/preview_${i+1}.jpg`)];
for(let i=0;i<resources.length;i+=5){
 await Promise.all(resources.slice(i,i+5).map(async resource=>{
  const response=await fetch(entry+resource,{cache:'no-store',signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200,`${resource||'入口'}公开HTTP失败`);
  const bytes=Buffer.from(await response.arrayBuffer());
  assert(bytes.length>0,`资源为空 ${resource}`);
  if(resource.endsWith('.js')||resource.endsWith('.mjs'))assert(/javascript/.test(response.headers.get('content-type')??''),`脚本MIME错误 ${resource}`);
  checks.push({url:entry+resource,status:response.status,bytes:bytes.length,contentType:response.headers.get('content-type')});
  bytesByResource.set(resource,bytes);
 }));
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const html=bytesByResource.get('index.html').toString('utf8');
const data=JSON.parse(bytesByResource.get('publication.json'));
assert.deepEqual(data.summaryItems,metadata.summaryItems);assert.deepEqual(data.overviewItems,metadata.overviewItems);
for(const item of metadata.summaryItems)assert(html.includes(escape(item.text)),`公开摘要缺少 ${item.title}`);
for(const id of ['summary','overview','workflow','capabilities','modules','principles','scenarios','value','reuse','extensions','evidence'])assert(html.includes(`id="${id}"`),`公开静态章节缺少 ${id}`);
const guide=bytesByResource.get('assets/octogent-understanding-map.png');
const hash=createHash('sha256').update(guide).digest('hex');
assert.equal(hash,'a630623ede3b9582791f3965eaeb70023a2cb579fb4e781138c5f378e63bc242');
assert.equal(guide.readUInt32BE(16),3600);assert.equal(guide.readUInt32BE(20),10174);
for(let i=1;i<=6;i++){const file=`assets/preview_${i}.jpg`;assert(bytesByResource.get(file).equals(await readFile(path.join(project,file))),`上游截图${i}公开字节改变`);}
const rootResponse=await fetch(base,{cache:'no-store'});assert.equal(rootResponse.status,200);
const rootHtml=await rootResponse.text();
assert(rootHtml.includes('data-project-introduction="007"'));assert(rootHtml.includes('src="./007-octogent/assets/octogent-understanding-map-preview.jpg"'));
for(const item of metadata.summaryItems)assert(rootHtml.includes(`<strong>${escape(item.title)}</strong>：${escape(item.text)}`),`公开总入口缺少 ${item.title}`);
const preserved=[];
for(const route of ['001-sandboard/','002-interview-guide/','003-pascal-editor/overview/','004-up-learning-guide/','005-threejs-game-skills/','006-easel/','013-aihot/']){
 const response=await fetch(base+route,{cache:'no-store',signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200,`既有入口失效 ${route}`);preserved.push({url:base+route,status:response.status});
}
const report={date:'2026-10-12',passed:true,entry,checkedResources:checks.length,checks,preserved,
 summaryItems:data.summaryItems.length,overviewItems:data.overviewItems.length,modules:data.modules.length,scenarios:data.scenarios.length,extensions:data.extensions.length,
 originalGuide:{sha256:hash,width:3600,height:10174,bytes:guide.length},boundary:'仅核验公开静态研究网页；没有验证原库真实Agent工作。'};
if(!process.argv.includes('--no-write'))await writeFile(path.join(project,'src/public-http-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,checkedResources:checks.length,preservedEntries:preserved.length,guideHash:hash}));
