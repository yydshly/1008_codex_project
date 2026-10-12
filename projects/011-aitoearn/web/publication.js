// Original Chinese analysis of the fixed research baseline. Extensions are proposals.
import {meta, refs, source, capabilities, skills, platforms, layers, workflows, scenarios, values, boundaries} from './content.js';
export const guide={file:'assets/aitoearn-overview.png',width:941,height:1672,sha256:'3e44a35a22c3bd73482172bbeebe72b81775e0419a4fd18b16031d343761a973'};
const item=(title,text,input,deliverable,acceptance,ref)=>({title,text,input,deliverable,acceptance,ref});
export const modules=[
 item('创作与运营工作台','Next.js 前端组织聊天、媒体、草稿、账号与日历。界面是操作入口，执行结果来自服务和渠道。','主题、素材、账号、排期','可审阅内容和任务视图','界面显示创建状态与最终结果的区别',refs.readme),
 item('Agent 与技能加载','Claude Agent SDK 组织会话，skill-analyzer 选择技能，polling-task 等待长任务；13 个 Markdown 技能被复制到会话目录。','任务目标、上下文、工作方法','工具调用计划与会话结果','技能方法、工具存在性和执行证据分别核对',refs.runtime),
 item('模型路由与草稿规划','Claude Code Router 路由模型请求；独立批量草稿入口规划媒体与文案，可配置规划模型与媒体模型。','视觉要求、文案要求、参考资料','结构化计划、媒体任务和文案','模型与入口的兼容性、成本、事实准确性',refs.planner),
 item('媒体生成与加工工具','MCP 参数连接图片/视频模型；Sharp 做精确图像处理，ffmpeg 做抽帧，火山引擎等云服务做剪辑、翻译、风格和解说。','文本、图像、视频、音频','媒体 URL、文件或异步任务 ID','最终文件、质量与任务完成记录',refs.media),
 item('素材、草稿与存储','内容服务组织媒体、分组和草稿；MongoDB 保存业务记录，RustFS / S3 保存文件。历史摘要可用于偏好上下文。','生成或上传的素材及内容元数据','媒体记录、草稿、来源与分组','记录与文件关联、版本一致和可再次使用',refs.content),
 item('账号、渠道与适配','账号分组、授权凭据、平台规则、媒体适配和平台 Provider 共同处理渠道差异。14 个声明渠道有各自内容类型与完成方式。','目标账号、平台和已审阅内容','平台适配参数、授权状态与作品记录','每个平台分别确认权限、规则和执行入口',refs.groups),
 item('发布 Flow 与任务队列','创建流程、任务和记录，Redis / BullMQ 调度立即或延迟发布；服务管理状态、凭据刷新、轮询、失败与有限重试。','草稿、账号列表、发布时间','发布任务、错误原因、最终作品链接','任务创建不等于已发布；用户接续也要跟踪',refs.flow),
 item('互动、指标与推广业务','渠道接口处理评论等动作，统一数据对象保存指标快照；官方另描述商家任务与结算。互动缺口和旧 Electron 市场代码需分别理解。','作品、评论、任务要求与证明','可用互动结果、指标快照或业务记录','权限、数据覆盖、真实交付和结算逐项验证',refs.analytics),
];
export const mechanisms=[
 item('1. 把目标变成有约束的计划','任务先明确受众、事实、素材和目标平台；规划模型生成媒体方案与文案需求。visual prompt 与 captionPrompt 分开，避免让画面需求替代发布表达。','真实事实、参考媒体、平台规则','媒体计划与文字方案','内容忠实、约束明确、没有虚构产品事实',refs.planner),
 item('2. 用技能补充工作知识，再调用真实工具','技能是 Markdown 工作说明，描述参数、步骤、轮询与失败处理。Agent 结合会话选择工具，Schema 把意图变成执行参数。复制技能文件不能自动获得模型、MCP 或发布权限。','技能说明和任务上下文','结构化工具调用','工具确实注册，结果与后续步骤可关联',refs.init),
 item('3. 生成和云加工用异步任务闭环','部分工具直接返回文件，部分先返回任务 ID，再查询直到成功或失败。状态、文件地址和错误交回 Agent；单次 Agent 按提示顺序调用，批量草稿另走队列。','生成/加工参数','任务记录与最终媒体','提交成功、运行成功、文件可用分开验证',refs.prompt),
 item('4. 将文件组织成可继续工作的草稿','媒体和文案保存为分组草稿，供修改、复用和排期。开启历史偏好时读取最近 90 天最多 20 条摘要；默认关闭，并不更新模型权重。','媒体、标题、正文、标签、来源','可审阅草稿与媒体记录','人工审阅、版本和格式；偏好不是训练',refs.memory),
 item('5. 发布按平台规则运行状态机','Flow 校验账号与平台，准备媒体并创建任务，队列按时间执行。Provider 上传/发布、查询作品或返回用户接续；可重试发布最多执行三次，含首次。','审阅后的草稿、账号和时间','发布中 / 成功 / 等待用户 / 失败等结果','真实最终作品链接、错误分类和重复执行控制',refs.task),
 item('6. 用可获得的反馈更新下一次决策','渠道指标按统一字段保存带时间的快照，再由人或后续策略比较选题、素材和渠道。源码字段多为可选；自动持续优化效果仍需独立实验。','作品与渠道可提供的指标','可比较反馈和下一次内容计划','不要把缺失指标当零；转化与收入需独立归因',refs.analytics),
];
export const reuse=[
 item('路线 A：只复用技能方法与本地草稿','适合目前的 GPT/Codex 环境。按需读取原版技能，映射真实可用工具，保存图片、文案、提示词和本地 JSON；本次已经验证图文这条路线。','已核对研究、截图与 GPT 工具','3 张图片、文案、本地草稿与证据','原始图片可打开、事实与来源一致、无伪造远端 ID',refs.init),
 item('路线 B：让现有助手接入 AiToEarn MCP','适合已经有可用 AiToEarn 服务和账号的环境。通过实际 MCP 工具管理素材、草稿、发布与查询；先做读取/保存，再完成一个渠道。','服务地址、区域匹配 Key、目标账号','真实后台草稿及单渠道发布流程','真实工具返回、任务完成与作品链接',refs.mcp),
 item('路线 C：自部署内容与发布管理系统','适合需要统一素材、账号与排期的长期工作。Compose 提供 Web、Server、AI、MongoDB、Redis、RustFS 与 Nginx；继续配置模型、云媒体与渠道凭据。','可运维环境、存储、服务与账号配置','自己的管理后台与可运行工具链','持久化、恢复、单渠道闭环和成本记录',refs.deploy),
 item('路线 D：借鉴模块，做研究发布工作台','把自己的 projects.json、研究版本和素材清单作为输入，按项目编号生成草稿；通过明确工具接口连接外部生成与发布。适合围绕当前研究集逐步开发。','项目索引、固定版本、素材及模板','可追溯的研究 → 内容 → 审阅 → 发布工作流','阶段结果可检查，失败能恢复，署名与来源保留',refs.content),
];
export const extensions=[
 item('研究资料到图文的标准流水线','建议把项目索引、README、来源清单和真实截图转换为结构化创作输入。保持每条结论的来源，避免复制未经核对的营销表述。','项目编号、commit、素材及研究结论','可重复生成的主题包和图文草稿','同一输入可复查；标题、图片与正文事实一致',refs.planner),
 item('GPT 与媒体服务适配层','建议为规划、图片、视频、云剪辑分别定义工具契约，并记录供应商、实际参数、任务状态与返回文件。本次图片映射可作为起点。','可用工具、模型与参数矩阵','供应商适配器和兼容性表','工具级实测；不靠改模型名称推导兼容',refs.router),
 item('许可、事实与人工审阅台','建议把来源许可、人物/产品真实性、平台限制与改稿意见放在草稿旁，审阅通过后才进入发布排期。','草稿、来源、素材署名、规则','审阅版本与可发布内容包','引用可追溯、人工意见留档、发布使用已审版本',refs.content),
 item('多版本图文与真实视频演示','建议复用截图与操作录屏，分别制作竖图、短片、字幕与封面；接入真实视频工具后记录质量、用时、费用和人工修改。','自有录屏、图像、脚本和受众','多比例媒体与可比版本','逐文件审阅；视频完成后才标记真实实测',refs.edit),
 item('单渠道到多渠道的发布桥','建议先接一个已授权平台，保存草稿、任务与最终作品，再加入第二个渠道。将 OAuth、插件和用户接续做成不同执行路径。','已审阅内容、账号授权、时间','发布适配器、任务与作品映射','真实发布成功、状态可恢复、避免重复发布',refs.flow),
 item('任务监控、成本与失败恢复','建议把生成、加工、存储和发布分阶段记录耗时、费用与错误；为超时、限额、凭据失效和用户等待提供恢复入口。','任务事件和服务实际账单','可观测任务台与成本明细','实际账单与记录对应；恢复不会重复扣费/发布',refs.queue),
 item('反馈实验与个人知识资产','建议把作品链接与可用指标回写项目内容档案，对选题、封面、表达做小规模对照；长期保留素材和审阅结果。','发布作品、指标时间戳和实验分组','反馈报告、可复用模板与内容资产','曝光与转化分开；缺失值、对照条件写清楚',refs.analytics),
 item('多项目与客户协作','建议在素材/账号分组之上增设客户隔离、角色权限、审核、预算与交付记录，形成研究团队或代运营的工作台。','多项目、客户、权限和预算','协作流程、客户审批与交付归档','隔离与审批实测；不把分组当成完整权限系统',refs.groups),
];
export const roadmap=[
 {title:'先固定事实与素材',text:'选择一个已经完成的研究项目，保存 commit、许可、截图和录屏；明确读者与一个传播目标。'},
 {title:'复用已跑通的图文路线',text:'用当前 GPT 规划与文案，真实图像工具生成图片，保存草稿与调用证据；人工检查事实和画质。'},
 {title:'接通一个真实渠道',text:'先保存真实后台草稿，核对平台要求与授权，再跟踪从任务创建到最终作品的完整结果。'},
 {title:'最后扩展视频与反馈',text:'按实际需求接视频/翻译工具、第二渠道与指标回写，比较费用、审阅时间和真实反馈。'},
];
export const facts={meta:{...meta,organized:'2026-10-12',scope:'固定研究版本的完整理解；不是上游当前版本全功能验收'},guide,capabilities,skills,platforms,layers,workflows,scenarios,values,boundaries,modules,mechanisms,reuse,extensions,roadmap,sources:Object.entries(refs).map(([id,path])=>({id,path,url:source(path)})),evidence:{manifest:'source-manifest.json',implementation:'implementation-inventory.json',installation:'skill-installation.json',actualRun:'experiment/run.json'}};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cards=(items,key)=>`<div class="publication-grid">${items.map(i=>`<article class="text-card" data-${key}><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p><dl>${[['input','输入'],['deliverable','产出'],['acceptance','验收依据']].map(([k,n])=>`<div><dt>${n}</dt><dd>${esc(i[k])}</dd></div>`).join('')}</dl><a class="source-link" href="${source(i.ref)}" target="_blank" rel="noopener noreferrer">固定源码依据 ↗</a></article>`).join('')}</div>`;
export function renderPublication(catalog,section){return {
 summary:section('understanding','02','COMPLETE UNDERSTANDING','我们的完整理解','十二项摘要覆盖能力、模块、原理、输出、接入、价值与边界；与研究集首页使用同一份项目索引。',`<div class="publication-summary">${catalog.summaryItems.map(i=>`<p><strong>${esc(i.title)}</strong><span>${esc(i.text)}</span></p>`).join('')}</div><div class="source-downloads"><a href="understanding.md" download>下载完整理解 Markdown ↓</a><a href="publication.json">结构化研究与来源 ↗</a>${catalog.demo?`<a href="verification.json">公开发布核验 ↗</a><a href="public-http-checks.json">公开HTTP记录 ↗</a><a href="public-browser-checks.json">浏览器记录 ↗</a>`:""}</div>`),
 introduction:`<div class="publication-introduction" data-publication-introduction>${catalog.overviewItems.map(i=>`<p><strong>${esc(i.title)}</strong>：${esc(i.text)}</p>`).join('')}</div>`,
 modules:section('modules','08','SYSTEM MODULES','八个职责模块，构成内容运营系统','这是按职责整理的分析视图；技能目录、业务模块与工具服务分别承担不同工作。',cards(modules,'system-module')),
 mechanisms:section('mechanisms','10','EXECUTION MECHANISMS','从目标到反馈，六个执行机制','图片、视频、草稿、发布和指标是不同阶段的结果。每一步都有自己的条件与验收依据。',cards(mechanisms,'mechanism')),
 reuse:section('reuse','14','REUSE & NEXT STEPS','四条复用路线与实践顺序','最贴合当前研究集的是图文草稿与单渠道闭环，再按需求接入更多服务。',cards(reuse,'reuse')+`<div class="roadmap-grid">${roadmap.map((i,n)=>`<article class="text-card" data-roadmap><span class="eyebrow">STEP ${n+1}</span><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></article>`).join('')}</div>`),
 extensions:section('extensions','15','EXTENSION PROPOSALS','八个可扩展方向','以下为我们的后续开发建议；输入、交付物和验收依据帮助判断投入顺序。',cards(extensions,'extension')),
};}
export function renderUnderstanding(catalog){
 const lines=['# 011 · AiToEarn 完整理解','',`上游：${meta.repo}`,`固定研究提交：${meta.commit}`,'研究 / 实测：2026-10-09；完整整理：2026-10-12。MIT。',''];
 const add=(title,items)=>{lines.push(`## ${title}`,'');for(const i of items){lines.push(`### ${i.title}`,'',i.text,'');for(const [k,n]of[['input','输入'],['deliverable','产出'],['acceptance','验收依据']])if(i[k])lines.push(`**${n}**：${i[k]}`,'');if(i.ref)lines.push(`依据：[固定源码](${source(i.ref)})`,'');}};
 add('十二项摘要',catalog.summaryItems);add('图前介绍',catalog.overviewItems);lines.push('## 沿用既有引导图','',`![AiToEarn 总览](${guide.file})`,'',`${guide.width} × ${guide.height} PNG，SHA-256：${guide.sha256}。`,'');
 add('八个职责模块',modules);add('六个执行机制',mechanisms);add('四条复用路线',reuse);add('实践顺序',roadmap);add('八项扩展建议',extensions);
 lines.push('## 已完成与待验证','','实际安装13个原版技能；GPT/Codex完成规划与文案，内置图像工具实际生成3张1086×1448 PNG，按2个技能的方法保存本地JSON草稿。未运行原后台、视频云加工、账号授权、真实发布或推广结算。','', '32项能力、13技能、14渠道、6层关系、3个流程、6类场景、6项个人价值和10项实现边界详见 [完整源码研究](research.md)。原始调用与草稿见 [真实实验](experiment/README.md)；来源见 [80条固定记录](source-manifest.json)。','','扩展方向属于建议。网页部署只发布静态研究、图像和实测档案；不会自动部署原业务后台与模型。');return lines.join('\n')+'\n';
}
export function renderSiteCard(p){const base='./011-aitoearn/';return `<section class="project-block" id="aitoearn"><div class="eyebrow">011 / AGENT · MEDIA · CONTENT OPERATIONS</div><h2 class="project-heading">011 · ${esc(p.name)}</h2><div class="project-introduction" data-project-introduction="011">${p.overviewItems.map(i=>`<p><strong>${esc(i.title)}</strong>：${esc(i.text)}</p>`).join('')}</div><div class="actions"><a class="button primary" href="${base}">阅读完整能力、模块与原理 ↗</a><a class="button" href="${base}map.html">可缩放一图阅读</a><a class="button" href="${base}#real-demo">三张真实图片与草稿</a><a class="button" href="${base}#extensions">八项扩展方向</a><a class="button" href="${esc(p.upstream)}">源库 AiToEarn</a></div><figure class="project-map"><a class="guide-frame" href="${base}map.html"><img src="${base}${guide.file}" width="941" height="1672" alt="${esc(p.coverAlt)}" loading="lazy" decoding="async"></a><figcaption>${esc(p.coverCaption)}<br><a href="${base}${guide.file}" download>下载完整原图</a> · <a href="${base}understanding.md">下载完整理解</a></figcaption></figure></section>`;}
