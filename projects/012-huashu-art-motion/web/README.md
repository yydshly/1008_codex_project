# 风格研究与七场景应用作品集

Node.js 22+，无第三方网页运行依赖。npm.cmd run build与npm.cmd run preview生成和打开dist/。首页保留35种原版Canvas风格，scenarios/展示新版七部30秒1080p作品和可行走园林；全部资源为相对路径。重新出片需Playwright/FFmpeg和已保存素材，见../production-research.md。页面不连接客户账号或生成服务。

<!-- UNDERSTANDING:START -->
## 理解总览

首页#understanding接入完整研究图；overview/提供放大、高清PNG下载、完整文字与来源，overview/poster.html为可编辑图版的浏览器渲染入口。内容唯一源为understanding.mjs。assets/understanding/overview.png及来源清单必须一并部署。复现图版见../src/render-understanding.mjs，阅读检查见../src/verify-understanding.mjs。
<!-- UNDERSTANDING:END -->
