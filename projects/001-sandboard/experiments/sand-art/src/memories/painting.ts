import { StageMaterial, type StagePoint, type StageMaterialSnapshot } from '../stage/material'
import type { StageHand } from '../stage/show'
import { focusFor, type PhotoSettings } from './model'

/** 原创多尺度曲线笔触编排。照片仅规划笔触，不把目标厚度写入演出材料。 */
export const PHOTO_STEP = 1 / 60
export const paintingPhases = ['薄撒铺灰', '聚沙塑形', '揉沙整理', '收沙留白', '刻画光影', '落定留画'] as const
export const paintingNotes = [
  '先围绕主体薄撒灰底，留住整体明暗。', '沿光影的走向聚沙，让人物体块逐渐出现。',
  '用掌面揉匀局部沙簇，整理灰面。', '顺亮区收走多余沙，留出光与呼吸。',
  '小笔触添暗、收亮，沿形体曲线整理关键光影。', '等待细沙落定，把这一刻留在台上。',
] as const
export interface PhotoStroke {
  phase: number; tool: 'pour' | 'rub' | 'collect'; path: StagePoint[]
  sigma: number; budget: number; ticks: number
}
interface Cursor { tick: number; index: number; within: number; budget: number; tool: PhotoStroke['tool']; path: StagePoint[]; material: StageMaterialSnapshot }
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
function pathAt(path: StagePoint[], fraction: number): StagePoint {
  const f = clamp(fraction, 0, 1) * (path.length - 1), i = Math.min(path.length - 2, Math.floor(f)), t = f - i
  return { x: path[i].x + (path[i + 1].x - path[i].x) * t, y: path[i].y + (path[i + 1].y - path[i].y) * t }
}
function sample(field: Float32Array, width: number, height: number, x: number, y: number) {
  x = clamp(x, 0, width - 1); y = clamp(y, 0, height - 1)
  const ax = Math.floor(x), ay = Math.floor(y), bx = Math.min(ax + 1, width - 1), by = Math.min(ay + 1, height - 1)
  return (field[ay * width + ax] * (1 - x + ax) + field[ay * width + bx] * (x - ax)) * (1 - y + ay)
    + (field[by * width + ax] * (1 - x + ax) + field[by * width + bx] * (x - ax)) * (y - ay)
}

/** 弯曲笔触跟随局部明暗等值方向；笔间抬手，不连接相隔的区域。 */
function curve(field: Float32Array, width: number, height: number, x: number, y: number, sigma: number, salt: number): StagePoint[] {
  const center = sample(field, width, height, x, y), step = Math.max(.8, sigma * .75)
  const walk = (sign: number) => {
    const points: StagePoint[] = []; let px = x, py = y, previous = salt * 2.39996
    for (let n = 0; n < 3; n++) {
      const gx = sample(field, width, height, px + 1, py) - sample(field, width, height, px - 1, py)
      const gy = sample(field, width, height, px, py + 1) - sample(field, width, height, px, py - 1)
      let angle = Math.hypot(gx, gy) > .014 ? Math.atan2(gy, gx) + Math.PI / 2 : previous
      if (Math.cos(angle - previous) < 0) angle += Math.PI
      angle = previous + Math.atan2(Math.sin(angle - previous), Math.cos(angle - previous)) * .6
      const nx = px + Math.cos(angle) * step * sign, ny = py + Math.sin(angle) * step * sign
      if (nx < 1 || ny < 1 || nx > width - 2 || ny > height - 2 || Math.abs(sample(field, width, height, nx, ny) - center) > (sigma<1.5?.12:.3)) break
      px = nx; py = ny; previous = angle; points.push({ x: px / width, y: py / height })
    }
    return points
  }
  const path = [...walk(-1).reverse(), { x: x / width, y: y / height }, ...walk(1)]
  if (path.length < 2) path.push({ x: clamp((x + .6) / width, .01, .99), y: clamp((y + .3) / height, .01, .99) })
  return path
}

export function planPhotoPainting(target: StageMaterialSnapshot, settings: PhotoSettings): PhotoStroke[] {
  const width = Math.min(256, target.width), height = Math.max(4, Math.round(width * target.height / target.width))
  const guide = new Float32Array(width * height), predicted = new Float32Array(guide.length)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let sum = 0
    for (const [dx, dy] of [[-.25,-.25],[.25,-.25],[-.25,.25],[.25,.25]]) sum += sample(target.density, target.width, target.height, (x + .5 + dx) / width * target.width, (y + .5 + dy) / height * target.height)
    guide[y * width + x] = sum / 4
  }
  const focus = focusFor(settings), strokes: PhotoStroke[] = []
  if(guide.every(n=>n<.005))return [{phase:5,tool:'rub',path:[{x:.5,y:.5},{x:.5,y:.5}],sigma:1,budget:0,ticks:60}]
  let salt = 0, last = { x: focus.x * width, y: focus.y * height }
  for (const spec of [
    { phase: 0, sigma: width * .039, scale: .35, gain: .65, limit: 100 },
    { phase: 1, sigma: width * .018, scale: .86, gain: .7, limit: 290 },
    { phase: 4, sigma: width * .012, scale: 1, gain: .75, limit: 420 },
    { phase: 4, sigma: width * .006, scale: 1, gain: .75, limit: 850 },
    { phase: 4, sigma: Math.max(.8,width * .0032), scale: 1, gain: .75, limit: 1800 },
  ]) {
    const candidates: { x: number; y: number; error: number }[] = [], spacing = Math.max(1.9, spec.sigma * 1.7)
    for (let y = spacing / 2; y < height - 1; y += spacing) for (let x = spacing / 2; x < width - 1; x += spacing) {
      const jitter = Math.sin(++salt * 12.9898) * .32 * spacing
      const px = clamp(x + jitter, 1, width - 2), py = clamp(y + Math.cos(salt * 7.13) * .32 * spacing, 1, height - 2)
      const error = sample(guide, width, height, px, py) * spec.scale - sample(predicted, width, height, px, py)
      const gradient=Math.abs(sample(guide,width,height,px+1,py)-sample(guide,width,height,px-1,py))+Math.abs(sample(guide,width,height,px,py+1)-sample(guide,width,height,px,py-1))
      const priority=spec.phase===4?Math.abs(error)+gradient*.7:error
      if (priority > (spec.phase === 4 ? .05 : .035)) candidates.push({ x: px, y: py, error:priority })
    }
    // 一笔接一笔塑造局部体块，优先近处与重要暗部；没有逐行往返扫描。
    for (let count = 0; count < spec.limit && candidates.length; count++) {
      let best = 0, score = -Infinity
      for (let i = 0; i < candidates.length; i++) {
        const p = candidates[i], distance = Math.hypot(p.x - last.x, p.y - last.y)
        const next = p.error / (1 + distance / (spec.sigma * 5))
        if (next > score) { score = next; best = i }
      }
      const p = candidates.splice(best, 1)[0]
      const error = sample(guide, width, height, p.x, p.y) * spec.scale - sample(predicted, width, height, p.x, p.y)
      if (spec.phase!==4&&error < .025) continue
      const path = curve(guide, width, height, p.x, p.y, spec.sigma, ++salt)
      const sigma = spec.sigma * target.width / width
      let length = 0
      for (let n = 1; n < path.length; n++) length += Math.hypot((path[n].x - path[n-1].x) * target.width, (path[n].y - path[n-1].y) * target.height)
      const budget = Math.max(.015,error) * (2 * Math.PI * sigma * sigma + Math.sqrt(2 * Math.PI) * sigma * length) * spec.gain
      const ticks = Math.max(spec.phase === 0 ? 12 : spec.phase === 1 ? 8 : 4, Math.ceil(budget / (target.width * target.height * .016 / 60 * 1.8)))
      strokes.push({ phase: spec.phase, tool: 'pour', path, sigma, budget, ticks })
      // 规划用的估计只决定下一笔；从不覆盖实际材料。
      const radius = Math.ceil(spec.sigma * 3), area = 2 * Math.PI * spec.sigma ** 2
      for (let n = 0; n < 7; n++) {
        const at = pathAt(path, n / 6), cx = at.x * width, cy = at.y * height
        for (let yy = Math.max(0, Math.floor(cy-radius)); yy <= Math.min(height-1, Math.ceil(cy+radius)); yy++) for (let xx = Math.max(0, Math.floor(cx-radius)); xx <= Math.min(width-1, Math.ceil(cx+radius)); xx++) {
          predicted[yy * width + xx] += budget / (target.width / width) ** 2 / 7 / area * Math.exp(-((xx-cx)**2+(yy-cy)**2)/(2*spec.sigma**2))
        }
      }
      last = { x: path[path.length-1].x * width, y: path[path.length-1].y * height }
    }
    if (spec.phase === 1) {
      const forms = strokes.filter(s => s.phase === 1).filter((_, i) => i % 12 === 0)
      for (const form of forms) strokes.push({ ...form, phase: 2, tool: 'rub', sigma: form.sigma * 2, budget: 0, ticks: 12 })
      // 从主要灰面的实际笔触估计中寻找亮区，顺同一形体方向收沙。
      const bright: { x: number; y: number; error: number }[] = []
      for (let y = 3; y < height-3; y += 3) for (let x = 3; x < width-3; x += 3) {
        const i = y * width + x, error = predicted[i] - guide[i]
        if (error > .1) bright.push({x,y,error})
      }
      bright.sort((a,b) => b.error-a.error)
      // 实际宽散落沙会跨入亮区，即使预测场尚未过量，也必须保留一轮掌面提亮。
      const highlights=bright.slice(0,180)
      while(highlights.length<180)highlights.push({x:focus.x*width,y:focus.y*height,error:0})
      for (const p of highlights) {
        const path = curve(guide,width,height,p.x,p.y,1.6,++salt)
        strokes.push({phase:3,tool:'collect',path,sigma:target.width*.013,budget:.12,ticks:12})
        for (const at of path) for (let yy=Math.max(0,Math.floor(at.y*height-3));yy<=Math.min(height-1,Math.ceil(at.y*height+3));yy++) for(let xx=Math.max(0,Math.floor(at.x*width-3));xx<=Math.min(width-1,Math.ceil(at.x*width+3));xx++) {
          const d=Math.hypot(xx-at.x*width,yy-at.y*height)/3
          if(d<1) predicted[yy*width+xx]*=1-.35*(1-d)
        }
      }
    }
  }
  strokes.push({phase:5,tool:'rub',path:[{x:.5,y:.5},{x:.5,y:.5}],sigma:1,budget:0,ticks:60})
  return strokes
}

export class PhotoPainting {
  readonly material: StageMaterial
  readonly strokes: PhotoStroke[]
  readonly totalTicks: number
  readonly phaseStarts: number[]
  tick = 0; hand: StageHand | null = null; phase = 0
  private index = 0; private within = 0; private budget = 0; private tool: PhotoStroke['tool']='pour'
  private readonly target: StageMaterialSnapshot
  private readonly guide: Float32Array
  private readonly guideWidth: number
  private readonly guideHeight: number
  private readonly candidates: StagePoint[]=[]
  private readonly focus: ReturnType<typeof focusFor>
  private path: StagePoint[]=[{x:.5,y:.5},{x:.5,y:.5}]
  private checkpoints: Cursor[] = []
  private readonly checkpointEvery: number
  constructor(target: StageMaterialSnapshot, settings: PhotoSettings) {
    this.target={...target,density:target.density.slice(),particles:[]}
    this.focus=focusFor(settings)
    this.guideWidth=Math.min(256,target.width);this.guideHeight=Math.max(4,Math.round(this.guideWidth*target.height/target.width))
    this.guide=new Float32Array(this.guideWidth*this.guideHeight)
    for(let y=0;y<this.guideHeight;y++)for(let x=0;x<this.guideWidth;x++)this.guide[y*this.guideWidth+x]=sample(target.density,target.width,target.height,(x+.5)/this.guideWidth*target.width,(y+.5)/this.guideHeight*target.height)
    for(let y=2;y<this.guideHeight-2;y+=3)for(let x=2;x<this.guideWidth-2;x+=3)this.candidates.push({x:(x+.5+Math.sin(x*7.1+y*3.3)*.3)/this.guideWidth,y:(y+.5+Math.cos(x*2.1+y*9.3)*.3)/this.guideHeight})
    this.material = new StageMaterial(target.width, target.height, 0x77a11e, Math.min(50000,Math.max(4000,target.width*target.height*.13)))
    this.strokes = planPhotoPainting(target, settings)
    this.totalTicks = this.strokes.reduce((sum,s) => sum+s.ticks+6,0)
    let ticks=0
    this.phaseStarts = paintingPhases.map((_, phase) => {
      const at=this.strokes.findIndex(s=>s.phase>=phase); ticks=0
      for(let i=0;i<at;i++) ticks+=this.strokes[i].ticks+6
      return ticks
    })
    this.checkpointEvery=Math.max(120,Math.ceil(this.totalTicks/12))
    this.checkpoints.push(this.read())
  }
  step() {
    if(this.tick>=this.totalTicks) return false
    const stroke=this.strokes[this.index]; this.phase=stroke.phase
    if(this.within===0) {
      this.budget=stroke.budget;this.tool=stroke.tool;this.path=stroke.path
      if(stroke.phase===1||stroke.phase===3||stroke.phase===4){
        let best=this.candidates[0],score=-Infinity
        for(const p of this.candidates){
          const x=p.x*this.material.width,y=p.y*this.material.height
          const wanted=this.localAverage(this.target.density,x,y,stroke.sigma)*(stroke.phase===1?.86:1)
          const actual=this.localAverage(this.material.density,x,y,stroke.sigma)
          // 以透光差评估重要性：避免一直追逐深黑衣服里的厚度差，漏掉脸与手的亮面。
          const lightError=Math.exp(-wanted*1.35)-Math.exp(-actual*1.35)
          const error=stroke.phase===3?Math.max(0,lightError):Math.abs(lightError)
          const distance=Math.hypot((p.x-this.focus.x)/this.focus.size,(p.y-this.focus.y)/(this.focus.size*1.42))
          const priority=error*(.3+.7*Math.exp(-distance*distance*.6))
          if(priority>score){score=priority;best=p}
        }
        if(best)this.path=curve(this.guide,this.guideWidth,this.guideHeight,best.x*this.guideWidth,best.y*this.guideHeight,stroke.sigma/this.material.width*this.guideWidth,this.index)
        let desired=0,current=0,length=0
        for(let n=0;n<5;n++){const p=pathAt(this.path,n/4),x=p.x*this.material.width,y=p.y*this.material.height
          desired+=this.localAverage(this.target.density,x,y,stroke.sigma)*(stroke.phase===1?.86:1)
          current+=this.localAverage(this.material.density,x,y,stroke.sigma)
          if(n){const before=pathAt(this.path,(n-1)/4);length+=Math.hypot((p.x-before.x)*this.material.width,(p.y-before.y)*this.material.height)}
        }
        desired/=5;current/=5
        const error=desired-current
        if(error>=0&&stroke.phase!==3){this.tool='pour';this.budget=error*(2*Math.PI*stroke.sigma**2+Math.sqrt(2*Math.PI)*stroke.sigma*length)*.85}
        else{this.tool='collect';const fraction=clamp(-error/Math.max(.01,current)*.75,0,.85);this.budget=-Math.log(1-fraction)/(stroke.ticks*PHOTO_STEP*120*.4)}
      }
    }
    this.hand=null
    if(this.within<stroke.ticks && stroke.phase!==5) {
      const from=pathAt(this.path,this.within/stroke.ticks),to=pathAt(this.path,(this.within+1)/stroke.ticks)
      if(this.tool==='pour') {
        const flow=clamp(.8+.24*Math.sin((this.material.elapsedTime+PHOTO_STEP)*8.1+to.x*6)+.19*Math.sin((this.material.elapsedTime+PHOTO_STEP)*3.37+1.1),.35,1.3)
        const mass=this.budget/Math.max(1,stroke.ticks-this.within)
        const base=this.material.width*this.material.height*.016*PHOTO_STEP*flow
        const strength=Math.min(3,mass/base),spread=stroke.phase<2?.82:.13
        this.material.step(PHOTO_STEP,[{tool:'pour',from,to,radius:stroke.sigma/(.2+spread*.55)/this.material.width,strength,spread,height:.06,cluster:.35}])
        this.budget=Math.max(0,this.budget-base*strength)
      } else if(this.tool==='collect') {
        this.material.step(PHOTO_STEP,[]); this.material.collect(from,to,stroke.sigma*2.3/this.material.width,this.budget,PHOTO_STEP)
      } else this.material.step(PHOTO_STEP,[{tool:'rub',from,to,radius:stroke.sigma/this.material.width,strength:1.2,aspect:.65}])
      this.hand={...to,pose:this.tool==='pour'?'pour':'palm',rotation:Math.atan2(to.y-from.y,to.x-from.x),down:true}
    } else this.material.step(PHOTO_STEP,[])
    this.within++; this.tick++
    if(this.within>=stroke.ticks+6){this.index++;this.within=0;this.budget=0;this.phase=this.strokes[Math.min(this.index,this.strokes.length-1)].phase}
    if(this.tick%this.checkpointEvery===0 && !this.checkpoints.some(c=>c.tick===this.tick)) this.checkpoints.push(this.read())
    if(this.tick===this.totalTicks) this.hand=null
    return true
  }
  private localAverage(field:Float32Array,x:number,y:number,sigma:number) {
    const r=Math.max(.8,sigma*.55)
    return (sample(field,this.material.width,this.material.height,x,y)*2+sample(field,this.material.width,this.material.height,x-r,y)+sample(field,this.material.width,this.material.height,x+r,y)+sample(field,this.material.width,this.material.height,x,y-r)+sample(field,this.material.width,this.material.height,x,y+r))/6
  }
  read(): Cursor { return {tick:this.tick,index:this.index,within:this.within,budget:this.budget,tool:this.tool,path:this.path.map(p=>({...p})),material:this.material.read()} }
  restore(cursor: Cursor) {
    if(!Number.isInteger(cursor.tick)||cursor.tick<0||cursor.tick>this.totalTicks||!Number.isInteger(cursor.index)||cursor.index<0||cursor.index>this.strokes.length
      ||!Number.isInteger(cursor.within)||cursor.within<0||!Number.isFinite(cursor.budget)||cursor.budget<0||!['pour','rub','collect'].includes(cursor.tool)) throw new Error('照片演出状态不正确。')
    this.material.restore(cursor.material);this.tick=cursor.tick;this.index=cursor.index;this.within=cursor.within;this.budget=cursor.budget;this.tool=cursor.tool;this.path=cursor.path.map(p=>({...p}))
    this.phase=this.strokes[Math.min(this.index,this.strokes.length-1)].phase;this.hand=null
  }
  rewindTo(tick: number) {
    const at=clamp(Math.floor(tick),0,this.totalTicks)
    const cached=this.checkpoints.filter(c=>c.tick<=at).sort((a,b)=>b.tick-a.tick)[0]
    this.restore(cached);return at
  }
}
