# GitHub 项目研究集

用简短摘要、完整引导图和在线效果了解开源项目；详细原理、探索过程与结论见各子项目。

## 项目索引

从索引进入研究说明、源库或在线体验。

<!-- PROJECT_INDEX:START -->

| 序号 | 项目 / 来源 | 研究摘要 | 状态 | 演示 |
| --- | --- | --- | --- | --- |
| 001 | [Sandboard 交互沙盘](projects/001-sandboard/README.md) · [Sandboard](https://github.com/scottstts/Sandboard) | **能力**：WebGPU 沙盘：沟槽、堆积、飞沙。<br>**原理**：高度场、邻域输运与飞沙粒子。<br>**探索**：七工具手绘、照片成画、动作回放。<br>**价值**：触控创作、教学与材料试验。<br>**方向**：纪念赠礼、创作工具、互动展陈。<br>**进度**：原版与旧版保留；真实质感待验证。 | 研究中 | [访问](https://yydshly.github.io/1008_codex_project/001-sandboard/) |
| 002 | [编程面试知识指南](projects/002-interview-guide/README.md) · [guia-entrevistas-de-programacion](https://github.com/DevCaress/guia-entrevistas-de-programacion) | **能力**：面试复习与资源导航：50篇原文、209个资料入口，含11篇教程与39篇导航。<br>**模块**：工程、算法、语言框架、架构、系统设计、数据访问、交付、面试与AI九个方向。<br>**原理**：Astro将校验过的MDX静态出版；本地通过固定快照、主题关联、全文检索和覆盖审计组织知识。<br>**增强**：113节中文讲解、38个示例、100个误区与100条答法；检索筛选、三条路线与完整引导图。<br>**价值**：查漏复习、组织面试表达、对照技术栈，也可作为团队培训和可追溯知识库的起点。<br>**方向**：学习进度、错题与间隔复习、上游差异和外链监测；可选AI问答需提供出处与验证。<br>**边界**：第三方判题、算法动画与AI/MCP仅为资料入口；本站无代码运行、判题或模拟面试服务。 | 已完成 | [访问](https://yydshly.github.io/1008_codex_project/002-interview-guide/) |

### 001 · Sandboard 交互沙盘

一图了解 Sandboard 的能力与原理，以及我们从手绘、照片沙画到纪念赠礼的探索。图中保留真实效果，标明 AI 目标与待验证方向。

[研究说明](projects/001-sandboard/README.md) · [在线体验](https://yydshly.github.io/1008_codex_project/001-sandboard/) · [高清引导图](projects/001-sandboard/assets/understanding/overview.png)

[![Sandboard 完整理解引导图：源库能力、底层原理、输入输出、真实效果、探索历程与产品方向](projects/001-sandboard/assets/understanding/preview.jpg)](projects/001-sandboard/assets/understanding/overview.png)

### 002 · 编程面试知识指南

使用我们2026-10-08生成的完整内容总览图，引导阅读原库能力与知识模块；研究说明进一步解释原理、价值和扩展方向，图中区分原库、本地新增与外部服务。

[研究说明](projects/002-interview-guide/README.md) · [在线体验](https://yydshly.github.io/1008_codex_project/002-interview-guide/) · [高清引导图](projects/002-interview-guide/assets/repository-map.png)

[![编程面试指南完整引导图：三类核心能力、九类五十个主题、学习方式、本地中文增强与外部平台边界](projects/002-interview-guide/assets/repository-map.png)](projects/002-interview-guide/assets/repository-map.png)

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
