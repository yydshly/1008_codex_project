# 场景与素材来源

本目录登记本子项目复用的真实素材。研究及 Git 素材复制固定于 Pascal 上游提交 `c5eaf51e161ba8653204d543666f5839d6020874`；npm 运行包统一固定 `1.0.3`。未入 Git 的目录配套材质另从官方静态域获取，按下文分别记录来源。

## 总结网页素材

`web/public/research/` 保存本项目 `assets/cover.jpg`、`edit-wall.jpg`、`place-item.jpg`、`official.jpg` 与 `pascal-summary.png` 的逐字节副本，供 `/overview/` 使用。前四张是本地原库运行截图；总结图由内置 imagegen 依据截图与研究生成，提示词保留于 `assets/pascal-summary.prompt.txt`。页面标明实际截图与 AI 信息图的区别，并标注用途分析。这些研究展示素材不属于下文原库 460 文件清单。

2026-10-12 发布整理继续使用原始 `pascal-summary.png`，未重绘或裁切；1536 × 1024，SHA-256：`a6106b78b83f0e65c3dea23bfdc96241a8efd3cf97349c8bd511f974e60a4cef`。索引、项目理解页、原图查看和下载采用同一文件。新版页面验收截图放在 `assets/publication/`；历史截图继续保留。全文 Markdown 与 JSON 是本项目研究内容的导出，不把源码说明当作未运行服务的验收。

## 上游来源

- 仓库：[pascalorg/editor](https://github.com/pascalorg/editor/tree/c5eaf51e161ba8653204d543666f5839d6020874)。
- 官方场景：[apps/editor/public/demos/demo_1.json](https://github.com/pascalorg/editor/blob/c5eaf51e161ba8653204d543666f5839d6020874/apps/editor/public/demos/demo_1.json)。原件保留在 `web/public/demos/upstream-demo_1.json`；可加载副本为 `web/public/demos/demo_1.json`。
- 家具与门窗真实 GLB、WebP 缩略图：[apps/editor/public/items](https://github.com/pascalorg/editor/tree/c5eaf51e161ba8653204d543666f5839d6020874/apps/editor/public/items)。只复制本地目录使用的 42 类素材，共 85 文件、500901 字节。路径、大小与 SHA-256 见 `web/public/demos/asset-manifest.json`。
- 可放置家具元数据：[packages/mcp/src/tools/asset-catalog.ts](https://github.com/pascalorg/editor/blob/c5eaf51e161ba8653204d543666f5839d6020874/packages/mcp/src/tools/asset-catalog.ts)。本地 `catalog.json` 采用该小型官方目录，并补入官方 demo 所需的资产。保留尺寸、偏移和原始分类，资源全部指向已复制的本地路径。

## 本地改动

- 官方 demo 移除 1 个指向浏览器本地 `asset://` 缓存的缺失 guide、7 个引用已不存在父墙的孤儿窗模型，以及不存在的子节点引用；补齐 Site → Building → Level 的父子关系。清理后的 58 个节点经真实 `core@1.0.3` 场景迁移，再用公开节点 schema 归一化，预先将两套旧版屋顶参数转换为两个显式 `roof-segment`；最终可加载文件共 60 节点，没有外部插件节点。保留原始文件以追溯迁移前的数据。
- `house.json` 是本子项目原创的 12 × 8 米示范户型；不是 Pascal Next 场景，也不宣称来自真实房屋测绘。包含客厅/厨房、过道、卧室、书房、卫生间，8 面墙、5 块显式房间地板、5 个门/通道、5 扇窗及 20 件官方家具，共 51 节点。标称 96 平方米指外轮廓尺寸，非净使用面积。默认无屋顶和显式天花板，便于观察和编辑室内布局。地板显式建模以适配 npm 1.0.3，不依赖当前 main 较新的房间派生机制。
- 两份场景已经保存 1.0.3 标准节点数据，避免原生 Editor 先做 schema 归一化时丢弃旧版 `material` 或屋顶字段。住宅墙面/地板颜色保存在顶层 6 项 `materials` 中，五块地板通过 `slots.surface` 引用；房间文字使用较深颜色以便在白底平面图上阅读。住宅外墙按四边围合方向设置正面为 `interior`、背面为 `exterior`（局部 +Z 指向户型内侧）；内部隔墙双面均为 `interior`，让原生 cutaway 模式能够展示室内，完整墙模式仍可查看门窗。
- 官方 GLB 与缩略图逐字节复制，未重新生成或修改网格。
- 不复制 Pascal Next 专有演示房屋，不依赖 Supabase 素材或任何在线 API；本地场景和目录引用均可离线解析。原生编辑器的其他默认资源/功能是否发起外网请求由 host 的配置控制。

## 许可与署名

上游代码声明采用根目录 [MIT LICENSE](https://github.com/pascalorg/editor/blob/c5eaf51e161ba8653204d543666f5839d6020874/LICENSE)，版权所有 © 2026 Pascal Group Inc.。所复制家具、图标及音效目录未发现单独覆盖许可，抽查 GLB 元数据仅包含导出器与 glTF 版本；以下完整保留仓库版权和许可声明。材质贴图的单独来源未逐项核实，本记录不将全部材质自动认定为 MIT，见“配套材质与解码器”。Next 视频素材另行使用 CC BY 4.0，本子项目没有复制这些视频。

```text
MIT License

Copyright (c) 2026 Pascal Group Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 编辑器界面资源

- 复用固定提交 `c5eaf51e161ba8653204d543666f5839d6020874` 的 `apps/editor/public/icons/` 中 39 个原生工具/场景树图标，以及 `apps/editor/public/audios/sfx/` 的 18 个原生操作音效；各文件已纳入同一 SHA-256 清单。
- 界面资源同样依上游根 MIT 许可复制，未修改。
- Viewer 当前 `SceneEnvironment` 使用程序生成环境贴图，因此本项目不需要也未复制 HDRI；原生音效和图标的绝对 URL 需要由 host 的部署子路径适配处理。

## 配套材质与解码器

- 以 npm `@pascal-app/core@1.0.3` 的公开 `MATERIAL_CATALOG` 为准，保留 114 项完整原生材质目录所引用的 249 个 `*_512.ktx2` 贴图和 65 个 WebP 缩略图，共 314 文件、16482292 字节。没有复制 1024/4096 等更大贴图。保留全部目录资源是为了覆盖原生材质选择器与 Viewer 的加载请求，不只覆盖默认场景当前用到的表面。
- 其中 79 文件逐字节取自固定提交的 [apps/editor/public/material](https://github.com/pascalorg/editor/tree/c5eaf51e161ba8653204d543666f5839d6020874/apps/editor/public/material)，其余 235 文件在该 Git 提交中不存在，于 2026-10-08 从官方 [`https://editor.pascal.app/material/`](https://editor.pascal.app) 对应静态资源路径缓存。本地 `asset-manifest.json` 对前者登记 `upstreamPath`，对后者逐文件登记 `sourceUrl`、`retrievedAt`、HTTP `ETag`/`Last-Modified`，全部登记字节数与 SHA-256。官方部署文件不宣称属于固定 Git 提交。
- 材质作为原生 `MATERIAL_CATALOG` 对应的配套素材复用，并保留上游仓库 MIT 声明；仓库可能含来源于其他材质库的资源，未逐项确认 Poly Haven、ambientCG 等单独来源和许可，不能据此声明所有贴图均采用 MIT。后续独立分发这些贴图前应补充逐项来源确认。
- 本地 `web/public/basis/` 的 `basis_transcoder.js`、`basis_transcoder.wasm` 和原始 README 来自固定 npm `three@0.186.0`，对应 [Three r186 Basis 目录](https://github.com/mrdoob/three.js/tree/r186/examples/jsm/libs/basis)。README 声明 Basis Universal 使用 [Apache License 2.0](https://github.com/BinomialLLC/basis_universal/blob/master/LICENSE)；完整许可及 Binomial LLC 版权声明保存在该目录的 `LICENSE`。这四个文件也纳入校验清单。Host 将解码器 URL 指向部署子路径下的 `/basis/`，无需使用 jsDelivr 解码器 CDN。
- 素材校验清单最终包含 460 文件、18843359 字节（约 18.84 MB）：85 家具文件、39 图标、18 音效、314 材质资源、4 Basis 文件。`npm run check:scenes` 模拟 Editor 的“先解析节点 schema、再加载场景和材质表”流程，验证节点数量和材质表保持一致、显式屋顶段、地板材质槽位；同时验证完整材质目录、512 分辨率、KTX2/WASM 文件头、本地引用和 SHA-256。
