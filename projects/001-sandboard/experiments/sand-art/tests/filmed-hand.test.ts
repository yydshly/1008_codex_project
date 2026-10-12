import { expect, test } from 'vitest'
import { handAnchor, handTime, keyHandPixels, validCalibration, type HandCalibration } from '../src/memories/filmed-hand'
import { settingsFor, validSettings } from '../src/memories/model'
import { StageMaterial } from '../src/stage/material'
import { encodePhotoProject, decodePhotoProject } from '../src/memories/export'

test('绿幕抠除保持肤色，部分透明边缘不变为不透明', () => {
  const pixels = new Uint8ClampedArray([12, 235, 17, 255, 194, 139, 110, 255, 161, 126, 95, 80])
  keyHandPixels(pixels, 'green')
  expect([...pixels]).toEqual([12, 235, 17, 0, 194, 139, 110, 255, 161, 126, 95, 80])
})
test('蓝幕与绿幕独立；自带透明素材逐字节保留', () => {
  const pixels = new Uint8ClampedArray([4, 20, 240, 255, 5, 230, 8, 255])
  const original = pixels.slice(); keyHandPixels(pixels, 'alpha'); expect(pixels).toEqual(original)
  keyHandPixels(pixels, 'blue'); expect(pixels[3]).toBe(0); expect(pixels[7]).toBe(255)
})
test('色键有平滑过渡，不将中间色直接切成硬边', () => {
  const pixels = new Uint8ClampedArray([80, 113, 72, 200])
  keyHandPixels(pixels, 'green')
  expect(pixels[3]).toBeGreaterThan(0); expect(pixels[3]).toBeLessThan(200)
  expect([...pixels.slice(0, 3)]).toEqual([80, 113, 72])
})
test('新颗粒外观可随工程保存，旧工程兼容，非法呈现被拒绝', () => {
  const material = new StageMaterial(32, 24)
  material.density[0] = .8
  const snapshot = material.read(); snapshot.suppliedMass = .8
  const project = { format: 'sandboard-photo' as const, version: 1 as const, title: '沙粒', caption: '', sourceKind: 'photo' as const,
    settings: { ...settingsFor(), surface: 'granular' as const }, snapshot }
  expect(decodePhotoProject(encodePhotoProject(project))).toEqual(project)
  expect(validSettings(settingsFor())).toBe(true)
  expect(validSettings({ ...settingsFor(), surface: 'invented' })).toBe(false)
})
test('接触点随素材帧插值，暂停和回跳不依赖真实时间',()=>{
  const anchors=[{progress:0,x:.2,y:.3},{progress:.5,x:.4,y:.6},{progress:1,x:.7,y:.8}]
  expect(handAnchor(.25,anchors).x).toBeCloseTo(.3);expect(handAnchor(.25,anchors).y).toBeCloseTo(.45)
  expect(handAnchor(-1,anchors)).toEqual(anchors[0]);expect(handAnchor(2,anchors)).toEqual(anchors[2])
  const range={start:1.25,end:2.75}
  expect(handTime(.5,range)).toBe(2);expect(handTime(.1,range)).toBeCloseTo(1.4)
  expect(handTime(.5,range)).toBe(2)
})
test('错误接触标定、倒置截取和超过片长的截取不可载入',()=>{
  const c:HandCalibration={key:'alpha',width:.3,start:0,end:2,anchors:[{progress:0,x:.5,y:.2}]}
  expect(validCalibration(c,2)).toBe(true)
  for(const bad of [{...c,end:3},{...c,start:2},{...c,width:NaN},{...c,anchors:[]},{...c,anchors:[c.anchors[0],c.anchors[0]]},{...c,anchors:[{progress:.5,x:1.1,y:.2}]}])expect(validCalibration(bad,2)).toBe(false)
})
