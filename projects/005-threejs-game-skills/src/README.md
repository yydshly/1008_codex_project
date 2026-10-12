# 研究数据与工具实验

check-constraints.mjs 是原创驱动，以真实上游工具和合成输入验证五个约束边界；constraint-cases.json 是实际结果。能力数据在 ../web/content.js，生成器同步 README。

tools/inspect-threejs-canvas.mjs 与 tools/check_evidence.py 从上游逐字复制，未修改。原路径分别为 skills/threejs-qa-release/scripts/inspect-threejs-canvas.mjs 和 skills/threejs-game-director/scripts/check_evidence.py。固定提交 8286774b22a2566bf894dbc825825c16921866af，原仓库 https://github.com/majidmanzarpour/threejs-game-skills 。文件 SHA-256 位于 upstream-files.json。

Copyright (c) 2026 Majid Manzarpour。MIT 完整许可保留于 LICENSE.upstream。运行驱动需要 Node.js 22 和 Python 3，可用 THREEJS_RESEARCH_PYTHON 指定解释器，默认 PATH 中的 python。实验不会调用浏览器或付费服务。
