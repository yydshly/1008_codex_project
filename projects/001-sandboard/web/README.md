# Sandboard 效果展示网页

基于 [scottstts/Sandboard](https://github.com/scottstts/Sandboard) 的完整 Web 应用副本，保留原版沙床、飞沙、音效、椰树阴影与海浪重置，添加中文操作说明与来源信息。研究基线为 `489cb01e81b11ba575887f7c76760498eb41aaa8`，上游原文见 [UPSTREAM_README.md](UPSTREAM_README.md)，许可证见 [LICENSE](LICENSE)。

## 启动与构建

需要 Node.js 22.12 或更新版本；实时划沙需要支持 WebGPU 的浏览器和硬件加速。使用 localhost / 127.0.0.1 或 HTTPS 安全上下文访问。

```powershell
cd projects/001-sandboard/web
npm.cmd ci
npm.cmd run dev
```

打开 <http://127.0.0.1:5173/>。Windows PowerShell 下使用 `npm.cmd`，其他终端可直接使用 `npm`。

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

构建产物位于 `dist/`。`npm test` 运行上游的输入、时钟、重置和着色器兼容性测试；`npm run test:gpu` 另需 Node WebGPU 的硬件支持。

## 操作

- 鼠标：按住左键拖动。慢划刻沟，快速划动观察飞沙。
- 触屏：支持多指同时绘画。
- 「划沙粗细」调整手指半径；「海浪重置」渐进抚平沙面。
- 键盘：先聚焦沙面，方向键移动，空格划沙，方括号调整粗细，R 重置。
- 右上角「操作与原理」展示中文说明与上游入口。

## 子路径与来源

Vite 使用 `base: './'`，脚本、图片、音频和 GLB 模型均支持部署到 `/1008_codex_project/001-sandboard/` 等子路径。只把 `dist/` 的内容用于静态发布；当前没有接入统一发布，在线链接保持为空。发布约定见[根部署说明](../../../docs/DEPLOYMENT.md)。

修改范围为 `index.html`、`vite.config.js`、`src/ui/interface.ts`、`src/style.css`、`src/platform/boot.ts`、`src/audio/sound.ts`、`src/render/coconut-shadow.ts` 及本地说明；核心模拟和沙面/飞沙渲染未改动。`public/preview.jpeg` 是固定版本上游 `assets/screenshot.jpeg` 的副本，浏览器不支持 WebGPU 时明确作为截图显示，不替代实时模拟。

所有复制的上游代码和素材保留 GPL-3.0-only 许可及来源。没有复制上游 `.git`、`.codex` 或本地环境文件。
