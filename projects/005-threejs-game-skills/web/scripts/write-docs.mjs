// 原创生成器：展示页和中文 README 使用同一份能力数据。
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { meta, source, demos, skills, tools, constraints } from '../content.js';
import { overview, layers, workflow, enforcement, division, lessons, scenarios, personalValues, usageBrief } from '../extension-content.js';
import { publication, summaryItems, moduleParts, reuseRoutes, expansionDirections } from '../publication-content.js';
const project=fileURLToPath(new URL('../../',import.meta.url));
let publicVerification;
try { publicVerification=JSON.parse(await readFile(path.join(project,'src/publication-verification.json'),'utf8')); }
catch(error) { if(error.code!=='ENOENT')throw error; }
const deploymentStatus=publicVerification?.result==='PASS'
  ? `已部署：[公开研究网页与三款试玩](${publication.url})。GitHub Pages 运行 [${publicVerification.workflow.id}](${publicVerification.workflow.url}) 成功，公开 HTTP 与实际浏览器核验通过后登记 demo；完整范围和限制见 [publication-verification.json](src/publication-verification.json)。`
  : `部署目标：${publication.url}。最终公开访问与登记以 src/publication-verification.json 为准；本地构建与预期地址不代表部署成功。`;
const clean=value=>String(value).replaceAll('|','／').replaceAll('\n',' ');
const extensionMd=`## 一图总览：能力、原理、实践与个人价值

![${overview.alt}](assets/${overview.image})

[下载完整 PNG](assets/${overview.image}) · [图片制作与参考记录](assets/overview/README.md)

${overview.definition}

${overview.interpretation}

总览图由 Codex 内置 image_gen 生成，以作者赛车、空战和我们的港口、水墨两版实际截图为视觉参考。背景经过重新组合，属于解释性图文；原始截图与实际输入证据分别保留。源码研究、我们的实现和已验证结果不互相替代。

## 完整理解摘要（${publication.date}）

${summaryItems.map(item=>`- **${item.title}**：${item.text}`).join('\n')}

## 四层模块：入口、判断、执行与工程

${moduleParts.map(item=>`### ${item.name}\n\n${item.function}\n\n输入：${item.input}\n\n产物：${item.output}\n\n边界：${item.boundary}`).join('\n\n')}

## 核心原理：四层资源如何起作用

${layers.map(item=>`### ${item.name}：${item.object}\n\n${item.detail}\n\n限制：${item.limit}\n\n[固定版本出处](${source(item.path)})`).join('\n\n')}

制作链：${workflow.map(item=>item.name).join(' → ')}。验收发现问题后，回到实现继续修改。

${workflow.map((item,index)=>`${index+1}. **${item.name}**：${item.output}。${item.explanation}`).join('\n')}

### “控制”在哪一层执行？

| 强度 | 约束 | 例子 | 边界 |
| --- | --- | --- | --- |
${enforcement.map(item=>`| ${item.strength} | ${item.name} | ${clean(item.example)} | ${clean(item.scope)} |`).join('\n')}

## 我们的扩展与理解

| 水墨第一版：几何原型 | 水墨第二版：素材与战斗接入 |
| --- | --- |
| ![第一版实际截图](assets/ink-v1-active.png) | ![第二版实际截图](assets/ink-active.png) |

第一版已经可玩，用户反馈太简单、看不出风格。第二版增加绘画资产、逐姿态 UV 与脚底锚点、动作、笔触和 UI，并重新验证。它是投入额外资源与时间的历史迭代，没有控制预算，不能当作有技能／无技能的公平对照。

| 环节 | 库提供 | 我们实现与扩展 |
| --- | --- | --- |
${division.map(item=>`| ${item.topic} | ${clean(item.library)} | ${clean(item.ours)} |`).join('\n')}

${lessons.map(item=>`### ${item.title}\n\n${item.fact}\n\n理解：${item.meaning}`).join('\n\n')}

## 使用场景

${scenarios.map(item=>`### ${item.name}\n\n${item.example}${item.fit}\n\n限制：${item.limit}`).join('\n\n')}

复杂多人同步、账号服务、经济系统、反作弊与大型内容生产需要另外设计。AAA 命名表达画面目标，不是质量认证；素材使用权、真实手机性能和上线要求需要分别确认。

## 对我的价值与实际用法

${personalValues.map(item=>`- **${item.name}**：${item.description}`).join('\n')}

模型提升后，通用知识提示的增益可能缩小；工程、工具与验收流程仍可复用。是否净省时、减少返工或提高品质，需要固定模型、资源、预算与时间做对照，本研究尚未量化。

### 四条复用路线

${reuseRoutes.map(item=>`- **${item.title}**：${item.detail}`).join('\n')}

### 八项可继续开发的方向

以下均为研究规划，尚未作为扩展产品交付。

${expansionDirections.map(item=>`#### ${item.title}\n\n切入点：${item.entry}\n\n${item.work}\n\n先验证：${item.validation}`).join('\n\n')}

可以改写的需求示例：

\`\`\`text
${usageBrief}
\`\`\`
`;
const md=`# 005 · Three.js 游戏技能研究

一张图汇总库的能力、原理、场景和个人价值，结合两款原创游戏及水墨风格前后对照，说明上游提供什么、我们新增什么。提供实际试玩、作者五款原始效果、九类技能、可运行工具、约束与验证边界。

[返回总索引](../../README.md) · [原仓库](${meta.repo}) · [研究笔记](notes.md) · [中文展示页源码](web/index.html)

${extensionMd}

## 真实使用：竹影问剑水墨剑客

![水墨剑客实际蓄力画面](assets/ink-active.png)

第二次读取同样六个制作技能，实际运行上游脚手架，开发原创侧视剑斗。根据“风格不明显”的反馈，第二版读取图像素材检查流程，使用内置 image_gen 制作山水、斗笠剑客与三位对手，再通过 Three.js 姿态贴片、脚底锚点、笔触刀光和题款 UI 接入真实战斗。三位对手依次登场；格挡起手 0.22 秒可接招，失衡反击造成三点伤害，气息与闪避冷却写进代码。

真实键盘完成三阵；待机受击失败与重开、手机方向按钮和闪避分别通过。十项模拟行为、第二轮十一份实际 GPU 画布报告和上游证据检查通过。A / D 移步，J 攻击，K 格挡，L / 空格闪避，Esc 暂停。试玩：<http://127.0.0.1:4191/1008_codex_project/005-threejs-game-skills/ink/>。

技能提供制作方法、工程起点与检查工具，水墨场景和玩法由本实验编写；生成素材由内置工具提供，未调用上游 Gemini API。当前使用有限姿态切换与衣摆变形，没有连续骨骼动画；同模型 A/B、真实手机性能、音频听感未验证。见[实验说明](experiments/ink-swordsman/README.md)、[美术来源](assets/ink-art/README.md)与[实测证据](experiments/ink-swordsman/artifacts/final-evidence.md)。

## 真实使用：暴风港能源运输

![原创暴风港实际运行画面](assets/harbor-active.png)

实际读取 director、gameplay、graphics、UI、debug、QA 六个技能，运行上游脚手架，开发新运输机制、三阶段巡逻和原创程序化港口。150 秒内运回六枚能源，每次最多两枚；交付修复艇体，加速受热量限制，EMP 可禁用附近巡逻。

真实键盘输入完成三次返航交付 6/6；追撞失败与重开、手机视口摇杆分别通过。七项模拟行为检查、六份实际 GPU 画布报告和上游证据检查通过。截图和状态设置不替代通关输入证据。具体作用、来源、失败尝试与限制见[实验说明](experiments/storm-harbor/README.md)和[实测记录](experiments/storm-harbor/artifacts/final-evidence.md)。

试玩：<http://127.0.0.1:4191/1008_codex_project/005-threejs-game-skills/play/>。展示页保留通关录像与技能转化说明。WASD / 方向键驾驶，Shift 加速，空格 EMP，Esc 暂停；手机布局提供摇杆与按钮。

库提供流程、工程和验收工具；港口、玩法、UI、关卡仍由本实验开发。没有调用外部付费素材 API，尚未验证同模型 A/B 净收益、真实手机性能与音频听感。

## 展示效果

![霓虹漂移赛车实景](assets/ridge-drift.jpg)

2026-10-09 打开作者在线演示，在起跑后采集的真实截图。展示页另收录台球、太空战斗、海豚探索与陀螺竞技场。动态站点没有公开部署提交，无法确认与研究源码提交完全一致。

| 演示 | 内容 | 实测范围 |
| --- | --- | --- |
${demos.map(demo=>`| [${clean(demo.chinese)}](${demo.url}) | ${clean(demo.description)} | ${clean(demo.observation)} |`).join('\n')}

展示页支持选择截图、按需在页内载入一款作者游戏，以及打开原站。切换或返回截图会移除旧 iframe；无法嵌入时可打开原站。没有复制五款游戏的运行源码与全部资产。截图保留原作者 Majid Manzarpour 署名，见 [素材来源](assets/README.md)。

## 内置起点

![内置收集物品小游戏的本地复现](assets/scaffold.jpg)

experiments/scaffold/ 由原 create_threejs_game.py 实际生成。移动、冲刺、触控、碰撞、计分、镜头和音效保持上游实现。本地仅修改项目名、相对资源路径和锁文件。作者成品的赛车、台球与海豚玩法需要继续实现。

## 研究基线

| 信息 | 内容 |
| --- | --- |
| 原作者 | ${meta.author} |
| 原仓库 | ${meta.repo} |
| 完整 Commit | \`${meta.commit}\` |
| 版本／Tag | ${meta.version} |
| 日期 | ${meta.date}，Asia/Shanghai |
| 上游许可 | MIT，[src/LICENSE.upstream](src/LICENSE.upstream) |
| 本次范围 | 中文分析、演示展示、约束实验、内置模板复现、原创水墨剑斗与运输游戏的真实制作和验证 |
| 状态 | 本次研究与制作实验已完成；付费生成、真实手机性能和收益对照未验证 |
| 在线发布 | 尚未部署，根索引 demo 为空 |

## 沉淀能力与对应功能

知识与流程由模型读取，工程模板、服务脚本与检查工具提供具体复用物。文字指令依赖模型遵循；程序只检查明确定义的条件。

${skills.map(skill=>`### ${skill.name} · ${skill.skill}

**沉淀的判断。** ${skill.insight}

**怎么做。** ${skill.mechanism}

**对应功能／产物。** ${skill.output}

**如何约束。** ${skill.enforcement}

**限制。** ${skill.limit}

来源：${skill.paths.map(item=>`[${item.split('/').slice(-2).join('/')}](${source(item)})`).join(' · ')}
`).join('\n')}

## 可执行的硬功能

| 功能 | 源码 | 输入输出 | 检查和限制 | 本次验证 |
| --- | --- | --- | --- | --- |
${tools.map(tool=>`| ${tool.name} | [${tool.file}](${source(tool.path)}) | ${clean(tool.flow)} | ${clean(tool.check)} | ${clean(tool.result)} |`).join('\n')}

[本地约束实验输出](src/constraint-cases.json)由[独立驱动脚本](src/check-constraints.mjs)实际调用上游工具生成。报告输入为合成夹具，截图为已有真实截图；实验不代表真实游戏质量或 GPU 性能。

## 约束实现与边界

| 强度 | 对象 | 实现 | 覆盖不到的部分 |
| --- | --- | --- | --- |
${constraints.map(item=>`| ${item.strength} | ${item.name} | ${clean(item.how)} | ${clean(item.boundary)} |`).join('\n')}

实验结果：一致清单通过；旧 run ID、缺失报告和错误状态确认被拒绝；超预算的正常画布报告仍为 PASS + WARNING。证据检查不能证明审美、好玩、音频体验、构建或输入测试确实运行。

## 相比直接让模型开发

基于源码的判断：只有简短需求时，技能包补充顺序和验收；已有详细需求时，增量更多来自模板与工具；已经提供同等资源时，剩余价值主要在打包、发现、维护和一致性。

通用建议的增益可能随模型提升而缩小；代码与检查仍可能减少重复工作，也带来读取、执行和维护成本。本研究没有量化净收益，作者演示不能单独归因于技能包。

后续可固定模型、需求、资源、预算和时限，对照简短需求、详细需求与验收、详细需求加技能包，记录行为、缺陷、人工纠正、耗时和费用。见[上游评测方法](${source('skills/threejs-game-director/references/workflow-evaluations.md')})。

## 本地运行

Windows，Node.js 22.15.0、npm 10.9.2。展示页无第三方运行依赖；模板独立维护锁文件。

\`\`\`powershell
cd projects/005-threejs-game-skills/experiments/scaffold
npm.cmd ci
npm.cmd run build
cd ../storm-harbor
npm.cmd ci
npm.cmd run build
cd ../ink-swordsman
npm.cmd ci
npm.cmd run build
cd ../../web
npm.cmd ci
npm.cmd run build
npm.cmd run preview
\`\`\`

展示页：<http://127.0.0.1:4191/1008_codex_project/005-threejs-game-skills/>。

内置模板：<http://127.0.0.1:4191/1008_codex_project/005-threejs-game-skills/starter/>。

原创暴风港：<http://127.0.0.1:4191/1008_codex_project/005-threejs-game-skills/play/>。实验额外提供独立开发 / 生产预览与行为、输入、画布检查命令，见其 README。

原创竹影问剑：<http://127.0.0.1:4191/1008_codex_project/005-threejs-game-skills/ink/>。两款原创游戏保留独立玩法、依赖与验收记录。

修改 web/content.js、web/extension-content.js 或 web/publication-content.js 后执行 npm.cmd run research:docs 同步说明；node src/sync-catalog.mjs 同步 005 索引，再在根运行 npm.cmd run index:build。web 下 npm.cmd run dev 会先构建完整产物再从根路径预览；源文件修改后重新启动，无热更新。约束实验在项目目录执行 node src/check-constraints.mjs，默认使用 PATH 中的 python；可用 THREEJS_RESEARCH_PYTHON 指定解释器。

## 公开网页部署

${deploymentStatus} 统一 GitHub Pages 流程完整构建 001、002、003、004、005、013。

005 需分别 npm ci 安装 web、experiments/scaffold、experiments/storm-harbor、experiments/ink-swordsman 的锁定依赖。node web/scripts/build-games.mjs 独立编译三个游戏，node web/scripts/build.mjs 打包研究页，node web/scripts/audit.mjs 检查完整静态摘要、原图、来源与试玩资源。根 npm run build:site 将整个 web/dist/ 复制到 .cache/pages-site/005-threejs-game-skills/，随后 node scripts/validate-site.mjs 验证所有已发布项目。

保留 assets、data、三款游戏、原始引导图、生成提示与来源、真实输入录像和许可证；资源均以相对路径引用。公开站点不调用生成 API 或模型，不部署账号、多人服务或云存储。静态摘要、模块与扩展规划写入 HTML；原有能力切换和小游戏需要 JavaScript。

## 来源与改动

两个 src/tools/ 上游副本逐字保留，SHA-256 见 [upstream-files.json](src/upstream-files.json)。模板来源为固定提交 skills/threejs-gameplay-systems/assets/threejs-vite-game/，改动见[模板说明](experiments/scaffold/README.md)。上游版权与 MIT 文件随源码和 Web 产物保留；独立游戏素材的许可不因源码 MIT 自动改变。

中文数据、总览图、网页、构建预览、文档生成与实验驱动为本研究新增。暴风港的来源、保留模块和重写范围见实验说明及 skill-usage.json；原版模板继续保留。未安装全局技能或修改模型设置；水墨素材与总览图调用 Codex 内置 image_gen，未调用 Tripo、Gemini、ElevenLabs 的外部生成 API。只读 upstream/ 在 Git 中忽略，下载方法见 notes.md。
`;
await writeFile(path.join(project,'README.md'),md);
const records=[];
for(const file of ['src/tools/check_evidence.py','src/tools/inspect-threejs-canvas.mjs'])records.push({file,sha256:createHash('sha256').update(await readFile(path.join(project,file))).digest('hex'),modified:false});
await writeFile(path.join(project,'src/upstream-files.json'),JSON.stringify({repo:meta.repo,commit:meta.commit,files:records},null,2)+'\n');
console.log(`中文文档已同步：${skills.length} 个技能、${tools.length} 项工具。`);
