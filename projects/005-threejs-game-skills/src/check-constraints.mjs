// 本项目原创实验；对照复制的上游工具验证约束边界，不调用浏览器或付费服务。
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { summarize, applyTestHooks } from './tools/inspect-threejs-canvas.mjs';

const root=path.resolve(fileURLToPath(new URL('.',import.meta.url)),'..');
const fixture=path.join(root,'.cache/constraint-fixture');
await mkdir(fixture,{recursive:true});
await copyFile(path.join(root,'assets/ridge-drift.jpg'),path.join(fixture,'capture.jpg'));
const save=async(name,value)=>writeFile(path.join(fixture,name),JSON.stringify(value,null,2)+'\n');
const runId='research-005';
const report={runId,mode:'desktop',state:'active-play',requestedState:'active-play',appliedState:'active-play',screenshotPath:'capture.jpg',consoleErrors:[],pageErrors:[],result:{ok:true}};
const manifest={version:1,runId,captures:[{mode:'desktop',state:'active-play',report:'capture.json'}]};
await save('manifest.json',manifest);await save('capture.json',report);
const python=process.env.THREEJS_RESEARCH_PYTHON??'python';
function check(){const result=spawnSync(python,[path.join(root,'src/tools/check_evidence.py'),fixture,'--manifest','manifest.json'],{encoding:'utf8'});if(result.error)throw result.error;return result;}
const cases=[];
let result=check();assert.equal(result.status,0,result.stderr+result.stdout);
cases.push({id:'valid',name:'清单一致',result:'PASS',tone:'pass',input:'合成检查报告与真实已有截图组成测试夹具；run ID、视口、状态与文件一致。',output:result.stdout.replaceAll(fixture,'<fixture>'),meaning:'脚本确认清单和记录一致。这份合成报告没有运行游戏，PASS 因此不能证明真实操作或质量。',verified:true});
await save('capture.json',{...report,runId:'old-run'});result=check();assert.notEqual(result.status,0);assert.match(result.stdout+result.stderr,/runId/);
cases.push({id:'stale',name:'旧 run ID',result:'REJECT',tone:'reject',input:'清单要求 research-005，报告仍标记 old-run。',output:(result.stdout+result.stderr).replaceAll(fixture,'<fixture>'),meaning:'机器会拒绝不属于声明批次的报告；它通过字段匹配检查，并不读取源码变化来判断真正的新旧。',verified:true});
await save('capture.json',report);await save('manifest.json',{...manifest,captures:[...manifest.captures,{mode:'mobile',state:'active-play',report:'missing-mobile.json'}]});result=check();assert.notEqual(result.status,0);assert.match(result.stdout+result.stderr,/missing-mobile/);
cases.push({id:'missing',name:'缺少手机报告',result:'REJECT',tone:'reject',input:'清单另外声明手机游玩状态，但对应报告没有生成。',output:(result.stdout+result.stderr).replaceAll(fixture,'<fixture>'),meaning:'声明的覆盖会被检查。清单本身由开发者编写，未声明的必要状态仍可能漏检。',verified:true});
const page={evaluate:async(fn,arg)=>{const oldWindow=globalThis.window;globalThis.window={__THREE_GAME_TEST_HOOKS__:{setState:()=>({state:'wrong-state'})}};try{return await fn(arg);}finally{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;}}};
let acknowledgementError;try{await applyTestHooks(page,{state:'active-play'});}catch(error){acknowledgementError=error.message;}
assert.match(acknowledgementError,/acknowledge/);
cases.push({id:'ack',name:'状态确认错误',result:'REJECT',tone:'reject',input:'请求 active-play，模拟钩子返回 wrong-state。这里只验证接口契约，没有打开浏览器。',output:acknowledgementError,meaning:'错误确认会被拒绝；正确字符串依然不能证明该场景忠实实现。',verified:true});
const summary=summarize({mode:'desktop',requestedState:'active-play',runId,result:{ok:true,renderBudget:{rows:[{metric:'calls',actual:500,limit:300,ok:false}]}},consoleErrorCount:0,pageErrorCount:0},'synthetic-report.json');
assert.match(summary,/^PASS /);assert.match(summary,/over-budget=calls:500>300/);
cases.push({id:'budget',name:'超预算仍 PASS',result:'PASS + WARNING',tone:'warn',input:'合成报告中画布正常、没有错误，但绘制次数 500 超过建议 300。',output:summary,meaning:'PASS 条件不包含资源预算；超预算是提示。开发者仍需解释取舍并测试目标设备。',verified:true});
await writeFile(path.join(root,'src/constraint-cases.json'),JSON.stringify({date:'2026-10-09',kind:'上游真实工具 + 合成契约夹具；非真实 GPU 检查',cases},null,2)+'\n');
console.log(`约束实验完成：${cases.length} 个预期均与上游工具结果一致。`);
