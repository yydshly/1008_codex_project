import assert from 'node:assert/strict';
import { readFile, access, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../../', import.meta.url));
const load = async file => JSON.parse(await readFile(path.join(project, file), 'utf8'));
const research = await load('src/research.json');
const sourceList = await load('src/source-list.json');
const verification = await load('src/feed-verification.json');
const provenance = await load('assets/guide-provenance.json');
const evidencePaths = await load('src/evidence-verification.json');
const manifest = await load('src/upstream/sources.json');
const sources = sourceList.sources;
const commit = '6e67a9d9e8d87b95b8118a8a0b328a9bebd2bb48';
assert.equal(research.meta.commit, commit);
assert.equal(sourceList.meta.commit, commit);
assert.equal(provenance.researchCommit, commit);
assert.equal(evidencePaths.commit, commit);
assert.equal(sources.length, 18);
assert.equal(new Set(sources.map(source => source.id)).size, 18);
assert.equal(sources.filter(source => source.format === 'Atom').length, 2);
for (const [group, expected] of Object.entries({institution:10,media:5,community:3})) assert.equal(sources.filter(source => source.group === group).length,expected);
const rawSources = Array.isArray(manifest) ? manifest : manifest.sources;
assert.equal(rawSources.length,18);
for (const source of sources) {
  const original = rawSources.find(item => item.id === source.id);
  assert.ok(original, '上游信源缺失：' + source.id);
  assert.equal(source.kind,'rss');
  assert.equal(source.name,original.name);
  assert.equal(source.feedUrl,original.config?.feedUrl, source.id + ' 地址须与上游一致');
  assert.equal(source.tier,original.tier);
  assert.equal(source.intervalMinutes,original.interval_minutes);
  assert.equal(source.owner,original.owner_entity_id ?? null);
  assert.deepEqual(source.tags,original.tags);
  assert.equal(source.displayFulltext,false);
  assert.equal(source.syndicateFulltext,false);
  assert.ok(source.focus && source.value && source.limitations.length);
  assert.ok(verification.results.some(item => item.id === source.id && item.url === source.feedUrl));
}
assert.equal(research.acquisition.length,6);
assert.equal(new Set(research.acquisition.map(item => item.id)).size,6);
for (const [key,minimum] of Object.entries({summaryItems:10,capabilities:13,modules:17,pipeline:9,scenarios:6,reuse:6,extensions:8,limits:12,references:30})) assert.ok(research[key].length >= minimum, '内容不完整：' + key);
const referenced = new Set([...research.references.map(item => item.path),...research.modules.map(item => item.path),...[...research.capabilities,...research.pipeline,...research.acquisition].flatMap(item => (item.evidence ?? []).map(evidence => evidence.path))]);
for (const relative of referenced) {
  if (/^https:\/\//.test(relative)) continue;
  assert.ok(evidencePaths.paths.some(item => item.path === relative && item.exists), '源码路径未核验：' + relative);
}
const guide = await readFile(path.join(project,'assets/aihot-overview.png'));
assert.equal(createHash('sha256').update(guide).digest('hex'),provenance.sha256);
assert.equal(guide.readUInt32BE(16),provenance.dimensions.width);
assert.equal(guide.readUInt32BE(20),provenance.dimensions.height);
assert.ok((await readFile(path.join(project,'src/upstream/LICENSE'),'utf8')).includes('MIT License'));
const escaped = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
let checkedResources = 0;
if (process.argv.includes('--built')) {
  const output = path.join(project,'web/dist');
  const html = await readFile(path.join(output,'index.html'),'utf8');
  for (const key of ['overview','capabilities','modules','pipeline','sources','acquisition','scenarios','reuse','extensions','limits','references']) assert.ok(html.includes(`id="${key}"`));
  assert.equal([...html.matchAll(/data-source-id="/g)].length,18);
  assert.equal([...html.matchAll(/data-adapter="/g)].length,6);
  for (const source of sources) assert.ok(html.includes(escaped(source.feedUrl)) && html.includes(escaped(source.name)));
  for (const item of research.summaryItems) assert.ok(html.includes(escaped(item.text)), '完整摘要未静态发布：' + item.title);
  assert.ok(!/localhost|127\.0\.0\.1|sk-[A-Za-z0-9]{20}/.test(html),'不应包含本机地址或凭据');
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)(?:#[^"]*)?"/g)) {
    const target = path.resolve(output,match[1].split(/[?#]/,1)[0]);
    assert.ok(target.startsWith(output + path.sep));
    await access(target); checkedResources++;
  }
  assert.ok((await readFile(path.join(output,'assets/aihot-overview.png'))).equals(guide));
  assert.deepEqual(JSON.parse(await readFile(path.join(output,'data/research.json'),'utf8')),research);
  assert.deepEqual(JSON.parse(await readFile(path.join(output,'data/source-list.json'),'utf8')),sourceList);
}
const report = {passed:true,commit,sourceCount:sources.length,sourceGroups:sourceList.meta.groups,adapters:6,capabilities:research.capabilities.length,modules:research.modules.length,pipelineSteps:research.pipeline.length,evidencePaths:referenced.size,checkedResources,guideSha256:provenance.sha256,scope:'数据映射、完整静态出版、许可与图片校验；浏览器行为和上游运行另行记录。'};
await writeFile(path.join(project,'src/content-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
