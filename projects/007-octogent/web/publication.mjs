// 原创中文研究；原库事实固定到 07cfc4e，业务价值和扩展均标为研究建议。
export const publicationMeta = {
  commit: '07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254',
  researchDate: '2026-10-09', publicationDate: '2026-10-12',
  upstream: 'https://github.com/hesamsheikh/octogent', license: 'MIT',
  guide: { file: 'assets/octogent-understanding-map.png', width: 3600, height: 10174,
    sha256: 'a630623ede3b9582791f3965eaeb70023a2cb579fb4e781138c5f378e63bc242' },
};
export const modules = [
  { name: 'Tentacle / 文件上下文', role: '给一份工作留下说明书', mechanism: 'CONTEXT.md 保存范围、约束、关键文件；todo.md 保存待办；其他 Markdown 保存发现与交接。API 扫描文件，Deck 和 worker 读取同一材料。', output: '可继续更新、可回查的背景和任务文件。', boundary: '工作说明不会限制操作系统文件权限；上下文是否被正确使用仍需观察。', file: 'apps/api/src/deck/readDeckTentacles.ts' },
  { name: 'Deck / 任务入口', role: '从可见待办启动具体工作', mechanism: '解析 Markdown 复选框；单项生成 worker 提示词，多项生成 swarm-parent 提示词。任务文字、文件路径、终端身份和汇报目标进入模板。', output: '可见待办、启动入口及会话初始提示词。', boundary: '任务身份依赖列表位置；不是带稳定任务 ID 和完整依赖图的调度器。', file: 'apps/api/src/createApiServer/deckRoutes.ts' },
  { name: 'Terminal / 执行运行时', role: '运行和操作独立 CLI 会话', mechanism: 'Node.js 用 node-pty 启动 shell，写入 claude 或支持的 provider 命令与初始提示词；xterm 经 WebSocket 双向传输键盘输入和终端输出。', output: '真实会话、滚动输出、停止和重连入口。', boundary: '浏览器重载与 API 重启是不同情况；运行中的 PTY 不能跨 API 重启恢复。', file: 'apps/api/src/terminalRuntime/sessionRuntime.ts' },
  { name: 'Swarm / 父子协作', role: '让协调者分配、指导与整合 worker', mechanism: '父代理提示词包含创建子终端的 CLI 命令；子终端保留 parentTerminalId。worker 读背景、处理单项任务，向父会话汇报 DONE 或 BLOCKED。', output: '父子终端关系、任务分工和完成报告。', boundary: '父协调者也是模型会话；分工、审查和测试策略主要来自提示词。', file: 'prompts/swarm-parent.md' },
  { name: 'Channel / 会话通信', role: '将短消息送到目标 Agent', mechanism: '后端按目标终端 ID 排队，在会话空闲时把带发送者身份的消息文本注入 PTY。协调者可发指导，worker 可求助和交接。', output: 'DONE、BLOCKED、接口约定和指导消息。', boundary: '队列在内存中，没有跨重启的持久化投递保证；长期约定应写文件。', file: 'apps/api/src/terminalRuntime/channelMessaging.ts' },
  { name: 'Hooks / 状态观测', role: '把执行事件转成可读状态', mechanism: 'Claude Hooks 回调本地 API，报告启动、提交提示词、工具调用、权限通知和停止；更新 processing、idle、waiting_for_user、waiting_for_permission。', output: '等待状态、活动记录、会话捕获及编辑事件。', boundary: '状态信号不是业务完成百分比；terminal 文本识别还存在回退路径。', file: 'apps/api/src/terminalRuntime/hookProcessor.ts' },
  { name: 'Worktree / 文件改动隔离', role: '让并行修改有独立检出目录', mechanism: 'shared 使用主目录；worktree 创建 .octogent/worktrees/<workerId>/ 和 octogent/<workerId> 分支。协调提示词要求查看 diff、审查、整合和运行测试。', output: '独立改动与可比较的 Git 差异。', boundary: '分支并不消除接口冲突，也不是安全沙箱；合并和测试仍需执行与验收。', file: 'apps/api/src/terminalRuntime/worktreeManager.ts' },
  { name: 'UI / 观察与复盘', role: '让人看见并干预整场协作', mechanism: 'React 19、Vite、xterm 与关系画布展示任务、会话和父子关系；辅助视图呈现用量、GitHub 活动、编辑频率、共同编辑和历史导出。', output: '工作台、终端、任务卡、活动视图和会话资料。', boundary: 'Code Intel 表示修改活动，不能直接解释为静态代码依赖；辅助功能需要分别验证。', file: 'docs/reference/experimental-features.md' },
];
export const pipeline = [
  { title: '定义任务和背景', text: '人或规划会话写清目标、修改范围、关键文件、接口约定和验收标准，拆成能够独立检查的待办。任务拆分是并行工作的前提。', kind: '人工定义 + 文件机制' },
  { title: '生成提示词并启动会话', text: 'Deck 解析未完成项，把具体任务和上下文路径填入模板。单项启动 worker；swarm 启动父协调会话，由它按命令创建子终端。', kind: '代码启动 + 提示词分工' },
  { title: 'CLI 使用工具并反馈', text: '每个 Claude Code 收到提示词后收集上下文、调用工具、读取结果，再决定下一步或等待人。这个 Agent 循环在 Claude Code 内部；Octogent 提供外部运行与观察。', kind: 'Claude Code 执行' },
  { title: '事件与消息推进协作', text: '终端输出通过 WebSocket 进入 xterm；Hooks 把状态和记录传回 API。Channel 在目标空闲时注入消息，协调者处理 BLOCKED、明确接口或重新安排工作。', kind: '代码反馈 + 模型回应' },
  { title: '审查成果并整合验收', text: 'worker 报告 DONE、变更与验证；协调者检查 diff，在 worktree 模式整合分支，运行整体检查、更新文件，再由人确认交付。完成消息不替代实际证据。', kind: '提示词约定 + 人工验收' },
];
export const scenarios = [
  { title: '你的开源库研究流程', input: '仓库 URL、研究提交、能力与原理问题、交付格式。', work: '源码研究、复现取证、中文表达分别交给 worker；协调者先核对事实，再整合。', output: '研究笔记、固定源码链接、真实截图、网页和引导图。', condition: '区分作者截图、预设演示、本地结果和建议；原应用需要实际跑通再登记验证。' },
  { title: '一项产品功能的协作实现', input: '接口、页面、测试与现有规范。', work: '前后端与测试并行；协调者统一字段、错误格式和交接顺序。', output: '代码改动、测试结果与整体行为演示。', condition: '先定义接口契约；高度耦合的文件不要无约束并行修改。' },
  { title: '模块重构与迁移', input: '目标模块、兼容性和迁移验收要求。', work: '按边界拆改动，worker 各自处理；协调者检查依赖和跨模块行为。', output: '分支差异、迁移说明与回归证据。', condition: '独立分支只隔离编辑，不能自动消除语义冲突。' },
  { title: '文档与发布资料同步', input: '已确认的实现、API 变化和版本计划。', work: '代码、文档、示例和发布说明分别处理，统一检查事实与路径。', output: '更新后的文档、示例和可追溯说明。', condition: '实际发版或外部发布仍按明确授权进行；说明必须对应真实版本。' },
  { title: '多领域维护与问题排查', input: '分别定位到数据库、API、前端等领域的待办。', work: '各 Tentacle 保留领域背景；可同时观察几个会话并介入阻塞。', output: '问题定位、修复、领域笔记与交接。', condition: '不是无人值守运维系统；可靠告警、恢复与权限治理需另开发。' },
  { title: 'Agent 工程学习实验', input: '一个小项目、两个 worker、一个审查者。', work: '跟踪启动、上下文读取、Hooks、消息与工作区；人为制造一次阻塞并检查恢复路径。', output: '一条可解释的调用链和最小协作原型。', condition: '它展示外部集成结构；模型内部推理或 Claude Code 所有实现不能仅凭这个库推断。' },
];
export const businessValues = [
  { title: '减少注意力切换', text: '把“谁在做什么、哪里等你、哪项被阻塞”放在一起，减少找终端、追问状态与反复补背景。是否节省总时间仍需真实任务对照。' },
  { title: '沉淀可重复的工作流程', text: '将研究需求、范围、证据标准和交接保存在文件中；下一次接手可以读取同一份材料，逐步形成自己的项目研究流程。' },
  { title: '让成果可检查、可追溯', text: '把待办、消息、修改、验证与交付物联系起来；发现错误时能回查任务如何分配、在哪里卡住、哪些结论没有证据。' },
  { title: '形成个人工作台的产品起点', text: '可以参考它开发研究助手、编码协作台或团队工具，将精力投入自己的业务规则、验收和体验；团队能力与可靠服务需要补建。' },
];
export const learningValues = [
  { title: '理解 Agent 的应用结构', text: '目标、上下文、工具、执行循环、运行状态与成果构成一项应用。工具能做什么、模型选择什么、成果是否通过检查，需要分别理解。' },
  { title: '理解 Claude Code 的外部集成', text: '从 CLI / PTY、Hooks、记录和权限等待读一条真实接线，知道怎样调用和观察执行。Claude Code 自身是模型与工具之间的执行框架。' },
  { title: '理解多 Agent 的工程代价', text: '任务拆分、上下文范围、消息协议、接口依赖、并发编辑和整合审查，比增加 worker 数量更关键；提示词约定需要验证机制补强。' },
  { title: '获得自己的库的参考结构', text: '参考文件上下文、终端生命周期、消息、provider 和工作区接口，抽取适合自己流程的部分；保留来源和许可，逐步做真实实验。' },
];
export const reuse = [
  { title: '只借用工作方法', text: '先用 CONTEXT、todo 和交接模板组织你现有的单 Agent 工作，不要求立即接入整套界面。适合验证任务定义是否有效。' },
  { title: '研究并运行原工作台', text: '按固定版本安装和配置 provider、Hooks 与 Git，在小项目跑通真实协作；保存环境、日志、diff、测试与失败记录。' },
  { title: '抽取运行与观察接口', text: '参考 CLI / PTY 生命周期、事件映射、消息投递和工作区管理，形成自己的适配层；先定义一致的任务和成果协议。' },
  { title: '实现个人 Agent 库', text: '先完成一个项目、两个 worker、一个审查者：任务→执行→事件→成果→验收；再添加持久化、恢复、多 provider 和多项目 UI。' },
];
export const extensions = [
  { title: '稳定任务与依赖模型', text: '给任务稳定 ID、输入输出、依赖和验收标准；避免 Markdown 重排改变任务身份，将并行与串行关系显式化。', need: '先验证任务拆分和接口依赖。' },
  { title: '持久化事件与消息', text: '保存事件、消息和确认记录；明确去重、超时、重试和失败处理，使交接不依赖一条内存消息。', need: '定义持久存储和消息投递语义。' },
  { title: '任务恢复与重建', text: 'API 重启后从任务、材料与成果重建执行；区分恢复任务状态、恢复模型会话和原 PTY 进程存活。', need: '记录失败和恢复路径，不宣称原进程可跨重启。' },
  { title: '成果协议与验收门禁', text: '要求报告修改、测试命令、证据路径和未完成项；用自动检查与人工审查判断通过，处理合并和跨模块行为。', need: 'DONE 不自动等于验收通过。' },
  { title: '多 Provider 适配', text: '统一启动、事件、消息和成果接口，再适配 Claude、Codex 等 CLI 或 SDK；保留各自权限、记录和事件能力的差异。', need: '已有 Codex 启动接线不能证明 Hooks 等价。' },
  { title: '多项目与知识复用', text: '管理研究模板、版本、证据和交接索引，让多个 GitHub 项目复用同一流程；可接入带出处的知识检索。', need: '先解决更新、来源、过时与权限边界。' },
  { title: '权限、工作区与团队协作', text: '补工具授权、隔离环境、角色权限和多人操作记录，让个人本机工作台逐步适配团队。', need: '文件范围和 Git worktree 不能代替安全沙箱。' },
  { title: '成本与质量评测', text: '记录总交付时间、人工介入、返工、模型消耗和最终达标率，比较单 Agent 与不同编排方式。', need: '用同类真实任务评测，不预设并行一定提速或省钱。' },
];
export const evidence = [
  { title: '原库事实', text: '源码和文档固定到 07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254；包声明版本 0.1.0；MIT。研究日期为 2026-10-09，本轮整理日期 2026-10-12。' },
  { title: '界面与引导图', text: '保留六张作者 JPG 原图；现有 3600×10174 PNG 引导图不重绘、不裁切，原始 SHA-256 在构建与发布时核对。作者数字不是我们的性能实测。' },
  { title: '本地研究实现', text: '中文正文、静态网页、预设登录协作演示与图解由本研究编写。展示页不连接模型，不创建真实 worker，不提供 Octogent API。' },
  { title: '仍待验证', text: '原应用在当前环境的安装、Hooks、模型调用、消息可靠性和实际合并尚未端到端复现；提速、费用和成果达标率没有测量。' },
];
export const references = [
  ['项目定位与边界','README.md'],['上下文文件','docs/concepts/tentacles.md'],
  ['待办与启动','apps/api/src/createApiServer/deckRoutes.ts'],['父协调者提示词','prompts/swarm-parent.md'],
  ['worker 提示词','prompts/swarm-worker.md'],['PTY 运行时','apps/api/src/terminalRuntime/sessionRuntime.ts'],
  ['Hooks 与状态','apps/api/src/terminalRuntime/hookProcessor.ts'],['消息机制','apps/api/src/terminalRuntime/channelMessaging.ts'],
  ['Git 工作区','apps/api/src/terminalRuntime/worktreeManager.ts'],['辅助能力','docs/reference/experimental-features.md'],
  ['会话记录','apps/api/src/terminalRuntime/conversations.ts'],['MIT 许可','LICENSE'],
];
export function makePublication(entry) {
  return { meta: publicationMeta, summaryItems: entry.summaryItems, overviewItems: entry.overviewItems,
    modules, pipeline, scenarios, businessValues, learningValues, reuse, extensions, evidence, references };
}
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const source = file => `${publicationMeta.upstream}/blob/${publicationMeta.commit}/${file}`;
const heading = (label, title, text) => `<div class="section-heading"><div><p class="eyebrow">${escape(label)}</p><h2>${escape(title)}</h2></div><p>${escape(text)}</p></div>`;
const simpleCards = (items, type) => `<div class="publication-grid">${items.map(item=>`<article class="publication-card" data-${type}><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p>${item.need?`<p class="publication-boundary"><strong>推进条件：</strong>${escape(item.need)}</p>`:''}</article>`).join('')}</div>`;
export function renderIntroduction(entry) {
  return `<section class="section wrap" id="summary">${heading('完整摘要 / 研究理解','从能力到复用，先掌握全貌。','各项说明对应下方正文；原库机制、学习判断与扩展建议分别说明。')}<div class="publication-intro" data-publication-introduction>${entry.overviewItems.map(item=>`<p><strong>${escape(item.title)}</strong>：${escape(item.text)}</p>`).join('')}</div><details class="publication-summary"><summary>展开 ${entry.summaryItems.length} 项完整摘要</summary><dl>${entry.summaryItems.map(item=>`<div><dt>${escape(item.title)}</dt><dd>${escape(item.text)}</dd></div>`).join('')}</dl></details><nav class="publication-nav" aria-label="完整研究章节"><a href="#overview">引导图</a><a href="#capabilities">核心能力</a><a href="#modules">系统模块</a><a href="#principles">执行原理</a><a href="#scenarios">使用场景</a><a href="#value">业务与工程价值</a><a href="#reuse">复用路线</a><a href="#extensions">扩展建议</a><a href="#evidence">来源与验证</a></nav></section>`;
}
export function renderPublication() {
  return `<section class="section wrap" id="modules">${heading('系统模块 / 已有实现','八个模块，连接任务、执行与观察。','每个模块分别说明职责、机制、产物与边界；源码链接固定到研究提交。')}<div class="publication-grid">${modules.map(item=>`<article class="publication-card" data-system-module><p class="eyebrow">${escape(item.name)}</p><h3>${escape(item.role)}</h3><p>${escape(item.mechanism)}</p><p><strong>产物：</strong>${escape(item.output)}</p><p class="publication-boundary"><strong>边界：</strong>${escape(item.boundary)}</p><a href="${source(item.file)}" target="_blank" rel="noopener noreferrer">核对实现 ↗</a></article>`).join('')}</div></section>
  <section class="section wrap" id="principles">${heading('执行原理 / 五步链路','外层组织协作，内层 CLI 执行任务。','一次任务经历定义、启动、工具执行、反馈协作和验收；每一步的保证来源不同。')}<ol class="publication-pipeline">${pipeline.map((item,i)=>`<li data-pipeline-step><span class="pipeline-number">0${i+1}</span><div><p class="eyebrow">${escape(item.kind)}</p><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></div></li>`).join('')}</ol><div class="publication-feedback"><p><strong>执行链：</strong>浏览器操作 → 本地 API → node-pty / CLI → 工具 → 项目文件。</p><p><strong>终端反馈：</strong>CLI / PTY 输出 → WebSocket → xterm；用户可以继续输入或中断。</p><p><strong>事件反馈：</strong>Claude Hooks → API → 状态、历史与编辑记录 → UI；空闲事件同时推动消息投递。</p><p><strong>控制与验收：</strong>代码管理生命周期、数量和投递；提示词指导分工和审查；人决定范围、权限与是否交付。</p><a href="https://code.claude.com/docs/en/how-claude-code-works" target="_blank" rel="noopener noreferrer">Claude Code 自身的 Agent 循环：官方说明 ↗</a></div></section>
  <section class="section wrap" id="scenarios">${heading('使用场景 / 研究设想','从你的开源研究，到功能协作与学习实验。','场景是应用建议；能够拆清任务、明确交接并检查成果，才能判断是否适合并行。')}<div class="publication-grid">${scenarios.map(item=>`<article class="publication-card" data-scenario><h3>${escape(item.title)}</h3><p><strong>输入：</strong>${escape(item.input)}</p><p><strong>分工：</strong>${escape(item.work)}</p><p><strong>产出：</strong>${escape(item.output)}</p><p class="publication-boundary"><strong>条件：</strong>${escape(item.condition)}</p></article>`).join('')}</div></section>
  <section class="section wrap" id="value">${heading('你的价值 / 两个方向','更有序地交付，也更具体地理解 Agent。','以下是可以争取的收益，尚未通过同类任务比较量化。')}<h3 class="publication-subheading">业务与产品价值</h3>${simpleCards(businessValues,'business-value')}<h3 class="publication-subheading">底层原理与工程学习价值</h3>${simpleCards(learningValues,'learning-value')}<p class="publication-callout">学习抓手：读一条调用链 → 跑一个真实任务 → 记录一次阻塞 → 对照成果验收 → 自己实现一个最小闭环。模型内部推理与 Claude Code 自身完整实现需要另行学习。</p></section>
  <section class="section wrap" id="reuse">${heading('复用路线 / 由浅入深','从工作方法，到你自己的 Agent 库。','按实际需要选择入口，不必从复制整个产品开始。')}${simpleCards(reuse,'reuse-route')}<p class="publication-callout">个人库建议结构：任务 / 上下文 → Provider 适配 → 执行运行时 → Workflow → 证据 / 成果 → 可选 UI。先把执行与验收闭环跑通，再扩大数量与界面。</p></section>
  <section class="section wrap" id="extensions">${heading('扩展方向 / 尚未实现','八项可以继续开发的方向。','这些是我们的研究建议，不能当成原库已经提供的稳定产品能力。')}${simpleCards(extensions,'extension')}<p class="publication-callout">推进顺序：一个项目、两个 worker、一个审查者 → 持久化、恢复与验收 → 多 provider、多项目及团队治理。用交付时间、介入、返工、成本和达标率判断价值。</p></section>
  <section class="section wrap" id="evidence">${heading('来源与验证 / 可回查','把已有事实、展示效果与未来设想分清。','部署的是本研究静态网页；原应用的实际协作能力仍需单独运行验证。')}${simpleCards(evidence,'evidence')}<div class="publication-sources">${references.map(([title,file])=>`<a href="${source(file)}" target="_blank" rel="noopener noreferrer">${escape(title)} ↗</a>`).join('')}</div><div class="hero-actions"><a class="button" href="./publication.json" download>下载完整研究 JSON</a><a class="button" href="./understanding.md" download>下载中文研究正文</a><a class="text-link" href="./LICENSE.upstream.txt">上游 MIT 许可</a></div></section>`;
}
export function renderUnderstanding(entry) {
  const sections = ['# Octogent 完整理解','',`基线：${publicationMeta.commit}；研究 ${publicationMeta.researchDate}，整理 ${publicationMeta.publicationDate}；MIT。`,'','## 完整摘要',...entry.summaryItems.map(item=>`\n### ${item.title}\n\n${item.text}`),'','## 系统模块',...modules.map(item=>`\n### ${item.name}\n\n职责：${item.role}\n\n机制：${item.mechanism}\n\n产物：${item.output}\n\n边界：${item.boundary}\n\n[实现依据](${source(item.file)})`),'','## 执行原理',...pipeline.map(item=>`\n### ${item.title}\n\n${item.kind}。${item.text}`),'','## 使用场景',...scenarios.map(item=>`\n### ${item.title}\n\n输入：${item.input}\n\n分工：${item.work}\n\n产出：${item.output}\n\n条件：${item.condition}`)];
  for(const [title,items] of [['业务价值',businessValues],['工程学习价值',learningValues],['复用路线',reuse],['扩展建议',extensions],['来源与验证',evidence]]) sections.push('',`## ${title}`,...items.map(item=>`\n### ${item.title}\n\n${item.text}${item.need?'\n\n推进条件：'+item.need:''}`));
  sections.push('','## 引导图','沿用已生成的完整 PNG，不重绘或裁切。',`尺寸：${publicationMeta.guide.width}×${publicationMeta.guide.height}；SHA-256：${publicationMeta.guide.sha256}`,'','## 来源',...references.map(([title,file])=>`- [${title}](${source(file)})`),'');
  return sections.join('\n');
}
