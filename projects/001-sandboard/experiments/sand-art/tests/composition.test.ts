import { afterEach, expect, test, vi } from 'vitest'
import { createComposition, defaultConversion, pixelsToSand, previewSand, readReferenceImage, referencePlacement } from '../src/composition'

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

test('image darkness becomes editable sand, transparent pixels stay clear', () => {
  const pixels = new Uint8ClampedArray([255,255,255,255, 0,0,0,255, 0,0,0,0, 128,128,128,255])
  const state = pixelsToSand(pixels, 'lightbox')
  expect(state[0]).toBe(0); expect(state[4]).toBeCloseTo(1.25)
  expect(state[8]).toBe(0); expect(state[12]).toBeGreaterThan(0); expect(state[12]).toBeLessThan(state[4])
  expect([...state].filter((_, index) => index % 4 !== 0).every((value) => value === 0)).toBe(true)
})

test('zen sand relief and empty glass have finite nonnegative thickness', () => {
  const zen = createComposition('surface', 'zen')
  expect(zen.length).toBe(512 * 384 * 4)
  expect(zen.every(Number.isFinite)).toBe(true)
  expect(Math.min(...zen.slice(0, 4096).filter((_, index) => index % 4 === 0))).toBeGreaterThan(0)
  expect(createComposition('lightbox', 'blank').every((height) => height === 0)).toBe(true)
})

test('default conversion preserves both modes including color and partial transparency', () => {
  const pixels = new Uint8ClampedArray([255,255,255,255, 0,0,0,255, 33,170,92,128, 0,0,0,0])
  for (const mode of ['lightbox', 'surface'] as const) {
    const state = pixelsToSand(pixels, mode)
    for (let index = 0; index < pixels.length; index += 4) {
      const luminance = (pixels[index] * 2126 + pixels[index + 1] * 7152 + pixels[index + 2] * 722) / 2550000
      const darkness = (1 - luminance) * pixels[index + 3] / 255
      const expected = mode === 'lightbox' ? Math.pow(darkness, 1.4) * 1.25 : 1.4 + darkness * 1.15
      expect(state[index]).toBeCloseTo(expected, 6)
    }
    expect(pixelsToSand(pixels, mode, defaultConversion(mode))).toEqual(state)
  }
  const original = defaultConversion('surface')
  original.maxHeight = 9
  expect(defaultConversion('surface').maxHeight).toBe(2.55)
})

test('levels and gamma adjust midtones while preserving the chosen height range', () => {
  const pixels = new Uint8ClampedArray([64,64,64,255, 128,128,128,255, 192,192,192,255])
  const options = { ...defaultConversion('lightbox'), blackPoint: 64, whitePoint: 192, gamma: 1, minHeight: 0.4, maxHeight: 2.1 }
  const state = pixelsToSand(pixels, 'lightbox', options)
  expect(state[0]).toBeCloseTo(2.1)
  expect(state[4]).toBeCloseTo(1.25)
  expect(state[8]).toBeCloseTo(0.4)
  const lighter = pixelsToSand(pixels, 'lightbox', { ...options, gamma: 2 })
  const darker = pixelsToSand(pixels, 'lightbox', { ...options, gamma: 0.5 })
  expect(lighter[4]).toBeLessThan(state[4])
  expect(darker[4]).toBeGreaterThan(state[4])
  expect(lighter[0]).toBeCloseTo(2.1)
  expect(darker[8]).toBeCloseTo(0.4)
})

test('inversion never adds thickness to transparent source or letterbox pixels', () => {
  const pixels = new Uint8ClampedArray([255,255,255,255, 0,0,0,255, 255,255,255,0, 0,0,0,0])
  for (const mode of ['lightbox', 'surface'] as const) {
    const options = { ...defaultConversion(mode), invert: true }
    const state = pixelsToSand(pixels, mode, options)
    expect(state[0]).toBeCloseTo(options.maxHeight)
    expect(state[4]).toBeCloseTo(options.minHeight)
    expect(state[8]).toBeCloseTo(options.minHeight)
    expect(state[12]).toBeCloseTo(options.minHeight)
  }
})

test('invalid conversion ranges fail before a sand state is created', () => {
  const pixels = new Uint8ClampedArray([128,128,128,255])
  const valid = defaultConversion('lightbox')
  for (const change of [
    { blackPoint: -1 }, { blackPoint: 255 }, { whitePoint: 256 }, { whitePoint: 0 }, { whitePoint: Number.NaN },
    { blackPoint: 100, whitePoint: 100 }, { gamma: 0 }, { gamma: Number.POSITIVE_INFINITY },
    { minHeight: -0.1 }, { maxHeight: -1 }, { minHeight: 2, maxHeight: 1 }, { maxHeight: Number.NaN },
  ]) expect(() => pixelsToSand(pixels, 'lightbox', { ...valid, ...change })).toThrow()
  expect(() => pixelsToSand(new Uint8ClampedArray(3), 'lightbox')).toThrow(/RGBA/)
})

test('contain placement aligns landscape and portrait references with the 4:3 canvas', () => {
  expect(referencePlacement(1536, 768)).toEqual({ left: 0, top: 64, width: 512, height: 256 })
  expect(referencePlacement(768, 1536)).toEqual({ left: 160, top: 0, width: 192, height: 384 })
  expect(referencePlacement(1024, 768)).toEqual({ left: 0, top: 0, width: 512, height: 384 })
  expect(() => referencePlacement(0, 500)).toThrow()
  expect(() => referencePlacement(500, Number.POSITIVE_INFINITY)).toThrow()
})

test('reference import retains the original blob and transparent padding until explicit conversion', async () => {
  const blob = new Blob(['local-png'], { type: 'image/png' })
  const close = vi.fn()
  const bitmap = { width: 1536, height: 768, close }
  const imagePixels = new Uint8ClampedArray(512 * 384 * 4)
  const context = {
    clearRect: vi.fn(),
    drawImage: vi.fn((_bitmap: unknown, left: number, top: number, width: number, height: number) => {
      for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) {
        const index = (y * 512 + x) * 4
        imagePixels[index] = 255; imagePixels[index + 1] = 255; imagePixels[index + 2] = 255; imagePixels[index + 3] = 255
      }
    }),
    getImageData: vi.fn(() => ({ data: imagePixels })),
  }
  vi.stubGlobal('createImageBitmap', vi.fn(async () => bitmap))
  vi.stubGlobal('document', { createElement: vi.fn(() => ({ width: 0, height: 0, getContext: () => context })) })
  const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:reference-original')
  const reference = await readReferenceImage(blob, '横幅参考')
  expect(reference.blob).toBe(blob)
  expect(reference.name).toBe('横幅参考')
  expect(reference.url).toBe('blob:reference-original')
  expect(createUrl).toHaveBeenCalledWith(blob)
  expect(context.clearRect).toHaveBeenCalledWith(0, 0, 512, 384)
  expect(context.drawImage).toHaveBeenCalledWith(bitmap, 0, 64, 512, 256)
  expect(close).toHaveBeenCalledOnce()
  const inverted = pixelsToSand(reference.pixels, 'lightbox', { ...defaultConversion('lightbox'), invert: true })
  expect(inverted[0]).toBe(0)
  expect(inverted[(64 * 512) * 4]).toBeCloseTo(1.25)
})

test('image import rejects unsupported formats and oversized files before decoding', async () => {
  const decode = vi.fn()
  vi.stubGlobal('createImageBitmap', decode)
  await expect(readReferenceImage(new Blob(['x'], { type: 'image/svg+xml' }))).rejects.toThrow(/PNG/)
  await expect(readReferenceImage(new Blob([new Uint8Array(20 * 1024 * 1024 + 1)], { type: 'image/png' }))).rejects.toThrow(/20 MB/)
  expect(decode).not.toHaveBeenCalled()
})

test('2D preview is opaque and shows thicker lightbox sand as darker', () => {
  const state = new Float32Array([0,0,0,0, 0.2,0,0,0, 1.25,0,0,0])
  const preview = previewSand(state, 'lightbox')
  expect(preview[0]).toBeGreaterThan(preview[4])
  expect(preview[4]).toBeGreaterThan(preview[8])
  expect([preview[3], preview[7], preview[11]]).toEqual([255,255,255])
  expect(() => previewSand(new Float32Array([-1,0,0,0]), 'surface')).toThrow()
  expect(() => previewSand(new Float32Array(3), 'lightbox')).toThrow()
})
