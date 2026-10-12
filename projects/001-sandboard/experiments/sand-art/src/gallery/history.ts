import attempts from '../research/catalog.json'

export type HistoryKind = 'editable' | 'actual' | 'target' | 'interface' | 'preview' | 'composite'
export interface HistoricalWork {
  id: string; recordId: string; title: string; versions: number[]; group: string
  image: string; kind: HistoryKind; description: string; source: string
  platform?: string; process?: string; video?: string
}
export const historyKinds: Record<HistoryKind, string> = {
  editable: '实际数字沙层 · 可接管', actual: '实际效果记录', target: 'AI参考目标 · 非沙层成品',
  interface: '平台界面记录', preview: '照片影调预览', composite: '手部合成试验 · 非实拍沙画'
}
export const historyGroups: Record<string, string> = {
  foundation: '原版、手绘与舞台', photo: '早期照片作品', hands: '手部与接触', motion: '无手演出', keepsake: '纪念短片'
}
const atelier = (score: string, view: 'process' | 'finished') => `atelier/#score=${score}&view=${view}`
const reference = (index: number, view: 'process' | 'finished') => `atelier/#reference=${index}&view=${view}`
const overrides: Record<string, Partial<HistoricalWork>> = {
  v1: { title: 'Sandboard · 原版细沙与划痕', platform: '../original/' },
  v3: { title: '工作室 · 收藏与创作回放', kind: 'interface', platform: '#gallery' },
  v5: { title: '山月 · 三把沙的完整演示', platform: '#demo', process: '#demo' },
  v7: { title: '月下江南 · 三幕舞台', platform: 'stage/#pause', process: 'stage/#pause' },
  v8: { title: '烟雨归舟 · 美术参考目标', kind: 'target', platform: undefined },
  v9: { title: '烟雨归舟 · 参考明暗还原', kind: 'editable', platform: reference(0, 'finished'), process: reference(0, 'process'),
    source: '实际数字沙层导出 · 原照为AI美术参考 · 参考还原保留扫描式轨迹' },
  v10: { title: '垂眸 · 侧脸塑形', kind: 'editable', platform: atelier('portrait', 'finished'), process: atelier('portrait', 'process') },
  v12: { title: '照片与记忆 · 温暖影调', kind: 'preview' },
  v13: { title: '留白人像 · 空台成画', process: 'memories/#process' },
  v14: { title: '雨窗人物 · 早期效果基线', process: 'memories/#study' },
  v15: { title: '公园照片 · 独立构图成画', process: 'memories/#postcard-study' },
  v16: { kind: 'composite' }, v18: { kind: 'composite' }, v20: { kind: 'composite' }, v22: { kind: 'composite' },
}
const extra: HistoricalWork[] = [
  { id: 'willow', recordId: 'v10', title: '苍柳 · 沙块与叶影', versions: [11], group: 'foundation', image: 'art-studies-v11/willow.png', kind: 'editable',
    description: '先铺叶影与树干沙块，再连枝、揉灰、挑出树皮光；可看完整编排或接管原沙层。', source: 'v11 原创手势编排 · 实际数字沙层导出', platform: atelier('willow', 'finished'), process: atelier('willow', 'process') },
  { id: 'bridge', recordId: 'v10', title: '石桥 · 从沙块开洞', versions: [11], group: 'foundation', image: 'art-studies-v11/bridge.png', kind: 'editable',
    description: '先堆桥身暗块，再推沙、收沙打开桥洞，最后整理石纹与水光。', source: 'v11 原创手势编排 · 实际数字沙层导出', platform: atelier('bridge', 'finished'), process: atelier('bridge', 'process') },
  { id: 'boat', recordId: 'v10', title: '烟雨归舟 · 原手势演出', versions: [10], group: 'foundation', image: 'art-gesture-v10/gesture-process.jpg', kind: 'editable',
    description: '保留原归舟连续手势，按天光、水岸、柳树、石桥与舟推进；可与局部塑形版本对照。', source: 'v10 原编排 · 实际过程截图', platform: atelier('boat', 'finished'), process: atelier('boat', 'process') },
  { id: 'target-person', recordId: 'v8', title: '归人近景 · 美术参考目标', versions: [8], group: 'foundation', image: 'generated-sandboard/scene-2.png', kind: 'target',
    description: '侧脸、手部与衣褶的构图参考。图像来自AI生成，不能作为实时沙画能力的证明。', source: 'v8 AI生成美术参考 · 不可直接接管' },
  { id: 'target-lamp', recordId: 'v8', title: '灯下思念 · 美术参考目标', versions: [8], group: 'foundation', image: 'generated-sandboard/scene-3.png', kind: 'target',
    description: '窗边人物与灯火的情绪参考。目标图与实际数字沙层分别展示。', source: 'v8 AI生成美术参考 · 不可直接接管' },
  { id: 'reference-person', recordId: 'v9', title: '归人近景 · 参考还原', versions: [9], group: 'foundation', image: 'art-product-v9/scene-2-real.png', kind: 'editable',
    description: '按参考局部明暗供沙与收沙。可观察原参考还原过程，成画轨迹仍有扫描特征。', source: 'v9 实际数字沙层导出 · AI参考输入', platform: reference(1, 'finished'), process: reference(1, 'process') },
  { id: 'reference-lamp', recordId: 'v9', title: '灯下思念 · 参考还原', versions: [9], group: 'foundation', image: 'art-product-v9/scene-3-real.png', kind: 'editable',
    description: '原来的第三幅参考还原作品。可播放、暂停并接过沙层继续创作。', source: 'v9 实际数字沙层导出 · AI参考输入', platform: reference(2, 'finished'), process: reference(2, 'process') },
]
const recorded: HistoricalWork[] = attempts.map(entry => ({
  id: entry.id, recordId: entry.id, title: entry.title, versions: entry.versions, group: entry.group,
  image: entry.image, kind: 'actual', description: entry.result,
  source: entry.kind + ' · 保存于当时版本' + (entry.group === 'photo' || entry.group === 'motion' && entry.versions[0] >= 25 ? ' · AI虚构照片输入' : ''),
  platform: entry.demo ? entry.demo.replace(/^\.\.\//, '') : undefined,
  video: entry.video ?? undefined, ...overrides[entry.id],
}))
// Put the missing editable works and the accepted early photo baseline first.
const priority = ['willow', 'bridge', 'v10', 'v7', 'v14', 'boat', 'v9', 'reference-person', 'reference-lamp', 'v13', 'v15', 'v12']
export const historicalWorks: HistoricalWork[] = [...recorded, ...extra].sort((a, b) => {
  const rank = (id: string) => { const index = priority.indexOf(id); return index < 0 ? priority.length : index }
  return rank(a.id) - rank(b.id) || a.versions[0] - b.versions[0]
})
export function selectHistoricalWorks(group = 'all', query = '', kind = 'all') {
  const word = query.trim().toLocaleLowerCase()
  return historicalWorks.filter(work => (group === 'all' || work.group === group) && (kind === 'all' || work.kind === kind) &&
    [work.title, work.description, work.source, historyKinds[work.kind], ...work.versions.map(version => 'v' + version)].join(' ').toLocaleLowerCase().includes(word))
}
export function historicalVersion(work: HistoricalWork) { return 'v' + work.versions[0] + (work.versions.length > 1 ? '–v' + work.versions.at(-1) : '') }
export function historicalRecord(work: HistoricalWork) { return `research/#${work.recordId}` }
