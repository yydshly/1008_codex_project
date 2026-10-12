# Octogent 中文研究网页

原创静态展示页，无第三方依赖。内容基线、素材许可和实测范围见 [项目说明](../README.md)。

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run check
npm.cmd run preview
```

访问 `http://127.0.0.1:4193/1008_codex_project/007-octogent/`。开发时改用 `npm.cmd run dev`；两者共用端口，不要同时启动。

`content.js` 保存中文研究、截图元数据和预设协作步骤；`app.js` 实现交互；`styles.css` 负责响应式样式。`scripts/build.mjs` 将完整资源与许可复制到 `dist/`。

`publication.mjs` 定义模块、原理、场景、价值、复用与扩展正文；摘要和图前介绍读取根 `projects.json`。`interactive-sections.mjs` 同时供构建和浏览器使用，让原有能力与协作解释进入静态 HTML。构建输出 `publication.json`、`understanding.md`，并生成项目 `UNDERSTANDING.md`；内容版本用于更新发布后的脚本缓存。`scripts/audit.mjs` 检查完整正文、锚点、资源、索引一致、六张作者截图及原图哈希。

协作演示只说明原库的工作方式，不调用真实代理。全部资源使用相对路径，可在仓库子路径独立预览。真实截图与 favicon 来自上游固定提交，保留 MIT 许可与署名。

`map.html` / `map.css` / `map.js` 提供一张高清全景图的缩放、章节跳转、文字版和 PNG / SVG 下载。图源在 `../src/render_understanding_map.py`，产物保存到 `../assets/`；构建会检查图解资源存在后复制完整素材。手机默认放大阅读，可在图像区域横向、纵向滚动；“适应宽度”用于查看整体结构。
