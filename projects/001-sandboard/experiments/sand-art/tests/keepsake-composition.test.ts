import {expect,test} from 'vitest'
import {buildCompositionPlan} from '../src/memories/keepsake-composition-model'
import {KeepsakeStudy,CompositionGather} from '../src/memories/keepsake-composition-material'
import {CompositionSand} from '../src/memories/keepsake-composition-sand'
import {SAMPLE_SHAPE,DEFAULT_SHAPE} from '../src/memories/keepsake-model'
import {saveKeepsake as saveOld,readKeepsake as readOld} from '../src/memories/keepsake-natural-storage'
import {saveKeepsake as saveNew,readKeepsake as readNew} from '../src/memories/keepsake-composition-storage'
import 'fake-indexeddb/auto'
const input={shape:{...SAMPLE_SHAPE},imageWidth:1536,imageHeight:1024}

test('构图尊重杯把与碟子选择，所有真实材料动作在结尾之前完成',()=>{
  const plain=buildCompositionPlan(input),full=buildCompositionPlan({...input,shape:{...DEFAULT_SHAPE}})
  expect(plain.actions.some(a=>a.name==='弯撒杯把'||a.name==='落沙成碟')).toBe(false)
  expect(full.actions.some(a=>a.name==='弯撒杯把')).toBe(true)
  expect(full.actions.some(a=>a.name==='落沙成碟')).toBe(true)
  expect(plain.starts.at(-1)).toBeLessThan(2340)
  expect(plain.actions.filter(a=>a.fan)).toHaveLength(1)
  expect(plain.actions.every(a=>a.path.length<200)).toBe(true)
})

test('宽撒先在空中，停撒后落地；有有限宽度与随机疏密，供料质量守恒',()=>{
  const sand=new CompositionSand(192,128,42,6000),p={x:.5,y:.5}
  sand.step(1/60,[{tool:'pour',from:p,to:p,radius:.3,strength:.5,spread:.03,angle:0,aspect:.18,fan:true,ballistic:true,continuousEmission:true,emissionHeight:.04}])
  expect(sand.mass).toBe(0);expect(sand.inAirMass).toBeGreaterThan(0)
  for(let i=0;i<30;i++)sand.step(1/60,[])
  expect(sand.pending).toBe(false)
  expect(sand.mass+ sand.removedMass).toBeCloseTo(sand.suppliedMass,4)
  const rows=new Set<number>(),columns=new Set<number>()
  sand.density.forEach((m,i)=>{if(m>.001){columns.add(i%192);rows.add(Math.floor(i/192))}})
  expect(columns.size).toBeGreaterThan(rows.size*3)
  expect(columns.size).toBeLessThan(90)
})

test('掌缘推拢只转移质量；拾沙先进入空中再离台',()=>{
  const sand=new CompositionSand(192,128),gather=new CompositionGather(sand)
  for(let y=48;y<76;y++)for(let x=70;x<96;x++)sand.density[y*192+x]=.6
  const mass=sand.mass
  gather.push({x:.44,y:.49},{x:.445,y:.49},.07,.4)
  expect(sand.mass).toBeCloseTo(mass,4);expect(sand.removedMass).toBe(0)
  sand.collect({x:.44,y:.49},{x:.445,y:.49},.07,.11,1/60,.025,true)
  expect(sand.airborne.some(g=>g.collected)).toBe(true);expect(sand.removedMass).toBe(0)
  for(let i=0;i<40;i++)sand.step(1/60,[])
  expect(sand.removedMass).toBeGreaterThan(0)
  expect(sand.mass+sand.removedMass).toBeCloseTo(mass,3)
})

test('高分辨率大面积拾沙也不能因粒子显示上限提前删沙',()=>{
  const sand=new CompositionSand(768,512)
  sand.density.fill(.6);const mass=sand.mass
  sand.collect({x:.4,y:.5},{x:.5,y:.5},.17,.3,1/60,.025,true)
  expect(sand.removedMass).toBe(0)
  expect(sand.airborne.length).toBeLessThanOrEqual(16384)
  expect(sand.inAirMass).toBeGreaterThan(0)
  expect(sand.mass+sand.inAirMass).toBeCloseTo(mass,2)
  for(let i=0;i<50;i++)sand.step(1/60,[])
  expect(sand.mass+sand.removedMass).toBeCloseTo(mass,2)
  expect(sand.pending).toBe(false)
})

test('成画由同一沙层累积，杯身中部有灰面；结尾不换图、不补沙',()=>{
  const study=new KeepsakeStudy(buildCompositionPlan(input),192,128)
  while(study.tick<2340)study.step()
  const region=(x0:number,y0:number,x1:number,y1:number)=>{let n=0,count=0;for(let y=Math.floor(y0*128);y<y1*128;y++)for(let x=Math.floor(x0*192);x<x1*192;x++){n+=study.sand.density[y*192+x];count++}return n/count}
  expect(region(.44,.42,.53,.60)).toBeGreaterThan(.05)
  expect(region(.05,.1,.18,.85)).toBeLessThan(.001)
  const final=study.sand.density.slice(),mass=study.sand.suppliedMass
  while(study.tick<2700)study.step()
  expect(study.sand.density).toEqual(final);expect(study.sand.suppliedMass).toBe(mass);expect(study.sand.pending).toBe(false)
  expect(study.sand.mass+study.sand.removedMass).toBeCloseTo(mass,2)
},60000)

test('新版与 v33 草稿存储隔离',async()=>{
  const old={version:1 as const,title:'旧作品',recipient:'家人',story:'我们的故事。',dedication:'留住回忆。',mood:'warm' as const,sourceKind:'sample' as const,photo:'data:image/png;base64,AAAA',...input}
  await saveOld(old);await saveNew({...old,title:'新的塑形作品'})
  expect(await readOld()).toEqual(old);expect((await readNew())?.title).toBe('新的塑形作品')
})
