# Unsloth 能力全景图：文字与来源

让已有模型更适合你的任务。工具范围包括 Core、Studio 与 Desktop；具体路径需核对模型、软件版本、运行后端与硬件。

资料日期：2026-10-09。上游固定提交：`f9718db128218f43b7e0b03604baa4a9a6633028`。本图为研究资料可视化，不是实际模型训练结果。

## 先区分四件事

| 操作 | 做了什么 | 会不会根据新数据学习 |
| --- | --- | --- |
| 加载与推理 | 读入已有权重，用已有能力生成输出 | 加载本身不更新参数 |
| 量化 | 改变权重的数值表示，匹配支持的运行后端 | 单纯量化不教新任务 |
| 微调 / 后训练 | 从已有权重开始，根据数据、偏好或奖励更新参数 | 是，微调也是训练 |
| 真正从零训练 | 从随机参数开始学习模型的基础能力 | 是，需要独立核实初始化与完整训练工程 |

Unsloth 支持 LoRA / QLoRA、全参数微调、继续预训练和偏好 / 强化学习，不能写成“不支持训练模型”。本研究没有核实通用的随机初始化完整入口；H3 已确认的现成训练路径是在已有权重上训练 LoRA。[固定 README](https://github.com/unslothai/unsloth/blob/f9718db128218f43b7e0b03604baa4a9a6633028/README.md)、[继续预训练教程](https://unsloth.ai/docs/basics/continued-pretraining.md)、[H3 训练器](https://github.com/unslothai/unsloth/blob/f9718db128218f43b7e0b03604baa4a9a6633028/studio/backend/core/training/diffusion_h3_trainer.py)

主要工作流：基础模型与任务数据 → Unsloth 适配与优化 → 训练与评估 → 适配器或模型权重 → 接入应用。

## 01 · 能力

- 加载与推理：使用已有权重回答问题、生成内容。
- 量化与运行：压缩权重，匹配 GGUF 或低精度后端。
- LoRA / QLoRA：学习少量增量，定制任务和输出习惯。
- 全参数微调：仍可从已有权重开始，更新全部或大部分参数。
- 继续预训练：用原始语料继续学习领域表达或语言。
- DPO / GRPO：使用偏好样例或奖励调整行为。
- 部分多模态训练与导出：按支持范围处理视觉、语音、图像、音视频或向量任务，并保存适配器、合并支持的模型或导出运行格式。

[官方微调指南](https://unsloth.ai/docs/get-started/fine-tuning-llms-guide.md)、[RL 资源说明](https://unsloth.ai/docs/get-started/reinforcement-learning-rl-guide/memory-efficient-rl.md)、[导出指南](https://unsloth.ai/docs/basics/inference-and-deployment/saving-to-gguf)

## 02 · 原理

| 机制 | 实际作用 | 需要理解的边界 |
| --- | --- | --- |
| 低秩适配 | `W = W₀ + sBA`，冻结基础参数，学习增量 | 减少训练参数，不会消除基础权重与激活开销 |
| QLoRA | 基础权重量化存储，适配器单独训练 | 权重存储精度、计算精度和适配器精度不同 |
| Triton / 定制反向 | 融合热点运算，减少临时张量与内存搬运 | 未支持的配置可能回退，不能把内核收益当整次训练收益 |
| 检查点 / 分块 / 卸载 | 按需重算，分段处理或移动中间结果，降低显存峰值 | 可能增加重算或传输开销 |
| Padding-free / Packing | 减少填充位置，保留样本边界 | 每步有效 token 数与损失口径需匹配 |
| RL 资源复用 | 交替安排生成与更新，复用权重并调度缓存 | 奖励与验证器仍要自己设计 |

单矩阵数学示意：`d = 4096, r = 16`；完整矩阵参数 `d² = 16,777,216`；LoRA 增量 `2dr = 131,072`，约 0.78%。这不是整次训练显存比例，也不是实测速度。

[LoRA 原论文](https://arxiv.org/abs/2106.09685)、[QLoRA 原论文](https://arxiv.org/abs/2305.14314)、[LoRA 内核源码](https://github.com/unslothai/unsloth/blob/f9718db128218f43b7e0b03604baa4a9a6633028/unsloth/kernels/fast_lora.py)、[Packing 文档](https://unsloth.ai/docs/blog/3x-faster-training-packing.md)、[内存优化文档](https://unsloth.ai/docs/blog/500k-context-length-fine-tuning)

## 03 · 可适配模型的代表例子

| 类别 | 代表模型 | 可关注的路径 |
| --- | --- | --- |
| 文本模型 | Qwen、Llama、Gemma、Phi、Mistral | 支持变体上的任务微调与量化运行 |
| 专门架构 | gpt-oss、Qwen MoE、DeepSeek 蒸馏模型 | 对应模型适配，不能忽略总参数与资源需求 |
| 视觉语言 | Qwen-VL、Llama Vision、Gemma 3 | 图像与文字样例、视觉问答等训练 |
| 语音任务 | Whisper、Orpheus、Sesame-CSM | 识别或语音生成任务适配 |
| 图像生成 | FLUX、Qwen-Image 等 | 生成 / 编辑 / 加载兼容 LoRA；训练支持逐个另查 |
| 音视频生成 | MiniMax H3 | 量化运行与专门的联合音视频 LoRA |
| 向量模型 | EmbeddingGemma 等 | 领域检索表示适配 |

这是代表清单，不是全部模型列表。能下载、能运行、能训练以及每种训练方法都支持，是不同的支持层级。目录提供 GGUF 或 4-bit 文件，也不能单独证明任意训练配置可用。DeepSeek 蒸馏模型与原始巨型模型的资源规模不同。

[官方模型目录](https://unsloth.ai/docs/get-started/unsloth-model-catalog.md)、[视觉微调](https://unsloth.ai/docs/basics/vision-fine-tuning.md)、[语音微调](https://unsloth.ai/docs/basics/text-to-speech-tts-fine-tuning.md)、[扩散模型工作流](https://unsloth.ai/docs/basics/diffusion-image.md)。向量与 MoE 总体支持还见固定 README。

## 04 · 使用场景

客服话术与服务流程、分类与字段抽取、规范化 JSON、代码规范与可验证任务、领域语料适配、票据视觉问答、语音任务、音视频风格适配。场景是依据机制提出的应用判断，具体收益需实验验证。

经常更新的事实更适合从文档检索或业务接口获取；可按需叠加行为微调。微调不替代检索，也不替代应用中的格式与权限校验。

## H3 · 一个具体例子

- 运行：基础权重、文本编码器、VAE → 生成视频与声音。
- 微调：有有效音轨的视频与描述 → 联合音视频 LoRA → 适配器。
- 固定源码的训练窗为 22 帧、24fps，约 0.92 秒；长文件需预先切片，描述要与窗口一致。
- 公共源码给出整流程约 80GB+ 资源参考，本项目没有本机实测。
- 当前 H3 路径拒绝 FP8 / MXFP8 训练配置，因此 FP8 推理包不代表 FP8 可训练。

[MiniMax 模型卡](https://huggingface.co/MiniMaxAI/MiniMax-H3)、[H3 训练器](https://github.com/unslothai/unsloth/blob/f9718db128218f43b7e0b03604baa4a9a6633028/studio/backend/core/training/diffusion_h3_trainer.py)、[数据处理](https://github.com/unslothai/unsloth/blob/f9718db128218f43b7e0b03604baa4a9a6633028/studio/backend/core/training/diffusion_h3_clips.py)、[训练公共配置与资源](https://github.com/unslothai/unsloth/blob/f9718db128218f43b7e0b03604baa4a9a6633028/studio/backend/core/training/diffusion_train_common.py)

## 05 · 优点与价值

降低训练参数与中间结果的开销，加快实验比较；在适合的模型与后端上复用任务适配器，保留本地数据与运行控制，连接现有训练和部署生态。交付价值是把通用模型变成可评估的任务组件。

效率收益取决于模型、GPU、精度、序列长度、有效批量和软件版本。任务表现取决于基础模型、数据、训练方法与评估；没有承诺固定速度或显存倍率。

## 06 · 对你的意义

以下建议结合本仓库的 GitHub 研究、网页原型和内容项目提出，属于应用判断：

- **研究资产**：建立可复用的小模型实验和评估记录，积累经人工核对的输入输出。
- **网页与工具**：为应用接入可控的本地模型服务；网页、业务流程和接口仍由应用代码完成。
- **内容一致性**：尝试让文案结构、术语、语音或视觉风格符合自己的标准，实际效果需验证。
- **投资顺序**：先做模型接入与提示词；需要最新资料时先补检索；稳定重复任务有足够样例时再试微调。
- **第一步**：选兼容的小模型和单一任务，例如研究摘要结构或字段抽取，用未参与训练的测试集比较原模型与微调结果。

无需因为要开发一个 AI 网页就立即训练模型。H3 需另核对大显存硬件，不默认作为首次实验。

## 07 · 容易混淆的边界

二次训练更新参数，二次开发编写应用；全参数微调仍可从旧权重开始；上传文档不等于自动学会；远程 API 不提供权重时不能直接修改远程模型；量化文件体积不等于完整训练显存。

工具与模型许可分别核对：Core 使用 Apache-2.0，Studio 的对应组件使用 AGPL-3.0，权重遵循模型自己的许可。

## 08 · 判断与落地

| 问题 | 优先路径 |
| --- | --- |
| 只是使用现成能力 | 加载与推理 |
| 事实频繁变化 | 检索 / 业务接口 |
| 输出格式与行为反复不稳定 | 准备样例，尝试微调 |
| 要学习全新模型的基础能力 | 单独设计并验证从零训练工程 |
| 缺少数据与评估 | 先补齐，再扩大训练 |

明确任务 → 原模型基线 → 数据清洗 → 训练 / 测试划分 → 小规模微调 → 对比退化 → 保存与接入。

## 图像产出

最终采用本项目原创 HTML / CSS 排版，经 Playwright / Microsoft Edge 导出 2400 × 5091 的 PNG。可编辑排版源码为 `unsloth-overview.html`，制作说明为 `unsloth-overview-prompt.txt`；导出脚本位于 `web/scripts/render-overview.mjs`。图像不是上游截图或 H3 生成效果。

此前尝试内置 `image_gen`，返回 `network error: error sending request`，没有得到图片。原始提示词保存为 `unsloth-overview-imagegen-attempt.txt`。最终未调用备用 API 生图，导出与校对记录保存在 `unsloth-overview-generation.json`。
