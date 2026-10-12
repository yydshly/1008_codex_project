# v15 · 不同人物和姿态的照片输入

`sample-postcard.png`（1536 × 1024）由本轮内置 `image_gen` 工具生成，已复制进项目，原始输出保留于 Codex generated_images。没有使用 CLI、外部人物照片或艺术家作品。

这是明确标注的 AI 虚构**输入照片**；它用于检验左侧人物、正面偏俯视的脸、双手和明信片。实际沙画 `actual-performance.png` 由浏览器执行材料工具后导出，没有使用图像生成工具修饰。

生成提示词的整理记录：

```text
Use case: photorealistic-natural.
Create one natural photographic scene for testing a local photo-to-sand-art application.
A fictional East Asian man in his early thirties sits in a quiet park, positioned in the LEFT HALF of a landscape 3:2 composition.
He looks down with a gentle, tender expression at a blank postcard held by BOTH hands at chest height.
Keep the full face, hands and postcard clearly visible; use natural anatomy and plain charcoal dark clothing.
Soft daylight comes from the right. The right side contains a simple softly blurred green park and light path, with generous empty space.
Use realistic photographic texture, restrained color and candid lighting.
No text, letters, watermark or logo. No painting, sand-art filter or simulated artwork: this is an input photograph, not the output sand painting.
```

人工标注记录在 `src/memories/structure.ts` 的 `postcardGuides` 中，可在网页上重新框选。这些区域不作为成品蒙版，也不证明系统自动识别人脸、手、物件或情绪。
