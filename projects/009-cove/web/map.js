// 仅改变已有原图的显示比例；图的原始字节保持不变。
const viewport=document.getElementById('viewport'),map=document.getElementById('map');
const slider=document.getElementById('zoom'),output=document.getElementById('scale');
const originalWidth=Number(map.getAttribute('width'));let fitting=true;
function setScale(scale){const value=Math.max(.1,Math.min(1.5,scale));map.style.width=Math.round(originalWidth*value)+'px';slider.value=String(Math.round(value*100));output.value=Math.round(value*100)+'%';}
function fit(){fitting=true;setScale(viewport.clientWidth/originalWidth);}
document.getElementById('fit').addEventListener('click',fit);
document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{fitting=false;setScale(Number(button.dataset.zoom));}));
slider.addEventListener('input',()=>{fitting=false;setScale(Number(slider.value)/100);});
addEventListener('resize',()=>{if(fitting)fit();});fit();
