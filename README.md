# GitHub 项目研究集

用简短摘要、完整引导图和在线效果了解开源项目；详细原理、探索过程与结论见各子项目。

## 项目索引

从索引进入研究说明、源库或在线体验。

<!-- PROJECT_INDEX:START -->

| 序号 | 项目 / 来源 | 研究摘要 | 状态 | 演示 |
| --- | --- | --- | --- | --- |
| 001 | [Sandboard 交互沙盘](projects/001-sandboard/README.md) · [Sandboard](https://github.com/scottstts/Sandboard) | **能力**：WebGPU 沙盘：沟槽、堆积、飞沙。<br>**原理**：高度场、邻域输运与飞沙粒子。<br>**探索**：七工具手绘、照片成画、动作回放。<br>**价值**：触控创作、教学与材料试验。<br>**方向**：纪念赠礼、创作工具、互动展陈。<br>**进度**：原版与旧版保留；真实质感待验证。 | 研究中 | [访问](https://yydshly.github.io/1008_codex_project/001-sandboard/) |
| 002 | [编程面试知识指南](projects/002-interview-guide/README.md) · [guia-entrevistas-de-programacion](https://github.com/DevCaress/guia-entrevistas-de-programacion) | **能力**：面试复习与资源导航：50篇原文、209个资料入口，含11篇教程与39篇导航。<br>**模块**：工程、算法、语言框架、架构、系统设计、数据访问、交付、面试与AI九个方向。<br>**原理**：Astro将校验过的MDX静态出版；本地通过固定快照、主题关联、全文检索和覆盖审计组织知识。<br>**增强**：113节中文讲解、38个示例、100个误区与100条答法；检索筛选、三条路线与完整引导图。<br>**价值**：查漏复习、组织面试表达、对照技术栈，也可作为团队培训和可追溯知识库的起点。<br>**方向**：学习进度、错题与间隔复习、上游差异和外链监测；可选AI问答需提供出处与验证。<br>**边界**：第三方判题、算法动画与AI/MCP仅为资料入口；本站无代码运行、判题或模拟面试服务。 | 已完成 | [访问](https://yydshly.github.io/1008_codex_project/002-interview-guide/) |
| 003 | [Pascal 3D 建筑编辑器](projects/003-pascal-editor/README.md) · [editor](https://github.com/pascalorg/editor) | **能力**：参数化建筑构件与家具布局、材质显示、2D/3D 分屏、多层查看、选择编辑和撤销重做；本地真实演示保留住宅与官方示例。<br>**模块**：core 管节点、状态、注册与空间查询；nodes 提供构件、工具和几何；viewer 负责 3D；editor 负责交互与多视图；另有独立应用、CLI、MCP 与共享 UI。<br>**原理**：场景以带 ID 和父子关系的参数节点保存，编辑触发 dirty 更新；构件系统重建几何、处理墙交接和门窗 CSG 开洞，再由 Three.js/R3F 渲染；2D 直接投影同一节点数据。<br>**本地实现**：固定四个 npm 包 1.0.3，增加中文宿主、原创住宅、42 类本地资产、114 项材质配套资源、按示例保存的浏览器草稿和完整理解网页。<br>**场景**：家装方案试排、家具商品空间展示、户型与楼层教学、房间设计产品原型；测绘参考和设施维护可以作为后续探索，需补足数据与业务。<br>**价值**：复用参数—几何—视图的编辑链路，减少基础编辑器开发，把精力投入资产、方案管理、服务流程及自己的产品体验；不预设节省比例或工程精度。<br>**复用路线**：可从 Viewer 展示、Editor 嵌入、独立 CLI 或 MCP 路线切入；先完成创建项目—编辑—保存恢复，再接入自己的资产目录、分享与业务规则。<br>**扩展方向**：云端项目与版本、商品资产与规则、布局约束与方案比较、受控 AI/MCP、数据交换、测绘参考、自定义构件插件，以及专业服务流程。<br>**边界**：官方 Next 完整托管体验尚未进入开源发行；本网站没有账号、云协作或 AI/MCP 后端，完整导出、IFC、专业施工图、真实触摸与工程校验未逐项验收。<br>**验证与许可**：已实测墙厚修改及撤销重做、楼层高度保存刷新与还原、家具新增、多层展开和分屏；研究固定 c5eaf51，代码 MIT，材质单独许可待逐项核实，Basis 解码器保留 Apache 2.0。 | 研究中 | [访问](https://yydshly.github.io/1008_codex_project/003-pascal-editor/overview/) |
| 013 | [AIHOT 信源与资讯引擎研究](projects/013-aihot/README.md) · [AIHOT](https://github.com/KKKKhazix/AIHOT) | **能力**：把多源资讯采集、预筛、评分、结构化、中文写作、事件归组、热度与定期出刊串成可自托管的资讯流水线。<br>**模块**：api、worker、web 三个进程；sources/content/editorial/events/publication/reports 等业务模块；site 与 industry 分离站点身份和行业判断。<br>**原理**：先确定可用材料与发布时间，再由同一评分模型独立评两次；报道 report → 一次发生 fact → 持续事件 story，公开出口统一经过 publication。<br>**信源**：18 个示范源全部使用 rss 适配器：10 个机构与技术生态源、5 个媒体、3 个作者与社区源。适配器兼容 RSS、Atom 和 RDF，不包含线上完整运营名单。<br>**获取**：订阅解析与正文补取是两层；另支持网页 CSS、JSON 字段映射、X/SocialData、公众号/Dajiala 与外部推送。扩展入口需要自行配置，并非现成示范源。<br>**场景**：行业晨报、产品与竞品监测、开发者资讯、团队情报入口、垂直内容站，以及向 Agent 提供可追溯的资讯。<br>**价值**：减少重复阅读与手工编报，把编辑经验写成可评测的筛选标准；源质量、标注与持续运营决定最终效果。<br>**复用**：既可只借用来源清单和采集配置，也可复用正文清洗、事件模型、评测方法、公开范围控制，或部署完整引擎。<br>**方向**：中文行业包、人工审稿、多租户、个性化、更多通知渠道和带出处的问答可在此基础上开发；这些是规划，不是当前已交付的能力。<br>**边界**：模型评分不是事实核验；热度不是全网热搜；全文获取不代表转载授权；GitHub Pages 研究页不提供上游数据库、采集或模型服务。<br>**验证**：结论来自文档与固定提交源码阅读。保留 10 月 8 日观察基线，10 月 12 日整理归档；本地研究网页构建与浏览器核验另记，不把阅读当作端到端运行。 | 已完成 | [访问](https://yydshly.github.io/1008_codex_project/013-aihot/) |

### 001 · Sandboard 交互沙盘

一图了解 Sandboard 的能力与原理，以及我们从手绘、照片沙画到纪念赠礼的探索。图中保留真实效果，标明 AI 目标与待验证方向。

[研究说明](projects/001-sandboard/README.md) · [在线体验](https://yydshly.github.io/1008_codex_project/001-sandboard/) · [高清引导图](projects/001-sandboard/assets/understanding/overview.png)

[![Sandboard 完整理解引导图：源库能力、底层原理、输入输出、真实效果、探索历程与产品方向](projects/001-sandboard/assets/understanding/preview.jpg)](projects/001-sandboard/assets/understanding/overview.png)

### 002 · 编程面试知识指南

使用我们2026-10-08生成的完整内容总览图，引导阅读原库能力与知识模块；研究说明进一步解释原理、价值和扩展方向，图中区分原库、本地新增与外部服务。

[研究说明](projects/002-interview-guide/README.md) · [在线体验](https://yydshly.github.io/1008_codex_project/002-interview-guide/) · [高清引导图](projects/002-interview-guide/assets/repository-map.png)

[![编程面试指南完整引导图：三类核心能力、九类五十个主题、学习方式、本地中文增强与外部平台边界](projects/002-interview-guide/assets/repository-map.png)](projects/002-interview-guide/assets/repository-map.png)

### 003 · Pascal 3D 建筑编辑器

沿用2026-10-08生成的1536×1024完整引导图，原始PNG保持一致；2026-10-12整理能力、模块、原理、价值与扩展方向。AI信息图参考真实运行截图，用途与价值属于研究分析。

[研究说明](projects/003-pascal-editor/README.md) · [在线体验](https://yydshly.github.io/1008_codex_project/003-pascal-editor/overview/) · [高清引导图](projects/003-pascal-editor/assets/pascal-summary.png)

[![Pascal 完整引导图：效果与能力、参数化节点及几何更新原理、使用场景、产品价值和验证边界](projects/003-pascal-editor/assets/pascal-summary.png)](projects/003-pascal-editor/assets/pascal-summary.png)

### 013 · AIHOT 信源与资讯引擎研究

沿用2026-10-08生成的完整研究引导图，基于固定提交6e67a9d；2026-10-12整理发布。轻量预览保留完整画面，高清原图逐字节保留。

[研究说明](projects/013-aihot/README.md) · [在线体验](https://yydshly.github.io/1008_codex_project/013-aihot/) · [高清引导图](projects/013-aihot/assets/aihot-overview.png)

[![AIHOT 信源、获取与复用全景图：18个示范信源、六种接入方式、处理原理与可复用能力](projects/013-aihot/assets/aihot-preview.jpg)](projects/013-aihot/assets/aihot-overview.png)

<!-- PROJECT_INDEX:END -->

<details>
<summary>维护仓库：新增项目与目录约定</summary>

## 添加一个研究项目

安装 Node.js 22 或更新版本后，在仓库根目录执行（无需安装依赖）：

```bash
npm run project:add -- --slug repo-name --name "项目名称" --upstream https://github.com/owner/repo --summary "这个项目解决什么问题，为什么值得研究"
```

命令会生成 `projects/001-repo-name/`（后续为 `002-…`、`003-…`），登记项目信息并更新本页索引。随后填写研究文档，把真实截图放入项目的 `assets/`，在 `projects.json` 中设置图片路径、替代文字、图注及已可访问的演示链接。

```bash
npm run index:build  # 修改项目信息后更新首页
npm run check        # 检查编号、目录、链接字段与首页同步情况
```

## 目录导航

```text
.
├── README.md              # 总索引、项目摘要、图片与入口
├── projects.json          # 索引数据：编号、来源、状态、图片和演示
├── projects/
│   └── 001-sandboard/      # 交互沙盘的研究与网页复现
│       ├── README.md       # 项目概览、研究结论与使用方式
│       ├── notes.md        # 阅读笔记、复现过程与问题
│       ├── assets/         # 截图、架构图及图注
│       ├── src/            # 独立实验与改进代码
│       └── web/            # 可选的 Web 演示源码
├── templates/project/     # 新项目模板
├── docs/                  # 研究约定和多 Web 部署说明
└── scripts/               # 添加项目、生成索引和校验
```

- [子项目目录](projects/README.md)
- [研究与编号约定](docs/PROJECT_GUIDE.md)
- [多个 Web 的部署方式](docs/DEPLOYMENT.md)
- [子项目模板](templates/project/README.md)

已上线 [研究总入口](https://yydshly.github.io/1008_codex_project/) 与 [001 · Sandboard 完整平台](https://yydshly.github.io/1008_codex_project/001-sandboard/)，包含原版沙盘、手绘工具、照片创作、作品集与历次试验。其他项目按各自说明研究和独立构建，在线地址仅在实际部署核验后登记。

</details>

## 来源与许可

研究文档应记录原仓库、研究版本或提交及其许可证；引用的代码、截图和其他素材保留来源及许可信息。各上游项目遵循各自的许可证。本仓库暂未为原创内容指定统一的开源许可证。
