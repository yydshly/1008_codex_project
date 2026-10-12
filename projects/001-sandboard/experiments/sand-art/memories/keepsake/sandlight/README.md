# v35 · 灯台留白试片

针对 v34 像灰色炭笔画、缺少沙画材料感的反馈，独立试验另一种成画语言。入口为 `/1008_codex_project/001-sandboard/art/memories/keepsake/sandlight/`。v34、v33、v32 和旧沙画工作台保持原样。

## 这次改变

- 先撒几把疏密不均的厚沙；厚处接近遮光，薄处可见粒间透光。灯台采用暖色背光。
- 在已有沙层上收出杯身、杯沿、杯底与热气。杯身亮面来自实际沙量减少；接触边界保留约 18% 移走的沙，成为沙脊。
- 接触是有限宽度的掌缘或指腹，宽厚比只定义工具。没有杯身像素蒙版、扫描照片逐行显影或结尾替换图片。
- 实际落点使用紧致 3×3 归一核，固定物理尺寸的多面沙粒着色。收沙包先进入空中，再计入离台沙量。
- 原照片与故事的四步流程、45 秒实际过程、PNG、WebM、工程和赠礼 HTML 导出仍在。新 IndexedDB `sandboard-keepsake-sandlight-film` 只在首次复制 v34 草稿，随后独立保存。

## 视觉参考与范围

2026-10-10 重新查看 [Ilana Yahav 官方作品](https://www.sandfantasy.com/) 与 [官方演出说明](https://roniyahav.wixsite.com/sandfantasy/shows)。艺术家说明演出使用背光沙台与上方摄像机；本次根据作品观察选择遮光、留白、边缘余粒的表现方向。没有复制作者图片、影片或动作数据。

这是材料与手法试片，不能等同于真人大师沙画或商业纪念片。杯身仍是根据框选比例生成的概括模板，没有恢复原物花纹、磨损和背景；接触形状、粒形、光照和拾沙都是程序近似。没有手部画面，宽掌收沙仍可能显得过于规整，空中粒子是材料包的显示采样，不能保证无法被看出是数字生成。

## 验证

```powershell
npm.cmd test -- --maxWorkers=2 tests/keepsake-sandlight.test.ts tests/keepsake-composition.test.ts tests/keepsake-natural.test.ts tests/keepsake-film.test.ts --testTimeout=60000
npm.cmd run build
```

测试关注接触范围、沙脊、质量守恒、亮面来自收沙、留画期不换图及草稿隔离；不把测试通过视为画面达标。实际页面与导出证据在 [v35 资料](../../../../../assets/keepsake-sandlight-v35/README.md)。
