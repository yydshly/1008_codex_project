// 图像查看器只改变展示比例，原图可独立下载；不开启媒体生成。
const viewport=document.querySelector('#overview-viewport');
const image=document.querySelector('#overview-image');
const value=document.querySelector('#zoom-value');
let zoom=100;
function setZoom(next){
  const old=zoom;
  const center=(viewport.scrollLeft+viewport.clientWidth/2)/(image.clientWidth||1);
  zoom=Math.max(100,Math.min(400,next));
  image.style.width=zoom+'%';
  value.value=zoom+'%';
  document.querySelector('#zoom-out').disabled=zoom===100;
  document.querySelector('#zoom-in').disabled=zoom===400;
  requestAnimationFrame(()=>{viewport.scrollLeft=zoom===100?0:Math.max(0,center*image.clientWidth-viewport.clientWidth/2);});
  if(zoom!==old)image.dataset.zoom=String(zoom);
}
document.querySelector('#zoom-in').addEventListener('click',()=>setZoom(zoom+50));
document.querySelector('#zoom-out').addEventListener('click',()=>setZoom(zoom-50));
document.querySelector('#zoom-reset').addEventListener('click',()=>setZoom(100));
viewport.addEventListener('keydown',event=>{
  if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(zoom+50);}
  if(event.key==='-'){event.preventDefault();setZoom(zoom-50);}
  if(event.key==='0'){event.preventDefault();setZoom(100);}
});
setZoom(100);
