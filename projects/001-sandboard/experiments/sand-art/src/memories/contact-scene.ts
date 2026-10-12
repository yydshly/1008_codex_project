import * as T from 'three'
import { ContactHand } from './contact-hand'
import { contactAction, CONTACT_TICKS, TABLE_WIDTH as W, TABLE_DEPTH as D } from './contact-score'
import { ContactMaterial, CONTACT_WIDTH as NX, CONTACT_HEIGHT as NY, sandHeight, SAND_HEIGHT_SCALE } from './contact-material'
import { pickupAction, PICKUP_TICKS } from './pickup-score'
import { HeldSand } from './held-sand'
import { pourAction, POUR_TICKS } from './pour-score'
import { setPourCamera, setPhotoCamera, type ContactView } from './pour-camera'
import { SurfaceGrains } from './surface-grains'
import { PhotoSurface, type PhotoLighting } from './photo-surface'
import { PhotoStudy, type PhotoFocus } from './photo-study'
import type { PortraitPlan } from './structured-painting'
import { choreographPhoto, type PhotoArrangement } from './photo-choreography'
import {collectedGrainView} from './collected-grain-view'

const MAX_PARTICLES = 16384

export class ContactScene {
  readonly renderer: T.WebGLRenderer
  readonly driver = new ContactMaterial('pickup')
  readonly material = this.driver.sand
  readonly scene = new T.Scene()
  readonly hand: ContactHand
  readonly camera = new T.PerspectiveCamera(38, 1, .01, 5)
  tick = 0
  contactMode: 'skin'|'brush' = 'skin'
  sequence:'photo'|'pour'|'pickup'|'contact'='photo'
  photoArrangement:PhotoArrangement='performance'
  readonly choreography:ReturnType<typeof choreographPhoto>
  private readonly photoPlans:Record<PhotoArrangement,PortraitPlan>
  private readonly photoStudies=new Map<PhotoArrangement,PhotoStudy>()
  get photo(){return this.photoStudies.get(this.photoArrangement)!}
  private photoSurface:PhotoSurface
  private photoLighting:PhotoLighting='transmitted'
  get noHand(){return this.sequence==='pour'||this.sequence==='photo'}
  get ticks() {return this.sequence==='photo'?this.photo.ticks:this.sequence==='pour'?POUR_TICKS:this.sequence==='pickup'?PICKUP_TICKS:CONTACT_TICKS}
  action(tick=this.tick) {return this.sequence==='photo'?{...pourAction(0),...this.photo.anchor,label:this.photo.label}:this.sequence==='pour'?pourAction(tick):this.sequence==='pickup'?pickupAction(tick):contactAction(tick)}
  private readonly held=new HeldSand()
  private readonly surfaceGrains:SurfaceGrains
  private readonly surfaceMode={value:1}
  private readonly sand: T.Mesh<T.PlaneGeometry, T.MeshStandardMaterial>
  private readonly airborne: T.Points<T.BufferGeometry, T.ShaderMaterial>
  private readonly marker: T.Mesh
  private readonly footprint: T.LineLoop<T.BufferGeometry,T.LineBasicMaterial>
  private contactVisible=false
  private viewMode:ContactView='top'
  private readonly colors = new Float32Array(NX * NY * 3)
  private readonly positions = new Float32Array(MAX_PARTICLES * 3)
  private readonly airSeeds = new Float32Array(MAX_PARTICLES)
  private readonly base = new T.Color('#f2dfb2')
  private readonly dark = new T.Color('#322317')
  private readonly observer: ResizeObserver

  constructor(canvas: HTMLCanvasElement, model: T.Group, skin: T.Texture, plan:PortraitPlan,gesturePlan:PortraitPlan,sculptPlan:PortraitPlan,performancePlan:PortraitPlan) {
    this.choreography=choreographPhoto(plan)
    this.photoPlans={original:plan,coherent:this.choreography.plan,gesture:gesturePlan,sculpt:sculptPlan,performance:performancePlan}
    this.photoStudies.set('performance',new PhotoStudy(performancePlan))
    this.photoSurface=new PhotoSurface(this.photo.material,'sculpt')
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    this.renderer.outputColorSpace = T.SRGBColorSpace
    this.renderer.toneMapping = T.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = .95
    this.renderer.shadowMap.enabled = false
    this.renderer.shadowMap.type = T.PCFShadowMap
    this.scene.background = new T.Color('#171b18')
    this.scene.add(new T.HemisphereLight('#fff1dc', '#b9a78d', 1.3))
    const light = new T.DirectionalLight('#fff0db', 2.0)
    light.position.set(-.4, .8, -.35); light.castShadow = true
    light.shadow.mapSize.set(2048, 2048)
    light.shadow.camera.left = -.6; light.shadow.camera.right = .6
    light.shadow.camera.top = .6; light.shadow.camera.bottom = -.6
    light.shadow.camera.near = .01; light.shadow.camera.far = 2
    light.shadow.normalBias = .0006; light.shadow.bias = -.00002
    light.shadow.radius = 10
    this.scene.add(light)
    const fill = new T.DirectionalLight('#e3efff', .5); fill.position.set(.5, .3, .25); this.scene.add(fill)
    const frame = new T.Mesh(new T.BoxGeometry(W + .064, .028, D + .064), new T.MeshStandardMaterial({ color: '#302b22', roughness: .84 }))
    frame.position.y = -.017; frame.receiveShadow = true; this.scene.add(frame)
    const glass = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ color: '#e4d3a9', emissive: '#f2ddb3', emissiveIntensity: .35, roughness: .52 }))
    glass.rotation.x = -Math.PI / 2; glass.position.y = -.0003; glass.receiveShadow = true; this.scene.add(glass)
    const plane = new T.PlaneGeometry(W, D, NX - 1, NY - 1); plane.rotateX(-Math.PI / 2)
    plane.setAttribute('color', new T.BufferAttribute(this.colors, 3))
    const sandMaterial = new T.MeshStandardMaterial({ vertexColors: true, roughness: .96, metalness: 0 })
    sandMaterial.onBeforeCompile = shader => {
      shader.uniforms.pureSand=this.surfaceMode
      shader.vertexShader = 'varying vec3 vSandPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSandPosition = position;')
      shader.fragmentShader = 'uniform float pureSand;varying vec3 vSandPosition;\n' + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        vec2 grainCoords = vSandPosition.xz * 2200.0;
        vec2 grain = floor(grainCoords);
        float seed = fract(sin(dot(grain, vec2(127.1, 311.7))) * 43758.5453);
        float seed2 = fract(sin(dot(grain, vec2(269.5,183.3))) * 43758.5453);
        vec2 centre = vec2(0.3+seed*0.4,0.3+seed2*0.4);
        vec2 local = (fract(grainCoords)-centre)*vec2(0.9+seed*0.4,1.1-seed2*0.3);
        float edge = length(local)-(0.27+seed2*0.13);
        float aa = max(0.04,fwidth(edge));
        float shape = 1.0-smoothstep(-aa,aa,edge);
        float resolved = 1.0-smoothstep(0.8,1.6,max(fwidth(grainCoords.x),fwidth(grainCoords.y)));
        float coverage = 1.0-exp(-max(0.0,vSandPosition.y-0.00002)*${1.4 / SAND_HEIGHT_SCALE});
        float sparse = step(seed,coverage)*shape;
        float grainWeight = mix(coverage,mix(sparse,1.0,smoothstep(0.65,1.0,coverage)),resolved)*step(0.00001,coverage);
        diffuseColor.rgb = mix(vec3(0.887,0.738,0.445), vec3(0.032,0.017,0.008)*(0.75+seed*0.6),grainWeight);
        if(pureSand>.5) {
          float body=smoothstep(0.15,0.82,coverage);
          float textureWeight=mix(0.80,1.15,seed)*body;
          diffuseColor.rgb=mix(vec3(.78,.69,.53),vec3(.083,.045,.020),clamp(textureWeight,0.0,1.0));
        }
      `)
    }
    this.sand = new T.Mesh(plane, sandMaterial); this.sand.receiveShadow = true; this.sand.castShadow=true; this.sand.frustumCulled = false
    this.scene.add(this.sand)
    this.scene.add(this.photoSurface)
    this.surfaceGrains=new SurfaceGrains(this.material.density);this.scene.add(this.surfaceGrains)
    const particles = new T.BufferGeometry(); particles.setAttribute('position', new T.BufferAttribute(this.positions, 3));particles.setAttribute('seed',new T.BufferAttribute(this.airSeeds,1)); particles.setDrawRange(0, 0)
    const particlesMaterial = new T.ShaderMaterial({
      uniforms: { resolution: { value: 800 } }, transparent: true, depthWrite: false,
      vertexShader: 'uniform float resolution;attribute float seed;varying float shade;void main(){ vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;shade=seed; gl_PointSize=clamp(resolution*(.00042+shade*.00023)/max(0.08,-p.z),1.1,4.0); }',
      fragmentShader: 'varying float shade;void main(){vec2 q=(gl_PointCoord-.5)*2.0;float r=dot(q,q);if(r>1.0)discard;float dome=sqrt(1.0-r);float light=.5+.5*max(0.0,dot(normalize(vec3(q,dome)),normalize(vec3(-.5,.5,.7)))); gl_FragColor=vec4(mix(vec3(.19,.11,.055),vec3(.57,.38,.18),shade)*light,1.0-smoothstep(.7,1.0,r));}',
    })
    this.airborne = new T.Points(particles, particlesMaterial); this.airborne.frustumCulled = false; this.scene.add(this.airborne)
    this.hand = new ContactHand(model, skin);this.hand.group.visible=false; this.scene.add(this.hand.group)
    this.scene.add(this.held)
    this.marker = new T.Mesh(new T.SphereGeometry(.0035, 16, 12), new T.MeshBasicMaterial({ color: '#67ddc7', depthTest: false }))
    this.marker.renderOrder = 100; this.marker.visible = false; this.scene.add(this.marker)
    const footprintGeometry=new T.BufferGeometry();footprintGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(192),3));footprintGeometry.setDrawRange(0,0)
    this.footprint=new T.LineLoop(footprintGeometry,new T.LineBasicMaterial({color:'#67ddc7',depthTest:false,transparent:true,opacity:.9}))
    this.footprint.renderOrder=100;this.footprint.visible=false;this.footprint.frustumCulled=false;this.scene.add(this.footprint)
    this.camera.up.set(0, 1, 0); this.view('top')
    this.observer = new ResizeObserver(() => this.resize(canvas)); this.observer.observe(canvas)
    this.resize(canvas); this.reset()
  }

  view(view: ContactView) {
    this.viewMode=view
    this.camera.up.set(0, view === 'top' ? 0 : 1, view === 'top' ? -1 : 0)
    this.camera.position.set(0, view === 'top' ? .82 : .72, view === 'top' ? .001 : .55)
    this.camera.lookAt(0, 0, .025)
    this.render()
  }

  showHand(show: boolean) { this.hand.group.visible = show&&!this.noHand; this.paint();this.render() }
  focus(focus:PhotoFocus){this.photo.focus=focus;this.render()}
  lighting(mode:PhotoLighting){this.photoLighting=mode;this.photoSurface.lighting(mode);this.render()}
  arrangePhoto(mode:PhotoArrangement){
    if(mode===this.photoArrangement)return
    const focus=this.photo.focus
    this.scene.remove(this.photoSurface);this.photoSurface.dispose()
    this.photoArrangement=mode
    if(!this.photoStudies.has(mode))this.photoStudies.set(mode,new PhotoStudy(this.photoPlans[mode]))
    this.photo.focus=focus;this.tick=this.photo.tick
    this.photoSurface=new PhotoSurface(this.photo.material,mode==='sculpt'||mode==='performance'?'sculpt':'flow');this.photoSurface.lighting(this.photoLighting)
    this.scene.add(this.photoSurface);this.paint();this.render()
  }
  showContact(show: boolean) { this.contactVisible=show;this.paintContact();this.render() }
  reset() {
    this.driver.reset(this.sequence==='pickup'?'pickup':'preloaded');this.tick=0
    if(this.sequence==='photo'){this.photo.reset();this.hand.group.visible=false}
    else if(this.sequence==='pour'){const action=this.action();this.marker.position.set(action.x,action.elevation,action.z);this.hand.group.visible=false}
    else this.marker.position.copy(this.hand.place(this.action(0)))
    this.paintContact();this.paint();this.render()
  }

  step() {
    if (this.tick >= this.ticks) return
    if(this.sequence==='photo'){this.photo.step();this.tick=this.photo.tick;return}
    if(this.sequence==='pour') {
      const action=this.action(++this.tick),anchor={x:action.x,y:action.elevation,z:action.z}
      this.marker.position.set(anchor.x,anchor.y,anchor.z);this.driver.step(action,anchor,[anchor],null);return
    }
    const action = this.action(++this.tick), anchor = this.hand.place(action, this.driver.surfaceAt(action.x, action.z))
    this.marker.position.copy(anchor)
    this.driver.step(action, anchor, this.hand.releasePoints,this.contactMode==='skin'?this.hand.contactPatch??null:undefined,this.hand.graspPoints)
    this.paintContact()
  }

  private paintContact() {
    if(this.noHand){this.marker.visible=false;this.footprint.visible=false;return}
    const patch=this.hand.contactPatch,grasp=this.action().pickup?this.hand.graspPoints:[]
    const points=grasp.length>=3?grasp:patch?.points
    const show=this.contactVisible&&!!points&&(grasp.length>=3||this.contactMode==='skin')
    this.marker.visible=this.contactVisible&&!show;this.footprint.visible=show
    if(!points||!show) return
    const position=this.footprint.geometry.getAttribute('position'),count=Math.min(64,points.length)
    for(let i=0;i<count;i++){const point=points[i];position.setXYZ(i,point.x,point.y+.0003,point.z)}
    position.needsUpdate=true;this.footprint.geometry.setDrawRange(0,count)
  }

  paint() {
    this.surfaceMode.value=this.sequence==='pour'?1:0
    // 无手小样用沙层法线和粒面明暗表现厚度，避免每帧重绘整张投影贴图。
    const shadows=!this.noHand
    if(this.renderer.shadowMap.enabled!==shadows) {
      this.renderer.shadowMap.enabled=shadows
      // Three.js 会缓存接收阴影的材质程序；切换时须去掉旧阴影采样，不能只关渲染开关。
      this.scene.traverse(object=>{if(object instanceof T.Mesh){const list=Array.isArray(object.material)?object.material:[object.material];list.forEach(material=>material.needsUpdate=true)}})
    }
    this.surfaceGrains.visible=this.sequence==='pour'
    this.sand.visible=this.sequence!=='photo';this.photoSurface.visible=this.sequence==='photo'
    if(this.photoSurface.visible)this.photoSurface.update()
    if(this.surfaceGrains.visible)this.surfaceGrains.update(this.renderer.domElement.height)
    this.held.update(this.hand.palmBed,this.sequence==='pickup'?this.driver.heldMass:0,W/(NX-1)*D/(NY-1),SAND_HEIGHT_SCALE)
    this.held.visible=this.held.visible&&this.hand.group.visible
    if(this.sand.visible) {
    const density = this.material.density, vertices = this.sand.geometry.getAttribute('position')
    for (let index = 0; index < density.length; index++) {
      const d = density[index], thickness = sandHeight(d)
      vertices.setY(index, thickness + .00002)
      const opacity = 1 - Math.exp(-d * 1.4)
      this.colors[index * 3] = this.base.r + (this.dark.r - this.base.r) * opacity
      this.colors[index * 3 + 1] = this.base.g + (this.dark.g - this.base.g) * opacity
      this.colors[index * 3 + 2] = this.base.b + (this.dark.b - this.base.b) * opacity
    }
    vertices.needsUpdate = true; this.sand.geometry.getAttribute('color').needsUpdate = true
    this.sand.geometry.computeVertexNormals()
    }
    const grains = this.sequence==='photo'?this.photo.material.airborne:this.material.airborne
    for (let index = 0; index < Math.min(grains.length, MAX_PARTICLES); index++) {
      const grain=grains[index]
      // 收沙近贴现有沙层移动；用同一密度的局部高度，避免颗粒沉在沙面里。
      const field=this.photo.material
      const view=this.sequence==='photo'&&this.photoArrangement==='performance'&&grain.collected?collectedGrainView(grain,field.width,field.height):grain
      const bed=this.sequence==='photo'&&grain.collected?sandHeight(field.density[Math.max(0,Math.min(field.height-1,Math.round(view.y*field.height)))*field.width+Math.max(0,Math.min(field.width-1,Math.round(view.x*field.width)))]):0
      this.positions[index * 3] = (view.x - .5) * W
      this.positions[index * 3 + 1] = grains[index].z * W + bed + .0003
      this.positions[index * 3 + 2] = (view.y - .5) * D
      this.airSeeds[index]='seed' in view?view.seed:(grains[index].mass*137.37)%1
    }
    this.airborne.geometry.getAttribute('position').needsUpdate = true
    this.airborne.geometry.getAttribute('seed').needsUpdate = true
    this.airborne.geometry.setDrawRange(0, Math.min(grains.length, MAX_PARTICLES))
  }

  render() {
    if(this.sequence==='photo') {
      const point=this.viewMode==='flow'?this.photo.anchor:this.photo.focalPoint
      const target=new T.Vector3(point.x,.002,point.z)
      setPhotoCamera(this.camera,this.viewMode,target,this.photoArrangement==='sculpt'||this.photoArrangement==='performance')
    }
    else if(this.sequence==='pour') {
      const action=this.action(),target=new T.Vector3(action.x,this.driver.surfaceAt(action.x,action.z)+.002,action.z)
      setPourCamera(this.camera,this.viewMode,target)
    }
    else if(this.viewMode==='close') {
      const target=this.hand.palmBed.centre
      this.camera.up.set(0,1,0);this.camera.position.copy(target).add(new T.Vector3(.025,.29,.22));this.camera.lookAt(target)
    }
    else if(this.viewMode==='flow') {
      const target=this.marker.position.clone().add(new T.Vector3(0,-.025,0))
      this.camera.up.set(0,1,0);this.camera.position.copy(target).add(new T.Vector3(.22,.12,-.09));this.camera.lookAt(target)
    }
    this.renderer.render(this.scene, this.camera)
  }

  private resize(canvas: HTMLCanvasElement) {
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight)
    this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix()
    this.airborne.material.uniforms.resolution.value = height * this.renderer.getPixelRatio()
    this.render()
  }

  dispose() {
    this.observer.disconnect()
    this.scene.remove(this.surfaceGrains);this.surfaceGrains.dispose()
    this.scene.remove(this.photoSurface);this.photoSurface.dispose()
    this.scene.traverse(object => { if (object instanceof T.Mesh || object instanceof T.Points || object instanceof T.Line) { object.geometry.dispose(); const list = Array.isArray(object.material) ? object.material : [object.material]; list.forEach(material => material.dispose()) } })
    const skin = (this.hand.mesh.material as T.MeshPhysicalMaterial).map; skin?.dispose()
    this.renderer.dispose()
  }
}
