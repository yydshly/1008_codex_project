import { expect, test } from 'vitest'
import { handPose, meshTriangles, poseMeshes, releaseAnchor } from '../src/memories/generated-hand'
import { GeneratedPour, ManualPour, apertureFlow, landingPoint, pourGesture, POUR_TICKS } from '../src/memories/generated-pour'
import { articulateHand, stableRelease, stableTriangles, stableVertices } from '../src/memories/stable-hand'

test('关键姿态过渡连续，网格没有翻折或不合法纹理坐标',()=>{
  for(let pose=0;pose<6;pose++)for(let i=0;i<meshTriangles.length;i+=3){
    const [a,b,c]=meshTriangles.slice(i,i+3).map(index=>poseMeshes[pose][index])
    const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)
    expect(area).toBeGreaterThan(0)
    for(const p of [a,b,c])expect([p.x,p.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1)).toBe(true)
  }
  for(let i=1;i<=1000;i++){
    const a=releaseAnchor((i-1)/1000),b=releaseAnchor(i/1000)
    expect(Math.hypot(b.x-a.x,b.y-a.y)).toBeLessThan(.001)
    const pose=handPose(i/1000);expect(pose.a>=0&&pose.b<=5&&pose.mix>=0&&pose.mix<=1).toBe(true)
  }
})

test('单素材捻指在全部开度无翻折，腕部和前臂保持原比例，出沙口连续',()=>{
  for(let step=0;step<=20;step++){
    const phase=step/20
    for(let i=0;i<stableTriangles.length;i+=3){
      const [a,b,c]=stableTriangles.slice(i,i+3).map(index=>articulateHand(stableVertices[index],phase))
      expect((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)).toBeGreaterThan(0)
    }
    for(const p of [{x:.5,y:.7},{x:.6,y:1.3}])expect(articulateHand(p,phase)).toEqual(p)
  }
  for(let i=1;i<=100;i++){
    const a=stableRelease((i-1)/100),b=stableRelease(i/100)
    expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeLessThan(.001)
  }
})

test('开度决定流量，细流收指后停沙再抬手散撒',()=>{
  for(let time=0;time<10;time+=.1){
    expect(apertureFlow(0,time)).toBe(0)
    expect(apertureFlow(.8,time)).toBeGreaterThan(apertureFlow(.5,time))
    expect(apertureFlow(.8,time,0)).toBe(0)
  }
  expect(pourGesture(213).flow).toBe(0)
  expect(pourGesture(300).spread).toBeGreaterThan(pourGesture(150).spread!)
  expect(pourGesture(300).lift).toBeGreaterThan(pourGesture(150).lift)
})

test('手动输入有速度过渡，松手停止供料并落定，一把沙预算最终耗尽',()=>{
  const actor=new ManualPour(),scene=new GeneratedPour(128,86)
  const before=actor.step(false)
  actor.targetAt({x:.7,y:.5});actor.grab()
  const first=actor.step(true)
  expect(first.release.x).toBeGreaterThan(before.release.x)
  expect(first.release.x).toBeLessThan(.42)
  let supplied=0,previous=first
  for(let i=0;i<1800;i++){
    const next=actor.step(true);supplied+=next.flow/60
    expect(Math.hypot(next.release.x-previous.release.x,next.release.y-previous.release.y)).toBeLessThan(.016)
    scene.emit(next);previous=next
  }
  expect(actor.remaining).toBe(0)
  expect(supplied).toBeCloseTo(2.1-first.flow/60,10)
  expect(actor.step(true).flow).toBe(0)
  actor.grab();expect(actor.remaining).toBe(1)
  for(let i=0;i<150;i++){const gesture=actor.step(false);expect(gesture.flow).toBe(0);scene.emit(gesture)}
  expect(actor.moving).toBe(false)
  expect(scene.material.pending).toBe(false)
  expect(Math.abs(scene.material.mass+scene.material.removedMass-scene.material.suppliedMass)).toBeLessThan(scene.material.suppliedMass*4e-6)
})

test('供沙与可见松指动作同步，入场和收手不会凭空添沙',()=>{
  for(let tick=0;tick<=POUR_TICKS;tick++){
    const gesture=pourGesture(tick)
    if(gesture.flow>0){expect(gesture.visible).toBe(true);expect(gesture.opening).toBeGreaterThan(0);expect(gesture.phase).not.toBe('捏沙入场')}
    if(tick<84||tick>=408)expect(gesture.flow).toBe(0)
  }
  const gesture=pourGesture(160),ground=landingPoint(gesture)
  const projected=ground.y-(.013+gesture.lift*.09)*1.5*.55
  expect(projected).toBeCloseTo(gesture.release.y,12)
})

test('实际供料从空台形成沙弧，完整落定后质量守恒，重播和拖动一致',()=>{
  const scene=new GeneratedPour(128,86)
  expect(scene.material.mass).toBe(0)
  while(scene.tick<POUR_TICKS)scene.step()
  expect(scene.material.pending).toBe(false)
  expect(scene.material.suppliedMass).toBeGreaterThan(0)
  expect(scene.material.density.filter(n=>n>.01).length).toBeGreaterThan(40)
  expect(Math.abs(scene.material.mass+scene.material.removedMass-scene.material.suppliedMass)).toBeLessThan(scene.material.suppliedMass*1e-5)
  const final=scene.material.read()
  scene.seek(POUR_TICKS)
  expect(scene.material.read()).toEqual(final)
  scene.seek(0);expect(scene.material.suppliedMass).toBe(0);expect(scene.material.mass).toBe(0)
})
