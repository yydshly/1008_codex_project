import { StageMaterial, type StageMaterialSnapshot } from '../stage/material'
import { moods, photoStyles, sandPixels, validSettings, type PhotoSettings, type PhotoStyle } from './model'
import { restorePerformance,type PhotoPerformance } from './performance'
import { GranularSandRenderer } from './granular-sand'

let granularRenderer: GranularSandRenderer | undefined
let granularUnavailable = false
export function granularAvailable() { return !granularUnavailable }

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
export function validImageUrl(url: unknown): url is string {
  return typeof url === 'string' && url.length < 8 * 1024 * 1024 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(url)
}
export interface PhotoProject {
  format: 'sandboard-photo'; version: 1; title: string; caption: string; sourceKind: 'photo' | 'ai-sample'
  settings: PhotoSettings; snapshot: StageMaterialSnapshot; source?: string
  performance?:PhotoPerformance
}
export function encodePhotoProject(project: PhotoProject) {
  return JSON.stringify({ ...project, snapshot: { ...project.snapshot, density: [...project.snapshot.density] } })
}
export function decodePhotoProject(text: string): PhotoProject {
  if (text.length > 20 * 1024 * 1024) throw new Error('作品文件过大。')
  const v = JSON.parse(text)
  if (v.format !== 'sandboard-photo' || v.version !== 1 || typeof v.title !== 'string' || v.title.length > 80
    || typeof v.caption !== 'string' || v.caption.length > 320 || !['photo', 'ai-sample'].includes(v.sourceKind)
    || !validSettings(v.settings) || !v.snapshot || !Array.isArray(v.snapshot.density)
    || !Number.isInteger(v.snapshot.width) || !Number.isInteger(v.snapshot.height)
    || v.snapshot.width < 4 || v.snapshot.width > 768 || v.snapshot.height < 4 || v.snapshot.height > 800
    || v.snapshot.density.length !== v.snapshot.width * v.snapshot.height
    || !v.snapshot.density.every((n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0)
    || (v.source !== undefined && !validImageUrl(v.source))) throw new Error('请导入本照片沙画导出的有效作品。')
  const snapshot = { ...v.snapshot, density: Float32Array.from(v.snapshot.density) }
  new StageMaterial(snapshot.width, snapshot.height).restore(snapshot)
  if(v.performance!==undefined)restorePerformance(v.performance,snapshot)
  return { ...v, snapshot }
}
export function renderSand(canvas: HTMLCanvasElement, state: StageMaterialSnapshot, settings: PhotoSettings) {
  if (settings.surface === 'granular' && !granularUnavailable) {
    try {
      granularRenderer ??= new GranularSandRenderer()
      granularRenderer.draw(canvas, state, settings)
      return
    } catch (error) {
      granularUnavailable = true
      console.warn('颗粒灯箱退回原影调：', error)
    }
  }
  const pixels = new ImageData(state.width, state.height)
  pixels.data.set(sandPixels(state, settings))
  const small = document.createElement('canvas'); small.width = state.width; small.height = state.height
  small.getContext('2d')!.putImageData(pixels, 0, 0)
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height)
}
export function canvasBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片导出失败。')), type, quality))
}
export function blobDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('图片读取失败。'))
    reader.readAsDataURL(blob)
  })
}
export function standaloneExhibition(title: string, caption: string, mood: PhotoSettings['mood'], image: string, original?: string, sample = false, style:PhotoStyle='photo') {
  if (!validImageUrl(image) || (original && !validImageUrl(original))) throw new Error('展览图片格式不正确。')
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · 光阴沙画</title>
<style>*{box-sizing:border-box}body{margin:0;background:#161613;color:#eee7d6;font-family:system-ui,sans-serif}main{max-width:1280px;margin:auto;padding:40px 24px}header{display:flex;justify-content:space-between;gap:16px;align-items:center;color:#b6aa91;font-size:12px;letter-spacing:.1em}.art{margin:36px 0;background:#29271f;padding:12px;box-shadow:0 20px 70px #0006}.art img{display:block;width:100%;max-height:74vh;object-fit:contain}h1{font:normal clamp(26px,5vw,46px) Georgia,serif}p{max-width:680px;line-height:1.9;white-space:pre-wrap;color:#c9bca4}button,label{font:inherit;color:inherit;background:transparent;border:1px solid #73654e;padding:12px;cursor:pointer}footer{margin-top:48px;border-top:1px solid #514837;padding-top:20px;color:#ad9f87;font-size:12px}.original{display:none}#compare:checked~.art .sand{display:none}#compare:checked~.art .original{display:block}@media print{body{background:white;color:#26231c}.art{box-shadow:none}button,label,input{display:none}p,footer{color:#544a3a}.art img{max-height:70vh}}</style></head><body><main>
<header><span>光阴沙画 / 一刻记忆</span><button onclick="window.print()">打印 / 保存 PDF</button></header>
${original ? '<label for="compare">查看原照</label><input type="checkbox" id="compare" aria-label="查看原照">' : ''}
<figure class="art"><img class="sand" src="${image}" alt="${escapeHtml(title)}的沙画成品">${original ? '<img class="original" src="' + original + '" alt="同一构图的原照">' : ''}</figure>
<span>${photoStyles[style].name} · ${moods[mood].name} · 照片沙画</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(caption)}</p>
<footer>照片影调转换与沙层修画 · 光阴沙画${sample ? ' · 示例原照为 AI 生成的虚构场景' : ''} · 本页内置图片，可离线打开</footer></main></body></html>`
}
export function makePoster(state: StageMaterialSnapshot, settings: PhotoSettings, title: string, caption: string) {
  const canvas = document.createElement('canvas'), art = document.createElement('canvas')
  art.width = 1536; art.height = Math.round(1536 * state.height / state.width); renderSand(art, state, settings)
  canvas.width = 1728; canvas.height = art.height + 500
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#f0e9d9'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(art, 96, 96)
  ctx.fillStyle = '#3b3428'; ctx.font = '42px serif'; ctx.fillText(title, 96, art.height + 175, 1536)
  ctx.font = '23px sans-serif'; ctx.fillStyle = '#796b54'
  const lines: string[] = []; let line = ''
  for (const char of caption.replace(/\s+/g, ' ')) {
    if (ctx.measureText(line + char).width > 1536) { lines.push(line); line = '' }
    line += char
  }
  if (line) lines.push(line)
  lines.slice(0, 6).forEach((text, i) => ctx.fillText(text, 96, art.height + 222 + i * 33))
  ctx.font = '18px sans-serif'; ctx.fillText('光阴沙画  /  '+photoStyles[settings.style??'photo'].name+' · ' + moods[settings.mood].name, 96, canvas.height - 42)
  return canvas
}
