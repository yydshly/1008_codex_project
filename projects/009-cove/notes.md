# Cove 研究笔记

## 2026-10-12 · 完整理解与公开发布准备

在固定源码与既有高清图上补充14章完整理解，包括12项摘要、八组模块、六项价值、四条复用、八处真实入口、六步适配和八项待开发方向。publication.mjs 保存统一内容，sync-catalog.mjs 只同步009；README索引与站点总入口复用同一摘要和引导介绍。

用独立 Git 工作区从 origin/main 开始，只复制009并修改其发布接线，保留主工作区其他项目待提交内容。原有2700×6471 PNG不重绘、不裁切，构建和统一产物检查原始字节；新增缩放阅读、完整Markdown和JSON。

已执行独立 build / check 和根 check / 15项测试，均通过。接入已有Pages允许名单、触发条件、依赖安装与审计；原认证、数据库和业务后端不进入静态发布。原始源码临时checkout仍可读取，固定版本与执行关系沿用已核对证据；2026-10-12另核对TanStack服务器函数与Better Auth会话官方文档。

后续公开部署核验将记录工作流运行、真实HTTP与浏览器检查；正式demo须在实际入口和原图下载通过后登记。

本地完整聚合首次在既有003项目的Next.js构建处失败：独立D盘工作区复用F盘依赖，webpack误解析跨盘绝对入口。删除缓存链接的命令被策略阻止，未执行；改为复制003既有已验证静态产物，并用 --pack-only 聚合。其余独立研究和Three.js构建完成，统一目录校验通过，保留全部十个既有项目和Sandboard十六页。正式Pages工作流仍在Linux干净环境执行完整构建，不使用本地依赖链接或预构建替代。

浏览器实测通过14章、12项摘要、八组模块、35个图节点、四张SVG、320/390手机、两倍字号、接口锚点刷新、禁用脚本和图像50%/100%/滑杆/适合宽度及下载。PNG、可编辑图源与渲染记录的摘要一致；src/local-browser-checks.json保存本地证据。根15项测试和内容审计通过。

## 2026-10-09 · 固定源码与架构核对

目的：将此前对 Cove 的讨论整理为可阅读、可追溯的中文网页，重点梳理模板自己的架构，而不是绘制泛化的全栈示意图。

环境：Windows / PowerShell；研究网页使用 Node.js v22.15.0、npm 10.9.2，无第三方运行依赖。上游源码在临时目录只读研究，未安装或启动其应用。

基线：e7d40d524b6526d80c803fd092f6fa8bf2029f8e；2026-10-08 的 chore: upgrade deps。执行 git ls-remote 验证研究时 main 对应同一提交。逐文件读取并在 src/source-manifest.json 保存研究文件清单及 SHA-256。

核对内容：

- router.tsx 与根路由：QueryClient、Router、SSR Query 集成、错误页、主题和 Devtools。
- _guest 与 _auth：隐藏布局与 URL 映射、beforeLoad、登录后 /app、注册成功缓存处理与退出重验证。
- auth-client 与 /api/auth/$：浏览器认证请求交给服务端 auth.handler。
- auth/functions：$getUser → _getUser → getSession，读取请求头，转发 Set-Cookie，仅返回用户或 null。
- auth/middleware：普通和 fresh 会话中间件为可接入工具；并未自动覆盖所有业务接口。
- Drizzle / schema：认证四表与 PostgreSQL；没有业务数据模型。
- Vite+ / Nitro / Varlock / evlog：工具组织、服务器运行、环境契约和请求日志。

观察：Cove 是全栈起步模板；默认 /app 仅展示认证示例。实际登录流程与用户数据查询分别走认证 HTTP API 和服务器函数，不能画为所有请求都必经一个中间件的单一路径。

解释：模板价值集中在各库的连接处。客户端路由检查控制导航体验；服务器身份检查、角色授权、资源归属必须由业务路径负责。Query 数据缓存和 Better Auth Cookie 缓存是两层不同机制。

## 2026-10-09 · 网页实现

新增 projects/009-cove/，使用根 project:add 脚本分配 009；保留所有已有编号与项目记录。页面采用独立静态生成，不将 Cove 运行依赖混入根 package.json。

输入：原创中文研究数据、固定文件路径与依赖版本。

输出：七个研究章节；四张可点击架构图及 SVG 导出；模块对应源码；能力与边界；原理、场景、扩展和目录映射。

图例：实线为源码中的现有调用关系；全局图虚线为提供但需要显式挂载的鉴权中间件。建议新增的业务模块路径明确标记。

运行命令：

~~~powershell
cd projects/009-cove/web
npm.cmd ci
npm.cmd run build
npm.cmd run preview
~~~

预览路径：http://127.0.0.1:4209/1008_codex_project/009-cove/

## 2026-10-09 · 生产网页与交互验收

执行 npm.cmd ci 与 npm.cmd run build，生成 web/dist/；构建检查四张图、模块数据、唯一 HTML ID、ARIA 关联和相对资源引用。

使用环境自带 Playwright / Chromium 运行 scripts/verify-browser.mjs，针对真实生产网页执行：

- 直接访问完整子路径，确认七章、八类能力和六类场景正文。
- 切换四张图，点击全部 35 个模块，验证详情、选择状态和源码来源。
- 使用方向键、Home、End 切换图类型。
- 下载四张 SVG，核对固定 commit；验证样式、脚本、图标、项目说明、笔记、上游许可与来源清单。
- 校对网页中的源码路径与 36 个固定文件、目录登记；缺少尾斜杠时重定向，子路径外访问返回 404。
- 在 1440px 桌面和 390px 手机查看；图内部横向滚动后能点击右侧模块，正文无横向溢出。
- 页面整体 2 倍缩放后无全页横向溢出；来源说明可展开，浏览器脚本错误与资源 HTTP 错误均为 0。

结果：通过。记录保存在 assets/verification.json。桌面截图 assets/cover.png，交互架构面板截图 assets/architecture-desktop.png，手机截图 assets/mobile.png；图注明确为原创研究网页实景。

问题与修复：

- 首次使用 4197 端口时已有服务占用，启动失败。改为 4209；没有终止其他服务，重新验证新入口后提供链接。
- 加强缩放检查后，在极窄布局发现目录网格和长英文标识导致横向溢出。增加网格子元素 min-width: 0 和长词换行，重新通过实际 2 倍页面缩放检查。

源码校对脚本：node scripts/record-sources.mjs <固定上游 checkout 绝对路径>。校对版本必须等于研究 SHA；生成来源文件及 SHA-256，不把临时绝对路径写入记录。

浏览器验收脚本：node scripts/verify-browser.mjs <环境中的 playwright/index.mjs 绝对路径>。Playwright 仅作为验收工具，没有加入网页或根项目运行依赖。

根仓库结束检查：npm.cmd run index:build、npm.cmd run check。研究页独立构建与浏览器验收已完成；索引记录本地截图，demo 保持为空。

## 2026-10-09 · 完整单图总览

目的：将模板定位、基础能力、使用场景、业务适配、模块原理与扩展接口放入同一张图，保持信息完整且可放大阅读。

输入：此前固定源码研究、原创全局架构 SVG；新增 overview.js 的中文内容与排版。已有能力、需要配置的功能和建议开发的模块分别标明；“预留接口”落实到真实路径、框架 API 和适配工作，未把它描述为 Cove 自有的业务插件注册机制。

输出：assets/cove-overview.html 自包含图源、2700 × 6471 的 cove-overview.png，以及记录图源 / PNG 摘要和排版检查的 cove-overview-render.json。图源宽 1800px，Chromium 按 1.5 倍像素密度渲染；最终尺寸读取 PNG 头，避免逻辑高度乘倍率时产生非整数记录。

~~~powershell
cd projects/009-cove/web
npm.cmd run figure:source
node scripts/render-overview.mjs "<环境中的 playwright/index.mjs 绝对路径>"
npm.cmd run build
node scripts/verify-browser.mjs "<环境中的 playwright/index.mjs 绝对路径>"
~~~

图中包含六组已有基础、六类场景、四条调用说明、四个核心机制、八处扩展入口和六步适配；另附固定 README 的创建、环境校验、数据库迁移和启动命令，注明运行条件与来源。

观察与验证：图源图片完整加载、内容计数正确、无横向溢出、无文字裁剪、无浏览器脚本错误；检查全图及能力 / 场景、架构、接口和适配局部，中文与箭头没有重叠。已接入网页架构章节，高清查看、PNG 下载、独立图源和生成记录均能通过完整生产子路径访问；HTTP 返回的 HTML / PNG 摘要与记录相同。

网页验收再次通过全部 35 个模块、四图切换、源码、键盘与资源检查；390px 手机和页面 2 倍缩放无全页横向溢出。详情与新图验收记录保存在 assets/verification.json。构建校验总览源码和图片摘要，防止未来修改后混用旧图。

## 未验证内容

未启动 Cove 后端，没有真实 OAuth 凭据，未执行认证 / 数据库迁移或生产部署性能测试。本地环境满足研究网页的 Node.js ≥ 22 条件；原模板另要求 Node.js ≥ 24、pnpm ≥ 12 和 Vite+。

官方 TanStack 服务器函数网页在抓取时超时，使用其官方 GitHub 文档路径作为原理参考；模板实现仍以固定源码为准。
