# GhostTrack 中文研究网页

原生 HTML / CSS / JavaScript，构建和预览仅使用 Node.js 内置模块，无第三方依赖。

```powershell
npm.cmd run build
npm.cmd run check
npm.cmd run preview
```

本机入口：http://127.0.0.1:4195/1008_codex_project/008-ghosttrack/

`index.template.html` 与 `content.js` 经 `scripts/build.mjs` 生成静态 `dist/index.html`。四项完整说明都在生产 HTML 中，JavaScript 只控制阅读交互，不发出外部查询请求。改动内容后重新构建。

`scripts/serve.mjs` 默认仅监听 `127.0.0.1:4195`，支持 `--dir`、`--port` 和 `--base`；部署时复制完整 `dist/`，CSS / JS / 文档的相对引用兼容其他子路径。

`publication.mjs` 保存完整理解，摘要与根 projects.json 同步；`scripts/audit.mjs` 核对静态正文、原图字节、索引一致性与下载。`map.html` 提供完整原图缩放阅读，不请求查询接口；`publication.json`、`understanding.md` 可导出。

详见[项目概览](../README.md)和[发布记录](../PUBLICATION.md)。本轮接入既有 GitHub Pages，公开核验完成后再登记 demo。
