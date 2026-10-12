import { expect,test } from 'vitest'
import { readFileSync } from 'node:fs'
import { decodePortraitPlan,StructuredPainting,type PortraitPlan } from '../src/memories/structured-painting'
import { PhotoTiming } from '../src/memories/photo-timing'

test('雨窗分章节奏的累计时间连续，每个材料时间步都有观看时间',()=>{
  const plan=decodePortraitPlan(readFileSync(new URL('../../../assets/material-realism-v17/natural-window-score.json',import.meta.url),'utf8'))
  const timing=new PhotoTiming(plan)
  expect(timing.duration('guided')).toBeCloseTo(72.7,6)
  expect(timing.duration(10)).toBeCloseTo(63.043333333)
  let total=0
  for(let tick=0;tick<plan.totalTicks;tick++){
    const dt=timing.stepSeconds(tick,'guided');expect(dt).toBeGreaterThan(0);total+=dt
  }
  expect(total).toBeCloseTo(timing.duration('guided'),7)
  const face=plan.phaseStarts[2]
  expect(timing.stepSeconds(face,'guided')).toBeCloseTo(.8+1/120)
  expect(timing.stepSeconds(face+1,'guided')).toBeCloseTo(1/120)
  expect(timing.elapsed(-1,'guided')).toBe(0)
  expect(timing.elapsed(plan.totalTicks+100,'guided')).toBe(timing.duration('guided'))
})

test('不同帧间隔下分章回放不丢时间步，最后沙量与匀速原谱一致',()=>{
  const plan:PortraitPlan={width:32,height:24,guides:[{id:'main',kind:'subject',bounds:[.1,.1,.9,.9]}],
    strokes:[
      {phase:0,region:'context',tool:'pour',path:[{x:.4,y:.3},{x:.7,y:.6}],sigma:1,budget:10,ticks:40,finish:'settle'},
      {phase:2,region:'face',tool:'collect',path:[{x:.4,y:.3},{x:.6,y:.5}],sigma:2,budget:.2,ticks:20},
    ],phaseStarts:[0,50,50,80,80,80],totalTicks:140,initialError:.5,finalError:.1}
  const baseline=new StructuredPainting(plan);while(baseline.step()){}
  const timing=new PhotoTiming(plan)
  for(const interval of [1/60,1/30,.12]){
    const painting=new StructuredPainting(plan);let accumulated=0,steps=0,frames=0
    while(painting.tick<painting.totalTicks&&frames++<10000){
      accumulated+=interval;let perFrame=0
      while(painting.tick<painting.totalTicks&&perFrame++<24){
        const cost=timing.stepSeconds(painting.tick,'guided');if(accumulated+1e-9<cost)break
        painting.step();accumulated=Math.max(0,accumulated-cost);steps++
      }
    }
    expect(steps).toBe(plan.totalTicks)
    expect(painting.read()).toEqual(baseline.read())
  }
})
