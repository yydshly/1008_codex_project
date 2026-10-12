# 多 Web 演示部署与记录

<!-- INTERVIEW_GUIDE_PUBLICATION:START -->
## 编程面试知识指南公开发布（2026-10-12）

已通过 GitHub Pages Actions 部署并核验公开 HTTPS。在线入口：[编程面试知识指南](https://yydshly.github.io/1008_codex_project/002-interview-guide/)，[统一研究首页](https://yydshly.github.io/1008_codex_project/)。实际结果见 [发布核验记录](../projects/002-interview-guide/src/publication-verification.json)。

- 默认理解总览说明源库能力、九类模块、静态内容出版原理、学习与团队使用价值、扩展方向及能力边界；知识索引、学习路线、资料与覆盖页继续可用。
- 复用我们生成的完整 1086 × 1448 PNG 引导图，原文件与网页副本逐字节一致；首页、理解页、原图查看与下载均保留全部画面。
- 固定研究提交包含 50 篇 MDX、11 篇教程与 39 篇导航。保留 209 个去重资源入口，新增 113 节中文讲解、38 个示例、100 个误区与 100 条答法；不是在线判题或代码执行服务。
- 根构建显式只发布 001 与 002，将完整 002 web/dist/ 复制到 .cache/pages-site/002-interview-guide/，包含所有模块、覆盖报告、PNG 与 MIT 许可；保留 Sandboard 的十六功能入口与媒体。
- 002 独立使用 Node.js 内置模块，无第三方构建依赖、服务端或 API 密钥。相对资源与 Hash 路由支持项目子路径、直接主题链接和刷新。
- 本地聚合构建、独立严格审计、根索引检查、13 项索引测试通过；真实浏览器检查理解页、检索、SOLID 深链、答法、覆盖页和 320/390 px 手机菜单，无横向溢出及控制台错误。

复现发布构建（仓库根目录，Node.js 22.12+）：

~~~powershell
npm.cmd ci --prefix projects/001-sandboard/web
npm.cmd ci --prefix projects/001-sandboard/experiments/sand-art
npm.cmd ci --prefix projects/002-interview-guide/web
npm.cmd run check
npm.cmd test
npm.cmd run build:site
node scripts/validate-site.mjs
$aggregateSite = (Resolve-Path .cache/pages-site).Path
node projects/002-interview-guide/web/scripts/serve.mjs --dir $aggregateSite --port 4202 --base /1008_codex_project/
~~~

聚合预览使用已解析的绝对目录；独立预览可使用 --dir dist --base /1008_codex_project/002-interview-guide/。001 额外媒体验证由 Actions 中的 validate-platform.mjs 和 validate-research.mjs --built 执行。

未来可增加学习进度与错题、间隔复习、上游差异与外链监测；AI 问答属于待开发方向，应先设计来源引用与验证。当前站点只提供静态阅读和资料导航。
<!-- INTERVIEW_GUIDE_PUBLICATION:END -->

<!-- SANDBOARD_PUBLICATION:START -->
## Sandboard 首次公开发布（2026-10-12）

发布方式为 GitHub Pages 自定义 Actions 工作流，已完成首次部署并核验 HTTPS 页面、全部十六功能入口、直接引用资源和高清图。站点根入口是 `https://yydshly.github.io/1008_codex_project/`，Sandboard 子路径是 `https://yydshly.github.io/1008_codex_project/001-sandboard/`。其他尚未提交的子项目不纳入本次发布，既有编号和本地内容保留。

- 仓库总览页说明源库能力、原理、价值、实际输入输出、扩展方向与边界，并链接真实截图和完整引导图。
- `001-sandboard/` 跳转 `art/home/`；`original/` 保存 Sandboard 原版，`art/` 保留工作室及其余十四页，共十六功能入口。
- `.github/workflows/pages.yml` 分别安装两个子项目的锁定依赖，构建完整站点，验证目录与媒体，再发布同一个 Pages artifact；主分支相关改动自动触发，亦支持手动运行。
- 根 `scripts/build-site.mjs` 只做静态站点聚合；根包不统一子项目依赖。产物是 `.cache/pages-site/`，不会提交构建缓存。
- 原版与沙画的资源采用相对引用，保留许可证、研究记录、历史录像和下载素材；高清总览图按需加载。原版和手绘工作室需要支持 WebGPU 的浏览器与设备；其余静态研究和照片页面可单独访问。
- 无模型 API、服务端、支付或在线账户；用户照片、草稿与收藏在浏览器本机处理。线上新域名与 localhost 的存储隔离，已有作品需在旧页面导出工程后到对应新入口导入。
- 超过 GitHub 单个文件限制的 v30 完整原始录像存为 GitHub Release 附件，本地原始文件保留；SHA-256 与历史取证记录一致，网页精选录像不变。

本地复现（Node.js 22.12+）：

~~~powershell
npm.cmd ci --prefix projects/001-sandboard/web
npm.cmd ci --prefix projects/001-sandboard/experiments/sand-art
npm.cmd run check
npm.cmd test
npm.cmd run build:site
node projects/001-sandboard/experiments/sand-art/scripts/validate-platform.mjs
node projects/001-sandboard/experiments/sand-art/scripts/validate-research.mjs --built
~~~

首次部署成功并核验 HTTPS 页面后，才把实际演示 URL 写入 `projects.json` 并运行 `npm run index:build`。发布与目录检查不等于沙画视觉达标；自然成画与摄影级真实感仍待验收。

参考：[GitHub Pages 自定义工作流官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
<!-- SANDBOARD_PUBLICATION:END -->

以下为仓库初始化时的部署规划与历史说明；实际已发布项目及当前构建方式以上方发布记录为准。

## 一个站点，多个项目路径

GitHub Pages 每个仓库最多对应一个项目站点，其默认地址含仓库名称。这里计划把多个静态 Web 的构建结果汇总为一个站点，再按编号分目录发布。[GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

预期路径如下；这是规划示例，当前不可视为已上线：

| 内容 | 计划路径 |
| --- | --- |
| 演示总入口 | `/1008_codex_project/` |
| 第一个 Web | `/1008_codex_project/001-repo-name/` |
| 第二个 Web | `/1008_codex_project/002-another-repo/` |

源码继续放在 `projects/<id>-<slug>/web/`。未来发布流程可使用临时目录 `_site/` 汇总产物：

```text
_site/
├── index.html
├── 001-repo-name/
│   ├── index.html
│   └── assets/
└── 002-another-repo/
    ├── index.html
    └── assets/
```

`_site/` 是未来构建输出示例，不是当前已实现的构建脚本。每次发布需汇总所有已启用演示，再上传一个 Pages artifact；单独上传某个项目会让其他项目的发布内容缺失。

## 配置子路径与静态资源

纯静态 HTML 可用 `./assets/...` 引用当前 Web 的资源，跨项目入口使用相应的相对路径。避免把资源写成 `/assets/...`：它指向域名根目录，与本仓库的项目子路径不同。

Vite 项目的 `base` 应与实际发布位置一致。以下是根据 Vite 官方仓库子路径配置规则扩展的项目配置示例：[Vite GitHub Pages 部署文档](https://vite.dev/guide/static-deploy.html#github-pages)

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/1008_codex_project/001-repo-name/',
});
```

构建后把该项目产物的内容复制到 `_site/001-repo-name/`。其他项目使用自己的编号和 slug；仓库名或域名变化时同步调整配置。涉及前端路由时，使用适合静态托管的路由方案，例如 hash 路由，并实际测试直接打开页面和刷新页面。

## 第一个 Web 完成后的发布步骤

1. 在子项目 README 记录依赖安装、构建与预览命令，以及产物目录。提交依赖锁文件，确认项目能从干净环境构建。
2. 本地验证真实生产构建，检查入口、图片、脚本、样式、路由和交互。Vite 默认构建到 `dist/`，`vite preview` 用于本地检查构建结果。[Vite 静态构建与预览文档](https://vite.dev/guide/static-deploy.html#building-the-app)
3. 为所有需要上线的项目实现统一构建与汇总脚本，生成站点总入口。不要把 `web/` 空目录或仅含源码的目录当作可部署产物。
4. 添加统一 GitHub Actions 发布 workflow。在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
5. workflow 构建并汇总项目后，通过 `configure-pages`、`upload-pages-artifact` 和 `deploy-pages` 发布。部署 job 依赖构建 job，使用 `github-pages` environment，并配置 `pages: write` 与 `id-token: write` 权限。Action 版本在实际实施时按官方文档确认。[GitHub Pages 自定义 workflow 文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
6. 部署成功后打开实际 URL，验证总入口及每个子项目。只有在线验证通过后，才填写对应 `projects.json` 的 `demo`，运行 `npm run index:build` 和 `npm run check`，更新首页入口。

后续增加 Web 时扩展同一个发布流程，保持各项目独立构建、统一汇总发布。原项目地址保持稳定；归档项目是否继续保留演示，在子项目文档中写明。

## 需要后端的项目

GitHub Pages 托管静态 HTML、CSS 和 JavaScript，动态后端需要部署到外部服务。前端可放在 Pages，后端运行在适合该项目的平台，或把完整应用部署到外部平台，再将实际演示 URL 写入 `demo`。[GitHub Pages 托管范围](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

在子项目 README 说明前后端部署位置、接口地址配置、运行依赖及可用功能。仅有 GitHub 仓库链接、构建产物或规划地址时，`demo` 继续保持为空。
