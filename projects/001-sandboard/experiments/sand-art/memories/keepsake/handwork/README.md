# v36 · 局部推拢试片

入口：`/1008_codex_project/001-sandboard/art/memories/keepsake/handwork/`。v35 灯台留白版与所有旧版保持原样。本版继续照片、故事、构图确认、45 秒真实沙层过程和赠礼导出的产品流程，重点改成画动作。

## 从整块清空改成局部推拢

杯身使用左侧向下、右侧向上、中部斜弧三笔接触。接触形状随运动方向转动，材料推至掌缘前方，形成沿路径移动的弧形沙堆。推拢与停驻期间只在同一沙层内转移沙量，不边推边删除。

停驻后拾起前缘已有沙堆。每格 `mobile` 标签记录由真实推拢移入的沙量，随坡面松落一同转移；它不是参考图蒙版。拾沙只减少这一部分沙，并通过实际空中材料包离台；不会因掌缘附近有背景沙就直接把背景挖空。重播会清除标签，以同一随机序列重建。

保留灯台暖色、实际粒间透光、固定粒径着色及紧致落沙。细撒杯口前弧与少量杯侧余粒，避免完整杯身只剩空白几何。没有手模型、照片逐行显影或结尾换成品图。

新增独立源文件 `keepsake-handwork-*` 与 IndexedDB `sandboard-keepsake-handwork-film`。第一次只复制 v35 草稿；随后独立保存。旧版源码、入口与证据共 27 文件以 SHA-256 校验保留。

## 验证与范围

```powershell
npm.cmd test -- --maxWorkers=2 tests/keepsake-handwork.test.ts tests/keepsake-sandlight.test.ts tests/keepsake-composition.test.ts tests/keepsake-natural.test.ts tests/keepsake-film.test.ts --testTimeout=60000
npm.cmd run build
```

测试关注质量守恒、先推后拾、未接触底沙保留、标签随松落转移、重播确定性和草稿隔离。实际停驻与拾起前后的页面、海报、视频和赠礼文件见 [v36 证据](../../../../../assets/keepsake-handwork-v36/README.md)。

它仍是杯子轮廓模板，不能复刻原照片的花纹、磨损或背景。推拢、光照、沙粒及接触仍是程序近似；杯口和杯身的表现偏概括，未达到真人大师沙画或商业成片质量。没有验证任意真实照片、手机性能和赠礼 HTML 离线浏览器播放；没有云分享、配乐或外部发布。
