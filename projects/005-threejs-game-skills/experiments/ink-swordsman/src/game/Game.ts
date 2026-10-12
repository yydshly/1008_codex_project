import * as THREE from 'three';
import {Loop} from '../core/Loop';
import {createRenderer} from '../core/Renderer';
import {InkInput} from '../core/InkInput';
import {InkUI} from '../ui/InkUI';
import {createInkWorld} from '../assets/InkWorld';
import {InkAudio} from '../systems/InkAudio';
import {Simulation,type CombatEvent} from './Simulation';
import {OPPONENTS} from './level';
import type {Controls,UiIntent} from './contracts';

export class Game {
  private readonly renderer:THREE.WebGLRenderer;private readonly scene=new THREE.Scene();
  private readonly camera=new THREE.OrthographicCamera(-13,13,12,-3,.1,100);
  private readonly audio=new InkAudio();private readonly simulation=new Simulation(e=>this.event(e));
  private readonly input:InkInput;private readonly ui:InkUI;private readonly world:ReturnType<typeof createInkWorld>;
  private readonly loop=new Loop(dt=>this.update(dt),()=>this.render());
  private readonly testing=import.meta.env.DEV||new URLSearchParams(location.search).get('qa')==='1';
  private width=0;private height=0;private dpr=1;private frame=0;private accumulator=0;private snapshotPaused=false;private seedValue=42;
  private reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;private toast='';private toastUntil=0;
  private pending:Controls={x:0,attack:false,parry:false,dodge:false};
  private artReady=false;
  constructor(private readonly canvas:HTMLCanvasElement){
    this.renderer=createRenderer(canvas);this.renderer.shadowMap.enabled=false;this.renderer.toneMapping=THREE.NoToneMapping;
    this.world=createInkWorld(this.scene);this.ui=new InkUI(intent=>this.intent(intent));this.input=new InkInput();
    window.addEventListener('keydown',this.key);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
    if(this.testing)this.installHooks();this.resize();this.sync();
    const primary=document.getElementById('ink-primary') as HTMLButtonElement;
    primary.disabled=true;primary.textContent='展卷中…';
    void this.world.ready.then(()=>{this.artReady=true;primary.disabled=false;primary.innerHTML='执剑入场 <span aria-hidden="true">→</span>';}).catch(error=>{
      console.error('水墨素材加载失败',error);primary.textContent='画卷加载失败 · 请刷新';
      const message=document.getElementById('ink-menu-message');if(message)message.textContent='游戏素材未能加载，请刷新页面重新展卷。';
    });
  }
  start():void{this.loop.start();}
  dispose():void{this.loop.stop();this.input.dispose();this.ui.dispose();this.world.dispose();this.audio.dispose();this.renderer.dispose();window.removeEventListener('keydown',this.key);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);window.__THREE_GAME_DIAGNOSTICS__=undefined;window.__THREE_GAME_TEST_HOOKS__=undefined;}
  private readonly key=(e:KeyboardEvent):void=>{if(e.code==='KeyP'&&!e.repeat){if(this.simulation.state.mode==='playing')this.intent('pause');else if(this.simulation.state.mode==='paused')this.intent('resume');}};
  private readonly blur=():void=>{if(this.simulation.state.mode==='playing')this.intent('pause');};
  private readonly visibility=():void=>{if(document.hidden)this.blur();};
  private intent(intent:UiIntent):void{
    if((intent==='start'||intent==='retry')&&!this.artReady)return;
    const s=this.simulation.state;
    if(['start','retry','menu','pause','resume'].includes(intent)){this.input.clear();this.simulation.clearBuffered();this.pending={x:0,attack:false,parry:false,dodge:false};this.accumulator=0;}
    if(intent==='start'||intent==='retry'){this.simulation.reset();void this.audio.unlock();this.toast='靠近对手 · 看朱红蓄力，在出剑前格挡';this.toastUntil=6;}
    if(intent==='menu')this.simulation.reset(false);
    if(intent==='pause'&&s.mode==='playing')s.mode='paused';
    if(intent==='resume'&&s.mode==='paused'){s.mode='playing';void this.audio.unlock();}
    if(intent==='mute'){void this.audio.unlock();this.audio.toggle();}
    if(intent==='motion')this.reducedMotion=!this.reducedMotion;
    this.sync();
  }
  private event(event:CombatEvent):void{
    this.audio.play(event);const s=this.simulation.state;
    const messages:Record<CombatEvent,string>={swing:'出剑 · 抓住收招与失衡的破绽',parry:'格挡成功 · 对手失衡，立即反击',counter:'破势反击 · 三倍伤害',hit:s.player.action==='hurt'?'受击 · 接近蓄力末端再格挡，或闪避':'剑锋命中',dodge:'闪身 · 拉开距离',guard:'对手剑势未散 · 等待破绽',round:`第 ${s.stage+1} 场 · ${OPPONENTS[s.stage].name}`,won:'三场交锋 · 尽破其势',lost:'交锋中断 · 再读一次对手剑势'};
    this.toast=messages[event];this.toastUntil=s.time+2.8;
  }
  private update(dt:number):void{
    this.frame++;this.resize();
    if(!this.snapshotPaused&&this.artReady){const c=this.input.read();this.pending.x=c.x;this.pending.attack ||= c.attack;this.pending.parry ||= c.parry;this.pending.dodge ||= c.dodge;this.accumulator=Math.min(.12,this.accumulator+dt);
      while(this.accumulator>=1/60){this.simulation.step(1/60,this.pending);this.pending.attack=this.pending.parry=this.pending.dodge=false;this.accumulator-=1/60;}
    }
    this.sync();
  }
  private resize():void{
    const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight),dpr=Math.min(devicePixelRatio||1,w<700?1.5:2);
    if(w===this.width&&h===this.height&&dpr===this.dpr)return;
    this.width=w;this.height=h;this.dpr=dpr;this.renderer.setPixelRatio(dpr);this.renderer.setSize(w,h,false);
    const halfWidth=w<700?9:Math.max(13,7*w/h);this.camera.left=-halfWidth;this.camera.right=halfWidth;this.camera.top=halfWidth*h/w;this.camera.bottom=-halfWidth*h/w;this.camera.updateProjectionMatrix();
  }
  private sync():void{
    const s=this.simulation.state,e=s.enemy,p=s.player,small=this.width<700;
    const cx=small?Math.max(-5,Math.min(5,(p.x+e.x)/2)):0,cy=small?4.2:4.5;
    if(small){const halfWidth=Math.max(6.5,Math.min(10.5,(Math.abs(p.x-e.x)+4.5)/2));this.camera.left=-halfWidth;this.camera.right=halfWidth;this.camera.top=halfWidth*this.height/this.width;this.camera.bottom=-this.camera.top;this.camera.updateProjectionMatrix();}
    const shake=this.reducedMotion?0:s.impact*.07;this.camera.position.set(cx+Math.sin(s.time*81)*shake,cy,30);this.camera.lookAt(cx,cy,0);
    this.world.update(this.simulation.frame(this.reducedMotion));
    this.ui.update({mode:s.mode,stage:s.stage,cleared:s.cleared,enemyName:OPPONENTS[s.stage].name,enemyHp:e.hp,enemyMaxHp:e.maxHp,playerHp:p.hp,energy:p.energy,remaining:s.remaining,parries:s.parries,reason:s.reason,toast:s.time<this.toastUntil?this.toast:'',muted:this.audio.muted,reducedMotion:this.reducedMotion,counterReady:e.phase==='stagger',telegraph:e.phase==='windup'?(e.heavy?'重斩蓄力':'剑势蓄力'):e.phase==='recover'?'收招破绽':e.phase==='stagger'?'失衡 · 可反击':e.phase==='defeated'?'本场破阵':'观察剑势'});
  }
  private render():void{this.renderer.render(this.scene,this.camera);if(!this.testing)return;const s=this.simulation.state,i=this.renderer.info;
    window.__THREE_GAME_DIAGNOSTICS__={frame:this.frame,elapsed:s.time,score:s.cleared,targetScore:3,complete:s.mode==='won',fail:s.mode==='lost',mode:s.mode,stage:s.stage,hp:s.player.hp,energy:s.player.energy,parries:s.parries,remaining:s.remaining,seed:this.seedValue,action:s.player.action,enemy:{x:s.enemy.x,hp:s.enemy.hp,phase:s.enemy.phase,age:s.enemy.age,duration:s.enemy.duration,heavy:s.enemy.heavy},player:{position:{x:s.player.x,y:0,z:0},speed:Math.abs(s.player.vx)},art:this.world.getDiagnostics(),renderer:{calls:i.render.calls,triangles:i.render.triangles,geometries:i.memory.geometries,textures:i.memory.textures},physics:{engine:'authored-1d-range-combat',timestep:1/60,colliders:2,sensors:2},canvas:{clientWidth:this.width,clientHeight:this.height,width:this.canvas.width,height:this.canvas.height,dpr:this.dpr}};
  }
  private installHooks():void{
    window.__THREE_GAME_TEST_HOOKS__={seed:value=>{this.seedValue=value;},setState:async name=>{
      if(!['menu','active-play','windup','attack','parry','dodge','counter','late-run','won','lost','paused'].includes(name))throw new Error(`Unknown test state: ${name}`);
      await this.world.ready;
      this.simulation.reset(name!=='menu');this.input.clear();this.simulation.clearBuffered();this.pending={x:0,attack:false,parry:false,dodge:false};this.accumulator=0;this.snapshotPaused=false;this.toast='';
      const s=this.simulation.state;
      if(['active-play','windup','attack','parry','dodge','counter','late-run'].includes(name)){s.player.x=-1.7;s.enemy.x=1.3;}
      if(name==='windup'){s.enemy.phase='windup';s.enemy.age=.78;s.enemy.duration=.95;}
      if(name==='attack'){s.player.action='attack';s.player.age=.16;s.player.duration=.42;s.slash=.8;s.enemy.phase='recover';s.enemy.age=.1;s.enemy.duration=.55;}
      if(name==='parry'){s.player.action='parry';s.player.age=.12;s.player.duration=.48;s.enemy.phase='windup';s.enemy.age=.87;s.enemy.duration=.95;}
      if(name==='dodge'){s.player.action='dodge';s.player.age=.12;s.player.duration=.34;s.player.x=-3.2;s.player.energy=73;s.player.vx=-12;}
      if(name==='counter'){s.enemy.phase='stagger';s.enemy.age=.2;s.enemy.duration=1.05;s.parries=1;s.parryFlash=.75;}
      if(name==='late-run'){s.stage=2;s.cleared=2;s.enemy.hp=s.enemy.maxHp=6;s.enemy.phase='windup';s.enemy.heavy=true;s.enemy.age=.88;s.enemy.duration=1.12;s.time=56;s.remaining=124;s.player.hp=2;s.player.energy=43;}
      if(name==='won'){s.stage=2;s.cleared=3;s.enemy.hp=0;s.enemy.phase='defeated';s.mode='won';s.parries=7;s.remaining=99;}
      if(name==='lost'){s.player.hp=0;s.mode='lost';s.reason='剑势被破。朱红蓄力接近满时格挡，或闪避拉开距离。';}
      if(name==='paused')s.mode='paused';this.sync();this.render();return{state:name};
    },setPausedForScreenshot:paused=>{this.snapshotPaused=paused;},setReducedMotion:enabled=>{this.reducedMotion=enabled;this.sync();this.render();},hideDebugUi:()=>{}};
  }
}
