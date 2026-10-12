import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve('projects/004-up-learning-guide');
const upstream = process.argv[2];
if (!upstream) throw new Error('需要固定提交上游路径');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).filter(e => !['node_modules','dist','.git'].includes(e.name)).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const errors = [];
let localLinks = 0, fixedLinks = 0;
const files = walk(root).filter(f => f.endsWith('.md'));
const commit = '35e2aa9ad3a076fe4e8405877cc560df2593838f';
const prefix = `https://github.com/byoungd/up/blob/${commit}/`;
for (const file of files) {
  const body = fs.readFileSync(file,'utf8').replace(/^(?:```|~~~)[\s\S]*?^(?:```|~~~)[^\n]*$/gm, '');
  for (const match of body.matchAll(/\[[^\]\n]*\]\(([^\s)]+)(?:\s+[^)]*)?\)/g)) {
    const target = match[1];
    if (target.startsWith(prefix)) {
      fixedLinks++;
      if (!fs.existsSync(path.join(upstream, decodeURIComponent(target.slice(prefix.length).split(/[?#]/)[0])))) errors.push(`${file}: 上游文件不存在 ${target}`);
    } else if (!/^(?:https?:|mailto:|#)/.test(target)) {
      localLinks++;
      if (!fs.existsSync(path.resolve(path.dirname(file), decodeURIComponent(target.split(/[?#]/)[0])))) errors.push(`${file}: 本地链接不存在 ${target}`);
    }
  }
}
const inventory=JSON.parse(fs.readFileSync(path.join(root,'sources/inventory.json'),'utf8'));
const lists=JSON.parse(fs.readFileSync(path.join(root,'sources/word-lists.json'),'utf8')).wordLists;
const coverage=fs.readFileSync(path.join(root,'sources/coverage.md'),'utf8');
if ([...coverage.matchAll(/^### \d+ ·/gm)].length!==97) errors.push('逐页目录条数不符');
if (inventory.items.length!==97 || lists.length!==10 || lists.flatMap(l=>l.terms).length!==392) errors.push('来源/词表数量不符');
for (const name of ['LICENSE.md','LICENSE-CONTENT.md','LICENSE-CODE.md']) {
  const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  if (hash(path.join(root,'licenses',name))!==hash(path.join(upstream,name))) errors.push(`许可副本发生修改 ${name}`);
}
if(errors.length) throw new Error(errors.join('\n'));
console.log(JSON.stringify({markdownFiles:files.length,localLinks,fixedVersionLinks:fixedLinks,coveragePages:97,wordListEntries:392,licenseCopies:3,passed:true},null,2));
