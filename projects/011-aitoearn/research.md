# AiToEarn 能力、原理、场景与个人价值研究

研究日期：2026-10-09。上游：[yikart/AiToEarn](https://github.com/yikart/AiToEarn)。固定提交：`3581f511293236044e56fad67958cfcea0def6b5`。许可证：MIT，Copyright (c) 2025 AiToEarn。

本文件由原创结构化研究数据web/content.js生成，与网页保持一致。研究范围包含32项能力、13个技能、14个平台，固定来源清单见src/source-manifest.json。网页和本文包含源码研究与解释，以及新增的3张真实图像生成与本地草稿实测；尚未运行原后台、外部云加工或真实社交账号发布。

## 1. 核心结论

AiToEarn面向一人公司、个人创作者、商家、品牌和代运营，组织创作、分发、互动与推广交付。它的本质可以理解为“多个能力步骤组合成媒体工作流”，完整实现还包括Agent调度、Skills流程知识、MCP/执行工具与业务后台。

Skills描述怎么做，Agent选择和编排，工具调用模型和执行程序，后台管理账号、素材、草稿、队列、任务与状态。复制技能文件本身不能取得外部模型、云剪辑、账号授权或发布服务。

内容输出效果、平台执行结果与营销效果应分别判断：生成任务可产出媒体或URL，发布服务可创建与追踪任务；画质和事实需查看成品，曝光与收入需要真实业务反馈。

## 2. 全量能力清单

### 01. 标题、正文与话题

分类：内容创作。证据：源码可见。

把主题或素材整理成配套发布文案。

- 输入：主题、商品事实、语言、语气与字数要求。
- 输出：标题、正文、话题标签，与媒体一起保存为草稿。
- 实现：规划模型输出结构化字段；媒体提示词与文案提示词分开处理。
- 效果与边界：字段长度和语气可约束；事实、价格与营销表述需核对。
- 原创需求示例：为这个开源项目写一篇中文介绍，强调使用场景，结尾邀请讨论。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/draft-generation/draft-generation-planner.service.ts)。

### 02. AI 图片与参考图创作

分类：内容创作。证据：源码可见。

生成产品图、海报、场景图、插画和封面。

- 输入：文字描述、参考图片、比例、分辨率与模型。
- 输出：图片地址及图文草稿，可继续加工。
- 实现：Agent 图片工具接 Gemini；批量草稿另有 Gemini / OpenAI 生成与编辑路径。
- 效果与边界：1K / 2K / 4K 是请求参数，实际支持由模型决定；品牌细节和图片文字需查看成品。
- 原创需求示例：以真实产品照片为参考，制作三张不同场景的宣传图。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/media.mcp.ts)。

### 03. 文生视频、图生视频

分类：内容创作。证据：源码可见。

把描述或参考图制作成短视频片段。

- 输入：描述、参考图、时长、比例、分辨率。
- 输出：生成任务 ID、状态和完成后的视频地址。
- 实现：工具调用 Grok / Sora 等外部模型，异步查询结果；可用模型由各入口配置决定。
- 效果与边界：当前 v2 草稿时长字段是 1—15 秒；其他工具路径有自己的约束。长片需要分段制作。
- 原创需求示例：用这张咖啡照片做一段竖屏展示，镜头缓慢推进。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/media.mcp.ts)。

### 04. 批量图文与视频草稿

分类：内容创作。证据：源码可见。

一次准备多条内容及配套文案。

- 输入：生成数量、媒体模型、规划模型、素材与目标平台。
- 输出：多条独立草稿和任务记录，每条包含媒体与文案。
- 实现：草稿生成服务创建队列任务，规划后调用媒体服务，完成后保存结果。
- 效果与边界：每次 1—10 条草稿；每条图文 1—9 张图。批量数量不等于同时执行数量。
- 原创需求示例：生成五组图文，每组三张图片，分别突出功能、场景和使用体验。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/libs/aitoearn-ai-shared/src/dtos/draft-generation.dto.ts)。

### 05. 历史创作偏好

分类：内容创作。证据：源码可见。

把近期创作记录摘要成可复用偏好。

- 输入：近期成功生成的记录和素材。
- 输出：按图文 / 视频分类的简短记忆条目。
- 实现：读取近 90 天样本，规划模型提炼最多 20 条摘要，再作为后续规划上下文。
- 效果与边界：当前接口默认 disableMemory=true；这是一层上下文摘要，不代表模型重新训练。
- 原创需求示例：后续内容沿用之前的简洁语气与产品主题。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/draft-generation/draft-generation-memory.service.ts)。

### 06. 图片合成与精确加工

分类：媒体加工。证据：源码可见。

添加已有 Logo、二维码、水印，调整图像。

- 输入：底图、图层、像素位置或锚点、目标尺寸。
- 输出：加工后的 PNG 图片。
- 实现：Sharp 执行合成、裁剪、缩放、旋转、翻转、亮度和饱和度调整、锐化与模糊。
- 效果与边界：常规图像加工与生成式改图是两条路径；需要输入可访问图片。
- 原创需求示例：把 Logo 放在左上角、二维码放在右下角，再输出方形版本。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/image-edit.mcp.ts)。

### 07. 轨道式视频剪辑

分类：媒体加工。证据：源码可见。

组织片段、文字、图片、音频和转场。

- 输入：视频源、画布尺寸、时间轨道与输出设置。
- 输出：云渲染后的视频地址。
- 实现：视频先上传取得 VID，再构造二维 Track，调用火山引擎云剪辑 API。
- 效果与边界：需要云服务配置；时间、尺寸和层级需要正确表达，渲染耗时随素材变化。
- 原创需求示例：保留片段 A 的前五秒，再接片段 B，叠加活动标题和背景音乐。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/volcengine/video-edit.mcp.ts)。

### 08. 多素材合成

分类：媒体加工。证据：源码可见。

图片成片、多个视频拼接、音视频合并。

- 输入：多张图片 / 多段视频 / 音频地址和处理要求。
- 输出：合成后的视频地址。
- 实现：自然语言提交 Aideo 处理任务，拿任务 ID 后轮询；精细剪辑可用 Track 路径。
- 效果与边界：处理由外部云服务完成；技能中的耗时估计不是本地性能实测。
- 原创需求示例：把五张店内照片做成展示视频，每张停留三秒。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/volcengine/aideo.mcp.ts)。

### 09. 视频理解与高光提取

分类：媒体加工。证据：源码可见。

理解视频内容，并组织摘要或精彩片段。

- 输入：源视频地址与摘要 / 高光要求。
- 输出：摘要、关键词、剧情分析，或高光片段地址数组。
- 实现：Aideo 多模态处理服务按任务类型返回结构化分析或媒体结果。
- 效果与边界：工具描述的视频理解上限为两小时；提取的片段是否合适需要观看判断。
- 原创需求示例：从产品讲解视频中提炼卖点，并找出三个适合短视频的片段。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/volcengine/aideo.mcp.ts)。

### 10. 翻译配音与字幕本地化

分类：媒体加工。证据：源码可见。

把已有视频转成其他语言版本。

- 输入：源视频、目标语言和处理要求。
- 输出：翻译后的视频；工具说明包含声音特征保留与口型同步。
- 实现：Aideo 根据要求执行 ASR、OCR 或视觉识别，再组织翻译及媒体处理。
- 效果与边界：有工具接入；翻译、音色、口型和字幕质量取决于外部服务与素材清晰度。
- 原创需求示例：把中文产品介绍转换成英文版，保留自然语气。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/volcengine/aideo.mcp.ts)。

### 11. 硬字幕擦除

分类：媒体加工。证据：源码可见。

为重新配字幕准备更干净的画面。

- 输入：包含烧录字幕的源视频。
- 输出：经字幕区域修复后的视频。
- 实现：Aideo 通过识别文本区域和 AI 画面修复处理。
- 效果与边界：复杂背景、移动字幕和纹理可能影响修复质量；本研究未验证成片。
- 原创需求示例：去掉底部已有字幕，准备加入新的双语字幕。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/volcengine/aideo.mcp.ts)。

### 12. 视频风格转换

分类：媒体加工。证据：源码可见。

将实拍视频转换成漫画、日漫或 3D 卡通风格。

- 输入：视频地址 / VID、风格与输出分辨率。
- 输出：风格化视频地址及 VID。
- 实现：调用火山引擎风格转换任务，轮询完成结果。
- 效果与边界：要求清晰主体与较好光照；风格一致性和帧间稳定程度需要实测。
- 原创需求示例：把一段场景实拍转换成漫画风。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/volcengine/style-transfer.mcp.ts)。

### 13. 影视解说与旁白

分类：媒体加工。证据：源码可见。

根据视频素材制作带解说的成片。

- 输入：多个视频、可选解说稿、声音与叙述风格。
- 输出：旁白解说视频，支持批量版本参数。
- 实现：云服务生成或使用解说稿，合成 TTS 旁白并组织剪辑。
- 效果与边界：属于外部服务能力；素材权利与叙事质量需要在实际项目中核对。
- 原创需求示例：用自己的故事素材制作一段悬疑风旁白介绍。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/volcengine/drama-recap.mcp.ts)。

### 14. 视频封面与媒体探测

分类：媒体加工。证据：源码可见。

抽取画面，查询时长、宽高等素材信息。

- 输入：视频 URL 和抽帧时间点。
- 输出：封面 PNG 地址、时长与尺寸等元数据。
- 实现：当前工具通过 ffmpeg 抽帧并上传；同时有上传获取 VID 和媒体探测工具。
- 效果与边界：封面技能仍描述旧任务接口；当前应使用 extractThumbnail。
- 原创需求示例：取第三秒作为封面，核对竖屏比例与时长。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/video-utils.mcp.ts)。

### 15. 按社媒链接采集

分类：素材管理。证据：待核验。

技能说明描述了按作品链接获取视频、图片与元数据。

- 输入：B站、YouTube、抖音等作品链接。
- 输出：文档预期返回媒体、标题、标签和封面。
- 实现：技能引用 createCrawlTask / getCrawlTaskStatus。
- 效果与边界：当前 Agent 注册工具和参考目录中未找到对应采集工具；不能当作已可用入口。
- 原创需求示例：获取自己已发布作品的素材以便后续整理。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/crawling-social-media/SKILL.md)。

### 16. 媒体库与分组

分类：素材管理。证据：源码可见。

集中组织图片、视频和音频素材。

- 输入：上传或生成的媒体、分组名称与描述。
- 输出：媒体 ID、分组、元数据及可复用素材。
- 实现：内容 MCP 与素材管理接口负责保存、分组、转移、查询和删除。
- 效果与边界：上传、存储和外部素材可访问性需要配置；数据字段不代表所有界面已完整开放。
- 原创需求示例：按项目建立产品图、录屏和封面三个媒体组。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts)。

### 17. 草稿箱与已有视频转草稿

分类：素材管理。证据：源码可见。

把媒体和文案组织成待发布内容。

- 输入：已有视频 / 图片、标题、正文、话题与兼容平台。
- 输出：草稿 ID、媒体列表和发布元数据。
- 实现：支持生成结果保存，或分析已有视频后生成文案并创建草稿。
- 效果与边界：视频转草稿属于内容分析；发布前还需目标平台校验与账号授权。
- 原创需求示例：把项目演示录屏变成带中文介绍的发布草稿。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/draft-generation/draft-generation.service.ts)。

### 18. 账号分组与授权管理

分类：发布与账号。证据：源码可见。

按品牌、项目或渠道组织多个账号。

- 输入：OAuth、扫码或插件登录的账号。
- 输出：账号资料、分组、排序与授权状态。
- 实现：账号仓库、分组服务和各平台 AuthProvider 处理持久化及授权。
- 效果与边界：授权方式按平台不同；账号未绑定或过期时需要用户操作。
- 原创需求示例：把研究账号与门店账号放在不同分组。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/accounts/account-group.service.ts)。

### 19. 多平台发布流程

分类：发布与账号。证据：源码可见。

用一份内容创建多个目标账号的独立任务。

- 输入：统一内容、目标账号列表及平台覆盖字段。
- 输出：Flow ID、任务 ID、发布记录及作品链接。
- 实现：先验证账号归属、准备媒体、检查平台规则，再创建记录并入队。
- 效果与边界：平台接口、插件或用户接续流程各不相同；创建任务不等于平台发布成功。
- 原创需求示例：同一演示视频分别发布到 YouTube 与 B站，设置各自标题。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/publish/flows/publish-flow.service.ts)。

### 20. 日历排期与任务调整

分类：发布与账号。证据：源码可见。

集中安排时间，查看和管理发布任务。

- 输入：草稿、目标账号、发布时间。
- 输出：立即 / 延迟发布任务，可改时间、取消或立即执行。
- 实现：Redis / BullMQ 延迟任务与发布状态服务共同执行。
- 效果与边界：插件或用户接续平台还需要相应运行环境；取消与更新支持也按平台不同。
- 原创需求示例：一周内容分布在周二、周四、周六发布。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/publish/tasks/publish-queue.service.ts)。

### 21. 平台规则与媒体适配

分类：发布与账号。证据：源码可见。

在分发前检查文案和素材是否符合要求。

- 输入：正文、图片 / 视频、目标平台及适配选项。
- 输出：校验问题、兼容平台结果、转换后的部分图片。
- 实现：平台元数据包含内容模式、长度和媒体规则；Sharp 可转换格式和限制尺寸。
- 效果与边界：只覆盖已实现规则，不能自动保证审核通过；不同入口的约束可能有差异。
- 原创需求示例：检查小红书标题长度，把图片转成目标平台支持的格式。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/media/media.service.ts)。

### 22. 状态跟踪与失败处理

分类：发布与账号。证据：源码可见。

追踪异步任务，区分成功、失败和等待用户。

- 输入：任务 ID、平台响应、失败原因。
- 输出：发布状态、错误信息、可重试记录。
- 实现：状态转换避免重复处理；可重试发布最多执行三次，包含凭据刷新及结果轮询。
- 效果与边界：不可重试错误需修正输入或授权；外部故障与内容审核仍可能阻塞。
- 原创需求示例：查看失败原因，补授权后再安排发布。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/publish/tasks/publish-task.service.ts)。

### 23. 点赞、评论、收藏与关注

分类：互动运营。证据：源码可见。

通过已接入渠道执行运营动作。

- 输入：作品、评论、目标账号和互动内容。
- 输出：平台动作结果及记录。
- 实现：插件路径通过浏览器执行或代理请求；X 后端有完整的回复、点赞、书签、转发、引用与关注工具。
- 效果与边界：具体动作按平台不同；抖音评论列表仍标开发中，小红书详情入口已移除。
- 原创需求示例：在自己的作品评论中回答具体使用问题。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/twitter/twitter-engagement.provider.ts)。

### 24. AI 回复与购买意向识别

分类：互动运营。证据：官方描述。

官方介绍了针对评论生成回复及识别购买信号。

- 输入：评论文本、品牌信息与回复要求。
- 输出：预期产生针对性回复与需要响应的线索。
- 实现：模型理解评论，再通过互动工具执行；README 描述求链接、怎么购买等信号。
- 效果与边界：持续运行覆盖、分类准确率和全平台自动回复链路未做实测。
- 原创需求示例：整理询问价格和购买方式的评论，生成有针对性的回复。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/README.md)。

### 25. 品牌讨论监测

分类：互动运营。证据：官方描述。

官方介绍了追踪品牌讨论与主动参与。

- 输入：品牌名称和监测范围。
- 输出：预期产生讨论线索与互动机会。
- 实现：产品介绍提出监测目标；底层接入需检索 / 评论读取 / 自动任务共同完成。
- 效果与边界：当前参考源码未确认完整持续监测链路；不等于全网实时舆情系统。
- 原创需求示例：发现用户提到自己的品牌并组织回应。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/README.md)。

### 26. 账号、作品指标与快照

分类：数据分析。证据：源码可见。

查询平台能够提供的运营数据。

- 输入：账号 / 作品与统计请求。
- 输出：播放、曝光、触达、点赞、收藏、评论、分享、点击、观看时长等可选指标。
- 实现：各平台 AnalyticsProvider 取得数据后映射统一字段，保存快照和获取时间。
- 效果与边界：大部分指标可选；字段存在不代表每个平台都能取到。部分作品数据依赖爬取服务。
- 原创需求示例：比较教程视频与场景演示的收藏和观看表现。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/analytics/analytics.vo.ts)。

### 27. 作品查询与归属验证

分类：数据分析。证据：源码可见。

把发布记录与平台真实作品关联。

- 输入：账号、作品 ID 或作品链接。
- 输出：作品列表、详情、链接解析和归属结果。
- 实现：渠道 WorkProvider 与 MCP 暴露查询及归属验证。
- 效果与边界：读取范围由平台权限与实现决定；某插件详情缺失不代表其他路径也可用。
- 原创需求示例：核对提交的作品链接是否属于对应账号。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/mcp/channels.mcp.controller.ts)。

### 28. MCP 与外部 AI 助手

分类：集成与部署。证据：源码可见。

把发布和管理能力提供给其他助手调用。

- 输入：API Key、MCP 地址和工具请求。
- 输出：结构化工具结果，如草稿、发布任务和分析数据。
- 实现：统一 MCP 提供 HTTP / SSE 入口；工具参数使用 Schema 描述。
- 效果与边界：助手必须兼容协议，Key 与中国 / 国际环境需匹配。
- 原创需求示例：在兼容 MCP 的助手里查询草稿，再创建指定账号的发布流程。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/mcp/channels.mcp.controller.ts)。

### 29. OpenClaw 接入

分类：集成与部署。证据：官方描述。

官方提供插件安装方式用于任务执行。

- 输入：OpenClaw 环境、区域与官方 API Key。
- 输出：通过 OpenClaw 调用平台任务。
- 实现：README 提供 @aitoearn/openclaw-plugin-cli 安装入口。
- 效果与边界：插件服务与平台任务需实际连接；本研究未运行安装器。
- 原创需求示例：在已有 OpenClaw 工作流中接收并组织推广任务。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/README.md)。

### 30. 私有部署与服务配置

分类：集成与部署。证据：源码可见。

部署自己的素材、草稿和发布管理界面。

- 输入：Docker、服务配置、存储及外部服务凭据。
- 输出：Next.js 前端、业务后端、AI 服务和持久化基础设施。
- 实现：Compose 组合 Nginx、Web、Server、AI、MongoDB、Redis 和 RustFS。
- 效果与边界：启动界面之后还需要模型与渠道配置；官方交易订单和流量不会因部署自动产生。
- 原创需求示例：先部署草稿与素材管理，再接入一个真实发布渠道。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/DOCKER_DEPLOYMENT_CN.md)。

### 31. Server Relay 与 AI Relay

分类：集成与部署。证据：源码可见。

使用中转服务降低接入配置工作量。

- 输入：官方区域匹配的 Key、中转 API 地址。
- 输出：平台授权 / 发布中转，或官方提供的模型调用。
- 实现：Server Relay 与 AI Relay 分开配置；也可按服务填写自己的模型凭据。
- 效果与边界：中转会调用外部服务；可用能力、额度和费用需在所选服务核对。
- 原创需求示例：先通过 Relay 完成测试，再判断是否独立配置渠道凭据。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/DOCKER_DEPLOYMENT_CN.md)。

### 32. 推广任务、提交与结算

分类：推广变现。证据：官方描述。

官方平台连接商家任务和创作者内容。

- 输入：商家需求、作品链接与任务证明。
- 输出：任务申请、提交、审核及结算业务记录。
- 实现：README 提出 CPS / CPE / CPM；仓库旧 Electron 服务中有任务提交及钱包记录实现。
- 效果与边界：不能把旧服务模块等同于当前 Web 完整市场；实际收入取决于订单、效果和审核。
- 原创需求示例：交付商家要求的推广内容，提交作品链接进入审核。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-electron/server/src/modules/task/user-task.service.ts)。

## 3. 全部技能

### 1. 图片生成 · generating-images

描述场景、风格和构图；可传比例、1K/2K/4K和参考图片。Agent 的这条路径使用 Gemini。

- 产出：图片 URL、参考图衍生图
- 工具：`generateImage`
- 核对状态：已找到对应工具

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/generating-images/SKILL.md)。

### 2. 视频生成 · generating-videos

技能默认 Grok，1—15秒。长视频建议生成片段后拼接；其他入口和模型有独立配置。

- 产出：异步生成的短视频
- 工具：`generateVideoWithGrok / getGrokVideoStatus`
- 核对状态：已找到对应工具

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/generating-videos/SKILL.md)。

### 3. 图片编辑 · editing-images

Sharp 精确加工已有图像；支持图层位置、透明度和缩放。

- 产出：合成、裁剪和调色图片
- 工具：`compositeImages / resizeImage / transformImage / adjustImage / getImageMetadata`
- 核对状态：已找到对应工具

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/editing-images/SKILL.md)。

### 4. 视频剪辑 · editing-videos

火山引擎 Track 数组描述视频、图片、文字、音频、滤镜和转场，先获取素材信息与 VID。

- 产出：经过多轨渲染的视频
- 工具：`submitDirectEditTask / getVideoEditTaskStatus`
- 核对状态：已找到对应工具

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/editing-videos/SKILL.md)。

### 5. 多素材合成 · composing-videos

把自然语言与 multiInputs 提交给 Aideo；可合并图片、视频和音频。

- 产出：多图成片、片段拼接、配乐视频
- 工具：`submitAideoTask / getAideoTaskStatus`
- 核对状态：已找到对应工具

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/composing-videos/SKILL.md)。

### 6. 视频理解与高光 · analyzing-videos

视觉、音频和语言共同处理；工具说明的视频理解范围最多两小时。

- 产出：摘要、关键词、剧情分析或片段 URL
- 工具：`submitAideoTask / getAideoTaskStatus`
- 核对状态：已找到对应工具

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/analyzing-videos/SKILL.md)。

### 7. 视频翻译 · translating-videos

可按要求选择语音识别、OCR 或视觉理解；说明包含音色和口型处理。

- 产出：其他语言配音与字幕版本
- 工具：`submitAideoTask / getAideoTaskStatus`
- 核对状态：已找到对应工具

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/translating-videos/SKILL.md)。

### 8. 硬字幕擦除 · removing-subtitles

识别烧录字幕并进行画面修复，实际效果依赖背景和字幕形态。

- 产出：字幕区域修复后的视频
- 工具：`submitAideoTask / getAideoTaskStatus`
- 核对状态：已找到对应工具

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/removing-subtitles/SKILL.md)。

### 9. 视频风格转换 · transferring-video-styles

提供视频源、风格、分辨率，提交异步任务后轮询。

- 产出：漫画、日漫或 3D 卡通成片
- 工具：`submitVideoStyleTransfer / getVideoStyleTransferStatus`
- 核对状态：已找到对应工具

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/transferring-video-styles/SKILL.md)。

### 10. 影视解说 · generating-drama-recaps

支持可选解说稿、声音、叙述风格和批量数量；依赖云处理。

- 产出：脚本、合成旁白与解说视频
- 工具：`submitDramaRecapTask / getDramaRecapTaskStatus`
- 核对状态：已找到对应工具

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/generating-drama-recaps/SKILL.md)。

### 11. 媒体与草稿管理 · managing-content

查找目标组再保存生成结果；找不到指定组时使用默认组。

- 产出：媒体 ID、草稿 ID与分组记录
- 工具：`createMedia / createDraft 等内容工具`
- 核对状态：已找到对应工具

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/managing-content/SKILL.md)。

### 12. 视频封面 · extracting-thumbnails

技能引用旧 createThumbnailTask；当前实际是 ffmpeg 抽帧并上传 PNG。

- 产出：指定时刻的帧图片 URL
- 工具：`当前：extractThumbnail`
- 核对状态：文档与接口有差异

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/extracting-thumbnails/SKILL.md)。

### 13. 社媒内容采集 · crawling-social-media

初始化会复制此技能，但当前 Agent 工具注册未找到对应采集工具。

- 产出：文档描述媒体与元数据
- 工具：`文档：createCrawlTask / getCrawlTaskStatus`
- 核对状态：缺少当前工具入口

[原始 SKILL.md](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/crawling-social-media/SKILL.md)。

## 4. 发布平台

内容类型与授权方式按固定版本元数据整理。同步提交不意味着平台处理和审核已完成。微信公众号图文为HTML文章。

| 平台 | 内容 | 授权 | 完成方式 | 说明 |
| --- | --- | --- | --- | --- |
| 抖音 | 图文、视频 | 扫码 | 用户接续 | 后端返回 schema、短链接和等待操作状态；轮询最终作品。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/douyin/douyin.constants.ts) |
| 小红书 | 图文、视频 | 插件 | 插件 / 作品登记 | 后端要求 workLink；插件负责相关发布与互动。标题20、正文1000、最多9张图是该版本元数据。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/rednote/rednote.constants.ts) |
| 快手 | 视频 | OAuth | 异步查询 | 独立授权及上传发布流程。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/kwai/kwai.constants.ts) |
| 哔哩哔哩 | 视频 | OAuth | 异步查询 | 支持分区选项查询；发布过程依赖开放平台权限。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/bilibili/bilibili.constants.ts) |
| 微信视频号 | 视频 | 插件 | 异步查询 | 需对应插件和登录环境。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/wechat/wechat-channels/wechat-channels.constants.ts) |
| 微信公众号 | 图文文章 | OAuth | 异步查询 | HTML 编辑内容，文章流程不同于短视频。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/wechat/wechat-official/wechat-official.constants.ts) |
| TikTok | 图文、视频 | OAuth | 异步查询 | 参数与账号可见性受平台权限约束。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/tiktok/tiktok.constants.ts) |
| YouTube | 视频 | OAuth | 同步提交 | 元数据声明可更新作品；最终平台处理与审核仍由 YouTube 承担。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/youtube/youtube.constants.ts) |
| Instagram | 图文、视频 | OAuth | 异步查询 | 媒体格式与业务账号权限需要匹配。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/instagram/instagram.constants.ts) |
| Facebook | 文字、图文、视频 | OAuth | 同步提交 | 需可授权的目标页面 / 账号与对应权限。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/facebook/facebook.constants.ts) |
| Threads | 文字、图文、视频 | OAuth | 异步查询 | 此版本正文上限500，图片上限10。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/threads/threads.constants.ts) |
| X / Twitter | 文字、图文、视频 | OAuth | 同步提交 | 此版本正文280、图片4；后台有评论、点赞、书签、转发、引用及关注工具。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/twitter/twitter.constants.ts) |
| Pinterest | 图文、视频 | OAuth | 同步提交 | 此版本图文支持单图；元数据声明可更新作品。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/pinterest/pinterest.constants.ts) |
| LinkedIn | 文字、图文、视频 | OAuth | 同步提交 | 独立授权、内容规则与发布适配。 [规则](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/linkedin/linkedin.constants.ts) |

各平台实际权限、校验规则、动作覆盖与最终完成路径不一致。

## 5. 底层原理

### 第1层：目标与上下文

输入营销目标、真实产品信息、参考素材、目标平台和发布要求。Agent 将这些内容作为本次任务上下文，草稿规划还可加入历史偏好摘要。

例子：输入：把这次 GitHub 项目研究整理成三张介绍图和一条演示视频。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/draft-generation/draft-generation-planner.service.ts)。

### 第2层：Agent 调度

Claude Agent SDK 组织对话和工具调用；技能分析子代理识别所需能力，轮询子代理等待媒体任务。Claude Code Router 按配置路由模型。

例子：先需要文案与图片，再准备视频封面，最后检查账号和发布规则。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts)。

### 第3层：Skills 流程知识

13个技能目录会被复制到会话技能目录。Markdown 说明输入参数、步骤、工具、轮询和失败处理；技能本身不等于执行接口。

例子：图片生成技能说明参考图和比例；剪辑技能说明 Track 与画布关系。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skill-init.service.ts)。

### 第4层：MCP 与执行工具

工具通过结构化参数调用媒体模型、Sharp、ffmpeg、云剪辑和业务后端。工具结果返回任务ID、素材地址或业务记录，Agent再决定下一步。

例子：generateImage 返回图片；createChannelPublishFlow 返回发布流程与任务。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/mcp/channels.mcp.controller.ts)。

### 第5层：业务与任务状态

NestJS服务管理账号、草稿和发布记录；MongoDB持久化数据，Redis/BullMQ处理队列、延迟发布与重试，S3兼容存储保存媒体与会话。

例子：待发布 → 发布中 → 已发布 / 等待用户操作 / 失败；生成任务独立记录。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/publish/tasks/publish-task.service.ts)。

### 第6层：外部模型与渠道

生成与云加工依赖已配置的模型/服务，分发依赖各平台API、授权、浏览器插件或用户接续。任务创建后仍要跟踪最终作品结果。

例子：抖音要求用户接续；小红书使用插件；其他渠道调用开放平台接口。

[源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/douyin/douyin-publish.provider.ts)。

技术构成：Next.js界面；Claude Agent SDK、Claude Code Router和技能/轮询子代理；NestJS/Nx业务与AI服务；MongoDB持久化；Redis/BullMQ队列；RustFS/S3对象存储；Sharp图片处理、ffmpeg抽帧，以及外部生成模型与云媒体API。[部署说明](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/DOCKER_DEPLOYMENT_CN.md)、[运行时](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts)。

发布过程：校验账号与输入 → 准备媒体与平台预检 → 创建Flow/任务/记录 → 立即或延迟入队 → 平台提供器执行或等待用户接续 → 跟踪作品和状态 → 分类错误与重试。[发布流程](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/publish/flows/publish-flow.service.ts)、[发布任务](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/publish/tasks/publish-task.service.ts)。

生成和云加工通常先返回任务ID，再用状态工具轮询。生成成功、保存草稿、创建发布任务和最终发布成功是不同事件。单次Agent提示要求顺序工具执行；批量草稿走队列，实际并行受worker配置和外部限额影响。[系统提示](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts)。

### 当前批量草稿参数

- quantity：1—10，默认1；imageCount：1—9，默认3。
- 图文参考图最多14；视频入口参考图最多9，视频和音频参考各最多3。
- v2视频草稿时长1—15秒，长片分段生成或使用剪辑。
- prompt与captionPrompt分别最多2000字符，视觉与文案分开。
- draftType控制完整草稿或仅生成媒体；plannerModel与媒体model分别配置。
- disableMemory默认true。开启时读取近90天样本并总结最多20条偏好，不更新模型权重。
- 以上是接口范围，不保证每个模型支持全部输入；最终发布需重新校验渠道规则。

[DTO 参数](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/libs/aitoearn-ai-shared/src/dtos/draft-generation.dto.ts)、[历史偏好实现](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/draft-generation/draft-generation-memory.service.ts)。

### 模型入口与工具声明

Agent图片工具列出Gemini 3.1 Flash / 3 Pro；Grok入口支持1—15秒和480p/720p；Sora入口列出sora-2/pro及8/10/25秒，还有角色创建与查询。README v2.4描述HappyHorse 1.0 / Seedance 2.0，不能将版本介绍视为每个入口都支持这些模型。[媒体工具参数](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/media.mcp.ts)。

系统提示建议生成关键帧并链式传入参考图，帮助多镜头一致；这是方法和接口，结果需要观看。独立SubtitleMcp与video-utils均有字幕代码，但当前运行注册已注释。[运行注册](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts)。

静态提取的12组工具声明如下。枚举和@Tool声明不等于当前Agent全部可调用列表，仍需核对运行注册。

- **agent.constants.ts**：`createChannelPublishFlow`、`listChannelPublishRecords`、`getChannelPublishRecordByRecordId`、`getChannelPublishRecordByTaskId`、`getChannelPublishRecordByFlowId`、`publishChannelTaskNow`、`cancelChannelPublishTask`、`updateChannelPublishAt`、`requestChannelPublishUpdate`、`listChannelPlatforms`、`getChannelPlatform`、`listBilibiliChannelPlatformCategories`、`listYoutubeChannelPlatformCategories`、`getChannelWorkLinkInfo`、`getChannelWorkDetail`、`verifyChannelWorkOwnership`、`getChannelAccountAnalytics`、`getChannelWorkAnalytics`、`listChannelEngagementComments`、`submitChannelEngagementComment`、`callChannelEngagementFunction`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts)
- **image-edit.mcp.ts**：`compositeImages`、`resizeImage`、`transformImage`、`adjustImage`、`getImageMetadata`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/image-edit.mcp.ts)
- **media.mcp.ts**：`generateImage`、`generateVideo`、`getVideoStatus`、`createSoraCharacter`、`getSoraCharacter`、`generateVideoWithGrok`、`getGrokVideoStatus`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/media.mcp.ts)
- **subtitle.mcp.ts**：`generateSubtitle`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/subtitle.mcp.ts)
- **util.mcp.ts**：`outputTaskResult`、`setTitle`、`getCurrentTime`、`wait`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/util.mcp.ts)
- **video-utils.mcp.ts**：`getVolcVideoInfo`、`uploadAndGetVid`、`probeVideoMetadata`、`extractThumbnail`、`generateSubtitle`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/video-utils.mcp.ts)
- **aideo.mcp.ts**：`submitAideoTask`、`getAideoTaskStatus`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/volcengine/aideo.mcp.ts)
- **drama-recap.mcp.ts**：`submitDramaRecapTask`、`getDramaRecapTaskStatus`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/volcengine/drama-recap.mcp.ts)
- **style-transfer.mcp.ts**：`submitVideoStyleTransfer`、`getVideoStyleTransferStatus`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/volcengine/style-transfer.mcp.ts)
- **channels.mcp.controller.ts**：`createChannelPublishFlow`、`listChannelPublishRecords`、`getChannelPublishRecordByRecordId`、`getChannelPublishRecordByTaskId`、`getChannelPublishRecordByFlowId`、`publishChannelTaskNow`、`cancelChannelPublishTask`、`updateChannelPublishAt`、`requestChannelPublishUpdate`、`listChannelPlatforms`、`getChannelPlatform`、`listBilibiliChannelPlatformCategories`、`listYoutubeChannelPlatformCategories`、`getChannelWorkLinkInfo`、`listChannelWorks`、`getChannelWorkDetail`、`verifyChannelWorkOwnership`、`getChannelAccountAnalytics`、`getChannelWorkAnalytics`、`listChannelEngagementComments`、`submitChannelEngagementComment`、`callChannelEngagementFunction`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/mcp/channels.mcp.controller.ts)
- **content.mcp.controller.ts**：`getMediaGroupInfoByName`、`createMedia`、`getDraftGroupInfoByName`、`createDraft`、`listDrafts`、`getDraftDetail`、`deleteDraft`、`listMedia`、`listDraftGroups`、`listMediaGroups`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts)
- **draft-generation.mcp.controller.ts**：`createVideoDraft`、`createImageTextDraft`、`getDraftTaskStatus`。[声明来源](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/unified-mcp/draft-generation.mcp.controller.ts)

### 平台规则补充

空值为未声明，不等于无限制；下表为源码数值。完整格式与大小规则见src/implementation-inventory.json。

| 平台 | 标题 / 正文长度 | 图片 / 视频数 | 视频时长上限（秒） | 作品更新 |
| --- | --- | --- | --- | --- |
| 抖音 | 30 / 1000 | 12 / 1 | 900 | 未声明支持 |
| 小红书 | 20 / 1000 | 9 / 1 | 3600 | 未声明支持 |
| 快手 | 30 / 1000 | 0 / 1 | 1800 | 未声明支持 |
| 哔哩哔哩 | 79 / 249 | 0 / 1 | 18000 | 未声明支持 |
| 微信视频号 | 16 / 1000 | 9 / 1 | 3600 | 未声明支持 |
| 微信公众号 | 64 / 20000 | 20 / — | — | 未声明支持 |
| TikTok | — / 2200 | 35 / 1 | 600 | 未声明支持 |
| YouTube | 100 / 5000 | 0 / 1 | 43200 | 声明支持 |
| Instagram | — / 2200 | 10 / 1 | 900 | 未声明支持 |
| Facebook | — / 63206 | 10 / 1 | 90 | 未声明支持 |
| Threads | — / 500 | 10 / 1 | 300 | 未声明支持 |
| X / Twitter | 0 / 280 | 4 / 1 | 140 | 未声明支持 |
| Pinterest | 100 / 800 | 1 / 1 | 300 | 声明支持 |
| LinkedIn | 200 / 3000 | 9 / 1 | 600 | 未声明支持 |

源码另有Google商家元数据，editor=None、modes=[]，未列为内容发布渠道。 [源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/google-business/google-business.constants.ts)。

## 6. 三个完整流程示例

以下流程为本项目建议与预设说明，没有调用真实服务。

### 研究成果转内容

需求：把一个已研究的 GitHub 项目整理成三张介绍图和一条短演示，保存草稿，安排一个渠道发布。

1. **资料与事实**：输入自己的研究结论、真实截图和上游署名。 产出：研究文档 + 已核对素材。边界：先从人工确认的资料开始，避免把推测写成产品事实。
2. **规划内容**：分别描述图片视觉要求与发布文案要求。 产出：标题 / 正文 / 图片提示词。边界：对比类内容应明确适用条件。
3. **生成与加工**：生成介绍图，给真实截图加说明，处理演示片段。 产出：图片 URL / 视频任务 ID。边界：选用必要工具；源码截图可以用精确合成保留内容。
4. **保存草稿**：将媒体、标签和文案保存到研究内容组。 产出：草稿 ID / 素材组。边界：先审阅再进入发布。
5. **渠道检查**：读取平台规则与账号状态，校验素材。 产出：可发布输入或需要处理的问题。边界：没有账号时需要绑定，授权过期时需更新。
6. **发布执行**：创建 Flow 或进入插件 / 用户接续步骤。 产出：任务 ID / 等待用户操作。边界：任务已创建并非已发布。
7. **结果回看**：查询最终作品与实际可用指标。 产出：作品链接 / 数据快照。边界：用真实反馈调整下一条内容。

### 门店活动宣传

需求：根据店内照片和活动信息，准备三组图文与一条竖屏视频，分时发布。

1. **提供素材**：准备门店照片、活动时间和已确认价格。 产出：照片 + 活动信息。边界：事实来自商家，模型负责表达。
2. **批量规划**：指定三条草稿、每条三张图，设置文案语气。 产出：三组独立内容规划。边界：quantity 和 imageCount 分别控制草稿与单条图片数。
3. **生成成品**：调用图片 / 视频模型，必要时添加已有二维码。 产出：图片 / 视频。边界：二维码与 Logo 可通过 Sharp 精确叠加。
4. **人工审阅**：核对商品外观、文字、价格和日期。 产出：确认后的草稿。边界：这是流程建议，原库不会自动核验商家事实。
5. **设置排期**：选择目标账号和不同发布时间。 产出：延迟发布任务。边界：插件路径要准备好浏览器环境。
6. **等待完成**：跟踪任务；需要接续的平台完成用户操作。 产出：发布记录与作品链接。边界：实际审核取决于平台。
7. **回复与分析**：查看可取得的评论与作品数据。 产出：互动结果 / 数据快照。边界：对有需求的用户提供准确回复。

### 视频多语言复用

需求：把自己的中文产品视频转成英文版，并准备 YouTube 发布草稿。

1. **源视频**：提交可访问的自有视频，指定目标语言。 产出：视频 URL + 语言要求。边界：清晰音频有助于识别。
2. **翻译任务**：调用 Aideo 处理字幕和配音，按需要选择识别方式。 产出：处理任务 ID。边界：ASR读音频，OCR读硬字幕，Vision综合理解。
3. **状态轮询**：轮询外部处理服务，获得成功或失败信息。 产出：译制视频地址。边界：技能超时设置是执行规则，不是性能保证。
4. **审阅译制**：检查术语、旁白、字幕与口型。 产出：确认后的视频。边界：本页只演示流程，不生成真实视频。
5. **文案与封面**：生成英文标题说明，按时间点提取封面。 产出：配套文案 + PNG封面。边界：封面工具当前是 extractThumbnail。
6. **草稿和发布**：保存草稿，检查 YouTube 授权，再创建发布任务。 产出：草稿 ID + 发布任务。边界：模型Key和社交账号授权是不同配置。
7. **追踪结果**：确认作品链接及可取得数据。 产出：作品与快照。边界：语言适配完成不代表营销效果已验证。

## 7. 使用场景

### 个人创作者 / 一人公司

- 输入：主题、参考素材、多个账号与一周计划。
- 流程：批量生成 → 草稿审阅 → 排期 → 结果回看。
- 价值：减少制作、上传与切换平台的重复工作，保持持续产出。
- 适用条件：适合已明确内容方向和目标渠道；起步先接一个平台。

### 开源项目研究与知识传播

- 输入：本仓库 README、研究笔记、真实截图和操作录屏。
- 流程：提炼场景 → 制作图文 → 编辑演示 → 保留来源 → 分发。
- 价值：把研究成果变成外部读者可以理解的内容，并形成稳定模板。
- 适用条件：最贴合你当前的研究集；上游许可和事实核对仍保留。

### 品牌与电商

- 输入：真实产品照片、卖点、受众与已确认活动信息。
- 流程：制作不同场景版本 → 叠加品牌素材 → 多渠道草稿与发布。
- 价值：提高素材复用和不同内容角度的产出效率。
- 适用条件：商品外观、规格和价格需要审阅；模型生成不是事实来源。

### 餐厅 / 民宿 / 本地门店

- 输入：现场照片、位置、活动与推广要求。
- 流程：图文与竖屏视频 → 排期 → 评论回应 → 可用指标查询。
- 价值：把线下活动组织为线上传播内容和交付任务。
- 适用条件：到店与成交需另有实际记录，曝光不是到店归因。

### 多语言与海外传播

- 输入：自有源视频、目标语言、海外账号。
- 流程：翻译配音字幕 → 封面与文案 → 审阅 → 目标渠道发布。
- 价值：复用原素材，降低逐语言制作和分发工作量。
- 适用条件：术语、音色和文化表达需要审阅；渠道权限独立配置。

### 代运营与多项目管理

- 输入：多个客户 / 项目的素材、账号和内容计划。
- 流程：分组 → 草稿 → 排期 → 发布记录 → 数据比较。
- 价值：集中管理素材与账号，减少记录散落。
- 适用条件：分组管理已可见；复杂团队权限、客户审核和预算流程需另行设计。

## 8. 对你的价值

以下分析结合当前多GitHub项目研究仓库推导，并非假设你已经运营媒体账号。

### 把你的研究集转成媒体内容（优先使用）

你已经有固定编号、来源、研究结论和真实截图，可以直接作为创作输入。最有价值的是减少整理成社媒内容的重复工作。

开始方式：先选择一个已经完成的子项目，产出“解决什么问题 / 怎么工作 / 适合谁”三张图和一条真实录屏草稿。

评估标准：检查是否忠实于研究、署名完整、需要人工改动多少，以及单条内容准备时间。

### 借鉴 Agent、Skills 与工具的分工（优先研究）

它提供了一个从 Markdown 工作知识到真实业务工具的实例，适合你理解怎样把多步骤能力做成可执行产品。

开始方式：参考技能加载、Schema参数、媒体任务轮询和发布状态；先给自己的 Agent 接只读研究工具或草稿工具。

评估标准：流程能否追踪、失败能否解释、工具输入是否清楚、结果能否继续复用。

### 建立素材、草稿与发布模板（按需接入）

从持续研究到持续发布之间，主要缺口是素材组织、文案审阅和排期。它的素材组和草稿结构可作为参考。

开始方式：按项目编号分组，固定保存来源、版本、封面和发布文案，先跑通一个渠道后再扩展。

评估标准：找素材和核对版本是否更快，是否减少漏发、错账号和重复上传。

### 学习平台适配与异步任务工程（进阶扩展）

不同平台授权、规则与完成方式不一致；统一接口背后需要队列、状态、错误分类和用户接续。

开始方式：研究平台元数据、发布 Flow、凭据刷新、最多三次发布执行和等待用户状态，再实现自己的业务任务。

评估标准：任务创建、执行、失败与最终结果是否可区分和恢复。

### 多语言复用与矩阵分发（条件满足再用）

当内容方向和质量已经稳定，多语言处理与多个渠道才能带来明显工作量收益。

开始方式：先用一段自己的视频比较人工处理和云翻译效果，再接第二个平台。

评估标准：翻译审阅成本、生成费用、渠道权限和真实反馈。

### 推广任务与收入（需要业务前提）

官方市场描述了订单与结算流程，代码只能支撑交付管理；订单、流量、转化与结算需要实际业务。

开始方式：已有商家合作时可研究交付、作品归属核验与任务证明；不将部署软件当作收入预测。

评估标准：真实订单、审核通过率、实际结算与制作成本。

先选一个已完成项目，使用真实截图/录屏准备一组图文与一条草稿，核对事实和署名，记录准备时间、人工改动和调用成本，再验证一个账号。确认质量和效率后，再扩展平台、批量和多语言。源码研究、选题与成品判断仍需要你。

## 9. 接入、部署与投入

- **官方网页**（直接使用官方界面）：访问 aitoearn.cn 或 aitoearn.ai；可用模型、套餐、任务和授权范围以所选环境为准。 [入口/说明](https://aitoearn.cn/)
- **MCP 助手**（把媒体工具接到已有助手）：配置对应区域的 /api/unified/mcp 或 /api/unified/sse，使用 x-api-key。可以自己的部署地址替换域名。 [入口/说明](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/README.md)
- **OpenClaw**（将平台任务接进已有工作流）：官方提供插件CLI；需匹配中国 / 国际区域的 API Key，当前研究未运行安装器。 [入口/说明](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/README.md)
- **Docker 部署**（控制自己的管理界面与数据）：Compose启动后，再配置模型、账号授权、存储和可选Relay；模型与渠道凭据分别管理。 [入口/说明](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/DOCKER_DEPLOYMENT_CN.md)
- **源码开发**（修改能力与业务流程）：前端独立Next.js；后端为Nx/NestJS工作区，业务服务与AI服务分开。Electron代码另有历史模块。 [入口/说明](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/DOCKER_DEPLOYMENT_CN.md)

自行部署包括Nginx、Web、Server、AI、MongoDB、Redis与RustFS/S3，之后仍需分别配置模型、云媒体、社交授权或Relay、插件与可访问素材。统一MCP使用/api/unified/mcp或/api/unified/sse，header为x-api-key，Key须与中国/国际区域匹配。

费用按生成、云加工、存储带宽、服务器、人工审阅与返工分别测算，不把历史广告价格当作预算。官方市场的订单、审核和结算需要实际业务条件，自行部署不自动获得收入。

## 10. 核验边界

### 技能和可执行工具要分别核对

13个目录均被初始化复制；采集技能引用的任务工具未在当前运行工具中找到。文档存在并不自动形成执行入口。 [源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skill-init.service.ts)。

### 字幕工具当前未注册

video-utils的字幕工具注册、独立SubtitleMcp的运行时注册均已注释；Aideo翻译路径仍有字幕相关处理。 [源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts)。

### 封面技能使用旧接口名

技能说明引用 createThumbnailTask；实际可见工具是 extractThumbnail，以 ffmpeg 直接抽取指定时刻并上传。 [源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/video-utils.mcp.ts)。

### 互动读取有缺口

抖音插件评论与子评论列表仍标开发中；小红书插件作品详情抓取提示已移除。不能推导全平台所有动作都可用。 [源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-web/src/store/plugin/plats/douyin/index.ts)。

### 批量与并行是两回事

批量草稿使用队列；单次 Agent 系统提示要求工具顺序执行。实际吞吐由worker、模型与外部限额决定。 [源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts)。

### 规则在不同入口可能不同

批量兼容平台计算与平台发布元数据有独立约束。例如图数、时长与文字长度应在最终发布入口重新核对。 [源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-ai/src/core/draft-generation/draft-generation-platforms.ts)。

### 发布有等待用户的路径

抖音返回接续入口，小红书和视频号依赖插件；排期不代表服务器能独立完成所有渠道操作。 [源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/platforms/douyin/douyin-publish.provider.ts)。

### 数据字段多数是可选项

播放、曝光、点击和观看时长等字段支持统一表达，但平台可能不提供，或依赖其他采集服务。 [源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-backend/apps/aitoearn-server/src/core/channels/analytics/analytics.vo.ts)。

### 市场与旧服务不能混为一体

任务与钱包代码位于旧Electron服务；本研究未确认当前Web的完整交易、审核和结算部署链路。 [源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-electron/server/src/modules/task/user-task.service.ts)。

### 画质、速度、收益需要实测

本项目已完成固定源码研究、13技能安装、GPT适配、3张真实生成图与本地图文草稿。未运行原后台、授权社交账号或真实发布，视频加工、业务指标和收益尚未实测。 [源码依据](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/README.md)。

## 11. 来源与许可

固定源码和SHA-256见src/source-manifest.json。74份资料及6张上游图片供研究，完整参考文件在ignored upstream/。上游MIT保留于src/LICENSE.upstream.txt，随网页构建复制。

作者图片：[自然语言创作入口](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/presentation/display-1.5.2png.png)、[发布日历](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/presentation/publish-cn.png)、[账号渠道连接](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/presentation/channel-cn.png)、[互动运营演示封面](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/presentation/engage-thumbnail-cn.png)、[推广变现界面](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/presentation/monetize-cn.png)；另有[餐厅提示词画廊封面](https://github.com/yikart/AiToEarn/blob/3581f511293236044e56fad67958cfcea0def6b5/project/aitoearn-web/public/assets/promptGallery/cover01.png)。这些资料不是本地运行结果。

原作者AiToEarn / yikart，Copyright (c) 2025 AiToEarn。未修改或执行上游应用；原创范围为中文结构化分析、网页、流程示例和下载/构建/预览工具。

## 12. 新增真实效果实测：GPT适配与图文草稿

2026-10-09，在011子项目安装13个固定版本原版技能，根项目新增aitoearn-gpt-content适配入口。原文、来源SHA和MIT许可保留。当前GPT/Codex加载图片生成与内容管理方法，用已有研究作为输入，实际调用image_gen.imagegen三次。

实际产出为3张1086×1448 PNG、配套中文文案和本地draft.json。主题依次为“把开源研究变成内容”“Skill不是全部”和“先用一个项目跑通一次创作”。每张均人工查看；主要中文文字正确、配色一致，第一和第三张添加了未要求的装饰小字，保留实际结果和审阅意见。

图像工具没有公开底层模型编号和计费金额。生成等待267秒是本次调用记录，不代表速度基准，也不能推导费用或节省比例。正文含话题共501字符、标题11字符，3张PNG均小于20MB，通过研究版本的小红书元数据预检。真实账号权限、平台当前规则和审核未验证。

上游默认Gemini工具映射到本会话可用图像工具，远端内容MCP保存映射为本地JSON。没有运行原Agent SDK、后台或队列，没有授权账号或社交发布，也没有验证视频加工、运营指标和收入。

成品、输入快照、3条真实提示词、调用时间、SHA-256与实验说明位于experiments/research-to-post/。网页“真实效果实测”显示全部成品，提供放大、文案复制、单图与完整成品包下载。原来的三个七步流程仍为解释示例。
