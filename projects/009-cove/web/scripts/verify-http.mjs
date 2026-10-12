// 公开 HTTPS 验收；下载比对原图哈希，不把 HTTP 200 当作功能运行证明。
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {publication,guide} from '../publication.mjs';
const base=process.argv[2]??'https://yydshly.github.io/1008_codex_project/009-cove/';
assert.equal(new URL(base).protocol,'https:');
const origin=new URL('../',base).href;
const resources=['','map.html','styles.css','app.js','map.css','map.js','publication.json','understanding.md','research.md','notes.md','LICENSE.upstream.txt','source-manifest.json','assets/favicon.svg','assets/cove-overview.png','assets/cove-overview.html','assets/cove-overview-render.json','assets/verification.json','assets/architecture-system.svg','assets/architecture-login.svg','assets/architecture-request.svg','assets/architecture-build.svg'];
const checks=[];let data,main,root,guideHash;
async function fetchFile(url){
 const response=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'cache-control':'no-cache'}});
 assert.equal(response.status,200,'公开访问失败：'+url);
 const bytes=Buffer.from(await response.arrayBuffer());
 checks.push({url,status:response.status,bytes:bytes.length,contentType:response.headers.get('content-type')});
 return bytes;
}
for(const file of resources){
 const bytes=await fetchFile(new URL(file,base).href);
 if(file==='')main=bytes.toString('utf8');
 if(file==='publication.json')data=JSON.parse(bytes.toString('utf8'));
 if(file==='assets/cove-overview.png'){
  guideHash=createHash('sha256').update(bytes).digest('hex');
  assert.equal(guideHash,guide.sha256);assert.equal(bytes.length,guide.bytes);
  assert.equal(bytes.readUInt32BE(16),guide.width);assert.equal(bytes.readUInt32BE(20),guide.height);
 }
}
root=(await fetchFile(origin)).toString('utf8');
assert.deepEqual(data.summaryItems,publication.summaryItems);
assert.deepEqual(data.overviewItems,publication.overviewItems);
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const item of publication.summaryItems){assert.ok(main.includes(escape(item.text)));assert.ok(root.includes(escape(item.text)));}
assert.ok(root.includes('data-project-introduction="009"'));assert.ok(root.includes('./009-cove/assets/'+guide.file));
for(const path of ['001-sandboard/','002-interview-guide/','003-pascal-editor/overview/','004-up-learning-guide/','005-threejs-game-skills/','006-easel/','007-octogent/','008-ghosttrack/','010-unsloth/','013-aihot/'])await fetchFile(new URL(path,origin).href);
const result={date:'2026-10-12',url:base,passed:true,guide:{width:guide.width,height:guide.height,bytes:guide.bytes,sha256:guideHash},checks,scope:publication.meta.scope};
await writeFile(new URL('../../src/public-http-checks.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,url:base,resources:checks.length,guideHash,preservedProjects:10},null,2));
