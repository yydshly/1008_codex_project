// 原图保持不变；只调节展示尺寸。
const viewport=document.querySelector('#viewport'), map=document.querySelector('#map');
const slider=document.querySelector('#zoom'), output=document.querySelector('#scale');
let fitting=true;
function setScale(scale){const value=Math.min(1.5,Math.max(.1,scale));map.style.width=`${Math.round(2160*value)}px`;slider.value=String(Math.round(value*100));output.value=`${Math.round(value*100)}%`;}
function fit(){fitting=true;setScale(viewport.clientWidth/2160);}
document.querySelector('#fit').addEventListener('click',fit);
document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{fitting=false;setScale(Number(button.dataset.zoom));}));
slider.addEventListener('input',()=>{fitting=false;setScale(Number(slider.value)/100);});
addEventListener('resize',()=>{if(fitting)fit();});
fit();
