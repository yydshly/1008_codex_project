import { expect, test } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { choreographPhoto } from '../src/memories/photo-choreography'
import { decodePortraitPlan, StructuredPainting, type StructuredStroke } from '../src/memories/structured-painting'

const score = () => decodePortraitPlan(readFileSync('../../assets/material-realism-v17/natural-window-score.json', 'utf8'))
test('局部编排保留每一笔、前四章与章节时长，空移距离实际减少', () => {
  const original = score(), compiled = choreographPhoto(original)
  expect(compiled.moved).toBeGreaterThan(0)
  expect(compiled.after / compiled.before).toBeLessThan(.8)
  expect(compiled.plan.phaseStarts).toEqual(original.phaseStarts)
  expect(compiled.plan.totalTicks).toBe(original.totalTicks)
  expect(new Set(compiled.order).size).toBe(original.strokes.length)
  for (let i = 0; i < original.strokes.length; i++) {
    expect(compiled.plan.strokes[i]).toBe(original.strokes[compiled.order[i]])
    if (original.strokes[i].phase < 4 || original.strokes[i].finish !== 'settle') expect(compiled.order[i]).toBe(i)
  }
  expect(decodePortraitPlan(JSON.stringify(compiled.plan))).toEqual(compiled.plan)
})
test('完整回放检查重编排的成品差异、守恒与重播，不能只凭空移距离放行', () => {
  const original = score(), compiled = choreographPhoto(original)
  const baseline = new StructuredPainting(original), candidate = new StructuredPainting(compiled.plan)
  while (baseline.step()) {} while (candidate.step()) {}
  let sum = 0, face = 0, hands = 0, faceCount = 0, handsCount = 0
  const errors: number[] = [], width = original.width!, height = original.height!
  for (let i = 0; i < baseline.material.density.length; i++) {
    const e = Math.abs(Math.exp(-baseline.material.density[i] * 1.35) - Math.exp(-candidate.material.density[i] * 1.35))
    sum += e; errors.push(e)
    const x = i % width / width, y = Math.floor(i / width) / height
    if (x >= .545 && x < .718 && y >= .19 && y < .486) { face += e; faceCount++ }
    if (x >= .478 && x < .707 && y >= .512 && y < .813) { hands += e; handsCount++ }
  }
  errors.sort((a, b) => a - b)
  const report = { strokes: original.strokes.length, moved: compiled.moved, beforePx: compiled.before, afterPx: compiled.after,
    travelReduction: 1 - compiled.after / compiled.before, opticalMAE: sum / errors.length,
    opticalP95: errors[Math.floor(errors.length * .95)], faceMAE: face / faceCount, handsMAE: hands / handsCount,
    totalTicks: candidate.totalTicks, suppliedMass: candidate.material.suppliedMass, removedMass: candidate.material.removedMass,
    mass: candidate.material.mass, pending: candidate.material.pending }
  console.info(JSON.stringify(report))
  expect(report.opticalMAE).toBeLessThan(.008)
  expect(report.opticalP95).toBeLessThan(.035)
  expect(report.faceMAE).toBeLessThan(.025); expect(report.handsMAE).toBeLessThan(.025)
  expect(report.pending).toBe(false)
  expect(report.mass + report.removedMass).toBeCloseTo(report.suppliedMass, 1)
  const final = candidate.material.read(), target = candidate.rewindTo(candidate.totalTicks - 700)
  while (candidate.tick < target) candidate.step(); while (candidate.step()) {}
  expect(candidate.material.read()).toEqual(final)
  if (process.env.SAND_CHOREOGRAPHY_REPORT) writeFileSync(process.env.SAND_CHOREOGRAPHY_REPORT, JSON.stringify(report, null, 2) + '\n')
}, 45000)

test('重叠的添沙与收沙保持先后顺序，旧工程不自动改编', () => {
  const p = score(), fine = (x: number, tool: StructuredStroke['tool']): StructuredStroke => ({phase:4,region:'face',tool,
    path:[{x,y:.4},{x:x+.005,y:.4}],sigma:1,budget:1,ticks:9,finish:'settle'})
  const strokes = [fine(.2,'pour'),fine(.8,'pour'),fine(.201,'collect'),fine(.81,'collect')]
  const compiled = choreographPhoto({...p,strokes})
  expect(compiled.order.indexOf(0)).toBeLessThan(compiled.order.indexOf(2))
  expect(compiled.order.indexOf(1)).toBeLessThan(compiled.order.indexOf(3))
  const legacy = {...p,strokes:strokes.map(({finish: _finish,...stroke})=>stroke)}
  expect(choreographPhoto(legacy).plan).toBe(legacy)
})
