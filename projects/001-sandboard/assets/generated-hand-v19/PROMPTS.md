# v19 手部素材生成记录

- 生成方式：内置 imagegen；透明背景参数为 true，无参考照片。
- 用途：沙台演示的手部源素材；不是实拍，也不是生成的成画或过程视频。
- 选用输出：`hand-pinch.png`（保留原始 RGBA，不离线涂改或拉伸）。
- 原始输出：`D:/codex/home/generated_images/01a11a02-876b-77f2-a0e9-9aa82ea47e4c/exec-f810cb89-30f7-4a74-92c2-658bbc1643b2.png`。
- 下列文字是生成要求，实际解剖、轮廓与动作需要独立验收。

## 完整提示词

```text
Use case: photorealistic-natural
Asset type: transparent PNG hand cutout for a controlled sand-art animation.
Primary request: one extremely realistic adult right hand and a long continuous forearm, seen directly from a fixed overhead camera, the BACK of the hand facing the camera, the thumb on the left, fingers pointing upwards. The hand gently cups a small invisible handful of fine sand with the fingers bent, and the thumb and index finger nearly meeting to form a narrow release gap. The small gap must be clearly visible with transparent background between the thumb and index, not sand painted on skin.
Composition: a single hand only, portrait 1024x1536 composition. The hand and fingers occupy the upper 40% of the image, wrist around 45%, long natural untapered-to-a-stick forearm occupies the rest and continues off the bottom edge. Full fingertips included, plenty of transparent margin at sides and above. Keep correct proportions: no stretched arm texture. Forearm should gradually broaden towards the bottom.
Lighting: restrained soft upper-left studio key plus very subtle warm diffuse upward fill as if above a warm sand-art light table. Neutral natural skin, realistic pores, short clean fingernails, tiny asymmetry, visible fine arm hair and irregular pigmentation. No beauty smoothing or plastic skin. Crisp finger silhouette with clean alpha edge.
Constraints: single anatomically credible human right hand, exactly five fingers in naturally curled positions. Real transparent background everywhere outside the hand, including finger gaps; no shadow baked into background, no halo, no tabletop, no sand, no particles, no jewelry, no sleeve, no text, no watermark, no grid, no multiple poses. This is a source sprite, not a finished scene.
```
