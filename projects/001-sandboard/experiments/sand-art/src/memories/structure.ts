/** 用户在当前裁切照片上标出的创作区域，不是自动识别结果。 */
export type GuideKind = 'subject' | 'face' | 'hands' | 'object'
export type GuideBounds = [number, number, number, number]
export interface StructureGuide { id: string; kind: GuideKind; bounds: GuideBounds }
export const guideNames: Record<GuideKind, string> = { subject: '主体', face: '脸', hands: '手', object: '物件' }
export const guideColors: Record<GuideKind, string> = { subject: '#dfbd72', face: '#80c7ff', hands: '#9ee2b6', object: '#f6a8a0' }

export function validGuides(value: unknown): value is StructureGuide[] {
  if (!Array.isArray(value) || value.length > 12) return false
  const ids = new Set<string>()
  return value.every((g: StructureGuide) => {
    if (!g || typeof g.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(g.id) || ids.has(g.id)
      || !Object.hasOwn(guideNames, g.kind) || !Array.isArray(g.bounds) || g.bounds.length !== 4
      || !g.bounds.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)) return false
    ids.add(g.id)
    return g.bounds[2] - g.bounds[0] >= .02 && g.bounds[3] - g.bounds[1] >= .02
  }) && value.filter(g => g.kind === 'subject').length <= 1
}

export function guideBounds(from: {x:number;y:number}, to: {x:number;y:number}): GuideBounds {
  return [Math.min(from.x,to.x),Math.min(from.y,to.y),Math.max(from.x,to.x),Math.max(from.y,to.y)]
}

export const postcardGuides: StructureGuide[] = [
  { id:'postcard-subject',kind:'subject',bounds:[.031,.024,.565,.99] },
  { id:'postcard-face',kind:'face',bounds:[.224,.147,.426,.482] },
  { id:'postcard-hands',kind:'hands',bounds:[.258,.593,.55,.807] },
  { id:'postcard-object',kind:'object',bounds:[.35,.518,.512,.655] },
]
export const windowGuides: StructureGuide[] = [
  { id:'window-subject',kind:'subject',bounds:[.43,.12,.875,.96] },
  { id:'window-face',kind:'face',bounds:[.545,.19,.718,.486] },
  { id:'window-hands',kind:'hands',bounds:[.478,.535,.707,.813] },
  { id:'window-object',kind:'object',bounds:[.541,.512,.643,.636] },
]
