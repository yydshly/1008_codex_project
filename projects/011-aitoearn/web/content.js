// 原创中文研究内容；所有上游结论固定到 meta.commit。示例与价值判断为本项目分析。
export const meta = {id:'011',name:'AiToEarn',commit:'3581f511293236044e56fad67958cfcea0def6b5',date:'2026-10-09',repo:'https://github.com/yikart/AiToEarn',license:'MIT'};
export const ai='project/aitoearn-backend/apps/aitoearn-ai/src/core/';
export const server='project/aitoearn-backend/apps/aitoearn-server/src/core/';
export const source=(p)=>`${meta.repo}/blob/${meta.commit}/${p.split('/').map(encodeURIComponent).join('/')}`;
export const refs={readme:'README.md',runtime:ai+'agent/services/agent-runtime.service.ts',prompt:ai+'agent/agent.constants.ts',init:ai+'agent/skill-init.service.ts',media:ai+'agent/mcp/media.mcp.ts',image:ai+'agent/mcp/image-edit.mcp.ts',aideo:ai+'agent/mcp/volcengine/aideo.mcp.ts',edit:ai+'agent/mcp/volcengine/video-edit.mcp.ts',utils:ai+'agent/mcp/video-utils.mcp.ts',style:ai+'agent/mcp/volcengine/style-transfer.mcp.ts',recap:ai+'agent/mcp/volcengine/drama-recap.mcp.ts',draft:ai+'draft-generation/draft-generation.service.ts',planner:ai+'draft-generation/draft-generation-planner.service.ts',memory:ai+'draft-generation/draft-generation-memory.service.ts',dto:'project/aitoearn-backend/libs/aitoearn-ai-shared/src/dtos/draft-generation.dto.ts',flow:server+'channels/publish/flows/publish-flow.service.ts',queue:server+'channels/publish/tasks/publish-queue.service.ts',task:server+'channels/publish/tasks/publish-task.service.ts',mcp:server+'channels/mcp/channels.mcp.controller.ts',content:server+'content/content.mcp.controller.ts',analytics:server+'channels/analytics/analytics.vo.ts',groups:server+'channels/accounts/account-group.service.ts',douyin:server+'channels/platforms/douyin/douyin-publish.provider.ts',xhs:server+'channels/platforms/rednote/rednote-publish.provider.ts',twitter:server+'channels/platforms/twitter/twitter-engagement.provider.ts',xhsPlugin:'project/aitoearn-web/src/store/plugin/plats/xhs/index.ts',dyPlugin:'project/aitoearn-web/src/store/plugin/plats/douyin/index.ts',deploy:'DOCKER_DEPLOYMENT_CN.md',router:ai+'agent/claude-code-router/claude-code-router.service.ts',assets:'project/aitoearn-web/src/api/materials/material.types.ts',adapt:server+'channels/media/media.service.ts',trade:'project/aitoearn-electron/server/src/modules/task/user-task.service.ts'};
export const categories=['全部','内容创作','媒体加工','素材管理','发布与账号','互动运营','数据分析','集成与部署','推广变现'];
const c=(id,group,title,summary,input,output,how,boundary,example,ref,status='源码可见')=>({id,group,title,summary,input,output,how,boundary,example,ref,status});
export const capabilities=[
 c('copy','内容创作','标题、正文与话题','把主题或素材整理成配套发布文案。','主题、商品事实、语言、语气与字数要求。','标题、正文、话题标签，与媒体一起保存为草稿。','规划模型输出结构化字段；媒体提示词与文案提示词分开处理。','字段长度和语气可约束；事实、价格与营销表述需核对。','为这个开源项目写一篇中文介绍，强调使用场景，结尾邀请讨论。',refs.planner),
 c('image','内容创作','AI 图片与参考图创作','生成产品图、海报、场景图、插画和封面。','文字描述、参考图片、比例、分辨率与模型。','图片地址及图文草稿，可继续加工。','Agent 图片工具接 Gemini；批量草稿另有 Gemini / OpenAI 生成与编辑路径。','1K / 2K / 4K 是请求参数，实际支持由模型决定；品牌细节和图片文字需查看成品。','以真实产品照片为参考，制作三张不同场景的宣传图。',refs.media),
 c('video','内容创作','文生视频、图生视频','把描述或参考图制作成短视频片段。','描述、参考图、时长、比例、分辨率。','生成任务 ID、状态和完成后的视频地址。','工具调用 Grok / Sora 等外部模型，异步查询结果；可用模型由各入口配置决定。','当前 v2 草稿时长字段是 1—15 秒；其他工具路径有自己的约束。长片需要分段制作。','用这张咖啡照片做一段竖屏展示，镜头缓慢推进。',refs.media),
 c('batch','内容创作','批量图文与视频草稿','一次准备多条内容及配套文案。','生成数量、媒体模型、规划模型、素材与目标平台。','多条独立草稿和任务记录，每条包含媒体与文案。','草稿生成服务创建队列任务，规划后调用媒体服务，完成后保存结果。','每次 1—10 条草稿；每条图文 1—9 张图。批量数量不等于同时执行数量。','生成五组图文，每组三张图片，分别突出功能、场景和使用体验。',refs.dto),
 c('memory','内容创作','历史创作偏好','把近期创作记录摘要成可复用偏好。','近期成功生成的记录和素材。','按图文 / 视频分类的简短记忆条目。','读取近 90 天样本，规划模型提炼最多 20 条摘要，再作为后续规划上下文。','当前接口默认 disableMemory=true；这是一层上下文摘要，不代表模型重新训练。','后续内容沿用之前的简洁语气与产品主题。',refs.memory),
 c('composite','媒体加工','图片合成与精确加工','添加已有 Logo、二维码、水印，调整图像。','底图、图层、像素位置或锚点、目标尺寸。','加工后的 PNG 图片。','Sharp 执行合成、裁剪、缩放、旋转、翻转、亮度和饱和度调整、锐化与模糊。','常规图像加工与生成式改图是两条路径；需要输入可访问图片。','把 Logo 放在左上角、二维码放在右下角，再输出方形版本。',refs.image),
 c('edit','媒体加工','轨道式视频剪辑','组织片段、文字、图片、音频和转场。','视频源、画布尺寸、时间轨道与输出设置。','云渲染后的视频地址。','视频先上传取得 VID，再构造二维 Track，调用火山引擎云剪辑 API。','需要云服务配置；时间、尺寸和层级需要正确表达，渲染耗时随素材变化。','保留片段 A 的前五秒，再接片段 B，叠加活动标题和背景音乐。',refs.edit),
 c('compose','媒体加工','多素材合成','图片成片、多个视频拼接、音视频合并。','多张图片 / 多段视频 / 音频地址和处理要求。','合成后的视频地址。','自然语言提交 Aideo 处理任务，拿任务 ID 后轮询；精细剪辑可用 Track 路径。','处理由外部云服务完成；技能中的耗时估计不是本地性能实测。','把五张店内照片做成展示视频，每张停留三秒。',refs.aideo),
 c('understand','媒体加工','视频理解与高光提取','理解视频内容，并组织摘要或精彩片段。','源视频地址与摘要 / 高光要求。','摘要、关键词、剧情分析，或高光片段地址数组。','Aideo 多模态处理服务按任务类型返回结构化分析或媒体结果。','工具描述的视频理解上限为两小时；提取的片段是否合适需要观看判断。','从产品讲解视频中提炼卖点，并找出三个适合短视频的片段。',refs.aideo),
 c('translate','媒体加工','翻译配音与字幕本地化','把已有视频转成其他语言版本。','源视频、目标语言和处理要求。','翻译后的视频；工具说明包含声音特征保留与口型同步。','Aideo 根据要求执行 ASR、OCR 或视觉识别，再组织翻译及媒体处理。','有工具接入；翻译、音色、口型和字幕质量取决于外部服务与素材清晰度。','把中文产品介绍转换成英文版，保留自然语气。',refs.aideo),
 c('erase','媒体加工','硬字幕擦除','为重新配字幕准备更干净的画面。','包含烧录字幕的源视频。','经字幕区域修复后的视频。','Aideo 通过识别文本区域和 AI 画面修复处理。','复杂背景、移动字幕和纹理可能影响修复质量；本研究未验证成片。','去掉底部已有字幕，准备加入新的双语字幕。',refs.aideo),
 c('style','媒体加工','视频风格转换','将实拍视频转换成漫画、日漫或 3D 卡通风格。','视频地址 / VID、风格与输出分辨率。','风格化视频地址及 VID。','调用火山引擎风格转换任务，轮询完成结果。','要求清晰主体与较好光照；风格一致性和帧间稳定程度需要实测。','把一段场景实拍转换成漫画风。',refs.style),
 c('recap','媒体加工','影视解说与旁白','根据视频素材制作带解说的成片。','多个视频、可选解说稿、声音与叙述风格。','旁白解说视频，支持批量版本参数。','云服务生成或使用解说稿，合成 TTS 旁白并组织剪辑。','属于外部服务能力；素材权利与叙事质量需要在实际项目中核对。','用自己的故事素材制作一段悬疑风旁白介绍。',refs.recap),
 c('thumbnail','媒体加工','视频封面与媒体探测','抽取画面，查询时长、宽高等素材信息。','视频 URL 和抽帧时间点。','封面 PNG 地址、时长与尺寸等元数据。','当前工具通过 ffmpeg 抽帧并上传；同时有上传获取 VID 和媒体探测工具。','封面技能仍描述旧任务接口；当前应使用 extractThumbnail。', '取第三秒作为封面，核对竖屏比例与时长。',refs.utils),
 c('crawl','素材管理','按社媒链接采集','技能说明描述了按作品链接获取视频、图片与元数据。','B站、YouTube、抖音等作品链接。','文档预期返回媒体、标题、标签和封面。','技能引用 createCrawlTask / getCrawlTaskStatus。','当前 Agent 注册工具和参考目录中未找到对应采集工具；不能当作已可用入口。','获取自己已发布作品的素材以便后续整理。',ai+'agent/skills/crawling-social-media/SKILL.md','待核验'),
 c('library','素材管理','媒体库与分组','集中组织图片、视频和音频素材。','上传或生成的媒体、分组名称与描述。','媒体 ID、分组、元数据及可复用素材。','内容 MCP 与素材管理接口负责保存、分组、转移、查询和删除。','上传、存储和外部素材可访问性需要配置；数据字段不代表所有界面已完整开放。','按项目建立产品图、录屏和封面三个媒体组。',refs.content),
 c('draft','素材管理','草稿箱与已有视频转草稿','把媒体和文案组织成待发布内容。','已有视频 / 图片、标题、正文、话题与兼容平台。','草稿 ID、媒体列表和发布元数据。','支持生成结果保存，或分析已有视频后生成文案并创建草稿。','视频转草稿属于内容分析；发布前还需目标平台校验与账号授权。','把项目演示录屏变成带中文介绍的发布草稿。',refs.draft),
 c('accounts','发布与账号','账号分组与授权管理','按品牌、项目或渠道组织多个账号。','OAuth、扫码或插件登录的账号。','账号资料、分组、排序与授权状态。','账号仓库、分组服务和各平台 AuthProvider 处理持久化及授权。','授权方式按平台不同；账号未绑定或过期时需要用户操作。','把研究账号与门店账号放在不同分组。',refs.groups),
 c('publish','发布与账号','多平台发布流程','用一份内容创建多个目标账号的独立任务。','统一内容、目标账号列表及平台覆盖字段。','Flow ID、任务 ID、发布记录及作品链接。','先验证账号归属、准备媒体、检查平台规则，再创建记录并入队。','平台接口、插件或用户接续流程各不相同；创建任务不等于平台发布成功。','同一演示视频分别发布到 YouTube 与 B站，设置各自标题。',refs.flow),
 c('schedule','发布与账号','日历排期与任务调整','集中安排时间，查看和管理发布任务。','草稿、目标账号、发布时间。','立即 / 延迟发布任务，可改时间、取消或立即执行。','Redis / BullMQ 延迟任务与发布状态服务共同执行。','插件或用户接续平台还需要相应运行环境；取消与更新支持也按平台不同。','一周内容分布在周二、周四、周六发布。',refs.queue),
 c('adapt','发布与账号','平台规则与媒体适配','在分发前检查文案和素材是否符合要求。','正文、图片 / 视频、目标平台及适配选项。','校验问题、兼容平台结果、转换后的部分图片。','平台元数据包含内容模式、长度和媒体规则；Sharp 可转换格式和限制尺寸。','只覆盖已实现规则，不能自动保证审核通过；不同入口的约束可能有差异。','检查小红书标题长度，把图片转成目标平台支持的格式。',refs.adapt),
 c('retry','发布与账号','状态跟踪与失败处理','追踪异步任务，区分成功、失败和等待用户。','任务 ID、平台响应、失败原因。','发布状态、错误信息、可重试记录。','状态转换避免重复处理；可重试发布最多执行三次，包含凭据刷新及结果轮询。','不可重试错误需修正输入或授权；外部故障与内容审核仍可能阻塞。','查看失败原因，补授权后再安排发布。',refs.task),
 c('interaction','互动运营','点赞、评论、收藏与关注','通过已接入渠道执行运营动作。','作品、评论、目标账号和互动内容。','平台动作结果及记录。','插件路径通过浏览器执行或代理请求；X 后端有完整的回复、点赞、书签、转发、引用与关注工具。','具体动作按平台不同；抖音评论列表仍标开发中，小红书详情入口已移除。','在自己的作品评论中回答具体使用问题。',refs.twitter),
 c('reply','互动运营','AI 回复与购买意向识别','官方介绍了针对评论生成回复及识别购买信号。','评论文本、品牌信息与回复要求。','预期产生针对性回复与需要响应的线索。','模型理解评论，再通过互动工具执行；README 描述求链接、怎么购买等信号。','持续运行覆盖、分类准确率和全平台自动回复链路未做实测。','整理询问价格和购买方式的评论，生成有针对性的回复。',refs.readme,'官方描述'),
 c('monitor','互动运营','品牌讨论监测','官方介绍了追踪品牌讨论与主动参与。','品牌名称和监测范围。','预期产生讨论线索与互动机会。','产品介绍提出监测目标；底层接入需检索 / 评论读取 / 自动任务共同完成。','当前参考源码未确认完整持续监测链路；不等于全网实时舆情系统。','发现用户提到自己的品牌并组织回应。',refs.readme,'官方描述'),
 c('metrics','数据分析','账号、作品指标与快照','查询平台能够提供的运营数据。','账号 / 作品与统计请求。','播放、曝光、触达、点赞、收藏、评论、分享、点击、观看时长等可选指标。','各平台 AnalyticsProvider 取得数据后映射统一字段，保存快照和获取时间。','大部分指标可选；字段存在不代表每个平台都能取到。部分作品数据依赖爬取服务。','比较教程视频与场景演示的收藏和观看表现。',refs.analytics),
 c('works','数据分析','作品查询与归属验证','把发布记录与平台真实作品关联。','账号、作品 ID 或作品链接。','作品列表、详情、链接解析和归属结果。','渠道 WorkProvider 与 MCP 暴露查询及归属验证。','读取范围由平台权限与实现决定；某插件详情缺失不代表其他路径也可用。','核对提交的作品链接是否属于对应账号。',refs.mcp),
 c('mcp','集成与部署','MCP 与外部 AI 助手','把发布和管理能力提供给其他助手调用。','API Key、MCP 地址和工具请求。','结构化工具结果，如草稿、发布任务和分析数据。','统一 MCP 提供 HTTP / SSE 入口；工具参数使用 Schema 描述。','助手必须兼容协议，Key 与中国 / 国际环境需匹配。', '在兼容 MCP 的助手里查询草稿，再创建指定账号的发布流程。',refs.mcp),
 c('openclaw','集成与部署','OpenClaw 接入','官方提供插件安装方式用于任务执行。','OpenClaw 环境、区域与官方 API Key。','通过 OpenClaw 调用平台任务。','README 提供 @aitoearn/openclaw-plugin-cli 安装入口。','插件服务与平台任务需实际连接；本研究未运行安装器。','在已有 OpenClaw 工作流中接收并组织推广任务。',refs.readme,'官方描述'),
 c('selfhost','集成与部署','私有部署与服务配置','部署自己的素材、草稿和发布管理界面。','Docker、服务配置、存储及外部服务凭据。','Next.js 前端、业务后端、AI 服务和持久化基础设施。','Compose 组合 Nginx、Web、Server、AI、MongoDB、Redis 和 RustFS。','启动界面之后还需要模型与渠道配置；官方交易订单和流量不会因部署自动产生。','先部署草稿与素材管理，再接入一个真实发布渠道。',refs.deploy),
 c('relay','集成与部署','Server Relay 与 AI Relay','使用中转服务降低接入配置工作量。','官方区域匹配的 Key、中转 API 地址。','平台授权 / 发布中转，或官方提供的模型调用。','Server Relay 与 AI Relay 分开配置；也可按服务填写自己的模型凭据。','中转会调用外部服务；可用能力、额度和费用需在所选服务核对。','先通过 Relay 完成测试，再判断是否独立配置渠道凭据。',refs.deploy),
 c('trade','推广变现','推广任务、提交与结算','官方平台连接商家任务和创作者内容。','商家需求、作品链接与任务证明。','任务申请、提交、审核及结算业务记录。','README 提出 CPS / CPE / CPM；仓库旧 Electron 服务中有任务提交及钱包记录实现。','不能把旧服务模块等同于当前 Web 完整市场；实际收入取决于订单、效果和审核。','交付商家要求的推广内容，提交作品链接进入审核。',refs.trade,'官方描述'),
];
const s=(slug,title,output,tools,detail,status='已找到对应工具')=>({slug,title,output,tools,detail,status,path:ai+`agent/skills/${slug}/SKILL.md`});
export const skills=[
 s('generating-images','图片生成','图片 URL、参考图衍生图','generateImage','描述场景、风格和构图；可传比例、1K/2K/4K和参考图片。Agent 的这条路径使用 Gemini。'),
 s('generating-videos','视频生成','异步生成的短视频','generateVideoWithGrok / getGrokVideoStatus','技能默认 Grok，1—15秒。长视频建议生成片段后拼接；其他入口和模型有独立配置。'),
 s('editing-images','图片编辑','合成、裁剪和调色图片','compositeImages / resizeImage / transformImage / adjustImage / getImageMetadata','Sharp 精确加工已有图像；支持图层位置、透明度和缩放。'),
 s('editing-videos','视频剪辑','经过多轨渲染的视频','submitDirectEditTask / getVideoEditTaskStatus','火山引擎 Track 数组描述视频、图片、文字、音频、滤镜和转场，先获取素材信息与 VID。'),
 s('composing-videos','多素材合成','多图成片、片段拼接、配乐视频','submitAideoTask / getAideoTaskStatus','把自然语言与 multiInputs 提交给 Aideo；可合并图片、视频和音频。'),
 s('analyzing-videos','视频理解与高光','摘要、关键词、剧情分析或片段 URL','submitAideoTask / getAideoTaskStatus','视觉、音频和语言共同处理；工具说明的视频理解范围最多两小时。'),
 s('translating-videos','视频翻译','其他语言配音与字幕版本','submitAideoTask / getAideoTaskStatus','可按要求选择语音识别、OCR 或视觉理解；说明包含音色和口型处理。'),
 s('removing-subtitles','硬字幕擦除','字幕区域修复后的视频','submitAideoTask / getAideoTaskStatus','识别烧录字幕并进行画面修复，实际效果依赖背景和字幕形态。'),
 s('transferring-video-styles','视频风格转换','漫画、日漫或 3D 卡通成片','submitVideoStyleTransfer / getVideoStyleTransferStatus','提供视频源、风格、分辨率，提交异步任务后轮询。'),
 s('generating-drama-recaps','影视解说','脚本、合成旁白与解说视频','submitDramaRecapTask / getDramaRecapTaskStatus','支持可选解说稿、声音、叙述风格和批量数量；依赖云处理。'),
 s('managing-content','媒体与草稿管理','媒体 ID、草稿 ID与分组记录','createMedia / createDraft 等内容工具','查找目标组再保存生成结果；找不到指定组时使用默认组。'),
 s('extracting-thumbnails','视频封面','指定时刻的帧图片 URL','当前：extractThumbnail','技能引用旧 createThumbnailTask；当前实际是 ffmpeg 抽帧并上传 PNG。','文档与接口有差异'),
 s('crawling-social-media','社媒内容采集','文档描述媒体与元数据','文档：createCrawlTask / getCrawlTaskStatus','初始化会复制此技能，但当前 Agent 工具注册未找到对应采集工具。','缺少当前工具入口'),
];
const p=(name,slug,types,auth,complete,note)=>({name,slug,types,auth,complete,note,path:server+`channels/platforms/${slug}.constants.ts`});
export const platforms=[
 p('抖音','douyin/douyin',['图文','视频'],'扫码','用户接续','后端返回 schema、短链接和等待操作状态；轮询最终作品。'),
 p('小红书','rednote/rednote',['图文','视频'],'插件','插件 / 作品登记','后端要求 workLink；插件负责相关发布与互动。标题20、正文1000、最多9张图是该版本元数据。'),
 p('快手','kwai/kwai',['视频'],'OAuth','异步查询','独立授权及上传发布流程。'),
 p('哔哩哔哩','bilibili/bilibili',['视频'],'OAuth','异步查询','支持分区选项查询；发布过程依赖开放平台权限。'),
 p('微信视频号','wechat/wechat-channels/wechat-channels',['视频'],'插件','异步查询','需对应插件和登录环境。'),
 p('微信公众号','wechat/wechat-official/wechat-official',['图文文章'],'OAuth','异步查询','HTML 编辑内容，文章流程不同于短视频。'),
 p('TikTok','tiktok/tiktok',['图文','视频'],'OAuth','异步查询','参数与账号可见性受平台权限约束。'),
 p('YouTube','youtube/youtube',['视频'],'OAuth','同步提交','元数据声明可更新作品；最终平台处理与审核仍由 YouTube 承担。'),
 p('Instagram','instagram/instagram',['图文','视频'],'OAuth','异步查询','媒体格式与业务账号权限需要匹配。'),
 p('Facebook','facebook/facebook',['文字','图文','视频'],'OAuth','同步提交','需可授权的目标页面 / 账号与对应权限。'),
 p('Threads','threads/threads',['文字','图文','视频'],'OAuth','异步查询','此版本正文上限500，图片上限10。'),
 p('X / Twitter','twitter/twitter',['文字','图文','视频'],'OAuth','同步提交','此版本正文280、图片4；后台有评论、点赞、书签、转发、引用及关注工具。'),
 p('Pinterest','pinterest/pinterest',['图文','视频'],'OAuth','同步提交','此版本图文支持单图；元数据声明可更新作品。'),
 p('LinkedIn','linkedin/linkedin',['文字','图文','视频'],'OAuth','同步提交','独立授权、内容规则与发布适配。'),
];
export const layers=[
 {name:'目标与上下文',tag:'你要完成什么',description:'输入营销目标、真实产品信息、参考素材、目标平台和发布要求。Agent 将这些内容作为本次任务上下文，草稿规划还可加入历史偏好摘要。',example:'输入：把这次 GitHub 项目研究整理成三张介绍图和一条演示视频。',ref:refs.planner},
 {name:'Agent 调度',tag:'决定调用谁',description:'Claude Agent SDK 组织对话和工具调用；技能分析子代理识别所需能力，轮询子代理等待媒体任务。Claude Code Router 按配置路由模型。',example:'先需要文案与图片，再准备视频封面，最后检查账号和发布规则。',ref:refs.runtime},
 {name:'Skills 流程知识',tag:'知道怎么做',description:'13个技能目录会被复制到会话技能目录。Markdown 说明输入参数、步骤、工具、轮询和失败处理；技能本身不等于执行接口。',example:'图片生成技能说明参考图和比例；剪辑技能说明 Track 与画布关系。',ref:refs.init},
 {name:'MCP 与执行工具',tag:'真正执行操作',description:'工具通过结构化参数调用媒体模型、Sharp、ffmpeg、云剪辑和业务后端。工具结果返回任务ID、素材地址或业务记录，Agent再决定下一步。',example:'generateImage 返回图片；createChannelPublishFlow 返回发布流程与任务。',ref:refs.mcp},
 {name:'业务与任务状态',tag:'让流程持续运行',description:'NestJS服务管理账号、草稿和发布记录；MongoDB持久化数据，Redis/BullMQ处理队列、延迟发布与重试，S3兼容存储保存媒体与会话。',example:'待发布 → 发布中 → 已发布 / 等待用户操作 / 失败；生成任务独立记录。',ref:refs.task},
 {name:'外部模型与渠道',tag:'决定实际结果',description:'生成与云加工依赖已配置的模型/服务，分发依赖各平台API、授权、浏览器插件或用户接续。任务创建后仍要跟踪最终作品结果。',example:'抖音要求用户接续；小红书使用插件；其他渠道调用开放平台接口。',ref:refs.douyin},
];
export const workflows=[
 {id:'research',title:'研究成果转内容',prompt:'把一个已研究的 GitHub 项目整理成三张介绍图和一条短演示，保存草稿，安排一个渠道发布。',steps:[
 ['资料与事实','输入自己的研究结论、真实截图和上游署名。','研究文档 + 已核对素材','先从人工确认的资料开始，避免把推测写成产品事实。'],
 ['规划内容','分别描述图片视觉要求与发布文案要求。','标题 / 正文 / 图片提示词','对比类内容应明确适用条件。'],
 ['生成与加工','生成介绍图，给真实截图加说明，处理演示片段。','图片 URL / 视频任务 ID','选用必要工具；源码截图可以用精确合成保留内容。'],
 ['保存草稿','将媒体、标签和文案保存到研究内容组。','草稿 ID / 素材组','先审阅再进入发布。'],
 ['渠道检查','读取平台规则与账号状态，校验素材。','可发布输入或需要处理的问题','没有账号时需要绑定，授权过期时需更新。'],
 ['发布执行','创建 Flow 或进入插件 / 用户接续步骤。','任务 ID / 等待用户操作','任务已创建并非已发布。'],
 ['结果回看','查询最终作品与实际可用指标。','作品链接 / 数据快照','用真实反馈调整下一条内容。'],
 ]},
 {id:'shop',title:'门店活动宣传',prompt:'根据店内照片和活动信息，准备三组图文与一条竖屏视频，分时发布。',steps:[
 ['提供素材','准备门店照片、活动时间和已确认价格。','照片 + 活动信息','事实来自商家，模型负责表达。'],
 ['批量规划','指定三条草稿、每条三张图，设置文案语气。','三组独立内容规划','quantity 和 imageCount 分别控制草稿与单条图片数。'],
 ['生成成品','调用图片 / 视频模型，必要时添加已有二维码。','图片 / 视频','二维码与 Logo 可通过 Sharp 精确叠加。'],
 ['人工审阅','核对商品外观、文字、价格和日期。','确认后的草稿','这是流程建议，原库不会自动核验商家事实。'],
 ['设置排期','选择目标账号和不同发布时间。','延迟发布任务','插件路径要准备好浏览器环境。'],
 ['等待完成','跟踪任务；需要接续的平台完成用户操作。','发布记录与作品链接','实际审核取决于平台。'],
 ['回复与分析','查看可取得的评论与作品数据。','互动结果 / 数据快照','对有需求的用户提供准确回复。'],
 ]},
 {id:'localize',title:'视频多语言复用',prompt:'把自己的中文产品视频转成英文版，并准备 YouTube 发布草稿。',steps:[
 ['源视频','提交可访问的自有视频，指定目标语言。','视频 URL + 语言要求','清晰音频有助于识别。'],
 ['翻译任务','调用 Aideo 处理字幕和配音，按需要选择识别方式。','处理任务 ID','ASR读音频，OCR读硬字幕，Vision综合理解。'],
 ['状态轮询','轮询外部处理服务，获得成功或失败信息。','译制视频地址','技能超时设置是执行规则，不是性能保证。'],
 ['审阅译制','检查术语、旁白、字幕与口型。','确认后的视频','本页只演示流程，不生成真实视频。'],
 ['文案与封面','生成英文标题说明，按时间点提取封面。','配套文案 + PNG封面','封面工具当前是 extractThumbnail。'],
 ['草稿和发布','保存草稿，检查 YouTube 授权，再创建发布任务。','草稿 ID + 发布任务','模型Key和社交账号授权是不同配置。'],
 ['追踪结果','确认作品链接及可取得数据。','作品与快照','语言适配完成不代表营销效果已验证。'],
 ]},
];
export const scenarios=[
 {title:'个人创作者 / 一人公司',input:'主题、参考素材、多个账号与一周计划。',process:'批量生成 → 草稿审阅 → 排期 → 结果回看。',value:'减少制作、上传与切换平台的重复工作，保持持续产出。',fit:'适合已明确内容方向和目标渠道；起步先接一个平台。'},
 {title:'开源项目研究与知识传播',input:'本仓库 README、研究笔记、真实截图和操作录屏。',process:'提炼场景 → 制作图文 → 编辑演示 → 保留来源 → 分发。',value:'把研究成果变成外部读者可以理解的内容，并形成稳定模板。',fit:'最贴合你当前的研究集；上游许可和事实核对仍保留。'},
 {title:'品牌与电商',input:'真实产品照片、卖点、受众与已确认活动信息。',process:'制作不同场景版本 → 叠加品牌素材 → 多渠道草稿与发布。',value:'提高素材复用和不同内容角度的产出效率。',fit:'商品外观、规格和价格需要审阅；模型生成不是事实来源。'},
 {title:'餐厅 / 民宿 / 本地门店',input:'现场照片、位置、活动与推广要求。',process:'图文与竖屏视频 → 排期 → 评论回应 → 可用指标查询。',value:'把线下活动组织为线上传播内容和交付任务。',fit:'到店与成交需另有实际记录，曝光不是到店归因。'},
 {title:'多语言与海外传播',input:'自有源视频、目标语言、海外账号。',process:'翻译配音字幕 → 封面与文案 → 审阅 → 目标渠道发布。',value:'复用原素材，降低逐语言制作和分发工作量。',fit:'术语、音色和文化表达需要审阅；渠道权限独立配置。'},
 {title:'代运营与多项目管理',input:'多个客户 / 项目的素材、账号和内容计划。',process:'分组 → 草稿 → 排期 → 发布记录 → 数据比较。',value:'集中管理素材与账号，减少记录散落。',fit:'分组管理已可见；复杂团队权限、客户审核和预算流程需另行设计。'},
];
export const values=[
 {priority:'优先使用',title:'把你的研究集转成媒体内容',why:'你已经有固定编号、来源、研究结论和真实截图，可以直接作为创作输入。最有价值的是减少整理成社媒内容的重复工作。',use:'先选择一个已经完成的子项目，产出“解决什么问题 / 怎么工作 / 适合谁”三张图和一条真实录屏草稿。',measure:'检查是否忠实于研究、署名完整、需要人工改动多少，以及单条内容准备时间。'},
 {priority:'优先研究',title:'借鉴 Agent、Skills 与工具的分工',why:'它提供了一个从 Markdown 工作知识到真实业务工具的实例，适合你理解怎样把多步骤能力做成可执行产品。',use:'参考技能加载、Schema参数、媒体任务轮询和发布状态；先给自己的 Agent 接只读研究工具或草稿工具。',measure:'流程能否追踪、失败能否解释、工具输入是否清楚、结果能否继续复用。'},
 {priority:'按需接入',title:'建立素材、草稿与发布模板',why:'从持续研究到持续发布之间，主要缺口是素材组织、文案审阅和排期。它的素材组和草稿结构可作为参考。',use:'按项目编号分组，固定保存来源、版本、封面和发布文案，先跑通一个渠道后再扩展。',measure:'找素材和核对版本是否更快，是否减少漏发、错账号和重复上传。'},
 {priority:'进阶扩展',title:'学习平台适配与异步任务工程',why:'不同平台授权、规则与完成方式不一致；统一接口背后需要队列、状态、错误分类和用户接续。',use:'研究平台元数据、发布 Flow、凭据刷新、最多三次发布执行和等待用户状态，再实现自己的业务任务。',measure:'任务创建、执行、失败与最终结果是否可区分和恢复。'},
 {priority:'条件满足再用',title:'多语言复用与矩阵分发',why:'当内容方向和质量已经稳定，多语言处理与多个渠道才能带来明显工作量收益。',use:'先用一段自己的视频比较人工处理和云翻译效果，再接第二个平台。',measure:'翻译审阅成本、生成费用、渠道权限和真实反馈。'},
 {priority:'需要业务前提',title:'推广任务与收入',why:'官方市场描述了订单与结算流程，代码只能支撑交付管理；订单、流量、转化与结算需要实际业务。',use:'已有商家合作时可研究交付、作品归属核验与任务证明；不将部署软件当作收入预测。',measure:'真实订单、审核通过率、实际结算与制作成本。'},
];
export const boundaries=[
 ['技能和可执行工具要分别核对','13个目录均被初始化复制；采集技能引用的任务工具未在当前运行工具中找到。文档存在并不自动形成执行入口。',refs.init],
 ['字幕工具当前未注册','video-utils的字幕工具注册、独立SubtitleMcp的运行时注册均已注释；Aideo翻译路径仍有字幕相关处理。',refs.runtime],
 ['封面技能使用旧接口名','技能说明引用 createThumbnailTask；实际可见工具是 extractThumbnail，以 ffmpeg 直接抽取指定时刻并上传。',refs.utils],
 ['互动读取有缺口','抖音插件评论与子评论列表仍标开发中；小红书插件作品详情抓取提示已移除。不能推导全平台所有动作都可用。',refs.dyPlugin],
 ['批量与并行是两回事','批量草稿使用队列；单次 Agent 系统提示要求工具顺序执行。实际吞吐由worker、模型与外部限额决定。',refs.prompt],
 ['规则在不同入口可能不同','批量兼容平台计算与平台发布元数据有独立约束。例如图数、时长与文字长度应在最终发布入口重新核对。',ai+'draft-generation/draft-generation-platforms.ts'],
 ['发布有等待用户的路径','抖音返回接续入口，小红书和视频号依赖插件；排期不代表服务器能独立完成所有渠道操作。',refs.douyin],
 ['数据字段多数是可选项','播放、曝光、点击和观看时长等字段支持统一表达，但平台可能不提供，或依赖其他采集服务。',refs.analytics],
 ['市场与旧服务不能混为一体','任务与钱包代码位于旧Electron服务；本研究未确认当前Web的完整交易、审核和结算部署链路。',refs.trade],
 ['画质、速度、收益需要实测','本项目已完成固定源码研究、13技能安装、GPT适配、3张真实生成图与本地图文草稿。未运行原后台、授权社交账号或真实发布，视频加工、业务指标和收益尚未实测。',refs.readme],
];
export const access=[
 ['官方网页','直接使用官方界面','访问 aitoearn.cn 或 aitoearn.ai；可用模型、套餐、任务和授权范围以所选环境为准。','https://aitoearn.cn/'],
 ['MCP 助手','把媒体工具接到已有助手','配置对应区域的 /api/unified/mcp 或 /api/unified/sse，使用 x-api-key。可以自己的部署地址替换域名。',source(refs.readme)],
 ['OpenClaw','将平台任务接进已有工作流','官方提供插件CLI；需匹配中国 / 国际区域的 API Key，当前研究未运行安装器。',source(refs.readme)],
 ['Docker 部署','控制自己的管理界面与数据','Compose启动后，再配置模型、账号授权、存储和可选Relay；模型与渠道凭据分别管理。',source(refs.deploy)],
 ['源码开发','修改能力与业务流程','前端独立Next.js；后端为Nx/NestJS工作区，业务服务与AI服务分开。Electron代码另有历史模块。',source(refs.deploy)],
];
export const screens=[
 {file:'author-create.png',title:'自然语言创作入口',caption:'作者提供的 v1.5.2 创作演示截图：输入故事需求并选择目标平台。此图展示操作入口，不能据此判断生成画质。',path:'presentation/display-1.5.2png.png'},
 {file:'author-publish.png',title:'发布日历',caption:'作者截图中的日历与新建作品 / Agent创建入口。画面当日无任务，日期和价格属于作者演示环境。',path:'presentation/publish-cn.png'},
 {file:'author-channels.png',title:'账号渠道连接',caption:'作者渠道选择截图。部分选项在截图中呈灰色；本文支持表按固定版本源码另行核对。',path:'presentation/channel-cn.png'},
 {file:'author-engage.png',title:'互动运营演示封面',caption:'作者互动演示视频的配图，属于产品演示资料，未代表本地执行结果。',path:'presentation/engage-thumbnail-cn.png'},
 {file:'author-monetize.png',title:'推广变现界面',caption:'作者提供的变现界面图片；订单、结算和收入属于平台业务，需真实条件验证。',path:'presentation/monetize-cn.png'},
];
export const metrics=['播放 / 浏览','曝光 / 触达','点赞 / 收藏','评论 / 分享','保存 / 点击','互动总量','观看时长','数据快照与获取时间'];
