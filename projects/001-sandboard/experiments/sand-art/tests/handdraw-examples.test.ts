import { beforeEach, expect, test, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { GRID_HEIGHT, GRID_WIDTH } from '../src/model'
import { handExamples, examplePath } from '../src/examples/catalog'
import { examplePaths, pathContact } from '../src/examples/score'
import type { SavedArt } from '../src/storage'

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); vi.resetModules() })
function art(title: string, tool: SavedArt['settings']['tool'] = 'rake'): SavedArt {
  const state = new Float32Array(GRID_WIDTH * GRID_HEIGHT * 4); state[0] = 2
  return { version: 1, width: GRID_WIDTH, height: GRID_HEIGHT, mode: 'surface', state: state.buffer,
    savedAt: '2026-10-10T12:00:00Z', title, settings: { tool, radius: 28, strength: .7, wetness: 0, wind: 0, light: 'noon' } }
}
test('示例编辑暂存与原草稿、命名作品隔离，保存副本和恢复示例均不覆盖原作', async () => {
  const { writeWorkspaceDraft, readExampleDraft } = await import('../src/examples/storage')
  const { savePainting, loadArt, loadPainting, listPaintings } = await import('../src/storage')
  const original = art('原沙面作品', 'push')
  await writeWorkspaceDraft(original)
  const originalId = await savePainting(original, original.title!)
  const example = art('沙耙试画')
  example.state = example.state.slice(0); new Float32Array(example.state)[0] = 3
  await writeWorkspaceDraft(example, 'rake')
  expect(await readExampleDraft('rake')).toEqual(example)
  expect(await loadArt('surface')).toEqual(original)
  const ownId = await savePainting(example, '我的沙耙试画')
  expect(ownId).not.toBe(originalId)
  await writeWorkspaceDraft({ ...example, paintingId: ownId }, 'rake')
  await writeWorkspaceDraft(art('原始沙耙示例'), 'rake')
  expect((await loadPainting(originalId))?.state).toEqual(original.state)
  expect((await loadPainting(ownId))?.state).toEqual(example.state)
  expect(await loadArt('surface')).toEqual(original)
  expect(await listPaintings()).toHaveLength(2)
  await expect(writeWorkspaceDraft(example, 'unknown')).rejects.toThrow('示例')
})
test('七工具均有实际输入小样，原两幅预设保持其原构图入口', () => {
  expect(handExamples).toHaveLength(9)
  expect(new Set(handExamples.map(example => example.tool)).size).toBe(7)
  expect(handExamples.filter(example => example.preset).map(example => example.preset)).toEqual(['zen', 'moon'])
  for (const example of handExamples.filter(example => !example.preset)) {
    const paths = examplePaths(example)
    expect(paths.some(path => path.tool === example.tool)).toBe(true)
    for (const path of paths) for (const tick of [0, Math.floor(path.ticks / 2), path.ticks - 1]) {
      const contact = pathContact(path, tick, example)
      expect(contact.radius).toBeGreaterThan(0)
      for (const point of [contact.from, contact.to]) {
        expect(point.x).toBeGreaterThanOrEqual(0); expect(point.x).toBeLessThanOrEqual(GRID_WIDTH)
        expect(point.y).toBeGreaterThanOrEqual(0); expect(point.y).toBeLessThanOrEqual(GRID_HEIGHT)
      }
    }
    expect(examplePath(example.id)).toBe('#example=' + example.id)
  }
  expect(() => examplePath('../unknown')).toThrow('示例')
})
