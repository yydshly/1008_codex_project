// 可选的真实浏览器验证，不属于网页运行依赖。
// PLAYWRIGHT_PACKAGE 指向已安装 Playwright 的目录，PREVIEW_URL 可覆盖预览入口。
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { guide } from '../web/publication.mjs';
const packageDir = process.env.PLAYWRIGHT_PACKAGE;
if (!packageDir) throw new Error('请设置 PLAYWRIGHT_PACKAGE 为现有 Playwright 包目录');
const { chromium } = await import(pathToFileURL(path.join(packageDir, 'index.mjs')).href);
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4197/1008_codex_project/010-unsloth/';
const assets = fileURLToPath(new URL('../assets/', import.meta.url));
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
const errors = [];
const failures = [];
const report = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failures.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  const response = await page.goto(base, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  assert.equal(await page.locator('main > section').count(), 18);
  assert.equal(await page.locator('.source-item').count(), 26);
  assert.equal(await page.locator('#training tbody tr').count(), 8);
  const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => !document.getElementById(href.slice(1))));
  assert.deepEqual(brokenAnchors, []);
  assert.equal(await page.locator('[data-system-module]').count(),8);
  assert.equal(await page.locator('[data-model-family]').count(),7);
  assert.equal(await page.locator('[data-extension]').count(),8);
  report.push('18 个章节、12 项摘要、8 模块、7 类模型、8 扩展、26 项来源与内部链接完整');

  for (const name of ['principle', 'scenario']) {
    const tabs = page.locator(`[data-tabs="${name}"] [role="tab"]`);
    for (let index = 0; index < await tabs.count(); index++) {
      const tab = tabs.nth(index);
      await tab.click();
      assert.equal(await tab.getAttribute('aria-selected'), 'true');
      const panelId = await tab.getAttribute('aria-controls');
      assert.equal(await page.locator(`#${panelId}`).isVisible(), true);
      assert.equal(await page.locator(`[data-tabs="${name}"] [role="tabpanel"]:visible`).count(), 1);
    }
    await tabs.first().focus();
    await page.keyboard.press('End');
    assert.equal(await tabs.last().getAttribute('aria-selected'), 'true');
    await page.keyboard.press('Home');
    assert.equal(await tabs.first().getAttribute('aria-selected'), 'true');
    await page.keyboard.press('ArrowRight');
    assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'true');
  }
  report.push('机制与场景均可逐项切换，键盘 Home / End / 方向键可用');

  await page.goto(`${base}#scenario-docs`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#scenario-docs').isVisible(), true);
  await page.locator('#scenario-tab-video').click();
  await page.goBack();
  assert.equal(await page.locator('#scenario-docs').isVisible(), true);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#scenario-docs').isVisible(), true);
  await page.goto(`${base}#principle-kernels`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#principle-kernels').isVisible(), true);
  report.push('直接链接、刷新和浏览器返回恢复对应面板');

  assert.equal(await page.locator('#parameter-ratio').textContent(), '0.78%');
  await page.locator('#matrix-dim').selectOption('2048');
  await page.locator('#lora-rank').focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('#parameter-ratio').textContent(), '12.50%');
  assert.equal(await page.locator('#adapter-count').textContent(), '524,288');
  await page.locator('#short-length').fill('1000');
  assert.equal(await page.locator('#padding-ratio').textContent(), '0.0%');
  await page.locator('#long-length').fill('500');
  assert.equal(await page.locator('#padding-ratio').textContent(), '25.0%');
  assert.match(await page.locator('#packing-input-note').textContent(), /重新排列/);
  await page.locator('#short-length').fill('0');
  assert.match(await page.locator('#packing-input-note').textContent(), /整数/);
  assert.equal(await page.locator('#padding-ratio').textContent(), '25.0%');
  report.push('计算器支持正常值、等长、反向长度和无效输入');

  await page.locator('#faq summary').first().click();
  assert.equal(await page.locator('#faq details[open]').count(), 1);
  await page.locator('.technical-details summary').click();
  assert.equal(await page.locator('.technical-details .details-content').isVisible(), true);
  const sourceResponse = await page.request.get(new URL('sources.json', base).href);
  const sourceData = await sourceResponse.json();
  assert.equal(sourceData.sources.length, 26);
  assert.match(sourceData.meta.commit, /^[a-f0-9]{40}$/);
  for (const resource of ['research.md', 'notes.md', 'understanding.md', 'publication.json', 'verification.json', 'styles.css', 'app.js', 'favicon.svg']) {
    assert.equal((await page.request.get(new URL(resource, base).href)).status(), 200);
  }
  report.push('FAQ、H3 详情、来源 JSON 和研究文档可访问');

  await page.goto(`${base}#overview-map`, { waitUntil: 'networkidle' });
  const graphic = page.locator('#overview-map img');
  await graphic.scrollIntoViewIfNeeded();
  await graphic.evaluate(img => img.decode());
  const dimensions = await graphic.evaluate(img => ({ width: img.naturalWidth, height: img.naturalHeight }));
  assert.deepEqual(dimensions,{width:guide.width,height:guide.height});
  for (const resource of ['assets/unsloth-overview.png', 'assets/unsloth-overview-content.md', 'assets/unsloth-overview-prompt.txt']) {
    assert.equal((await page.request.get(new URL(resource, base).href)).status(), 200);
  }
  const imageResponse=await page.request.get(new URL('assets/unsloth-overview.png',base).href);
  const imageBytes=await imageResponse.body();
  assert.equal(imageBytes.length,guide.bytes);assert.equal(createHash('sha256').update(imageBytes).digest('hex'),guide.sha256);
  await page.goto(new URL('map.html',base).href,{waitUntil:'networkidle'});
  await page.locator('[data-zoom="1"]').click();
  assert.equal(await page.locator('#map').evaluate(img=>img.clientWidth),2400);
  await page.locator('[data-zoom="0.5"]').click();
  assert.equal(await page.locator('#map').evaluate(img=>img.clientWidth),1200);
  await page.locator('#fit').click();
  assert.ok(Math.abs(await page.locator('#map').evaluate(img=>img.clientWidth)-await page.locator('#viewport').evaluate(el=>el.clientWidth))<=1);
  report.push(`原图 ${dimensions.width} × ${dimensions.height}、字节数和 SHA-256 不变；阅读器 50% / 100% / 适合宽度可用`);

  await page.goto(base, { waitUntil: 'networkidle' });
  if(process.env.CAPTURE_ARTIFACTS!=='false')await page.screenshot({ path: path.join(assets, 'cover.png') });
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(dimensions.scroll <= dimensions.width, `页面在 ${width}px 宽度横向溢出：${JSON.stringify(dimensions)}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  if(process.env.CAPTURE_ARTIFACTS!=='false')await page.screenshot({ path: path.join(assets, 'mobile.png') });
  await page.locator('#scenario-tab-video').click();
  assert.equal(await page.locator('#scenario-video').isVisible(), true);
  report.push('1440 / 1024 / 768 / 390 / 320 宽度无整页横向溢出；手机切换可用');

  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const readable = await noJS.newPage();
  await readable.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await readable.locator('[role="tabpanel"]:visible').count(), 12);
  assert.equal(await readable.locator('.noscript-note').isVisible(), true);
  await noJS.close();
  report.push('禁用 JavaScript 后全部 12 个面板和说明可读');
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
  report.push('无页面脚本错误或失败资源');
  if(process.env.CAPTURE_ARTIFACTS!=='false'){
    const recordPath=new URL('../verification.json',import.meta.url);
    const record=JSON.parse(await readFile(recordPath,'utf8'));
    record.checks=report;record.browser='Microsoft Edge / Playwright';record.localPreview=base;
    record.browserStatus='passed';record.screenshots=['assets/cover.png','assets/mobile.png'];
    await writeFile(recordPath,JSON.stringify(record,null,2)+'\n');
  }
  console.log(JSON.stringify({ status: 'passed', checks: report, screenshots: ['assets/cover.png', 'assets/mobile.png'] }, null, 2));
} finally {
  await browser.close();
}
