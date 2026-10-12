import { expect, test } from 'vitest'
import { SandPainting } from '../src/product/planner'
import { StageMaterial } from '../src/stage/material'

function reference(width = 64, height = 36) {
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const dark = ((x / width - .72) ** 2 / .026 + (y / height - .61) ** 2 / .084) < 1
    const density = dark ? 1.35 : x < width * .18 ? 1.1 : y > height * .72 ? .42 : .06
    const light = Math.exp(-density * 1.35), p = (y * width + x) * 4
    pixels[p] = 45 + 206 * light; pixels[p + 1] = 31 + 208 * light; pixels[p + 2] = 20 + 195 * light; pixels[p + 3] = 255
  }
  return pixels
}
test('参考引导也从空台供沙，实际留下深形、灰面与亮底并守恒', () => {
  const width = 768, height = 432
  const paint = new SandPainting(reference(), 64, 36, width, height)
  expect(paint.material.mass).toBe(0)
  while (paint.step()) {}
  const mean = (cx: number, cy: number) => {
    let sum = 0, count = 0
    for (let y = Math.floor(cy * height) - 10; y < cy * height + 10; y++) for (let x = Math.floor(cx * width) - 10; x < cx * width + 10; x++) { sum += paint.material.density[y * width + x]; count++ }
    return sum / count
  }
  expect(mean(.72, .60)).toBeGreaterThan(mean(.4, .3) + .5)
  expect(mean(.4, .84)).toBeGreaterThan(mean(.4, .3) + .12)
  expect(paint.material.pending).toBe(false)
  expect(paint.material.suppliedMass).toBeGreaterThan(1000)
  expect(Math.abs(paint.material.mass + paint.material.removedMass - paint.material.suppliedMass)).toBeLessThan(.05)
}, 20000)
test('暂停快照继续执行与不间断计算产生相同沙层和供料账', () => {
  const a = new SandPainting(reference(), 64, 36, 192, 108)
  const b = new SandPainting(reference(), 64, 36, 192, 108)
  for (let i = 0; i < 180; i++) a.step()
  const snapshot = a.read()
  b.restore(snapshot)
  while (a.step()) {}
  while (b.step()) {}
  expect(b.material.density).toEqual(a.material.density)
  expect(b.material.suppliedMass).toBe(a.material.suppliedMass)
  expect(b.material.removedMass).toBe(a.material.removedMass)
})
test('掌心收沙从沙层移出质量，旧模拟默认采样参数保持一致', () => {
  const a = new StageMaterial(64, 36), b = new StageMaterial(64, 36, 0x51a9d1, 50000)
  const contact = { tool: 'pour' as const, from: { x: .5, y: .5 }, to: { x: .5, y: .5 }, radius: .15, strength: 2 }
  for (let i = 0; i < 30; i++) { a.step(1 / 60, [contact]); b.step(1 / 60, [contact]) }
  for (let i = 0; i < 30; i++) { a.step(1 / 60, []); b.step(1 / 60, []) }
  expect(a.read()).toEqual(b.read())
  const before = a.mass
  a.collect({ x: .5, y: .5 }, { x: .6, y: .5 }, .2, 2, .1)
  expect(a.mass).toBeLessThan(before)
  expect(Math.abs(a.mass + a.removedMass - a.suppliedMass)).toBeLessThan(.002)
})
