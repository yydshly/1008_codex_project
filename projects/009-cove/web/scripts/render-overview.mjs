// 用浏览器将原创图源栅格化为高清 PNG；环境的 Playwright 不加入项目运行依赖。
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
if (!process.argv[2]) throw new Error('参数：环境中的 playwright/index.mjs 绝对路径');
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const assets = new URL('../../assets/',import.meta.url);
const htmlFile = new URL('cove-overview.html',assets);
const html = await readFile(htmlFile,'utf8');
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({viewport:{width:1800,height:1000},deviceScaleFactor:1.5});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(htmlFile.href,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.cap-row').count(),6);
  assert.equal(await page.locator('.scenario').count(),6);
  assert.equal(await page.locator('.path-card').count(),4);
  assert.equal(await page.locator('.principle').count(),4);
  assert.equal(await page.locator('.interfaces tbody tr').count(),8);
  assert.equal(await page.locator('.step').count(),6);
  assert.ok(await page.locator('.chart').evaluate(img=>img.complete && img.naturalWidth>0));
  const dimensions=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
  assert.equal(dimensions.width,1800,'图源有意外横向溢出');
  assert.equal(errors.length,0);
  const clipping=await page.locator('.poster *').evaluateAll(elements=>elements.filter(element=>{
    const css=getComputedStyle(element);
    return (css.overflowY==='hidden' || css.overflowX==='hidden') && (element.scrollHeight>element.clientHeight+1 || element.scrollWidth>element.clientWidth+1);
  }).map(element=>({tag:element.tagName,class:element.className})));
  assert.deepEqual(clipping,[],'存在被裁剪的图中文字');
  await page.screenshot({path:fileURLToPath(new URL('cove-overview.png',assets)),fullPage:true});
  const png = await readFile(new URL('cove-overview.png',assets));
  const pixels = {width:png.readUInt32BE(16),height:png.readUInt32BE(20)};
  await writeFile(new URL('cove-overview-render.json',assets),JSON.stringify({
    date:'2026-10-09',source:'cove-overview.html',
    sourceSha256:createHash('sha256').update(html).digest('hex'),
    outputSha256:createHash('sha256').update(png).digest('hex'),
    output:'cove-overview.png',width:pixels.width,height:pixels.height,
    logicalWidth:dimensions.width,logicalHeight:dimensions.height,
    mode:'Deterministic HTML/CSS + original SVG architecture, rasterized with Chromium.',
    checks:{capabilities:6,scenarios:6,requestPaths:4,principles:4,extensionPoints:8,adaptationSteps:6,clipping,errors}
  },null,2)+'\n');
  console.log('已生成高清总览 PNG：'+pixels.width+' × '+pixels.height);
  // 仅在需要检查局部时输出到系统临时目录，项目交付仍只有同一张完整 PNG。
  if (process.argv[3]) {
    const directory=pathToFileURL(process.argv[3].replace(/[\\/]?$/,'/'));
    for(const selector of ['.top-grid','.architecture','.interfaces','.adaptation']){
      await page.locator(selector).screenshot({path:fileURLToPath(new URL(selector.slice(1)+'.png',directory))});
    }
  }
} finally {
  await browser.close();
}
