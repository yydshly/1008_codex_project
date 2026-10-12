# 暴风港实测证据

2026-10-09，固定上游提交 `8286774b22a2566bf894dbc825825c16921866af`，种子 42。本报告分别记录玩法行为、实际输入和画面检查，三者互补。

## 实际输入与循环

| 检查 | 实际结果 | 原始证据 |
| --- | --- | --- |
| 完整真实键盘航线 | 从菜单出航，经暂停恢复、三次返航交付 6/6；3626 帧推进，航程 218.95，首批交付在模拟 10.03 秒；剩余 104.70 秒，艇体 2/4，软锁窗口 0，浏览器错误 0 | bot-playtest.json；input-win.png；项目 assets/harbor-input-run.webm |
| 危险与重开 | 实际键盘追撞巡逻机，模拟 7.7 秒后艇体 0 触发失败；点击再次出航后艇体 4，交付 0，剩余 149.97 秒 | fail-retry.json |
| 手机布局摇杆 | iPhone 13 Chromium 视口，真实指针拖动摇杆，z 从 10 到 1.586，实际拾取一枚；释放后速度约 0.000013 | mobile-input.json / mobile-input.png |
| 暂停与设置 | 桌面暂停期间倒计时冻结，恢复后可继续推进；手机布局可切换静音与减少动态，宽度无水平溢出 | tests/harbor.spec.ts；mobile-settings.png |
| 模拟行为 | 七项通过：响应 / 暂停、两枚交付 / 修复 / 阶段、完整路线、热量 / 冷却、EMP / 冷却、碰撞失败 / 清理、最终交付 / 超时 | simulation-tests.json；scripts/test-simulation.mjs |

真实键盘通关测试没有调用 setState 或直接增加交付；输入使用键盘事件，读取诊断寻找航点，并测量进度、移动与软锁。模拟测试执行生产用的同一个 Simulation，不代替浏览器输入测试。

最终完整路线执行 `npm.cmd test -- --project=desktop-chrome --grep "真实键盘"`：**1 passed，57.9 秒**。此前失败重开和手机摇杆各自通过（该批 2 passed、1 failed、3 skipped），三个所需场景均取得通过证据。没有把设备不适用而跳过的项目算作通过。全套命令 `npm.cmd test` 可重复执行。

## 画面与实测渲染

实际运行上游画布检查脚本和上游证据检查器，六份报告均 PASS，runId `storm-harbor-pass-1`，无控制台 / 页面错误。硬件报告为 Intel UHD、ANGLE / Direct3D11，`softwareRendered=false`。

| 实际检查状态 | CSS 视口 | Draw calls | 三角形 | Geometry | Texture | DPR |
| --- | --- | --- | --- | --- | --- | --- |
| 桌面出航 | 1280×720 | 69 | 29,032 | 68 | 3 | 1 |
| 桌面装满返航 | 1280×720 | 65 | 28,504 | 74 | 3 | 1 |
| 桌面后期三架巡逻 | 1280×720 | 70 | 29,544 | 86 | 3 | 1 |
| 桌面胜利 | 1280×720 | 55 | 28,776 | 82 | 3 | 1 |
| 手机出航 | 390×664 | 49 | 27,784 | 48 | 3 | 1.5 |
| 手机失败 | 390×664 | 49 | 27,784 | 48 | 3 | 1.5 |

数值来自当前截图状态的 renderer.info；最大发现值为 70 次调用 / 29,544 三角形。不是整个游戏所有时刻的绝对上界，也没有测量 FPS。六份报告符合上游默认起点预算；预算通过和画布非空不自动证明美观或流畅。状态截图通过明确 QA 钩子设置，再冻结拍摄，因此它们证明对应状态的可见布局，通关证明另见实际输入记录。

手机画布检查为上游脚本的 390×664；指针试玩另采用 iPhone 13 配置 390×844、设备像素比 3（游戏将渲染 DPR 限制为 1.5）。二者均使用桌面 Chromium，未验证 iOS Safari、真实多指触控或手机 GPU。

人工检查桌面出航、手机出航、真实输入胜利和暂停设置截图：能源 / 基地为青绿，危险为珊瑚红；主目标、艇体、计时、装载可读；手机布局保留独立摇杆和动作按钮。实际手动浏览器试玩也完成过一次拾取 → 返航 → 交付 1/6。

整合发布路径 `/1008_codex_project/005-threejs-game-skills/play/` 实际打开正常，按 W 拾取、S 返航后 HUD 交付 1/6、装载 0/2，Esc 暂停正常，研究页返回链接正确。研究页新增章节在手机宽度下可读且无水平内容溢出，录像播放器已实际播放。整合验证截图位于项目 assets/harbor-delivery.jpg、harbor-research.jpg、harbor-research-mobile.jpg。根仓库 `npm.cmd run check` 通过。

## 问题与修正

1. 初始真实画面中能源、基地和巡逻信号被雾与 ACES 色调映射冲淡。修改信号材质为不受两者影响的共享 Basic 材质，添加小型灯标和返航箭头。保留环境雾、照明和实际碰撞规则。上述六份报告与截图均在修正后的生产构建采集。
2. 集成时 Escape 曾被 UI 和 Game 双重处理。改为 UI 独占 Escape，Game 处理 P；真实暂停恢复测试通过。
3. 第一批自动键盘航线在第一个航点超过循环上限，失败时截图已经拾取一枚。未取得当时的完整诊断，不能确定根因；增加失败位置 / 模式 / 焦点记录，原游戏与航线不作进度绕过，复测真实输入完成 6/6。浏览器 / GPU 竞争会影响机器人按墙钟时间采样的稳定性，是需关注的复现条件，非本次已证实原因。
4. 通关后的录像导出曾停留在测试上下文释放前。改为由测试运行器完成上下文释放，再从已完成的 video.webm 复制录屏；最终测试退出 0 并生成截图与录像。没有把仅写出部分报告视为完整测试通过。

## 重现命令

在 experiments/storm-harbor 执行：

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run test:simulation
npx.cmd playwright install --no-shell chromium
npm.cmd test
# 保持 npm.cmd run preview 运行后：
npm.cmd run verify:visual
python ../../upstream/skills/threejs-game-director/scripts/check_evidence.py . --manifest artifacts/evidence.json
```

strict TypeScript 与 Vite 生产构建通过。主 JS 约 596 kB（gzip 156 kB），保留模板的 chunkSizeWarningLimit 900 kB 设置；本实验为单入口短游戏，没有额外加载整套作者成品。画面不使用后处理，渲染 DPR 桌面上限 2 / 手机 1.5。

仍未验证：同模型对照的净收益、真实手机性能和 Safari、声音听感与跨浏览器音频行为、外部素材生成服务、GitHub Pages 在线部署。此次结论是“能真实应用技能制作并验证新的小游戏”。
