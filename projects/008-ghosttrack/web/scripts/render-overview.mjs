// 原创技术图解导出脚本。Playwright 仅作为外部绘图验证工具，不加入网页运行依赖。
// 用法：node scripts/render-overview.mjs --playwright <已安装 Playwright 模块的绝对路径>
import { resolve, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const moduleArg = process.argv.indexOf('--playwright');
const modulePath = process.argv[moduleArg + 1];
if (moduleArg < 0 || !modulePath || !isAbsolute(modulePath)) throw new Error('请使用 --playwright 提供本机已有 Playwright 模块的绝对路径。');
const { chromium } = await import(pathToFileURL(modulePath).href);
const assets = fileURLToPath(new URL('../../assets/', import.meta.url));
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 2160, height: 1200 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(assets, 'ghosttrack-overview.html')).href);
  await page.evaluate(() => document.fonts.ready);
  const bounds = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    rows: document.querySelectorAll('.matrix tbody tr').length,
    sections: document.querySelectorAll('.section-title').length,
    benefits: document.querySelectorAll('.value').length,
    overflowing: [...document.querySelectorAll('.poster p,.poster h3,.route-node')].filter(e => {
      const range = document.createRange();
      range.selectNodeContents(e);
      const text = range.getBoundingClientRect();
      const box = e.getBoundingClientRect();
      return text.right > box.right + 1 || text.left < box.left - 1;
    }).length,
  }));
  if (bounds.width !== 2160 || bounds.rows !== 4 || bounds.sections !== 6 || bounds.benefits !== 6 || bounds.overflowing || errors.length) throw new Error(`图解布局或内容不完整：${JSON.stringify({ bounds, errors })}`);
  await page.screenshot({ path: resolve(assets, 'ghosttrack-overview.png'), fullPage: true });
  console.log(JSON.stringify({ ...bounds, errors, output: resolve(assets, 'ghosttrack-overview.png') }, null, 2));
} finally { await browser.close(); }
