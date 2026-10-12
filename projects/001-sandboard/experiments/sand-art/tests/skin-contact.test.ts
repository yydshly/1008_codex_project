import { expect,test } from 'vitest'
import { SkinSandContact,skinHull,type SkinPatch } from '../src/memories/skin-contact'

const width=128,height=96,W=.58,D=.4
const mass=(density:Float32Array)=>density.reduce((sum,amount)=>sum+amount,0)
const cell=(density:Float32Array,x:number,z:number)=>density[Math.round((z/D+.5)*(height-1))*width+Math.round((x/W+.5)*(width-1))]
function patch(x:number,pressure=1,y=.001,tool:SkinPatch['tool']='finger'):SkinPatch {
  return {tool,pressure,points:[{x:x-.007,y,z:-.008},{x:x+.006,y,z:-.008},{x:x+.007,y,z:.007},{x:x-.006,y,z:.009}]}
}
function trace(density:Float32Array,pressure=1,y=.001,tool:SkinPatch['tool']='finger') {
  const contact=new SkinSandContact(width,height,W,D);let moved=0
  for(let step=0;step<60;step++) moved+=contact.apply(density,patch(-.08+step*.002,pressure,y,tool),.0008,1/60)
  return moved
}

test('皮肤轮廓拖动留下沟槽和侧脊，不改变总沙量或远处沙层',()=>{
  const density=new Float32Array(width*height).fill(.8),before=mass(density)
  expect(trace(density)).toBeGreaterThan(50)
  expect(cell(density,0,0)).toBeLessThan(.15)
  expect(Math.max(...density)).toBeGreaterThan(1)
  expect(cell(density,0,.035)).toBeCloseTo(.8,6)
  expect(Math.min(...density)).toBeGreaterThanOrEqual(0)
  expect(mass(density)).toBeCloseTo(before,3)
})

test('悬空的同一皮肤形状和零力度都不会划沙',()=>{
  for(const [pressure,y] of [[1,.04],[0,.001]]) {
    const density=new Float32Array(width*height).fill(.8),before=density.slice()
    expect(trace(density,pressure,y)).toBe(0);expect(density).toEqual(before)
  }
})

test('力度改变移沙与接触边缘，但不会产生额外材料',()=>{
  const light=new Float32Array(width*height).fill(.8),heavy=light.slice()
  const low=trace(light,.2),high=trace(heavy,1)
  expect(high).toBeGreaterThan(low)
  expect(cell(heavy,0,0)).toBeLessThan(cell(light,0,0))
  expect(mass(heavy)).toBeCloseTo(mass(light),3)
})

test('掌前移沙与侧向划线产生不同材料分布，台沿夹住落点',()=>{
  const finger=new Float32Array(width*height).fill(.8),palm=finger.slice()
  trace(finger);trace(palm,1,.001,'sweep')
  expect(finger).not.toEqual(palm)
  const edge=new Float32Array(width*height).fill(.8),before=mass(edge),contact=new SkinSandContact(width,height,W,D)
  for(let tick=0;tick<20;tick++) contact.apply(edge,patch(.267+tick*.001,1,.001,'sweep'),.0008,1/60)
  expect(mass(edge)).toBeCloseTo(before,3);expect(Math.min(...edge)).toBeGreaterThanOrEqual(0)
})

test('共线点不产生假接触，重播恢复相同轨迹',()=>{
  expect(skinHull([{x:0,y:.001,z:0},{x:1,y:.001,z:0},{x:2,y:.001,z:0}])).toHaveLength(2)
  const a=new Float32Array(width*height).fill(.8),b=a.slice();trace(a);trace(b);expect(a).toEqual(b)
})
