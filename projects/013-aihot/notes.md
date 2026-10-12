# 013 · AIHOT 信源与资讯引擎研究：研究笔记

[项目概览](README.md) · [研究数据](src/research.json) · [原仓库](https://github.com/KKKKhazix/AIHOT)

## 基线与研究方法

- 初次研究：2026-10-08；整理归档：2026-10-12，北京时间。
- 固定提交：`6e67a9d9e8d87b95b8118a8a0b328a9bebd2bb48`。
- 读取固定快照的 README、docs、信源、内容、编辑、事件、报告与公开读取源码；不运行不可信上游脚本。
- 研究页是解释和来源参考，不是 AIHOT 运行实例。真实源 GET、静态构建和浏览器验证分别记录时间与范围。
- 上游代码 MIT；品牌排除在授权外，字体另有 OFL，文章权利属于发布者。

## 2026-10-08 · 初次研究与图解

目的：回答能力、原理、场景、价值，把公开示范源和获取方式组织为完整中文图。

观察与资料：

- 阅读 customize、deploy、selection、sources 等官方文档，确认跨行业要整理来源、改标准与分类，并人工标注校准。
- 18 个示范源为 10 个机构与技术生态、5 个媒体、3 个作者与社区，全部 rss；Simon Willison 为 Atom。
- 官方媒体栏目与介绍用于分析定位：Verge 产品与社会影响，TechCrunch 商业，Ars 技术解释，MIT Technology Review 趋势背景，Decoder AI 专题。定位是阅读判断。
- 多家媒体常重复同一公告或互相引用；不能把报道数等同于独立核验证据。
- 当时浏览工具不能读取 MIT Technology Review 主站 AI 栏目，参考官方 event/forms 子域，没有把读取失败写成该 feed 永久失效。

成果：完整中文引导图。10 月 12 日归档复用既有 PNG 到 `assets/aihot-overview.png`；文件来源和一致性由图像保留记录说明。图不是上游运行截图，不证明真实精度和抓取效果。

## 2026-10-12 · 固定源码阅读与全面整理

目的：补足一张图无法展开的执行条件、模块关系、复用路线和边界。

环境：Windows / PowerShell、Codex 管理 worktree；实际 Node `v22.15.0`。上游 checkout 只读，未读取 .env、secret 或实际凭据。

实际执行的阅读命令类型：

```powershell
Get-Content -LiteralPath README.md
Get-Content -LiteralPath docs/PROJECT_GUIDE.md
Get-Content -LiteralPath docs/DEPLOYMENT.md
rg --files docs packages apps industry site modules scripts tests
Get-Content -LiteralPath docs/architecture.md
Get-Content -LiteralPath docs/grouping.md
Get-Content -LiteralPath docs/selection.md
Get-Content -LiteralPath packages/backend/src/sources/config-keys.ts
Get-Content -LiteralPath packages/backend/src/ingest/items.ts
rg -n "attentionScore|SCORE_CALLS|runScores" packages/backend/src/editorial/analyze.ts
rg -n "embedding|native|signal" packages/backend/src/events/group.ts
Get-Content -LiteralPath packages/backend/src/events/hot.ts
node -v
```

命令在对应仓库根目录执行。先读取研究总仓库约定，再读固定上游。未执行上游 migrate、seed、worker、api、smoke、eval 或 npm test；没有调用真实模型或付费服务。

关键源码结论：

| 主题 | 确认口径 |
| --- | --- |
| 双评分 | 同一个模型、同输入和标准，独立调用两次 |
| 五轴 | 提示词内部加权；程序只校验最终 attentionScore |
| 门槛 | T1=60、T1_5=65、T2=76，understandFloor=50；够分还须确认新信息 |
| 事件层 | report → fact → story；同主题不自动合并 |
| 召回 | 普通报道可文字降级；讨论信号除 native 引用外需要向量 |
| 热度 | 48 小时 participant 去重、24 小时半衰期、6 小时可比趋势 |
| 出刊 | 日报规则；周月从日报汇编，模型只写总述和导读 |
| 原文与输出 | 原材料保存在资料层，公开原文/译文/Markdown 与摘要共享 publication 规则 |
| 外部推送 | 元数据接口，不提供通用 bodyHtml/bodyText 字段 |
| 许可 | 可获取不等于允许全文展示或分发 |

整理数据：11 项摘要、13 项能力、17 个模块、9 步流程、6 个真实 schema 入口、6 个场景、6 个复用路线、8 个扩展方向、12 条边界、36 个参考。扩展均明确为规划或增强。

写入范围：`src/research.json`、项目 README、notes。前端、来源清单、图像保留与发布配置由对应任务维护；保留上游版权和摘录来源。

## 本地内容核验

- 已执行 Node 内置模块自检：research.json 可解析，11 个顶层字段及每类必需子字段齐全，能力/模块/流程/入口 ID 无重复，5 个 JSON 配置例子和 1 个 HTTP 请求正文可解析；结果通过。
- 已执行上游 git rev-parse HEAD，结果与固定研究 SHA 一致；结构化 scope 的代码枚举为 single/composite/unknown，研究数据已按实际枚举核正。
- 80 个引用路径对固定提交的 Git tree 全部确认存在。18 个唯一信源按上游逐项核验：10/5/3 分组，16 RSS / 2 Atom，名称、地址、分层、归属、间隔与标签一致。
- 六种获取例子按 config-keys 与实际 ingest 对照；占位地址不当作现成运营来源。
- feed 核验需检查响应类型和条目解析，HTTP 200 不一定是 RSS；状态只表示其核验时点。
- 独立静态 build 与 audit 通过，13 项能力、17 个模块、9 步流程、6 个获取入口及全部 11 类摘要直接存在于 HTML。原 PNG SHA-256 一致，JPEG 完整预览为 305614 字节。
- Playwright Chromium 在 1440×1000 桌面、390×844 与 320×844 手机验证通过：搜索、类别、Atom 筛选、空结果、重置、剪贴板、图像弹窗、原尺寸、Escape 关闭、子路径锚点、禁用脚本阅读；无页面异常或缺失资源。320 像素的长模块字符串最初产生横向溢出，添加局部换行后复验通过。详见 browser-verification.json。
- Node.js 22.15.0 下根 check、13 个 catalog 测试、整站构建、validate-site、既有 001 的平台与研究验证全部通过；001、002 的页面与素材保留。首次线上发布与 HTTPS 核验已通过，结果见 publication-verification.json。

## 仍待运行实验回答的问题

1. 目标行业的金标精度、召回、覆盖率和整条链路的失败率。
2. 真实资料量、长度、模型与翻译需求下的费用、token 和处理时延。
3. 动态页面、付费墙、平台限制及长期 feed 更新的影响。
4. participant 身份配置及向量启用前后讨论信号的热度差异。
5. 完整后端恢复、备份还原、撤回传播与真实部署安全；静态网页验证不能回答这些问题。

后续可开展小规模可授权样本实验、行业包与人工审稿；未运行前保持规划，不给出虚构精度、成本或可用性。

## 2026-10-12 公开发布核验

首次提交 5d902bf74dcef3700b40ac0311346923c21978ab 的 GitHub Actions build/deploy 均成功，运行 38206886463。统一首页、013 研究页、两份研究/信源 JSON、原 PNG、JPEG 预览、既有 001/002 入口均 HTTP 200。线上 PNG 1712633 字节且 SHA-256 与既有原图相同。线上 Chromium 重跑桌面、手机与禁用脚本检查，结果见 live-browser-verification.json。实际 URL 核验后才写入根索引 demo。
