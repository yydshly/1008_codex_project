# Sandboard 公开发布核验

2026-10-12，以已保存的实际研究为基础公开发布；本次整理与部署不修改材料求解、动作规划、原画台或私人作品库。

- [仓库研究总入口](https://yydshly.github.io/1008_codex_project/)
- [光阴沙画完整平台](https://yydshly.github.io/1008_codex_project/001-sandboard/)
- [研究历程与总览图](https://yydshly.github.io/1008_codex_project/001-sandboard/art/research/#overview)
- [首次部署工作流](https://github.com/yydshly/1008_codex_project/actions/runs/38198730254)：构建、目录检查、研究媒体检查和部署均通过。对应源码提交 `fa96ac2d0209e71603f34ac4349ff62bd5a802d7`；随后补记已验证链接与发布状态。

## 实际检查

[HTTP 核验记录](live-check.json)检查了总入口、项目跳转页及十六功能入口，共十八个 HTTP 地址，另有 58 项 HTML 直接引用的脚本、样式和图片；均返回 200。线上高清图为真实 PNG，3200×15811、23,331,794 字节，SHA-256 `038be268d03b4c0e33c5f4a963d69c2f322d115caaa767d5d5a4f6fb1fd48ca1`，与保留原图一致。

浏览器实际核对：研究总入口五段说明、源库 Sandboard 名称、原版和图版两张真实图片；图版弹窗完整加载并可定位原理章节；统一平台首页七工具与十五页目录；沙耙深链接选中沙面和沙耙，画台完成 WebGPU 初始化且无警告或错误；原版精细画质 2560×1440 完成初始化、重置按钮可用且无警告或错误。临时 390×844 手机视口的内容宽度与滚动宽度均为 375，没有横向溢出；核验后恢复默认视口。

[桌面真实网页截图](online-summary.jpg)与[手机真实网页截图](online-mobile.jpg)来自上述线上网址，未生成或美化。测试使用新的线上来源，不读取或上传 localhost 的私人照片、收藏与草稿。

## 保留超限的完整录像

[v30 完整过程原始附件](https://github.com/yydshly/1008_codex_project/releases/download/sandboard-research-2026-10-12/actual-process.webm)作为 GitHub Release 附件保留：156,116,609 字节，GitHub 返回的 SHA-256 `30d70f9fa06d8cd2a6b98df04694e6fdeb7bef38d5dee16430c4afce9a03e94f` 与原始取证清单一致。未压缩、未修改，本地原文件也保留；精选历史录像继续随静态网页发布。

## 验收边界

根索引检查、十一项索引工具测试、两个独立生产构建及发布目录检查通过。保留的历史媒体覆盖 36 个版本、27 项尝试、11 段精选录像和 76 项素材。未在本次重跑所有旧算法的动作取证、任意真实照片、真实手机硬件或商业交付验收；公开可访问不等于沙画自然度、清晰度或实拍质感达标。
