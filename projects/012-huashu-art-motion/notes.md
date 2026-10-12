# 012 · 艺术动画研究与复现笔记

日期：2026-10-09（北京时间）。上游：https://github.com/alchaincyf/huashu-art-motion 。基线：57d67608ab458f57d9b153b1a2831b921e22498b。

## 目的与环境

把库的能力、原理和艺术选型方法整理成中文资料，并用真实场景展示35种画风。Windows、PowerShell、Node.js v22.15.0；浏览器Chromium 151.0.7922.34。Playwright来自工作区包：C:/Users/yun68/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright。网页本身无第三方依赖。

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

对每个有转场的段落分别调用renderFrame到25%、50%、75%的进度，34个进入转场均执行。场景脚本错误0，失败资源请求0。完整记录在[render-verification.json](assets/render-verification.json)。

运动测量：将画面缩小到192×108，比较0.42和0.90秒，RGB平均差>12的像素占比。35段都有变化；这是两帧线索，纹理变化也计入，不等于完整运动质量或流畅度评价。实际单次绘制加GPU读取样本约2.9—265ms，本机重场景无法稳定实时达到30/60fps；确定时间逐帧出片与实时播放有不同性能目标。没有运行完整qa.py，没有编造艺术质量评分。

## 生产页面集成验证

实际子路径：http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/ 。桌面1440×1080，手机390×844，无JavaScript手机上下文。最终通过128项检查，详见[browser-verification.json](assets/browser-verification.json)。

覆盖：35静态卡/6类能力/9语法；类别8项与搜索组合；零结果；切换莫奈；下一帧改变Canvas；转场；播放与暂停；键盘时间调节；41.25秒连续浏览；末段1.40625秒时长；水墨深链接和刷新；全部相对图片及研究文件；桌面、手机与无脚本不水平溢出。记录真实cover.jpg和mobile.jpg。

## 发现的问题与修复

1. 上游engine把末段t1设为1e9哨兵。宿主不能用t1−t0当末段实际时长，改为dur或eighths×60/BPM/2；末段1.40625秒已验证。
2. 首轮集成检查发现键盘拖动时间不生效：input处理先暂停，暂停同步控件时覆盖了新值。改为先保存请求值，再暂停和绘制；重新检查通过。
3. 作者解说总览图是多镜头横条，强制16:9 cover会裁掉画面。改为保留原始比例并提供打开完整图的链接。

## 原创与上游范围

170个复制文件已与固定克隆逐字节核对SHA，包括106个原版引擎文件、风格与方法文档、MIT及作者样片。原创的是中文归组、描述、选型建议、展示宿主、控制与筛选、构建、来源核对和浏览器验证。上游绘画代码未修改。没有引入作者人物帧库、Arphic整片笔顺数据、凭证或.env。

## 边界与后续

未调用图片、语音或视频生成服务，未执行完整口播整片、配乐合成或FFmpeg视频编码。作者的宿主在线/媒体测试不是本研究的执行结果。实时播放取决于浏览器和设备。将来可在用户指定题材后实做一种新风格，或按上游render.py导出视频；当前研究目标已完成，尚未对外发布。

## 作品版重新制作（2026-10-09）

按用户反馈重做七场景；旧版源和影片留存。内置image_gen实际生成7张素材，透明人物16姿势，以四帧有效步态合成；Pillow只读取边界和Alpha清单。直接加载原版U/MO，新增制作均在production-*文件，原版106引擎文件未修改。

七部30秒/1080p/24fps实际影片，共5040帧；Chromium JPEG质量0.96管道，FFmpeg H.264 CRF18，全部合入Dreamer真实录制配乐，CC BY 4.0，截取、响度处理、淡入淡出，片尾与网页保留署名。检查后修正前景重影、导览花坛边界和产品交付列计数。

完整视频解码、逐帧合成对照、播放/暂停/章节/音轨、资源与范围请求、键盘和手机按钮行走、连续路线、四个发现持续记录共81项检查通过。生产桌面和手机截图保存在assets/production/；原版35种风格网页另验证。报告、提示词、来源与使用限制在production-research.md和CREDITS.md。没有对外部署或连接真实客户数据。

<!-- UNDERSTANDING:START -->
## 能力理解总览接入（2026-10-09）

目的：把用户讨论中的本质、能力、图片输入、模型对比、可实现目标和扩展价值统一接回网页，避免只看35种风格或把新增美术当作原库能力。

实现：web/understanding.mjs为内容唯一来源；overview/render.mjs生成完整图版与阅读页。用固定上游场景本机静帧和作者解说截图，按精确中文HTML/CSS排版，经Chromium导出3200×8524 PNG（约4.0 MiB）。没有生成或修改新美术。原版引擎文件未改动。

执行：网页npm.cmd run build → node src/render-understanding.mjs → 重新build复制图版 → node src/verify-understanding.mjs → node src/update-understanding.mjs → npm.cmd run index:build / check。命令相对项目或根目录执行。

观察：37项阅读流程检查通过，包括真实PNG下载SHA、缩放与复位、源码链接、桌面、手机、无JavaScript和原版橡皮管深链接。图版含7部分、9项能力、35方向、9解说方法、6场景和4扩展方向；文字版可展开查证。

判断：没有做有库/无库的生产对照；图中明确把事实、研究建议、待开发扩展与品质边界分开。只发布到本地预览，索引demo继续为空。
<!-- UNDERSTANDING:END -->
