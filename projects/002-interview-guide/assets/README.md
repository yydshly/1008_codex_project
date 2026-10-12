# 网页截图与内容总览图

下表截图均为 2026-10-08 增强版生产构建的真实 Chromium 截图，访问子路径 `/1008_codex_project/002-interview-guide/`。内容基于固定提交 `fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed`，中文讲解和界面由本项目独立实现，无上游图片素材。2026-10-12 的新增截图另列于下方；来源见 [`../src/README.md`](../src/README.md)。

| 文件 | 画面 | 视口与截图方式 | 实际图片尺寸 |
| --- | --- | --- | --- |
| [`cover.png`](cover.png) | 知识总览、9 个方向、209 资源及搜索筛选入口 | 桌面宽 1440 px，整页 | 1440 × 1889 |
| [`mobile.png`](mobile.png) | 手机知识总览与分类卡片 | 390 × 844，整页 | 390 × 3154 |
| [`mobile-detail.png`](mobile-detail.png) | 手机 `call / apply / bind` 详细讲解与阅读导航 | 390 × 844，视口 | 390 × 844 |
| [`engineering-detail.png`](engineering-detail.png) | SOLID 五原则的长讲解弹窗与阅读操作 | 1440 × 1080，视口 | 1440 × 1080 |
| [`coverage.png`](coverage.png) | 覆盖核对页统计与全部 50 主题清单 | 桌面宽 1440 px，整页 | 1440 × 3891 |

`cover.png`、`mobile.png`、`mobile-detail.png` 已更新为本轮增强版，另新增工程原则详情和覆盖清单。两个详情截图均在弹窗实际可见后截取；长截图高度属于页面完整内容，不是浏览器视口高度。

2026-10-08 的严格生产构建与 9 组 Chromium 检查通过，手机检查同时覆盖 320 px 和 390 px。截图提供实际画面证据，详细检查和边界见 [`../notes.md`](../notes.md)。后续功能或版本改变时应重新生成截图并更新此登记。

## 2026-10-12 · 理解总览的本地生产截图

| 文件 | 实际画面 | 来源与尺寸 |
| --- | --- | --- |
| [`publication-mobile.jpg`](publication-mobile.jpg) | 手机理解总览：完整内容图、查看 / 下载入口、知识地图标题和 50 / 9 / 209 统计 | CUA 实际浏览器，本地聚合生产子路径，390 × 844 px，视口截图 |

实际访问地址为 `http://localhost:4202/1008_codex_project/002-interview-guide/`。本轮完成默认理解页、知识索引、搜索、SOLID 深链与答法、覆盖清单及 320 / 390 px 手机菜单检查，控制台无 error / warn。图片属于本地生产截图，不能将它归为线上截图；本轮新增在线桌面截图另列如下。

## 2026-10-12 · 公开 HTTPS 桌面截图

| 文件 | 实际画面 | 来源与尺寸 |
| --- | --- | --- |
| [`publication-desktop.jpg`](publication-desktop.jpg) | 默认理解总览：侧栏导航、50 / 9 / 209 统计、完整内容图和知识 / 覆盖入口 | CUA 真实在线浏览器，[公开 HTTPS 地址](https://yydshly.github.io/1008_codex_project/002-interview-guide/)，1265 × 712 px，视口截图 |

尺寸从 JPEG 帧头实际读取，文件为 88,427 字节。在线浏览器已检查原图加载、9 模块、知识导航与搜索、SOLID 深链刷新和答法、覆盖清单；无横向溢出或控制台 error / warn。此桌面图来自公开站点；上面的 390 × 844 手机图仍是本地截图。

## 单图内容总览

[`repository-map.png`](repository-map.png) 是 2026-10-08 使用内置 image_gen 工具制作的中文信息图，尺寸 **1086 × 1448 px**；它是独立内容图，不是网页截图。

2026-10-12 发布准备核对原文件为 **1,917,984 字节**，项目源图、`web/assets/repository-map.png` 与 `web/dist/assets/repository-map.png` 副本一致。本轮网页加载按原比例完整展示，未裁切；此检查不改变图的生成日期、固定版本或内容口径。

同日线上 PNG 与原文件精确字节一致，SHA-256 为 `78e0ae5e5a5d09fc64dc9cef6f3e1c8a857ed91f28a4ed65b9e1180c5f2385b0`。逐文件 HTTP 记录见 [`../src/publication-verification.json`](../src/publication-verification.json) 的 `httpOnline`；初始发布源为 `7b7921ec9c4988fa0dc409f13a8b683be4b1793a`。

图中概括原库的面试复习、教程讲解与资源导航能力，将全部 50 篇原文按本地 9 个中文方向展示，注明 11 篇详细教程、39 篇导航及 209 个去重链接。底部单独标记本地新增的讲解、示例、误区、答法和检索功能，并说明练习、判题、算法动画与 AI 服务由外部平台提供。分类数量合计及主题名称已逐项核对；原库固定版本和许可见图底。

替代文字：编程面试指南能力与内容地图，按九类展示五十个主题，区分原库内容、本地中文增强和外部服务。

完整生成与最终定点修正提示词见 [`repository-map-prompt.txt`](repository-map-prompt.txt)。图中未使用上游图片素材；原库名称、内容统计与出处来自固定版本快照。
