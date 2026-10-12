import { expect, test } from 'vitest'
import { labBedContact, labDemoContacts, LAB_DEMO_SECONDS } from '../src/atelier/gesture-lab'
import { StageMaterial } from '../src/stage/material'

const DT = 1 / 60
const settle = (material: StageMaterial) => {
  for (let tick = 0; tick < 30 && material.pending; tick++) material.step(DT, [])
  expect(material.pending).toBe(false)
}
const conservation = (material: StageMaterial) => {
  expect(Math.abs(material.mass + material.removedMass + material.inAirMass - material.suppliedMass)).toBeLessThan(material.suppliedMass * 1e-5 + 1e-5)
}

test('试验区沙底来自粒流供料，形成可推开的厚度并完整记账', () => {
  const material = new StageMaterial(96, 72, 0xa17e11)
  for (let index = 0; index < 120; index++) material.step(0.1, [labBedContact(index)])
  settle(material)
  expect(material.suppliedMass).toBeGreaterThan(0)
  const coverage = material.density.filter(value => value > 0.1).length / material.density.length
  expect(coverage).toBeGreaterThan(0.9)
  conservation(material)
})

test('三种练习使用可执行接触，细撒供沙，留白与指尖只搬运沙', () => {
  for (const tool of ['pour', 'edge', 'finger'] as const) {
    const material = new StageMaterial(96, 72, 0xa17e11)
    if (tool !== 'pour') {
      for (let index = 0; index < 120; index++) material.step(0.1, [labBedContact(index)])
      settle(material)
    }
    const suppliedBefore = material.suppliedMass
    const before = material.density.slice()
    let contactCount = 0
    for (let tick = 0; tick < Math.ceil(LAB_DEMO_SECONDS / DT); tick++) {
      const contacts = labDemoContacts(tool, tick * DT)
      contactCount += contacts.length
      expect(contacts.every(contact => contact.tool === tool && contact.radius > 0 && contact.strength > 0)).toBe(true)
      material.step(DT, contacts)
    }
    settle(material)
    expect(contactCount).toBeGreaterThan(100)
    expect(material.density.some((value, index) => Math.abs(value - before[index]) > 0.01)).toBe(true)
    if (tool === 'pour') expect(material.suppliedMass).toBeGreaterThan(suppliedBefore)
    else expect(material.suppliedMass).toBe(suppliedBefore)
    conservation(material)
  }
})

test('指尖练习提速提指收细，非法或结束时间不生成接触', () => {
  const early = labDemoContacts('finger', 0.5)[0]
  const late = labDemoContacts('finger', 2.5)[0]
  expect(late.radius).toBeLessThan(early.radius)
  expect(late.strength).toBeLessThan(early.strength)
  expect(labDemoContacts('pour', NaN)).toEqual([])
  expect(labDemoContacts('edge', -1)).toEqual([])
  expect(labDemoContacts('finger', LAB_DEMO_SECONDS + 1)).toEqual([])
})
