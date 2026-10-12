# 风格研究与七场景应用作品集

2026-10-12 完整整理由 `publication.mjs` 提供十二项摘要、六段引导、九模块/17 库、六机制、四复用与八扩展。`understanding.mjs` 保留原图的能力、风格、场景与价值解释；`overview/render.mjs` 将补充文字接到原图阅读器。根索引与网页使用同源摘要。

独立验证：`npm.cmd run build` → `npm.cmd run check`。统一发布见根 `docs/DEPLOYMENT.md`；无需第三方网页依赖。`scripts/audit.mjs` 同时核对固定源码和原始 PNG 哈希、HTML 引用与视频文件；真实阅读、缩放、原图下载、场景、解码与操作见 `../src/verify-publication.mjs`。

Node.js 22+，无第三方网页运行依赖。npm.cmd run build与npm.cmd run preview生成和打开dist/。首页保留35种原版Canvas风格，scenarios/展示新版七部30秒1080p作品和可行走园林；全部资源为相对路径。重新出片需Playwright/FFmpeg和已保存素材，见../production-research.md。页面不连接客户账号或生成服务。

<!-- UNDERSTANDING:START -->
## 理解总览

首页#understanding接入完整研究图；overview/提供放大、高清PNG下载、完整文字与来源，overview/poster.html为可编辑图版的浏览器渲染入口。内容唯一源为understanding.mjs。assets/understanding/overview.png及来源清单必须一并部署。复现图版见../src/render-understanding.mjs，阅读检查见../src/verify-understanding.mjs。
<!-- UNDERSTANDING:END -->
