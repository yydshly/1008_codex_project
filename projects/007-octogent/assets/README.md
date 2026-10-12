# 素材来源

研究基线：`07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254`；上游作者 / 仓库：**hesamsheikh/octogent**；许可为 MIT，原文在 `../src/LICENSE.upstream`。

## 上游真实素材

以下文件原样复制，没有裁剪、重绘或文字替换。会话、使用量和时间属于作者环境，不代表本项目的性能实测。

| 本地文件 | 上游路径 | 内容 |
| --- | --- | --- |
| `preview_1.jpg` | `static/images/preview_1.jpg` | 代理关系画布 |
| `preview_2.jpg` | `static/images/preview_2.jpg` | 并排的 Claude Code 终端 |
| `preview_3.jpg` | `static/images/preview_3.jpg` | Tentacle / Todo 工作台 |
| `preview_4.jpg` | `static/images/preview_4.jpg` | 用量与 GitHub 活动 |
| `preview_5.jpg` | `static/images/preview_5.jpg` | 编辑频率与共同修改 |
| `preview_6.jpg` | `static/images/preview_6.jpg` | 会话记录与导出 |
| `octopus-favicon.svg` | `apps/web/public/octopus-favicon.svg` | 原应用 favicon |

[固定版本截图目录](https://github.com/hesamsheikh/octogent/tree/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/static/images) · [favicon 原文件](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/apps/web/public/octopus-favicon.svg) · [MIT 原文](https://github.com/hesamsheikh/octogent/blob/07cfc4e3c7c3f9ee1fb9ceab2c89fe8715ad4254/LICENSE)

## 本研究网页截图

- `cover.jpg`：2026-10-09 本地研究页首屏；其中的终端画面为上游截图。
- `workflow.jpg`：原创流程示例的处理阻塞阶段，使用预设消息和记录。
- `mobile.jpg`：手机宽度下的研究页，用于响应式验证。

这些是本研究网页的真实浏览器画面，不能解释为原 Octogent 的本地运行实测。

## 原创全景图

- `octogent-understanding-map.png`：一张高清长图，整理能力、底层原理、主要使用设想、业务与工程价值、个人 Agent 库扩展方向及实现边界。
- `octogent-understanding-map.svg`：同一张图的矢量源文件，六张原图以 data URI 嵌入，可独立打开；中文使用微软雅黑或中文回退字体。
- `octogent-understanding-map-preview.jpg`：完整长图的缩小预览，研究首页只显示顶部局部。
- `octogent-understanding-map-content.md`：全景图文字版，方便阅读与检索。
- `octogent-understanding-map-layout.json`：画布尺寸与六章坐标，用于阅读页跳转。

制图脚本在 `../src/render_understanding_map.py`。中文内容与图形布局为本研究原创；截图仍属于上游作者，按原比例缩放嵌入，没有改写截图内容。紫色内容是扩展建议，不能当作原库现成功能。图中未宣称原应用已完成本地复现或已验证提速、成本收益。

`map-reader-desktop.jpg`、`map-reader-mobile.jpg` 是 2026-10-09 全景图阅读页的真实浏览器截图，分别记录桌面价值章节与手机缩放阅读验证；截图中的全景图属于本研究内容。

## 2026-10-12 发布核验画面

`publication/local-modules.jpg`、`publication/local-mobile.jpg` 来自完整静态研究页的本地生产子路径，分别记录系统模块正文与手机检查。属于本研究浏览器画面，不能当作原 Octogent 运行结果。现有全景图继续保留 SHA-256 `a630623ede3b9582791f3965eaeb70023a2cb579fb4e781138c5f378e63bc242`，不重绘或裁切。

`publication/public-cover.jpg`、`public-modules.jpg`、`public-map.jpg`、`public-mobile.jpg` 是首次成功部署后，在正式 GitHub Pages 地址拍摄的真实浏览器截图。分别展示网页入口、系统模块、已有全景图阅读和手机布局，不是原库的本地运行截图。
