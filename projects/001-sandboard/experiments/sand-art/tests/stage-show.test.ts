import { describe, expect, it } from 'vitest'
import { chapters, sampleShow, SHOW_DURATION, SHOW_STEP } from '../src/stage/show'
import { StageMaterial } from '../src/stage/material'

describe('灯箱沙画连续演出', () => {
  it('从空台的抓沙开始，三幕留在同一张沙台，最后静置', () => {
    expect(SHOW_DURATION).toBeGreaterThanOrEqual(45)
    expect(SHOW_DURATION).toBeLessThanOrEqual(60)
    expect(chapters).toHaveLength(3)
    expect(chapters.map(item => item.time)).toEqual([0, 18, 36])
    expect(sampleShow(0).contacts).toEqual([])
    expect(sampleShow(0).hand?.down).toBe(false)
    expect(sampleShow(0.9).contacts[0].tool).toBe('pour')
    expect(sampleShow(SHOW_DURATION).contacts).toEqual([])
    expect(sampleShow(SHOW_DURATION).hand).toBeNull()
    expect(sampleShow(SHOW_DURATION).instruction).toContain('归舟')
  })

  it('每幕都实际撒沙和移动已有沙，只有手势数据而没有成品图切换', () => {
    const tools = [new Set<string>(), new Set<string>(), new Set<string>()]
    for (let tick = 0; tick <= SHOW_DURATION / SHOW_STEP; tick++) {
      const sample = sampleShow(tick * SHOW_STEP)
      for (const contact of sample.contacts) tools[sample.chapter].add(contact.tool)
      expect(Object.keys(sample).sort()).toEqual(['chapter', 'contacts', 'hand', 'instruction', 'title'])
    }
    for (const chapter of tools) {
      expect(chapter.has('pour')).toBe(true)
      expect(chapter.has('finger')).toBe(true)
    }
    expect(tools[0].has('edge')).toBe(true)
    expect(tools[1].has('sweep')).toBe(true)
  })

  it('全程使用有效归一化坐标、有限流量与可跟随的连续路径', () => {
    let count = 0, maxLength = 0
    for (let tick = 0; tick <= SHOW_DURATION / SHOW_STEP; tick++) {
      const sample = sampleShow(tick * SHOW_STEP)
      expect(sample.contacts.length).toBeLessThanOrEqual(1)
      for (const contact of sample.contacts) {
        count++
        for (const p of [contact.from, contact.to]) {
          expect(p.x).toBeGreaterThanOrEqual(0)
          expect(p.x).toBeLessThanOrEqual(1)
          expect(p.y).toBeGreaterThanOrEqual(0)
          expect(p.y).toBeLessThanOrEqual(1)
        }
        expect(contact.radius).toBeGreaterThan(0)
        expect(contact.radius).toBeLessThan(0.2)
        expect(contact.strength).toBeGreaterThan(0)
        expect(contact.strength).toBeLessThanOrEqual(3)
        maxLength = Math.max(maxLength, Math.hypot(contact.to.x - contact.from.x, contact.to.y - contact.from.y))
        expect(sample.hand?.x).toBe(contact.to.x)
        expect(sample.hand?.y).toBe(contact.to.y)
        expect(sample.hand?.down).toBe(true)
      }
    }
    expect(count).toBeGreaterThan(2500)
    expect(maxLength).toBeLessThan(0.07)
  })

  it('固定步采样可重复，抬手不会把下一笔连成跨画面的线', () => {
    for (const time of [0.9, 9.4, 11.1, 14.8, 20.6, 31.23, 39.12, 47.99, 51.2]) {
      expect(sampleShow(time)).toEqual(sampleShow(time))
      const a = sampleShow(time).contacts[0], b = sampleShow(time - SHOW_STEP).contacts[0]
      expect(a).toBeDefined()
      if (b && sampleShow(time).instruction === sampleShow(time - SHOW_STEP).instruction) {
        expect(a.from.x).toBeCloseTo(b.to.x, 10)
        expect(a.from.y).toBeCloseTo(b.to.y, 10)
      }
    }
    const first = sampleShow(26.0).contacts[0]
    expect(first.from).toEqual(first.to)
  })

  it('无效和越界时间收敛为有意义的开场或留画', () => {
    expect(sampleShow(Number.NaN)).toEqual(sampleShow(0))
    expect(sampleShow(-100)).toEqual(sampleShow(0))
    expect(sampleShow(1000)).toEqual(sampleShow(SHOW_DURATION))
    expect(sampleShow(18).chapter).toBe(1)
    expect(sampleShow(36).chapter).toBe(2)
  })

  it('实际材料由铺沙连续成画：月亮透光，柳干与船身较水面更暗，最后无悬沙', () => {
    const sand = new StageMaterial(384, 288)
    const massAtChapters: number[] = []
    for (let tick = 1; tick <= SHOW_DURATION / SHOW_STEP; tick++) {
      sand.step(SHOW_STEP, sampleShow(tick * SHOW_STEP).contacts)
      if (tick === 18 / SHOW_STEP || tick === 36 / SHOW_STEP) massAtChapters.push(sand.mass)
    }
    const average = (cx: number, cy: number, rx: number, ry = rx) => {
      let total = 0, count = 0
      for (let y = Math.floor((cy - ry) * sand.height); y <= Math.ceil((cy + ry) * sand.height); y++) {
        for (let x = Math.floor((cx - rx) * sand.width); x <= Math.ceil((cx + rx) * sand.width); x++) {
          if (x < 0 || x >= sand.width || y < 0 || y >= sand.height) continue
          total += sand.density[y * sand.width + x]
          count++
        }
      }
      return total / count
    }
    expect(massAtChapters[0]).toBeGreaterThan(1000)
    expect(massAtChapters[1]).toBeGreaterThan(massAtChapters[0])
    expect(sand.mass).toBeGreaterThan(massAtChapters[1])
    expect(sand.pending).toBe(false)
    expect(average(0.765, 0.195, 0.015, 0.02)).toBeLessThan(average(0.70, 0.20, 0.025))
    expect(average(0.133, 0.80, 0.014, 0.025)).toBeGreaterThan(average(0.34, 0.85, 0.04))
    expect(average(0.57, 0.876, 0.035, 0.015)).toBeGreaterThan(average(0.80, 0.85, 0.035))
  })
})
