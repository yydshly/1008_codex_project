import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../',import.meta.url));
const project = path.resolve(root,'..');
const dest = path.join(root,'dist');
const catalog = JSON.parse(await readFile(path.resolve(project,'../../projects.json'),'utf8'));
const metadata = catalog.projects.find(item=>item.id==='007');
const data = JSON.parse(await readFile(path.join(dest,'publication.json'),'utf8'));
const html = await readFile(path.join(dest,'index.html'),'utf8');
const escape = value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
assert.deepEqual(data.summaryItems,metadata.summaryItems);
assert.deepEqual(data.overviewItems,metadata.overviewItems);
assert.equal(data.summaryItems.length,12); assert.equal(data.modules.length,8);
assert.equal(data.pipeline.length,5); assert.equal(data.scenarios.length,6);
assert.equal(data.businessValues.length,4); assert.equal(data.learningValues.length,4);
assert.equal(data.reuse.length,4); assert.equal(data.extensions.length,8);
assert.equal(data.meta.commit,'07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254');
for(const item of metadata.summaryItems) assert(html.includes(escape(item.text)),`静态摘要缺少 ${item.title}`);
for(const id of ['summary','overview','screens','workflow','capabilities','mechanism','modules','principles','scenarios','value','reuse','extensions','evidence']) assert(html.includes(`id="${id}"`),`静态正文缺少 ${id}`);
for(const [items,field] of [[data.modules,'role'],[data.pipeline,'title'],[data.scenarios,'title'],[data.businessValues,'title'],[data.learningValues,'title'],[data.extensions,'title']]) for(const item of items) assert(html.includes(escape(item[field])),`静态正文未写入 ${item[field]}`);
assert(!html.includes('<!-- PUBLICATION_'),'静态出版占位符没有替换');
assert(!html.includes('127.0.0.1')&&!html.includes('localhost'),'公开入口不得引用本机服务');
const anchors=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
assert.equal(anchors.size,[...html.matchAll(/\bid="([^"]+)"/g)].length,'静态 HTML 有重复 ID');
for(const match of html.matchAll(/href="#([^"]+)"/g))assert(anchors.has(match[1]),`锚点缺失 ${match[1]}`);
const guide=await readFile(path.join(dest,data.meta.guide.file));
assert.equal(createHash('sha256').update(guide).digest('hex'),data.meta.guide.sha256,'完整引导图原始字节改变');
assert(guide.equals(await readFile(path.join(project,data.meta.guide.file))),'复制引导图不一致');
assert.equal(guide.readUInt32BE(16),3600);assert.equal(guide.readUInt32BE(20),10174);
let checkedLinks=0;
for(const page of ['index.html','map.html']){
 const pageFile=path.join(dest,page);const body=await readFile(pageFile,'utf8');
 for(const match of body.matchAll(/(?:src|href)="(\.\/[^"#]+)(?:#[^"]*)?"/g)){
  const relative=match[1].split(/[?#]/)[0];const target=path.resolve(dest,relative);
  assert(target.startsWith(dest+path.sep),`资源越界 ${relative}`);
  assert((await stat(target)).isFile(),`资源缺失 ${relative}`);checkedLinks++;
 }
}
for(let i=1;i<=6;i++){const asset=`assets/preview_${i}.jpg`;assert((await readFile(path.join(dest,asset))).equals(await readFile(path.join(project,asset))),`作者截图 ${i} 字节改变`);}
for(const file of ['publication.json','understanding.md','research.md','verification.json','LICENSE.upstream.txt','assets/octogent-understanding-map.svg','assets/octogent-understanding-map-content.md'])assert((await stat(path.join(dest,file))).size>0);
console.log(JSON.stringify({passed:true,summaryItems:12,overviewItems:6,modules:8,pipelineSteps:5,scenarios:6,businessValues:4,learningValues:4,reuseRoutes:4,extensions:8,checkedLinks,originalGuidePreserved:true,screenshots:6}));
