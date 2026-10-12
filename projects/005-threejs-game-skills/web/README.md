# Three.js 游戏技能中文展示页

原生 HTML/CSS/JavaScript，无第三方运行依赖。真实截图与通关录像在项目 assets/，模板在 experiments/scaffold/，原创暴风港在 experiments/storm-harbor/，水墨剑客在 experiments/ink-swordsman/；能力数据统一维护于 content.js。

先分别在 ../experiments/scaffold/、../experiments/storm-harbor/ 和 ../experiments/ink-swordsman/ 完成 npm.cmd ci 与 npm.cmd run build，然后执行：

```powershell
npm.cmd ci
npm.cmd run research:docs
npm.cmd run build
npm.cmd run preview
```

访问 http://127.0.0.1:4191/1008_codex_project/005-threejs-game-skills/ ，模板在同路径的 starter/，原创运输游戏在 play/，水墨剑客在 ink/。产物为 dist/，完整包括图片、录像、研究数据、画布证据、三款独立游戏和许可。资源使用相对路径；play/、ink/ 可直接访问和刷新，通过 ../ 返回研究页。

`npm.cmd run dev` 会先构建再在 `http://127.0.0.1:4191/` 提供完整产物；源文件修改后重新启动，无热更新。可用 `npm.cmd run dev -- --port 4192` 指定另一个端口。

展示区分已运行、源码确认和未验证的外部能力。页内试玩按需载入一款作者游戏，返回截图释放资源；无法嵌入时可打开作者原站。未来统一发布复制完整 dist/；当前本地展示，索引 demo 为空。
