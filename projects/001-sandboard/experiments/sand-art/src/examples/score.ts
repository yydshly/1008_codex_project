import { FIXED_STEP, GRID_WIDTH, GRID_HEIGHT, type ArtContact } from '../model'
import type { HandExample } from './catalog'

type Path = { tool: ArtContact['tool']; points: [number, number][]; ticks: number; radius?: number; strength?: number; scatter?: boolean }
const wave = (y: number, bend = .12): [number, number][] => Array.from({ length: 41 }, (_, i) => {
  const x = .12 + i / 40 * .76
  return [x, y + Math.sin(i / 40 * Math.PI * 2 - .8) * bend]
})
export function examplePaths(example: HandExample): Path[] {
  switch (example.id) {
    case 'rake': return [{ tool: 'rake', points: wave(.36, .08), ticks: 140 }, { tool: 'rake', points: wave(.64, .08), ticks: 140 }]
    case 'pour': return [
      { tool: 'pour', points: wave(.42, .1), ticks: 150, radius: 21 },
      { tool: 'pour', points: [[.25, .68], [.45, .71], [.68, .65], [.8, .67]], ticks: 110, radius: 34, scatter: true }
    ]
    case 'push': return [{ tool: 'push', points: [[.15, .55], [.28, .4], [.48, .38], [.66, .42], [.82, .56]], ticks: 170 }]
    case 'scrape': return [{ tool: 'scrape', points: wave(.35, .09), ticks: 160 }, { tool: 'scrape', points: wave(.66, .06), ticks: 160, radius: 7 }]
    case 'stamp': return [[.22, .35], [.5, .35], [.78, .35], [.35, .68], [.65, .68]].map(point => ({ tool: 'stamp', points: [point as [number, number], point as [number, number]], ticks: 35 }))
    case 'smooth': return [
      { tool: 'rake', points: wave(.36, .08), ticks: 140, radius: 28, strength: .8 },
      { tool: 'rake', points: wave(.64, .08), ticks: 140, radius: 28, strength: .8 },
      { tool: 'smooth', points: [[.5, .16], [.5, .84]], ticks: 100 }
    ]
    case 'palm': return [{ tool: 'palm', points: [[.22, .69], [.29, .5], [.46, .35], [.65, .37], [.79, .53]], ticks: 170 }]
    default: return []
  }
}
export function pathContact(path: Path, tick: number, example: HandExample): ArtContact {
  const point = (time: number) => {
    const progress = Math.min(1, Math.max(0, time / path.ticks)) * (path.points.length - 1)
    const index = Math.min(path.points.length - 2, Math.floor(progress)), t = progress - index
    return { x: (path.points[index][0] * (1 - t) + path.points[index + 1][0] * t) * GRID_WIDTH,
      y: (path.points[index][1] * (1 - t) + path.points[index + 1][1] * t) * GRID_HEIGHT }
  }
  const from = point(tick), to = point(tick + 1)
  return { from, to, velocity: { x: (to.x - from.x) / FIXED_STEP, y: (to.y - from.y) / FIXED_STEP },
    tool: path.tool, radius: path.radius ?? example.radius, strength: path.strength ?? example.strength, pressure: 1,
    ...(path.tool === 'palm' ? { angle: Math.PI / 2, aspect: .45 } : {}),
    ...(path.tool === 'pour' ? { pour: { style: path.scatter ? 'scatter' as const : 'stream' as const, height: path.scatter ? .55 : .2, spread: path.scatter ? .65 : .2, natural: true } } : {}) }
}
