# 008 · GhostTrack 能力与原理研究

完整中文网页整理四项能力、八个分析模块、底层技术与数据来源、六类场景、六项开发价值、四条独立实现路线、八项扩展方向、结果边界及来源许可。沿用已有完整总览图，新增可缩放阅读与完整 Markdown / JSON 下载。

[完整理解与十二项摘要](UNDERSTANDING.md) · [发布方式与核验](PUBLICATION.md)

[返回总索引](../../README.md) · [原仓库](https://github.com/HunxByts/GhostTrack) · [研究笔记](notes.md)

## 研究基线

| 项目 | 内容 |
| --- | --- |
| 编号 | `008`，目录 `projects/008-ghosttrack/` |
| 原仓库 | https://github.com/HunxByts/GhostTrack |
| 完整 Commit | `a5cb8ad4c08acd803f166fb067b7dac724d6cb3d` |
| 上游提交时间 | 2024-01-11；2026-10-09 查询 `main` 得到该提交 |
| 版本 | README 标注 `2.2`，没有据此推断独立发行包版本 |
| 研究日期 | 2026-10-09（Asia/Shanghai） |
| 研究状态 | 本次能力汇总与网页整理已完成；不包含上游真实查询实测 |
| 上游许可证 | 固定提交未发现 `LICENSE` 文件，README 未声明标准许可证；源码头部有改写许可与署名要求 |
| 改动范围 | 独立中文研究文档、原创静态网页与构建/预览脚本；未复制或修改上游程序、图片 |
| 验证范围 | 固定源码审阅，以及本页的本地构建与交互；不代表原库外部接口和所有平台已实测可用 |
| 在线发布 | 接入 GitHub Pages；首次发布后核验公开 HTTPS 再登记 demo，见 PUBLICATION.md |

## 四项能力与对应原理

| 能力 | 原库实现 | 更底层的技术 | 结果边界 |
| --- | --- | --- | --- |
| IP 归属 | `IP_Track()` 调用 `ipwho.is`，解析 JSON | 服务商维护 IP 地理信息数据库，关联位置和网络组织 | 近似位置，无法确认设备 GPS、住址或人员身份 |
| 自己的公网 IP | `showIP()` 请求 `api.ipify.org`，展示文本 | 外部服务回显连接来源地址，受 NAT / 代理出口影响 | 网络出口地址，多台设备可能共享；没有自动地理定位 |
| 电话号码信息 | `phoneGW()` 调用 `phonenumbers` | 电话编号计划、号码模式与长度规则、前缀元数据匹配 | 归属信息非实时位置；Valid 非启用状态；携号转网影响运营商含义 |
| 同名账号线索 | `TrackLu()` 拼接预设网址，GET 后只检查 HTTP 200 | URL 命名规则、HTTP 请求与响应 | 200 可能来自登录页或提示页；同名不证明同一人 |

GhostTrack 主要编写了终端交互、函数调度、请求与库调用、结果输出。IP 服务的内部数据库和定位算法不在这个仓库中；电话号码规则随 `phonenumbers` 提供。四项查询彼此独立，没有手机号、IP、账号之间的身份关联流程。

网页可以切换四项能力；每项有输入/输出、调用路径、更底层的三条解释、适用场景、结果解读、源码局限和固定提交链接。下方还有封装关系图、结果含义对照表、许可信息及来源清单。此页用于阅读说明，不执行真实信息查询。

## 页面预览

![GhostTrack 中文研究网页：四项能力选择、IP 归属数据流与底层技术说明](assets/cover.png)

2026-10-09 本地生产网页真实截图，1440 × 1080；页面内容基于固定提交 `a5cb8ad4c08acd803f166fb067b7dac724d6cb3d` 的研究。截图为本项目页面，非上游工具的运行结果。

## 一图总览

[打开完整总览图](assets/ghosttrack-overview.png) · [可编辑图解源文件](assets/ghosttrack-overview.html) · [文字核对与参考来源](assets/ghosttrack-overview-content.md)

图中汇总上层封装、四项能力、底层技术和数据来源、输出与结果边界，以及后续独立开发的用途、架构和改进顺序。后续建议与原库现有功能分别标注。采用原创 HTML 图解，经浏览器导出高清 PNG，依据固定源码与官方文档整理，是技术原理示意图，不是运行查询截图。原始图片保存在本项目 assets/，网页嵌入完整原图，图前补全定位、能力、模块原理、价值与复用介绍；map.html 可以缩放、滚动阅读并下载。原图 SHA-256：`e740c55e3b86231aa15e1bd31356c6e593723f6be287bbf37f4c51922d61283c`。

重新导出图像时，使用已有的 Playwright 模块运行 `node web/scripts/render-overview.mjs --playwright <模块绝对路径>`；该工具只用于图像导出，不纳入网页运行依赖。第一次 AI 图像生成尝试因网络错误失败，没有使用任何 AI 图像输出；尝试的提示词保留在 `assets/ghosttrack-overview-prompt.txt` 供过程核对。

## 本地构建与访问

使用 Node.js 22 或更新版本。子项目无第三方构建和运行依赖，根 `package.json` 不增加任何网页依赖。

```powershell
cd F:\codex_project\1008_codex_project\projects\008-ghosttrack\web
npm.cmd run build
npm.cmd run check
npm.cmd run preview
```

访问 [GhostTrack 本地研究页](http://127.0.0.1:4195/1008_codex_project/008-ghosttrack/)。预览服务仅监听本机。

- 生产产物：`web/dist/`，包含静态 HTML、CSS、JS 与研究文档。
- 默认部署子路径：`/1008_codex_project/008-ghosttrack/`。
- CSS/JS/文档使用相对路径；`#ip`、`#public-ip`、`#phone`、`#username` 可直接打开和刷新。
- 无 JavaScript 时，四项说明依然可顺序阅读。
- 将整个 `dist/` 复制到静态托管子目录；本轮接入统一 GitHub Pages 发布，保留所有已发布项目。

已完成生产构建、完整子路径与相对资源访问、四项能力切换、方向键 / Home / End、片段直接打开和刷新、浏览器后退、手机布局（390px / 320px）、200% 字号、无 JavaScript 阅读检查。页面加载与切换未发出外部查询请求，浏览器无脚本错误。过程见研究笔记。

## 源码与已知限制

固定版本 [GhostTR.py](https://github.com/HunxByts/GhostTrack/blob/a5cb8ad4c08acd803f166fb067b7dac724d6cb3d/GhostTR.py) 中：

- IP 查询没有先检查接口 `success` 字段，地图链接把经纬度转为整数。
- 公网 IP 使用 ipify 的 IPv4 接口，未接入其 IPv6 或双栈接口。
- 电话号码默认解析地区为 `ID`，地理描述语言为印尼语；其他国家号码应提供完整国家码。
- 用户名平台有 24 个配置条目、23 个不同名称，Snapchat 重复一次；仅使用状态码判断，依次请求，一次异常会退出这一轮查询。
- 网络请求没有设置超时；依赖清单没有固定 `requests`、`phonenumbers` 版本。

这些是源码可确认的行为。IP 服务内部完整定位算法、用户名平台当前有效性，以及具体号码或 IP 的实际查询结果，本次未做运行验证。服务商文档描述和推断边界均在网页中另行说明。

## 来源与许可

- [上游固定版本](https://github.com/HunxByts/GhostTrack/tree/a5cb8ad4c08acd803f166fb067b7dac724d6cb3d)：仅链接与事实分析，没有引入原程序或素材，因此本项目不伪造上游许可证。
- [IPWHOIS.IO 文档](https://ipwhois.io/documentation)：数据库、接口、近似位置与字段含义。
- [ipify](https://www.ipify.org/)：来源 IP 回显、接口类型与开源实现入口。
- [IETF RFC 3022](https://datatracker.ietf.org/doc/html/rfc3022)：NAT / NAPT 与多个设备共享公网地址。
- [phonenumbers](https://github.com/daviddrysdale/python-phonenumbers) 和 [Apache 2.0 许可证](https://github.com/daviddrysdale/python-phonenumbers/blob/dev/LICENSE)：库与内置元数据说明；本页没有打包该库。
- [libphonenumber FAQ](https://github.com/google/libphonenumber/blob/master/FAQ.md)：编号元数据、Valid 的含义及携号转网。
- [Requests 文档](https://requests.readthedocs.io/en/latest/user/quickstart/)：跳转、响应、超时。
- [GitHub 许可证说明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)：源码公开与授权的区别。

本项目原创部分遵循研究总仓库的许可说明，暂未指定统一开源许可证。截图取自本项目真实网页，不使用上游图片。

## 2026-10-12 完整整理与发布

十二项摘要及六段图前介绍与根索引一致，详见 [完整理解](UNDERSTANDING.md)。新增内容区分原版功能、我们的研究网页交付与未来规划；本页没有新增真实查询服务。重新读取固定提交原始文件为315行，已校正函数源码行号，既有图不改动。完整发布和浏览器核验结果记录在本项目 src/ 与研究笔记。
