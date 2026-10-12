// 完整发布理解；保留 2026-10-09 固定源码与已有总览图，扩展与场景为研究建议。
import { meta, capabilities, principles, scenarios, directory, versions, references, docs } from './content.js';
import { overviewFacts } from './overview.js';
export const guide = {
  file:'cove-overview.png',width:2700,height:6471,bytes:2008514,
  sha256:'085338220f911e14ce8c388204eb4011d60be73282bac90fe9cef5387203143f',
  date:'2026-10-09',origin:'本项目原创 HTML/CSS 排版与 SVG 架构图；本轮原始 PNG 字节保持不变。',
};
export const summaryItems = [
  {title:'定位',text:'Cove Stack（原 TanStarter）是 React / TypeScript 全栈起步模板：已连接页面、路由、查询、身份、数据库和工具链，创建自己的工程后继续开发业务。'},
  {title:'能力',text:'八类基础覆盖 SSR 与服务器函数、文件路由、Query 缓存、邮箱密码及可配置 OAuth、认证数据与迁移、UI / 主题、环境日志测试、构建部署；默认 /app 仅为用户展示示例。'},
  {title:'模块',text:'按职责分为页面 UI、Router / Query、服务器函数与 API、Better Auth、会话与业务鉴权、Drizzle / PostgreSQL、环境与观测、构建测试部署八组；四张图含 35 个可查看源码的节点。'},
  {title:'执行原理',text:'首次请求由 Start 做 SSR，浏览器水合接管交互；createServerFn 在浏览器成为 RPC 代理，数据库实现留在服务端。文件路由生成路由树，Router 与 Query 共享 SSR 数据。'},
  {title:'身份与数据',text:'authClient 经 /api/auth/* 到 auth.handler；当前用户经 $getUser / _getUser 到 getSession。Better Auth 用 Drizzle adapter 访问 user、session、account、verification 四表，并转发 Cookie。'},
  {title:'缓存与权限',text:'Query 默认两分钟新鲜期，认证 Cookie 缓存五分钟；均不等于会话有效期。beforeLoad 控制页面导航，业务接口显式鉴权；freshAuthMiddleware 跳过缓存，角色、归属与租户权限仍需开发。'},
  {title:'适用场景',text:'个人工具 SaaS、团队内部管理、会员内容、AI 工具 Web 底座、客户门户、项目研究平台；适合账号、结构化记录与工作区交互，场景及专业业务服务为适配建议。'},
  {title:'价值',text:'复用各库接线、类型边界与基础工具，把投入转向业务模型和用户流程；还可学习 SSR / RPC / 认证与授权分工、作为自己的工程起点。实际省时、质量和性能收益未量化。'},
  {title:'适配与复用',text:'可使用完整模板、学习接线方法、择取模块或建立自己的研究工作区。六步为创建工程、配置运行条件、设计业务数据、完成页面到数据库闭环、接业务服务、验证部署维护。'},
  {title:'扩展入口',text:'八处真实入口对应页面 UI、服务器函数、查询同步、schema / 迁移、身份权限、外部服务、环境观测和部署测试。“预留接口”是框架 API / 配置与目录约定，未发现专用业务插件注册系统。'},
  {title:'扩展方向',text:'业务记录、组织授权、支付权益、文件内容、邮件通知、AI / 队列、检索报表、运行治理八项均为待开发建议；需设计资源归属、外部事件验证、幂等、失败处理和验收。'},
  {title:'来源与边界',text:'固定 e7d40d5、Unlicense；原模板要求 Node.js ≥24、pnpm ≥12、Vite+ 与 PostgreSQL，依赖含 Drizzle RC / Nitro beta。本次发布静态研究和已有原图，未运行 Cove 后端、真实 OAuth、迁移或性能测试。'},
];
export const overviewItems = [
  {title:'定位与能力',text:'用 Cove 创建自己的全栈工程，再补业务页面、规则和数据。它已连接 React、TanStack Start / Router / Query、Better Auth、Drizzle / PostgreSQL、UI 与开发工具；默认登录后页面仍是示例。'},
  {title:'模块与原理',text:'页面和文件路由进入 SSR / 水合及 Query；用户读取走服务器函数，登录走认证 API；Better Auth 经适配器保存账户与会话。数据库和密钥留在服务端，页面导航检查与接口授权分别负责。'},
  {title:'场景与产出',text:'可做个人笔记工具、内部项目看板、会员资料库、AI 工具门户或客户工单。以研究平台为例，完成自己的研究记录、笔记和实验数据闭环；模型、支付、存储和组织权限需继续接入。'},
  {title:'价值与复用',text:'复用基础接线与工程约定，把开发投入到产品流程、业务约束和验收；也可只参考 SSR、RPC、身份与缓存的组合方法。模板不能替代需求设计、权限规则和业务维护。'},
  {title:'适配与扩展',text:'从实际环境、业务 schema、服务器函数、页面与查询开始，沿八处入口增加支付权益、文件邮件、AI 队列和监控。先验收一条完整闭环，再增加组织、检索、报表和更复杂的服务。'},
  {title:'图与验证边界',text:'下图沿用我们已生成的完整中文总览，说明已有能力、配置项、模块关系和建议新增路径；网页另补价值与复用。研究固定源码，静态网页可用性与原 Cove 全栈运行效果分别看待。'},
];
export const modules = [
  {title:'页面与基础 UI',text:'React 组件、根文档、Tailwind / shadcn/ui / Base UI、主题和通知构成表现层；公开首页、访客登录注册与 /app 示例展示不同入口。业务表单、列表和看板由自己的页面实现。',files:['src/routes/__root.tsx','src/components/','src/routes/_auth/app/']},
  {title:'文件路由与查询',text:'src/routes 生成 routeTree；_auth / _guest 为路径隐藏布局。router.tsx 创建 Router、QueryClient 和 SSR Query 集成；auth 查询与 hooks 复用查询键，变更后需同步或失效业务缓存。',files:['src/router.tsx','src/routeTree.gen.ts','src/lib/auth/queries.ts']},
  {title:'服务器函数与 HTTP API',text:'createServerFn 提供应用内部类型化调用；浏览器走 RPC，SSR 可直接执行。对外端点使用 API 路由；/api/auth/* 是认证路由，不能据此假定自己的业务 API 已具备鉴权。',files:['src/lib/auth/functions.ts','src/routes/api/auth/$.ts']},
  {title:'账号认证',text:'浏览器 authClient 调用 signIn、signUp、signOut；服务端 auth.handler 处理邮箱密码、OAuth 与账户会话。GitHub / Google provider 是配置入口，需自己的凭据和回调；邮件与 MFA 未接通。',files:['src/lib/auth/auth-client.ts','src/lib/auth/auth.ts','src/components/sign-in-social-buttons.tsx']},
  {title:'会话与鉴权边界',text:'_getUser 读取请求头、调用 getSession 并转发 Set-Cookie。authMiddleware / freshAuthMiddleware 需要显式挂载；会话识别身份，角色、资源归属、组织和操作权限由业务代码判定。',files:['src/lib/auth/functions.ts','src/lib/auth/middleware.ts','src/routes/_auth/route.tsx']},
  {title:'数据库与迁移',text:'postgres-js 连接 PostgreSQL，Drizzle 描述 schema / relations，Better Auth 使用 Drizzle adapter。现有四张认证表不是业务模型；schema、约束、索引、迁移和查询需随业务设计。',files:['src/lib/db/index.ts','src/lib/db/schema/auth.schema.ts','drizzle.config.ts']},
  {title:'环境与运行观测',text:'Varlock 用 .env.schema 定义环境契约并生成类型，实际凭据放在未提交的 .env.local；evlog / Nitro 提供结构化请求日志与脱敏配置，日志投递和业务指标需要接入。',files:['.env.schema','nitro.config.ts','src/lib/logger.server.ts']},
  {title:'开发、构建与部署',text:'Vite+ 组织开发、构建、格式与类型检查；Start / Nitro 打包浏览器和服务器执行边界，Vitest / Playwright 提供轻量测试基础。部署 preset 不自动创建数据库、OAuth 应用或运行凭据。',files:['vite.config.ts','package.json','playwright.config.ts']},
];
export const values = [
  {title:'把投入集中到业务',text:'不用从空工程开始连接账号、数据库、路由与基础工具，可从“保存一条自己的研究记录”开始。节省的是起步集成工作，具体节省比例没有实测。'},
  {title:'使前后端约定可检查',text:'TypeScript、文件路由和服务器函数帮助传递类型与维护调用；运行时输入校验、数据库约束和授权仍要写，编译通过不等于业务正确。'},
  {title:'建立身份与权限的清晰分工',text:'已有会话机制与可复用中间件可以作为身份基础；开发者能够明确页面体验、服务器鉴权和资源授权的位置，减少把按钮显隐当权限的误解。'},
  {title:'学习完整全栈链路',text:'同一份示例可追踪 SSR、水合、RPC、Query、Cookie、ORM 与迁移，学习每个模块负责什么，以及浏览器和服务器的执行边界。'},
  {title:'沉淀自己的工程起点',text:'可保留基础接线，添加业务 schema、测试、设计组件与运行约定，成为个人或团队内部模板；升级后仍要重新验证集成与许可。'},
  {title:'按需要选择运行与服务',text:'Nitro 为部署目标提供适配入口，外部服务放入服务器模块或 API；选择平台时仍需看数据库连接、执行时长、成本、文件与任务特性。'},
];
export const reuse = [
  {title:'直接使用完整模板',text:'适合新的 TypeScript 全栈产品。创建工程、替换品牌与示例页、配置数据库和认证，然后实现一条业务流程；整体采用也意味着维护这组依赖。'},
  {title:'参考模块连接方法',text:'已有项目可借鉴 Router / Query SSR、服务器函数、Better Auth 与 Drizzle 接线，不必同时迁入全部库。先比较自己的执行模型与版本，逐项验证兼容性。'},
  {title:'择取基础模块与约定',text:'可选择 UI、环境验证、日志或测试组织方式。数据库、认证、Cookie 与部署存在配套关系，不能复制单文件后假定完整效果自然成立。'},
  {title:'建立我们的研究工作区',text:'新增 Research / Note / Experiment 与 ownerId，先实现收藏、保存笔记、查看实验，再决定组织协作和 AI 辅助。当前研究网站仅呈现理解，这个业务工作区是后续方案。'},
];
export const extensions = [
  {title:'业务数据与记录闭环',text:'新增业务 schema、服务器函数、Query 和页面；定义字段、约束、资源归属和变更后的缓存同步。',entry:'src/routes/_auth/app/；建议新增 src/lib/research/',acceptance:'不同用户只能访问自己的记录，创建—查看—修改—删除可恢复且错误可解释。'},
  {title:'组织、角色与多租户',text:'设计组织、成员、角色及 tenantId 授权；需要时使用认证生态插件，再写业务资源和操作权限。',entry:'src/lib/auth/auth.ts、middleware.ts；建议新增 authorization/',acceptance:'服务端验证跨租户访问、角色变更与会话撤销，页面显隐和真实接口行为一致。'},
  {title:'支付、订阅与权益',text:'接支付服务与 webhook；保存订单、订阅、权益和用量，设计重复事件处理、退款与对账。',entry:'建议新增 src/lib/billing/ 与 src/routes/api/billing/',acceptance:'伪造或重复事件不改变错误权益，付款状态和实际可用额度一致。'},
  {title:'文件与内容管理',text:'对象存储保存附件，数据库保存元数据与 ownerId；补上传限制、授权访问和删除策略。',entry:'建议新增 src/lib/storage/ 与内容业务 schema',acceptance:'上传、读取和删除遵守资源归属，失效文件与元数据能够清理。'},
  {title:'邮件、通知与账户流程',text:'按需接验证、重置和业务通知的邮件服务；设计发送、失败重试和通知偏好。verification 表不会自动提供投递。',entry:'src/lib/auth/auth.ts；建议新增 src/lib/mail/',acceptance:'真实邮件完成目标流程，过期或重复操作有明确处理，错误可回查。'},
  {title:'AI 调用与异步任务',text:'服务器接模型、流式输出、解析和队列；区分即时响应与耗时任务，记录用量、状态和取消 / 重试。',entry:'建议新增 src/lib/ai/、jobs/ 与 src/routes/api/ai/',acceptance:'密钥不进入浏览器，耗时任务可追踪，重复执行和额度更新有规则。'},
  {title:'检索、报表与业务后台',text:'补索引、分页、搜索条件、统计与导出；数据量较大时按查询负载选择检索或分析服务。',entry:'业务 schema / queries；建议新增后台路由与 reporting/',acceptance:'按权限返回结果，空状态和分页稳定，统计口径和导出内容可核验。'},
  {title:'运行治理与长期维护',text:'接日志投递、错误监控、业务测试、迁移策略和依赖升级；验证平台、连接池与运行限制。',entry:'nitro.config.ts、logger.server.ts、测试与部署配置',acceptance:'部署后关键流程通过，故障可定位，升级和数据变更有可验证的回退方案。'},
];
export const faqs = [
  {title:'是否只要改页面就能成为自己的产品？',text:'页面只是适配的一部分。自己的产品还需要业务数据、服务器规则、输入校验、权限、外部服务和验收；模板承担基础接线。'},
  {title:'“模板库”和组件库有什么区别？',text:'这里是可复制并继续开发的完整 starter 工程，包含前后端基础和配置；不是只安装几个 UI 组件就获得业务功能的单一组件包。'},
  {title:'它有没有统一的业务插件接口？',text:'固定源码中未发现 Cove 专用业务插件注册系统。所谓扩展接口主要是 createFileRoute、createServerFn、Query、schema、认证 plugins / provider 和部署配置；建议新增目录明确标记。'},
  {title:'登录后是否自动保护所有数据接口？',text:'不会。_auth.beforeLoad 决定页面导航；自己的服务器函数或 API 仍要显式验证身份、输入、资源归属与操作权限。freshAuthMiddleware 只跳过 Cookie 缓存。'},
  {title:'能否把原 Cove 应用直接放 GitHub Pages？',text:'SSR、认证、服务器函数与数据库操作需要服务器运行环境。GitHub Pages 发布的是我们这份静态研究网页；实际产品应配置兼容运行平台、数据库和凭据。'},
  {title:'如何跟进上游更新？',text:'先保留自己的业务差异和锁定版本，对照上游提交审查配置 / API / schema，再做迁移与关键流程测试。本研究固定 2026-10-09 基线，本轮发布不声称覆盖上游之后的全部变化。'},
];
export const publication = {
  meta:{...meta,publicationDate:'2026-10-12',license:'Unlicense',scope:'静态中文研究网页；不运行 Cove 认证、数据库或业务后端。'},
  guide,summaryItems,overviewItems,modules,capabilities,principles,scenarios,values,reuse,
  interfaces:overviewFacts.interfaces,adaptation:overviewFacts.adaptation,extensions,faqs,directory,versions,references,docs,
};
