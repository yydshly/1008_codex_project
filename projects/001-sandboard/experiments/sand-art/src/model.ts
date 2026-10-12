// 独立沙画实验。参考 Sandboard 489cb01 的高度场与守恒输运设计；见项目 LICENSE。
export const GRID_WIDTH = 512
export const GRID_HEIGHT = 384
export const FIXED_STEP = 1 / 120
export const MAX_STEPS = 4
export const MAX_CONTACTS = 8
export type ArtMode = 'surface' | 'lightbox'
export type ArtTool = 'pour' | 'push' | 'scrape' | 'rake' | 'stamp' | 'smooth' | 'palm'
export type LightPreset = 'noon' | 'sunset' | 'moon'
export const toolCodes: Record<ArtTool, number> = { pour: 0, push: 1, scrape: 2, rake: 3, stamp: 4, smooth: 5, palm: 6 }
export type ArtPoint = { x: number; y: number }
export type PourStyle = 'stream' | 'scatter' | 'handful'
export type ArtPour = {
  style: PourStyle
  /** Hand height and lateral opening, both normalized to 0–1. */
  height: number
  spread: number
  /** One release event; a handful with no burst emits no sand. */
  burst?: number
  /** New natural packet distribution; omit to reproduce older recordings. */
  natural?: boolean
  /** Recorded instantaneous supply multiplier, also used by the hand budget. */
  flow?: number
}
export type ArtContact = {
  from: ArtPoint
  to: ArtPoint
  velocity: ArtPoint
  radius: number
  pressure: number
  strength: number
  tool: ArtTool
  /** Palm major-axis angle in radians; zero points along the canvas x axis. */
  angle?: number
  /** Palm minor/major axis ratio, clamped to 0.3–1; radius is the major axis. */
  aspect?: number
  /** Omit for legacy direct deposition; present for airborne hand pouring. */
  pour?: ArtPour
}
export type ArtStep = {
  dt: number
  contacts: readonly ArtContact[]
  wetness: number
  wind: number
  windAngle: number
  preserve?: boolean
}
export type ArtCursor = ArtPoint & { radius: number; tool: ArtTool; active: boolean; down?: boolean; angle?: number; aspect?: number; pour?: ArtPour }
export type ArtRenderOptions = {
  mode: ArtMode
  light: LightPreset
  wetness: number
  wind: number
  time: number
  cursor: ArtCursor | null
}

export const modeLabels: Record<ArtMode, string> = { surface: '沙面绘画', lightbox: '灯箱沙画' }
export const toolLabels: Record<ArtTool, string> = { pour: '撒沙', push: '推沙', scrape: '刮线', rake: '沙耙', stamp: '印章', smooth: '抹平', palm: '掌形' }

export function clamp(value: number, low: number, high: number) { return Math.max(low, Math.min(high, value)) }

// 按画布距离细分，快划和低频指针事件也保留完整几何。
export function subdivideContact(contact: ArtContact): ArtContact[] {
  const length = Math.hypot(contact.to.x - contact.from.x, contact.to.y - contact.from.y)
  const count = Math.max(1, Math.ceil(length / Math.max(2, contact.radius * 0.45)))
  return Array.from({ length: count }, (_, index) => {
    const point = (fraction: number) => ({ x: contact.from.x + (contact.to.x - contact.from.x) * fraction, y: contact.from.y + (contact.to.y - contact.from.y) * fraction })
    return { ...contact, from: point(index / count), to: point((index + 1) / count) }
  })
}
