import {catalog} from './production-catalog.js';
import {initAssets,renderFrame,objects,tour,W} from './production-scenes.js';
const $=id=>document.getElementById(id),canvas=$('scene-canvas'),video=$('scene-video'),bed=$('music-bed');
const params=new URLSearchParams(location.search),rendering=params.has('render');
const state={id:'travel',time:0,mode:rendering?'canvas':'video',playing:false,music:false,manual:null};
let last=0,walkDirection=0,ready=false;
const stamp=t=>`0:${String(Math.floor(t)).padStart(2,'0')}`;
const item=()=>catalog.find(s=>s.id===state.id);
function draw(id=state.id,t=state.time,manual){renderFrame(canvas,id,t,manual);}
function sync(){
  const t=state.mode==='video'?video.currentTime:state.time;
  $('time').value=t;$('time').disabled=!!state.manual;$('clock').textContent=state.manual?'探索中':stamp(t)+' / 0:30';$('play').textContent=state.manual?'返回影片':state.playing?'暂停':'播放';
  document.querySelectorAll('[data-chapter]').forEach(b=>{b.disabled=!!state.manual;b.classList.toggle('active',!state.manual&&Number(b.dataset.chapter)===Math.min(2,Math.floor(t/10)));});
}
function setMode(mode){
  if(state.mode==='video')state.time=video.currentTime||state.time;
  state.mode=mode;canvas.hidden=mode!=='canvas';video.hidden=mode!=='video';
  if(mode==='video'){
    state.manual=null;video.currentTime=state.time;bed.pause();if(state.playing)video.play().catch(()=>{state.playing=false;sync();});
  }else{video.pause();if(state.music&&state.playing){bed.currentTime=state.time;bed.play().catch(()=>{});}draw(state.id,state.time,state.manual);}
  ['canvas','video'].forEach(m=>{$(m+'-mode').classList.toggle('active',m===mode);$(m+'-mode').setAttribute('aria-pressed',String(m===mode));});
  $('view-label').textContent=mode==='video'?'30秒 · 1920 × 1080 · 成片视频':'1920 × 1080 · 分层合成画面';
  $('manual-controls').hidden=!state.manual;$('take-control').textContent='开始探索';sync();
}
function seek(t){
  state.manual=null;$('manual-controls').hidden=true;state.time=Math.min(29.999,Math.max(0,Number(t)));
  if(state.mode==='video')video.currentTime=state.time;else draw();if(state.music&&state.mode==='canvas')bed.currentTime=state.time;sync();
}
function setPlaying(on){
  state.playing=on;
  if(state.mode==='video'){if(on)video.play().catch(()=>{state.playing=false;sync();});else video.pause();}
  if(state.mode==='canvas'&&state.music){if(on){bed.currentTime=state.time;bed.play().catch(()=>{});}else bed.pause();}
  sync();
}
function select(id,autoplay=!rendering){
  if(!catalog.some(v=>v.id===id))id='travel';video.pause();bed.pause();state.playing=false;state.id=id;state.time=0;state.manual=null;walkDirection=0;
  const s=item();video.src=`../assets/production/${id}.mp4`;video.poster=`../assets/production/${id}.jpg`;video.setAttribute('aria-label',s.title+'成片');
  $('film-number').textContent=s.number+' / '+s.name;$('scene-title').textContent=s.title;$('scene-tag').textContent=s.tag;$('scene-styles').textContent=s.styles;
  ['reuse','added','use'].forEach(key=>$(key).textContent=s[key]);$('download').href=`../assets/production/${id}.mp4`;
  $('interaction').hidden=id!=='interactive';$('manual-controls').hidden=true;$('interaction-status').textContent='一座园林，四个发现。';
  document.querySelectorAll('[data-scene]').forEach(b=>{const active=b.dataset.scene===id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('[data-chapter]').forEach((b,i)=>b.innerHTML=`<span>0${i+1}</span>${s.chapters[i]}`);
  history.replaceState(null,'','#scene='+id);draw();setMode(state.mode);if(autoplay&&!matchMedia('(prefers-reduced-motion:reduce)').matches)setPlaying(true);
}
function manualStatus(){
  const st=state.manual;if(!st)return;
  const nearby=objects.filter(o=>Math.abs(st.x-o.x)<180),count=Object.values(st.collected).filter(Boolean).length;
  $('interaction-status').textContent=`已发现 ${count} / 4${nearby.length?' · 附近：'+nearby.map(o=>o.name).join('、'):' · 沿路走近物品'}`;
  document.querySelectorAll('[data-find]').forEach(b=>{b.disabled=!nearby.some(o=>o.id===b.dataset.find);b.setAttribute('aria-pressed',String(!!st.collected[b.dataset.find]));});
}
function takeControl(){
  if(state.id!=='interactive')select('interactive',false);setPlaying(false);setMode('canvas');
  state.manual={x:200,walk:false,direction:1,distance:0,target:null,active:null,collected:{leaf:false,flower:false,vase:false,painting:false},manual:true};
  state.time=0;$('manual-controls').hidden=false;$('take-control').textContent='重新探索';canvas.focus({preventScroll:true});manualStatus();draw('interactive',0,state.manual);
}
function inspect(id){
  if(!state.manual)return false;const o=objects.find(v=>v.id===id);if(!o||Math.abs(state.manual.x-o.x)>=180)return false;
  state.manual.active=id;state.manual.collected[id]=true;state.manual.target=null;manualStatus();draw('interactive',state.time,state.manual);return true;
}
function moveTarget(x){if(!state.manual)return;state.manual.target=Math.max(140,Math.min(1650,x));state.manual.active=null;}
function step(dt){
  const st=state.manual;if(!st)return;let dir=walkDirection;
  if(!dir&&st.target!==null){const d=st.target-st.x;dir=Math.sign(d);if(Math.abs(d)<230*dt){st.x=st.target;st.target=null;dir=0;}}
  st.walk=!!dir;
  if(dir){const before=st.x;st.x=Math.max(140,Math.min(1650,st.x+dir*230*dt));st.distance+=Math.abs(st.x-before);st.direction=dir;st.active=null;}
  manualStatus();
}
function animate(now){
  const dt=last?Math.min(.06,(now-last)/1000):0;last=now;
  if(ready){
    if(state.manual){state.time+=dt;step(dt);draw('interactive',state.time%30,state.manual);}
    else if(state.mode==='canvas'&&state.playing){state.time=(state.time+dt)%30;draw();}
    sync();
  }requestAnimationFrame(animate);
}
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.scene)));
document.querySelectorAll('[data-chapter]').forEach(b=>b.addEventListener('click',()=>seek(Number(b.dataset.chapter)*10+1.1)));
$('play').addEventListener('click',()=>{if(state.manual){state.manual=null;$('manual-controls').hidden=true;seek(0);}setPlaying(!state.playing);});
$('restart').addEventListener('click',()=>{seek(0);setPlaying(true);});$('time').addEventListener('input',e=>seek(e.target.value));
$('canvas-mode').addEventListener('click',()=>setMode('canvas'));$('video-mode').addEventListener('click',()=>setMode('video'));
$('music').addEventListener('click',()=>{state.music=!state.music;video.muted=!state.music;bed.volume=.65;$('music').textContent=state.music?'关闭配乐':'开启配乐';$('music').setAttribute('aria-pressed',String(state.music));if(state.mode==='canvas'&&state.playing&&state.music){bed.currentTime=state.time%30;bed.play().catch(()=>{});}else bed.pause();});
$('fullscreen').addEventListener('click',()=>document.querySelector('.stage').requestFullscreen?.());$('take-control').addEventListener('click',takeControl);
document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>{if(!state.manual)takeControl();moveTarget(b.dataset.route==='garden'?625:1570);document.querySelectorAll('[data-route]').forEach(v=>v.setAttribute('aria-pressed',String(v===b)));}));
document.querySelectorAll('[data-find]').forEach(b=>b.addEventListener('click',()=>inspect(b.dataset.find)));
for(const [id,dir]of [['walk-left',-1],['walk-right',1]]){
  const b=$(id);b.addEventListener('pointerdown',e=>{if(!state.manual)return;e.preventDefault();b.setPointerCapture(e.pointerId);state.manual.target=null;walkDirection=dir;});
  ['pointerup','pointercancel','lostpointercapture'].forEach(evt=>b.addEventListener(evt,()=>walkDirection=0));
}
canvas.addEventListener('pointerdown',e=>{if(!state.manual)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*1080;const o=objects.find(v=>Math.hypot(v.x-x,v.y-y)<60);if(o)inspect(o.id);else if(y>630)moveTarget(x);});
document.addEventListener('keydown',e=>{if(!state.manual||/INPUT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();state.manual.target=null;walkDirection=e.key==='ArrowLeft'?-1:1;}if(e.code==='Space'){e.preventDefault();const o=objects.find(v=>Math.abs(state.manual.x-v.x)<180);if(o)inspect(o.id);}});
document.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight')walkDirection=0;});window.addEventListener('blur',()=>walkDirection=0);
window.addEventListener('hashchange',()=>{if(ready){const id=location.hash.match(/scene=([a-z]+)/)?.[1]||'travel';if(id!==state.id)select(id);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){walkDirection=0;setPlaying(false);}});
video.addEventListener('play',()=>{if(state.mode==='video'){state.playing=true;sync();}});video.addEventListener('pause',()=>{if(state.mode==='video'){state.playing=false;sync();}});
video.addEventListener('loadeddata',()=>$('load-status').textContent='');video.addEventListener('error',()=>{if(!rendering)$('load-status').textContent='视频暂未加载，可切换合成画面查看。';});
try{
  await initAssets();ready=true;$('load-status').textContent='';
  window.scenarioDemo={catalog,canvas,state,draw,select,seek,inspect,takeControl,moveTarget,read:()=>JSON.parse(JSON.stringify(state)),ready:true};
  const id=location.hash.match(/scene=([a-z]+)/)?.[1]||'travel';select(id,!rendering);requestAnimationFrame(animate);
}catch(e){$('load-status').textContent='素材加载失败：'+e.message;throw e;}
