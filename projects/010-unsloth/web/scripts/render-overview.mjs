// 原创技术总览图导出。Playwright 使用现有安装，不属于生产网页依赖。
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
if (!process.env.PLAYWRIGHT_PACKAGE) throw new Error('请设置 PLAYWRIGHT_PACKAGE 为已有 Playwright 包目录');
const { chromium } = await import(pathToFileURL(path.join(process.env.PLAYWRIGHT_PACKAGE, 'index.mjs')).href);
const assets = fileURLToPath(new URL('../../assets/', import.meta.url));
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(assets, 'unsloth-overview.html')).href);
  await page.evaluate(() => document.fonts.ready);
  const layout = await page.evaluate(() => {
    const text = document.querySelector('.poster').innerText;
    const overflowing = [...document.querySelectorAll('.poster p,.poster h1,.poster h2,.poster h3,.item b,.node b,.node small,.scope strong')].filter(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const textBox = range.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      return textBox.right > box.right + 1 || textBox.left < box.left - 1 || element.scrollWidth > element.clientWidth + 1;
    }).map(element => element.textContent);
    return { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, modules: document.querySelectorAll('[id^="map-"]').length, modelRows: document.querySelectorAll('.models .item').length, overflowing, bodyText: text };
  });
  assert.equal(layout.width, 1600);
  assert.equal(layout.modules, 8);
  assert.equal(layout.modelRows, 7);
  assert.deepEqual(layout.overflowing, []);
  assert.deepEqual(errors, []);
  for (const phrase of ['微调也是训练', '继续预训练', '80GB+', '0.78%', '对你的意义', 'EmbeddingGemma', '随机初始化']) assert.ok(layout.bodyText.includes(phrase), `缺少关键内容：${phrase}`);
  assert.ok(!layout.bodyText.includes('不支持训练模型'));
  const filename = 'unsloth-overview.png';
  await page.screenshot({ path: path.join(assets, filename), fullPage: true });
  const buffer = await readFile(path.join(assets, filename));
  const output = { date: '2026-10-09', method: '原创 HTML / CSS 排版，Playwright 1.62.1 + Microsoft Edge 导出 PNG', upstreamCommit: 'f9718db128218f43b7e0b03604baa4a9a6633028', file: filename, width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex'), checks: { modules: layout.modules, modelRows: layout.modelRows, overflow: layout.overflowing.length, errors: errors.length }, priorImagegenAttempt: { result: 'failed', message: 'image generation failed: network error: error sending request', prompt: 'unsloth-overview-imagegen-attempt.txt', fallbackApiUsed: false }, modelTrainingExecuted: false };
  await writeFile(path.join(assets, 'unsloth-overview-generation.json'), JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
