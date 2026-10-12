/**
 * 竹影问剑 v2 — painted wuxia theatre, grounded atlas actors and brush effects.
 * The asset files were authored with the built-in imagegen tool for this game.
 * Their provenance/actual atlas inspection is recorded in art-notes-v2.md.
 * One owning Game loop supplies all timing; this module has no input or rules.
 */
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {FighterFrame,WorldFrame} from '../game/contracts';

type Point=readonly[number,number];
type FrameCell={column:number;row:number;footX:number;footY:number;rect:readonly[number,number,number,number];sheetWidth:number;sheetHeight:number;unitsPerPixel:number;source:'hero'|'enemy'|'attack'};
type ActorRig={root:THREE.Group;plane:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;material:THREE.MeshBasicMaterial;columns:number;rows:number;lastCell:string;wind:{value:number};motion:{value:number};foot:{value:number};width:number;height:number;};

const ART_URLS={
  scene:new URL('../../../../assets/ink-art/scene-v2.png',import.meta.url).href,
  hero:new URL('../../../../assets/ink-art/hero-atlas-v3.png',import.meta.url).href,
  enemy:new URL('../../../../assets/ink-art/enemy-atlas-v3.png',import.meta.url).href,
  attack:new URL('../../../../assets/ink-art/hero-attack-v4.png',import.meta.url).href,
};

// Real image alpha bounds, not nominal equal grid divisions: broad sleeves and
// blades cross nominal columns. Explicit padded rectangles isolate each figure.
// Foot anchors use the centre of the last 35 strong-alpha pixel rows.
function cell(source:FrameCell['source'],column:number,row:number,rect:FrameCell['rect'],footX:number,footY:number):FrameCell{
  const sheetWidth=source==='hero'?1024:source==='enemy'?1254:1536,sheetHeight=source==='hero'?1536:source==='enemy'?1254:1024;
  return{source,column,row,rect,sheetWidth,sheetHeight,footX:(footX-rect[0])/(rect[2]-rect[0]),footY:(footY-rect[1])/(rect[3]-rect[1]),unitsPerPixel:source==='hero'?5.8/512:source==='enemy'?5.8/418:3.91/851};
}
const HERO_CELLS:Record<string,FrameCell>={
  idle:cell('hero',0,0,[44,55,452,515],271.5,507),walk:cell('hero',1,0,[565,56,975,516],834,510),
  attack:cell('attack',0,0,[45,84,1510,951],652,943),parry:cell('hero',1,1,[590,544,985,1000],826.5,992),
  dodge:cell('hero',0,2,[55,1081,496,1425],344,1417),hurt:cell('hero',1,2,[584,1037,993,1452],857.5,1444),
};
const ENEMY_CELLS:FrameCell[][]=[
  [cell('enemy',0,0,[83,54,310,406],203.5,398),cell('enemy',1,0,[422,44,736,403],612.5,395),cell('enemy',2,0,[796,105,1242,403],970,395)],
  [cell('enemy',0,1,[28,449,332,816],199,808),cell('enemy',1,1,[412,423,767,816],621.5,808),cell('enemy',2,1,[794,505,1231,814],1014.5,806)],
  [cell('enemy',0,2,[55,840,319,1192],192.5,1184),cell('enemy',1,2,[435,828,752,1192],618.5,1184),cell('enemy',2,2,[790,900,1240,1191],998,1183)],
];

export function createInkWorld(scene:THREE.Scene){
  const root=new THREE.Group();root.name='paintedWuxiaTheatre';scene.add(root);
  const previousBackground=scene.background,previousFog=scene.fog;
  const backgroundColor=new THREE.Color('#eae0cb');scene.background=backgroundColor;scene.fog=null;
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
  const instances:THREE.InstancedMesh[]=[];
  const resources:{id:string;url:string;status:'loading'|'loaded'|'failed'|'placeholder';width:number;height:number;error?:string}[]=[];
  const resourcePromises:Promise<void>[]=[];
  let heroPose='idle',enemyPose='stage-0/idle';
  let disposed=false,seed=27041;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const ownGeometry=<T extends THREE.BufferGeometry>(g:T):T=>{geometries.add(g);return g;};
  const ownMaterial=<T extends THREE.Material>(m:T):T=>{materials.add(m);return m;};
  function solid(color:string,opacity=1){return ownMaterial(new THREE.MeshBasicMaterial({color,opacity,transparent:opacity<1,depthWrite:opacity===1,side:THREE.DoubleSide,toneMapped:false,fog:false}));}
  function polygon(points:readonly Point[]){const s=new THREE.Shape();s.moveTo(...points[0]);for(let i=1;i<points.length;i++)s.lineTo(...points[i]);s.closePath();return new THREE.ShapeGeometry(s);}
  function stroke(points:readonly Point[],width:number){
    const p:number[]=[],uv:number[]=[],indices:number[]=[];
    for(let i=0;i<points.length;i++){
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
      const w=width*(.42+.58*Math.sin(Math.PI*i/(points.length-1))),nx=-dy/len*w/2,ny=dx/len*w/2;
      p.push(points[i][0]+nx,points[i][1]+ny,0,points[i][0]-nx,points[i][1]-ny,0);uv.push(i/(points.length-1),1,i/(points.length-1),0);
      if(i<points.length-1){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);return g;
  }
  function mesh(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D=root,z=0){const item=new THREE.Mesh(ownGeometry(g),m);item.position.z=z;parent.add(item);return item;}
  function batch(parts:THREE.BufferGeometry[],m:THREE.Material,parent:THREE.Object3D,z:number){const merged=mergeGeometries(parts,false);for(const part of parts)part.dispose();if(!merged)throw new Error('Ink brush batch is incompatible');return mesh(merged,m,parent,z);}
  function load(id:string,url:string,opaque:boolean){
    const resource:typeof resources[number]={id,url,status:'loading',width:0,height:0};resources.push(resource);
    const placeholder=new THREE.DataTexture(new Uint8Array(opaque?[234,224,203,255]:[0,0,0,0]),1,1,THREE.RGBAFormat);placeholder.needsUpdate=true;
    if(typeof document==='undefined'){resource.status='placeholder';textures.add(placeholder);resourcePromises.push(Promise.resolve());return placeholder;}
    placeholder.dispose();
    let resolveLoad!:()=>void,rejectLoad!:(error:Error)=>void;
    resourcePromises.push(new Promise<void>((resolve,reject)=>{resolveLoad=resolve;rejectLoad=reject;}));
    const texture=new THREE.TextureLoader().load(url,loaded=>{resource.status='loaded';resource.width=loaded.image.width;resource.height=loaded.image.height;if(disposed)loaded.dispose();resolveLoad();},undefined,error=>{resource.status='failed';resource.error=error instanceof Error?error.message:String(error);rejectLoad(new Error(`Painted wuxia ${id} failed to load: ${url}`));});
    texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps=true;texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;textures.add(texture);return texture;
  }
  const sceneTexture=load('scene',ART_URLS.scene,true),heroTexture=load('hero-atlas',ART_URLS.hero,false),enemyTexture=load('enemy-atlas',ART_URLS.enemy,false),attackTexture=load('hero-attack',ART_URLS.attack,false);
  const ready=Promise.all(resourcePromises).then(()=>undefined);
  const actorTextures={hero:heroTexture,enemy:enemyTexture,attack:attackTexture};

  // The painted platform's verified image y-coordinate maps to world y=0.
  // A generous unlit art plane provides overscan while the Game owns camera fit.
  const sceneWidth=36,sceneHeight=sceneWidth*941/1672,paintedFootLine=642/941;
  const sceneMaterial=ownMaterial(new THREE.MeshBasicMaterial({map:sceneTexture,toneMapped:false,fog:false,side:THREE.DoubleSide}));
  const backdrop=mesh(new THREE.PlaneGeometry(sceneWidth,sceneHeight),sceneMaterial,root,-9);
  backdrop.name='handPaintedBambooMountains';backdrop.position.y=(paintedFootLine-.5)*sceneHeight;
  backdrop.frustumCulled=false;
  backdrop.onBeforeRender=(_renderer,_scene,camera)=>{
    // Cover tall phone viewports with proportional art overscan; camera settings
    // and the ground line are unchanged. This runs inside the Game render call.
    if(!(camera instanceof THREE.OrthographicCamera))return;
    const top=camera.position.y+camera.top/camera.zoom,bottom=camera.position.y+camera.bottom/camera.zoom;
    const height=Math.max(sceneHeight,top/paintedFootLine,-bottom/(1-paintedFootLine));
    const scale=height/sceneHeight;
    if(backdrop.scale.x!==scale){backdrop.scale.set(scale,scale,1);backdrop.position.y=(paintedFootLine-.5)*height;backdrop.updateMatrixWorld(true);}
  };

  // One tiny shared scalar texture supplies dry-brush granulation to event VFX.
  const noiseSize=64,noiseData=new Uint8Array(noiseSize*noiseSize*4);
  for(let y=0;y<noiseSize;y++)for(let x=0;x<noiseSize;x++){
    const v=Math.max(0,Math.min(255,135+(random()-.5)*150+Math.sin(x*.42+y*.1)*22));const i=(y*noiseSize+x)*4;
    noiseData[i]=noiseData[i+1]=noiseData[i+2]=v;noiseData[i+3]=255;
  }
  const brushNoise=new THREE.DataTexture(noiseData,noiseSize,noiseSize,THREE.RGBAFormat);brushNoise.wrapS=brushNoise.wrapT=THREE.RepeatWrapping;brushNoise.magFilter=brushNoise.minFilter=THREE.LinearFilter;brushNoise.needsUpdate=true;textures.add(brushNoise);
  function brushMaterial(color:string,splat=false){
    const uniforms={uNoise:{value:brushNoise},uColor:{value:new THREE.Color(color)},uOpacity:{value:0},uAge:{value:0}};
    const mat=ownMaterial(new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
      vertexShader:`varying vec2 vBrushUv; void main(){vBrushUv=uv; vec3 transformed=vec3(position); #include <project_vertex> }`.replace('#include <project_vertex>','\n#include <project_vertex>\n'),
      fragmentShader:`varying vec2 vBrushUv;uniform sampler2D uNoise;uniform vec3 uColor;uniform float uOpacity,uAge;
        void main(){float n=texture2D(uNoise,vBrushUv*vec2(7.,2.)).r;
          ${splat?'float d=length((vBrushUv-.5)*vec2(2.,2.));float shape=1.-smoothstep(.52-uAge*.1,.99+uAge*.15,d+n*.15);':'float edge=.09+uAge*.10;float shape=smoothstep(n*.08,edge,vBrushUv.y)*smoothstep(n*.08,edge,1.-vBrushUv.y);shape*=smoothstep(0.,.045,vBrushUv.x)*smoothstep(0.,.045,1.-vBrushUv.x);'}
          gl_FragColor=vec4(uColor,shape*(.5+n*.5)*uOpacity);#include <colorspace_fragment>
        }`.replace('#include <colorspace_fragment>','\n#include <colorspace_fragment>\n'),
    }));
    return{mat,uniforms};
  }

  function actor(texture:THREE.Texture,columns:number,rows:number,name:string):ActorRig{
    const body=new THREE.Group();body.name=name;root.add(body);
    const width=5.8,height=5.8;
    const wind={value:0},motion={value:0},foot={value:-height*.44};
    const mat=ownMaterial(new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,alphaTest:.05,toneMapped:false,fog:false,side:THREE.DoubleSide}));
    mat.onBeforeCompile=shader=>{
      shader.uniforms.uInkTime=wind;shader.uniforms.uInkMoving=motion;shader.uniforms.uInkFoot=foot;
      shader.vertexShader='uniform float uInkTime,uInkMoving,uInkFoot;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float clothWeight=clamp((position.y-uInkFoot)/4.8,0.,1.);
        transformed.x+=sin(uInkTime*2.8+position.y*1.4)*.028*clothWeight*clothWeight;
        transformed.x+=sin(uInkTime*8.)*.018*uInkMoving*clothWeight;
      `);
    };
    mat.customProgramCacheKey=()=> 'painted-ink-grounded-cloth-v2';
    const plane=new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(width,height,12,16)),mat);plane.name=name+'ActionAtlas';plane.position.z=.5;plane.frustumCulled=false;body.add(plane);
    return{root:body,plane,material:mat,columns,rows,lastCell:'',wind,motion,foot,width,height};
  }
  const hero=actor(heroTexture,2,3,'paintedSwordsman'),enemy=actor(enemyTexture,3,3,'paintedOpponent');
  function setCell(rig:ActorRig,cell:FrameCell){
    const key=`${cell.source}/${cell.column},${cell.row}`;
    if(rig.lastCell===key)return;rig.lastCell=key;
    const uv=rig.plane.geometry.getAttribute('uv');
    // Rebuild the original [0,1] grid instead of accumulating a crop transform.
    for(let y=0;y<=16;y++)for(let x=0;x<=12;x++){
      const i=y*13+x;
      uv.setXY(i,(cell.rect[0]+x/12*(cell.rect[2]-cell.rect[0]))/cell.sheetWidth,1-(cell.rect[1]+y/16*(cell.rect[3]-cell.rect[1]))/cell.sheetHeight);
    }
    uv.needsUpdate=true;
    rig.width=(cell.rect[2]-cell.rect[0])*cell.unitsPerPixel;rig.height=(cell.rect[3]-cell.rect[1])*cell.unitsPerPixel;
    rig.plane.scale.set(rig.width/5.8,rig.height/5.8,1);
    if(rig.material.map!==actorTextures[cell.source]){rig.material.map=actorTextures[cell.source];rig.material.needsUpdate=true;}
    rig.plane.position.x=(.5-cell.footX)*rig.width;
    rig.plane.position.y=(cell.footY-.5)*rig.height;
    rig.foot.value=(.5-cell.footY)*5.8;
    rig.plane.userData.atlasCell={source:cell.source,column:cell.column,row:cell.row,rect:[...cell.rect]};
  }
  const contactInk=solid('#273331',.16);
  const contactShape=new THREE.Shape();contactShape.absellipse(0,0,.90,.10,0,Math.PI*2,false,0);
  const contactGeometry=ownGeometry(new THREE.ShapeGeometry(contactShape));
  const heroContact=new THREE.Mesh(contactGeometry,contactInk),enemyContact=new THREE.Mesh(contactGeometry,contactInk);heroContact.position.z=enemyContact.position.z=.25;root.add(heroContact,enemyContact);

  // Small authored foreground sprays supplement the painting; they do not replace
  // the actual illustration, or cross the playable corridor with opaque leaves.
  const nearInk=solid('#263c35',.55),nearSoft=solid('#41564b',.30),bambooGroups:THREE.Group[]=[];
  for(const side of[-1,1]){
    const grove=new THREE.Group();grove.position.set(side*12.1,-.25,1.9);root.add(grove);bambooGroups.push(grove);
    const stalks:THREE.BufferGeometry[]=[],leaves:THREE.BufferGeometry[]=[];
    for(let i=0;i<3;i++){
      const bx=(i-1)*.54,h=6.3+random()*2.5,lean=side*(.1+random()*.3);
      stalks.push(stroke([[bx,0],[bx+lean*.3,h*.32],[bx+lean*.6,h*.65],[bx+lean,h]],.08+random()*.035));
      for(let y=1.4;y<h;y+=1.1){
        const at=bx+lean*y/h,branch=-side*(.6+random()*.8),by=y+.35;
        stalks.push(stroke([[at,y],[at+branch*.45,by-.12],[at+branch,by]],.03));
        for(let j=0;j<5;j++){
          const lx=at+branch*(.35+j*.13),ly=y+.35*(.35+j*.13),len=.3+random()*.37,tilt=j%2?.26:-.31;
          leaves.push(polygon([[lx,ly],[lx-side*len*.35,ly+tilt*.50+.055],[lx-side*len,ly+tilt],[lx-side*len*.41,ly+tilt*.49-.03]]));
        }
      }
    }
    batch(stalks,nearInk,grove,0);batch(leaves,nearSoft,grove,.02);
  }
  const leafGeometry=ownGeometry(polygon([[-.24,0],[0,.055],[.28,.025],[.045,-.025]]));
  const driftingLeaves=new THREE.InstancedMesh(leafGeometry,nearSoft,14);driftingLeaves.frustumCulled=false;root.add(driftingLeaves);instances.push(driftingLeaves);
  const leafSeeds=Array.from({length:14},()=>({x:-14+random()*28,y:random()*11,speed:.20+random()*.24,phase:random()*6.28}));
  const transform=new THREE.Object3D();

  const heroBrush=brushMaterial('#182b2a'),enemyBrush=brushMaterial('#a3342a'),redBrush=brushMaterial('#ad342b');
  function arcBrush(material:THREE.Material,name:string){
    const group=new THREE.Group();group.name=name;root.add(group);
    const points:Point[]=[],fine:Point[]=[];
    for(let i=0;i<=32;i++){const a=-1.18+i/32*2.54;points.push([Math.cos(a)*2.1,Math.sin(a)*2.1]);fine.push([Math.cos(a)*2.35,Math.sin(a)*2.35]);}
    mesh(stroke(points,.29),material,group,.8);mesh(stroke(fine,.035),material,group,.82);
    batch([stroke([[1.96,-.45],[2.6,-.69]],.03),stroke([[2.0,.33],[2.66,.47]],.06)],material,group,.81);
    return group;
  }
  const heroSlash=arcBrush(heroBrush.mat,'dryInkSwordArc'),enemySlash=arcBrush(enemyBrush.mat,'enemyVermilionArc');
  const warning=new THREE.Group();warning.name='vermilionSwordRange';root.add(warning);
  mesh(stroke([[0,0],[.5,.018],[1.8,.02],[3.12,.045]],.11),redBrush.mat,warning,.6);
  const heavyLine=mesh(stroke([[.06,.15],[1.6,.19],[3.12,.15]],.05),redBrush.mat,warning,.61);
  const heavyOmen=new THREE.Group();heavyOmen.name='threeBrushHeavyOmen';root.add(heavyOmen);
  batch([stroke([[-.34,.05],[-.30,.4],[-.32,.78]],.12),stroke([[0,0],[.06,.4],[.04,.85]],.15),stroke([[.36,.10],[.41,.40],[.38,.77]],.12)],redBrush.mat,heavyOmen,.7);

  const impactInk=brushMaterial('#182826',true),impactRed=brushMaterial('#a53a31',true);
  const impactGroup=new THREE.Group();impactGroup.name='pooledDryInkImpact';root.add(impactGroup);
  const dropletGeometry=ownGeometry(new THREE.PlaneGeometry(.31,.14));
  const inkDrops=new THREE.InstancedMesh(dropletGeometry,impactInk.mat,18),redDrops=new THREE.InstancedMesh(dropletGeometry,impactRed.mat,6);
  inkDrops.frustumCulled=redDrops.frustumCulled=false;impactGroup.add(inkDrops,redDrops);instances.push(inkDrops,redDrops);
  const dropAngles=Array.from({length:24},(_,i)=>i/24*Math.PI*2+(random()-.5)*.28);

  const parryBrush=brushMaterial('#ede0b7'),parryDark=brushMaterial('#293c35');
  const parryGroup=new THREE.Group();parryGroup.name='brokenInkParryStar';root.add(parryGroup);
  const sparkParts:THREE.BufferGeometry[]=[];
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,len=i%2?.58:1.05;sparkParts.push(stroke([[Math.cos(a)*.13,Math.sin(a)*.13],[Math.cos(a)*len,Math.sin(a)*len]],i%2?.045:.085));}
  batch(sparkParts,parryBrush.mat,parryGroup,1.05);
  const circlePoints:Point[]=Array.from({length:41},(_,i)=>[Math.cos(i/40*Math.PI*2)*.38,Math.sin(i/40*Math.PI*2)*.38]);
  mesh(stroke(circlePoints,.045),parryDark.mat,parryGroup,1.06);

  function pose(rig:ActorRig,fighter:FighterFrame,time:number,reduced:boolean,isEnemy:boolean,stage:number){
    const p=THREE.MathUtils.clamp(fighter.progress,0,1),moving=Math.min(1,Math.abs(fighter.moving));
    rig.root.position.set(fighter.x,0,isEnemy?.02:.08);rig.root.rotation.z=0;rig.root.scale.set(fighter.facing,1,1);rig.material.opacity=1;rig.material.color.set('#ffffff');
    rig.wind.value=reduced?0:time;rig.motion.value=reduced?0:moving;
    let cell:FrameCell;
    if(isEnemy){let column=0;if(fighter.action==='windup')column=1;else if(fighter.action==='strike'||fighter.action==='recover'&&p<.5)column=2;cell=ENEMY_CELLS[stage][column];enemyPose=`stage-${stage}/${['idle','windup','strike'][column]}`;}
    else{
      let name='idle';
      if(fighter.action==='attack')name=p>=.26&&p<.78?'attack':'idle';
      else if(fighter.action==='parry')name='parry';else if(fighter.action==='dodge')name='dodge';else if(fighter.action==='hurt')name='hurt';
      else if(moving>.12)name=Math.sin(time*10)>-.35?'walk':'idle';
      cell=HERO_CELLS[name];
      heroPose=name;
    }
    setCell(rig,cell);
    if(fighter.action==='attack'||fighter.action==='strike')rig.root.rotation.z=-fighter.facing*Math.sin(p*Math.PI)*.024;
    else if(fighter.action==='hurt'||fighter.action==='stagger'){rig.root.rotation.z=fighter.facing*Math.sin(p*Math.PI)*.055;rig.material.color.set('#d1afa1');}
    else if(fighter.action==='defeated'){rig.root.rotation.z=-fighter.facing*(.12+p*.95);rig.material.opacity=1-p*.78;}
    else rig.material.color.set('#ffffff');
    if(fighter.action==='dodge'){rig.root.rotation.z=fighter.facing*Math.sin(p*Math.PI)*.018;}
    rig.plane.userData.action=fighter.action;
  }

  function update(frame:WorldFrame){
    if(disposed)return;const stage=THREE.MathUtils.clamp(Math.floor(frame.stage),0,2),t=frame.reducedMotion?0:frame.time;
    const enemyFrame=frame.mode==='won'&&frame.enemy.action==='defeated'?{...frame.enemy,progress:1}:frame.enemy;
    pose(hero,frame.player,frame.time,frame.reducedMotion,false,stage);pose(enemy,enemyFrame,frame.time,frame.reducedMotion,true,stage);
    if(frame.mode==='won'&&enemyFrame.action==='defeated')enemy.material.opacity=0;
    heroContact.position.set(frame.player.x,.015,.25);enemyContact.position.set(frame.enemy.x,.015,.25);enemyContact.scale.x=frame.enemy.action==='defeated'?1.5:1;
    enemyContact.visible=frame.mode!=='won';
    bambooGroups.forEach((grove,i)=>grove.rotation.z=Math.sin(t*.65+i*2)*.006);
    for(let i=0;i<leafSeeds.length;i++){const leaf=leafSeeds[i];transform.position.set(leaf.x+Math.sin(t*.35+leaf.phase)*.5,((leaf.y-t*leaf.speed+300)%11)-.4,-.5);transform.rotation.set(0,0,Math.sin(t*.65+leaf.phase)*.55);transform.scale.setScalar(.6+i%3*.14);transform.updateMatrix();driftingLeaves.setMatrixAt(i,transform.matrix);}driftingLeaves.instanceMatrix.needsUpdate=true;
    function showSlash(group:THREE.Group,fighter:FighterFrame,value:number,brush:ReturnType<typeof brushMaterial>){const age=1-THREE.MathUtils.clamp(value,0,1);group.visible=value>0;group.position.set(fighter.x+.3*fighter.facing,2.1,.7);group.scale.set(fighter.facing*(.92+age*.14),.92+age*.14,1);group.rotation.z=fighter.facing*(.16-age*.32);brush.uniforms.uOpacity.value=Math.min(.85,value*.95);brush.uniforms.uAge.value=age;}
    showSlash(heroSlash,frame.player,frame.slash,heroBrush);showSlash(enemySlash,frame.enemy,frame.enemySlash,enemyBrush);
    const telegraph=THREE.MathUtils.clamp(frame.telegraph,0,1);
    warning.visible=telegraph>0&&(frame.mode==='playing'||frame.mode==='paused');warning.position.set(frame.enemy.x,.055,.4);warning.scale.set(frame.enemy.facing*(frame.heavy?1.2:1),1,1);heavyLine.visible=frame.heavy;
    redBrush.uniforms.uOpacity.value=.34+telegraph*.55;redBrush.uniforms.uAge.value=1-telegraph;
    heavyOmen.visible=warning.visible&&frame.heavy;heavyOmen.position.set(frame.enemy.x+frame.enemy.facing*.08,4.75,.4);heavyOmen.scale.setScalar(.8+telegraph*.13);
    const contactX=(frame.player.x+frame.enemy.x)*.5,impactX=frame.player.action==='hurt'?frame.player.x:frame.enemy.action==='stagger'||frame.enemy.action==='defeated'?frame.enemy.x:contactX;
    const impactAge=1-THREE.MathUtils.clamp(frame.impact,0,1);impactGroup.visible=frame.impact>0;impactGroup.position.set(impactX,2.12,.85);
    impactInk.uniforms.uOpacity.value=frame.impact*.90;impactInk.uniforms.uAge.value=impactAge;impactRed.uniforms.uOpacity.value=frame.impact*.72;impactRed.uniforms.uAge.value=impactAge;
    for(let i=0;i<24;i++){const a=dropAngles[i],spread=(.12+impactAge*(1.2+(i%5)*.16))*(frame.reducedMotion?.55:1);transform.position.set(Math.cos(a)*spread,Math.sin(a)*spread*.7-impactAge*impactAge*.48,0);transform.rotation.set(0,0,a);transform.scale.set(.7+i%3*.28,.8,1);transform.updateMatrix();if(i<18)inkDrops.setMatrixAt(i,transform.matrix);else redDrops.setMatrixAt(i-18,transform.matrix);}inkDrops.instanceMatrix.needsUpdate=redDrops.instanceMatrix.needsUpdate=true;
    parryGroup.visible=frame.parryFlash>0;parryGroup.position.set(contactX,2.56,1.0);parryGroup.scale.setScalar((.8+(1-frame.parryFlash)*.20)*(frame.reducedMotion?.8:1));parryGroup.rotation.z=.08;
    parryBrush.uniforms.uOpacity.value=Math.min(1,frame.parryFlash*1.2);parryBrush.uniforms.uAge.value=1-frame.parryFlash;parryDark.uniforms.uOpacity.value=Math.min(.9,frame.parryFlash);parryDark.uniforms.uAge.value=1-frame.parryFlash;
  }
  function dispose(){if(disposed)return;disposed=true;scene.remove(root);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const texture of textures)texture.dispose();for(const item of instances)item.dispose();if(scene.background===backgroundColor)scene.background=previousBackground;if(scene.fog===null)scene.fog=previousFog;}
  function getDiagnostics(){return{ready:resources.every(resource=>resource.status==='loaded'),loaded:resources.filter(resource=>resource.status==='loaded').map(resource=>resource.id),heroPose,enemyPose,resources:resources.map(resource=>({...resource})),heroCell:{...hero.plane.userData.atlasCell},enemyCell:{...enemy.plane.userData.atlasCell}};}
  return{update,dispose,ready,getDiagnostics};
}
