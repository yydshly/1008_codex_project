import { createSeededRandom } from '../utils/random';
import { HOME, PICKUPS, WALLS, LIMITS } from './level';
import type { Controls, GameState } from './contracts';

export type GameEvent = 'pickup' | 'deliver' | 'hit' | 'pulse' | 'overheat' | 'won' | 'lost';
export class Simulation {
  state!: GameState;
  private seedValue = 42;
  constructor(private readonly emit: (event: GameEvent) => void = () => {}) { this.reset(false); }
  seed(value: number): void { this.seedValue = value; }
  reset(play = true): void {
    const rng = createSeededRandom(this.seedValue);
    this.state = {mode:play?'playing':'menu',player:{...HOME,vx:0,vz:0},delivered:0,cargo:[],collected:PICKUPS.map(()=>false),
      hull:LIMITS.hull,remaining:LIMITS.duration,time:0,heat:0,overheated:false,pulseCooldown:0,invulnerable:0,
      pulse:0,impact:0,boosting:false,reason:'',hazards:Array.from({length:3},()=>({x:0,z:0,stunned:0,phase:rng()*Math.PI*2}))};
    this.updateHazards(0);
  }
  get wave(): number { return Math.min(3,1+Math.floor(this.state.delivered/2)); }
  step(dt: number, input: Controls): void {
    const s=this.state;if(s.mode!=='playing')return;
    s.time+=dt;s.remaining=Math.max(0,s.remaining-dt);
    s.invulnerable=Math.max(0,s.invulnerable-dt);s.pulse=Math.max(0,s.pulse-dt);s.impact=Math.max(0,s.impact-dt);
    s.pulseCooldown=Math.max(0,s.pulseCooldown-dt);
    const length=Math.hypot(input.x,input.z), moving=length>.05;
    s.boosting=input.boost&&moving&&!s.overheated;
    s.heat=Math.max(0,Math.min(100,s.heat+(s.boosting?35:-24)*dt));
    if(s.heat>=100&&!s.overheated){s.overheated=true;s.boosting=false;this.emit('overheat');}
    if(s.overheated&&s.heat<=25)s.overheated=false;
    if(input.pulse&&s.pulseCooldown<=0){
      s.pulseCooldown=LIMITS.pulseCooldown;s.pulse=.7;
      for(const h of s.hazards.slice(0,this.wave))if(Math.hypot(h.x-s.player.x,h.z-s.player.z)<7)h.stunned=3.5;
      this.emit('pulse');
    }
    const speed=(s.boosting?LIMITS.boost:LIMITS.speed)*(1-s.cargo.length*.08);
    const k=1-Math.exp(-10*dt), norm=Math.max(1,length);
    s.player.vx+=(input.x/norm*speed-s.player.vx)*k;s.player.vz+=(input.z/norm*speed-s.player.vz)*k;
    s.player.x+=s.player.vx*dt;s.player.z+=s.player.vz*dt;
    s.player.x=Math.max(-LIMITS.x+LIMITS.radius,Math.min(LIMITS.x-LIMITS.radius,s.player.x));
    s.player.z=Math.max(-LIMITS.z+LIMITS.radius,Math.min(LIMITS.z-LIMITS.radius,s.player.z));
    this.collidePlatforms();this.updateHazards(dt);
    for(const h of s.hazards.slice(0,this.wave)){
      const dx=s.player.x-h.x,dz=s.player.z-h.z,d=Math.hypot(dx,dz);
      if(h.stunned<=0&&d<1.65){
        if(s.invulnerable<=0){this.damage();const norm=Math.max(.01,d);s.player.x+=dx/norm*.8;s.player.z+=dz/norm*.8;s.player.vx=dx/norm*3;s.player.vz=dz/norm*3;}
      }
    }
    PICKUPS.forEach((p,i)=>{if(!s.collected[i]&&s.cargo.length<LIMITS.cargo&&Math.hypot(p.x-s.player.x,p.z-s.player.z)<1.65){s.collected[i]=true;s.cargo.push(i);this.emit('pickup');}});
    if(s.cargo.length&&Math.hypot(s.player.x-HOME.x,s.player.z-HOME.z)<2.8){
      s.delivered+=s.cargo.length;s.cargo=[];s.hull=Math.min(LIMITS.hull,s.hull+1);s.heat=Math.max(0,s.heat-35);this.emit('deliver');
      if(s.delivered===PICKUPS.length){s.mode='won';s.boosting=false;this.emit('won');}
    }
    if(s.mode==='playing'&&(s.remaining<=0||s.hull<=0)){s.mode='lost';s.boosting=false;s.reason=s.hull<=0?'艇体受损，运输任务中断':'风暴封港，未能及时运回能源';this.emit('lost');}
  }
  private updateHazards(dt: number): void {
    const s=this.state;
    s.hazards.forEach((h,i)=>{
      h.stunned=Math.max(0,h.stunned-dt);if(h.stunned>0)return;
      const t=s.time+h.phase;
      if(i===0){h.x=-9+Math.sin(t*.45)*3;h.z=-4+Math.sin(t*.33)*6;}
      if(i===1){h.x=9+Math.cos(t*.44)*4;h.z=-6+Math.sin(t*.38)*4;}
      if(i===2){h.x=2+Math.sin(t*.46)*7;h.z=8+Math.cos(t*.65)*2;}
    });
  }
  private collidePlatforms(): void {
    const p=this.state.player,r=LIMITS.radius;
    for(const w of WALLS){
      const nx=Math.max(w.x-w.width/2,Math.min(w.x+w.width/2,p.x)),nz=Math.max(w.z-w.depth/2,Math.min(w.z+w.depth/2,p.z));
      let dx=p.x-nx,dz=p.z-nz,d=Math.hypot(dx,dz);
      if(d>=r)continue;
      if(d<.001){const ax=w.width/2-Math.abs(p.x-w.x),az=w.depth/2-Math.abs(p.z-w.z);if(ax<az){dx=p.x>=w.x?1:-1;dz=0;d=1;p.x=w.x+dx*(w.width/2+r);}else{dx=0;dz=p.z>=w.z?1:-1;d=1;p.z=w.z+dz*(w.depth/2+r);}}
      else{p.x+=dx/d*(r-d);p.z+=dz/d*(r-d);}
      const approach=p.vx*dx/d+p.vz*dz/d;
      if(approach<0){if(-approach>4&&this.state.invulnerable<=0)this.damage();p.vx-=approach*dx/d*1.3;p.vz-=approach*dz/d*1.3;}
    }
  }
  private damage(): void {this.state.hull-=1;this.state.invulnerable=1.6;this.state.impact=.35;this.emit('hit');}
}
