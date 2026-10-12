// 静态读取上游文本；不执行TypeScript。输出为可提交的研究附件。
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {platforms} from '../web/content.js';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await readFile(path.join(project,'src/source-manifest.json'),'utf8'));
const read=(p)=>readFile(path.join(project,'upstream',p),'utf8');
const scalar=(s,k)=>{const raw=s.match(new RegExp('\\b'+k+':\\s*([0-9]+(?:\\s*\\*\\s*[0-9]+)*)'))?.[1];return raw?raw.split('*').map(Number).reduce((a,b)=>a*b,1):null;};
const list=(s,k)=>[...(s.match(new RegExp('\\b'+k+':\\s*\\[([^\\]]*)\\]'))?.[1]||'').matchAll(/'([^']+)'/g)].map(m=>m[1]);
const rules=[];
for(const p of platforms){const text=await read(p.path);const limits=Object.fromEntries(['maxTitleLength','maxBodyLength','maxTotalTextLength','maxImages','maxVideos','maxImageSize','maxVideoSize','maxVideoDuration','maxCount'].map(k=>[k,scalar(text,k)]));rules.push({name:p.name,path:p.path,...limits,imageFormats:list(text,'imageFormats'),videoFormats:list(text,'videoFormats'),updateSupported:text.match(/updateSupported:\s*(true|false)/)?.[1]==='true'});}
const tools=[];
for(const record of manifest.records.filter(r=>r.path.endsWith('.mcp.ts')||r.path.endsWith('.mcp.controller.ts')||r.path.endsWith('agent.constants.ts'))){const text=await read(record.path);const names=[];for(const block of text.matchAll(/export enum (\w*ToolName)\s*\{([^}]+)\}/g)){for(const m of block[2].matchAll(/=\s*'([^']+)'/g))names.push(m[1]);}for(const m of text.matchAll(/@Tool\(\{\s*name:\s*'([^']+)'/g))names.push(m[1]);if(names.length)tools.push({path:record.path,names:[...new Set(names)],evidence:record.path.endsWith('.controller.ts')?'控制器工具声明':'工具名枚举，需核对运行注册'});}
const inventory={commit:manifest.commit,rules,tools,extraPlatform:{name:'Google Business',note:'源码另有Google商家元数据，editor=None、modes=[]，未列为内容发布渠道。',path:'project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/google-business/google-business.constants.ts'}};
await writeFile(path.join(project,'src/implementation-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
console.log(`提取${rules.length}个平台完整限制、${tools.length}组工具声明。`);
