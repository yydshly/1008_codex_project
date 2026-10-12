# 研究代码与来源

整理和实验脚本为原创；upstream/ 是固定上游文本缓存，通过 .gitignore 忽略，不修改上游文件。

| 文件 | 用途 |
| --- | --- |
| collect_upstream.py | GitHub tree／raw 获取固定文本，输出路径、字节、SHA-256 |
| upstream-manifest.json | 来源校验清单、commit 和整理日期 |
| build_research.py | 全部 Skill、实际引用、展示名、分区全文、缺失引用 |
| mechanisms.py | 114 项原创原理与执行边界，依据 Skill 和工具核对 |
| build_facts.py | 核心事实、来源和固定一基行号；定位失败就停止 |
| verify_research.py | 原离线自检、RSS 正确 URI 实验、真实资讯过滤函数 |
| verify_public.mjs | 公开HTTPS资源、完整静态内容、114技能、原图哈希与已有项目路径核验 |
| publication-verification.json | 本次发布范围、构建与浏览器检查、远端部署状态 |
| LICENSE.upstream | Easel 原始 Apache-2.0 文本 |
| ATTRIBUTION.md | 来源与原创范围 |

Python 3.10+，整理与离线实验只用标准库；收集需要 GitHub 网络。网页构建直接用 JSON，不要求源码缓存。未在这里安装上游模型、FFmpeg、Chromium 和账号运行环境；离线通过不代表完整 Easel 已运行。
