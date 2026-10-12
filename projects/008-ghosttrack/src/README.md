# 代码来源说明

本次任务是源码研究与网页整理，没有复制 GhostTrack 程序，没有创建或运行真实信息查询实验。

原创网页及构建、预览脚本在 `../web/`。外部接口与库只作为研究对象链接，不纳入本项目依赖或源码。

`verify-browser.mjs` 为原创交付核验脚本，需通过 `--playwright` 指定已有模块、通过 `--url` 指定本地或公开网页；仅测试研究页面、交互和下载，不测试信息查询。`local-browser-checks.json` 与后续 `public-browser-checks.json` 保存实际观察，`publication-verification.json` 记录公开资源与部署证据。
