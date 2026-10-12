# 光阴沙画 · 统一平台首页

首页快捷入口新增「历史作品与过程」，直达 `art/gallery/#history`。34项历史作品与效果覆盖v1–v36，柳、桥、侧脸和原归舟优先展示，AI目标与实际沙层有不同标记；可从作品卡片看保存录像或打开对应原画台。站点仍为首页加十五功能页，没有新增平行版本页面。

首页快捷入口新增「手绘示例作品」，直达统一作品集的 `#examples`。九幅实际效果可按工具查看，点击进入原画台编辑；示例与个人手绘、照片收藏集中在同一页。七个空台工具入口和全部旧页面照常保留。

新增 [统一作品集](../gallery/README.md)，手绘与照片收藏集中浏览。首页首屏提供作品集入口，其下七工具直接进入原画台并选中工具。原有十四功能页都保留，新增作品集后为十五功能页，加首页共十六页。

首页把前面的完整创作平台和后续试验重新串起来。访问项目根路径会进入 `art/home/`，每个功能页顶部都提供“光阴沙画 · 首页”和“全部入口”。照片平台、工作室和创作台优先展示；版本编号代表时间顺序，不代表效果排名。

本地首页：[打开平台](http://127.0.0.1:4174/1008_codex_project/001-sandboard/)。

## 全部入口

以下路径均相对 `/1008_codex_project/001-sandboard/`。

| 用途 | 页面 | 路径 |
| --- | --- | --- |
| 平台总览 | 统一首页 | `art/home/` |
| 作品收藏 | 手绘与照片统一作品集 | `art/gallery/` |
| 创作平台 | 照片与记忆 · v12–v17 | `art/memories/` |
| 创作平台 | 沙画工作室 · v2–v6 | `art/` |
| 创作平台 | 沙画创作台 · v8–v11 | `art/atelier/` |
| 效果演示 | Sandboard 原版 · v1–v2 | `original/` |
| 效果演示 | 月下江南 · v7 | `art/stage/` |
| 手与沙试验 | 生成手部 · v18–v19 | `art/memories/hands/` |
| 手与沙试验 | 接触与无手演出 · v20–v30 | `art/memories/hands/contact/` |
| 手与沙试验 | 茶杯九动作 · v31 | `art/memories/hands/contact/cup/` |
| 纪念短片 | 首版产品流程 · v32 | `art/memories/keepsake/` |
| 纪念短片 | 细沙与推拢 · v33 | `art/memories/keepsake/natural/` |
| 纪念短片 | 杯身塑形 · v34 | `art/memories/keepsake/composition/` |
| 纪念短片 | 灯台留白 · v35 | `art/memories/keepsake/sandlight/` |
| 纪念短片 | 局部推拢 · v36 | `art/memories/keepsake/handwork/` |
| 研究档案 | 效果、过程与理解 · v1–v36 | `art/research/` |

首页还直达照片平台的风格、雨窗成画、公园示例、实拍手部等保留模式。各模式继续在原平台里切换，没有拆成重复页面。

自由手绘能力新增更明确的直达入口：`art/#mode=surface&tool=rake` 打开原沙面并选中沙耙，`art/#gallery` 打开手绘作品集，`art/memories/#gallery` 打开照片作品集。照片创作和照片作品集都提供手绘入口；手绘作品集也能返回照片作品集。选择工具只复用已有工具按钮，不清空画台；绘画、保存、继续画的实际验证见 [手绘入口记录](../../../assets/handdraw-entry/README.md)。

## 构建与预览

原版与沙画实验继续独立安装依赖。已有依赖时，在 `experiments/sand-art/` 运行：

```powershell
npm.cmd run build:platform
npm.cmd run preview:platform
```

`build:platform` 先构建 `../../web/`，再构建沙画实验十五入口，最后打包为忽略目录 `.cache/platform-site/`。其中 `original/` 为原版产物，`art/` 为完整沙画产物；根 `index.html` 进入统一首页。复制构建时附带两者的 GPL 许可。正式发布应复制整个目录到 `_site/001-sandboard/`，不能只复制首页。当前只做本地预览。

验证：`node scripts/validate-platform.mjs`；研究档案另运行 `node scripts/validate-research.mjs --built`。浏览器截图与验证说明见 [本轮证据](../../../assets/platform-navigation/README.md)。

## 保留范围与实现

全部十三条既有 `art/` 页面路径继续有效；新增首页不占用旧工作室的路径。共同目录来自 `src/platform/pages.json`，首页和各页导航使用同一份列表。导航以 Shadow DOM 隔离旧样式，适配窄屏、当前页提示、Escape 关闭与外部点击关闭。兼容旧页面异步创建的原版链接。

不迁移、清空或合并作品库。照片、故事、草稿和收藏仍由各原页面保存，保持本地 `127.0.0.1:4174` 的访问源；`localhost` 与 `127.0.0.1` 仍是浏览器的不同存储源。原版只增加导航和固定控件的顶部让位；材料、动作谱、着色器和历史素材保持。首页图片均引用此前的实际网页截图或材料输出；其中照片示例仍沿用已说明的 AI 虚构输入。
