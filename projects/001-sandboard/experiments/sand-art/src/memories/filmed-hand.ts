import type { StageHand } from '../stage/show'

export type HandKey = 'alpha' | 'green' | 'blue'
export type HandRole = StageHand['pose']
export interface HandAnchor { progress: number; x: number; y: number }
export interface HandCalibration { key: HandKey; width: number; start: number; end: number; anchors: HandAnchor[] }
export interface HandRecord { role: HandRole; name: string; blob: Blob; calibration: HandCalibration }
const clamp = (n: number, low = 0, high = 1) => Math.max(low, Math.min(high, n))
export function validCalibration(c: HandCalibration, duration: number) {
  return c && ['alpha', 'green', 'blue'].includes(c.key) && Number.isFinite(c.width) && c.width >= .1 && c.width <= .8
    && Number.isFinite(c.start) && Number.isFinite(c.end) && c.start >= 0 && c.end <= duration && c.end - c.start >= .05
    && Array.isArray(c.anchors) && c.anchors.length > 0 && c.anchors.length <= 120
    && c.anchors.every((a, i) => [a.progress, a.x, a.y].every(n => Number.isFinite(n) && n >= 0 && n <= 1)
      && (i === 0 || a.progress > c.anchors[i - 1].progress))
}
export function handTime(progress: number, c: Pick<HandCalibration, 'start' | 'end'>) {
  return c.start + clamp(progress) * (c.end - c.start)
}
export function handAnchor(progress: number, anchors: HandAnchor[]) {
  const p = clamp(progress), next = anchors.findIndex(a => a.progress >= p)
  if (next <= 0) return anchors[next === -1 ? anchors.length - 1 : 0]
  const a = anchors[next - 1], b = anchors[next], t = (p - a.progress) / (b.progress - a.progress)
  return { progress: p, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}
/** Removes the background while retaining recorded skin RGB values. */
export function keyHandPixels(pixels: Uint8ClampedArray, key: HandKey) {
  if (key === 'alpha') return
  const channel = key === 'green' ? 1 : 2
  for (let i = 0; i < pixels.length; i += 4) {
    const excess = pixels[i + channel] - Math.max(pixels[i], pixels[i + (channel === 1 ? 2 : 1)])
    const t = clamp((excess - 12) / 42), fade = t * t * (3 - 2 * t)
    pixels[i + 3] = Math.round(pixels[i + 3] * (1 - fade))
  }
}
/** Each clip belongs to one gesture. Frames follow the material clock instead of free-running. */
export class FilmedHand {
  private video: HTMLVideoElement | undefined
  private url: string | undefined
  private generation = 0
  private file: File | undefined
  private readonly frame = document.createElement('canvas')
  private readonly context = this.frame.getContext('2d', { willReadFrequently: true })!
  private lastTime = -1
  private lastKey: HandKey | undefined
  private desiredTime = 0
  calibration: HandCalibration = { key: 'green', width: .3, start: 0, end: 1, anchors: [{ progress: 0, x: .5, y: .23 }] }
  get key() { return this.calibration.key }
  set key(key: HandKey) { this.calibration.key = key }
  get width() { return this.calibration.width }
  set width(width: number) { this.calibration.width = width }
  get ready() { return !!this.video }
  get name() { return this.file?.name ?? '' }
  get duration() { return this.video?.duration ?? 0 }
  get frameReady(){return !!this.video&&!this.video.seeking&&this.lastTime>=0&&Math.abs(this.lastTime-this.desiredTime)<1/30}
  get decodedProgress() { return clamp((Math.max(0, this.lastTime) - this.calibration.start) / (this.calibration.end - this.calibration.start)) }
  async load(file: File, calibration?: HandCalibration) {
    if (!['video/mp4', 'video/webm'].includes(file.type) || file.size > 60 * 1024 * 1024) throw new Error('请选择 60 MB 以内的 MP4 或 WebM 手部素材。')
    const generation = ++this.generation, url = URL.createObjectURL(file), video = document.createElement('video')
    video.muted = true; video.playsInline = true; video.preload = 'auto'
    try {
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => { window.clearTimeout(timer); video.onloadeddata = null; video.onerror = null }
        const timer = window.setTimeout(() => { cleanup(); reject(new Error('手部素材读取超时。')) }, 15000)
        video.onloadeddata = () => { cleanup(); resolve() }
        video.onerror = () => { cleanup(); reject(new Error('此浏览器无法解码手部素材，请换用 MP4 或 WebM。')) }
        video.src = url
      })
      if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 120 || video.videoWidth * video.videoHeight > 16000000) throw new Error('请使用两分钟以内、尺寸不超过 1600 万像素的手部短片。')
      if (calibration && !validCalibration(calibration, video.duration)) throw new Error('手部标定或截取区间不正确。')
      if (generation !== this.generation) { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); return false }
      this.release(); this.video = video; this.url = url; this.file = file
      this.calibration = structuredClone(calibration ?? { key: 'green', width: .3, start: 0, end: Math.min(3, video.duration), anchors: [{ progress: 0, x: .5, y: .23 }] })
      const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight))
      this.frame.width = Math.round(video.videoWidth * scale); this.frame.height = Math.round(video.videoHeight * scale)
      this.lastTime = -1; this.lastKey = undefined
      video.onseeked = () => { this.update(); this.seek() }
      this.sync(0); return true
    } catch (error) { video.pause(); video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); throw error }
  }
  sync(progress: number) { this.desiredTime = Math.min(this.duration - .001, handTime(progress, this.calibration)); this.seek() }
  private seek() {
    const video = this.video
    if (video && !video.seeking && Math.abs(video.currentTime - this.desiredTime) > 1 / 60) video.currentTime = this.desiredTime
  }
  pause() { this.video?.pause() }
  private update() {
    const video = this.video
    if (!video || video.readyState < 2 || video.seeking) return this.lastTime >= 0
    if (this.lastTime !== video.currentTime || this.lastKey !== this.key) {
      this.context.clearRect(0, 0, this.frame.width, this.frame.height)
      this.context.drawImage(video, 0, 0, this.frame.width, this.frame.height)
      if (this.key !== 'alpha') {
        const image = this.context.getImageData(0, 0, this.frame.width, this.frame.height)
        keyHandPixels(image.data, this.key); this.context.putImageData(image, 0, 0)
      }
      this.lastTime = video.currentTime; this.lastKey = this.key
    }
    return true
  }
  setAnchor(x: number, y: number) {
    if(!this.frameReady)throw new Error('此帧仍在读取，请稍候再点接触点。')
    const progress = this.decodedProgress, anchors = this.calibration.anchors.filter(a => Math.abs(a.progress - progress) > .015)
    anchors.push({ progress, x: clamp(x), y: clamp(y) }); anchors.sort((a, b) => a.progress - b.progress)
    if (anchors.length > 120) throw new Error('接触点最多保留 120 个。')
    this.calibration.anchors = anchors
  }
  preview(canvas: HTMLCanvasElement) {
    const height=Math.round(canvas.width*this.frame.height/this.frame.width)
    if(this.ready&&canvas.height!==height)canvas.height=height
    const ctx = canvas.getContext('2d')!; ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!this.update()) return
    ctx.drawImage(this.frame, 0, 0, canvas.width, canvas.height)
    const anchor = handAnchor(this.decodedProgress, this.calibration.anchors), x = anchor.x * canvas.width, y = anchor.y * canvas.height
    ctx.strokeStyle = '#f5e5c7'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke()
  }
  draw(ctx: CanvasRenderingContext2D, hand: StageHand, progress: number) {
    this.sync(progress)
    if (!this.update()) return
    const anchor = handAnchor(this.decodedProgress, this.calibration.anchors), scale = ctx.canvas.width * this.width / this.frame.width
    ctx.save(); ctx.translate(hand.x * ctx.canvas.width, hand.y * ctx.canvas.height); ctx.scale(scale, scale)
    // No artificial rotation or bending of the filmed arm.
    ctx.shadowColor = hand.down ? 'rgba(21,14,8,.18)' : 'rgba(21,14,8,.12)'
    ctx.shadowBlur = hand.down ? 2 : 9; ctx.shadowOffsetX = hand.down ? 1 : 4; ctx.shadowOffsetY = hand.down ? 2 : 7
    ctx.drawImage(this.frame, -anchor.x * this.frame.width, -anchor.y * this.frame.height); ctx.restore()
  }
  record(role: HandRole): HandRecord | undefined { return this.file ? { role, name: this.name, blob: this.file, calibration: structuredClone(this.calibration) } : undefined }
  clear() { this.generation++; this.release(); this.context.clearRect(0, 0, this.frame.width, this.frame.height); this.lastTime = -1 }
  private release() {
    this.video?.pause()
    if (this.video) { this.video.onseeked = null; this.video.removeAttribute('src'); this.video.load() }
    if (this.url) URL.revokeObjectURL(this.url)
    this.video = undefined; this.url = undefined; this.file = undefined
  }
}

