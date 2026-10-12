import { GRID_HEIGHT, GRID_WIDTH, MAX_CONTACTS, clamp, type ArtContact, type ArtStep, type PourStyle } from './model'

/** Coordinates stay in the 512 × 384 canvas domain, even with a coarser solver. */
export type AirGrain = { x: number; y: number; z: number; vx: number; vy: number; vz: number; mass: number; seed: number; natural?: boolean }
export type AirSnapshot = {
  version: 1
  width: number
  height: number
  capacity: number
  particles: AirGrain[]
  randomState: number
  overflowCursor: number
  emittedMass: number
  /** Optional so in-memory checkpoints created before the natural model still load. */
  elapsedTime?: number
}

export const AIRBORNE_CAPACITY = 8192
const INITIAL_RANDOM_STATE = 0x53a9f17b
const GRAVITY = 800
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback

function correlatedNoise(value: number, phase: number) {
  const sample = (index: number) => { const raw = Math.sin(index * 127.1 + phase * 311.7) * 43758.5453; return raw - Math.floor(raw) }
  const index = Math.floor(value), fraction = value - index
  const blend = fraction * fraction * (3 - 2 * fraction)
  return sample(index) * (1 - blend) + sample(index + 1) * blend
}

/** Smooth hand release, not frame noise. Store this value in the recorded contact. */
export function naturalFlowAt(timeSeconds: number, style: PourStyle, x = 256, y = 192): number {
  if (style === 'handful') return 1
  const time = Math.max(0, finite(timeSeconds)), phase = finite(x) * 0.006 + finite(y) * 0.009
  const drift = correlatedNoise(time * 1.15 + phase, style === 'stream' ? 2.7 : 8.1)
  const pulse = Math.pow(0.5 + 0.5 * Math.sin(time * 4.1 + phase), 2)
  return clamp(style === 'stream' ? 0.3 + 0.95 * drift + 0.7 * pulse : 0.14 + 0.9 * drift + 0.95 * pulse, 0, 2)
}

/** Deterministic grain packets; every emitted unit is either flying or deposited. */
export class AirborneSand {
  readonly width: number
  readonly height: number
  readonly capacity: number
  private grains: AirGrain[] = []
  private randomState = INITIAL_RANDOM_STATE
  private overflowCursor = 0
  private totalEmitted = 0
  private clock = 0
  private readonly deposition: Float32Array

  constructor(width = GRID_WIDTH, height = GRID_HEIGHT, capacity = AIRBORNE_CAPACITY) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || !Number.isInteger(capacity) || capacity < 1 || capacity > AIRBORNE_CAPACITY) throw new RangeError('落沙网格或粒子容量无效')
    this.width = width; this.height = height; this.capacity = capacity
    this.deposition = new Float32Array(width * height)
  }

  get particles(): readonly AirGrain[] { return this.grains }
  get pending() { return this.grains.length > 0 }
  get emittedMass() { return this.totalEmitted }
  get elapsedTime() { return this.clock }

  private random() {
    let value = this.randomState
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5
    this.randomState = value >>> 0
    return this.randomState / 0x100000000
  }

  private emit(contact: ArtContact, dt: number) {
    const pour = contact.pour!
    const gain = clamp(finite(contact.strength), 0, 4) * clamp(finite(contact.pressure), 0, 1)
    const mass = (pour.style === 'handful' ? 1500 * clamp(finite(pour.burst ?? 0), 0, 1) : 3000 * dt) * gain * clamp(finite(pour.flow ?? 1, 1), 0, 2)
    if (mass <= 0) return
    this.totalEmitted += mass
    const count = pour.style === 'handful' ? Math.max(1, Math.ceil(384 * clamp(finite(pour.burst ?? 0), 0, 1))) : Math.max(1, Math.ceil((pour.style === 'stream' ? 1500 : 2400) * dt))
    const spread = clamp(finite(pour.spread), 0, 1), radius = clamp(finite(contact.radius, 16), 0.25, 128)
    const aperture = radius * (pour.style === 'stream' ? 0.07 + 0.16 * spread : pour.style === 'scatter' ? 0.28 + 0.8 * spread : 0.4 + spread)
    const speed = pour.style === 'stream' ? 4 + 12 * spread : pour.style === 'scatter' ? 24 + 60 * spread : 40 + 90 * spread
    if (pour.natural) { this.emitNatural(contact, mass, count, aperture, speed); return }
    for (let index = 0; index < count; index++) {
      const along = pour.style === 'handful' ? 1 : this.random()
      const angle = this.random() * Math.PI * 2, radial = Math.sqrt(this.random())
      const x = finite(contact.from.x) + (finite(contact.to.x) - finite(contact.from.x)) * along
      const y = finite(contact.from.y) + (finite(contact.to.y) - finite(contact.from.y)) * along
      const grain: AirGrain = {
        x: x + Math.cos(angle) * radial * aperture, y: y + Math.sin(angle) * radial * aperture,
        z: 20 + 80 * clamp(finite(pour.height), 0, 1),
        vx: Math.cos(angle) * radial * speed + clamp(finite(contact.velocity.x) * 0.055, -110, 110),
        vy: Math.sin(angle) * radial * speed + clamp(finite(contact.velocity.y) * 0.055, -110, 110),
        vz: 0, mass: mass / count, seed: this.random(),
      }
      this.addGrain(grain)
    }
  }

  private addGrain(grain: AirGrain) {
    if (this.grains.length < this.capacity) this.grains.push(grain)
    else {
      // A full pool merges packets rather than dropping sand or allocating an
      // unbounded queue. Keep the existing trajectory and its landing time.
      this.grains[this.overflowCursor % this.grains.length].mass += grain.mass
      this.overflowCursor = (this.overflowCursor + 1) % this.capacity
    }
  }

  private emitNatural(contact: ArtContact, mass: number, count: number, aperture: number, speed: number) {
    const pour = contact.pour!, burst = pour.style === 'handful'
    // A handful changes its orientation and proportions at each release. A
    // continuous hand instead drifts smoothly, maintaining coherent finger jets.
    const phase = this.clock * 1.7 + finite(contact.to.x) * 0.008 + finite(contact.to.y) * 0.012
    const angle = burst ? this.random() * Math.PI * 2 : -0.4 + Math.sin(phase * 0.4) * 0.24
    const skew = burst ? 0.65 + this.random() * 0.6 : 0.85 + Math.sin(phase * 0.63) * 0.15
    const centerShare = burst ? 0.38 + this.random() * 0.23 : 0.5 + Math.sin(phase * 0.7) * 0.1
    const c = Math.cos(angle), s = Math.sin(angle)
    const packets: AirGrain[] = []
    let weights = 0
    for (let index = 0; index < count; index++) {
      const along = burst ? 1 : this.random()
      const branch = this.random()
      const finger = branch < centerShare ? 0.04 : branch < centerShare + (1 - centerShare) * 0.6 ? -0.55 : 0.5
      const gaussianRadius = Math.sqrt(-2 * Math.log(Math.max(this.random(), 1e-9)))
      const gaussianAngle = this.random() * Math.PI * 2
      const gx = gaussianRadius * Math.cos(gaussianAngle), gy = gaussianRadius * Math.sin(gaussianAngle)
      const fringe = this.random() < 0.065
      const drift = Math.sin(phase + finger * 4.3) * 0.11
      const localX = aperture * (finger + drift + gx * (fringe ? 1.1 : 0.24)) * skew
      const localY = aperture * (Math.cos(phase * 0.8 + finger * 3.1) * 0.06 + gy * (fringe ? 0.75 : 0.13))
      const vx = speed * (finger * 0.65 + drift * 0.4 + gx * (fringe ? 0.65 : 0.24)) * skew
      const vy = speed * gy * (fringe ? 0.5 : 0.16)
      const weight = (0.18 + Math.pow(this.random(), 2) * 2.5) * (fringe ? 0.28 : 1)
      weights += weight
      packets.push({
        x: finite(contact.from.x) + (finite(contact.to.x) - finite(contact.from.x)) * along + c * localX - s * localY,
        y: finite(contact.from.y) + (finite(contact.to.y) - finite(contact.from.y)) * along + s * localX + c * localY,
        z: 20 + 80 * clamp(finite(pour.height), 0, 1),
        vx: c * vx - s * vy + clamp(finite(contact.velocity.x) * 0.055, -110, 110),
        vy: s * vx + c * vy + clamp(finite(contact.velocity.y) * 0.055, -110, 110),
        vz: 0, mass: weight, seed: this.random(), natural: true,
      })
    }
    let assigned = 0
    packets.forEach((grain, index) => {
      grain.mass = index === packets.length - 1 ? mass - assigned : mass * grain.mass / weights
      assigned += grain.mass
      this.addGrain(grain)
    })
  }

  private deposit(grain: AirGrain) {
    if (!grain.natural) {
      const x = clamp(Math.floor(grain.x / GRID_WIDTH * this.width), 0, this.width - 1)
      const y = clamp(Math.floor(grain.y / GRID_HEIGHT * this.height), 0, this.height - 1)
      this.deposition[y * this.width + x] += grain.mass
      return
    }
    // Compact subcell splatting rounds individual pepper-like pixels without
    // turning the clustered hand distribution into a broad uniform brush.
    const x = clamp(grain.x / GRID_WIDTH * this.width - 0.5, 0, this.width - 1)
    const y = clamp(grain.y / GRID_HEIGHT * this.height - 0.5, 0, this.height - 1)
    const left = Math.floor(x), top = Math.floor(y), fx = x - left, fy = y - top
    const right = Math.min(left + 1, this.width - 1), bottom = Math.min(top + 1, this.height - 1)
    this.deposition[top * this.width + left] += grain.mass * (1 - fx) * (1 - fy)
    this.deposition[top * this.width + right] += grain.mass * fx * (1 - fy)
    this.deposition[bottom * this.width + left] += grain.mass * (1 - fx) * fy
    this.deposition[bottom * this.width + right] += grain.mass * fx * fy
  }

  /** The returned grid is reused and cleared by the next call. New grains fall on later steps. */
  advance(step: ArtStep): Float32Array {
    this.deposition.fill(0)
    const dt = clamp(finite(step.dt), 0, 1 / 30)
    if (dt <= 0) return this.deposition
    this.clock += dt
    const wind = clamp(finite(step.wind), 0, 1) * 35
    const ax = Math.cos(finite(step.windAngle)) * wind, ay = Math.sin(finite(step.windAngle)) * wind
    for (let index = this.grains.length - 1; index >= 0; index--) {
      const grain = this.grains[index]
      const falls = grain.z + grain.vz * dt - 0.5 * GRAVITY * dt * dt <= 0
      const elapsed = falls ? Math.min(dt, (grain.vz + Math.sqrt(grain.vz * grain.vz + 2 * GRAVITY * grain.z)) / GRAVITY) : dt
      grain.x += grain.vx * elapsed + 0.5 * ax * elapsed * elapsed
      grain.y += grain.vy * elapsed + 0.5 * ay * elapsed * elapsed
      grain.vx += ax * elapsed; grain.vy += ay * elapsed
      grain.z = Math.max(0, grain.z + grain.vz * elapsed - 0.5 * GRAVITY * elapsed * elapsed)
      grain.vz -= GRAVITY * elapsed
      if (falls) {
        this.deposit(grain)
        this.grains.splice(index, 1)
      }
    }
    for (const contact of step.contacts.slice(0, MAX_CONTACTS)) if (contact.tool === 'pour' && contact.pour) this.emit(contact, dt)
    return this.deposition
  }

  snapshot(): AirSnapshot {
    return { version: 1, width: this.width, height: this.height, capacity: this.capacity, particles: this.grains.map((grain) => ({ ...grain })), randomState: this.randomState, overflowCursor: this.overflowCursor, emittedMass: this.totalEmitted, elapsedTime: this.clock }
  }

  restore(snapshot: AirSnapshot) {
    if (snapshot.version !== 1 || snapshot.width !== this.width || snapshot.height !== this.height || snapshot.capacity !== this.capacity || snapshot.particles.length > this.capacity || !Number.isInteger(snapshot.randomState) || snapshot.randomState < 1 || snapshot.randomState > 0xffffffff || !Number.isInteger(snapshot.overflowCursor) || snapshot.overflowCursor < 0 || snapshot.overflowCursor >= this.capacity || !Number.isFinite(snapshot.emittedMass) || snapshot.emittedMass < 0 || (snapshot.elapsedTime !== undefined && (!Number.isFinite(snapshot.elapsedTime) || snapshot.elapsedTime < 0)) || snapshot.particles.some((grain) => ![grain.x, grain.y, grain.z, grain.vx, grain.vy, grain.vz, grain.mass, grain.seed].every(Number.isFinite) || grain.mass <= 0 || grain.z < 0 || grain.seed < 0 || grain.seed >= 1 || (grain.natural !== undefined && typeof grain.natural !== 'boolean'))) throw new Error('落沙检查点无效，无法恢复')
    this.grains = snapshot.particles.map((grain) => ({ ...grain }))
    this.randomState = snapshot.randomState; this.overflowCursor = snapshot.overflowCursor; this.totalEmitted = snapshot.emittedMass
    this.clock = snapshot.elapsedTime ?? 0
    this.deposition.fill(0)
  }

  clear() {
    this.grains.length = 0; this.randomState = INITIAL_RANDOM_STATE; this.overflowCursor = 0; this.totalEmitted = 0; this.clock = 0; this.deposition.fill(0)
  }
}
