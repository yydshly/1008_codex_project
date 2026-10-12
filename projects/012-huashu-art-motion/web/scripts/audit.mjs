// 审计实际发布产物与固定来源，不把文件存在当作美术品质证明。
import {readFile,access,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {publication,guide,summaryItems,overviewItems} from '../publication.mjs';
const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),project=path.resolve(web,'..'),root=path.resolve(project,'../..');
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function audit(dist=path.join(web,'dist')){
 const catalog=JSON.parse(await readFile(path.join(root,'projects.json'),'utf8')).projects.find(p=>p.id==='012');
 assert.deepEqual(catalog.summaryItems,summaryItems);assert.deepEqual(catalog.overviewItems,overviewItems);
 assert.equal(catalog.cover,'projects/012-huashu-art-motion/'+guide.file);assert.equal(catalog.coverFull,catalog.cover);
 const png=await readFile(path.join(dist,guide.file));assert.equal(png.length,guide.bytes);assert.equal(sha(png),guide.sha256);assert.equal(png.readUInt32BE(16),guide.width);assert.equal(png.readUInt32BE(20),guide.height);
 const data=JSON.parse(await readFile(path.join(dist,'data/publication.json'),'utf8'));assert.deepEqual(data,publication);
 const html=await readFile(path.join(dist,'index.html'),'utf8'),overview=await readFile(path.join(dist,'overview/index.html'),'utf8');
 assert.equal((html.match(/class="style-card"/g)||[]).length,35);assert.equal((html.match(/class="grammar /g)||[]).length,9);
 for(const i of summaryItems)assert.ok(overview.includes(i.text),'摘要缺失 '+i.title);
 for(const i of overviewItems)assert.ok(html.includes(i.text)&&overview.includes(i.text),'引导缺失 '+i.title);
 for(const [key,count]of[['module',9],['library',17],['reuse',4],['extension',8],['summary',12]])assert.equal((overview.match(new RegExp('data-'+key+'[ >]','g'))||[]).length,count,key);
 for(const id of ['publication','modules','mechanisms','reuse','extensions'])assert.ok(overview.includes('id="'+id+'"'));
 assert.ok(overview.indexOf('publication-introduction')<overview.indexOf('id="overview-image"'));
 for(const page of ['index.html','overview/index.html','overview/poster.html','scenarios/index.html','engine/index.html']){
  const t=await readFile(path.join(dist,page),'utf8');assert.ok(!/127\.0\.0\.1|localhost/.test(t),'公开页面含本机链接 '+page);
  assert.ok(!/\b(?:src|href)=["']\/(?!\/)/.test(t),'根路径资源 '+page);
  for(const m of t.matchAll(/(?:src|href)="([^"#]+)"/g)){
   if(/^(https?:|data:|mailto:|#)/.test(m[1])||m[1].includes('${'))continue;
   let location=path.resolve(path.dirname(path.join(dist,page)),decodeURIComponent(m[1].split(/[?#]/)[0]));
   assert.ok(location===path.resolve(dist)||location.startsWith(path.resolve(dist)+path.sep),'路径越界 '+m[1]);
   if((await stat(location)).isDirectory())location=path.join(location,'index.html');await access(location);
  }
 }
 const manifest=JSON.parse(await readFile(path.join(project,'src/source-manifest.json'),'utf8'));
 for(const f of manifest.files.filter(f=>f.local.startsWith('src/upstream-engine/'))){const target=f.local.replace('src/upstream-engine/','engine/');assert.equal(sha(await readFile(path.join(dist,target))),f.sha256,'原始引擎改变 '+target);}
 const scenarios=await readFile(path.join(dist,'scenarios/index.html'),'utf8');assert.equal((scenarios.match(/class="card"/g)||[]).length,7);
 for(const id of ['travel','life','history','product','data','emotion','interactive']){
  const b=await readFile(path.join(dist,'assets/production/'+id+'.mp4'));assert.ok(b.length>10000&&b.subarray(4,8).toString()==='ftyp','MP4 无效 '+id);
  await access(path.join(dist,'assets/production/'+id+'.jpg'));
 }
 async function syntax(dir){for(const f of await readdir(dir,{withFileTypes:true})){if(f.isDirectory())await syntax(path.join(dir,f.name));else if(/\.(?:m?js)$/.test(f.name)){const result=spawnSync(process.execPath,['--check',path.join(dir,f.name)],{encoding:'utf8',windowsHide:true});assert.equal(result.status,0,result.stderr);}}}
 await syntax(dist);
 for(const f of ['research.md','notes.md','production-research.md','LICENSE.upstream.txt','source-manifest.json','engine/lib/fonts/LICENSES.md','engine/lib/fonts/OFL.txt'])await access(path.join(dist,f));
 return {passed:true,guide,styles:35,grammars:9,modules:9,libraries:17,reuse:4,extensions:8,films:7,baseline:publication.meta.commit};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){console.log(JSON.stringify(await audit(),null,2));}
