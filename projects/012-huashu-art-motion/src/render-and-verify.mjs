// 原创集成验证：实际运行固定的上游引擎，生成35张静帧，检查每段运动、重复绘制和进入转场。
// Playwright由本机依赖包提供；可用PLAYWRIGHT_MODULE指向其他安装，未作为展示页依赖。
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/yun68/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=process.env.RESEARCH_URL||'http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/';
const errors=[],requests=[];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)requests.push({url:r.url(),status:r.status()});});
await page.goto(url+'engine/index.html?film=gallery&render=1',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__ready===true,{timeout:120000});
const entries=await page.evaluate(()=>ERAS.map(e=>({id:e.id,name:e.name,start:e.t0,duration:e.dur??e.eighths*60/(window.BPM||128)/2,transition:e.transition?.type||null})));
if(entries.length!==35)throw new Error('原版段落表不是35种');
await mkdir(path.join(project,'assets','styles'),{recursive:true});
const results=[];
for(const e of entries){
  const metrics=await page.evaluate(({id,start,duration,transition})=>{
    const cv=window.__canvas,ctx=cv.getContext('2d');
    const mini=document.createElement('canvas');mini.width=192;mini.height=108;const m=mini.getContext('2d',{willReadFrequently:true});
    const capture=t=>{renderSolo(id,t,{counter:false});m.clearRect(0,0,192,108);m.drawImage(cv,0,0,192,108);return m.getImageData(0,0,192,108).data;};
    const a=capture(.42),b=capture(.9);let changed=0,mean=0;
    for(let i=0;i<a.length;i+=4){const d=(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]))/3;mean+=d;if(d>12)changed++;}
    renderSolo(id,.7,{counter:false});const first=cv.toDataURL();
    renderSolo(id,.85,{counter:false});renderSolo(id,.7,{counter:false});const same=first===cv.toDataURL();
    const began=performance.now();renderSolo(id,.7,{counter:false});ctx.getImageData(0,0,1,1);const cost=performance.now()-began;
    if(transition){const tr=ERAS.find(x=>x.id===id).transition;for(const p of [.25,.5,.75])renderFrame(start+(tr.delay||0)+tr.dur*p);}
    renderSolo(id,.7,{counter:false});const thumbnail=document.createElement('canvas');thumbnail.width=720;thumbnail.height=405;thumbnail.getContext('2d').drawImage(cv,0,0,720,405);
    return {deterministic:same,motionPercent:+(100*changed/(192*108)).toFixed(3),meanDifference:+(mean/(192*108)).toFixed(3),frameMs:+cost.toFixed(2),image:thumbnail.toDataURL('image/jpeg',.88)};
  },e);
  const {image,...measures}=metrics;
  await writeFile(path.join(project,'assets','styles',e.id+'.jpg'),Buffer.from(image.split(',')[1],'base64'));
  results.push({...e,...measures});console.log(e.id+': motion '+measures.motionPercent+'%, deterministic '+measures.deterministic+', '+measures.frameMs+' ms');
}
const report={date:'2026-10-09',commit:'57d67608ab458f57d9b153b1a2831b921e22498b',browser:await browser.version(),viewport:[1920,1080],thumbnail:[720,405],sampleTimes:[.42,.7,.85,.9],motionNote:'缩小到192×108后比较0.42与0.90秒，相邻采样RGB平均差>12的像素占比；这是两帧运动线索，不是完整QA流畅度结论。',results,errors,failedResponses:requests};
await writeFile(path.join(project,'assets','render-verification.json'),JSON.stringify(report,null,2)+'\n');
await browser.close();
if(errors.length||requests.length)throw new Error('场景或资源出现错误，见render-verification.json');
console.log('已实际渲染全部35种风格与34个进入转场，记录已保存。');
