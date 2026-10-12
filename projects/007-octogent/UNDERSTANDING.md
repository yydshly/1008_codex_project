# Octogent 完整理解

基线：07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254；研究 2026-10-09，整理 2026-10-12；MIT。

## 完整摘要

### 定位

围绕Claude Code的本地多Agent工作台，将独立CLI会话组织为可观察、可干预的协作；主要管理任务、背景、终端、状态、消息与工作区。

### 能力

持久保存工作背景、从未完成待办启动单项或swarm、查看和控制并行终端、父子协调、DONE/BLOCKED通信、共享或Git worktree隔离，以及历史回看与导出。

### 模块

Tentacle上下文、Deck任务入口、Terminal运行时、Swarm父子协作、Channel通信、Hooks状态、Worktree改动隔离、UI观察复盘八部分；用量、GitHub活动与Code Intel为辅助能力。

### 执行原理

Markdown和复选框提供工作材料，模板生成任务提示词；本地Node API通过node-pty启动shell与CLI，xterm经WebSocket收发终端输入输出；实际工具执行来自Claude Code。

### 协作原理

父协调者按提示词创建worker，子终端保留parentTerminalId；Hooks反馈处理、等待与空闲，Channel在目标空闲时注入文本消息，协调者按约定审查、整合和测试。

### 实现边界

代码保证生命周期、终端关系、投递机制和数量限制；任务拆分、求助、审查与测试主要依赖提示词及人工验收。Tentacle不是权限边界，worktree不是安全沙箱。

### 场景

开源库研究、前端/API/测试协作、模块迁移、文档发布资料同步、多领域维护和Agent学习实验；适合范围清楚、交接明确、成果可检查的工作。

### 业务价值

减少注意力切换与重复补背景，沉淀可复用研究流程，让任务、改动、证据与交付物可回查；可作为个人或团队工作台起点，收益尚未量化。

### 工程价值

理解Agent的目标、上下文、工具循环、状态和成果；参考Claude Code外部CLI/PTY/Hooks接线与多Agent协作代价，学习调用、观察、控制和验收，不能据此解释模型内部推理。

### 复用路线

可先借工作方法，再运行原工作台，或抽取执行与观察接口，最终实现个人库；从一个项目、两个worker、一个审查者的任务—事件—成果—验收闭环开始。

### 扩展方向

稳定任务与依赖、持久化事件消息、恢复重建、成果协议与验收、多Provider、多项目知识复用、权限团队治理、成本质量评测八项，均为待开发建议。

### 验证与许可

固定07cfc4e，根包声明0.1.0，MIT；保留六张作者截图、原始全景图与预设登录协作示例。仅验证研究网页，未验证原应用真实协作；PTY不跨API重启、消息在内存、父终端最多9个子终端、活跃PTY默认32。

## 系统模块

### Tentacle / 文件上下文

职责：给一份工作留下说明书

机制：CONTEXT.md 保存范围、约束、关键文件；todo.md 保存待办；其他 Markdown 保存发现与交接。API 扫描文件，Deck 和 worker 读取同一材料。

产物：可继续更新、可回查的背景和任务文件。

边界：工作说明不会限制操作系统文件权限；上下文是否被正确使用仍需观察。

[实现依据](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/deck/readDeckTentacles.ts)

### Deck / 任务入口

职责：从可见待办启动具体工作

机制：解析 Markdown 复选框；单项生成 worker 提示词，多项生成 swarm-parent 提示词。任务文字、文件路径、终端身份和汇报目标进入模板。

产物：可见待办、启动入口及会话初始提示词。

边界：任务身份依赖列表位置；不是带稳定任务 ID 和完整依赖图的调度器。

[实现依据](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/createApiServer/deckRoutes.ts)

### Terminal / 执行运行时

职责：运行和操作独立 CLI 会话

机制：Node.js 用 node-pty 启动 shell，写入 claude 或支持的 provider 命令与初始提示词；xterm 经 WebSocket 双向传输键盘输入和终端输出。

产物：真实会话、滚动输出、停止和重连入口。

边界：浏览器重载与 API 重启是不同情况；运行中的 PTY 不能跨 API 重启恢复。

[实现依据](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/sessionRuntime.ts)

### Swarm / 父子协作

职责：让协调者分配、指导与整合 worker

机制：父代理提示词包含创建子终端的 CLI 命令；子终端保留 parentTerminalId。worker 读背景、处理单项任务，向父会话汇报 DONE 或 BLOCKED。

产物：父子终端关系、任务分工和完成报告。

边界：父协调者也是模型会话；分工、审查和测试策略主要来自提示词。

[实现依据](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/prompts/swarm-parent.md)

### Channel / 会话通信

职责：将短消息送到目标 Agent

机制：后端按目标终端 ID 排队，在会话空闲时把带发送者身份的消息文本注入 PTY。协调者可发指导，worker 可求助和交接。

产物：DONE、BLOCKED、接口约定和指导消息。

边界：队列在内存中，没有跨重启的持久化投递保证；长期约定应写文件。

[实现依据](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/channelMessaging.ts)

### Hooks / 状态观测

职责：把执行事件转成可读状态

机制：Claude Hooks 回调本地 API，报告启动、提交提示词、工具调用、权限通知和停止；更新 processing、idle、waiting_for_user、waiting_for_permission。

产物：等待状态、活动记录、会话捕获及编辑事件。

边界：状态信号不是业务完成百分比；terminal 文本识别还存在回退路径。

[实现依据](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/hookProcessor.ts)

### Worktree / 文件改动隔离

职责：让并行修改有独立检出目录

机制：shared 使用主目录；worktree 创建 .octogent/worktrees/<workerId>/ 和 octogent/<workerId> 分支。协调提示词要求查看 diff、审查、整合和运行测试。

产物：独立改动与可比较的 Git 差异。

边界：分支并不消除接口冲突，也不是安全沙箱；合并和测试仍需执行与验收。

[实现依据](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/worktreeManager.ts)

### UI / 观察与复盘

职责：让人看见并干预整场协作

机制：React 19、Vite、xterm 与关系画布展示任务、会话和父子关系；辅助视图呈现用量、GitHub 活动、编辑频率、共同编辑和历史导出。

产物：工作台、终端、任务卡、活动视图和会话资料。

边界：Code Intel 表示修改活动，不能直接解释为静态代码依赖；辅助功能需要分别验证。

[实现依据](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/docs/reference/experimental-features.md)

## 执行原理

### 定义任务和背景

人工定义 + 文件机制。人或规划会话写清目标、修改范围、关键文件、接口约定和验收标准，拆成能够独立检查的待办。任务拆分是并行工作的前提。

### 生成提示词并启动会话

代码启动 + 提示词分工。Deck 解析未完成项，把具体任务和上下文路径填入模板。单项启动 worker；swarm 启动父协调会话，由它按命令创建子终端。

### CLI 使用工具并反馈

Claude Code 执行。每个 Claude Code 收到提示词后收集上下文、调用工具、读取结果，再决定下一步或等待人。这个 Agent 循环在 Claude Code 内部；Octogent 提供外部运行与观察。

### 事件与消息推进协作

代码反馈 + 模型回应。终端输出通过 WebSocket 进入 xterm；Hooks 把状态和记录传回 API。Channel 在目标空闲时注入消息，协调者处理 BLOCKED、明确接口或重新安排工作。

### 审查成果并整合验收

提示词约定 + 人工验收。worker 报告 DONE、变更与验证；协调者检查 diff，在 worktree 模式整合分支，运行整体检查、更新文件，再由人确认交付。完成消息不替代实际证据。

## 使用场景

### 你的开源库研究流程

输入：仓库 URL、研究提交、能力与原理问题、交付格式。

分工：源码研究、复现取证、中文表达分别交给 worker；协调者先核对事实，再整合。

产出：研究笔记、固定源码链接、真实截图、网页和引导图。

条件：区分作者截图、预设演示、本地结果和建议；原应用需要实际跑通再登记验证。

### 一项产品功能的协作实现

输入：接口、页面、测试与现有规范。

分工：前后端与测试并行；协调者统一字段、错误格式和交接顺序。

产出：代码改动、测试结果与整体行为演示。

条件：先定义接口契约；高度耦合的文件不要无约束并行修改。

### 模块重构与迁移

输入：目标模块、兼容性和迁移验收要求。

分工：按边界拆改动，worker 各自处理；协调者检查依赖和跨模块行为。

产出：分支差异、迁移说明与回归证据。

条件：独立分支只隔离编辑，不能自动消除语义冲突。

### 文档与发布资料同步

输入：已确认的实现、API 变化和版本计划。

分工：代码、文档、示例和发布说明分别处理，统一检查事实与路径。

产出：更新后的文档、示例和可追溯说明。

条件：实际发版或外部发布仍按明确授权进行；说明必须对应真实版本。

### 多领域维护与问题排查

输入：分别定位到数据库、API、前端等领域的待办。

分工：各 Tentacle 保留领域背景；可同时观察几个会话并介入阻塞。

产出：问题定位、修复、领域笔记与交接。

条件：不是无人值守运维系统；可靠告警、恢复与权限治理需另开发。

### Agent 工程学习实验

输入：一个小项目、两个 worker、一个审查者。

分工：跟踪启动、上下文读取、Hooks、消息与工作区；人为制造一次阻塞并检查恢复路径。

产出：一条可解释的调用链和最小协作原型。

条件：它展示外部集成结构；模型内部推理或 Claude Code 所有实现不能仅凭这个库推断。

## 业务价值

### 减少注意力切换

把“谁在做什么、哪里等你、哪项被阻塞”放在一起，减少找终端、追问状态与反复补背景。是否节省总时间仍需真实任务对照。

### 沉淀可重复的工作流程

将研究需求、范围、证据标准和交接保存在文件中；下一次接手可以读取同一份材料，逐步形成自己的项目研究流程。

### 让成果可检查、可追溯

把待办、消息、修改、验证与交付物联系起来；发现错误时能回查任务如何分配、在哪里卡住、哪些结论没有证据。

### 形成个人工作台的产品起点

可以参考它开发研究助手、编码协作台或团队工具，将精力投入自己的业务规则、验收和体验；团队能力与可靠服务需要补建。

## 工程学习价值

### 理解 Agent 的应用结构

目标、上下文、工具、执行循环、运行状态与成果构成一项应用。工具能做什么、模型选择什么、成果是否通过检查，需要分别理解。

### 理解 Claude Code 的外部集成

从 CLI / PTY、Hooks、记录和权限等待读一条真实接线，知道怎样调用和观察执行。Claude Code 自身是模型与工具之间的执行框架。

### 理解多 Agent 的工程代价

任务拆分、上下文范围、消息协议、接口依赖、并发编辑和整合审查，比增加 worker 数量更关键；提示词约定需要验证机制补强。

### 获得自己的库的参考结构

参考文件上下文、终端生命周期、消息、provider 和工作区接口，抽取适合自己流程的部分；保留来源和许可，逐步做真实实验。

## 复用路线

### 只借用工作方法

先用 CONTEXT、todo 和交接模板组织你现有的单 Agent 工作，不要求立即接入整套界面。适合验证任务定义是否有效。

### 研究并运行原工作台

按固定版本安装和配置 provider、Hooks 与 Git，在小项目跑通真实协作；保存环境、日志、diff、测试与失败记录。

### 抽取运行与观察接口

参考 CLI / PTY 生命周期、事件映射、消息投递和工作区管理，形成自己的适配层；先定义一致的任务和成果协议。

### 实现个人 Agent 库

先完成一个项目、两个 worker、一个审查者：任务→执行→事件→成果→验收；再添加持久化、恢复、多 provider 和多项目 UI。

## 扩展建议

### 稳定任务与依赖模型

给任务稳定 ID、输入输出、依赖和验收标准；避免 Markdown 重排改变任务身份，将并行与串行关系显式化。

推进条件：先验证任务拆分和接口依赖。

### 持久化事件与消息

保存事件、消息和确认记录；明确去重、超时、重试和失败处理，使交接不依赖一条内存消息。

推进条件：定义持久存储和消息投递语义。

### 任务恢复与重建

API 重启后从任务、材料与成果重建执行；区分恢复任务状态、恢复模型会话和原 PTY 进程存活。

推进条件：记录失败和恢复路径，不宣称原进程可跨重启。

### 成果协议与验收门禁

要求报告修改、测试命令、证据路径和未完成项；用自动检查与人工审查判断通过，处理合并和跨模块行为。

推进条件：DONE 不自动等于验收通过。

### 多 Provider 适配

统一启动、事件、消息和成果接口，再适配 Claude、Codex 等 CLI 或 SDK；保留各自权限、记录和事件能力的差异。

推进条件：已有 Codex 启动接线不能证明 Hooks 等价。

### 多项目与知识复用

管理研究模板、版本、证据和交接索引，让多个 GitHub 项目复用同一流程；可接入带出处的知识检索。

推进条件：先解决更新、来源、过时与权限边界。

### 权限、工作区与团队协作

补工具授权、隔离环境、角色权限和多人操作记录，让个人本机工作台逐步适配团队。

推进条件：文件范围和 Git worktree 不能代替安全沙箱。

### 成本与质量评测

记录总交付时间、人工介入、返工、模型消耗和最终达标率，比较单 Agent 与不同编排方式。

推进条件：用同类真实任务评测，不预设并行一定提速或省钱。

## 来源与验证

### 原库事实

源码和文档固定到 07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254；包声明版本 0.1.0；MIT。研究日期为 2026-10-09，本轮整理日期 2026-10-12。

### 界面与引导图

保留六张作者 JPG 原图；现有 3600×10174 PNG 引导图不重绘、不裁切，原始 SHA-256 在构建与发布时核对。作者数字不是我们的性能实测。

### 本地研究实现

中文正文、静态网页、预设登录协作演示与图解由本研究编写。展示页不连接模型，不创建真实 worker，不提供 Octogent API。

### 仍待验证

原应用在当前环境的安装、Hooks、模型调用、消息可靠性和实际合并尚未端到端复现；提速、费用和成果达标率没有测量。

## 引导图
沿用已生成的完整 PNG，不重绘或裁切。
尺寸：3600×10174；SHA-256：a630623ede3b9582791f3965eaeb70023a2cb579fb4e781138c5f378e63bc242

## 来源
- [项目定位与边界](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/README.md)
- [上下文文件](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/docs/concepts/tentacles.md)
- [待办与启动](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/createApiServer/deckRoutes.ts)
- [父协调者提示词](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/prompts/swarm-parent.md)
- [worker 提示词](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/prompts/swarm-worker.md)
- [PTY 运行时](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/sessionRuntime.ts)
- [Hooks 与状态](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/hookProcessor.ts)
- [消息机制](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/channelMessaging.ts)
- [Git 工作区](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/worktreeManager.ts)
- [辅助能力](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/docs/reference/experimental-features.md)
- [会话记录](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/api/src/terminalRuntime/conversations.ts)
- [MIT 许可](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/LICENSE)
