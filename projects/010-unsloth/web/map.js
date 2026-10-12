// 保留原图字节；只改变显示比例。
const viewport=document.getElementById('viewport'), map=document.getElementById('map');
const slider=document.getElementById('zoom'), output=document.getElementById('scale');
let fitting=true;
function setScale(scale){const value=Math.min(1.5,Math.max(.1,scale));map.style.width=`${Math.round(2400*value)}px`;slider.value=String(Math.round(value*100));output.value=`${Math.round(value*100)}%`;}
function fit(){fitting=true;setScale(viewport.clientWidth/2400);}
document.getElementById('fit').addEventListener('click',fit);
document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{fitting=false;setScale(Number(button.dataset.zoom));}));
slider.addEventListener('input',()=>{fitting=false;setScale(Number(slider.value)/100);});
addEventListener('resize',()=>{if(fitting)fit();});fit();
