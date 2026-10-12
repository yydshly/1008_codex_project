// 原创行为测试：实际执行同一个固定步长模拟，核验核心循环与输入契约。
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import assert from 'node:assert/strict';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
for(const file of ['game/Simulation','game/level','utils/random']){
  const text=await readFile(path.join(root,'src',file+'.ts'),'utf8');
  const code=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/from '([^']+)'/g,(_,p)=>`from '${p}.mjs'`);
  const out=path.join(root,'.cache/simulation',file+'.mjs');await mkdir(path.dirname(out),{recursive:true});await writeFile(out,code);
}
const {Simulation}=await import(pathToFileURL(path.join(root,'.cache/simulation/game/Simulation.mjs')));
const idle={x:0,z:0,boost:false,pulse:false};
const records=[];const check=(name,fn)=>{fn();records.push({name,passed:true});console.log('PASS '+name);};
function step(sim,seconds,input=idle){for(let i=0;i<Math.round(seconds*60);i++)sim.step(1/60,input);}
function drive(sim,x,z){for(let i=0;i<1200;i++){if(sim.state.mode==='won')return;const p=sim.state.player,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.4){step(sim,.15);return;}assert.equal(sim.state.mode,'playing','航段不应提前失败');sim.step(1/60,{...idle,x:dx/d,z:dz/d,pulse:sim.state.pulseCooldown<=0});}throw new Error('无法抵达目标 '+x+','+z);}
check('输入响应、斜向归一化与暂停冻结',()=>{const a=new Simulation();a.reset();step(a,.1,{...idle,x:1});assert(a.state.player.x>-17);assert(a.state.player.vx>3);const x=a.state.player.x,t=a.state.time;a.state.mode='paused';step(a,1,{...idle,x:1});assert.equal(a.state.player.x,x);assert.equal(a.state.time,t);});
check('实际近程路线拾取两枚、交付、修复并进入第二阶段',()=>{const a=new Simulation();a.reset();drive(a,-16,2);drive(a,-15,-6);assert.equal(a.state.cargo.length,2);a.state.hull=2;drive(a,-17,10);assert.equal(a.state.delivered,2);assert.equal(a.state.cargo.length,0);assert.equal(a.state.hull,3);assert.equal(a.wave,2);});
check('三次真实往返路线可完成六枚交付',()=>{const a=new Simulation();a.reset();for(const [x,z] of [[-16,2],[-15,-6],[-17,10],[-17,-7],[1,-9],[15,-7],[8,-7],[8,9],[-17,10],[0,9],[9,8],[-17,10]]){drive(a,x,z);if(a.state.mode==='won')break;}assert.equal(a.state.mode,'won');assert.equal(a.state.delivered,6);assert(a.state.remaining>0);});
check('热量形成加速限制并在冷却后恢复',()=>{const a=new Simulation();a.reset();step(a,3.1,{...idle,z:-1,boost:true});assert(a.state.overheated);assert(!a.state.boosting);step(a,3.2);assert(!a.state.overheated);step(a,.2,{...idle,x:1,boost:true});assert(a.state.boosting);});
check('EMP 确实禁用附近巡逻，冷却期间不可重复释放',()=>{const a=new Simulation();a.reset();const h=a.state.hazards[0];a.state.player.x=h.x;a.state.player.z=h.z;step(a,1/60,{...idle,pulse:true});assert(h.stunned>3);const cooldown=a.state.pulseCooldown;step(a,.2,{...idle,pulse:true});assert(a.state.pulseCooldown<cooldown);assert(a.state.pulseCooldown>8);assert.equal(a.state.hull,4);});
check('鲁莽追撞实际触发失败，重开清理时间、货物和伤害',()=>{const a=new Simulation();a.reset();for(let i=0;i<2400&&a.state.mode==='playing';i++){const h=a.state.hazards[0],p=a.state.player,dx=h.x-p.x,dz=h.z-p.z,d=Math.max(.01,Math.hypot(dx,dz));a.step(1/60,{...idle,x:dx/d,z:dz/d});}assert.equal(a.state.mode,'lost');assert.equal(a.state.hull,0);a.reset();assert.equal(a.state.mode,'playing');assert.equal(a.state.hull,4);assert.equal(a.state.time,0);assert.equal(a.state.cargo.length,0);assert.equal(a.state.invulnerable,0);});
check('剩余交付触发获胜、超时触发失败',()=>{const a=new Simulation();a.reset();a.state.delivered=4;a.state.cargo=[4,5];step(a,1/60);assert.equal(a.state.mode,'won');assert.equal(a.state.delivered,6);a.reset();step(a,150.1);assert.equal(a.state.mode,'lost');assert(a.state.reason.includes('风暴'));});
await mkdir(path.join(root,'artifacts'),{recursive:true});await writeFile(path.join(root,'artifacts/simulation-tests.json'),JSON.stringify({date:'2026-10-09',scope:'实际模拟行为，浏览器输入另验',checks:records},null,2)+'\n');
