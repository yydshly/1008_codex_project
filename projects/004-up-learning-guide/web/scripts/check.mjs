// 检查生产产物的完整性、阅读入口和子路径所需的相对资源。
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const web=fileURLToPath(new URL('../',import.meta.url));
const dist=path.join(web,'dist');
const data=JSON.parse(await fs.readFile(path.join(dist,'data/content.json'),'utf8'));
assert.equal(data.guides.length,8,'七篇专题与来源页均须保留');
assert.equal(data.pages.length,97);
assert.equal(data.worksheets.length,25);
assert.equal(new Set(data.worksheets.map(item=>item.number)).size,25);
assert.equal(data.wordLists.flatMap(list=>list.terms).length,392);
assert.equal(data.resources.length,67);
for(const guide of data.guides){
  const original=await fs.readFile(path.join(web,'..',guide.file),'utf8');
  const headings=original.split(/\r?\n/).filter(line=>/^#{2,6} /.test(line));
  assert.equal(guide.toc.length,headings.length,`${guide.id}正文目录不得遗漏`);
  await fs.access(path.join(dist,'research',guide.file));
  assert(guide.html.length>1000,`${guide.id}须含完整正文`);
  assert.equal(new Set(guide.toc.map(item=>item.id)).size,guide.toc.length);
  for(const match of guide.html.matchAll(/href="([^\"]+)"/g)){
    const href=match[1].replaceAll('&amp;','&');
    if(href.startsWith('#/guide/'))assert(data.guides.some(doc=>doc.id===href.slice(8).split('?')[0]),`阅读入口不存在 ${href}`);
    if(href.startsWith('./'))await fs.access(path.join(dist,href.slice(2).split('#')[0]));
  }
}
for(const worksheet of data.worksheets){assert(data.guides.find(guide=>guide.id==='05-templates').toc.some(heading=>heading.id===worksheet.section));}
const html=await fs.readFile(path.join(dist,'index.html'),'utf8');
assert(html.includes('lang="zh-CN"'));
assert(html.includes('rel="icon"'));
assert(!/(?:src|href)="\/(?!\/)/.test(html),'页面资源应使用相对路径');
for(const file of ['index.html','app.js','styles.css','data/content.json','research/licenses/LICENSE-CONTENT.md','research/licenses/LICENSE-CODE.md'])await fs.access(path.join(dist,file));
console.log('生产内容与相对资源检查通过：7篇专题、97页、25张工作纸、392词条、67链接，全部阅读和下载入口存在。');
