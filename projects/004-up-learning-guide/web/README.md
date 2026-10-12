# Up 中文知识地图网页

[项目概览](../README.md) · [来源与许可](../SOURCES.md)

独立静态网页，完整呈现已有中文研究。首页解释能力和方法，七篇专题提供全文与目录，另有97页内容目录、25张工作纸、十组392个分组词条与67个引用资源。所有内容从研究文档构建，网页不维护另一套摘要。

## 运行与构建

需要 Node.js 22 或更新版本，构建依赖固定为 marked 18.1.0；浏览器运行时不需第三方库或外部字体服务。

```powershell
cd projects/004-up-learning-guide/web
npm.cmd ci --ignore-scripts
npm.cmd run build
npm.cmd run check
npm.cmd run preview
```

打开 [本地知识地图](http://127.0.0.1:4194/1008_codex_project/004-up-learning-guide/)。生产产物为 `dist/`，静态服务默认只暴露 `/1008_codex_project/004-up-learning-guide/` 子路径。

## 阅读与交互

- 首页三类能力、六步学习闭环和全部专题入口；步骤支持键盘左右切换。
- 首屏沿用完整2400×1600引导图，并提供十一项摘要和十章完整理解。核心内容构建到HTML，关闭JavaScript仍可展开阅读及下载专题；搜索包含完整理解正文。
- “一图理解”在 `#/map` 汇总核心方向、能力、学习闭环与价值观，提供原图保存、放大阅读和可展开文字版。
- 专题保留完整正文、表格、代码、来源链接与Markdown下载；桌面侧栏目录，手机折叠目录。
- 全局搜索覆盖专题正文、逐页摘要、工作纸、词条和引用标题；`/` 或 `Ctrl/Command + K` 打开，Escape关闭。
- 原文目录支持摘要搜索与分组；工作纸按实际问题分类；词表按领域与词条筛选；引用按域名和内容检索。
- hash 路由支持直接打开、刷新专题及段落位置，示例 `#/guide/02-english`。
- 手机上可展开导航，长表格在表格内部滚动；页面支持减少动画与打印正文。

搜索来自本研究七篇完整正文和资料索引，区别于上游网站有限的本地索引范围。工作纸入口提供中文填写说明并连接原始模板，填写和保存仍在读者自己的文件中完成。

## 输入与产物

`scripts/build.mjs` 读取上层 `guides/`、`SOURCES.md` 和 `sources/` 中的固定研究数据，生成正文HTML、目录、检索用片段和工作纸阅读入口。内容集中于 `dist/data/content.json`；Markdown、来源数据与许可一并保留在 `dist/research/`。

`index.html`、`styles.css`、`app.js` 是本项目独立实现。页面脚本与资源使用相对地址；无需后端或账号，无远程状态保存。外部原文和参考资料在新标签中打开。

## 验证与发布范围

`npm.cmd run check` 检查生产内容数量、完整章节目录、工作纸定位、下载和相对资源。实际浏览器验证另有 `scripts/qa-browser.mjs`，可使用已安装的Playwright模块：

```powershell
node scripts/qa-browser.mjs <Playwright包的package.json绝对路径>
```

验证记录见[notes.md](../notes.md)。本轮已检查生产构建、子路径、交互、手机阅读与截图；没有发布在线站点。

未来统一发布时，将完整 `dist/` 放入站点的 `004-up-learning-guide/` 子目录，含 `data/` 和 `research/`，详见[总仓库部署约定](../../../docs/DEPLOYMENT.md)。换子路径时无需重写页面资源或hash路由，但预览服务的 `--base` 应与检查路径一致。

## 来源与许可

内容改写自 byoungd and contributors，固定上游提交 `35e2aa9ad3a076fe4e8405877cc560df2593838f`，保留 CC BY-NC 4.0 及改动说明。网站是本研究独立实现，上游网站代码没有复制；marked的许可由其npm包保存。两类上游许可与第三方材料边界见项目来源说明。
