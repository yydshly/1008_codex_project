// Verify archive coverage and packaged evidence without running old simulations.
import { readFile, access, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

const app = fileURLToPath(new URL('../', import.meta.url))
const project = path.resolve(app, '../..')
const read = (file) => readFile(file, 'utf8')
const catalog = JSON.parse(await read(path.join(app, 'src/research/catalog.json')))
const comparisons = JSON.parse(await read(path.join(app, 'src/research/comparisons.json')))
const versionRecords = JSON.parse(await read(path.join(app, 'src/research/version-records.json')))
const mediaSource = await read(path.join(app, 'src/research/media.ts'))
const versions = catalog.flatMap((item) => item.versions).sort((a, b) => a - b)
assert.deepEqual(versions, Array.from({ length: 36 }, (_, index) => index + 1), '每个版本必须且只能覆盖一次')
assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length)
assert.equal(new Set(catalog.map((item) => item.group)).size, 5)
assert.deepEqual(Object.keys(versionRecords).map(Number).sort((a, b) => a - b), versions)
for (const [version, record] of Object.entries(versionRecords)) {
  const source = await readFile(path.join(project, record.doc))
  const copy = await readFile(path.join(app, 'public/research-records', record.record))
  assert.ok(source.equals(copy), `v${version}: 逐版本原始记录不一致`)
}

const files = new Set()
let videoCount = 0
for (const item of catalog) {
  for (const key of ['title', 'goal', 'change', 'result', 'lesson', 'kind', 'doc']) assert.ok(item[key]?.trim(), `${item.id}: ${key} 缺失`)
  for (const file of [item.image, ...item.extra, item.video].filter(Boolean)) files.add(file)
  const originalRecord = await readFile(path.join(project, item.doc))
  const copiedRecord = await readFile(path.join(app, `public/research-records/${item.id}.md`))
  assert.ok(originalRecord.equals(copiedRecord), `${item.id}: 原始记录副本不一致`)
  if (item.demo) {
    const destination = path.resolve(app, 'research', item.demo.split('#')[0], 'index.html')
    assert.ok(destination.startsWith(app), `${item.id}: 演示路径越界`)
    await access(destination)
  }
  if (item.video) videoCount++
}
for (const pair of comparisons) {
  files.add(pair.left); files.add(pair.right)
  for (const key of ['leftLabel', 'rightLabel', 'note']) assert.ok(pair[key]?.trim())
}
assert.equal(videoCount, 11)
const importedFiles = new Set([...mediaSource.matchAll(/from ["']\.\.\/\.\.\/\.\.\/\.\.\/assets\/(.+)\?url["']/g)].map((match) => match[1]))
assert.deepEqual([...files].sort(), [...importedFiles].sort(), '静态导入应恰好覆盖所选媒体')
let bytes = 0
for (const file of files) bytes += (await readFile(path.join(project, 'assets', file))).byteLength

if (process.argv.includes('--built')) {
  const dist = path.join(app, 'dist')
  const config = await read(path.join(app, 'vite.config.js'))
  const inputs = [...config.matchAll(/new URL\('\.\/(.+?\.html)'/g)].map((match) => match[1])
  assert.equal(inputs.length, 15)
  for (const htmlFile of inputs) {
    const html = await read(path.join(dist, htmlFile))
    for (const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g)) {
      if (!match[1].startsWith('http')) await access(path.resolve(dist, path.dirname(htmlFile), match[1]))
    }
  }
  for (const file of await readdir(path.join(app, 'public/research-records'))) {
    const source = await readFile(path.join(app, 'public/research-records', file))
    const built = await readFile(path.join(dist, 'research-records', file))
    assert.ok(source.equals(built), `构建缺少记录或许可: ${file}`)
  }
  // Check original bytes, including repeated filenames from different versions.
  const assets = await readdir(path.join(dist, 'assets'))
  const hashed = new Map()
  const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
  for (const file of files) {
    const { name, ext } = path.parse(file)
    const candidates = assets.filter((built) => built.startsWith(name + '-') && built.endsWith(ext))
    const sourceHash = digest(await readFile(path.join(project, 'assets', file)))
    let matched = false
    for (const candidate of candidates) {
      if (!hashed.has(candidate)) hashed.set(candidate, digest(await readFile(path.join(dist, 'assets', candidate))))
      if (hashed.get(candidate) === sourceHash) { matched = true; break }
    }
    assert.ok(matched, `构建遗漏或改变媒体: ${file}`)
  }
}
console.log(JSON.stringify({ attempts: catalog.length, versions: versions.length, groups: 5, videos: videoCount, selectedMedia: files.size, mediaMiB: +(bytes / 1024 / 1024).toFixed(1), built: process.argv.includes('--built') }, null, 2))
