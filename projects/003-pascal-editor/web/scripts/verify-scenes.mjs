import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AnyNode, SceneMaterial } from '@pascal-app/core/schema'
import { MATERIAL_CATALOG } from '@pascal-app/core/material-library'
import useScene from '@pascal-app/core/store'

const publicRoot = fileURLToPath(new URL('../public/', import.meta.url))

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(publicRoot, relativePath), 'utf8'))
}

function localAssetPath(url) {
  assert.equal(typeof url, 'string', '资源 URL 必须是字符串')
  assert.ok(url.startsWith('/') && !url.startsWith('//'), `资源必须使用本地绝对路径：${url}`)
  const result = path.resolve(publicRoot, `.${url}`)
  const relative = path.relative(publicRoot, result)
  assert.ok(!relative.startsWith('..') && !path.isAbsolute(relative), `资源不能越出 public：${url}`)
  return result
}

async function verifyAsset(asset, context) {
  for (const field of ['src', 'thumbnail', 'floorPlanUrl']) {
    if (!asset[field]) continue
    const info = await stat(localAssetPath(asset[field]))
    assert.ok(info.isFile() && info.size > 0, `${context} 缺少资源 ${field}：${asset[field]}`)
  }
}

function countsFor(nodes) {
  return Object.values(nodes).reduce((counts, node) => {
    counts[node.type] = (counts[node.type] ?? 0) + 1
    return counts
  }, {})
}

function verifyHierarchy(scene, name) {
  for (const rootId of scene.rootNodeIds) {
    assert.ok(scene.nodes[rootId], `${name} 缺少根节点 ${rootId}`)
    assert.equal(scene.nodes[rootId].parentId, null, `${name} 根节点必须没有父节点 ${rootId}`)
  }
  for (const [id, node] of Object.entries(scene.nodes)) {
    assert.equal(node.id, id, `${name} 字典键与节点 ID 不同：${id}`)
    if (node.parentId) {
      const parent = scene.nodes[node.parentId]
      assert.ok(parent, `${name} 缺少父节点：${id} → ${node.parentId}`)
      assert.ok(parent.children?.includes(id), `${name} 父节点没有登记子节点：${node.parentId} → ${id}`)
    }
    for (const childId of node.children ?? []) {
      assert.ok(scene.nodes[childId], `${name} 缺少子节点：${id} → ${childId}`)
      assert.equal(scene.nodes[childId].parentId, id, `${name} 子节点的父节点不一致：${childId}`)
    }
    if (node.wallId) {
      assert.equal(scene.nodes[node.wallId]?.type, 'wall', `${name} 门窗没有有效墙：${id}`)
      assert.equal(node.parentId, node.wallId, `${name} 门窗父节点与墙绑定不同：${id}`)
    }
    if (node.floor?.sourceSlabId) {
      assert.equal(scene.nodes[node.floor.sourceSlabId]?.type, 'slab', `${name} 房间缺少地板：${id}`)
      assert.equal(scene.nodes[node.floor.sourceSlabId].parentId, node.parentId, `${name} 房间与地板不在同一层：${id}`)
    }
  }
  const visited = new Set()
  function visit(id, ancestors = new Set()) {
    assert.ok(!ancestors.has(id), `${name} 层级包含循环：${id}`)
    visited.add(id)
    for (const childId of scene.nodes[id].children ?? []) visit(childId, new Set([...ancestors, id]))
  }
  for (const id of scene.rootNodeIds) visit(id)
  assert.equal(visited.size, Object.keys(scene.nodes).length, `${name} 存在无法从根节点到达的节点`)
}

function verifyMaterialReferences(scene, name) {
  for (const [id, material] of Object.entries(scene.materials ?? {})) {
    assert.equal(material.id, id, `${name} 材质字典键与 ID 不同：${id}`)
    assert.ok(SceneMaterial.safeParse(material).success, `${name} 场景材质未通过公开 schema：${id}`)
  }
  for (const node of Object.values(scene.nodes)) {
    for (const ref of Object.values(node.slots ?? {})) {
      if (typeof ref === 'string' && ref.startsWith('scene:')) {
        assert.ok(scene.materials?.[ref.slice(6)], `${name} 节点槽位引用缺失材质：${node.id} → ${ref}`)
      }
    }
    if (node.type === 'roof') {
      assert.ok(node.children?.some(id => scene.nodes[id]?.type === 'roof-segment'), `${name} 屋顶没有显式屋顶段：${node.id}`)
    }
  }
}

for (const filename of ['house.json', 'demo_1.json']) {
  const scene = await readJson(`demos/${filename}`)
  assert.ok(Array.isArray(scene.rootNodeIds) && scene.rootNodeIds.length, `${filename} 没有根节点`)
  const normalizedNodes = {}
  for (const node of Object.values(scene.nodes)) {
    const parsed = AnyNode.safeParse(node)
    assert.ok(parsed.success, `${filename} 的 ${node.id} 未通过公开 schema：${parsed.success ? '' : JSON.stringify(parsed.error.issues)}`)
    assert.deepEqual(parsed.data, node, `${filename} 的 ${node.id} 仍包含被 Editor schema 丢弃的字段或未保存的默认字段`)
    normalizedNodes[node.id] = parsed.data
    if (node.asset) await verifyAsset(node.asset, `${filename}/${node.id}`)
  }
  verifyHierarchy(scene, filename)
  verifyMaterialReferences(scene, filename)
  if (filename === 'house.json') {
    for (const node of Object.values(scene.nodes).filter(node => node.type === 'slab')) {
      assert.ok(node.slots?.surface?.startsWith('scene:'), `住宅地板缺少显式场景材质：${node.id}`)
    }
    for (const node of Object.values(scene.nodes).filter(node => node.type === 'wall')) {
      assert.equal(node.frontSide, 'interior', `住宅墙正面缺少室内语义：${node.id}`)
      assert.ok(['interior', 'exterior'].includes(node.backSide), `住宅墙背面缺少明确语义：${node.id}`)
    }
  }
  // Editor 的实际顺序：先用节点 schema 归一化，再调用 core store。
  // 场景必须预先保存材质槽位及 roof-segment，避免依赖归一化时会被删除的旧字段。
  useScene.getState().setScene(normalizedNodes, scene.rootNodeIds, {
    collections: scene.collections ?? {},
    materials: scene.materials ?? {},
  })
  const migrated = useScene.getState()
  verifyHierarchy(migrated, `${filename} 加载迁移后`)
  verifyMaterialReferences(migrated, `${filename} 加载迁移后`)
  assert.equal(Object.keys(migrated.nodes).length, Object.keys(scene.nodes).length, `${filename} 仍依赖加载时补建节点`)
  assert.deepEqual(migrated.materials, scene.materials ?? {}, `${filename} 材质表未在 Editor 加载后保持`)
  for (const id of Object.keys(scene.nodes)) assert.ok(migrated.nodes[id], `${filename} 加载时丢失节点：${id}`)
  console.log(`${filename}：${Object.keys(scene.nodes).length} 节点通过 Editor 归一化、层级、材质槽位及本地资源验证；加载后 ${JSON.stringify(countsFor(migrated.nodes))}`)
}

const catalog = await readJson('demos/catalog.json')
assert.ok(Array.isArray(catalog) && catalog.length, '本地家具目录不能为空')
const ids = new Set()
for (const asset of catalog) {
  assert.ok(!ids.has(asset.id), `本地家具目录有重复 ID：${asset.id}`)
  ids.add(asset.id)
  await verifyAsset(asset, `catalog/${asset.id}`)
}

const manifest = await readJson('demos/asset-manifest.json')
const manifestFiles = new Set(manifest.assets.map(asset => asset.file))
assert.equal(manifestFiles.size, manifest.assets.length, '上游资源清单不能有重复路径')
const materialUrls = [...new Set(MATERIAL_CATALOG.flatMap(material => [
  ...Object.values(material.preset.maps),
  material.previewThumbnailUrl,
]).filter(Boolean))]
const materialTextures = materialUrls.filter(url => url.endsWith('.ktx2'))
assert.equal(MATERIAL_CATALOG.length, 114, '固定 core 1.0.3 的材质目录项数改变')
assert.equal(materialUrls.length, 314, '固定 core 1.0.3 的材质资源数量改变')
assert.equal(materialTextures.length, 249, '固定 core 1.0.3 的 KTX2 纹理数量改变')
for (const url of materialUrls) {
  assert.ok(url.startsWith('/material/'), `材质目录包含非本地路径：${url}`)
  assert.ok(manifestFiles.has(url.slice(1)), `材质资源未登记到校验清单：${url}`)
  const info = await stat(localAssetPath(url))
  assert.ok(info.isFile() && info.size > 0, `缺少预加载材质资源：${url}`)
  if (url.endsWith('.ktx2')) assert.ok(url.endsWith('_512.ktx2'), `材质误用了较大分辨率：${url}`)
}
for (const filename of ['basis_transcoder.js', 'basis_transcoder.wasm', 'README.md', 'LICENSE']) {
  assert.ok(manifestFiles.has(`basis/${filename}`), `缺少本地 Basis 解码器或许可：${filename}`)
}
for (const asset of manifest.assets) {
  const data = await readFile(localAssetPath(`/${asset.file}`))
  assert.equal(data.length, asset.bytes, `素材大小与上游清单不同：${asset.file}`)
  assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256, `素材 SHA-256 与上游清单不同：${asset.file}`)
  if (asset.file.endsWith('.ktx2')) {
    assert.equal(data.subarray(0, 12).toString('hex'), 'ab4b5458203230bb0d0a1a0a', `不是有效 KTX2 文件：${asset.file}`)
    assert.ok(data.readUInt32LE(20) <= 512 && data.readUInt32LE(24) <= 512, `材质尺寸超过 512：${asset.file}`)
  }
  if (asset.file.endsWith('.wasm')) {
    assert.equal(data.subarray(0, 8).toString('hex'), '0061736d01000000', `不是有效 WASM 文件：${asset.file}`)
  }
  if (!asset.file.endsWith('.glb')) continue
  assert.equal(data.readUInt32LE(0), 0x46546c67, `不是有效 GLB 文件：${asset.file}`)
  const gltf = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString('utf8').trim())
  for (const entry of [...(gltf.buffers ?? []), ...(gltf.images ?? [])]) {
    assert.ok(!entry.uri || entry.uri.startsWith('data:'), `GLB 存在外部资源依赖：${asset.file} → ${entry.uri}`)
  }
}
console.log(`本地材质：${MATERIAL_CATALOG.length} 项、${materialTextures.length} 个 512 KTX2、${materialUrls.length - materialTextures.length} 个缩略图及 Basis 解码器验证通过。`)
console.log(`本地目录：${catalog.length} 类家具；${manifest.assets.length} 个上游资源的路径、SHA-256 与离线 GLB 依赖验证通过。`)
