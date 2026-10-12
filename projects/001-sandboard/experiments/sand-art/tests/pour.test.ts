import {expect,test} from 'vitest'
import * as T from 'three'
import {ContactMaterial} from '../src/memories/contact-material'
import {CONTACT_DT} from '../src/memories/contact-score'
import {pourAction,POUR_TICKS,POUR_HEIGHT} from '../src/memories/pour-score'
import {setPourCamera} from '../src/memories/pour-camera'
import {StageMaterial} from '../src/stage/material'

test('无手小样只供沙，材料先在空中，落定后守恒且重播一致',()=>{
  const driver=new ContactMaterial(),initial=driver.accounting.initial
  const run=()=>{
    let sawFalling=false,maxError=0
    for(let tick=1;tick<=POUR_TICKS;tick++){
      const action=pourAction(tick),anchor={x:action.x,y:action.elevation,z:action.z}
      const contacts=driver.step(action,anchor,[anchor],null)
      expect(action.touching).toBe(false)
      expect(contacts.every(contact=>contact.tool==='pour')).toBe(true)
      if(tick<=39)expect(driver.sand.mass+driver.sand.inAirMass).toBe(0)
      if(tick===45){expect(driver.sand.mass).toBe(0);expect(driver.sand.inAirMass).toBeGreaterThan(0)}
      sawFalling ||= driver.sand.inAirMass>0
      maxError=Math.max(maxError,Math.abs(driver.accounting.error))
    }
    expect(sawFalling).toBe(true);expect(driver.sand.inAirMass).toBe(0)
    expect(driver.sand.mass).toBeGreaterThan(1000);expect(driver.remaining).toBeGreaterThan(0)
    expect(maxError/initial).toBeLessThan(1e-6)
    expect(driver.sand.density.every(value=>Number.isFinite(value)&&value>=0)).toBe(true)
    return driver.sand.read()
  }
  const first=run();driver.reset();expect(driver.sand.mass).toBe(0);expect(run()).toEqual(first)
},20000)

test('落沙侧面镜头中的起点始终在画面上方，落点在画面内',()=>{
  for(const aspect of [.75,1.35,1.58,2]) {
    const camera=new T.PerspectiveCamera(38,aspect,.01,5)
    for(let tick=0;tick<=POUR_TICKS;tick+=7){
      const action=pourAction(tick),target=new T.Vector3(action.x,.006,action.z)
      setPourCamera(camera,'flow',target)
      const source=new T.Vector3(action.x,POUR_HEIGHT,action.z).project(camera),landing=new T.Vector3(action.x,.006,action.z).project(camera)
      expect(source.y).toBeGreaterThan(1);expect(Math.abs(landing.x)).toBeLessThan(.01);expect(Math.abs(landing.y)).toBeLessThan(.01)
    }
  }
  expect(POUR_TICKS*CONTACT_DT).toBe(12)
})

test('旧供料默认惯性不变，细流低惯性降低侧移而保持供沙量',()=>{
  const run=(velocityInheritance?:number)=>{
    const material=new StageMaterial(64,48,123,9000,16)
    material.step(CONTACT_DT,[{tool:'pour',from:{x:.4,y:.5},to:{x:.41,y:.5},radius:.001,strength:.5,spread:0,ballistic:true,emissionHeight:.5,velocityInheritance}])
    for(let i=0;i<5;i++)material.step(CONTACT_DT,[])
    return material.read()
  }
  const legacy=run(),same=run(.45),narrow=run(.1)
  expect(legacy).toEqual(same)
  const centre=(snapshot:ReturnType<StageMaterial['read']>)=>snapshot.particles.reduce((s,p)=>s+p.x*p.mass,0)/snapshot.particles.reduce((s,p)=>s+p.mass,0)
  expect(centre(narrow)).toBeLessThan(centre(legacy))
  expect(narrow.suppliedMass).toBe(legacy.suppliedMass)
})

test('同帧供料错开出生时间形成连续沙流，落定后没有丢失材料',()=>{
  const material=new StageMaterial(64,48,987,9000,16)
  material.step(CONTACT_DT,[{tool:'pour',from:{x:.5,y:.5},to:{x:.5,y:.5},radius:.001,strength:.5,spread:0,ballistic:true,emissionHeight:.5,continuousEmission:true}])
  const heights=material.airborne.map(grain=>grain.z)
  expect(new Set(heights).size).toBeGreaterThan(20);expect(Math.max(...heights)-Math.min(...heights)).toBeGreaterThan(.001)
  const supplied=material.suppliedMass
  for(let i=0;i<60;i++)material.step(CONTACT_DT,[])
  expect(material.inAirMass).toBe(0);expect(material.mass+material.removedMass).toBeCloseTo(supplied,6)
})
