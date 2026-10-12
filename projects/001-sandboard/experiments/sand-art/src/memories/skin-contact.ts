/** 独立接触近似。皮肤点来自当前蒙皮；这里只搬动已有沙，不接受目标图。 */
export interface SkinPoint { x: number; y: number; z: number }
export interface SkinPatch { tool: 'sweep' | 'finger'; points: SkinPoint[]; pressure: number }
const cross = (a: SkinPoint, b: SkinPoint, c: SkinPoint) => (b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x)
const smooth = (x: number) => { const v = Math.max(0, Math.min(1, x)); return v*v*(3-2*v) }

export function skinHull(points: readonly SkinPoint[]): SkinPoint[] {
  const sorted = [...points].sort((a,b) => a.x-b.x || a.z-b.z), unique: SkinPoint[] = []
  for (const point of sorted) if (!unique.length || Math.hypot(point.x-unique.at(-1)!.x,point.z-unique.at(-1)!.z) > 1e-7) unique.push(point)
  if (unique.length < 3) return []
  const half = (list: SkinPoint[]) => {
    const result: SkinPoint[] = []
    for (const point of list) { while (result.length > 1 && cross(result.at(-2)!,result.at(-1)!,point) <= 0) result.pop(); result.push(point) }
    return result
  }
  const lower = half(unique), upper = half([...unique].reverse())
  return lower.slice(0,-1).concat(upper.slice(0,-1))
}

function centre(points: readonly SkinPoint[]) {
  const result = { x: 0, y: 0, z: 0 }
  for (const point of points) { result.x += point.x; result.y += point.y; result.z += point.z }
  result.x /= points.length; result.y /= points.length; result.z /= points.length
  return result
}

function insideDistance(hull: readonly SkinPoint[], x: number, z: number) {
  let distance = Infinity
  for (let i=0;i<hull.length;i++) {
    const a=hull[i],b=hull[(i+1)%hull.length], dx=b.x-a.x,dz=b.z-a.z
    distance=Math.min(distance,(dx*(z-a.z)-dz*(x-a.x))/Math.hypot(dx,dz))
  }
  return distance
}

function rayExit(hull: readonly SkinPoint[], x: number, z: number, dx: number, dz: number) {
  let distance = Infinity
  for (let i=0;i<hull.length;i++) {
    const a=hull[i],b=hull[(i+1)%hull.length], ex=b.x-a.x,ez=b.z-a.z
    const direction=ex*dz-ez*dx
    if (direction < -1e-10) distance=Math.min(distance,Math.max(0,(ex*(z-a.z)-ez*(x-a.x))/-direction))
  }
  return Number.isFinite(distance) ? distance : 0
}

export class SkinSandContact {
  private previous: SkinPatch | undefined
  private readonly transfer: Float64Array
  private readonly width: number
  private readonly height: number
  private readonly worldWidth: number
  private readonly worldDepth: number
  constructor(width: number,height: number,worldWidth: number,worldDepth: number) {
    this.width=width;this.height=height;this.worldWidth=worldWidth;this.worldDepth=worldDepth
    this.transfer = new Float64Array(width*height)
  }
  reset() { this.previous=undefined; this.transfer.fill(0) }
  lift() { this.previous=undefined }

  apply(density: Float32Array, patch: SkinPatch, heightScale: number, dt: number) {
    if (patch.points.length < 3 || patch.pressure <= 0) { this.previous=patch; return 0 }
    const current=centre(patch.points), previous=this.previous?.tool===patch.tool ? centre(this.previous.points) : current
    const dx=current.x-previous.x,dz=current.z-previous.z,travel=Math.hypot(dx,dz)
    const pressing=Math.max(0,patch.pressure-(this.previous?.pressure ?? 0))
    const old = this.previous
    this.previous={...patch,points:patch.points.map(point=>({...point}))}
    if (travel < .00001 && pressing < .0001) return 0
    const hx=travel>.00001 ? dx/travel : 1,hz=travel>.00001 ? dz/travel : 0
    const hull=skinHull(old?.tool===patch.tool ? [...old.points,...patch.points] : patch.points)
    if (hull.length < 3) return 0
    const compliance=.0007+.0009*patch.pressure, reach=compliance+.003
    const lowX=Math.max(0,Math.floor((Math.min(...hull.map(p=>p.x))-reach)/this.worldWidth*(this.width-1)+(this.width-1)/2))
    const highX=Math.min(this.width-1,Math.ceil((Math.max(...hull.map(p=>p.x))+reach)/this.worldWidth*(this.width-1)+(this.width-1)/2))
    const lowZ=Math.max(0,Math.floor((Math.min(...hull.map(p=>p.z))-reach)/this.worldDepth*(this.height-1)+(this.height-1)/2))
    const highZ=Math.min(this.height-1,Math.ceil((Math.max(...hull.map(p=>p.z))+reach)/this.worldDepth*(this.height-1)+(this.height-1)/2))
    const lowY=Math.min(...patch.points.map(point=>point.y))
    let moved=0
    for(let row=lowZ;row<=highZ;row++) for(let col=lowX;col<=highX;col++) {
      const index=row*this.width+col,amount=density[index]
      if(amount<=1e-8) continue
      const x=(col/(this.width-1)-.5)*this.worldWidth,z=(row/(this.height-1)-.5)*this.worldDepth
      const inside=insideDistance(hull,x,z)
      if(inside < -compliance) continue
      const clearance=lowY-amount*heightScale
      if(clearance>.0035) continue
      const touch=smooth((inside+compliance)/(.002+compliance))*smooth((.0035-clearance)/.0025)
      const fraction=1-Math.exp(-patch.pressure*dt*(patch.tool==='sweep'?90:150)*touch)
      const before=density[index]; density[index]=Math.max(0,before-before*fraction)
      const removed=before-density[index]
      if(removed<=0) continue
      let rx=hx,rz=hz
      if(patch.tool==='finger') {
        const side=(x-current.x)*(-hz)+(z-current.z)*hx>=0 ? 1 : -1
        rx=-hz*side; rz=hx*side
      }
      // 压入时向周围让沙；拖动时掌前移沙，指腹把各侧的沙移到对应一侧。
      if(travel<.00001) { const length=Math.hypot(x-current.x,z-current.z); if(length>.0001){rx=(x-current.x)/length;rz=(z-current.z)/length} }
      const noise=Math.sin(x*731.3+z*927.7)*.00035
      const exit=rayExit(hull,x,z,rx,rz)+compliance+.0007+noise
      this.deposit(x+rx*exit,z+rz*exit,removed)
      moved+=removed
    }
    for(let i=0;i<density.length;i++) if(this.transfer[i]) { density[i]+=this.transfer[i];this.transfer[i]=0 }
    return moved
  }

  private deposit(x: number,z: number,amount: number) {
    // 木框内夹住落点，保留越过台沿的推沙量，不让数组行末绕回。
    const gx=Math.max(0,Math.min(this.width-1,(x/this.worldWidth+.5)*(this.width-1)))
    const gz=Math.max(0,Math.min(this.height-1,(z/this.worldDepth+.5)*(this.height-1)))
    const col=Math.min(this.width-2,Math.floor(gx)),row=Math.min(this.height-2,Math.floor(gz)),fx=gx-col,fz=gz-row
    this.transfer[row*this.width+col]+=amount*(1-fx)*(1-fz)
    this.transfer[row*this.width+col+1]+=amount*fx*(1-fz)
    this.transfer[(row+1)*this.width+col]+=amount*(1-fx)*fz
    this.transfer[(row+1)*this.width+col+1]+=amount*fx*fz
  }
}
