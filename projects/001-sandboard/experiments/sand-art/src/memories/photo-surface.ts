import * as T from 'three'
import type { StageMaterial } from '../stage/material'
import { TABLE_WIDTH as W, TABLE_DEPTH as D } from './contact-score'
import { SAND_HEIGHT_SCALE } from './contact-material'
export type PhotoLighting='transmitted'|'raking'

/** 同一份 768×512 材料的透光与颗粒；不接收原照片、成品贴图或显影遮罩。 */
export class PhotoSurface extends T.Mesh<T.PlaneGeometry,T.ShaderMaterial> {
  private readonly field:T.DataTexture
  constructor(sand:StageMaterial,profile:'flow'|'sculpt'='flow') {
    const sculpt=profile==='sculpt',grainSize=sculpt?.00036:.00048
    const field=new T.DataTexture(sand.density,sand.width,sand.height,T.RedFormat,T.FloatType)
    field.minFilter=field.magFilter=T.NearestFilter;field.generateMipmaps=false;field.needsUpdate=true
    const read=`uniform sampler2D field;uniform vec2 grid;
      float density(vec2 uv){
        vec2 p=clamp(uv*(grid-1.),vec2(0.),grid-1.),a=floor(p),b=min(a+1.,grid-1.),f=fract(p);
        return max(0.,mix(mix(texture2D(field,(a+.5)/grid).r,texture2D(field,(vec2(b.x,a.y)+.5)/grid).r,f.x),
          mix(texture2D(field,(vec2(a.x,b.y)+.5)/grid).r,texture2D(field,(b+.5)/grid).r,f.x),f.y));
      }`
    const geometry=new T.PlaneGeometry(W,D,sculpt?256:160,sculpt?176:112);geometry.rotateX(-Math.PI/2)
    const material=new T.ShaderMaterial({uniforms:{field:{value:field},grid:{value:new T.Vector2(sand.width,sand.height)},raking:{value:0}},toneMapped:false,
      vertexShader:`${read} varying vec2 tableUV;void main(){tableUV=vec2(uv.x,1.-uv.y);
        vec3 p=position;p.y=density(tableUV)*${SAND_HEIGHT_SCALE}+.00004;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader:`${read} varying vec2 tableUV;uniform float raking;
        float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
        void main(){
          vec2 uv=tableUV;float d=density(uv);vec2 dx=vec2(1./grid.x,0.),dy=vec2(0.,1./grid.y);
          float gx=density(uv+dx)-density(uv-dx),gy=density(uv+dy)-density(uv-dy);
          // 固定在米制台面上的细粒，尺寸不随密度网格或镜头缩放改变。
          vec2 p=uv*vec2(${W/grainSize},${D/grainSize}),cell=floor(p);float grains=0.,rim=0.,shine=0.,grainSlope=0.;
          float clump=mix(.82,1.18,noise(p*.065)),coverage=1.-exp(-d*2.8);
          float footprint=max(length(dFdx(p)),length(dFdy(p)));
          float resolved=1.-smoothstep(.85,1.9,footprint),aa=max(.055,footprint*.42);
          for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
            vec2 id=cell+vec2(float(i),float(j));float r=hash(id+17.2);
            vec2 center=id+vec2(.15+.7*hash(id+1.7),.15+.7*hash(id+9.3)),v=p-center;
            float angle=hash(id+2.1)*6.28318,cs=cos(angle),sn=sin(angle);v=mat2(cs,-sn,sn,cs)*v;
            float radius=mix(.15,.44,hash(id+4.7)),dist=length(v/vec2(radius,radius*mix(.55,1.,hash(id+6.4))));
            float shape=1.-smoothstep(1.-aa,1.+aa,dist),occupied=smoothstep(r-.06,r+.06,coverage*clump)*smoothstep(0.,.035,d);
            float g=shape*occupied;grains+=g;rim+=g*smoothstep(.55,1.,dist);
            shine+=g*max(0.,1.-length((v-vec2(-radius*.23,-radius*.29))/(radius*.36)));
            grainSlope+=g*clamp((-v.x*.5-v.y*.65)/radius,-.7,.7);
          }
          // 远景保留连续明暗；近景才解析颗粒，避免整幅画被噪点加暗。
          float texture=clamp(grains-.24*coverage*clump,-.4,1.);
          float grainDensity=d*max(.45,1.+resolved*${sculpt?.18:.32}*texture);
          float light=exp(-grainDensity*1.35),lamp=1.-.045*dot(uv-.5,uv-.5)*2.;
          vec3 bright=vec3(250.,239.,216.),dark=vec3(54.,35.,23.);
          vec3 base=mix(dark,bright,light)*lamp;
          vec3 normal=normalize(vec3(-gx*${SAND_HEIGHT_SCALE}*grid.x/${2*W},1.,-gy*${SAND_HEIGHT_SCALE}*grid.y/${2*D}));
          float grazing=dot(normal,normalize(vec3(-.7,.48,-.5)));
          float body=1.-light;
          vec3 side=mix(bright*.94,dark*1.28,body)*(1.+clamp(grazing-.487,-.3,.3)*body*.75);
          side+=vec3(resolved*(grainSlope*15.-rim*9.+shine*10.)*body);
          base+=vec3(resolved*(grainSlope*3.-rim*2.+shine*4.)*body);
          base=mix(base,side,raking);
          gl_FragColor=vec4(clamp(base/255.,0.,1.),1.);
        }`})
    super(geometry,material);this.field=field;this.frustumCulled=false
  }
  update(){this.field.needsUpdate=true}
  lighting(mode:PhotoLighting){this.material.uniforms.raking.value=mode==='raking'?1:0}
  dispose(){this.field.dispose();this.geometry.dispose();this.material.dispose()}
}
