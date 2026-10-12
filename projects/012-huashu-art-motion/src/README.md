# 来源与实验代码

本次完整整理与发布：`update-publication.mjs` 从网页同源内容同步根索引、项目研究文档与归属 012 的部署记录；`verify-publication.mjs` 可核验本地或公开子路径，检查原图、静态资源、真实浏览器流程和视频加载。公开核验通过后才登记 `demo`；记录保存为 `publication-verification.json`、`public-http-checks.json` 与 `public-browser-checks.json`。旧验证结果按原始研究日期保留。

~~~powershell
node src/verify-publication.mjs --base https://yydshly.github.io/1008_codex_project/012-huashu-art-motion/ --run <实际部署运行ID> --commit <实际部署提交>
node src/update-publication.mjs
~~~

浏览器复核需要本机 Playwright，可用环境变量 `PLAYWRIGHT_MODULE` 指定模块位置；这些工具不是网页的运行依赖。`.gitattributes` 保持固定上游副本的原始字节，避免跨系统换行影响来源哈希。

上游：https://github.com/alchaincyf/huashu-art-motion

固定提交：`57d67608ab458f57d9b153b1a2831b921e22498b`。

- upstream-engine/：未修改的上游Canvas引擎、库、35场景、字体与转场。
- references/：上游MIT风格卡与方法文档；文件SHA见source-manifest.json。
- LICENSE.upstream.txt：原始MIT许可；字体许可在引擎lib/fonts/中。
- write-research.mjs：原创来源核对与中文文档生成。
- render-and-verify.mjs：原创Playwright集成运行与35静帧生成。
- verify-browser.mjs：原创生产页面集成验证。

验证脚本可通过PLAYWRIGHT_MODULE使用自己的Playwright安装；本机使用工作区依赖包，未作为网页构建依赖。upstream/完整参考克隆被根.gitignore忽略，网页仅依赖已保存的固定快照。

## 作品版制作

prepare-production.py只读取图片清单与脚底锚点；render-production.mjs真实逐帧编码七片并探测视频音轨；verify-production.mjs验证实际视频和探索；update-production.mjs仅在成功后登记012元数据。新版代码在../web/scenarios/production-*；旧代码原型另保存在../experiments/scenario-v1/。

<!-- UNDERSTANDING:START -->
## 理解总览制作与验证

- render-understanding.mjs：从overview/poster.html导出完整PNG，检查原图加载与来源文件，记录SHA。
- verify-understanding.mjs：验证真实阅读、缩放、PNG下载、手机、无脚本和风格深链接。
- update-understanding.mjs：仅在验证通过后更新012登记、资料与总览来源说明。

总览内容在../web/understanding.mjs，图版/网页共用../web/overview/render.mjs。复现截图需要Playwright；网页自身无第三方依赖。
<!-- UNDERSTANDING:END -->
