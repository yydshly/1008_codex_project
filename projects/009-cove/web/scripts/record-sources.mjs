// 只读校对固定上游 checkout，生成源码来源清单；构建网页无需运行此脚本。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { meta, source, diagrams, capabilities, principles, references, directory } from '../content.js';
const upstream = process.argv[2];
if (!upstream) throw new Error('用法：node scripts/record-sources.mjs <固定上游 checkout 绝对路径>');
const commit = execFileSync('git', ['-C', upstream, 'rev-parse', 'HEAD'], { encoding:'utf8' }).trim();
if (commit !== meta.commit) throw new Error('上游提交与研究基线不同。');
const paths = new Set([
  ...diagrams.flatMap(d => d.nodes.flatMap(n => n.files)),
  ...capabilities.flatMap(c => c.files),
  ...principles.flatMap(p => p[2]),
  ...references.map(r => r[0]),
  ...directory.map(d => d[0]).filter(file => !file.includes(' 与 ')),
  'src/routes/index.tsx', 'src/routes/_auth/app/route.tsx', 'src/components/sign-in-social-buttons.tsx',
  '.agents/testing.md', 'AGENTS.md',
]);
const files = [];
const directories = [];
for (const file of [...paths].sort()) {
  const local = path.join(upstream,file);
  const stat = fs.statSync(local);
  if (stat.isDirectory()) { directories.push({ path:file, url:source(file) }); continue; }
  files.push({ path:file, url:source(file), sha256:createHash('sha256').update(fs.readFileSync(local)).digest('hex'), bytes:stat.size });
}
const upstreamPackage = JSON.parse(fs.readFileSync(path.join(upstream,'package.json'),'utf8'));
const project = fileURLToPath(new URL('../../',import.meta.url));
fs.writeFileSync(path.join(project,'src/source-manifest.json'),JSON.stringify({
  schemaVersion:1, upstream:meta.upstream, commit, researchDate:meta.date,
  upstreamPackageVersion:upstreamPackage.version, tag:null, license:'Unlicense',
  scope:'Original Chinese source analysis and static website; upstream application not executed.',
  dependencies:upstreamPackage.dependencies, devDependencies:upstreamPackage.devDependencies,
  files, directories
},null,2)+'\n');
console.log('已校对 '+files.length+' 个文件、'+directories.length+' 个目录；所有页面引用均存在于固定提交。');
