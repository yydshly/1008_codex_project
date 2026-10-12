# 007 · Octogent 多智能体工作台研究

用完整中文网页、已有全景图、六张上游真实截图和预设协作示例，理解 Octogent 的能力、模块、执行与协作原理、业务和工程价值，以及适配个人 Agent 库的复用和扩展路线。

[返回总索引](../../README.md) · [原仓库](https://github.com/hesamsheikh/octogent) · [完整理解正文](UNDERSTANDING.md) · [研究笔记](notes.md)

## 研究基线

| 项目 | 内容 |
| --- | --- |
| 原仓库 | https://github.com/hesamsheikh/octogent |
| 完整 Commit | `07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254` |
| 上游包版本 | 根 `package.json` 为 `0.1.0`；这是包声明版本，不是已验证的发布标签 |
| 研究日期 | 2026-10-09 |
| 整理与发布日期 | 2026-10-12 |
| 上游许可 | MIT；原文保存在 [src/LICENSE.upstream](src/LICENSE.upstream) |
| 状态 | 已完成本轮源码研究与中文整理；原应用真实代理工作流尚未本地复现 |
| 本地入口 | http://127.0.0.1:4193/1008_codex_project/007-octogent/ |
| 在线发布 | 尚未发布，根索引 `demo` 保持为空 |

## 网页内容

完整理解已扩展为 **12 项摘要、6 段图前介绍、8 个系统模块、5 步执行与反馈、6 类场景、4 项业务价值、4 项工程学习价值、4 条复用路线和 8 项扩展建议**。核心正文与原有能力说明在构建时进入 HTML，关闭脚本仍可阅读；交互用于截图浏览、任务预设播放、机制标签和一图缩放。摘要和图前介绍来自根 `projects.json`，网页、总入口与 README 索引共用同一内容。

新增 [理解全景图](assets/octogent-understanding-map.png)，提供 [可缩放阅读页](http://127.0.0.1:4193/1008_codex_project/007-octogent/map.html)、[SVG 源文件](assets/octogent-understanding-map.svg)和[文字版](assets/octogent-understanding-map-content.md)。一张图覆盖能力、执行链与反馈链、开源研究场景、业务与工程价值、个人 Agent 库扩展建议及证据边界，嵌入六张上游真实截图。

1. **真实效果**：六张作者截图展示代理关系画布、并行终端、任务工作台、用量与 GitHub 活动、文件修改活动、会话记录；可切换、放大和用键盘浏览。
2. **协作演示**：以“给网站增加登录功能”为例，观察后台、前端、测试三个 worker 的分工、BLOCKED 求助、DONE 汇报和审查整合；支持逐步查看、自动播放、暂停、重置及代理切换。
3. **工作区对比**：切换 shared / worktree，查看工作目录、分支和结果整合方式的变化。
4. **能力整理**：六项核心能力，分别说明用途、具体例子、实现方式和边界；辅助与实验能力单独说明。
5. **底层原理**：五层可切换说明，连接 Markdown 背景、提示词分配、真实终端、Hooks 与消息、Git 隔离及整合。
6. **适用范围与来源**：解释任务耦合、记录持久化、进程生命周期、通信队列、并行上限和 Claude / Codex 支持现状；来源链接固定到完整提交。

网页是本项目原创的讲解与效果展示。协作示例使用预设状态和消息，不连接模型、不创建真实终端、不修改用户代码。真实界面图片来自作者仓库，图中的使用量、会话内容和时间属于作者当时环境。

## 本地运行

Node.js 22+；网页使用原生 HTML、CSS 和 JavaScript，无第三方构建或运行依赖。

```powershell
cd F:\codex_project\1008_codex_project\projects\007-octogent\web
npm.cmd ci
npm.cmd run build
npm.cmd run check
npm.cmd run preview
```

打开 [中文研究页](http://127.0.0.1:4193/1008_codex_project/007-octogent/)。产物为 `web/dist/`，完整部署子路径是 `/1008_codex_project/007-octogent/`。

开发预览使用 `npm.cmd run dev`，默认同一个端口，请先停止已启动的预览进程。全部图片、样式与脚本使用相对路径；预览服务只监听本机 `127.0.0.1`。

构建包含 HTML、脚本、样式、完整 `assets/`、研究文档、笔记、`publication.json`、`understanding.md` 和 `LICENSE.upstream.txt`。统一发布完整复制 `dist/` 到 `.cache/pages-site/007-octogent/`；接入已有 GitHub Pages Actions，不部署原应用 API、PTY 或模型。说明见 [部署指南](../../docs/DEPLOYMENT.md)。

## 能力与实现结论

Octogent 是带可视化界面的本地多代理编排工作台，主要围绕 Claude Code。Claude Code 执行读代码、修改文件和工具调用；Octogent 管理工作背景、任务、终端、消息和工作区。

| 关键能力 | 实现依据 |
| --- | --- |
| 保存工作背景 | `.octogent/tentacles/<id>/CONTEXT.md`、`todo.md` 和额外 Markdown 笔记 |
| 从待办分配工作 | 解析复选框，向 worker / parent 提示词传入任务与上下文路径 |
| 可见的代理会话 | node-pty 启动 shell 与 CLI；xterm 经 WebSocket 与终端双向连接 |
| 父子协调 | 子终端保存 `parentTerminalId`；协调者按提示词创建、监督和整合 worker |
| 状态与通信 | Claude Hooks 回调本地 API；Channel 队列在目标空闲时注入文本 |
| 工作区隔离 | Git worktree 与独立分支；审查、合并和测试依赖协调者或人 |

需要保留的事实边界：

- Tentacle 保存工作说明，不构成文件访问权限限制；shared 模式会共享文件。
- 父协调者也是模型会话，审查、测试与合并主要是提示词约定。
- 元数据和记录能保存，活跃 PTY 不跨 API 重启恢复。
- Channel 队列在内存中；长期交接应写文件。
- 每个父终端最多 9 个子终端，活跃 PTY 默认上限 32。
- 源码有 Codex 启动与用量接线；当前文档和完整协作说明以 Claude Code 为主。
- Code Intel 连线表达会话中的共同编辑，不应直接解释为代码静态依赖。

## 验证与改动范围

本轮验证本项目的静态网页、资源和交互，命令及观察见 [notes.md](notes.md) 与 [src/verification.json](src/verification.json)。未运行原 Octogent 的真实多代理工作流，没有测量任务完成率、成本、速度或真实合并成功率。

2026-10-12 发布准备的命令、完整性和浏览器记录见 [src/local-publication-verification.json](src/local-publication-verification.json)。公开部署记录在首次线上核验后补充。

- `web/`：原创 HTML / CSS / JavaScript、内容数据、独立构建与本机预览脚本。
- `assets/preview_1.jpg` 至 `preview_6.jpg`、`octopus-favicon.svg`：上游原文件，无修改。
- `assets/cover.jpg`、`workflow.jpg`、`mobile.jpg`：本研究网页的真实浏览器截图。
- `src/LICENSE.upstream`：保留上游 MIT 许可。
- `src/render_understanding_map.py` 与 `assets/octogent-understanding-map*`：原创全景图、图源、文字与布局数据；截图来源与许可保持不变。
- 上游代码没有被修改，也没有作为本网页的代理运行后端。

## 来源与许可

上游作者 / 仓库：**hesamsheikh/octogent**。素材路径见 [assets/README.md](assets/README.md)，固定到研究提交并保留 [上游 MIT 原文](src/LICENSE.upstream)。中文解说、协作示例和展示代码是独立研究内容，不改变上游许可条件。

下一步可在独立实验目录运行原应用，验证 Claude 登录、Hooks 回调、消息投递、worktree 创建和真实 worker 的审查整合。

## 业务与工程价值，以及复用入口

业务价值是减少终端切换和重复补背景，让任务、交接、改动与成果可检查；可以参考它形成你的开源研究流程或个人工作台。工程价值是观察 Agent 怎样被启动、读上下文、使用工具、回报事件、处理消息和并行编辑，学习外部调用、观察与控制。Claude Code 自身的 Agent 循环与模型内部推理不由 Octogent 实现，仍需另外研究。

可从文件工作法、运行原工作台、抽取执行观察接口或自建个人库四条路线切入。建议先做一个项目、两个 worker、一个审查者的任务—事件—成果—验收闭环，再逐步建立稳定任务与依赖、事件消息持久化、恢复重建、验收门禁、多 Provider、多项目知识复用、权限团队治理和成本质量评测。上述八个方向是待开发建议，没有被描述为原库已交付功能。

判断是否有价值，需要比较真实任务的总交付时间、人工介入、返工、模型消耗和成果达标率；本次没有量化这些收益。

## 全景图重新生成

原图已经生成，发布与 CI 不重新制图，只核对 SHA-256：`a630623ede3b9582791f3965eaeb70023a2cb579fb4e781138c5f378e63bc242`。不裁切、不重绘、不改写原始 PNG 字节。若将来明确需要改图，可使用 Python、Pillow 与 Windows 微软雅黑字体运行 `python src/render_understanding_map.py`，然后记录新的图源和哈希；首次制图使用 Pillow 12.3.0，脚本检查正文卡片文字高度。
