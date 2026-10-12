import { expect,test } from 'vitest'
import { readFileSync } from 'node:fs'
import { StructuredPainting,decodePortraitPlan,type PortraitPlan } from '../src/memories/structured-painting'
import { decodePhotoProject,encodePhotoProject } from '../src/memories/export'
import { settingsFor } from '../src/memories/model'
import { restorePerformance } from '../src/memories/performance'

function plan(finish?:'settle'):PortraitPlan{return {width:192,height:128,guides:[{id:'main',kind:'subject',bounds:[.1,.1,.9,.9]}],strokes:[{phase:0,region:'context',tool:'pour',path:[{x:.4,y:.4},{x:.6,y:.4}],sigma:1,budget:8,ticks:12,...(finish?{finish}:{})}],totalTicks:82,phaseStarts:[0,22,22,22,22,22],initialError:.5,finalError:.1}}
test('新细流落定时保持笔迹，旧动作文件仍会执行原来的揉沙',()=>{
  const current=new StructuredPainting(decodePortraitPlan(JSON.stringify(plan('settle'))))
  const legacy=new StructuredPainting(decodePortraitPlan(JSON.stringify(plan())))
  for(let n=0;n<18;n++){current.step();legacy.step()}
  expect(current.material.read()).toEqual(legacy.material.read())
  const before=current.material.density.slice()
  for(let n=0;n<4;n++){current.step();legacy.step()}
  expect(current.material.density).toEqual(before)
  expect(legacy.material.density).not.toEqual(before)
  const final=current.read();const to=current.rewindTo(7);while(current.tick<to)current.step();while(current.tick<22)current.step()
  expect(current.read()).toEqual(final)
})
test('收沙对应指尖手法，非法落定规则在导入前拒绝',()=>{
  const p=plan();p.strokes[0].tool='collect'
  const painting=new StructuredPainting(decodePortraitPlan(JSON.stringify(p)));painting.step()
  expect(painting.hand?.pose).toBe('finger');expect(painting.handProgress).toBeCloseTo(1/12)
  expect(()=>decodePortraitPlan(JSON.stringify({...p,strokes:[{...p.strokes[0],finish:'blur'}]}))).toThrow()
})
test('完整细笔演出经工程导入仍逐值恢复，并与浏览器实际工程一致',()=>{
  const p=decodePortraitPlan(readFileSync('../../assets/material-realism-v17/natural-window-score.json','utf8'))
  const original=new StructuredPainting(p),stop=p.phaseStarts[4]+120
  while(original.tick<stop)original.step()
  const file=decodePhotoProject(encodePhotoProject({format:'sandboard-photo',version:1,title:'细笔',caption:'',sourceKind:'ai-sample',settings:settingsFor(),snapshot:original.material.read(),performance:{plan:p,tick:original.tick}}))
  const restored=restorePerformance(file.performance!,file.snapshot)
  while(original.step()){}while(restored.step()){}
  expect(restored.material.read()).toEqual(original.material.read());expect(restored.material.pending).toBe(false)
  const actualPath=process.env.SAND_TOUCH_PROJECT
  if(actualPath){const actual=decodePhotoProject(readFileSync(actualPath,'utf8'));expect(actual.performance?.tick).toBe(p.totalTicks);expect(actual.snapshot).toEqual(original.material.read())}
},30000)
