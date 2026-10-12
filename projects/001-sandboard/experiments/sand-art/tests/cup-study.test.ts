import {expect,test} from 'vitest'
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {StageMaterial} from '../src/stage/material'
import {CupStudy,GroundGather} from '../src/memories/cup-material'
import {CUP_ACTIONS,CUP_TICKS,CUP_DT,CUP_STARTS,cupPoint} from '../src/memories/cup-score'

test('拖拢只在台面移动已有沙，前缘聚积后仍未收走',()=>{
  const sand=new StageMaterial(120,80),gather=new GroundGather(sand)
  for(let y=28;y<52;y++)for(let x=35;x<65;x++)sand.density[y*120+x]=1
  const mass=sand.mass,center=()=>sand.density.reduce((sum,v,i)=>sum+v*(i%120),0)/sand.mass
  const before=center()
  for(let n=0;n<18;n++)gather.push({x:(47+n*.65)/120,y:.5},{x:(47+(n+1)*.65)/120,y:.5},.09,1.6)
  expect(sand.mass).toBeCloseTo(mass,3)
  expect(sand.removedMass).toBe(0);expect(sand.inAirMass).toBe(0)
  expect(center()).toBeGreaterThan(before+4)
  expect(Math.max(...sand.density)).toBeGreaterThan(1.3)
})
test('台边封闭、小步迁移与非法输入不会丢沙',()=>{
  const sand=new StageMaterial(32,24),gather=new GroundGather(sand)
  sand.density[12*32+30]=10
  gather.push({x:.92,y:.5},{x:.99,y:.5},.1,2)
  expect(sand.mass).toBeCloseTo(10,5);expect(sand.removedMass).toBe(0)
  const before=sand.density.slice();gather.push({x:NaN,y:.5},{x:.5,y:.5},.1,2)
  expect(sand.density).toEqual(before)
})
test('过陡沙堆只向邻格松落，降低尖峰而不增删沙量',()=>{
  const sand=new StageMaterial(120,80),gather=new GroundGather(sand)
  sand.density[40*120+60]=80
  const before=sand.mass
  for(let i=0;i<20;i++)gather.settle({x:.5,y:.5},.05,i)
  expect(sand.mass).toBeCloseTo(before,4)
  expect(Math.max(...sand.density)).toBeLessThan(20)
  expect(sand.density[40*120+59]).toBeGreaterThan(1)
  expect(sand.removedMass).toBe(0)
})
test('九个语义动作共30秒，弧长采样两端正确，末尾只等待落定',()=>{
  expect(CUP_ACTIONS).toHaveLength(9);expect(CUP_STARTS.at(-1)).toBe(1590);expect(CUP_TICKS*CUP_DT).toBe(30)
  for(const action of CUP_ACTIONS){expect(cupPoint(action,0)).toEqual(action.path[0]);expect(cupPoint(action,1).x).toBeCloseTo(action.path.at(-1)!.x,12)}
  expect(CUP_ACTIONS.filter(a=>a.tool==='gather')).toHaveLength(3)
})
test('推拢和停驻不收走沙，只有末端拾起后才离台',()=>{
  const study=new CupStudy(192,128)
  while(study.tick<CUP_STARTS[2])study.step()
  const initialRemoved=study.sand.removedMass,initialSupplied=study.sand.suppliedMass
  while(study.tick<CUP_STARTS[2]+Math.round((CUP_ACTIONS[2].seconds-.75)*60))study.step()
  expect(study.state).toBe('holding')
  expect(study.sand.removedMass).toBe(initialRemoved);expect(study.sand.suppliedMass).toBe(initialSupplied)
  while(study.tick<CUP_STARTS[3])study.step()
  expect(study.sand.removedMass).toBeGreaterThan(initialRemoved+1)
  expect(study.sand.mass+study.sand.inAirMass+study.sand.removedMass).toBeCloseTo(study.sand.suppliedMass,2)
})
test('空台重播得到相同材料，最后无待落粒、不偷偷替换终态',()=>{
  const study=new CupStudy(192,128),run=()=>{while(study.tick<CUP_TICKS)study.step()}
  run();const first=study.sand.read()
  expect(study.sand.pending).toBe(false)
  expect(study.sand.mass+study.sand.removedMass).toBeCloseTo(study.sand.suppliedMass,2)
  study.reset();run();expect(study.sand.read()).toEqual(first)
  const density=study.sand.density.slice();study.step();expect(study.sand.density).toEqual(density)
})
test('v30与v29已保存材料结果保留',()=>{
  for(const [file,hash] of [
    ['../../assets/no-hand-photo-v30/actual-performance.png','453d4f02e90a48be428b509f43ecdb84703a09065582001d78740a6799eb87e6'],
    ['../../assets/no-hand-photo-v30/performance-window-score.json','d0f2d56738d9b756167925279dee743f079b26ce7fad651f3653b04bb1caa358'],
    ['../../assets/no-hand-photo-v29/sculpt-window-score.json','9eff1f0b2b4f3ed10ef568601bf9f59d4875173cad74f30a36e98cc3a79abe0f']]){
    const bytes=readFileSync(file);expect(bytes.length).toBeGreaterThan(10000)
    if(hash)expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash)
  }
})
test.skipIf(!process.env.SAND_BUILD_CUP)('生成全精度小样材料验证与原创动作谱',()=>{
  const directory=process.env.SAND_BUILD_CUP!,study=new CupStudy(),stages=[]
  mkdirSync(directory,{recursive:true})
  while(study.tick<CUP_TICKS){
    study.step()
    if(CUP_STARTS.includes(study.tick))stages.push({tick:study.tick,bed:study.sand.mass,air:study.sand.inAirMass,out:study.sand.removedMass,supplied:study.sand.suppliedMass})
  }
  const sand=study.sand,error=sand.mass+sand.inAirMass+sand.removedMass-sand.suppliedMass
  expect(Math.abs(error)).toBeLessThan(.08);expect(sand.pending).toBe(false)
  writeFileSync(`${directory}/material-validation.json`,JSON.stringify({version:31,width:sand.width,height:sand.height,ticks:CUP_TICKS,seconds:30,actions:9,stages,bed:sand.mass,out:sand.removedMass,supplied:sand.suppliedMass,conservationError:error,pending:sand.pending},null,2))
  writeFileSync(`${directory}/cup-action-score.json`,JSON.stringify({version:31,actions:CUP_ACTIONS,starts:CUP_STARTS,ticks:CUP_TICKS,dt:CUP_DT},null,2))
  writeFileSync(`${directory}/density.f32`,Buffer.from(sand.density.buffer))
})
