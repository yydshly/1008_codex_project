# Pascal 编辑器效果展示

这是 `003` 子项目的独立 Next.js 宿主，复用 `@pascal-app/core`、`viewer`、`editor`、`nodes` 的真实编辑器功能，四个包固定为 `1.0.3`。默认输入为本项目制作的住宅样板 `house.json`，可切换官方 `demo_1`；场景与资源保存于本地。

[项目概览](../README.md) · [研究与验收记录](../notes.md) · [多 Web 部署说明](../../../docs/DEPLOYMENT.md)

## 安装与运行

使用 Node.js 22 或更新版本，在仓库根目录执行：

```powershell
cd projects/003-pascal-editor/web
npm.cmd ci
npm.cmd run dev
```

入口：`http://127.0.0.1:4187/1008_codex_project/003-pascal-editor/`。本次环境为 Windows、Node.js `22.15.0`、npm `10.9.2`。

项目理解页：[本地完整总结](http://127.0.0.1:4187/1008_codex_project/003-pascal-editor/overview/)。包含九类能力、八个模块、五步更新原理、六类场景、四条复用路线、八个扩展方向及验证边界。首屏沿用已有完整引导图，支持真实截图切换、原图放大与下载、完整摘要展开、分步原理说明，以及 Markdown/JSON 下载。与编辑器通过普通链接相互导航，支持直接访问与刷新。

PowerShell 可使用 `npm.cmd`，其他终端使用 `npm`。依赖和锁文件位于当前目录，根仓库无需安装 Pascal 或 Next.js。浏览器通过 HTTP 服务打开，避免直接双击构建后的 HTML。

`npm ci` 的 `postinstall` 会执行 `scripts/prepare-assets.mjs`。脚本校验 Pascal 包为 `1.0.3`，通过 TypeScript AST 为包中 `/icons/`、`/audios/` 的域根引用增加 `NEXT_PUBLIC_BASE_PATH`；原生材质缩略图和绘制预览通过固定片段适配为同一子路径。KTX2 解码器改从同源 `<basePath>/basis/` 加载本项目 Three.js `0.186.0` 附带的 JS / WASM。不改几何和渲染算法，清洁安装后可重现。如更新 Pascal 版本，应重新核实该适配。

## 构建与预览

```powershell
npm.cmd run typecheck
npm.cmd run check:scenes
npm.cmd run build
npm.cmd run check:research
npm.cmd run preview
```

Next.js 静态导出目录为 `out/`。生产预览仍在端口 `4187`，打开上述项目子路径。开发与预览需分别运行，避免占用同一个端口。

最新 TypeScript 检查、完整场景/素材校验和 Next.js `16.3.0` webpack 生产构建已通过。上游两处 `import.meta` 的 DEV 检测产生非阻塞 webpack 警告，未忽略 TypeScript 错误。生产浏览器已完成墙厚编辑、撤销/重做、自动保存、刷新恢复、还原、家具放置与官方示例楼层展开；根索引、仓库校验和 `git diff --check` 通过。实际输入与边界见 [notes.md](../notes.md)。

子路径固定为 `/1008_codex_project/003-pascal-editor/`。静态构建检查须实际访问这个路径，检查刷新后的页面、`_next` 脚本/样式和场景资源，完整输出内容应一并保留。构建与交互验收的实际结果见 [notes.md](../notes.md)。

根 `npm run build:site` 将完整 `out/` 复制到统一产物的 `003-pascal-editor/` 目录，并保留研究下载、素材、许可和来源说明。GitHub Pages 工作流单独安装本项目锁定依赖，再校验场景、460 个原库资源与完整静态研究正文。首次公开入口核验通过后才登记 `projects.json` 的在线 `demo`。

## 页面与场景

`app/overview/page.tsx` 与 `overview.tsx` 提供独立的中文理解页，不导入 Pascal 编辑器或 Three.js；`overview.css` 的样式与滚动容器限定在此页。`public/research/` 是项目 `assets/` 内四张真实截图和 AI 总结图的 Web 发布副本，不计入原库 460 文件素材校验清单。构建后应保留 `out/overview/`、`out/research/` 和其余静态产物。

`app/overview/research.json` 是理解页内容数据。`scripts/prepare-research.mjs` 在构建前校验原图 SHA-256、同步五张展示图片，并生成研究 JSON 与 Markdown 全文下载；`scripts/build.mjs` 顺序执行资料准备与 Next.js webpack 构建。`check:research` 检查静态 HTML 的九个定位区域、各类内容数量、16 个本地引用、下载内容及原图一致性，可用 `node scripts/audit-research.mjs --site <已构建的项目绝对目录>` 检查聚合产物。

`app/showroom.tsx` 加载内置节点插件后挂载 Pascal 编辑器，提供住宅/官方示例选择和还原。`app/editor-panels.tsx` 提供中文建造入口、视图控制与 `FurniturePanel`：本地家具支持名称/标签搜索和类别筛选，选定后交给原生 `item` 工具预览与放置。

视图控制包括 3D、平面图、分屏、真实材质/结构、楼层叠放/展开/单层、隐藏遮挡墙与居中。建造入口支持墙、门窗、楼板、天花板、屋顶、楼梯、立柱与围栏；绘制与参数调整由上游工具完成，先在场景树选择楼层。

npm 材质目录包含 114 项材质与 314 个纹理/缩略图资源，原 Git 基线与官方站点缓存来源分别登记。全部本地素材共 460 文件、约 18.84 MB，完整引用、文件头、512 KTX2 尺寸与 SHA-256 已通过脚本校验。详情见 [素材清单](../assets/SOURCES.md)。浏览器已实际运行住宅 3D 与分屏。

宿主通过稳定的 `onLoad` / `onSave` 回调为两个示例分别保存 `localStorage` 草稿；重新加载时优先读取当前示例草稿。「还原示例」清除当前示例草稿，再加载初始 JSON。存储按浏览器和站点来源隔离，楼层高度的刷新恢复与还原已实测通过；两示例草稿的完整隔离没有另作专项验收。宿主不包含 MCP 后端或 AI 模型配置。

两份示例已经预先归一化为 `1.0.3` 节点格式：住宅 51 节点与 6 项顶层材质，通过五块楼板的 `slots.surface` 保留颜色；官方示例 60 节点中包含两个显式 `roof-segment`。这样适配原生 Editor 先解析节点 schema、再加载场景的顺序，避免旧字段在迁移前丢失。住宅内外墙面属性也已明确，支持原生 cutaway。

实测楼层高度从 `2.8` 米改为 `3.5` 米，刷新后保留，还原回到 `2.8` 米；墙厚修改、撤销和重做使用原生 Inspector。搜索 `sofa` 唯一返回 `Sofa`，原生碰撞拒绝普通点击后，按提示 `Alt + 单击` 强制放置成功，家具从 20 件增加到 21 件，退出工具后可选中编辑。使用中应先选择合适位置，强制放置允许越过原生碰撞检查。

官方示例切换与 `exploded` 屋顶展开已实际运行。`390 × 844` 窄屏无横向溢出，底部建造面板可打开；完整手机工具与真实触摸设备尚未验收。全部建造工具和导出格式没有逐项测试。控制台错误为空，存在上游 BVH / uv2 非阻塞警告。真实截图见 [项目概览](../README.md)。

## 上游与改动

原仓库为 [pascalorg/editor](https://github.com/pascalorg/editor)，源码研究与素材基线固定到 [`c5eaf51e161ba8653204d543666f5839d6020874`](https://github.com/pascalorg/editor/tree/c5eaf51e161ba8653204d543666f5839d6020874)。npm 运行依赖单独固定到 `1.0.3`，未做包与 Commit 的逐文件一致性核对。

上游适用 MIT，版权为 Pascal Group Inc.，完整许可保留于 [public/LICENSE.upstream.txt](public/LICENSE.upstream.txt)。`app/globals.css` 与 `app/elevation.css` 参考固定上游样式。本次新增宿主、中文面板、原创场景、场景清理与草稿存储，并为依赖图标/音效引用添加子路径。原始素材、逐文件校验清单和改动见 [assets/SOURCES.md](../assets/SOURCES.md)。官方 Pascal Next 是另外的托管预览，其完整效果尚未属于开源发行；本页以本地实际画面为准。

材质独立来源与许可未逐项核实，不把全部贴图自动归为 MIT。Basis 解码器使用 Apache 2.0，保留于 [public/basis/LICENSE](public/basis/LICENSE)。
