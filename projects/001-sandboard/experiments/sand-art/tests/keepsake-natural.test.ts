import {expect,test} from 'vitest'
import {buildNaturalPlan,naturalProgress} from '../src/memories/keepsake-natural-model'
import {NaturalGather,KeepsakeStudy} from '../src/memories/keepsake-natural-material'
import {NaturalSand} from '../src/memories/keepsake-natural-sand'
import {StageMaterial} from '../src/stage/material'
import {DEFAULT_SHAPE,SAMPLE_SHAPE,FILM_TICKS} from '../src/memories/keepsake-model'
import {saveKeepsake as saveOld,readKeepsake as readOld} from '../src/memories/keepsake-storage'
import {saveKeepsake as saveNew,readKeepsake as readNew} from '../src/memories/keepsake-natural-storage'
import 'fake-indexeddb/auto'
const input={shape:{...SAMPLE_SHAPE},imageWidth:1536,imageHeight:1024}

test('自然速度始终沿笔画前进，起落与重播不改变轮廓规划',()=>{
  for(let phase=0;phase<9;phase++){
    expect(naturalProgress(0,phase)).toBe(0);expect(naturalProgress(1,phase)).toBe(1)
    let last=0
    for(let i=1;i<=1000;i++){const p=naturalProgress(i/1000,phase);expect(p).toBeGreaterThanOrEqual(last);expect(p).toBeLessThanOrEqual(1);last=p}
  }
  expect(buildNaturalPlan(input)).toEqual(buildNaturalPlan(input))
  expect(buildNaturalPlan(input).actions).toHaveLength(6)
  expect(buildNaturalPlan({...input,shape:{...DEFAULT_SHAPE}}).actions).toHaveLength(9)
})

test('新落粒仍由空中飞行形成，停撒后有余粒落台，密度比宽软核更清晰',()=>{
  const next=new NaturalSand(192,128,42,8500),old=new StageMaterial(192,128,42,8500)
  const contact={tool:'pour' as const,from:{x:.49,y:.5},to:{x:.5,y:.5},radius:.05,strength:.65,spread:.4,ballistic:true,continuousEmission:true,emissionHeight:.07,velocityInheritance:.035}
  next.step(1/60,[contact]);old.step(1/60,[contact]);expect(next.mass).toBe(0);expect(next.inAirMass).toBeGreaterThan(0)
  for(let i=0;i<35;i++){next.step(1/60,[]);old.step(1/60,[])}
  expect(next.pending).toBe(false);expect(next.mass+next.removedMass).toBeCloseTo(next.suppliedMass,4)
  const edgeEnergy=(d:Float32Array)=>{let n=0;for(let y=1;y<127;y++)for(let x=1;x<191;x++){const i=y*192+x;n+=Math.abs(d[i]-d[i+1])+Math.abs(d[i]-d[i+192])}return n}
  expect(edgeEnergy(next.density)).toBeGreaterThan(edgeEnergy(old.density)*1.3)
})

test('台面推拢移动沙的重心，不删除质量，接触后仍有细沙残留',()=>{
  const sand=new NaturalSand(192,128),gather=new NaturalGather(sand)
  for(let y=48;y<78;y++)for(let x=62;x<94;x++)sand.density[y*192+x]=1
  const mass=sand.mass,centroid=()=>sand.density.reduce((n,m,i)=>n+m*(i%192),0)/sand.mass,before=centroid()
  for(let i=0;i<25;i++)gather.push({x:.39+i*.002,y:.49},{x:.392+i*.002,y:.49},.08,1.1)
  expect(sand.mass).toBeCloseTo(mass,3);expect(sand.removedMass).toBe(0);expect(centroid()).toBeGreaterThan(before+1)
  expect(sand.density[63*192+75]).toBeGreaterThan(.006)
})

test('推拢与停驻不删沙，拾起时沙量先在空中，随后计入收走量',()=>{
  const plan=buildNaturalPlan(input),study=new KeepsakeStudy(plan,192,128),i=2,a=plan.actions[i]
  while(study.tick<plan.starts[i])study.step()
  const removed=study.sand.removedMass,start=plan.starts[i],active=a.seconds-1.25
  while(study.tick<start+Math.round((active+.35)*60))study.step()
  expect(study.state).toBe('holding');expect(study.sand.removedMass).toBe(removed)
  while(study.tick<start+Math.round((active+.68)*60))study.step()
  expect(study.state).toBe('lifting');expect(study.sand.airborne.some(p=>p.collected)).toBe(true)
  while(study.tick<plan.starts[i+1])study.step()
  expect(study.sand.removedMass).toBeGreaterThan(removed)
  expect(study.sand.mass+study.sand.inAirMass+study.sand.removedMass).toBeCloseTo(study.sand.suppliedMass,2)
})

test('整部演出可重播且守恒，结尾不贴图或补沙，粒子落定',()=>{
  const plan=buildNaturalPlan(input),study=new KeepsakeStudy(plan,192,128)
  while(study.tick<plan.outro)study.step()
  const density=study.sand.density.slice(),supplied=study.sand.suppliedMass
  while(study.tick<FILM_TICKS)study.step()
  expect(study.sand.density).toEqual(density);expect(study.sand.suppliedMass).toBe(supplied);expect(study.sand.pending).toBe(false)
  expect(study.sand.mass+study.sand.removedMass).toBeCloseTo(supplied,2)
  const final=study.sand.read();study.reset();while(study.tick<FILM_TICKS)study.step();expect(study.sand.read()).toEqual(final)
})

test('新版本保存独立草稿，不覆盖保留版的照片、故事或构图',async()=>{
  const old={version:1 as const,title:'旧杯子',recipient:'妈妈',story:'我们的回忆。',dedication:'好好喝茶。',
    mood:'warm' as const,sourceKind:'sample' as const,photo:'data:image/png;base64,AAAA',...input}
  await saveOld(old);await saveNew({...old,title:'新杯子',story:'新的故事。'})
  expect(await readOld()).toEqual(old)
  expect((await readNew())?.title).toBe('新杯子')
  expect((await readNew())?.story).toBe('新的故事。')
})
