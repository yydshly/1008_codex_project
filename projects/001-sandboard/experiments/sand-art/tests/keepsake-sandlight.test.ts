import {expect,test} from 'vitest'
import {SandlightSand} from '../src/memories/keepsake-sandlight-sand'
import {KeepsakeStudy} from '../src/memories/keepsake-sandlight-material'
import {buildSandlightPlan} from '../src/memories/keepsake-sandlight-model'
import {SAMPLE_SHAPE,DEFAULT_SHAPE} from '../src/memories/keepsake-model'
import {saveKeepsake as saveOld,readKeepsake as readOld} from '../src/memories/keepsake-composition-storage'
import {saveKeepsake as saveNew,readKeepsake as readNew} from '../src/memories/keepsake-sandlight-storage'
import 'fake-indexeddb/auto'
const input={shape:{...SAMPLE_SHAPE},imageWidth:1536,imageHeight:1024}

test('宽掌只移走接触范围内的沙，边缘留下沙脊，离台前质量守恒',()=>{
  const sand=new SandlightSand(192,128)
  sand.density.fill(.7);const mass=sand.mass
  sand.collect({x:.5,y:.5},{x:.5,y:.51},.13,.8,1/60,.18,true,.24)
  expect(sand.density[64*192+96]).toBeLessThan(.3)
  expect(sand.density[40*192+96]).toBeCloseTo(.7)
  expect(Math.max(...sand.density)).toBeGreaterThan(.7)
  expect(sand.mass+sand.inAirMass+sand.removedMass).toBeCloseTo(mass,3)
  expect(sand.removedMass).toBe(0)
  for(let i=0;i<50;i++)sand.step(1/60,[])
  expect(sand.mass+sand.removedMass).toBeCloseTo(mass,3)
})

test('成品亮面来自收沙，结尾保持同一沙层，不补图或填沙',()=>{
  const study=new KeepsakeStudy(buildSandlightPlan(input),192,128)
  while(study.tick<study.plan.starts[4])study.step()
  const before=study.sand.density[67*192+96]
  while(study.tick<2340)study.step()
  expect(study.sand.density[67*192+96]).toBeLessThan(before*.2)
  expect(study.sand.removedMass).toBeGreaterThan(0)
  expect(study.sand.mass+study.sand.removedMass).toBeCloseTo(study.sand.suppliedMass,2)
  const final=study.sand.density.slice(),supplied=study.sand.suppliedMass
  while(study.tick<2700)study.step()
  expect(study.sand.density).toEqual(final);expect(study.sand.suppliedMass).toBe(supplied)
  expect(study.sand.pending).toBe(false)
},60000)

test('可选杯把与托碟仍受照片构图控制',()=>{
  const plain=buildSandlightPlan(input),full=buildSandlightPlan({...input,shape:{...DEFAULT_SHAPE}})
  expect(plain.actions.some(a=>a.name==='勾出透光杯把'||a.name==='推开托碟亮弧')).toBe(false)
  expect(full.actions.some(a=>a.name==='勾出透光杯把')).toBe(true)
  expect(full.actions.some(a=>a.name==='推开托碟亮弧')).toBe(true)
  expect(full.starts.at(-1)).toBeLessThan(2340)
})

test('v35 与 v34 草稿隔离',async()=>{
  const old={version:1 as const,title:'旧作品',recipient:'家人',story:'我们的故事。',dedication:'留住回忆。',mood:'warm' as const,sourceKind:'sample' as const,photo:'data:image/png;base64,AAAA',...input}
  await saveOld(old);await saveNew({...old,title:'灯台作品'})
  expect(await readOld()).toEqual(old);expect((await readNew())?.title).toBe('灯台作品')
})
