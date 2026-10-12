# 《月下归舟》美术目标图 · v8

2026-10-08 使用内置 imagegen 生成，三幅图均为原创构图的 AI 美术目标图。它们不是沙层模拟截图，也不是艺术家原作或真人表演截图。网页分镜只切换目标图；真实材料练习另行展示。

三张原始 PNG 均为 1672 × 941。编号 1 为江南远景，2 为归人近景，3 为灯下思念。第 2 张以第 1 张保持配色与材料连续，第 3 张以第 1、2 张保持人物与场景连续。图中仅使用棕色细沙与暖色灯箱透光的视觉设定；细节是生成式视觉设计，不能据此断言真实手绘或当前模拟能达到这些细节。

原文件保留在本目录，网页发布副本位于 `experiments/sand-art/public/generated-sandboard/`。原版、工作室和 v7 图片全部保留。

## 生成方式

内置 `image_gen.imagegen`，`transparent_background: false`。不调用外部 CLI。第 1 张无参考输入；第 2 张引用本项目 scene-1.png；第 3 张引用 scene-1.png 与 scene-2.png。没有引入第三方艺术作品位图。

## scene-1.png

```text
Use case: stylized-concept
Asset type: original sand-animation art direction keyframe, wide landscape 16:9, meant for a light-table performance study.
Primary request: An exceptionally accomplished, mature Chinese Jiangnan sand painting titled in our project "月下归舟", made entirely from actual-looking extremely fine dark sand on a warm luminous glass table, straight top-down camera framing only the artwork, no table edges.
Scene: A quiet canal at dusk under a pale moon and mist. Lower right foreground a modest traditional wooden boat with curved awning and a lone returning boatman in a straw hat, believable human proportions, gently curved back and layered robe, holding a diagonal pole. Right middle distance a low stone arch bridge, behind it irregular white-walled Jiangnan houses with dark tiled roof planes. Left foreground a majestic willow trunk emerging from the corner, naturally irregular tapering branches and delicate sparse hanging foliage. Far river banks dissolve into fog; reflections in the canal are broken horizontal streaks. Main emotional subject is the returning boat and human silhouette, not the bridge. Wide breathing space and atmosphere, asymmetrical sophisticated composition, strong left foreground dark mass balanced with the lower right boat.
Medium: authentic monochromatic hand sand animation frozen at its final keyframe. Only charcoal-brown sand, cream lightbox whites, many luminous nuanced gray-brown halftones. Real fine powder sprayed in soft tonal veils, thick dense sand masses, fingertip-excavated fine lit edges and occasional dark accumulated ridges, nuanced sand grain following form. High art quality: carefully structured perspective and human anatomy, soft far edges, hard selective near edges, convincing hand-carved organic line variation. Five clear value groups; rich dark foreground, soft midtone architectural planes, light mist with tiny fine grains. Visually convincing as a professional sand performance rather than an ink illustration.
Constraints: ORIGINAL composition, no copying a named artist's specific work. No text, lettering, signatures, logos, borders, extra color. No illustrated cartoon, clipart, child drawing, vector outline, uniformly thick black lines, wireframe-only buildings, geometrically perfect circles, star field, giant grain dots. Do not add hand, performer, UI or tools. Entire frame is the sand artwork. Landscape output.
```

## scene-2.png

```text
Use case: stylized-concept
Asset type: original Chinese sand-animation storyboard keyframe 2 of 3, landscape 16:9
Input image role: previous original sand artwork used ONLY to maintain palette, fine-sand material and spatial anchors.
Primary request: Create the second, genuinely transformed image for the same sand-table story, called "归人近景". The wide canal landscape has been organically reshaped into a moving close view of the returning boatman, an anonymous older Chinese man with a believable three-quarter face turned left, quiet tired expression, eyes and wrinkles subtly indicated, wearing a broad straw rain hat and a layered cloth robe. Anatomically credible, elegant and emotionally restrained, exceptional mature composition. Frame only the sand art, no table/hand/UI.
Spatial choreography: Keep the LEFT foreground dark willow mass as a soft fragmentary memory. Put hat arcing crown in the RIGHT half around x=.72 y=.38; hat brim x=.61–.86 y=.45, as if the previous bridge arch and roof sand were gathered into his hat. His face center around x=.75 y=.53 and upper body / luminous sleeve in the lower right x=.66–.94 y=.65–.95. Retain a faint river echo left and middle with soft horizontal mist; foreground darkness anchors the left corner. Pale moon in upper middle-right dissolves into soft fog, do not make a competing bright object. Keep ample breathing space to the left of the face.
Medium: show an actual-looking hand sand-animation lightbox artwork, fine dry powder, luminous cream negative areas and dark charcoal-brown dense sand, nuanced soft gray planes for cheek/neck and cloth. White cheek edge created by a fingertip scraping sand, irregular varied width; dark hat and robe silhouettes with small broken granular edges. Build face with selective soft powder modeling, believable nose and lips, hard selective eyelid line and bright scraped edge. No excessive photographic skin pores. Broad dramatic black/white/gray composition, finer darker features subordinate to big shape.
Constraints: ORIGINAL designed frame, maintain previous sepia palette and mature organic powder quality. No artist imitations or copied work. No letters, signatures, watermarks, hands of performer or borders. Avoid children's illustration, cartoon, uniform vector linework, shiny oil paint, digital photo portrait, giant granular dots. Landscape.
```

## scene-3.png

```text
Use case: stylized-concept
Asset type: third original sand-animation storyboard image, landscape 16:9
Input image role: the previously generated first and second artworks are continuity references for the anonymous returning boatman, sepia lightbox and broad arrangement.
Primary request: Finish the original "月下归舟" story with the mature, deeply human sand art scene "灯下思念". The same older Chinese boatman has arrived in a simple Jiangnan room at night, placed his straw hat on a table, seated right of center in three-quarter profile facing left. His face appears around x=.73 y=.49 and hands x=.73 y=.77. One hand loosely rests beside the hat while the other holds a small worn folded letter on the low wooden table. Believable anatomy, hand bones and finger proportions, subtle face planes and restrained thoughtful expression. Background left side a dark wooden window frame, its branching outlines echo the willow of prior image; outside the window, distant pale river and little bridge dissolve into fine mist. Near upper right above him a small hanging lantern casts a pale cream glow, echoing the previous moon; lamp light only appears through cleared sand, with no added colors.
Mature composition: dark room framing left and right, soft luminous negative space around face, table as diagonal foreground plane; no evenly distributed decorative details. Large dark sand masses and few precise scraped highlights. Hat now lies on table lower right, a curving arc continuity with the former bridge and hat brim. Quiet scene with breathing space and genuine dimensional forms.
Medium: authentic-looking professional sand animation on a lit glass light table, extremely fine dark dry powder and tightly controlled gray-brown sand density, organic hand-carved bright contours, soft sprayed tonal modeling on face, clothing and hands, warmer pale ivory light only, fine granular edge. Big blacks, soft halftones and clean negative light. Refined recognizable faces and hands without photo-level skin detail or oilpaint impasto. Whole frame is actual-looking sand artwork, straight top-down view.
Constraints: original work, not imitation of a named artist. Keep previous character identity broadly, palette and organic texture. No writing or readable text on letter, no titles, logos, signatures, borders, UI, performer hand, cartoon, child drawing, vector linework, giant grain dots. Landscape 16:9.
```

