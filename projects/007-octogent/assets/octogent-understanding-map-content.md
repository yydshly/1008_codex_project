# Octogent 中文全景图文字版

研究基线：07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254；2026-10-09；MIT。

OCTOGENT / 能力 · 原理 · 使用设想 · 个人价值

把多个 Claude Code，组织成可见的协作系统

Claude Code 执行读代码、改文件和工具调用；Octogent 管理任务、上下文、终端、消息、状态与 Git 工作区。

核心对象是独立的 CLI 会话。可以从任务启动、看见进展、发送指导、处理阻塞并审查结果。

01

能力是什么？从真实界面看它管理哪些东西

下面六张均为上游作者截图；它们展示产品效果，不代表我们已在本机跑通真实多 Agent 工作。

关系画布：看分工与父子关系

工作领域、协调者与 worker 放在一张画布中；可识别等待权限的会话。

并行终端：看操作并直接干预

每个 worker 是可见的 Claude Code 终端；可查看输出、输入指导并处理授权。

任务工作台：从待办启动工作

Tentacle 保存背景与任务；Deck 展示复选框、Spawn 入口与背景文件。

1. 给工作保存可读背景

CONTEXT.md + todo.md + 交接笔记。让新会话读取同一份说明，减少反复口头补背景。
文件是工作记忆；不限制文件访问权限。

2. 将未完成待办分配给代理

解析 Markdown 复选框；单项生成 worker 提示词，多项启动 swarm 协调会话。
任务文本是执行入口；不是自动依赖调度。

3. 管理真实终端的生命周期

启动、连接、停止 CLI 会话；浏览器与 PTY 双向传输，让人直接操作每个 worker。
独立 CLI 进程；区别于隐藏的原生子代理。

4. 协调者与 worker 交换消息

保留父终端 ID；发送 DONE、BLOCKED、指导和交接；目标空闲时再注入终端。
投递机制由代码实现；沟通内容由 Agent 决定。

5. 将状态与历史变得可观察

Hooks 回报处理、空闲、等待用户和等待权限；保存会话记录并可导出。
界面中的忙碌状态，不等于任务验收通过。

6. 支持共享或隔离的工作区

shared 共用主目录；worktree 为 worker 提供独立检出目录和分支，便于审查整合。
Git 隔离文件改动；不是安全沙箱。

辅助
视图

辅助 / 用量与 GitHub 活动

观察消耗和提交趋势；没有经过验证的提速或省钱结论。

辅助
视图

辅助 / Code Intel 修改活动

汇总编辑频率与共同编辑；连线不等于静态代码依赖。

辅助
视图

辅助 / 会话回看与导出

追溯任务、对话与交接；保存历史不等于恢复运行进程。

02

底层原理是什么？一条执行链 + 两条反馈链

外层组织协作，内层 CLI 执行任务。编排代码、模型行为与人类验收分别承担不同职责。

浏览器 UI

React + xterm + 关系画布
展示任务、终端、状态与历史
接收点击、键盘输入和人工干预

本地 API / 运行时

Node.js + HTTP + WebSocket
node-pty 启动 shell 与 CLI
管理终端记录、消息及 Git 工作区

Claude Code 独立会话

收到提示词 → 读取上下文
模型决定下一步 → 调用工具
工具返回 → 继续工作或等待人

输出反馈链：CLI / PTY 输出 → WebSocket → xterm，保留真实终端交互。

事件反馈链：Claude Hooks → 本地 API → 状态 / 会话 / 编辑记录 → UI；空闲事件同时触发消息投递。

工作材料：Markdown 是共享说明书

.octogent/tentacles/<id>/
CONTEXT.md：范围、约束、关键文件
todo.md：- [ ] 未完成 / - [x] 已标记
额外笔记：证据、接口约定、交接
Deck 与 Agent 读取这些文件；完成勾选仍需检查成果。

协作过程：协调者也是模型会话

父协调者按提示词创建多个 worker，分配范围。
worker 读取材料，完成工作后汇报 DONE；遇阻汇报 BLOCKED。
Channel 将短消息排队，并在目标空闲时粘贴到终端。
父协调者按约定审查、整合和测试；不是可靠的确定性调度器。

工作区：shared 与 worktree 的差别

shared：worker 共用项目主目录，需避免重叠编辑。
worktree：.octogent/worktrees/<workerId>/
独立分支：octogent/<workerId>
提示词约定：worker 提交 → 父协调者查看 diff → 审查 / 合并 → 测试；关键结果仍需验收。

事件：Hooks 将执行状态传回界面

SessionStart / UserPromptSubmit → processing
Notification → 等待权限或 idle
PreToolUse → 工具 / 等待用户；Stop → idle
Edit / Write 事件 → 编辑活动记录
状态是观察信号；它没有直接给出可靠的业务完成百分比。

代码提供机制

创建 PTY / 终端记录、解析待办、维护父子关系、转发输入输出、接收 Hooks、排队投递消息、建立 worktree。

提示词表达策略

先读哪些文件、怎样拆分范围、什么时候求助、如何汇报、审查和测试。Agent 可能遗漏；需要结果证据。

人决定是否可交付

确认需求与边界、处理权限、查看 diff 和运行证据、确认整体行为、决定接受结果或继续修正。

它能帮你理解：Agent 如何被调用、如何获得上下文、如何使用工具、如何协作与被观察。

模型推理与 Claude Code 自身的工具选择逻辑在内层；本图中的“工具 → 反馈 → 下一步”是概念示意，Octogent 没有重写这个循环。

03

主要使用设想：把你的“开源库研究”组织成一次可验收协作

以下是适配你当前研究总仓库的设想。流程能参考原库实现；任务、证据标准与验收制度需要我们自己设计。

输入：一个 GitHub 仓库 + 明确研究提交 + 你的问题 + 最终交付格式

先写 CONTEXT：能力 / 原理 / 边界 / 许可；再写 todo：源码研究、复现取证、中文网页与全景图。

Worker A / 能力与源码

找实现入口，追踪调用链。
输出：能力表、关键源码链接、原理图、限制与未证实项。
要求：结论固定到提交，有证据可回查。

Worker B / 复现与证据

安装原应用，跑一项最小真实任务。
输出：环境、命令、截图、日志、失败与恢复记录。
要求：区分真实结果、模拟示例与作者截图。

Worker C / 中文表达与网页

按已确认事实整理讲解与效果。
输出：研究网页、全景图、来源和许可说明。
要求：截图与文案一致，部署子路径可访问。

协调者 / 审查者：统一事实、处理 BLOCKED、检查许可、整合网页、运行检查，再由你验收。

交付：可访问网页 + 一张全景图 + 固定版本研究笔记 + 可重复执行的验证记录。
依赖关系：先确认事实，再完成表达；相互独立的取证可以并行。

还适合：前端 / API / 测试分工；模块重构；功能实现与文档更新；跨领域维护。价值取决于任务能否拆分、结果能否检查。

04

对你的价值：业务交付更有序，工程理解更具体

下面是可以争取的价值，不是已测得的收益。是否值得长期使用，应通过你的真实任务比较。

业务 / 产品方向

减少注意力切换

知道谁在做什么、哪里等待你、谁被阻塞；减少来回找终端、追问状态与重新解释背景。

形成可重复的研究流程

把需求、范围、证据标准和交接文件固定下来，让下一次库研究复用同一套工作材料。

提高过程的可检查性

将任务、消息、改动、运行证据与交付物对应起来；遇到错误能追溯并修正。

让个人工作台成为产品基础

未来可以形成研究助手、开发协作台或团队工具；需要补权限、可靠性、协作与业务验收。

底层原理 / 工程方向

理解 Agent 的应用结构

观察“目标 + 上下文 + 工具 + 循环 + 状态 + 成果”；看见代理并不是一个能自动可靠交付的黑盒。

理解 Claude Code 的外部接口

读 CLI / PTY 启动、Hooks 事件、会话记录和权限等待的接线；逐步建立执行与观测的区别。

理解多 Agent 的真实代价

研究如何拆任务、减少上下文污染、共享约定、处理依赖、避免并发改动冲突并审查结果。

获得个人库的实现参照

参考任务文件、终端运行时、消息协议、provider 接线、工作区与 UI；按自己的工作流程取舍。

真正的学习抓手：读一条调用链，跑一个真实任务，记录一次阻塞，再自己实现一个最小闭环。

有漂亮界面只是起点。真正掌握应用，需要理解状态来源、失败路径、验证方法和代码保证了什么。

05

后期可扩展价值：参考它，做适合自己的 Agent 协作库

紫色内容是建议方向。原库已有基础接线；下列稳定协议、可靠恢复、验收门禁等不能当成原库现成能力。

任务 / 上下文

范围、约束
输入与验收标准

Provider 适配

Claude / Codex
统一执行与事件

运行时

会话、生命周期
消息与工作区

Workflow

依赖、重试
审查与人工介入

证据 / 成果

日志、diff、测试
图文与可交付物

可选 UI

任务、状态
干预与历史回看

可靠性：从能运行到可恢复

给任务稳定 ID，保存事件与消息；明确确认、超时、重试与去重；API 重启后重建任务状态，而不是宣称恢复原 PTY。

验收：从 DONE 到可验证成果

要求返回修改、测试命令、证据路径与未完成项；用自动检查和人工审查判断通过；处理接口依赖与合并冲突。

适配：让核心服务于你的流程

先定义统一任务、事件与成果协议，再接 Claude / Codex；观察每个 provider 的真实能力差异，不假设 Hooks 等价。

建议路线：先做一个项目、两个 worker、一个审查者的最小闭环

第一步：任务文件 → 运行会话 → 状态事件 → 成果 → 验收。第二步：持久化、恢复、重试与多工作区。
第三步：多 Provider、多项目、权限与成本管理；界面随实际使用逐步扩展。

判断是否有价值：总交付时间、人工介入次数、返工量、模型消耗，以及最终结果是否达标。

06

理解边界：哪些成立，哪些必须再验证

研究结论固定到下面的上游提交。本项目已做静态网页与源码研究；尚未验证原应用的真实多代理任务。

主要围绕 Claude Code

文档、Hooks 与协作提示词以 Claude 为主。源码有 Codex 的启动 / 用量接线；尚不能据此证明同等完整协作能力。

执行不保证智能交付

模型决定工作步骤；审查、测试与合并多为提示词约定。没有证据时，DONE 或复选框不能证明任务完成。

文件范围不是权限边界

Tentacle 说明工作范围；worktree 隔离检出目录。它们不能代替操作系统沙箱或对工具权限的控制。

记录保留，进程不能跨重启

文件、元数据与会话可保存。PTY 不跨 API 重启恢复；Channel 队列在内存中，重启可能丢失未投递消息。

并行规模与协作有代价

每父终端最多 9 个子终端；活跃 PTY 默认上限 32，可配置。越多 worker，越需要控制资源、通信和冲突。

使用收益需要你自己测

作者截图只能展示界面效果。原库本地兼容性、实际完成率、成本与速度，还需用你的任务和环境验证。

一句话整理我们的理解

当下：一个围绕 Claude Code 的多 Agent 工作台。学习：一份“调用、观察、协作、控制”的应用样本。

未来：从中抽取适合自己的任务、运行时、协作与验收机制，逐步实现个人 Agent 库；扩展价值来自你的工作流程。

来源 / hesamsheikh/octogent · MIT · 研究日期 2026-10-09

固定提交 / 07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254    上游 / github.com/hesamsheikh/octogent

实现依据 / README；deckRoutes / readDeckTentacles；sessionRuntime；hookProcessor；channelMessaging；worktreeManager；协作提示词与相关文档。

素材 / static/images/preview_1.jpg 至 preview_6.jpg，作者原图等比嵌入；数字属于作者环境。中文解说、结构与扩展建议为本研究原创。

## 可回查的来源

- [定位、执行、隔离与持久化](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/README.md)
- [任务上下文](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/docs/concepts/tentacles.md)
- [待办与启动入口](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/createApiServer/deckRoutes.ts)
- [读取背景文件](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/deck/readDeckTentacles.ts)
- [协调者的提示词约定](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/prompts/swarm-parent.md)
- [worker 的提示词约定](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/prompts/swarm-worker.md)
- [PTY 会话运行时](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/sessionRuntime.ts)
- [Hooks 与状态](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/hookProcessor.ts)
- [内存消息队列与终端投递](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/channelMessaging.ts)
- [Git 工作区](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/worktreeManager.ts)
- [辅助与实验能力](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/docs/reference/experimental-features.md)
- [Claude Code 的 Agent 循环（官方概念说明）](https://code.claude.com/docs/en/how-claude-code-works)

业务价值、开源研究流程与个人库路线属于本研究建议，不是原库已经实现或经实测证实的功能。
