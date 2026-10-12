// 原创登记收尾：仅更新012条目、该项目记录及部署指南的新节，不改动其他项目元数据。
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=path.resolve(project,'../..');
const render=JSON.parse(await readFile(path.join(project,'assets','render-verification.json'),'utf8'));
const browser=JSON.parse(await readFile(path.join(project,'assets','browser-verification.json'),'utf8'));
if(render.results.length!==35||render.results.some(r=>!r.deterministic)||render.errors.length||render.failedResponses.length||browser.checks.some(c=>!c.passed))throw new Error('尚未通过实际验证，不能完成登记。');
const costs=render.results.map(r=>r.frameMs),min=Math.min(...costs),max=Math.max(...costs);
const metadata=JSON.parse(await readFile(path.join(root,'projects.json'),'utf8'));
const entry=metadata.projects.find(p=>p.id==='012'&&p.slug==='huashu-art-motion');if(!entry)throw new Error('找不到012条目');
Object.assign(entry,{status:'已完成',summary:'中文能力与原理研究，实际运行35种原版艺术风格及34个转场；提供静帧、动态浏览、绘画与选型方法、9种解说语法和来源许可。',tags:['艺术动画','Canvas','Skill','风格配方','程序化绘画'],cover:'projects/012-huashu-art-motion/assets/cover.jpg',coverAlt:'Huashu艺术动画中文研究页：原版梵高动态画面、绘画与运动说明，以及35种风格图鉴入口',coverCaption:'2026-10-09 本地生产网页真实截图；固定上游57d6760，35个场景与34个转场已实际绘制，支持逐帧、搜索和手机浏览；未调用媒体生成服务。',demo:''});
await writeFile(path.join(root,'projects.json'),JSON.stringify(metadata,null,2)+'\n');
const notes=`# 012 · 艺术动画研究与复现笔记

日期：2026-10-09（北京时间）。上游：https://github.com/alchaincyf/huashu-art-motion 。基线：57d67608ab458f57d9b153b1a2831b921e22498b。

## 目的与环境

把库的能力、原理和艺术选型方法整理成中文资料，并用真实场景展示35种画风。Windows、PowerShell、Node.js v22.15.0；浏览器Chromium ${render.browser}。Playwright来自工作区包：C:/Users/yun68/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright。网页本身无第三方依赖。

## 阅读范围与结论

README、SKILL、风格INDEX、35张配方、01—04/08—12方法文档、兼容性与媒体指南，engine、render、clip、breakdown、qa和长卷参考。代码/文档MIT；字体各自OFL；作者形象与含其形象的示范仅用于Skill演示。部分旧文说36，当前配方与场景35、07缺席，gallery实际35。独立语法实现8种，第9种讲解员式提供参考代码与自备素材要求。

原仓库艺术算法与制作方法是主要资产；Canvas→Chromium→FFmpeg属于出片工程。复杂人物优先用帧素材，当前35风格图鉴保留原版少女/猫代码骨架，3段作者GIF显示生成帧人物路线。

## 实际命令

~~~powershell
npm.cmd run project:add -- --slug huashu-art-motion --name 'Huashu 艺术动画能力与风格研究' --upstream 'https://github.com/alchaincyf/huashu-art-motion' --summary '整理艺术动画技能的能力与原理，展示35种艺术风格的真实效果、绘画方法、母题运动和转场。'
git clone --depth 1 https://github.com/alchaincyf/huashu-art-motion.git projects/012-huashu-art-motion/upstream
git -C projects/012-huashu-art-motion/upstream rev-parse HEAD
cd projects/012-huashu-art-motion
node src/write-research.mjs
npm.cmd run build --prefix web
npm.cmd run preview --prefix web
node src/render-and-verify.mjs
npm.cmd run build --prefix web
node src/verify-browser.mjs
node src/finish-project.mjs
node src/write-research.mjs
npm.cmd run build --prefix web
cd ../..
npm.cmd run index:build
npm.cmd run check
~~~

验证脚本可用PLAYWRIGHT_MODULE指向自己的Playwright，用RESEARCH_URL更换预览地址。upstream是忽略的参考克隆；展示构建只依赖已保存的固定快照。

## 原版场景实验

输入：原版index.html?film=gallery&render=1；1920×1080画布。遍历35个ERAS，分别取0.42、0.70、0.85、0.90秒，缩略图在0.70秒生成720×405 JPEG，无角标。每段重复绘制0.70秒并比较完整Canvas数据；先绘其他时间再回到0.70秒，35段均一致。

对每个有转场的段落分别调用renderFrame到25%、50%、75%的进度，34个进入转场均执行。场景脚本错误${render.errors.length}，失败资源请求${render.failedResponses.length}。完整记录在[render-verification.json](assets/render-verification.json)。

运动测量：将画面缩小到192×108，比较0.42和0.90秒，RGB平均差>12的像素占比。35段都有变化；这是两帧线索，纹理变化也计入，不等于完整运动质量或流畅度评价。实际单次绘制加GPU读取样本约${min}—${max}ms，本机重场景无法稳定实时达到30/60fps；确定时间逐帧出片与实时播放有不同性能目标。没有运行完整qa.py，没有编造艺术质量评分。

## 生产页面集成验证

实际子路径：http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/ 。桌面1440×1080，手机390×844，无JavaScript手机上下文。最终通过${browser.checks.length}项检查，详见[browser-verification.json](assets/browser-verification.json)。

覆盖：35静态卡/6类能力/9语法；类别8项与搜索组合；零结果；切换莫奈；下一帧改变Canvas；转场；播放与暂停；键盘时间调节；41.25秒连续浏览；末段1.40625秒时长；水墨深链接和刷新；全部相对图片及研究文件；桌面、手机与无脚本不水平溢出。记录真实cover.jpg和mobile.jpg。

## 发现的问题与修复

1. 上游engine把末段t1设为1e9哨兵。宿主不能用t1−t0当末段实际时长，改为dur或eighths×60/BPM/2；末段1.40625秒已验证。
2. 首轮集成检查发现键盘拖动时间不生效：input处理先暂停，暂停同步控件时覆盖了新值。改为先保存请求值，再暂停和绘制；重新检查通过。
3. 作者解说总览图是多镜头横条，强制16:9 cover会裁掉画面。改为保留原始比例并提供打开完整图的链接。

## 原创与上游范围

170个复制文件已与固定克隆逐字节核对SHA，包括106个原版引擎文件、风格与方法文档、MIT及作者样片。原创的是中文归组、描述、选型建议、展示宿主、控制与筛选、构建、来源核对和浏览器验证。上游绘画代码未修改。没有引入作者人物帧库、Arphic整片笔顺数据、凭证或.env。

## 边界与后续

未调用图片、语音或视频生成服务，未执行完整口播整片、配乐合成或FFmpeg视频编码。作者的宿主在线/媒体测试不是本研究的执行结果。实时播放取决于浏览器和设备。将来可在用户指定题材后实做一种新风格，或按上游render.py导出视频；当前研究目标已完成，尚未对外发布。
`;
await writeFile(path.join(project,'notes.md'),notes);
const deployment=`
## 012 · Huashu 艺术动画与风格研究

[012 · Huashu 艺术动画能力与风格研究](../projects/012-huashu-art-motion/README.md)为独立原生静态网页。能力、原理、35种艺术方向、绘画/运动/转场和选型方法写入HTML；同源iframe实际运行固定版本的原版Canvas引擎。Node.js 22+，无第三方网页依赖，无需模型和API密钥。

~~~powershell
cd projects/012-huashu-art-motion/web
npm.cmd run build
npm.cmd run preview
~~~

本地入口：http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/ 。\`#style=17_ink\`可直达并刷新。可用\`node scripts/serve.mjs --dir dist --port 4212 --base /1008_codex_project/012-huashu-art-motion/\`验证其他部署子路径。

未来统一发布将完整\`web/dist/\`复制到\`_site/012-huashu-art-motion/\`，保留engine/（脚本、35场景、字体与字体许可）、assets/（静帧、作者示范和验证记录）、data/、研究文档、source-manifest.json及MIT原文。资源均相对引用；必须通过HTTP托管，直接file://打开不能完整执行原版XHR及字体加载。

35个场景与34个转场已实际绘制，生产子路径、桌面/手机、搜索、逐帧、播放、深链接和无JavaScript阅读已检查。实时Canvas重场景的帧率受设备限制，视频导出另需上游Python/Playwright/FFmpeg。作者角色素材限制与字体许可继续适用。当前未对外发布，索引demo为空。
`;
const deploymentPath=path.join(root,'docs','DEPLOYMENT.md'),existing=await readFile(deploymentPath,'utf8');
if(!existing.includes('## 012 · Huashu'))await writeFile(deploymentPath,existing.trimEnd()+'\n'+deployment);
console.log('012项目记录、索引元数据与部署说明已完成；保留其他项目。');
for(const [report,updater]of [['assets/production/browser-report.json','./update-production.mjs'],['assets/scenarios/browser-report.json','./update-scenarios.mjs']]){try{await readFile(path.join(project,report),'utf8');await import(updater);break;}catch(e){if(e.code!=='ENOENT')throw e;}}
await import('./update-understanding.mjs');
