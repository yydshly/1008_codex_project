"""原创逐技能机制说明；由固定提交的 SKILL 与其引用工具核对，不是运行承诺。"""
# 一行一个技能：id | 原理与实际产物。全文流程另从 SKILL 保留供核对。
ROWS = r"""
asset-manager|扫描 outputs 产物，以元数据做归档、标签与清单查询；assets.py 管文件索引，内容质量判断仍交给 Agent。
batch-process|Agent 将自然语言操作转成批处理参数；batch_process.py 遍历文件，按类型调用图片、音频或视频工具，汇总成功与失败。
skill-my-account|account_stats.py 复用各平台登录态读取自己的身份与作品数据；不是任意账号的全量公开爬虫，字段受平台可见范围限制。
skill-profile-builder|Agent 访谈运营意图、读用户资料和可访问社媒页面，生成六份 Markdown 画像；Web 先确定性写基线再后台增强，受限链接退回用户自述。
skill-profile-manager|通过文件读写维护六维画像和记忆，按画像名切换上下文；用户可编辑、导出和对比，不涉及模型微调。
template-library|templates.py 把成功的结构保存为模板和版本元数据，再由 Agent 填充变量复用；保存的是内容骨架，不是训练权重。
skill-algorithm-updates|Agent 用 web_search 查带年份的平台规则词，再 web_fetch 重点页面；把官方确认、媒体报道与社区感知分开，输出影响及建议。
skill-competitor-analysis|Agent 读取公开主页与近期作品，失败时退回搜索；按选题、结构、互动和异常高表现归纳规律，非公开后台指标不能补猜。
skill-content-gap-analysis|交叉核对搜索需求、热榜与评论、竞品供给，按文档五维权重评价机会；评分由 Agent 判断，不是自动训练的检索排序器。
skill-cross-platform-diff|读取平台特性和已有内容，从受众、形式、话语、分发、变现比较改编路线；主体是知识规则分析，不是九平台实时 API 抓取。
skill-event-calendar|静态事件资料配合必要的实时查询给出节点清单；lunar.py 用 1900–2100 年表换算农历，calendar_ops.py 可写入日历。
skill-news-intelligence|fetch_news.py 并发抓三种专用站点和八个 RSS，按标题关键词及部分源时间窗过滤；Agent 再结合画像解释资讯和选题。
skill-rss-aggregator|rss_digest.py 用 urllib 拉用户提供的 RSS/Atom，XML 解析后按标题＋摘要关键词、时间窗、链接去重和日期排序，导出 JSON/Markdown。
skill-trending-topics|Agent 通过 web_fetch 读取第三方聚合热榜 JSON，再按画像标相关度和二创建议；Web 雷达另有独立的六源获取接口，没有画像过滤。
skill-ugc-discovery|Agent 用品牌词、话题词和 site: 查询寻找笔记、视频、问答及论坛讨论，再抓页面核对、去重、判情感并给互动建议。
skill-account-diagnosis|读六维画像和真实近期内容数据，按垂直度、定位、流量与限流迹象组织证据和处方；缺数据时需要补充，不能诊断真实平台内部原因。
skill-article-outline|搜索用户问题与同题内容，Agent 组织 H2/H3、目标字数、证据、图表及 FAQ；产物是写作大纲而非已验证的搜索排名。
skill-audience-profiler|利用画像、公开互动或用户数据推导人群、痛点、内容偏好与渠道，形成受众卡；人口特征和规模缺证据时属于待验证假设。
skill-brand-onboarding|按结构化访谈收集品牌、受众、视觉、语气和目标，形成账号档案；是信息采集和文档生成，不会自动注册或运营真实账号。
skill-campaign-planner|Agent 拆目标与预算，安排预热、爆发、返场、多平台内容、KOL 与 KPI；产物是策划方案，投放与联系合作方需要另行执行。
skill-carousel-planner|将主题拆成封面、逐页文案与视觉、转场节奏和 CTA，附互动评价；这是分页策划，图片导出须调用制作技能。
skill-collab-proposal|根据品牌和创作者资料生成价值主张、合作形式、交付物、排期与报价框架；输出提案，不替用户联系品牌或签约。
skill-content-calendar|先读现有日历避免撞期，Agent 把内容支柱、节点和频次排成月度表；可落入 calendar_ops，日历条目不等同已经启动定时发布。
skill-content-matrix|把内容支柱和多种内容格式交叉组合，每格产出角度与执行题；矩阵是 Agent 生成的候选池，还需评估与制作。
skill-content-strategy|从账号目标与受众出发定义内容支柱、转化路径、90 天节奏、渠道和指标；产出策略文档，执行效果依赖真实反馈。
skill-hook-generator|Agent 按钩子公式产生多种开头并说明适用场景，wordcount.py 校验字数；钩子评分是规则评价，不是已预测的真实点击率。
skill-livestream|把直播目标拆成分钟级流程与开场、互动、转场、催单等话术，生成直播运行表；没有自动开播或数字人直播守护程序。
skill-positioning-analysis|结合赛道与竞品，在人群、场景、价值、形式、人设维度找差异，凝练一句话定位与内容落地；由 Agent 做研究和归纳。
skill-topic-evaluator|按流量、画像匹配、竞争、时效、变现、成本及风险逐维评分，给做／不做／改角度建议；没有自动上线试验验证潜力。
skill-trend-rider|将给定热点和账号画像匹配，生成切入角度、形式、标题与风险提醒；不强制先爬全网，也不自动执行发布。
skill-voice-builder|分析写作样本并访谈语气、词汇、节奏与禁用表达，生成声音画像供后续提示；这里的声音是写作风格，与音色克隆分开。
ai-image-gen|ai_image.py 封装 OpenAI 兼容生图／编辑／变体，按服务支持同步或任务轮询；模型与 key 由用户配置，Easel 不自带图像基础模型。
ai-music|ai_music.py 向 DashScope 或 Suno 类兼容服务提交音乐任务，轮询并下载音频；源文件明确说明这些适配器未用真实 key 实测。
ai-video-gen|ai_video.py 通过 Wan、Seedance、可灵及兼容服务异步提交文生／图生视频任务，轮询下载；provider 支持不代表任何账号都可调用。
audio-denoise|audio_ops.py 调 FFmpeg 的 afftdn、高通、低通等滤镜减少噪声；是信号处理，过强参数也会伤人声，需听音确认。
audio-editing|audio_ops.py 用 FFmpeg 做裁剪、转码、归一化、拼接、淡入淡出及保音高变速；输入音频变成处理后的媒体文件。
audio-mix|audio_mix.py 组合旁白、循环 BGM 与音效，用滤镜混合并支持旁白驱动的音乐闪避；产物是一条混音轨。
audio-visualizer|audio_viz.py 将音频转成波形或频谱动画，并叠标题和封面后编码为视频；画面来自音频信号，不是生成实拍场景。
auto-short-video|Agent 编排脚本、配图／AI 片段、配音、字幕和 BGM；assemble.py 读取 storyboard JSON 用 FFmpeg 合成，默认逐句配图加 Ken Burns 缓动。
auto-subtitle|asr.py 用 faster-whisper 转录语音并写 SRT／ASS／TXT／JSON；烧录需再用 FFmpeg，首次本地模型下载和中文识别校对是额外条件。
beat-sync-video|beatsync.py 用 librosa 检测音乐节拍，以节拍切换图片／视频并添加效果，再用 FFmpeg 编码；检测失败退回等间隔切换。
card-design|Agent 依视觉规则选择配色、字体、密度与版式；card_audit.py 做可检查的卡片审计，不能代替对内容与审美的人工判断。
card-quote|Agent 生成横版金句／数据卡 HTML，render_card.py 用 Playwright Chromium 截取元素；实际产物是图片，不是大模型直接绘制文字。
card-xiaohongshu|按 card-design 组织 1080×1440 多页 HTML，Chromium 截图导出卡组并跑审计；文字在 HTML 中排版，避免生图模型错字。
chart-visualization|Agent 把数据转成规定 JSON，用 curl POST AntV gpt-vis 公共接口，取返回的静态图片 URL；依赖远程服务可用性。
clipify|Whisper 转录后由 Agent 选笑点；手工指定脸部 ROI，用帧差估计说话人、动态裁切与 ASS 逐字字幕；优先英文口播，非通用人脸追踪模型。
comparison-card|Agent 编写参数、优劣与结论的 HTML/CSS 对比卡，render_card.py 截图；对比依据要先核实，渲染器不自动判断产品优劣。
copywriting|Agent 提炼卖点、证据与转化路径，按场景生成标题、正文和 CTA，再做字数校验；转化效果没有程序保证。
data-report|report.py 读取 CSV／Excel／JSON 并生成含指标、图表、表格的报告 HTML，Agent 写洞察，可进一步截图；输入数据口径需用户核实。
doc-convert|doc_convert.py 把 Markdown 转成排版 HTML，再用浏览器打印 PDF 或截图长图；需要排版和浏览器依赖，非万能 Office 转换器。
ecom-details-image|Agent 先生成商品主图、场景、卖点与详情页方案／Prompt，generate_image.py 可调配置的生图接口；涉及商品事实和生成费用。
green-screen|chromakey.py 用 FFmpeg 按绿／蓝／指定颜色抠视频并叠背景；依赖拍摄背景与阈值，不是任意背景的语义视频分割。
gzh-design|先规范化文稿，再由 Agent 从主题组件库装配内联样式 HTML；校验脚本检查公众号禁用项与文本包裹，预览壳提供富文本复制。
image-editing|image_ops.py 用确定性图片处理做缩放、裁切、补边、格式、压缩、水印与拼图；Agent 只负责理解用户参数和选择操作。
image-enhance|img_enhance.py 用 Pillow 的 Lanczos、锐化、对比度和可选 OpenCV 去噪增强；源码明确是传统增强，不能凭空恢复丢失细节。
infographic|Agent 选择 AntV 本地 JS 信息图模板；动态模式用 gif_chart.py 逐帧生成 GIF，可衍生视频，与远程单图 API 的 chart 技能不同。
meme-generator|meme_ops.py 依据模板叠加带描边的上下大字或配文条，自动换行与适配字号，输出梗图；不自动寻找版权可用的底图。
mindmap|mindmap.py 将 Markdown 层级解析成节点，渲染交互式导图 HTML，可导出 PNG；内容关系来自输入大纲。
multi-voice-dubbing|multivoice.py 读 cast 和逐行对白，分别调用 TTS／音色服务，再拼接多角色音轨与角色字幕；音色情绪支持受 provider 限制。
novel-writer|novel_ops.py 管世界观、人设、大纲、章回状态和伏笔；正文由 Agent 生成并校验字数，文件状态帮助跨章一致而非保证文学质量。
paper-explainer|paper_ingest.py 接收 arXiv／PDF 并整理文本与图，Agent 解读问题、方法和证据，render_slides.py 制作讲解页，再接图文／视频工具。
post-formatter|Agent 用 PAS／AIDA／BAB 等结构组织帖子与移动端分行，wordcount.py 校验长度；输出成稿，平台投放需发布技能。
poster-hero|Agent 将标题、卖点与二维码组织成 1080×1920 HTML 海报，再以 Chromium 截图；图文排版和素材选择分别完成。
remove-bg|remove_bg.py 调 rembg／ONNX 的 u2net 等语义分割模型，生成透明 PNG 或换背景；需首次下载模型，与按颜色抠绿幕不同。
short-drama|Agent 维护剧集圣经、角色参考、分集和逐镜计划，调用 I2V、对白审计、配音与 FFmpeg 合成；多集一致性依赖参考素材和模型表现。
slideshow-video|slideshow.py 把图片序列按时长做 Ken Burns、转场、配乐与字幕，FFmpeg 编码成相册视频；无需生成动态镜头模型。
social-content|Agent 结合账号、平台和目标生成钩子、正文、标签及互动引导，用字数工具检查；是通用文案入口，制作和发布按需组合。
style-transfer|Agent 分析目标风格或参考样本，改变语气、措辞和句式，同时保持核心事实；本技能没有独立风格迁移模型或脚本。
subtitle-translate|subtitle_ops.py 解析、导出和检查字幕时序，翻译文本由 Agent 完成，再组装单语／双语字幕及可选挂载／烧录。
text-condenser|Agent 按硬字数、摘要或金句模式保留主信息，wordcount.py 校验；压缩选择是语言模型判断，需要核对事实是否失真。
text-polisher|Agent 依清晰度、语气、价值、证据、具体性、情感、风险七轮规则润色和减少模板表达；不承诺通过任何外部 AI 检测器。
tts-voiceover|tts.py 在配置 VOICE_PROVIDER 时转云端 TTS，否则用 Edge 在线 TTS 兜底，并可输出分句字幕及转码；语音合成需要网络或配置服务。
video-chapters|先用 ASR 获取带时间轴转录，Agent 按主题变化划分章节，生成平台描述所需时间戳目录；语义分章非 FFmpeg 自动理解。
video-editing|Agent 将自然语言映射到 video_ops.py 参数，FFmpeg／ffprobe 完成裁剪、拼接、静音跳切、抽帧、变速、压缩和叠加。
video-highlights|highlight_cut.py 可按音频能量找峰值候选；另一条路径先转录再由 Agent 挑内容亮点，剪切、转竖版和字幕各接媒体工具。
video-intro-outro|intro_outro.py 渲染标题／logo／关注引导片头片尾，与主片硬切或淡入淡出拼接；需现有主片和视觉素材。
video-production|video_pipeline.py 转发给内置 video-pipeline-sdk：已有原片经转录、分场、设计表、Remotion 代码、验证预览到渲染；SDK 状态与人审停点是程序接口。
video-reframe|reframe.py 用 FFmpeg 补边、模糊背景或焦点裁切，可选 OpenCV 人脸检测；裁切不能保证所有运动主体始终正确入画。
video-script|Agent 根据画像、平台、时长和素材写 Hook、分秒台词、镜头、字幕、封面与章节；wordcount.py 校验口播长度，分镜再传给制作工具。
video-strategy|Agent 参考模型能力、成本与制作目标，选择实拍处理、配图动效或 AI 视频路线并出计划；不是程序自动用统一基准测评模型。
video-to-article|ASR 抽取视频语音，Agent 重组为目标平台文章，video_ops.py 抽帧配图；需校对转录与上下文，非逐帧完整视觉理解。
voice-clone|voice_clone.py 向配置的云服务提交本人样本生成音色标识，再用该音色做 TTS；提供服务客户端，不自带可训练的本地克隆模型。
xhs-note-creator|Agent 分析素材与卖点，生成标题正文、caption、标签和卡片／分镜；素材分析、元数据校验、拼图与卡片渲染脚本辅助交付。
skill-bilibili-upload|bili_upload.py 组织 B 站投稿参数并调用上传工具；Web 发布分支实际使用 biliup CLI 和 cookies.json，标题分区与稿件权限受平台限制。
skill-channels-upload|委派 web_publisher.py 用 Playwright 操作视频号创作者页面，填写稿件并确认；需登录态和页面选择器可用。
skill-community-ops|Agent 对评论按赞美、提问、求购、争议分层生成回复和处理规则，危机时生成声明草稿；不自动替用户批量对外发言。
skill-content-repurposing|Agent 先抽出核心论点，再按平台文体、长度与形式改编，输出各版本；Web 的一稿多改按钮显式调用，点击发布不会自动先改编。
skill-cross-platform-publish|publish_dispatch.py 检查格式并产出平台派发计划，Agent 再调用对应发布技能与回写；派发脚本本身不改稿也不上传。
skill-douyin-upload|douyin_publish.py 用 Playwright 持久登录态上传视频／图文、等转码、填写与提交，并做内容防泄漏和发布回读验证。
skill-kuaishou-upload|web_publisher.py 的快手路线操作创作者中心视频投稿，依赖 Playwright 与已登录会话；页面改变或验证码需人工处理。
skill-persona-check|Agent 对照六维画像给一致性分与偏离点；persona_gate.py 低分记 warn，但 publish_allowed 始终为 true，不是硬拦截。
skill-publish-checklist|Agent 按清单检查标题、封面、标签、标记、链接与 CTA 并列出缺项；没有覆盖所有发布入口的独立程序强制闸门。
skill-publish-notify|notify.py 按结果格式向配置的群机器人、Telegram、Slack 或 webhook 发送 HTTP 通知；需要 token／URL，只有获得用户授权才实际推送。
skill-publish-scheduler|publish_queue.py 存 JSON 队列、筛到期项和标记状态；run --exec 仍只输出派发计划并写备注，实际发送及周期唤醒依赖上层 Agent／cron。
skill-quality-gate|Agent 分别审查平台合规与产物完整、可读、适配度，形成质量报告；Web 发布页仅展示预检提醒，不根据报告内容程序阻断。
skill-risk-scanner|Agent 检查文字相似迹象、素材许可和引用规范并建议修正；文档明确没有技术查重，不可把其结论当版权数据库核验。
skill-seo-quality|Agent 校验搜索意图与关键词在标题、正文、标签、封面布局，并建议搜索／推荐流量取舍；不保证搜索排名或平台权重。
skill-short-link|shortlink.py 拼接 UTM 参数并调用短链服务，生成带渠道标记的 URL；点击统计仍依赖目标分析平台或服务。
skill-wechat-publisher|Agent 研究和写文，html_converter.py 转排版，公众号 API／登录会话上传素材与建草稿；Web 按钮交付草稿箱，不等于自动群发。
skill-xhs-comment-reply|xhs_comment.py 从接口响应提取评论，用 DOM 定位回复／删除，支持去重、间隔与 dry-run；写操作必须有用户授权和可用登录态。
skill-xhs-publisher|xhs_publish.py 用 Playwright 持久登录态上传图文／视频、填标题正文话题、等待完成与校验，内容 guard 可拦敏感凭证泄漏。
skill-zhihu-answer|Agent 搜问题、检查可答性和写答案，zhihu_answer.py 通过 Playwright 发布；问题状态、登录和页面布局是执行条件。
skill-zhihu-publisher|web_publisher.py 的知乎路线填写专栏文章／草稿并操作提交；需要已登录会话，不能把支持入口等同已实测发布成功。
roi-calculator|calc.py 根据真实花费、曝光、点击、转化和收入算 CTR／CPC／CPM／ROAS 等，Agent 解释差异；行业基准与归因口径需注明来源。
skill-comment-insights|comment_insights.py 用 SnowNLP＋社媒词典修正情感，jieba 提取词频／短语，正则计需求与疑问；Agent 再解释，反讽和语境仍可能误判。
skill-content-calendar-log|calendar_ops.py 持久化发布、计划与活动事件并提供时间区间查询，Web 发布可回写；只是统一时间线，不是自动发稿进程。
skill-content-postmortem|aggregate.py 归并真实表现数据，Agent 按 Hook、结构、选题、时间和平台解释单条或多条规律；相关性不能直接证明因果。
skill-data-tracker|track.py 存账号及作品快照，计算增长趋势和生命周期；快照来自用户／取数模块，不会凭空补历史数据或保证预测。
skill-post-scorer|score.py 按点赞＋评论×3计算历史互动并筛 Top 10%；Agent 从高表现样本提炼特征、给草稿五维评分，脚本本身不预测草稿表现。
skill-publish-analytics|analyze.py 聚合日志，按时间、标签、类型和粉丝变化比较表现，再由 Agent 归因建议；前提是日志已回填可比较的真实指标。
skill-publish-log|log.py 把标题、平台、时间、链接、状态和表现写入发布记录，提供查询／更新；记录成功状态仍需要可靠的平台回读证据。
skill-social-performance-review|review.py 汇总指定月份账号／作品数据，Agent 组织表现、问题与下月动作的复盘报告；缺平台数据时须说明覆盖范围。
skill-strategy-advisor|Agent 综合历史表现、画像与行业趋势提出方向、形式、节奏和画像微调；长期记忆更新按工作区规则先取得用户同意。
skill-xhs-analyzer|SKILL 委派外部 @lucasygu/redbook CLI 搜索、读笔记和账号分析；文档注明依赖 macOS Chrome cookie／钥匙串，当前平台不可用路线保留。
"""
MECHANISMS = dict(line.split("|", 1) for line in ROWS.strip().splitlines())
