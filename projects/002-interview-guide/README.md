# 002 · 编程面试知识指南

把一份西班牙语开源面试指南整理为可核对、可检索、能串联知识的中文学习站：先看全貌，再阅读讲解、动手实践，最后用自己的话解释技术取舍。

[返回总索引](../../README.md) · [原仓库](https://github.com/DevCaress/guia-entrevistas-de-programacion) · [完整引导图](assets/repository-map.png) · [研究笔记](notes.md)

[![编程面试指南完整引导图：原库能力、50篇内容与209个资源、九类知识、本地中文增强和学习步骤](assets/repository-map.png)](assets/repository-map.png)

这张引导图于 **2026-10-08** 按固定上游版本生成，尺寸 1086 × 1448 px，标明上游内容、本地新增与外部平台能力。**2026-10-12** 的文档整理保留该图及原统计；图中核对日期不代表今天重新检查了上游最新版本。图的提示词与修正记录见[图片说明](assets/README.md)。

## 研究基线与进度

| 项目 | 内容 |
| --- | --- |
| 索引编号 | `002` |
| 研究对象 | [DevCaress/guia-entrevistas-de-programacion](https://github.com/DevCaress/guia-entrevistas-de-programacion) |
| 固定提交 | [`fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed`](https://github.com/DevCaress/guia-entrevistas-de-programacion/tree/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed) |
| 上游版本声明 | 固定提交的 `package.json` 为 `1.1.0`；不代表今天最新发布版本 |
| 初次研究 / 最新 main 核对 | 2026-10-08；当时 `main` 与基线一致，记录见 [`src/upstream-latest.json`](src/upstream-latest.json) |
| 本轮整理 | 2026-10-12，补充完整理解、固定源码发布原理和扩展方向 |
| 上游许可 | MIT，`Copyright (c) 2026 Daniel Enriquez`；全文见 [`src/LICENSE.upstream`](src/LICENSE.upstream) |
| 完成范围 | 固定版汇总、中文增强、覆盖审计；2026-10-12 的聚合构建与本地生产子路径验收已通过 |
| 发布状态 | 001 + 002 的统一产物已在本地验证；公开部署和 HTTPS 验收待完成 |

## 原库的能力与内容

原库把面试知识、实际教程与外部资料组织成可浏览的文档网站。它主要提供三种能力：按章节梳理复习范围；在有教程的主题中解释概念和展示代码；将读者导向文章、技术文档、题库、算法可视化和 AI 学习资料。原文主要为西班牙语，引用资料包含西班牙语与英语。[固定版本 README](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/README.md)

固定版共有 **50 篇 MDX**，其中 **11 篇详细教程、39 篇资源或问题导航**。11 篇教程是整洁架构、DRY、GRASP、KISS、迪米特法则、SOLID、YAGNI、复杂度，以及 JavaScript 对象创建、原型链和 call/apply/bind；其余页面中也有目录、技术对照表与简介，但主要承担学习入口的作用。类型依据正文逐页判断，不能把页面多、字符多直接等同于讲解深入。

下面的 **9 类是本项目的中文重组**，主题与原文页面一一对应；“本地展开”说明我们另外补足的阅读内容，不能解释为上游已经提供了这些完整教材。

| 中文方向 | 主题数 / 原文类型 | 原库覆盖内容 | 本地展开的重点 |
| --- | --- | --- | --- |
| 工程原则 | 9：7 教程 + 2 导航 | 整洁架构、整洁代码、DRY、GRASP、KISS、迪米特法则、SOLID、YAGNI、设计模式 | 依赖方向、SOLID 五原则、GRASP 九原则、设计模式三类与 23 个典型模式、何时抽象 |
| 算法与数据结构 | 5：1 教程 + 4 导航 | 算法实现、复杂度、数据结构、练习和 VisuAlgo 资源 | 渐进上/下/紧界、递归空间、结构选型、解题与可视化学习步骤 |
| 语言与框架 | 12：导航 | C++、Java、JavaScript、TypeScript、Python、PHP、Dart；Angular、React、Vue、Django、Flutter | 语言语义、类型与内存、异步、组件状态和工程实践 |
| 软件架构 | 9：导航 | 架构总览、前后端，以及 Express、Java、PHP、Python、React、Vue 的整洁架构 | 用例、端口、适配器、领域模型与各技术栈的具体边界 |
| 系统设计 | 1：导航 | 系统设计面试资料 | 需求澄清 → 容量估算 → 接口 → 存储 → 缓存 → 扩展 → 故障与观测 |
| 数据库与数据访问 | 2：导航 | SQL/NoSQL、数据库问答与 ORM | 复合索引、计划、事务与隔离、并发、懒加载与 N+1 |
| 协作与交付 | 4：导航 | Git、工作流、CI/CD、容器与编排 | merge/rebase、短分支与发布、构建产物、回滚、就绪与存活、数据恢复 |
| 面试专题 | 7：3 教程 + 4 导航 | 总索引、前后端问答、JavaScript 专题及三个具体问题 | 问题答法、代码预测、性能定位、可访问性、幂等与技术选择 |
| 开发者 AI | 1：导航 | AI 工具、MCP 与相关学习入口 | 模型 / 宿主 / 工具边界、权限、来源与执行结果验证 |

面试总索引还保留固定原文的 **13 种语言、8 个前端框架、15 个后端框架**对照表，包括 Go、C#、Ruby、Rust、Kotlin、Swift、Next.js、Nuxt、Svelte/SvelteKit 等。它们是原文清单的中文归纳，不是实时流行度榜单。

## 数字口径与覆盖核对

| 核对对象 | 固定范围与处理 |
| --- | --- |
| 页面 | 50 / 50 对应中文主题，完整保留原文 `raw` 与 `body` |
| 元数据引用 | 273 条章节记录，207 个唯一 URL，逐页原样保留 |
| 正文引用 | 另有 3 条关联记录、2 个 URL，从正文补回资源索引 |
| 全部资源 | 276 条主题关联记录，按 URL 去重为 **209 个资源入口** |
| 原文代码 / 表格 | 44 个代码块、5 张表格、45 行表格数据 |
| 本地中文增强 | 113 节讲解、38 个独立示例、100 个具体误区、100 条参考答法、3 条路线 |

补回的两条地址原本就在 MDX 正文中，首版遗漏的是资源提取范围；同一地址出现在多个主题时，保留多个主题关联但只计一个资源入口。历史 README 的重复地址用于对照，不再次累计。原文代码块与本地独立示例也是不同统计对象。

逐主题证据见网页的 `#coverage` 页面及 [`src/content-audit.json`](src/content-audit.json)。2026-10-08 已把全部 50 页的 `raw` Git blob SHA 与固定提交目录比对，一致。**50 / 50 表示版本内的登记与中文补充覆盖，不能解释为全部面试知识已经学完。**

## 原网站怎样发布内容

2026-10-12 回读的源码全部固定到上述提交，没有用今天的默认分支替换研究输入。这些文件展示了一条“文件内容 → 校验 → 静态页面 → 浏览器阅读”的发布链路。

| 模块 | 源码显示的作用 | 固定源码证据 |
| --- | --- | --- |
| 内容入口 | `glob` 加载 `src/content/guide/**/*.mdx`；Zod 校验标题、描述、分类、侧栏顺序、参考链接和可选示例字段 | [`src/content.config.ts`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content.config.ts) |
| 页面生成 | `getStaticPaths()` 为内容条目生成 `/guia/...` 路径；`getCollection()` 取条目，`render()` 将 MDX 正文送入文章布局 | [`src/pages/guia/[...slug].astro`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/pages/guia/%5B...slug%5D.astro) |
| 导航组织 | 按 `sidebar.order` 和标题排序、按分类分组；生成带部署基础路径的章节链接，并判断当前页 | [`src/utils/guide.ts`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/utils/guide.ts) |
| 页面壳与交互 | 布局提供文章、导航、主题按钮和元信息；侧栏折叠与主题选择由浏览器脚本处理，使用本地存储记住设置 | [`DocsLayout.astro`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/layouts/DocsLayout.astro)、[`Sidebar.astro`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/components/Sidebar.astro)、[`ThemeToggle.astro`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/components/ThemeToggle.astro) |
| 样式与代码展示 | Astro 接入 MDX，Vite 接入 Tailwind；Shiki 配置深浅代码配色。`CodeExample` 展示标题、描述与代码槽位，`ReferenceList` 输出资料链接 | [`astro.config.mjs`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/astro.config.mjs)、[`CodeExample.astro`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/components/CodeExample.astro)、[`ReferenceList.astro`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/components/ReferenceList.astro) |
| 生产构建与检查 | `build` 先运行 `astro check` 再运行 `astro build`；另有内容迁移、链接格式、Vitest 与 Playwright 命令 | [`package.json`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/package.json) |

这套组织方式让作者用 MDX 写正文、用元数据管理目录和引用，构建后通过静态页面供读者访问。代码展示组件没有提供执行沙箱；链接到题库或 VisuAlgo 也不会把对方的判题和动画变成本网站能力。本轮仅阅读固定源码，没有实际运行上游构建或验证作者站点的当前在线状态。

## 本地模块与数据流

本地增强站使用原生 HTML/CSS/JavaScript 和 Node.js 内置模块，独立于原库的 Astro 工程。原文快照与中文增强分开保存，既便于快速阅读，也能回到固定来源核对。

| 层次 | 主要文件 | 职责 |
| --- | --- | --- |
| 研究输入 | [`src/upstream-guide.json`](src/upstream-guide.json)、[`src/upstream-readme.md`](src/upstream-readme.md)、[`src/upstream-latest.json`](src/upstream-latest.json) | 保留 50 页原文、历史索引与 2026-10-08 的版本核对记录 |
| 基础目录 | [`web/content.js`](web/content.js) | 50 个主题与原路径映射、9 分类、概要、原始引用、复习题、3 路线 |
| 中文阅读数据 | [`web/enrichment-foundations.js`](web/enrichment-foundations.js)、[`web/enrichment-practice.js`](web/enrichment-practice.js)、[`web/enrichment.js`](web/enrichment.js) | 合并详细段落、表格、示例、误区、答法及相关主题 |
| 资源与检索 | [`web/extra-resources.js`](web/extra-resources.js)、[`web/catalog-utils.js`](web/catalog-utils.js) | 补回正文引用、按 URL 合并关联、按用途归类；全文搜索包含详细段落、表格、代码与答法 |
| 完整理解入口 | [`web/research.js`](web/research.js) | 默认 `#research` 页面展示整张引导图、原库能力、九类主题、原理、场景、价值与扩展建议，并连接知识页和覆盖页 |
| 页面与阅读 | [`web/app.js`](web/app.js)、[`web/reader.js`](web/reader.js) | 总览、分类、路线、资源、来源页面；主题弹窗、章节跳转、代码 / 链接复制、折叠答法、相关主题 |
| 覆盖报告 | [`web/coverage-view.js`](web/coverage-view.js)、[`web/coverage.json`](web/coverage.json) | 展示固定版本统计、逐主题来源类型、引用与补充完整性 |
| 审计与产物 | [`web/scripts/audit-content.mjs`](web/scripts/audit-content.mjs)、[`web/scripts/build.mjs`](web/scripts/build.mjs)、[`web/scripts/serve.mjs`](web/scripts/serve.mjs) | 校验内容和关联，生成报告，复制静态产物与许可，提供本地及子路径预览 |
| 图与实际效果 | [`assets/repository-map.png`](assets/repository-map.png)、[`assets/cover.png`](assets/cover.png)、[`assets/coverage.png`](assets/coverage.png) | 完整理解引导、真实网页总览与覆盖核对画面 |

数据流是：固定快照 → 中文目录和详细补充 → 正文引用合并 → 严格内容审计 → 静态产物 → 浏览器按分类 / 搜索 / 路线阅读。`app.js` 读取数据与覆盖报告，默认进入 `#research` 理解总览；`reader.js` 渲染详情，主题链接采用 `#topic=...`，覆盖页采用 `#coverage`，便于静态托管与刷新。引导图按完整比例显示，可打开原图和下载；无 JavaScript 时，入口仍提供内容概览与图。

审计检查主题、路径、原始引用、固定来源、详细内容、答法数量、相关主题与表格结构；构建要求 50 个主题补充齐全。它验证可追溯和结构一致性，不自动证明讲解正确、示例能执行、外链可达或学习者已经掌握知识。

## 从资料入口形成学习闭环

1. **先确定目标**：按岗位选择通用基础、前端或后端路线，再用分类与标签找到当前短板。
2. **理解机制**：阅读主题的要点和详细段落，用表格比较概念，并核对“上游教程 / 上游导航”的来源标记。
3. **动手验证**：复制独立示例到自己的环境，改变输入并预测结果；需要刷题、动画或完整课程时进入原始资料。
4. **练习表达**：先独立回答每个主题的两道复习问题，再展开参考答法，补充自己的项目案例和取舍。
5. **连接相邻知识**：通过相关主题，从语言机制联系组件与架构，从数据库联系系统设计和可靠交付。
6. **回查来源与范围**：用固定原文入口和覆盖清单确认阅读对象，区分独立中文补充、原文内容与外部能力。

网页提供这条学习流程的入口与材料；目前没有账号、学习进度、评分、自动复习计划或在线执行环境。学习成果仍需要通过读者的实践与表达检验。

## 使用场景与个人价值

| 场景 | 如何使用 | 能形成的实际产出 |
| --- | --- | --- |
| 面试前梳理 | 按岗位路线筛选主题，先填基础短板，再练习答法 | 一份有来源的复习清单与能解释的代码例子 |
| 日常工程复盘 | 对照依赖、事务、ORM、发布与故障主题，检查真实项目 | 带约束、选择理由和验证方式的设计记录 |
| 初学者建立地图 | 从总览理解知识之间的关系，再进入外部课程或文档 | 更明确的下一步学习任务，减少无目的地收集链接 |
| 小组分享与带教 | 使用固定主题、相关知识和误区讨论具体场景 | 可共同核对的术语、例子与问题清单 |
| 构建自己的知识站 | 参考原文元数据组织与本地覆盖审计方式 | 可维护的内容目录、来源链和静态发布流程 |

研究中值得复用的做法是“内容与元数据分开组织、来源固定到提交、引用保留主题关系、增强内容独立标注、覆盖报告对用户可见”。本地原生实现没有运行依赖，适合小型静态学习站；内容持续增长后，应重新评估加载体积、检索性能和编辑流程。

## 已实现与后续扩展

| 状态 | 方向 | 当前依据或下一步 |
| --- | --- | --- |
| 已实现 | 完整固定版映射、中文展开、资源与覆盖核对 | 50 主题、209 资源、113 节讲解、38 示例、100 误区与答法 |
| 已实现 | 全文 / 分类 / 标签 / 原文类型筛选 | 检索范围包含段落、表格、代码和答法；可区分 11 教程与 39 导航 |
| 已实现 | 三路线、详情操作与手机阅读 | 相关主题、复制、深链、折叠答法；历史验证覆盖 320 / 390 px |
| 本轮已实现 | 完整理解入口与引导图 | 默认理解总览、完整图 / 下载、能力与价值说明、无脚本阅读；本地生产子路径与手机验收通过 |
| 本轮推进 | 统一静态发布 | 发布成功及在线核验后再登记演示地址 |
| 后续可做 | 个人学习进度与间隔复习 | 增加本机记录、导出与复习队列，先定义“完成”的标准 |
| 后续可做 | 岗位 / 水平驱动的路线 | 依据岗位权重和短板生成计划，并让用户理解排序理由 |
| 后续可做 | 可验证的小练习 | 为少量主题增加测试型练习；执行隔离、成本和错误反馈需另行设计 |
| 后续可做 | 上游变化与链接维护 | 按新旧提交比较正文、元数据和 URL，记录变更；外链可达检查另行执行 |
| 后续可做 | 多语言与编辑协作 | 建立内容 schema、审阅和术语表，保持每种语言与固定来源关系 |
| 后续可做 | 受控 AI 复习辅助 | 基于指定材料生成提问并显示出处；模型、工具、权限与验证须分别落实 |

扩展方向是本研究的判断，尚未作为现有功能交付。加入账户、远程进度、AI 或代码执行会改变纯静态站的部署与运行范围，应先做小规模、可验证的方案。

## 本地运行、验证与发布

使用 Node.js 22 或更新版本。2026-10-08 的实施环境为 Windows、Node.js 22.15.0、npm 10.9.2；网页与脚本使用 Node.js 内置模块，无需安装第三方依赖。

```powershell
cd projects/002-interview-guide/web
npm run dev
```

打开 `http://localhost:4184/`。审计、生产构建与默认预览：

```powershell
npm run audit
npm run build
npm run preview
```

产物为 `web/dist/`，保留 `LICENSE.upstream.txt`。生产子路径检查直接调用 Node.js 脚本，避免本次 Windows/npm 参数透传问题：

```powershell
node scripts/serve.mjs --dir dist --port 4185 --base /1008_codex_project/002-interview-guide/
```

打开 `http://localhost:4185/1008_codex_project/002-interview-guide/`。后续统一发布将产物汇入 `002-interview-guide/` 子目录，与其他已启用项目共同发布；以实际生产地址验证后登记结果。[Web 运行说明](web/README.md)与[仓库部署说明](../../docs/DEPLOYMENT.md)

**已有验证证据属于 2026-10-08 的增强版本**：严格内容审计、生产构建和 9 组 Chromium 检查通过，包含 50 详情、表格、搜索筛选、209 资源及覆盖页、返回与深链、320 / 390 px 布局；没有控制台错误、页面错误或请求失败。它不等同于本轮部署完成，2026-10-12 的新验证与上线记录单独补入 [notes.md](notes.md)。

**2026-10-12 本轮本地验收已通过**：根 `npm run check`、13 / 13 项测试、001 + 002 完整聚合构建和 `validate-site` 均成功，保留 001 的 16 个 HTML 入口。002 严格审计仍为 50 主题、209 资源、38 示例与 100 答法；原图 1086 × 1448 px、1,917,984 字节，项目 / Web / dist 副本一致。

在 `http://localhost:4202/1008_codex_project/002-interview-guide/` 的真实 CUA 浏览器检查中，默认理解总览完整展示 9 类、50 主题与未裁切的原图；知识索引、搜索“依赖倒置”、SOLID 深链刷新与折叠答法、50 项覆盖清单和 276 记录 / 209 URL 均正常。320 / 390 px 手机无横向溢出，菜单打开、选项跳转与关闭正常，控制台无 error / warn；聚合首页正确显示 2 个项目。这些是本地生产产物证据，公开部署仍待核验。

本轮真实手机截图见 [2026-10-12 理解总览](assets/publication-mobile.jpg)，390 × 844 px，来自上述本地子路径，当前没有在线截图。

实际网页效果另见[桌面总览](assets/cover.png)、[覆盖清单](assets/coverage.png)、[SOLID 详情](assets/engineering-detail.png)、[手机总览](assets/mobile.png)与[手机详情](assets/mobile-detail.png)。这些是 2026-10-08 的本地生产截图，不与生成引导图混为一类。

## 来源、许可与边界

- 固定研究对象为 `fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed`。2026-10-08 的最新版本核对仍保留原日期，本轮没有自动更新到今天的 `main`。
- 原文 MDX、历史 README 与适用的上游代码遵循 MIT；保留 `Copyright (c) 2026 Daniel Enriquez` 和完整许可，构建复制 `dist/LICENSE.upstream.txt`。
- 中文讲解、例子、误区、答法、路线、布局、审计及本地脚本为独立新增；并非逐字翻译或完整复制原站。本仓库尚未为原创内容指定统一许可证。
- 第三方教程、书籍、视频、题库和网站各自适用其许可。这里只保留资料入口及主题关联，没有完整收录外部文章；上游 MIT 不自动覆盖第三方素材。
- 原库与本地站的代码块用于展示；判题、算法动画和 AI 服务由对应外部平台提供。本站目前没有内置判题、模拟面试官、在线沙箱或自动学习评估。
- 页面和引用覆盖不等于知识穷尽或掌握程度；209 个外部 URL 未逐一联网验证，格式正确与登记齐全不保证长期可达。
