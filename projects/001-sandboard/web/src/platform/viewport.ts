export type RenderQuality = 'balanced' | 'detail' | 'smooth'

export function drawingBuffer(width: number, height: number, deviceDpr: number, quality: RenderQuality = 'balanced') {
  if (width <= 0 || height <= 0 || !Number.isFinite(width + height)) return null
  const nativeDpr = Number.isFinite(deviceDpr) && deviceDpr > 0 ? deviceDpr : 1
  // The compact desktop preview often has DPR=1. Real 2x supersampling keeps
  // procedural grains from aliasing at that size; retain
  // an explicit lower-cost mode for devices where this delays pointer work.
  const requestedDpr = quality === 'detail' ? Math.max(2, nativeDpr) : nativeDpr
  const maximumDpr = quality === 'detail' ? 2 : quality === 'smooth' ? 1 : 1.7
  const pixelBudget = quality === 'smooth' ? 2_000_000 : 4_000_000
  const dpr = Math.min(requestedDpr, maximumDpr, Math.sqrt(pixelBudget / (width * height)))
  return { width: Math.max(1, Math.floor(width * dpr)), height: Math.max(1, Math.floor(height * dpr)), dpr }
}
