import * as THREE from 'three';
import { Loop } from '../core/Loop';
import { createRenderer } from '../core/Renderer';
import { HarborInput } from '../core/HarborInput';
import { createHarborWorld } from '../assets/HarborWorld';
import { HarborUI } from '../ui/HarborUI';
import { HarborAudio } from '../systems/HarborAudio';
import { Simulation, type GameEvent } from './Simulation';
import { HOME, PICKUPS, WALLS } from './level';
import type { UiIntent } from './contracts';

export class Game {
  private readonly renderer:THREE.WebGLRenderer;
  private readonly scene=new THREE.Scene();
  private readonly camera=new THREE.OrthographicCamera(-28,28,16,-16,.1,160);
  private readonly audio=new HarborAudio();
  private readonly simulation=new Simulation(event=>this.onEvent(event));
  private readonly ui:HarborUI;
  private readonly input:HarborInput;
  private readonly world:ReturnType<typeof createHarborWorld>;
  private readonly loop=new Loop(dt=>this.update(dt),()=>this.render());
  private readonly testing=import.meta.env.DEV||new URLSearchParams(location.search).get('qa')==='1';
  private accumulator=0;private heading=0;private frame=0;private snapshotPaused=false;private pendingPulse=false;
  private toast='';private toastUntil=0;private reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  private width=0;private height=0;private dpr=1;
  constructor(private readonly canvas:HTMLCanvasElement){
    this.renderer=createRenderer(canvas);this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMappingExposure=1.16;
    this.world=createHarborWorld(this.scene);this.ui=new HarborUI(intent=>this.onIntent(intent));this.input=new HarborInput();
    window.addEventListener('keydown',this.onKey);window.addEventListener('blur',this.onBlur);
    document.addEventListener('visibilitychange',this.onVisibility);
    if(this.testing)this.installTestHooks();this.resize();this.syncWorld();this.syncUi();
  }
  start():void{this.loop.start();}
  dispose():void{
    this.loop.stop();this.input.dispose();this.ui.dispose();this.world.dispose();this.audio.dispose();this.renderer.dispose();
    window.removeEventListener('keydown',this.onKey);window.removeEventListener('blur',this.onBlur);document.removeEventListener('visibilitychange',this.onVisibility);
    window.__THREE_GAME_DIAGNOSTICS__=undefined;window.__THREE_GAME_TEST_HOOKS__=undefined;
  }
  private onIntent(intent:UiIntent):void{
    const s=this.simulation.state;
    if(['start','retry','menu','pause','resume'].includes(intent)){this.pendingPulse=false;this.accumulator=0;}
    if(['start','retry'].includes(intent)){void this.audio.unlock();this.simulation.reset();this.input.clear();this.toast='先去北侧回收能源，装满后返回青绿基地';this.toastUntil=6;this.accumulator=0;}
    if(intent==='menu'){this.simulation.reset(false);this.input.clear();}
    if(intent==='pause'&&s.mode==='playing'){s.mode='paused';this.input.clear();}
    if(intent==='resume'&&s.mode==='paused'){s.mode='playing';this.input.clear();void this.audio.unlock();}
    if(intent==='mute'){void this.audio.unlock();this.audio.toggle();}
    if(intent==='motion')this.reducedMotion=!this.reducedMotion;
    this.syncUi();this.syncWorld();
  }
  private readonly onKey=(e:KeyboardEvent):void=>{if(e.repeat)return;if(e.code==='KeyP'){const m=this.simulation.state.mode;if(m==='playing')this.onIntent('pause');else if(m==='paused')this.onIntent('resume');}};
  private readonly onBlur=():void=>{if(this.simulation.state.mode==='playing')this.onIntent('pause');};
  private readonly onVisibility=():void=>{if(document.hidden)this.onBlur();};
  private onEvent(event:GameEvent):void{
    this.audio.play(event);const s=this.simulation.state;
    const messages:Record<GameEvent,string>={pickup:s.cargo.length===2?'货舱已满 · 返回青绿基地交付':'能源入舱 · 可继续装载或返航',deliver:`交付成功 ${s.delivered}/6 · 艇体修复`,hit:'艇体受损 · 放慢速度或用 EMP 清出通道',pulse:'EMP 已释放 · 附近巡逻机暂时失效',overheat:'发动机过热 · 松开加速等待冷却',won:'六枚能源已交付',lost:'运输任务中断'};
    this.toast=messages[event];this.toastUntil=s.time+3;
  }
  private update(dt:number):void{
    this.frame++;this.resize();if(!this.snapshotPaused){
      const controls=this.input.read();this.accumulator=Math.min(.12,this.accumulator+dt);
      this.pendingPulse ||= controls.pulse;
      while(this.accumulator>=1/60){this.simulation.step(1/60,{...controls,pulse:this.pendingPulse});this.pendingPulse=false;this.accumulator-=1/60;}
      const p=this.simulation.state.player;if(Math.hypot(p.vx,p.vz)>.2){const target=Math.atan2(-p.vx,-p.vz);const diff=Math.atan2(Math.sin(target-this.heading),Math.cos(target-this.heading));this.heading+=diff*(1-Math.exp(-14*dt));}
    }
    this.syncWorld();this.syncUi();
  }
  private resize():void{
    const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight),mobile=w<700;
    const dpr=Math.min(devicePixelRatio||1,mobile?1.5:2);
    if(w===this.width&&h===this.height&&dpr===this.dpr)return;
    this.width=w;this.height=h;this.dpr=dpr;this.renderer.setPixelRatio(dpr);this.renderer.setSize(w,h,false);
    const halfHeight=mobile?21:Math.max(16,28*h/w);
    this.camera.left=-halfHeight*w/h;this.camera.right=halfHeight*w/h;this.camera.top=halfHeight;this.camera.bottom=-halfHeight;this.camera.updateProjectionMatrix();
  }
  private syncWorld():void{
    const s=this.simulation.state,p=s.player,small=this.width<700;
    const cx=small?p.x:0,cz=small?p.z:0;
    const shake=this.reducedMotion?0:s.impact*.25;
    this.camera.position.set(cx+Math.sin(s.time*70)*shake,42,cz+29);this.camera.lookAt(cx,0,cz);
    this.world.update({x:p.x,z:p.z,vx:p.vx,vz:p.vz,heading:this.heading,speed:Math.hypot(p.vx,p.vz),boosting:s.boosting,heat:s.heat,hull:s.hull,time:s.time,collected:s.collected,cargoCount:s.cargo.length,delivered:s.delivered,hazards:s.hazards.slice(0,this.simulation.wave).map(h=>({...h,stunned:h.stunned>0})),pulse:s.pulse,impact:s.impact,mode:s.mode,reducedMotion:this.reducedMotion});
  }
  private syncUi():void{
    const s=this.simulation.state;
    this.ui.update({mode:s.mode,delivered:s.delivered,cargo:s.cargo.length,hull:s.hull,remaining:s.remaining,heat:s.heat,overheated:s.overheated,pulseCooldown:s.pulseCooldown,wave:this.simulation.wave,speed:Math.hypot(s.player.vx,s.player.vz),reason:s.reason,toast:s.time<this.toastUntil?this.toast:'',muted:this.audio.muted,reducedMotion:this.reducedMotion,player:s.player,pickups:PICKUPS.map((p,i)=>({...p,collected:s.collected[i]})),hazards:s.hazards.slice(0,this.simulation.wave).map(h=>({...h,stunned:h.stunned>0}))});
  }
  private render():void{this.renderer.render(this.scene,this.camera);this.publishDiagnostics();}
  private publishDiagnostics():void{
    if(!this.testing)return;const s=this.simulation.state,info=this.renderer.info;
    window.__THREE_GAME_DIAGNOSTICS__={frame:this.frame,elapsed:s.time,score:s.delivered,targetScore:6,complete:s.mode==='won',mode:s.mode,fail:s.mode==='lost',cargo:s.cargo.length,hull:s.hull,remaining:s.remaining,heat:s.heat,wave:this.simulation.wave,hazards:s.hazards.slice(0,this.simulation.wave).map(h=>({x:h.x,z:h.z,stunned:h.stunned})),player:{position:{x:s.player.x,y:.5,z:s.player.z},speed:Math.hypot(s.player.vx,s.player.vz)},renderer:{calls:info.render.calls,triangles:info.render.triangles,geometries:info.memory.geometries,textures:info.memory.textures},physics:{engine:'arcade-circle-aabb',timestep:1/60,colliders:WALLS.length+this.simulation.wave,sensors:PICKUPS.length+1},canvas:{clientWidth:this.width,clientHeight:this.height,width:this.canvas.width,height:this.canvas.height,dpr:this.dpr}};
  }
  private installTestHooks():void{
    window.__THREE_GAME_TEST_HOOKS__={seed:value=>this.simulation.seed(value),setState:name=>{
      if(!['menu','active-play','cargo-return','late-run','paused','won','lost'].includes(name))throw new Error(`Unknown test state: ${name}`);
      this.snapshotPaused=false;this.simulation.reset(name!=='menu');this.input.clear();this.heading=0;this.toast='';this.toastUntil=0;
      const s=this.simulation.state;
      if(name==='cargo-return'){s.player.x=-18;s.player.z=5;s.cargo=[0,1];s.collected[0]=s.collected[1]=true;s.time=38;s.hull=3;}
      if(name==='late-run'){s.delivered=4;s.collected=s.collected.map((_,i)=>i<4);s.player.x=9;s.player.z=-5;s.time=65;}
      if(name==='paused')s.mode='paused';
      if(name==='lost'){s.hull=0;this.simulation.step(1/60,{x:0,z:0,boost:false,pulse:false});}
      if(name==='won'){s.delivered=4;s.cargo=[4,5];s.collected=s.collected.map(()=>true);Object.assign(s.player,HOME);this.simulation.step(1/60,{x:0,z:0,boost:false,pulse:false});}
      if(name==='late-run'||name==='cargo-return'){s.remaining-=s.time;this.simulation.step(1/60,{x:0,z:0,boost:false,pulse:false});}
      this.syncWorld();this.syncUi();this.render();return{state:name};
    },setPausedForScreenshot:paused=>{this.snapshotPaused=paused;},setReducedMotion:enabled=>{this.reducedMotion=enabled;this.syncWorld();this.render();},hideDebugUi:()=>{}};
  }
}
