import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const dir=path.dirname(fileURLToPath(import.meta.url)),project=path.resolve(dir,'../..');
const json=async p=>JSON.parse(await readFile(path.join(project,p),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const brief=await json('experiments/research-to-post/brief.json');
const plan=await json('experiments/research-to-post/plan.json');
const draft=await json('experiments/research-to-post/draft.json');
const calls=await json('experiments/research-to-post/generation-calls.json');
const prompts=await json('experiments/research-to-post/prompts.json');
const installation=await json('src/skill-installation.json');
const rules=(await json('src/implementation-inventory.json')).rules.find(r=>r.name==='小红书');
if(calls.length!==3||prompts.length!==3||plan.cards.length!==3||draft.media.length!==3)throw new Error('三张图的规划、调用与草稿不一致');
const chars=s=>[...s].length;
const fullText=draft.body+'\n'+draft.tags.map(t=>'#'+t).join(' ');
const output=[];
for(const card of plan.cards){
  const local='assets/research-to-post/'+card.file,bytes=await readFile(path.join(project,local));
  if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('输出不是PNG：'+local);
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  if(width<1||height<1||bytes.length>rules.maxImageSize)throw new Error('无效图片或超出元数据文件限制：'+local);
  const call=calls.find(c=>c.id===card.id);
  if(!call||call.prompt!==prompts.find(p=>p.id===card.id)?.prompt)throw new Error('提示词记录不一致：'+card.id);
  if(!call.startedAt||!call.completedAt||call.tool!=='image_gen.imagegen')throw new Error('缺少真实调用记录：'+card.id);
  if(!call.review?.checked)throw new Error('缺少人工查看记录：'+card.id);
  output.push({...card,local,bytes:bytes.length,width,height,sha256:sha(bytes),requestedRatio:'3:4',ratioMatches:Math.abs(width/height-3/4)<0.005,review:call.review});
}
const checks=[
  {name:'标题长度',actual:chars(draft.title),limit:rules.maxTitleLength,passed:chars(draft.title)<=rules.maxTitleLength},
  {name:'正文与话题长度',actual:chars(fullText),limit:rules.maxBodyLength,passed:chars(fullText)<=rules.maxBodyLength},
  {name:'图片数量',actual:output.length,limit:rules.maxImages,passed:output.length<=rules.maxImages},
  {name:'PNG格式',actual:'png',limit:rules.imageFormats.join(' / '),passed:rules.imageFormats.includes('png')},
  {name:'每张图片文件大小',actual:Math.max(...output.map(o=>o.bytes)),limit:rules.maxImageSize,passed:output.every(o=>o.bytes<=rules.maxImageSize)},
  {name:'请求3:4竖图',actual:output.map(o=>`${o.width}×${o.height}`).join(' / '),limit:'3:4',passed:output.every(o=>o.ratioMatches)}
];
if(checks.some(c=>!c.passed))throw new Error('本地预检未通过：'+JSON.stringify(checks.filter(c=>!c.passed)));
const inputs=[];
for(const original of ['README.md','research.md','web/content.js','src/implementation-inventory.json','experiments/research-to-post/brief.json','experiments/research-to-post/plan.json','experiments/research-to-post/prompts.json']){
  const local=original.startsWith('experiments/')?original:'experiments/research-to-post/inputs/'+path.basename(original);
  const bytes=await readFile(path.join(project,local));inputs.push({original,snapshot:local,bytes:bytes.length,sha256:sha(bytes)});
}
const adapterPath=path.resolve(project,'../../.agents/skills/aitoearn-gpt-content/SKILL.md');
const adapterBytes=await readFile(adapterPath);
const imageSeconds=calls.reduce((n,c)=>n+(Date.parse(c.completedAt)-Date.parse(c.startedAt))/1000,0);
const run={
  id:brief.id,date:'2026-10-09',status:'completed-local-demo',scenario:brief.scenario,
  repository:installation.repository,commit:installation.commit,license:'MIT',
  installation:{count:installation.records.length,originalsUnchanged:installation.records.every(r=>r.unchangedAfterInstall),adapter:plan.adapter,adapterSha256:sha(adapterBytes)},
  execution:{planner:plan.planner,imageTool:plan.imageTool,imageModel:plan.imageModel,usedSkills:plan.skills,generationCalls:calls.length,imageToolSeconds:imageSeconds,storage:plan.storage,actualBackend:false,actualPublishing:false},
  inputs,outputs:output,checks,ruleSource:rules.path,
  conclusion:'完成3张真实生成图、1篇中文文案和1份本地图文草稿。上游原版技能保留；媒体工具和草稿保存通过GPT适配完成。',
  limits:['未运行AiToEarn原版Agent SDK、后台、队列或MCP','未授权社交账号、创建发布任务或实际发布','未验证视频、云剪辑、翻译、互动、分析或商业转化','图像工具没有公开底层模型编号与计费明细','平台检查依据研究版本元数据，不验证当前账号权限或平台审核'],
  quality:{overall:'三张图的主要中文文字正确，配色一致，可作为介绍图草稿。',notes:['第一、第三张添加了未要求的中英文装饰小字，未严格遵守“no extra words”；保留实际结果并记录偏差。','图片中的视频框、图表和桌面卡片是生成的插画，不是原产品界面、视频成片或业务数据；第三张“可以发布”也只是插画检查项。','尚无真实发布、曝光、转化和节省时间的对照测量。']}
};
await writeFile(path.join(dir,'run.json'),JSON.stringify(run,null,2)+'\n');
await writeFile(path.join(dir,'draft.md'),`# ${draft.title}\n\n${draft.body}\n\n${draft.tags.map(t=>'#'+t).join(' ')}\n\n---\n${draft.note}\n`);
await writeFile(path.join(dir,'adapter-SKILL.md'),adapterBytes);
console.log(JSON.stringify({outputs:output.map(({file,width,height,bytes,sha256})=>({file,width,height,bytes,sha256})),checks,imageToolSeconds:imageSeconds},null,2));
