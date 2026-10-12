// 原创展示宿主：只控制未修改的上游Canvas引擎，不调用任何媒体生成服务。
const data = JSON.parse(document.querySelector('#research-data').textContent);
const $ = s => document.querySelector(s);
const escape = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inspector = s => `<div class="inspector-meta"><span class="group">${escape(s.group)}</span><span>${'★'.repeat(s.quality)} · 作者自评</span></div><h2 id="exhibit-title">${escape(s.name)}</h2><p class="keywords">${escape(s.keywords)}</p><p>${escape(s.description)}</p><dl><div><dt>怎样画</dt><dd>${escape(s.renderer)}</dd></div><div><dt>画里什么在动</dt><dd>${escape(s.motion)}</dd></div><div><dt>如何进入这幅画</dt><dd>${escape(s.transition)}</dd></div><div><dt>选型参考 · 本研究建议</dt><dd>${escape(s.fit)}</dd></div><div class="weakness"><dt>当前实现短板 · 上游记录</dt><dd>${escape(s.weakness==='—'?'索引未列出具体短板。':s.weakness)}</dd></div></dl><div class="inspector-links"><a href="${s.recipe}" target="_blank" rel="noopener noreferrer">风格配方</a><a href="${s.scene}" target="_blank" rel="noopener noreferrer">场景源码</a></div>`;
let selected=data.styles.find(s=>s.id==='09_postimp'),engine=null,playing=false,tour=false,time=.7,baseTime=0,startAt=0,raf=0,filter='全部';
const frame=$('#engine-frame'),slider=$('#timeline'),play=$('#play-button'),step=$('#step-button'),tourButton=$('#tour-button'),transition=$('#transition-toggle');
function era(){return engine?.ERAS.find(e=>e.id===selected.id);}
function maxTime(){const e=era();return tour?engine.__total:(e.dur??e.eighths*60/(engine.BPM||128)/2);}
function syncCards(){document.querySelectorAll('.style-select').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===selected.id)));}
function setSelected(s){selected=s;$('#style-inspector').innerHTML=inspector(s);$('#player-poster').src=s.thumb;$('#player-poster').alt=s.name+'原版Canvas场景';syncCards();}
function controls(){play.textContent=playing?'暂停画面':'播放画面';tourButton.textContent=tour?'返回单幅画面':'连续浏览35种';transition.disabled=tour;slider.max=String(maxTime());slider.value=String(time);$('#time-output').textContent=time.toFixed(2)+' s';}
function paint(){if(!engine)return;const began=performance.now();if(tour){engine.renderFrame(time);const e=engine.ERAS.find(e=>time>=e.t0&&time<e.t1);if(e&&e.id!==selected.id)setSelected(data.styles.find(s=>s.id===e.id));}else{const e=era();if(transition.checked)engine.renderFrame(e.t0+time);else engine.renderSolo(selected.id,time,{counter:false});}$('#frame-cost').textContent='本次绘制约 '+Math.round(performance.now()-began)+' ms（浏览器调用耗时，供观察）';controls();}
function pause(){playing=false;cancelAnimationFrame(raf);if(engine)controls();}
function loop(now){if(!playing)return;time=(baseTime+(now-startAt)/1000)%maxTime();paint();raf=requestAnimationFrame(loop);}
function togglePlay(){if(playing){pause();return;}playing=true;baseTime=time;startAt=performance.now();controls();raf=requestAnimationFrame(loop);}
function select(id,focus=false){const s=data.styles.find(s=>s.id===id);if(!s)return;pause();tour=false;time=.7;setSelected(s);if(engine){paint();}history.replaceState(null,'','#style='+id);if(focus){$('#player-stage').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'center'});play.focus({preventScroll:true});}}
document.querySelectorAll('.style-select').forEach(b=>b.addEventListener('click',()=>select(b.dataset.id,true)));
function search(){const query=$('#style-search').value.trim().toLowerCase();let count=0;for(const s of data.styles){const card=document.querySelector(`.style-card[data-id="${s.id}"]`);const yes=(filter==='全部'||s.group===filter)&&[s.name,s.description,s.keywords,s.renderer,s.motion,s.fit].join(' ').toLowerCase().includes(query);card.hidden=!yes;if(yes)count++;}$('#result-count').textContent=`${count} / 35种风格`;$('#empty-state').hidden=count>0;}
$('#style-search').addEventListener('input',search);
document.querySelectorAll('.filters button').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.group;document.querySelectorAll('.filters button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));search();}));
play.addEventListener('click',togglePlay);step.addEventListener('click',()=>{pause();time=(time+1/30)%maxTime();paint();});
slider.addEventListener('input',()=>{const requested=Number(slider.value);pause();time=requested;paint();});
transition.addEventListener('change',()=>{pause();time=transition.checked?Math.min(.15,maxTime()):.7;paint();});
tourButton.addEventListener('click',()=>{pause();tour=!tour;time=tour?0:.7;paint();if(tour)togglePlay();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function hashSelection(){const match=/^#style=([a-z0-9_]+)$/.exec(location.hash);if(match)select(match[1]);}
window.addEventListener('hashchange',hashSelection);hashSelection();
let attempts=0;const wait=setInterval(()=>{attempts++;try{const win=frame.contentWindow;if(win.__bootFailed||win.__bootErrors?.length){clearInterval(wait);$('#engine-status').textContent='场景加载失败，静帧仍可查看。请重新加载页面。';return;}if(win.__ready){clearInterval(wait);engine=win;play.disabled=step.disabled=tourButton.disabled=slider.disabled=false;$('#player-stage').classList.add('ready');$('#engine-status').textContent='';paint();}else if(attempts>1200){clearInterval(wait);$('#engine-status').textContent='加载耗时较长，静帧仍可查看。请重新加载页面。';}}catch{clearInterval(wait);$('#engine-status').textContent='无法连接场景，请通过本地预览服务打开。';}},100);
