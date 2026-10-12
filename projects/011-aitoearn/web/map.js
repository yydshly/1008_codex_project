const picture=document.querySelector('#map-image'),viewport=document.querySelector('#map-canvas'),slider=document.querySelector('#map-zoom'),output=document.querySelector('#map-scale');
let fitMode=true;
function scale(value){fitMode=false;picture.style.width=`${941*value/100}px`;picture.style.maxWidth='none';slider.value=value;output.value=`${value}%`;}
function fit(){fitMode=true;const width=Math.min(941,viewport.clientWidth-24);picture.style.width=`${width}px`;picture.style.maxWidth='100%';output.value=`适宽 ${Math.round(width/941*100)}%`;slider.value=Math.max(30,Math.round(width/941*100));}
slider.addEventListener('input',()=>scale(Number(slider.value)));
document.querySelectorAll('[data-map-scale]').forEach(b=>b.addEventListener('click',()=>scale(Number(b.dataset.mapScale))));
document.querySelector('[data-map-fit]').addEventListener('click',fit);
window.addEventListener('resize',()=>{if(fitMode)fit();});fit();
