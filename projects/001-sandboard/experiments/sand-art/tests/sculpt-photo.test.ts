import {expect,test} from 'vitest'
import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {StageMaterial} from '../src/stage/material'
import {decodePortraitPlan,StructuredPainting} from '../src/memories/structured-painting'
import {sculptPhotoTarget} from '../src/memories/sculpt-photo-target'
import {buildGesturePhoto,gestureLength} from '../src/memories/gesture-photo-plan'
import {photoActionWindow} from '../src/memories/photo-actions'
import {PhotoTiming} from '../src/memories/photo-timing'

test('收沙先移动已有沙量，抬离后才计台外；恢复检查点后得到相同轨迹',()=>{
  const sand=new StageMaterial(96,64);sand.density.fill(1)
  sand.collect({x:.3,y:.4},{x:.6,y:.4},.05,.25,1/60,.12,true)
  expect(sand.airborne.length).toBeGreaterThan(0)
  expect(sand.airborne.every(g=>g.collected)).toBe(true)
  expect(sand.removedMass).toBe(0)
  expect(sand.inAirMass).toBeGreaterThan(0)
  expect(sand.mass+sand.inAirMass).toBeCloseTo(96*64,3)
  const saved=sand.read(),copy=new StageMaterial(96,64);copy.restore(saved)
  const before=saved.particles[0]
  sand.step(1/60,[]);copy.step(1/60,[])
  expect(sand.airborne[0].x).toBeGreaterThan(before.x)
  expect(sand.airborne[0].z).toBeGreaterThan(before.z)
  expect(sand.read()).toEqual(copy.read())
  for(let t=0;t<10;t++){
    sand.step(1/60,[])
    expect(sand.airborne.every(g=>g.z<.003)).toBe(true)
  }
  expect(sand.pending).toBe(false)
  expect(sand.mass).toBeCloseTo(saved.density.reduce((n,d)=>n+d,0),3)
  expect(sand.mass+sand.removedMass).toBeCloseTo(96*64,3)
  expect(()=>copy.restore({...saved,particles:[{...before,collected:'yes'} as never]})).toThrow()
})

test('收沙粒子池满仍守恒，撒沙不会混入收走的粒子',()=>{
  const sand=new StageMaterial(160,120);sand.density.fill(1)
  sand.collect({x:.1,y:.5},{x:.9,y:.5},.4,3,.1,.12,true)
  expect(sand.airborne.length).toBe(16384)
  const carried=sand.inAirMass
  sand.step(1/60,[{tool:'pour',from:{x:.4,y:.5},to:{x:.5,y:.5},radius:.01,strength:1}])
  expect(sand.inAirMass).toBeCloseTo(carried,3)
  for(let t=0;t<60;t++)sand.step(1/60,[])
  expect(sand.pending).toBe(false)
  expect(sand.mass+sand.removedMass).toBeCloseTo(160*120+sand.suppliedMass,2)
})

test('新谱允许单笔慢看，回跳到带沙的时间步可确定续算，旧版章速保持',()=>{
  const plan=decodePortraitPlan(readFileSync('../../assets/no-hand-photo-v29/sculpt-window-score.json','utf8'))
  const timing=new PhotoTiming(plan),window=photoActionWindow(plan,'collect')!
  expect(plan.motion).toBe('sculpt');expect(window.end-window.start).toBeGreaterThan(40)
  expect(timing.elapsed(window.end,.25)-timing.elapsed(window.start,.25)).toBeCloseTo((window.end-window.start)/15)
  expect(timing.duration('guided')).toBeLessThan(250)
  const painting=new StructuredPainting(plan)
  while(painting.tick<window.start+20)painting.step()
  expect(painting.material.airborne.some(g=>g.collected)).toBe(true)
  const before=painting.read();const target=painting.rewindTo(window.start+10)
  while(painting.tick<target)painting.step();while(painting.tick<window.start+20)painting.step()
  expect(painting.read()).toEqual(before)
  const old=decodePortraitPlan(readFileSync('../../assets/no-hand-photo-v28/gesture-window-score.json','utf8'))
  expect(new PhotoTiming(old).duration('guided')).toBeCloseTo(155.1,6)
},30000)

test.skipIf(!process.env.SAND_BUILD_SCULPT)('原照规划与实际材料完整回放，保留原动作谱文件',async()=>{
  const directory=process.env.SAND_BUILD_SCULPT!
  const source=readFileSync('node_modules/.cache/portrait-study/source-v29.rgba')
  const target=sculptPhotoTarget(new Uint8ClampedArray(source),768,512)
  const originalText=readFileSync('../../assets/material-realism-v17/natural-window-score.json','utf8')
  const result=await buildGesturePhoto(decodePortraitPlan(originalText),(done,total)=>writeFileSync(directory+'/generation-progress.json',JSON.stringify({done,total})),{target,motion:'sculpt'})
  writeFileSync(directory+'/sculpt-window-score.json',JSON.stringify(result.plan))
  const error=(density:Float32Array,r:number[])=>{let sum=0,count=0;for(let y=Math.ceil(r[1]*512);y<r[3]*512;y++)for(let x=Math.ceil(r[0]*768);x<r[2]*768;x++){const i=y*768+x;sum+=Math.abs(Math.exp(-density[i]*1.35)-Math.exp(-target[i]*1.35));count++}return sum/count}
  const previous=new StructuredPainting(decodePortraitPlan(readFileSync('../../assets/no-hand-photo-v28/gesture-window-score.json','utf8')));while(previous.step()){}
  const replay=new StructuredPainting(decodePortraitPlan(JSON.stringify(result.plan)));let collectedFrames=0,pourFrames=0
  while(replay.step()){
    if(replay.material.airborne.some(g=>g.collected))collectedFrames++
    if(replay.material.airborne.some(g=>!g.collected))pourFrames++
  }
  const report={sourceRGBA: createHash('sha256').update(source).digest('hex'),originalScore:createHash('sha256').update(originalText).digest('hex'),
    strokes:result.plan.strokes.length,totalTicks:result.plan.totalTicks,phaseStarts:result.plan.phaseStarts,
    meanPathPx:result.plan.strokes.reduce((n,s)=>n+gestureLength(s),0)/result.plan.strokes.length,minPathPx:Math.min(...result.plan.strokes.map(s=>gestureLength(s))),
    faceTargetError:error(result.snapshot.density,[.545,.19,.718,.486]),previousFaceTargetError:error(previous.material.density,[.545,.19,.718,.486]),
    handsTargetError:error(result.snapshot.density,[.478,.512,.707,.813]),previousHandsTargetError:error(previous.material.density,[.478,.512,.707,.813]),
    mass:replay.material.mass,supplied:replay.material.suppliedMass,removed:replay.material.removedMass,collectedFrames,pourFrames,pending:replay.material.pending}
  writeFileSync(directory+'/material-validation.json',JSON.stringify(report,null,2))
  expect(replay.material.read()).toEqual(result.snapshot)
  expect(report.faceTargetError).toBeLessThan(report.previousFaceTargetError*.8)
  expect(report.handsTargetError).toBeLessThan(report.previousHandsTargetError*.8)
  expect(report.mass+report.removed).toBeCloseTo(report.supplied,1)
  expect(report.pending).toBe(false);expect(collectedFrames).toBeGreaterThan(100);expect(pourFrames).toBeGreaterThan(100)
},300000)
