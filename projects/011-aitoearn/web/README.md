# 中文研究网页

无第三方依赖。Node.js20+运行`npm.cmd run build`、`npm.cmd run preview`，访问http://127.0.0.1:4201/1008_codex_project/011-aitoearn/。

构建生成全文HTML，复制作者图片、研究文档、来源清单与MIT到dist。所有资源相对引用，支持子路径；未来可复制到_site/011-aitoearn/，当前未外部部署。

正文content.js，渲染render.js，交互app.js。内容变更先在子项目目录运行`node src/write-research.mjs`再构建。中文内容固定到记录SHA。

平台限制与工具声明来源src/implementation-inventory.json，跟进源码时先运行src/extract-inventory.mjs更新。构建过程验证源码版本、清单数量、引用与上游图片哈希。
