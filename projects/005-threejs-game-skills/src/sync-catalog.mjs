// 手动同步本项目索引；只修改 005，已验证的 demo 地址保持不变。
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { publication, summaryItems, overviewItems } from '../web/publication-content.js';
import { overview } from '../web/extension-content.js';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const file=path.join(root,'projects.json');
const catalog=JSON.parse(await readFile(file,'utf8'));
const project=catalog.projects.find(p=>p.id==='005'&&p.slug==='threejs-game-skills');
if(!project)throw new Error('005 既有登记缺失；不创建或复用编号。');
Object.assign(project,{summary:publication.summary,summaryItems,overviewItems,cover:`projects/005-threejs-game-skills/assets/${overview.image}`,coverFull:`projects/005-threejs-game-skills/assets/${overview.image}`,coverAlt:overview.alt,coverCaption:'沿用 2026-10-09 生成的完整 1024×1536 中文总览 PNG，2026-10-12 整理发布；参考作者与我们的实际效果图重新排版，作为解释性图文。原图字节保留，原始截图、素材署名与真实输入证据分别记录。'});
await writeFile(file,JSON.stringify(catalog,null,2)+'\n');
console.log('005 索引已同步：12 项摘要、6 段图前介绍及原始完整引导图。');
