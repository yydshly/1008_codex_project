import { expect, test } from 'vitest'
import { ContactMaterial, tablePoint, CONTACT_WIDTH, CONTACT_HEIGHT, SAND_HEIGHT_SCALE } from '../src/memories/contact-material'
import { contactAction, TABLE_WIDTH, TABLE_DEPTH } from '../src/memories/contact-score'
import { relaxSand } from '../src/memories/sand-relaxation'

test('落沙从实际指缝高度发射，按米制重力落定并保留供沙记账', () => {
  const driver = new ContactMaterial(), action = contactAction(510), anchor = { x: action.x, y: .095, z: action.z }
  driver.step(action, anchor)
  expect(driver.sand.airborne.length).toBeGreaterThan(0)
  expect(driver.sand.airborne.every(grain => Math.abs(grain.z * TABLE_WIDTH - anchor.y) < 1e-9)).toBe(true)
  const p = tablePoint(anchor)
  expect(p.x).toBeCloseTo(anchor.x / TABLE_WIDTH + .5)
  expect(p.y).toBeCloseTo(anchor.z / TABLE_DEPTH + .5)
  const lifted = { ...action, flow: 0, touching: false }
  for (let frame = 0; frame < 8; frame++) driver.step(lifted, anchor)
  expect(driver.sand.inAirMass).toBeGreaterThan(0)
  driver.step(lifted, anchor)
  expect(driver.sand.pending).toBe(false)
  expect(driver.sand.mass + driver.sand.removedMass).toBeCloseTo(driver.sand.suppliedMass, 4)
})

test('悬空指腹不能划沙；接触后移动已有沙且不凭空添沙', () => {
  const driver = new ContactMaterial(), pour = { ...contactAction(510), x: 0, z: 0 }
  for (let tick = 0; tick < 80; tick++) driver.step(pour, { x: 0, y: .07, z: 0 })
  const finger = { ...contactAction(1000), x: 0, z: 0 }
  for (let tick = 0; tick < 20; tick++) driver.step({ ...finger, touching: false }, { x: 0, y: .08, z: 0 })
  const before = driver.sand.density.slice(), supplied = driver.sand.suppliedMass
  expect(driver.step(finger, { x: 0, y: .08, z: 0 })).toEqual([])
  expect(driver.sand.density).toEqual(before)
  const contacts = driver.step(finger, { x: 0, y: driver.surfaceAt(0, 0) + .002, z: 0 })
  expect(contacts[0].tool).toBe('finger')
  expect(driver.sand.density).not.toEqual(before)
  expect(driver.sand.suppliedMass).toBe(supplied)
  expect(driver.sand.mass + driver.sand.removedMass).toBeCloseTo(supplied, 3)
})

test('重新播放恢复随机种子、落点和沙量，停止供沙后落定阶段不显影', () => {
  const driver = new ContactMaterial()
  const run = () => {
    for (let tick = 0; tick < 1200; tick++) {
      const action = contactAction(tick)
      driver.step(action, { x: action.x, y: action.touching ? driver.surfaceAt(action.x, action.z) + .002 : Math.max(.015, action.elevation), z: action.z })
    }
  }
  run(); const first = driver.sand.read()
  driver.reset(); run(); expect(driver.sand.read()).toEqual(first)
  const density = driver.sand.density.slice()
  const supplied=driver.sand.suppliedMass
  for (let tick = 0; tick < 60; tick++) {
    expect(driver.step(contactAction(1200), { x: .175, y: .16, z: -.02 })).toEqual([])
    relaxSand(density,CONTACT_WIDTH,CONTACT_HEIGHT,TABLE_WIDTH/CONTACT_WIDTH,TABLE_DEPTH/CONTACT_HEIGHT,SAND_HEIGHT_SCALE,1200+tick)
  }
  expect(driver.sand.density).toEqual(density)
  expect(driver.sand.suppliedMass).toBe(supplied)
  expect(driver.sand.mass + driver.sand.inAirMass + driver.sand.removedMass).toBeCloseTo(driver.sand.suppliedMass, 2)
})

test('三股指缝共用一把沙，耗尽后不能无限供料，余沙继续落定', () => {
  const driver = new ContactMaterial(), action = { ...contactAction(510), flow: 1.8 }
  const mouths = [{ x: -.01, y: .095, z: 0 }, { x: .015, y: .09, z: 0 }, { x: .03, y: .085, z: 0 }]
  const contacts = driver.step(action, mouths[0], mouths)
  expect(contacts).toHaveLength(3)
  expect(contacts.reduce((sum, contact) => sum + contact.strength!, 0)).toBeCloseTo(action.flow, 10)
  expect(driver.remaining).toBeCloseTo(1 - action.flow / 60 / 8, 10)
  for (let tick = 1; tick < 267; tick++) driver.step(action, mouths[0], mouths)
  expect(driver.remaining).toBe(0)
  expect(driver.sand.inAirMass).toBeGreaterThan(0)
  const supplied = driver.sand.suppliedMass
  for (let tick = 0; tick < 60; tick++) expect(driver.step(action, mouths[0], mouths)).toEqual([])
  expect(driver.sand.suppliedMass).toBe(supplied)
  expect(driver.sand.inAirMass).toBe(0)
  expect(driver.sand.mass + driver.sand.removedMass).toBeCloseTo(supplied, 3)
  driver.reset(); expect(driver.remaining).toBe(1); expect(driver.sand.mass).toBe(0)
})
