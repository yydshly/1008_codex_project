import * as T from 'three'
import type { PalmBed } from './contact-hand'

const RINGS=14,SEGMENTS=64
const GRAINS=4096
const noise=(i:number)=>{let x=Math.imul(i+193,0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return ((x^(x>>>16))>>>0)/0xffffffff}
/** 掌内可见沙堆。位置来自实际蒙皮掌面，体积来自同一份材料记账。 */
export class HeldSand extends T.Mesh<T.BufferGeometry,T.MeshStandardMaterial> {
  private readonly grains:T.InstancedMesh<T.IcosahedronGeometry,T.MeshStandardMaterial>
  private readonly grainTransform=new T.Object3D()
  constructor() {
    const geometry=new T.BufferGeometry(),count=1+RINGS*SEGMENTS,indices:number[]=[]
    geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3))
    for(let s=0;s<SEGMENTS;s++)indices.push(0,1+s,1+(s+1)%SEGMENTS)
    for(let ring=1;ring<RINGS;ring++)for(let s=0;s<SEGMENTS;s++) {
      const a=1+(ring-1)*SEGMENTS+s,b=1+(ring-1)*SEGMENTS+(s+1)%SEGMENTS,c=a+SEGMENTS,d=b+SEGMENTS
      indices.push(a,c,b,b,c,d)
    }
    geometry.setIndex(indices)
    const material=new T.MeshStandardMaterial({color:'#98724e',roughness:.94,side:T.DoubleSide})
    material.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 vHeldPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHeldPosition=position;')
      shader.fragmentShader='varying vec3 vHeldPosition;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        vec3 cell=floor(vHeldPosition*2800.0);
        float grain=fract(sin(dot(cell,vec3(127.1,311.7,79.3)))*43758.5453);
        float resolved=1.0-smoothstep(0.7,1.6,length(fwidth(vHeldPosition))*2800.0);
        diffuseColor.rgb*=mix(1.0,0.65+grain*0.85,resolved);
      `)
    }
    super(geometry,material);this.castShadow=true;this.receiveShadow=true;this.frustumCulled=false;this.visible=false
    this.grains=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({roughness:.91,flatShading:true}),GRAINS)
    // 亚毫米颗粒的小投影低于当前灯光图精度；由连续堆体投影，避免重复绘制上万细面。
    this.grains.castShadow=false;this.grains.receiveShadow=true;this.grains.frustumCulled=false
    this.grains.instanceMatrix.setUsage(T.DynamicDrawUsage)
    for(let i=0;i<GRAINS;i++)this.grains.setColorAt(i,new T.Color('#b18c60').multiplyScalar(.62+noise(i+61)*.85))
    this.add(this.grains)
  }
  update(bed:PalmBed,mass:number,cellArea:number,heightScale:number) {
    this.visible=mass>1e-5
    if(!this.visible)return
    // 半径和高度共同缩小；积分抛物堆体积 = π rx rz h / 2。
    const volume=mass*cellArea*heightScale,scale=Math.cbrt(volume/.00002),rx=.030*scale,rz=.039*scale,h=volume/(Math.PI*rx*rz*.5)
    const position=this.geometry.getAttribute('position'),point=new T.Vector3()
    const set=(index:number,r:number,angle:number)=>{
      const uneven=1+.055*Math.sin(angle*5+.8)+.035*Math.sin(angle*9-1.3)
      const height=Math.max(0,h*(1-r*r))+.0002
      point.copy(bed.centre).addScaledVector(bed.u,Math.cos(angle)*r*rx*uneven).addScaledVector(bed.v,Math.sin(angle)*r*rz*uneven)
        .addScaledVector(bed.normal,height+(r<1?Math.sin(index*71.3)*.00012*scale:0))
      position.setXYZ(index,point.x,point.y,point.z)
    }
    set(0,0,0)
    for(let ring=1;ring<=RINGS;ring++)for(let s=0;s<SEGMENTS;s++)set(1+(ring-1)*SEGMENTS+s,ring/RINGS,s/SEGMENTS*Math.PI*2)
    position.needsUpdate=true;this.geometry.computeVertexNormals()
    // 表面颗粒是渲染样本；材料总量由上方连续堆体积控制，不重复计质量。
    this.grains.count=Math.max(1,Math.min(GRAINS,Math.round(GRAINS*(scale/.6)**2)))
    for(let i=0;i<this.grains.count;i++) {
      const r=Math.sqrt(noise(i)),angle=noise(i+10241)*Math.PI*2,uneven=1+.055*Math.sin(angle*5+.8)+.035*Math.sin(angle*9-1.3)
      const radius=.00020+noise(i+511)*.00015
      this.grainTransform.position.copy(bed.centre).addScaledVector(bed.u,Math.cos(angle)*r*rx*uneven).addScaledVector(bed.v,Math.sin(angle)*r*rz*uneven)
        .addScaledVector(bed.normal,h*(1-r*r)+.0002+radius*.45+noise(i+7181)*.00012)
      this.grainTransform.rotation.set(noise(i+173)*6.28,noise(i+881)*6.28,noise(i+433)*6.28)
      this.grainTransform.scale.set(radius*(.7+noise(i+91)*.6),radius*.65,radius)
      this.grainTransform.updateMatrix();this.grains.setMatrixAt(i,this.grainTransform.matrix)
    }
    this.grains.instanceMatrix.needsUpdate=true
  }
}
