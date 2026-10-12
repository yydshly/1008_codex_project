import { expect, test } from 'vitest'
import { finalizeWebMDuration } from '../src/webm-duration'

const ID = { ebml: 0x1a45dfa3, segment: 0x18538067, info: 0x1549a966, scale: 0x2ad7b1, duration: 0x4489, cluster: 0x1f43b675, void: 0xec, crc: 0xbf, seek: 0x114d9b74, cues: 0x1c53bb6b }
function join(...parts: Uint8Array[]) { return Uint8Array.from(parts.flatMap(part => [...part])) }
function integer(value: number) {
  const result: number[] = []
  do { result.unshift(value % 256); value = Math.floor(value / 256) } while (value > 0)
  return Uint8Array.from(result)
}
function size(value: number, width?: number) {
  const length = width ?? (value < 127 ? 1 : value < 16383 ? 2 : 3)
  const result = new Uint8Array(length)
  for (let index = length - 1; index >= 0; index--) { result[index] = value % 256; value = Math.floor(value / 256) }
  result[0] |= 1 << (8 - length)
  return result
}
function item(id: number, payload: Uint8Array, options: { unknown?: boolean; width?: number } = {}) {
  return join(integer(id), options.unknown ? Uint8Array.of(1,255,255,255,255,255,255,255) : size(payload.length, options.width), payload)
}
function duration(value: number, width = 8) {
  const result = new Uint8Array(width), view = new DataView(result.buffer)
  if (width === 8) view.setFloat64(0, value); else view.setFloat32(0, value)
  return item(ID.duration, result)
}
const scale = (value = 1_000_000) => item(ID.scale, integer(value))
const cluster = (children = new Uint8Array(), unknown = false) => item(ID.cluster, join(item(0xe7, Uint8Array.of(42)), item(0xa3, Uint8Array.of(0x81,0,4,0x80,11,22,33)), children), { unknown })

test('MediaRecorder 尾帧 BlockGroup 可补齐时长，块数据和相对时间保持不变',async()=>{
  const additions=item(0x75a1,item(0xa6,join(item(0xee,Uint8Array.of(1)),item(0xa5,Uint8Array.of(10,20,30)))))
  const group=item(0xa0,join(item(0xa1,Uint8Array.of(0x81,0,4,0,11,22,33)),additions,item(0x9b,Uint8Array.of(40)),item(0xfb,Uint8Array.of(0xfc))))
  const source=fixture(scale(),{unknown:true,cluster:cluster(group,true)})
  const result=await finalizeWebMDuration(source,10300)
  expect(result.updated).toBe(true)
  const encoded=new Uint8Array(await result.blob.arrayBuffer())
  expect([...encoded.slice(-group.length)]).toEqual([...group])
})

test('BlockGroup 位置引用和不合法结构仍保留原始容器',async()=>{
  for(const extra of [item(0xc8,item(0xc9,Uint8Array.of(12))),item(0xa1,Uint8Array.of(1)),item(0x75a1,item(0xa6,item(0xc9,Uint8Array.of(12))))]){
    const group=item(0xa0,join(item(0xa1,Uint8Array.of(0x81,0,4,0,11)),extra))
    const source=fixture(scale(),{cluster:cluster(group)})
    const result=await finalizeWebMDuration(source,10300)
    expect(result.updated).toBe(false);expect(result.blob).toBe(source)
  }
})
function fixture(info: Uint8Array, options: { unknown?: boolean; before?: Uint8Array; after?: Uint8Array; cluster?: Uint8Array } = {}) {
  const header = item(ID.ebml, item(0x4282, new TextEncoder().encode('webm')))
  return new Blob([join(header, item(ID.segment, join(options.before ?? new Uint8Array(), item(ID.info, info), options.cluster ?? cluster(), options.after ?? new Uint8Array()), { unknown: options.unknown }))], { type: 'video/webm;codecs=vp9' })
}
// Independent fixture reader asserts every bounded element ends at its encoded boundary.
function read(bytes: Uint8Array, start: number, limit = bytes.length) {
  let idWidth = 1; while (!(bytes[start] & (1 << (8 - idWidth)))) idWidth++
  let id = 0; for (let index = 0; index < idWidth; index++) id = id * 256 + bytes[start + index]
  const sizeStart = start + idWidth
  let sizeWidth = 1; while (!(bytes[sizeStart] & (1 << (8 - sizeWidth)))) sizeWidth++
  let length = bytes[sizeStart] & ((1 << (8 - sizeWidth)) - 1)
  let unknown = length === (1 << (8 - sizeWidth)) - 1
  for (let index = 1; index < sizeWidth; index++) { length = length * 256 + bytes[sizeStart + index]; unknown &&= bytes[sizeStart + index] === 255 }
  const payload = sizeStart + sizeWidth, end = unknown ? limit : payload + length
  expect(end).toBeLessThanOrEqual(limit)
  return { id, start, sizeStart, sizeWidth, payload, end, unknown }
}
function children(bytes: Uint8Array, parent: ReturnType<typeof read>) {
  const result: ReturnType<typeof read>[] = []
  for (let offset = parent.payload; offset < parent.end;) { const child = read(bytes, offset, parent.end); result.push(child); offset = child.end }
  return result
}
async function inspect(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const header = read(bytes, 0), segment = read(bytes, header.end)
  expect(segment.end).toBe(bytes.length)
  const top = children(bytes, segment), info = top.find(child => child.id === ID.info)!
  const fields = children(bytes, info), durations = fields.filter(child => child.id === ID.duration)
  return { bytes, segment, info, fields, top, durations, milliseconds: durations.length ? new DataView(bytes.buffer).getFloat64(durations[0].payload) : undefined }
}

test('Chrome streaming Segment and Cluster receive Duration without changing any cluster bytes', async () => {
  const sourceCluster = cluster(new Uint8Array(), true)
  const original = fixture(join(scale(), item(0x4d80, new TextEncoder().encode('Chrome')), item(0x5741, new TextEncoder().encode('Chrome'))), { unknown: true, cluster: sourceCluster })
  const result = await finalizeWebMDuration(original, 600.125)
  expect(result.updated).toBe(true); expect(result.blob.type).toBe(original.type)
  const decoded = await inspect(result.blob)
  expect(decoded.milliseconds).toBe(600.125); expect(decoded.segment.unknown).toBe(true)
  expect(decoded.info.end - decoded.info.payload).toBe(36)
  expect(decoded.durations).toHaveLength(1)
  expect(decoded.bytes.slice(decoded.top.find(child => child.id === ID.cluster)!.start)).toEqual(sourceCluster)
  expect(result.blob.size - original.size).toBe(11)
})

test('Info size VINT expands across 126 bytes and the bounded Segment remains exact', async () => {
  const original = fixture(join(scale(), item(0x4d80, new Uint8Array(110)))) // Info payload = 120.
  const before = await inspect(original), result = await finalizeWebMDuration(original, 1200)
  const after = await inspect(result.blob)
  expect(result.updated).toBe(true)
  expect(before.info.sizeWidth).toBe(1); expect(after.info.sizeWidth).toBe(2)
  expect(after.info.end - after.info.payload).toBe(131)
  expect(after.milliseconds).toBe(1200)
  expect(result.blob.size - original.size).toBe(12)
  expect(after.bytes.slice(after.top.find(child => child.id === ID.cluster)!.start)).toEqual(cluster())
})

test('bounded Segment size VINT expands without moving offsets inside its clusters', async () => {
  const sourceCluster = cluster()
  const infoLength = 126 - sourceCluster.length - 5
  const original = fixture(join(scale(), item(0x4d80, new Uint8Array(infoLength - 10))))
  const before = await inspect(original), result = await finalizeWebMDuration(original, 750)
  const after = await inspect(result.blob)
  expect(before.segment.end - before.segment.payload).toBe(126)
  expect(before.segment.sizeWidth).toBe(1); expect(after.segment.sizeWidth).toBe(2)
  expect(after.segment.end - after.segment.payload).toBe(137)
  expect(result.blob.size - original.size).toBe(12)
  expect(after.bytes.slice(after.top.find(child => child.id === ID.cluster)!.start)).toEqual(sourceCluster)
})

test('Duration uses Segment ticks under a non-default TimestampScale', async () => {
  const result = await finalizeWebMDuration(fixture(scale(2_000_000)), 1500)
  expect(result.updated).toBe(true)
  expect((await inspect(result.blob)).milliseconds).toBe(750)
})

test('existing Float64 Duration is replaced in place despite position indexes', async () => {
  const original = fixture(join(scale(), duration(10)), { before: item(ID.seek, new Uint8Array()), after: item(ID.cues, new Uint8Array()) })
  const before = await inspect(original), result = await finalizeWebMDuration(original, 999)
  const after = await inspect(result.blob)
  expect(result.updated).toBe(true); expect(result.blob.size).toBe(original.size)
  expect(after.top.map(child => child.start)).toEqual(before.top.map(child => child.start))
  expect(after.milliseconds).toBe(999)
  const expected = before.bytes.slice(); new DataView(expected.buffer).setFloat64(before.durations[0].payload, 999)
  expect(after.bytes).toEqual(expected)
})

test.each([11,12,13,138])('Info Void of %i bytes is reused without moving indexed elements', async length => {
  const payloadLength = length > 128 ? length - 3 : length - 2
  const original = fixture(join(scale(), item(ID.void, new Uint8Array(payloadLength))), { after: item(ID.cues, new Uint8Array()) })
  const before = await inspect(original), result = await finalizeWebMDuration(original, 640)
  const after = await inspect(result.blob)
  expect(result.updated).toBe(true); expect(result.blob.size).toBe(original.size)
  expect(after.top.map(child => child.start)).toEqual(before.top.map(child => child.start))
  expect(after.durations).toHaveLength(1); expect(after.milliseconds).toBe(640)
})

test.each([false,true])('Float32 Duration upgrades to a single Float64 (padding=%s)', async padding => {
  const original = fixture(join(scale(), duration(10, 4), ...(padding ? [item(ID.void, new Uint8Array(9))] : [])), { after: padding ? item(ID.cues, new Uint8Array()) : undefined })
  const result = await finalizeWebMDuration(original, 800), after = await inspect(result.blob)
  expect(result.updated).toBe(true); expect(after.durations).toHaveLength(1)
  expect(after.durations[0].end - after.durations[0].payload).toBe(8)
  expect(after.milliseconds).toBe(800)
  expect(result.blob.size - original.size).toBe(padding ? 0 : 4)
})

test.each([
  ['SeekHead', { before: item(ID.seek, new Uint8Array()) }],
  ['Cues', { after: item(ID.cues, new Uint8Array()) }],
  ['Cluster Position', { cluster: cluster(item(0xa7, Uint8Array.of(0))) }],
  ['Cluster CRC', { cluster: cluster(item(ID.crc, new Uint8Array(4))) }],
  ['Segment CRC', { before: item(ID.crc, new Uint8Array(4)) }],
] as const)('%s without safe in-place space retains the original Blob', async (_name, options) => {
  const original = fixture(scale(), options), result = await finalizeWebMDuration(original, 600)
  expect(result.updated).toBe(false); expect(result.blob).toBe(original)
  expect(result.reason).toMatch(/保留/)
})

test('Info CRC refuses even an otherwise safe existing Duration replacement', async () => {
  const original = fixture(join(scale(), duration(0), item(ID.crc, new Uint8Array(4))))
  const result = await finalizeWebMDuration(original, 100)
  expect(result.updated).toBe(false); expect(result.blob).toBe(original)
  expect(result.reason).toMatch(/校验和/)
})

test.each(['truncated','duplicate Info','unsupported Cluster child','not WebM'])('malformed or unsupported %s preserves all original data', async kind => {
  let original = fixture(scale())
  if (kind === 'truncated') original = original.slice(0, original.size - 1)
  if (kind === 'duplicate Info') original = fixture(scale(), { after: item(ID.info, scale()) })
  if (kind === 'unsupported Cluster child') original = fixture(scale(), { cluster: cluster(item(0xa0, new Uint8Array())) })
  if (kind === 'not WebM') original = new Blob(['unrelated bytes'])
  const result = await finalizeWebMDuration(original, 500)
  expect(result.updated).toBe(false); expect(result.blob).toBe(original)
  expect(result.reason).toMatch(/总时长未补齐/)
})

test.each([0,-1,Number.NaN,Number.POSITIVE_INFINITY])('invalid duration %s is rejected before modifying a container', async milliseconds => {
  await expect(finalizeWebMDuration(fixture(scale()), milliseconds)).rejects.toThrow(RangeError)
})
