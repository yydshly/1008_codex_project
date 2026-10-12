# 作品版素材署名与许可

制作日期：2026-10-09。七部应用作品是本研究新增内容，原作者并未提供这七个成品。

## 本次生成的美术

使用 Codex 内置 **image_gen** 实际生成七张PNG：traveler-atlas、history-worlds、life-worlds、travel-worlds、emotion-worlds、garden-museum、foliage-atlas。生成后保存到本目录；没有取用作者个人形象，也没有输入真人照片。人物为原创虚构成年旅行者。

完整实际提示词在[prompts.json](prompts.json)，图片尺寸、透明度与SHA-256在[asset-manifest.json](asset-manifest.json)。提示词是生成要求；实际尺寸和帧排列以生成结果、清单和合成代码为准。步态采用实际可用的四帧，不将重复姿势当作八个独立动作。

环境原画为宽幅电影构图；Atlas按实际画面边界读取。合成过程中保留原画比例，以电影窗口轻微裁边。人物按脚底锚点合成；夜景单独调整人物亮度。前景透明素材、镜头、水光、雨线、蒸汽、花瓣和数据流在浏览器中合成，没有修改上游原版风格代码。

这些PNG属于本次生成素材，不应误标为原仓库MIT素材或历史原作。江南、上海、敦煌和展亭为艺术化意象；器物、画作、产品品牌和业务内容均为想象示例。

## 配乐（所有七片）

**Dreamer — Kevin MacLeod (incompetech.com)**

Licensed under Creative Commons: By Attribution 4.0 License

https://creativecommons.org/licenses/by/4.0/

- 曲目出处：[Incompetech 官方曲目页](https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1600043)
- 下载源：[官方 Dreamer.mp3](https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dreamer.mp3)
- 原文件：dreamer-original.mp3，2026-10-09下载。
- 本次改动：从20秒处截取30秒，统一响度，0.7秒淡入，最后3秒淡出，转为AAC，并合入七部MP4。
- 原版许可正文保存在[CC-BY-4.0.txt](CC-BY-4.0.txt)。视频片尾和网页也保留署名。转发或改用这段音乐时须继续保留署名、许可链接及改动说明。
- 每个独立MP4的comment元数据另保存完整作者、来源、CC BY 4.0链接和剪辑说明；补充元数据时用流复制并核对音视频SHA不变。

这段配乐是真实录制的音乐，**不是本研究原创配乐**。旧代码原型的合成提示音没有用于新版。

## 上游代码、方法与字体

- Huashu Art Motion，alchaincyf，固定提交 `57d67608ab458f57d9b153b1a2831b921e22498b`：[原仓库](https://github.com/alchaincyf/huashu-art-motion)。
- 实际复用未修改的U与MO：确定时间、缓动、镜头/事件编排。参考上游“静帧先行、分层素材、角色换帧、混合路线、逐帧验收”的制作方法。
- 上游代码与文档MIT许可全文：../../src/LICENSE.upstream.txt。
- 新场景绘画、故事、软件样例界面、交互和编码脚本为本研究新增，不是原版35个绘画算法的直接变体。
- 字体使用上游保存的Noto Sans SC、LXGW WenKai、Inter；字体OFL和具体署名在../../src/upstream-engine/lib/fonts/LICENSES.md及OFL.txt。
- 作者人物与原Skill示范媒体的许可例外继续适用；这组新版影片未取用作者人物素材。
