import { expect, test } from 'vitest'
import { StageMaterial } from '../src/stage/material'

test('均匀灰面在反复揉沙与移动接触后保持原厚度', () => {
  const m = new StageMaterial(96, 72)
  m.density.fill(.7)
  const before = m.density.slice()
  for (let i = 0; i < 100; i++) m.step(1 / 60, [{ tool: 'rub', from: { x: .3 + i * .003, y: .5 }, to: { x: .303 + i * .003, y: .5 }, radius: .12, strength: 3, aspect: .6 }])
  expect(m.density).toEqual(before)
})

test('揉沙降低局部尖峰，把沙分到邻格，闭合接触保持质量和非负值', () => {
  const m = new StageMaterial(96, 72)
  m.density.fill(.3)
  const center = 36 * 96 + 48
  m.density[center] = 8
  const initial = m.mass
  for (let i = 0; i < 100; i++) m.step(1 / 60, [{ tool: 'rub', from: { x: .5, y: .5 }, to: { x: .5, y: .5 }, radius: .12, strength: 2 }])
  expect(m.density[center]).toBeLessThan(1.5)
  expect(m.density[center + 2]).toBeGreaterThan(.3)
  expect(Math.abs(m.mass - initial)).toBeLessThan(.005)
  expect(m.suppliedMass).toBe(0); expect(m.removedMass).toBe(0)
  expect(m.density.every(v => Number.isFinite(v) && v >= 0)).toBe(true)
})

test('椭圆揉沙随掌形转向，台边揉沙保持沙量', () => {
  const a = new StageMaterial(96, 72), b = new StageMaterial(96, 72)
  for (let y = 0; y < 72; y++) for (let x = 0; x < 96; x++) a.density[y * 96 + x] = b.density[y * 96 + x] = (x + y) % 3 ? .3 : 1.2
  const initial = a.mass
  const common = { tool: 'rub' as const, from: { x: .025, y: .5 }, to: { x: .025, y: .5 }, radius: .17, strength: 2, aspect: .4 }
  for (let i = 0; i < 100; i++) { a.step(1 / 60, [{ ...common, angle: 0 }]); b.step(1 / 60, [{ ...common, angle: Math.PI / 2 }]) }
  expect(a.density).not.toEqual(b.density)
  expect(a.removedMass).toBe(0)
  expect(Math.abs(a.mass + a.removedMass - initial)).toBeLessThan(.015)
  expect(Math.abs(b.mass + b.removedMass - initial)).toBeLessThan(.015)
})

test('可选聚团和椭圆供料确定性重现，宽散仍保持实际供沙总量', () => {
  const a = new StageMaterial(128, 96), b = new StageMaterial(128, 96)
  const contact = { tool: 'pour' as const, from: { x: .4, y: .5 }, to: { x: .6, y: .5 }, radius: .09, strength: 1.5, spread: .8, cluster: .85, angle: .6, aspect: .55 }
  for (let i = 0; i < 75; i++) { const contacts = i < 40 ? [contact] : []; a.step(1 / 60, contacts); b.step(1 / 60, contacts) }
  expect(a.read()).toEqual(b.read())
  expect(a.pending).toBe(false)
  expect(Math.abs(a.mass + a.removedMass - a.suppliedMass)).toBeLessThan(.015)
})
