import { beforeEach, expect, test, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { StageMaterial } from '../src/stage/material'

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); vi.resetModules() })
test('创作台保存独立快照，刷新读取能接着落沙而不改变 v7 草稿', async () => {
  const { readProductDraft, writeProductDraft } = await import('../src/product/storage')
  const { loadStageDraft, saveStageDraft } = await import('../src/stage/storage')
  const previous = new StageMaterial(32, 18)
  previous.step(.05, [{ tool: 'pour', from: { x: .3, y: .4 }, to: { x: .4, y: .4 }, radius: .1, strength: 2 }])
  const original = previous.read()
  await saveStageDraft(original)
  expect(await readProductDraft()).toBeUndefined()
  const draft = { version: 1 as const, title: '我的归舟', savedAt: '2026-10-08T14:00:00.000Z', snapshot: previous.read() }
  await writeProductDraft(draft)
  draft.snapshot.density.fill(9); draft.snapshot.particles.length = 0
  const loaded = await readProductDraft()
  expect(loaded?.snapshot).toEqual(original)
  const restored = new StageMaterial(32, 18); restored.restore(loaded!.snapshot)
  for (let i = 0; i < 30; i++) { previous.step(1 / 60, []); restored.step(1 / 60, []) }
  expect(restored.read()).toEqual(previous.read())
  expect(await loadStageDraft()).toEqual(original)
})
test('再次保存替换当前创作台草稿，包括名称与随机状态', async () => {
  const { readProductDraft, writeProductDraft } = await import('../src/product/storage')
  const material = new StageMaterial(16, 9)
  const a = { version: 1 as const, title: '初稿', savedAt: '2026-10-08T14:00:00.000Z', snapshot: material.read() }
  await writeProductDraft(a)
  material.step(.1, [{ tool: 'pour', from: { x: .5, y: .5 }, to: { x: .5, y: .5 }, radius: .1, strength: 3 }])
  const b = { ...a, title: '完成稿', snapshot: material.read() }
  await writeProductDraft(b)
  expect(await readProductDraft()).toEqual(b)
})
