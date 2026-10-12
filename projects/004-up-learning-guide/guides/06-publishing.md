# 网站、双语与电子书：实际实现原理

[返回概览](../README.md) · [研究来源](../SOURCES.md)

Up 是以 Markdown 为中心的内容出版项目。其代码把书稿组织成双语静态网站和离线电子书，并提供阅读与工作纸交互。学习状态、训练结果和 AI 协作由读者执行和保存；站点没有提供账户、课程数据库或模型推理后端。

## 一、内容与导航是共同输入

[`navigation.mjs`](https://github.com/byoungd/up/blob/35e2aa9ad3a076fe4e8405877cc560df2593838f/docs/.vitepress/navigation.mjs)统一保存中英文分组、页面路径与出版属性。它同时服务侧栏、语言对应、目录同步与 EPUB 选页。中文与英文各 97 页，当前出版选择各 80 个源页；下载中心、历史归档和技术词表留在网页。

Markdown 前置元数据记录标题、摘要、更新时间，部分页面注明来源核对日期和工作纸信息。上游使用同步脚本维护导航、词表、公共资源、README 与可下载模板，减少同一内容在不同入口漂移。

这些日期是作者维护记录，不意味着每个外链在本研究日期仍有效，也不能替代阅读原始来源。

## 二、网页构建与路由

[`config.mts`](https://github.com/byoungd/up/blob/35e2aa9ad3a076fe4e8405877cc560df2593838f/docs/.vitepress/config.mts)配置 VitePress、中文根路径和英文 `/en/`。构建基路径为 `/up/`，开启 clean URLs；README 等文件重写成页面入口，历史路径和部分旧锚点有兼容处理。语言切换根据配对路径连接对应页面；SEO 设置包括 canonical、hreflang、页面元数据和 sitemap。

因此若复制到另一个仓库或子路径，需要重新核对 base、下载地址、路由重写、资源与 SEO 地址，不能仅改域名。

主题继承 VitePress 默认主题，加入工作纸操作、阅读进度和本地化无障碍标签。图片处理使用 sharp 读取尺寸，支持懒加载和稳定布局；项目还对不应公开的会话资源设置开发访问与构建输出保护。

## 三、搜索并非全部内容逐字入库

网站使用 VitePress 的本地搜索与 MiniSearch，构建时生成索引，浏览器在本地搜索。代码排除代码块和参考文献区，并按内容预算对部分页面采取标题级或 H1/H2 级索引。

这是搜索体积与浏览器开销的取舍。因此能够按主题找到页面，不等于所有章节、模板字段和正文中的每个词都可被检索；完整内容还需进入相应页面阅读。

## 四、工作纸复制与下载

[`WorksheetActions.vue`](https://github.com/byoungd/up/blob/35e2aa9ad3a076fe4e8405877cc560df2593838f/docs/.vitepress/theme/WorksheetActions.vue)读取页面的工作纸 URL 与文件名。点击复制后获取静态 Markdown，通过浏览器剪贴板接口复制；按钮有加载、成功和失败状态，路由变化会取消尚未完成的请求。下载链接提供复制不可用时的出口。

这里复制的是可填写文件文本。组件没有实现在线填写、用户身份、学习数据库、云同步或 AI 调用，也没有替用户保存长期学习状态。

## 五、阅读进度与无障碍

[`ReadingProgress.vue`](https://github.com/byoungd/up/blob/35e2aa9ad3a076fe4e8405877cc560df2593838f/docs/.vitepress/theme/ReadingProgress.vue)根据正文区域起止点与滚动位置计算比例，将结果限制在 0–1；利用动画帧与尺寸观察更新。它表示当前页面的滚动位置，没有把“读到多少”认证为“学会多少”，也没有提供跨设备持久记录。

本地化标签组件处理部分 ARIA 标签、焦点与搜索结果状态。上游测试使用 Playwright 和 axe 检查部分浏览器流程与可访问性。源码存在这些保护与测试，不等于本研究已经重跑并验证全部行为。

## 六、EPUB 如何生成

[`build-epub.mjs`](https://github.com/byoungd/up/blob/35e2aa9ad3a076fe4e8405877cc560df2593838f/scripts/build-epub.mjs)选择导航中标为出版内容的页面，使用 Markdown 渲染能力整理为 XHTML，处理内部链接、图片和资源，再生成目录、阅读顺序与 OPF 元数据，打包为 EPUB 3.3。

Manifest 保存章节数、文件大小、内容来源与成品 SHA-256。检查模式用于判断现存成品是否和当前选页、来源与构建逻辑匹配；标准检查是另一条验证路径。电子书不是对所有网页简单截图，在线归档与词表没有进入当前正文选页。

## 七、PDF 如何生成

[`build-pdf.py`](https://github.com/byoungd/up/blob/35e2aa9ad3a076fe4e8405877cc560df2593838f/scripts/build-pdf.py)消费 EPUB 内容，使用 ReportLab 排版，配合 Pillow 处理图像、pypdf 检查与整理 PDF。中文需要相应字体，输出含目录/书签、链接与出版元数据。

检查不只比较文件字节，也有来源、语义和版面相关检查。PDF 的页数取决于固定字体、版式和版本，不能把页面字数、章节数与 PDF 页数混成一个指标。

## 八、当前下载页有可确认的元数据差异

固定提交的 `docs/book-downloads.md` 仍写中文 PDF 396 页、英文 451 页、EPUB 76 章及旧哈希；同提交的成品 manifest 记录如下：

| 成品 | Manifest 记录 | 实际文件 SHA-256 |
| --- | --- | --- |
| 中文 EPUB | 80 个选入源页，2,764,945 字节 | `551dbc5de13d4775162ec35b07cdbe9c91e3379fc6e29747043ab3ba5d664393` |
| 英文 EPUB | 80 个选入源页，2,734,171 字节 | `8deeb3d4839fc5ef9144c10078f106eac681d4b427f38d51500c400c17682787` |
| 中文 PDF | 80 个选入源页，418 页，5,044,959 字节 | `1b1642a64690de2c017612060b50c0f68dcb9e4e827c8eb4b6debdcc51dd251b` |
| 英文 PDF | 80 个选入源页，479 页，4,184,166 字节 | `0a6de0eef34cc56274c19a265d1843259b0d80b62d5d51d54c3b88af27f145d3` |

本研究实际计算了这四个已有文件的 SHA-256，均与 manifest 一致；PDF 页数按 manifest 转述，未独立解析每页，也未重新排版。这个差异说明下载页面说明未完全跟上成品版本，不代表电子书生成已经失败。

来源：[下载说明](https://github.com/byoungd/up/blob/35e2aa9ad3a076fe4e8405877cc560df2593838f/docs/book-downloads.md)、[EPUB manifest](https://github.com/byoungd/up/blob/35e2aa9ad3a076fe4e8405877cc560df2593838f/docs/public/downloads/epub-manifest.json)、[PDF manifest](https://github.com/byoungd/up/blob/35e2aa9ad3a076fe4e8405877cc560df2593838f/docs/public/downloads/pdf-manifest.json)。

## 九、依赖、检查与发布链

研究提交的 [`package.json`](https://github.com/byoungd/up/blob/35e2aa9ad3a076fe4e8405877cc560df2593838f/package.json)声明 Node.js `>=24 <25`。VitePress 1.6.4 是网站核心；Vue、Vite、sharp、Markdown 处理工具、Playwright 与 axe 分别承担交互、构建、资源、出版与测试。版本以该提交的 lockfile 为准。

上游命令职责如下：

| 命令 | 源码配置的职责 |
| --- | --- |
| `docs:dev` / `docs:preview` | 本地开发和生产预览 |
| `docs:build` | 静态构建并检查 bundle 体积 |
| `sync:content` | 同步导航、词表、公共资源、README、工作纸和 EPUB |
| `sync` | 内容同步后再生成 PDF |
| `check` | 内容测试、同步一致性、内容规则、Markdown 格式、EPUB 与 PDF 现存产物检查 |
| `book:validate` | EPUB 标准检查 |
| `test:smoke` | Playwright 浏览器测试；不会仅因执行 `check` 自动运行 |

[`deploy.yml`](https://github.com/byoungd/up/blob/35e2aa9ad3a076fe4e8405877cc560df2593838f/.github/workflows/deploy.yml)在 Node 24 与 Python 3.12 环境安装锁定依赖，执行检查和静态构建，再上传到 GitHub Pages；还有部署后的页面、版本和下载格式核对。其他维护脚本处理外链、资源、图片元数据和出版一致性。

本子项目只进行了内容/源码阅读、覆盖扫描与已有成品哈希核对。没有安装上游依赖、运行其 Node 24 构建、完整浏览器测试或发布；因此不把脚本存在写成执行通过。

## 十、许可与复用方式

上游内容与代码使用不同许可。正文、翻译、原创图示和工作纸等按 CC BY-NC 4.0；网站配置、主题、构建、测试与 CI 等按 MIT。第三方图片和媒体保留各自权利说明，另看上游 ATTRIBUTIONS。

复用文字需保留作者、来源、许可及改动说明；商业使用不能从 MIT 的代码许可推到正文内容。复制图像也不能仅凭正文许可推定所有第三方素材已授权。本研究保留上游三份许可文件，详细映射见[来源与许可](../SOURCES.md)。
