// 原创研究记录与来源清单生成。保留上游许可，并核对复制文件与固定提交内容逐字节一致。
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {meta,styles,capabilities,grammars,principles,method,source} from '../web/content.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function files(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())result.push(...await files(f));else result.push(f);}return result;}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=[];
async function record(dir,upstreamPrefix,license){for(const f of await files(path.join(project,dir))){const rel=path.relative(path.join(project,dir),f).replaceAll('\\','/');const upstream=upstreamPrefix+rel;const bytes=await readFile(f),original=await readFile(path.join(project,'upstream',upstream));if(sha(bytes)!==sha(original))throw new Error('复制内容发生变化：'+f);manifest.push({local:path.relative(project,f).replaceAll('\\','/'),upstream,sha256:sha(bytes),bytes:bytes.length,license,modified:false});}}
await record('src/upstream-engine','scripts/engine/','MIT；lib/fonts/遵循各自OFL，见LICENSES.md');
await record('src/references','references/','MIT');
for(const [local,upstream,license]of [
  ['src/LICENSE.upstream.txt','LICENSE','MIT'],['src/README.upstream.md','README.md','MIT文档；素材例外见README'],
  ['assets/upstream/styles-overview.jpg','assets/全风格总览.jpg','包含作者角色的总览图仅用于Skill示范'],
  ...['monet.gif','egypt.gif','pixel.gif'].map(f=>['assets/upstream/'+f,'assets/showcase/'+f,'作者角色与示范素材仅用于Skill示范']),
]){const bytes=await readFile(path.join(project,local));if(sha(bytes)!==sha(await readFile(path.join(project,'upstream',upstream))))throw new Error('素材与上游不一致');manifest.push({local,upstream,sha256:sha(bytes),bytes:bytes.length,license,modified:false});}
await record('assets/upstream/动画语法','assets/动画语法/','作者示范截图；包含作者角色时仅用于Skill示范');
let verification=null;try{verification=JSON.parse(await readFile(path.join(project,'assets','render-verification.json'),'utf8'));}catch{}
await writeFile(path.join(project,'src','source-manifest.json'),JSON.stringify({upstream:meta.upstream,commit:meta.commit,date:meta.date,version:'固定提交；当前提交没有对应tag',scope:'原创研究文档、展示宿主、静帧生成及浏览器验证；上游场景、引擎、字体和参考文档未修改。',attribution:'alchaincyf / 花叔；艺术史穿越构图与少女＋猫设定起源于Tak的Art History Speedrun，未引入其原片画面或音频。',files:manifest,generatedMedia:{styles:'assets/styles/*.jpg：原版Canvas代码于本机渲染，720×405，局部时间0.70秒，无角标；详见render-verification.json',cover:'assets/cover.jpg：本研究生产网页真实浏览器截图'},omitted:'未复制作者人物帧库、口播整片、Arphic笔顺数据和付费媒体凭证。'},null,2)+'\n');
const renderSummary=verification?`已实际运行 ${verification.results.length} 个场景，检查 ${verification.results.filter(r=>r.transition).length} 个进入转场在25%、50%、75%时的绘制；全部场景在0.70秒重复绘制一致。${verification.errors.length}条场景错误，${verification.failedResponses.length}条失败资源请求。`:'原版场景验证结果待写入。';
const rows=styles.map(s=>`| [${s.name}](${s.recipe}) | ${s.group} | ${s.description} | ${s.motion} | ${s.transition} | ${'★'.repeat(s.quality)}；${s.weakness} |`).join('\n');
const readme=`# 012 · Huashu 艺术动画能力与风格研究

基于固定源码整理能力、底层实现和风格发现方法；用原版Canvas引擎展示35种艺术风格。核心价值是把艺术材料、笔法、造型、母题运动与转场组织成可复用的程序规则。

[返回总索引](../../README.md) · [原仓库](${meta.upstream}) · [研究笔记](notes.md)

## 研究基线

| 信息 | 内容 |
| --- | --- |
| 日期 | ${meta.date}（北京时间） |
| 完整提交 | \`${meta.commit}\` |
| 标签/版本 | 固定提交；没有对应tag |
| 上游代码与文档 | MIT；原文保留于[src/LICENSE.upstream.txt](src/LICENSE.upstream.txt) |
| 字体许可 | 各自OFL；保留于[src/upstream-engine/lib/fonts/LICENSES.md](src/upstream-engine/lib/fonts/LICENSES.md) |
| 素材例外 | 作者角色、含该角色的总览图与示范素材仅用于原Skill示范，不随MIT授权其他用途 |
| 研究状态 | 能力与原理整理、35种风格展示完成；动态场景实际运行，未调用付费媒体服务 |
| 演示 | 本地预览；当前未上线，根索引demo为空 |

## 查看效果

![本研究中文网页：原版梵高动态画面与35种艺术风格图鉴](assets/cover.jpg)

本地生产网页截图。主画面使用未修改的原版场景、绘画库与引擎；中文说明、分类、搜索、控制与来源导航为本研究原创。

- 35种风格均有本机真实渲染静帧、视觉描述、绘画方法、运动、转场、适用方向和上游短板。
- 可选择单幅画面、播放/暂停、下一帧、拖动时间、查看进入转场、连续浏览完整35段样片。
- 静帧与研究正文在HTML中，关闭JavaScript仍可阅读；动态画面需要浏览器脚本。
- 作者的3段GIF与8种解说语法截图保留来源，用于说明原Skill效果。

## 本地构建与预览

Node.js 22或更新版本。网页没有第三方构建/运行依赖，不需要模型、账号、API密钥、Python或FFmpeg。

~~~powershell
cd projects/012-huashu-art-motion/web
npm.cmd run build
npm.cmd run preview
~~~

打开 http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/ 。\`#style=17_ink\`可直接定位水墨并刷新。

产物为\`web/dist/\`。所有资源使用相对路径，原版引擎位于\`engine/\`；后续发布必须复制完整产物，保留字体、图片、研究文件与许可。页面通过HTTP服务打开，直接双击file://不能完整运行原版场景的XHR与字体加载。

## 能力汇总

${capabilities.map(([title,count,text,boundary,file])=>`### ${title} · ${count}\n\n${text}\n\n边界：${boundary}\n\n[固定源码依据](${source(file)})`).join('\n\n')}

### 九种解说动画语法

${grammars.map(([id,title,text])=>`- **${title}**：${text} [语法卡](${source('references/动画语法/'+id+'.md')})`).join('\n')}

前8种附参数化片段与示范，第9种讲解员式提供语法卡和整片参考。口播转录和完整时间轴仍由调用方的视频管线提供；整片参考目录不能一概当作开箱即用工程。

## 35种艺术方向

以下类别与适用方向为本研究归组；名称、绘画手法、运动、转场、质量和短板来自上游索引。艺术流派、艺术家、媒介和数字观感混合登记，条目不是互斥的艺术史分类。

| 风格/上游配方 | 本研究类别 | 视觉描述 | 母题运动 | 进入转场 | 当前成熟度与短板 |
| --- | --- | --- | --- | --- | --- |
${rows}

作者自评为20种★★★、14种★★、1种★。伦勃朗需重做；角色不够融入背景是普遍短板。编号最大为36但07不在当前发布的索引/场景中，实际为35；旧说明里的36不用于本研究统计。

![作者35种风格样片截图总览](assets/upstream/styles-overview.jpg)

上图来自作者固定提交，引用用于该Skill的研究说明；其角色素材不随MIT授权其他用途。

## 风格的思路与寻找方法

项目起点是复刻Tak的Art History Speedrun，先提取场景、运动和转场机制，再通过新风格实验扩充。库提供可查询的配方，风格发现依赖对原作的观察与艺术知识；没有自动搜索全网并判定最佳画风的推荐系统。

${method.map(([title,text],i)=>`${i+1}. **${title}**：${text}`).join('\n')}

已知艺术家：查索引、读卡片和源码。只有参考图：描述色、形、线、材质和光影，提出候选后对照原作。只有感觉：把它转成具体视觉要求，用同一构图比较三个方向；例如宁静自然可先比较莫奈、水墨和水彩，这是本研究的建议。新风格可从最近的渲染器起步，把关键参数、运动、签名转场与短板写进新卡片。

## 底层原理

需求/口播/参考 → AI读取Skill与配方 → 场景代码或JSON → Canvas按时间绘制 → Chromium逐帧取PNG → FFmpeg编码与合入音轨。

${principles.map(([title,text,file],i)=>`${i+1}. **${title}**：${text} [依据](${source(file)})`).join('\n')}

本展示不执行视频编码，浏览器直接播放Canvas。重场景可能无法实时达到30/60fps；这不影响按确定时间逐帧导出的原流程。人物采用已有或生成动作帧时通常是有限帧动画，精细人物表现取决于素材和风格一致性。

## 验证与边界

${renderSummary}

详细记录：[原版场景渲染](assets/render-verification.json)、[浏览器集成验证](assets/browser-verification.json)、[来源SHA清单](src/source-manifest.json)。场景运动测量只比较两帧，不冒称运行了完整上游qa.py或验证了艺术质量。

本研究未生成新人物、语音、AI视频或配乐，也未渲染口播整片；这部分能力是文档/源码核对。作者的兼容性文档说明安装与在线执行是不同层面的验证，Windows系统声音后端尚未实现。

## 来源、许可与改动范围

- 上游：${meta.upstream}，完整commit见基线。
- \`src/upstream-engine/\`保留106个原版文件，含35个场景、17个绘画/动画库、字体和转场；复制内容未修改，SHA清单可核对。
- \`src/references/\`保留风格卡与核心方法文档；\`src/README.upstream.md\`保留作者来源、致谢和许可例外。
- \`assets/styles/\`为原版代码本机生成的720×405静帧，时间0.70秒，不含角标；\`assets/upstream/\`为明确标注的作者示范素材。
- 原创部分：中文研究、分类与选型建议、静态构建、浏览器宿主、筛选控制、截图与验证脚本。没有改变原版绘画算法。
- 原作者注明：艺术史场景构图和少女＋猫设定沿用Tak的原片思路，仓库不含其原片截图或音频。本研究也未引入这些原片素材。
- 未复制作者人物帧库、口播整片和Arphic笔顺数据；字体OFL与作者示范素材的限制继续适用。
`;
await writeFile(path.join(project,'README.md'),readme);
await writeFile(path.join(project,'src','README.md'),`# 来源与实验代码\n\n上游：${meta.upstream}\n\n固定提交：\`${meta.commit}\`。\n\n- upstream-engine/：未修改的上游Canvas引擎、库、35场景、字体与转场。\n- references/：上游MIT风格卡与方法文档；文件SHA见source-manifest.json。\n- LICENSE.upstream.txt：原始MIT许可；字体许可在引擎lib/fonts/中。\n- write-research.mjs：原创来源核对与中文文档生成。\n- render-and-verify.mjs：原创Playwright集成运行与35静帧生成。\n- verify-browser.mjs：原创生产页面集成验证。\n\n验证脚本可通过PLAYWRIGHT_MODULE使用自己的Playwright安装；本机使用工作区依赖包，未作为网页构建依赖。upstream/完整参考克隆被根.gitignore忽略，网页仅依赖已保存的固定快照。\n`);
await writeFile(path.join(project,'assets','README.md'),`# 图片与来源\n\n- cover.jpg、mobile.jpg：本研究生产页面真实截图。\n- styles/*.jpg：原版Canvas于本机绘制，720×405，局部时间0.70秒；来源与观测见render-verification.json。\n- upstream/styles-overview.jpg：上游assets/全风格总览.jpg。\n- upstream/{monet,egypt,pixel}.gif：上游assets/showcase中的长卷成片片段。\n- upstream/动画语法/*.jpg：上游解说示范镜头截图。\n- render-verification.json、browser-verification.json：原版场景与生产页面的真实执行记录。\n\n上游素材基线为${meta.commit}。作者角色、总览及包含该角色的示范素材仅用于Skill示范，不随MIT授权其他用途。本研究只用作该Skill的说明与展示；完整来源与逐文件SHA在../src/source-manifest.json。\n`);
await writeFile(path.join(project,'web','README.md'),'# 中文能力研究与艺术风格展示\n\nNode.js 22+，无第三方构建或网页运行依赖。\n\n~~~powershell\nnpm.cmd run build\nnpm.cmd run preview\n~~~\n\n入口：http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/ 。完整产物在dist/，相对资源支持部署子路径。只展示原版Canvas与已保存素材，不连接模型或媒体服务。\n');
console.log(`已核对${manifest.length}个上游文件，写入中文研究文档与SHA来源清单。`);
for(const [report,updater]of [['assets/production/browser-report.json','./update-production.mjs'],['assets/scenarios/browser-report.json','./update-scenarios.mjs']]){try{await readFile(path.join(project,report),'utf8');await import(updater);break;}catch(e){if(e.code!=='ENOENT')throw e;}}
await import('./update-understanding.mjs');
