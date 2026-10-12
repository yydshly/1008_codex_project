// 可用于本地完整子路径及部署后的同一用户流程；不运行外部模型或重绘引导图。
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {guide,summaryItems,overviewItems} from '../web/publication.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),arg=(k,d='')=>args.includes(k)?args[args.indexOf(k)+1]:d;
const base=arg('--base','http://127.0.0.1:4222/1008_codex_project/012-huashu-art-motion/');
const isPublic=base.startsWith('https://'),checks=[],httpChecks=[],errors=[],failures=[];
const check=(name,passed,details=null)=>{checks.push({name,passed,details});if(!passed)throw new Error(name+' '+JSON.stringify(details));};
const digest=b=>createHash('sha256').update(b).digest('hex');
const expected='https://yydshly.github.io/1008_codex_project/012-huashu-art-motion/';
if(isPublic&&base!==expected)throw new Error('公开登记只允许预定部署入口');
const resources=['','overview/','scenarios/','data/research.json','data/understanding.json','data/publication.json','research.md','notes.md','production-research.md','source-manifest.json','LICENSE.upstream.txt','engine/index.html','engine/engine.js','engine/lib/fonts/OFL.txt','engine/lib/fonts/LICENSES.md','engine/lib/fonts/NotoSerifJP-subset.woff','assets/production/CREDITS.md'];
// 字体真实名称从固定清单读取，避免猜测资源名。
const manifest=JSON.parse(await readFile(path.join(project,'src/source-manifest.json'),'utf8'));
const font=manifest.files.find(f=>f.local.endsWith('.woff')).local.replace('src/upstream-engine/','engine/');
resources[15]=font;
for(const id of ['travel','life','history','product','data','emotion','interactive'])resources.push('assets/production/'+id+'.jpg');
await Promise.all(resources.map(async file=>{
 const r=await fetch(base+file,{method:'HEAD'}),record={file,status:r.status,type:r.headers.get('content-type'),passed:r.ok};httpChecks.push(record);if(!r.ok)throw new Error('HTTP '+file+' '+r.status);
}));
for(const id of ['travel','life','history','product','data','emotion','interactive']){
 const file='assets/production/'+id+'.mp4',r=await fetch(base+file,{headers:{Range:'bytes=0-63'}});
 const bytes=Buffer.from(await r.arrayBuffer());const passed=r.status===206&&r.headers.get('content-type')?.includes('video/mp4')&&bytes.length===64&&bytes.subarray(4,8).toString()==='ftyp';
 httpChecks.push({file,status:r.status,type:r.headers.get('content-type'),contentRange:r.headers.get('content-range'),passed});if(!passed)throw new Error('视频分段加载失败 '+file);
}
const response=await fetch(base+guide.file),png=Buffer.from(await response.arrayBuffer());
check('线上/本地引导图 SHA、尺寸与字节完整保留',response.ok&&digest(png)===guide.sha256&&png.length===guide.bytes&&png.readUInt32BE(16)===guide.width&&png.readUInt32BE(20)===guide.height);
if(isPublic){
 const root=new URL('../',base);for(const id of ['001-sandboard/','002-interview-guide/','003-pascal-editor/overview/','004-up-learning-guide/','005-threejs-game-skills/','006-easel/','007-octogent/','008-ghosttrack/','009-cove/','010-unsloth/','011-aitoearn/','013-aihot/','']){const r=await fetch(new URL(id,root),{method:'HEAD'});httpChecks.push({file:new URL(id,root).href,status:r.status,passed:r.ok});if(!r.ok)throw new Error('既有入口失效 '+id);}
 const rootHtml=await (await fetch(root)).text();
 check('公开总入口含完整十二摘要及既有引导图',summaryItems.every(i=>rootHtml.includes(i.text))&&rootHtml.includes('src="./012-huashu-art-motion/'+guide.file+'"'));
}
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/yun68/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1080},acceptDownloads:true});
 const observe=page=>{page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});});};
 const page=await context.newPage();observe(page);await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
 check('首页六段完整引导在图前展示',await page.locator('.publication-introduction p').count()===overviewItems.length);
 check('35 风格与九种解说资料完整',await page.locator('.style-card').count()===35&&await page.locator('.grammar').count()===9);
 await page.goto(base+'#style=33_rubberhose',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForSelector('.player-stage.ready',{timeout:120000});
 check('原版橡皮管深链接实际运行',(await page.locator('#exhibit-title').textContent()).includes('橡皮管')&&await page.frames().find(f=>f.url().includes('/engine/index.html')).evaluate(()=>Boolean(window.__canvas&&window.__ready)));
 check('桌面首页没有横向溢出',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('.understanding-actions .primary-link').click();await page.locator('#overview-image').evaluate(i=>i.decode());
 check('从首页进入原图阅读器',page.url().includes('/overview/'));
 check('十二摘要九模块十七库四复用八扩展均在静态 HTML',await page.locator('[data-summary]').count()===summaryItems.length&&await page.locator('[data-module]').count()===9&&await page.locator('[data-library]').count()===17&&await page.locator('[data-reuse]').count()===4&&await page.locator('[data-extension]').count()===8);
 check('原始七部分解释保留',await page.locator('#explanation details').count()===7);
 check('默认原图适宽',await page.locator('#zoom-value').textContent()==='100%');
 await page.locator('#zoom-in').click();check('按钮放大到150%',await page.locator('#zoom-value').textContent()==='150%');
 await page.locator('#overview-viewport').focus();await page.keyboard.press('+');check('键盘缩放到200%',await page.locator('#zoom-value').textContent()==='200%');
 check('放大后仅图像容器滚动',await page.locator('#overview-viewport').evaluate(e=>e.scrollWidth>e.clientWidth)&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.keyboard.press('0');check('键盘复位',await page.locator('#zoom-value').textContent()==='100%');
 const downloadPromise=page.waitForEvent('download');await page.locator('.overview-toolbar a[download]').click();const download=await downloadPromise;
 check('真实下载 PNG 字节一致',digest(await readFile(await download.path()))===guide.sha256);
 check('模块源码链接固定研究提交',await page.locator('#modules a').evaluateAll(links=>links.every(a=>a.href.includes('57d67608ab458f57d9b153b1a2831b921e22498b'))));
 await page.goto(base+'scenarios/#scene=emotion',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>document.querySelector('#scene-video').readyState>=2,null,{timeout:120000});
 check('场景作品可解码，时长30秒与1080p',await page.locator('#scene-video').evaluate(v=>Math.abs(v.duration-30)<0.1&&v.videoWidth===1920&&v.videoHeight===1080));
 await page.locator('[data-chapter="1"]').click();await page.waitForFunction(()=>document.querySelector('#scene-video').currentTime>=9.9);
 check('章节跳转真实视频时间',await page.locator('#scene-video').evaluate(v=>v.currentTime>=9.9));
 check('七部作品可直接下载',await page.locator('.cards .card').count()===7&&await page.locator('.cards a[href$=".mp4"]').count()===7);
 await page.locator('.scenario-nav [data-scene="interactive"]').click();await page.locator('#take-control').click();
 check('新增文化导览可进入实际探索',await page.locator('#manual-controls').isVisible()&&await page.locator('#scene-canvas').isVisible());
 await page.locator('#scene-canvas').focus();await page.keyboard.down('ArrowRight');
 await page.waitForFunction(()=>window.scenarioDemo.state.manual.x>340);await page.keyboard.up('ArrowRight');
 await page.locator('[data-find="leaf"]').click();
 check('键盘行走与附近物品发现实际生效',await page.locator('[data-find="leaf"]').getAttribute('aria-pressed')==='true'&&await page.locator('#interaction-status').textContent().then(t=>t.includes('1 / 4')));
 for(const width of [390,320]){
  const mobile=await browser.newContext({viewport:{width,height:844}}),mp=await mobile.newPage();observe(mp);
  await mp.goto(base+'overview/',{waitUntil:'domcontentloaded',timeout:120000});await mp.locator('#overview-image').evaluate(i=>i.decode());
  check(width+'px 阅读完整文字无页面横向溢出',await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await mp.locator('#zoom-in').click();check(width+'px 放大仅图内横向滚动',await mp.locator('#overview-viewport').evaluate(e=>e.scrollWidth>e.clientWidth)&&await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await mp.goto(base+'#understanding',{waitUntil:'domcontentloaded',timeout:120000});check(width+'px 首页无横向溢出',await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mobile.close();
 }
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),np=await nojs.newPage();observe(np);
 await np.goto(base+'overview/',{waitUntil:'domcontentloaded',timeout:120000});
 check('无脚本可读摘要、模块与扩展',await np.locator('[data-summary]').count()===12&&await np.locator('[data-extension]').count()===8);
 await np.locator('#explanation details').nth(1).locator('summary').click();check('无脚本仍可展开能力依据',await np.locator('#explanation details').nth(1).locator('article').first().isVisible());await nojs.close();
 check('真实流程无脚本错误和资源失败',!errors.length&&!failures.length,{errors,failures});
 const browserReport={date:new Date().toISOString(),base,passed:true,checks,errors,failures};
 const httpReport={date:new Date().toISOString(),base,passed:true,checks:httpChecks};
 const report={date:new Date().toISOString(),base,passed:true,guide,browserChecks:checks.length,httpChecks:httpChecks.length,runId:arg('--run'),runUrl:arg('--run')?'https://github.com/yydshly/1008_codex_project/actions/runs/'+arg('--run'):'',commit:arg('--commit'),scope:'静态研究、原图、真实引擎、视频解码、浏览器交互与既有入口；不代表外部模型或成片审美验收'};
 if(isPublic){for(const [name,data]of[['public-browser-checks.json',browserReport],['public-http-checks.json',httpReport],['publication-verification.json',report]])await writeFile(path.join(project,'src',name),JSON.stringify(data,null,2)+'\n');}
 else await writeFile(path.join(project,'src/local-publication-verification.json'),JSON.stringify({...report,browser:browserReport,http:httpReport},null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
