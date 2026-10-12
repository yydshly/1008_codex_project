import type { StageMaterialSnapshot } from '../stage/material'
import { moods, type PhotoSettings } from './model'

/** Display-only grain geometry. The material field, supplied mass and replay are never changed. */
const vertex = `#version 300 es
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}`
const fragment = `#version 300 es
precision highp float;
uniform sampler2D field;
uniform vec2 grid, outputSize;
uniform vec3 paper, sand;
uniform float grain;
out vec4 color;
float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float density(vec2 uv){
  vec2 p=clamp(uv*grid-.5,vec2(0),grid-1.),f=fract(p);ivec2 a=ivec2(floor(p)),b=min(a+ivec2(1),ivec2(grid)-1);
  return max(0.,mix(mix(texelFetch(field,a,0).r,texelFetch(field,ivec2(b.x,a.y),0).r,f.x),mix(texelFetch(field,ivec2(a.x,b.y),0).r,texelFetch(field,b,0).r,f.x),f.y));
}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
  vec2 uv=vec2(gl_FragCoord.x/outputSize.x,1.-gl_FragCoord.y/outputSize.y);
  float d=density(uv);
  vec2 dx=vec2(1./grid.x,0),dy=vec2(0,1./grid.y);
  float gx=density(uv+dx)-density(uv-dx),gy=density(uv+dy)-density(uv-dy);
  // A grain is an irregular lens with a darker rim and a small reflected highlight.
  // Its position and size stay fixed in table coordinates, including when seeking/replaying.
  vec2 p=uv*grid*1.48,cell=floor(p); float grains=0.,rim=0.,shine=0.;
  float clump=mix(.84,1.16,noise(uv*grid*.12));
  float coverage=1.-exp(-d*2.8);
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
    vec2 id=cell+vec2(i,j);float r=hash(id+17.2);
    vec2 center=id+vec2(.15+.7*hash(id+1.7),.15+.7*hash(id+9.3));
    vec2 v=p-center;
    float angle=hash(id+2.1)*6.28318,cs=cos(angle),sn=sin(angle);
    v=mat2(cs,-sn,sn,cs)*v;
    float radius=mix(.15,.44,hash(id+4.7));
    float dist=length(v/vec2(radius,radius*mix(.55,1.,hash(id+6.4))));
    float aa=max(.09,grid.x/outputSize.x*.72);
    float shape=1.-smoothstep(1.-aa,1.+aa,dist);
    float occupied=smoothstep(r-.06,r+.06,coverage*clump)*smoothstep(0.,.035,d);
    float g=shape*occupied;
    grains+=g;rim+=g*smoothstep(.55,1.,dist);
    shine+=g*max(0.,1.-length((v-vec2(-radius*.23,-radius*.29))/(radius*.36)));
  }
  float textureStrength=min(.9,grain*1.35);
  // Break up continuous midtones into packed grains while retaining mean thickness.
  float grainDensity=d*max(.2,1.+textureStrength*(grains-.24*coverage*clump)*2.2);
  float light=exp(-grainDensity*1.35);
  float lamp=1.-.045*dot(uv-.5,uv-.5)*2.;
  vec3 base=mix(sand,paper,light)*lamp;
  float edge=clamp((-gx*.7-gy*.5)*.055,-.025,.025);
  // Grain roughness and thickness gradients share one fixed upper-left light source.
  base+=vec3(edge*85.-rim*grain*6.+shine*grain*13.);
  color=vec4(clamp(base/255.,0.,1.),1.);
}`

export class GranularSandRenderer {
  readonly canvas = document.createElement('canvas')
  private readonly gl: WebGL2RenderingContext
  private readonly program: WebGLProgram
  private readonly texture: WebGLTexture
  private textureWidth = 0
  private textureHeight = 0

  constructor() {
    const gl = this.canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true })
    if (!gl) throw new Error('此浏览器未提供 WebGL 2 颗粒渲染。')
    this.gl = gl
    const compile = (kind: number, source: string) => {
      const shader = gl.createShader(kind)!
      gl.shaderSource(shader, source); gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const reason = gl.getShaderInfoLog(shader); gl.deleteShader(shader)
        throw new Error('颗粒着色器编译失败：' + reason)
      }
      return shader
    }
    const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment)
    const program = gl.createProgram()!
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program)
    gl.deleteShader(vs); gl.deleteShader(fs)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('颗粒渲染初始化失败。')
    this.program = program; this.texture = gl.createTexture()!
    gl.useProgram(program); gl.bindTexture(gl.TEXTURE_2D, this.texture)
    // R32F interpolation is done explicitly below: float texture filtering varies by device.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  draw(target: HTMLCanvasElement, state: StageMaterialSnapshot, settings: PhotoSettings) {
    const gl = this.gl
    if (gl.isContextLost()) throw new Error('颗粒渲染上下文已丢失，请切换到原影调。')
    if (this.canvas.width !== target.width || this.canvas.height !== target.height) {
      this.canvas.width = target.width; this.canvas.height = target.height
    }
    gl.viewport(0, 0, target.width, target.height); gl.useProgram(this.program)
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    if (this.textureWidth !== state.width || this.textureHeight !== state.height) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, state.width, state.height, 0, gl.RED, gl.FLOAT, state.density)
      this.textureWidth = state.width; this.textureHeight = state.height
    } else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, state.width, state.height, gl.RED, gl.FLOAT, state.density)
    const uniform = (name: string) => gl.getUniformLocation(this.program, name)
    gl.uniform1i(uniform('field'), 0); gl.uniform2f(uniform('grid'), state.width, state.height)
    gl.uniform2f(uniform('outputSize'), target.width, target.height)
    gl.uniform3fv(uniform('paper'), moods[settings.mood].paper)
    gl.uniform3fv(uniform('sand'), moods[settings.mood].sand)
    gl.uniform1f(uniform('grain'), settings.grain)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    const ctx = target.getContext('2d')!
    ctx.clearRect(0, 0, target.width, target.height); ctx.drawImage(this.canvas, 0, 0)
  }
}
