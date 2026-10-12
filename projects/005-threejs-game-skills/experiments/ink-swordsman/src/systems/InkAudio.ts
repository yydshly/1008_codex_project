import type {CombatEvent} from '../game/Simulation';
export class InkAudio {
  private context:AudioContext|null=null;private master:GainNode|null=null;muted=false;
  async unlock():Promise<void>{if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=.09;this.master.connect(this.context.destination);}await this.context.resume();}
  toggle():void{this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:.09;}
  play(event:CombatEvent):void{
    const c=this.context,m=this.master;if(!c||!m||c.state!=='running'||this.muted)return;
    const pitches:Record<CombatEvent,number>={swing:300,parry:960,counter:155,hit:90,dodge:430,guard:260,round:540,won:740,lost:110};
    const osc=c.createOscillator(),gain=c.createGain(),now=c.currentTime;
    osc.type=event==='parry'||event==='round'||event==='won'?'triangle':'sawtooth';osc.frequency.setValueAtTime(pitches[event],now);osc.frequency.exponentialRampToValueAtTime(Math.max(40,pitches[event]*.35),now+.13);gain.gain.setValueAtTime(.8,now);gain.gain.exponentialRampToValueAtTime(.001,now+.16);osc.connect(gain);gain.connect(m);osc.start(now);osc.stop(now+.18);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  dispose():void{void this.context?.close();}
}
