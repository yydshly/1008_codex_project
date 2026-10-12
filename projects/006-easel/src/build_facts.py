"""原创源码事实清单。链接定位到固定版本的实际行号；不随上游 main 漂移。"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
UP = ROOT / 'upstream'
COMMIT = 'fb80ae6dd6fc26f5553efcb293ee6d93ef253f02'
BASE = f'https://github.com/ZJU-REAL/Easel/blob/{COMMIT}/'
NEWS = 'skills/openclaw/skill-news-intelligence/scripts/fetch_news.py'
RSS = 'skills/openclaw/skill-rss-aggregator/scripts/rss_digest.py'
HOT = 'web/app.py'

def evidence(path, needle=None, label=None):
    lines = (UP/path).read_text(encoding='utf-8-sig').splitlines()
    line = next((i+1 for i,s in enumerate(lines) if needle and needle in s), 1)
    if needle and line == 1 and needle not in lines[0]:
        raise ValueError(f'定位失败 {path}: {needle}')
    return {'path': path, 'line': line, 'label': label or path.split('/')[-1], 'url': BASE+path+f'#L{line}'}

layers = [
 ('general','基础与画像',6,'访谈、账号取数、六维文件、模板和产物管理，为所有任务提供上下文。','用户输入／公开资料 → 画像 Markdown、记忆与素材索引'),
 ('discover','发现与检索',9,'热榜、资讯、RSS、竞品、UGC 与规则研究；程序取数和 Agent 分析有不同边界。','原始信息 → 带来源的情报、节点和候选选题'),
 ('plan','策划与定位',16,'定位、受众、选题矩阵、钩子、大纲、活动和日历，主体由 Agent 按规则组织。','画像＋资料 → 内容策略、结构、排期和执行方案'),
 ('produce','内容与媒体制作',52,'文案及视觉、图像、音频、视频、短剧和论文解读；脚本封装媒体处理与模型客户端。','脚本／素材 → 图文、音频、字幕、视频与项目文件'),
 ('publish','检查与分发',20,'改编、风险与质量检查、平台发布、排期、通知和评论运营；必须看具体入口的执行方式。','成品＋登录态 → 预检、派发计划、平台稿件或草稿'),
 ('attribute','数据与复盘',11,'快照、日志、指标计算、评论洞察、内容复盘和策略迭代；效果数据需要真实采集。','真实表现＋历史 → 统计、解释、建议与可批准的记忆更新'),
]
sources = []
for key,name,route,backup in [
 ('weibo','微博','weibo','weibohot'),('douyin','抖音','douyin','douyinhot'),
 ('zhihu','知乎','zhihu',None),('bilibili','哔哩哔哩','bili','bilibilihot'),
 ('baidu','百度','baidu/hot','baiduhot'),('toutiao','今日头条','toutiao',None)]:
    sources.append(dict(id=key,group='hot',name=name,key=key,url='https://60s.viki.moe/v2/'+route,
     backup='https://v2.xxapi.cn/api/'+backup if backup else '',method='第三方聚合 JSON · urllib GET · 8 秒超时',
     parse='兼容 data 数组，或 data.data／data.list；取标题、热度、链接字段，跳过空标题。',
     filter='允许的平台 key → 主源／备用 → 300 秒缓存 → 保留原顺序 → 前 1–30 条；Web 不按画像或关键词筛选。',
     limits='不是官方平台授权 API。主源失败尝试已配置备用；全部失败可用旧缓存，否则空列表。updated 是本次响应时间。',
     auth='此获取接口不需 key／社媒登录；依赖聚合服务', evidence=[evidence(HOT,'TREND_SOURCES:'),evidence(HOT,'def _parse_hot'),evidence(HOT,'async def api_trends')]))

rss_specs=[
 ('woshipm','人人都是产品经理','https://www.woshipm.com/feed','自媒体／运营','无内置统一时间窗'),
 ('huxiu','虎嗅','https://www.huxiu.com/rss/0.xml','商业／科技／消费','无内置统一时间窗'),
 ('tmtpost','钛媒体','https://www.tmtpost.com/feed','科技／商业','无内置统一时间窗'),
 ('geekpark','极客公园','http://www.geekpark.net/rss','科技／数码','无内置统一时间窗'),
 ('sspai','少数派','https://sspai.com/feed','数码／效率／生活方式','无内置统一时间窗'),
 ('infoq_cn','InfoQ 中文','https://www.infoq.cn/feed.xml','技术／开发','无内置统一时间窗'),
 ('aihot','AIHOT','https://aihot.virxact.com/rss','AI 资讯','24 小时；时间解析失败仍保留'),
 ('thepaper','澎湃新闻（FeedX 转接）','https://feedx.net/rss/thepaper.xml','时事／社会','48 小时；时间解析失败仍保留')]
for key,name,url,area,window in rss_specs:
    sources.append(dict(id=key,group='news',name=name,key=key,url=url,backup='',
     method='RSS／Atom · requests GET · BeautifulSoup 解析',
     parse='抓 item／entry，读取标题、link／guid、发布时间、摘要（最多 300 字符）；先取 max(limit×4,30) 条。',
     filter=f'{area}；{window}。多个关键词只匹配标题，忽略大小写、逗号 OR，再按单源 limit 截取。',
     limits='RSS 获取失败重试三次再返回空。原 rss_parser 使用 verify=False；本研究网页不执行该抓取。不是全网搜索，也没有统一去重／排序。',
     auth='不需模型 key；公开 feed，部分源是第三方转接',evidence=[evidence(NEWS,'RSS_SOURCES ='),evidence(NEWS,'def create_single_rss_fetcher'),evidence('skills/openclaw/skill-news-intelligence/scripts/rss_parser.py','def fetch_rss_feed')]))
for key,name,url,method,parse in [
 ('36kr','36氪快讯','https://36kr.com/newsflashes','HTML · requests GET','BeautifulSoup 选择 .newsflash-item，再取 .item-title、href 和 .time；页面结构变动会抓空。'),
 ('wallstreetcn','华尔街见闻','https://api-one.wallstcn.com/apiv1/content/information-flow?channel=global-channel&accept=article&limit=30','站点 JSON · requests GET','data.items.resource 中取 title／content_short、uri 和 display_time；没有通用全文抓取。'),
 ('tencent','腾讯新闻','https://i.news.qq.com/web_backend/v2/getTagInfo?tagId=aEWqxLtdgmQ%3D','站点 JSON · requests GET + Referer','读 data.tabs[0].articleList，取 title、url／link_info 与 pub_time／publish_time；依赖接口字段不变。')]:
    sources.append(dict(id=key,group='news',name=name,key=key,url=url,backup='',method=method+' · 10 秒超时',parse=parse,
     filter='标题关键词子串匹配，逗号 OR，忽略大小写，再截 limit；没有画像语义检索，也没有通用时间窗。',
     limits='抓取异常返回空列表。HTML／内部 JSON 接口可能受改版、反爬和地域影响。',auth='代码不要求 key／登录',
     evidence=[evidence(NEWS,'def fetch_'+key if key!='36kr' else 'def fetch_36kr'),evidence(NEWS,'def filter_items')]))

for key,name,route in [('rednote','小红书热榜','rednote'),('60s','每日新闻','60s'),('it-news','IT 资讯','it-news'),('ai-news','AI 资讯','ai-news')]:
    sources.append(dict(id='ref-'+key,group='reference',name=name,key=key,url='https://60s.viki.moe/v2/'+route,backup='',
     method='hotlist-apis.md 列出的可选 web_fetch 端点',parse='文档参考；具体结构需调用时核验。',
     filter='未接入 Web 六源 TREND_SOURCES；也不属于 fetch_news.py 的 11 个 source key。',
     limits='文档里的“已验证”是作者记录，本研究没有将它转成当前可用性保证。',auth='文档称无需 key',
     evidence=[evidence('skills/shared/hotlist-apis.md',route)]))
sources.append(dict(id='ref-03c3',group='reference',name='03c3 每日早报',key='03c3',url='https://api.03c3.cn/api/zb',backup='',
 method='文档补充来源',parse='只在热榜参考文档列出。',filter='没有 Web 或资讯脚本接入。',limits='作者注明不稳定；研究未实时请求。',auth='公共接口',evidence=[evidence('skills/shared/hotlist-apis.md','03c3')]))
sources.append(dict(id='custom-rss',group='custom',name='用户自定义 RSS／Atom',key='--url / --feeds',url='用户提供订阅 URL 或每行一个 URL 的文本清单',backup='',
 method='urllib GET → XML ElementTree（纯标准库）',parse='RSS2／Atom 解析；摘要清洗 HTML，提取标题、链接、发布时间。',
 filter='标题＋摘要关键词 OR → 最近 N 天（--since）→ 链接去重 → 解析日期降序 → limit。空标题跳过，日期无效时保留。',
 limits='只访问指定 feed，不自动发现所有网站 RSS；无语义召回或自动 Newsletter 邮箱读取。',auth='公开订阅 URL；私有订阅取决于用户提供的 URL',evidence=[evidence(RSS,'def parse_feed'),evidence(RSS,'def cmd_fetch')]))
for id,name,method,parse,limits,path in [
 ('web-search','开放网页研究','OpenClaw 提供的 web_search／web_fetch','按关键词／site: 查询候选 → 获取页面 → 交叉核对 → Agent 总结与评级。','用于竞品、UGC、算法更新、需求研究等；搜索提供商由实际 OpenClaw 运行配置决定，不是仓库固定的全网爬虫。','skills/openclaw/skill-ugc-discovery/SKILL.md'),
 ('own-account','自己的已登录账号','account_stats.py + 平台持久化登录态','读取身份、粉丝、作品及平台公开给自己的指标；各平台字段不同。','需要登录、cookie 或会话；不能推广成能获取任何竞品的后台完播／转化数据。','skills/shared/scripts/account_stats.py'),
 ('redbook','小红书外部分析 CLI','@lucasygu/redbook · redbook search/read/analyze-viral','搜索笔记、读取笔记、互动和账号报告，逻辑由外部 npm 包提供。','文档注明 macOS、Node 22+ 与 Chrome cookie／钥匙串依赖；当前 Windows 环境未运行。','skills/openclaw/skill-xhs-analyzer/SKILL.md'),
 ('paper','用户文档与论文输入','本地素材／arXiv／PDF → paper_ingest.py','论文文字与图表整理后，由 Agent 解读并制成图文／讲解视频。','这是定向资料输入，不是全学术库持续索引；PDF 解析和解读仍需核对。','skills/openclaw/paper-explainer/scripts/paper_ingest.py')]:
    sources.append(dict(id=id,group='agent',name=name,key=id,url='按任务输入／运行时配置确定',backup='',method=method,parse=parse,
     filter='Agent 按 SKILL 判断相关度、真实性和用途；需实际执行文档要求。',limits=limits,auth='依路径可能需要模型服务、外网或登录态',evidence=[evidence(path)]))

components=[
 ('账号画像','identity / style / audience / platforms / preferences / memory','六份 Markdown 文件分别保存定位、风格、受众、平台、偏好和记忆。Web 表单确定性生成初稿，再后台增强；每轮传画像名和路径，由 Agent 读取。',evidence('web/app.py','def _write_baseline_profile'),evidence('easel/persona.py','def persona_prefix')),
 ('Agent 编排','OpenClaw + SKILL.md','CLI 和 Web 把“请执行 /技能”及输入交给 OpenClaw subprocess。任务可按需组合发现、策划、制作、发布与复盘，不强制每次跑完整五步。',evidence('easel/commands/skill.py','def cmd_skill'),evidence('web/app.py','def run_agent_sync')),
 ('工作台与数据','React / TypeScript + FastAPI','会话流、模型与画像配置、内容库、媒体预览、热榜、选题池、内容日历、登录与发布中心。后端连接文件、Agent 和工具；不是静态宣传站。',evidence('web/app.py','async def api_trends'),evidence('web/app.py','async def api_schedule_context')),
 ('文字与知识创作','LLM + 字数 / 状态脚本','语言模型负责文案、脚本、策略与解释。Python 固化字数、状态和统计，帮助跨章、跨镜续作；没有附带自训练文本基础模型。',evidence('skills/openclaw/video-script/SKILL.md'),evidence('skills/shared/scripts/wordcount.py')),
 ('确定性媒体','FFmpeg / Pillow / Chromium','FFmpeg 做音视频处理与合成；Pillow 做图片操作；HTML/CSS 在 Chromium 中截图成卡片。ASR、去背景等另用本地模型。',evidence('skills/shared/scripts/video_ops.py'),evidence('skills/shared/scripts/render_card.py')),
 ('生成模型适配','图片 / 视频 / TTS / 音乐 provider','统一脚本读取环境配置，向外部服务提交任务、轮询、下载。能力依赖服务开放、模型、费用和 key；内网 MaaS 路线不是普遍可用接口。',evidence('skills/shared/scripts/ai_video.py'),evidence('skills/shared/scripts/model_registry.py')),
 ('原片包装产线','video-pipeline-sdk + Remotion','薄壳转发给仓库内置 SDK；带运行态、问题／作答、程序质量门、设计表与预览人审停点。与 FFmpeg 配图短视频是两条不同路线。',evidence('skills/openclaw/video-production/scripts/video_pipeline.py'),evidence('skills/openclaw/video-production/SKILL.md')),
 ('平台分发与复盘','Playwright / biliup / 公众号草稿','发布按平台走不同适配器，成功后记录日历和日志。再从真实数据计算表现，Agent 给改进建议；长期记忆写回需按规则征求用户同意。',evidence('web/app.py','async def api_publish(platform'),evidence('openclaw/workspace/AGENTS.md','记忆')),
]
pipeline=[
 ('01','定账号方向','收集自述、目标、平台、喜好与红线；读可访问账号资料。输出六维画像，可手动修改。','确定性文件＋Agent 增强',evidence('web/app.py','async def api_profile_build')),
 ('02','获取与筛选','热榜／新闻／RSS 的程序路径先返回条目；Agent 再读画像、评价相关度和时效、给选题理由。','程序过滤＋Agent 判断',evidence(NEWS,'def filter_items')),
 ('03','脚本与分镜','video-script 按时长和平台写 Hook、时间轴、台词、镜头、字幕与封面；auto-short-video 将其整理成 storyboard。','Agent 生成＋字数检查',evidence('skills/openclaw/video-script/SKILL.md')),
 ('04','生成和合成','可选卡片／AI 图／AI 片段；云 TTS 或 Edge 配音，ASR／SRT 字幕与 BGM，FFmpeg 合成 MP4。已有原片包装另走 Remotion SDK。','工具执行＋外部模型',evidence('skills/openclaw/auto-short-video/scripts/assemble.py')),
 ('05','预览与发布','Web 可先点一稿多改；发布点击后预检母版标题正文、显示报告，再弹确认，随后分别调用选中平台。','用户确认＋平台适配器',evidence('web/frontend/src/components/PublishPage.tsx','const publishAll')),
 ('06','记录与迭代','回写发布记录与日历，取真实指标做统计和复盘；经验是否写入长期画像记忆需按工作区规则确认。','文件记录＋统计＋Agent',evidence('openclaw/workspace/AGENTS.md','记忆')),
]
findings=[
 ('“定方向后搜索、制作、发布”是否成立？','可以作为一种任务组合。账号画像是上下文，Agent 依任务选择技能。CLI／Web 没有把这五步写成每次必须执行的固定流水线。',evidence('easel/commands/skill.py','def cmd_skill')),
 ('114 个技能 ≠ 114 个都已端到端实测','按目录逐项计数：6＋9＋16＋52＋20＋11。README 徽章为 113，能力地图创作层为 51；本页以固定提交实际 SKILL.md 为准。',evidence('docs/skill-function-mapping.md')),
 ('画像不会自动进入热榜接口过滤','TrendsPage 默认选微博／抖音／知乎，Web API 只接 platforms 和 limit。相关度高／中／低和二创建议是 trending SKILL 对 Agent 的要求。',evidence('web/app.py','async def api_trends')),
 ('命中太少会放宽资讯关键词','fetch_news.py 命中少于 5 条时再无关键词抓取，补足并打 smart_fill；这些补充项不能当作严格关键词命中。',evidence(NEWS,'MIN_ITEMS = 5')),
 ('低人设分不会阻断 Web 发布','persona_gate 总是 publish_allowed=true；Web 展示预检并让用户确认，即使预检异常也可继续。媒体和凭证 guard 是另外的程序约束。',evidence('skills/shared/scripts/persona_gate.py','publish_allowed')),
 ('预检覆盖母版，不等于逐平台复检','Web performPrecheck 使用 title／body；publishAll 发送各平台 effective 版本。改编后的覆盖文案与媒体不由这次母版预检完整检查。',evidence('web/frontend/src/components/PublishPage.tsx','const performPrecheck')),
 ('公众号默认是草稿；排期不是守护服务','Web 公众号路线明确返回草稿箱；publish_queue run --exec 输出派发计划，真实发稿由上层执行，周期唤醒需 cron／外部调度。',evidence('skills/openclaw/skill-publish-scheduler/scripts/publish_queue.py','--exec')),
 ('参考模板不等于运行配置','openclaw.json5 文件头标明 setup 从不应用该模板，配置可能漂移。搜索提供商、模型和 Gateway 行为需看实际运行配置，不能由模板示例推断。',evidence('openclaw/openclaw.json5')),
]
filter_rules=[
 ['Web 热榜','无关键词／画像参数','无源发布时间判断','不额外去重、不重新按热度排序','原顺序前 1–30 条；缓存 300 秒；失败可旧缓存'],
 ['资讯 fetch_news','仅标题；逗号 OR；忽略大小写','只有 AIHOT 24h、澎湃 48h；解析失败保留','普通合并无统一去重／排序；补充时按标题＋URL 去重','每源 limit；不足 5 条放宽关键词打 smart_fill'],
 ['自定义 rss_digest','标题＋摘要；逗号 OR；忽略大小写','--since N 天；解析失败保留','按链接去重，解析时间降序','空标题跳过；最后统一 limit'],
 ['Agent 深层分析','读画像、需求和内容语义再评价','按文档核对时效和证据','依据具体 Skill 归纳与排序','文档规则依赖 Agent 实际执行；不是后端硬过滤'],
]
agent_research=[
 {'title':'UGC：按品牌、平台与问题组合查询',
  'text':'先用 identity.md 扩展账号／品牌／产品关键词，再按 platforms.md 选活跃平台。每平台执行 2–3 组搜索；高相关 URL 交给 WebFetch 获取摘要和可访问互动信息。去重、正／中／负面分类、价值排序由 Agent 按文档完成。',
  'queries':['{账号名} 推荐 / 测评；{品牌名} 体验','{账号名} site:xiaohongshu.com；{账号名} site:bilibili.com','#{账号名}# site:weibo.com；{品牌名} 值得买吗 / 吐槽 / 避坑'],
  'boundary':'不是各社媒平台的完整站内索引。搜索覆盖、页面可访问性和时间范围有限；文档要求逐条附 URL，情感分析与事实分开，空结果如实报告。',
  'evidence':[evidence('skills/openclaw/skill-ugc-discovery/SKILL.md','## 三条发现路径'),evidence('skills/openclaw/skill-ugc-discovery/SKILL.md','## 执行步骤')]},
 {'title':'算法规则：查询 → 抓取 → 分级核对',
  'text':'按画像或用户选择平台，每平台做 2–3 组 web_search；将最相关的 3–5 个结果交给 web_fetch，提取规则变化、生效时间和官方原文。按时间倒序报告，分开标注官方确认、行业报道和未经证实的社区感知。',
  'queries':['{平台名} 算法 更新 {当前年}；{平台名} 推荐机制 变化 创作者','{平台名} 内容审核 规则 变化；{平台名} 变现 政策 更新','社媒平台 算法 变化 {当前年}，限定 newrank.cn / woshipm.com / 36kr.com'],
  'boundary':'下面的域名来自上游参考文档（标注更新于 2026-07），是搜索目标和证据候选，不是已接入的专用 API，也未在本研究中逐站验证当前状态。实际搜索服务由 OpenClaw 运行配置提供。',
  'evidence':[evidence('skills/openclaw/skill-algorithm-updates/SKILL.md','### 第二步'),evidence('skills/openclaw/skill-algorithm-updates/SKILL.md','### 第四步')]},
]
rule_sources=[
 ['抖音','creator.douyin.com；trust.douyin.com；business.oceanengine.com'],
 ['小红书','creator.xiaohongshu.com；business.xiaohongshu.com'],
 ['B 站','member.bilibili.com；space.bilibili.com/37090048；创作中心公告'],
 ['微博','me.weibo.com；@微博管理员'],
 ['知乎','zhihu.com/creator；@知乎小管家'],
 ['视频号','channels.weixin.qq.com；公众号“微信公开课”'],
 ['第三方参考','newrank.cn；woshipm.com；36kr.com；caasdata.com；chanmama.com；qiangua.com；公众号“刺猬公社”'],
]
result={'commit':COMMIT,'date':'2026-10-09','repository':'https://github.com/ZJU-REAL/Easel','license':'Apache-2.0',
 'layers':[dict(id=x[0],name=x[1],count=x[2],description=x[3],flow=x[4]) for x in layers],
 'sources':sources,'components':[dict(title=x[0],tech=x[1],text=x[2],evidence=list(x[3:])) for x in components],
 'pipeline':[dict(number=x[0],title=x[1],text=x[2],mode=x[3],evidence=[x[4]]) for x in pipeline],
 'findings':[dict(title=x[0],text=x[1],evidence=[x[2]]) for x in findings], 'filterRules':filter_rules,
 'agentResearch':agent_research,'ruleSources':rule_sources,
 'ruleSourcesEvidence':[evidence('skills/openclaw/skill-algorithm-updates/references/platform-sources.md')],
 'briefings':[
  ['creator','创作者情报','人人都是产品经理、虎嗅、36氪、AIHOT'],
  ['tech_digital','科技数码','少数派、极客公园、36氪、钛媒体、InfoQ'],
  ['business','商业财经','华尔街见闻、虎嗅、钛媒体、36氪（融资／IPO 等词）'],
  ['ai','AI 资讯','AIHOT、InfoQ（AI／大模型／LLM／Agent）'],
  ['topics','话题素材','澎湃、腾讯新闻、虎嗅']],
 'deep':{'text':'--deep 对条目 URL 另发 GET（5 秒超时、10 线程），删 script/style/nav/footer/header 后提取网页文本，截前 3000 字符；不是完整全文提取保证。', 'evidence':[evidence(NEWS,'def fetch_url_content')]},
 'scenarios':[
  ['垂类账号日常运营','用画像确定领域与语气，资讯／RSS 建候选选题，策划与制作成内容，再预览发布。适合有明确定位、能提供真实反馈的个人或小团队。'],
  ['知识图文与论文解读','把文章／PDF／arXiv 转成卡片、公众号排版或讲解视频；HTML 文字排版和素材文件便于修改及复用。'],
  ['已有视频再利用','口播、直播和讲座可转录、切片、重包装、转图文；按素材选择 FFmpeg 工具或 Remotion 产线。'],
  ['多平台分发与复盘','复用母版内容但保留平台版本与登录条件，集中记录发布、指标与评论；需要人工把关稿件与回读结果。']]
}
(ROOT.parent/'web/facts.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('事实清单:',len(sources),'条来源路径;',len(components),'个系统模块')
