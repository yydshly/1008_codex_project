import * as T from 'three'
import type { ContactAction, ContactPose } from './contact-score'
import { ContactSleeve, contactSkin } from './contact-surface'
import { addContactDeformations } from './contact-deformation'
import { skinHull, type SkinPatch } from './skin-contact'

const Z = new T.Vector3(0, 0, 1)
const X = new T.Vector3(1, 0, 0), Y = new T.Vector3(0, 1, 0)
const POSES: Record<ContactPose, number[]> = {
  // local Z: negative values flex these MakeHuman finger joints.
  pinch: [-.68, -.82, -.68, -.85, -.77, -.65, -.8, -.7, -.6, -.72, -.7, -.6, -.12, -.15, -.18],
  scatter: [-.4, -.48, -.35, -.45, -.5, -.4, -.48, -.5, -.4, -.5, -.5, -.4, -.08, -.12, -.12],
  palm: [.13, .2, .13, .12, .11, .12, .13, .16, .1, .12, .14, .12, .24, .13, .08],
  finger: [-.22, -.2, -.12, -.85, -.8, -.65, -.82, -.8, -.6, -.85, -.8, -.65, -.22, -.15, -.12],
  scoop: [-1.02,-1.14,-.88,-1.06,-1.12,-.9,-1.1,-1.05,-.86,-1.04,-1.12,-.88,-.4,-.35,-.3],
}
const NAMES = ['index', 'middle', 'pinky', 'ring', 'thumb'].flatMap(finger => [1, 2, 3].map(joint => `${finger}_0${joint}_r`))
export interface PalmBed { centre:T.Vector3;u:T.Vector3;v:T.Vector3;normal:T.Vector3 }

/** 真实蒙皮网格；所有接触锚点从变形后的顶点采样。 */
export class ContactHand {
  readonly group = new T.Group()
  readonly mesh: T.SkinnedMesh
  readonly releasePoints: T.Vector3[] = []
  contactPatch: SkinPatch | undefined
  readonly graspPoints:T.Vector3[]=[]
  readonly palmBed:PalmBed={centre:new T.Vector3(),u:new T.Vector3(),v:new T.Vector3(),normal:new T.Vector3()}
  private readonly palmSamples:number[]=[]
  private readonly bones: T.Bone[]
  private readonly rest: T.Quaternion[]
  private readonly pads: Record<string, number[]> = { index: [], middle: [], ring: [], pinky: [], thumb: [], palm: [],grasp:[] }
  private readonly temporary = new T.Vector3()
  private readonly delta = new T.Quaternion()
  private readonly local = new T.Group()
  private readonly cuff: ContactSleeve
  private readonly posed: Float64Array

  constructor(scene: T.Group, skin: T.Texture) {
    let found: T.SkinnedMesh | undefined
    scene.traverse(object => { if (object instanceof T.SkinnedMesh) found = object })
    if (!found) throw new Error('手部模型缺少蒙皮网格。')
    this.mesh = found
    const mesh = this.mesh
    addContactDeformations(mesh)
    this.posed = new Float64Array(mesh.geometry.getAttribute('position').count*3)
    mesh.material = contactSkin(skin)
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false
    this.bones = NAMES.map(name => {
      const bone = mesh.skeleton.bones.find(value => value.name === name)
      if (!bone) throw new Error(`手部模型缺少关节 ${name}`)
      return bone
    })
    this.rest = this.bones.map(bone => bone.quaternion.clone())
    this.local.position.set(-.025, 0, .03)
    this.local.add(scene)
    this.group.add(this.local)
    scene.updateMatrixWorld(true); mesh.skeleton.update()
    const joints = mesh.geometry.getAttribute('skinIndex'), weights = mesh.geometry.getAttribute('skinWeight'),normals=mesh.geometry.getAttribute('normal')
    const jointNames = mesh.skeleton.bones.map(bone => bone.name)
    const palmar:{id:number;x:number;z:number}[]=[]
    for (let vertex = 0; vertex < joints.count; vertex++) {
      const values = [weights.getX(vertex), weights.getY(vertex), weights.getZ(vertex), weights.getW(vertex)]
      const ids = [joints.getX(vertex), joints.getY(vertex), joints.getZ(vertex), joints.getW(vertex)]
      const strongest = values.indexOf(Math.max(...values)), name = jointNames[ids[strongest]]
      if (name === 'index_03_r') this.pads.index.push(vertex)
      if (name === 'thumb_03_r') this.pads.thumb.push(vertex)
      if (name === 'middle_03_r') this.pads.middle.push(vertex)
      if (name === 'ring_03_r') this.pads.ring.push(vertex)
      if (name === 'pinky_03_r') this.pads.pinky.push(vertex)
      if(/^(index|middle|ring|pinky)_0[123]_r$/.test(name))this.pads.grasp.push(vertex)
      mesh.getVertexPosition(vertex, this.temporary).applyMatrix4(mesh.matrixWorld)
      if (name === 'hand_r' && this.temporary.z < -.045 && this.temporary.z > -.095) this.pads.palm.push(vertex)
      if(name==='hand_r'&&normals.getY(vertex)<-.65)palmar.push({id:vertex,x:this.temporary.x,z:this.temporary.z})
    }
    for(const [x,z] of [[.035,-.085],[.014,-.085],[.058,-.085],[.035,-.053],[.035,-.113]]) {
      const nearest=palmar.reduce((best,p)=>Math.hypot(p.x-x,p.z-z)<Math.hypot(best.x-x,best.z-z)?p:best)
      this.palmSamples.push(nearest.id)
    }
    if (Object.values(this.pads).some(vertices => !vertices.length)) throw new Error('无法标定手部接触面。')
    // 袖口遮住上游截断的手腕；手部本身完全保留原网格和骨骼。
    this.cuff = new ContactSleeve()
    this.local.add(this.cuff)
  }

  /** 返回玻璃坐标中的出沙口或接触点；该点也供可视标记使用。 */
  place(action: ContactAction, surfaceHeight = 0): T.Vector3 {
    this.mesh.morphTargetInfluences![0]=action.grip
    this.mesh.morphTargetInfluences![1]=action.pose==='finger' ? action.pressure : 0
    this.bones.forEach((bone, index) => {
      const angle=(pose:ContactPose)=>pose==='scoop'?POSES.palm[index]+(POSES.scoop[index]-POSES.palm[index])*action.grip:POSES[pose][index]
      const a = angle(action.pose), b = angle(action.nextPose)
      const joint=index%3, finger=Math.floor(index/3), release=action.pose==='pinch' ? Math.min(1,action.flow/.48) : action.pose==='scatter' ? Math.min(1,action.flow/1.8) : 0
      const aperture=release*[.08,.065,.04][joint]*[1,.7,.38,.5,.85][finger]
      const settling=(action.pose==='pinch'||action.pose==='scatter') ? (.94-action.grip)*.12*[.65,1,.7][joint]+release*.012*Math.sin(action.time*5.2+finger*.9) : 0
      bone.quaternion.copy(this.rest[index]).multiply(this.delta.setFromAxisAngle(Z, a + (b - a) * action.blend + aperture+settling))
    })
    const gripFor = (pose: ContactPose) => pose === 'pinch' ? .5 - Math.min(1, action.flow / .48) * .12 : pose === 'scatter' ? .2 : pose==='scoop'?.2+.35*action.grip:0
    const opposition = gripFor(action.pose) + (gripFor(action.nextPose) - gripFor(action.pose)) * action.blend
    this.bones[12].quaternion.multiply(this.delta.setFromAxisAngle(X, .35 * opposition))
      .multiply(this.delta.setFromAxisAngle(Y, -.7 * opposition)).multiply(this.delta.setFromAxisAngle(Z, -.3 * opposition))
    this.cuff.pose(action.pose === 'palm' ? .8 : action.pose === 'finger' ? 1 : Math.min(1, action.flow / 1.8))
    this.group.position.set(0, 0, 0); this.group.rotation.set(0, action.yaw, 0)
    const tilt = (pose: ContactPose) => pose === 'finger' ? -.6 : pose==='scoop' ? -.28 : 0
    this.local.rotation.x = tilt(action.pose) + (tilt(action.nextPose) - tilt(action.pose)) * action.blend+action.wristTilt
    const roll = (pose: ContactPose) => pose === 'palm' ? .32 : 0
    this.local.rotation.z = roll(action.pose) + (roll(action.nextPose) - roll(action.pose)) * action.blend+action.wristRoll+(action.palmTurn??0)
    this.group.updateMatrixWorld(true); this.mesh.skeleton.update()
    let floor=Infinity
    for(let vertex=0;vertex<this.posed.length/3;vertex++) {
      this.mesh.getVertexPosition(vertex,this.temporary).applyMatrix4(this.mesh.matrixWorld)
      this.posed[vertex*3]=this.temporary.x;this.posed[vertex*3+1]=this.temporary.y;this.posed[vertex*3+2]=this.temporary.z
      floor=Math.min(floor,this.temporary.y)
    }
    const index = this.pad('index'), thumb = this.pad('thumb')
    const palm = this.pad('palm'), mouth = thumb.clone().lerp(index, .42)
    const anchorFor = (pose: ContactPose) => pose === 'finger' ? index : pose === 'palm' ? palm : pose==='scoop'?this.pad('grasp'):mouth
    const anchor = anchorFor(action.pose).clone().lerp(anchorFor(action.nextPose), action.blend)
    // 禁止整只手穿玻璃。指腹/掌缘随姿态下压，到最低皮肤处为止。
    const floorHeight = .001 + Math.max(0, surfaceHeight)
    const y = action.touching || action.elevation === 0 ? floorHeight - floor : action.elevation - anchor.y
    this.group.position.set(action.x - anchor.x, Math.max(floorHeight - floor, y), action.z - anchor.z)
    this.group.updateMatrixWorld(true)
    const worldPoint=(vertex:number)=>new T.Vector3(this.posed[vertex*3],this.posed[vertex*3+1],this.posed[vertex*3+2]).add(this.group.position)
    const [bed,left,right,wrist,knuckles]=this.palmSamples.map(worldPoint)
    this.palmBed.centre.copy(bed);this.palmBed.u.subVectors(right,left).normalize();this.palmBed.v.subVectors(knuckles,wrist).normalize()
    this.palmBed.normal.crossVectors(this.palmBed.v,this.palmBed.u).normalize()
    this.graspPoints.length=0
    if(action.pickup&&action.touching) {
      const fingers=this.pads.grasp
      const low=Math.min(...fingers.map(vertex=>this.posed[vertex*3+1]))
      const points=fingers.filter(vertex=>this.posed[vertex*3+1]<=low+.006).map(worldPoint)
      this.graspPoints.push(...skinHull(points).map(p=>new T.Vector3(p.x,p.y,p.z)))
    }
    this.releasePoints.length = 0
    this.releasePoints.push(anchor.clone().add(this.group.position))
    if (action.pose === 'scatter') {
      this.releasePoints.push(this.pad('middle').lerp(this.pad('ring'), .55).add(this.group.position))
      this.releasePoints.push(this.pad('ring').lerp(this.pad('pinky'), .55).add(this.group.position))
    }
    this.contactPatch=undefined
    if(action.touching && action.pressure>0) {
      const vertices=this.pads[action.pose==='palm'?'palm':'index']
      const low=Math.min(...vertices.map(vertex=>this.posed[vertex*3+1]))
      const points=vertices.filter(vertex=>this.posed[vertex*3+1]<=low+.0013+.002*action.pressure).map(vertex=>({
        x:this.posed[vertex*3]+this.group.position.x,y:this.posed[vertex*3+1]+this.group.position.y,z:this.posed[vertex*3+2]+this.group.position.z,
      }))
      const hull=skinHull(points)
      if(hull.length>=3) this.contactPatch={tool:action.pose==='palm'?'sweep':'finger',points:hull,pressure:action.pressure}
    }
    return anchor.add(this.group.position)
  }

  private pad(name: string) {
    // 皮肤表面的一小块最低指腹，而非悬空的骨骼中心。
    let low = Infinity
    for (const vertex of this.pads[name]) {
      low=Math.min(low,this.posed[vertex*3+1])
    }
    const result = new T.Vector3(); let count = 0
    for (const vertex of this.pads[name]) if(this.posed[vertex*3+1]<=low+.003) {result.x+=this.posed[vertex*3];result.y+=this.posed[vertex*3+1];result.z+=this.posed[vertex*3+2];count++}
    return result.multiplyScalar(1 / count)
  }

  dispose() { this.mesh.geometry.dispose(); (this.mesh.material as T.Material).dispose(); this.cuff.dispose() }
}
