# 多 Web 演示部署与记录

<!-- THREEJS_PUBLICATION:START -->
## Three.js 游戏技能完整理解与真实试玩（2026-10-12）

005 已通过现有 GitHub Pages Actions 部署，完整保留 001、002、003、004、013。公开 [完整理解与三款试玩](https://yydshly.github.io/1008_codex_project/005-threejs-game-skills/) 已核验并登记 demo；发布运行 [38219665967](https://github.com/yydshly/1008_codex_project/actions/runs/38219665967) 成功。42 个 HTTP 资源入口、公开原图下载哈希、十二项摘要、四层模块、八项扩展规划与三款游戏加载通过；两款原创游戏开始、真实输入、暂停通过。完整范围见 [公开核验记录](../projects/005-threejs-game-skills/src/publication-verification.json) 与 [本地核验记录](../projects/005-threejs-game-skills/src/local-publication-verification.json)。

研究网页提供十二项完整摘要、四层模块、九类能力、五步制作原理、四类约束、六个使用场景、四项个人价值、四条复用路线与八项扩展规划。沿用 2026-10-09 生成的完整 1024×1536 总览图，原始 PNG 字节保留；作者原始截图、我们的历史两版、实际输入录像和素材署名分别保留。

```powershell
npm.cmd ci --prefix projects/005-threejs-game-skills/web
npm.cmd ci --prefix projects/005-threejs-game-skills/experiments/scaffold
npm.cmd ci --prefix projects/005-threejs-game-skills/experiments/storm-harbor
npm.cmd ci --prefix projects/005-threejs-game-skills/experiments/ink-swordsman
node projects/005-threejs-game-skills/web/scripts/build-games.mjs
node projects/005-threejs-game-skills/web/scripts/build.mjs
node projects/005-threejs-game-skills/web/scripts/audit.mjs
npm.cmd run check
npm.cmd test
npm.cmd run build:site
node scripts/validate-site.mjs
```

Node.js 22.12+，各游戏独立维护 Vite/TypeScript/Three.js 依赖与锁文件；研究网页无第三方运行依赖。聚合时复制完整 web/dist/ 到 .cache/pages-site/005-threejs-game-skills/，包含 starter/ 原库模板、play/ 暴风港、ink/ 竹影问剑，以及 assets、data、研究文档、许可和证据。摘要、模块、复用和扩展方向在构建时写入 HTML，原有能力切换与游戏需要 JavaScript。

CI 检查完整摘要与索引一致、原图哈希、静态章节、三款游戏资源和既有五个站点。根依赖不吸收子项目依赖，发布允许名单仅增加 005。公开站点不调用 Tripo、Gemini、ElevenLabs 或模型，不提供账号、多人或云存储；历史实验验证不能代替真机、音频或同模型收益对照。扩展方向均为研究规划。
<!-- THREEJS_PUBLICATION:END -->

<!-- UP_PUBLICATION:START -->
## Up 完整理解与学习知识地图（2026-10-12）

004已通过GitHub Pages Actions部署，与001、002、003和013一起构建；公开HTTPS与真实浏览器核验通过后已登记[在线完整理解](https://yydshly.github.io/1008_codex_project/004-up-learning-guide/)和[一图阅读](https://yydshly.github.io/1008_codex_project/004-up-learning-guide/#/map)。完整理解提供十一项摘要、十个章节、八个待开发方向，七篇专题、97页目录、25张工作纸、392个分组词条与67个引用继续完整保留。

沿用我们2026-10-09生成的2400×1600完整PNG，引导图SHA-256为68d76ca3f2c88580d5e5bd20c6cbf79ae344ce650663467bcac95d53925924b6，构建、聚合与浏览器下载检查原始字节一致。摘要覆盖能力、模块、方法与技术原理、本地实现、五项价值观、场景、复用价值、扩展方向、边界和来源许可；扩展为研究规划，网站提供静态阅读与资料，不部署模型或教学后端。

```powershell
npm.cmd ci --ignore-scripts --prefix projects/004-up-learning-guide/web
npm.cmd run build --prefix projects/004-up-learning-guide/web
npm.cmd run check --prefix projects/004-up-learning-guide/web
npm.cmd run check
npm.cmd test
npm.cmd run build:site
node scripts/validate-site.mjs
```

Node.js22+，marked18.1.0为本项目独立构建依赖。独立产物web/dist/，聚合产物.cache/pages-site/004-up-learning-guide/；必须保留data、research、许可、PNG/SVG与完整理解Markdown。资源相对引用，hash路由支持专题和完整理解段落刷新。十一项摘要与十章正文进入静态HTML，JavaScript提供搜索、筛选和六步切换。

本地真实浏览器已核验原图、15个资料入口、实际下载、搜索定位、深链接刷新、390/320px手机与无脚本阅读，无控制台异常。长表格最小宽度导致手机页面撑宽的问题已修复，表格在内容区域内滚动。见[本地核验记录](../projects/004-up-learning-guide/src/local-publication-verification.json)、[公开核验记录](../projects/004-up-learning-guide/src/publication-verification.json)与[研究记录](../projects/004-up-learning-guide/notes.md)。发布运行[38213482999](https://github.com/yydshly/1008_codex_project/actions/runs/38213482999)成功，公开页面、下载与PNG哈希均通过。

固定上游35e2aa9ad3a076fe4e8405877cc560df2593838f；byoungd and contributors内容与本地改写CC BY-NC4.0，上游程序MIT，第三方素材保留独立来源。网页验证不等于上游完整出版构建或个人学习效果验证。
<!-- UP_PUBLICATION:END -->



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

以下为仓库初始化时的部署规划与历史说明；实际已发布项目及当前构建方式以上方发布记录为准。

## 一个站点，多个项目路径

GitHub Pages 每个仓库最多对应一个项目站点，其默认地址含仓库名称。这里计划把多个静态 Web 的构建结果汇总为一个站点，再按编号分目录发布。[GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

预期路径如下；这是规划示例，当前不可视为已上线：

| 内容 | 计划路径 |
| --- | --- |
| 演示总入口 | `/1008_codex_project/` |
| 第一个 Web | `/1008_codex_project/001-repo-name/` |
| 第二个 Web | `/1008_codex_project/002-another-repo/` |

源码继续放在 `projects/<id>-<slug>/web/`。未来发布流程可使用临时目录 `_site/` 汇总产物：

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

## 需要后端的项目

GitHub Pages 托管静态 HTML、CSS 和 JavaScript，动态后端需要部署到外部服务。前端可放在 Pages，后端运行在适合该项目的平台，或把完整应用部署到外部平台，再将实际演示 URL 写入 `demo`。[GitHub Pages 托管范围](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

在子项目 README 说明前后端部署位置、接口地址配置、运行依赖及可用功能。仅有 GitHub 仓库链接、构建产物或规划地址时，`demo` 继续保持为空。
