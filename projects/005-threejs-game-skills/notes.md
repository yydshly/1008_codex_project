# 005 · Three.js 游戏技能研究：研究笔记

[项目概览](README.md) · [原仓库](https://github.com/majidmanzarpour/threejs-game-skills)

## 2026-10-09 研究基线

- Commit：`8286774b22a2566bf894dbc825825c16921866af`；该提交未标记 tag，根 package.json 为 0.1.0。
- 环境：Windows、Node.js 22.15.0、npm 10.9.2、Python 3.12.14。
- 阅读：九份技能、玩法与手感、物理选型、图形配方、评分与预算、UI、资产恢复、QA、证据协议、评测方法及对应源码和测试。
- 未验证：付费资产生成、五款成品全流程自动试玩、真实手机性能、使用技能前后的品质对照。

固定来源的下载方式：

```powershell
git clone https://github.com/majidmanzarpour/threejs-game-skills.git upstream
git -C upstream checkout 8286774b22a2566bf894dbc825825c16921866af
```

upstream/ 在根 .gitignore 中忽略。保留的工具与模板记录了固定来源、改动及 MIT 许可。

## 作者演示观察

浏览器直接打开 README 列出的五个 Netlify 地址：赛车进入比赛；台球打开球桌；太空战斗进入第一波显示六个敌人；Tide Singer 经 DIVE 与海域选择进入 Sunlit Shallows；Ripcore 进入快速对战的准备界面。每款的实测范围由 web/content.js 的 observation 字段明确展示。

两款站点首次停在加载画面，独立工作后重新观察正常。Ripcore 的 DOM 名称是 Quick Battle，视觉上通过 CSS 显示为 QUICK BATTLE。截图为真实网页采集，未生成或合成；在线部署 commit 未知。打开菜单不等于完整规则、性能或可玩性验证。

## 模板复现与锁文件问题

目的：确认库附带的实际起点。

```powershell
python upstream/skills/threejs-gameplay-systems/scripts/create_threejs_game.py experiments/scaffold
cd experiments/scaffold
npm.cmd ci
```

首次 ci 失败：锁文件缺少 @emnapi/core、@emnapi/runtime，@emnapi/wasi-threads 的可选依赖版本不一致。在副本执行 npm install --no-fund --no-audit 修复，随后 npm ci 通过（32 个包）。package.json 的依赖范围没有改变，上游不改动；本地锁文件保留修复结果。

Vite 添加 `base: './'`，可独立或在 starter/ 子目录访问。生产构建：Vite 8.0.13、20 模块，主 JS 565.66 kB，gzip 143.92 kB。体积不等于运行性能。在真实浏览器按 W 900ms、A 500ms 后，角色移动，收集计数由 0/8 变成 1/8。

本机 PowerShell 的 npm.ps1 对 project:add 参数处理不同，初次登记未成功；改用 npm.cmd 后正确创建 005。未改动根索引工具。

## 辅助测试

```powershell
cd upstream
python -B -m unittest discover -s scripts/tests -p 'test_*.py'
npm.cmd ci --no-fund --no-audit
node --test scripts/tests/inspect-canvas.test.mjs
```

Python：74 项通过，覆盖证据、打包、3D 任务恢复等。模拟服务响应不代表真实生成质量。

Node：48 项（含嵌套子测试），47 通过、1 失败。符号链接测试因 Windows EPERM 无法创建链接失败，名称为 CLI help preserves the realpath entrypoint when invoked through a symlink。保留原结果，未跳过后宣称全部通过。

## 约束边界实验

目的：观察机器究竟会拒绝什么，以及 PASS 的解释范围。运行 `node src/check-constraints.mjs`；可用 THREEJS_RESEARCH_PYTHON 指定解释器。输入为真实上游工具、合成报告清单与已有真实截图，无浏览器、真实 GPU 或付费请求。

| 输入 | 实际结果 | 解释 |
| --- | --- | --- |
| 报告与声明一致 | PASS | 字段和记录一致；合成报告没有运行游戏 |
| 报告仍为旧 run ID | 拒绝 | runId 不匹配 |
| 声明手机截图但报告缺失 | 拒绝 | 声明文件不存在 |
| 状态确认返回错误字符串 | 拒绝 | 请求和确认不匹配 |
| 无错误、非空画布，但 500 次绘制超过建议 300 | PASS + over-budget | 预算不属于强制通过条件 |

原始输出见 src/constraint-cases.json。驱动保留断言，行为变化会失败。临时夹具位于忽略的 .cache/constraint-fixture/。

## 展示页验证与范围

原生 HTML/CSS/JavaScript；相对资源、独立构建、子路径 `/1008_codex_project/005-threejs-game-skills/`、端口 4191。能力数据同步网页和 README。构建包括图片、数据、许可、研究记录和真实模板。

浏览器流程和截图见 [src/browser-verification.md](src/browser-verification.md)，本次检查汇总见 src/verification.json。

## 后续专项研究

保持相同模型、需求、预算和资源比较净收益；验证真实生成、动画与音频；按游戏改 bot 输入测试规则和公平性；在真实手机上验证性能与输入。

## 2026-10-09：技能的真实使用实验

按用户要求制作具体场景“暴风港能源运输”。实际读取六个技能和对应参考，运行 create_threejs_game.py 生成 experiments/storm-harbor。按 director 的明确分工要求将原创图形与 UI 分开实施，统一状态 / 输入契约，集成运输、热量、EMP、碰撞和三次返航。没有调用外部付费素材服务，也没有将五款作者成品代码复制成新场景。

七项模拟行为检查通过；真实键盘完成 6/6、追撞失败与重开、手机布局摇杆和设置分别通过。运行上游画布检查器得到六份实际 GPU 状态报告，并由原证据检查器核验。画面发现信号被雾和 ACES 冲淡后聚焦修正；Escape 双处理和测试录像导出时序问题已修正；第一批航线失败后原路线复测完成，未证实其根因，保留记录。

完整实现、命令、来源与能力转化见[实验 README](experiments/storm-harbor/README.md)，真实结果与限制见[final-evidence](experiments/storm-harbor/artifacts/final-evidence.md)。研究页首屏新增试玩、通关录像与具体贡献，游戏整合到同一路径的 play/；上游原始模板仍位于 starter/。没有上线 GitHub Pages，demo 仍空。一次应用案例不能替代同模型对照评测。

## 2026-10-09 · 第二种风格：竹影问剑

用户选择水墨剑客。再次实际读取六个制作与验收技能，运行上游脚手架，在独立 experiments/ink-swordsman 中实现侧视剑斗、纸纹、远山竹林、三种关节剑客和中文手机按钮。格挡 0.22 秒、失衡强反击、气息、闪避冷却、三轮难度与胜负由代码执行。

行为检查发现一次失衡允许连续两次三倍伤害，收紧为一次强反击消耗破绽；快节奏机器人接招六次通关，延迟 300ms 的版本失败。实际键盘通关 3/3、待机受伤失败与重开、手机布局移动释放和闪避通过（3 passed、3 按设备跳过），十项模拟通过。七份 GPU 画布和上游 check_evidence 检查通过。首轮手机人物偏小，调整近战镜头；美术检查纠正阶段编号与持剑、接招特效位置，最终记录见实验 final-evidence。

npm ci 报告构建链的四项高危已知问题，在此新工程运行非强制 npm audit fix 后为零漏洞；Vite 锁定 8.3.4。没有修改已有暴风港依赖。保留源码、MIT 与实际技能来源哈希，未调用外部付费素材服务、未做同模型收益对照、真实手机和音频听感验证；仅提供本机 ink/ 预览。

## 2026-10-09 · 水墨风格第二版

用户认为首版简单、风格不明显。读取 graphics 的视觉校准、素材与 shader 配方，并读取 threejs-image-generator 方法，使用 Codex 内置 image_gen 实际生成或编辑六次。四份最终山水、角色图集与独立攻击 PNG 接入原战斗，目录 assets/ink-art 保留提示词、任务 ID、版本与问题记录。未调用上游 Gemini、Tripo、ElevenLabs，也未推断其凭据情况。

图集两次返回仍有刀尖跨格，不能据“生成成功”宣称素材可用。改为逐姿态实际 UV 与脚底锚点，完整攻击独立文件按身体尺寸缩放。重做楷体题款、朱砂印与笔刷 UI；真实画面发现 SVG 默认等比缩放将按钮压成线，改为独立可伸展墨刷底。独立复核发现底部操作文字融入石纹，增加轻薄纸色衬底与 13 px 字号。胜利时最终敌人视觉退场，不改模拟规则。

最终生产套件 4 passed / 4 按设备跳过：真实键盘接招六次通关、实际失败重开、手机指针按钮与完整动作周期。十项同一 Simulation 机制通过；三张经过查看的画面建立并复跑像素基线，3 passed。十一份最终硬件 GPU 报告均通过，runId ink-swordsman-pass-3；上游证据器确认十一状态加两段真实录屏，共十三项。首次 v2 报告 pass-2 与 v1 记录保留，不改标记。

所查状态最高 22 次调用，桌面 active-play 122→19，三角形 7479→2850；四份 PNG 增加 9.76 MB、RGBA/mipmap 约 34 MB，低 draw call 不表示首次加载或显存降低。内部校准评分 1.5→2.45，只是人工评估。人物为绘画贴片与有限姿态，步伐仍有离散切换，未使用连续骨骼动画。真机性能、Safari、多指触屏、音频听感与同模型 A/B 收益仍未验证。

已验证完整 ink/ 子路径刷新、实际开始、L 闪避与暂停、返回研究页，以及新录像可播放。根索引更新第二版实际截图图注；独立与统一构建、根 check 通过。全部实测文件见 experiments/ink-swordsman/artifacts/final-evidence.md。
## 2026-10-09 · 能力与实践总览

按用户要求，将我们的扩展与理解接入研究网页。新增一图总览、四层工作资源、五步制作流程、四种约束强度、上游／本研究贡献表、六条实践结论、六个使用场景和四项个人价值，保留作者五款演示、两款试玩、原始截图与操作证据。水墨第一版与第二版并排显示，明确它是投入额外资源的历史迭代，不能用于证明技能净收益。新增可展开、复制的需求示例。

使用 Codex 内置 image_gen 一次生成 1024×1536 中文总览图，背景参考作者赛车、空战和我们的港口、水墨两版画面；作为解释性图文，未替代真实截图。逐区查看文字、九类能力、统计与参考背景。原始提示、生成 ID、参考图、署名与 SHA-256 保存在 assets/overview/。原始输出保留，项目中另存 capability-overview-v1.png。

实际浏览器验证：1280×900 桌面和 390×844 手机视口没有文档横向溢出；修正对照图显式高度导致的拉高后，两版截图按 16:9 显示。弹窗适应窗口、1024 px 原图缩放、手机横向阅读、Esc 关闭、返回焦点和恢复页面滚动通过；PNG 实际下载、3D 能力与太空作者展示切换、需求展开与复制通过。浏览器无错误或警告；26 个静态页面本地链接返回 200，四个新增固定来源路径在只读上游存在。截图与报告见 src/overview-web-verification.json。

扩展数据集中在 web/extension-content.js，网页与 README 生成器复用同一份解释。总索引更新说明，独立构建与根 check 通过。未改动两款游戏规则或模型设置，也未新增外部素材 API、同模型 A/B、真机和音频听感验证。

## 2026-10-12 · 完整理解与 GitHub Pages 发布准备

按用户要求，整理十二项摘要，覆盖能力、模块、原理、硬功能、约束、实际效果、场景、价值、复用路线、扩展规划、验证和许可；新增四层工程模块、四条复用路线与八项带切入点和验收条件的扩展方向。publication-content.js 为索引、图前介绍、静态网页和 README 的共同数据源。核心出版内容直接进入 HTML，另提供 JSON 下载；原有玩法、能力切换、作者展示与证据保留。

沿用 2026-10-09 capability-overview-v1.png 原图，没有重新生成、裁切或改字。cover 与 coverFull 均引用原图；根 README 与网页总入口在图前说明完整理解，图下保留素材与生成来源。原始五款作者截图、两款游戏和水墨历史两版继续区分。

重新安装四个工程锁定依赖。模板和暴风港的旧构建链各报告四项 high 问题，在既有版本兼容范围内运行 npm audit fix，两个工程随后均为零漏洞；水墨原有修复版本为零。依赖修复只进入本项目，未改动玩法代码。三个独立游戏由 build-games.mjs 顺序编译，研究页由 build.mjs 打包，audit.mjs 核对十二项静态摘要、索引数据、原图、资源、许可和三条试玩路径。

统一发布允许名单增加 005，保留 001、002、003、004、013；安装与构建分别使用子项目依赖。公开地址与 demo 将在 Actions 成功和线上核验后登记；准备阶段不把预期地址当作在线成果。最终结果见 src/publication-verification.json。
