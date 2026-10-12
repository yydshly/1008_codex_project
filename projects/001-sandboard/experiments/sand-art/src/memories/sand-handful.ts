import { skinHull, type SkinPoint } from './skin-contact'

/** 封闭台面上的沙进入手中。单位与 density 相同；不生成外来沙量。 */
export class SandHandful {
  mass=0
  private previous:SkinPoint[]=[]
  private readonly width:number
  private readonly height:number
  private readonly worldWidth:number
  private readonly worldDepth:number
  readonly capacity:number
  constructor(width:number,height:number,worldWidth:number,worldDepth:number,capacity:number) {
    this.width=width;this.height=height;this.worldWidth=worldWidth;this.worldDepth=worldDepth;this.capacity=capacity
  }
  reset() {this.mass=0;this.previous=[]}
  lift() {this.previous=[]}
  release(amount:number) {
    const emitted=Math.max(0,Math.min(this.mass,amount))
    // 供料强度换算回质量时，最后一包可能差一个浮点舍入量。
    const remaining=this.mass-emitted
    this.mass=remaining<1e-9?0:remaining
    return emitted
  }
  take(field:Float32Array,points:readonly SkinPoint[],closing:number,heightScale:number) {
    if(points.length<3) {this.previous=[];return 0}
    const hull=skinHull([...this.previous,...points]);this.previous=points.map(p=>({...p}))
    if(closing<=0||hull.length<3||this.mass>=this.capacity) return 0
    const lowY=Math.min(...points.map(p=>p.y)),candidates:{index:number;amount:number}[]=[]
    const minX=Math.max(0,Math.floor((Math.min(...hull.map(p=>p.x))/this.worldWidth+.5)*(this.width-1)))
    const maxX=Math.min(this.width-1,Math.ceil((Math.max(...hull.map(p=>p.x))/this.worldWidth+.5)*(this.width-1)))
    const minZ=Math.max(0,Math.floor((Math.min(...hull.map(p=>p.z))/this.worldDepth+.5)*(this.height-1)))
    const maxZ=Math.min(this.height-1,Math.ceil((Math.max(...hull.map(p=>p.z))/this.worldDepth+.5)*(this.height-1)))
    let requested=0
    for(let row=minZ;row<=maxZ;row++) for(let col=minX;col<=maxX;col++) {
      const index=row*this.width+col,before=field[index]
      if(before<=0||lowY-before*heightScale>.004) continue
      const x=(col/(this.width-1)-.5)*this.worldWidth,z=(row/(this.height-1)-.5)*this.worldDepth
      let inside=Infinity
      for(let edge=0;edge<hull.length;edge++) {const a=hull[edge],b=hull[(edge+1)%hull.length],dx=b.x-a.x,dz=b.z-a.z;inside=Math.min(inside,(dx*(z-a.z)-dz*(x-a.x))/Math.hypot(dx,dz))}
      if(inside<=0)continue
      const amount=before*(1-Math.exp(-closing*7*Math.min(1,inside/.0025)))
      requested+=amount;candidates.push({index,amount})
    }
    const factor=requested ? Math.min(1,(this.capacity-this.mass)/requested) : 0
    let collected=0
    for(const {index,amount} of candidates) {const before=field[index];field[index]=Math.max(0,before-amount*factor);collected+=before-field[index]}
    this.mass+=collected
    return collected
  }
}
