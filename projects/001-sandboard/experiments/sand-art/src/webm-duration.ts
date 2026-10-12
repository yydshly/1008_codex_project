// Minimal WebM duration finalizer; no remuxing, frame changes, or synthesized cues.
// Duration is Float64 Segment ticks; TimestampScale is nanoseconds per tick.
// https://www.matroska.org/technical/elements.html
// https://www.webmproject.org/docs/container/

export interface WebMDurationResult { blob: Blob; updated: boolean; reason?: string }
type Element = { id: number; start: number; sizeStart: number; sizeWidth: number; payload: number; end: number; unknown: boolean }
const EBML = 0x1a45dfa3, SEGMENT = 0x18538067, INFO = 0x1549a966, TRACKS = 0x1654ae6b, CLUSTER = 0x1f43b675
const DURATION = 0x4489, SCALE = 0x2ad7b1, VOID = 0xec, CRC = 0xbf, SEEK_HEAD = 0x114d9b74, CUES = 0x1c53bb6b
const TOP_IDS = new Set([INFO, TRACKS, CLUSTER, VOID, CRC, SEEK_HEAD, CUES])

function unsupported(reason: string): never { throw new Error(reason) }

function vint(bytes: Uint8Array, start: number, limit: number, id = false) {
  if (start >= limit || bytes[start] === 0) unsupported('EBML 头不完整。')
  let width = 1
  while (width <= 8 && !(bytes[start] & (1 << (8 - width)))) width++
  if (width > (id ? 4 : 8) || start + width > limit) unsupported('EBML 长度编码不受支持。')
  let value = BigInt(id ? bytes[start] : bytes[start] & ((1 << (8 - width)) - 1))
  for (let offset = 1; offset < width; offset++) value = value * 256n + BigInt(bytes[start + offset])
  const unknown = !id && value === (1n << BigInt(width * 7)) - 1n
  if (!unknown && value > BigInt(Number.MAX_SAFE_INTEGER)) unsupported('EBML 元素过大。')
  return { value: unknown ? 0 : Number(value), width, unknown }
}

function element(bytes: Uint8Array, start: number, limit: number): Element {
  const id = vint(bytes, start, limit, true)
  const sizeStart = start + id.width, size = vint(bytes, sizeStart, limit)
  const payload = sizeStart + size.width
  if (!size.unknown && size.value > limit - payload) unsupported('WebM 元素超出文件边界。')
  return { id: id.value, start, sizeStart, sizeWidth: size.width, payload, end: size.unknown ? limit : payload + size.value, unknown: size.unknown }
}

function uint(bytes: Uint8Array, item: Element) {
  if (item.unknown || item.end - item.payload < 1 || item.end - item.payload > 8) unsupported('时间基准编码无效。')
  let value = 0n
  for (let index = item.payload; index < item.end; index++) value = value * 256n + BigInt(bytes[index])
  if (value <= 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) unsupported('时间基准数值无效。')
  return Number(value)
}

function sizeBytes(value: number, minimumWidth = 1): Uint8Array<ArrayBuffer> {
  let width = minimumWidth
  while (width <= 8 && BigInt(value) >= (1n << BigInt(width * 7)) - 1n) width++
  if (width > 8) unsupported('WebM 长度无法安全编码。')
  let encoded = BigInt(value) | (1n << BigInt(width * 7))
  const result = new Uint8Array(width)
  for (let index = width - 1; index >= 0; index--) { result[index] = Number(encoded & 255n); encoded >>= 8n }
  return result
}

function durationBytes(ticks: number, sizeWidth = 1): Uint8Array<ArrayBuffer> {
  const size = sizeBytes(8, sizeWidth), result = new Uint8Array(2 + size.length + 8)
  result.set([0x44, 0x89]); result.set(size, 2)
  new DataView(result.buffer).setFloat64(2 + size.length, ticks, false)
  return result
}

function voidBytes(length: number): Uint8Array<ArrayBuffer> {
  if (length < 2) unsupported('没有足够的预留空间。')
  for (let width = 1; width <= 8; width++) {
    const payloadLength = length - 1 - width
    if (payloadLength < 0) continue
    const size = sizeBytes(payloadLength, width)
    if (size.length !== width) continue
    const result = new Uint8Array(length)
    result[0] = VOID; result.set(size, 1)
    return result
  }
  return unsupported('预留空间无法安全编码。')
}

function replace(blob: Blob, patches: Array<{ start: number; end: number; bytes: Uint8Array<ArrayBuffer> }>): Blob {
  patches.sort((left, right) => left.start - right.start)
  const parts: BlobPart[] = []
  let offset = 0
  for (const patch of patches) {
    if (patch.start < offset) unsupported('WebM 修改范围重叠。')
    parts.push(blob.slice(offset, patch.start), patch.bytes); offset = patch.end
  }
  parts.push(blob.slice(offset))
  return new Blob(parts, { type: blob.type })
}

/** Unsupported structures retain the exact original Blob and report why it was kept. */
export async function finalizeWebMDuration(blob: Blob, milliseconds: number): Promise<WebMDurationResult> {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw new RangeError('视频时长必须是大于零的毫秒数。')
  try {
    const bytes = new Uint8Array(await blob.arrayBuffer())
    const header = element(bytes, 0, bytes.length)
    if (header.id !== EBML || header.unknown) unsupported('文件不是支持的 WebM。')
    let webm = false
    for (let offset = header.payload; offset < header.end;) {
      const item = element(bytes, offset, header.end)
      if (item.unknown) unsupported('EBML 头包含未知长度。')
      if (item.id === 0x4282) webm = new TextDecoder().decode(bytes.subarray(item.payload, item.end)) === 'webm'
      offset = item.end
    }
    if (!webm) unsupported('文件不是 WebM 类型。')
    const segment = element(bytes, header.end, bytes.length)
    if (segment.id !== SEGMENT || segment.end !== bytes.length) unsupported('仅支持单个完整 WebM Segment。')
    let info: Element | undefined, duration: Element | undefined, scale = 1_000_000
    const voids: Element[] = []
    let positionReferences = false, unsafeChecksum = false, clusterChecksum = false
    for (let offset = segment.payload; offset < segment.end;) {
      const item = element(bytes, offset, segment.end)
      if (!TOP_IDS.has(item.id)) unsupported('WebM 顶层结构不受支持。')
      if (item.id === CRC) unsafeChecksum = true
      if (item.id === SEEK_HEAD || item.id === CUES) positionReferences = true
      if (item.id === INFO) {
        if (info || item.unknown) unsupported('Segment Info 结构不受支持。')
        info = item
        for (let cursor = item.payload; cursor < item.end;) {
          const child = element(bytes, cursor, item.end)
          if (child.unknown) unsupported('Info 子元素长度不受支持。')
          if (child.id === CRC) unsafeChecksum = true
          if (child.id === SCALE) scale = uint(bytes, child)
          if (child.id === VOID) voids.push(child)
          if (child.id === DURATION) {
            if (duration || ![4,8].includes(child.end - child.payload)) unsupported('Duration 编码不受支持。')
            duration = child
          }
          cursor = child.end
        }
      }
      if (item.id === CLUSTER) {
        let cursor = item.payload
        while (cursor < item.end) {
          const child = element(bytes, cursor, item.end)
          if (item.unknown && TOP_IDS.has(child.id) && child.id !== CRC && child.id !== VOID) break
          if (child.unknown) unsupported('Cluster 子元素长度不受支持。')
          if (child.id === 0xa7) positionReferences = true
          if (child.id === CRC) clusterChecksum = true
          if (child.id === 0xa0) {
            // MediaRecorder 的静止尾帧可能使用 BlockGroup + BlockDuration。
            // ReferenceBlock 是相对时间，不是字节位置；整组编码保持原样。
            // https://www.matroska.org/technical/elements.html
            let blocks = 0
            for (let groupCursor = child.payload; groupCursor < child.end;) {
              const part = element(bytes, groupCursor, child.end)
              if (part.unknown || ![0xa1, 0x9b, 0xfb, 0xfa, 0x75a1, 0x75a2, CRC, VOID].includes(part.id)) unsupported('BlockGroup 含暂不支持的结构。')
              if (part.id === 0xa1) blocks++
              if (part.id === CRC) clusterChecksum = true
              if (part.id === 0x75a1) {
                // VP9 的 alpha 额外数据保持字节不变，仅接受标准 BlockMore。
                let groups = 0
                for (let addCursor = part.payload; addCursor < part.end;) {
                  const more = element(bytes, addCursor, part.end)
                  if (more.unknown || more.id !== 0xa6) unsupported('BlockAdditions 结构不受支持。')
                  let data = 0
                  for (let dataCursor = more.payload; dataCursor < more.end;) {
                    const addition = element(bytes, dataCursor, more.end)
                    if (addition.unknown || ![0xee, 0xa5].includes(addition.id)) unsupported('BlockMore 结构不受支持。')
                    if (addition.id === 0xa5) data++
                    dataCursor = addition.end
                  }
                  if (data !== 1) unsupported('BlockMore 必须含单个附加数据。')
                  groups++;addCursor = more.end
                }
                if (!groups) unsupported('BlockAdditions 缺少附加数据。')
              }
              groupCursor = part.end
            }
            if (blocks !== 1) unsupported('BlockGroup 必须含单个 Block。')
          } else if (![0xe7, 0xa3, 0xab, 0xa7, CRC, VOID].includes(child.id)) unsupported('Cluster 含暂不支持的结构。')
          cursor = child.end
        }
        offset = cursor
      } else {
        if (item.unknown) unsupported('顶层未知长度不受支持。')
        offset = item.end
      }
    }
    if (!info) unsupported('文件缺少 Segment Info。')
    // Even in-place writes invalidate a checksum covering Info or the Segment.
    if (unsafeChecksum) unsupported('Info 或 Segment 带校验和，保留原容器。')
    const ticks = milliseconds * 1_000_000 / scale
    if (!Number.isFinite(ticks)) unsupported('视频时长超出可表示范围。')

    if (duration && duration.end - duration.payload === 8) {
      const float = new Uint8Array(8); new DataView(float.buffer).setFloat64(0, ticks, false)
      return { blob: replace(blob, [{ start: duration.payload, end: duration.end, bytes: float }]), updated: true }
    }
    // Reuse padding in Info to leave all top-level element positions unchanged.
    const padding = voids.find(item => item.end - item.start >= 11)
    if (padding) {
      const length = padding.end - padding.start
      const encoded = durationBytes(ticks, length === 12 ? 2 : 1)
      const replacement = new Uint8Array(length); replacement.set(encoded)
      if (length > encoded.length) replacement.set(voidBytes(length - encoded.length), encoded.length)
      const patches = [{ start: padding.start, end: padding.end, bytes: replacement }]
      if (duration) patches.push({ start: duration.start, end: duration.end, bytes: voidBytes(duration.end - duration.start) })
      return { blob: replace(blob, patches), updated: true }
    }
    if (positionReferences || clusterChecksum) unsupported('容器含位置索引或 Cluster 校验和且无可用预留空间。')

    // Native MediaRecorder has no position indexes: shift complete clusters intact.
    const encoded = durationBytes(ticks)
    const removed = duration ? duration.end - duration.start : 0
    const payloadSize = info.end - info.payload - removed + encoded.length
    const infoSize = sizeBytes(payloadSize, info.sizeWidth)
    const delta = encoded.length - removed + infoSize.length - info.sizeWidth
    const parts: BlobPart[] = [blob.slice(0, segment.sizeStart)]
    parts.push(segment.unknown ? blob.slice(segment.sizeStart, segment.payload) : sizeBytes(segment.end - segment.payload + delta, segment.sizeWidth))
    parts.push(blob.slice(segment.payload, info.sizeStart), infoSize)
    if (duration) parts.push(blob.slice(info.payload, duration.start), blob.slice(duration.end, info.end))
    else parts.push(blob.slice(info.payload, info.end))
    parts.push(encoded, blob.slice(info.end))
    return { blob: new Blob(parts, { type: blob.type }), updated: true }
  } catch (error) {
    return { blob, updated: false, reason: `视频已保留为原始流式 WebM，总时长未补齐：${error instanceof Error ? error.message : '容器结构不受支持。'}` }
  }
}
