import type { GameEvent } from '../game/Simulation';
// 本次原创 Web Audio 合成；遵循事件/手势解锁/暂停生命周期，不使用外部生成服务。
export class HarborAudio {
  muted=false;private context?:AudioContext;private master?:GainNode;
  async unlock():Promise<void>{
    if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.muted?0:.16;this.master.connect(this.context.destination);}
    if(this.context.state==='suspended')await this.context.resume();
  }
  toggle():void{this.muted=!this.muted;if(this.master&&this.context)this.master.gain.setTargetAtTime(this.muted?0:.16,this.context.currentTime,.02);}
  play(event:GameEvent):void{
    const ctx=this.context,gain=this.master;if(!ctx||!gain||ctx.state!=='running'||this.muted)return;
    const frequencies:Record<GameEvent,number[]>={pickup:[620,920],deliver:[440,660,880],hit:[160,70],pulse:[150,600],overheat:[240,180],won:[440,554,660,880],lost:[220,150,100]};
    frequencies[event].forEach((hz,i)=>{const osc=ctx.createOscillator(),env=ctx.createGain(),time=ctx.currentTime+i*.08;osc.type=event==='hit'?'sawtooth':'sine';osc.frequency.setValueAtTime(hz,time);osc.frequency.exponentialRampToValueAtTime(event==='pulse'?hz*.5:hz,time+.16);env.gain.setValueAtTime(0,time);env.gain.linearRampToValueAtTime(.5,time+.008);env.gain.exponentialRampToValueAtTime(.001,time+.2);osc.connect(env);env.connect(gain);osc.start(time);osc.stop(time+.21);osc.onended=()=>{osc.disconnect();env.disconnect();};});
  }
  dispose():void{void this.context?.close();}
}
