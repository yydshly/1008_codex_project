import { StageMaterial, type StageContact, type StagePoint } from '../stage/material'
import { CONTACT_DT, TABLE_WIDTH as W, TABLE_DEPTH as D, type ContactAction } from './contact-score'
import { relaxSand } from './sand-relaxation'
import { SkinSandContact, type SkinPatch, type SkinPoint } from './skin-contact'
import { SandHandful } from './sand-handful'
import { PILE_X, PILE_Z, PICKUP_FLOW_WEIGHT } from './pickup-score'

export interface SurfaceAnchor { x: number; y: number; z: number }
export const CONTACT_WIDTH = 256, CONTACT_HEIGHT = 176
export const SAND_HEIGHT_SCALE = .0008
export const sandHeight = (density: number) => Math.max(0, density) * SAND_HEIGHT_SCALE
const HANDFUL = 8
export const FLOW_MASS = CONTACT_WIDTH*CONTACT_HEIGHT*.016
export type SandSupply = 'preloaded'|'pickup'
export const tablePoint = (point: SurfaceAnchor): StagePoint => ({ x: point.x / W + .5, y: point.z / D + .5 })

/** 唯一材料状态。输入只包含当前手部表面的世界坐标，不能传入成品画。 */
export class ContactMaterial {
  readonly sand = new StageMaterial(CONTACT_WIDTH, CONTACT_HEIGHT, 0x20201009, 9000, 9.81 / W)
  private previous: StagePoint | undefined
  private previousTool = ''
  private previousEmitters: StagePoint[] = []
  private phase = 0
  private reserve = HANDFUL
  private previousGrip=0
  private initialGround=0
  private pickedMass=0
  private readonly handful=new SandHandful(CONTACT_WIDTH,CONTACT_HEIGHT,W,D,HANDFUL*FLOW_MASS)
  private readonly skin = new SkinSandContact(CONTACT_WIDTH,CONTACT_HEIGHT,W,D)
  lastMoved = 0
  lastTaken=0
  mode:SandSupply
  constructor(mode:SandSupply='preloaded') {this.mode=mode;this.reset()}
  get heldMass() {return this.mode==='pickup'?this.handful.mass:this.reserve*FLOW_MASS}
  get remaining() { return this.mode==='pickup'?this.heldMass/this.initialGround:this.reserve / HANDFUL }
  get accounting() {
    const table=this.sand.mass,hand=this.heldMass,air=this.sand.inAirMass,outside=this.sand.removedMass
    const initial=this.mode==='pickup'?this.initialGround:HANDFUL*FLOW_MASS
    return {table,hand,air,outside,initial,error:table+hand+air+outside-initial}
  }

  surfaceAt(x: number, z: number) {
    const col = Math.max(0, Math.min(CONTACT_WIDTH - 1, Math.round((x / W + .5) * (CONTACT_WIDTH-1))))
    const row = Math.max(0, Math.min(CONTACT_HEIGHT - 1, Math.round((z / D + .5) * (CONTACT_HEIGHT-1))))
    return sandHeight(this.sand.density[row * CONTACT_WIDTH + col])
  }

  reset(mode:SandSupply=this.mode) {
    this.mode=mode;this.sand.clear();this.skin.reset();this.handful.reset();this.lastMoved=this.lastTaken=0
    this.previous=undefined;this.previousTool='';this.previousEmitters=[];this.reserve=HANDFUL;this.phase=0;this.previousGrip=0;this.initialGround=this.pickedMass=0
    if(mode==='pickup') {
      // 起始小沙堆是这一段唯一材料输入；掌内与再落沙共用同一份量。
      for(let row=0;row<CONTACT_HEIGHT;row++) for(let col=0;col<CONTACT_WIDTH;col++) {
        const x=(col/(CONTACT_WIDTH-1)-.5)*W,z=(row/(CONTACT_HEIGHT-1)-.5)*D
        const radius=((x-PILE_X)/.043)**2+((z-PILE_Z)/.033)**2
        const taper=Math.max(0,1-radius/7)
        this.sand.density[row*CONTACT_WIDTH+col]=10*Math.exp(-radius)*taper*(1+.11*Math.sin(x*174+z*291)+.06*Math.sin(x*517-z*433))
      }
      this.initialGround=this.sand.mass
      const snapshot=this.sand.read();snapshot.suppliedMass=this.initialGround;this.sand.restore(snapshot)
    }
  }

  step(action: ContactAction, anchor: SurfaceAnchor, emitters: readonly SurfaceAnchor[] = [anchor], patch?: SkinPatch | null, grasp:readonly SkinPoint[]=[] ) {
    const point = tablePoint(anchor)
    const nearSand = anchor.y <= this.surfaceAt(anchor.x, anchor.z) + .004
    const tool = action.flow > 0 ? 'pour' : action.touching && nearSand && !action.pickup ? action.pose === 'palm' ? 'sweep' : 'finger' : ''
    const contacts: StageContact[] = []
    if (tool) {
      const from = tool === this.previousTool && this.previous ? this.previous : point
      if (tool === 'pour') {
        const requested=this.mode==='pickup'?action.flow*this.pickedMass/FLOW_MASS/PICKUP_FLOW_WEIGHT:action.flow
        const flow = Math.min(requested, this.heldMass / FLOW_MASS / CONTACT_DT)
        const mouths = action.pose === 'scatter' && emitters.length ? emitters.slice(0, 3) : [anchor]
        const weights = mouths.length === 3 ? [.5,.32,.18] : mouths.map(() => 1 / mouths.length)
        mouths.forEach((mouth, index) => {
          if (flow <= 0) return
          const to = tablePoint(mouth), start = tool === this.previousTool ? this.previousEmitters[index] ?? to : to
          contacts.push({ tool, from: start, to, radius: action.flowRadius??.0025, strength: flow * weights[index], spread: action.flowSpread??(action.pose === 'scatter' ? 1 : .13),
            emissionHeight: mouth.y / W, aspect: 1, cluster: action.flowCluster??(action.pose === 'scatter' ? .8 : .4), ballistic: true,velocityInheritance:action.flowInertia,continuousEmission:action.continuousEmission })
        })
        if(this.mode==='preloaded')this.reserve = Math.max(0, this.reserve - flow * CONTACT_DT)
        this.previousEmitters = mouths.map(tablePoint)
      }
      else if(patch===undefined) contacts.push({ tool, from, to: point, radius: tool === 'sweep' ? .045 : .009, strength: tool === 'sweep' ? 1.5 : 1.8, aspect: tool === 'sweep' ? .5 : 1 })
    }
    const supplied=this.sand.suppliedMass
    this.sand.step(CONTACT_DT, contacts)
    if(this.mode==='pickup')this.handful.release(this.sand.suppliedMass-supplied)
    this.lastTaken=0
    if(this.mode==='pickup'&&action.pickup&&action.touching) this.lastTaken=this.handful.take(this.sand.density,grasp,Math.max(0,action.grip-this.previousGrip)*action.pickup,SAND_HEIGHT_SCALE)
    else this.handful.lift()
    this.pickedMass+=this.lastTaken
    this.previousGrip=action.grip
    this.lastMoved=0
    if(patch && action.touching && action.flow===0 && !action.pickup) this.lastMoved=this.skin.apply(this.sand.density,patch,SAND_HEIGHT_SCALE,CONTACT_DT)
    else this.skin.lift()
    relaxSand(this.sand.density, CONTACT_WIDTH, CONTACT_HEIGHT, W / CONTACT_WIDTH, D / CONTACT_HEIGHT, SAND_HEIGHT_SCALE, this.phase++)
    this.previous = point; this.previousTool = tool
    return contacts
  }
}
