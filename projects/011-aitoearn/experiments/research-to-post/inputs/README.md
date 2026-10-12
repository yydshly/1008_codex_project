# 011 · AiToEarn 内容营销能力与原理研究

中文网页完整整理 AiToEarn 的创作、发布、互动、分析和推广业务，回答它能做什么、如何实现、适合哪些场景，以及对当前 GitHub 项目研究集的价值。

- 上游：[yikart/AiToEarn](https://github.com/yikart/AiToEarn)
- 研究提交：[3581f511293236044e56fad67958cfcea0def6b5](https://github.com/yikart/AiToEarn/commit/3581f511293236044e56fad67958cfcea0def6b5)，提交时间2026-09-18，研究日期2026-10-09。
- 许可证：MIT，Copyright (c) 2025 AiToEarn。[保留原文](src/LICENSE.upstream.txt)。
- 覆盖：32项能力、13个技能、14个平台、6层原理、3个流程、6类场景、6项个人价值、10项边界；74份文档/代码与6张真实上游图片有SHA-256记录。
- 演示：本地网页，未发布外部站点。

## 主要结论

AiToEarn 的完整结构是 **Agent + Skills + 执行工具 + 内容营销后台**。Skills描述流程，Agent选择和编排，工具调用生成模型、Sharp、ffmpeg、云剪辑和业务API，后台管理素材、草稿、账号、排期、任务状态与指标。它面向个人媒体，也面向商家、品牌和代运营。

对本仓库最贴合的用途，是把已核对的研究、截图和录屏组织成可审阅的图文/视频草稿，再验证单渠道发布；另一项价值是研究技能、工具和异步任务工程。

页面区分源码实现、官方描述与待核验项。13个技能中11个找到对应工具，封面技能仍写旧接口，采集技能缺少当前Agent工具；部分插件互动仍开发中，发布有用户接续，指标多为可选。详见[完整研究](research.md)和[验证记录](notes.md)。

## 本地运行

原生 HTML/CSS/JavaScript，Node.js内置模块构建，无第三方依赖。需要Node.js20+，本次22.15.0。

```powershell
cd projects/011-aitoearn
node src/write-research.mjs
cd web
npm.cmd run build
npm.cmd run preview
```

打开[本地网页](http://127.0.0.1:4201/1008_codex_project/011-aitoearn/)。产物`web/dist/`，所有资源与下载均为相对路径，支持统一发布子目录。

交互包括能力搜索/分类/证据筛选、详情展开、平台筛选与完整规则、六层架构切换、三个七步流程、12组工具声明、图片放大、全文/来源下载、打印和手机目录。主体HTML在构建时生成，关闭JavaScript仍可阅读全文。

## 目录与来源

- `web/content.js`：原创结构化研究，逐项固定源码链接。
- `web/render.js`、`app.js`、`styles.css`：独立网页与交互。
- `web/scripts/`：无依赖构建与子路径预览。
- `src/fetch-references.mjs`：按固定SHA下载参考，不执行上游。
- `src/source-manifest.json`：来源路径、URL、字节数和SHA-256。
- `src/implementation-inventory.json`：14个平台完整限制、12组工具声明；静态提取脚本extract-inventory.mjs不执行上游。
- `src/write-research.mjs`：生成中文全文。
- `assets/`：六张作者图片、真实网页截图与署名。
- `upstream/`：ignored，本地74份参考资料。

原创范围为研究、网页、流程示例和构建工具，未修改或运行上游。图片/许可保留原作者署名。运行`node src/fetch-references.mjs`可重新获取相同版本；跟进新版本应显式改SHA并重新核验结论。

![本地研究网页首屏](assets/cover.jpg)

2026-10-09真实浏览器截图。已验证桌面/手机交互、锚点刷新与子路径资源，验证细节见notes.md。

验证的是研究网页和源码覆盖，没有授权社交账号或执行付费生成/真实发布，画质、效果与收入不属于本地实测。
