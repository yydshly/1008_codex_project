// 原创单图内容与排版。代码绘制确保中文、源码路径与接口名称准确；无第三方运行依赖。
import { meta, source } from './content.js';
export const overviewFacts = {
  capabilities: [
    ['页面与全栈', 'React + TanStack Start', '服务端渲染、服务器函数、API 路由；浏览器水合后接管交互。'],
    ['路由与数据', 'TanStack Router + Query', '文件路由、类型化导航、预加载、缓存、去重及 SSR 数据衔接。'],
    ['账号与会话', 'Better Auth', '邮箱密码注册 / 登录 / 退出；GitHub、Google 登录入口需配置凭据。'],
    ['数据库', 'Drizzle + PostgreSQL', '认证表、关联、服务端连接与迁移工具；业务表由自己新增。'],
    ['基础界面', 'Tailwind + shadcn/ui + Base UI', '表单、按钮、通知、主题切换；默认 /app 是用户展示示例。'],
    ['开发与运行', 'Vite+ + Nitro + Varlock + evlog', '构建部署、环境变量验证、请求日志，以及 Vitest / Playwright 测试基础。'],
  ],
  scenarios: [
    ['个人工具 SaaS', '书签、笔记、习惯追踪、记账', '适配：业务表、增删改查、检索、统计与数据归属。'],
    ['内部管理系统', '项目看板、客户跟进、资产登记', '适配：组织成员、角色、审批、审计和租户隔离。'],
    ['会员内容平台', '课程、付费资料库、学习平台', '适配：内容、进度、支付订阅、权益与邮件服务。'],
    ['AI 工具网站', '写作、文档问答、简历优化', '适配：模型调用、流式响应、文件解析、队列及额度计费。'],
    ['客户服务门户', '工单、交付进度、客户文件', '适配：客户隔离、附件、状态流转和消息通知。'],
    ['我们的研究平台', '项目收藏、研究笔记、实验进度', '适配：Research / Note / Experiment 表、检索和协作权限。'],
  ],
  paths: [
    ['认证操作入口', 'authClient → /api/auth/* → auth.handler', '邮箱密码、退出和 OAuth 回调由 Better Auth 处理；通过 Drizzle adapter 保存账户与会话，响应设置 Cookie。'],
    ['读取当前用户入口', 'Query → $getUser → _getUser → getSession', '读取当前请求头，返回 user 或 null，并转发 Set-Cookie；SSR 直接执行，浏览器通过服务器函数 RPC 请求。'],
    ['页面与服务器边界', '_auth.beforeLoad / authMiddleware', '页面未登录时跳转 /login。私有业务函数或 API 必须显式鉴权，再检查角色与 ownerId / tenantId；页面检查不会自动保护接口。'],
    ['数据与运行支撑', '认证四表 / Vite+ / Nitro', '现有表：user、session、account、verification。Vite+ 组织构建，Start 分离执行边界，Nitro 运行 SSR、API 和日志。'],
  ],
  principles: [
    ['SSR 与水合', '服务器先准备 HTML 和数据，浏览器恢复状态并接管交互。Router、Query、组件与 loader 可能参与两种环境。'],
    ['服务器函数 / RPC', 'createServerFn 的实现留在服务器，浏览器构建中替换为网络代理。数据库模块声明 server-only，浏览器不直接连数据库。'],
    ['两层缓存', 'Query 默认两分钟新鲜期，减少浏览器请求；Better Auth Cookie 缓存五分钟，减少查库。freshAuthMiddleware 跳过会话缓存。'],
    ['认证与业务授权', '会话回答“是谁”，业务规则回答“能做什么”。中间件需挂载；角色、资源归属、操作权限和输入校验由业务代码负责。'],
  ],
  interfaces: [
    ['页面与 UI', 'src/routes/_auth/app/；src/components/ui/', 'createFileRoute；基础 UI / 主题组件', '新增页面、表单、列表与交互；路由树由工具生成。_auth、_guest 为路径隐藏布局，URL 为 /app、/login、/signup。'],
    ['服务器业务逻辑', '示范：src/lib/auth/functions.ts\n建议新增：src/lib/<业务>/functions.ts', 'createServerFn；handler；middleware', '定义输入 / 输出与业务规则，挂载鉴权，做输入校验和资源权限检查。对外 API 可新增 src/routes/api/<业务>/。'],
    ['查询与变更同步', '示范：src/lib/auth/queries.ts、hooks.ts\nsrc/router.tsx', 'queryOptions / queryKey；QueryClient；hooks', '为业务数据定义查询键与请求；修改后更新或失效缓存。沿用 Router + Query 的 SSR 集成，不把业务缓存当权限保证。'],
    ['数据模型与迁移', 'src/lib/db/schema/；schema/index.ts\nschema/relations.ts；drizzle.config.ts', 'pgTable；relations；db；drizzle-kit', '新增业务表、约束、关联与索引，并导出 schema；生成 / 应用迁移。认证四表不是完整业务数据库。'],
    ['身份与权限', 'src/lib/auth/auth.ts、middleware.ts', 'socialProviders / plugins；authMiddleware\nfreshAuthMiddleware', '配置第三方身份或认证插件；业务接口显式挂载中间件，再补角色、组织与归属规则。邮件验证 / 重置、MFA 需按需接入。'],
    ['外部业务服务', '建议新增：src/lib/billing/、storage/、ai/、jobs/\n以及 src/routes/api/<服务>/', '服务器模块 / API 路由 / 第三方 SDK', '按需接支付、对象存储、邮件、模型和队列；密钥留在服务端。webhook 需验证真实性并处理重复事件；这些模块并未内置。'],
    ['配置与观测', '.env.schema；nitro.config.ts\nsrc/lib/logger.server.ts', 'ENV；Varlock；evlog logger / drain', '新增并验证环境变量；接日志投递和错误监控。公开 base URL 与敏感凭据分开，实际本地配置放在未提交的 .env.local。'],
    ['构建、测试、部署', 'vite.config.ts；nitro.config.ts\npackage.json；playwright.config.ts', 'Vite+ 插件；Nitro preset；测试脚本', '配置运行目标，补业务与关键流程测试；创建数据库、设置 OAuth 回调和运行密钥，再验证完整部署。preset 不会自动准备这些资源。'],
  ],
  adaptation: [
    ['01', '创建自己的项目', '用模板或 pnpm create cove 初始化；替换名称、首页、示例账号说明与默认 /app。保留所需基础，删去不需要的示例。'],
    ['02', '接好实际运行配置', '准备 Node.js、pnpm、Vite+ 与 PostgreSQL；配置 base URL、数据库 URL 和认证密钥。使用社交登录时再配置 OAuth 凭据与回调。'],
    ['03', '设计业务数据模型', '增加项目、笔记、订单等表与关联；生成并应用迁移。定义 ownerId / tenantId、数据约束和权限规则。'],
    ['04', '完成一个业务闭环', '页面 → Query → 业务服务器函数 / API → 身份与权限校验 → Drizzle。实现创建、读取、更新、删除及缓存同步。'],
    ['05', '按需求接业务服务', '收费接支付 / 权益；附件接对象存储；通知接邮件；AI 接模型 / 任务队列。接口、凭据和失败处理都需实际实现。'],
    ['06', '验证后部署与维护', '测试注册登录、权限、数据变更和关键业务流程；验证构建、数据库连接与平台部署，再补日志监控及依赖升级策略。'],
  ],
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createOverviewHtml(svg) {
  const f = overviewFacts;
  const links = ['README.md','src/router.tsx','src/lib/auth/auth.ts','src/lib/auth/functions.ts','src/lib/auth/middleware.ts','src/lib/db/schema/auth.schema.ts','vite.config.ts','nitro.config.ts'];
  const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cove · 一图完整理解</title><style>' +
    '*{box-sizing:border-box}body{margin:0;background:#eef3f7;color:#152438;font-family:"Microsoft YaHei","Segoe UI",sans-serif;width:1800px;font-size:20px;line-height:1.6}h1,h2,h3,p{margin:0}h1,h2,h3{line-height:1.25}a{color:#05776f;text-decoration:none}.poster{padding:52px 54px 35px}header{display:flex;gap:35px;align-items:center;border-bottom:2px solid #cedae4;padding-bottom:30px;margin-bottom:28px}.logo{width:96px;height:96px;display:grid;place-items:center;border-radius:24px;background:#101e30;color:#6df1cf;font-size:62px;font-weight:750}.eyebrow{font-size:18px;color:#08796f;letter-spacing:2px;margin-bottom:10px}h1{font-size:49px;letter-spacing:-1px}header p{font-size:23px;color:#54667b;margin-top:12px}.stamp{margin-left:auto;text-align:right;font-size:17px;line-height:1.9;color:#576a80}.stamp b{display:block;color:#152438;font-size:21px}.top-grid{display:grid;grid-template-columns:.94fr 1.06fr;gap:25px}.panel{background:white;border:1px solid #cfdae5;border-radius:16px;padding:26px}.section-title{display:flex;align-items:center;gap:13px;margin-bottom:18px}.section-title span{background:#101e30;color:#6df1cf;border-radius:7px;padding:5px 11px;font-size:18px;font-weight:700}.section-title h2{font-size:29px}.definition{font-size:23px;font-weight:650;margin-bottom:16px;color:#08766d}.capabilities{display:grid;gap:12px}.cap-row{display:grid;grid-template-columns:120px 1fr;gap:16px}.cap-row>b{font-size:20px;color:#162b42}.cap-row strong{font-size:18px;font-weight:600}.cap-row p{font-size:18px;color:#57697d;margin-top:3px}.needed{border-left:4px solid #087b73;background:#eaf4f0;padding:12px 15px;margin-top:18px;font-size:18px}.needed b{color:#0b6860}.scenario-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.scenario{padding:15px 17px;background:#f2f6f9;border:1px solid #dbe4eb;border-radius:9px}.scenario h3{font-size:22px;margin-bottom:8px}.scenario p{font-size:18px;color:#54667b}.scenario .add{font-size:17px;color:#0c7069;margin-top:9px}.scenario-note{font-size:18px;color:#596c80;margin-top:15px}.architecture{margin-top:25px}.arch-intro{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.legend{display:flex;gap:20px;font-size:17px;color:#61768a}.legend span:before{content:"";display:inline-block;width:24px;border-top:2px solid #8b9faf;vertical-align:middle;margin-right:7px}.legend .optional:before{border-top-style:dashed}.arch-body{display:grid;grid-template-columns:1.68fr 1fr;gap:24px;align-items:start}.chart{display:block;width:100%;height:auto;border:1px solid #e0e7ee;border-radius:10px;background:white}.path-list{display:grid;gap:15px}.path-card{background:#f2f6f9;border:1px solid #dce5eb;border-radius:9px;padding:18px 20px}.path-card h3{font-size:23px;margin-bottom:10px}.path-card strong{font-size:18px;display:block;color:#08776c;margin-bottom:9px;line-height:1.6;overflow-wrap:anywhere}.path-card p{font-size:19px;color:#53667a}.tools{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;border-top:1px solid #dce4ed;margin-top:16px;padding-top:16px;font-size:18px;color:#586d80}.tools b{color:#152438}.principles{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:25px}.principle{background:#101e30;color:white;padding:24px;border-radius:12px}.principle h3{font-size:23px;color:#7aefd0;margin-bottom:12px}.principle p{font-size:19px;color:#d0dfed}.interfaces{margin-top:25px}.interfaces .caption{font-size:19px;color:#53677b;margin:-4px 0 17px}.interfaces table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:18px}.interfaces th{text-align:left;background:#e7eff4;font-size:18px;color:#52677e;padding:13px 14px;border-bottom:1px solid #ccdae5}.interfaces td{padding:14px 15px;border-bottom:1px solid #dde6ee;vertical-align:top;overflow-wrap:anywhere}.interfaces tbody tr:last-child td{border-bottom:0}.interfaces td:first-child{font-weight:650;color:#123247}.interfaces td:nth-child(2){font-family:"Cascadia Code",Consolas,"Microsoft YaHei",monospace;font-size:17px;color:#546b80;white-space:pre-line}.interfaces td:nth-child(3){color:#08786c;font-size:18px;white-space:pre-line}.interfaces td:nth-child(4){color:#52677b;font-size:19px}.adaptation{margin-top:25px}.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.step{background:#edf5f1;border:1px solid #c5ddd2;border-radius:10px;padding:20px}.step h3{font-size:23px;display:flex;gap:12px;align-items:center;margin-bottom:12px}.step h3 span{font-family:Consolas,monospace;color:#08786c;font-size:22px}.step p{font-size:19px;color:#53677a}.footer-panels{display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-top:25px}.footer-panel{padding:22px 25px;border:1px solid #c9d9e4;border-radius:12px;background:#e5eef4}.footer-panel h3{font-size:23px;margin-bottom:10px}.footer-panel p{font-size:19px;color:#4a6278}.baseline{display:flex;justify-content:space-between;gap:25px;margin-top:22px;font-size:16px;color:#64788c}.baseline code{font-size:16px}.sources{display:flex;gap:15px;flex-wrap:wrap;font-size:15px;margin-top:10px;color:#607489}.sources a{font-size:15px}.section-description{font-size:18px;color:#617588;margin-top:-8px;margin-bottom:15px}.source-mode{font-size:16px;color:#667c91;margin-top:8px}</style></head><body><main class="poster">' +
    '<header><div class="logo">C</div><div><div class="eyebrow">009 / 从定位、业务适配到模块架构</div><h1>Cove = 已集成的全栈项目模板</h1><p>基础连接已经做好；复制模板后，仍需开发自己的业务页面、数据、规则与权限。</p></div><div class="stamp"><b>Cove Stack</b>原名 TanStarter<br>2026-10-09 · 固定源码<br>研究提交 e7d40d5</div></header>' +
    '<div class="top-grid"><section class="panel"><div class="section-title"><span>01</span><h2>它提供什么？</h2></div><p class="definition">提供全栈起步基础，省去从零集成的工作。</p><div class="capabilities">' +
    f.capabilities.map(([title,tech,detail]) => '<div class="cap-row"><b>'+escape(title)+'</b><div><strong>'+escape(tech)+'</strong><p>'+escape(detail)+'</p></div></div>').join('') +
    '</div><div class="needed"><b>业务仍要开发：</b>项目 / 订单 / 笔记等业务表和页面、业务规则、角色与资源权限，以及按需增加的支付、存储、邮件、AI 和队列。</div></section>' +
    '<section class="panel"><div class="section-title"><span>02</span><h2>适合哪些场景？</h2></div><div class="scenario-grid">' +
    f.scenarios.map(([title,examples,add]) => '<article class="scenario"><h3>'+escape(title)+'</h3><p>'+escape(examples)+'</p><p class="add">'+escape(add)+'</p></article>').join('') +
    '</div><p class="scenario-note">共性：有用户登录、结构化数据、表单列表及个人 / 团队工作区。场景属于研究建议，不是模板已经实现的业务。</p></section></div>' +
    '<section class="panel architecture"><div class="arch-intro"><div class="section-title"><span>03</span><h2>模板自身的架构：模块如何搭配</h2></div><div class="legend"><span>已有调用关系</span><span class="optional">需显式接入的中间件</span></div></div><div class="arch-body"><img class="chart" alt="Cove 浏览器、服务器和 PostgreSQL 模块架构及两条入口" src="data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64') + '"><div class="path-list">' +
    f.paths.map(([title,path,detail]) => '<article class="path-card"><h3>'+escape(title)+'</h3><strong>'+escape(path)+'</strong><p>'+escape(detail)+'</p></article>').join('') +
    '</div></div><div class="tools"><p><b>Varlock / ENV：</b>校验配置、生成类型；服务端密钥留在服务器。</p><p><b>Nitro / evlog：</b>承载服务器请求，记录结构化日志；投递平台按需接入。</p><p><b>Vite+ / 测试：</b>开发、构建、检查；轻量测试基础，业务验证需要补齐。</p></div></section>' +
    '<div class="principles">' + f.principles.map(([title,text])=>'<article class="principle"><h3>'+escape(title)+'</h3><p>'+escape(text)+'</p></article>').join('') + '</div>' +
    '<section class="panel interfaces"><div class="section-title"><span>04</span><h2>扩展入口：真实位置、框架 API 与适配方式</h2></div><p class="caption">这里的“预留接口”是框架 API、可配置模块和目录约定；固定源码中未发现 Cove 专用的业务插件注册系统。“建议新增”路径属于我们的扩展方案。</p><table><colgroup><col style="width:10%"><col style="width:29%"><col style="width:23%"><col style="width:38%"></colgroup><thead><tr><th>扩展层</th><th>对应文件 / 目录</th><th>已有接口 / 模式</th><th>使用时要适配什么</th></tr></thead><tbody>' +
    f.interfaces.map(row=>'<tr>'+row.map(text=>'<td>'+escape(text)+'</td>').join('')+'</tr>').join('') +
    '</tbody></table></section>' +
    '<section class="panel adaptation"><div class="section-title"><span>05</span><h2>从模板到自己的产品：六步完成适配</h2></div><p class="section-description">“拿来使用”包含实际的前后端开发。先做一个完整业务闭环，再增加复杂服务。</p><div class="steps">' +
    f.adaptation.map(([number,title,text])=>'<article class="step"><h3><span>'+number+'</span>'+escape(title)+'</h3><p>'+escape(text)+'</p></article>').join('') + '</div><div class="startup"><b>启动参考（固定 README；先准备运行工具与数据库）</b><code>pnpm create cove</code><span>→ 进入项目并填写 .env.local →</span><code>vpr env:load</code><span>→</span><code>vpr db generate</code><span>→</span><code>vpr db migrate</code><span>→</span><code>vpr dev</code></div></section>' +
    '<div class="footer-panels"><section class="footer-panel"><h3>适用边界</h3><p>纯静态介绍页可以更轻量；复杂电商、ERP、实时协作等可继续开发，但专门的领域功能和基础设施仍需设计。认证四表不等于业务系统，verification 表存在也不等于验证邮件已经接通。</p></section><section class="footer-panel"><h3>运行与版本条件</h3><p>原模板：Node.js ≥ 24、pnpm ≥ 12、Vite+、PostgreSQL。固定版本含 Drizzle 1.0.0-rc.4、Nitro v3 beta；采用时验证目标平台兼容性。package.json 的 0.0.1 不代表稳定正式发布。</p></section></div>' +
    '<div class="baseline"><span>上游：github.com/mugnavo/cove · Unlicense · 原创中文总览与架构解读</span><code>'+meta.commit+'</code></div><div class="sources"><b>源码证据：</b>'+links.map(file=>'<a href="'+escape(source(file))+'">'+escape(file)+'</a>').join('')+'</div><p class="source-mode">依据固定源码整理；应用场景和业务扩展为建议。未运行 Cove 后端、真实 OAuth、数据库迁移或生产部署性能测试。</p>' +
    '</main></body></html>';
  return html.replace('</style>', '.startup{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:18px;border-top:1px solid #cfdfd6;padding-top:16px;font-size:18px;color:#53677a}.startup>b{width:100%;font-size:19px;color:#123247}.startup code{padding:4px 9px;background:#e1eee7;border:1px solid #bdd3c7;border-radius:5px;font:18px Consolas,monospace}</style>');
}
