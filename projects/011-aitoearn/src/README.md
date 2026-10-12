# 研究辅助脚本

`fetch-references.mjs`使用Node内置fetch按固定提交下载资料/图片，保留MIT和SHA-256清单。源文件在ignored upstream/，不执行上游。运行`node src/fetch-references.mjs`。

`write-research.mjs`从原创web/content.js生成完整中文研究，运行`node src/write-research.mjs`。

研究/网页/脚本为原创；许可证与作者图片保留上游署名。

`extract-inventory.mjs`静态解析固定参考文本中的平台限制、工具名枚举和控制器声明，输出implementation-inventory.json。它不执行上游TypeScript；工具声明是否可调用要进一步看运行时注册。
