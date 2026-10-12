// Read-only HTTPS verification. Run after a successful Pages deployment.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const project = new URL('../',import.meta.url);
const data = JSON.parse(await readFile(new URL('web/app/overview/research.json',project),'utf8'));
const manifest = JSON.parse(await readFile(new URL('web/public/demos/asset-manifest.json',project),'utf8'));
const origin = 'https://yydshly.github.io/1008_codex_project/';
const base = new URL('003-pascal-editor/',origin);
const sha = process.argv[process.argv.indexOf('--commit')+1];
const runId = process.argv[process.argv.indexOf('--run')+1];
assert.ok(process.argv.includes('--commit') && /^[a-f0-9]{40}$/.test(sha),'Pass the successfully deployed commit with --commit');
assert.ok(process.argv.includes('--run') && /^\d+$/.test(runId),'Pass the successful workflow ID with --run');
const pages = [];
async function get(url) {
  const response = await fetch(url,{signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200,`${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
const html = (await get(new URL('overview/',base))).toString('utf8');
const sections = ['overview-top','capabilities','modules','principles','scenarios','value','extensions','evidence','references'];
for (const id of sections) assert.ok(html.includes(`id="${id}"`),`Missing online section ${id}`);
for (const item of data.summaryItems) assert.ok(html.includes(item.text),`Missing online summary ${item.title}`);
const onlineData = JSON.parse((await get(new URL('research/research.json',base))).toString('utf8'));
assert.deepEqual(onlineData,data,'Published research JSON differs from source');
const markdown = (await get(new URL('research/understanding.md',base))).toString('utf8');
for (const item of data.extensions) assert.ok(markdown.includes(item.verify),`Markdown lacks ${item.title}`);
const guide = await get(new URL('research/pascal-summary.png',base));
const guideHash = createHash('sha256').update(guide).digest('hex');
assert.equal(guideHash,data.meta.guide.sha256);
assert.equal(guide.readUInt32BE(16),data.meta.guide.width);
assert.equal(guide.readUInt32BE(20),data.meta.guide.height);
const prefix = base.pathname;
const refs = [...new Set([...html.matchAll(/(?:src|href)="([^"#]+)(?:#[^"]*)?"/g)].map(m=>m[1]).filter(ref=>ref.startsWith(prefix)))];
for (const ref of refs) {
  await get(new URL(ref,base));
  pages.push({url:new URL(ref,base).href,status:200});
}
const preserved = [];
for (const route of ['', '001-sandboard/art/home/', '002-interview-guide/', '013-aihot/']) {
  const url = new URL(route,origin);
  const content = await get(url);
  if (!route) assert.ok(content.toString('utf8').includes('003-pascal-editor/overview/'),'Root lacks Pascal link');
  preserved.push({url:url.href,status:200});
}
let next = 0;
let bytes = 0;
await Promise.all(Array.from({length:8},async()=>{
  while (next < manifest.assets.length) {
    const asset = manifest.assets[next++];
    const buffer = await get(new URL(asset.file,base));
    assert.equal(buffer.length,asset.bytes,`Published asset bytes differ: ${asset.file}`);
    assert.equal(createHash('sha256').update(buffer).digest('hex'),asset.sha256,`Published asset SHA differs: ${asset.file}`);
    bytes += buffer.length;
  }
}));
const result = {
  checkedAt:new Date().toISOString(),
  deployment:{commit:sha,workflowUrl:`https://github.com/yydshly/1008_codex_project/actions/runs/${runId}`,conclusion:'success'},
  upstreamCommit:data.meta.commit,runtimeVersion:data.meta.runtimeVersion,
  overview:new URL('overview/',base).href,editor:base.href,
  counts:Object.fromEntries(['capabilities','modules','steps','useCases','reuseRoutes','extensions','summaryItems'].map(key=>[key,data[key].length])),
  staticSections:sections,localReferences:pages,
  guide:{...data.meta.guide,onlineSha256:guideHash,originalBytesPreserved:true},
  downloads:{markdownMatches:true,jsonMatches:true},
  assets:{count:manifest.assets.length,bytes,allSha256Match:true},
  preservedProjects:preserved,
  browserVerification:'See notes.md and assets/publication/ for recorded UI checks.',
  limits:['Static research and the real browser editor are deployed. CLI/MCP/model/cloud collaboration are not deployed.','Browser drafts are isolated by origin; localhost drafts are not automatically migrated.'],
};
const output = new URL('publication-verification.json',import.meta.url);
await writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({record:fileURLToPath(output),verifiedResources:manifest.assets.length,bytes,originalGuide:true,localReferences:pages.length,preservedProjects:preserved.length}));
