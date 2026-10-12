import {expect,test} from 'vitest'
import {readFileSync,writeFileSync} from 'node:fs'
import {gestureEnvelope,gesturePoint} from '../src/memories/gesture-motion'
import {buildGesturePhoto,gestureLength} from '../src/memories/gesture-photo-plan'
import {decodePortraitPlan,StructuredPainting,type StructuredStroke} from '../src/memories/structured-painting'
import {StageMaterial} from '../src/stage/material'
import {mapPhotoProgress} from '../src/memories/photo-choreography'

test('弧长驱动、撒沙起停和收沙沿迹沙脊保持材料守恒',()=>{
  const s:StructuredStroke={phase:0,region:'face',tool:'pour',path:[{x:.2,y:.4},{x:.21,y:.4},{x:.7,y:.4}],sigma:2,budget:30,ticks:60,finish:'settle'}
  expect(gesturePoint(s,.5).x).toBeCloseTo(.45);expect(gesturePoint(s,1)).toEqual(s.path.at(-1))
  expect(gestureEnvelope(0,60)).toBeLessThan(gestureEnvelope(30,60)*.04)
  const sand=new StageMaterial(96,64);sand.density.fill(1)
  sand.collect({x:.3,y:.4},{x:.6,y:.4},.05,.25,1/60,.08)
  expect(sand.density.some(d=>d>1)).toBe(true)
  expect(sand.mass+sand.removedMass).toBeCloseTo(96*64,3)
  const old=new StageMaterial(96,64),explicit=new StageMaterial(96,64);old.density.fill(1);explicit.density.fill(1)
  old.collect({x:.3,y:.4},{x:.6,y:.4},.05,.25,1/60);explicit.collect({x:.3,y:.4},{x:.6,y:.4},.05,.25,1/60,0)
  expect(old.read()).toEqual(explicit.read())
})
test('新谱切换按章节进度对照，旧两谱仍逐步相同，回跳可确定续算',()=>{
  const old=decodePortraitPlan(readFileSync('../../assets/material-realism-v17/natural-window-score.json','utf8'))
  const plan=decodePortraitPlan(readFileSync('../../assets/no-hand-photo-v28/gesture-window-score.json','utf8'))
  expect(plan.motion).toBe('flow')
  expect(()=>decodePortraitPlan(JSON.stringify({...plan,motion:'unknown'}))).toThrow()
  for(let phase=0;phase<5;phase++){
    expect(mapPhotoProgress(old,plan,old.phaseStarts[phase])).toBe(plan.phaseStarts[phase])
    const middle=Math.round((old.phaseStarts[phase]+old.phaseStarts[phase+1])/2)
    expect(mapPhotoProgress(old,old,middle)).toBe(middle)
    expect(mapPhotoProgress(old,plan,middle)).toBeCloseTo((plan.phaseStarts[phase]+plan.phaseStarts[phase+1])/2,-1)
  }
  expect(mapPhotoProgress(plan,old,plan.totalTicks)).toBe(old.totalTicks)
  const painting=new StructuredPainting(plan);for(let t=0;t<850;t++)painting.step()
  const snapshot=painting.read(),target=painting.rewindTo(500)
  while(painting.tick<target)painting.step();while(painting.tick<850)painting.step()
  expect(painting.read()).toEqual(snapshot)
})
test.skipIf(!process.env.SAND_BUILD_GESTURE)('离线重新规划长笔并保存实际材料对比',async()=>{
  const directory=process.env.SAND_BUILD_GESTURE!
  const original=decodePortraitPlan(readFileSync('../../assets/material-realism-v17/natural-window-score.json','utf8'))
  const result=await buildGesturePhoto(original,(done,total)=>writeFileSync(directory+'/generation-progress.json',JSON.stringify({done,total})))
  writeFileSync(directory+'/gesture-window-score.json',JSON.stringify(result.plan))
  const w=result.snapshot.width,h=result.snapshot.height
  const roi=(field:Float32Array,bounds:number[])=>{let sum=0,count=0;for(let y=Math.ceil(bounds[1]*h);y<bounds[3]*h;y++)for(let x=Math.ceil(bounds[0]*w);x<bounds[2]*w;x++){const i=y*w+x;sum+=Math.abs(Math.exp(-field[i]*1.35)-Math.exp(-result.baseline.density[i]*1.35));count++}return sum/count}
  const edge=(density:Float32Array)=>{let sum=0;for(let y=100;y<250;y++)for(let x=420;x<552;x++){const i=y*w+x;sum+=Math.abs(Math.exp(-density[i]*1.35)-Math.exp(-density[i+1]*1.35))+Math.abs(Math.exp(-density[i]*1.35)-Math.exp(-density[i+w]*1.35))}return sum}
  const report={strokes:result.plan.strokes.length,totalTicks:result.plan.totalTicks,finalTargetFaceError:result.plan.finalError,
    meanPathPx:result.plan.strokes.reduce((sum,s)=>sum+gestureLength(s),0)/result.plan.strokes.length,
    minPathPx:Math.min(...result.plan.strokes.map(s=>gestureLength(s))),
    faceDifference:roi(result.snapshot.density,[.545,.19,.718,.486]),handsDifference:roi(result.snapshot.density,[.478,.512,.707,.813]),
    faceEdgeRatio:edge(result.snapshot.density)/edge(result.baseline.density),mass:result.snapshot.density.reduce((s,d)=>s+d,0),supplied:result.snapshot.suppliedMass,removed:result.snapshot.removedMass}
  writeFileSync(directory+'/material-validation.json',JSON.stringify(report,null,2))
  expect(report.faceDifference).toBeLessThan(.04);expect(report.handsDifference).toBeLessThan(.04)
  // 允许大灰面需要的笔数；缩短谱不能以缺失构图为代价。
  expect(report.strokes).toBeLessThan(1250);expect(report.meanPathPx).toBeGreaterThan(20)
  const painting=new StructuredPainting(decodePortraitPlan(JSON.stringify(result.plan)));while(painting.step()){}
  expect(painting.material.read()).toEqual(result.snapshot)
  expect(report.mass+report.removed).toBeCloseTo(report.supplied,1)
},240000)
