// 只读公开 HTTP 核验；浏览器中的实际交互另行记录。
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { publication, summaryItems, overviewItems } from '../web/publication-content.js';
const base=new URL(publication.url);
const root=new URL('../',base);
const checked=[];
async function get(url,binary=false){
  const response=await fetch(url,{signal:AbortSignal.timeout(60000),headers:{'Cache-Control':'no-cache'}});
  assert.equal(response.status,200,`${url} HTTP ${response.status}`);
  const body=binary?Buffer.from(await response.arrayBuffer()):await response.text();
  assert(body.length>0,`${url} 空内容`);
  checked.push({url:String(url),status:response.status,contentType:response.headers.get('content-type'),bytes:binary?body.length:Buffer.byteLength(body)});
  return body;
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const [html,home,json,png]=await Promise.all([
  get(base),get(root),get(new URL('data/publication.json',base)),get(new URL('assets/capability-overview-v1.png',base),true)
]);
const data=JSON.parse(json);
assert.deepEqual(data.summaryItems,summaryItems);assert.deepEqual(data.overviewItems,overviewItems);
assert.equal(data.moduleParts.length,4);assert.equal(data.reuseRoutes.length,4);assert.equal(data.expansionDirections.length,8);
for(const item of summaryItems){assert(html.includes(escape(item.text)),`静态摘要缺少 ${item.title}`);assert(home.includes(escape(item.text)),`首页缺少 ${item.title}`);}
assert(!/127\.0\.0\.1|localhost/.test(html),'公开入口包含本地地址');
assert(png.equals(await readFile(new URL('../assets/capability-overview-v1.png',import.meta.url))),'公开原图字节变化');
const guideHash=createHash('sha256').update(png).digest('hex');
const urls=new Set();
for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
  const ref=match[1];if(ref.startsWith('./'))urls.add(new URL(ref,base).href);
}
for(const route of ['starter/','play/','ink/'])urls.add(new URL(route,base).href);
for(const previous of ['001-sandboard/','002-interview-guide/','003-pascal-editor/','004-up-learning-guide/','013-aihot/'])urls.add(new URL(previous,root).href);
for(const url of [base.href,root.href,new URL('data/publication.json',base).href,new URL('assets/capability-overview-v1.png',base).href])urls.delete(url);
const queue=[...urls];
await Promise.all(Array.from({length:6},async()=>{
  while(queue.length){
    const url=queue.shift();const body=await get(url);
    if(/\/(starter|play|ink)\/$/.test(url)){
      const resources=[...body.matchAll(/(?:href|src)="([^"#]+)"/g)].map(m=>new URL(m[1],url)).filter(u=>u.origin===base.origin);
      await Promise.all(resources.map(async resource=>{
        const content=await get(resource);
        if(resource.pathname.endsWith('.js')){
          const nested=[...content.matchAll(/(?:from\s*|import\s*)["'](\.\/[^"']+)["']/g)].map(m=>new URL(m[1],resource));
          await Promise.all(nested.map(u=>get(u)));
        }
      }));
    }
  }
}));
const report={verifiedAt:new Date().toISOString(),url:base.href,result:'PASS',summaryItems:12,moduleParts:4,reuseRoutes:4,expansionDirections:8,playableRoutes:['starter/','play/','ink/'],preservedSites:5,guide:{width:png.readUInt32BE(16),height:png.readUInt32BE(20),bytes:png.length,sha256:guideHash,originalBytesPreserved:true},checked:checked.sort((a,b)=>a.url.localeCompare(b.url)),limits:['HTTP 与文件核验不代替浏览器输入、真机或音频体验验证。']};
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9);
if(output)await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:report.result,url:report.url,httpResources:checked.length,summaryItems:12,expansionDirections:8,guideHash,preservedSites:5},null,2));
