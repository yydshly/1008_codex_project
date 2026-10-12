# 沙画研究历程网页

新增 `#overview` [理解总览图](../../../assets/understanding/README.md)，3200 × 15811 PNG。七个模块汇总源库、探索、输入输出、原理、问题、产品方向和下一步；保留素材与 AI 目标分别标记。网页首次载入轻量预览，点击后加载完整图；提供章节定位、缩放、拖动、触屏滚动、下载、文字说明与 Escape 关闭。首页新增直达链接。原档案、媒体对照、录像和功能页保持。

入口：`/1008_codex_project/001-sandboard/art/research/`。照片工作室及 v36 纪念短片导航可进入。本页整理既有工作，不新增一个视觉“升级版”，也不读取或改动用户作品、草稿和沙层。

## 已整理内容

- 覆盖 v1–v36，归并为 27 项尝试；有逐版本索引。
- 五条主线：基础与舞台、照片作品、手部与接触、无手演出、纪念短片。
- 每项记录目的、改动、实际结果、理解、图片、保留演示与原始 Markdown。
- 三组效果对照，区分 AI 目标、照片影调预览与实际材料输出。
- 11 段历史录像按需加载，注明完整演出、手部小样或单笔片段；原档案没有录像的阶段不补造影片。
- 汇总六条阶段理解、原版与沙画分支的实现区别、产品能力与尚未达成的目标。

页面使用真实归档媒体，优先展示可判断形体的原图；图片不作为模拟的覆盖图。搜索支持方向、版本和关键词。原始记录保留当时的验证范围，不能当作本轮重新通过全部历史版本的证明。部分版本共用持续迭代的演示入口，历史图片/录像代表当时版本，当前入口可能包含后续功能。

## 文件与构建

数据源为 `src/research/catalog.json`、`comparisons.json`；`media.ts` 显式导入所选资源，不将整个资产目录打包。所选媒体约 132 MiB，录像在选择后才设置地址；发布时保留完整 `dist/`。原始 Markdown、署名和许可放入 `public/research-records/`。

```powershell
npm.cmd run build
node scripts/validate-research.mjs --built
npm.cmd run preview -- --host 127.0.0.1 --port 4174 --strictPort --base /1008_codex_project/001-sandboard/art/
```

根目录完成后运行 `npm.cmd run index:build` 和 `npm.cmd run check`。本次只增加档案 UI、构建入口、两处导航与文档，材料核心没有更改；本轮浏览器与保留核对见 [实际网页验证](../../../assets/research-journal/README.md)。

上游固定提交、GPLv3、真人素材的 CC BY 3.0 署名继续见 [ATTRIBUTION.md](../ATTRIBUTION.md)。旧资源来源各按原始记录保留，未生成新照片、手部或目标画面。
