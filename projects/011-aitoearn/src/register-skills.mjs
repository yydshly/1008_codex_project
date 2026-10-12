import {readFile,writeFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {skills,meta} from '../web/content.js';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const records=[];
for(const skill of skills){const local=`.agents/skills/${skill.slug}/SKILL.md`;const bytes=await readFile(path.join(project,local));const upstream=await readFile(path.join(project,'upstream',skill.path));if(bytes.toString().replace(/\r\n/g,'\n')!==upstream.toString().replace(/\r\n/g,'\n'))throw new Error('安装内容与研究版本不同：'+skill.slug);records.push({name:skill.slug,path:local,sourcePath:skill.path,source:`${meta.repo}/blob/${meta.commit}/${skill.path}`,sha256:createHash('sha256').update(bytes).digest('hex'),unchangedAfterInstall:true});}
await cp(path.join(project,'src/LICENSE.upstream.txt'),path.join(project,'.agents/LICENSE.upstream.txt'));
await writeFile(path.join(project,'src/skill-installation.json'),JSON.stringify({repository:meta.repo,commit:meta.commit,date:meta.date,scope:'011子项目内原版技能，根项目内aitoearn-gpt-content适配入口',method:'官方skill-installer脚本 --method git --ref固定SHA --dest子项目/.agents/skills',records,adapter:'../../.agents/skills/aitoearn-gpt-content/SKILL.md',discoveryDocs:'https://learn.chatgpt.com/docs/customization/overview#skills'},null,2)+'\n');
console.log('13个上游技能与固定源码一致，许可证和安装清单已保存。');
