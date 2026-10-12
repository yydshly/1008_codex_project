# 008 · GhostTrack 能力与原理研究：研究笔记

[项目概览](README.md) · [原仓库](https://github.com/HunxByts/GhostTrack)

## 2026-10-09 · 固定源码与许可核对

目的：确认四项能力的真实实现，区分程序封装与外部技术来源。

环境：Windows / PowerShell；Node.js `v22.15.0`。本页无第三方构建和运行依赖。

读取 GitHub API `repos/HunxByts/GhostTrack/commits/main`，返回完整 SHA `a5cb8ad4c08acd803f166fb067b7dac724d6cb3d`，提交日期 `2024-01-11T15:36:46Z`。再读取该提交的递归 Git tree，文件为 `GhostTR.py`、`README.md`、`requirements.txt` 和 `asset/` 内素材；未发现许可证文件。程序头部存在改写许可与署名的文字，不能据此推断 MIT / Apache 等标准开源授权。

| 固定源码范围（实际文件行号） | 输入与实现 | 观察 |
| --- | --- | --- |
| `IP_Track()`，41–78 | IP → `http://ipwho.is/{ip}` → JSON → 字段与地图链接 | 地理数据库由外部服务维护；经纬度被转成整数；未先检查 success |
| `showIP()`，170–176 | 当前请求 → `https://api.ipify.org/` → 文本 | 是服务端可见的公网请求来源，不是地理位置 |
| `phoneGW()`，81–118 | 电话号码 → phonenumbers 的解析、校验与元数据函数 | 默认 ID；地理描述用印尼语；不请求运营商定位系统 |
| `TrackLu()`，122–167 | 用户名 → URL 模板 → GET → status_code == 200 | 24 条配置、23 个名称；Snapchat 重复；依次访问；异常时返回 |

来源审阅：ipwhois.io 官方文档、ipify 官方说明、IETF RFC 3022、python-phonenumbers README 与许可证、Google libphonenumber FAQ、Requests quickstart、GitHub licensing 文档。网页清楚区分源码观察、外部文档说明与结果解释。

未执行上游查询：没有输入真实个人电话号码、没有批量扫描用户名平台、没有把示意性结果伪装成实时查询。

## 2026-10-09 · 独立网页实现

目的：让读者在同一页面对照能力、实现调用与底层技术。

执行登记命令：

```powershell
npm.cmd run project:add -- --slug ghosttrack --name "GhostTrack 能力与原理研究" --upstream "https://github.com/HunxByts/GhostTrack" --summary "用中文网页拆解四项信息查询能力，说明上层封装、IP 数据库、网络出口、号码规则和账号页面检测的关系与局限。"
```

观察：脚本分配编号 008，生成子目录，更新索引与首页。保留工作区其他项目原有修改。

实现结构：`web/content.js` 保存原创研究数据；`index.template.html` 保存页面结构；构建脚本生成包含全部说明的静态 HTML；`app.js` 只控制四项标签切换和片段导航。生产资源全部使用相对路径；无需查询后端、密钥或本地 .env。

交互设计：鼠标与键盘可选择能力；方向键 / Home / End 移动选择；链接片段与浏览器历史保持选择；无 JavaScript 时展示全部说明。平台清单采用原生 details 展开。

## 2026-10-09 · 生产构建与浏览器验证

目的：确认网页可独立构建，并在完整部署子路径下正常阅读。

执行命令（在 `web/`）：

```powershell
npm.cmd install --package-lock-only --ignore-scripts
npm.cmd run build
npm.cmd run preview
node .cache/verify-browser.mjs
```

观察：生成 `web/dist/`，包含 HTML / CSS / JS 与研究文档；四项能力、23 个平台名称、9 项参考来源均保留。默认预览地址为 `http://127.0.0.1:4195/1008_codex_project/008-ghosttrack/`。锁文件无第三方依赖。

浏览器 QA 使用工作区已有 Playwright 1.60.0 测试工具（来自 005 项目的本机安装，仅作为验证工具，不成为本项目依赖），调用系统 Chrome 的独立无头实例；临时验证脚本与辅助截图保存在已忽略的 `web/.cache/`。页面正式封面为 `assets/cover.png`。

| 检查 | 实际结果 |
| --- | --- |
| 桌面视口 1440 × 1080 | 页面正常；已查看真实截图 |
| 四项切换 | 每次只有一个标签选中、一个说明面板可见，片段地址同步 |
| 方向键 / Home / End | 可移动选中项与键盘焦点 |
| `#phone` 直接打开、刷新和浏览器后退 | 电话说明仍正确选中与显示 |
| 平台清单展开 | 23 个不同平台名称可见 |
| CSS / JS / 两份研究文档 | 在完整子路径下均返回 HTTP 200 |
| 子路径尾斜杠与不存在资源 | 无尾斜杠入口重定向；不存在资源和未挂载根路径返回 404 |
| 390px / 320px 手机布局 | 页面本身无横向溢出；宽表格在自己的滚动容器中阅读 |
| 手机 200% 字号 | 页面宽度未溢出；文字随字号增大 |
| 无 JavaScript | 四项完整说明均可顺序阅读 |
| 页面加载与能力切换的网络请求 | 仅本机页面资源，无外部查询请求 |
| 浏览器脚本错误 | 0 |

失败与修复：默认 Playwright 浏览器未安装，改用已安装系统 Chrome，无需下载浏览器；无 JavaScript 的展开样式第一次被 hidden 的重要规则覆盖，修正优先级后验证四项均可见；将字体改用 rem 后发现 200% 字号的品牌行溢出，允许品牌行换行后通过。

以上检查用于验证本项目网页，不代表上游 IP 接口或 23 个平台已实测。未修改根索引工具，根级按约定执行 `npm.cmd run index:build` 和 `npm.cmd run check`。

仓库检查实际结果：首页生成成功；`npm.cmd run check` 通过，当前索引含 9 个项目，编号、目录、元数据、图片路径与首页一致。其他项目的工作区变化未覆盖。`git diff --check` 对本次涉及的根文档和索引无空白错误。

## 2026-10-09 · 一张完整总览图

目的：把四项能力、调用与底层技术、结果边界和对后续独立开发的意义汇总为单张可保存图片。

参考：沿用固定提交与既有官方文档，补充阅读 MDN CORS，核实浏览器跨站读取限制。开发架构、推进顺序、结果可信度和工程改进属于本项目独立建议，与原库事实在图中分别标注。

过程：先通过内置 imagegen 生成信息图；请求返回 `image generation failed: network error: error sending request`，没有得到可用图片。失败尝试提示词保留在 `assets/ghosttrack-overview-prompt.txt`。随后采用原创 HTML 技术图解并通过 Chrome / Playwright 导出 PNG，没有修改、编辑或使用失败的 AI 图像输出。

文件：`assets/ghosttrack-overview.html` 是可编辑排版源，`assets/ghosttrack-overview.png` 是最终图片，`assets/ghosttrack-overview-content.md` 保存文字与可点击来源。图有六个主要部分、四项能力矩阵和六项开发意义，注明完整研究 SHA、日期和未做上游实测的边界。

导出命令（在 web/，Playwright 来自工作区已有 1.60.0 安装，仅作为绘图工具）：

```powershell
node scripts/render-overview.mjs --playwright F:/codex_project/1008_codex_project/projects/005-threejs-game-skills/experiments/scaffold/node_modules/@playwright/test/index.mjs
npm.cmd run build
```

检查：图像宽度 2160px；渲染验证四个能力行、六个部分和六个意义项，文字没有越出所在区域，浏览器脚本错误为 0；已查看完整导出图。第一次布局检查将跨节点箭头误算成溢出，改为测量文本边界后通过。网页首屏新增完整总览图链接，构建产物包含图片、可编辑源和文字稿。

最终原图为 2160 × 3853。新增图解后再次运行索引生成与根 `npm.cmd run check`，11 个现有项目检查通过；保留其他项目同期变化。

## 尚未验证的上游状态

IP 在线接口的运行稳定性、具体号码元数据覆盖情况、各用户名网址当前有效性未实测。上述状态不阻碍本次源码汇总任务，也不被写成已验证能力。

## 2026-10-12 · 完整理解、原图复用与统一发布

扩展十二项摘要、六段图前介绍、八个分析模块、六类场景、六项价值、四条独立实现路线、三步推进与八项扩展。扩展明确为规划，研究网页不执行真实查询。根索引、网页和统一站点使用一致摘要；原图完整字节保持不变，新增可缩放阅读及 Markdown / JSON。

重新获取固定提交原始 GhostTR.py（仅保存在忽略的缓存，未打包或提交），确认315行；修正历史研究的函数行号，能力结论不变。复核主要官方文档，未运行上游真实查询。原始总览图 SHA-256：e740c55e3b86231aa15e1bd31356c6e593723f6be287bbf37f4c51922d61283c。

本地核验使用 Node.js22.15.0、系统 Chrome 与已有 Playwright。独立构建、内容审计、根 npm run check 和15项 npm test通过。统一构建首次因004本地缺少marked依赖失败；按其锁文件独立安装后重新聚合通过，003与001使用已有完整产物（--pack-only），005三款游戏重新独立构建。统一校验覆盖九项目、原图、下载与既有资源；CI发布会执行完整构建。

真实浏览器核验四能力、键盘、刷新/后退、23个平台名称、原图尺寸、100%/适合宽度/滑杆与真实下载哈希、390/320手机、200%字号、无脚本正文；无脚本异常或外部查询请求。320px首屏来源摘要固定最小宽度导致溢出，已修正并复验。记录见src/local-browser-checks.json，实际截图在assets/publication/。


首次 GitHub Pages 运行38232724055完成构建与部署，catalog运行38232724005也成功。随后32个公开HTTPS资源/入口核验通过，在线真实浏览器原图下载、缩放、能力/键盘/刷新/后退、390/320px、200%字号与无脚本检查通过，无脚本错误和外部查询请求。核验后登记demo，结果见src/publication-verification.json、public-http-checks.json、public-browser-checks.json。
