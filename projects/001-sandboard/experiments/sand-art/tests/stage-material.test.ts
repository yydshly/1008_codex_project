import { expect, test } from 'vitest'
import { StageMaterial, type StageContact } from '../src/stage/material'

const DT = 1 / 60
function pour(overrides: Partial<StageContact> = {}): StageContact {
  return { tool: 'pour', from: { x: 0.5, y: 0.5 }, to: { x: 0.5, y: 0.5 }, radius: 0.06, strength: 1, spread: 0.4, height: 0.5, ...overrides }
}
function settle(material: StageMaterial) {
  for (let step = 0; step < 60 && material.pending; step++) material.step(DT, [])
  expect(material.pending).toBe(false)
}
function expectMass(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThan(Math.max(1e-5, expected * 4e-6))
}
function fullBed() {
  const material = new StageMaterial(128, 96)
  material.density.fill(0.7)
  return material
}
function cell(material: StageMaterial, x: number, y: number) {
  return material.density[Math.floor(y * material.height) * material.width + Math.floor(x * material.width)]
}

test('指缝发射先窄后散，抬手由飞行时间扩大落点，而非改变初始沙团',()=>{
  const low=new StageMaterial(384,256,17,9000),high=new StageMaterial(384,256,17,9000)
  const contact=pour({radius:.002,spread:.8,ballistic:true})
  low.step(DT,[{...contact,height:.1}]);high.step(DT,[{...contact,height:.65}])
  expect(low.airborne.map(p=>p.x)).toEqual(high.airborne.map(p=>p.x))
  const airWidth=(m:StageMaterial)=>Math.sqrt(m.airborne.reduce((sum,p)=>sum+(p.x-.5)**2,0)/m.airborne.length)
  const initial=airWidth(high)
  expect(initial).toBeLessThan(.004)
  for(let i=0;i<3;i++)high.step(DT,[])
  expect(airWidth(high)).toBeGreaterThan(initial*3)
  settle(low);settle(high)
  const width=(m:StageMaterial)=>Math.sqrt(m.density.reduce((sum,v,i)=>sum+v*((i%m.width+.5)/m.width-.5)**2,0)/m.mass)
  expect(width(high)).toBeGreaterThan(width(low)*1.5)
  expectMass(low.mass+low.removedMass,low.suppliedMass)
  expectMass(high.mass+high.removedMass,high.suppliedMass)
  expect(high.suppliedMass).toBeCloseTo(low.suppliedMass,10)
})

test('空灯箱没有暗沙，供料先悬空并在落定后完整成为厚度', () => {
  const material = new StageMaterial(128, 96)
  expect(material.mass).toBe(0)
  material.step(DT, [pour()])
  expect(material.mass).toBe(0)
  expect(material.pending).toBe(true)
  expect(material.airborne.every(grain => grain.z > 0)).toBe(true)
  expectMass(material.inAirMass, material.suppliedMass)
  settle(material)
  expectMass(material.mass + material.removedMass, material.suppliedMass)
  expect(cell(material, 0.5, 0.5)).toBeGreaterThan(0)
})

test('连续供料形成柔和沙层，散撒比细流覆盖更宽且保持疏密', () => {
  const stream = new StageMaterial(128, 96)
  const scatter = new StageMaterial(128, 96)
  for (let tick = 0; tick < 90; tick++) {
    stream.step(DT, [pour({ radius: 0.015, spread: 0.03 })])
    scatter.step(DT, [pour({ radius: 0.12, spread: 0.9 })])
  }
  settle(stream)
  settle(scatter)
  expectMass(stream.suppliedMass, scatter.suppliedMass)
  expect(scatter.density.filter(value => value > 0.02).length).toBeGreaterThan(stream.density.filter(value => value > 0.02).length * 5)
  const scatterValues = scatter.density.filter(value => value > 0.02)
  expect(Math.max(...scatterValues)).toBeGreaterThan(Math.min(...scatterValues) * 3)
  expectMass(stream.mass + stream.removedMass, stream.suppliedMass)
  expectMass(scatter.mass + scatter.removedMass, scatter.suppliedMass)
})

test('指尖负形擦出亮线，把移出的沙堆在两侧而非删除', () => {
  const material = fullBed()
  const initial = material.mass
  material.step(DT, [{ tool: 'finger', from: { x: 0.25, y: 0.5 }, to: { x: 0.75, y: 0.5 }, radius: 0.03, strength: 2 }])
  expect(cell(material, 0.5, 0.5)).toBeLessThan(0.03)
  expect(Math.max(...material.density)).toBeGreaterThan(1)
  expectMass(material.mass, initial)
  expect(material.removedMass).toBe(0)
})

test('圆形擦月得到空玻璃中心与周围沙边，未使用预制画遮罩', () => {
  const material = fullBed()
  const initial = material.mass
  for (let tick = 0; tick < 30; tick++) {
    material.step(DT, [{ tool: 'finger', from: { x: 0.5, y: 0.4 }, to: { x: 0.5, y: 0.4 }, radius: 0.08, strength: 1 }])
  }
  expect(cell(material, 0.5, 0.4)).toBeLessThan(1e-7)
  expect(Math.max(...material.density)).toBeGreaterThan(2)
  expectMass(material.mass, initial)
})

test('指迹端帽的沙沿前后分散，不把每段端点压成铁路式黑截面', () => {
  const material = new StageMaterial(256, 192)
  material.density.fill(0.7)
  const initial = material.mass
  material.step(DT, [{ tool: 'finger', from: { x: 0.25, y: 0.5 }, to: { x: 0.75, y: 0.5 }, radius: 0.03, strength: 2 }])
  const ridgeColumns: number[] = []
  for (let x = 50; x <= 205; x++) {
    let ridge = 0
    for (let y = 81; y <= 111; y++) ridge += Math.max(0, material.density[y * 256 + x] - 0.7)
    ridgeColumns.push(ridge)
  }
  const middle = ridgeColumns.slice(40, 116).reduce((total, amount) => total + amount, 0) / 76
  // 旧投影在端点集中出约 4.2 倍的黑截面；沙带应平滑收尾。
  expect(Math.max(...ridgeColumns)).toBeLessThan(middle * 1.5)
  expect(cell(material, 0.5, 0.5)).toBeLessThan(0.03)
  expectMass(material.mass, initial)
  expect(material.removedMass).toBe(0)
})

test('宽掌与侧掌产生不同形状的搬沙，二者都守恒', () => {
  const sweep = fullBed()
  const edge = fullBed()
  const initial = sweep.mass
  const common = { from: { x: 0.35, y: 0.5 }, to: { x: 0.6, y: 0.5 }, radius: 0.08, strength: 1.5 }
  sweep.step(DT, [{ tool: 'sweep', ...common }])
  edge.step(DT, [{ tool: 'edge', ...common }])
  expect(sweep.density).not.toEqual(edge.density)
  expect(sweep.density.filter(value => value < 0.3).length).toBeGreaterThan(edge.density.filter(value => value < 0.3).length)
  expectMass(sweep.mass, initial)
  expectMass(edge.mass, initial)
})

test('清场把沙推到台外，损失由 removedMass 明确记账', () => {
  const material = fullBed()
  const initial = material.mass
  material.step(DT, [{ tool: 'sweep', from: { x: 0.85, y: 0.5 }, to: { x: 1.05, y: 0.5 }, radius: 0.1, strength: 3 }])
  expect(material.removedMass).toBeGreaterThan(0)
  expect(material.mass).toBeLessThan(initial)
  expectMass(material.mass + material.removedMass, initial)
})

test('种子与固定步长决定结果，read/restore 包含尚未落下的沙', () => {
  const material = new StageMaterial(96, 72)
  for (let tick = 0; tick < 10; tick++) material.step(DT, [pour()])
  const snapshot = material.read()
  expect(snapshot.particles.length).toBeGreaterThan(0)
  const restored = new StageMaterial(96, 72)
  restored.restore(snapshot)
  for (let tick = 0; tick < 70; tick++) {
    const x = 0.3 + tick / 160
    const contacts = tick < 40 ? [pour({ from: { x: x - 0.01, y: 0.6 }, to: { x, y: 0.6 } })] : []
    material.step(DT, contacts)
    restored.step(DT, contacts)
  }
  expect(restored.read()).toEqual(material.read())
  material.clear()
  const fresh = new StageMaterial(96, 72)
  material.step(DT, [pour()])
  fresh.step(DT, [pour()])
  expect(material.read()).toEqual(fresh.read())
})

test('快照是独立副本，拒绝无效值，任意有效工具不产生负值', () => {
  const material = fullBed()
  const snapshot = material.read()
  snapshot.density[0] = 10
  expect(material.density[0]).toBeCloseTo(0.7)
  snapshot.density[0] = Number.NaN
  expect(() => material.restore(snapshot)).toThrow('快照格式')
  material.step(Number.NaN, [pour()])
  material.step(DT, [pour({ to: { x: Number.NaN, y: 0.5 } })])
  for (const tool of ['finger', 'sweep', 'edge'] as const) {
    material.step(DT, [{ tool, from: { x: 0.2, y: 0.2 }, to: { x: 0.7, y: 0.8 }, radius: 0.2, strength: 3 }])
  }
  expect(material.density.every(value => Number.isFinite(value) && value >= 0)).toBe(true)
})
