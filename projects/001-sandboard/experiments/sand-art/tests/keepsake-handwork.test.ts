import {expect,test} from 'vitest'
import {HandworkSand} from '../src/memories/keepsake-handwork-sand'
import {KeepsakeStudy,HandworkGather} from '../src/memories/keepsake-handwork-material'
import {buildHandworkPlan,type HandworkPlan} from '../src/memories/keepsake-handwork-model'
import {SAMPLE_SHAPE,DEFAULT_SHAPE} from '../src/memories/keepsake-model'
import {saveKeepsake as saveOld,readKeepsake as readOld} from '../src/memories/keepsake-sandlight-storage'
import {saveKeepsake as saveNew,readKeepsake as readNew} from '../src/memories/keepsake-handwork-storage'
import 'fake-indexeddb/auto'
const input={shape:{...SAMPLE_SHAPE},imageWidth:1536,imageHeight:1024}

test('推拢只移动已有沙量，在前缘聚堆，接触外保持原沙层',()=>{
  const sand=new HandworkSand(192,128),gather=new HandworkGather(sand)
  sand.density.fill(.7);const mass=sand.mass
  gather.push({x:.5,y:.50},{x:.5,y:.505},.10,.85,.48)
  expect(sand.density[64*192+96]).toBeLessThan(.3)
  expect(sand.density[30*192+96]).toBeCloseTo(.7)
  expect(Math.max(...sand.density)).toBeGreaterThan(1)
  expect(sand.mass).toBeCloseTo(mass,3)
  expect(sand.removedMass).toBe(0);expect(sand.inAirMass).toBe(0)
})

test('推拢与停驻阶段不删沙，抬起阶段才从已有沙堆拾起',()=>{
  const plan:HandworkPlan={actions:[{name:'一笔',note:'材料验证',tool:'gather',seconds:3,path:[{x:.5,y:.44},{x:.5,y:.60}],radius:.08,strength:.75,pickup:.8,carveAspect:.48}],starts:[0,180],ticks:2700,intro:0,outro:2340}
  const study=new KeepsakeStudy(plan,192,128)
  study.sand.density.fill(.4);const mass=study.sand.mass
  while(study.tick<140)study.step()
  expect(study.state).toBe('holding')
  expect(study.sand.mass).toBeCloseTo(mass,3)
  expect(study.sand.inAirMass).toBe(0);expect(study.sand.removedMass).toBe(0)
  while(study.tick<155)study.step()
  expect(study.state).toBe('lifting');expect(study.sand.inAirMass).toBeGreaterThan(0)
  expect(study.sand.mass+study.sand.inAirMass+study.sand.removedMass).toBeCloseTo(mass,3)
  while(study.tick<250)study.step()
  expect(study.sand.pending).toBe(false);expect(study.sand.removedMass).toBeGreaterThan(0)
  expect(study.sand.mass+study.sand.removedMass).toBeCloseTo(mass,3)
})

test('拾沙只收带推拢标签的沙，未触及的底沙保持，标签随松落转移',()=>{
  const sand=new HandworkSand(192,128),gather=new HandworkGather(sand)
  sand.density.fill(.5);const mass=sand.mass
  gather.push({x:.5,y:.5},{x:.5,y:.505},.08,.8)
  gather.settle({x:.5,y:.5},.1,0)
  const untouched=sand.density[53*192+96]
  sand.pickupTagged(gather.mobile,{x:.5,y:.5},.16,.9,1/60)
  expect(sand.density[53*192+96]).toBe(untouched)
  expect(sand.inAirMass).toBeGreaterThan(0)
  expect(sand.mass+sand.inAirMass+sand.removedMass).toBeCloseTo(mass,3)
  expect(gather.mobile.every((m,i)=>m<=sand.density[i]+1e-5)).toBe(true)
})

test('完整动作在同一沙层成画，结尾不换图、不补沙，质量守恒',()=>{
  const study=new KeepsakeStudy(buildHandworkPlan(input),192,128)
  while(study.tick<2340)study.step()
  expect(study.sand.removedMass).toBeGreaterThan(0)
  expect(study.sand.mass+study.sand.removedMass).toBeCloseTo(study.sand.suppliedMass,2)
  const final=study.sand.density.slice(),supplied=study.sand.suppliedMass
  while(study.tick<2700)study.step()
  expect(study.sand.density).toEqual(final);expect(study.sand.suppliedMass).toBe(supplied)
  expect(study.sand.pending).toBe(false)
  study.reset()
  while(study.tick<2340)study.step()
  expect(study.sand.density).toEqual(final)
},60000)

test('杯把与托碟仍受照片构图控制',()=>{
  const plain=buildHandworkPlan(input),full=buildHandworkPlan({...input,shape:{...DEFAULT_SHAPE}})
  expect(plain.actions.some(a=>a.name==='勾出透光杯把'||a.name==='推开托碟亮弧')).toBe(false)
  expect(full.actions.some(a=>a.name==='勾出透光杯把')).toBe(true)
  expect(full.actions.some(a=>a.name==='推开托碟亮弧')).toBe(true)
  expect(full.starts.at(-1)).toBeLessThan(2340)
})

test('v36 与 v35 草稿隔离',async()=>{
  const old={version:1 as const,title:'旧作品',recipient:'家人',story:'我们的故事。',dedication:'留住回忆。',mood:'warm' as const,sourceKind:'sample' as const,photo:'data:image/png;base64,AAAA',...input}
  await saveOld(old);await saveNew({...old,title:'局部推拢作品'})
  expect(await readOld()).toEqual(old);expect((await readNew())?.title).toBe('局部推拢作品')
})
