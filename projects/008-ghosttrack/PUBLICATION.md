# GhostTrack 完整理解与既有总览图发布（2026-10-12）

008 接入现有 GitHub Pages Actions，与 001、002、003、004、005、006、007、013 独立构建后统一发布。研究网页不执行真实 IP、号码或账号查询，不部署上游 CLI 或查询后端。[在线完整研究](https://yydshly.github.io/1008_codex_project/008-ghosttrack/)和[可缩放一图阅读](https://yydshly.github.io/1008_codex_project/008-ghosttrack/map.html)已通过公开 HTTPS 与真实浏览器核验，正式 demo 在核验后登记。首次[部署运行38232724055](https://github.com/yydshly/1008_codex_project/actions/runs/38232724055)成功；32个公开入口/资源、原图下载 SHA-256、390/320 手机、200% 字号、无脚本阅读与键盘/片段/下载均通过，既有八个项目入口保留。见[发布核验](src/publication-verification.json)、[HTTP记录](src/public-http-checks.json)和[浏览器记录](src/public-browser-checks.json)。

完整内容提供 12 项摘要、6 段图前介绍、4 项能力及输入输出、8 个分析模块、3 层底层关系、6 类场景、6 项后续价值、4 条独立实现路线、3 步推进顺序、8 项扩展与验证、来源许可说明；摘要及引导介绍与 projects.json 保持一致，正文在构建时进入 HTML，关闭 JavaScript 仍能阅读。

沿用既有 2160×3853 PNG，不裁切、不重绘、不修改原始字节；SHA-256：`e740c55e3b86231aa15e1bd31356c6e593723f6be287bbf37f4c51922d61283c`。网页内展示完整原图，map.html 支持适合宽度、50% / 100% 和滑杆缩放、滚动与下载，附文字版和可编辑 HTML 源图。

```powershell
npm.cmd ci --prefix projects/008-ghosttrack/web
npm.cmd run build --prefix projects/008-ghosttrack/web
npm.cmd run check --prefix projects/008-ghosttrack/web
npm.cmd run index:build
npm.cmd run check
npm.cmd test
npm.cmd run build:site
node scripts/validate-site.mjs
```

Node.js 22+，本研究页没有第三方依赖。独立产物 web/dist/ 完整复制到 .cache/pages-site/008-ghosttrack/，包括原图、可编辑图源、文字版、能力脚本、图像阅读器、Markdown 与结构化研究 JSON。资源相对引用；默认部署子路径 `/1008_codex_project/008-ghosttrack/`，本地端口 4195。

CI 增加 008 允许名单与内容、下载、摘要一致性和原图校验；既有八项目继续发布。固定研究提交 `a5cb8ad4c08acd803f166fb067b7dac724d6cb3d`，源码和主要官方文档在 2026-10-12 重新核对。修正旧网页错误的源码行数与函数定位，原图事实不变。未复制上游代码或图片；上游没有标准许可证，不能直接认定任意复用授权。网页验证不等于真实查询结果与平台可用性验证，扩展均为规划。
