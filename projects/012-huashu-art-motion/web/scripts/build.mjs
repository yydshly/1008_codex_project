// 原创独立构建，无第三方网页依赖。保留上游引擎和许可，所有静态资源使用相对路径。
import { readFile, writeFile, mkdir, cp, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { meta, groups, styles, capabilities, grammars, principles, method, source } from '../content.mjs';
import {catalog} from '../scenarios/production-catalog.js';
import {understanding} from '../understanding.mjs';
import {mainOverview, overviewPage, posterPage} from '../overview/render.mjs';
import {publication} from '../publication.mjs';
const web=fileURLToPath(new URL('../',import.meta.url)),project=path.resolve(web,'..'),out=path.join(web,'dist');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(file,label)=>`<a class="source-link" href="${source(file)}" target="_blank" rel="noopener noreferrer">${esc(label||file)}</a>`;
function inspector(s){return `<div class="inspector-meta"><span class="group">${s.group}</span><span>${'★'.repeat(s.quality)} · 作者自评</span></div><h2 id="exhibit-title">${s.name}</h2><p class="keywords">${s.keywords}</p><p>${s.description}</p><dl><div><dt>怎样画</dt><dd>${esc(s.renderer)}</dd></div><div><dt>画里什么在动</dt><dd>${esc(s.motion)}</dd></div><div><dt>如何进入这幅画</dt><dd>${esc(s.transition)}</dd></div><div><dt>选型参考 · 本研究建议</dt><dd>${s.fit}</dd></div><div class="weakness"><dt>当前实现短板 · 上游记录</dt><dd>${esc(s.weakness)}</dd></div></dl><div class="inspector-links"><a href="${s.recipe}" target="_blank" rel="noopener noreferrer">风格配方</a><a href="${s.scene}" target="_blank" rel="noopener noreferrer">场景源码</a></div>`;}
const blocks={
  UNDERSTANDING:mainOverview(),
  INSPECTOR:inspector(styles.find(s=>s.id==='09_postimp')),
  FILTERS:['全部',...groups].map(g=>`<button type="button" data-group="${g}" aria-pressed="${g==='全部'}">${g}</button>`).join(''),
  STYLE_CARDS:styles.map((s,i)=>`<article class="style-card" data-id="${s.id}"><button class="style-select" type="button" data-id="${s.id}" aria-label="查看${s.name}动态效果" aria-pressed="${s.id==='09_postimp'}"><img src="${s.thumb}" width="720" height="405" loading="lazy" alt="${esc(s.name)}：原版场景代码的本机静帧"><span class="card-number">${String(i+1).padStart(2,'0')} / ${s.group}</span></button><div class="card-heading"><h3>${s.name}</h3><span class="quality">${'★'.repeat(s.quality)}</span></div><p class="card-keywords">${s.keywords}</p><p>${s.description}</p><details><summary>绘画、动作与转场</summary><div class="card-detail"><p><b>绘画：</b>${esc(s.renderer)}</p><p><b>动作：</b>${esc(s.motion)}</p><p><b>转场：</b>${esc(s.transition)}</p><p><b>适用方向：</b>${s.fit}</p><p><b>当前短板：</b>${esc(s.weakness)}</p><a href="${s.recipe}" target="_blank" rel="noopener noreferrer">上游配方</a> · <a href="${s.scene}" target="_blank" rel="noopener noreferrer">场景源码</a></div></details></article>`).join(''),
  CAPABILITIES:capabilities.map(([title,stat,text,boundary,file])=>`<article class="capability"><h3>${title}</h3><p class="cap-stat">${stat}</p><p>${text}</p><p class="cap-boundary">${boundary}</p>${link(file,'查看实现依据')}</article>`).join(''),
  GRAMMARS:grammars.map(([id,title,text])=>`<article class="grammar ${id.startsWith('y6')?'reference-only':''}">${id.startsWith('y6')?'<span class="badge">语法卡与整片参考</span>':`<a href="./assets/upstream/动画语法/${id}_总览.jpg" target="_blank" rel="noopener noreferrer" aria-label="打开${title}完整镜头总览"><img src="./assets/upstream/动画语法/${id}_总览.jpg" loading="lazy" alt="作者${title}示范片的镜头截图"></a>`}<h4>${title}</h4><p>${text}</p>${link('references/动画语法/'+id+'.md','上游语法卡')}</article>`).join(''),
  METHOD:method.map(([title,text],i)=>`<article class="method-step"><span class="step-num">${String(i+1).padStart(2,'0')}</span><h3>${title}</h3><p>${text}</p></article>`).join(''),
  PRINCIPLES:principles.map(([title,text,file])=>`<article class="principle"><h3>${title}</h3><p>${text}</p>${link(file,'源码与说明')}</article>`).join(''),
  SOURCES:[['README.md','项目定位、能力、示范素材与许可例外。'],['references/风格配方/INDEX.md','35种风格及当前质量、短板。'],['references/08-风格作者规范.md','查原作、提炼形式元素、静帧对照和验收。'],['references/03-一帧先行四条路线.md','纯代码、分层素材、视频模型与混合路线。'],['scripts/engine/engine.js','全局时间、场景绘制与离屏转场。'],['scripts/engine/render.py','Chromium逐帧取图及FFmpeg出片。']].map(([file,note])=>`<div class="source-entry">${link(file,file)}<p>${note}</p></div>`).join(''),
  DATA:JSON.stringify({meta,styles}).replace(/</g,'\\u003c'),
};
let html=await readFile(path.join(web,'index.template.html'),'utf8');
for(const[key,value]of Object.entries(blocks)){const mark='<!-- '+key+' -->';if(!html.includes(mark))throw new Error('缺少模板块：'+key);html=html.replace(mark,value);}
if(/<!-- [A-Z_]+ -->/.test(html)||/\b(?:href|src)=["']\/(?!\/)/.test(html))throw new Error('未替换模板或根路径资源');
for(const s of styles)await access(path.join(project,'src','upstream-engine','scenes',s.id+'.js'));
await mkdir(out,{recursive:true});
await cp(path.join(project,'src','upstream-engine'),path.join(out,'engine'),{recursive:true});
await cp(path.join(project,'assets'),path.join(out,'assets'),{recursive:true});
await writeFile(path.join(out,'index.html'),html);
await mkdir(path.join(out,'data'),{recursive:true});
await writeFile(path.join(out,'data','research.json'),JSON.stringify({meta,styles,capabilities,grammars,principles,method},null,2)+'\n');
await writeFile(path.join(out,'data','understanding.json'),JSON.stringify(understanding,null,2)+'\n');
await writeFile(path.join(out,'data','publication.json'),JSON.stringify(publication,null,2)+'\n');
for(const file of ['publication-verification.json','public-http-checks.json','public-browser-checks.json']){
  try{await copyFile(path.join(project,'src',file),path.join(out,'data',file));}catch(e){if(e.code!=='ENOENT')throw e;}
}
await mkdir(path.join(out,'overview'),{recursive:true});
await writeFile(path.join(out,'overview','index.html'),overviewPage());
await writeFile(path.join(out,'overview','poster.html'),posterPage());
for(const f of ['overview.css','overview.js'])await copyFile(path.join(web,'overview',f),path.join(out,'overview',f));
for(const f of ['app.js','styles.css'])await copyFile(path.join(web,f),path.join(out,f));
for(const[from,to]of [['README.md','research.md'],['notes.md','notes.md'],['src/LICENSE.upstream.txt','LICENSE.upstream.txt'],['src/source-manifest.json','source-manifest.json']]){try{await copyFile(path.join(project,from),path.join(out,to));}catch(error){if(error.code!=='ENOENT')throw error;}}
await copyFile(path.join(project,'src','LICENSE.upstream.txt'),path.join(out,'engine','LICENSE.upstream.txt'));
await mkdir(path.join(out,'scenarios'),{recursive:true});
let scenarioHtml=await readFile(path.join(web,'scenarios','production-index.template.html'),'utf8');
scenarioHtml=scenarioHtml.replace('<!-- TABS -->',catalog.map(s=>`<button type="button" data-scene="${s.id}" aria-pressed="${s.id==='travel'}"><span>${s.number}</span>${s.name}</button>`).join('')).replace('<!-- CHAPTERS -->',catalog[0].chapters.map((s,i)=>`<button type="button" data-chapter="${i}"><span>0${i+1}</span>${s}</button>`).join('')).replace('<!-- CARDS -->',catalog.map(s=>`<article class="card"><button class="card-image" type="button" data-scene="${s.id}" aria-label="观看${s.title}"><img src="../assets/production/${s.id}.jpg" width="1920" height="1080" loading="lazy" alt="${s.title}：新版作品本机实际静帧"><span class="number">${s.number}</span><span class="image-action">${s.id==='interactive'?'观看 / 开始探索':'播放完整作品'} →</span></button><div class="card-meta"><span>${s.name}</span><span>30秒 · 1080p</span></div><h3>${s.title}</h3><p>${s.styles}</p><a href="../assets/production/${s.id}.mp4">打开成片视频 ↗</a></article>`).join(''));
await writeFile(path.join(out,'scenarios','index.html'),scenarioHtml);
for(const f of ['production-app.js','production-scenes.js','production-catalog.js','production-style.css'])await copyFile(path.join(web,'scenarios',f),path.join(out,'scenarios',f));
try{await copyFile(path.join(project,'production-research.md'),path.join(out,'production-research.md'));}catch(e){if(e.code!=='ENOENT')throw e;}
try{await copyFile(path.join(project,'scenario-research.md'),path.join(out,'scenario-research.md'));}catch(e){if(e.code!=='ENOENT')throw e;}
console.log(`已构建 ${out}：理解总览、高清图阅读页、35种原版场景、9种语法和7部新增作品。`);
