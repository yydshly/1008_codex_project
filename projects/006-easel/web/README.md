# Easel 中文源码研究网页

原生 HTML/CSS/JS，Node 22+，无第三方依赖。资料固定到 `fb80ae6dd6fc26f5553efcb293ee6d93ef253f02`。研究站不调用 Easel、模型或社媒接口。

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run check
npm.cmd run preview
```

本地入口 http://127.0.0.1:4206/1008_codex_project/006-easel/ 。服务只监听 127.0.0.1。相对资源和 Hash 路由适合统一子路径。部署完整复制 dist/，包括 JSON、样式、脚本、favicon、研究说明和上游许可；公开状态见 [发布核验](../src/publication-verification.json)。

六个章节分别是项目与架构、搜索与过滤、全部能力、制作与发布、场景与扩展、源码与验证。首页提供12项摘要、6段图前介绍、7步闭环与完整原图；价值章节覆盖6类场景、4项个人价值、4条复用路线和8项扩展建议。构建时将完整理解、原图、8个模块和价值章节写入 HTML，关闭脚本也可阅读；技能检索、详情和样本过滤需要 JavaScript。

公开入口：[Easel 完整理解与能力图谱](https://yydshly.github.io/1008_codex_project/006-easel/)。完整静态资料和六个旧项目入口均通过HTTPS核验；相关记录在 `../src/public-http-checks.json`，可用 `node ../src/verify_public.mjs` 重新核对。

引导图沿用2026-10-09生成的原始 `capability-map.png`，941×1672。构建、子项目审计和根站审计均核对原始字节与SHA-256，索引摘要与网页发布资料须完全一致。

构建根据脚本、样式和JSON内容生成资源版本号，用于HTML引用、模块导入和资料请求；避免浏览器复用上一版资源。版本保存在 `build-info.json`，不改变引导图的原始字节。

- facts.json：系统模块、来源端点、过滤、制作发布与具体源码行号。
- capabilities.json：114 项描述、机制、流程、工具引用、缺失引用与全文。
- verification.json：5 个离线通过项、1 个 Windows 上游自检失败项与范围。
- browser-checks.json：网页浏览器核验记录。
- publication.json：完整摘要、图前介绍、闭环、场景、个人价值、复用路线、扩展建议与边界。
- research-view.mjs：构建和浏览器共用的原创研究展示模块。
- 离线实验台仅用原创虚构样本，不冒充当前热榜或 Agent 语义判断。
- Skill 原文按文本转义显示，不执行其 HTML／脚本。

来源与原创范围见 [项目说明](../README.md) 和 [署名](../src/ATTRIBUTION.md)。
