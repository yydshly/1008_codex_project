import type { ArtMode, ArtTool } from '../model'

export interface HandExample {
  id: string; title: string; mode: ArtMode; tool: ArtTool; radius: number; strength: number
  description: string; source: string; preset?: 'zen' | 'moon'
}
export const handExamples: HandExample[] = [
  { id: 'rake', title: '沙耙 · 弯曲的五道沙纹', mode: 'surface', tool: 'rake', radius: 28, strength: .8,
    description: '一把沙耙拖出并行沟槽，沿弯线继续画，能看见两侧堆起的沙脊。', source: '原工作室沙耙工具 · 实际沙层小样' },
  { id: 'zen', title: '沙纹园 · 保留的创作起点', mode: 'surface', tool: 'rake', radius: 20, strength: .7, preset: 'zen',
    description: '之前的沙纹园原构图。打开后用沙耙整理纹路，也可以推拢、刮线或盖印。', source: '原工作室「沙纹园」预设 · v2 起保留' },
  { id: 'pour', title: '撒沙 · 一把沙的深浅', mode: 'lightbox', tool: 'pour', radius: 27, strength: .85,
    description: '细流与散撒留下不同厚度的沙。按住继续落沙，松手后余粒落定。', source: '原工作室空中撒沙工具 · 实际沙层小样' },
  { id: 'moon', title: '山月沙画 · 保留的创作起点', mode: 'lightbox', tool: 'pour', radius: 16, strength: .7, preset: 'moon',
    description: '之前的山、月与树仍是同一幅原构图。可以继续撒沙，也能收亮部和调整光照。', source: '原工作室「山月沙画」预设 · v2 起保留' },
  { id: 'push', title: '推沙 · 聚起一道沙脊', mode: 'surface', tool: 'push', radius: 28, strength: .9,
    description: '推开的沙没有消失，沿笔触聚成沙脊。打开后继续推拢，观察沙量的移动。', source: '原工作室推沙工具 · 实际沙层小样' },
  { id: 'scrape', title: '刮线 · 沙上的光', mode: 'lightbox', tool: 'scrape', radius: 13, strength: .85,
    description: '从薄沙里刮出亮线。沿留白勾线，或重新撒沙补上暗部。', source: '原工作室刮线工具 · 实际沙层小样' },
  { id: 'stamp', title: '印章 · 沙面心印', mode: 'surface', tool: 'stamp', radius: 30, strength: .9,
    description: '点按留下心形印痕，重复盖印形成节奏；也可以换沙耙串起这些心印。', source: '原工作室印章工具 · 实际沙层小样' },
  { id: 'smooth', title: '抹平 · 沙纹之间的静处', mode: 'surface', tool: 'smooth', radius: 40, strength: .9,
    description: '沙耙纹路的中央被抚平，左右仍留着沟槽。拖动抹平新的位置，观察纹路的变化。', source: '原工作室沙耙与抹平工具 · 实际沙层小样' },
  { id: 'palm', title: '掌形 · 扫开的灯光', mode: 'lightbox', tool: 'palm', radius: 40, strength: .8,
    description: '宽幅掌面扫开沙层，亮部边缘留下余沙。调整掌形角度，继续塑出明暗。', source: '原工作室掌形工具 · 实际沙层小样' }
]
export function findHandExample(id: string) { return handExamples.find(example => example.id === id) }
export function examplePath(id: string) {
  if (!findHandExample(id)) throw new Error('没有这个手绘示例。')
  return '#example=' + encodeURIComponent(id)
}
