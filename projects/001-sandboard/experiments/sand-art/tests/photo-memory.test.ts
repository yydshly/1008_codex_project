import { beforeEach, expect, test, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { StageMaterial } from '../src/stage/material'
import { coverCrop, photoToSnapshot, sandPixels, settingsFor, validSettings } from '../src/memories/model'
import { decodePhotoProject, encodePhotoProject, standaloneExhibition } from '../src/memories/export'

function fixture(width = 48, height = 32) {
  const p = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4, n = 25 + x / width * 215
    p[i] = p[i + 1] = p[i + 2] = n; p[i + 3] = 255
  }
  return p
}
test('照片影调映射为可编辑厚度，供沙账等于沙层总量', () => {
  const state = photoToSnapshot(fixture(), 48, 32, settingsFor())
  const material = new StageMaterial(48, 32); material.restore(state)
  expect(state.density[12 * 48 + 6]).toBeGreaterThan(state.density[12 * 48 + 40])
  expect(state.density.every(v => Number.isFinite(v) && v >= 0 && v <= 2.8)).toBe(true)
  expect(material.mass).toBe(state.suppliedMass)
  expect(material.pending).toBe(false)
  material.collect({ x: .2, y: .5 }, { x: .3, y: .5 }, .1, 1, .05)
  expect(material.removedMass).toBeGreaterThan(0)
  expect(material.mass + material.removedMass).toBeCloseTo(state.suppliedMass, 5)
})
test('透明照片区域按白底处理；平坦图片不会除零或伪造边缘', () => {
  const p = new Uint8ClampedArray(24 * 16 * 4)
  const transparent = photoToSnapshot(p, 24, 16, settingsFor())
  expect(transparent.density.every(v => v === 0)).toBe(true)
  for (let i = 0; i < p.length; i += 4) { p[i] = p[i + 1] = p[i + 2] = 120; p[i + 3] = 255 }
  const gray = photoToSnapshot(p, 24, 16, settingsFor())
  expect(new Set(gray.density).size).toBe(1)
})
test('情绪预设改变明暗和调色，颗粒强度实际改变输出', () => {
  const a = photoToSnapshot(fixture(), 48, 32, settingsFor('quiet'))
  const b = photoToSnapshot(fixture(), 48, 32, settingsFor('bold'))
  expect(a.density).not.toEqual(b.density)
  expect(sandPixels(a, settingsFor('quiet'))).not.toEqual(sandPixels(a, settingsFor('warm')))
  expect(sandPixels(a, { ...settingsFor(), grain: 0 })).not.toEqual(sandPixels(a, { ...settingsFor(), grain: 1 }))
})
test('横竖裁切保持比例、位置和边界，不拉伸主体', () => {
  const a = coverCrop(1600, 1000, 640, 800, 1, 1, .5)
  expect(a.width / a.height).toBeCloseTo(.8)
  expect(a.x + a.width).toBeCloseTo(1600)
  expect(a.height).toBe(1000)
  const b = coverCrop(1600, 1000, 768, 512, 2, 0, 1)
  expect(b.x).toBe(0); expect(b.y + b.height).toBeCloseTo(1000)
  expect(() => coverCrop(0, 1000, 768, 512)).toThrow()
})
test('工程往返保持全部材料状态，恶意原照 URL 和无效密度被拒绝', () => {
  const data = { format: 'sandboard-photo' as const, version: 1 as const, title: '旧日光影', caption: '这一刻', sourceKind: 'photo' as const,
    settings: settingsFor(), snapshot: photoToSnapshot(fixture(), 48, 32, settingsFor()) }
  const text = encodePhotoProject(data)
  expect(decodePhotoProject(text)).toEqual(data)
  const invalid = JSON.parse(text); invalid.snapshot.density[0] = -1
  expect(() => decodePhotoProject(JSON.stringify(invalid))).toThrow()
  expect(() => decodePhotoProject(JSON.stringify({ ...JSON.parse(text), source: 'javascript:alert(1)' }))).toThrow()
  expect(validSettings({ ...settingsFor(), zoom: Infinity })).toBe(false)
})
test('离线展览默认不包含原照，标题和叙述不会变成 HTML 指令', () => {
  const image = 'data:image/png;base64,AAAA'
  const html = standaloneExhibition('<script>恶意</script>', '<img src=x onerror=alert(1)>', 'memory', image)
  expect(html).toContain('&lt;script&gt;')
  expect(html).not.toContain('<script>恶意')
  expect(html).not.toContain('class="original"')
  expect(html).not.toContain('http')
  const withSource = standaloneExhibition('记忆', '', 'warm', image, 'data:image/jpeg;base64,BBBB', true)
  expect(withSource).toContain('class="original"')
  expect(withSource).toContain('AI 生成的虚构场景')
})
beforeEach(() => { globalThis.indexedDB = new IDBFactory(); vi.resetModules() })
test('作品集独立存储，多件收藏与更新不覆盖手势创作台草稿', async () => {
  const { savePhotoWork, listPhotoWorks, readPhotoWork } = await import('../src/memories/storage')
  const { writeProductDraft, readProductDraft } = await import('../src/product/storage')
  const state = photoToSnapshot(fixture(), 48, 32, settingsFor())
  const draft = { version: 1 as const, title: '旧归舟草稿', savedAt: '2026-10-09', snapshot: state }
  await writeProductDraft(draft)
  const a = { version: 1 as const, id: 'a', title: '第一幅', caption: '记忆', createdAt: '2026-10-09T01:00:00Z', updatedAt: '2026-10-09T01:00:00Z',
    sourceKind: 'photo' as const, source: undefined, image: new Blob(['image']), settings: settingsFor(), snapshot: state }
  await savePhotoWork(a)
  await savePhotoWork({ ...a, id: 'b', title: '第二幅', updatedAt: '2026-10-09T02:00:00Z' })
  expect((await listPhotoWorks()).map(w => w.id)).toEqual(['b', 'a'])
  const updated = { ...a, title: '第一幅的修画', updatedAt: '2026-10-09T03:00:00Z' }
  await savePhotoWork(updated)
  expect((await listPhotoWorks()).length).toBe(2)
  expect((await readPhotoWork('a'))?.snapshot).toEqual(state)
  expect((await readPhotoWork('a'))?.title).toBe(updated.title)
  expect(await readProductDraft()).toEqual(draft)
})
