/**
 * v35 独立灯箱材料：连续沙层、定向宽撒与守恒收沙。复制本仓库原创 StageMaterial，再独立调整；旧模块不变。
 * 这里没有成品画遮罩；手动创作与演出都只改变同一个 density 场。
 */
export type StageTool = 'pour' | 'sweep' | 'finger' | 'edge' | 'rub'
export interface StagePoint { x: number; y: number }
export interface StageContact {
  tool: StageTool
  from: StagePoint
  to: StagePoint
  /** 按沙台宽度归一化。 */
  radius: number
  strength: number
  spread?: number
  height?: number
  angle?: number
  aspect?: number
  /** 可选松散聚团；旧接触不启用，保持旧随机序列与落点。 */
  cluster?: number
  /** 从窄指缝发射，横向散开由空中速度产生；省略时保持旧供料模型。 */
  ballistic?: boolean
  /** 三维接触试验：按沙台宽度归一化的实际指缝高度；旧模式不设置。 */
  emissionHeight?: number
  /** 可控竖直细流的水平惯性比例；省略时保持旧手部供料的 .45。 */
  velocityInheritance?: number
  /** 在当前时间步内错开出生时刻，避免固定高度的整排供料包。旧模式省略。 */
  continuousEmission?: boolean
  /** 宽指缝的有限扇形供料，不是目标轮廓遮罩。 */
  fan?: boolean
}
export interface StageGrain {
  x: number; y: number; z: number
  vx: number; vy: number; vz: number
  mass: number
  /** 一个供料包代表多颗细粉；宽散包落在较宽的紧致软核里。 */
  soft?: boolean
  /** 收沙时短暂提离创作面；这些颗粒来自已有沙量，离开后计为收走。 */
  collected?: boolean
}
export interface StageMaterialSnapshot {
  version: 1
  width: number
  height: number
  density: Float32Array
  particles: StageGrain[]
  randomState: number
  elapsedTime: number
  suppliedMass: number
  removedMass: number
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const smooth = (value: number) => value * value * (3 - 2 * value)
const MAX_GRAINS = 16384
const FALL_GRAVITY = 3.8
const DEFAULT_SEED = 0x51a9d1

export class SandlightSand {
  readonly width: number
  readonly height: number
  readonly density: Float32Array
  private readonly initialSeed: number
  private readonly samplesPerSecond: number
  private randomState: number
  private clock = 0
  private supplied = 0
  private removed = 0
  private grains: StageGrain[] = []
  private readonly pickupPackets=new Map<number,StageGrain>()
  private readonly transfer: Float32Array
  private rubWeights: Float32Array | undefined
  private readonly touched: number[] = []
  private readonly landing: Float64Array
  private readonly landTouched: number[] = []
  private readonly texture: Float32Array
  private readonly glass: Float32Array
  private readonly palette: Uint8ClampedArray
  private image: ImageData | undefined
  private readonly gravity: number
  private paintCanvas: HTMLCanvasElement | OffscreenCanvas | undefined
  private paintContext: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | undefined

  constructor(width = 1152, height = 768, seed = DEFAULT_SEED, samplesPerSecond = 8500, gravity = FALL_GRAVITY) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 4 || height < 4 || width > 2048 || height > 1536) {
      throw new Error('沙台尺寸应为 4–2048 × 4–1536 的整数。')
    }
    this.width = width
    this.height = height
    this.gravity = finite(gravity) && gravity > 0 ? gravity : FALL_GRAVITY
    this.samplesPerSecond = finite(samplesPerSecond) ? clamp(samplesPerSecond, 600, 50000) : 50000
    this.initialSeed = seed >>> 0 || DEFAULT_SEED
    this.randomState = this.initialSeed
    this.density = new Float32Array(width * height)
    this.transfer = new Float32Array(width * height)
    this.landing = new Float64Array(width * height)
    this.texture = new Float32Array(width * height)
    this.glass = new Float32Array(width * height)
    this.palette = new Uint8ClampedArray(4097 * 3)
    for (let index = 0; index < this.density.length; index++) {
      let noise = Math.imul(index ^ 0x68bc21eb, 0x45d9f3b)
      noise = Math.imul(noise ^ noise >>> 16, 0x45d9f3b)
      this.texture[index] = ((noise ^ noise >>> 16) >>> 0) / 0xffffffff
      const x = (index % width + 0.5) / width - 0.5
      const y = (Math.floor(index / width) + 0.5) / height - 0.5
      this.glass[index] = 1 - (x * x + y * y) * 0.065
    }
    for (let index = 0; index <= 4096; index++) {
      const light = Math.exp(-(index / 384) * 1.35)
      this.palette[index * 3] = 45 + (251 - 45) * light
      this.palette[index * 3 + 1] = 31 + (239 - 31) * light
      this.palette[index * 3 + 2] = 20 + (215 - 20) * light
    }
  }

  get elapsedTime() { return this.clock }
  get suppliedMass() { return this.supplied }
  get removedMass() { return this.removed }
  get pending() { return this.grains.length > 0 }
  get airborne(): readonly StageGrain[] { return this.grains }
  get inAirMass() { return this.grains.reduce((total, grain) => total + grain.mass, 0) }
  get mass() { return this.density.reduce((total, amount) => total + amount, 0) }

  /** 掌心收沙到台外沙盘。只按接触几何移出沙量，不读取任何目标图。 */
  collect(from: StagePoint, to: StagePoint, radius: number, strength: number, dt: number, lip = 0, carry = false, aspect = 1) {
    if (![from.x, from.y, to.x, to.y, radius, strength, dt].every(finite) || radius <= 0 || strength <= 0 || dt <= 0) return
    const ax = from.x * this.width, ay = from.y * this.height
    const bx = to.x * this.width, by = to.y * this.height
    const dx = bx - ax, dy = by - ay, lengthSquared = dx * dx + dy * dy
    const reach = clamp(radius * this.width, 0.7, this.width * 0.4)
    const force = clamp(strength, 0, 3) * Math.min(dt, 0.1) * 120
    const kept=finite(lip)?clamp(lip,0,.25):0
    const length=Math.hypot(dx,dy),nx=length?-dy/length:1,ny=length?dx/length:0
    for (let y = Math.max(0, Math.floor(Math.min(ay, by) - reach)); y <= Math.min(this.height - 1, Math.ceil(Math.max(ay, by) + reach)); y++) {
      for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - reach)); x <= Math.min(this.width - 1, Math.ceil(Math.max(ax, bx) + reach)); x++) {
        const t = lengthSquared ? clamp(((x - ax) * dx + (y - ay) * dy) / lengthSquared, 0, 1) : 0
        const distance = Math.hypot(x - ax - dx * t, (y - ay - dy * t) / clamp(aspect,.12,1)) / reach
        if (distance >= 1) continue
        const index = y * this.width + x, before = this.density[index]
        const residue=Math.min(before, .003 + this.texture[index]*.009)
        this.density[index] = residue + (before-residue) * Math.exp(-force * (1-distance**6)*( .82 + this.texture[index]*.36))
        const moved=before-this.density[index]
        if(kept>0){
          const side=(x-ax-dx*t)*nx+(y-ay-dy*t)*ny>=0?1:-1
          // 挤出的沙停在接触边界外，后续同一笔不会立即把沙脊再抹掉。
          const bank=1.015+this.texture[index]*.028
          this.addBilinear(this.transfer,ax+dx*t+nx*side*reach*bank,ay+dy*t+ny*side*reach*bank*aspect,moved*kept,true)
          if(carry)this.lift(x,y,moved*(1-kept),dx,dy);else this.removed+=moved*(1-kept)
        }else if(carry)this.lift(x,y,moved,dx,dy);else this.removed += before - this.density[index]
      }
    }
    if(kept>0){for(const index of this.touched){this.density[index]+=this.transfer[index];this.transfer[index]=0}this.touched.length=0}
  }

  private lift(x:number,y:number,mass:number,dx:number,dy:number){
    if(mass<=0)return
    // 一个显示包代表相邻细粒。不能因显示数量上限直接删除还未离台的沙。
    const key=Math.min(79,Math.floor(x/this.width*80))+80*Math.min(55,Math.floor(y/this.height*56))
    let packet=this.pickupPackets.get(key)
    if(!packet&&this.grains.length>=MAX_GRAINS){
      for(let i=this.grains.length-1;i>=0;i--)if(this.grains[i].collected){packet=this.grains[i];break}
    }
    if(packet){
      const total=packet.mass+mass,weight=mass/total
      packet.x+=(x/this.width-packet.x)*weight;packet.y+=(y/this.height-packet.y)*weight
      packet.z=Math.min(packet.z,.0004);packet.mass=total;this.pickupPackets.set(key,packet);return
    }
    const length=Math.hypot(dx,dy)||1,rough=this.texture[y*this.width+x]
    const grain={x:x/this.width,y:y/this.height,z:.0004,vx:dx/length*.16+(rough-.5)*.04,
      vy:dy/length*.16*this.width/this.height,vz:.035+rough*.014,mass,collected:true}
    this.grains.push(grain);this.pickupPackets.set(key,grain)
  }

  clear() {
    this.density.fill(0)
    this.transfer.fill(0)
    this.landing.fill(0)
    this.touched.length = 0
    this.landTouched.length = 0
    this.grains = []
    this.pickupPackets.clear()
    this.randomState = this.initialSeed
    this.clock = this.supplied = this.removed = 0
  }

  step(dt: number, contacts: readonly StageContact[]) {
    if (!finite(dt) || dt <= 0) return
    const duration = Math.min(dt, 0.1)
    this.clock += duration
    this.land(duration)
    for (const contact of contacts) {
      if (!this.validContact(contact)) continue
      if (contact.tool === 'pour') this.pour(duration, contact)
      else if (contact.tool === 'rub') this.rub(duration, contact)
      else this.move(duration, contact)
    }
    this.pickupPackets.clear()
  }

  read(): StageMaterialSnapshot {
    return {
      version: 1, width: this.width, height: this.height,
      density: this.density.slice(), particles: this.grains.map(grain => ({ ...grain })),
      randomState: this.randomState, elapsedTime: this.clock,
      suppliedMass: this.supplied, removedMass: this.removed,
    }
  }

  restore(snapshot: StageMaterialSnapshot) {
    if (snapshot.version !== 1 || snapshot.width !== this.width || snapshot.height !== this.height ||
      !(snapshot.density instanceof Float32Array) || snapshot.density.length !== this.density.length ||
      !Array.isArray(snapshot.particles) || snapshot.particles.length > MAX_GRAINS ||
      !Number.isInteger(snapshot.randomState) || snapshot.randomState < 1 || snapshot.randomState > 0xffffffff ||
      ![snapshot.elapsedTime, snapshot.suppliedMass, snapshot.removedMass].every(value => finite(value) && value >= 0) ||
      !snapshot.density.every(value => finite(value) && value >= 0) ||
      !snapshot.particles.every(grain => [grain.x, grain.y, grain.z, grain.vx, grain.vy, grain.vz, grain.mass].every(finite) && grain.z >= 0 && grain.mass > 0 && (grain.soft === undefined || typeof grain.soft === 'boolean') && (grain.collected === undefined || typeof grain.collected === 'boolean'))) {
      throw new Error('舞台沙画快照格式不正确。')
    }
    this.density.set(snapshot.density)
    this.grains = snapshot.particles.map(grain => ({ ...grain }))
    this.pickupPackets.clear()
    this.randomState = snapshot.randomState
    this.clock = snapshot.elapsedTime
    this.supplied = snapshot.suppliedMass
    this.removed = snapshot.removedMass
    this.transfer.fill(0)
    this.landing.fill(0)
    this.touched.length = 0
    this.landTouched.length = 0
  }

  /** 细砂微粒在固定位置影响透光，不以粗点替代沙层。 */
  render(ctx: CanvasRenderingContext2D) {
    if (!this.image) this.image = new ImageData(this.width, this.height)
    const pixels = this.image.data
    for (let index = 0; index < this.density.length; index++) {
      const amount = this.density[index]
      const noise = this.texture[index]
      const paletteIndex = Math.min(4096, Math.max(0, Math.round(amount * (0.9 + noise * 0.2) * 384))) * 3
      const glint = Math.min(amount, 1) * (noise - 0.5) * 5
      const glass = this.glass[index]
      const pixel = index * 4
      pixels[pixel] = this.palette[paletteIndex] * glass + glint
      pixels[pixel + 1] = this.palette[paletteIndex + 1] * glass + glint
      pixels[pixel + 2] = this.palette[paletteIndex + 2] * glass + glint
      pixels[pixel + 3] = 255
    }
    if (!this.paintCanvas) {
      this.paintCanvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(this.width, this.height)
        : Object.assign(document.createElement('canvas'), { width: this.width, height: this.height })
      this.paintContext = this.paintCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
    }
    this.paintContext!.putImageData(this.image, 0, 0)
    ctx.save()
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(this.paintCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height)
    // 短暂处于台面上方的真实供料；每个细粒最终计入 density。
    if (this.grains.length) {
      const width = ctx.canvas.width
      const height = ctx.canvas.height
      ctx.strokeStyle = 'rgba(104, 69, 35, 0.34)'
      ctx.lineWidth = Math.max(0.55, width / this.width * 0.7)
      ctx.beginPath()
      const stride = Math.max(1, Math.ceil(this.grains.length / 1500))
      for (let index = 0; index < this.grains.length; index += stride) {
        const grain = this.grains[index]
        const x = grain.x * width
        const y = grain.y * height - grain.z * width * 0.55
        ctx.moveTo(x, y)
        ctx.lineTo(x + grain.vx * width * 0.008, y + Math.max(0.65, -grain.vz * width * 0.007))
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  private validContact(contact: StageContact) {
    return !!contact && ['pour', 'sweep', 'finger', 'edge', 'rub'].includes(contact.tool) &&
      [contact.from?.x, contact.from?.y, contact.to?.x, contact.to?.y, contact.radius, contact.strength].every(finite) &&
      contact.radius > 0 && contact.strength > 0 &&
      [contact.spread, contact.height, contact.angle, contact.aspect, contact.cluster, contact.emissionHeight].every(value => value === undefined || finite(value)) &&
      (contact.ballistic === undefined || typeof contact.ballistic === 'boolean')
  }

  private random() {
    let value = this.randomState
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    this.randomState = value >>> 0
    return this.randomState / 0x100000000
  }

  private pour(dt: number, contact: StageContact) {
    const spread = clamp(contact.spread ?? 0.15, 0, 1)
    const radius = clamp(contact.radius, 0.0005, 0.6)
    const height = clamp(contact.height ?? 0.35, 0, 1)
    const strength = clamp(contact.strength, 0, 3)
    const flow = contact.ballistic ? 1 : clamp(0.8 + 0.24 * Math.sin(this.clock * 8.1 + contact.to.x * 6) + 0.19 * Math.sin(this.clock * 3.37 + 1.1), 0.35, 1.3)
    const mass = this.width * this.height * 0.016 * dt * strength * flow
    const count = Math.max(1, Math.ceil(dt * this.samplesPerSecond * (0.6 + spread * 0.4) * (contact.ballistic ? Math.sqrt(strength) : 1)))
    const dx = contact.to.x - contact.from.x
    const dy = contact.to.y - contact.from.y
    const direction = Math.atan2(dy * this.height, dx * this.width)
    const distributionAngle = contact.aspect === undefined ? direction : contact.angle ?? direction
    const tangentX = Math.cos(distributionAngle)
    const tangentY = Math.sin(distributionAngle)
    const aspect = clamp(contact.aspect ?? 1, .15, 2.5)
    const cluster = clamp(contact.cluster ?? 0, 0, 1)
    const sigma = radius * (0.2 + spread * 0.55)
    const weights: number[] = []
    let weightSum = 0
    for (let index = 0; index < count; index++) {
      const weight = 0.4 + this.random() * this.random() * 1.8
      weights.push(weight)
      weightSum += weight
    }
    this.supplied += mass
    for (let index = 0; index < count; index++) {
      const path = this.random()
      const branch = Math.floor(this.random() * 3) - 1
      const gaussian = Math.sqrt(-2 * Math.log(Math.max(1e-8, this.random())))
      const angle = this.random() * Math.PI * 2
      let along = gaussian * Math.cos(angle) * sigma
      let across = gaussian * Math.sin(angle) * sigma * (0.75 + spread * 0.4)
      if (cluster > 0) {
        // 三个随时间缓慢漂移的放沙区形成松散沙簇，而非每帧换一块白噪声。
        along = along * (1 - cluster * .28) + Math.sin(this.clock * 1.7 + branch * 2.1) * sigma * cluster * .85
        across = across * (1 - cluster * .35) + Math.cos(this.clock * 1.3 + branch * 2.4) * sigma * cluster * .7
      }
      if (contact.fan) {
        // 有限宽指缝形成一把沙的面，轻微起伏保留供料疏密；窄向仍为随机散粒。
        along=(this.random()*2-1)*radius*.48 + Math.sin(this.clock*2.1)*radius*.006
        across*=.72
      }
      if (contact.aspect !== undefined) across *= aspect
      const drift = Math.sin(this.clock * 2.7 + branch * 1.4) * radius * 0.15
      const branchOffset = (branch * sigma * 0.25 + drift * .30) * (contact.aspect === undefined ? 1 : aspect)
      const grain: StageGrain = {
        x: contact.from.x + dx * path + tangentX * along - tangentY * (across + branchOffset),
        y: contact.from.y + dy * path + (tangentY * along + tangentX * (across + branchOffset)) * this.width / this.height,
        z: (0.013 + height * 0.09) * (0.9 + this.random() * 0.2),
        vx: dx / dt * 0.035 + (this.random() - 0.5) * spread * 0.035,
        vy: dy / dt * 0.035 + (this.random() - 0.5) * spread * 0.035 * this.width / this.height,
        vz: 0,
        mass: mass * weights[index] / weightSum,
        soft: false,
      }
      if (contact.ballistic) {
        // 随手移动的惯性 + 指缝散射。落点由重力积分得到，不在出沙口生成宽沙团。
        // 沿用上方抽样结果，不额外消耗随机数，旧接触的随机序列保持一致。
        const fan = .16 * spread
        grain.z = (contact.emissionHeight === undefined ? .013 + height * .09 : clamp(contact.emissionHeight, .0001, 1)) * (.86 + .28 * path)
        const inertia=finite(contact.velocityInheritance)?clamp(contact.velocityInheritance,0,1):.45
        grain.vx = dx / dt * inertia + (tangentX * along - tangentY * across) / sigma * fan
        grain.vy = dy / dt * inertia + (tangentY * along + tangentX * across) / sigma * fan * this.width / this.height
        if(contact.continuousEmission) {
          // path 已是上一时刻到本时刻的出沙位置，也同时给出出生时间。
          const age=Math.min(dt*(1-path),Math.sqrt(2*grain.z/this.gravity)*(1-1e-8))
          grain.x+=grain.vx*age;grain.y+=grain.vy*age
          grain.z-=.5*this.gravity*age*age;grain.vz=-this.gravity*age
        }
      }
      // 预留一个拾沙包，保证极端连续供料下收沙仍能进入空中。
      if (this.grains.length < MAX_GRAINS-1) this.grains.push(grain)
      else {
        const slot=this.grains[index % this.grains.length]
        if(!slot.collected)slot.mass+=grain.mass
        else {const falling=this.grains.find(g=>!g.collected);if(falling)falling.mass+=grain.mass;else this.deposit(grain.x*this.width,grain.y*this.height,grain.mass,grain.soft)}
      }
    }
  }

  private land(dt: number) {
    let remaining = 0
    for (let index = 0; index < this.grains.length; index++) {
      const grain = this.grains[index]
      if(grain.collected){
        grain.x+=grain.vx*dt;grain.y+=grain.vy*dt;grain.z+=grain.vz*dt
        if(grain.z>=.017||grain.x<0||grain.x>1||grain.y<0||grain.y>1)this.removed+=grain.mass
        else this.grains[remaining++]=grain
        continue
      }
      const landingTime = (grain.vz + Math.sqrt(grain.vz * grain.vz + 2 * this.gravity * grain.z)) / this.gravity
      const travelTime = Math.min(dt, landingTime)
      grain.x += grain.vx * travelTime
      grain.y += grain.vy * travelTime
      grain.z += grain.vz * travelTime - 0.5 * this.gravity * travelTime * travelTime
      grain.vz -= this.gravity * travelTime
      if (landingTime <= dt) this.deposit(grain.x * this.width, grain.y * this.height, grain.mass, grain.soft)
      else this.grains[remaining++] = grain
    }
    this.grains.length = remaining
    // 同一时间步先汇总细粉，避免数万次 Float32 微量相加丢失质量。
    for (const index of this.landTouched) {
      this.density[index] += this.landing[index]
      this.landing[index] = 0
    }
    this.landTouched.length = 0
  }

  private deposit(x: number, y: number, mass: number, soft = false) {
    // 紧致 3×3 归一核保留实际落点的疏密，不扩散成灰色粉笔面。
    // 只发生在实际落点附近，不对整张画面模糊，也不读取目标图像。
    const weights = soft ? [.12,.76,.12] : [.045,.91,.045]
    const radius = 1
    for (let row = -radius; row <= radius; row++) {
      for (let column = -radius; column <= radius; column++) {
        this.addBilinear(this.landing, x + column, y + row, mass * weights[row + radius] * weights[column + radius], false)
      }
    }
  }

  private addBilinear(field: Float32Array | Float64Array, x: number, y: number, mass: number, transfer: boolean) {
    const left = Math.floor(x)
    const top = Math.floor(y)
    const fractionX = x - left
    const fractionY = y - top
    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 2; column++) {
        const amount = mass * (column ? fractionX : 1 - fractionX) * (row ? fractionY : 1 - fractionY)
        if (amount <= 0) continue
        const targetX = left + column
        const targetY = top + row
        if (targetX < 0 || targetX >= this.width || targetY < 0 || targetY >= this.height) {
          this.removed += amount
          continue
        }
        const index = targetY * this.width + targetX
        if (transfer && field[index] === 0) this.touched.push(index)
        else if (field === this.landing && field[index] === 0) this.landTouched.push(index)
        field[index] += amount
      }
    }
  }

  /** 揉沙只在接触范围内把已有沙量分给邻格，不添沙、不读取目标灰度。 */
  private rub(dt: number, contact: StageContact) {
    const ax = contact.from.x * this.width, ay = contact.from.y * this.height
    const bx = contact.to.x * this.width, by = contact.to.y * this.height
    const dx = bx - ax, dy = by - ay, squared = dx * dx + dy * dy
    const radius = clamp(contact.radius * this.width, .7, this.width * .4)
    const aspect = clamp(contact.aspect ?? 1, .15, 2.5), angle = contact.angle ?? 0
    const cx = Math.cos(angle), cy = Math.sin(angle), reach = radius * Math.max(1, aspect)
    const force = Math.min(.12, clamp(contact.strength, 0, 3) * dt * 2)
    const lowX = Math.max(0, Math.floor(Math.min(ax, bx) - reach)), highX = Math.min(this.width - 1, Math.ceil(Math.max(ax, bx) + reach))
    const lowY = Math.max(0, Math.floor(Math.min(ay, by) - reach)), highY = Math.min(this.height - 1, Math.ceil(Math.max(ay, by) + reach))
    const weights = this.rubWeights ??= new Float32Array(this.density.length)
    for (let y = lowY; y <= highY; y++) for (let x = lowX; x <= highX; x++) {
      const t = squared ? clamp(((x - ax) * dx + (y - ay) * dy) / squared, 0, 1) : 0
      const ox = x - ax - dx * t, oy = y - ay - dy * t
      const distance = Math.hypot((ox * cx + oy * cy) / radius, (-ox * cy + oy * cx) / (radius * aspect))
      weights[y * this.width + x] = distance >= 1 ? 0 : smooth(1 - distance)
    }
    // 无向邻格对只处理一次。相等厚度不交换，接触边缘不会把平灰揉成凹坑。
    const neighborX = [2, 0, 2, -2], neighborY = [0, 2, 2, 2]
    for (let y = lowY; y <= highY; y++) for (let x = lowX; x <= highX; x++) {
      const index = y * this.width + x, local = weights[index]
      if (local === 0) continue
      for (let n = 0; n < 4; n++) {
        const tx = x + neighborX[n], ty = y + neighborY[n]
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) continue
        const target = ty * this.width + tx
        const moved = (this.density[index] - this.density[target]) * force * Math.min(local, weights[target])
        this.transfer[index] -= moved; this.transfer[target] += moved
      }
    }
    for (let y = Math.max(0, lowY - 2); y <= Math.min(this.height - 1, highY + 2); y++) for (let x = Math.max(0, lowX - 2); x <= Math.min(this.width - 1, highX + 2); x++) {
      const index = y * this.width + x
      this.density[index] += this.transfer[index]; this.transfer[index] = 0; weights[index] = 0
    }
  }

  private move(dt: number, contact: StageContact) {
    const fromX = contact.from.x * this.width
    const fromY = contact.from.y * this.height
    const toX = contact.to.x * this.width
    const toY = contact.to.y * this.height
    const dx = toX - fromX
    const dy = toY - fromY
    const lengthSquared = dx * dx + dy * dy
    const length = Math.sqrt(lengthSquared)
    const stationary = length < 0.01
    const direction = stationary ? (contact.angle ?? -Math.PI / 2) : Math.atan2(dy, dx)
    const forwardX = Math.cos(direction)
    const forwardY = Math.sin(direction)
    const normalX = -forwardY
    const normalY = forwardX
    const radius = clamp(contact.radius * this.width, 0.7, this.width * 0.4)
    const aspect = clamp(contact.aspect ?? (contact.tool === 'edge' ? 0.24 : 1), 0.12, 2.5)
    const angle = contact.angle ?? (contact.tool === 'edge' ? direction + Math.PI / 2 : direction)
    const axisX = Math.cos(angle)
    const axisY = Math.sin(angle)
    const reach = radius * Math.max(1, aspect)
    const lowX = Math.max(0, Math.floor(Math.min(fromX, toX) - reach - 1))
    const highX = Math.min(this.width - 1, Math.ceil(Math.max(fromX, toX) + reach + 1))
    const lowY = Math.max(0, Math.floor(Math.min(fromY, toY) - reach - 1))
    const highY = Math.min(this.height - 1, Math.ceil(Math.max(fromY, toY) + reach + 1))
    const force = clamp(contact.strength, 0, 3) * dt * 60 * (contact.tool === 'finger' ? 2.5 : contact.tool === 'edge' ? 3.2 : 1.8)
    for (let y = lowY; y <= highY; y++) {
      for (let x = lowX; x <= highX; x++) {
        const index = y * this.width + x
        const amount = this.density[index]
        if (amount < 1e-9) continue
        const path = stationary ? 1 : clamp(((x - fromX) * dx + (y - fromY) * dy) / lengthSquared, 0, 1)
        const nearX = fromX + dx * path
        const nearY = fromY + dy * path
        const offsetX = x - nearX
        const offsetY = y - nearY
        const localX = (offsetX * axisX + offsetY * axisY) / radius
        const localY = (-offsetX * axisY + offsetY * axisX) / (radius * aspect)
        const distance = Math.sqrt(localX * localX + localY * localY)
        if (distance >= 1) continue
        const edge = smooth(clamp((1 - distance) / 0.24, 0, 1))
        const roughness = 0.85 + this.texture[index] * 0.15
        const moved = amount * (1 - Math.exp(-force * edge * roughness))
        this.density[index] = amount - moved
        const fuzz = (this.texture[index] - 0.5) * radius * 0.14
        if (contact.tool === 'finger') {
          if (stationary) {
            const angle = Math.atan2(offsetY, offsetX)
            this.addBilinear(this.transfer, nearX + Math.cos(angle) * (radius * 1.07 + fuzz), nearY + Math.sin(angle) * (radius * 1.07 + fuzz), moved, true)
          } else {
            const ridge = radius * 1.08 + fuzz
            // 胶囊两端的投影会夹到 from/to；保留端帽里沙粒的大部分
            // 前后位置，不让每段指迹都把半圆沙压到一个黑色短截面。
            const longitudinal = (offsetX * forwardX + offsetY * forwardY) * 0.9
            const ridgeX = nearX + forwardX * longitudinal
            const ridgeY = nearY + forwardY * longitudinal
            this.addBilinear(this.transfer, ridgeX + normalX * ridge, ridgeY + normalY * ridge, moved * 0.5, true)
            this.addBilinear(this.transfer, ridgeX - normalX * ridge, ridgeY - normalY * ridge, moved * 0.5, true)
          }
        } else {
          const side = offsetX * normalX + offsetY * normalY
          // 掌面搬沙保留一部分原先的前后位置，前缘形成有厚度的沙带，
          // 避免把整掌的沙压到一条几何直线上。侧掌保留较窄的刮边。
          const forward = contact.tool === 'sweep' ? (offsetX * forwardX + offsetY * forwardY) * 0.55 : 0
          this.addBilinear(this.transfer,
            toX + forwardX * (radius * 1.12 + forward + fuzz) + normalX * side,
            toY + forwardY * (radius * 1.12 + forward + fuzz) + normalY * side,
            moved, true)
        }
      }
    }
    const weights = contact.tool === 'sweep' ? [0.09, 0.24, 0.34, 0.24, 0.09] : [0.2, 0.6, 0.2]
    const kernelRadius = contact.tool === 'sweep' ? 2 : 1
    for (const index of this.touched) {
      const amount = this.transfer[index]
      this.transfer[index] = 0
      const x = index % this.width
      const y = Math.floor(index / this.width)
      for (let row = -kernelRadius; row <= kernelRadius; row++) {
        for (let column = -kernelRadius; column <= kernelRadius; column++) {
          const moved = amount * weights[row + kernelRadius] * weights[column + kernelRadius]
          const targetX = x + column
          const targetY = y + row
          if (targetX < 0 || targetY < 0 || targetX >= this.width || targetY >= this.height) this.removed += moved
          else this.density[targetY * this.width + targetX] += moved
        }
      }
    }
    this.touched.length = 0
  }
}
