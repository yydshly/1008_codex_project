# 中文静态研究网页

Node.js 22+，无第三方运行或构建依赖。构建时读取 `../src/` 数据，把全部正文与 18 个信源直接输出到 HTML；`app.js` 只增强搜索、筛选、复制地址、引导图阅读与章节导航。禁用 JavaScript 仍可阅读完整研究与源地址。

在仓库根执行：

```powershell
npm.cmd run build --prefix projects/013-aihot/web
node projects/013-aihot/web/scripts/audit.mjs --built
npm.cmd run preview --prefix projects/013-aihot/web
```

产物位于 `projects/013-aihot/web/dist/`，预览子路径 `/1008_codex_project/013-aihot/`，端口 4213。全部本项目资源使用相对引用。根聚合构建复制整个产物到 `.cache/pages-site/013-aihot/`，与 001、002 共用 GitHub Pages 发布。见[部署说明](../../../docs/DEPLOYMENT.md)。

网页展示既有完整引导图，原 PNG 保持原字节，JPEG 只作完整画面的轻量预览。页面提供 JSON、CSV、原配置、检测记录与 MIT 许可下载。网页没有采集或模型服务；部署上游引擎另需其数据库、worker、API、模型配置。
