// 2026-10-12 完整整理；研究基线与既有引导图保持原样。
import {meta, source} from './content.mjs';
import {understanding as u} from './understanding.mjs';
export const guide={file:'assets/understanding/overview.png',width:3200,height:8524,bytes:4210861,sha256:'36c93996b411490a1562e0601fe5aa15b7d02617d6855dbd42a88ed2c42f3c45'};
const item=(title,text)=>({title,text});
export const summaryItems=[
 item('核心定位','给 AI 编码助手的动画制作工具包：Skill 提供任务流程与制作知识，模型理解内容、选择方向并编程，现成工程负责绘画、动画、合成和出片。'),
 item('能力范围','艺术场景、解说片段、参考动画拆解、角色长卷、配乐节拍、图片语音接入、精确渲染导出、QA 与经验复用，共九项职责。'),
 item('视觉与表达','35 份艺术风格配方及场景，覆盖六组视觉方向；另有九种解说表达，前八种有参数化实现，讲解员式提供语法与整片参考。画风和表达方式分别选型。'),
 item('系统模块','任务与知识入口、参考分析、风格绘制、解释组件、角色世界、音频素材、时间渲染、质量检查及经验回流；17 个 JS 绘画动画库支撑执行。'),
 item('底层原理','Canvas 按 renderFrame(t) 重画，纯时间函数、种子随机、全局编舞与离屏转场维持连续性；Chromium 逐帧取图，FFmpeg 编码并合入音轨。'),
 item('输入与交付','输入主题、文案、数据、参考片、图片或录音；工程/JSON 控制时长、尺寸、帧率和出现时间。交付静帧、MP4、横竖屏及透明 ProRes 剪辑片段。'),
 item('照片与人物','照片通常需要外部生图或自备一致动作帧，再改写场景、统一材质并合成。很多背景由代码生成；任意整图一键动画化和稳定复杂表演尚非通用现成能力。'),
 item('使用目标','口播科普、数据报告、产品教程、艺术短片、透明剪辑组件与品牌系列；每类都需要相应脚本、数据、真实素材和时间轴，最终品质取决于制作。'),
 item('相对模型的价值','同一模型可复用已写好的组件、参数、导出工具和问题记录，减少部分重复实现；直接模型也能制作。尚无同任务对照证明稳定提质或量化效率收益。'),
 item('模型提升与复用','通用提示和普通示例的额外价值可能下降；经过审片的模板、自有视觉资产和制作流水线仍可能省事。先验证解说、图表、产品与剪辑片段的实际复用收益。'),
 item('可扩展方向','内容批量生产、品牌模板、剪辑集成、互动教学与文化体验、参考分镜辅助、角色资产治理、自动渲染及对照评估八条路线；均注明新增工程与验收目标。'),
 item('研究效果与边界','保留 35 个原版场景与 34 个转场的运行记录、七部独立制作的 30 秒 1080p 作品和原始高清引导图；新增生成美术与制作贡献另记，不等同原库品质优势。'),
];
export const overviewItems=[
 item('如何理解','AI 先理解你想表达什么，再分别决定画面长什么样、用什么方式解释；Skill 帮它找到配方、范例和工具，代码把场景和内容按时间组织成视频。'),
 item('包含什么','35 种艺术方向、九种解说方法（八种有参数实现）、17 个绘画动画模块，以及参考拆解、角色合成、配乐、媒体接入、渲染、QA 与经验记录。它没有内置新的训练模型。'),
 item('如何使用','可以修改艺术场景制作短片，也可以给片段 JSON 换文字或数据，或导出透明片段插入已有视频。照片转人物还需动作素材和场景适配；完整口播需脚本、录音与时间轴。'),
 item('价值与替代性','增量主要是工程和经验复用。模型越强，通用指导越易被替代；打磨好的模板、自有素材和工作流能否节省成本，要用同任务成片、修改次数、时间与维护成本验证。'),
 item('下一步方向','优先做可重复的解说、数据、产品和剪辑组件；再扩展品牌批量流水线、角色资产、参考分镜工具或互动学习体验。后者需要新增输入、状态和内容逻辑。'),
 item('如何看效果','以下沿用已生成的 3200×8524 完整 PNG，含原版静帧与解说研究图，可放大和下载。35 个动态原例与七部新增作品均可观看；扩展建议、外部生成与原库贡献分别说明。'),
];
export const modules=[
 {title:'任务与制作知识',files:['SKILL.md','references/风格配方/INDEX.md'],text:'按任务读取风格、表达、角色和整片制作说明。Skill 是编码助手的工作指引，执行能力来自模型及工具。'},
 {title:'参考拆解',files:['scripts/analyze/breakdown.py'],text:'根据图像变化寻找候选转场、提取关键帧与运动热图，并拟合节拍；测量结果仍需人或模型解释。'},
 {title:'风格画法与材质',files:['scripts/engine/lib/paint.js','scripts/engine/lib/brush.js','scripts/engine/lib/render.js','scripts/engine/lib/post.js'],text:'从材料、笔触、配色、造型和光影构建画面；35 场景把画法与运动规则组合起来，成熟度各异。'},
 {title:'解说表达组件',files:['references/09-视频动画语法.md','scripts/engine/lib/diagram.js','scripts/engine/lib/chart.js','scripts/engine/lib/typo.js','scripts/engine/lib/ui.js','scripts/engine/lib/collage.js'],text:'图形关系、图表、文字、界面与拼贴帮助解释内容；八种片段可参数化，讲解员式仍依赖素材和整片制作。'},
 {title:'角色与连续世界',files:['references/10-角色.md','scripts/engine/lib/rig.js','scripts/engine/lib/rig_huashu.js','scripts/engine/lib/toon.js','scripts/engine/lib/kit.js'],text:'共享骨架、动作参数、角色帧与连续编舞。个人形象穿越艺术世界只是其中一种叙事；动作帧质量与一致性需另行制作。'},
 {title:'声音与媒体',files:['references/05-节奏与配乐.md','references/images.md','references/capabilities.md'],text:'导入素材与录音、规划 BPM 和音效；图片生成依赖当前工具，系统朗读为 macOS 路线，服务音色需要配置。'},
 {title:'时间、相机与输出',files:['scripts/engine/engine.js','scripts/engine/lib/motion.js','scripts/engine/lib/camera.js','scripts/engine/render.py'],text:'按时间求动作与相机，转场中两场景继续绘制；固定帧率逐帧输出再编码。适用于可重复渲染和剪辑组件。'},
 {title:'技术 QA 与人工审片',files:['scripts/qa.py'],text:'确定性、性能、动感、流畅和框景检查提供问题线索；叙事、审美、文字可读性与角色表演仍需看成片。'},
 {title:'配方与经验回流',files:['references/08-风格作者规范.md','references/12-口播整片与经验回流.md'],text:'确认静帧、编舞、转场，再把有效参数和失败原因写回资料。积累的是知识和工程资产，未训练新生成模型。'},
];
export const libraries=[
 ['util.js','尺寸、数学、随机等基础工具'],['paint.js','噪声、纹理、手绘线与绘画基础'],['brush.js','毛笔、墨晕、水彩、厚涂等笔法'],['render.js','网点、点彩、赛璐珞、光影与皮影'],['post.js','VHS、胶片、泛光与媒介叠层'],['rig.js','少女与猫的共享角色骨架'],['rig_huashu.js','作者形象骨架'],['toon.js','扁平角色、姿势、口型与漫画符号'],['kit.js','点列、路径、画面扭曲与跨场景编舞'],['motion.js','缓动、弹簧、步进、错开与拍号'],['camera.js','连续世界相机的位置、缩放与旋转'],['diagram.js','图解、逐笔描出、白板和形变'],['chart.js','比例尺、柱线图与数据标注'],['typo.js','逐字、打字、遮罩、数字和强调'],['ui.js','界面卡片、光扫与伪透视'],['collage.js','纸纹、撕纸、胶带、红线与拼贴'],['fonts.js','独立字体文件注册与加载'],
];
export const mechanisms=[
 item('理解内容并选择两条方向','先明确要解释的概念、情绪或结论；艺术风格决定视觉语言，解说方法决定信息如何出现。Skill 给出具体做法，选择和改写仍由模型或人完成。'),
 item('从参考作品找到风格规则','观察材料、笔法、造型、配色和构图；拆解脚本提供镜头与运动线索。先让静帧可辨识，再设置一个主动作、二至四个母题循环及同语言转场。'),
 item('用确定时间绘制每一帧','renderFrame(t) 以时间求画面，运动函数不读墙钟，随机使用种子。角色可以沿全局时间连续运动，场景局部时间负责该段出现与变化。'),
 item('组合代码绘制和媒体素材','背景、纹理、图表和字可由 Canvas 重画；图片、有限角色帧与录音作为输入合成。照片一般先准备一致动作帧，不能把一张照片自动当作完整表演。'),
 item('精准取帧并编码出片','按 duration、fps、width、height 及 cues/data 组织场景；Chromium 取出目标帧，FFmpeg 生成视频和音轨，也可输出静帧及带 alpha 的 ProRes。'),
 item('检查并形成可复用版本','检查确定性、效率、运动和布局，再人工审片。保留脚本、参数、素材、来源与问题记录；效果提升需用同任务对照验证，示范不能替代生产验收。'),
];
export const reuse=[
 {title:'修改现有艺术场景',input:'主题、画风、故事和角色素材',output:'有指定画法与运动规则的艺术短片',work:'选择相近场景，修改构图、角色、动作和镜头；先确认静帧再出片。'},
 {title:'复用参数化解说片段',input:'文字、数据、时长、尺寸与出现时间',output:'图表、白板、文字、拼贴或 UI 解释片段',work:'沿用组件并填参数；需核对内容、图形关系、节奏和可读性。'},
 {title:'接入现有剪辑流程',input:'指定时间点的引用、说明、图表与音轨',output:'透明动画层或普通 MP4 插入片段',work:'开发稳定模板与输入映射，导出片段，在剪辑器里配合口播；完整时间轴由调用方提供。'},
 {title:'积累自己的制作资产',input:'品牌规范、角色动作帧与已经审过的镜头',output:'持续复用的模板、素材和版本记录',work:'固定字体、色板、镜头和参数，记录许可与质量要求；品牌生产系统需要继续开发。'},
];
export const extensions=[
 {title:'内容批量生产',input:'每期文案、数据和录音时间轴',output:'固定模板的系列视频与渲染清单',work:'新增数据适配、任务队列、失败重试和版本记录',acceptance:'同模板换内容后语义、时间和版面正确；计量真实制作时间'},
 {title:'品牌模板库',input:'品牌规范、主题与经过审核的素材',output:'片头、章节、图表与片尾等统一组件',work:'新增视觉约束、可变区域与人工审核',acceptance:'多期输出一致，换字和换数据仍清晰'},
 {title:'剪辑器集成',input:'片段 JSON、指定入出点与透明需求',output:'可插入剪辑时间线的组件包',work:'新增调用接口、格式适配、安装与预览',acceptance:'透明边缘、音画同步、尺寸与帧率符合目标软件'},
 {title:'互动教学与文化体验',input:'知识节点、场景素材与学习目标',output:'可探索、点击和响应操作的学习场景',work:'新增输入、状态、热点、规则与反馈；原像素闯关只是视频',acceptance:'操作触发正确内容，用户能完成指定理解或探索任务'},
 {title:'参考片与分镜辅助',input:'参考视频及目标内容',output:'候选镜头、视觉规则与可编辑分镜',work:'连接已有测量脚本与语义分析、人工校正界面',acceptance:'人工确认镜头与节奏，避免把变化检测当剧情理解'},
 {title:'角色与素材治理',input:'人物参考、授权记录与动作需求',output:'一致角色帧、背景层及素材清单',work:'新增身份与姿态校验、素材版本和许可管理',acceptance:'跨镜头形象与动作连续，实际素材可追溯'},
 {title:'自动渲染与质量门槛',input:'已确认工程、输出规格与资源预算',output:'可重复渲染、自动检查和人工审片记录',work:'新增运行环境封装、资源上限、日志与质量阈值',acceptance:'重渲染一致，失败可定位，文字/音画/帧数通过检查'},
 {title:'同模型对照与经验版本',input:'相同任务、模型、预算和验收标准',output:'有库/无库的质量、工时与修改对照',work:'建立对照任务集，记录成本并回写有效配方',acceptance:'用实际净收益决定是否保留工具；模型升级后重新比较'},
];
export const publication={organized:'2026-10-12',meta,guide,summaryItems,overviewItems,modules,libraries,mechanisms,reuse,extensions,understanding:u};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderIntroduction(){return `<div class="publication-introduction">${overviewItems.map(i=>`<p><strong>${esc(i.title)}</strong>：${esc(i.text)}</p>`).join('')}</div>`;}
export function renderDetails(){
 const paragraphs=items=>items.map(i=>`<article><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></article>`).join('');
 return `<section class="publication-details" id="publication"><h2>完整整理：能力、模块、原理与使用目标</h2><p>以下文字补全讨论结论和工程路线；引导图沿用既有原图。原库事实按固定提交核对，价值判断与扩展方案属于本研究。</p><div id="complete-summary" class="publication-summary">${summaryItems.map(i=>`<p data-summary><strong>${esc(i.title)}</strong>：${esc(i.text)}</p>`).join('')}</div><section id="modules"><h2>九个职责模块与 17 个代码库</h2><div class="publication-grid">${modules.map(i=>`<article data-module><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p><div class="publication-sources">${i.files.map(f=>`<a href="${source(f)}" target="_blank" rel="noopener noreferrer">${esc(f)}</a>`).join('')}</div></article>`).join('')}</div><div class="publication-library-list">${libraries.map(([f,t])=>`<p data-library><a href="${source('scripts/engine/lib/'+f)}" target="_blank" rel="noopener noreferrer">${esc(f)}</a>：${esc(t)}</p>`).join('')}</div></section><section id="mechanisms"><h2>六个制作机制</h2><div class="publication-grid">${paragraphs(mechanisms)}</div></section><section id="reuse"><h2>四条复用路线：从输入到交付</h2><div class="publication-grid">${reuse.map(i=>`<article data-reuse><h3>${esc(i.title)}</h3><p><b>输入</b>：${esc(i.input)}</p><p><b>目标产出</b>：${esc(i.output)}</p><p><b>实际要做</b>：${esc(i.work)}</p></article>`).join('')}</div><p>建议先固定一个真实任务和可用素材，确认静帧 → 制作短片段 → 审片 → 换内容复用 → 再比较成本。艺术人物穿越适合作品展示；持续价值要通过重复任务验证。</p></section><section id="extensions"><h2>八个扩展方向与验收目标</h2><p>这些是后续开发建议；新增功能和配套工程不计入原库已经实现的能力。</p><div class="publication-grid">${extensions.map(i=>`<article data-extension><h3>${esc(i.title)}</h3><p><b>输入</b>：${esc(i.input)}</p><p><b>可交付目标</b>：${esc(i.output)}</p><p><b>需补工程</b>：${esc(i.work)}</p><p><b>验收依据</b>：${esc(i.acceptance)}</p></article>`).join('')}</div></section></section>`;
}
export function renderMarkdown(){
 const lines=['## 完整理解与复用路线（2026-10-12）','',`上游：${meta.upstream}；固定提交：\`${meta.commit}\`。原始研究及引导图为 2026-10-09，本次整理保留原图字节。`,''];
 const add=(title,items)=>{lines.push(`### ${title}`,'');for(const i of items)lines.push(`**${i.title}**：${i.text}`,'');};
 add('十二项摘要',summaryItems);add('图前引导',overviewItems);
 lines.push(`引导图：${guide.width}×${guide.height} PNG，${guide.bytes} 字节；SHA-256：\`${guide.sha256}\`。`,'');
 add('九个职责模块',modules);for(const i of modules)lines.push(`- ${i.title}：[${i.files[0]}](${source(i.files[0])})`);lines.push('');
 lines.push('### 17 个绘画动画库','',...libraries.map(([f,t])=>`- [${f}](${source('scripts/engine/lib/'+f)})：${t}`),'');
 add('六个制作机制',mechanisms);
 lines.push('### 四条复用路线','');for(const i of reuse)lines.push(`**${i.title}**：输入 ${i.input}；目标 ${i.output}；实际要做：${i.work}。`,'');
 lines.push('### 八个扩展方向（待开发）','');for(const i of extensions)lines.push(`**${i.title}**：输入 ${i.input}；产出 ${i.output}；需补 ${i.work}；验收 ${i.acceptance}。`,'');
 lines.push('### 效果与验证口径','',u.validation,u.evidence,u.criteria,'','35 个原例由固定上游代码运行；七部新增作品使用独立生成美术和场景制作。外部生图、配音、完整口播与任意照片自动化均不视为全面验收。代码/文档 MIT，字体 OFL；作者形象与解说媒体仅用于 Skill 示范和研究说明，配乐另保留署名和许可。');
 return lines.join('\n')+'\n';
}
export function renderSiteCard(p){const base='./012-huashu-art-motion/';return `<section class="project-block" id="huashu-art-motion"><div class="eyebrow">012 / SKILL · CANVAS · ART MOTION</div><h2 class="project-heading">012 · ${esc(p.name)}</h2><div class="project-introduction" data-project-introduction="012">${p.overviewItems.map(i=>`<p><strong>${esc(i.title)}</strong>：${esc(i.text)}</p>`).join('')}</div><div class="actions"><a class="button primary" href="${base}overview/">完整理解与高清图 ↗</a><a class="button" href="${base}#gallery">35 种原版动态效果</a><a class="button" href="${base}scenarios/">七部新增作品</a><a class="button" href="${base}overview/#extensions">八个扩展方向</a><a class="button" href="${esc(p.upstream)}">源库 huashu-art-motion</a></div><figure class="project-map"><a class="guide-frame" href="${base}overview/"><img src="${base}${guide.file}" width="3200" height="8524" alt="${esc(p.coverAlt)}" loading="lazy" decoding="async"></a><figcaption>${esc(p.coverCaption)}<br><a href="${base}${guide.file}" download>下载完整原图</a> · <a href="${base}research.md">完整研究与复用说明</a></figcaption></figure></section>`;}
