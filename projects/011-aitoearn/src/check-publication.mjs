// Read-only verification of the public research artifacts, not upstream business services.
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {guide} from '../web/publication.js';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://yydshly.github.io/1008_codex_project/011-aitoearn/';
const run=JSON.parse(await readFile(path.join(project,'experiments/research-to-post/run.json'),'utf8'));
const files=['','map.html','styles.css','app.js','content.js','render.js','demo-render.js','publication.js','map.js','publication.json','understanding.md','research.md','notes.md','source-manifest.json','implementation-inventory.json','skill-installation.json','LICENSE.upstream.txt',guide.file,'assets/aitoearn-overview.md','assets/aitoearn-overview-record.json','assets/aitoearn-overview-prompt.txt','experiment/README.md','experiment/run.json','experiment/draft.json','experiment/draft.md','experiment/prompts.json','experiment/generation-calls.json','experiment/output-bundle.zip',...run.outputs.map(o=>o.local),...['author-create','author-publish','author-channels','author-engage','author-monetize','example-restaurant'].map(n=>`assets/${n}.png`)];
const root='https://yydshly.github.io/1008_codex_project/';
const rows=[];let body;
// Small batches avoid excessive simultaneous requests to the static host.
for(let start=0;start<files.length;start+=4){for(const row of await Promise.all(files.slice(start,start+4).map(async file=>{
 const response=await fetch(base+file,{signal:AbortSignal.timeout(120000)});assert.equal(response.status,200,`HTTP ${file}`);const bytes=Buffer.from(await response.arrayBuffer());assert.ok(bytes.length>0);
 const sha256=createHash('sha256').update(bytes).digest('hex');if(file===guide.file)assert.equal(sha256,guide.sha256,'公开原图字节不一致');
 const output=run.outputs.find(o=>o.local===file);if(output)assert.equal(sha256,output.sha256,'公开实测图不一致');
 if(file===''){body=bytes.toString();assert.ok(body.includes('八个可扩展方向')&&body.includes('八个职责模块')&&body.includes('未实测视频或真实发布'));}
 console.log(`200 ${file||'index.html'} (${bytes.length} bytes)`);return {file,url:base+file,status:response.status,bytes:bytes.length,sha256};
})))rows.push(row);}
const entrance=await fetch(root,{signal:AbortSignal.timeout(30000)});assert.equal(entrance.status,200);const rootHtml=await entrance.text();assert.ok(rootHtml.includes('data-project-introduction="011"')&&rootHtml.includes('./011-aitoearn/'),'总入口011登记丢失');
const existing=['001-sandboard','002-interview-guide','003-pascal-editor','004-up-learning-guide','005-threejs-game-skills','006-easel','007-octogent','008-ghosttrack','009-cove','010-unsloth','013-aihot'];
for(const slug of existing){const r=await fetch(root+slug+'/',{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,`原入口 ${slug}`);rows.push({url:root+slug+'/',status:r.status,kind:'preserved-project'});await r.body?.cancel();}
const report={checkedAt:new Date().toISOString(),passed:true,base,scope:'公开研究入口、资源、实际图片与原图完整性；不验证上游模型、云加工或社交发布',resources:files.length,preservedProjects:existing.length,root:{url:root,status:200},checks:rows};
await writeFile(path.join(project,'src/public-http-checks.json'),JSON.stringify(report,null,2)+'\n');console.log(`公开核验通过：${files.length}项011页面/资源、11个既有项目和总入口；原图及三张实测图哈希一致。`);
