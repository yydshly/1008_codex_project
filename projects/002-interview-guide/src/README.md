# 研究输入、版本与内容核对

这里保存固定上游内容及审计证据；中文汇总网页位于 [`../web/`](../web/README.md)。

| 文件 | 内容与用途 |
| --- | --- |
| [`upstream-guide.json`](upstream-guide.json) | 固定提交全部 50 篇 MDX，保留路径、元数据、引用、正文与完整原文 |
| [`upstream-readme.md`](upstream-readme.md) | 同一提交的历史 README，供目录和资源对照 |
| [`upstream-latest.json`](upstream-latest.json) | 2026-10-08 核对 GitHub `main` 的 SHA、50 页目录与方法；不自动更新 |
| [`content-audit.json`](content-audit.json) | 逐主题结构、引用与中文补充核对报告，由审计脚本生成 |
| [`LICENSE.upstream`](LICENSE.upstream) | 上游完整 MIT 许可，含 `Copyright (c) 2026 Daniel Enriquez` |

来源为 [DevCaress/guia-entrevistas-de-programacion](https://github.com/DevCaress/guia-entrevistas-de-programacion)，研究提交 [`fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed`](https://github.com/DevCaress/guia-entrevistas-de-programacion/tree/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed)，日期 2026-10-08。核对时最新 `main` 与固定基线一致。50 篇 `raw` 的 Git blob SHA 已逐项与该提交目录比对，一致。

## 快照格式与原文范围

顶层记录 `repo`、`commit`、`date` 与 `pages`；每页保留 `path`、`title`、`description`、`category`、`references`、`body`、`raw`。`raw` 是完整 MDX，`body` 是正文，提取字段用于逐项核对，不能把它们当作上游修订版本。

原文分为 11 篇包含详细解释与示例的教程、39 篇资源或问题导航。审计统计原文 44 个代码块、5 张表格、45 行数据；面试总索引占其中 3 张表、36 行。原文与本地中文独立示例是两组不同内容。

## 引用的两种来源

原 `frontmatter.references` 共 273 条、207 个唯一 URL，保持逐页原样。正文另有 3 条资源记录、2 个 URL，位于系统设计、面试资源总索引和前端面试三页；它们此前未进入网页索引，已经在 [`../web/extra-resources.js`](../web/extra-resources.js) 独立补回。

合并后网页登记 276 条记录、209 个去重入口，不修改原快照的 `references`。历史 README 也出现相同资料，仅用于对照，不重复计数；作者主页和站点入口不计为学习资源。不能将这次补回说成上游 MDX 正文缺失。

## 中文内容与审计

[`../web/content.js`](../web/content.js) 组织主题、原始引用、分类和路线；两个 `enrichment-*` 模块提供全 50 主题的中文讲解、独立示例、误区、答法和相关主题，详情标明原文类型与补充性质。这些中文内容并非第三方资料全文或逐字翻译。

在 `web/` 执行 `npm run audit`，脚本 `scripts/audit-content.mjs` 根据本地输入生成此目录的 `content-audit.json` 和网页使用的 `coverage.json`。它核对固定来源、元数据与完整原文一致性、引用关联、主题补充、问题答法数量、相关主题和索引表格；报告同时区分原文内容与本地补充统计。

当前报告的结构核对通过，50 个主题均有补充，100 条答法与问题对应。本轮严格构建与生产子路径下 9 组 Chromium 检查均通过，包含全部主题、资源、对照表、覆盖页与手机布局，详见 [`../notes.md`](../notes.md)。审计不联网更新上游、不执行原文代码、不逐一检查外部 URL，也不能自动判断知识解释或代码运行结果。

更新基线时应重新获取完整原文与历史 README，核对目录和正文链接，更新中文内容、原文入口、许可核对记录及文档，并保留版本变化说明。第三方资料仅保存名称与链接，各自版权和许可保持独立。
