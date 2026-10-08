# 仓库协作约定

这是多个 GitHub 项目的研究总仓库。面向用户的文档默认使用中文。

- 开始工作时阅读根 README 与 `docs/PROJECT_GUIDE.md`；涉及 Web 发布时阅读 `docs/DEPLOYMENT.md`。
- 子项目放在 `projects/<编号>-<slug>/`，编号从 `001` 起顺延，已使用的编号不得修改或复用；归档项目保留登记和目录。
- `projects.json` 是首页项目索引的唯一数据源。优先用 `npm run project:add -- ...` 添加项目。
- 根 README 的 `PROJECT_INDEX:START` / `PROJECT_INDEX:END` 之间由脚本生成。修改元数据后运行 `npm run index:build`，其余首页说明可直接编辑。
- 每个子项目独立选择依赖与技术栈。根 `package.json` 仅用于索引工具，不作为所有实验的统一依赖清单。
- 记录原仓库 URL、研究提交或版本、许可证，以及自己改动的范围。引入上游代码或素材时保留相应署名与许可文件。
- 图片使用项目 `assets/` 内的真实素材，在索引填写替代文字和图注；仅登记已经可访问的演示链接。
- 新 Web 项目先验证独立构建、部署子路径与资源引用，再接入统一发布。不要将 API 密钥或本地 `.env` 纳入仓库。
- 完成修改后运行 `npm run check`；修改索引工具时同时运行 `npm test`。实验代码的验证由对应子项目说明。
