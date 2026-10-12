# 009 · Cove 完整理解

上游：https://github.com/mugnavo/cove
固定提交：e7d40d524b6526d80c803fd092f6fa8bf2029f8e
研究基线：2026-10-09；完整整理与发布：2026-10-12。
上游许可：Unlicense。

静态中文研究网页；不运行 Cove 认证、数据库或业务后端。

## 十二项摘要

### 定位

Cove Stack（原 TanStarter）是 React / TypeScript 全栈起步模板：已连接页面、路由、查询、身份、数据库和工具链，创建自己的工程后继续开发业务。

### 能力

八类基础覆盖 SSR 与服务器函数、文件路由、Query 缓存、邮箱密码及可配置 OAuth、认证数据与迁移、UI / 主题、环境日志测试、构建部署；默认 /app 仅为用户展示示例。

### 模块

按职责分为页面 UI、Router / Query、服务器函数与 API、Better Auth、会话与业务鉴权、Drizzle / PostgreSQL、环境与观测、构建测试部署八组；四张图含 35 个可查看源码的节点。

### 执行原理

首次请求由 Start 做 SSR，浏览器水合接管交互；createServerFn 在浏览器成为 RPC 代理，数据库实现留在服务端。文件路由生成路由树，Router 与 Query 共享 SSR 数据。

### 身份与数据

authClient 经 /api/auth/* 到 auth.handler；当前用户经 $getUser / _getUser 到 getSession。Better Auth 用 Drizzle adapter 访问 user、session、account、verification 四表，并转发 Cookie。

### 缓存与权限

Query 默认两分钟新鲜期，认证 Cookie 缓存五分钟；均不等于会话有效期。beforeLoad 控制页面导航，业务接口显式鉴权；freshAuthMiddleware 跳过缓存，角色、归属与租户权限仍需开发。

### 适用场景

个人工具 SaaS、团队内部管理、会员内容、AI 工具 Web 底座、客户门户、项目研究平台；适合账号、结构化记录与工作区交互，场景及专业业务服务为适配建议。

### 价值

复用各库接线、类型边界与基础工具，把投入转向业务模型和用户流程；还可学习 SSR / RPC / 认证与授权分工、作为自己的工程起点。实际省时、质量和性能收益未量化。

### 适配与复用

可使用完整模板、学习接线方法、择取模块或建立自己的研究工作区。六步为创建工程、配置运行条件、设计业务数据、完成页面到数据库闭环、接业务服务、验证部署维护。

### 扩展入口

八处真实入口对应页面 UI、服务器函数、查询同步、schema / 迁移、身份权限、外部服务、环境观测和部署测试。“预留接口”是框架 API / 配置与目录约定，未发现专用业务插件注册系统。

### 扩展方向

业务记录、组织授权、支付权益、文件内容、邮件通知、AI / 队列、检索报表、运行治理八项均为待开发建议；需设计资源归属、外部事件验证、幂等、失败处理和验收。

### 来源与边界

固定 e7d40d5、Unlicense；原模板要求 Node.js ≥24、pnpm ≥12、Vite+ 与 PostgreSQL，依赖含 Drizzle RC / Nitro beta。本次发布静态研究和已有原图，未运行 Cove 后端、真实 OAuth、迁移或性能测试。

## 图前介绍

### 定位与能力

用 Cove 创建自己的全栈工程，再补业务页面、规则和数据。它已连接 React、TanStack Start / Router / Query、Better Auth、Drizzle / PostgreSQL、UI 与开发工具；默认登录后页面仍是示例。

### 模块与原理

页面和文件路由进入 SSR / 水合及 Query；用户读取走服务器函数，登录走认证 API；Better Auth 经适配器保存账户与会话。数据库和密钥留在服务端，页面导航检查与接口授权分别负责。

### 场景与产出

可做个人笔记工具、内部项目看板、会员资料库、AI 工具门户或客户工单。以研究平台为例，完成自己的研究记录、笔记和实验数据闭环；模型、支付、存储和组织权限需继续接入。

### 价值与复用

复用基础接线与工程约定，把开发投入到产品流程、业务约束和验收；也可只参考 SSR、RPC、身份与缓存的组合方法。模板不能替代需求设计、权限规则和业务维护。

### 适配与扩展

从实际环境、业务 schema、服务器函数、页面与查询开始，沿八处入口增加支付权益、文件邮件、AI 队列和监控。先验收一条完整闭环，再增加组织、检索、报表和更复杂的服务。

### 图与验证边界

下图沿用我们已生成的完整中文总览，说明已有能力、配置项、模块关系和建议新增路径；网页另补价值与复用。研究固定源码，静态网页可用性与原 Cove 全栈运行效果分别看待。

## 完整引导图

![Cove 完整原图](./assets/cove-overview.png)

2700 × 6471；SHA-256：085338220f911e14ce8c388204eb4011d60be73282bac90fe9cef5387203143f

## 八类能力

### 页面与全栈执行

在同一 TypeScript 项目中组织页面、SSR、服务器函数和 API 路由。客户端与服务器共享部分类型和路由定义。

- [src/routes/__root.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/__root.tsx)
- [src/lib/auth/functions.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/functions.ts)

### 文件路由与导航

页面按目录组织，生成类型化路由树。已有公开首页、访客布局、登录注册页和登录后 /app 示例。

- [src/routeTree.gen.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routeTree.gen.ts)
- [src/routes/_auth/route.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/_auth/route.tsx)

### 查询与状态同步

统一查询键管理用户数据，缓存、去重与 SSR 集成已配置。组件和路由可以复用同一份查询定义。

- [src/router.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/router.tsx)
- [src/lib/auth/queries.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/queries.ts)
- [src/components/sign-out-button.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/components/sign-out-button.tsx)

### 账号与登录会话

邮箱密码注册、登录、退出已有页面和处理链。GitHub 与 Google provider 已写入配置，需提供自己的凭据。

- [src/lib/auth/auth.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/auth.ts)
- [src/routes/_guest/signup.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/_guest/signup.tsx)
- [.env.schema](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/.env.schema)

### 数据表与迁移

已有认证表、关联、服务端数据库客户端和 drizzle-kit 配置，可生成并应用迁移。Compose 提供本地 PostgreSQL 服务。

- [src/lib/db/schema/auth.schema.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/db/schema/auth.schema.ts)
- [drizzle.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/drizzle.config.ts)
- [docker-compose.yml](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/docker-compose.yml)

### 基础 UI 与主题

已有表单、按钮、菜单、通知及浅色 / 深色 / 跟随系统主题，主题偏好保存在本机浏览器。

- [src/components/theme-provider.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/components/theme-provider.tsx)
- [src/components/ui/button.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/components/ui/button.tsx)
- [src/routes/_auth/app/index.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/_auth/app/index.tsx)

### 配置、日志与测试

环境变量契约与类型生成、请求日志、格式检查、类型检查和轻量测试基础已经组织好。

- [.env.schema](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/.env.schema)
- [nitro.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/nitro.config.ts)
- [package.json](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/package.json)
- [playwright.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/playwright.config.ts)

### 构建与部署

开发、构建、启动脚本和 Nitro 集成已有入口；可按部署平台选择相应运行与打包方式。

- [vite.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/vite.config.ts)
- [nitro.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/nitro.config.ts)
- [package.json](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/package.json)

## 八组模块

### 页面与基础 UI

React 组件、根文档、Tailwind / shadcn/ui / Base UI、主题和通知构成表现层；公开首页、访客登录注册与 /app 示例展示不同入口。业务表单、列表和看板由自己的页面实现。

- [src/routes/__root.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/__root.tsx)
- [src/components/](https://github.com/mugnavo/cove/tree/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/components/)
- [src/routes/_auth/app/](https://github.com/mugnavo/cove/tree/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/_auth/app/)

### 文件路由与查询

src/routes 生成 routeTree；_auth / _guest 为路径隐藏布局。router.tsx 创建 Router、QueryClient 和 SSR Query 集成；auth 查询与 hooks 复用查询键，变更后需同步或失效业务缓存。

- [src/router.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/router.tsx)
- [src/routeTree.gen.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routeTree.gen.ts)
- [src/lib/auth/queries.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/queries.ts)

### 服务器函数与 HTTP API

createServerFn 提供应用内部类型化调用；浏览器走 RPC，SSR 可直接执行。对外端点使用 API 路由；/api/auth/* 是认证路由，不能据此假定自己的业务 API 已具备鉴权。

- [src/lib/auth/functions.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/functions.ts)
- [src/routes/api/auth/$.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/api/auth/$.ts)

### 账号认证

浏览器 authClient 调用 signIn、signUp、signOut；服务端 auth.handler 处理邮箱密码、OAuth 与账户会话。GitHub / Google provider 是配置入口，需自己的凭据和回调；邮件与 MFA 未接通。

- [src/lib/auth/auth-client.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/auth-client.ts)
- [src/lib/auth/auth.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/auth.ts)
- [src/components/sign-in-social-buttons.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/components/sign-in-social-buttons.tsx)

### 会话与鉴权边界

_getUser 读取请求头、调用 getSession 并转发 Set-Cookie。authMiddleware / freshAuthMiddleware 需要显式挂载；会话识别身份，角色、资源归属、组织和操作权限由业务代码判定。

- [src/lib/auth/functions.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/functions.ts)
- [src/lib/auth/middleware.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/middleware.ts)
- [src/routes/_auth/route.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/_auth/route.tsx)

### 数据库与迁移

postgres-js 连接 PostgreSQL，Drizzle 描述 schema / relations，Better Auth 使用 Drizzle adapter。现有四张认证表不是业务模型；schema、约束、索引、迁移和查询需随业务设计。

- [src/lib/db/index.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/db/index.ts)
- [src/lib/db/schema/auth.schema.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/db/schema/auth.schema.ts)
- [drizzle.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/drizzle.config.ts)

### 环境与运行观测

Varlock 用 .env.schema 定义环境契约并生成类型，实际凭据放在未提交的 .env.local；evlog / Nitro 提供结构化请求日志与脱敏配置，日志投递和业务指标需要接入。

- [.env.schema](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/.env.schema)
- [nitro.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/nitro.config.ts)
- [src/lib/logger.server.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/logger.server.ts)

### 开发、构建与部署

Vite+ 组织开发、构建、格式与类型检查；Start / Nitro 打包浏览器和服务器执行边界，Vitest / Playwright 提供轻量测试基础。部署 preset 不自动创建数据库、OAuth 应用或运行凭据。

- [vite.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/vite.config.ts)
- [package.json](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/package.json)
- [playwright.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/playwright.config.ts)

## 六个执行原理

### 服务器函数：函数调用背后是网络边界

createServerFn 定义的处理逻辑在服务器执行。浏览器构建中，调用变成 RPC 请求；SSR 中则直接执行服务器实现。Cove 用 $getUser 演示这个机制，数据库模块另用 server-only 限制导入。

- [src/lib/auth/functions.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/functions.ts)
- [src/lib/db/index.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/db/index.ts)

### SSR 与水合：同一页面，两种执行环境

首次访问时，Start 在服务器准备数据和 HTML；浏览器恢复交互并接管后续导航。Router、Query 和组件可能参与两种环境，所以不能直接在普通 loader 中读取私密数据库或服务器密钥。

- [src/router.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/router.tsx)
- [src/routes/__root.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/__root.tsx)

### 双层缓存：两个不同的请求成本

Query 在浏览器减少重复访问服务器；Better Auth 的 Cookie 缓存在服务端减少访问数据库。普通查询默认两分钟新鲜期，会话 Cookie 缓存默认五分钟；二者不是会话有效期，也不是严格实时一致性的承诺。

- [src/router.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/router.tsx)
- [src/lib/auth/auth.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/auth.ts)
- [src/routes/_auth/route.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/_auth/route.tsx)

### 认证与授权：先确定是谁，再确定能做什么

beforeLoad 决定是否进入页面。业务服务器函数或 API 必须校验身份，可挂载模板提供的中间件；随后还要校验角色、资源归属和具体操作权限。freshAuthMiddleware 只提高会话状态新鲜度，不自动实现业务授权。

- [src/routes/_auth/route.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/_auth/route.tsx)
- [src/lib/auth/middleware.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/middleware.ts)

### ORM 与迁移：代码描述数据，数据库保存数据

Drizzle 的 schema 描述表、外键和索引；drizzle-kit 根据结构生成迁移，再由 migrate 应用数据库变更。模板的认证表只是起点，新增业务时还需设计约束、查询和权限规则。

- [src/lib/db/schema/auth.schema.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/db/schema/auth.schema.ts)
- [drizzle.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/drizzle.config.ts)
- [src/lib/db/index.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/db/index.ts)

### 组合式模板：价值在连接处

Cove 集成依赖，而各库承担具体能力：Start 处理全栈执行，Better Auth 处理认证，Drizzle 处理数据访问，Nitro 处理服务器部署。扩展时优先沿已有边界增加业务模块，避免把所有逻辑都堆到页面组件。

- [package.json](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/package.json)
- [vite.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/vite.config.ts)
- [src/lib/auth/auth.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/auth.ts)

## 六类使用场景

### 个人工具型 SaaS

书签、笔记、习惯追踪、个人记账

账号、个人数据和表单列表交互，可以直接建立在现有登录与数据库基础上。

继续开发：业务表、增删改查、检索、统计、数据归属校验；收费时再接支付。

### 团队内部管理

项目看板、客户跟进、资产登记

适合以结构化记录、查询、表单和状态流转为主的业务。

继续开发：组织成员、角色权限、审批规则、审计记录；多团队需要租户隔离。

### 会员内容平台

课程网站、资料库、学习平台

公开页面和登录区可以共存；已有账号系统可作为会员身份基础。

继续开发：内容管理、访问权益、支付订阅、进度记录、存储与邮件。

### AI 工具网站

AI 写作、文档问答、简历优化

可以承载登录、输入界面、历史记录及服务器调用入口。模板本身没有模型能力。

继续开发：模型 SDK、流式响应、文件解析、任务队列、额度计费和调用监控。

### 客户服务门户

工单、项目交付进度、客户文件查询

每位客户登录后查看自己的记录，符合已有账号和持久化基础。

继续开发：客户隔离、附件存储、处理状态、消息通知和操作权限。

### 我们的项目研究平台

项目收藏、研究笔记、实验记录、任务进度

现有静态研究集可以逐步演进为登录后的个人或团队工作区。

继续开发：Project / Note / Experiment 表、检索、收藏、成员权限。当前研究网页仅负责展示理解。

## 六项价值

### 把投入集中到业务

不用从空工程开始连接账号、数据库、路由与基础工具，可从“保存一条自己的研究记录”开始。节省的是起步集成工作，具体节省比例没有实测。

### 使前后端约定可检查

TypeScript、文件路由和服务器函数帮助传递类型与维护调用；运行时输入校验、数据库约束和授权仍要写，编译通过不等于业务正确。

### 建立身份与权限的清晰分工

已有会话机制与可复用中间件可以作为身份基础；开发者能够明确页面体验、服务器鉴权和资源授权的位置，减少把按钮显隐当权限的误解。

### 学习完整全栈链路

同一份示例可追踪 SSR、水合、RPC、Query、Cookie、ORM 与迁移，学习每个模块负责什么，以及浏览器和服务器的执行边界。

### 沉淀自己的工程起点

可保留基础接线，添加业务 schema、测试、设计组件与运行约定，成为个人或团队内部模板；升级后仍要重新验证集成与许可。

### 按需要选择运行与服务

Nitro 为部署目标提供适配入口，外部服务放入服务器模块或 API；选择平台时仍需看数据库连接、执行时长、成本、文件与任务特性。

## 四条复用路线

### 直接使用完整模板

适合新的 TypeScript 全栈产品。创建工程、替换品牌与示例页、配置数据库和认证，然后实现一条业务流程；整体采用也意味着维护这组依赖。

### 参考模块连接方法

已有项目可借鉴 Router / Query SSR、服务器函数、Better Auth 与 Drizzle 接线，不必同时迁入全部库。先比较自己的执行模型与版本，逐项验证兼容性。

### 择取基础模块与约定

可选择 UI、环境验证、日志或测试组织方式。数据库、认证、Cookie 与部署存在配套关系，不能复制单文件后假定完整效果自然成立。

### 建立我们的研究工作区

新增 Research / Note / Experiment 与 ownerId，先实现收藏、保存笔记、查看实验，再决定组织协作和 AI 辅助。当前研究网站仅呈现理解，这个业务工作区是后续方案。

## 八处扩展入口（新增路径为建议）

### 页面与 UI

位置：src/routes/_auth/app/；src/components/ui/

接口：createFileRoute；基础 UI / 主题组件

新增页面、表单、列表与交互；路由树由工具生成。_auth、_guest 为路径隐藏布局，URL 为 /app、/login、/signup。

### 服务器业务逻辑

位置：示范：src/lib/auth/functions.ts
建议新增：src/lib/<业务>/functions.ts

接口：createServerFn；handler；middleware

定义输入 / 输出与业务规则，挂载鉴权，做输入校验和资源权限检查。对外 API 可新增 src/routes/api/<业务>/。

### 查询与变更同步

位置：示范：src/lib/auth/queries.ts、hooks.ts
src/router.tsx

接口：queryOptions / queryKey；QueryClient；hooks

为业务数据定义查询键与请求；修改后更新或失效缓存。沿用 Router + Query 的 SSR 集成，不把业务缓存当权限保证。

### 数据模型与迁移

位置：src/lib/db/schema/；schema/index.ts
schema/relations.ts；drizzle.config.ts

接口：pgTable；relations；db；drizzle-kit

新增业务表、约束、关联与索引，并导出 schema；生成 / 应用迁移。认证四表不是完整业务数据库。

### 身份与权限

位置：src/lib/auth/auth.ts、middleware.ts

接口：socialProviders / plugins；authMiddleware
freshAuthMiddleware

配置第三方身份或认证插件；业务接口显式挂载中间件，再补角色、组织与归属规则。邮件验证 / 重置、MFA 需按需接入。

### 外部业务服务

位置：建议新增：src/lib/billing/、storage/、ai/、jobs/
以及 src/routes/api/<服务>/

接口：服务器模块 / API 路由 / 第三方 SDK

按需接支付、对象存储、邮件、模型和队列；密钥留在服务端。webhook 需验证真实性并处理重复事件；这些模块并未内置。

### 配置与观测

位置：.env.schema；nitro.config.ts
src/lib/logger.server.ts

接口：ENV；Varlock；evlog logger / drain

新增并验证环境变量；接日志投递和错误监控。公开 base URL 与敏感凭据分开，实际本地配置放在未提交的 .env.local。

### 构建、测试、部署

位置：vite.config.ts；nitro.config.ts
package.json；playwright.config.ts

接口：Vite+ 插件；Nitro preset；测试脚本

配置运行目标，补业务与关键流程测试；创建数据库、设置 OAuth 回调和运行密钥，再验证完整部署。preset 不会自动准备这些资源。

## 六步适配

### 01 创建自己的项目

用模板或 pnpm create cove 初始化；替换名称、首页、示例账号说明与默认 /app。保留所需基础，删去不需要的示例。

### 02 接好实际运行配置

准备 Node.js、pnpm、Vite+ 与 PostgreSQL；配置 base URL、数据库 URL 和认证密钥。使用社交登录时再配置 OAuth 凭据与回调。

### 03 设计业务数据模型

增加项目、笔记、订单等表与关联；生成并应用迁移。定义 ownerId / tenantId、数据约束和权限规则。

### 04 完成一个业务闭环

页面 → Query → 业务服务器函数 / API → 身份与权限校验 → Drizzle。实现创建、读取、更新、删除及缓存同步。

### 05 按需求接业务服务

收费接支付 / 权益；附件接对象存储；通知接邮件；AI 接模型 / 任务队列。接口、凭据和失败处理都需实际实现。

### 06 验证后部署与维护

测试注册登录、权限、数据变更和关键业务流程；验证构建、数据库连接与平台部署，再补日志监控及依赖升级策略。

## 八项扩展方向（待开发）

### 业务数据与记录闭环

新增业务 schema、服务器函数、Query 和页面；定义字段、约束、资源归属和变更后的缓存同步。

接入位置：src/routes/_auth/app/；建议新增 src/lib/research/

建议验收：不同用户只能访问自己的记录，创建—查看—修改—删除可恢复且错误可解释。

### 组织、角色与多租户

设计组织、成员、角色及 tenantId 授权；需要时使用认证生态插件，再写业务资源和操作权限。

接入位置：src/lib/auth/auth.ts、middleware.ts；建议新增 authorization/

建议验收：服务端验证跨租户访问、角色变更与会话撤销，页面显隐和真实接口行为一致。

### 支付、订阅与权益

接支付服务与 webhook；保存订单、订阅、权益和用量，设计重复事件处理、退款与对账。

接入位置：建议新增 src/lib/billing/ 与 src/routes/api/billing/

建议验收：伪造或重复事件不改变错误权益，付款状态和实际可用额度一致。

### 文件与内容管理

对象存储保存附件，数据库保存元数据与 ownerId；补上传限制、授权访问和删除策略。

接入位置：建议新增 src/lib/storage/ 与内容业务 schema

建议验收：上传、读取和删除遵守资源归属，失效文件与元数据能够清理。

### 邮件、通知与账户流程

按需接验证、重置和业务通知的邮件服务；设计发送、失败重试和通知偏好。verification 表不会自动提供投递。

接入位置：src/lib/auth/auth.ts；建议新增 src/lib/mail/

建议验收：真实邮件完成目标流程，过期或重复操作有明确处理，错误可回查。

### AI 调用与异步任务

服务器接模型、流式输出、解析和队列；区分即时响应与耗时任务，记录用量、状态和取消 / 重试。

接入位置：建议新增 src/lib/ai/、jobs/ 与 src/routes/api/ai/

建议验收：密钥不进入浏览器，耗时任务可追踪，重复执行和额度更新有规则。

### 检索、报表与业务后台

补索引、分页、搜索条件、统计与导出；数据量较大时按查询负载选择检索或分析服务。

接入位置：业务 schema / queries；建议新增后台路由与 reporting/

建议验收：按权限返回结果，空状态和分页稳定，统计口径和导出内容可核验。

### 运行治理与长期维护

接日志投递、错误监控、业务测试、迁移策略和依赖升级；验证平台、连接池与运行限制。

接入位置：nitro.config.ts、logger.server.ts、测试与部署配置

建议验收：部署后关键流程通过，故障可定位，升级和数据变更有可验证的回退方案。

## 采用判断与边界

### 是否只要改页面就能成为自己的产品？

页面只是适配的一部分。自己的产品还需要业务数据、服务器规则、输入校验、权限、外部服务和验收；模板承担基础接线。

### “模板库”和组件库有什么区别？

这里是可复制并继续开发的完整 starter 工程，包含前后端基础和配置；不是只安装几个 UI 组件就获得业务功能的单一组件包。

### 它有没有统一的业务插件接口？

固定源码中未发现 Cove 专用业务插件注册系统。所谓扩展接口主要是 createFileRoute、createServerFn、Query、schema、认证 plugins / provider 和部署配置；建议新增目录明确标记。

### 登录后是否自动保护所有数据接口？

不会。_auth.beforeLoad 决定页面导航；自己的服务器函数或 API 仍要显式验证身份、输入、资源归属与操作权限。freshAuthMiddleware 只跳过 Cookie 缓存。

### 能否把原 Cove 应用直接放 GitHub Pages？

SSR、认证、服务器函数与数据库操作需要服务器运行环境。GitHub Pages 发布的是我们这份静态研究网页；实际产品应配置兼容运行平台、数据库和凭据。

### 如何跟进上游更新？

先保留自己的业务差异和锁定版本，对照上游提交审查配置 / API / schema，再做迁移与关键流程测试。本研究固定 2026-10-09 基线，本轮发布不声称覆盖上游之后的全部变化。

## 源码职责

- src/routes/__root.tsx：根文档与全局 UI。HTML、头信息、主题、通知与 Devtools；接入日志错误处理。
- src/routes/index.tsx：公开首页。导向模板介绍页，可替换为业务首页。
- src/routes/_guest/route.tsx：访客布局。已有用户导航到 /app；其子路由为 /login 和 /signup。
- src/routes/_auth/route.tsx：登录布局。查询当前用户；未登录跳转 /login。下划线布局名称不进入 URL。
- src/routes/_auth/app/：登录后示例。/app 布局、用户展示、主题切换与退出；未来业务页面放在此处。
- src/routes/api/auth/$.ts：认证 API。/api/auth/* 的 GET / POST 请求交给 auth.handler。
- src/router.tsx：路由与查询组装。创建 QueryClient、Router 和 SSR Query 集成。
- src/routeTree.gen.ts：自动生成路由树。由路由工具生成；通过新增路由文件扩展，不手工维护树。
- src/lib/auth/：认证模块。服务器 / 客户端实例、服务器函数、查询、hooks 与中间件。
- src/lib/db/：数据库模块。postgres-js 客户端、Drizzle、schema 与 relations。
- src/components/：共用界面。ui/ 基础组件、主题、登录按钮、错误页和模板介绍。
- vite.config.ts：工具与构建。Vite+、Start、Nitro、React、Tailwind、Varlock、检查与测试配置。
- nitro.config.ts：服务器运行配置。evlog 模块、日志脱敏与请求上下文；应用特定策略按需补充。
- .env.schema：环境变量契约。公开 base URL、数据库 URL、认证密钥与可选 OAuth 凭据。
- drizzle.config.ts：迁移配置。schema 入口、迁移输出目录与 PostgreSQL 连接。
- docker-compose.yml：本地数据库。提供 PostgreSQL 服务；不是完整应用生产部署方案。
- playwright.config.ts：浏览器测试基础。构建并启动生产产物，运行轻量端到端示例。
- .agents/ 与 AGENTS.md：协作与测试约定。辅助开发者 / AI 代理工作；不属于线上业务运行链。

## 固定依赖

- React：19.3.0
- TanStack Start：1.168.60
- TanStack Router：1.170.41
- TanStack Query：5.104.1
- Better Auth：1.7.7
- Drizzle ORM / Kit：1.0.0-rc.4
- Nitro：3.0.260903-beta
- Tailwind CSS：4.3.3
- Base UI：1.8.0
- Varlock：1.21.1
- evlog：2.30.1
- TypeScript：7.0.2

## 来源

- [README.md](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/README.md)：项目定位、启动前提、工具入口、部署说明与许可。
- [package.json](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/package.json)：固定依赖版本、脚本和 Node.js / pnpm 约束。
- [src/router.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/router.tsx)：Router + Query + SSR 的集成关系与缓存配置。
- [src/routes/__root.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/__root.tsx)：根 HTML 文档、全局 UI 与调试工具。
- [src/routes/_auth/route.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/_auth/route.tsx)：受保护页面导航与服务器安全边界的明确区分。
- [src/routes/_guest/route.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/_guest/route.tsx)：访客布局与登录后跳转。
- [src/lib/auth/auth.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/auth.ts)：邮箱密码、OAuth、Drizzle 适配器及 Cookie 缓存。
- [src/lib/auth/functions.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/functions.ts)：$getUser、_getUser、请求头和 Set-Cookie 转发。
- [src/lib/auth/middleware.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/auth/middleware.ts)：普通与新鲜会话两种鉴权中间件。
- [src/routes/api/auth/$.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/api/auth/$.ts)：认证请求的 HTTP 分发入口。
- [src/lib/db/index.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/db/index.ts)：PostgreSQL 服务端连接与 Drizzle 初始化。
- [src/lib/db/schema/auth.schema.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/lib/db/schema/auth.schema.ts)：用户、会话、账户、验证记录的实际结构。
- [src/routes/_auth/app/index.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/routes/_auth/app/index.tsx)：当前应用页仅是登录用户展示示例。
- [src/components/sign-out-button.tsx](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/src/components/sign-out-button.tsx)：退出时同步查询缓存与路由。
- [vite.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/vite.config.ts)：全套构建插件与代码检查配置。
- [nitro.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/nitro.config.ts)：服务器日志模块和应用特定配置边界。
- [.env.schema](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/.env.schema)：环境变量与 OAuth 回调配置。
- [playwright.config.ts](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/playwright.config.ts)：测试基础与生产产物启动。
- [LICENSE](https://github.com/mugnavo/cove/blob/e7d40d524b6526d80c803fd092f6fa8bf2029f8e/LICENSE)：上游 Unlicense 原文。
- [TanStack Start 执行模型](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model)：解释服务器、浏览器和执行控制 API。
- [TanStack Start 服务器函数](https://github.com/TanStack/router/blob/main/docs/start/framework/react/guide/server-functions.md)：解释 createServerFn 与客户端 RPC 代理；官方文档会持续更新。
- [Better Auth 会话管理](https://better-auth.com/docs/concepts/session-management)：会话 Cookie 缓存及关闭缓存的取舍。
- [Drizzle 迁移](https://orm.drizzle.team/docs/migrations)：表结构变更与数据库迁移。
- [Nitro 部署](https://nitro.build/deploy)：平台适配与运行方式；使用时核对版本。

**页面与全栈执行 技术与边界**：React 19 · TanStack Start；模板不生成业务页面，普通组件与 loader 也不天然只在服务端执行。

**文件路由与导航 技术与边界**：TanStack Router；_auth 是路径隐藏的布局；它的 beforeLoad 控制导航，业务接口仍要鉴权。

**查询与状态同步 技术与边界**：TanStack Query；不是数据库，也不是实时协作系统；业务数据变更后的缓存失效需要自己实现。

**账号与登录会话 技术与边界**：Better Auth；模板未接通验证邮件、重置邮件、MFA、组织成员和角色权限。

**数据表与迁移 技术与边界**：Drizzle ORM · PostgreSQL；没有项目、笔记、订单等业务表；ORM 不会自动替你判断用户的数据访问权限。

**基础 UI 与主题 技术与边界**：Tailwind · shadcn/ui · Base UI；默认 /app 只演示当前用户；复杂表格、编辑器与业务看板需要构建。

**配置、日志与测试 技术与边界**：Varlock · evlog · Vitest / Playwright；日志平台投递器、业务监控、完整自动化流程及应用特定安全配置需要按需完善。

**构建与部署 技术与边界**：Vite+ · Nitro；部署 preset 不自动创建数据库或第三方应用；当前依赖有 RC / beta，需验证部署目标。
