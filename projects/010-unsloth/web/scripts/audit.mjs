import { readFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { publication, guide, summaryItems, overviewItems } from '../publication.mjs';
import { escape } from './render-publication.mjs';
const project=fileURLToPath(new URL('../../',import.meta.url));
export async function auditUnsloth(output=path.join(project,'web/dist')) {
  const catalog=JSON.parse(await readFile(new URL('../../../../projects.json',import.meta.url),'utf8'));
  const entry=catalog.projects.find(p=>p.id==='010');
  assert.deepEqual(entry.summaryItems,summaryItems);assert.deepEqual(entry.overviewItems,overviewItems);
  const data=JSON.parse(await readFile(path.join(output,'publication.json'),'utf8'));
  assert.deepEqual(data,publication);
  for(const [key,count] of Object.entries({summaryItems:12,overviewItems:6,modules:8,models:7,values:6,reuse:4,extensions:8,roadmap:3,methods:8,principles:6,scenarios:6,sources:26}))assert.equal(data[key].length,count,key);
  const html=await readFile(path.join(output,'index.html'),'utf8');
  for(const id of ['overview','summary','guide','overview-map','training','capabilities','modules','models','principles','scenarios','h3','workflow','value','reuse','extensions','limits','faq','evidence','sources'])assert.ok(html.includes(`id="${id}"`),`缺少静态章节 ${id}`);
  for(const item of summaryItems)assert.ok(html.includes(escape(item.text)),`缺少摘要 ${item.title}`);
  const intro=html.indexOf('data-publication-introduction'),figure=html.indexOf('<figure class="publication-guide">');
  assert.ok(intro>0&&figure>intro,'完整介绍在原图前');
  assert.ok(!/<!-- [A-Z_]+ -->/.test(html));
  assert.ok(!/\b(?:src|href)=["']\/(?!\/)/.test(html),'子路径资源引用');
  assert.ok(html.includes('本次没有核实通用的')&&html.includes('约 80GB+')&&html.includes('FP8 / MXFP8'),'训练和 H3 边界');
  const bytes=await readFile(path.join(output,'assets',guide.file));
  assert.equal(bytes.length,guide.bytes);assert.equal(bytes.readUInt32BE(16),guide.width);assert.equal(bytes.readUInt32BE(20),guide.height);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),guide.sha256);
  assert.ok(bytes.equals(await readFile(path.join(project,'assets',guide.file))),'原图字节保持一致');
  for(const file of ['index.html','map.html','map.js','map.css','styles.css','app.js','publication.json','verification.json','understanding.md','research.md','notes.md','sources.json'])await access(path.join(output,file));
  for(const file of ['index.html','map.html']){
    const page=await readFile(path.join(output,file),'utf8');
    for(const [,href] of page.matchAll(/(?:src|href)="([^"#]+)(?:#[^"]*)?"/g)){
      if(!href.startsWith('./'))continue;
      const resource=href.split('?')[0];
      const local=path.resolve(output,resource.endsWith('/')?resource+'index.html':resource);assert.ok(local.startsWith(output+path.sep));await access(local);
    }
    const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'DOM ID 唯一');
    for(const [,anchor] of page.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(anchor),`章节锚点不存在 ${anchor}`);
  }
  const markdown=await readFile(path.join(output,'understanding.md'),'utf8');
  for(const text of ['模块','原理','可使用场景','个人意义','可扩展方向','来源与许可','22 帧','80GB+'])assert.ok(markdown.includes(text),`完整理解下载缺少 ${text}`);
  console.log('010 Unsloth：12 项摘要、8 模块、7 类模型、6 机制与场景、4 复用路线、8 扩展、原图与研究下载审计通过。');
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)await auditUnsloth();
