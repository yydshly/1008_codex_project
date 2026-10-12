import {LIMITS,OPPONENTS} from './level';
import type {Controls,GameMode,PlayerAction,EnemyAction,FighterFrame,WorldFrame} from './contracts';
export type CombatEvent='swing'|'parry'|'counter'|'hit'|'dodge'|'guard'|'round'|'won'|'lost';
export interface CombatState {
  mode:GameMode;time:number;remaining:number;stage:number;cleared:number;parries:number;reason:string;
  player:{x:number;vx:number;facing:1|-1;hp:number;energy:number;action:PlayerAction;age:number;duration:number;hitDone:boolean;dodgeDir:number};
  enemy:{x:number;facing:1|-1;hp:number;maxHp:number;phase:EnemyAction;age:number;duration:number;heavy:boolean;attackIndex:number};
  impact:number;parryFlash:number;slash:number;enemySlash:number;hitstop:number;roundBreak:number;dodgeCooldown:number;
}
const idle:Controls={x:0,attack:false,parry:false,dodge:false};
export class Simulation {
  state!:CombatState;
  private pending={attack:false,parry:false,dodge:false};
  constructor(private readonly emit:(event:CombatEvent)=>void=()=>{}){this.reset(false);}
  private makeEnemy(stage:number){const o=OPPONENTS[stage];return{x:4.5,facing:-1 as 1|-1,hp:o.hp,maxHp:o.hp,phase:'approach' as EnemyAction,age:0,duration:1,heavy:false,attackIndex:0};}
  reset(playing=true):void{
    this.pending={attack:false,parry:false,dodge:false};
    this.state={mode:playing?'playing':'menu',time:0,remaining:LIMITS.time,stage:0,cleared:0,parries:0,reason:'',player:{x:-4.8,vx:0,facing:1,hp:LIMITS.hp,energy:100,action:'idle',age:0,duration:1,hitDone:false,dodgeDir:-1},enemy:this.makeEnemy(0),impact:0,parryFlash:0,slash:0,enemySlash:0,hitstop:0,roundBreak:0,dodgeCooldown:0};
  }
  clearBuffered():void{this.pending={attack:false,parry:false,dodge:false};}
  private playerAction(action:PlayerAction,duration:number):void{const p=this.state.player;p.action=action;p.age=0;p.duration=duration;p.hitDone=false;}
  private enemyPhase(phase:EnemyAction,duration:number):void{const e=this.state.enemy;e.phase=phase;e.age=0;e.duration=duration;}
  step(dt:number,input:Controls=idle):void{
    const s=this.state;if(s.mode!=='playing'){this.clearBuffered();return;}
    this.pending.attack ||= input.attack;this.pending.parry ||= input.parry;this.pending.dodge ||= input.dodge;
    s.impact=Math.max(0,s.impact-dt*4);s.parryFlash=Math.max(0,s.parryFlash-dt*3);s.slash=Math.max(0,s.slash-dt*5);s.enemySlash=Math.max(0,s.enemySlash-dt*5);
    if(s.hitstop>0){s.hitstop=Math.max(0,s.hitstop-dt);return;}
    s.time+=dt;s.remaining=Math.max(0,s.remaining-dt);s.dodgeCooldown=Math.max(0,s.dodgeCooldown-dt);
    if(s.remaining===0){s.mode='lost';s.reason='卷中时限已尽。放缓出剑，抓住对手收招的破绽。';this.emit('lost');return;}
    const p=s.player,e=s.enemy,o=OPPONENTS[s.stage];
    p.energy=Math.min(100,p.energy+dt*(p.action==='idle'?28:12));
    if(p.action!=='idle'){p.age+=dt;if(p.age>=p.duration)this.playerAction('idle',1);}
    if(p.action==='idle'){
      if(this.pending.dodge&&p.energy>=28&&s.dodgeCooldown===0){p.energy-=28;p.dodgeDir=Math.sign(input.x)||-p.facing;this.playerAction('dodge',.34);s.dodgeCooldown=.8;this.emit('dodge');}
      else if(this.pending.parry&&p.energy>=24){p.energy-=24;this.playerAction('parry',.48);}
      else if(this.pending.attack&&p.energy>=14){p.energy-=14;this.playerAction('attack',.42);this.emit('swing');}
    }
    this.clearBuffered();
    if(p.action==='dodge')p.vx=p.dodgeDir*12;
    else {const factor=p.action==='idle'?1:p.action==='hurt'?.25:.12;p.vx+=(Math.max(-1,Math.min(1,input.x))*LIMITS.speed*factor-p.vx)*(1-Math.exp(-18*dt));}
    p.x=Math.max(LIMITS.left,Math.min(LIMITS.right,p.x+p.vx*dt));
    if(p.action==='idle')p.facing=e.x>=p.x?1:-1;
    if(p.action==='attack'&&p.age>=.13&&!p.hitDone){p.hitDone=true;s.slash=1;this.resolvePlayerHit();}
    if(s.mode!=='playing')return;
    if(e.phase==='defeated'){
      s.roundBreak-=dt;if(s.roundBreak<=0){s.stage++;s.enemy=this.makeEnemy(s.stage);p.x=-4.8;p.vx=0;p.facing=1;p.hp=Math.min(LIMITS.hp,p.hp+1);p.energy=100;this.playerAction('idle',1);this.emit('round');}return;
    }
    e.facing=p.x>=e.x?1:-1;e.age+=dt;
    if(e.phase==='approach'){
      const gap=p.x-e.x;e.x+=Math.sign(gap)*o.speed*dt;
      if(Math.abs(gap)<=2.7){e.heavy=s.stage>0&&e.attackIndex%2===1;this.enemyPhase('windup',e.heavy?1.12:o.windup);}
    }else if(e.phase==='windup'&&e.age>=e.duration){this.enemyPhase('strike',.22);s.enemySlash=1;e.attackIndex++;this.resolveEnemyHit();}
    else if(e.phase==='strike'&&e.age>=e.duration)this.enemyPhase('recover',e.heavy?o.recovery+.22:o.recovery);
    else if((e.phase==='recover'||e.phase==='stagger')&&e.age>=e.duration)this.enemyPhase('approach',1);
  }
  private resolvePlayerHit():void{
    const s=this.state,p=s.player,e=s.enemy;
    if(e.phase==='defeated'||Math.abs(e.x-p.x)>LIMITS.attackRange||Math.sign(e.x-p.x)!==p.facing)return;
    if(e.phase==='windup'||e.phase==='strike'){this.emit('guard');return;}
    const counter=e.phase==='stagger';e.hp=Math.max(0,e.hp-(counter?3:1));s.impact=counter?.85:.45;s.hitstop=.045;
    this.emit(counter?'counter':'hit');
    // A counter consumes the opening; repeated swings need a new read of the enemy.
    if(counter&&e.hp>0)this.enemyPhase('recover',.55);
    if(e.hp===0){s.cleared++;this.enemyPhase('defeated',1.4);s.roundBreak=1.4;
      if(s.cleared===3){s.mode='won';s.reason='三场交锋皆已破阵。';this.emit('won');}
    }
  }
  private resolveEnemyHit():void{
    const s=this.state,p=s.player,e=s.enemy,o=OPPONENTS[s.stage];
    if(Math.abs(e.x-p.x)>o.range+(e.heavy?.45:0))return;
    if(p.action==='dodge'&&p.age<.28)return;
    if(p.action==='parry'&&p.age<=LIMITS.parryWindow){s.parries++;s.parryFlash=1;s.hitstop=.07;p.energy=Math.min(100,p.energy+20);this.enemyPhase('stagger',1.05);this.playerAction('idle',1);this.emit('parry');return;}
    p.hp=Math.max(0,p.hp-(e.heavy?2:1));p.x=Math.max(LIMITS.left,Math.min(LIMITS.right,p.x+e.facing*.55));s.impact=1;s.hitstop=.07;this.playerAction('hurt',.28);this.emit('hit');
    if(p.hp===0){s.mode='lost';s.reason='剑势被破。朱红蓄力接近满时格挡，或闪避拉开距离。';this.emit('lost');}
  }
  frame(reducedMotion:boolean):WorldFrame{
    const s=this.state,p=s.player,e=s.enemy;
    const player:FighterFrame={x:p.x,facing:p.facing,action:p.action,progress:p.age/p.duration,moving:p.vx};
    const enemy:FighterFrame={x:e.x,facing:e.facing,action:e.phase,progress:e.age/e.duration,moving:e.phase==='approach'?e.facing*OPPONENTS[s.stage].speed:0};
    return{time:s.time,mode:s.mode,stage:s.stage,player,enemy,telegraph:e.phase==='windup'?Math.min(1,e.age/e.duration):0,heavy:e.heavy,impact:s.impact,parryFlash:s.parryFlash,slash:s.slash,enemySlash:s.enemySlash,reducedMotion};
  }
}
