# 来源与研究资料

本目录用于保存 Pascal 固定版本的来源、许可和研究资料。可运行宿主源码与独立依赖位于 [web/](../web/README.md)。

| 项目 | 来源 |
| --- | --- |
| 原仓库 | [pascalorg/editor](https://github.com/pascalorg/editor) |
| 素材与源码研究基线 | [`c5eaf51e161ba8653204d543666f5839d6020874`](https://github.com/pascalorg/editor/tree/c5eaf51e161ba8653204d543666f5839d6020874) |
| 研究日期 | 2026-10-08 |
| 运行组件 | `@pascal-app/core`、`viewer`、`editor`、`nodes`，均为 `1.0.3` |
| 上游许可 | [MIT 完整原文](LICENSE.upstream)，`Copyright (c) 2026 Pascal Group Inc.`；[上游文件](https://github.com/pascalorg/editor/blob/c5eaf51e161ba8653204d543666f5839d6020874/LICENSE) |

研究基线用于固定阅读对象与素材出处；npm 发布包版本用于固定实际演示依赖。二者分别记录，尚未做逐文件一致性核对。

## 引入资料的约定

- 官方 `demo_1` 场景和对应资源从固定基线引入，原始 JSON 与清理/预迁移后的可加载 JSON 分别保留。可加载版为 60 节点，已显式保存两个 `roof-segment`，适配 Editor 先解析 schema 的顺序；具体来源、清理及 SHA-256 清单入口见 [assets/SOURCES.md](../assets/SOURCES.md)。
- `house.json` 住宅样板为本项目制作的 51 节点场景数据，复用 Pascal 构件与官方家具模型，默认作为展示起点；颜色使用 6 项顶层材质和规范槽位引用，墙正反面标记内外属性以支持 cutaway。
- 材质资源以 npm `core@1.0.3` 的实际目录为准：314 文件中 79 来自固定 Commit，235 从官方站点缓存；分别记录来源 URL 和 SHA-256，清单见 [assets/SOURCES.md](../assets/SOURCES.md)。材质独立来源与许可未逐项核实，不自动归为 MIT。
- 本地 Basis JS / WASM 解码器来自本项目锁定的 Three.js `0.186.0`，附带说明与 [Apache 2.0 许可证](../web/public/basis/LICENSE) 一起保留，安装后将加载入口适配为同源子路径。
- 本地资源为演示复制或适配副本，相关路径改动由宿主处理；不把素材重新标记为本仓库原创。
- 引入上游源码或文档时保留 MIT 许可原文；单独许可的模型或素材继续适用各自条件。
- Web 公共目录保留 [LICENSE.upstream.txt](../web/public/LICENSE.upstream.txt)，随静态产物导出。
- 本地效果截图放在 [assets/](../assets/)：`cover.jpg` 为住宅 2D / 3D 分屏，`official.jpg` 为官方示例屋顶展开，`edit-wall.jpg` 为原生墙厚编辑，`place-item.jpg` 为实际新增沙发，`mobile.jpg` 为 390 × 844 窄屏；具体版本、日期与验收边界见 [项目概览](../README.md) 和 [研究笔记](../notes.md)。

新增中文研究说明、Next.js 宿主、工具/家具面板、原创住宅、草稿存储和静态资源适配在 [项目概览](../README.md) 与 [研究笔记](../notes.md) 记录。`globals.css`、`elevation.css` 参考上游 MIT 样式；`scripts/prepare-assets.mjs` 在安装后为固定包的图标/音效字面量、材质缩略图/绘制预览与 KTX2 解码器入口添加子路径，不修改几何或渲染算法。当前没有复制整个上游 monorepo，也没有把官方 Pascal Next 媒体作为本地效果证据。

`web/app/overview/` 是本次新增的中文理解网页，独立汇总能力、原理、用途、开发价值与验证边界；`web/public/research/` 是真实截图和 AI 总结图的展示副本，原素材与说明保留在 `assets/`。理解页未导入 3D 编辑器，原编辑器增加返回总结页的链接，未修改上游建模或渲染逻辑。

后续独立几何、AI 或 IFC 实验可继续放在本目录或另建 `experiments/`，记录自己的改动、输入和实际验证结果，保持与固定展示基线的关系明确。

当前生产构建、完整场景/素材校验与记录中的浏览器编辑、保存、家具放置、示例展开已经完成。完整工具、导出、跨浏览器和 MCP / AI 属于后续验证范围，不把已有截图当作这些流程的证据。
