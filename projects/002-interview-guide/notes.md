# 002 · 编程面试知识指南：研究笔记

[项目概览](README.md) · [原仓库](https://github.com/DevCaress/guia-entrevistas-de-programacion)

## 研究基线

| 日期 | 版本 / Commit | 阅读范围与结论 |
| --- | --- | --- |
| 2026-10-08 | `fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed` | README、许可、全部 `src/content/guide/` MDX、组件与测试；上游混合实际教程和外部资源导航 |
| 2026-10-08 | 核对时的 GitHub `main` | SHA 仍与固定基线相同，指南目录为 50 页，没有新页面或删除；记录保存在 `src/upstream-latest.json` |

固定 MDX 快照保存在 `src/upstream-guide.json`，同一提交的历史 README 保存在 `src/upstream-readme.md`，完整 MIT 许可保存在 `src/LICENSE.upstream`。50 页快照的 `raw` 经 Git blob SHA-1 比对全部匹配固定提交目录，原正文没有截断或丢失。

运行环境为 Windows、Node.js 22.15.0、npm 10.9.2。网页使用原生 HTML/CSS/JavaScript；审计、服务和构建仅使用 Node.js 内置模块。

## 2026-10-08 · 首版中文知识地图

首版建立了与 50 篇 MDX 一一对应的中文概要，分为 9 个分类、3 条路线，保留 273 条 `frontmatter.references` 记录，按 URL 去重为 207 个资源入口，并实现搜索、分类、路线和主题详情。

登记时 Windows/npm 10 参数透传丢失命令标记，随后直接调用 `node scripts/new-project.mjs` 完成项目登记。子路径检查也直接调用 `node scripts/serve.mjs`，保证 `--base` 等参数完整。原拟端口 4174、4175 已被其他服务占用，因此开发/默认预览使用 4184，生产子路径检查使用 4185。

首版曾实际通过独立构建与生产子路径下 10 组 Playwright Chromium 检查，覆盖入口和静态资源、9 分类与 50 详情、关键词及空结果、输入光标与模拟 IME、关闭返回、深链刷新、3 条路线、207 资源的列表操作、来源许可和 390 px 手机布局。检查中无控制台错误、页面错误或请求失败。首版根 `npm run index:build` 与 `npm run check` 也曾成功。

以上为首版历史记录；本轮增强版的独立验证结果另记在下文。首版资源检查未逐一联网请求外链；模拟 IME 也不等于覆盖所有系统输入法。

## 2026-10-08 · 查漏与内容展开

用户要求检查是否完整后，重新核对最新 `main`、固定目录、原始 MDX 和历史 README。发现页面和原正文已完整保存，但网页只展开概要；此外，原文正文中的资源没有全部进入首版索引。

### 引用修正

保留原 273 条章节元数据引用及其 207 个唯一 URL，不修改固定快照和 `content.js` 中的原始 `references`。从正文另外补回 3 条记录：

| 正文主题 | 资源 | 处理 |
| --- | --- | --- |
| 系统设计 | [System Design Interview Questions and Answers [2025]](https://www.geeksforgeeks.org/system-design/top-10-system-design-interview-questions-and-answers) | 1 条正文记录 |
| 面试资源总索引 | [Frontend Interview Questions [Top 250+]](https://frontendinterviewquestions.medium.com/frontend-interview-questions-top-250-92ba361cbbbd) | 1 条正文记录 |
| 前端面试复习 | 同一个前端面试资源 | 另保留 1 条主题关联记录 |

这两个 URL 原本就存在于 MDX 正文，遗漏的是资源索引的提取范围，不能表述为上游完全缺失。历史 README 也含这两个地址，作为对照不再重复计数；作者主页和网站入口单列，不计为学习资源。补回数据放在 `web/extra-resources.js`，带固定提交、原路径与正文来源标记。合并后为 **276 条引用记录、209 个唯一资源 URL**。

### 正文与知识补充

原文逐页分类为 **11 篇教程、39 篇资源或问题导航**，快照含 **44 个代码块、5 张表格、45 行表格数据**。分类依据实际解释与示例内容，不根据字符数自动判断。上游原文继续完整保存；网页中文内容是展开整理与独立补充，不冒充外链全文。

两个补充模块覆盖全部 50 个主题：工程、算法、语言与框架 26 个主题位于 `enrichment-foundations.js`，其余 24 个主题位于 `enrichment-practice.js`，由 `enrichment.js` 合并。当前报告与实际模块统计 **113 节讲解、38 个独立示例、100 个具体误区、100 条与复习题对应的参考答法**，全部主题有有效的相关主题关联。

重点补充 SOLID 五原则及实例、GRASP 九原则、23 个设计模式、迪米特法则、常见复杂度与递归空间、数据结构选型和算法学习清单、VisuAlgo 快照介绍的算法类型，以及各语言框架的关键语义。面试总索引的 3 张表对应原文 **13 种语言、8 个前端框架、15 个后端框架**，合计 36 行。

复杂度讲解同时澄清上游简化说法：Big-O、Big-Ω 和 Big-Θ 表示渐进上界、下界与紧界，本身不分别等于最坏、最好和平均情况，应先说明研究的成本函数和输入情况。

### 网页增强

新增全文搜索，检索范围覆盖详细段落、表格、代码和答法；新增标签、上游原文类型和资源类型筛选。详情由 `reader.js` 展示章节导航、代码复制、主题链接复制、折叠答法和相关主题。`coverage-view.js` 提供 `#coverage` 逐主题核对页，`catalog-utils.js` 统一搜索、资源类型与引用合并。

## 数据流与审计

1. 固定 MDX 与历史 README 提供研究输入；最新版本核对记录只说明核对日期时的上游状态。
2. `content.js` 保留主题对应关系、概要、原始引用与路线；两个补充模块提供详细中文内容。
3. 正文额外引用独立补回，再按 URL 合并为资源入口，保留全部主题关联。
4. `scripts/audit-content.mjs` 检查原文、元数据、引用、完整主题补充、答法数量、相关主题和索引表格，生成 `src/content-audit.json` 与 `web/coverage.json`。
5. 构建要求完整覆盖全部 50 个主题，复制阅读模块、覆盖报告和上游许可，产物可独立静态预览。

审计使用本地快照，不执行上游代码、不自动请求 GitHub，也不检查每个外链是否可达。它验证结构一致性，不自动判断讲解语义和代码运行正确性。

## 2026-10-08 · 增强版验证记录

当前生成的 [`src/content-audit.json`](src/content-audit.json) 显示 `checks.passed: true`、`enrichmentComplete: true`：50 页均对应中文主题与详细补充，原始引用一致，3 条正文记录已关联，100 条答法均与复习题对应，未报告结构错误或警告。

**本轮 `npm run build` 已再次实际通过**：构建调用严格内容审计，要求全 50 主题补充齐全，产物包含全部阅读模块、覆盖报告与许可；审计统计 209 个资源入口、38 个独立示例和 100 条答法。

本轮生产子路径为 `http://localhost:4185/1008_codex_project/002-interview-guide/`。可复现命令：

```powershell
cd projects/002-interview-guide/web
npm run audit
npm run build
node scripts/serve.mjs --dir dist --port 4185 --base /1008_codex_project/002-interview-guide/
```

### 新版 Chromium 检查：9 / 9 通过

| 检查组 | 实际结果 |
| --- | --- |
| 入口与产物 | 13 个网页文件及上游许可返回 HTTP 200，生产子路径资源加载正确 |
| 目录与筛选 | 9 分类覆盖 50 主题；原文类型筛选正确显示 11 教程、39 导航；标签筛选有效 |
| 全文检索 | 能搜索详细段落、表格与参考答法，包括 Kotlin、Nuxt 及中文“依赖倒置”与“依赖反转”同义词 |
| 全部主题详情 | 50 详情完整展示 113 节讲解、100 条答法、38 个示例、100 个误区；原 references 与补回的 3 条正文引用对应，原文入口固定到提交 |
| 阅读与对照表 | 面试总索引 3 张表、36 行完整；章节跳转、相关主题及复制传参正确 |
| 资源索引 | 209 资源分批加载、资源类型筛选正确；补回的 Medium 地址可查到两个主题关联；练习与可视化资源入口保持原关联 |
| 覆盖核对页 | 50 条主题记录与 276 引用、209 去重资源统计正确，来源和中文补充状态一致 |
| 导航与输入 | 返回保留搜索；中部输入光标与模拟 IME 稳定；刷新恢复主题深链；主内容区焦点与跳转链接正确 |
| 手机布局 | 320 px、390 px 下 6 类页面及 4 个长详情（含代码、表格）无横向溢出；隐藏侧栏的 `inert` 状态正确 |

检查期间没有控制台错误、页面错误或请求失败。资源检查针对本地记录、入口和关联，没有逐一验证209个外部网址可达。复制检查通过替换剪贴板 `writeText` 验证提交的代码和主题链接，未实际操作系统剪贴板；IME 使用模拟合成事件，不覆盖所有系统输入法。浏览器展示通过也不能自动证明每个示例代码的运行正确性。

### 新版真实截图与仓库检查

已在本轮生产构建下更新总览和手机截图，并新增覆盖清单及 SOLID 详情；详情截图等待弹窗真实可见后截取。

| 截图 | 画面与尺寸 |
| --- | --- |
| [`assets/cover.png`](assets/cover.png) | 桌面知识总览，1440 × 1889 |
| [`assets/mobile.png`](assets/mobile.png) | 手机总览，390 × 3154 |
| [`assets/mobile-detail.png`](assets/mobile-detail.png) | 手机 `call / apply / bind` 详情，390 × 844 |
| [`assets/engineering-detail.png`](assets/engineering-detail.png) | SOLID 长讲解弹窗，1440 × 1080 |
| [`assets/coverage.png`](assets/coverage.png) | 完整覆盖核对清单，1440 × 3891 |

当时根目录 `npm run index:build` 与 `npm run check` 已通过，确认当时两个项目的索引、元数据、目录和图片一致；`git diff --check` 通过。截至 2026-10-08 这次验证，仍是本地网页，尚未公开部署。

## 范围与后续维护

- 50 / 50 反映固定版本登记和中文补充范围，不代表穷尽所有面试知识，也不代表收录第三方资料全文。
- 外部练习、判题、动画和 AI 功能属于外部平台；本站示例供阅读、复制与自行实践。
- 外链可能变化，格式与登记校验不能保证长期可达；更新基线需重新比较目录、正文、引用、表格和中文补充。
- 本轮截图已与实际增强版对应；后续功能变化仍需重新验证并更新截图。
- 当前尚未公开部署；待真实在线地址验证后再登记 `projects.json` 的演示 URL。

## 2026-10-08 · 一张图说明原库能力与内容

用户要求用单图展示原库的用途和知识范围。本轮依据固定版本快照及中文目录，使用内置 image_gen 工具生成 [`assets/repository-map.png`](assets/repository-map.png)，尺寸 1086 × 1448 px；完整初次提示词与最终定点修正提示词保存在 [`assets/repository-map-prompt.txt`](assets/repository-map-prompt.txt)。原稿的算法分类数量显示不全，使用同一工具修正，并删除额外装饰口号，保留原始生成文件。

逐项核对图中 9 类与 50 个主题，数量为 9、5、12、9、1、2、4、7、1；11 篇详细教程、39 篇导航与 209 个去重资源统计一致。图中明确标记 9 分类为本地中文重组，113 节讲解、38 示例、100 误区、100 答法及 3 路线为本地新增，外部判题、动画与 AI 服务不归属本站功能。信息图独立保存在项目 assets，登记到图片说明并从项目 README 提供入口。

## 2026-10-12 · 完整理解、固定源码原理与发布准备

**目的**：把 002 的内容、模块、发布原理、使用价值与扩展方向整理成完整研究说明，并为本轮统一静态发布保留可审阅的依据。主引导图继续使用 `assets/repository-map.png`，不重新生成或改写图中的历史日期。

**输入**：根 README、`docs/PROJECT_GUIDE.md`、现有项目文档与固定 MDX / README 快照、`src/content-audit.json`、当前网页数据和脚本，以及 GitHub 上固定提交 `fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed` 的 11 份配置和源码文件。没有把默认分支的内容混入研究基线。

**日期口径**：50 页 / 209 资源、11 教程 / 39 导航，以及原始快照比对和浏览器验证来自 2026-10-08 的记录。本轮在 2026-10-12 回读固定版源码和已有材料，补充的是研究说明与发布准备；没有再次检查上游 `main`，因此保留 `upstream-latest.json` 的 `checkedOn: 2026-10-08`，不把“当时最新”改写为“今天最新”。

### 原库能力与内容矩阵

原库提供文档阅读、实际教程及参考资料导航。全部 50 篇 MDX 按本地 9 个方向重新组织为：工程原则 9、算法与数据结构 5、语言与框架 12、软件架构 9、系统设计 1、数据库与数据访问 2、协作与交付 4、面试专题 7、开发者 AI 1。

11 篇实际教程分别是：整洁架构、DRY、GRASP、KISS、迪米特法则、SOLID、YAGNI、复杂度，以及 JavaScript 对象创建、原型链、call/apply/bind。39 篇其余内容主要为资源或问题导航，其中总索引还包含技术对照表。目录和表格的存在不自动代表该页有完整教程。

资源口径继续使用“273 条元数据记录 + 3 条正文关联记录 = 276 条主题引用；207 个元数据 URL + 2 个正文 URL = 209 个去重入口”。相同 URL 的多个主题关系保留，历史 README 的重复链接不重复累计。原文 44 个代码块与本地 38 个独立示例分开统计。

### 上游发布链路的固定源码证据

本轮通过 GitHub 连接读取固定提交的配置、页面、布局与组件，没有执行上游安装、构建或生产服务。

| 文件 / 模块 | 观察到的具体实现 | 对研究说明的意义 |
| --- | --- | --- |
| [`package.json`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/package.json) | 版本声明 `1.1.0`；Astro、MDX、Tailwind 依赖；build 顺序为 astro check 后 astro build | 版本和构建链路由固定清单证明，不用它声称今天的最新版本或实际运行结果 |
| [`astro.config.mjs`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/astro.config.mjs)、[`global.css`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/styles/global.css) | 接入 MDX、Tailwind Vite 插件；Shiki 深浅代码主题；CSS 变量跟随页面主题 | 内容编译、样式构建与浏览器主题展示有明确分工 |
| [`src/content.config.ts`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content.config.ts) | glob 读取 MDX，Zod 校验标题、描述、分类、sidebar、references 和 examples | 新内容通过结构化元数据接入目录与资料列表 |
| [`src/pages/guia/[...slug].astro`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/pages/guia/%5B...slug%5D.astro) | getStaticPaths 为条目枚举页面；getCollection 和 render 取得内容，输出文章与参考列表 | 明确支持静态内容发布解释，不需要推测数据库生成文章 |
| [`src/utils/guide.ts`](https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/utils/guide.ts) | 基础路径、slug、sidebar.order、标题排序与分类分组 | 导航由内容元数据派生；深层详情不一定全部进入主侧栏 |
| 布局、Sidebar、ThemeToggle | 布局装配文章与导航，浏览器脚本管理折叠 / 手机菜单 / 主题，并保存设置 | 少量浏览器交互与静态文章可共存，不等于有服务端账户或学习进度 |
| CodeExample、ReferenceList | 标题 / 描述 / 语言标签 / slot 与参考链接列表 | 示例属于展示，外部题库和算法动画能力不归属原站 |

源码显示的是静态文档生成与阅读链路；本轮没有验证作者站点当前可访问性，也不把其配置中的站点地址当作本地部署成功证据。

### 本地数据、学习闭环与价值

重新梳理本地模块：快照与版本核对提供研究输入；`content.js` 记录主题、分类、题目、原始引用和路线；两个 enrichment 模块提供独立中文展开；`extra-resources.js` 补回正文引用；`catalog-utils.js` 统一检索与资源关联；`app.js`、`reader.js` 展示页面和阅读详情；`coverage-view.js` 展示逐主题证据；审计脚本与构建脚本保证结构一致并保留许可。

用户流程整理为“确定目标 → 理解机制 → 自行实践 → 尝试作答 → 连接相邻知识 → 核对来源”。本地站已有 3 条建议路线、详细段落、示例、误区、折叠答法、主题关联和外部入口，但没有自动记录掌握程度、在线判题或模拟面试。闭环是学习方式建议，其成效需要用户真实实践来判断。

使用价值按具体产出说明：面试复习清单与例子、项目设计取舍记录、初学者的下一步任务、小组讨论材料，以及可复用的内容目录 / 固定来源 / 覆盖审计方式。没有把“有资料”写成“保证通过面试”。

扩展方向独立标为后续判断：个人学习进度与间隔复习、岗位驱动路线、小型可验证练习、上游变化和外链维护、多语言编辑、受控 AI 问答。需要账户、服务或执行环境的方向会改变目前的纯静态范围，尚未作为已有功能交付。

### 图入口与发布状态

README 主入口改为完整 `assets/repository-map.png`，保留原图、提示词、图注和 2026-10-08 的真实网页截图；说明生成引导图与网页实测图的用途差异。正文补充能力矩阵、数字口径、固定源码证据、本地模块、学习流程、场景 / 价值、已有与未来能力、许可和边界。

文档完成时回读本轮网页代码：已新增 `web/research.js`，`app.js` 默认进入 `#research`；页面展示完整引导图、能力与原理、九类全部主题、使用场景、价值与待开发方向，并链接知识页 / 路线 / 覆盖页。`index.html` 提供无脚本概览和完整图，构建脚本复制 `research.js` 及图。以上为源码实现检查，新产物的浏览器与在线验收结果仍需单独记录。

本轮部署目标为统一站点下的 `/1008_codex_project/002-interview-guide/` 子路径。文档保留独立审计 / 构建 / 本地子路径命令，公开地址及本轮在线核验结果待实际发布完成后追加；本节不宣称已上线。

本轮文档修改仅涉及项目 `README.md` 与 `notes.md`，未修改上游快照、引用、增强内容或生成引导图。新构建、统一发布和在线验收需与本次实际产物对应，并与 2026-10-08 历史验证分开登记。

## 2026-10-12 · 聚合生产构建与真实浏览器验收

**目的**：验证本轮理解总览与整张引导图进入实际生产产物，并与 001 共同聚合，确认原有项目入口和 002 知识阅读功能保持完整。此记录属于本地验收，公开部署及 HTTPS 核验仍待完成。

**构建与仓库检查**：根 `npm run check` 通过，`npm test` 为 **13 / 13** 通过；001 + 002 的完整聚合构建与 `node scripts/validate-site.mjs` 通过。聚合目录 `.cache/pages-site/` 包含两个允许发布的项目，保留 001 的 **16 个 HTML 入口**，根首页正确显示两个项目。002 严格内容审计仍为 **50 主题、209 资源、38 示例与 100 答法**。

**配图核对**：`assets/repository-map.png` 仍为 2026-10-08 的原生成图，尺寸 **1086 × 1448 px**、文件大小 **1,917,984 字节**；项目源图、`web/assets/` 与 `web/dist/assets/` 副本一致。实际浏览器完整加载原图，比例正确、没有裁切；没有重新生成或改变图中核对日期。

**实际生产子路径**：`http://localhost:4202/1008_codex_project/002-interview-guide/`。使用 CUA 在真实浏览器中操作本地聚合产物，观察如下：

| 检查 | 实际结果 |
| --- | --- |
| 默认理解页 | 默认进入理解总览；9 类完整对应 50 主题，原图完整加载并保留查看 / 下载入口 |
| 知识入口与检索 | 可进入知识索引；搜索“依赖倒置”返回整洁架构与 SOLID |
| 阅读与深链 | SOLID 主题深链刷新可恢复，参考答法可折叠展开 |
| 覆盖清单 | 显示 50 项主题、276 条关联记录、209 个去重 URL |
| 手机布局与菜单 | 320 / 390 px 无横向溢出；菜单可打开，选择条目后正确关闭 |
| 控制台 | 未出现 error 或 warn |
| 聚合首页 | 正确展示 001、002 两个项目；001 原有入口保留 |

**新增截图**：[`assets/publication-mobile.jpg`](assets/publication-mobile.jpg)，日期 2026-10-12，390 × 844 px，真实手机视口截图。画面包含完整信息图、查看与下载、理解总览标题和内容统计，来源是上述本地地址。当前没有公开站点截图。

**范围**：本轮证明聚合构建、数据审计、图文件一致与列出的实际交互可用；没有逐一联网验证 209 个外链、重新检查上游 `main` 或自动评估学习效果。2026-10-08 的逐主题 Chromium 检查与本轮 CUA 检查分别保留日期和方法。公开发布、线上资源及 HTTPS 验收结果待实际完成后追加。
