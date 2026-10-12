# 真实截图与素材

本目录包含总结信息图和真实截图。截图均于 2026-10-08 从本地静态生产入口截取，运行固定 Pascal npm `1.0.3` 原库组件。总结信息图由内置 imagegen 生成，参考真实截图与研究记录；官方 Next 宣传画面未用于替代复现结果。

| 文件 | 内容 |
| --- | --- |
| [pascal-summary.png](pascal-summary.png) | 1536 × 1024，AI 生成的信息图：效果与能力、底层原理、使用场景、产品价值；参考真实 cover 截图与固定版本研究，使用场景为用途分析。生成方式为内置 imagegen，完整提示词见 [pascal-summary.prompt.txt](pascal-summary.prompt.txt) |
| [cover.jpg](cover.jpg) | 1280 × 720，住宅平面图与真实 3D 分屏，作为实际效果证据；索引引导图使用完整 `pascal-summary.png` |
| [edit-wall.jpg](edit-wall.jpg) | 1280 × 720，原生墙体 Inspector 与墙厚修改 |
| [place-item.jpg](place-item.jpg) | 1280 × 720，通过原生放置工具新增 Sofa 后的立体选取状态 |
| [official.jpg](official.jpg) | 1280 × 720，上游多层示例，显式屋顶与楼层展开 |
| [mobile.jpg](mobile.jpg) | 390 × 844，手机宽度下的住宅查看与底部面板布局 |
| [overview.jpg](overview.jpg) | 1280 × 720，中文项目理解页首屏，包含真实截图画廊与编辑器入口 |
| [overview-principles.jpg](overview-principles.jpg) | 1280 × 720，五步参数更新流程与独立 2D 数据分支，当前选择 3D 渲染说明 |
| [overview-mobile.jpg](overview-mobile.jpg) | 390 × 844，项目理解页窄屏首屏，导航、正文及真实截图可访问 |
| [publication/overview-extensions.jpg](publication/overview-extensions.jpg) | 2026-10-12，本地生产理解页的八个扩展方向，逐项说明基础、建设内容与验收方法 |
| [publication/overview-mobile.jpg](publication/overview-mobile.jpg) | 2026-10-12，390 × 844 完整理解页首屏，使用原始引导图；另检查 320 px 无横向溢出 |

2026-10-12 发布整理沿用原始 1536 × 1024 PNG，SHA-256 为 `a6106b78b83f0e65c3dea23bfdc96241a8efd3cf97349c8bd511f974e60a4cef`，没有重绘或裁切。上述旧 `overview*.jpg` 保留为 10 月 8 日历史版本证据，新版截图放在 `publication/`。

家具、纹理、图标、音效和解码器位于 `web/public/`，具体来源、固定版本、兼容处理与许可边界见 [SOURCES.md](SOURCES.md)。
