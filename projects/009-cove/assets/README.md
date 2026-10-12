# 图片与架构资料

- cove-overview.png：完整中文单图总览，2700 × 6471；模板定位、基础能力、六类场景、模块架构 / 原理、八处扩展入口和六步适配。
- cove-overview.html：总览图的自包含 HTML / CSS 图源，内嵌原创架构 SVG，可离线打开及重新渲染。
- cove-overview-render.json：图源与 PNG 的 SHA-256、真实像素尺寸、内容计数、文字裁剪与浏览器错误检查。
- architecture-system.svg：模板全局架构。
- architecture-login.svg：登录与会话。
- architecture-request.svg：页面与数据请求。
- architecture-build.svg：构建与部署。
- favicon.svg：本项目原创图标。
- cover.png / mobile.png：本研究网页生产构建后的实际浏览器截图，验证后保存。
- architecture-desktop.png：交互架构面板的桌面实景截图。
- verification.json：生产子路径、四图、35 个模块、键盘、手机和资源的验收记录。

四张 SVG 由 web/scripts/build.mjs 从原创架构数据生成，依据上游 e7d40d524b6526d80c803fd092f6fa8bf2029f8e 源码，模块含源码链接。图不是上游作者提供，也不代表已运行其后端。

完整总览由 web/overview.js 排版，web/scripts/create-overview.mjs 输出图源，web/scripts/render-overview.mjs 使用 Chromium 生成高清 PNG。代码排版保证中文、源码路径和 API 名称准确；不是上游作者配图。场景与业务扩展为研究建议，真实模块和建议新增路径均已标明。
