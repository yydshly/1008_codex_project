// 仅同步本项目；保持所有其他项目元数据和已验证 demo。
import {readFile,writeFile} from 'node:fs/promises';
import {publication,guide} from '../publication.mjs';
const catalogFile=new URL('../../../../projects.json',import.meta.url);
const catalog=JSON.parse(await readFile(catalogFile,'utf8'));
const old=catalog.projects.find(item=>item.id==='009');
if(old && old.slug!=='cove')throw new Error('009 编号已经分配给其他项目，停止同步。');
const entry={
  ...old,id:'009',slug:'cove',name:'Cove 全栈模板架构研究',
  summary:'完整理解 Cove 的全栈模板定位、八类能力、八组模块、六个原理、六类场景、复用价值、八处接口与六步适配，沿用已有完整引导图和四张交互架构图。',
  upstream:publication.meta.upstream,status:'已完成',
  summaryItems:publication.summaryItems,overviewItems:publication.overviewItems,
  tags:['全栈模板','TanStack Start','SSR / RPC','Better Auth','Drizzle','业务适配'],
  cover:'projects/009-cove/assets/'+guide.file,coverFull:'projects/009-cove/assets/'+guide.file,
  coverAlt:'Cove 完整中文引导图：模板定位、基础能力、六类场景、模块架构、执行原理、八处扩展接口和六步业务适配',
  coverCaption:'沿用 2026-10-09 原创 '+guide.width+'×'+guide.height+' 完整 PNG；固定源码 e7d40d5，2026-10-12 补全中文理解。原图不裁切、不重绘；已有能力、配置项和建议开发分别标明，静态网站验证不代表 Cove 后端运行验证。',
  demo:old?.demo??'',
};
catalog.projects=catalog.projects.filter(item=>item.id!=='009').concat(entry).sort((a,b)=>Number(a.id)-Number(b.id));
await writeFile(catalogFile,JSON.stringify(catalog,null,2)+'\n');
console.log('009 摘要、图前介绍与既有完整引导图已同步；demo 保留当前登记。');
