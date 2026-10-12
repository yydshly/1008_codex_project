import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escape } from './render-publication.mjs';
import { guide, summaryItems } from '../publication.mjs';
const web=fileURLToPath(new URL('../',import.meta.url)), dist=path.join(web,'dist');
const html=await readFile(path.join(dist,'index.html'),'utf8');
const data=JSON.parse(await readFile(path.join(dist,'publication.json'),'utf8'));
const catalog=JSON.parse(await readFile(path.resolve(web,'../../../projects.json'),'utf8'));
const metadata=catalog.projects.find(p=>p.id==='008');
assert.deepEqual(data.summaryItems,metadata.summaryItems,'网页与索引摘要应一致');
assert.deepEqual(data.overviewItems,metadata.overviewItems,'图前介绍应一致');
assert.equal(data.meta.commit,'a5cb8ad4c08acd803f166fb067b7dac724d6cb3d');
assert.equal(data.capabilities.length,4);assert.equal(data.platforms.length,23);
assert.equal(data.modules.length,8);assert.equal(data.scenarios.length,6);assert.equal(data.extensions.length,8);
for(const item of summaryItems)assert(html.includes(escape(item.text)),`静态正文缺少 ${item.title}`);
for(const id of ['summary','overview','capabilities','modules','architecture','scenarios','value','reuse','extensions','evidence','sources'])assert(html.includes(`id="${id}"`),`缺少章节 ${id}`);
assert(html.indexOf('data-publication-introduction')<html.indexOf('<figure'),'介绍必须在图前');
const bytes=await readFile(path.join(dist,'assets',guide.file));
assert.equal(createHash('sha256').update(bytes).digest('hex'),guide.sha256,'原图字节发生变化');
assert.equal(bytes.readUInt32BE(16),guide.width);assert.equal(bytes.readUInt32BE(20),guide.height);
for(const file of ['map.html','map.js','map.css','index.html']){
 const page=await readFile(path.join(dist,file),'utf8');
 assert(!/\b(?:src|href)=["']\/(?!\/)/.test(page),'资源必须兼容子路径');
 for(const match of page.matchAll(/(?:src|href)="(\.\/[^"#]+)(?:#[^"]*)?"/g)){
  const relative=match[1].split('?')[0], target=path.resolve(dist,relative);
  assert(target.startsWith(dist+path.sep));await access(target);
 }
}
for(const script of ['app.js','map.js'])assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(await readFile(path.join(dist,script),'utf8')),'研究交互不应触发查询');
console.log(JSON.stringify({summaryItems:12,overviewItems:6,capabilities:4,modules:8,scenarios:6,extensions:8,guide:{width:guide.width,height:guide.height,sha256:guide.sha256},staticResearch:true,queryService:false}));
