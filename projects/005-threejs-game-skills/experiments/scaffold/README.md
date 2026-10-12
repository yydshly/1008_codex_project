# 上游内置起始工程的本地复现

源码来自 Majid Manzarpour / threejs-game-skills 的 `8286774b22a2566bf894dbc825825c16921866af`，原路径 `skills/threejs-gameplay-systems/assets/threejs-vite-game/`，由原 create_threejs_game.py 生成，MIT 文件保留于 LICENSE.upstream。

玩法保持上游实现：移动、冲刺、收集八个物品、计分、镜头、碰撞、音效与触控。这里是附带模板，没有使用全部九个技能重新生成游戏。

修改：包名改为 scaffold；Vite 添加相对 base；Windows / npm 10.9.2 下修复锁文件的 @emnapi 可选依赖不一致。未增加或改写玩法。

2026-10-12 发布整理：重新 npm ci 时报告构建链四项 high 级已知问题；在既有依赖兼容范围内执行 npm audit fix，更新锁定依赖，随后 npm audit 为零。三个游戏重新独立构建，并核查公开子路径。上游模板玩法与源文件继续保留。

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

独立预览为 http://127.0.0.1:4188/ 。主展示复制 dist/ 到 starter/，通过主展示子路径访问。

WASD / 方向键移动，Shift 冲刺；手机使用触摸摇杆与冲刺按钮。研究保留 debug/test 接口；正式交付应按上游建议门控这些接口。
