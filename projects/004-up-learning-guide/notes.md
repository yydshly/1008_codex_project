# 004 · Up 终身学习指南：研究与验证记录

[项目概览](README.md) · [来源与许可](SOURCES.md)

## 2026-10-09 · 固定研究版本

目的：先解释仓库能力，再尽量完整整理有效知识，建立全部导航页面到中文专题和原文的对应。

输入：上游 `main` 的浅克隆，commit `35e2aa9ad3a076fe4e8405877cc560df2593838f`，提交时间 `2026-10-07T00:59:02+08:00`。使用 `git rev-parse HEAD` 和 `git ls-remote https://github.com/byoungd/up.git HEAD refs/heads/main` 核对当时研究对象，全文与源码按该版本阅读。

环境：Windows、PowerShell；Node.js 22.15.0，npm 10.9.2。本地研究脚本只需 Node 标准库；上游要求 Node 24，本轮没有安装其依赖或运行其完整构建。

## 2026-10-09 · 子项目登记与资料组织

在根 README 与 PROJECT_GUIDE 约定下，通过索引工具登记 `004-up-learning-guide`，生成独立目录。`npm.ps1` 调用在本环境未按预期传递选项，改用 `npm.cmd` 后成功：

```powershell
npm.cmd run project:add -- --slug up-learning-guide --name "Up 终身学习指南" --upstream https://github.com/byoungd/up --summary "按完整内容目录梳理英语训练、AI 协作、项目实践、人生复盘和工具模板，区分内容能力、网站实现与证据边界。"
```

产物：能力总览、七篇详细专题、97条手写逐页摘要、可重复生成的来源/资源/词表清单，以及上游三份许可原文。没有复制上游程序、完整书稿、媒体或电子书，没有部署应用。

研究分清四件事：内容提出的方法、作者公开自述、源码已实现的出版能力、本轮实际完成的检查。作者关联产品与合成案例不算作 Up 软件实现或真实成果。

## 2026-10-09 · 覆盖扫描

在根目录执行：

```powershell
node projects/004-up-learning-guide/src/inspect-upstream.mjs <固定提交的上游checkout绝对路径>
```

实际输出：

| 指标 | 结果 |
| --- | --- |
| 中文导航页面及逐页摘要 | 97 / 97 |
| 英文对应文件 | 97 / 97，逐路径配对并计算哈希 |
| 每种语言出版选页 | 80 |
| 可下载工作纸中英对 | 25 |
| 十组词表的分组词条 | 392 |
| 跨组去重词条 | 340 |
| 中文正文去重 Markdown 外链 | 67 |

脚本拒绝commit不符、缺摘要、多余摘要、缺英文文件、路径配对错误、缺专题和异常词表。当前扫描通过。英文未做逐句校对；Markdown外链存在于源文，不代表逐一验证外站。

## 2026-10-09 · 出版成品核对与版本差异

输入：固定checkout的 `docs/public/downloads/` 四份PDF/EPUB与两份manifest。用PowerShell `Get-FileHash -Algorithm SHA256` 实算，四项均与manifest一致，详细哈希见[出版说明](guides/06-publishing.md)。

观察：成品manifest写EPUB80章、PDF中文418页/英文479页；下载说明仍写76章、396/451页及旧哈希。结论限定为说明元数据落后于同提交成品记录，没有以此声称构建失败。页数按manifest转述，未独立解析PDF或重新生成。

## 验证命令与结果

最终检查包含生成来源清单、本地文档链接与固定提交文件路径、词表计数、许可原文一致性，以及仓库规定的索引与结构校验。根索引工具未作实现变更，因此无需为本轮文档新增执行工具单元测试；上游完整应用测试未运行。

```powershell
npm.cmd run index:build
npm.cmd run check
```

实际结果：`index:build` 更新当时的6个项目索引，`npm.cmd run check` 通过，编号、目录、元数据、图片路径和首页同步一致。

独立文档检查命令：

```powershell
node projects/004-up-learning-guide/src/verify-research.mjs <固定提交的上游checkout绝对路径>
```

首次检查发现原样许可文件的相对链接 `ATTRIBUTIONS.md` 缺少本地入口；新增清楚标注的固定上游权属导航页，许可原文保持不变。修复后通过：20份Markdown、179个本地链接、359个固定版本文件链接、97条目录摘要、392个分组词条，三份许可副本哈希与上游完全一致。

## 后续更新边界

本轮内容汇总已完成。后续若研究新commit、审校英文、重跑Node24网站/电子书或创建中文汇总网页，应作为新的验证范围追加记录。本轮没有依赖这些工作才能成立的结论，也不以未做的事项冒充通过。

## 2026-10-09 · 中文网页整理与效果呈现

目的：将完整研究作为实际可阅读的网页呈现，首页先说明能力和方法，继续进入正文及全部资料。

输入：已有七篇专题、SOURCES.md、97页来源清单、25组工作纸映射、392个分组词条和67个引用资源。独立HTML/CSS/JavaScript站点，Node22.15.0构建，marked18.1.0开发依赖，npm锁文件固定版本；根工具依赖未变。

实际产出：左侧知识导航、首页能力与六步学习闭环、完整长文/段落目录、全局检索、原文目录分组与摘要检索、工作纸分类、词表领域筛选、来源域名筛选、Markdown下载和来源许可页。内容从文档生成，未手工再复制一套知识；没有账户、云状态或AI调用。

实际命令：

```powershell
cd projects/004-up-learning-guide/web
npm.cmd install --ignore-scripts
npm.cmd run build
npm.cmd run check
npm.cmd run preview
node scripts/qa-browser.mjs <已有Playwright包的package.json绝对路径>
```

结果：生产构建与内容检查通过；页面、脚本、数据和下载在 `/1008_codex_project/004-up-learning-guide/` 子路径可访问。浏览器逐项验证六步切换、全部专题、97页目录和无结果、25张工作纸与生活表定位、392词条筛选、67引用及域名筛选、跨会话全文搜索、下载、深链接刷新、390px手机导航/正文、200%文字放大，无运行异常。

视觉检查发现手机能力卡片的英文编号挤窄中文标题；调整为自然纵向排版，再实际检查和截图。初次构建也发现后缀筛选误将生活进阶工作表排除；改为精确排除工具箱总览和演示后，25张工作纸恢复完整。来源说明新增网页链接后，生产检查发现网页README未复制到下载目录；补齐网页说明与截图资源后通过检查。

真实截图位于assets/cover.png（1440×1000桌面）和assets/mobile.png（390px手机完整首页）。本机地址为 `http://127.0.0.1:4194/1008_codex_project/004-up-learning-guide/`，没有发布线上站点，索引demo留空。后续统一发布需复制完整dist，包括data与research目录。

## 2026-10-09 · 核心能力与价值观一图整理

目的：将核心方向、三类能力、六步行动闭环、五项价值观和回看三问放在一张长期参考图中，帮助从阅读进入自己的下一步行动。

成品：[2400×1600 PNG](assets/up-core-map.png)与[同图SVG源文件](assets/up-core-map.svg)。图中文字与箭头采用SVG精确排版，Chromium浏览器实际渲染PNG；61个文字节点均在画布内，整图经过视觉检查。[设计记录](assets/up-core-map-prompt.md)保留内容规范、内置imagegen尝试提示词、最终制作方式、文字版与来源条件。内置图片生成首次返回网络错误，未完成的重试随后停止，最终没有使用imagegen CLI备用方式。

网页新增 `#/map` 与“一图理解”导航，提供原图保存、打开原图放大阅读、展开文字版，并将导图加入全局检索。来源与素材记录标明这是固定提交内容的研究改写，并保留byoungd and contributors、CC BY-NC 4.0署名。预览服务为PNG补齐image/png类型，以便原图可以直接在浏览器阅读。

实际验证：独立build与生产内容check通过。已有Playwright检查新导航、直接刷新、2400×1600图片加载、文字展开、下载文件字节与源PNG一致、原图新标签、关键词“价值观”搜索定位，以及390px手机页面无横向溢出（图片显示宽350px）。无页面异常或HTTP错误。检查发现手机重复点击当前导航不触发hashchange，菜单未收起；补充导航点击处理后复查通过。

图中能力分组与五项价值观为本研究的归纳。原图、矢量源文件、文字版、设计规范与许可随完整dist/research/assets一起保留，仍只提供本机预览。
