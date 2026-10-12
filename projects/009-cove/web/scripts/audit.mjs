import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {publication,guide} from '../publication.mjs';
import {escape} from './render-publication.mjs';
const project=fileURLToPath(new URL('../../',import.meta.url));
export async function auditCove(directory=fileURLToPath(new URL('../dist/',import.meta.url))){
  const html=await readFile(path.join(directory,'index.html'),'utf8');
  const data=JSON.parse(await readFile(path.join(directory,'publication.json'),'utf8'));
  const catalog=JSON.parse(await readFile(new URL('../../../../projects.json',import.meta.url),'utf8'));
  const entry=catalog.projects.find(item=>item.id==='009');
  assert.deepEqual(data.summaryItems,entry.summaryItems);assert.deepEqual(data.overviewItems,entry.overviewItems);assert.deepEqual(data,publication);
  for(const item of publication.summaryItems)assert.ok(html.includes(escape(item.text)),'摘要缺失：'+item.title);
  for(const item of publication.overviewItems)assert.ok(html.includes('<strong>'+escape(item.title)+'</strong>：'+escape(item.text)),'图前介绍缺失：'+item.title);
  const sections=['overview','summary','architecture','modules','capabilities','principles','scenarios','value','reuse','interfaces','adaptation','extensions','files','faq'];
  for(const id of sections)assert.ok(html.includes('id="'+id+'"'),'缺少章节：'+id);
  for(const [attribute,count] of [['data-system-module',8],['data-value',6],['data-reuse',4],['data-extension-point',8],['data-adaptation',6],['data-extension-direction',8]])assert.equal((html.match(new RegExp(attribute+'\\b','g'))??[]).length,count);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  assert.ok(!/<!-- [A-Z_]+ -->/.test(html));assert.ok(!/\b(?:src|href)=["']\/(?!\/)/.test(html));
  for(const m of html.matchAll(/\b(?:src|href)=["'](\.\/[^"'#]+)(?:#[^"']*)?["']/g)){
    const relative=m[1].split(/[?#]/)[0],file=path.resolve(directory,relative.endsWith('/')?relative+'index.html':relative);
    assert.ok(file.startsWith(path.resolve(directory)+path.sep));await access(file);
  }
  for(const file of ['map.html','map.css','map.js','understanding.md','research.md','notes.md','LICENSE.upstream.txt','source-manifest.json','assets/cove-overview.html','assets/cove-overview-render.json','assets/verification.json','assets/architecture-system.svg','assets/architecture-login.svg','assets/architecture-request.svg','assets/architecture-build.svg'])await access(path.join(directory,file));
  const image=await readFile(path.join(directory,'assets',guide.file));
  assert.equal(image.length,guide.bytes);assert.equal(image.readUInt32BE(16),guide.width);assert.equal(image.readUInt32BE(20),guide.height);
  assert.equal(createHash('sha256').update(image).digest('hex'),guide.sha256);
  assert.ok(image.equals(await readFile(path.join(project,'assets',guide.file))));
  const render=JSON.parse(await readFile(path.join(directory,'assets/cove-overview-render.json'),'utf8'));
  assert.equal(createHash('sha256').update(await readFile(path.join(directory,'assets/cove-overview.html'))).digest('hex'),render.sourceSha256);
  assert.equal(guide.sha256,render.outputSha256);
  assert.ok((await readFile(path.join(directory,'LICENSE.upstream.txt'),'utf8')).includes('public domain'));
  const markdown=await readFile(path.join(directory,'understanding.md'),'utf8');assert.ok(!markdown.includes('undefined'));
  for(const item of publication.summaryItems)assert.ok(markdown.includes(item.text));
  assert.ok(html.includes('未运行')&&html.includes(publication.meta.commit));
  console.log('009 Cove：14 章节、12 项摘要、8 组模块、8 处入口、6 步适配、8 项扩展与原图一致性通过。');
  return {sections:14,summary:12,modules:8,extensionPoints:8,adaptation:6,directions:8,guideSha256:guide.sha256};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await auditCove(process.argv[2]?path.resolve(process.argv[2]):undefined);
