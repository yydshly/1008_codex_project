// 公开HTTPS静态发布核验。页面交互另外通过真实浏览器验证。
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const publication=JSON.parse(await readFile(new URL('../web/publication.json',import.meta.url),'utf8'));
const base=new URL('https://yydshly.github.io/1008_codex_project/006-easel/');
const checked=[];
async function get(relative){
  const url=new URL(relative,base),response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200,`${url} HTTP状态`);
  const bytes=Buffer.from(await response.arrayBuffer());
  assert.ok(bytes.length,`${url} 返回为空`);
  checked.push({url:url.href,status:response.status,contentType:response.headers.get('content-type'),bytes:bytes.length});
  return bytes;
}
const resources=['index.html','app.js','research-view.mjs','style.css','publication.css','favicon.svg','facts.json','capabilities.json','verification.json','publication.json','browser-checks.json','capability-map.png','capability-map-prompt.md','research.md','LICENSE.upstream.txt','build-info.json'];
const results=await Promise.allSettled(resources.map(async name=>[name,await get(name)]));
for(const result of results)if(result.status==='rejected')throw result.reason;
const files=Object.fromEntries(results.map(result=>result.value));
const html=files['index.html'].toString('utf8');
for(const [attribute,count] of [['data-summary-item',12],['data-flow-step',7],['data-system-module',8],['data-scenario',6],['data-personal-value',4],['data-reuse-route',4],['data-extension',8]])assert.equal((html.match(new RegExp(attribute,'g'))||[]).length,count,attribute);
assert.ok(html.includes('<noscript>')&&html.includes('#value'));
const remotePublication=JSON.parse(files['publication.json']);
for(const key of ['summary','summaryItems','overviewItems','flow','scenarios','values','reuseRoutes','extensions'])assert.deepEqual(remotePublication[key],publication[key],key);
assert.equal(remotePublication.meta.commit,publication.meta.commit);
assert.equal(JSON.parse(files['capabilities.json']).items.length,114);
const buildInfo=JSON.parse(files['build-info.json']);
assert.match(buildInfo.resourceVersion,/^[0-9a-f]{16}$/);
assert.ok(html.includes(`./app.js?v=${buildInfo.resourceVersion}`)&&html.includes(`./publication.css?v=${buildInfo.resourceVersion}`));
assert.ok(files['app.js'].toString().includes(`const resourceVersion = '${buildInfo.resourceVersion}';`));
assert.equal(createHash('sha256').update(files['capability-map.png']).digest('hex'),publication.meta.guide.sha256);
const entrance=(await get('../')).toString('utf8');
assert.ok(entrance.includes('id="easel"')&&entrance.includes('./006-easel/capability-map.png'));
for(const item of publication.overviewItems)assert.ok(entrance.includes(item.title),`总入口缺少${item.title}`);
// 保留现有发布路径，防止聚合时遗漏其他项目。
const preserved=await Promise.allSettled(['001-sandboard/','002-interview-guide/','003-pascal-editor/overview/','004-up-learning-guide/','005-threejs-game-skills/','013-aihot/'].map(relative=>get('../'+relative)));
for(const result of preserved)if(result.status==='rejected')throw result.reason;
const record={checkedAt:new Date().toISOString(),url:base.href,status:'passed',resourceVersion:buildInfo.resourceVersion,skills:114,guideSha256:publication.meta.guide.sha256,staticFullUnderstanding:true,existingProjectPathsPreserved:true,resources:checked.sort((a,b)=>a.url.localeCompare(b.url)),scope:'HTTPS资源与静态内容；真实浏览器交互核验另行记录。'};
const output=fileURLToPath(new URL('./public-http-checks.json',import.meta.url));
await writeFile(output,JSON.stringify(record,null,2)+'\n');
console.log(`公开HTTPS通过：${checked.length}个资源/入口、114技能、完整理解与原图哈希；记录 ${output}`);
