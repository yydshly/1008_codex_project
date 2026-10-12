import { expect, test } from 'vitest'
import { GesturePainting } from '../src/product/gestures'
import { gestureStudies } from '../src/product/studies'

function mean(painting: GesturePainting, x: number, y: number) {
  const m = painting.material
  let total = 0, count = 0
  for (let row = Math.floor(y * m.height) - 3; row <= y * m.height + 3; row++) for (let column = Math.floor(x * m.width) - 3; column <= x * m.width + 3; column++) {
    total += m.density[row * m.width + column]; count++
  }
  return total / count
}

test.each(gestureStudies)('$title 从空台真实塑形、末态落定、供沙与移出账守恒', score => {
  const painting = new GesturePainting(score)
  expect(painting.material.mass).toBe(0)
  let beforeOpening = 0
  while (painting.step()) {
    if (score.id === 'bridge' && painting.tick === score.chapters[2].tick) beforeOpening = mean(painting, .52, .56)
  }
  expect(painting.material.pending).toBe(false)
  expect(painting.material.density.every(v => Number.isFinite(v) && v >= 0)).toBe(true)
  expect(Math.abs(painting.material.mass + painting.material.removedMass - painting.material.suppliedMass)).toBeLessThan(.12)
  if (score.id === 'willow') expect(mean(painting, .27, .63)).toBeGreaterThan(mean(painting, .70, .83) + .6)
  if (score.id === 'bridge') {
    expect(beforeOpening).toBeGreaterThan(mean(painting, .52, .56) + .4)
    expect(mean(painting, .52, .32)).toBeGreaterThan(mean(painting, .52, .56) + .3)
  }
  if (score.id === 'portrait') {
    expect(mean(painting, .40, .42)).toBeGreaterThan(mean(painting, .61, .47) + .35)
    expect(mean(painting, .61, .47)).toBeGreaterThan(mean(painting, .78, .45) + .08)
  }
}, 20000)

test('揉沙中途快照续算一致，演出之间拒绝误用检查点', () => {
  const score = gestureStudies[2], rub = score.strokes.find(s => s.tool === 'rub')!
  const a = new GesturePainting(score), b = new GesturePainting(score)
  while (a.tick < Math.round((rub.start + .5) * 60)) a.step()
  b.restore(a.read())
  for (let i = 0; i < 200; i++) { a.step(); b.step() }
  expect(b.read()).toEqual(a.read())
  expect(() => new GesturePainting(gestureStudies[0]).restore(a.read())).toThrow('状态')
}, 12000)
