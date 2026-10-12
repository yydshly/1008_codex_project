// 仅在新总览通过实际阅读与下载检查后更新012记录；可重复执行。
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(project,'../..');
let report;
try{report=JSON.parse(await readFile(path.join(project,'assets/understanding/browser-report.json'),'utf8'));}
catch(error){if(error.code==='ENOENT')console.log('理解总览尚未验证，保留原有登记。');else throw error;}
if(report && !JSON.parse(await readFile(path.join(root,'projects.json'),'utf8')).projects.find(p=>p.id==='012')?.summaryItems){
  if(!report.checks.length||report.checks.some(c=>!c.passed)||report.errors.length||report.failures.length)throw new Error('理解总览未通过验证，不登记成果。');
  const upsert=(text,start,end,body,anchor=null)=>{
    const a=text.indexOf(start),b=text.indexOf(end);
    const block=start+'\n'+body.trim()+'\n'+end+'\n';
    if(a>=0&&b>a)return text.slice(0,a)+block+text.slice(b+end.length).replace(/^\n/,'');
    if(anchor&&text.includes(anchor))return text.replace(anchor,block+'\n'+anchor);
    return text.trimEnd()+'\n\n'+block;
  };
  async function record(file,start,end,body,anchor=null){
    const location=path.join(project,file);
    await writeFile(location,upsert(await readFile(location,'utf8'),start,end,body,anchor));
  }
  const overview=[
    '## 能力与价值理解总览',
    '',
    '这个库是给AI编码助手的动画制作工具包：Skill组织步骤，模型理解内容并修改工程，场景与组件负责绘画、动作、合成和导出。其实际增量在于工程和经验复用；成片品质与效率优势尚未通过同任务、同模型的有库/无库对照证明。',
    '',
    '[打开高清总览](http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/overview/) · [下载3200×8524 PNG](assets/understanding/overview.png) · [结构化内容](web/understanding.mjs) · [素材与渲染来源](assets/understanding/manifest.json)',
    '',
    '![Huashu能力与价值总览，含原版效果、制作链路、9项能力、35种风格、9种解说方式、使用场景、模型对比与扩展判断](assets/understanding/overview.png)',
    '',
    '- 原库事实：35份风格配方与场景、9种解说方法（8种有参数实现）、17个绘画动画模块；另有拆解、角色合成、配乐、媒体接入、渲染与检查工具。',
    '- 可制作目标：口播解释、数据内容、产品教程、个人艺术叙事和剪辑片段。品牌批量模板、互动教学与制作辅助需要继续开发。',
    '- 图片边界：照片通常还需生成动作帧、改写场景并合成；任意整图的一键动画化不是现成通用能力。',
    '- 价值判断：模型增强可能降低通用指导的额外价值；经过打磨的模板、素材与工作流仍可能节省重复制作。现阶段按实际贡献选用。',
    '- 验证口径：原版场景运行、本研究新增作品与潜在扩展分开；新增美术和独立制作不能全部归因于原库。解说截图只用于该Skill研究说明。',
    '',
    '网页首页新增“理解总览”，独立overview/提供100%–400%缩放、原图下载、手机阅读与七部分完整文字。'+report.checks.length+'项真实浏览器检查通过，见[验证记录](assets/understanding/browser-report.json)。',
  ].join('\n');
  await record('README.md','<!-- UNDERSTANDING:START -->','<!-- UNDERSTANDING:END -->',overview,'## 研究基线');
  const readmePath=path.join(project,'README.md');
  let readme=await readFile(readmePath,'utf8');
  readme=readme.replace('核心价值是把艺术材料、笔法、造型、母题运动与转场组织成可复用的程序规则。','它提供Skill方法、可复用动画工程与制作经验；价值取决于实际省下的工作与成片结果。');
  await writeFile(readmePath,readme);
  await record('notes.md','<!-- UNDERSTANDING:START -->','<!-- UNDERSTANDING:END -->',[
    '## 能力理解总览接入（2026-10-09）','',
    '目的：把用户讨论中的本质、能力、图片输入、模型对比、可实现目标和扩展价值统一接回网页，避免只看35种风格或把新增美术当作原库能力。','',
    '实现：web/understanding.mjs为内容唯一来源；overview/render.mjs生成完整图版与阅读页。用固定上游场景本机静帧和作者解说截图，按精确中文HTML/CSS排版，经Chromium导出3200×8524 PNG（约4.0 MiB）。没有生成或修改新美术。原版引擎文件未改动。','',
    '执行：网页npm.cmd run build → node src/render-understanding.mjs → 重新build复制图版 → node src/verify-understanding.mjs → node src/update-understanding.mjs → npm.cmd run index:build / check。命令相对项目或根目录执行。','',
    '观察：'+report.checks.length+'项阅读流程检查通过，包括真实PNG下载SHA、缩放与复位、源码链接、桌面、手机、无JavaScript和原版橡皮管深链接。图版含7部分、9项能力、35方向、9解说方法、6场景和4扩展方向；文字版可展开查证。','',
    '判断：没有做有库/无库的生产对照；图中明确把事实、研究建议、待开发扩展与品质边界分开。只发布到本地预览，索引demo继续为空。',
  ].join('\n'));
  await record('assets/README.md','<!-- UNDERSTANDING:START -->','<!-- UNDERSTANDING:END -->','## 能力与价值总览\n\nunderstanding/overview.png为3200×8524完整图版，preview.jpg为同版JPEG。中文正文和版式为本研究原创，图内使用styles/的原版渲染静帧和upstream/的作者解说示范截图，均保留原有署名与许可口径。不是新增生成美术。manifest.json记录输入与输出SHA、来源、尺寸和检查；browser-report.json记录真实阅读、缩放、下载与回归。desktop/mobile及viewer-*为实际页面截图，detail-*用于局部排版核对。');
  await record('src/README.md','<!-- UNDERSTANDING:START -->','<!-- UNDERSTANDING:END -->','## 理解总览制作与验证\n\n- render-understanding.mjs：从overview/poster.html导出完整PNG，检查原图加载与来源文件，记录SHA。\n- verify-understanding.mjs：验证真实阅读、缩放、PNG下载、手机、无脚本和风格深链接。\n- update-understanding.mjs：仅在验证通过后更新012登记、资料与总览来源说明。\n\n总览内容在../web/understanding.mjs，图版/网页共用../web/overview/render.mjs。复现截图需要Playwright；网页自身无第三方依赖。');
  await record('web/README.md','<!-- UNDERSTANDING:START -->','<!-- UNDERSTANDING:END -->','## 理解总览\n\n首页#understanding接入完整研究图；overview/提供放大、高清PNG下载、完整文字与来源，overview/poster.html为可编辑图版的浏览器渲染入口。内容唯一源为understanding.mjs。assets/understanding/overview.png及来源清单必须一并部署。复现图版见../src/render-understanding.mjs，阅读检查见../src/verify-understanding.mjs。');
  const deploymentFile=path.join(root,'docs/DEPLOYMENT.md');
  await writeFile(deploymentFile,upsert(await readFile(deploymentFile,'utf8'),'<!-- HUASHU_UNDERSTANDING:START -->','<!-- HUASHU_UNDERSTANDING:END -->','### 012 能力与价值总览\n\n首页#understanding及overview/已接入；overview/poster.html为图版源。部署完整dist/，保留overview/的HTML/CSS/JS、assets/understanding/的3200×8524 PNG与来源记录、data/understanding.json。所有资源相对引用；阅读、PNG下载、缩放、手机、无脚本与原版风格深链接已在完整子路径检查。当前本地入口为http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/overview/，没有新增在线demo登记。'));
  const metadataFile=path.join(root,'projects.json');
  const metadata=JSON.parse(await readFile(metadataFile,'utf8'));
  const entry=metadata.projects.find(p=>p.id==='012'&&p.slug==='huashu-art-motion');
  if(!entry)throw new Error('找不到012登记');
  Object.assign(entry,{
    summary:'一张高清图汇总Skill与动画工程、9项能力、35种风格、9种解说方法、使用场景、模型对比及扩展价值；保留原版动态效果与7部新增作品，区分已有能力与研究判断。',
    cover:'projects/012-huashu-art-motion/assets/understanding/desktop.jpg',
    coverAlt:'Huashu研究网页的理解总览入口：原版效果与完整能力图预览，以及工程复用、使用目标和模型对比说明',
    coverCaption:'2026-10-09本地实际截图。新增3200×8524中文总览图，使用固定上游57d6760的原版场景静帧与作者解说截图；高清阅读、缩放、下载、手机和无脚本已验证。分类、价值判断与扩展方向为本研究归纳。',
  });
  await writeFile(metadataFile,JSON.stringify(metadata,null,2)+'\n');
  console.log('012理解总览、研究口径、来源及索引已更新。');
}

// 完整发布登记优先，避免旧的截图封面与短摘要覆盖最新记录。
await import('./update-publication.mjs');
