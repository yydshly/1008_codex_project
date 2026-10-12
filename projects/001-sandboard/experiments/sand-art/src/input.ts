import { MAX_CONTACTS, type ArtContact, type ArtPoint, type ArtTool } from './model'

export type StrokeAnchor = { origin: ArtPoint; direction: ArtPoint | null }

// 同一条近直线保持共同起点，让后续扫掠清掉上一小段的端帽沙坝。
// 转弯时从真实上一采样重新起段，避免把曲线切成跨角的直线。
export function extendStroke(anchor: StrokeAnchor, previous: ArtPoint, current: ArtPoint, radius: number): ArtPoint {
  const x = current.x - anchor.origin.x, y = current.y - anchor.origin.y
  const distance = Math.hypot(x, y)
  if (distance < 0.05) return anchor.origin
  if (anchor.direction) {
    const deviation = Math.abs(x * anchor.direction.y - y * anchor.direction.x)
    const alignment = (x * anchor.direction.x + y * anchor.direction.y) / distance
    const forward = (current.x - previous.x) * anchor.direction.x + (current.y - previous.y) * anchor.direction.y
    if (deviation > Math.max(0.6, radius * 0.12) || alignment < 0.985 || forward < -0.05) {
      anchor.origin = { ...previous }
      const dx = current.x - previous.x, dy = current.y - previous.y, length = Math.hypot(dx, dy)
      anchor.direction = length > 0 ? { x: dx / length, y: dy / length } : null
    }
  } else anchor.direction = { x: x / distance, y: y / distance }
  return anchor.origin
}

type ContactTrack = { held: boolean; tool: ArtTool; queue: ArtContact[] }

// 一个指针每个固定时间步只领取一次静止撒沙预算；移动分段共享该预算。
export function sampleContactQueues<T extends ContactTrack>(
  pointers: Map<number, T>, roundRobin: number, stationary: (track: T) => ArtContact,
): { contacts: ArtContact[]; next: number } {
  const contacts: ArtContact[] = []
  const sources: number[] = []
  const sampled = new Set<number>()
  const entries = [...pointers.entries()]
  if (!entries.length) return { contacts, next: 0 }
  for (let attempt = 0; attempt < MAX_CONTACTS * entries.length && contacts.length < MAX_CONTACTS; attempt++) {
    const [pointerId, track] = entries[(roundRobin + attempt) % entries.length]
    const queued = track.queue.shift()
    if (queued) { contacts.push(queued); sources.push(pointerId); sampled.add(pointerId) }
    else if (track.held && !sampled.has(pointerId)) {
      contacts.push(stationary(track)); sources.push(pointerId); sampled.add(pointerId)
    } else if (!track.held) pointers.delete(pointerId)
  }
  for (let index = 0; index < contacts.length; index++) if (contacts[index].tool === 'pour' && contacts[index].pour?.style !== 'handful') {
    const count = sources.filter((source, sample) => source === sources[index] && contacts[sample].pour?.style !== 'handful').length
    contacts[index] = { ...contacts[index], strength: contacts[index].strength / count }
  }
  return { contacts, next: (roundRobin + 1) % entries.length }
}
