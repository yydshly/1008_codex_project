import * as T from 'three'
import { CONTACT_WIDTH as NX, CONTACT_HEIGHT as NY, SAND_HEIGHT_SCALE } from './contact-material'
import { TABLE_WIDTH as W, TABLE_DEPTH as D } from './contact-score'

/** 稳定的表面颗粒采样：只读取现有密度，不参与材料质量或改变落点。 */
export class SurfaceGrains extends T.Points<T.BufferGeometry,T.ShaderMaterial> {
  private readonly densityTexture:T.DataTexture
  constructor(field:Float32Array) {
    const texture=new T.DataTexture(field,NX,NY,T.RedFormat,T.FloatType)
    texture.minFilter=texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true
    const count=48000,position=new Float32Array(count*3),seed=new Float32Array(count)
    let random=0x2468ace
    const next=()=>{random^=random<<13;random^=random>>>17;random^=random<<5;return (random>>>0)/4294967296}
    for(let i=0;i<count;i++){position[i*3]=(next()-.5)*W;position[i*3+2]=(next()-.5)*D;seed[i]=next()}
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(position,3));geometry.setAttribute('seed',new T.BufferAttribute(seed,1))
    const material=new T.ShaderMaterial({uniforms:{density:{value:texture},resolution:{value:800}},transparent:true,depthWrite:false,
      vertexShader:`uniform sampler2D density;uniform float resolution;attribute float seed;varying float vSeed;varying float vVisible;
      void main(){vec2 uv=(position.xz/vec2(${W},${D})+0.5)*vec2(${(NX-1)/NX},${(NY-1)/NY})+vec2(${.5/NX},${.5/NY});
        float d=texture2D(density,uv).r;vSeed=seed;vVisible=step(seed,1.0-exp(-d*0.8))*step(0.003,d);
        if(vVisible<.5){gl_Position=vec4(2.0,2.0,2.0,1.0);gl_PointSize=0.0;return;}
        vec3 point=position;point.y=d*${SAND_HEIGHT_SCALE}+.00015+seed*.00012;
        vec4 p=modelViewMatrix*vec4(point,1.0);gl_Position=projectionMatrix*p;
        gl_PointSize=clamp(resolution*(.00035+seed*.00023)/max(.08,-p.z),1.1,6.0);}
      `,
      fragmentShader:`varying float vSeed;varying float vVisible;void main(){
        if(vVisible<.5)discard;vec2 q=(gl_PointCoord-.5)*2.0;float r=dot(q,q);if(r>1.0)discard;
        float dome=sqrt(max(0.0,1.0-r));float light=.55+.45*max(0.0,dot(normalize(vec3(q.x,-q.y,dome)),normalize(vec3(-.45,.65,.6))));
        vec3 grain=mix(vec3(.19,.115,.055),vec3(.62,.43,.23),vSeed)*light;
        gl_FragColor=vec4(grain,(1.0-smoothstep(.7,1.0,r))*.84);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`})
    super(geometry,material);this.densityTexture=texture;this.frustumCulled=false;this.renderOrder=1
  }
  update(resolution:number) {this.densityTexture.needsUpdate=true;this.material.uniforms.resolution.value=resolution}
  dispose() {this.densityTexture.dispose();this.geometry.dispose();this.material.dispose()}
}
