// 作品版：生成美术与透明动作帧 + 分层动画。renderFrame 只依赖时间和显式状态。
import {catalog,reportData} from './production-catalog.js';
export const W=1920,H=1080;
const assets={},buffers=new Map();
let manifest;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,p)=>a+(b-a)*p;
const smooth=p=>window.MO.smooth(clamp(p));
const out=p=>window.MO.expoOut(clamp(p));
const rand=n=>{const x=Math.sin(n*127.1+17.7)*43758.5453;return x-Math.floor(x);};
const bands={history:[[0,485],[486,486],[973,485]],life:[[0,482],[483,481],[966,482]],travel:[[0,474],[476,502],[980,473]],emotion:[[0,482],[483,480],[965,483]]};
export async function initAssets(){
  manifest=await (await fetch('../assets/production/asset-manifest.json')).json();
  await Promise.all(Object.keys(manifest.assets).map(async key=>{
    const im=new Image();im.src='../assets/production/'+manifest.assets[key].file;
    await im.decode();assets[key]=im;
  }));
  await Promise.all(['SceneSans','SceneSerif','SceneBold','SceneDisplay'].map(f=>document.fonts.load(`36px ${f}`)));
}
function text(g,str,x,y,size=32,color='#fff',font='SceneSans',align='left'){
  g.fillStyle=color;g.font=`${size}px ${font}`;g.textAlign=align;g.textBaseline='alphabetic';g.fillText(str,x,y);
}
function box(g,x,y,w,h,r=20,fill='#fff',stroke){
  g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();
  if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke();}
}
function line(g,x1,y1,x2,y2,color,width=2){g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokeStyle=color;g.lineWidth=width;g.stroke();}
function circle(g,x,y,r,color){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=color;g.fill();}
function alpha(g,a,f){g.save();g.globalAlpha*=clamp(a);f();g.restore();}
function softLight(g,x,y,r,color){const z=g.createRadialGradient(x,y,0,x,y,r);z.addColorStop(0,color);z.addColorStop(1,'#00000000');g.fillStyle=z;g.fillRect(x-r,y-r,r*2,r*2);}
function shadow(g,x,y,w=100){g.save();g.scale(1,.23);const z=g.createRadialGradient(x,y/.23,0,x,y/.23,w);z.addColorStop(0,'#17211e66');z.addColorStop(1,'#17211e00');g.fillStyle=z;g.fillRect(x-w,y/.23-w,w*2,w*2);g.restore();}
function actor(g,index,x,foot,height=365,face=1,light='none'){
  const f=manifest.frames[index],s=height/f.cellHeight,[sx,sy,sw,sh]=f.source;
  shadow(g,x,foot+4,height*.26);
  g.save();g.translate(x,foot);g.scale(face,1);g.filter=light;
  g.drawImage(assets['traveler-atlas'],sx,sy,sw,sh,-f.anchor[0]*s,-f.anchor[1]*s,sw*s,sh*s);g.restore();
}
function scenery(g,id,k,x=0,y=107,w=W,h=866){
  const im=assets[id+'-worlds'],[sy,sh]=bands[id][k];
  // 维持每幅原画比例，用极少量边缘裁切统一电影窗口。
  const scale=Math.max(w/im.width,h/(sh-4)),cw=w/scale,ch=h/scale;
  g.drawImage(im,(im.width-cw)/2,sy+2+(sh-4-ch)/2,cw,ch,x,y,w,h);
}
function foliage(g,cell,t,x,y,w=590,flip=false,opacity=.72){
  const im=assets['foliage-atlas'],cw=im.width/2,ch=im.height/2;
  g.save();g.globalAlpha*=opacity;g.translate(x,y);g.rotate(Math.sin(t*.67)*.012);g.scale(flip?-1:1,1);
  g.drawImage(im,cell%2*cw,Math.floor(cell/2)*ch,cw,ch,0,0,w,w*ch/cw);g.restore();
}
function petals(g,t,color='#f1d4b4',count=23,zone=[0,107,W,850]){
  const [x,y,w,h]=zone;
  for(let i=0;i<count;i++){
    const speed=19+rand(i+9)*24,px=x+(rand(i)*w+t*(10+rand(i+3)*22))%w,py=y+(rand(i+1)*h+t*speed)%h;
    g.save();g.translate(px,py);g.rotate(t*.9+rand(i+2)*6.3);g.fillStyle=color;g.globalAlpha*=.35+rand(i+4)*.5;
    g.beginPath();g.ellipse(0,0,3+rand(i+5)*4,1.8,0,0,Math.PI*2);g.fill();g.restore();
  }
}
function water(g,t,zone,night=false){
  const [x,y,w,h]=zone;g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  for(let i=0;i<54;i++){
    const xx=x+rand(i+80)*w,yy=y+rand(i+190)*h,sw=9+rand(i+340)*63;
    g.globalAlpha=.025+.055*(.5+.5*Math.sin(t*1.4+i));
    line(g,xx+Math.sin(t+i)*6,yy,xx+sw+Math.sin(t+i)*6,yy,night?'#edc8a6':'#fbf1cd',1.2+rand(i)*2);
  }g.restore();
}
function rain(g,t){
  g.save();g.strokeStyle='#a8c6d7';
  for(let i=0;i<190;i++){
    const x=(rand(i+11)*2100-t*64)%2100,y=107+(rand(i+55)*860+t*(340+rand(i)*100))%860;
    g.globalAlpha=.1+rand(i+100)*.22;line(g,x,y,x-6,y+18+rand(i+42)*35,'#b8ccdb',1+rand(i+13));
  }
  for(let i=0;i<17;i++){
    const phase=(t*.8+rand(i))%1;g.globalAlpha=(1-phase)*.2;g.beginPath();g.ellipse(620+rand(i+300)*1160,780+rand(i+400)*155,phase*24,phase*6,0,0,Math.PI*2);g.stroke();
  }g.restore();
}
function steam(g,t){
  for(let i=0;i<12;i++){
    const p=(t*.16+rand(i))%1;alpha(g,(1-p)*.1,()=>softLight(g,1310+Math.sin(t*.3+i)*45-p*80,660-p*390,55+p*80,'#e6efffc0'));
  }
}
function flywheel(g,t){
  // 在原画的飞轮前叠加同材质旋转辐条，画面中的轮缘继续由原画提供。
  const x=1437,y=640;g.save();g.translate(x,y);g.scale(.68,1);g.rotate(t*.62);
  g.globalAlpha=.25;for(let i=0;i<7;i++){g.rotate(Math.PI*2/7);line(g,0,0,0,-156,'#8b7450',11);line(g,0,0,0,-156,'#dcc58e',2);}g.restore();
}
function dataGlow(g,t){
  g.save();g.beginPath();g.rect(840,140,1050,380);g.clip();
  for(let i=0;i<19;i++){
    const p=(t*.07+rand(i))%1,x=850+p*1000,y=315+Math.sin(p*6+i*.18)*63;
    softLight(g,x,y,11,'#a7defccb');
  }g.restore();
}
function artShot(g,id,k,q){
  g.fillStyle='#090e12';g.fillRect(0,0,W,H);g.save();g.beginPath();g.rect(0,107,W,866);g.clip();
  const zoom=1+q*.0033;g.translate(W/2,H/2);g.scale(zoom,zoom);g.translate(-W/2-q*1.4,-H/2);
  scenery(g,id,k);
  const positions={travel:[[285,704,6.5],[325,790,6.7],[260,707,6.3]],life:[[255,650,6.1],[330,720,6.3],[285,785,6.8]],history:[[275,685,6.2],[280,692,6.4],[265,690,6.5]],emotion:[[200,675,7.1],[280,744,6.5],[305,766,6.4]]};
  const [a,b,dur]=positions[id][k],p=smooth(q/dur),x=mix(a,b,p),moving=q<dur;
  let pose=moving?Math.floor((x-a)/30)%4:8;
  if(!moving){if(id==='life')pose=k===2?14:11;else if(id==='history')pose=k===0?9:10;else if(id==='emotion')pose=k===2?(Math.floor(q*1.5)%2?14:15):k===1?14:8;else pose=k===0?8:10;}
  const foot=id==='travel'?896:id==='history'?901:id==='emotion'?905:914;
  if(id==='travel'){if(k<2)water(g,q,k===0?[490,596,1350,148]:[200,593,1710,180],k===1);else petals(g,q,'#d7ae65',16);}
  if(id==='history'){if(k===1)steam(g,q);if(k===2)dataGlow(g,q);}
  if(id==='emotion'&&k===0)rain(g,q);
  if(id==='life'||id==='emotion'&&k>0)petals(g,q,k===2?'#fff2d4':'#f7cfd4');
  const grade=id==='emotion'&&k===0?'brightness(.67) saturate(.65)':id==='travel'&&k===1?'brightness(.8) saturate(.85)':'brightness(.96)';
  actor(g,pose,x,foot,370,1,grade);
  // 前景与人物独立变换，遮挡形成明确的空间层级。
  if(id==='travel'&&k===0)foliage(g,1,q,-175,80,520,false,1);
  if((id==='life'||id==='emotion')&&k===2)foliage(g,2,q,-235,813,550,false,1);
  if(id==='travel'&&k===2)softLight(g,60,250,380,'#f7bc5930');
  const vignette=g.createLinearGradient(0,107,0,973);vignette.addColorStop(0,'#0610181f');vignette.addColorStop(.25,'#00000000');vignette.addColorStop(.78,'#00000000');vignette.addColorStop(1,'#07111530');g.fillStyle=vignette;g.fillRect(0,107,W,866);
  g.restore();
}
function caption(g,s,k,t){
  const a=clamp(t/.8)*clamp((30-t)/.6);alpha(g,a,()=>{
    text(g,'ART IN MOTION  /  '+s.name,74,62,20,'#9bada9');
    text(g,String(k+1).padStart(2,'0')+'  '+s.chapters[k],1846,62,23,'#d1dcd6','SceneSans','right');
    line(g,74,1002,1846,1002,'#ffffff1b');
    text(g,s.captions[k],W/2,1050,28,'#e5eee7','SceneSans','center');
  });
  // 用少量留白的地名标题建立章节，不覆盖主体器物。
  const q=t-k*10,titleAlpha=clamp(q/.8)*clamp((5.8-q)/1.2);
  if(s.type==='art')alpha(g,titleAlpha,()=>{
    const labels={travel:['江南','上海','敦煌'],life:['好奇','创造','新章'],history:['手工','机械','程序'],emotion:['雨幕','晨光','晴天']};
    text(g,labels[s.id][k],1435,238,62,'#fff8e8','SceneSerif');
    line(g,1438,262,1670,262,'#f1e4cb9f');
  });
}
function closing(g,s,t){
  const a=smooth((t-27.5)/1.1);if(a<=0)return;
  alpha(g,a,()=>{
    g.fillStyle='#091015db';g.fillRect(0,107,W,866);
    text(g,s.end,W/2,524,64,'#f5ead7','SceneSerif','center');
    text(g,s.fit,W/2,596,27,'#a9b9b1','SceneSans','center');
    line(g,864,650,1056,650,'#ae9c7066');
    text(g,'原创示例作品  ·  2026',W/2,698,22,'#96a7a0','SceneSans','center');
    text(g,'Dreamer — Kevin MacLeod  /  incompetech.com  /  CC BY 4.0',W/2,904,18,'#b9c6bc','SceneSans','center');
  });
}
function nativeBackground(g,kind,t){
  g.fillStyle=kind==='product'?'#12121e':'#09181e';g.fillRect(0,0,W,H);
  softLight(g,400+Math.sin(t*.12)*30,420,750,kind==='product'?'#5c48bd44':'#1b746038');
  softLight(g,1650,430,580,kind==='product'?'#86674828':'#4486a41c');
}
function icon(g,name,x,y,size=24,color='#777487'){
  g.save();g.strokeStyle=color;g.lineWidth=2;g.translate(x,y);const z=size/24;g.scale(z,z);
  if(name==='search'){g.beginPath();g.arc(10,10,7,0,Math.PI*2);g.moveTo(15,15);g.lineTo(22,22);g.stroke();}
  else if(name==='calendar'){g.strokeRect(2,5,20,17);line(g,2,10,22,10,color,2);line(g,7,2,7,8,color,2);line(g,17,2,17,8,color,2);}
  else if(name==='check'){g.beginPath();g.moveTo(3,12);g.lineTo(9,18);g.lineTo(21,4);g.stroke();}
  else{g.strokeRect(3,3,18,18);line(g,8,3,8,21,color,2);}
  g.restore();
}
function cursor(g,x,y,press=false){
  g.save();g.translate(x,y);g.shadowColor='#17142155';g.shadowBlur=10;g.shadowOffsetY=4;
  g.beginPath();g.moveTo(0,0);g.lineTo(1,34);g.lineTo(10,26);g.lineTo(19,45);g.lineTo(27,41);g.lineTo(18,24);g.lineTo(31,23);g.closePath();g.fillStyle='#242237';g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();g.restore();
  if(press){g.save();g.globalAlpha=.35;g.strokeStyle='#7a62dc';g.lineWidth=4;g.beginPath();g.arc(x,y,30,0,Math.PI*2);g.stroke();g.restore();}
}
function productChrome(g,k,q){
  g.save();g.shadowColor='#00000042';g.shadowBlur=70;g.shadowOffsetY=24;box(g,208,188,1504,700,26,'#fafafe');g.restore();
  box(g,208,188,242,700,26,'#f1eff8');g.fillStyle='#f1eff8';g.fillRect(427,188,23,700);
  box(g,242,225,42,42,12,'#7862d7');text(g,'同',263,255,24,'#fff','SceneBold','center');text(g,'同行',299,254,27,'#312944','SceneBold');
  text(g,'品牌工作室',244,314,19,'#817890');line(g,238,343,421,343,'#dedbe8');
  ['我的计划','资料空间','团队项目'].forEach((str,i)=>{
    if(i===k)box(g,229,377+i*69,201,52,10,'#e1daf8');icon(g,['calendar','search','grid'][i],247,392+i*69,24,i===k?'#725acb':'#817b91');text(g,str,289,413+i*69,22,i===k?'#634cbd':'#756d85');
  });
  circle(g,263,821,18,'#cfc5df');text(g,'林',263,829,18,'#574763','SceneSans','center');text(g,'林的工作空间',296,829,19,'#756b80');
  text(g,['每个目标，都有一个开始','让资料，成为下一步的依据','从制作中，到一起完成'][k],493,260,31,'#2d273c','SceneBold');
  text(g,['本周计划 / 2026年10月','资料检索 / 全部空间','品牌提案 / 项目进度'][k],495,299,19,'#9790a5');
  line(g,493,326,1666,326,'#e7e3ef');
}
function productCalendar(g,q){
  const days=['周一','周二','周三','周四','周五'];
  days.forEach((d,i)=>{const x=496+i*229;box(g,x,361,211,431,10,i===4?'#f1ecfd':'#f5f5fa');text(g,d,x+18,399,20,'#8b819d');text(g,String(12+i),x+18,443,32,i===4?'#7054c4':'#453b56','SceneBold');line(g,x+16,468,x+195,468,'#e0daeb');});
  box(g,512,498,178,91,10,'#e7e4f5');text(g,'灵感收集',528,534,21,'#645a7c');text(g,'09:30 · 30分钟',528,565,16,'#8c809e');
  box(g,970,629,179,90,10,'#e4ece7');text(g,'用户反馈讨论',987,664,21,'#426455');text(g,'14:00 · 团队',987,696,16,'#718d7c');
  const p=out((q-2)/1.2);alpha(g,p,()=>{
    g.save();g.translate(0,(1-p)*25);box(g,1428,501,190,126,12,'#7860d2');text(g,'品牌提案',1446,542,24,'#fff','SceneBold');text(g,'周五 16:00',1446,578,19,'#e7e0ff');text(g,'负责人：林',1446,607,17,'#e7e0ff');g.restore();
  });
  const cp=smooth(q/2.2);cursor(g,mix(1050,1520,cp),mix(752,548,cp),q>2&&q<2.35);
  alpha(g,out((q-4.3)/.7),()=>{box(g,1340,810,286,51,10,'#e6f4ed');icon(g,'check',1360,825,20,'#388466');text(g,'计划已添加 · 周五16:00',1392,844,18,'#3c785d');});
}
function productSearch(g,q){
  box(g,493,354,1164,73,14,'#fff','#d5cbea');icon(g,'search',518,377,25,'#7b63cf');
  const query='品牌提案参考',typed=query.slice(0,Math.floor(clamp(q/2)*query.length));text(g,typed+(q<2.2?'│':''),561,400,27,'#463b59');
  text(g,'找到3项资料',495,471,20,'#968b9f');
  ['设计笔记','案例研究','用户反馈'].forEach((title,i)=>{
    const x=494+i*389,p=out((q-2.1-i*.3)/.7);alpha(g,p,()=>{
      g.save();g.translate(0,(1-p)*30);box(g,x,505,367,264,14,'#fff','#e3ddeb');
      g.save();g.beginPath();g.roundRect(x+14,519,339,123,8);g.clip();scenery(g,['life','history','travel'][i],i%3,x+14,519,339,123);g.restore();
      text(g,title,x+24,685,28,'#40344e','SceneBold');text(g,['视觉方向与关键词','三种呈现方式对比','12条访谈要点'][i],x+24,724,19,'#93859d');
      if(q>5+i*.4){circle(g,x+328,544,15,'#7d64d7');icon(g,'check',x+318,534,20,'#fff');}g.restore();
    });
  });
  alpha(g,out((q-6.5)/.8),()=>{box(g,1285,804,368,57,12,'#7862d7');text(g,'已加入“品牌提案”资料夹',1469,842,21,'#fff','SceneSans','center');});
  cursor(g,1110+smooth((q-4.3)/2)*475,650-smooth((q-4.3)/2)*107,q>5.3&&q<5.55);
}
function task(g,x,y,title,subtitle,color='#eee9f8'){
  g.save();g.shadowColor='#4937650c';g.shadowBlur=10;g.shadowOffsetY=3;box(g,x,y,340,127,12,'#fff','#e7e0ee');g.restore();
  box(g,x+18,y+17,79,26,6,color);text(g,'品牌项目',x+57,y+36,14,'#746386','SceneSans','center');text(g,title,x+18,y+74,24,'#40364f','SceneBold');text(g,subtitle,x+18,y+108,17,'#9a8caa');
}
function productBoard(g,q){
  const titles=['想法','制作中','已交付'],colors=['#9b8eaf','#a289d7','#6daa96'];
  titles.forEach((str,i)=>{const x=493+i*389;box(g,x,353,367,430,13,'#f0edf7');circle(g,x+25,382,5,colors[i]);text(g,str,x+43,389,21,'#82728f');text(g,String(q>4?(i===1?0:i===2?2:1):1),x+336,389,18,'#ac9fba','SceneSans','right');});
  task(g,507,420,'下一季视觉方向','整理3条创意线索');task(g,1285,575,'用户访谈摘要','已确认 · 沈','#e4f2e9');
  const p=smooth((q-1.8)/2),x=mix(896,1285,p),y=420-Math.sin(p*Math.PI)*40;
  task(g,x,y,'周五品牌提案',q>4?'已交付 · 林':'设计稿与参考已就绪',q>4?'#e3f2e8':'#e9e1fa');
  cursor(g,x+255,y+84,q>1.8&&q<2.1);
  ['林','沈','周'].forEach((str,i)=>{circle(g,526+i*42,829,18,['#ddd0ef','#c8e2d7','#f1dcc5'][i]);text(g,str,526+i*42,837,17,'#65516f','SceneSans','center');});text(g,'3位成员 · 同一个目标',666,838,19,'#95859f');
  alpha(g,out((q-4.5)/.7),()=>{box(g,1220,804,433,57,12,'#e4f3eb');icon(g,'check',1245,823,20,'#318568');text(g,'成果已交付 · 团队进度已同步',1278,842,20,'#367b5b');});
}
function productShot(g,k,q){
  nativeBackground(g,'product',q);g.save();const z=1+Math.min(q,8)*.002;g.translate(W/2,H/2);g.scale(z,z);g.translate(-W/2,-H/2);
  productChrome(g,k,q);[productCalendar,productSearch,productBoard][k](g,q);g.restore();
  text(g,'TONGXING  /  工作，由想法开始',74,935,20,'#a098b9');text(g,'界面与业务为虚构样例',1846,935,18,'#82798f','SceneSans','right');
}
function metric(g,value,x,y,size=104,color='#d9eee3'){text(g,value,x,y,size,color,'SceneDisplay');}
function chart(g,q,focus=false){
  const plot={x:860,y:275,w:835,h:482},toX=i=>plot.x+i*plot.w/3,toY=v=>plot.y+plot.h-v/100*plot.h;
  text(g,'报名人数 / 千人',plot.x,236,21,'#708c87');
  for(let n=0;n<=100;n+=25){const y=toY(n);line(g,plot.x,y,plot.x+plot.w,y,'#52776a30');text(g,String(n),plot.x-23,y+7,18,'#6d8983','SceneDisplay','right');}
  reportData.labels.forEach((str,i)=>text(g,str,toX(i),805,23,'#9bb4aa','SceneDisplay','center'));
  const p=out((q-.8)/3),last=p*3;g.save();g.beginPath();g.rect(plot.x-15,plot.y-20,plot.w*p+30,plot.h+45);g.clip();
  const gradient=g.createLinearGradient(0,plot.y,0,plot.y+plot.h);gradient.addColorStop(0,'#7fcca032');gradient.addColorStop(1,'#76d3b000');g.beginPath();g.moveTo(toX(0),toY(0));reportData.values.forEach((v,i)=>g.lineTo(toX(i),toY(v)));g.lineTo(toX(3),toY(0));g.closePath();g.fillStyle=gradient;g.fill();
  g.beginPath();reportData.values.forEach((v,i)=>i?g.lineTo(toX(i),toY(v)):g.moveTo(toX(i),toY(v)));g.lineCap='round';g.lineJoin='round';g.lineWidth=5;g.strokeStyle='#a8dcb4';g.stroke();g.restore();
  reportData.values.forEach((v,i)=>{if(i>last+.04)return;circle(g,toX(i),toY(v),8,focus&&i===2?'#ecc787':'#b7e7be');text(g,String(v),toX(i),toY(v)-23,27,focus&&i===2?'#ecc787':'#cee3d6','SceneDisplay','center');});
  if(focus){const a=out((q-2)/.8);alpha(g,a,()=>{
    const x=toX(2),y=toY(72);g.setLineDash([5,7]);line(g,x,y,x,toY(0),'#dbb87d88');g.setLineDash([]);g.strokeStyle='#f2cc9066';g.lineWidth=2;g.beginPath();g.arc(x,y,22+Math.sin(q*1.2)*2,0,Math.PI*2);g.stroke();
    box(g,x-124,y-125,260,66,13,'#b99a6330','#dab87d55');text(g,'Q3  ·  72,000人',x+6,y-81,24,'#f0cf98','SceneSans','center');
  });}
}
function dataShot(g,k,q){
  nativeBackground(g,'data',q);text(g,'2026  /  季度趋势报告',124,228,23,'#74988d');
  const titles=['增长，是有轨迹的。','第三季度，开始加速。','把增长，放到同一尺度。'];text(g,titles[k],124,328,51,'#e3eee5','SceneBold');
  if(k<2){
    const val=k===0?'2.5×':'+50%';alpha(g,out((q-.4)/1),()=>{metric(g,val,119,531,128,k===0?'#e3eee5':'#e7c690');});
    text(g,k===0?'四个季度，达到起点的2.5倍':'Q3 相比 Q2',130,595,28,'#a1bbae');
    text(g,k===0?'3.6万 → 9万':'4.8万 → 7.2万',130,651,32,'#cee2d1');
    line(g,130,702,641,702,'#a6c6b22f');
    text(g,k===0?'公开课报名趋势':'(72 − 48) ÷ 48 = 50%',130,750,23,'#809f91');chart(g,q,k===1);
  }else{
    alpha(g,out((q-.3)/1),()=>metric(g,'+150%',119,534,126,'#e8c58d'));
    text(g,'全年起终点对比',130,597,28,'#9ab7ab');text(g,'(90 − 36) ÷ 36 = 150%',130,654,27,'#bdd4c7');
    const base=789,scale=5,p=out((q-.6)/2);
    [36,90].forEach((v,i)=>{const x=945+i*385,h=v*scale*p;box(g,x,base-h,185,h,12,i?'#b7d8af':'#527564');text(g,String(v),x+92,base-h-27,53,i?'#d4ebd2':'#91baa3','SceneDisplay','center');text(g,i?'Q4 · 9万人':'Q1 · 3.6万人',x+92,839,25,'#aac4b5','SceneSans','center');});
    line(g,865,789,1695,789,'#71937e66');text(g,'同一尺度 / 单位：千人',1695,250,21,'#759b8a','SceneSans','right');
  }
  text(g,'示例数据 · 36 / 48 / 72 / 90 千人 · 非真实业务统计',124,931,20,'#6f8e80');text(g,'SOURCE: DEMONSTRATION DATA',1796,931,17,'#648579','SceneDisplay','right');
}
export const objects=[
  {id:'leaf',x:500,y:321,name:'银杏叶',subtitle:'一片叶子的四季',body:['银杏叶像一把小扇。','秋天的金黄，让季节有了颜色。'],route:'garden'},
  {id:'flower',x:750,y:590,name:'花朵',subtitle:'停下来，看见生长',body:['花园的颜色，会随时令改变。','此处用春花与秋叶构成艺术意象。'],route:'garden'},
  {id:'vase',x:1475,y:477,name:'陶瓶',subtitle:'把日常，放进器物',body:['比例、釉色与纹样一起形成气质。','这是一件原创想象的展品。'],route:'museum'},
  {id:'painting',x:1740,y:383,name:'画作',subtitle:'山水之间，还有留白',body:['观看山水，也是在观看空间。','远近、虚实，引导视线慢慢行走。'],route:'museum'},
];
export function tour(t){
  const keys=[[0,200],[5,500],[7,500],[10,750],[12,750],[22,1475],[24,1475],[27,1590],[30,1590]];
  let idx=keys.findIndex((v,i)=>i<keys.length-1&&t>=v[0]&&t<=keys[i+1][0]);if(idx<0)idx=keys.length-2;
  const [a,x]=keys[idx],[b,xx]=keys[idx+1],p=clamp((t-a)/(b-a)),pos=mix(x,xx,p),moving=x!==xx;
  const collected={leaf:t>=5.8,flower:t>=10.8,vase:t>=22.8,painting:t>=27.8};
  const active=t>=5.4&&t<7?'leaf':t>=10.4&&t<12?'flower':t>=22.4&&t<24?'vase':t>=27.4?'painting':null;
  return {x:pos,walk:moving,direction:1,distance:pos-200,collected,active,manual:false};
}
function interactiveShot(g,t,state){
  const st=state||tour(t);g.fillStyle='#091015';g.fillRect(0,0,W,H);
  const im=assets['garden-museum'],h=im.height/im.width*W,y=(H-h)/2;
  g.drawImage(im,0,y,W,h);g.save();g.beginPath();g.rect(0,y,W,h);g.clip();
  water(g,t,[140,539,570,175]);petals(g,t,'#e8c24e',26);
  objects.forEach(o=>{
    const found=st.collected?.[o.id],near=Math.abs(st.x-o.x)<180;
    g.save();g.globalAlpha=found?.75:near?1:.68;circle(g,o.x,o.y,near?19:15,'#11281edb');
    if(found)icon(g,'check',o.x-9,o.y-9,18,'#f8e7a6');else{line(g,o.x-5,o.y,o.x+5,o.y,'#f7e3a9');line(g,o.x,o.y-5,o.x,o.y+5,'#f7e3a9');}
    g.strokeStyle='#e4c977';g.lineWidth=1;g.beginPath();g.arc(o.x,o.y,near?24+Math.sin(t*2)*2:19,0,Math.PI*2);g.stroke();g.restore();
  });
  const index=st.walk?Math.floor(Math.abs(st.distance??st.x)/30)%4:st.active?9:8;
  actor(g,index,st.x,893-25*Math.sin(st.x/W*Math.PI),330,st.direction||1,'brightness(.95)');
  g.restore();
  text(g,'一园一世界',72,67,34,'#f1e5c7','SceneSerif');text(g,'GARDEN & GALLERY',1837,62,19,'#a5b7a8','SceneDisplay','right');
  const count=Object.values(st.collected||{}).filter(Boolean).length;
  box(g,1480,940,361,57,12,'#263529');text(g,`已发现 ${count} / 4`,1660,978,25,'#e7dcb4','SceneSans','center');
  text(g,st.manual?'点击路面行走 · 走近标记，空格查看':'沿着石路，慢慢发现风景里的故事。',75,980,26,'#c7d5c7');
  const active=objects.find(o=>o.id===st.active);
  if(active){
    const x=active.x>1000?109:1080,yy=280;
    box(g,x,yy,640,274,18,'#0e231eed','#b2b78655');text(g,active.name,x+37,yy+66,40,'#f3e4b7','SceneSerif');
    text(g,active.subtitle,x+37,yy+113,24,'#adc9b6');line(g,x+37,yy+138,x+603,yy+138,'#b2c2a33d');
    active.body.forEach((str,i)=>text(g,str,x+37,yy+188+i*39,25,'#dbe5d7'));
  }
  if(!st.manual)text(g,t>=28?'Dreamer — Kevin MacLeod  /  incompetech.com  /  CC BY 4.0':'点击页面的“开始探索”，可以亲自走进这座园。',W/2,1052,t>=28?18:24,'#9cb29f','SceneSans','center');
  else text(g,st.active?'再次行走可收起说明。':'银杏 · 花朵 · 陶瓶 · 画作',W/2,1052,24,'#9cb29f','SceneSans','center');
}
export function renderFrame(canvas,id,t,state){
  const s=catalog.find(v=>v.id===id)||catalog[0],g=canvas.getContext('2d',{alpha:false});
  t=clamp(Number(t)||0,0,29.999);g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.filter='none';
  if(id==='interactive'){interactiveShot(g,t,state);g.restore();return;}
  const k=Math.min(2,Math.floor(t/10)),q=t-k*10;
  const draw=(ctx,chapter,local)=>s.type==='art'?artShot(ctx,id,chapter,local):id==='product'?productShot(ctx,chapter,local):dataShot(ctx,chapter,local);
  draw(g,k,q);
  if(k>0&&q<.9){
    let buffer=buffers.get(id);if(!buffer){buffer=document.createElement('canvas');buffer.width=W;buffer.height=H;buffers.set(id,buffer);}
    draw(buffer.getContext('2d'),k-1,9.1+q);alpha(g,1-smooth(q/.9),()=>g.drawImage(buffer,0,0));
  }
  caption(g,s,k,t);closing(g,s,t);g.restore();
}
