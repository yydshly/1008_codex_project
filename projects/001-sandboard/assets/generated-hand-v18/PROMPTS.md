# v18 手部素材生成记录

- 工具：内置 `image_gen.imagegen`，imagegen 技能默认模式，未调用 CLI 或外部图像 API。
- 日期：2026-10-09；参数：`transparent_background: true`，全新生成，没有参考图或用户照片。
- 原始返回：`D:\codex\home\generated_images\01a11a02-876b-77f2-a0e9-9aa82ea47e4c\exec-ea559630-f357-4c55-b571-7fc6104f5c61.png`。
- 项目内原样副本：`hand-release-atlas.png`，1536 × 1024，RGBA，三列两行，每格 512 × 512。未在 Python 中修图；程序通过纹理采样、二维过渡和前臂延展使用原始素材。
- SHA-256：`0234BEE76780BD890E9A6B41217EE268425E860EA61A35F8535226D5359D4137`。

## 完整提示词

```text
Create a photorealistic production SPRITE ATLAS for a web sand-art animation, on genuinely transparent alpha background. This is an asset sheet, NOT a poster, not a finished sand painting, no table or sand anywhere. Layout: exactly 3 columns by 2 rows of six equal rectangular cells, no lines, no labels or text. Each cell contains THE EXACT SAME realistic adult right hand and connected short forearm, consistent anatomy, skin tone, fine pores, subtle knuckle creases, natural short fingernails, faint veins. No jewelry, no sleeve. Camera is a FIXED overhead sand-table camera, looking straight down at the BACK of the hand, hand back toward camera and palm facing down toward the table. Forearm enters from the bottom center of EACH cell, cropped exactly at the cell bottom; curled fingertips point toward the top of the cell. The hand occupies the upper-middle of each cell, comfortable clean empty margins on both sides. Keep wrist placement and overall scale aligned precisely across all cells. Warm soft lightbox bounce from beneath, restrained soft neutral overhead fill revealing real skin texture; no baked cast shadow outside hand, no dramatic rim or plastic glossy skin. Show sequential frames of a natural SMALL cupped release of sand: top-left frame relaxed loose closed grip, top-middle a slight opening between thumb and curled index, top-right fingers partly relaxing, bottom-left fingertips relaxed slightly further, bottom-middle open loose cupped hand with naturally bent fingers, bottom-right relaxed slightly more open cup. Fingers remain gently curved and anatomically plausible, never a flat spread palm; total motion small and smoothly progressive. Every frame has exactly five anatomically correct fingers, consistent finger lengths and no fused or extra fingers. The release gap is between thumb and curled index near the upper left of hand; do not depict literal sand so the engine can emit simulated sand itself. Each hand is photographed with documentary realism, not an illustration or 3D render. Transparent negative space between all shapes. The sheet must be suitable for Canvas source rectangle animation, equal cells, no overlap.
```

提示词是生成要求，不代表质量均已达到。姿态间存在细部差异；透明通道已实际读取核对，非零 alpha 像素约占 27.8%，大部分非手部区域透明。素材未声明为实拍或特定真实人物。
