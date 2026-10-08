# 子项目目录

这里存放按顺序编号的研究项目。完整索引见[仓库首页](../README.md#项目索引)。

首个真实项目使用 `001-项目名`，之后依次为 `002-项目名`、`003-项目名`。编号保持固定；暂停的研究可改为“已归档”，仍保留其位置与来源。

在根目录运行以下命令即可创建目录、填充模板并登记索引：

```bash
npm run project:add -- --slug repo-name --name "项目名称" --upstream https://github.com/owner/repo --summary "一句话研究摘要"
```

每个项目都可以独立维护实验代码、依赖和 Web 演示；具体约定见[研究指南](../docs/PROJECT_GUIDE.md)。
