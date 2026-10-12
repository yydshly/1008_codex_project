// 原创完整研究图版：真实参考图 + 精确中文排版，Chromium 渲染 PNG；不改动上游图片。
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {understanding} from '../web/understanding.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(project,'assets/understanding');
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/yun68/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.RESEARCH_URL||'http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:2});
  const failures=[],errors=[];
  page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'overview/poster.html',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  const box=await page.locator('.research-map').boundingBox();
  const layout=await page.evaluate(()=>({
    width:document.querySelector('.research-map').clientWidth,
    horizontalOverflow:document.documentElement.scrollWidth>1600,
    capabilities:document.querySelectorAll('.map-capability').length,
    styleGroups:document.querySelectorAll('.map-style-groups>div').length,
    grammars:document.querySelectorAll('.map-grammars>div').length,
    scenarios:document.querySelectorAll('.map-table tbody tr').length,
    sections:document.querySelectorAll('.map-section').length,
    missingImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),
    blocks:[...document.querySelectorAll('.map-section')].map(e=>({title:e.querySelector('h2').textContent,height:Math.round(e.getBoundingClientRect().height)})),
  }));
  if(layout.horizontalOverflow||layout.capabilities!==9||layout.grammars!==9||layout.scenarios!==6||layout.sections!==7||layout.missingImages.length||failures.length||errors.length)throw new Error('图版未通过渲染检查：'+JSON.stringify({layout,failures,errors}));
  await page.locator('.research-map').screenshot({path:path.join(output,'overview.png')});
  await page.locator('.research-map').screenshot({path:path.join(output,'preview.jpg'),type:'jpeg',quality:90});
  await page.locator('.map-capabilities').screenshot({path:path.join(output,'detail-capabilities.png')});
  await page.locator('.map-value').screenshot({path:path.join(output,'detail-value.png')});
  const imagePaths=['styles/09_postimp.jpg','styles/17_ink.jpg','styles/33_rubberhose.jpg','upstream/动画语法/y3_whiteboard_总览.jpg','upstream/动画语法/y2_vox_总览.jpg'];
  const inputs=[];
  for(const ref of imagePaths){const bytes=await readFile(path.join(project,'assets',ref));inputs.push({file:'assets/'+ref,sha256:createHash('sha256').update(bytes).digest('hex'),origin:ref.startsWith('styles/')?'固定上游场景本机渲染':'作者解说示范截图，仅作Skill研究说明'});}
  for(const capability of understanding.capabilities)await stat(path.join(project,'upstream',capability.file));
  const png=await readFile(path.join(output,'overview.png'));
  const manifest={date:understanding.meta.date,upstream:understanding.meta.upstream,commit:understanding.meta.commit,method:'原创HTML/CSS版式，Chromium像素渲染；未生成新美术、未修改原版素材',output:{file:'assets/understanding/overview.png',width:png.readUInt32BE(16),height:png.readUInt32BE(20),bytes:png.length,sha256:createHash('sha256').update(png).digest('hex')},inputs,content:{capabilities:9,styles:35,grammars:9,parameterizedGrammars:8,scenarios:6,extensions:4,sections:7},layout,limitations:[understanding.evidence,understanding.visualCredits]};
  await writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({output:manifest.output,layout},null,2));
}finally{await browser.close();}
