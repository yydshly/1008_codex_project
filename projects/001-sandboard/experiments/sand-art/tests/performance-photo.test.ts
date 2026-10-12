import {expect,test} from 'vitest'
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {performanceCurve} from '../src/memories/performance-curve'
import {decodePortraitPlan,StructuredPainting} from '../src/memories/structured-painting'
import {sculptPhotoTarget} from '../src/memories/sculpt-photo-target'
import {buildGesturePhoto,gestureLength} from '../src/memories/gesture-photo-plan'
import {PhotoTiming} from '../src/memories/photo-timing'
import {StageMaterial} from '../src/stage/material'
import {collectedGrainView} from '../src/memories/collected-grain-view'

test('收沙格点显示偏移固定随粒子移动，恢复后不闪动，不修改材料',()=>{
  const sand=new StageMaterial(96,64);sand.density.fill(1)
  sand.collect({x:.3,y:.4},{x:.6,y:.4},.05,.25,1/60,.12,true)
  const saved=sand.read(),grain=sand.airborne[0],view=collectedGrainView(grain,96,64)
  expect(sand.read()).toEqual(saved)
  expect(Math.abs(view.x-grain.x)).toBeLessThanOrEqual(.7/96)
  expect(Math.abs(view.y-grain.y)).toBeLessThanOrEqual(.7/64)
  const dx=view.x-grain.x,dy=view.y-grain.y
  sand.step(1/60,[]);const next=sand.airborne[0],after=collectedGrainView(next,96,64)
  expect(after.x-next.x).toBeCloseTo(dx,12);expect(after.y-next.y).toBeCloseTo(dy,12)
  expect(after.seed).toBe(view.seed)
  sand.restore(saved);expect(collectedGrainView(sand.airborne[0],96,64)).toEqual(view)
})

test('相邻收沙显示样本不在整齐格线上',()=>{
  const views=Array.from({length:20},(_,i)=>collectedGrainView({x:(20+i)/96,y:20/64,z:.0004,vx:.1,vy:0,vz:.025,mass:1,collected:true},96,64))
  expect(new Set(views.map(v=>v.y)).size).toBe(20)
  expect(new Set(views.map(v=>v.seed)).size).toBe(20)
})

test('连续残差生成长曲线和渐变力度，路径不跳进相反影调',()=>{
  const w=96,h=64,current=Float32Array.from({length:w*h},(_,i)=>.1*Math.floor(i/w)/h),target=Float32Array.from(current,(_,i)=>.2+(i%w)/w*.4)
  const curve=performanceCurve(target,current,48,32,1,w,h)
  expect(curve.path.length).toBeGreaterThan(30)
  const length=gestureLength({...curve,phase:4,region:'face',tool:'pour',sigma:1,budget:1,ticks:80},w,h)
  expect(length).toBeGreaterThan(30)
  expect(curve.pressure.length).toBe(curve.path.length)
  expect(curve.pressure.every(n=>n>=.12&&n<=1.8)).toBe(true)
  expect(Math.max(...curve.pressure)-Math.min(...curve.pressure)).toBeGreaterThan(.03)
  for(const p of curve.path)expect(target[Math.round(p.y*h)*w+Math.round(p.x*w)]).toBeGreaterThan(0)
})

test('新谱在完整节奏中为每次细部撒收留出动作时间，v29时长不变',()=>{
  const old=decodePortraitPlan(readFileSync('../../assets/no-hand-photo-v29/sculpt-window-score.json','utf8'))
  expect(new PhotoTiming(old).duration('guided')).toBeCloseTo(205.5788888888,5)
  const s={...old.strokes.find(s=>s.phase===4)!,sigma:1,ticks:80,path:[{x:.6,y:.3},{x:.64,y:.32}],pressure:[.4,1.2]}
  const plan={...old,motion:'performance' as const,strokes:[s],totalTicks:150,phaseStarts:[0,0,0,0,0,90]}
  expect(decodePortraitPlan(JSON.stringify(plan))).toEqual(plan)
  const timing=new PhotoTiming(plan)
  expect(timing.elapsed(80,'guided')-.8).toBeGreaterThan(.25)
  expect(timing.elapsed(80,'guided')-.8).toBeLessThan(.7)
  expect(()=>decodePortraitPlan(JSON.stringify({...plan,strokes:[{...s,pressure:[.2]}]}))).toThrow()
  expect(()=>decodePortraitPlan(JSON.stringify({...plan,strokes:[{...s,pressure:[.2,NaN]}]}))).toThrow()
  expect(()=>decodePortraitPlan(JSON.stringify({...plan,motion:'sculpt'}))).toThrow()
})

test('已存新谱的细部逐筆可见，定位后继续不改变沙量结果，原照版未覆盖',()=>{
  const oldText=readFileSync('../../assets/no-hand-photo-v29/sculpt-window-score.json','utf8')
  expect(createHash('sha256').update(oldText).digest('hex')).toBe('9eff1f0b2b4f3ed10ef568601bf9f59d4875173cad74f30a36e98cc3a79abe0f')
  const plan=decodePortraitPlan(readFileSync('../../assets/no-hand-photo-v30/performance-window-score.json','utf8'))
  const timing=new PhotoTiming(plan);let start=0
  for(const s of plan.strokes){
    if(s.phase===4&&s.sigma<2)expect(timing.elapsed(start+s.ticks,'guided')-timing.elapsed(start,'guided')).toBeGreaterThanOrEqual(.24-1e-9)
    start+=s.ticks+10
  }
  expect(timing.duration('guided')).toBeGreaterThan(400);expect(timing.duration('guided')).toBeLessThan(500)
  const painting=new StructuredPainting(plan),to=plan.phaseStarts[2]+50
  while(painting.tick<to)painting.step()
  const before=painting.read(),resume=painting.rewindTo(to-30)
  while(painting.tick<resume)painting.step();while(painting.tick<to)painting.step()
  expect(painting.read()).toEqual(before)
},30000)

test.skipIf(!process.env.SAND_BUILD_PERFORMANCE)('原照连续动作规划，完整材料回放与旧版清晰度对照',async()=>{
  const directory=process.env.SAND_BUILD_PERFORMANCE!
  mkdirSync(directory,{recursive:true})
  const source=readFileSync('node_modules/.cache/portrait-study/source-v29.rgba')
  const target=sculptPhotoTarget(new Uint8ClampedArray(source),768,512)
  const originalText=readFileSync('../../assets/material-realism-v17/natural-window-score.json','utf8')
  const oldText=readFileSync('../../assets/no-hand-photo-v29/sculpt-window-score.json','utf8')
  const result=await buildGesturePhoto(decodePortraitPlan(originalText),(done,total)=>writeFileSync(directory+'/generation-progress.json',JSON.stringify({done,total})),{target,motion:'performance'})
  writeFileSync(directory+'/performance-window-score.json',JSON.stringify(result.plan))
  const error=(density:Float32Array,r:number[])=>{let sum=0,count=0;for(let y=Math.ceil(r[1]*512);y<r[3]*512;y++)for(let x=Math.ceil(r[0]*768);x<r[2]*768;x++){const i=y*768+x;sum+=Math.abs(Math.exp(-density[i]*1.35)-Math.exp(-target[i]*1.35));count++}return sum/count}
  const old=new StructuredPainting(decodePortraitPlan(oldText));while(old.step()){}
  const replay=new StructuredPainting(decodePortraitPlan(JSON.stringify(result.plan)));let collectedFrames=0,pourFrames=0
  while(replay.step()){
    if(replay.material.airborne.some(g=>g.collected))collectedFrames++
    if(replay.material.airborne.some(g=>!g.collected))pourFrames++
  }
  const paths=result.plan.strokes.map(s=>gestureLength(s)),fine=result.plan.strokes.filter(s=>s.phase===4&&s.sigma<2)
  const report={sourceRGBA:createHash('sha256').update(source).digest('hex'),preservedV29Score:createHash('sha256').update(oldText).digest('hex'),
    strokes:result.plan.strokes.length,tools:{pour:result.plan.strokes.filter(s=>s.tool==='pour').length,collect:result.plan.strokes.filter(s=>s.tool==='collect').length},
    totalTicks:result.plan.totalTicks,phaseStarts:result.plan.phaseStarts,guidedSeconds:new PhotoTiming(result.plan).duration('guided'),
    meanPathPx:paths.reduce((n,d)=>n+d,0)/paths.length,minPathPx:Math.min(...paths),fineStrokes:fine.length,fineMeanPathPx:fine.reduce((n,s)=>n+gestureLength(s),0)/fine.length,
    previousFineMeanPathPx:old.plan.strokes.filter(s=>s.phase===4&&s.sigma<2).reduce((n,s)=>n+gestureLength(s),0)/old.plan.strokes.filter(s=>s.phase===4&&s.sigma<2).length,
    faceTargetError:error(replay.material.density,[.545,.19,.718,.486]),previousFaceTargetError:error(old.material.density,[.545,.19,.718,.486]),
    handsTargetError:error(replay.material.density,[.478,.512,.707,.813]),previousHandsTargetError:error(old.material.density,[.478,.512,.707,.813]),
    mass:replay.material.mass,supplied:replay.material.suppliedMass,removed:replay.material.removedMass,collectedFrames,pourFrames,pending:replay.material.pending}
  writeFileSync(directory+'/material-validation.json',JSON.stringify(report,null,2))
  expect(replay.material.read()).toEqual(result.snapshot)
  expect(report.faceTargetError).toBeLessThan(report.previousFaceTargetError*1.12)
  expect(report.handsTargetError).toBeLessThan(report.previousHandsTargetError*1.12)
  expect(report.fineMeanPathPx).toBeGreaterThan(report.previousFineMeanPathPx*1.3)
  expect(report.mass+report.removed).toBeCloseTo(report.supplied,1)
  expect(report.pending).toBe(false);expect(collectedFrames).toBeGreaterThan(100);expect(pourFrames).toBeGreaterThan(100)
},300000)
