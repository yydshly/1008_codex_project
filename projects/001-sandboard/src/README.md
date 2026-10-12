# 独立实验代码

本目录预留测量脚本和参数对比代码，暂未放入实现。完整网页复现存放在 [../web/](../web/)；沙画工作室单独维护在 [../experiments/sand-art/](../experiments/sand-art/README.md)，拥有自己的依赖、测试、许可证与构建产物。

## 当前来源与边界

`web/` 为上游 [scottstts/Sandboard](https://github.com/scottstts/Sandboard) 在 Commit `489cb01e81b11ba575887f7c76760498eb41aaa8` 的修改副本。上游原目录 `src/` 对应本项目 `web/src/`，上游 `docs/` 对应 `web/docs/`，上游 `public/` 对应 `web/public/`。GPL-3.0-only 许可证保留在 [web/LICENSE](../web/LICENSE)，上游项目说明保留在 [web/UPSTREAM_README.md](../web/UPSTREAM_README.md)。

基线阶段围绕网页展示增加中文说明、界面本地化与资源子路径适配；沙床高度场、飞沙粒子、WGSL 着色器、声音和海浪重置保持上游实现。初次沙画实验没有修改 `web/`；最新优化只改原版画质策略、半径和重置反馈、入口与交互展示，不改求解器、渲染算法或相机。具体范围与验证结果见 [研究笔记](../notes.md)。

## 已实现的独立实验

[沙画工作室](../experiments/sand-art/README.md) 参考固定 Commit 的高度场、守恒输运与 GPU 双缓冲设计，独立实现 `512 × 384` 无量纲沙层和两种渲染。沙面与灯箱各有自己的状态、设置和 10 步沙床撤销；默认打开灯箱并保留笔迹。六种工具包含撒沙、推沙、刮线、五齿耙、心形印章、抹平，另外实现光照、湿沙、风、自然流动开关、可编辑模板、本地图片转厚度场、全屏、IndexedDB 手动存档和 PNG 离屏导出。

实验 [solver-shaders.ts](../experiments/sand-art/src/solver-shaders.ts) 注明参考的上游 `src/simulation/flux.ts` 和 `src/simulation/shaders.ts`，固定 Commit 为 `489cb01e81b11ba575887f7c76760498eb41aaa8`。GPL-3.0-only 原许可证保留在 [实验 LICENSE](../experiments/sand-art/LICENSE)。实验不包含原版飞沙、声音与海浪；湿沙和风属于效果近似，石块、贝壳、水流侵蚀、回放、协作仍待研究。

2026-10-08 初版独立构建、5 项常规输入/轨迹测试与 27 项硬件 GPU 测试及本机浏览器核心体验通过；本轮独立构建、9 项常规与 45 项 GPU 全部通过（求解器 37、渲染器 7、历史 1）。厚底工具采用固定加载基底的接收预算与分摊时间的局部子步，刀笔和沙耙用共同采样锚点减轻端帽珠圈，尾部仍可能渐窄。撤销同时恢复状态与基底，草稿读取时重建基底。浏览器厚线、两模式草稿刷新、真实 PNG 下载和导入撤销通过；原版构建、Lint、44 项常规和 15 项 GPU 回归通过。真实触屏与其他浏览器尚未验证，详细覆盖范围见 [实验说明](../experiments/sand-art/README.md)。

## 后续实验约定

新增实验时，各实验单独说明假设、输入、运行命令与实际结果。引用或摘录上游代码时，注明原文件路径、固定 Commit 和修改内容，保留适用的版权与许可；独立依赖放在各实验自身目录内，避免接入根索引工具的依赖清单。
