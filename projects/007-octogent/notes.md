# 007 · Octogent：研究与验证记录

[项目概览](README.md) · [原仓库](https://github.com/hesamsheikh/octogent)

## 2026-10-09 · 固定源码研究

- 基线：`07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254`；`git ls-remote` 与本地浅克隆 HEAD 一致。
- 根包声明为 `0.1.0`；上游 MIT 原文已保留。
- 目的：解释这是管理真正工作的 AI 会话的工具，整理能力、效果与底层实现。
- 方法：静态阅读文档、核心运行代码和提示词；未启动原项目或调用真实模型。

| 阅读范围 | 观察结论 |
| --- | --- |
| Tentacle 文档、`deck/readDeckTentacles.ts` | UI 扫描 Markdown；CONTEXT 标题与第一段影响名称和说明；todo 解析复选框 |
| Todo 文档、`createApiServer/deckRoutes.ts` | 单项启动 worker；多项先启动父代理，创建 worker 的命令写入父提示词 |
| `prompts/swarm-parent.md`、`swarm-worker.md` | 协调、求助、审查、测试、合并主要由提示词约束 |
| `terminalRuntime/sessionRuntime.ts`、`constants.ts` | node-pty 启动真实 CLI；支持 claude/codex 启动，默认活跃 PTY 上限 32 |
| `terminalRuntime/hookProcessor.ts` | Hooks 回传提交提示词、工具调用、通知、Stop 和编辑事件 |
| `terminalRuntime/channelMessaging.ts` | 内存 Map 保存队列，空闲时将消息写入目标 PTY；重启后不恢复 |
| `terminalRuntime/worktreeManager.ts` | Git worktree 独立检出与分支；共享模式使用主目录 |
| Experimental 文档与六张作者截图 | 用量、GitHub、Code Intel、对话、提示词与 Monitor 是辅助或实验功能 |

## 2026-10-09 · 原创中文网页

目的：先看到真实界面，再通过具体场景理解分工和协调。

- 环境：Windows / PowerShell，Node.js `v22.15.0`。
- 技术：原生 HTML / CSS / ES modules，仅用 Node 内置模块构建与预览。
- 素材：六张作者截图和原 favicon，原样复制，来源记录在 assets/README.md。
- 原创示例：登录接口、前端页面、测试三个 worker，六个预设阶段；工作区切换只改变示例说明。
- 实现：截图标签与原图对话框；步骤、播放、暂停、重置；代理选择；工作区对比；能力展开；机制切换。
- 范围：不连接模型、不创建真实终端、不操作 Git，没有实际执行示例中的测试。

执行命令：

```powershell
npm.cmd run project:add -- --slug octogent --name "Octogent 多智能体工作台研究" --upstream "https://github.com/hesamsheikh/octogent" --summary "用上游真实截图和交互流程讲清 Claude Code 多代理工作台的能力、任务分配、上下文、通信与 Git 隔离。"
cd projects/007-octogent/web
npm.cmd install --package-lock-only --ignore-scripts
node --check app.js
node --check content.js
npm.cmd run dev
```

## 浏览器观察

- 完整子路径返回 HTTP 200；桌面与 390×844 手机视口打开网页。
- 六个截图标签切换更新画面、说明和源码链接；原图对话框打开、关闭正常。
- 阻塞阶段选前端 worker，显示 BLOCKED 记录及协调者确认 accessToken 的消息。
- shared 模式显示主目录；worktree 模式显示独立目录和分支。
- 审查整合显示 3/3，下一步禁用；重置显示 0/3，上一步禁用。
- 自动播放从汇报完成进入审查整合，结束按钮为“重新播放”；播放后可立即暂停。
- 第一次等待自动播放控件变化的工具调用超时，随后读取页面确认已正确推进且没有浏览器报错；未把工具超时推断为页面失败。
- 能力展开显示机制和边界；底层标签切换正确显示 Hooks / 内存队列说明。
- 桌面 document scrollWidth 与 clientWidth 同为 1265；手机有效宽度同为 375，没有页面整体横向溢出；手机的长标签列表在各自容器内横向滚动。
- 页面图片加载完整，所有内部锚点都有对应元素。

## 修正与证据边界

- 首版截图固有高度使窄容器中的图像拉长；发现后加入 height:auto，恢复原图比例。
- 手机标题合并两行导致词语拆开；改为保留三行结构。
- 图中的用量和时间属于作者环境，不是本地性能数据。
- Codex 源码接线存在，尚未验证等价协作能力。
- 未对原应用执行安装或真实代理测试。展示页验证不能证明原应用的任务可靠性。

独立生产构建、资源和根索引检查的最终结果见 [src/verification.json](src/verification.json)。

## 2026-10-09 · 一张图整理能力、原理与个人价值

- 新增 3600×10174 高清 PNG、可编辑 SVG、缩小预览、文字版与六章坐标；使用 Pillow 12.3.0、微软雅黑字体，并等比嵌入六张上游原图。
- 全图分别说明核心能力、UI / API / CLI 执行链与终端 / Hooks 反馈链、文件上下文、父子协作、shared / worktree、状态事件、开源研究设想、业务与工程价值、个人库路线及当前实现边界。
- 图例将代码实现、提示词约定、人工验收与扩展建议分开；Claude Code 自身的 Agent 循环标为概念示意，参照官方文档，不声称由 Octogent 实现。
- 初次增加 Hooks 卡片后，制图脚本报告文字高度超出 17 像素；增大两张同排卡片与行间距后重建成功，36 个正文卡片检查通过。
- 原预览进程已结束；本轮重新启动生产预览，并检查完整部署子路径。
- 阅读页可缩放、适应宽度、选择章节、下载 PNG / SVG 与查看文字版；桌面和手机未发生页面整体横向溢出，控制台无错误或警告。
- 校验 PNG 尺寸、SVG XML 和六个嵌入截图；运行 JavaScript 语法检查、独立构建及根 `npm run check`。
- 证据截图为 `assets/map-reader-desktop.jpg`、`assets/map-reader-mobile.jpg`；未执行原 Octogent 的真实 Agent 工作流。

## 2026-10-12 · 完整理解、原图与网页发布

- 使用独立工作区整理本项目，仅接入 007 和必要索引、统一构建、CI 与部署说明，保留其他尚未提交的研究项目。
- 扩展为 12 项摘要、6 段图前介绍、8 个模块、5 步执行与反馈、6 类场景、业务与学习各 4 项价值、4 条复用路线及 8 项待开发方向。
- 将核心正文与原有能力说明写入静态 HTML；根 `projects.json` 的摘要在研究网页、README 和总入口复用；输出完整中文 Markdown 和 JSON。
- 沿用 3600×10174 引导图，SHA-256 为 `a630623ede3b9582791f3965eaeb70023a2cb579fb4e781138c5f378e63bc242`；不重绘、裁切或改写原 PNG 字节。
- 本地预览服务最初没有 `.mjs` 的 JavaScript MIME，导致新增模块不能运行；补充映射并重启后，六个截图标签与流程初始化正常，控制台无错误。
- 统一发布完整复制 007 产物；既有七个项目与稳定路径继续保留。静态网页部署不启动原应用 API、PTY、模型或 worker。
- 本地独立审计、根索引与 15 项工具测试通过；统一打包和公开访问、浏览器证据另记到发布核验记录。

- 发布提交 `49d4d01` 已推送远端 main；Pages 运行 `38228913914` 构建和部署成功，索引运行 `38228913821` 成功。
- 27个公开页面/资源、六张截图字节、完整引导图哈希、总入口完整摘要和既有七个入口均通过HTTPS检查；正式入口已在核验后登记。
- 线上浏览器摘要展开、模块深链接刷新、全景图章节与真实PNG下载通过；390/320手机布局无整体横向溢出，控制台无错误或警告。
- `src/publication-verification.json`、`public-http-checks.json`、`public-browser-checks.json` 记录首次发布和证据；收尾提交另登记正式链接和资料。
