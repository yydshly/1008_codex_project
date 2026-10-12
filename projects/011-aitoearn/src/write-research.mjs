import {writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import * as d from '../web/content.js';
const link=(p,label='源码依据')=>`[${label}](${d.source(p)})`;
const inventory=JSON.parse(await readFile(new URL('./implementation-inventory.json',import.meta.url),'utf8'));
const md=`# AiToEarn 能力、原理、场景与个人价值研究

研究日期：${d.meta.date}。上游：[yikart/AiToEarn](${d.meta.repo})。固定提交：\`${d.meta.commit}\`。许可证：MIT，Copyright (c) 2025 AiToEarn。

本文件由原创结构化研究数据web/content.js生成，与网页保持一致。研究范围包含32项能力、13个技能、14个平台，固定来源清单见src/source-manifest.json。网页和本文包含源码研究与解释，以及新增的3张真实图像生成与本地草稿实测；尚未运行原后台、外部云加工或真实社交账号发布。

## 1. 核心结论

AiToEarn面向一人公司、个人创作者、商家、品牌和代运营，组织创作、分发、互动与推广交付。它的本质可以理解为“多个能力步骤组合成媒体工作流”，完整实现还包括Agent调度、Skills流程知识、MCP/执行工具与业务后台。

Skills描述怎么做，Agent选择和编排，工具调用模型和执行程序，后台管理账号、素材、草稿、队列、任务与状态。复制技能文件本身不能取得外部模型、云剪辑、账号授权或发布服务。

内容输出效果、平台执行结果与营销效果应分别判断：生成任务可产出媒体或URL，发布服务可创建与追踪任务；画质和事实需查看成品，曝光与收入需要真实业务反馈。

## 2. 全量能力清单

${d.capabilities.map((c,i)=>`### ${String(i+1).padStart(2,'0')}. ${c.title}

分类：${c.group}。证据：${c.status}。

${c.summary}

- 输入：${c.input}
- 输出：${c.output}
- 实现：${c.how}
- 效果与边界：${c.boundary}
- 原创需求示例：${c.example}

${link(c.ref)}。
`).join('\n')}
## 3. 全部技能

${d.skills.map((s,i)=>`### ${i+1}. ${s.title} · ${s.slug}

${s.detail}

- 产出：${s.output}
- 工具：\`${s.tools}\`
- 核对状态：${s.status}

${link(s.path,'原始 SKILL.md')}。
`).join('\n')}
## 4. 发布平台

内容类型与授权方式按固定版本元数据整理。同步提交不意味着平台处理和审核已完成。微信公众号图文为HTML文章。

| 平台 | 内容 | 授权 | 完成方式 | 说明 |
| --- | --- | --- | --- | --- |
${d.platforms.map(p=>`| ${p.name} | ${p.types.join('、')} | ${p.auth} | ${p.complete} | ${p.note} ${link(p.path,'规则')} |`).join('\n')}

各平台实际权限、校验规则、动作覆盖与最终完成路径不一致。

## 5. 底层原理

${d.layers.map((l,i)=>`### 第${i+1}层：${l.name}

${l.description}

例子：${l.example}

${link(l.ref)}。
`).join('\n')}
技术构成：Next.js界面；Claude Agent SDK、Claude Code Router和技能/轮询子代理；NestJS/Nx业务与AI服务；MongoDB持久化；Redis/BullMQ队列；RustFS/S3对象存储；Sharp图片处理、ffmpeg抽帧，以及外部生成模型与云媒体API。${link(d.refs.deploy,'部署说明')}、${link(d.refs.runtime,'运行时')}。

发布过程：校验账号与输入 → 准备媒体与平台预检 → 创建Flow/任务/记录 → 立即或延迟入队 → 平台提供器执行或等待用户接续 → 跟踪作品和状态 → 分类错误与重试。${link(d.refs.flow,'发布流程')}、${link(d.refs.task,'发布任务')}。

生成和云加工通常先返回任务ID，再用状态工具轮询。生成成功、保存草稿、创建发布任务和最终发布成功是不同事件。单次Agent提示要求顺序工具执行；批量草稿走队列，实际并行受worker配置和外部限额影响。${link(d.refs.prompt,'系统提示')}。

### 当前批量草稿参数

- quantity：1—10，默认1；imageCount：1—9，默认3。
- 图文参考图最多14；视频入口参考图最多9，视频和音频参考各最多3。
- v2视频草稿时长1—15秒，长片分段生成或使用剪辑。
- prompt与captionPrompt分别最多2000字符，视觉与文案分开。
- draftType控制完整草稿或仅生成媒体；plannerModel与媒体model分别配置。
- disableMemory默认true。开启时读取近90天样本并总结最多20条偏好，不更新模型权重。
- 以上是接口范围，不保证每个模型支持全部输入；最终发布需重新校验渠道规则。

${link(d.refs.dto,'DTO 参数')}、${link(d.refs.memory,'历史偏好实现')}。

### 模型入口与工具声明

Agent图片工具列出Gemini 3.1 Flash / 3 Pro；Grok入口支持1—15秒和480p/720p；Sora入口列出sora-2/pro及8/10/25秒，还有角色创建与查询。README v2.4描述HappyHorse 1.0 / Seedance 2.0，不能将版本介绍视为每个入口都支持这些模型。${link(d.refs.media,'媒体工具参数')}。

系统提示建议生成关键帧并链式传入参考图，帮助多镜头一致；这是方法和接口，结果需要观看。独立SubtitleMcp与video-utils均有字幕代码，但当前运行注册已注释。${link(d.refs.runtime,'运行注册')}。

静态提取的${inventory.tools.length}组工具声明如下。枚举和@Tool声明不等于当前Agent全部可调用列表，仍需核对运行注册。

${inventory.tools.map(g=>`- **${g.path.split('/').at(-1)}**：${g.names.map(n=>'\x60'+n+'\x60').join('、')}。${link(g.path,'声明来源')}`).join('\n')}

### 平台规则补充

空值为未声明，不等于无限制；下表为源码数值。完整格式与大小规则见src/implementation-inventory.json。

| 平台 | 标题 / 正文长度 | 图片 / 视频数 | 视频时长上限（秒） | 作品更新 |
| --- | --- | --- | --- | --- |
${inventory.rules.map(r=>`| ${r.name} | ${r.maxTitleLength??'—'} / ${r.maxBodyLength??'—'} | ${r.maxImages??'—'} / ${r.maxVideos??'—'} | ${r.maxVideoDuration??'—'} | ${r.updateSupported?'声明支持':'未声明支持'} |`).join('\n')}

${inventory.extraPlatform.note} ${link(inventory.extraPlatform.path)}。

## 6. 三个完整流程示例

以下流程为本项目建议与预设说明，没有调用真实服务。

${d.workflows.map(w=>`### ${w.title}

需求：${w.prompt}

${w.steps.map((s,i)=>`${i+1}. **${s[0]}**：${s[1]} 产出：${s[2]}。边界：${s[3]}`).join('\n')}
`).join('\n')}
## 7. 使用场景

${d.scenarios.map(s=>`### ${s.title}

- 输入：${s.input}
- 流程：${s.process}
- 价值：${s.value}
- 适用条件：${s.fit}
`).join('\n')}
## 8. 对你的价值

以下分析结合当前多GitHub项目研究仓库推导，并非假设你已经运营媒体账号。

${d.values.map(v=>`### ${v.title}（${v.priority}）

${v.why}

开始方式：${v.use}

评估标准：${v.measure}
`).join('\n')}
先选一个已完成项目，使用真实截图/录屏准备一组图文与一条草稿，核对事实和署名，记录准备时间、人工改动和调用成本，再验证一个账号。确认质量和效率后，再扩展平台、批量和多语言。源码研究、选题与成品判断仍需要你。

## 9. 接入、部署与投入

${d.access.map(([n,t,s,u])=>`- **${n}**（${t}）：${s} [入口/说明](${u})`).join('\n')}

自行部署包括Nginx、Web、Server、AI、MongoDB、Redis与RustFS/S3，之后仍需分别配置模型、云媒体、社交授权或Relay、插件与可访问素材。统一MCP使用/api/unified/mcp或/api/unified/sse，header为x-api-key，Key须与中国/国际区域匹配。

费用按生成、云加工、存储带宽、服务器、人工审阅与返工分别测算，不把历史广告价格当作预算。官方市场的订单、审核和结算需要实际业务条件，自行部署不自动获得收入。

## 10. 核验边界

${d.boundaries.map(([t,s,r])=>`### ${t}

${s} ${link(r)}。
`).join('\n')}
## 11. 来源与许可

固定源码和SHA-256见src/source-manifest.json。74份资料及6张上游图片供研究，完整参考文件在ignored upstream/。上游MIT保留于src/LICENSE.upstream.txt，随网页构建复制。

作者图片：${d.screens.map(s=>`[${s.title}](${d.source(s.path)})`).join('、')}；另有[餐厅提示词画廊封面](${d.source('project/aitoearn-web/public/assets/promptGallery/cover01.png')})。这些资料不是本地运行结果。

原作者AiToEarn / yikart，Copyright (c) 2025 AiToEarn。未修改或执行上游应用；原创范围为中文结构化分析、网页、流程示例和下载/构建/预览工具。

## 12. 新增真实效果实测：GPT适配与图文草稿

2026-10-09，在011子项目安装13个固定版本原版技能，根项目新增aitoearn-gpt-content适配入口。原文、来源SHA和MIT许可保留。当前GPT/Codex加载图片生成与内容管理方法，用已有研究作为输入，实际调用image_gen.imagegen三次。

实际产出为3张1086×1448 PNG、配套中文文案和本地draft.json。主题依次为“把开源研究变成内容”“Skill不是全部”和“先用一个项目跑通一次创作”。每张均人工查看；主要中文文字正确、配色一致，第一和第三张添加了未要求的装饰小字，保留实际结果和审阅意见。

图像工具没有公开底层模型编号和计费金额。生成等待267秒是本次调用记录，不代表速度基准，也不能推导费用或节省比例。正文含话题共501字符、标题11字符，3张PNG均小于20MB，通过研究版本的小红书元数据预检。真实账号权限、平台当前规则和审核未验证。

上游默认Gemini工具映射到本会话可用图像工具，远端内容MCP保存映射为本地JSON。没有运行原Agent SDK、后台或队列，没有授权账号或社交发布，也没有验证视频加工、运营指标和收入。

成品、输入快照、3条真实提示词、调用时间、SHA-256与实验说明位于experiments/research-to-post/。网页“真实效果实测”显示全部成品，提供放大、文案复制、单图与完整成品包下载。原来的三个七步流程仍为解释示例。
`;
await writeFile(fileURLToPath(new URL('../research.md',import.meta.url)),md);
console.log('中文研究全文已生成。');
