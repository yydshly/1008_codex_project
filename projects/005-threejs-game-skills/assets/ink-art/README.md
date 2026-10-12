# 竹影问剑第二版游戏美术

2026-10-09 使用 Codex 内置 image_gen 制作的原创游戏素材。参考上游固定提交的 threejs-image-generator 素材检查方法，实际没有调用其 Gemini、Tripo 或 ElevenLabs 服务。提示词保存在 [prompts.json](prompts.json)。本目录的生成图不是游戏截图；项目的 ink-active.png 等截图来自实际 Three.js 渲染。

| 运行文件 | 用途 | 生成任务 |
| --- | --- | --- |
| scene-v2.png | 干笔山水、竹林与石台背景 | exec-55e5959e-54ac-4975-8e8c-9fc8538c1734 |
| hero-atlas-v3.png | 斗笠剑客待机、移动、格挡、闪避、受击 | exec-2c09d861-c3d2-4b09-8597-3c9ffb405c3c |
| enemy-atlas-v3.png | 三位对手各自待机、蓄力、出剑姿态 | exec-ec3d4756-8b5f-4ac8-a4cf-d9d250e80c22 |
| hero-attack-v4.png | 单独完整出剑姿态 | exec-213cadd1-f1db-4b9a-a837-07f6d89c733e |

共六次生成或编辑。初版两张图集以及后续英雄攻击格出现跨格刀尖，不能直接按等分网格使用；保留 hero-atlas-v2.png、enemy-atlas-v2.png 作为过程记录。英雄攻击最后改用单独姿态文件。其余姿态仍需显式取样范围与脚底锚点；透明区域 RGB 可能有颜色，但实际 alpha 为零，不能仅凭图片查看器的背景判断透明度。

生成图经运行时 UV 选帧、脚底定位、轻微衣摆变形及状态特效进入游戏，属于绘画贴片的 2.5D 表现。没有骨骼绑定、连续手绘逐帧动画或真实三维人物。这些原创生成素材不冒用上游 MIT 素材许可；上游模板代码仍按项目 LICENSE.upstream 署名保留。
