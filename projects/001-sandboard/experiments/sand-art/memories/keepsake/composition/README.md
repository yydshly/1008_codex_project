# v34 · 杯身塑形与纪念短片

独立入口：`/1008_codex_project/001-sandboard/art/memories/keepsake/composition/`。

本轮直接针对 v33 成品的空轮廓、中心沙斑和满屏散沙重做成画。先宽撒完整杯身灰面，补右侧暗面，收净两侧余沙，拂薄杯身亮面，再形成杯内、杯口与接地阴影。最终画幅放大杯子，背景不再先撒一层大面积沙点。

新增七个独立 `keepsake-composition-*` 模块。供料具有有限指缝宽度、随机落点、起落与重力飞行；局部归一落点核承载连续灰阶，固定物理尺度的颗粒着色补足微观细节。收沙先贴台推拢，沿途把已有沙量拾进空中，离台后才计入收走量；高分辨率拾沙按相邻细粒聚合，数量上限不会直接删沙。动作围绕物件几何编排，没有照片灰度扫描、成品贴图或结尾换图。

照片、故事、框选、预览、WebM、PNG、赠礼 HTML 与工程备份流程沿用 v32 产品。新草稿数据库为 `sandboard-keepsake-composition-film`，首次只读取并复制 v33 草稿。v33、v32、旧作品及手部试验继续保留。

仍是杯子造型的数字沙画近似。照片只提供比例和人工确认的杯把、托碟等结构，花纹、文字、磨损与任意物件没有自动复刻；沙层、手法与光学也未达到实拍大师作品的完成度。当前示例照片来自此前的 AI 虚构雨窗素材，故事是示范文字。不能把流程跑通等同于成品达到商业交付质量。

验证命令：

```powershell
npm.cmd run build
npm.cmd test -- --maxWorkers=2 tests/keepsake-composition.test.ts tests/keepsake-natural.test.ts tests/keepsake-film.test.ts --testTimeout=60000
```

实际页面、海报、完整录制与旧版保留核对见 [本轮证据](../../../../../assets/keepsake-composition-v34/README.md)。

上游 Sandboard URL、研究提交与许可登记沿用项目根 README。本轮沙画材料、编排和产品页面为本仓库原创迭代；未改动上游 GPU 沙盘核心，也未引入新的第三方图像。
