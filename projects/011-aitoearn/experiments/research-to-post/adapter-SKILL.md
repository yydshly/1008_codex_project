---
name: aitoearn-gpt-content
description: 使用本仓库安装的 AiToEarn 内容技能，将已核对的 GitHub 研究或自有素材制作成真实图片与中文发布草稿；通过当前 GPT/Codex 和可用图像工具适配上游 Gemini 工作流。适用于 AiToEarn 技能效果验证与研究成果转图文。
---

# AiToEarn 的 GPT 内容适配

本入口是项目适配，原始13个技能保持不变，位于[011技能目录](../../../projects/011-aitoearn/.agents/skills/)。来源与许可证见[安装清单](../../../projects/011-aitoearn/src/skill-installation.json)。

## 按任务加载

- 生成图片时读取[generating-images](../../../projects/011-aitoearn/.agents/skills/generating-images/SKILL.md)，沿用场景化提示、用户语言、参考图与顺序生成方法。
- 组织素材与草稿时读取[managing-content](../../../projects/011-aitoearn/.agents/skills/managing-content/SKILL.md)。
- 视频、剪辑、翻译等只在任务需要时读取对应技能，并核对其实际工具/服务是否可用。

## 工具匹配

- 规划、事实提炼、标题、正文、标签与提示词由当前GPT/Codex完成。不将上游的Gemini模型名直接替换成GPT模型名。
- `generateImage`映射到当前会话的内置图像生成工具，采用实际可用参数；底层图像模型编号未回传时写“未公开”，不自行推断型号。项目图片应复制到项目assets目录。
- 有内容MCP时按其真实返回保存媒体/草稿。没有时，保存本地media manifest和draft.json，明确是本地草稿；不编造AiToEarn后台ID或存储成功响应。
- 上游视频/云加工/发布工具需要其模型服务、MCP或渠道授权。工具缺失时保留待接入状态；不用文字/流程动画假装真实执行。

## 执行与证据

以用户选定资料为事实输入，保留来源版本。把视觉需求与发布文案分开规划，按上游策略顺序生成图片，每张返回后检查文字、主题和尺寸。

保存实际提示词、工具与时间记录、图片路径/哈希、标题正文标签和观察结果。图片正文中的事实仍需要核对；修改生成图时使用当前图像编辑工具，并保留原图。

仅生成草稿的请求不执行对外发布。用户已授权发布时仍需真实渠道工具返回结果；记录任务创建与最终发布的区别。

本仓库的首次真实案例见[演示输入](../../../projects/011-aitoearn/experiments/research-to-post/brief.json)、[计划](../../../projects/011-aitoearn/experiments/research-to-post/plan.json)与[产出记录](../../../projects/011-aitoearn/experiments/research-to-post/README.md)。
