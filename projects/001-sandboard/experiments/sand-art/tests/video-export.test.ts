import { afterEach, expect, test, vi } from 'vitest'
import type { Recording } from '../src/recording'
import { exportReplayVideo } from '../src/video-export'

const replay = vi.hoisted(() => ({ durationTicks: 12, sessions: [] as Array<{ tick: number; durationTicks: number; seek: ReturnType<typeof vi.fn>; advance: ReturnType<typeof vi.fn>; encodeRender: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> }> }))
vi.mock('../src/replay', () => ({ ReplaySession: { create: vi.fn(async () => {
  const session = {
    tick: 0, durationTicks: replay.durationTicks,
    seek: vi.fn(async (tick: number) => { session.tick = tick }),
    advance: vi.fn(async (ticks: number) => { session.tick += ticks }),
    encodeRender: vi.fn(), destroy: vi.fn(),
  }
  replay.sessions.push(session)
  return session
}) } }))

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); replay.durationTicks = 12; replay.sessions.length = 0 })

function browser({ manual = true, supported = true, failVp9 = false, encoderError = false, videoData = undefined as Blob | undefined } = {}) {
  const tracks: Array<{ stop: ReturnType<typeof vi.fn>; requestFrame?: ReturnType<typeof vi.fn> }> = []
  const recorderInstances: FakeRecorder[] = []
  class FakeRecorder extends EventTarget {
    static isTypeSupported = vi.fn(() => supported)
    state: RecordingState = 'inactive'
    mimeType: string
    startedAt = 0
    stoppedAt = 0
    constructor(_stream: MediaStream, options: MediaRecorderOptions) {
      super()
      if (failVp9 && options.mimeType?.includes('vp9')) throw new Error('encoder unavailable')
      this.mimeType = options.mimeType!
      recorderInstances.push(this)
    }
    start() {
      this.startedAt = performance.now()
      this.state = 'recording'
      if (encoderError) queueMicrotask(() => this.dispatchEvent(new Event('error')))
    }
    stop() {
      if (this.state === 'inactive') throw new DOMException('inactive', 'InvalidStateError')
      this.stoppedAt = performance.now()
      this.state = 'inactive'
      queueMicrotask(() => {
        const event = Object.assign(new Event('dataavailable'), { data: videoData ?? new Blob([`encoded-final-${replay.sessions[0]?.tick}`]) })
        this.dispatchEvent(event)
        this.dispatchEvent(new Event('stop'))
      })
    }
  }
  const context = { configure: vi.fn(), unconfigure: vi.fn(), getCurrentTexture: () => ({ createView: () => ({}) }) }
  const canvas = {
    width: 0, height: 0, style: { cssText: '' }, dataset: {}, setAttribute: vi.fn(), remove: vi.fn(),
    getContext: vi.fn(() => context),
    captureStream: vi.fn(() => {
      const track = { stop: vi.fn(), ...(manual ? { requestFrame: vi.fn() } : {}) }
      tracks.push(track)
      return { getVideoTracks: () => [track], getTracks: () => [track] }
    }),
  }
  vi.stubGlobal('MediaRecorder', FakeRecorder)
  vi.stubGlobal('document', { createElement: vi.fn(() => canvas), body: { append: vi.fn() } })
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 0))
  vi.stubGlobal('cancelAnimationFrame', (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer))
  const device = { createCommandEncoder: () => ({ finish: () => ({}) }), queue: { submit: vi.fn(), onSubmittedWorkDone: vi.fn(async () => {}) } } as unknown as GPUDevice
  return { device, canvas, context, tracks, recorderInstances }
}

test('video captures the exact final replay state, waits for final data, and releases resources', async () => {
  const environment = browser()
  const progress: number[] = []
  const warnings: string[] = []
  const blob = await exportReplayVideo(environment.device, 'bgra8unorm', {} as Recording, { onProgress: value => progress.push(value), onWarning: value => warnings.push(value) })
  expect(blob.type).toBe('video/webm;codecs=vp9')
  expect(await blob.text()).toBe('encoded-final-12')
  expect(progress[0]).toBe(0); expect(progress.at(-1)).toBe(1)
  expect(progress.every((value, index) => value >= 0 && value <= 1 && (index === 0 || value >= progress[index - 1]))).toBe(true)
  const session = replay.sessions[0]
  expect(session.advance.mock.calls.map(call => call[0])).toEqual([4,4,4])
  expect(session.encodeRender.mock.calls.at(-1)?.[2]).toBeCloseTo(0.1)
  // The final state is re-presented, rather than merely held without further
  // manual capture requests. No advance may move it beyond the final tick.
  const renderedTimes = session.encodeRender.mock.calls.map(call => call[2] as number)
  expect(renderedTimes).toHaveLength(7)
  expect(renderedTimes.slice(-4)).toEqual([0.1, 0.1, 0.1, 0.1])
  expect(session.tick).toBe(session.durationTicks)
  expect(environment.canvas.captureStream).toHaveBeenCalledWith(0)
  expect(environment.tracks[0].requestFrame).toHaveBeenCalledTimes(renderedTimes.length * 2)
  expect(environment.tracks[0].stop).toHaveBeenCalledOnce()
  expect(environment.context.unconfigure).toHaveBeenCalledOnce()
  expect(environment.canvas.remove).toHaveBeenCalledOnce()
  expect(session.destroy).toHaveBeenCalledOnce()
  expect(warnings).toHaveLength(1); expect(warnings[0]).toMatch(/总时长未补齐/)
})

test('demo export synchronizes the instructional hand with the exact recorded tick', async () => {
  const environment = browser()
  const cursorAt = vi.fn((tick: number) => tick < 12 ? { x: tick, y: 80, radius: 16, tool: 'pour' as const, active: true, down: true } : null)
  await exportReplayVideo(environment.device, 'bgra8unorm', {} as Recording, { cursorAt })
  const calls = replay.sessions[0].encodeRender.mock.calls
  expect(calls.map(call => call[3])).toEqual(cursorAt.mock.results.map(result => result.value))
  expect(cursorAt.mock.calls.map(call => call[0])).toEqual([0, 4, 8, 12, 12, 12, 12])
  expect(calls.slice(-4).every(call => call[3] === null)).toBe(true)
})

test('exported WebM Duration measures recorder wall time including its final-frame hold', async () => {
  // A native-style streaming Segment: DocType webm, TimestampScale 1,000,000 ns.
  const videoData = new Blob([Uint8Array.of(0x1a,0x45,0xdf,0xa3,0x87,0x42,0x82,0x84,0x77,0x65,0x62,0x6d,0x18,0x53,0x80,0x67,0xff,0x15,0x49,0xa9,0x66,0x87,0x2a,0xd7,0xb1,0x83,0x0f,0x42,0x40)])
  const environment = browser({ videoData })
  const warning = vi.fn()
  const blob = await exportReplayVideo(environment.device, 'bgra8unorm', {} as Recording, { onWarning: warning })
  const bytes = await blob.arrayBuffer()
  const elapsed = new DataView(bytes).getFloat64(bytes.byteLength - 8)
  const recorder = environment.recorderInstances[0]
  expect(elapsed).toBeGreaterThanOrEqual(220) // 100ms replay plus four ~33ms capture intervals.
  expect(Math.abs(elapsed - (recorder.stoppedAt - recorder.startedAt))).toBeLessThan(20)
  expect(blob.size - videoData.size).toBe(11)
  expect(warning).not.toHaveBeenCalled()
})

test('cancelling active export discards the video and releases the independent replay', async () => {
  const environment = browser()
  const controller = new AbortController()
  await expect(exportReplayVideo(environment.device, 'bgra8unorm', {} as Recording, {
    signal: controller.signal, onProgress: value => { if (value > 0) controller.abort() },
  })).rejects.toMatchObject({ name: 'AbortError' })
  expect(environment.recorderInstances[0].state).toBe('inactive')
  expect(environment.tracks[0].stop).toHaveBeenCalledOnce()
  expect(environment.context.unconfigure).toHaveBeenCalledOnce()
  expect(environment.canvas.remove).toHaveBeenCalledOnce()
  expect(replay.sessions[0].destroy).toHaveBeenCalled()
})

test('capture falls back to 30fps and VP8 when manual frames or the VP9 encoder are unavailable', async () => {
  const environment = browser({ manual: false, failVp9: true })
  const blob = await exportReplayVideo(environment.device, 'bgra8unorm', {} as Recording)
  expect(blob.type).toBe('video/webm;codecs=vp8')
  expect(environment.canvas.captureStream.mock.calls.map(call => call[0])).toEqual([0,30])
  expect(environment.tracks.every(track => track.stop.mock.calls.length === 1)).toBe(true)
})

test('encoder failure reports a friendly error and closes the media and GPU resources', async () => {
  const environment = browser({ encoderError: true })
  await expect(exportReplayVideo(environment.device, 'bgra8unorm', {} as Recording)).rejects.toThrow(/浏览器未能完成视频录制/)
  expect(environment.tracks[0].stop).toHaveBeenCalledOnce()
  expect(environment.context.unconfigure).toHaveBeenCalledOnce()
  expect(replay.sessions[0].destroy).toHaveBeenCalled()
})

test('empty replay and unsupported recording APIs are rejected without leaving resources', async () => {
  const environment = browser()
  replay.durationTicks = 0
  await expect(exportReplayVideo(environment.device, 'bgra8unorm', {} as Recording)).rejects.toThrow(/录制为空/)
  expect(replay.sessions[0].destroy).toHaveBeenCalledOnce()
  expect(environment.canvas.remove).toHaveBeenCalledOnce()
  expect(environment.canvas.captureStream).not.toHaveBeenCalled()
  vi.stubGlobal('MediaRecorder', undefined)
  await expect(exportReplayVideo(environment.device, 'bgra8unorm', {} as Recording)).rejects.toThrow(/不支持视频录制/)
})
