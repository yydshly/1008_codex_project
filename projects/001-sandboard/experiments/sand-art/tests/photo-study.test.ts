import {expect,test} from 'vitest'
import {PhotoStudy} from '../src/memories/photo-study'
import {StructuredPainting,type PortraitPlan} from '../src/memories/structured-painting'
import {PhotoSurface} from '../src/memories/photo-surface'
import * as T from 'three'
import {setPhotoCamera} from '../src/memories/pour-camera'
import {TABLE_WIDTH,TABLE_DEPTH} from '../src/memories/contact-score'

function plan():PortraitPlan {
  return {width:96,height:64,guides:[{id:'main',kind:'subject',bounds:[.1,.1,.9,.9]}],
    strokes:[
      {phase:0,region:'context',tool:'pour',path:[{x:.5,y:.4},{x:.65,y:.5}],sigma:2,budget:60,ticks:30,finish:'settle'},
      {phase:1,region:'coat',tool:'rub',path:[{x:.5,y:.4},{x:.6,y:.5}],sigma:9,budget:2,ticks:600},
      {phase:4,region:'face',tool:'collect',path:[{x:.6,y:.4},{x:.6,y:.6}],sigma:3,budget:.25,ticks:20},
    ],totalTicks:740,phaseStarts:[0,40,650,650,650,680],initialError:.5,finalError:.1}
}
test('无手照片演出与原工具逐值一致，固定近景不改变沙量，定位可重播',()=>{
  const study=new PhotoStudy(plan()),baseline=new StructuredPainting(plan())
  expect(study.material.mass).toBe(0);expect(study.label).toContain('空台')
  const surface=new PhotoSurface(study.material)
  expect(surface.material.uniforms.field.value.image.data).toBe(study.material.density)
  expect(surface.material.uniforms.grid.value.toArray()).toEqual([96,64])
  const focus=study.focalPoint
  for(let n=0;n<study.ticks;n++){
    study.step();baseline.step();surface.update()
    expect(study.focalPoint).toEqual(focus)
    if(n===650)expect(study.label).toContain('收沙')
  }
  expect(study.material.read()).toEqual(baseline.material.read())
  const final=study.material.read();study.focus='hands'
  expect(study.focalPoint).not.toEqual(focus);expect(study.material.read()).toEqual(final)
  const to=study.rewindTo(623)
  expect(study.tick).toBe(600);while(study.tick<to)study.step();while(study.step()){}
  expect(study.material.read()).toEqual(final);expect(study.material.pending).toBe(false)
  expect(study.material.mass+study.material.removedMass).toBeCloseTo(study.material.suppliedMass,4)
  expect(study.label).toContain('落定');study.reset();expect(study.tick).toBe(0);expect(study.material.mass).toBe(0)
  surface.dispose()
})

test('照片俯视与斜视在桌面和窄屏比例下保留完整构图',()=>{
  for(const aspect of [.6,1,1.35,1.58,2,3])for(const view of ['angle','top'] as const){
    const camera=new T.PerspectiveCamera(38,aspect,.01,5)
    setPhotoCamera(camera,view,new T.Vector3(.08,.002,-.05))
    for(const x of [-TABLE_WIDTH/2,TABLE_WIDTH/2])for(const z of [-TABLE_DEPTH/2,TABLE_DEPTH/2]){
      const p=new T.Vector3(x,.002,z).project(camera)
      expect(Math.abs(p.x)).toBeLessThan(1);expect(Math.abs(p.y)).toBeLessThan(1)
    }
  }
})

test('切换透光与侧光仅改变观看光线，固定粒面不改变材料',()=>{
  const study=new PhotoStudy(plan());for(let n=0;n<40;n++)study.step()
  const before=study.material.read(),surface=new PhotoSurface(study.material)
  surface.lighting('raking');expect(surface.material.uniforms.raking.value).toBe(1)
  expect(study.material.read()).toEqual(before)
  surface.lighting('transmitted');expect(surface.material.uniforms.raking.value).toBe(0)
  expect(study.material.read()).toEqual(before);surface.dispose()
})
