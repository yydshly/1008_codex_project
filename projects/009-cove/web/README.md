# Cove 中文研究网页

原创、零第三方运行依赖的静态站点。使用 content.js 作为研究正文与架构数据，scripts/build.mjs 生成 HTML 和四张独立 SVG，并接入完整高清总览及可编辑图源。

~~~powershell
npm.cmd ci
npm.cmd run build
npm.cmd run preview
~~~

默认入口：http://127.0.0.1:4209/1008_codex_project/009-cove/

- index.template.html：页面结构与静态说明。
- content.js：固定源码分析、四张图、能力、原理、场景、扩展、目录与来源。
- publication.mjs：完整发布理解；12 项摘要、6 段引导介绍、8 组模块、价值、复用、接口、适配与8项待开发方向。
- scripts/render-publication.mjs：完整正文、统一入口卡片和独立 Markdown 的静态生成。
- scripts/sync-catalog.mjs：只同步 009 的摘要 / 引导介绍与完整原图，保留已有 demo；根索引由 index:build 生成。
- scripts/audit.mjs：内容、索引一致、子路径资源与原图字节完整性验证；可验证统一发布副本。
- map.html / map.js / map.css：完整原图的宽度适配、50% / 100%、滑杆缩放、滚动与下载。
- overview.js：完整单图内容与 HTML / CSS 排版；模块架构复用原创全局 SVG。
- styles.css：桌面 / 手机布局、架构图和打印样式。
- app.js：图类型切换、模块详情与章节导航。
- scripts/build.mjs：正文生成、ID / 关系验证、SVG 导出、总览内容 / PNG 摘要检查、许可与文档复制。
- scripts/create-overview.mjs：生成自包含总览图源。
- scripts/render-overview.mjs：使用环境提供的 Chromium / Playwright 生成高清 PNG，并检查内容计数、图片、裁剪与浏览器错误。
- scripts/serve.mjs：生产产物的本地子路径预览。
- scripts/record-sources.mjs：在固定上游 checkout 上重新生成源码路径及 SHA-256 清单，网页构建无需执行。
- scripts/verify-browser.mjs：使用环境提供的 Playwright 模块验证生产网页；不加入运行依赖。

支持完整总览查看 / 下载、离线图源，以及四张架构图切换、点击模块查看职责与源码，图类型支持方向键 / Home / End。小屏幕在图内部横向滚动，页面正文正常纵向阅读；SVG 可独立下载。

发布准备：将整个 dist/ 复制到统一站点的 009-cove/，包括 assets/、样式、脚本、研究文档、许可证与来源清单。本次未发布在线演示。

可选浏览器验收（先运行 preview）：node scripts/verify-browser.mjs <环境中的 playwright/index.mjs 绝对路径>。结果与截图保存到 ../assets/。

发布版使用 npm.cmd run check 校对14章正文、索引摘要、真实扩展入口和已有原图；web/dist/ 额外包含 publication.json、understanding.md、map.html 和完整图片。构建不重新渲染 PNG，而是比对固定原图的尺寸、长度和 SHA-256。

## 修改与重新生成总览图

普通构建使用已验证的 PNG，无需安装浏览器工具。修改 overview.js 后再生成图源与图片：

~~~powershell
npm.cmd run figure:source
node scripts/render-overview.mjs "<环境中的 playwright/index.mjs 绝对路径>"
npm.cmd run build
~~~

Playwright 仅用于渲染和验收，不进入项目运行依赖。PNG 为 1.5 倍像素密度，生成记录从实际 PNG 头读取尺寸。构建比较图源和 PNG 的 SHA-256，防止正文更新后仍发布旧图片。

若修改 content.js 的全局架构数据，先执行 build 更新 SVG；它会因旧总览摘要不一致而提示重新生成。随后按上面命令生成总览，再正常构建。
