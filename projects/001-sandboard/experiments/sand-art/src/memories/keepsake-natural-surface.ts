import * as T from 'three'
import type {NaturalSand} from './keepsake-natural-sand'
import type {PhotoLighting} from './photo-surface'
import {TABLE_WIDTH as W,TABLE_DEPTH as D} from './contact-score'
import {SAND_HEIGHT_SCALE as H} from './contact-material'

/** v33 固定物理尺度的棱角沙粒。只读实沙厚度，没有成品纹理或显影蒙版。 */
export class NaturalSurface extends T.Mesh<T.PlaneGeometry,T.ShaderMaterial>{
  private readonly field:T.DataTexture
  constructor(sand:NaturalSand){
    const field=new T.DataTexture(sand.density,sand.width,sand.height,T.RedFormat,T.FloatType)
    field.minFilter=field.magFilter=T.NearestFilter;field.generateMipmaps=false;field.needsUpdate=true
    const read=`uniform sampler2D field;uniform vec2 grid;
      float density(vec2 uv){vec2 p=clamp(uv*(grid-1.),vec2(0.),grid-1.),a=floor(p),b=min(a+1.,grid-1.),f=fract(p);
        return max(0.,mix(mix(texture2D(field,(a+.5)/grid).r,texture2D(field,(vec2(b.x,a.y)+.5)/grid).r,f.x),
          mix(texture2D(field,(vec2(a.x,b.y)+.5)/grid).r,texture2D(field,(b+.5)/grid).r,f.x),f.y));}`
    const geometry=new T.PlaneGeometry(W,D,384,264);geometry.rotateX(-Math.PI/2)
    const material=new T.ShaderMaterial({uniforms:{field:{value:field},grid:{value:new T.Vector2(sand.width,sand.height)},raking:{value:0}},toneMapped:false,
      vertexShader:`${read} varying vec2 tableUV;void main(){tableUV=vec2(uv.x,1.-uv.y);vec3 p=position;p.y=density(tableUV)*${H}+.00004;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader:`${read} varying vec2 tableUV;uniform float raking;
        float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
        void main(){
          vec2 uv=tableUV;float d=density(uv);vec2 px=1./grid;
          float gx=density(uv+vec2(px.x,0.))-density(uv-vec2(px.x,0.));
          float gy=density(uv+vec2(0.,px.y))-density(uv-vec2(0.,px.y));
          vec2 p=uv*vec2(${W/.00043},${D/.00043}),cell=floor(p);
          float footprint=max(length(dFdx(p)),length(dFdy(p))),aa=max(.065,footprint*.34);
          float occupied=1.-exp(-d*2.5),grain=0.,facet=0.,edge=0.,variation=0.;
          for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
            vec2 id=cell+vec2(float(i),float(j));float seed=hash(id+7.3);
            vec2 center=id+vec2(.12+.76*hash(id+1.8),.12+.76*hash(id+2.6)),v=p-center;
            float angle=hash(id+11.8)*6.28318,c=cos(angle),s=sin(angle);v=mat2(c,-s,s,c)*v;
            float radius=mix(.26,.52,hash(id+13.4));vec2 q=v/vec2(radius,radius*mix(.58,1.,seed));
            // 不规则多面轮廓与细小阴影，不用一团圆形模糊灰点表示沙粒。
            float dist=max(abs(q.x)*.89+abs(q.y)*.35,max(abs(q.y)*.92+abs(q.x)*.24,length(q)*.78));
            float shape=1.-smoothstep(1.-aa,1.+aa,dist);
            float visibleGrain=smoothstep(seed-.055,seed+.055,occupied)*smoothstep(0.,.022,d);
            float g=shape*visibleGrain;grain+=g;edge+=g*smoothstep(.5,1.,dist);
            facet+=g*clamp(-q.x*.26-q.y*.42,-.6,.6);variation+=g*(hash(id+22.)-.5);
          }
          grain=clamp(grain,0.,1.);float textureVisibility=1.-smoothstep(1.5,3.0,footprint);
          // 薄处显示透光粒间空隙；厚处按沙量吸光，仍保留顶部颗粒。
          float bulk=exp(-d*1.58),sparse=exp(-d*1.35)*textureVisibility;
          float transmission=mix(bulk,1.-grain*.91,sparse*.87);
          vec3 glass=vec3(.965,.916,.815),sand=vec3(.175,.112,.069);
          float lamp=1.-.08*dot(uv-.5,uv-.5);
          vec3 base=mix(sand,glass,transmission)*lamp;
          float body=1.-bulk;
          // 厚堆透光接近零，但顶部沙粒仍反射环境光；避免黑色光滑墨块。
          float thick=smoothstep(1.8,5.,d);
          vec3 dryTop=mix(vec3(.17,.105,.060),vec3(.29,.21,.13),hash(cell+19.2));
          dryTop+=vec3(facet*.09-edge*.025);
          base=mix(base,dryTop,thick*textureVisibility*.82);
          vec3 normal=normalize(vec3(-gx*${H}*grid.x/${2*W},1.,-gy*${H}*grid.y/${2*D}));
          float grazing=dot(normal,normalize(vec3(-.62,.60,-.5)));
          base+=textureVisibility*vec3(facet*.055-edge*.032+variation*.032)*max(body,grain*.45);
          // 沙堆前缘有接触遮蔽，侧光观察不会改变材料本身。
          float ridge=clamp(max(0.,gx+gy)*.22,0.,.13)*body;
          base-=ridge*(.38+raking*.62);
          base*=1.+raking*clamp(grazing-.60,-.28,.24)*body*.75;
          gl_FragColor=vec4(clamp(base,0.,1.),1.);
        }`})
    super(geometry,material);this.field=field;this.frustumCulled=false
  }
  update(){this.field.needsUpdate=true}
  lighting(mode:PhotoLighting){this.material.uniforms.raking.value=mode==='raking'?1:0}
  dispose(){this.field.dispose();this.geometry.dispose();this.material.dispose()}
}
