# 多 Web 演示部署与记录

<!-- PASCAL_PUBLICATION:START -->
## Pascal 完整理解网页与真实编辑器（2026-10-12）

003 已通过 GitHub Pages Actions 部署，统一构建和发布 001、002、003、013。在线入口：[完整项目理解](https://yydshly.github.io/1008_codex_project/003-pascal-editor/overview/) · [真实编辑器](https://yydshly.github.io/1008_codex_project/003-pascal-editor/) · [发布核验记录](../projects/003-pascal-editor/src/publication-verification.json)。理解网页汇总九类能力、八个模块、五步参数更新原理、六类使用场景、四条复用路线、八个扩展方向、十项摘要与验证边界；首屏沿用原始 1536 × 1024 引导图，PNG 字节保持一致。真实编辑器保留在项目根路径，理解页在 `/overview/`，两者互相导航。首次公开 HTTPS 核验通过后已登记在线索引。

```powershell
npm.cmd ci --prefix projects/003-pascal-editor/web
npm.cmd run typecheck --prefix projects/003-pascal-editor/web
npm.cmd run check:scenes --prefix projects/003-pascal-editor/web
npm.cmd run build --prefix projects/003-pascal-editor/web
npm.cmd run check:research --prefix projects/003-pascal-editor/web
npm.cmd run preview --prefix projects/003-pascal-editor/web
```

独立产物 `projects/003-pascal-editor/web/out/`，预览端口 4187，子路径 `/1008_codex_project/003-pascal-editor/`。Node.js 22+、Next.js 静态导出；四个 Pascal npm 包固定 `1.0.3`。构建前同步原图和真实截图，导出理解 Markdown/JSON；正文在静态 HTML 中。安装脚本可重现图标、音效、材质缩略图及 Basis 解码器的子路径适配。

根 `npm run build:site` 完整复制 `out/`，不是只复制理解页。`scripts/validate-site.mjs` 验证发布允许名单、既有项目、完整摘要、原图一致性、编辑器/下载/许可，以及全部 460 个原库资源的字节数和 SHA-256。CI 另外运行场景与研究审计，保留 Sandboard 十六个入口、面试指南和 AIHOT。

本地已检查桌面、390/320 px 手机宽度、摘要展开、原图弹窗、原理切换、扩展导航和全文/JSON 下载；已有墙厚编辑、撤销重做、楼层保存刷新与还原、家具新增和多层展开记录。用途、价值与扩展方向是研究分析；本网站没有部署 CLI、MCP、模型、账号、云项目或多人协作。浏览器草稿按来源隔离，localhost 数据不会自动迁移到公网。源码基线 `c5eaf51e161ba8653204d543666f5839d6020874` 与 npm 发行包分别记录；MIT、素材来源边界及 Basis Apache 2.0 保留。

线上检查覆盖完整摘要与静态章节、16 个本地引用、Markdown/JSON 下载、原图尺寸与 SHA-256、全部 460 个素材（18,843,359 字节），以及既有三个项目入口。真实浏览器打开原图弹窗、从总结进入编辑器、运行住宅分屏再返回总结；渲染 DOM 有 8 面墙、20 件家具，控制台错误为空。Git 将原始 SVG 换行归一化的问题已通过子项目 `.gitattributes` 修复，保留素材原字节而非修改 SHA 清单。详见发布记录和 `assets/publication/` 真实截图。

<!-- PASCAL_PUBLICATION:END -->

<!-- AIHOT_PUBLICATION:START -->
## AIHOT 中文研究网页（2026-10-12）

013 接入现有 GitHub Pages Actions 工作流，统一构建和发布 001、002、013。独立静态研究页涵盖能力、模块、原理、18 个示范信源、六种获取方式、场景、价值、复用路线、扩展方向和边界；采用已有完整引导图，高清 PNG 原始字节保持一致。首次 Actions 发布成功并核验公开 HTTPS 后登记：[AIHOT 研究网页](https://yydshly.github.io/1008_codex_project/013-aihot/)，见 [发布核验记录](../projects/013-aihot/src/publication-verification.json)。

本项目网页需要 Node.js 22+，无第三方依赖；上游 AIHOT 自托管运行要求按其固定版本文档另行满足。这里没有部署上游 PostgreSQL、worker、模型、X/微信供应商或采集 API。

```powershell
npm.cmd run build --prefix projects/013-aihot/web
node projects/013-aihot/web/scripts/audit.mjs --built
npm.cmd run preview --prefix projects/013-aihot/web
```

独立产物：`projects/013-aihot/web/dist/`；预览端口 4213，子路径 `/1008_codex_project/013-aihot/`。正文和信源在构建时进入 HTML，关闭 JavaScript 仍可阅读；增强脚本提供搜索、类别与格式筛选、订阅复制、引导图放大和章节导航。页面下载包含研究 JSON、信源 JSON/CSV、上游原配置、单次 Feed 检查和许可记录。

根 `npm run build:site` 把整个产物复制到 `.cache/pages-site/013-aihot/`；`scripts/validate-site.mjs` 检查发布允许名单、既有项目、完整摘要、11 章节、18 信源与原图一致性。CI 同时运行本项目内容审计；本地另核验桌面、390/320 像素手机、直接锚点、禁用脚本和所有增强交互。

18 个公开示范 Feed 本次均 HTTP 200 且可解析（16 RSS、2 Atom）；单次订阅检查不等于完整正文提取或上游整条模型管线运行。研究固定提交为 `6e67a9d9e8d87b95b8118a8a0b328a9bebd2bb48`，源库 MIT 与 NOTICE 保留在子项目。

<!-- AIHOT_PUBLICATION:END -->

<!-- INTERVIEW_GUIDE_PUBLICATION:START -->
## 编程面试知识指南公开发布（2026-10-12）

已通过 GitHub Pages Actions 部署并核验公开 HTTPS。在线入口：[编程面试知识指南](https://yydshly.github.io/1008_codex_project/002-interview-guide/)，[统一研究首页](https://yydshly.github.io/1008_codex_project/)。实际结果见 [发布核验记录](../projects/002-interview-guide/src/publication-verification.json)。

- 默认理解总览说明源库能力、九类模块、静态内容出版原理、学习与团队使用价值、扩展方向及能力边界；知识索引、学习路线、资料与覆盖页继续可用。
- 复用我们生成的完整 1086 × 1448 PNG 引导图，原文件与网页副本逐字节一致；首页、理解页、原图查看与下载均保留全部画面。
- 固定研究提交包含 50 篇 MDX、11 篇教程与 39 篇导航。保留 209 个去重资源入口，新增 113 节中文讲解、38 个示例、100 个误区与 100 条答法；不是在线判题或代码执行服务。
- 根构建显式只发布 001 与 002，将完整 002 web/dist/ 复制到 .cache/pages-site/002-interview-guide/，包含所有模块、覆盖报告、PNG 与 MIT 许可；保留 Sandboard 的十六功能入口与媒体。
- 002 独立使用 Node.js 内置模块，无第三方构建依赖、服务端或 API 密钥。相对资源与 Hash 路由支持项目子路径、直接主题链接和刷新。
- 本地聚合构建、独立严格审计、根索引检查、13 项索引测试通过；真实浏览器检查理解页、检索、SOLID 深链、答法、覆盖页和 320/390 px 手机菜单，无横向溢出及控制台错误。

复现发布构建（仓库根目录，Node.js 22.12+）：

~~~powershell
npm.cmd ci --prefix projects/001-sandboard/web
npm.cmd ci --prefix projects/001-sandboard/experiments/sand-art
npm.cmd ci --prefix projects/002-interview-guide/web
npm.cmd run check
npm.cmd test
npm.cmd run build:site
node scripts/validate-site.mjs
$aggregateSite = (Resolve-Path .cache/pages-site).Path
node projects/002-interview-guide/web/scripts/serve.mjs --dir $aggregateSite --port 4202 --base /1008_codex_project/
~~~

聚合预览使用已解析的绝对目录；独立预览可使用 --dir dist --base /1008_codex_project/002-interview-guide/。001 额外媒体验证由 Actions 中的 validate-platform.mjs 和 validate-research.mjs --built 执行。

未来可增加学习进度与错题、间隔复习、上游差异与外链监测；AI 问答属于待开发方向，应先设计来源引用与验证。当前站点只提供静态阅读和资料导航。
<!-- INTERVIEW_GUIDE_PUBLICATION:END -->

<!-- SANDBOARD_PUBLICATION:START -->
## Sandboard 首次公开发布（2026-10-12）

发布方式为 GitHub Pages 自定义 Actions 工作流，已完成首次部署并核验 HTTPS 页面、全部十六功能入口、直接引用资源和高清图。站点根入口是 `https://yydshly.github.io/1008_codex_project/`，Sandboard 子路径是 `https://yydshly.github.io/1008_codex_project/001-sandboard/`。其他尚未提交的子项目不纳入本次发布，既有编号和本地内容保留。

- 仓库总览页说明源库能力、原理、价值、实际输入输出、扩展方向与边界，并链接真实截图和完整引导图。
- `001-sandboard/` 跳转 `art/home/`；`original/` 保存 Sandboard 原版，`art/` 保留工作室及其余十四页，共十六功能入口。
- `.github/workflows/pages.yml` 分别安装两个子项目的锁定依赖，构建完整站点，验证目录与媒体，再发布同一个 Pages artifact；主分支相关改动自动触发，亦支持手动运行。
- 根 `scripts/build-site.mjs` 只做静态站点聚合；根包不统一子项目依赖。产物是 `.cache/pages-site/`，不会提交构建缓存。
- 原版与沙画的资源采用相对引用，保留许可证、研究记录、历史录像和下载素材；高清总览图按需加载。原版和手绘工作室需要支持 WebGPU 的浏览器与设备；其余静态研究和照片页面可单独访问。
- 无模型 API、服务端、支付或在线账户；用户照片、草稿与收藏在浏览器本机处理。线上新域名与 localhost 的存储隔离，已有作品需在旧页面导出工程后到对应新入口导入。
- 超过 GitHub 单个文件限制的 v30 完整原始录像存为 GitHub Release 附件，本地原始文件保留；SHA-256 与历史取证记录一致，网页精选录像不变。

本地复现（Node.js 22.12+）：

~~~powershell
npm.cmd ci --prefix projects/001-sandboard/web
npm.cmd ci --prefix projects/001-sandboard/experiments/sand-art
npm.cmd run check
npm.cmd test
npm.cmd run build:site
node projects/001-sandboard/experiments/sand-art/scripts/validate-platform.mjs
node projects/001-sandboard/experiments/sand-art/scripts/validate-research.mjs --built
~~~

首次部署成功并核验 HTTPS 页面后，才把实际演示 URL 写入 `projects.json` 并运行 `npm run index:build`。发布与目录检查不等于沙画视觉达标；自然成画与摄影级真实感仍待验收。

参考：[GitHub Pages 自定义工作流官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
<!-- SANDBOARD_PUBLICATION:END -->

001 研究页新增 `art/research/#overview` 理解总览图；首页直达。轻量 JPEG、完整 3200×15811 PNG、文字版说明经静态 URL 导入随 `art/assets/` 散列打包；高清图约 22.3 MiB，只在放大时加载。完整发布现有沙画产物即可，页面数仍为十六；无需新服务端或作品库迁移。

001 统一作品集新增 `art/gallery/#history`：34项历史作品与效果复用既有档案媒体，另补入柳树及第二、三幅参考还原导出；三张AI目标使用已有 `generated-sandboard/` 文件。十一段录像仅在点击时设置媒体地址。创作台新增score/reference与process/finished深链接，仍需发布完整沙画产物以保留其素材、脚本与记录。页面数仍为十六，无新增服务端配置或作品库迁移。

001 统一作品集新增 `#examples`，九幅手绘示例的轻量真实预览随 `art/assets/` 散列打包，编辑入口为原工作室 `art/#example=<名称>`；首页也可直达。页面数量保持十六页。示例试画使用独立本机库，原手绘、照片草稿与收藏不迁移；发布整个站点即可，无新增服务端或模型配置。完整 1536×1152 取证 PNG 留在项目 assets，本页只加载轻量画台截图。

001 新增 `art/gallery/` 手绘与照片统一作品集，沙画构建现在为十五 HTML 入口；与同源原版合并后共十六页。原十四功能页和已有路由均保留。构建和打包仍用 `npm.cmd run build:platform`，预览用 `npm.cmd run preview:platform`；首页七工具直达，作品集从既有两库只读汇总，按作品编号返回原画台。以下入口计数为各历史阶段记录。

001 现在以 [统一平台首页](../projects/001-sandboard/experiments/sand-art/home/README.md) 关联全部页面。沙画构建新增 `home/`，共十四入口；原版单独构建后一起打包为十五页的站点。以下十三、十二入口等说明为历史记录。推荐在 `projects/001-sandboard/experiments/sand-art/` 运行 `npm.cmd run build:platform`，再 `npm.cmd run preview:platform`；打开 `http://127.0.0.1:4174/1008_codex_project/001-sandboard/` 自动进入 `art/home/`。现有 `art/` 路径不变，原版在同源 `original/`。统一发布应把整个 `.cache/platform-site/` 复制到 `_site/001-sandboard/`，包括根跳转页、`original/`、`art/`、所有散列资源、研究记录与许可；不要分别覆盖项目根路径。当前仅本地验证，索引 `demo` 仍为空。

001 新增 `/1008_codex_project/001-sandboard/art/research/` 研究历程，沙画构建为十三入口。发布完整 `experiments/sand-art/dist/`，包含 `research/`、`research-records/`、散列图片/录像及所有旧入口。研究页使用相对资源；录像选择后才设置媒体地址，不在初次进入时下载全部影片。新增选用档案媒体约 132 MiB，按内容散列与旧构建资源去重。仅本地验证，未外部发布。

001 v36 新增 `/1008_codex_project/001-sandboard/art/memories/keepsake/handwork/`，沙画构建为十二入口。发布完整 `experiments/sand-art/dist/`，保留 v35 `sandlight/` 与全部旧入口。独立 IndexedDB 首次只复制 v35 草稿。当前仍只本地验证，未外部发布。

001 v35 新增 `/1008_codex_project/001-sandboard/art/memories/keepsake/sandlight/` 灯台留白试片，沙画构建为十一入口。发布完整 `experiments/sand-art/dist/`，保留 v34 `composition/`、v33 `natural/`、v32 与全部旧入口。独立 IndexedDB 首次复制 v34 草稿后独立保存；实际录制、海报和赠礼文件均在本机完成。仅本地验证，尚未外部发布；视觉仍为程序近似。

001 v34 新增 `/1008_codex_project/001-sandboard/art/memories/keepsake/composition/`，沙画构建为十入口。发布时复制完整 `experiments/sand-art/dist/`，保留 v33 `keepsake/natural/`、v32 `keepsake/` 与全部旧入口。新 IndexedDB 首次只复制 v33 草稿。当前只在本地验证，未外部发布。

001 v33 新增 `/1008_codex_project/001-sandboard/art/memories/keepsake/natural/`，构建为九入口。发布完整 `experiments/sand-art/dist/`，保留 `keepsake/` v32 及新增的 `keepsake/natural/`；共享依赖、示例照片和新散列材料脚本均不可遗漏。v33 草稿使用独立 IndexedDB，首次无草稿时只复制 v32 照片与故事，不迁移或删除旧草稿。当前仍只提供本地预览。

001 v32 新增 `/1008_codex_project/001-sandboard/art/memories/keepsake/` 纪念短片入口，当前沙画实验构建为八个 HTML；下文六、七入口说明为历史记录。发布时复制完整 `experiments/sand-art/dist/`，包含 keepsake/index.html、散列 JS/CSS、共用材料和现有 AI 示例照片。产品流程在本机完成照片处理、构图、实际沙画演出与 WebM / PNG / 离线 HTML 导出，不依赖服务器。草稿保存于独立 IndexedDB；赠礼文件不是在线分享链接。当前未外部发布，根索引 demo 仍为空。

当前 [001 · Sandboard](../projects/001-sandboard/README.md) 包含原版效果展示与独立沙画实验，两者各自构建；沙画实验同一次构建产生工作室、基础舞台、手势创作台、照片沙画、生成手部小样及三维接触试验六个 HTML 入口。已在本地验证 `/1008_codex_project/001-sandboard/`、`/1008_codex_project/001-sandboard/art/`、`/1008_codex_project/001-sandboard/art/stage/`、`/1008_codex_project/001-sandboard/art/atelier/`、`/1008_codex_project/001-sandboard/art/memories/`、`/1008_codex_project/001-sandboard/art/memories/hands/` 与 `/1008_codex_project/001-sandboard/art/memories/hands/contact/` 子路径及资源。发布须复制完整实验 `dist/`，包括生成手部图集、三维 GLB、皮肤纹理与共享资源；照片页 `#generated-hands` 可打开独立弹窗。尚未配置或发布 GitHub Pages，索引 `demo` 保持为空。

[002 · 编程面试知识指南](../projects/002-interview-guide/README.md) 提供独立的中文知识汇总网页，已验证生产构建、`/1008_codex_project/002-interview-guide/` 子路径、相对资源和手机交互。网页使用原生 HTML/CSS/JavaScript，无第三方构建依赖；产物为 `projects/002-interview-guide/web/dist/`。本地检查可执行：

```powershell
cd projects/002-interview-guide/web
npm run build
node scripts/serve.mjs --dir dist --port 4185 --base /1008_codex_project/002-interview-guide/
```

打开 `http://127.0.0.1:4185/1008_codex_project/002-interview-guide/`。现已统一发布完整 `dist/`（含 `LICENSE.upstream.txt`、理解总览与完整原图），索引 `demo` 已登记经核验的 HTTPS 地址；当前构建目录与步骤以上方发布记录为准。

[003 · Pascal 3D 建筑编辑器](../projects/003-pascal-editor/README.md) 使用独立 Next.js 宿主与固定 `1.0.3` Pascal 组件，静态导出产物为 `projects/003-pascal-editor/web/out/`。已完成生产构建，默认子路径为 `/1008_codex_project/003-pascal-editor/`。本地构建与预览：

```powershell
cd projects/003-pascal-editor/web
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

打开 `http://127.0.0.1:4187/1008_codex_project/003-pascal-editor/`。项目理解总结页位于同一子路径的 `overview/`，可直接访问与刷新。未来统一发布时，将整个 `out/` 复制到 `_site/003-pascal-editor/`，包含 `_next/`、`overview/`、`research/`、`demos/`、`items/`、`material/`、`basis/`、`icons/`、`audios/` 与许可文件。构建前设置 `PASCAL_BASE_PATH` 可更改宿主路径；构建与预览须采用同一值。`postinstall` 脚本为固定发布包中的图标、音效和材质解码路径添加宿主子路径。当前仅提供本地演示，索引 `demo` 保持为空。

[005 · Three.js 游戏技能研究](../projects/005-threejs-game-skills/README.md) 提供六个技能真实制作的原创水墨剑客与暴风港、通关录像与证据，再展示五款作者演示、九类能力、工具和约束实验，以及固定提交模板的本地复现。展示页无第三方运行依赖；模板、水墨剑客与暴风港各自使用独立 Vite / TypeScript / Three.js 依赖。已验证生产构建和手机布局；水墨剑客真实键盘接招六次完成三阵，暴风港完成六枚交付，模板手机摇杆实际拾取物品。本地运行：

```powershell
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
```

打开 `http://127.0.0.1:4191/1008_codex_project/005-threejs-game-skills/`，同路径 `starter/` 为本地模板、`play/` 为暴风港，`ink/` 为竹影问剑水墨剑客。未来统一发布时，将完整 `web/dist/` 复制到 `_site/005-threejs-game-skills/`，包括 `assets/`（截图与录像）、`data/`、`evidence/`、`starter/`、`play/`、`ink/`、研究和实测文档、许可文件。三款游戏使用 `base: './'`；`play/`、`ink/` 可直接刷新，并通过 `../` 返回研究页。作者五款成品从外部站点按需载入，未复制其全部游戏资产。当前仅本地展示，索引 `demo` 保持为空。

[008 · GhostTrack 能力与原理研究](../projects/008-ghosttrack/README.md) 提供四项能力、调用数据流、底层技术、结果含义和来源许可的中文静态网页。使用原生 HTML/CSS/JavaScript 与 Node.js 内置模块，无第三方构建依赖，产物为 `projects/008-ghosttrack/web/dist/`。

```powershell
cd projects/008-ghosttrack/web
npm.cmd run build
npm.cmd run preview
```

打开 `http://127.0.0.1:4195/1008_codex_project/008-ghosttrack/`。已验证完整子路径、相对资源、四项切换、键盘、直接片段链接与刷新、浏览器后退、手机布局及无 JavaScript 阅读。未来统一发布时，将整个 `dist/` 复制到 `_site/008-ghosttrack/`，包含 HTML、CSS、JS 和两份研究文档。此页只展示说明，不执行信息查询，无需后端或 API 密钥。当前未上线，索引 `demo` 保持为空。

[006 · Easel 社媒智能体研究](../projects/006-easel/README.md) 提供固定提交的源码研究网页，包含 114 项能力、信息源获取与过滤、制作发布和验证边界。网页无第三方依赖，生产产物在 `projects/006-easel/web/dist/`，已按完整子路径验证：

```powershell
cd projects/006-easel/web
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

本地入口 `http://127.0.0.1:4206/1008_codex_project/006-easel/`；Hash 路由支持直达和刷新。未来统一发布需将整个 `dist/` 复制到 `_site/006-easel/`，包含研究 JSON、浏览器检查记录、JS/CSS/favicon、研究说明和 `LICENSE.upstream.txt`。展示站不会调用原 Easel 的 API 或模型，也不执行社媒发布；当前未上线，根索引 `demo` 保持为空。

## 一个站点，多个项目路径

[004 · Up 终身学习指南](../projects/004-up-learning-guide/README.md) 提供独立中文知识地图，完整呈现七篇专题、97页目录、25张工作纸、392个分组词条及67个引用链接。静态页面采用相对资源和hash路由，构建依赖独立保存在子项目。已验证生产构建、完整子路径、手机阅读及深链接刷新，本地运行：

```powershell
cd projects/004-up-learning-guide/web
npm.cmd ci --ignore-scripts
npm.cmd run build
npm.cmd run check
npm.cmd run preview
```

打开 `http://127.0.0.1:4194/1008_codex_project/004-up-learning-guide/`。未来统一发布时，将完整 `web/dist/` 复制到 `_site/004-up-learning-guide/`，含 `data/content.json`、`research/`和许可文件。子路径改变时使用同一预览 `--base` 参数验证；页面无需重写相对资源或hash路由。当前仅本机预览，索引demo保持空值。

[007 · Octogent 多智能体工作台研究](../projects/007-octogent/README.md) 提供六张上游截图、原创协作示例、能力和底层原理讲解。无第三方依赖，完整子路径为 `/1008_codex_project/007-octogent/`：

```powershell
cd projects/007-octogent/web
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

打开 `http://127.0.0.1:4193/1008_codex_project/007-octogent/`。未来统一发布时，将整个 `web/dist/` 复制到 `_site/007-octogent/`，包括 `assets/`、脚本、样式、研究文档和 `LICENSE.upstream.txt`。资源使用相对路径。流程示例不连接真实 Claude / Codex 或 Octogent API。当前只提供本地预览，索引 `demo` 保持为空。

001 v8 新增 `/1008_codex_project/001-sandboard/art/atelier/`，同一实验构建输出 `atelier/index.html`、共享 `assets/` 和本地 `generated-sandboard/` 三张 AI 美术目标 PNG。未来汇总必须复制整个 `experiments/sand-art/dist/`，避免只复制 HTML 丢失目标图片。创作台通过 `../` 返回工作室、`../stage/` 返回基础演示、`../../` 返回原版；图片以 `../generated-sandboard/` 相对加载。本地入口通过 4174 预览服务访问，尚未上线。

001 v9 复用这个入口，首屏增加真实沙层成画、手动接管和独立草稿。AI 图在离屏处理中规划局部落沙，仍须随完整产物发布；页面可从同一子路径直接访问和刷新。草稿按浏览器来源保存于 `sandboard-atelier-product`，与已有工作室、基础舞台存储分离；换域名或端口时不会自动迁移，可用 `.sand.json` 导入/导出转移。

001 v12 新增 `/1008_codex_project/001-sandboard/art/memories/` 照片创作、收藏与展映。生产子路径预览需使用 `npm.cmd run preview -- --host 127.0.0.1 --port 4174 --strictPort --base /1008_codex_project/001-sandboard/art/`；仅启动根路径预览无法验证完整项目路径。发布时复制整个 `experiments/sand-art/dist/`，包含 `memories/index.html`、其他三个入口、共享 `assets/` 与本地打包的 AI 示例照片。

照片模式无需后端或 API 密钥；作品集按浏览器来源保存在独立 `sandboard-photo-memory` 中。`#work=` 只能定位该来源内已收藏的作品，不能充当公开分享链接。可通过 `.sandphoto.json` 备份和迁移；独立 HTML 展览将图片和样式内嵌，可离线打开，默认不带原照。账号、云收藏和公开作品托管尚未实现。

001 v13 复用照片入口，增加留白人像及从空台开始的材料成画；`memories/#process` 自动开始示例，普通入口先展示风格预览。构建仍为四个 HTML，需发布整个实验 `dist/`。照片设置中的风格与主体字段可选，旧工程按照片影调处理；导出工程保存当前材料，不保存演出时间轴。当前仍只提供本地预览。

GitHub Pages 每个仓库最多对应一个项目站点，其默认地址含仓库名称。这里计划把多个静态 Web 的构建结果汇总为一个站点，再按编号分目录发布。[GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

预期路径如下；这是规划示例，当前不可视为已上线：

| 内容 | 计划路径 |
| --- | --- |
| 演示总入口 | `/1008_codex_project/` |
| 第一个 Web | `/1008_codex_project/001-repo-name/` |
| 第二个 Web | `/1008_codex_project/002-another-repo/` |

源码继续放在 `projects/<id>-<slug>/web/`。未来发布流程可使用临时目录 `_site/` 汇总产物：

同一研究项目内的实验可放在独立的 `experiments/<实验名>/`，使用自己的依赖和构建命令。例如 Sandboard 原版的 `web/dist/` 对应 `001-sandboard/`，沙画实验的 `experiments/sand-art/dist/` 对应 `001-sandboard/art/`；汇总时先复制原版，再复制实验到其子目录。实验产物须完整复制，包含 `stage/index.html` 及共享 `assets/`：工作室在 `art/`，舞台在 `art/stage/`，舞台通过 `../` 返回工作室、`../../` 返回原版。两个模块的作品存储独立。

```text
_site/
├── index.html
├── 001-repo-name/
│   ├── index.html
│   └── assets/
└── 002-another-repo/
    ├── index.html
    └── assets/
```

`_site/` 是未来构建输出示例，不是当前已实现的构建脚本。每次发布需汇总所有已启用演示，再上传一个 Pages artifact；单独上传某个项目会让其他项目的发布内容缺失。

## 配置子路径与静态资源

纯静态 HTML 可用 `./assets/...` 引用当前 Web 的资源，跨项目入口使用相应的相对路径。避免把资源写成 `/assets/...`：它指向域名根目录，与本仓库的项目子路径不同。

Vite 项目的 `base` 应与实际发布位置一致。以下是根据 Vite 官方仓库子路径配置规则扩展的项目配置示例：[Vite GitHub Pages 部署文档](https://vite.dev/guide/static-deploy.html#github-pages)

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/1008_codex_project/001-repo-name/',
});
```

构建后把该项目产物的内容复制到 `_site/001-repo-name/`。其他项目使用自己的编号和 slug；仓库名或域名变化时同步调整配置。涉及前端路由时，使用适合静态托管的路由方案，例如 hash 路由，并实际测试直接打开页面和刷新页面。

## 第一个 Web 完成后的发布步骤

1. 在子项目 README 记录依赖安装、构建与预览命令，以及产物目录。提交依赖锁文件，确认项目能从干净环境构建。
2. 本地验证真实生产构建，检查入口、图片、脚本、样式、路由和交互。Vite 默认构建到 `dist/`，`vite preview` 用于本地检查构建结果。[Vite 静态构建与预览文档](https://vite.dev/guide/static-deploy.html#building-the-app)
3. 为所有需要上线的项目实现统一构建与汇总脚本，生成站点总入口。不要把 `web/` 空目录或仅含源码的目录当作可部署产物。
4. 添加统一 GitHub Actions 发布 workflow。在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
5. workflow 构建并汇总项目后，通过 `configure-pages`、`upload-pages-artifact` 和 `deploy-pages` 发布。部署 job 依赖构建 job，使用 `github-pages` environment，并配置 `pages: write` 与 `id-token: write` 权限。Action 版本在实际实施时按官方文档确认。[GitHub Pages 自定义 workflow 文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
6. 部署成功后打开实际 URL，验证总入口及每个子项目。只有在线验证通过后，才填写对应 `projects.json` 的 `demo`，运行 `npm run index:build` 和 `npm run check`，更新首页入口。

后续增加 Web 时扩展同一个发布流程，保持各项目独立构建、统一汇总发布。原项目地址保持稳定；归档项目是否继续保留演示，在子项目文档中写明。

## 010 · Unsloth 研究网页的本地预览

[010 · Unsloth 模型训练与原理研究](../projects/010-unsloth/README.md) 是原创静态网页，包含训练方式对照、机制与场景切换、数学计算示意和固定源码引用。Node.js 22+，无第三方网页依赖，不需要 GPU、权重或 API 密钥。

```powershell
cd projects/010-unsloth/web
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

打开 `http://127.0.0.1:4197/1008_codex_project/010-unsloth/`。未来统一发布时，将完整 `web/dist/` 复制到 `_site/010-unsloth/`，保留脚本、样式、图标、截图、来源清单与研究文档。资源使用相对路径，页面定位使用 hash。换子路径时用预览脚本的 `--base` 验证直接访问和刷新。

已检查生产子路径、桌面 / 手机交互与无 JavaScript 阅读。网页中的计算和 H3 案例不执行真实模型训练。当前只有本地预览，索引 `demo` 留空。

## 009 · Cove 研究网页

[009 · Cove 全栈模板架构研究](../projects/009-cove/README.md) 为独立的纯静态中文研究网页，包含一张完整高清总览、四张交互架构图、能力、原理、业务场景与扩展方案。总览含真实扩展入口、框架 API 与六步适配。它没有运行原 Cove 后端；无需数据库或认证凭据。已验证独立生产构建、完整子路径、相对资源、PNG / SVG 下载、图源和手机交互：

~~~powershell
cd projects/009-cove/web
npm.cmd ci
npm.cmd run build
npm.cmd run preview
~~~

打开 http://127.0.0.1:4209/1008_codex_project/009-cove/；#summary-figure 可直达完整总览。统一发布时复制完整 web/dist/ 到 _site/009-cove/，包含 assets/、样式、脚本、research.md、notes.md、LICENSE.upstream.txt 与 source-manifest.json。assets/ 中的 cove-overview.png、cove-overview.html 和 cove-overview-render.json 必须一起保留。图和资源均使用相对路径；当前没有配置统一发布，索引 demo 保持为空。

若后续实际运行 Cove 模板，登录、SSR、服务器函数和 PostgreSQL 访问需要服务器运行环境及数据库；本研究静态网页的构建验证不能替代原模板的全栈验证。

## 011 · AiToEarn 研究网页

[011 · AiToEarn 内容营销能力与原理研究](../projects/011-aitoearn/README.md) 为独立原生静态网页，无第三方构建依赖。32项能力、13个技能、14个平台及完整限制、12组工具声明、原理与场景均在构建时写入HTML；新增“真实效果实测”展示GPT适配实际生成的3张图、文案、草稿和调用记录。预设流程仍是解释示例，网页不连接原系统。

```powershell
cd projects/011-aitoearn
node src/write-research.mjs
cd web
npm.cmd run build
npm.cmd run preview
```

打开 `http://127.0.0.1:4201/1008_codex_project/011-aitoearn/`。默认端口4201避免占用其他项目；可用 `node scripts/serve.mjs --dir dist --port 4201 --base /1008_codex_project/011-aitoearn/` 显式预览。

未来统一发布将完整 `web/dist/` 复制到 `_site/011-aitoearn/`，包括相对脚本/样式、assets、research.md、notes.md、来源/实现/技能安装清单、experiment/成品与记录和LICENSE.upstream.txt。已验证子路径HTML与15个资源/下载、锚点刷新/后退、桌面与手机交互。当前未外部部署，索引demo保持空值。

若运行原AiToEarn，需要其Docker/NestJS/数据库/队列/存储与模型、社交账号授权配置；本研究静态网页不执行原应用和真实发布。项目内技能安装及GPT匹配已完成，当前用会话工具生成图片并保存本地草稿；后续生成需在对话中调用技能，网页只展示本次结果。新增#summary-figure完整总览图，实际PNG、文字稿、提示词与图源记录均在assets/内，以相对路径随构建复制。

## 需要后端的项目

GitHub Pages 托管静态 HTML、CSS 和 JavaScript，动态后端需要部署到外部服务。前端可放在 Pages，后端运行在适合该项目的平台，或把完整应用部署到外部平台，再将实际演示 URL 写入 `demo`。[GitHub Pages 托管范围](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

在子项目 README 说明前后端部署位置、接口地址配置、运行依赖及可用功能。仅有 GitHub 仓库链接、构建产物或规划地址时，`demo` 继续保持为空。

## 012 · Huashu 艺术动画与风格研究

[012 · Huashu 艺术动画能力与风格研究](../projects/012-huashu-art-motion/README.md)为独立原生静态网页。能力、原理、35种艺术方向、绘画/运动/转场和选型方法写入HTML；同源iframe实际运行固定版本的原版Canvas引擎。Node.js 22+，无第三方网页依赖，无需模型和API密钥。

~~~powershell
cd projects/012-huashu-art-motion/web
npm.cmd run build
npm.cmd run preview
~~~

本地入口：http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/ 。`#style=17_ink`可直达并刷新。可用`node scripts/serve.mjs --dir dist --port 4212 --base /1008_codex_project/012-huashu-art-motion/`验证其他部署子路径。

未来统一发布将完整`web/dist/`复制到`_site/012-huashu-art-motion/`，保留engine/（脚本、35场景、字体与字体许可）、assets/（静帧、作者示范和验证记录）、data/、研究文档、source-manifest.json及MIT原文。资源均相对引用；必须通过HTTP托管，直接file://打开不能完整执行原版XHR及字体加载。

35个场景与34个转场已实际绘制，生产子路径、桌面/手机、搜索、逐帧、播放、深链接和无JavaScript阅读已检查。实时Canvas重场景的帧率受设备限制，视频导出另需上游Python/Playwright/FFmpeg。作者角色素材限制与字体许可继续适用。当前未对外发布，索引demo为空。

### 012 七场景作品版

scenarios/现为新版应用作品集。必须复制完整dist/，其中assets/production/包含七部30秒1080p MP4、AAC音乐、PNG美术、封面、提示词清单与CREDITS.md及CC-BY-4.0.txt；不得遗漏音乐署名和许可。字体OFL和上游MIT照常保留。服务器应提供video/mp4、audio/mp4与HTTP范围请求，本地serve.mjs已验证视频播放和定位。深链接可用#scene=interactive等。配乐默认静音，用户按钮开启；导览本地运行不需要后端。当前未公开部署，根索引demo为空。

<!-- HUASHU_UNDERSTANDING:START -->
### 012 能力与价值总览

首页#understanding及overview/已接入；overview/poster.html为图版源。部署完整dist/，保留overview/的HTML/CSS/JS、assets/understanding/的3200×8524 PNG与来源记录、data/understanding.json。所有资源相对引用；阅读、PNG下载、缩放、手机、无脚本与原版风格深链接已在完整子路径检查。当前本地入口为http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/overview/，没有新增在线demo登记。
<!-- HUASHU_UNDERSTANDING:END -->

### 001 · v17 接触小样与细笔落定

沿用沙画实验四入口生产构建与原子路径；新增 `art/memories/#hands`（15 秒正常速度接触小样）与 `#natural`（新雨窗动作谱）。发布整个 `dist/`，包含构建散列后的 `recorded-pour-*.webm`、`natural-window-score-*.json` 等资源；第三方手部片段与合成派生图的 CC BY 3.0 来源及改动说明见 `projects/001-sandboard/assets/material-realism-v17/README.md`。部署不需要模型 API。手部素材保存于当前浏览器来源的 IndexedDB，不随域名或端口迁移。

### 001 · v30 沿形撒收

三维照片试镜沿用 `art/memories/hands/contact/`，默认加载 v30，页面保留 v29、v28、v27 与原版切换。同一六入口构建须复制全部 `experiments/sand-art/dist/`，包含新增散列后的 `performance-window-score-*.json`；它只含工具曲线、节点力度和时间，不含照片或终态厚度。分章节奏约 468 秒，影片由本机实时材料过程导出，不需要后端或模型密钥。旧资源须随完整产物保留，本轮仍未发布在线演示。

### 001 · v31 茶杯手法小样

新增 `art/memories/hands/contact/cup/`，构建现为七入口；原 contact 路径仍默认 v30。复制完整 `experiments/sand-art/dist/`，含 cup/index.html 及其散列 JS / CSS 和共用 Three.js / 材料模块。小样动作在代码内编排，不需要手模型、照片或服务端；验证目录的 `density.f32` 不被网页加载。新旧页面相对链接、生产子路径、PNG 与 WebM 已本机验证，当前未外部发布，根索引 demo 留空。
