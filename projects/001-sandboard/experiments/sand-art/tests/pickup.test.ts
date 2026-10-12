import {readFile} from 'node:fs/promises'
import {expect,test} from 'vitest'
import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {SandHandful} from '../src/memories/sand-handful'
import {ContactHand} from '../src/memories/contact-hand'
import {ContactMaterial, CONTACT_WIDTH, CONTACT_HEIGHT, SAND_HEIGHT_SCALE} from '../src/memories/contact-material'
import {pickupAction,PICKUP_TICKS} from '../src/memories/pickup-score'
import {TABLE_WIDTH,TABLE_DEPTH} from '../src/memories/contact-score'
import {HeldSand} from '../src/memories/held-sand'

const patch=[{x:-.03,y:.002,z:-.02},{x:.03,y:.002,z:-.02},{x:.03,y:.002,z:.02},{x:-.03,y:.002,z:.02}]
test('只从靠近皮肤且收拢的范围取沙；抬高、停指与空台不能添沙',()=>{
  const hand=new SandHandful(64,48,.2,.15,1000),field=new Float32Array(64*48).fill(3)
  expect(hand.take(field,patch.map(p=>({...p,y:.05})),.2,.001)).toBe(0)
  expect(hand.take(field,patch,0,.001)).toBe(0)
  const before=field.slice(),mass=field.reduce((s,v)=>s+v,0)
  expect(hand.take(field,patch,.2,.001)).toBeGreaterThan(0)
  expect(field[0]).toBe(before[0]);expect(field.every(v=>v>=0)).toBe(true)
  expect(field.reduce((s,v)=>s+v,0)+hand.mass).toBeCloseTo(mass,7)
  field.fill(0);const held=hand.mass;expect(hand.take(field,patch,.2,.001)).toBe(0);expect(hand.mass).toBe(held)
})
test('容量与漏沙都受已有材料限制，出界取沙不绕到数组另一边',()=>{
  const hand=new SandHandful(64,48,.2,.15,7),field=new Float32Array(64*48).fill(8),mass=field.reduce((s,v)=>s+v,0)
  hand.take(field,patch,1,.001)
  expect(hand.mass).toBeCloseTo(7,4);expect(field.reduce((s,v)=>s+v,0)+hand.mass).toBeCloseTo(mass,7)
  expect(hand.release(100)).toBeCloseTo(7,4);expect(hand.mass).toBe(0);expect(hand.release(1)).toBe(0)
  hand.lift();hand.take(field,patch.map(p=>({...p,x:p.x+.3})),1,.001);expect(hand.mass).toBe(0)
})

test('实际蒙皮取沙、抬手握持、漏沙落回台面全过程守恒且可重播',async()=>{
  const data=await readFile(new URL('../../../assets/hand-contact-v20/hand-posable.glb',import.meta.url))
  const model=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'')
  const hand=new ContactHand(model.scene,new T.Texture()),driver=new ContactMaterial('pickup')
  const initial=driver.accounting.initial
  expect(driver.heldMass).toBe(0);expect(initial).toBeGreaterThan(1000)
  const run=()=>{
    let taken=0,maxError=0,heldAtLift=0,emitted=0
    for(let tick=1;tick<=PICKUP_TICKS;tick++){
      const action=pickupAction(tick),anchor=hand.place(action,driver.surfaceAt(action.x,action.z)),before=driver.heldMass
      driver.step(action,anchor,hand.releasePoints,hand.contactPatch??null,hand.graspPoints)
      taken+=driver.lastTaken;maxError=Math.max(maxError,Math.abs(driver.accounting.error))
      if(tick===330){heldAtLift=driver.heldMass;expect(hand.palmBed.normal.y).toBeGreaterThan(.8);expect(driver.accounting.table).toBeLessThan(initial)}
      if(tick>330&&tick<=450){expect(driver.lastTaken).toBe(0);expect(driver.heldMass).toBe(heldAtLift)}
      if(tick===750){expect(driver.heldMass).toBeGreaterThan(heldAtLift*.15);expect(driver.heldMass).toBeLessThan(heldAtLift*.9)}
      if(tick===960){expect(driver.heldMass).toBeGreaterThan(0);expect(driver.sand.inAirMass).toBeGreaterThan(0)}
      if(action.flow>0)emitted+=before-driver.heldMass
      if(action.pickup)expect(hand.graspPoints.length).toBeGreaterThanOrEqual(3)
    }
    expect(taken).toBeGreaterThan(100);expect(emitted).toBeCloseTo(taken,5)
    expect(driver.heldMass).toBeLessThan(1e-8);expect(driver.sand.inAirMass).toBe(0);expect(maxError/initial).toBeLessThan(1e-6)
    expect(driver.sand.density.every(v=>Number.isFinite(v)&&v>=0)).toBe(true)
    return driver.sand.read()
  }
  const first=run();driver.reset();expect(driver.heldMass).toBe(0);expect(driver.accounting.initial).toBe(initial);expect(run()).toEqual(first)
  // 漏完之后即使请求持续撒沙，也不能凭空重新装满。
  expect(driver.step({...pickupAction(960),flow:2}, {x:0,y:.1,z:0})).toEqual([])
  hand.dispose()
},30000)

test('掌内沙堆位置随掌面移动，体积减少时缩小，空手不显示',()=>{
  const pile=new HeldSand(),bed={centre:new T.Vector3(.05,.1,-.04),u:new T.Vector3(1,0,0),v:new T.Vector3(0,0,-1),normal:new T.Vector3(0,1,0)}
  pile.update(bed,1000,TABLE_WIDTH/(CONTACT_WIDTH-1)*TABLE_DEPTH/(CONTACT_HEIGHT-1),SAND_HEIGHT_SCALE)
  const vertices=pile.geometry.getAttribute('position'),top=vertices.getY(0)
  expect(pile.visible).toBe(true);expect(top).toBeGreaterThan(bed.centre.y)
  bed.centre.x+=.05;pile.update(bed,500,TABLE_WIDTH/(CONTACT_WIDTH-1)*TABLE_DEPTH/(CONTACT_HEIGHT-1),SAND_HEIGHT_SCALE)
  expect(vertices.getX(0)).toBeCloseTo(.1,7);expect(vertices.getY(0)).toBeLessThan(top)
  pile.update(bed,0,1,1);expect(pile.visible).toBe(false)
  pile.geometry.dispose();pile.material.dispose()
})
