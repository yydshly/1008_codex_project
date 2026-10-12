// Optional end-to-end publication check. Playwright is supplied by the tester,
// not by this dependency-free static project.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const options = new Map();
for (let i=2;i<process.argv.length;i+=2) options.set(process.argv[i],process.argv[i+1]);
if (!options.get('--playwright') || !options.get('--url')) throw new Error('--playwright <package directory> --url <preview URL> [--report <JSON>] [--screenshots <directory>]');
const { chromium } = await import(pathToFileURL(path.join(options.get('--playwright'),'index.mjs')).href);
const browser = await chromium.launch({headless:true});
const url = options.get('--url');
const errors = [];
const record = {url,checkedAt:new Date().toISOString(),checks:{},errors};
try {
  const context = await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  const page = await context.newPage();
  page.on('pageerror',error => errors.push(error.message));
  page.on('response',response => {if (response.status() >= 400 && response.url().startsWith(new URL(url).origin)) errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(url,{waitUntil:'networkidle'});
  assert.equal(await page.locator('[data-source-id]').count(),18);
  assert.equal(await page.locator('.reading-content > section').count(),11);
  await page.locator('#source-search').fill('OpenAI');
  assert.equal(await page.locator('[data-source-id]:visible').count(),1);
  await page.locator('[data-copy]').first().click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'https://openai.com/news/rss.xml');
  await page.locator('#reset-filters').click();
  await page.locator('#source-group').selectOption('media');
  assert.equal(await page.locator('[data-source-id]:visible').count(),5);
  await page.locator('#reset-filters').click();
  await page.locator('#source-format').selectOption('Atom');
  assert.equal(await page.locator('[data-source-id]:visible').count(),2);
  await page.locator('#source-search').fill('no-match-013');
  assert.equal(await page.locator('[data-source-id]:visible').count(),0);
  assert.ok(await page.locator('#source-empty').isVisible());
  await page.locator('#reset-filters').click();
  assert.equal(await page.locator('[data-source-id]:visible').count(),18);
  await page.locator('.guide-open').first().click();
  assert.ok(await page.locator('#guide-dialog').isVisible());
  await page.locator('#guide-zoom').click();
  assert.equal(await page.locator('#guide-zoom').getAttribute('aria-pressed'),'true');
  await page.keyboard.press('Escape');
  assert.ok(!await page.locator('#guide-dialog').isVisible());
  const dimensions = await page.locator('.guide img').evaluate(image=>({width:image.naturalWidth,height:image.naturalHeight}));
  assert.deepEqual(dimensions,{width:1448,height:1086});
  record.checks.desktop = {sources:18,sections:11,search:true,category:true,atomFilter:true,emptyState:true,reset:true,clipboard:true,guideDialog:true,guideZoom:true,escapeClose:true,guideDimensions:dimensions};
  if (options.get('--screenshots')) {await mkdir(options.get('--screenshots'),{recursive:true});await page.goto(url);await page.screenshot({path:path.join(options.get('--screenshots'),'aihot-desktop.png')});}
  for (const width of [390,320]) {
    await page.setViewportSize({width,height:844});
    await page.goto(url+'#sources',{waitUntil:'networkidle'});
    // An anchor-only navigation can retain the prior filter selection.
    // Reset each viewport's initial state instead of assuming a fresh page.
    await page.locator('#reset-filters').click();
    assert.equal(await page.locator('[data-source-id]:visible').count(),18);
    const widths = await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:window.innerWidth}));
    assert.ok(widths.document <= widths.viewport, `页面横向溢出 ${width}: ${JSON.stringify(widths)}`);
    await page.locator('#source-group').selectOption('community');
    assert.equal(await page.locator('[data-source-id]:visible').count(),3);
    record.checks['mobile'+width] = {subpathAndAnchor:true,noHorizontalOverflow:true,category:true};
    if (options.get('--screenshots') && width===390) {await page.goto(url);await page.screenshot({path:path.join(options.get('--screenshots'),'aihot-mobile.png')});}
  }
  await context.close();
  const withoutJS = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const plain = await withoutJS.newPage();
  await plain.goto(url,{waitUntil:'networkidle'});
  assert.equal(await plain.locator('[data-source-id]').count(),18);
  assert.equal(await plain.locator('[data-adapter]').count(),6);
  assert.ok(await plain.locator('.guide-open').first().getAttribute('href') === './assets/aihot-overview.png');
  assert.ok(!await plain.locator('.source-controls').isVisible());
  record.checks.withoutJS = {allSourcesReadable:true,allAdaptersReadable:true,guideDirectLink:true};
  await withoutJS.close();
  assert.equal(errors.length,0,'浏览器错误或缺失资源');
  record.passed = true;
  if (options.get('--report')) await writeFile(options.get('--report'),JSON.stringify(record,null,2)+'\n');
  console.log(JSON.stringify(record));
} finally {await browser.close();}
