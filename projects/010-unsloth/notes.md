# Unsloth 研究笔记

## 研究范围与版本

阅读日期：2026-10-09。固定提交：`f9718db128218f43b7e0b03604baa4a9a6633028`。本项目执行文档、源码和网页研究，没有执行 Unsloth 模型运行、下载或 GPU 训练。

目标是回答：它的价值、能力、原理和场景是什么；“只能二次训练”是否准确；它能对 MiniMax H3 做什么。完整来源保存在 `web/content.js`。

## 从问题到结论

### 1. 不混用“从零”“全参数”“预训练”

从零是参数起点的问题；全参数是更新范围的问题；继续预训练是已有能力上继续学习原始语料的训练目标。Unsloth README 总体声明预训练和全参数微调，官方 continued-pretraining 教程从已有 Mistral 模型开始。不能由这些材料直接推导出通用随机初始化入口。

因此网页使用“本次未核实通用从零训练完整入口”的可复核措辞。H3 的已确认训练路径直接读取预训练权重，其二次训练性质由实现决定。

### 2. 效率来自多层组合

- `unsloth/models/llama.py`：模型适配与前向补丁。
- `unsloth/kernels/fast_lora.py`：LoRA_MLP / LoRA_QKV、自定义 autograd、梯度与张量复用；不支持的配置可能回退。
- `unsloth/kernels/cross_entropy_loss.py`：Triton 损失计算与分块 logsumexp。
- 官方文档：融合 RoPE、padding-free、packing、检查点、激活卸载、分块 LM head / MLP、vLLM 资源复用与 Standby。

LoRA / QLoRA 方法来自对应论文；Unsloth 对计算和训练流程做额外优化。减少参数、显存峰值、填充位置和运行文件体积是不同指标，不能统一换算为速度倍率。

### 3. H3 的训练支持要读专门路径

`studio/backend/core/training/diffusion_train_common.py` 将 `minimax-h3` 路由到专门训练器。`diffusion_h3_trainer.py` 提供 `run_h3_lora_training`，加载基础权重，冻结基础参数，向 Attention 与 MLP 添加适配器，联合优化音视频目标。其 caption 编码器先运行，随后释放，再进入 VAE / Transformer 训练阶段。

`diffusion_h3_clips.py` 配对视频与 caption 文件 / JSONL；检查有效音轨并拒绝静音。当前固定窗口为 22 帧、24fps，约 0.92 秒；长片只取开头，必须把切片和描述对齐。

公共配置要求 H3 使用 bf16、批量 1；可梯度累积；拒绝 FP8 / MXFP8 训练配置。NF4 / INT8 / BF16 训练路径与 FP8 推理权重不能混为一谈。当前没有完整周期检查点与恢复支持。

公共源码的资源说明给出整流程约 80GB+ 参考：caption 编码器阶段峰值可高于后面的训练循环。网页不把某个量化文件体积解释成整次训练显存，也不把上述数字写成我们的测试结果。

### 4. H3 开放范围与用途

MiniMax 官方模型卡把 Context-IR、H3-Base、2K 再生成模块组成完整系统；开放基础权重与全部在线能力不是同一范围。生成视频与声音也不等于拥有一般聊天模型能力。品牌风格适配是本项目基于训练机制的应用设想，没有宣称已完成效果实验。

### 5. 许可范围

根 Core 许可为 Apache-2.0；Studio 包含 AGPL-3.0，H3 训练文件也有对应声明。模型权重另看模型卡和自己的许可。网页未复制上游实现或素材。

## 网页验证记录

环境：Windows / PowerShell，Node.js 22.15.0，npm 10.9.2。独立静态构建，无第三方依赖。生产子路径为 `/1008_codex_project/010-unsloth/`。

2026-10-09 执行 `npm.cmd ci`、`npm.cmd run build`，生产构建通过。使用已有 Playwright 1.62.1 和本机 Edge，无头浏览器执行 `src/verify-web.mjs`，结果全部通过：

| 检查 | 结果 |
| --- | --- |
| 完整内容 | 10 个章节、8 种处理、24 项来源，内部链接目标存在 |
| 机制 / 场景切换 | 全部 12 个面板可切换；Home / End / 方向键可用 |
| 链接与历史 | `#scenario-docs`、`#principle-kernels` 可直接打开；刷新、返回恢复对应面板 |
| LoRA 计算 | 初始 0.78%；维度 2048、秩 128 时增量 524,288、比例 12.50% |
| 填充计算 | 等长 0.0%；500 / 1000 为 25.0%；长度交换与无效输入有对应提示 |
| 文档与详情 | FAQ、H3 详情、来源 JSON 与研究文档可访问 |
| 响应式 | 1440 / 1024 / 768 / 390 / 320px 无整页横向溢出；手机场景切换可用 |
| 无脚本阅读 | 禁用 JavaScript 后全部 12 个面板和说明仍可阅读 |
| 错误与资源 | 无页面脚本错误、失败请求或 400+ 资源响应 |

真实截图保存为 `assets/cover.png`（1440 × 1000）和 `assets/mobile.png`（390 × 844），已人工查看排版。可选浏览器检查需设置 `PLAYWRIGHT_PACKAGE` 为已有安装目录，再执行 `node projects/010-unsloth/src/verify-web.mjs`；不用它也能构建和打开网页。根索引执行 `npm.cmd run index:build` 与 `npm.cmd run check`，11 个项目的编号、目录、元数据、图片路径和首页一致，检查通过。根索引工具未改动。

这些检查只验证研究网页，未验证 GPU 模型能力。

## 2026-10-09 · 能力全景图补充

用户要求用一张图汇总能力、原理、优点、模型、场景、价值与对自己的意义。首先校正“微调但不支持训练”的概念：微调也是训练，随机初始化的从零训练需要另外核实。补充核对官方模型目录、视觉与语音微调说明，网页来源从 24 项增为 26 项。

内置 `image_gen` 首次请求返回 `image generation failed: network error: error sending request`，没有得到图片。实际提示词保存为 `assets/unsloth-overview-imagegen-attempt.txt`；没有使用需要 API 密钥的备用 CLI。最终采用原创 HTML / CSS 精确排版，通过本机 Microsoft Edge / Playwright 导出单张 2400 × 5091 PNG，约 1.46MB。图稿、文字与来源、制作说明、导出记录和 SHA-256 均在 `assets/`，导出脚本为 `web/scripts/render-overview.mjs`。

导出检查：八个模块、七类模型行、关键公式和限定条件完整；零文字横向溢出、零页面错误。已查看完整实际图片，中文、模型名、单矩阵 0.78% 示意、H3 22 帧与资源参考、八模块内容均可读。对个人的意义依据本仓库的 GitHub 研究与网页原型提出，属于应用判断，没有实施模型实验。

网页新增可展开图片与原图 / 文字下载，`#overview-map` 自动展开并定位。独立生产构建、更新后的真实浏览器检查和根 `npm.cmd run check` 均通过；验证了 2400 × 5091 原图解码、三项下载资源、桌面与 320～390px 手机排版、原有交互与无 JavaScript 阅读。仍未执行 GPU 训练。

## 后续独立实验方向

选一个明确受支持的小型开源模型，准备真实任务样例，测提示词基线和 LoRA 后的独立测试集结果，记录模型 / 数据 / 精度 / 软件版本及峰值资源。H3 另需对应大显存设备、有效音视频素材与专门训练验证，不与网页完成状态混同。

## 2026-10-12 · 完整理解、原图复用与统一发布

用户明确要求整理完整理解、部署网页并提交远端。使用单独的 Git worktree 从 origin/main 整理，仅带入 010，不将其他尚未提交的研究项目一并公开。新增十二项索引摘要、图前六段介绍、八个职责模块、七类代表模型、六项价值、四条复用路线、三步实践与八项扩展；每项扩展附输入、交付与验收。它们由 publication.mjs 供网页、JSON 和 Markdown 共同生成，索引一致性有审计。

沿用原图而未运行图像生成或重新导出：2400 × 5091，1,457,393 字节，SHA-256 `60cb16a2becaafa153668e0a585cac4a95fda470285dda55f438380c4921918f`。增加 map.html 原图阅读器，正文保持完整图片；旧 #overview-map 链接仍可定位。

Microsoft Edge / Playwright 真实浏览器核验通过：十八章、模块 / 模型 / 扩展覆盖、全部机制与场景切换和键盘操作、片段直开 / 刷新 / 返回、两个计算器正常与异常输入、FAQ 与 H3 详情、原图解码 / SHA-256 / 50% / 100% / 适合宽度、五档屏宽、无脚本阅读、资料下载。无脚本错误或失败资源；真实桌面和手机截图已查看。完整逐项记录在 verification.json。

独立构建、项目静态审计、根目录 npm run check 与 15 项 npm test 通过；统一发布构建和全部项目检查以实际记录为准。部署后的公开链接、工作流和资源检查另记在 src/publication-verification.json。网页验证不代表 GPU 模型运行、训练效果或官方性能倍率被复现；通用随机初始化训练流程仍未核实。

## 2026-10-12 · 公开部署验证

内容提交 771d863 已推送 main，GitHub Pages 工作流 38236966981 的 build / deploy 成功。公开网页为 https://yydshly.github.io/1008_codex_project/010-unsloth/，图阅读器为 https://yydshly.github.io/1008_codex_project/010-unsloth/map.html。HTTPS 验证通过 29 个入口与资源（含全部既有九个子项目），下载原图 SHA-256 一致；线上 Microsoft Edge 再次通过完整交互、五档屏宽和无 JavaScript 检查，没有失败请求或脚本错误。核验完成后登记 demo，并提交发布记录；未追加模型或 GPU 实验。
