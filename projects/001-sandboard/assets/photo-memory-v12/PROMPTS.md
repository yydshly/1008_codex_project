# v12 照片沙画示例来源

日期：2026-10-09。使用 Codex 内置 `image_gen.imagegen` 生成一张虚构场景照片，未调用远程第三方图片库或复制艺术家作品。人物不对应指定真实人物。

- 输入照片：[sample-window.png](sample-window.png)，1536 × 1024，AI 生成的虚构示例。
- 成品：[sample-sand-warm.png](sample-sand-warm.png)，1536 × 1024，由照片转换程序和实际沙层渲染导出，未使用 imagegen 生成沙画成品。
- 产品截图：[compare.jpg](compare.jpg)、[collection.jpg](collection.jpg) 与 [exhibit.jpg](exhibit.jpg)，真实网页原照对比、私人收藏和展映。
- 导出验收：[sample-poster.png](sample-poster.png)，1728 × 1524 纪念画卡；[sample-exhibition.html](sample-exhibition.html)，内嵌成品的独立 HTML，默认不包含原照。

## 精确生成提示词

```text
Use case: photorealistic-natural. Asset type: clearly labeled AI-generated sample photograph in a local photo-to-sand-art creative app. Create one natural documentary-style landscape photograph, aspect ratio 3:2. Scene: quiet old Chinese home, an elderly East Asian woman seen in three-quarter profile sitting beside a large wooden window, hands holding a plain ceramic teacup, looking out at a rainy garden. Composition: her recognizable face and hands in the right-center third, window on left with broad soft light, gentle curved shoulder silhouette, distant garden simplified by rain. Medium: realistic photograph, natural skin and clothing texture, 50mm lens, moderate depth of field, coherent anatomy, no glamour retouch. Mood: quiet remembrance and warm everyday intimacy, subtle emotional atmosphere conveyed by scene and light. Wide usable black/white/gray tonal range with visible midtones; window bright but not blown out, face lit softly from left, dark cloth behind shoulders gives clean separation. Earth tones and muted moss green. No text, no watermark, no border, no logos, no illustration, no sand-art styling, no fake UI. Keep entire head and both hands in frame. This is fictional, not a photo of a named real person.
```

工具返回的原始文件为 `D:/codex/home/generated_images/01a11a02-876b-77f2-a0e9-9aa82ea47e4c/exec-f4efae2c-2b1e-4b04-9641-bc66236d26c9.png`；复制到上述项目资产后，由 Vite 作为本地静态素材打包。网页首屏、照片设置和 AI 示例的独立展览都明确标记来源。
