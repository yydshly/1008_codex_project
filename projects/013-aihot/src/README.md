# 研究数据与验证

- `research.json`：独立中文研究，包含完整摘要、能力、模块、处理流程、获取配置、场景、复用价值、方向、边界与源码证据。
- `source-list.json`：18 个示范源映射；名称、订阅地址、分层和配置来自固定提交，中文定位与复用说明为本地补充。
- `check-feeds.py` / `feed-verification.json`：标准库 HTTP 与 XML 实测；不调用付费接口、不评判正文提取结果。
- `evidence-verification.json`：相对源码路径与固定 Git tree 的存在性核验。
- `content-audit.json`：独立静态内容审计结果；浏览器与线上验证另记。
- `upstream/`：上游 `industry/sources.json`、`industry/selection.ts` 与许可原样快照，无本地改动。

上游：https://github.com/KKKKhazix/AIHOT ，固定提交 `6e67a9d9e8d87b95b8118a8a0b328a9bebd2bb48`。原始代码遵循所附 MIT 许可证与 NOTICE；本地未复制上游应用界面、标志、字体或完整服务代码。

重新检测订阅：`python projects/013-aihot/src/check-feeds.py`。此命令会覆盖单次环境实测记录，更新后应重新构建网页。
