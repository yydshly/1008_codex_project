import { readFile } from 'node:fs/promises'
import { expect, test } from 'vitest'
import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { ContactHand } from '../src/memories/contact-hand'
import { contactAction } from '../src/memories/contact-score'
import { ContactMaterial } from '../src/memories/contact-material'
import { SAND_HEIGHT_SCALE, CONTACT_WIDTH, CONTACT_HEIGHT } from '../src/memories/contact-material'
import { TABLE_WIDTH, TABLE_DEPTH } from '../src/memories/contact-score'
import { relaxSand } from '../src/memories/sand-relaxation'

async function loadHand() {
  const data = await readFile(new URL('../../../assets/hand-contact-v20/hand-posable.glb', import.meta.url))
  const model = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')
  return new ContactHand(model.scene, new T.Texture())
}

test('实际三维手部具有完整骨骼、纹理坐标且不穿玻璃', async () => {
  const hand = await loadHand(), vertex = new T.Vector3()
  expect(hand.mesh.skeleton.bones).toHaveLength(16)
  expect(hand.mesh.geometry.getAttribute('uv').count).toBeGreaterThan(8000)
  for (const tick of [0, 180, 510, 720, 810, 960, 1035, 1200]) {
    const action = contactAction(tick), anchor = hand.place(action)
    let min = Infinity
    for (let i = 0; i < hand.mesh.geometry.getAttribute('position').count; i++) {
      hand.mesh.getVertexPosition(i, vertex).applyMatrix4(hand.mesh.matrixWorld)
      min = Math.min(min, vertex.y)
    }
    if (action.touching) expect(anchor.y).toBeLessThan(.004)
    expect(min).toBeGreaterThanOrEqual(-.0002)
    expect(anchor.x).toBeCloseTo(action.x, 7)
    expect(anchor.z).toBeCloseTo(action.z, 7)
  }
  hand.dispose()
})

test('完整动作通过实际蒙皮接触移沙，抬手后不能继续划沙', async () => {
  const hand = await loadHand(), driver = new ContactMaterial()
  let beforeFinger: Float32Array | undefined, afterFinger: Float32Array | undefined
  let palmMoved=0,fingerMoved=0
  for (let tick = 1; tick <= 1200; tick++) {
    const action = contactAction(tick)
    const anchor = hand.place(action, driver.surfaceAt(action.x, action.z))
    const contacts = driver.step(action, anchor, hand.releasePoints, hand.contactPatch??null)
    if(action.pose==='palm') palmMoved+=driver.lastMoved
    if(action.pose==='finger') fingerMoved+=driver.lastMoved
    if (tick === 510) {
      expect(hand.releasePoints).toHaveLength(3)
      expect(contacts).toHaveLength(3)
      for (const [index, mouth] of hand.releasePoints.entries()) {
        expect(mouth.y).toBeGreaterThan(0)
        expect(contacts[index].emissionHeight).toBeCloseTo(mouth.y / TABLE_WIDTH, 8)
        expect(contacts[index].to.x).toBeCloseTo(mouth.x / TABLE_WIDTH + .5, 8)
        expect(contacts[index].to.y).toBeCloseTo(mouth.z / TABLE_DEPTH + .5, 8)
      }
      expect(hand.releasePoints[1].distanceTo(hand.releasePoints[2])).toBeGreaterThan(.005)
    }
    if (tick === 960) beforeFinger = driver.sand.density.slice()
    if (tick === 1109) afterFinger = driver.sand.density.slice()
    if (tick >= 1110) {
      expect(contacts).toEqual([])
      // 抬手之后只允许同一沙堆的被动滑落，不能继续划线或新增材料。
      relaxSand(afterFinger!, CONTACT_WIDTH, CONTACT_HEIGHT, TABLE_WIDTH / CONTACT_WIDTH, TABLE_DEPTH / CONTACT_HEIGHT, SAND_HEIGHT_SCALE, tick - 1)
    }
  }
  expect(afterFinger).not.toEqual(beforeFinger)
  expect(palmMoved).toBeGreaterThan(30)
  expect(fingerMoved).toBeGreaterThan(5)
  expect(driver.sand.density).toEqual(afterFinger)
  expect(driver.sand.mass + driver.sand.removedMass).toBeCloseTo(driver.sand.suppliedMass, 2)
  hand.dispose()
}, 15000)

test('接触片来自当前形变皮肤，力度增加接触面积，悬空时没有接触片',async()=>{
  const hand=await loadHand(),action=contactAction(1035)
  const area=()=>{
    const points=hand.contactPatch!.points
    return Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.z-q.x*p.z},0))/2
  }
  hand.place({...action,pressure:.15});const lightArea=area()
  hand.place({...action,pressure:1});expect(area()).toBeGreaterThan(lightArea)
  const patch=hand.contactPatch!,world=new T.Vector3(),vertices:T.Vector3[]=[]
  for(let i=0;i<hand.mesh.geometry.getAttribute('position').count;i++) vertices.push(hand.mesh.getVertexPosition(i,world).applyMatrix4(hand.mesh.matrixWorld).clone())
  for(const point of patch.points) expect(Math.min(...vertices.map(vertex=>vertex.distanceTo(new T.Vector3(point.x,point.y,point.z))))).toBeLessThan(1e-7)
  expect(hand.mesh.morphTargetInfluences![1]).toBe(1)
  hand.place(contactAction(1200));expect(hand.contactPatch).toBeUndefined()
  hand.dispose()
})
