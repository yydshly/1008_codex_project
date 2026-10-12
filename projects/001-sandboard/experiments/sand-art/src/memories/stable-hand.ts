import { clampUnit, type HandPoint } from './generated-hand'

const smooth = (n:number) => {const t=clampUnit(n);return t*t*(3-2*t)}
/** 坐标以源图宽度归一化（源图高为 1.5）；仅做小幅捻指，不拉伸前臂。 */
export function articulateHand(p:HandPoint,opening:number):HandPoint {
  const phase=clampUnit(opening)
  const weight=smooth((.45-p.x)/.08)*smooth((p.y-.17)/.05)*(1-smooth((p.y-.48)/.09))
  const angle=(.032-phase*.107)*weight,dx=p.x-.405,dy=p.y-.485
  const indexWeight=smooth((p.x-.38)/.06)*(1-smooth((p.y-.32)/.11))*smooth((p.y-.11)/.04)
  return {x:.405+dx*Math.cos(angle)-dy*Math.sin(angle)+.006*phase*indexWeight,
    y:.485+dx*Math.sin(angle)+dy*Math.cos(angle)-.003*phase*indexWeight}
}
/** 出沙点位于拇指与食指形成的透明指缝，随同一个变形移动。 */
export function stableRelease(opening:number):HandPoint {
  const p={x:.365,y:.224},q=articulateHand(p,opening)
  return {x:(p.x+q.x)*.5,y:(p.y+q.y)*.5}
}
export const stableVertices:HandPoint[]=[]
export const stableTriangles:number[]=[]
const columns=40,rows=60
for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++)stableVertices.push({x:col/columns,y:row/rows*1.5})
for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const a=row*(columns+1)+col,b=a+1,c=a+columns+1,d=c+1
  stableTriangles.push(a,b,c,b,d,c)
}
const vertex=`#version 300 es
in vec2 position;in vec2 uv;out vec2 tex;
void main(){tex=uv;gl_Position=vec4(position.x*2.-1.,1.-position.y/1.5*2.,0,1);}`
const fragment=`#version 300 es
precision highp float;uniform sampler2D source;in vec2 tex;out vec4 color;
void main(){vec4 c=texture(source,tex);c.a*=smoothstep(.035,.12,c.a);color=vec4(c.rgb*c.a,c.a);}`

/** 单张连续皮肤纹理 + 局部指节变形，避免跨素材溶解重影。不是三维手模型。 */
export class StableHand {
  readonly canvas=document.createElement('canvas')
  private gl:WebGL2RenderingContext|null
  private program:WebGLProgram|undefined
  private buffer:WebGLBuffer|undefined
  private texture:WebGLTexture|undefined
  private last=-1
  private lost=false
  private readonly vertices=new Float32Array(stableTriangles.length*4)
  private readonly image:HTMLImageElement
  get morphAvailable(){return !!this.gl&&!this.lost}
  private constructor(image:HTMLImageElement){
    this.image=image
    this.canvas.width=768;this.canvas.height=1152
    this.gl=this.canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:true})
    if(!this.gl)return
    const gl=this.gl
    try{
      const compile=(type:number,code:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('手部着色器初始化失败')}return s}
      const v=compile(gl.VERTEX_SHADER,vertex),f=compile(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram()!
      gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f)
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);throw new Error('手部过渡初始化失败')}
      this.program=program;this.buffer=gl.createBuffer()!;this.texture=gl.createTexture()!
      gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer)
      for(const [name,offset] of [['position',0],['uv',8]] as const){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset)}
      gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false)
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image)
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
      gl.uniform1i(gl.getUniformLocation(program,'source'),0)
    }catch{this.dispose()}
    this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.lost=true;this.last=-1})
  }
  static async load(url:string){
    const image=new Image()
    await new Promise<void>((resolve,reject)=>{
      const timer=window.setTimeout(()=>{image.onload=null;image.onerror=null;reject(new Error('手部素材载入超时，请重试。'))},15000)
      image.onload=()=>{clearTimeout(timer);resolve()};image.onerror=()=>{clearTimeout(timer);reject(new Error('手部素材载入失败，请重试。'))};image.src=url
    })
    if(image.naturalWidth!==1024||image.naturalHeight!==1536)throw new Error('手部素材尺寸不匹配。')
    return new StableHand(image)
  }
  draw(ctx:CanvasRenderingContext2D,opening:number,x:number,y:number,size:number,angle:number,lift:number){
    const phase=clampUnit(opening),anchor=this.morphAvailable?stableRelease(phase):stableRelease(.3)
    if(this.morphAvailable&&phase!==this.last){
      let offset=0
      for(const index of stableTriangles){const p=stableVertices[index],q=articulateHand(p,phase);this.vertices.set([q.x,q.y,p.x,p.y/1.5],offset);offset+=4}
      const gl=this.gl!;gl.useProgram(this.program!);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer!);gl.bufferData(gl.ARRAY_BUFFER,this.vertices,gl.DYNAMIC_DRAW)
      gl.bindTexture(gl.TEXTURE_2D,this.texture!);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,stableTriangles.length)
      this.last=phase
    }
    ctx.save();ctx.translate(x,y);ctx.rotate(angle)
    // 光源固定在左上；抬高手时影子更远、更软，前臂与掌指使用同一张纹理。
    ctx.shadowColor=`rgba(64,40,20,${.17-lift*.07})`;ctx.shadowBlur=3+lift*26;ctx.shadowOffsetX=2+lift*9;ctx.shadowOffsetY=3+lift*16
    ctx.drawImage(this.morphAvailable?this.canvas:this.image,-anchor.x*size,-anchor.y*size,size,size*1.5)
    ctx.restore()
  }
  dispose(){if(this.gl){this.gl.deleteBuffer(this.buffer??null);this.gl.deleteTexture(this.texture??null);this.gl.deleteProgram(this.program??null);this.gl.getExtension('WEBGL_lose_context')?.loseContext();this.gl=null}}
}
