import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/yun68/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const id=process.argv[2]||'emotion',t=Number(process.argv[3]||12.5),b=await chromium.launch({headless:true}),p=await b.newPage();
await p.goto('http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/scenarios/#scene='+id);await p.waitForFunction(()=>window.scenarioDemo?.ready);await p.waitForFunction(()=>document.querySelector('video').readyState>=2);
await p.evaluate(t=>{const v=document.querySelector('video');v.pause();scenarioDemo.state.playing=false;v.currentTime=t;},t);await p.waitForFunction(()=>!document.querySelector('video').seeking);await p.waitForTimeout(100);
const r=await p.evaluate(({id,t})=>{
  const d=scenarioDemo,v=document.querySelector('video'),c=document.createElement('canvas');c.width=1920;c.height=1080;const g=c.getContext('2d');g.drawImage(v,0,0);const video=c.toDataURL('image/jpeg',.95).split(',')[1];d.draw(id,t);const canvas=d.canvas.toDataURL('image/jpeg',.95).split(',')[1];
  g.drawImage(v,0,0);const a=g.getImageData(0,0,1920,1080).data;g.drawImage(d.canvas,0,0);const b=g.getImageData(0,0,1920,1080).data;let sum=0;for(let i=0;i<a.length;i++)if(i%4!==3)sum+=Math.abs(a[i]-b[i]);
  return {video,canvas,time:v.currentTime,paused:v.paused,error:sum/(1920*1080*3)};
},{id,t});
for(const key of ['video','canvas'])await writeFile(`projects/012-huashu-art-motion/assets/production/${id}-${key}-review.jpg`,Buffer.from(r[key],'base64'));console.log({time:r.time,paused:r.paused,fullResolutionError:r.error});await b.close();
