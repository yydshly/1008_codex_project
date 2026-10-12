// 作品版只有在完整出片和端到端验证通过后登记；不修改其他研究项目。
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=path.resolve(project,'../..');
const render=JSON.parse(await readFile(path.join(project,'assets/production/render-report.json'),'utf8'));
const browser=JSON.parse(await readFile(path.join(project,'assets/production/browser-report.json'),'utf8'));
if(render.results.length!==7||render.results.some(r=>r.frames!==720||r.width!==1920||r.height!==1080||r.audio!=='aac'||!r.deterministic)||render.errors.length||browser.checks.some(c=>!c.passed)||browser.errors.length||browser.failures.length)throw new Error('作品版实际出片或端到端验证尚未通过');
const metadataFile=path.join(root,'projects.json'),metadata=JSON.parse(await readFile(metadataFile,'utf8')),entry=metadata.projects.find(p=>p.id==='012');
Object.assign(entry,{summary:'35种原版艺术风格与原理研究；新增7部30秒1080p应用作品，真实美术素材、透明人物帧、产品与数据叙事、录制配乐及可探索园林导览。',cover:'projects/012-huashu-art-motion/assets/production/desktop.jpg',coverAlt:'重新制作的艺术动画应用作品集：上海蓝调旅行画面，原创旅行者站在江边，七个使用场景可切换播放',coverCaption:'2026-10-09 新版生产页面实际截图。七片各30秒，1920×1080、24fps、AAC配乐；新生成的美术与人物动作帧合成，包含完整产品和数据演示、可行走与查看展品的园林。配乐Dreamer / Kevin MacLeod / CC BY 4.0。原版35种風格研究继续保留。',tags:['艺术动画','Canvas','Skill','风格配方','场景作品','互动导览'],demo:''});
await writeFile(metadataFile,JSON.stringify(metadata,null,2)+'\n');
const oldMarker='## 七个扩展场景的实际效果',newMarker='## 七场景作品版（2026-10-09）';
const readmeFile=path.join(project,'README.md');let readme=await readFile(readmeFile,'utf8');
readme=readme.split('\n'+oldMarker)[0].split('\n'+newMarker)[0];
readme=readme.replace('能力与原理整理、35种风格展示完成；动态场景实际运行，未调用付费媒体服务','能力与原理、35种风格展示完成；作品版实际生成美术、合成并导出七片，未接入客户账号或外部视频生成');
readme=readme.replace('本研究未生成新人物、语音、AI视频或配乐，也未渲染口播整片；这部分能力是文档/源码核对。','原版研究阶段的外部媒体能力是源码/文档核对；本次作品版实际使用内置image_gen生成美术和人物帧，导出七片，未调用外部图生视频、语音复刻或口播整片。');
readme=readme.replace('原版研究阶段未调用人物、语音或AI视频生成。新增扩展阶段另绘原创代码角色、合成配乐并逐帧导出七片；未渲染口播整片，外部媒体生成仍仅核对文档/源码。','原版研究阶段的外部媒体能力是源码/文档核对；本次作品版实际使用内置image_gen生成美术和人物帧，导出七片，未调用外部图生视频、语音复刻或口播整片。');
await writeFile(readmeFile,readme.trimEnd()+`\n\n${newMarker}\n\n上一版只有代码原型，未达到用户要求的使用场景效果。本版重新制作环境美术、透明人物动作、完整产品界面与数据报告，并加入录制配乐、镜头、局部运动和字幕。\n\n[打开应用作品集](http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/scenarios/)，可看片、定位章节、全屏、开配乐与下载。文化导览点击“开始探索”后可行走、选择路线，并走近四个对象查看。\n\n![新版应用作品集的实际生产页面](assets/production/desktop.jpg)\n\n七部作品：旅行宣传、成长纪念、知识讲述、产品介绍、数据报告、情绪短片、文化导览。每部30秒，1920×1080、24fps、H.264/AAC；实际逐帧出片7×720=5040帧。角色为虚构原创人物，产品与业务数据为明示示例；配乐Dreamer由Kevin MacLeod创作、CC BY 4.0。\n\n详见[作品制作与使用方向](production-research.md)、[实际渲染报告](assets/production/render-report.json)、[端到端验证](assets/production/browser-report.json)、[素材与音乐署名](assets/production/CREDITS.md)、[实际生图提示词](assets/production/prompts.json)。旧版保存在[实验记录](experiments/scenario-v1/README.md)，原35种风格展示继续保留。\n`);
const notesFile=path.join(project,'notes.md'),notes=(await readFile(notesFile,'utf8')).split('\n## 七场景扩展的实际执行（2026-10-09）')[0].split('\n## 作品版重新制作（2026-10-09）')[0];
await writeFile(notesFile,notes.trimEnd()+`\n\n## 作品版重新制作（2026-10-09）\n\n按用户反馈重做七场景；旧版源和影片留存。内置image_gen实际生成7张素材，透明人物16姿势，以四帧有效步态合成；Pillow只读取边界和Alpha清单。直接加载原版U/MO，新增制作均在production-*文件，原版106引擎文件未修改。\n\n七部30秒/1080p/24fps实际影片，共5040帧；Chromium JPEG质量0.96管道，FFmpeg H.264 CRF18，全部合入Dreamer真实录制配乐，CC BY 4.0，截取、响度处理、淡入淡出，片尾与网页保留署名。检查后修正前景重影、导览花坛边界和产品交付列计数。\n\n完整视频解码、逐帧合成对照、播放/暂停/章节/音轨、资源与范围请求、键盘和手机按钮行走、连续路线、四个发现持续记录共${browser.checks.length}项检查通过。生产桌面和手机截图保存在assets/production/；原版35种风格网页另验证。报告、提示词、来源与使用限制在production-research.md和CREDITS.md。没有对外部署或连接真实客户数据。\n`);
for(const[file,marker,body]of[
  ['assets/README.md','## 作品版素材与影片','production/保存本次7张生成PNG、实际提示词/尺寸/Alpha/SHA清单、7部30秒1080p MP4、21张章节静帧、封面、总览和桌面/手机截图。Dreamer配乐为Kevin MacLeod真实录制音乐，CC BY 4.0；官方来源、许可及剪辑说明见production/CREDITS.md。旧scenarios/保留被替代的代码原型，旧版合成音轨不用于新版。'],
  ['src/README.md','## 作品版制作','prepare-production.py只读取图片清单与脚底锚点；render-production.mjs真实逐帧编码七片并探测视频音轨；verify-production.mjs验证实际视频和探索；update-production.mjs仅在成功后登记012元数据。新版代码在../web/scenarios/production-*；旧代码原型另保存在../experiments/scenario-v1/。'],
]){const p=path.join(project,file),body0=(await readFile(p,'utf8')).split('\n## 原创扩展作品')[0].split('\n## 七场景实验')[0].split('\n'+marker)[0];await writeFile(p,body0.trimEnd()+'\n\n'+marker+'\n\n'+body+'\n');}
await writeFile(path.join(project,'web/README.md'),'# 风格研究与七场景应用作品集\n\nNode.js 22+，无第三方网页运行依赖。npm.cmd run build与npm.cmd run preview生成和打开dist/。首页保留35种原版Canvas风格，scenarios/展示新版七部30秒1080p作品和可行走园林；全部资源为相对路径。重新出片需Playwright/FFmpeg和已保存素材，见../production-research.md。页面不连接客户账号或生成服务。\n');
const deployPath=path.join(root,'docs/DEPLOYMENT.md');let deploy=await readFile(deployPath,'utf8');
deploy=deploy.split('\n### 012 新增七场景实验')[0].split('\n### 012 七场景作品版')[0];
await writeFile(deployPath,deploy.trimEnd()+'\n\n### 012 七场景作品版\n\nscenarios/现为新版应用作品集。必须复制完整dist/，其中assets/production/包含七部30秒1080p MP4、AAC音乐、PNG美术、封面、提示词清单与CREDITS.md及CC-BY-4.0.txt；不得遗漏音乐署名和许可。字体OFL和上游MIT照常保留。服务器应提供video/mp4、audio/mp4与HTTP范围请求，本地serve.mjs已验证视频播放和定位。深链接可用#scene=interactive等。配乐默认静音，用户按钮开启；导览本地运行不需要后端。当前未公开部署，根索引demo为空。\n');
console.log('012作品版实际成果、索引与署名记录已登记。');
await import('./update-understanding.mjs');
