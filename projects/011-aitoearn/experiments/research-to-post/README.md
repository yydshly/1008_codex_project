# 真实演示：从AiToEarn研究到三张介绍图

2026-10-09，在当前项目安装AiToEarn固定版本的13个技能，并通过原创`aitoearn-gpt-content`入口匹配当前GPT/Codex工具。实际采用`generating-images`和`managing-content`的方法，制作3张图、1篇文案和1份本地草稿。

## 实际输入与结果

场景来自本仓库已有工作：将011项目的真实GitHub研究整理成介绍内容，让读者了解能力、原理和一次入门流程。输入是研究README、中文全文、结构化能力与平台规则清单，执行前内容保留在`inputs/`；图片中的纸张、桌面和卡片是生成插画。

| 成品 | 主题 | 文件 |
| --- | --- | --- |
| 图01 | 把开源研究变成内容 | ../../assets/research-to-post/card-01.png |
| 图02 | Skill不是全部：四部分分工 | ../../assets/research-to-post/card-02.png |
| 图03 | 用一个项目跑通一次创作 | ../../assets/research-to-post/card-03.png |
| 中文正文与话题 | 配套介绍内容 | draft.md |
| 结构化草稿 | 3张本地媒体与内容记录 | draft.json |
| 完整成品包 | 图片、正文、草稿、来源和记录 | output-bundle.zip |

三张图实际均为1086×1448 PNG，3:4竖图。主要中文文字人工查看正确，绿色/象牙白系列配色一致。第一、第三张添加了未要求的小字，属于提示词遵循偏差，保留实际结果而未冒充严格逐字一致。第三张插画中的“可以发布”不是平台校验或发布成功的证据。

每张生成后查看本地文件。未自动OCR；没有测量曝光、转化或收入，也没有对照试验推导效率。调用起止时间来自工具时钟，详见generation-calls.json；共3次生成，工具未提供成本与底层模型编号。

## 安装与GPT匹配

- 上游：https://github.com/yikart/AiToEarn
- 固定提交：3581f511293236044e56fad67958cfcea0def6b5，MIT。
- 13原版技能：本子项目`.agents/skills/`，由官方skill-installer按固定SHA安装；未修改原文，来源与SHA-256见`../../src/skill-installation.json`。原MIT许可在`../../.agents/LICENSE.upstream.txt`。
- GPT入口：根项目`.agents/skills/aitoearn-gpt-content/SKILL.md`。同内容快照adapter-SKILL.md供网页阅读。
- 按[Codex Skills说明](https://learn.chatgpt.com/docs/customization/overview#skills)，项目技能可置于`.agents/skills/`，选择后再加载完整步骤。入口会读取011子项目中的适用原版技能。新入口在后续对话可调用。

| 环节 | 上游实现 | 本次执行 |
| --- | --- | --- |
| 规划与文案 | Agent SDK / 模型路由 | 当前GPT/Codex读取资料、编排、写文案和提示词 |
| 图片 | generating-images引用generateImage，默认Gemini | 会话image_gen.imagegen真实生成3张PNG |
| 保存 | managing-content引用内容MCP、远端素材和草稿 | 本地PNG、draft.json、draft.md、run.json |
| 视频/剪辑/翻译 | 模型、云API等专用服务 | 已保留原版技能，本次未执行 |
| 发布/互动/分析 | 业务MCP、平台提供器、账号授权 | 本地格式预检，未授权或发布 |

这是对技能方法的GPT工具适配。图片已经实际生成，但没有运行AiToEarn原版Agent、后台、队列、数据库和社交发布链路。适配入口显式检查工具可用性，未提供的服务不能仅靠技能文件自动执行。

## 记录与验证

- brief.json：真实场景、事实来源与约束。
- plan.json：所用技能、工具映射与三张图计划。
- prompts.json：真实传给工具的3条完整提示词。
- generation-calls.json：调用时间、真实工具名、参数、原输出路径、本地落地位置与人工查看意见。
- run.json：输入快照与成品SHA-256、实际尺寸、预检结果、使用范围。
- draft.json：本地演示格式，远端草稿ID、账号ID与发布任务ID为空；不是原MCP接口返回。

预检依据研究提交内的小红书元数据：标题≤20字符、正文≤1000字符、图片≤9张、PNG可用且每张≤20MB。正文包含话题后一起计算，平台当前权限和审核不在本地检查范围。

```powershell
# 在011子项目内验证文件、实际尺寸、提示词、哈希并生成run.json
node experiments/research-to-post/pack-demo.mjs
node src/register-skills.mjs
node src/write-research.mjs
powershell -NoProfile -File src/package-demo.ps1
cd web
npm.cmd run build
```

pack-demo脚本读取既有成品和实际调用记录，不再次调用模型。需要重新创作时，在新对话使用`$aitoearn-gpt-content`描述自己的真实输入、目标读者和成品数量；每次生成需新建执行记录，不复用本次记录冒充新运行。

register-skills需要ignored upstream/内的固定来源；新检出仓库可先运行`node src/fetch-references.mjs`获取同一研究版本再比较。成品包不是完整原版应用安装器，适配技能的路径按本研究仓库组织。

原创内容为研究、GPT适配、提示词、文案、页面与实验脚本；上游技能及许可保持原作者署名。成品包保留LICENSE.upstream.txt。
