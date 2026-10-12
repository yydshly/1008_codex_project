// 本项目原创研究整理；链接固定到阅读的上游提交。未复制上游程序实现。
export const meta = {
  id: '010', title: 'Unsloth 模型训练与原理研究', date: '2026-10-09',
  commit: 'f9718db128218f43b7e0b03604baa4a9a6633028',
  repository: 'https://github.com/unslothai/unsloth',
};
const code = file => `${meta.repository}/blob/${meta.commit}/${file}`;
export const sources = [
  { id: 'overview', title: '仓库 README 与功能声明', url: code('README.md'), note: 'Core / Studio / Desktop、运行与训练范围。README 的总体支持声明不等于每个模型都具备每种能力。', type: '固定源码' },
  { id: 'patch', title: '模型适配：llama.py', url: code('unsloth/models/llama.py'), note: 'pre_patch 替换部分前向实现；接入 Transformers、PEFT 和量化配置。', type: '固定源码' },
  { id: 'lora-code', title: 'LoRA 前向与反向计算', url: code('unsloth/kernels/fast_lora.py'), note: 'LoRA_MLP、LoRA_QKV 和自定义 autograd；部分配置会回退到普通实现。', type: '固定源码' },
  { id: 'ce', title: '交叉熵 Triton 内核', url: code('unsloth/kernels/cross_entropy_loss.py'), note: '融合损失计算、分块 logsumexp、定制梯度。与长序列分块损失优化一起理解。', type: '固定源码' },
  { id: 'lora-paper', title: 'LoRA 原论文', url: 'https://arxiv.org/abs/2106.09685', note: '低秩适配来自 LoRA 研究。网页中的参数数量是矩阵维度计算示意。', type: '原论文' },
  { id: 'qlora-paper', title: 'QLoRA 原论文', url: 'https://arxiv.org/abs/2305.14314', note: '量化冻结基础权重，同时训练适配器；4-bit 存储与实际计算精度需要区分。', type: '原论文' },
  { id: 'packing', title: 'RoPE 内核与 Padding-free / Packing', url: 'https://unsloth.ai/docs/blog/3x-faster-training-packing.md', note: '合并 Q/K RoPE、减少复制；保留序列边界以避免样本间注意力泄漏。', type: '官方文档' },
  { id: 'memory', title: '长上下文训练与内存调度', url: 'https://unsloth.ai/docs/blog/500k-context-length-fine-tuning', note: '分块 LM head / 损失、激活卸载、梯度检查点和 Tiled MLP。官方 500K 示例有指定模型与硬件前提。', type: '官方文档' },
  { id: 'rl', title: '强化学习中的显存复用', url: 'https://unsloth.ai/docs/get-started/reinforcement-learning-rl-guide/memory-efficient-rl.md', note: '支持路径中共享 vLLM 权重存储，Standby 调度推理缓存与训练资源。', type: '官方文档' },
  { id: 'cpt', title: '继续预训练', url: 'https://unsloth.ai/docs/basics/continued-pretraining.md', note: '在已有模型上继续训练原始语料，例如新语言。该教程不等于从随机权重训练的教程。', type: '官方文档' },
  { id: 'guide', title: '微调入门与数据准备', url: 'https://unsloth.ai/docs/get-started/fine-tuning-llms-guide.md', note: '数据、训练与评估流程。应用选择卡是本项目基于机制的判断，不是官方效果保证。', type: '官方文档' },
  { id: 'requirements', title: '硬件与运行要求', url: 'https://unsloth.ai/docs/get-started/fine-tuning-for-beginners/unsloth-requirements', note: '不同界面与后端的支持情况；显存表是最低参考，不能代替具体配置实测。', type: '官方文档' },
  { id: 'model-catalog', title: '官方模型目录与量化变体', url: 'https://unsloth.ai/docs/get-started/unsloth-model-catalog.md', note: '总览图中的代表模型：文本、MoE、视觉和向量模型。目录里的运行格式不构成所有训练方式均受支持的承诺。', type: '官方文档' },
  { id: 'speech', title: '语音生成与识别微调', url: 'https://unsloth.ai/docs/basics/text-to-speech-tts-fine-tuning.md', note: 'Whisper STT、Orpheus、Sesame-CSM 等训练示例；基础权重与具体配置需匹配。', type: '官方文档' },
  { id: 'export', title: '保存与导出 GGUF', url: 'https://unsloth.ai/docs/basics/inference-and-deployment/saving-to-gguf', note: '导出、合并和运行；跨框架需保留训练时的 chat template 和终止标记。', type: '官方文档' },
  { id: 'vision', title: '视觉模型微调', url: 'https://unsloth.ai/docs/basics/vision-fine-tuning.md', note: '视觉语言模型的图像与文本样例适配；与 H3 的音视频生成训练不同。', type: '官方文档' },
  { id: 'moe', title: 'MoE 训练与基准比较', url: 'https://unsloth.ai/docs/basics/faster-moe.md', note: 'Grouped GEMM 与 LoRA 优化；宣传倍率依赖 Transformers 版本及比较基线。', type: '官方文档' },
  { id: 'diffusion', title: '本地扩散模型工作流', url: 'https://unsloth.ai/docs/basics/diffusion-image.md', note: '生成、编辑、LoRA 加载与低显存选项；支持的操作随具体模型变化。', type: '官方文档' },
  { id: 'h3-official', title: 'MiniMax H3 官方模型卡', url: 'https://huggingface.co/MiniMaxAI/MiniMax-H3', note: 'H3-Base、输入模态与音视频输出；官方完整系统中的 Context-IR / 2K 模块有各自开放范围。', type: '模型作者' },
  { id: 'h3-gguf', title: 'Unsloth H3 GGUF 模型卡', url: 'https://huggingface.co/unsloth/MiniMax-H3-GGUF', note: '量化去噪器、文本编码器与 VAE 配置；这些文件针对本地运行。', type: '官方模型卡' },
  { id: 'h3-fp8', title: 'Unsloth H3 FP8 / INT8 模型卡', url: 'https://huggingface.co/unsloth/MiniMax-H3-FP8', note: '预量化推理权重与示例测试；模型文件大小不等于整套训练显存。', type: '官方模型卡' },
  { id: 'h3-trainer', title: 'H3 音视频 LoRA 训练器', url: code('studio/backend/core/training/diffusion_h3_trainer.py'), note: 'run_h3_lora_training：加载基础权重、冻结基础参数、适配 Attention / MLP，并联合训练音视频目标。', type: '固定源码' },
  { id: 'h3-clips', title: 'H3 数据集与短片段处理', url: code('studio/backend/core/training/diffusion_h3_clips.py'), note: '视频文件与 caption 配对；拒绝无音轨 / 全静音；当前固定训练窗为 22 帧，约 0.92 秒。', type: '固定源码' },
  { id: 'train-common', title: '训练路由、资源说明与配置约束', url: code('studio/backend/core/training/diffusion_train_common.py'), note: 'TRAINABLE_VIDEO_FAMILIES、H3 配置检查、80GB+ 整流程参考、FP8 训练限制和保存 / 恢复边界。', type: '固定源码' },
  { id: 'apache', title: 'Core 的 Apache-2.0 许可证', url: code('LICENSE'), note: '核心包许可证；具体文件以自身声明为准。', type: '许可证原文' },
  { id: 'agpl', title: 'Studio 的 AGPL-3.0 许可证', url: code('studio/LICENSE.AGPL-3.0'), note: 'Studio 与其中的 H3 训练代码使用该许可；模型权重还遵循各自的模型许可。', type: '许可证原文' },
];
export const methods = [
  ['加载与推理', '已有模型', '不更新', '回答问题、生成内容', '工作台可以加载权重，但加载本身不让模型学会新任务。', 'overview'],
  ['量化', '已有权重', '改变数值表示', '降低存储与内存需求', '压缩可能带来数值差异；不会自动获得新知识或新技能。', 'qlora-paper'],
  ['LoRA 微调', '已有模型', '更新新增的小矩阵', '学习任务、风格与输出习惯', '基础参数通常冻结；训练成果可以是一份适配器。', 'lora-paper'],
  ['QLoRA 微调', '量化的已有模型', '更新适配器', '在较少显存中做微调', '基础权重低精度存储；适配器、计算与中间结果使用各自精度。', 'qlora-paper'],
  ['全参数微调', '已有模型', '更新全部或大部分参数', '更广泛地适配任务', '更新全部参数不等于随机初始化；显存与训练成本通常更高。', 'overview'],
  ['继续预训练', '已有模型', '按训练方案更新', '继续学习原始语料、新语言或领域', '仍然继承基础模型的已学能力；需防止原有能力退化。', 'cpt'],
  ['偏好 / 强化学习', '已有模型', '按偏好或奖励更新', '调整回答偏好、可验证行为', 'DPO 使用偏好样例；GRPO 等方法使用生成结果与奖励规则。', 'rl'],
  ['真正从零训练', '随机初始化的参数', '学习基础能力', '创建一个新模型', '本次未核实开源库的通用随机初始化入口；H3 现成路径是已有权重上的 LoRA。不能把总体“支持预训练”当作一键从零造模型的承诺。', 'h3-trainer'],
];
export const capabilities = [
  { n: '01', title: '把通用模型变成任务模型', tag: '训练', desc: '使用成对的输入与理想输出，训练分类、抽取、对话或代码任务。LoRA / QLoRA 是常见入口，全参数微调也是可选方法。', example: '订单描述 → 指定字段的 JSON', source: 'guide' },
  { n: '02', title: '学习偏好与可评分行为', tag: '训练', desc: 'DPO 适配回答偏好；GRPO 等强化学习方法让生成结果进入评分与更新循环。奖励函数与评估设计仍需自己准备。', example: '生成代码 → 测试评分 → 更新策略', source: 'rl' },
  { n: '03', title: '继续学习原始语料', tag: '训练', desc: '在已有基础模型上继续训练文本语料，例如学习新语言或领域表达。它与只训练问答格式的任务微调侧重点不同。', example: '领域语料 → 继续预训练 → 任务微调', source: 'cpt' },
  { n: '04', title: '覆盖更多模态与模型', tag: '依模型而定', desc: '包括视觉语言、语音、Embedding 和部分扩散模型。视觉问答、语音任务、音视频生成的模型结构与数据集并不相同。', example: '票据图像 + 问题 → 字段；视频 + 描述 → H3 LoRA', source: 'vision' },
  { n: '05', title: '本地工作台与工具连接', tag: '运行', desc: 'Core 提供 Python 接口，Studio / Desktop 提供工作台。支持路径中可运行模型、使用 RAG / 工具，并通过兼容 API 连接应用。', example: '自己的模型 → 本地 API → 业务应用', source: 'overview' },
  { n: '06', title: '量化、保存与导出', tag: '部署', desc: '保存适配器、合并支持的模型、导出 GGUF 等格式。运行端需要匹配模型结构、模板和终止标记；格式可导出不等于所有引擎可用。', example: '训练产物 → GGUF → 兼容的运行引擎', source: 'export' },
];
export const principles = [
  { id: 'lora', name: '少训练参数', label: 'LoRA / QLoRA', title: '在已有能力上，学习一份小的增量', intro: '原模型权重 W₀ 保持冻结，只训练低秩矩阵 A、B。计算时使用 W₀ + sBA；s 是缩放系数。QLoRA 再压缩冻结权重的存储。', steps: [['保留基础模型', '继承原模型已经学习的通用能力。'], ['添加低秩增量', '用小矩阵表达任务相关的权重调整。'], ['更新并保存适配器', '减少可训练参数、梯度与优化器状态。']], effect: '主要减少可训练部分的开销。基础模型、激活与缓存仍要占内存。', detail: '低秩适配来自 LoRA / QLoRA 研究。Unsloth 的贡献是进一步优化这些计算与训练流程，并不意味着 LoRA 是它发明的。', source: 'lora-code' },
  { id: 'kernels', name: '优化 GPU 计算', label: 'Triton + Autograd', title: '合并运算，让数据少搬几次', intro: 'Unsloth 对支持架构替换部分前向实现，使用 Triton 内核和定制 autograd 优化 LoRA、RoPE、MLP 与损失计算。', steps: [['适配模型计算', '接入 PyTorch / Transformers / PEFT，替换已支持的热点路径。'], ['融合热点操作', '例如合并 Q、K 的旋转位置编码，减少重复启动。'], ['优化梯度与内存复用', '用定制反向计算减少临时张量、复制与重复计算。']], effect: '改善吞吐与内存读写。收益依赖架构、配置、GPU 和当前软件版本。', detail: '这是实现层面的优化。部分不兼容配置会回退到普通计算，不能把某个内核的倍率当作整次训练的倍率。', source: 'patch' },
  { id: 'memory', name: '降低显存峰值', label: 'Checkpoint + Chunk', title: '改变中间结果的保存与处理时机', intro: '模型权重只是训练内存的一部分。激活、梯度、优化器状态和词表投影也会占据大量显存，长序列尤其明显。', steps: [['少保存，按需重算', '梯度检查点在反向传播时重算部分激活。'], ['分块处理大张量', '分块 LM head / 交叉熵与 Tiled MLP 降低同时驻留的规模。'], ['把部分结果移到 CPU', '在支持的路径中卸载激活，并安排异步传输。']], effect: '让更长序列或更大任务有机会装进显存。可能增加重算或传输开销。', detail: '降低峰值与降低总计算量是不同概念。官方超长上下文案例指定了模型、训练模式与大显存 GPU，不能推导为所有模型都具备同样上下文能力。', source: 'memory' },
  { id: 'packing', name: '少算填充位置', label: 'Padding-free / Packing', title: '用有效样本填满计算位置', intro: '常规批处理会把短样本补到同批最长样本的长度。Padding-free 或 packing 减少这种空位，同时正确保留样本边界。', steps: [['统计样本实际长度', '找到短样本补齐所产生的浪费。'], ['组织紧凑的序列', '减少补齐，或把样本组织到更紧凑的计算布局中。'], ['保留掩码与位置关系', '避免一条训练样本读取另一条样本。']], effect: '短样本多、长度差异大时更有价值。全是等长样本时收益会缩小。', detail: '显式 packing 可能改变每步有效 token 数和损失统计方式，比较训练结果时应固定数据、步数、有效批量及归一化口径。', source: 'packing' },
  { id: 'rollout', name: '复用 RL 资源', label: 'vLLM / Standby', title: '生成与更新交替进行，资源也可以交替使用', intro: '强化学习需要先生成候选结果，再评分并更新模型。推理缓存与训练激活如果同时保留，会显著抬高显存占用。', steps: [['生成候选回答', '用支持的推理引擎完成 rollout。'], ['计算奖励并更新', '奖励规则或验证器提供训练信号。'], ['共享权重并调度缓存', '支持的 vLLM 路径复用权重空间，Standby 调整缓存生命周期。']], effect: '减少重复权重和阶段切换开销，给生成长度或训练资源腾空间。', detail: '奖励如何定义仍然决定模型学到什么。降低训练成本不会自动产生可靠的推理能力，也不能代替任务测试。', source: 'rl' },
  { id: 'quant', name: '压缩运行权重', label: 'GGUF / FP8 / INT8', title: '用更紧凑的数字表示已有权重', intro: '量化降低存储精度，使部分模型更容易在本地运行。动态混合精度会为不同部分选择不同精度，以平衡体积与数值差异。', steps: [['选择支持的量化版本', '精度、模型架构与运行后端要匹配。'], ['保留敏感部分', '具体方案可以让部分层或参数保持较高精度。'], ['重新评估输出', '检查生成质量、速度和完整运行内存。']], effect: '主要服务存储与运行成本；量化本身不把新任务教给模型。', detail: '推理用的量化文件不能直接当作训练用底座。例如当前 H3 训练路径拒绝 FP8 / MXFP8 基础精度，允许的训练配置与 FP8 推理版本不同。', source: 'train-common' },
];
export const scenarios = [
  { id: 'service', title: '客服话术与任务流程', category: '适合微调', method: '先整理高质量样例，再做 SFT / LoRA', input: '用户请求、业务上下文、理想回复；涉及政策时同时准备可检索资料。', goal: '让模型更倾向于遵守回答结构、术语和服务步骤。', path: ['历史案例清洗', '划分训练 / 测试集', 'LoRA 微调', '业务评估'], caution: '风格变得一致不代表业务事实就正确。政策、价格与库存等动态信息仍应从外部系统取。', example: '“订单延迟怎么办？” → 按公司的解释、核查和补救步骤组织回复。' },
  { id: 'extract', title: '分类与结构化抽取', category: '适合微调', method: '用明确的输入输出标准做任务微调', input: '待处理文本、分类标签或字段 schema、人工核对后的正确输出。', goal: '提高字段格式与特定任务表现，便于接入应用。', path: ['定义字段 / 标签', '标注代表性样例', '训练与评估', '格式校验'], caution: '接口仍应做 JSON 解析、字段校验与失败处理。先验证提示词方案，确认微调能带来实际增益。', example: '订单描述 → 商品、数量、地址；工单内容 → 问题类别。' },
  { id: 'docs', title: '经常更新的公司文档', category: '优先考虑 RAG', method: '检索最新资料，按需叠加行为微调', input: '带版本和权限的文档、切分与检索规则、引用与答案评估集。', goal: '回答时找到相关材料，并把依据提供给用户。', path: ['文档入库', '检索相关片段', '模型组织回答', '检查引用'], caution: 'RAG 在回答时提供上下文，通常不改变模型权重。Unsloth 工作台有相关能力，但检索质量和权限边界仍需设计。', example: '“本月报销标准是什么？” → 检索当前制度后回答。' },
  { id: 'code', title: '代码规范与可验证任务', category: 'SFT / RL', method: '先训练样例；奖励可靠时再做强化学习', input: '代码规范与参考实现；测试、编译检查或其他可信验证器。', goal: '适配代码风格，或改善能被准确评分的任务表现。', path: ['准备参考实现', 'SFT 基线', '测试 / 奖励评分', '独立任务验证'], caution: '需要防止模型学会钻奖励规则的空子。未见过的任务、正确性和原有能力都要测。', example: '生成函数 → 执行测试 → 根据结果提供训练信号。' },
  { id: 'video', title: 'H3 品牌音视频风格', category: 'H3 LoRA', method: '带声音的短视频 + 文字描述，训练适配器', input: '有有效音轨的视频文件与 caption，预先切片使内容和文字对应。', goal: '尝试学习特定内容、画面与声音特征；效果需生成实测。', path: ['素材切片与描述', '加载 H3 基础权重', '音视频 LoRA', '新提示词评估'], caution: '当前固定训练窗约 0.92 秒，整流程资源参考约 80GB+。不能把它当作完整长视频理解或剪辑方案。', example: '带声音的产品近景短片 + 描述 → 风格适配器。' },
  { id: 'scratch', title: '从零造一个新模型', category: '需要独立训练工程', method: '先定义模型、数据与训练方案，单独验证工具适配', input: '架构、随机初始化、编码器或 tokenizer、足量数据、训练目标、分布式方案。', goal: '从数据中学习基础能力，而不是继承现成模型的能力。', path: ['架构与数据设计', '初始化与训练实现', '规模化预训练', '评估与后训练'], caution: '本次没有核实 Unsloth 的通用随机初始化训练入口。H3 已确认的现成训练路径是微调；若自行改造从零训练，需额外实现并验证。', example: '先在小模型上验证训练管线，再决定是否扩大规模。' },
];
export const faqs = [
  ['它的核心价值到底是什么？', '让已经存在的模型更便宜、更方便地训练和运行。对于业务定制，价值是缩短实验周期、降低显存需求；最终任务效果由基础模型、数据、训练方案和评估共同决定。'],
  ['“只能加载或者二次训练”这样说对吗？', '可以用它描述本次确认的主要使用方式，尤其是 H3 的现成路径。但对整个 Unsloth 下“绝对不能从零训练”的结论过于宽泛。需要区分公开的完整工作流、某个模型的适配，以及自己修改后可能实现的训练工程。'],
  ['“加重”是不是指加载权重？', '这里按“加载模型权重”理解：把训练好的参数读到运行环境中。加载、量化和训练是三件事。只有进入参数更新过程，模型才在训练意义上学习新的数据。'],
  ['全参数微调是不是从零训练？', '不是同一个起点。全参数微调可以更新整个已有模型，而从零训练通常从随机参数开始。更新多少参数和参数最初从哪里来，是两个不同维度。'],
  ['训练完是否得到一份独立模型？', 'LoRA 常得到一份适配器，运行时还需要对应基础模型。部分模型支持合并权重；是否能合并、导出到目标格式和加载到运行后端，需要逐个确认。'],
  ['上传 PDF 就会自动学会全部内容吗？', 'PDF 可以作为数据来源，也可以参与检索。训练还需要提取、清洗、定义任务与评估。频繁变化的事实通常更适合通过检索或业务接口提供；微调可以叠加学习回答方式。'],
  ['可以训练我通过 API 使用的模型吗？', '远程生成接口只提供调用能力。Unsloth 的本地权重训练需要能获取并加载兼容权重。供应商若提供专门微调服务，应遵循它的接口与支持范围。'],
  ['压缩版 H3 体积小，训练就一定轻吗？', '推理量化文件、训练底座和全流程内存是不同口径。H3 还有文本编码器、视觉 / 音频 VAE、激活与优化器状态。仅查看某个去噪器文件大小会低估资源需求。'],
  ['官方“2 倍速度、少 70% 显存”能直接套用吗？', '这是官方特定条件下的宣传与测试结果，本项目没有 GPU 实测。比较时要记录模型、GPU、软件版本、精度、长度、有效批量、数据与基线；不能把不同优化的倍率直接相乘。'],
  ['二次开发和二次训练有什么区别？', '二次开发是写网页、接口、工具和业务流程，可以不改模型参数；二次训练是根据数据或奖励更新模型参数。两者可以结合，但解决的问题不同。'],
];
