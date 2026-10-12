// 对公开静态站点做 GET 核验；不访问模型服务或执行训练。
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { guide,summaryItems,overviewItems } from '../web/publication.mjs';
const root=process.env.PUBLIC_SITE_URL||'https://yydshly.github.io/1008_codex_project/';
const paths=['','001-sandboard/','002-interview-guide/','003-pascal-editor/overview/','004-up-learning-guide/','005-threejs-game-skills/','006-easel/','007-octogent/','008-ghosttrack/','013-aihot/'];
const project='010-unsloth/';
paths.push(...['','map.html','map.js','map.css','styles.css','app.js','favicon.svg','publication.json','sources.json','verification.json','research.md','notes.md','understanding.md','assets/unsloth-overview.png','assets/unsloth-overview-content.md','assets/unsloth-overview.html','assets/unsloth-overview-generation.json','assets/cover.png','assets/mobile.png'].map(file=>project+file));
const results=[],responses=new Map();
for(let i=0;i<paths.length;i+=4){
  await Promise.all(paths.slice(i,i+4).map(async file=>{
    const url=new URL(file,root).href;const response=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'Cache-Control':'no-cache'}});
    const bytes=Buffer.from(await response.arrayBuffer());assert.equal(response.status,200,url);
    results.push({path:file,url,status:response.status,bytes:bytes.length,contentType:response.headers.get('content-type')});responses.set(file,bytes);
  }));
}
const html=responses.get(project).toString('utf8'),entry=responses.get('').toString('utf8');
for(const id of ['summary','guide','modules','models','principles','scenarios','h3','value','reuse','extensions','evidence'])assert.ok(html.includes(`id="${id}"`),id);
const data=JSON.parse(responses.get(project+'publication.json'));
assert.deepEqual(data.summaryItems,summaryItems);assert.deepEqual(data.overviewItems,overviewItems);
assert.ok(entry.includes('data-project-introduction="010"')&&entry.includes('src="./010-unsloth/assets/unsloth-overview.png"'));
const bytes=responses.get(project+'assets/unsloth-overview.png');assert.equal(bytes.length,guide.bytes);
assert.equal(bytes.readUInt32BE(16),guide.width);assert.equal(bytes.readUInt32BE(20),guide.height);
assert.equal(createHash('sha256').update(bytes).digest('hex'),guide.sha256);
results.sort((a,b)=>a.path.localeCompare(b.path));
const report={date:new Date().toISOString(),status:'passed',scope:'公开 HTTPS 入口、静态正文、原图字节与资源；不含 GPU 验证',checkedUrls:results.length,guide,results};
await writeFile(new URL('./public-http-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,checkedUrls:report.checkedUrls,guideSHA256:guide.sha256,allExistingEntrancesPreserved:true},null,2));
