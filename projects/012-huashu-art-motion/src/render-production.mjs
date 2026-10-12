// 正式作品：Chromium实际合成 → JPEG逐帧管道 → FFmpeg 1080p H.264/AAC。
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/yun68/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'assets','production');
const ffmpeg=process.env.FFMPEG_BIN||'D:/26project/26audio_and_video_project/ffmpeg-n6.1.3-win64-gpl-shared-6.1/bin/ffmpeg.exe',ffprobe=path.join(path.dirname(ffmpeg),'ffprobe.exe');
const url=(process.env.RESEARCH_URL||'http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/scenarios/')+'?render=1';
const attribution='Music: Dreamer by Kevin MacLeod (incompetech.com). CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ . Adapted: 20-50s excerpt, normalized loudness and fades. New visual scenes and compositing by this research project.';
await mkdir(out,{recursive:true});
const only=process.argv.find(v=>v.startsWith('--only='))?.slice(7),stills=process.argv.includes('--stills');
execFileSync(ffmpeg,['-y','-loglevel','error','-ss','20','-i',path.join(out,'dreamer-original.mp3'),'-t','30','-af','loudnorm=I=-18:TP=-2:LRA=9,afade=t=in:st=0:d=0.7,afade=t=out:st=27:d=3','-c:a','aac','-b:a','192k',path.join(out,'dreamer-30s.m4a')],{windowsHide:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.scenarioDemo?.ready);
const scenes=await page.evaluate(()=>scenarioDemo.catalog.map(({id,title,duration})=>({id,title,duration}))),results=[];
for(const s of scenes.filter(v=>!only||v.id===only)){
  const result=await page.evaluate(({id})=>{
    const d=scenarioDemo,c=d.canvas;d.draw(id,4.6);const first=c.toDataURL();d.draw(id,23.2);d.draw(id,4.6);const deterministic=first===c.toDataURL();
    const hashes=[];for(const t of [1,3,5,8,10.6,13,16,19,21,24,26,29]){
      d.draw(id,t);const tiny=document.createElement('canvas');tiny.width=96;tiny.height=54;tiny.getContext('2d').drawImage(c,0,0,96,54);
      const bytes=tiny.getContext('2d').getImageData(0,0,96,54).data;let hash=0;for(const b of bytes)hash=(Math.imul(hash,31)+b)|0;hashes.push(hash);
    }d.draw(id,id==='data'?4.4:id==='product'?7.2:4.6);return {deterministic,hashes,jpeg:c.toDataURL('image/jpeg',.96).split(',')[1]};
  },s);
  await writeFile(path.join(out,s.id+'.jpg'),Buffer.from(result.jpeg,'base64'));delete result.jpeg;
  for(let k=0;k<3;k++){
    const frame=await page.evaluate(({id,t})=>{scenarioDemo.draw(id,t);return scenarioDemo.canvas.toDataURL('image/jpeg',.96).split(',')[1];},{id:s.id,t:k*10+7.2});
    await writeFile(path.join(out,s.id+'-'+(k+1)+'.jpg'),Buffer.from(frame,'base64'));
  }
  if(stills){results.push({...s,...result});console.log('作品静帧：'+s.id);continue;}
  const args=['-y','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate','24','-i','pipe:0','-i',path.join(out,'dreamer-30s.m4a'),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-metadata','title='+s.title,'-metadata','comment='+attribution,'-shortest',path.join(out,s.id+'.mp4')];
  const encoder=spawn(ffmpeg,args,{stdio:['pipe','ignore','pipe'],windowsHide:true});let log='';encoder.stderr.on('data',d=>log+=d);encoder.stdin.on('error',()=>{});
  const finished=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('close',code=>code===0?resolve():reject(new Error(log||'FFmpeg '+code)));});const start=Date.now();
  for(let i=0;i<720;i++){
    const jpg=await page.evaluate(({id,t})=>{scenarioDemo.draw(id,t);return scenarioDemo.canvas.toDataURL('image/jpeg',.96).split(',')[1];},{id:s.id,t:i/24});
    if(!encoder.stdin.write(Buffer.from(jpg,'base64')))await once(encoder.stdin,'drain');
  }encoder.stdin.end();await finished;
  const probe=JSON.parse(execFileSync(ffprobe,['-v','error','-show_streams','-show_format','-of','json',path.join(out,s.id+'.mp4')],{windowsHide:true,encoding:'utf8'}));
  const v=probe.streams.find(v=>v.codec_type==='video'),a=probe.streams.find(v=>v.codec_type==='audio');
  results.push({...s,...result,frames:720,fps:24,width:v.width,height:v.height,exportMs:Date.now()-start,seconds:Number(probe.format.duration),audio:a?.codec_name,bytes:Number(probe.format.size)});
  console.log('完整作品：'+s.id+'，1080p / 720帧 / '+Math.round((Date.now()-start)/1000)+'秒完成。');
}
const contact=await page.evaluate(()=>{
  const d=scenarioDemo,c=document.createElement('canvas');c.width=1980;c.height=3030;const g=c.getContext('2d');g.fillStyle='#101714';g.fillRect(0,0,c.width,c.height);g.fillStyle='#eee8d5';g.font='48px SceneSerif';g.fillText('艺术动画 · 应用作品集',50,75);g.font='22px SceneSans';g.fillStyle='#a7b49f';g.fillText('重新制作的场景作品 · 真实素材合成 · 30秒 / 1080p / 配乐',50,123);
  d.catalog.forEach((s,row)=>{const y=185+row*400;g.font='25px SceneSans';g.fillStyle='#d6c393';g.fillText(s.number+'  '+s.name+' / '+s.title,50,y);for(let k=0;k<3;k++){d.draw(s.id,k*10+7.2);g.drawImage(d.canvas,50+k*638,y+20,615,345.9375);}});
  return c.toDataURL('image/jpeg',.95).split(',')[1];
});await writeFile(path.join(out,'overview.jpg'),Buffer.from(contact,'base64'));
const reportFile=path.join(out,stills?'stills-report.json':'render-report.json');
let merged=results;if(only&&!stills){try{const prev=JSON.parse(await readFile(reportFile,'utf8'));merged=scenes.map(s=>results.find(v=>v.id===s.id)||prev.results.find(v=>v.id===s.id)).filter(Boolean);}catch(e){if(e.code!=='ENOENT')throw e;}}
await writeFile(reportFile,JSON.stringify({date:'2026-10-09',url,browser:await browser.version(),results:merged,errors,scope:stills?'作品版静帧审阅':'7部30秒MP4，1920×1080，24fps；真实录制配乐CC BY 4.0；素材分层和透明动作帧合成。'},null,2)+'\n');
await browser.close();if(errors.length||results.some(r=>!r.deterministic||new Set(r.hashes).size<9))throw new Error('确定性或运动验证失败');console.log('作品渲染检查通过。');
