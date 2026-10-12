# 003 · Pascal 3D 建筑编辑器：研究笔记

[项目概览](README.md) · [原仓库](https://github.com/pascalorg/editor) · [Web 说明](web/README.md)

## 2026-10-08 · 研究对象与范围

目的：新建独立子项目，在本地体验 Pascal 的真实建筑编辑器，同时理解参数化场景与实时几何更新的关系。

| 项目 | 记录 |
| --- | --- |
| 上游源码基线 | `c5eaf51e161ba8653204d543666f5839d6020874` |
| npm 组件 | `@pascal-app/core@1.0.3`、`@pascal-app/viewer@1.0.3`、`@pascal-app/editor@1.0.3`、`@pascal-app/nodes@1.0.3` |
| 输入场景 | 原创 `house.json` 住宅样板（默认）与固定基线的官方 `demo_1`（可切换），资源均保存到本地 |
| 宿主方案 | 独立 Next.js 应用，静态输出 `web/out/` |
| 实际运行环境 | Windows、Node.js `22.15.0`、npm `10.9.2`、Chromium 浏览器 |
| 本地入口 | `http://127.0.0.1:4187/1008_codex_project/003-pascal-editor/` |
| 许可 | MIT，`Copyright (c) 2026 Pascal Group Inc.` |

当前宿主依赖固定 Next.js `16.3.0`、React `19.2.4`、Three.js `0.186.0`、React Three Fiber `9.5.0`、Drei `10.7.7`、TypeScript `6.0.3`。完整依赖以 `web/package-lock.json` 为准。

源码研究基线与 npm 包版本分别记录。没有逐文件比较发布包与 Commit，不声称它们是完全相同的源码快照。

## 阅读记录

| 日期 | 阅读来源 | 已确认信息 |
| --- | --- | --- |
| 2026-10-08 | 固定 Commit 的 [README](https://github.com/pascalorg/editor/blob/c5eaf51e161ba8653204d543666f5839d6020874/README.md) | 仓库包含独立应用与可复用 core、viewer、editor、nodes 等包；提供浏览器编辑、CLI 和 MCP 接入路线 |
| 2026-10-08 | 固定 Commit 的 [LICENSE](https://github.com/pascalorg/editor/blob/c5eaf51e161ba8653204d543666f5839d6020874/LICENSE) | 采用 MIT，版权主体为 Pascal Group Inc. |
| 2026-10-08 | README 的 Pascal Next 说明 | 托管 Next 预览是下一代方向展示，其完整体验尚未进入开源编辑器发行 |

架构说明取自上述固定基线，具体本地功能需要以下浏览器验收确认。

## 架构与数据流

| 层次 | 作用 | 固定基线入口 |
| --- | --- | --- |
| `core` | 节点模式、场景状态、空间查询、对象注册与事件 | `packages/core/src/schema/`、`packages/core/src/store/use-scene.ts` |
| `viewer` | Three.js / React Three Fiber 渲染、相机、查看系统 | `packages/viewer/` |
| `editor` | 选择、直接操作、建筑工具与属性面板 | `packages/editor/` |
| `nodes` | 内置构件插件、渲染器和几何系统 | `packages/nodes/` |
| 本地宿主 | 装载插件与场景、中文说明、本地资源适配 | 本项目 `web/` |

本地宿主的具体入口：

- `web/app/showroom.tsx`：注册内置插件，默认住宅与官方示例切换，稳定的场景装载/保存回调，按示例分别保存 `localStorage` 草稿，以及还原示例。
- `web/app/editor-panels.tsx`：中文建造工具入口、原生工具参数面板、本地家具搜索与类别筛选，以及 3D / 平面图 / 分屏和楼层查看控制；居中通过原生 `fit-scene` 事件按当前楼层 XZ 范围调整。
- `web/scripts/prepare-assets.mjs`：安装后的路径修补；用 TypeScript AST 为固定 `1.0.3` 包内域根图标/音效增加宿主子路径，另对原生材质缩略图、绘制工具预览和 KTX2 解码入口做固定片段适配。解码入口为当前站点 `<basePath>/basis/`。脚本校验版本与预期片段，重复执行可识别已处理内容，便于 `npm ci` 后重现；保留上游几何与渲染逻辑。
- `web/app/globals.css`、`web/app/elevation.css`：参考固定上游的 MIT 样式，供独立宿主使用。

资源原路径、复制文件、官方场景清理和校验清单见 [assets/SOURCES.md](assets/SOURCES.md)。原始官方 JSON 与可加载副本分别保留；本项目住宅样板是独立场景数据，没有复制 Pascal Next 的完整住宅。

数据流为：用户输入 → 编辑工具 → `useScene` 新增或修改节点 → 标记受影响节点为 dirty → 渲染器建立对象并注册 ID → 几何系统在帧循环中重建受影响构件 → 更新画面。

节点按 ID 放入平面字典，用父子关系组成建筑层级。参数化节点保留可编辑含义，几何系统负责把参数转换为网格。墙交接通过轮廓计算处理，门窗开洞使用 CSG 布尔减法；家具根据所属墙、楼板或天花板定位。

这套原理能解释尺寸编辑为何可以继续更新画面。完整建筑工程校验、完整 IFC 兼容与摄影级渲染不属于本次结论；本项目验收只覆盖实际运行的展示操作。

## 复现命令

从仓库根目录进入子项目：

```powershell
cd projects/003-pascal-editor/web
npm.cmd ci
npm.cmd run dev
```

生产预览：

```powershell
npm.cmd run typecheck
npm.cmd run check:scenes
npm.cmd run build
npm.cmd run preview
```

根索引与结构校验：

```powershell
cd ../../..
npm.cmd run check
```

安装与构建在 `web/` 执行，避免把 Pascal 与 Next.js 的依赖加入根索引工具。

## 2026-10-08 · 初次安装的网络中断

首次 npm 安装在末尾下载 `pdfkit` 时遇到 `ECONNRESET`。缓存重试后已完成安装，并继续通过 TypeScript 检查与生产构建。网络中断来自依赖下载，没有通过忽略类型错误来完成构建。

## 2026-10-08 · 构建与首次画面

`npm.cmd run typecheck` 与 Next.js `16.3.0` 的 `npm.cmd run build`（webpack）已通过，生成静态 `out/`。webpack 输出上游两处 `import.meta` 检测 DEV 的非阻塞警告，构建成功；未配置忽略 TypeScript 错误。

最新 `npm.cmd run check:scenes` 已通过完整校验：住宅 51 节点和 6 项顶层材质、官方示例 60 节点与两个显式屋顶段，通过公开 schema、父子层级、材质槽位与本地资源检查。脚本模拟真实 Editor 的「先 `AnyNode.parse`、再 `setScene` 与材质表」顺序，确认不会在加载时补节点或丢材质。42 类家具和完整 114 项材质的引用均可解析；460 个资源的大小与 SHA-256 一致，KTX2 / WASM 文件头、KTX2 不超过 512 的尺寸，以及 GLB 内部无外部资源依赖均通过检查。最新 Next.js webpack 生产构建也已完成，退出码为 0。

浏览器已实际打开住宅 3D 并切换分屏，新版场景显示彩色地板，cutaway 正常展示室内。点击住宅西墙后打开 Pascal 原生 Inspector，把墙厚 `0.200` 米改为 `0.300` 米；`Ctrl + Z` 还原 `0.200` 米，`Ctrl + Shift + Z` 重做为 `0.300` 米。顶栏显示自动保存，证据见 [edit-wall.jpg](assets/edit-wall.jpg)。

保存/恢复实测：将原生楼层高度从 `2.8` 米改为 `3.5` 米，自动保存后刷新仍显示 `3.5` 米；点击还原示例后恢复 `2.8` 米。家具面板显示 42 类资源，输入 `sofa` 仅返回 `Sofa`。浏览器控制台错误为空，保留上游 BVH `maxLeafSize` 与 `uv2` 非阻塞警告。

家具新增实测：普通点击因原生碰撞检查被拒绝；重新选择 `Sofa`，按原生 `Alt Force place` 提示执行 `Alt + 单击` 后放置成功，场景 `item` 从 20 个变为 21 个。新增节点 `item_k5jzr1tra3ka2krb` 出现在渲染 DOM 的 `data-node-id`，按 `Esc` 退出放置后仍显示新沙发并能打开原生 Inspector，证据见 [place-item.jpg](assets/place-item.jpg)。测试结束后已还原初始住宅样板，不将强制放置解释为无约束或通过工程碰撞验证。

官方示例切换与楼层展开已实测：载入 `demo_1` 后选择 `exploded`，上层屋顶真实升起，证据见 [official.jpg](assets/official.jpg)。最终住宅 2D / 3D 分屏见 [cover.jpg](assets/cover.jpg)，图片均为 `1280 × 720` 的生产页面真实截图。

窄屏使用 `390 × 844` 视口检查，document 视口宽度与 bodyWidth 均为 390，没有横向溢出，建造底部面板可打开。截图见 [mobile.jpg](assets/mobile.jpg)。这是浏览器窄屏布局检查，不等于真实手机设备或所有手机工具的完整验收。

## 2026-10-08 · 场景装载顺序兼容

初版依靠 `core.setScene` 迁移旧屋顶与材质字段，但实际 Editor 会先对每个节点做 `AnyNode.parse`，导致旧版 `material` 和屋顶参数提前丢失。仅测试直接 `setScene` 无法发现这个差异。

修复采用预迁移：清理后的官方 58 节点先经真实 `core@1.0.3` 迁移并按公开 schema 归一化，保存为 60 节点，包含两个显式 `roof-segment`，运行时不再依赖增加这些节点。住宅保存 6 项顶层 `materials`，五块楼板用 `slots.surface` 引用；外墙 `front=interior`、`back=exterior`，内墙双面为 `interior`，让 cutaway 正常隐藏遮挡墙。新版检查按真实 Editor 顺序执行，并检查节点/材质数量保持不变；浏览器也已确认地板颜色与室内显示。

## 2026-10-08 · 材质与 KTX2 解码补齐

npm `@pascal-app/core@1.0.3` 的目录包含 114 项材质，启动会引用 249 个 512 分辨率 KTX2 纹理与 65 个缩略图，共 314 个唯一文件、16,482,292 字节。固定 Git 基线提供其中 79 个文件，其余 235 个从官方 `editor.pascal.app` 静态路径缓存；来源 URL、获取时间、ETag / Last-Modified、大小与 SHA-256 由 [素材清单](assets/SOURCES.md) 和 [asset-manifest.json](web/public/demos/asset-manifest.json) 记录。官方部署文件没有被认定为固定 Git Commit 的内容。

KTX2 使用本项目 Three.js `0.186.0` 附带的 `basis_transcoder.js` 与 `basis_transcoder.wasm`，在本地 `basis/` 提供。安装脚本将默认 CDN 解码入口改为 `NEXT_PUBLIC_BASE_PATH + '/basis/'`，从同源子路径加载；原始 README 与 Apache 2.0 许可随资源保留。全部 manifest 共 460 文件、18,843,359 字节（约 18.84 MB）。

材质贴图的独立来源和许可未逐项核实，不能因仓库 MIT 声明自动将所有贴图归为 MIT；来源边界在素材清单单独说明。原生 `fit-scene` 的目标 Y 固定为 0，宿主的楼层范围适配主要覆盖 XZ 居中，二楼镜头高度仍受此上游限制。

## 本轮验收记录

| 检查 | 输入 / 方法 | 当前记录 |
| --- | --- | --- |
| 依赖安装 | 初次安装后缓存重试 | 安装已完成；清洁 `npm ci` 尚未另作验收 |
| 类型检查 | `npm.cmd run typecheck` | 通过 |
| 场景与素材校验 | `npm.cmd run check:scenes` | 住宅/官方场景、42 类家具、114 项材质、460 文件完整校验通过 |
| 独立生产构建 | `npm.cmd run build` | Next.js 16.3.0 webpack 构建通过，保留两处非阻塞上游 DEV 检测警告 |
| 子路径与刷新 | 访问生产项目子路径并刷新 | 已运行；楼层高度刷新保留 |
| 住宅场景载入 | 观察墙、门窗、家具、地板与 cutaway | 实际显示通过 |
| 官方场景与楼层展开 | 切换 `demo_1`、选择 `exploded` | 屋顶升起通过 |
| 2D / 3D | 切换显示 | 住宅 3D 与分屏实际运行通过 |
| 构件编辑与历史 | 原生墙厚 `0.200 → 0.300` 米，撤销/重做 | 通过 |
| 示例恢复 | 修改楼层高度后还原 | `3.5 → 2.8` 米通过 |
| 草稿保存 | 自动保存后刷新 | 楼层高度 `3.5` 米保留通过；两示例完整隔离未另作专项验收 |
| 本地家具与放置 | 42 类目录、搜索 `sofa`、原生碰撞检查与强制放置 | 唯一返回 `Sofa`；普通点击碰撞拒绝、`Alt + 单击` 新增成功，item `20 → 21` |
| 控制台 | 检查浏览器日志 | 错误为空；有上游 BVH / uv2 非阻塞警告 |
| 窄屏布局 | `390 × 844` 视口与底部建造面板 | bodyWidth 为 390，无横向溢出；面板可打开 |
| 本地真实截图 | 分屏、官方展开、墙体编辑、家具新增、窄屏 | `cover.jpg`、`official.jpg`、`edit-wall.jpg`、`place-item.jpg`、`mobile.jpg` 均已保存并检查 |
| 根索引与仓库校验 | `npm.cmd run index:build`、`npm.cmd run check` | 退出码均为 0 |
| 差异格式 | `git diff --check` | 退出码为 0 |

本表只声明实际检查过的行为。没有逐项验收全部建造工具、全部导出格式、真实触摸设备或 MCP / AI 流程。

## 改动范围与边界

本次新增展示宿主、中文工具与视图入口、本地家具面板、原创住宅场景、官方示例清理、按示例保存草稿、本地资源适配、子路径构建及研究文档。编辑器工具、场景数据结构和几何算法复用锁定的 Pascal npm 包；安装后为图标/音效路径和 KTX2 解码器入口做可重现的路径修补。

宿主草稿存储键为 `pascal-study-003:scene:<house|demo_1>:v1`，保存范围是当前浏览器的当前站点来源，清理浏览器数据会删除草稿。本地静态宿主不启动官方 CLI 的 SQLite / MCP 服务，没有配置 AI 模型或密钥。MCP、AI 编辑、IFC 导入与全部导出格式属于后续独立验证范围。官方 Next 的完整住宅、X-ray、剖切和漫游效果在当前演示中不作为复现承诺。

生产子路径通过后才具备接入统一静态发布的基础；正式上线必须另行检查真实访问入口，并更新根 `projects.json`。10 月 8 日验收时未填写在线演示地址；10 月 12 日发布情况以新增记录为准。

## 2026-10-08 · 中文项目理解网页

新增独立静态路由 `/overview/`，使用真实截图整理效果与能力、底层原理、使用场景、开发价值与验证边界。四组截图可切换和放大；五步流程可选择环节查看说明，2D 平面图明确从节点数据分支。页面区分原库能力、宿主补充与待建设的产品服务，并标注 AI / MCP 尚未连接、全部导出与专业流程未逐项验证。已有 AI 总结图保留放大和下载入口。

该路由不导入 Pascal / Three.js，原编辑器在项目根路径。公共 `research/` 内五张图片是本项目素材的逐字节副本，不并入原库 460 文件 manifest。编辑器增加「项目理解」入口，两页采用普通链接相互导航；页面样式与滚动容器使用独立作用域。

验收使用生产 `out/` 和实际项目子路径：

- TypeScript 与 Next.js webpack 静态构建通过，生成根编辑器和 `/overview/` 两个路由；仍保留原库两处非阻塞 `import.meta` 警告。
- 总结页、8 项脚本/样式、5 张研究图片及上游许可均返回 HTTP 200；5 张 Web 图片与原素材逐字节一致。
- 已实际切换四组截图、打开大图、按 Esc 或关闭按钮退出；已逐步检查五个原理环节，说明随选择更新。
- 总结图正常解码为 1536 × 1024，点击下载后获得本地 PNG。
- `390 × 844` 窄屏下内容宽度与容器宽度均为 375 px（保留 15 px 滚动条），无横向溢出；纵向流程按钮可操作。
- 检查中将“回到顶部”的锚点从滚动容器移到正文首节，修正后从页尾返回，确认 `scrollTop = 0`。
- 已实际从总结页进入编辑器并通过顶部入口返回，直接刷新总结路由成功；总结页控制台错误为空。
- 回访编辑器时恢复的是当前浏览器已有草稿，其渲染 DOM 包含原住宅 8 面墙和另外 16 面新墙；没有清除或还原这份设计数据。总结页截图继续作为初始样板的固定证据。
- 首屏、原理与窄屏真实截图已保存为 [overview.jpg](assets/overview.jpg)、[overview-principles.jpg](assets/overview-principles.jpg) 与 [overview-mobile.jpg](assets/overview-mobile.jpg)。

该轮扩展理解页和导航，未增加后端、AI 模型或云端保存功能。用途与开发顺序属于基于研究的分析，页面将其与实际验收分别说明。

## 2026-10-12 · 全面理解与统一发布接入

理解内容以 `web/app/overview/research.json` 保存，包含九类能力、八个模块、五步更新原理、六类场景、四条复用路线、八个扩展方向、十项摘要及六项边界。模块说明将本次运行的 core/nodes/viewer/editor 与仅研究源码的独立应用、CLI、MCP、UI 区分；扩展建议逐项列出已有基础、建设内容和验收方法。固定源码中的 Guide/Scan/capture 只是研究路线，本静态宿主未运行这些服务。

首屏采用已有 `pascal-summary.png` 原图，图像 1536 × 1024，SHA-256 `a6106b78b83f0e65c3dea23bfdc96241a8efd3cf97349c8bd511f974e60a4cef`。图片原始字节保持一致。四张真实编辑器截图仍用于具体效果证据。构建先同步研究素材、生成 Markdown 全文及 JSON 下载，再静态导出；全文在 HTML 中，不依赖客户端才有正文。

本地验收结果：

- `typecheck`、生产构建、`check:scenes`、`check:research` 全部通过；460 个原库资源完整，研究审计验证九个定位区域、内容数量、16 个本地引用和下载内容。
- 根 `npm run check` 与 13 项索引测试通过；聚合发布包仅包含 001、002、003、013，既有十六个沙画入口、面试资料与 AIHOT 研究继续通过校验。
- 浏览器原图弹窗显示 1536 × 1024，关闭正常；完整摘要展开显示十项；点击“重建几何”更新到墙交接/门窗 CSG 说明；扩展章节导航正常。
- 实际点击 Markdown 与 JSON 下载获得对应文件；理解页控制台错误为空。
- 390 × 844 与 320 × 740 下容器宽度分别为 375/305 px，body 宽度等于视口宽度，无横向溢出；截图见 `assets/publication/`。
- 未还原或清除已有本地编辑器草稿。公网来源与本机来源存储隔离，发布不会自动迁移设计。

GitHub Pages 接入现有发布工作流，完整复制本项目 `out/`，单独清洁安装和校验 Pascal 依赖。实际公开入口、Actions 结果、HTTP 与线上浏览器证据在首次发布成功后写入 `src/publication-verification.json` 并登记索引。

发布提交核验发现根仓库的 SVG 换行规范会改变官方 Sofa 平面图的原始 CRLF 字节。子项目新增 `.gitattributes`，将原库素材目录与官方原始场景按原始字节保留；重新登记该文件，并核对 Git 对象与素材 manifest 一致，避免本地校验通过而 Linux 清洁检出失败。SHA-256 清单没有为了迁就换行转换而修改。

## 后续验证

- 扩展真实触摸设备与其他浏览器体验，继续逐项覆盖尚未验证的建造工具和导出格式；当前基础展示和上述编辑/保存/放置流程已经完成。
- 核对当前组件在窄屏、触摸设备和其他浏览器的编辑体验。
- 后续若研究 AI 编辑，单独记录 MCP 服务版本、连接方式、工具调用和生成场景证据。
- 后续若更新版本，记录 npm 包与源码基线的变化，并重新验证资源和子路径。
