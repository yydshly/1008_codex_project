# Unsloth 中文研究网页

原创静态研究网页，Node.js 22+，无第三方运行依赖。进入 web 目录后执行 npm ci、npm run build、npm run check、npm run preview。

默认预览为 http://127.0.0.1:4197/1008_codex_project/010-unsloth/；输出 web/dist，部署后 map.html 提供完整原图缩放阅读。所有资源为相对路径，构建为正文样式和脚本加内容哈希版本。

content.js 维护固定源码、26 项来源、训练方法、优化原理和场景；publication.mjs 维护十二项摘要、图前介绍、模块、模型、价值、复用、实践与扩展。index.template.html 组织十八章静态正文，app.js 增强面板、计算与导航，map.js 仅改变原图展示比例。

scripts/build.mjs 生成网页、来源、publication.json、understanding.md、verification.json 与研究下载，复制完整原图并校验哈希。scripts/audit.mjs 检查正文覆盖、索引数据一致、链接、原图字节与下载，统一发布对复制后的产物再次执行同一审计。

scripts/serve.mjs 仅提供本机 HTTP 预览，可指定 --dir、--port、--base。可选 src/verify-web.mjs 使用已有 Playwright 验证真实浏览器；PLAYWRIGHT_PACKAGE 指向安装目录，PREVIEW_URL 可覆盖地址，CAPTURE_ARTIFACTS=false 可在验证线上时避免修改截图和本地记录。

数学示意不预测 GPU 资源与速度；本站不连接模型服务。已有 2400 × 5091 PNG 完整复用，未重新绘制。scripts/render-overview.mjs 仅保留原始制作工具，本次发布无需运行。
