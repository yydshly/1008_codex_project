import { FIXED_STEP, type ArtCursor } from './model'
import type { Recording } from './recording'
import { ReplaySession } from './replay'
import { finalizeWebMDuration } from './webm-duration'

export interface ReplayVideoOptions {
  signal?: AbortSignal
  onProgress?: (progress: number) => void
  onWarning?: (message: string) => void
  /** Optional instructional gesture; ordinary creation videos stay cursor-free. */
  cursorAt?: (tick: number) => ArtCursor | null
}

const WIDTH = 1024
const HEIGHT = 768
const FPS = 30
const FRAME_MS = 1000 / FPS
const MIME_TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

function cancelled() { return new DOMException('已取消视频导出。', 'AbortError') }
function checkAbort(signal: AbortSignal) { if (signal.aborted) throw cancelled() }

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  checkAbort(signal)
  return new Promise((resolve, reject) => {
    const finish = () => { signal.removeEventListener('abort', abort); resolve() }
    const timer = setTimeout(finish, Math.max(0, milliseconds))
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(cancelled()) }
    signal.addEventListener('abort', abort, { once: true })
  })
}

function nextPaint(signal: AbortSignal): Promise<void> {
  checkAbort(signal)
  if (typeof requestAnimationFrame !== 'function') return wait(FRAME_MS, signal)
  return new Promise((resolve, reject) => {
    const frame = requestAnimationFrame(() => { signal.removeEventListener('abort', abort); resolve() })
    const abort = () => { cancelAnimationFrame(frame); signal.removeEventListener('abort', abort); reject(cancelled()) }
    signal.addEventListener('abort', abort, { once: true })
  })
}

async function settleWithin(promise: Promise<void>, milliseconds: number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  try { await Promise.race([promise, new Promise<void>(resolve => { timer = setTimeout(resolve, milliseconds) })]) }
  finally { clearTimeout(timer) }
}

function webMRecorder(stream: MediaStream): MediaRecorder {
  // A supported MIME can still fail to allocate an encoder; try the next WebM codec.
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static
  for (const mimeType of MIME_TYPES) {
    if (!MediaRecorder.isTypeSupported(mimeType)) continue
    try { return new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 }) }
    catch { /* Fall back from VP9 to VP8, then the browser's WebM default. */ }
  }
  throw new Error('此浏览器无法录制 WebM 视频，请使用支持 WebGPU 和 WebM 的浏览器。')
}

/** Real-time browser WebM capture of an independent replay, without workspace overlays. */
export async function exportReplayVideo(device: GPUDevice, format: GPUTextureFormat, recording: Recording, options: ReplayVideoOptions = {}): Promise<Blob> {
  if (options.signal?.aborted) throw cancelled()
  if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    throw new Error('此浏览器不支持视频录制，可先保存录制文件或导出 PNG。')
  }
  const controller = new AbortController()
  const signal = controller.signal
  const externalAbort = () => controller.abort()
  options.signal?.addEventListener('abort', externalAbort, { once: true })
  let session: ReplaySession | undefined
  let context: GPUCanvasContext | null = null
  let stream: MediaStream | undefined
  let recorder: MediaRecorder | undefined
  let recorderError: Error | undefined
  let stopCompleted: Promise<void> | undefined
  let recorderStarted = false
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH; canvas.height = HEIGHT
  canvas.setAttribute('aria-hidden', 'true')
  canvas.dataset.videoExport = 'true'
  // Keep a real canvas presentation surface while excluding it from the workspace.
  canvas.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:0;pointer-events:none;'
  const stopCapture = () => {
    session?.destroy()
    if (recorder && recorder.state !== 'inactive') { try { recorder.stop() } catch { /* Already stopping. */ } }
  }
  signal.addEventListener('abort', stopCapture, { once: true })
  const chunks: Blob[] = []
  const dataAvailable = (event: BlobEvent) => { if (event.data.size > 0) chunks.push(event.data) }
  const recordingError = () => { recorderError = new Error('浏览器未能完成视频录制，请重试或先保存录制文件。'); controller.abort() }

  try {
    if (typeof canvas.captureStream !== 'function') throw new Error('此浏览器不支持画布视频捕获，可先保存录制文件或导出 PNG。')
    if (!MIME_TYPES.some(mime => MediaRecorder.isTypeSupported(mime))) throw new Error('此浏览器不支持 WebM 视频导出，可先保存录制文件或导出 PNG。')
    session = await ReplaySession.create(device, format, recording)
    checkAbort(signal)
    if (session.durationTicks <= 0) throw new Error('录制为空，请先记录一段创作再导出视频。')
    context = canvas.getContext('webgpu')
    if (!context) throw new Error('浏览器未能准备视频画布，请重试。')
    context.configure({ device, format, alphaMode: 'opaque' })
    document.body.append(canvas)
    await session.seek(0)
    checkAbort(signal)

    // MDN: captureStream(0) enables explicit requestFrame; fall back to 30fps capture.
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream
    // https://www.w3.org/TR/mediacapture-fromelement/#the-canvascapturemediastreamtrack
    stream = canvas.captureStream(0)
    let track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined
    if (!track || typeof track.requestFrame !== 'function') {
      stream.getTracks().forEach(item => item.stop())
      stream = canvas.captureStream(FPS)
      track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined
    }
    if (!track) throw new Error('浏览器没有生成视频轨道，请重试。')
    recorder = webMRecorder(stream)
    recorder.addEventListener('dataavailable', dataAvailable)
    recorder.addEventListener('error', recordingError)
    stopCompleted = new Promise<void>(resolve => recorder!.addEventListener('stop', () => resolve(), { once: true }))
    const startedAt = performance.now()
    recorder.start(1000)
    recorderStarted = true
    const durationSeconds = session.durationTicks * FIXED_STEP
    const totalFrames = Math.ceil(durationSeconds * FPS)
    options.onProgress?.(0)

    const draw = async () => {
      checkAbort(signal)
      track?.requestFrame?.()
      const encoder = device.createCommandEncoder()
      session!.encodeRender(encoder, context!.getCurrentTexture().createView(), session!.tick * FIXED_STEP, options.cursorAt?.(session!.tick) ?? null)
      device.queue.submit([encoder.finish()])
      await device.queue.onSubmittedWorkDone()
      checkAbort(signal)
      track?.requestFrame?.()
      await nextPaint(signal)
    }
    await draw()
    for (let frame = 1; frame <= totalFrames; frame++) {
      const elapsed = Math.min(frame / FPS, durationSeconds)
      await wait(startedAt + elapsed * 1000 - performance.now(), signal)
      const tick = frame === totalFrames ? session.durationTicks : Math.min(session.durationTicks, Math.round(elapsed / FIXED_STEP))
      await session.advance(tick - session.tick)
      await draw()
      options.onProgress?.(Math.min(0.99, session.tick / session.durationTicks))
    }
    // WebGPU completion does not guarantee that captureStream has consumed the
    // latest compositor presentation. Re-present the same final tick on three
    // successive capture frames; waiting alone never requests another frame in
    // captureStream(0), so it can leave the previous airborne image at the end.
    for (let presentation = 0; presentation < 3; presentation++) {
      await wait(FRAME_MS, signal)
      await draw()
    }
    // Let the last requested presentation reach the encoder before stop flushes.
    await wait(FRAME_MS, signal)
    checkAbort(signal)
    const elapsedMilliseconds = performance.now() - startedAt
    recorder.stop()
    // stop queues the final dataavailable event before stop; collect it before cleanup.
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/stop
    await new Promise<void>((resolve, reject) => {
      const abort = () => { signal.removeEventListener('abort', abort); reject(cancelled()) }
      signal.addEventListener('abort', abort, { once: true })
      void stopCompleted!.then(() => { signal.removeEventListener('abort', abort); resolve() })
    })
    if (recorderError) throw recorderError
    const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' })
    if (blob.size === 0) throw new Error('没有生成有效的视频数据，请重试或先保存录制文件。')
    const finalized = await finalizeWebMDuration(blob, elapsedMilliseconds)
    checkAbort(signal)
    if (!finalized.updated && finalized.reason) options.onWarning?.(finalized.reason)
    options.onProgress?.(1)
    return finalized.blob
  } catch (error) {
    if (recorderError) throw recorderError
    if (signal.aborted) throw cancelled()
    if (error instanceof DOMException && error.name !== 'AbortError') throw new Error('浏览器无法完成画布视频录制，请重试或先保存录制文件。', { cause: error })
    throw error
  } finally {
    options.signal?.removeEventListener('abort', externalAbort)
    signal.removeEventListener('abort', stopCapture)
    if (recorder && recorder.state !== 'inactive') { try { recorder.stop() } catch { /* Already stopping. */ } }
    if (recorderStarted && stopCompleted) await settleWithin(stopCompleted, 1000)
    recorder?.removeEventListener('dataavailable', dataAvailable)
    recorder?.removeEventListener('error', recordingError)
    stream?.getTracks().forEach(track => track.stop())
    session?.destroy()
    context?.unconfigure()
    canvas.remove()
    canvas.width = 0; canvas.height = 0
  }
}
