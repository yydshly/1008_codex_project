# 独立来源与覆盖检查

[项目概览](../README.md) · [来源与许可](../SOURCES.md)

`inspect-upstream.mjs` 是本项目独立编写的研究脚本，只使用 Node.js 标准库，不执行上游构建或修改其文件。

将上游 checkout 固定到 `35e2aa9ad3a076fe4e8405877cc560df2593838f`，从研究总仓库根运行：

```powershell
node projects/004-up-learning-guide/src/inspect-upstream.mjs <上游checkout绝对路径>
node projects/004-up-learning-guide/src/verify-research.mjs <上游checkout绝对路径>
```

输入为上游导航和文稿，以及本地 `sources/summaries.json`。脚本核对 commit、中文/英文路径对应、全部摘要与专题文件存在，计算文件哈希，提取标题、来源日期、Markdown外链和十组词表。

输出到 `sources/`：`inventory.json`、`coverage.md`、`resources.json`、`resources.md`、`word-lists.json`、`word-lists.md`。生成文件依据明确输入，可重复运行；手写摘要和专题不被覆盖。

`verify-research.mjs` 检查本项目 Markdown 本地链接、固定版本GitHub文件链接、目录条数、词表数量，以及三份许可副本的字节哈希一致性。

这些脚本只检查覆盖、链接与输入一致性，不评价学习效果、英文翻译质量、外站可靠性或上游构建结果。研究版本更新时需先人工更新摘要与基线，再调整脚本期望commit。
