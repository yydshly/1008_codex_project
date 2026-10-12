'use client'

// 独立研究宿主的中文入口；几何、选取、属性面板和建造工具由 Pascal 原库提供。
import { emitter, resolveAutoZonePolygon, sampleWallCenterline, useScene, type AnyNode, type AssetInput } from '@pascal-app/core'
import {
  ToolOptionsPanel,
  useEditor,
  type Tool,
  type ViewMode,
} from '@pascal-app/editor'
import { useViewer } from '@pascal-app/viewer'
import {
  Box,
  Columns3,
  CornerDownRight,
  DoorOpen,
  Fence,
  Focus,
  Grid2X2,
  House,
  Layers3,
  MousePointer2,
  PanelLeftClose,
  ScanLine,
  Square,
  SquareDashed,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

const BUILD_TOOLS: { kind: Tool; label: string; icon: LucideIcon; hint: string }[] = [
  { kind: 'wall', label: '墙体', icon: SquareDashed, hint: '在工作面连续点击，设置墙体端点。' },
  { kind: 'door', label: '门', icon: DoorOpen, hint: '将指针移到墙体，点击安装参数化门。' },
  { kind: 'window', label: '窗', icon: Grid2X2, hint: '将指针移到墙体，点击安装参数化窗。' },
  { kind: 'slab', label: '楼板', icon: Square, hint: '点击绘制多边形边界，闭合后生成楼板。' },
  { kind: 'ceiling', label: '天花板', icon: PanelLeftClose, hint: '使用原库工具绘制天花板边界。' },
  { kind: 'roof', label: '屋顶', icon: House, hint: '先选屋顶类型，再按原库预览绘制或从房间创建。' },
  { kind: 'stair', label: '楼梯', icon: CornerDownRight, hint: '移动指针预览，点击放置；选中后调整尺寸。' },
  { kind: 'column', label: '立柱', icon: Columns3, hint: '移动指针预览，点击放置参数化立柱。' },
  { kind: 'fence', label: '围栏', icon: Fence, hint: '点击定义起终点，创建围栏。' },
]

const controlClass =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors'

function Control({
  active = false,
  children,
  onClick,
  title,
}: {
  active?: boolean
  children: ReactNode
  onClick: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`${controlClass} ${active ? 'border-sky-500/60 bg-sky-500/15 text-sky-300' : 'border-white/10 bg-neutral-900/90 text-neutral-300 hover:bg-neutral-800'}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}

function activateBuildTool(kind: Tool) {
  const editor = useEditor.getState()
  editor.setPhase('structure')
  editor.setStructureLayer('elements')
  editor.setCatalogCategory(null)
  editor.armToolMode({ mode: 'build', tool: kind })
}

export function BuildTools() {
  const activeTool = useEditor((state) => state.tool)
  const mode = useEditor((state) => state.mode)
  const hasLevel = useViewer((state) => Boolean(state.selection.levelId))
  const active = BUILD_TOOLS.find((tool) => mode === 'build' && activeTool === tool.kind)

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <div>
        <h2 className="font-semibold text-base">建造工具</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          点击构件启用 Pascal 的原生绘制工具；按 Esc 回到选择。单击场景里的构件，可在属性面板修改尺寸与材质。
        </p>
      </div>
      {!hasLevel && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
          请先在场景树中选择一个楼层，再放置构件。
        </p>
      )}
      <Control active={mode === 'select'} onClick={() => useEditor.getState().armToolMode({ mode: 'select' })}>
        <MousePointer2 size={14} /> 选择与编辑
      </Control>
      <div className="grid grid-cols-3 gap-2">
        {BUILD_TOOLS.map(({ kind, label, icon: Icon, hint }) => (
          <button
            key={kind}
            type="button"
            disabled={!hasLevel}
            aria-pressed={mode === 'build' && activeTool === kind}
            title={hint}
            className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${mode === 'build' && activeTool === kind ? 'border-sky-500/60 bg-sky-500/15 text-sky-300' : 'border-border bg-muted/30 text-foreground hover:bg-muted'}`}
            onClick={() => activateBuildTool(kind)}
          >
            <Icon size={23} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
      {mode === 'build' && activeTool === 'wall' && (
        <p className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
          按 R 在直墙与矩形房间之间切换，也可点击画面底部的 Shape 提示。矩形房间依次点击两个对角位置。
        </p>
      )}
      {mode === 'build' && activeTool === 'roof' && (
        <label className="flex flex-col gap-2 text-xs text-muted-foreground">
          屋顶形式
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            defaultValue="gable"
            onChange={(event) => {
              const editor = useEditor.getState()
              editor.setToolDefaults('roof', { ...editor.toolDefaults.roof, roofType: event.target.value })
            }}
          >
            <option value="gable">双坡屋顶</option>
            <option value="hip">四坡屋顶</option>
            <option value="shed">单坡屋顶</option>
            <option value="flat">平屋顶</option>
          </select>
        </label>
      )}
      <ToolOptionsPanel kind={mode === 'build' ? activeTool : null} />
      {active && <p className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">{active.hint}</p>}
      <div className="mt-auto border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        左键选择或建造 · 拖动构件上的手柄调整 · 鼠标滚轮缩放 · 右键拖动环绕 · Ctrl / Cmd + Z 撤销
      </div>
    </div>
  )
}

const DEMO_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '')
const CATEGORY_LABELS: Record<string, string> = {
  furniture: '家具',
  appliance: '电器',
  bathroom: '卫浴',
  kitchen: '厨房',
  outdoor: '户外',
  door: '门',
  window: '窗',
}

/** Absolute same-origin URLs bypass Pascal's CDN resolver while preserving GLB transforms. */
function localCatalogUrl(path: string | undefined): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) {
    const parsed = new URL(path)
    return parsed.origin === window.location.origin ? parsed.href : undefined
  }
  if (!path.startsWith('/') || path.startsWith('//')) return undefined
  const prefixed = DEMO_BASE_PATH && !path.startsWith(`${DEMO_BASE_PATH}/`)
    ? `${DEMO_BASE_PATH}${path}`
    : path
  return new URL(prefixed, window.location.origin).href
}

export function FurniturePanel() {
  const [items, setItems] = useState<AssetInput[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const hasLevel = useViewer((state) => Boolean(state.selection.levelId))
  const selectedId = useEditor((state) => state.selectedItem?.id)
  const mode = useEditor((state) => state.mode)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    async function loadCatalog() {
      try {
        const response = await fetch(`${DEMO_BASE_PATH}/demos/catalog.json`, { signal: controller.signal })
        if (!response.ok) throw new Error(`目录加载失败（${response.status}）`)
        const catalog = await response.json()
        if (!Array.isArray(catalog)) throw new Error('本地家具目录格式不正确')
        const localItems: AssetInput[] = []
        for (const item of catalog as AssetInput[]) {
          if (!item || typeof item.src !== 'string' || typeof item.thumbnail !== 'string') continue
          const src = localCatalogUrl(item.src)
          const thumbnail = localCatalogUrl(item.thumbnail)
          if (!src || !thumbnail) continue
          localItems.push({
            ...item,
            src,
            thumbnail,
            floorPlanUrl: localCatalogUrl(item.floorPlanUrl),
          })
        }
        if (!controller.signal.aborted) setItems(localItems)
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '本地家具目录暂时无法读取')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadCatalog()
    return () => controller.abort()
  }, [attempt])

  const categories = [...new Set(items.map((item) => item.category))]
  const query = search.trim().toLocaleLowerCase()
  const visible = items.filter((item) =>
    (category === 'all' || item.category === category) &&
    (!query || `${item.name} ${item.id} ${(item.tags ?? []).join(' ')}`.toLocaleLowerCase().includes(query)),
  )

  function placeFurniture(item: AssetInput) {
    useViewer.getState().setSelection({ selectedIds: [], zoneId: null })
    const editor = useEditor.getState()
    editor.setPhase('furnish')
    editor.setSelectedItem(item)
    editor.armToolMode({ mode: 'build', tool: 'item' })
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div>
        <h2 className="font-semibold text-base">家具与装饰</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">选择家具后，在当前楼层移动指针预览，点击放置。模型与缩略图均随本项目保存。</p>
      </div>
      <input
        aria-label="搜索本地家具"
        className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-sky-500/60"
        placeholder="搜索家具名称或标签…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="flex flex-wrap gap-1.5">
        <Control active={category === 'all'} onClick={() => setCategory('all')}>全部</Control>
        {categories.map((value) => (
          <Control key={value} active={category === value} onClick={() => setCategory(value)}>{CATEGORY_LABELS[value] ?? value}</Control>
        ))}
      </div>
      {!hasLevel && <p className="text-xs text-amber-300">请先在场景树中选择楼层。</p>}
      {loading && <p className="text-sm text-muted-foreground">正在读取本地家具…</p>}
      {error && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">{error}</p>
          <Control onClick={() => setAttempt((value) => value + 1)}>重新读取</Control>
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!hasLevel}
                aria-pressed={mode === 'build' && selectedId === item.id}
                className={`flex flex-col gap-2 rounded-xl border p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${mode === 'build' && selectedId === item.id ? 'border-sky-500/60 bg-sky-500/15' : 'border-border bg-muted/30 hover:bg-muted'}`}
                onClick={() => placeFurniture(item)}
              >
                {/* The project contains these raster thumbnails; no remote image service is used. */}
                <img src={item.thumbnail} alt={item.name} loading="lazy" className="aspect-square w-full rounded-lg bg-white object-contain" />
                <span className="line-clamp-2 text-xs leading-relaxed">{item.name}</span>
              </button>
            ))}
          </div>
          {!visible.length && <p className="text-sm text-muted-foreground">没有找到匹配的家具。</p>}
          <p className="text-xs text-muted-foreground">已缓存 {items.length} 件 · 按 Esc 取消放置</p>
        </>
      )}
    </div>
  )
}

/** Fit actual floor geometry through Pascal's public event; furniture and site bounds do not skew it. */
export function focusEditorScene() {
  const selection = useViewer.getState().selection
  const nodes: Record<string, AnyNode> = useScene.getState().nodes
  const allNodes = Object.values(nodes)
  const selectedLevel = selection.levelId ? nodes[selection.levelId] : undefined
  const selectedBuilding = selection.buildingId ? nodes[selection.buildingId] : undefined
  const levels = allNodes.filter((node) => node.type === 'level').filter((node) => (
    selectedBuilding?.type !== 'building' || node.parentId === selectedBuilding.id || selectedBuilding.children.includes(node.id)
  ))
  const level = selectedLevel?.type === 'level'
    ? selectedLevel
    : levels.find((node) => node.level === 0) ?? levels[0]
  const building = level?.parentId ? nodes[level.parentId] : selectedBuilding
  const owningBuilding = building?.type === 'building' ? building : allNodes.find((node) =>
    node.type === 'building' && level && node.children.includes(level.id),
  )
  const angle = owningBuilding?.type === 'building' ? owningBuilding.rotation[1] : 0
  const offset = owningBuilding?.type === 'building' ? owningBuilding.position : [0, 0, 0]
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  let minX = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxZ = -Infinity

  function extend(x: number, z: number, padding = 0) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return
    const worldX = offset[0] + x * cos + z * sin
    const worldZ = offset[2] - x * sin + z * cos
    minX = Math.min(minX, worldX - padding)
    minZ = Math.min(minZ, worldZ - padding)
    maxX = Math.max(maxX, worldX + padding)
    maxZ = Math.max(maxZ, worldZ + padding)
  }

  const memberIds = new Set<string>()
  if (level) {
    const pending = [level.id as string]
    const childrenByParent = new Map<string, string[]>()
    for (const node of allNodes) {
      if (!node.parentId) continue
      const children = childrenByParent.get(node.parentId) ?? []
      children.push(node.id)
      childrenByParent.set(node.parentId, children)
    }
    while (pending.length) {
      const id = pending.pop()!
      if (memberIds.has(id)) continue
      memberIds.add(id)
      pending.push(...(childrenByParent.get(id) ?? []))
    }
  }

  for (const node of allNodes) {
    if (node.visible === false || (level && !memberIds.has(node.id))) continue
    if (node.type === 'wall') {
      const padding = Math.max(node.thickness ?? 0.1, 0.1)
      for (const point of sampleWallCenterline(node)) extend(point.x, point.y, padding)
    } else if (node.type === 'slab' || node.type === 'zone') {
      const polygon = node.type === 'zone'
        ? resolveAutoZonePolygon(node, (id) => nodes[id])
        : node.polygon
      for (const [x, z] of polygon) extend(x, z)
    }
  }

  // The official example's upper level contains only a roof. Its migrated
  // segments provide a footprint even though no wall/slab/zone exists there.
  if (!Number.isFinite(minX)) {
    for (const node of allNodes) {
      if (node.type !== 'roof-segment' || node.visible === false || (level && !memberIds.has(node.id))) continue
      const roof = node.parentId ? nodes[node.parentId] : undefined
      const width = node.width / 2 + node.overhang
      const depth = node.depth / 2 + node.overhang
      for (const [x, z] of [[-width, -depth], [width, -depth], [width, depth], [-width, depth]]) {
        let localX = node.position[0] + x * Math.cos(node.rotation) + z * Math.sin(node.rotation)
        let localZ = node.position[2] - x * Math.sin(node.rotation) + z * Math.cos(node.rotation)
        if (roof?.type === 'roof') {
          const previousX = localX
          localX = roof.position[0] + previousX * Math.cos(roof.rotation) + localZ * Math.sin(roof.rotation)
          localZ = roof.position[2] - previousX * Math.sin(roof.rotation) + localZ * Math.cos(roof.rotation)
        }
        extend(localX, localZ)
      }
    }
  }

  if (!Number.isFinite(minX)) {
    const nodeId = level?.id ?? owningBuilding?.id
    if (nodeId) emitter.emit('camera-controls:focus', { nodeId })
    else emitter.emit('camera-controls:fit-scene', {})
    return
  }

  // A little air around the walls keeps the rotated, linked plan legible.
  const padding = Math.max(1, Math.max(maxX - minX, maxZ - minZ) * 0.12)
  minX -= padding
  minZ -= padding
  maxX += padding
  maxZ += padding
  emitter.emit('camera-controls:fit-scene', {
    bounds: {
      min: [minX, minZ],
      max: [maxX, maxZ],
      center: [(minX + maxX) / 2, (minZ + maxZ) / 2],
      size: [maxX - minX, maxZ - minZ],
    },
  })
}

export function DemoToolbar() {
  const viewMode = useEditor((state) => state.viewMode)
  const shading = useViewer((state) => state.shading)
  const levelMode = useViewer((state) => state.levelMode)
  const wallMode = useViewer((state) => state.wallMode)

  const views: { value: ViewMode; label: string; icon: LucideIcon }[] = [
    { value: '3d', label: '3D', icon: Box },
    { value: '2d', label: '平面图', icon: Grid2X2 },
    { value: 'split', label: '分屏', icon: Columns3 },
  ]

  return (
    <div className="flex max-w-full flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-neutral-950/90 p-1.5 shadow-lg backdrop-blur">
      {views.map(({ value, label, icon: Icon }) => (
        <Control key={value} active={viewMode === value} onClick={() => useEditor.getState().setViewMode(value)}>
          <Icon size={13} /> {label}
        </Control>
      ))}
      <span className="mx-0.5 h-5 w-px bg-white/15" />
      <Control active={shading === 'rendered'} onClick={() => useViewer.getState().setShading('rendered')} title="原库材质、光照与后处理">
        真实材质
      </Control>
      <Control active={shading === 'solid'} onClick={() => useViewer.getState().setShading('solid')} title="便于观察建筑构件的实体视图">
        结构
      </Control>
      <select
        aria-label="楼层显示方式"
        className="rounded-lg border border-white/10 bg-neutral-900 px-2 py-2 text-xs text-neutral-200"
        value={levelMode}
        onChange={(event) => useViewer.getState().setLevelMode(event.target.value as 'stacked' | 'exploded' | 'solo' | 'manual')}
      >
        <option value="stacked">楼层叠放</option>
        <option value="exploded">楼层展开</option>
        <option value="solo">仅当前层</option>
        {levelMode === 'manual' && <option value="manual">自定义楼层位置</option>}
      </select>
      <Control active={wallMode === 'cutaway'} onClick={() => useViewer.getState().setWallMode(wallMode === 'cutaway' ? 'up' : 'cutaway')} title="按相机方向自动隐藏遮挡室内的墙体">
        <ScanLine size={13} /> 看室内
      </Control>
      <Control onClick={focusEditorScene} title="将镜头对准当前楼层">
        <Focus size={13} /> 居中
      </Control>
    </div>
  )
}

export function ViewControlsPanel() {
  return (
    <div className="space-y-4 p-4">
      <h2 className="flex items-center gap-2 font-semibold"><Layers3 size={18} /> 视图与交互</h2>
      <DemoToolbar />
      <p className="text-xs leading-relaxed text-muted-foreground">平面图、3D 与分屏共用同一场景。展开楼层后可以逐层观察；选择场景树里的另一层，切换编辑对象。</p>
    </div>
  )
}
