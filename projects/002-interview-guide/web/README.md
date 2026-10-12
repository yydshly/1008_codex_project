# 中文编程面试知识网页

独立静态网页，把固定版本的上游指南整理为可搜索、可展开阅读的中文知识地图。默认进入 `#research` 理解总览，先阅读能力、九类模块、实现原理、学习价值和扩展方向，再进入原有 `#overview` 知识索引。范围与许可见 [项目说明](../README.md)，实际验证记录见 [研究笔记](../notes.md)。

已于 **2026-10-12** 发布：[在线阅读](https://yydshly.github.io/1008_codex_project/002-interview-guide/)。公开 HTTPS 和真实在线浏览器验收已通过。

研究提交为 `fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed`：50 个主题、9 个分类、3 条路线；保留 273 条原始章节引用，并独立补回 3 条原文正文引用，合计 276 条记录、209 个去重资源入口。全部主题有共 113 节中文详细讲解、100 个具体误区、有效相关主题和 100 条参考答法，另有 38 个独立代码或伪代码示例。

## 运行、审计与构建

使用 Node.js 22 或更新版本，无第三方运行或构建依赖。在当前 `web/` 目录执行：

```powershell
npm run dev
```

打开 `http://localhost:4184/`。内容审计、生产构建与预览：

```powershell
npm run audit
npm run build
npm run preview
```

审计由 `scripts/audit-content.mjs` 生成 [`coverage.json`](coverage.json) 和 [`../src/content-audit.json`](../src/content-audit.json)。构建要求全部 50 主题的详细补充完整，核对上游快照、正文资料、答法、相关主题与表格，并将模块、报告与页面复制到 `dist/`，保留 `dist/LICENSE.upstream.txt`。`preview` 读取 `dist/`，默认也使用端口 4184。

审计使用固定本地快照，不在每次运行时请求 GitHub、验证外链或执行示例。最新版本日期来自独立保存的人工核对记录，不能视为实时上游状态。

## 阅读、搜索与覆盖页

理解总览通过 [`research.js`](research.js) 独立组织；它将原库、本站新增、外部服务和待开发方向分开说明。首屏展示已有 [`repository-map.png`](../assets/repository-map.png) 的完整缩略图，图像为本项目独立生成的内容图，原始尺寸1086 × 1448像素。可打开原图或下载PNG；网页只复制原文件，保持原字节、比例和全部内容，没有重生成或裁切。

源图登记在项目 `assets/`；`web/assets/repository-map.png` 为相同文件的网页副本，开发与生产统一使用 `./assets/repository-map.png`。更换源图时同步网页副本，完整资源随构建打包。原库出版原理附固定提交的内容配置、静态页面生成和Astro配置源码入口，本地流程说明快照、数据模块、全文检索、引用审计与浏览器Hash路由。

主题详情展示原文类型和补充说明，支持章节跳转、代码复制、主题链接复制、折叠参考答法及相关主题入口。全文搜索覆盖概要、知识点、详细段落、表格、示例代码和答法，可结合分类、标签及上游教程/资源导航类型筛选。

资源索引按 URL 合并全部引用与主题关联，再按网址归类为资源类型；这种分类是导航用途，不代表逐篇人工评估。正文补回资料带独立来源标记。输入 `#coverage` 可查看逐主题原文结构、引用映射与中文补充覆盖报告。

原文包含 11 教程、39 资源或问题导航。中文讲解和示例由本项目独立整理，面试总索引保留 13 语言、8 前端框架、15 后端框架对照；完整原文、原有44代码块和5张表保存在固定快照。全50主题登记不代表外部课程全文或全部面试知识已经收录。

## 模块与内容维护

| 文件 | 职责 |
| --- | --- |
| `research.js` | 理解总览、九类模块、原理、价值、适用场景与待开发方向 |
| `assets/repository-map.png` | 既有完整内容图的原字节网页副本，支持查看与下载 |
| `content.js` | 主题概要、原始引用、分类与路线 |
| `enrichment-foundations.js` | 工程、算法、语言框架26主题的展开讲解 |
| `enrichment-practice.js` | 架构、数据、协作、面试与AI等24主题的讲解和表格 |
| `enrichment.js` | 合并全50主题详情 |
| `extra-resources.js` | 从MDX正文补回的3条资源记录，保留固定出处 |
| `catalog-utils.js` | 详细内容搜索、引用合并与资源分类 |
| `reader.js` | 阅读详情、章节、表格、例子和答法界面 |
| `coverage-view.js` | 逐主题覆盖核对展示 |
| `coverage.json` | 审计生成的浏览器数据，不手工修改 |

修改时保留原 `references` 的名称、URL和顺序，新增正文提取记录另放 `extra-resources.js`。答法应与主题已有问题一一对应；相关主题必须有效且不重复，例子标明独立补充。原文入口固定到对应提交和路径。修改后重新审计、构建和验证，在仓库根执行 `npm run check`；实际结果写入研究笔记。

## 子路径检查与发布

公开子路径为 `/1008_codex_project/002-interview-guide/`。本地构建后执行：

```powershell
node scripts/serve.mjs --dir dist --port 4185 --base /1008_codex_project/002-interview-guide/
```

打开 `http://localhost:4185/1008_codex_project/002-interview-guide/`，再访问 `#coverage` 或主题链接进行检查。独立端口便于与开发服务同时运行；本次 Windows/npm 10 环境向脚本透传参数曾丢失标记，因此这里直接调用 Node.js。页面资源采用相对路径。

**既有知识地图验证（2026-10-08）**：严格内容审计、实际 `npm run build` 与上述生产子路径下 9 组新版 Chromium 检查全部通过。检查覆盖全部 50 主题、全文搜索与筛选、详细讲解、表格和答法、阅读操作、209 资源、覆盖页、返回与深链，以及 320 px 和 390 px 手机布局；无控制台错误、页面错误或请求失败。新版真实截图见 [截图登记](../assets/README.md)，具体验证边界见 [研究笔记](../notes.md)。当轮根 `npm run index:build`、`npm run check` 和 `git diff --check` 也通过。

**理解总览与聚合构建检查（2026-10-12）**：独立构建及 001 + 002 完整聚合构建通过，`validate-site` 通过，001 的 16 个 HTML 入口保留。002 严格审计仍为 50 主题、209 资源、38 示例和 100 答法；原图 1086 × 1448 px、1,917,984 字节，项目源图、`web/assets/` 与 `dist/assets/` 副本一致。根 `npm run check` 通过，`npm test` 为 13 / 13 通过。

**本轮真实浏览器验收（2026-10-12）**：在聚合产物的 `http://localhost:4202/1008_codex_project/002-interview-guide/` 使用 CUA 验证默认理解页、9 类 50 主题、原图完整加载、知识索引、搜索“依赖倒置”返回整洁架构与 SOLID、SOLID 深链刷新及折叠答法、覆盖页 50 项与 276 条记录 / 209 URL。320 / 390 px 手机无横向溢出，菜单打开并选择后正确关闭；控制台无 error / warn。聚合根首页正确显示两个项目。真实手机截图见 [`publication-mobile.jpg`](../assets/publication-mobile.jpg)，390 × 844 px。

4202 是本次聚合产物浏览器验收的实际端口；上面的 4185 命令仍用于独立 `dist/` 子路径预览。此次验收没有逐一联网验证 209 个外部 URL；线上验收与本地验收分别登记于下方。

本次已发布完整 `dist/`，包括 `research.js`、`assets/repository-map.png`、全部既有阅读模块、覆盖报告与许可。首页、`#research`、原有知识深链接和配图采用相对资源，实际部署于统一站点的 `002-interview-guide/` 子路径。

**线上验收（2026-10-12）**：初始发布源提交为 [`7b7921ec9c4988fa0dc409f13a8b683be4b1793a`](https://github.com/yydshly/1008_codex_project/commit/7b7921ec9c4988fa0dc409f13a8b683be4b1793a)，已推送 `main`；[GitHub Actions](https://github.com/yydshly/1008_codex_project/actions/runs/38204372772) 成功。实际 HTTPS 检查 002 的 16 个文件均为 200，文本归一换行后与本地产物一致，PNG 字节完全一致；001 的 16 个功能入口也为 200。真实在线 CUA 验证默认理解页与 9 模块、完整原图、知识导航 / 搜索“依赖倒置”、SOLID 深链刷新与答法、50 项覆盖及 276 记录 / 209 URL，页面无横向溢出，控制台无 error / warn。

线上桌面真实截图为 [`publication-desktop.jpg`](../assets/publication-desktop.jpg)，1265 × 712 px；`publication-mobile.jpg` 保持标为本地截图。HTTP 来源与逐文件结果见 [`../src/publication-verification.json`](../src/publication-verification.json) 的 `httpOnline`，浏览器操作记录见 [研究笔记](../notes.md)。后续链接与文档登记另行提交；初始发布源提交仍按本次实际记录保存。发布方式见 [部署说明](../../../docs/DEPLOYMENT.md)。
