// 原创检查：运行与浏览器相同的固定步长战斗；进度由动作输入产生。
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const file of ['Simulation','level']){
  const source=await readFile(path.join(root,'src/game',file+'.ts'),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/from '([^']+)'/g,(_,p)=>`from '${p}.mjs'`);
  await mkdir(path.join(root,'.cache/simulation'),{recursive:true});await writeFile(path.join(root,'.cache/simulation',file+'.mjs'),code);
}
const {Simulation}=await import(pathToFileURL(path.join(root,'.cache/simulation/Simulation.mjs')));
const idle={x:0,attack:false,parry:false,dodge:false},records=[];
function run(s,seconds,c=idle){for(let i=0;i<Math.round(seconds*60);i++)s.step(1/60,c);}
function check(name,fn){fn();records.push({name,passed:true});console.log('PASS '+name);}
function close(){const s=new Simulation();s.reset();s.state.player.x=-1.3;s.state.enemy.x=1.3;return s;}
function wait(s,predicate){for(let i=0;i<1800;i++){if(predicate(s.state))return;assert.equal(s.state.mode,'playing');s.step(1/60);}throw new Error('phase timeout');}
check('移动响应、边界与暂停冻结',()=>{const s=new Simulation();s.reset();run(s,.1,{...idle,x:-1});assert(s.state.player.vx<-3);run(s,3,{...idle,x:-1});assert.equal(s.state.player.x,-8.4);s.state.mode='paused';const x=s.state.player.x,t=s.state.time;run(s,1,{...idle,x:1});assert.equal(s.state.player.x,x);assert.equal(s.state.time,t);});
check('过早格挡会实际受伤',()=>{const s=close();s.step(1/60);s.step(1/60,{...idle,parry:true});run(s,1.1);assert.equal(s.state.parries,0);assert.equal(s.state.player.hp,4);});
check('读蓄力格挡成功、失衡反击造成三点伤害',()=>{const s=close();wait(s,a=>a.enemy.phase==='windup'&&a.enemy.duration-a.enemy.age<.15);s.step(1/60,{...idle,parry:true});wait(s,a=>a.parries===1);assert.equal(s.state.player.hp,5);assert.equal(s.state.enemy.phase,'stagger');s.step(1/60,{...idle,attack:true});run(s,.25);assert.equal(s.state.enemy.hp,1);});
check('蓄力期间盲目挥剑会被防住',()=>{const s=close();s.step(1/60);s.step(1/60,{...idle,attack:true});run(s,.3);assert.equal(s.state.enemy.hp,4);});
check('闪避移动、避伤、消耗与冷却',()=>{const s=close();wait(s,a=>a.enemy.phase==='windup'&&a.enemy.duration-a.enemy.age<.15);const x=s.state.player.x;s.step(1/60,{...idle,dodge:true});assert(s.state.player.energy<75);run(s,.2);assert(s.state.player.x<x-2);assert.equal(s.state.player.hp,5);const cool=s.state.dodgeCooldown;run(s,.18);s.step(1/60,{...idle,dodge:true});assert.notEqual(s.state.player.action,'dodge');assert(s.state.dodgeCooldown<cool);});
check('气息不足阻止动作，停手可恢复',()=>{const s=close();s.state.player.energy=0;s.step(1/60,{...idle,parry:true});assert.equal(s.state.player.action,'idle');run(s,.5);assert(s.state.player.energy>12);});
function bot(delay=0){const s=new Simulation();s.reset();let attackAge=-1;for(let i=0;i<20000&&s.state.mode==='playing';i++){
  const a=s.state,p=a.player,e=a.enemy,c={...idle};
  if(p.action==='idle'){
    if(e.phase==='approach'&&Math.abs(e.x-p.x)>2.6)c.x=Math.sign(e.x-p.x);
    if(e.phase==='windup'&&e.duration-e.age<=.13-delay)c.parry=true;
    if(e.phase==='strike'&&delay>0&&e.age>=delay-.13)c.parry=true;
    if(e.phase==='stagger'&&e.hp>0&&e.age!==attackAge){c.attack=true;attackAge=e.age;}
  }
  s.step(1/60,c);
}return s.state;}
let fast,slow;
check('实际动作完成三轮交锋，无进度设置',()=>{fast=bot();assert.equal(fast.mode,'won');assert.equal(fast.cleared,3);assert(fast.parries>=6);assert.equal(fast.player.hp,5);});
check('延迟接招导致失败，节奏影响结果',()=>{slow=bot(.3);assert.equal(slow.mode,'lost');assert.equal(slow.player.hp,0);});
check('待机实际受击失败，重开清空交锋状态',()=>{const s=new Simulation();s.reset();run(s,45);assert.equal(s.state.mode,'lost');assert.equal(s.state.player.hp,0);s.reset();assert.equal(s.state.player.hp,5);assert.equal(s.state.cleared,0);assert.equal(s.state.parries,0);assert.equal(s.state.time,0);});
check('超时阈值分支（仅此项预置剩余时间）',()=>{const s=new Simulation();s.reset();s.state.remaining=.01;s.step(1/60);assert.equal(s.state.mode,'lost');assert(s.state.reason.includes('时限'));});
await writeFile(path.join(root,'artifacts/simulation-tests.json'),JSON.stringify({date:'2026-10-09',scope:'同一实际模拟；近距离机制检查设置双方位置，整轮 bot 无进度注入；仅超时分支预置剩余时间',checks:records,timingComparison:{fast:{mode:fast.mode,cleared:fast.cleared,parries:fast.parries,elapsed:fast.time,hp:fast.player.hp},delayed300ms:{mode:slow.mode,cleared:slow.cleared,parries:slow.parries,hp:slow.player.hp}}},null,2)+'\n');
