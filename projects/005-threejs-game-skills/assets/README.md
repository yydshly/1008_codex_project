# 真实截图与素材来源

## 能力与实践总览图

新增 [capability-overview-v1.png](capability-overview-v1.png)，1024×1536，2,749,197 字节。使用 Codex 内置 image_gen 一次生成，以两张作者成品和三张我们的实验截图为视觉参考，整理定义、原理、九类能力、约束、实践、场景和个人价值。它是重新排版的解释性信息图，原始截图与真实输入录像分别保留，不作为对照实验证据。提示、参考、生成记录和署名见 [overview/README.md](overview/README.md) 与 [overview/provenance.json](overview/provenance.json)。

网页整合的实际截图：`overview-web-desktop.png` 为 1280×900 桌面总览，`overview-web-mobile.png` 为 390×844 手机视口，`overview-web-comparison.png` 和 `overview-web-comparison-mobile.png` 为桌面／手机前后对照章节。均由 Codex 内置浏览器实际捕获，未生成或合成；手机视口不代表真机测试。

## 原始截图与实际录像

作者五个在线演示署名 Majid Manzarpour，来自 https://github.com/majidmanzarpour/threejs-game-skills 的 README。于 2026-10-09 直接截图，未生成或合成，用于署名研究说明。暴风港为本实验依据固定提交技能开发的原创程序化游戏，没有复制这五款游戏的资产；以下画面与录像同样来自实际运行。

| 文件 | 来源 | 状态 |
| --- | --- | --- |
| ridge-drift.jpg | https://ridgedrift.netlify.app/ | 起跑后的比赛场景 |
| snooker-arena.jpg | https://snookerarena.netlify.app/ | 球桌与击球控制 |
| starship-dogfight.jpg | https://starshipdogfight.netlify.app/ | 单人第一波，六个敌人 |
| tide-singer.jpg | https://tidesinger.netlify.app/ | Sunlit Shallows 第一关 |
| ripcore.jpg | https://ripcore.netlify.app/ | 快速对战准备 |
| scaffold.jpg | 本地固定上游模板 | 收集物品小游戏 |
| cover.jpg | 本地中文展示页 | 总索引封面 |
| mobile.jpg | 本地中文展示页 | 手机视口验证 |
| scaffold-mobile.jpg | 本地固定上游模板 | 390 × 844 视口中操作虚拟摇杆后收集 1/8；指针输入，非真实手机 |
| harbor-active.png | 本地暴风港生产构建，画布检查脚本截图 | 种子 42 的出航画面；修正信号可读性后，1280×720；状态钩子用于冻结截图 |
| harbor-mobile.png | 本地暴风港生产构建，画布检查脚本截图 | 出航 / 摇杆布局，390×664，DPR 1.5；非真实手机 |
| harbor-won.png | 本地暴风港真实键盘测试截图 | 三次返航交付 6/6；没有注入进度，剩余 105 秒，艇体 2/4 |
| harbor-input-run.webm | 本地暴风港完整 Chromium 测试录屏 | 真实键盘、暂停恢复、完整路线与通关；约一分钟，未合成 |
| harbor-active.jpg | 本地暴风港初版手动试玩 | 信号颜色修正前的留档；用于定位雾与色调映射问题，不作最终封面 |
| harbor-research.jpg | 本地整合后的中文研究页 | 首屏真实使用章节、场景与试玩入口 |
| harbor-research-mobile.jpg | 本地整合后的中文研究页 | 手机宽度阅读，无水平内容溢出；非真实手机 |
| harbor-delivery.jpg | 本地完整子路径 play/ 的手动试玩 | 真实按键拾取、返航交付 1/6 后暂停；整合入口与资源引用确认 |

在线部署 commit 未知。源码 MIT 保留于 ../src/LICENSE.upstream；独立游戏素材不自动受该许可证覆盖。保留署名、来源和有限研究截图，没有打包五款成品的完整资产。

## 竹影问剑 · 第二次制作实验

第一版为本实验原创程序化纸纹、场景与关节剑客。第二版按用户风格反馈使用内置 image_gen 制作真实游戏素材，再接入战斗；生成图、调用记录和提示词见 [ink-art/README.md](ink-art/README.md)。下表现行截图与录像来自第二版实际运行，第一版封面、手机截图和录像以 ink-v1-* 名称保留。

| 文件 | 实际来源与状态 |
| --- | --- |
| ink-active.png | 最终生产 WebGL：竹间客蓄力，1280×720；状态设置与冻结仅用于画面验收 |
| ink-mobile.png | 最终生产 WebGL：390×664 手机布局，DPR 1.5；非真实手机 |
| ink-counter.png | 最终生产 WebGL：接招失衡与双方中点格挡闪光；状态设置用于截图 |
| ink-heavy.png | 最终生产 WebGL：第三阵墨影重斩预告；状态设置用于截图 |
| ink-won.png | 最终真实键盘三轮通关，六次接招；没有设置通关进度 |
| ink-input-run.webm | 最终 Chromium 真实键盘测试录屏，包含暂停、移步、六次接招和三阵通关；未合成 |
| ink-research.png | 完整发布子路径中的中文研究页，展示第二款游戏与入口 |
| ink-integrated.png | 完整 ink/ 子路径中实际开始、闪避后暂停的界面 |
| ink-integrated-mobile.png | 第二版完整 ink/ 子路径 390×844 实际开始画面，文档宽度 390，无溢出；非真实手机 |
| ink-attack.png | 第二版生产 WebGL 完整攻击姿态与笔触刀弧，QA 状态冻结截图 |
| ink-research-mobile.png | 完整研究页 390×844 视口截图，图文与试玩入口可读，无文档横向溢出；非真实手机 |
