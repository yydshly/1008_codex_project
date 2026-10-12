import * as T from 'three'
import type {PhotoLighting} from './photo-surface'
import {CompositionSurface} from './keepsake-composition-surface'
import {TABLE_WIDTH as W,TABLE_DEPTH as D} from './contact-score'
import {SAND_HEIGHT_SCALE} from './contact-material'
import {collectedGrainView} from './collected-grain-view'
import {KeepsakeStudy} from './keepsake-composition-material'

export type KeepsakeView='top'|'angle'|'close'
/** v33 独立沙层着色，只读取实际材料；不加载人像或手模型。 */
export class KeepsakeScene {
  readonly study:KeepsakeStudy
  readonly renderer:T.WebGLRenderer
  private readonly scene=new T.Scene()
  private readonly camera=new T.PerspectiveCamera(34,1,.01,3)
  private readonly surface:CompositionSurface
  private readonly positions=new Float32Array(16384*3)
  private readonly seeds=new Float32Array(16384)
  private readonly particles:T.Points<T.BufferGeometry,T.ShaderMaterial>

  private viewMode:KeepsakeView='top'
  constructor(canvas:HTMLCanvasElement,study:KeepsakeStudy){
    this.study=study;this.surface=new CompositionSurface(study.sand)
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'})
    this.renderer.setPixelRatio(1)
    this.renderer.outputColorSpace=T.SRGBColorSpace
    this.scene.background=new T.Color('#181c19')
    this.scene.add(new T.HemisphereLight('#fff1dc','#807968',2.0))
    const light=new T.DirectionalLight('#fff0d8',2);light.position.set(-.4,.8,-.3);this.scene.add(light)
    const frame=new T.Mesh(new T.BoxGeometry(W+.030,.018,D+.030),new T.MeshStandardMaterial({color:'#38322a',roughness:.9}))
    frame.position.y=-.011;this.scene.add(frame,this.surface)
    const geometry=new T.BufferGeometry()
    geometry.setAttribute('position',new T.BufferAttribute(this.positions,3));geometry.setAttribute('seed',new T.BufferAttribute(this.seeds,1))
    geometry.setDrawRange(0,0)
    const material=new T.ShaderMaterial({uniforms:{resolution:{value:1280}},transparent:true,depthWrite:false,
      vertexShader:`uniform float resolution;attribute float seed;varying float shade;void main(){
        vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;shade=seed;
        gl_PointSize=clamp(resolution*(.00030+seed*.00024)/max(.06,-p.z),1.,3.8);}`,
      fragmentShader:`varying float shade;void main(){vec2 q=(gl_PointCoord-.5)*2.;float r=dot(q,q);if(r>1.)discard;
        float light=.65+.35*max(0.,dot(normalize(vec3(q,sqrt(1.-r))),normalize(vec3(-.5,.5,.7))));
        gl_FragColor=vec4(mix(vec3(.20,.12,.06),vec3(.54,.35,.18),shade)*light,1.-smoothstep(.6,1.,r));}`})
    this.particles=new T.Points(geometry,material);this.particles.frustumCulled=false;this.scene.add(this.particles)
    this.renderer.setSize(1920,1280,false);this.camera.aspect=1.5;this.camera.updateProjectionMatrix();this.render()
  }
  view(view:KeepsakeView){this.viewMode=view;this.render()}
  lighting(mode:PhotoLighting){this.surface.lighting(mode);this.render()}
  render(){
    const sand=this.study.sand
    this.surface.update()
    for(let i=0;i<Math.min(16384,sand.airborne.length);i++){
      const grain=sand.airborne[i],v=grain.collected?collectedGrainView(grain,sand.width,sand.height):grain
      const x=Math.max(0,Math.min(sand.width-1,Math.round(v.x*sand.width))),y=Math.max(0,Math.min(sand.height-1,Math.round(v.y*sand.height)))
      this.positions[i*3]=(v.x-.5)*W
      this.positions[i*3+1]=grain.z*W+(grain.collected?sand.density[y*sand.width+x]*SAND_HEIGHT_SCALE:0)+.0003
      this.positions[i*3+2]=(v.y-.5)*D
      this.seeds[i]='seed' in v?v.seed:(grain.mass*139.31)%1
    }
    this.particles.geometry.setDrawRange(0,Math.min(16384,sand.airborne.length))
    this.particles.geometry.getAttribute('position').needsUpdate=true;this.particles.geometry.getAttribute('seed').needsUpdate=true
    const fit=Math.max(1,1.45/this.camera.aspect)
    this.camera.up.set(0,this.viewMode==='top'?0:1,this.viewMode==='top'?-1:0)
    if(this.viewMode==='top'){this.camera.position.set(0,.70*fit,.001);this.camera.lookAt(0,0,0)}
    else if(this.viewMode==='angle'){this.camera.position.set(.045,.52*fit,.34*fit);this.camera.lookAt(0,0,.018)}
    else{this.camera.position.set(.025,.31,.20);this.camera.lookAt(.015,.001,.048)}
    this.camera.updateMatrixWorld();this.renderer.render(this.scene,this.camera)
  }
  dispose(){
    this.surface.dispose()
    this.scene.traverse(object=>{if(object instanceof T.Mesh||object instanceof T.Points){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(m=>m.dispose())}})
    this.renderer.dispose()
  }
}

