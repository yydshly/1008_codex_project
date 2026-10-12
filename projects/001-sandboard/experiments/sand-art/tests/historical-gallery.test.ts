import { expect, test } from 'vitest'
import { access } from 'node:fs/promises'
import { historicalWorks, selectHistoricalWorks, historicalRecord } from '../src/gallery/history'
import { readProductEntry } from '../src/product/entry'
import { gestureScores } from '../src/product/studies'

const scores = gestureScores.map(score => score.id)
test('历史目录覆盖所有版本，参考图不会冒充可编辑沙层，媒体与来源记录存在', async () => {
  expect(new Set(historicalWorks.flatMap(work => work.versions))).toEqual(new Set(Array.from({ length: 36 }, (_, i) => i + 1)))
  expect(new Set(historicalWorks.map(work => work.id)).size).toBe(historicalWorks.length)
  for (const work of historicalWorks) {
    if (work.kind === 'target') { expect(work.platform).toBeUndefined(); expect(work.process).toBeUndefined() }
    const image = work.image.startsWith('generated-sandboard/')
      ? new URL('../public/' + work.image, import.meta.url) : new URL('../../../assets/' + work.image, import.meta.url)
    await access(image)
    await access(new URL('../public/research-records/' + work.recordId + '.md', import.meta.url))
    expect(historicalRecord(work)).toMatch(/^research\/#v\d+$/)
    if (work.video) await access(new URL('../../../assets/' + work.video, import.meta.url))
  }
  expect(historicalWorks.filter(work => work.video)).toHaveLength(11)
  expect(selectHistoricalWorks('photo', 'v14')[0].title).toContain('雨窗')
  expect(selectHistoricalWorks('all', '', 'target')).toHaveLength(3)
})
test('七件可接管作品的画台与成画入口指向同一编排和对应参考，不会落到默认侧脸', () => {
  const editable = historicalWorks.filter(work => work.kind === 'editable')
  expect(editable).toHaveLength(7)
  for (const work of editable) {
    const finished = readProductEntry(new URL(work.platform!, 'https://example.test/art/').hash, scores, 3)!
    const process = readProductEntry(new URL(work.process!, 'https://example.test/art/').hash, scores, 3)!
    expect(finished.view).toBe('finished'); expect(process.view).toBe('process')
    expect({ ...finished, view: undefined }).toEqual({ ...process, view: undefined })
  }
  expect(readProductEntry('#score=willow&view=finished', scores, 3)?.score).toBe('willow')
  expect(readProductEntry('#score=bridge&view=process', scores, 3)?.score).toBe('bridge')
  expect(readProductEntry('#reference=2&view=finished', scores, 3)?.reference).toBe(2)
})
test('未知作品与不合法参考编号不替换原入口；原pause参数仍由原页面处理', () => {
  for (const hash of ['#pause', '#score=missing', '#reference=-1', '#reference=3', '#reference=1.5', '#reference=', '#work=private-id'])
    expect(readProductEntry(hash, scores, 3)).toBeUndefined()
  expect(readProductEntry('#score=boat&view=paused', scores, 3)?.view).toBe('paused')
})
