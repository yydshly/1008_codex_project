// 浏览器验收脚本；Playwright 来自环境工具，不进入研究网页的运行依赖。
// node scripts/verify-browser.mjs <playwright/index.mjs 绝对路径> [预览 URL]
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { meta, diagrams, scenarios } from '../content.js';
import {publication,guide} from '../publication.mjs';
if (!process.argv[2]) throw new Error('请提供环境中 Playwright 模块的绝对路径。');
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const url = process.argv[3] ?? 'http://127.0.0.1:4299/1008_codex_project/009-cove/';
const project = fileURLToPath(new URL('../../', import.meta.url));
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{width:1440,height:1200}, deviceScaleFactor:1 });
const errors = [];
const failedResponses = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  if (response.url().startsWith(url) && response.status() >= 400) failedResponses.push({url:response.url(),status:response.status()});
});
const checks = [];
const response = await page.goto(url, {waitUntil:'networkidle'});
assert.equal(response.status(),200);
assert.match(await page.title(), /Cove/);
assert.equal(await page.locator('main section').count(),14);
assert.equal(await page.locator('.cap-card').count(),8);
assert.equal(await page.locator('.scenario').count(),scenarios.length);
assert.equal(await page.locator('.publication-summary p').count(),12);
for(const [attribute,count] of [['system-module',8],['value',6],['reuse',4],['extension-point',8],['adaptation',6],['extension-direction',8]])assert.equal(await page.locator('[data-'+attribute+']').count(),count);
checks.push('生产子路径可直接访问；14 章、12 项摘要、8 类能力、8 组模块、6 类场景、6 项价值、4 条复用及完整适配扩展');

const poster = page.locator('#summary-figure img');
await poster.scrollIntoViewIfNeeded();
await poster.evaluate(img=>img.decode());
const posterMetaResponse = await page.request.get(new URL('assets/cove-overview-render.json',url).href);
assert.equal(posterMetaResponse.status(),200);
const posterMeta = await posterMetaResponse.json();
assert.deepEqual(await poster.evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight})),{width:posterMeta.width,height:posterMeta.height});
const posterResponse = await page.request.get(new URL('assets/cove-overview.png',url).href);
assert.equal(posterResponse.status(),200);
assert.equal(createHash('sha256').update(await posterResponse.body()).digest('hex'),posterMeta.outputSha256);
const posterSourceResponse = await page.request.get(new URL('assets/cove-overview.html',url).href);
assert.equal(posterSourceResponse.status(),200);
const posterSource = await posterSourceResponse.text();
assert.equal(createHash('sha256').update(posterSource).digest('hex'),posterMeta.sourceSha256);
assert.match(posterSource,new RegExp(meta.commit));
const posterCounts = await page.evaluate(html=>{
  const doc = new DOMParser().parseFromString(html,'text/html');
  return ['.cap-row','.scenario','.path-card','.principle','.interfaces tbody tr','.step'].map(selector=>doc.querySelectorAll(selector).length);
},posterSource);
assert.deepEqual(posterCounts,[6,6,4,4,8,6]);
const downloadPromise = page.waitForEvent('download');
await page.locator('#summary-figure a[download]').click();
assert.equal((await downloadPromise).suggestedFilename(),'cove-overview.png');
checks.push('完整总览图 '+posterMeta.width+'×'+posterMeta.height+' 加载与下载；图源、渲染记录、来源摘要一致；6 类场景、8 处扩展与 6 步适配完整');

let nodeCount = 0;
for (const diagram of diagrams) {
  await page.getByRole('tab',{name:diagram.title,exact:true}).click();
  const panel = page.locator('#diagram-' + diagram.id);
  assert.equal(await panel.isVisible(),true);
  for (const node of diagram.nodes) {
    const button = panel.locator('button[aria-controls="detail-' + diagram.id + '-' + node.id + '"]');
    await button.click();
    const detail = panel.locator('#detail-' + diagram.id + '-' + node.id);
    assert.equal(await detail.isVisible(),true);
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    assert.equal(await panel.locator('.node-detail:visible').count(),1);
    assert.match(await detail.textContent(),new RegExp(node.title.replace(/[.*+?^$()|[\]\\]/g,'\\$&')));
    assert.equal(await detail.locator('a').count(),node.files.length);
    nodeCount++;
  }
  const download = await page.request.get(new URL('assets/architecture-' + diagram.id + '.svg',url).href);
  assert.equal(download.status(),200);
  assert.match(await download.text(),new RegExp(meta.commit));
}
checks.push('四图切换、全部 '+nodeCount+' 个模块详情及对应来源、四张 SVG 下载');
await page.getByRole('tab',{name:diagrams[0].title,exact:true}).focus();
await page.keyboard.press('ArrowRight');
assert.equal(await page.getByRole('tab',{name:diagrams[1].title,exact:true}).getAttribute('aria-selected'),'true');
await page.keyboard.press('End');
assert.equal(await page.getByRole('tab',{name:diagrams[3].title,exact:true}).getAttribute('aria-selected'),'true');
await page.keyboard.press('Home');
assert.equal(await page.getByRole('tab',{name:diagrams[0].title,exact:true}).getAttribute('aria-selected'),'true');
checks.push('图类型的方向键 / Home / End 导航');

const manifest = JSON.parse(await fs.readFile(path.join(project,'src/source-manifest.json'),'utf8'));
const knownFiles = new Set(manifest.files.map(f => f.path));
const knownDirectories = new Set(manifest.directories.map(f => f.path.replace(/\/$/,'')));
knownDirectories.add('.agents');
const sourceHrefs = await page.locator('a[href*="' + meta.commit + '"]').evaluateAll(links => links.map(link => link.href));
for (const href of sourceHrefs) {
  const file = decodeURIComponent(new URL(href).pathname.split(meta.commit + '/')[1] ?? '');
  if (!file) continue;
  assert.ok(knownFiles.has(file) || knownDirectories.has(file.replace(/\/$/,'')),'未登记源码：'+file);
}
for (const file of ['styles.css','app.js','assets/favicon.svg','research.md','notes.md','understanding.md','publication.json','map.html','map.css','map.js','LICENSE.upstream.txt','source-manifest.json']) {
  const resource = await page.request.get(new URL(file,url).href);
  assert.equal(resource.status(),200,'资源缺失：'+file);
}
const redirect = await page.request.get(url.replace(/\/$/,''),{maxRedirects:0});
assert.equal(redirect.status(),302);
assert.equal((await page.request.get(new URL('/outside-cove/',url).href)).status(),404);
checks.push('固定提交源码链接全部校对；静态资源、研究文档、许可、来源清单和子路径重定向');

await page.getByRole('tab',{name:diagrams[0].title,exact:true}).click();
await page.locator('#diagram-system button[aria-controls="detail-system-auth"]').click();
await page.locator('.architecture-panel').scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollTo(0,document.querySelector('.architecture-panel').getBoundingClientRect().top+window.scrollY-90));
await page.screenshot({path:path.join(project,'assets/cover.png')});
await page.locator('.architecture-panel').screenshot({path:path.join(project,'assets/architecture-desktop.png')});
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'桌面页面横向溢出');

await page.setViewportSize({width:390,height:1050});
await page.goto(url,{waitUntil:'networkidle'});
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'手机页面横向溢出');
for (const d of diagrams) {
  await page.getByRole('tab',{name:d.title,exact:true}).click();
  const panel = page.locator('#diagram-'+d.id);
  await panel.locator('.diagram-scroll').evaluate(element => {element.scrollLeft=element.scrollWidth;});
  const last = d.nodes.at(-1);
  const button = panel.locator('button[aria-controls="detail-'+d.id+'-'+last.id+'"]');
  await button.click();
  assert.equal(await panel.locator('#detail-'+d.id+'-'+last.id).isVisible(),true);
}
checks.push('390px 手机宽度无页面横向溢出；四张图可在内部滚动并选择右侧模块');
await page.getByRole('tab',{name:diagrams[0].title,exact:true}).click();
await page.locator('#diagram-system .diagram-scroll').evaluate(element => {element.scrollLeft=0;});
await page.locator('#diagram-system button[aria-controls="detail-system-ui"]').click();
await page.evaluate(() => window.scrollTo(0,document.querySelector('.architecture-panel').getBoundingClientRect().top+window.scrollY-75));
await page.screenshot({path:path.join(project,'assets/mobile.png')});
await page.evaluate(() => {document.body.style.zoom='2';});
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'页面放大后横向溢出');
await page.evaluate(() => {document.body.style.zoom='';});
checks.push('页面整体 2 倍缩放后无全页横向溢出；图表保留内部滚动区域');
await page.locator('.sources summary').click();
assert.equal(await page.locator('.sources[open]').count(),1);
assert.equal(errors.length,0,'浏览器脚本错误');
assert.equal(failedResponses.length,0,'静态资源 HTTP 错误');
checks.push('来源说明可展开；浏览器脚本错误与资源错误均为 0');
await page.goto(new URL('map.html',url).href,{waitUntil:'networkidle'});
await page.locator('#map').evaluate(img=>img.decode());
assert.deepEqual(await page.locator('#map').evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight})),{width:guide.width,height:guide.height});
await page.getByRole('button',{name:'100%',exact:true}).click();
assert.equal(await page.locator('#map').evaluate(img=>img.clientWidth),2700);
await page.getByRole('button',{name:'50%',exact:true}).click();
assert.equal(await page.locator('#map').evaluate(img=>img.clientWidth),1350);
await page.locator('#zoom').evaluate(input=>{input.value='75';input.dispatchEvent(new Event('input',{bubbles:true}));});
assert.equal(await page.locator('#map').evaluate(img=>img.clientWidth),2025);
await page.getByRole('button',{name:'适合宽度'}).click();
assert.ok(await page.locator('#viewport').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
const mapDownloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'下载完整 PNG',exact:true}).click();
assert.equal((await mapDownloadPromise).suggestedFilename(),guide.file);
checks.push('原图阅读器 100%、50%、滑杆、适合宽度和 PNG 下载；图片自然尺寸保持完整');
for(const width of [320,390]){
  await page.setViewportSize({width,height:1050});await page.goto(url+'#interfaces',{waitUntil:'networkidle'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'手机页面横向溢出');
  await page.reload({waitUntil:'networkidle'});assert.equal(new URL(page.url()).hash,'#interfaces');
  await page.goto(url+'#summary-figure',{waitUntil:'networkidle'});
  await page.locator('#summary-figure img').evaluate(img=>img.decode());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'手机引导图横向溢出');
}
checks.push('320 / 390px 手机正文、引导图和接口章节刷新；图表保留内部滚动');
const noScript=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:1050}});
const staticPage=await noScript.newPage();await staticPage.goto(url,{waitUntil:'networkidle'});
assert.equal(await staticPage.locator('main section').count(),14);
for(const item of publication.summaryItems)assert.ok((await staticPage.locator('#summary').textContent()).includes(item.text));
assert.equal(await staticPage.locator('[data-extension-direction]').count(),8);
await staticPage.goto(new URL('map.html',url).href,{waitUntil:'networkidle'});
assert.ok(await staticPage.locator('#map').evaluate(img=>img.complete&&img.naturalWidth===2700));
await noScript.close();checks.push('禁用 JavaScript 仍有完整理解、扩展正文与完整引导图');
await fs.writeFile(path.join(project,'assets/verification.json'),JSON.stringify({
  researchDate:meta.date,publicationDate:publication.meta.publicationDate,commit:meta.commit,url,checks,nodeCount,
  screenshots:[{file:'cover.png',width:1440,height:1200},{file:'architecture-desktop.png',type:'interactive architecture panel'},{file:'mobile.png',width:390,height:1050}],
  overview:{file:'cove-overview.png',width:posterMeta.width,height:posterMeta.height,counts:posterCounts},
  sourceFileCount:manifest.files.length,errors,failedResponses,
  scope:'Static research website only; no Cove backend, OAuth, database or production performance test.'
},null,2)+'\n');
console.log(JSON.stringify({status:'passed',checks,nodeCount,sourceFileCount:manifest.files.length,errors,failedResponses},null,2));
await browser.close();
