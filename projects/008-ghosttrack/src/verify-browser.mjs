// 网页交付核验，使用已有 Playwright，不访问上游信息查询服务。
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { guide } from '../web/publication.mjs';
const args=new Map();for(let i=2;i<process.argv.length;i+=2)args.set(process.argv[i],process.argv[i+1]);
const modulePath=args.get('--playwright');if(!modulePath)throw new Error('需要 --playwright <已安装模块绝对路径>');
const {chromium}=await import(pathToFileURL(modulePath).href);
const base=args.get('--url')||'http://127.0.0.1:4295/1008_codex_project/008-ghosttrack/';
const root=fileURLToPath(new URL('../',import.meta.url));
const publicRun=new URL(base).protocol==='https:';
const report={date:new Date().toISOString(),base,scope:'研究网页交付；不测试真实查询',checks:[],errors:[],externalRequests:[]};
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1080},acceptDownloads:true});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 page.on('request',r=>{if(new URL(r.url()).origin!==new URL(base).origin)report.externalRequests.push(r.url());});
 assert.equal((await page.goto(base)).status(),200);
 assert.equal(await page.locator('.summary-list p').count(),12);
 assert.equal(await page.locator('[data-system-module]').count(),8);
 assert.equal(await page.locator('[data-extension]').count(),8);
 await page.locator('.overview-figure img').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('.overview-figure img').naturalWidth===2160);
 assert.equal(await page.locator('.overview-figure img').evaluate(i=>i.naturalHeight),3853);
 for(const id of ['public-ip','phone','username','ip']){
  await page.locator(`#tab-${id}`).click();assert(await page.locator(`#${id}`).isVisible());
  assert.equal(await page.locator('[role="tabpanel"]:visible').count(),1);assert.equal(new URL(page.url()).hash,`#${id}`);
 }
 await page.locator('#tab-ip').focus();await page.keyboard.press('End');assert.equal(new URL(page.url()).hash,'#username');
 await page.keyboard.press('Home');assert.equal(new URL(page.url()).hash,'#ip');
 await page.keyboard.press('ArrowRight');assert.equal(new URL(page.url()).hash,'#public-ip');
 await page.goto(base+'#phone');await page.reload();assert(await page.locator('#phone').isVisible());
 await page.locator('#tab-username').click();await page.goBack();assert(await page.locator('#phone').isVisible());
 await page.locator('.platform-details summary').click();assert.equal(await page.locator('.platforms span:visible').count(),23);
 report.checks.push('12摘要、8模块、8扩展、原图尺寸、4能力切换、键盘、深链接刷新、后退、平台明细');
 await page.goto(base+'map.html');await page.locator('#map').waitFor();
 await page.waitForFunction(()=>document.querySelector('#map').complete);
 await page.locator('[data-zoom="1"]').click();assert.equal(await page.locator('#map').evaluate(i=>i.getBoundingClientRect().width),2160);
 assert(await page.locator('#viewport').evaluate(v=>v.scrollWidth>v.clientWidth));
 await page.locator('#fit').click();assert(await page.locator('#viewport').evaluate(v=>v.scrollWidth<=v.clientWidth+1));
 await page.locator('#zoom').fill('75');assert.equal(await page.locator('#map').evaluate(i=>i.getBoundingClientRect().width),1620);
 const downloadPromise=page.waitForEvent('download');await page.locator('a[download]').click();const download=await downloadPromise;
 const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);
 assert.equal(createHash('sha256').update(Buffer.concat(chunks)).digest('hex'),guide.sha256);
 report.checks.push('缩放100%/适合宽度/滑杆、横向滚动与真实PNG下载SHA-256');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await page.goto(base);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}px正文撑宽`);
  await page.locator('#tab-phone').click();assert(await page.locator('#phone').isVisible());
  await page.goto(base+'map.html');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}px图页撑宽`);
  await page.locator('[data-zoom="1"]').click();await page.locator('#fit').click();
  assert(await page.locator('#viewport').evaluate(v=>v.scrollWidth<=v.clientWidth+1));
 }
 report.checks.push('390/320px手机正文、能力切换、图页缩放与无外部横向溢出');
 await page.setViewportSize({width:1440,height:1080});await page.goto(base);
 await page.addStyleTag({content:'html{font-size:200%}'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200%字号撑宽');
 report.checks.push('200%字号布局');
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const plain=await nojs.newPage();await plain.goto(base);
 assert.equal(await plain.locator('[role="tabpanel"]:visible').count(),4);assert.equal(await plain.locator('[data-extension]').count(),8);
 report.checks.push('关闭JavaScript仍显示四项能力及完整正文');await nojs.close();
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);
 const output=args.get('--output')||path.join(root,'src',publicRun?'public-browser-checks.json':'local-browser-checks.json');
 report.passed=true;await writeFile(output,JSON.stringify(report,null,2)+'\n');
 if(!publicRun){
  await mkdir(path.join(root,'assets/publication'),{recursive:true});
  await page.goto(base);await page.screenshot({path:path.join(root,'assets/publication/desktop.png')});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(root,'assets/publication/mobile.png')});
 }
 console.log(JSON.stringify(report));
}finally{await browser.close();}
