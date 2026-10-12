import { expect, test } from 'vitest'
import { GesturePainting, gestureChapters, gestureStrokes, GESTURE_TICKS, sampleGestures } from '../src/product/gestures'
import { PRODUCT_STEP } from '../src/product/planner'

test('手势脚本按景物造型推进，同一时刻只有一笔，抬手不留跨画面连线', () => {
  expect(gestureChapters.map(c => c.label)).toEqual(['天光与远岸', '近岸与水路', '柳干与垂枝', '石桥与月色', '归舟与水纹'])
  expect(sampleGestures(0).stroke).toBeNull()
  expect(sampleGestures(GESTURE_TICKS).hand).toBeNull()
  let previous = sampleGestures(0), maxLength = 0, lifted = 0
  for (let tick = 1; tick <= GESTURE_TICKS; tick++) {
    const sample = sampleGestures(tick)
    if (!sample.stroke) { lifted++; expect(sample.hand?.down ?? false).toBe(false) }
    else {
      expect(sample.hand?.down).toBe(true)
      const q = sample.hand!
      expect(q.x).toBeGreaterThanOrEqual(0); expect(q.x).toBeLessThanOrEqual(1)
      expect(q.y).toBeGreaterThanOrEqual(0); expect(q.y).toBeLessThanOrEqual(1)
      if (previous.index === sample.index && previous.stroke) maxLength = Math.max(maxLength, Math.hypot(q.x - previous.hand!.x, q.y - previous.hand!.y))
    }
    previous = sample
  }
  expect(maxLength).toBeLessThan(.035)
  expect(lifted).toBeGreaterThan(500)
  expect(gestureStrokes.some(s => s.tool === 'sweep')).toBe(true)
  expect(gestureStrokes.some(s => s.tool === 'finger')).toBe(true)
  expect(gestureStrokes.some(s => s.tool === 'collect')).toBe(true)
})

test('从空台经真实工具形成暗柳、舟身与亮江面，手中沙量有限且材料账守恒', () => {
  const painting = new GesturePainting()
  expect(painting.material.mass).toBe(0)
  while (painting.step()) { expect(painting.sandFraction).toBeGreaterThanOrEqual(0); expect(painting.sandFraction).toBeLessThanOrEqual(1) }
  const mean = (cx: number, cy: number) => {
    const material = painting.material
    let sum = 0, count = 0
    for (let y = Math.floor(cy * material.height) - 4; y <= cy * material.height + 4; y++) for (let x = Math.floor(cx * material.width) - 4; x <= cx * material.width + 4; x++) { sum += material.density[y * material.width + x]; count++ }
    return sum / count
  }
  expect(mean(.069, .48)).toBeGreaterThan(mean(.50, .71) + .7)
  expect(mean(.80, .856)).toBeGreaterThan(mean(.50, .71) + .4)
  expect(painting.material.pending).toBe(false)
  expect(Math.abs(painting.material.mass + painting.material.removedMass - painting.material.suppliedMass)).toBeLessThan(.1)
}, 20000)

test('手势与剩余沙量快照可确定性续算，进度重建不会漏笔或重复供沙', () => {
  const a = new GesturePainting(), b = new GesturePainting()
  const tick = Math.round((gestureStrokes[13].start + .35) / PRODUCT_STEP)
  for (let i = 0; i < tick; i++) a.step()
  b.restore(a.read())
  for (let i = 0; i < 300; i++) { a.step(); b.step() }
  expect(b.read()).toEqual(a.read())
  expect(() => b.restore({ ...b.read(), remaining: Infinity })).toThrow('状态')
})
