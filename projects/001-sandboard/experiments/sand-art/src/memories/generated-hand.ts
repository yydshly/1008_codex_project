/** 原创二维关键姿态过渡；素材由 imagegen 生成，不是实拍或三维手模型。 */
export interface HandPoint { x: number; y: number }
const points = (pairs: number[][]): HandPoint[] => pairs.map(([x, y]) => ({ x: x / 512, y: y / 512 }))
// 同一图集的拇指、指节、掌缘、腕部标定。用于邻帧形状对齐，不作解剖重建。
const landmarks = [
  [[211,77],[210,195],[245,62],[257,136],[295,94],[335,138],[368,174],[201,239],[391,223],[254,318],[364,322],[254,494],[398,494]],
  [[176,80],[180,196],[238,72],[252,138],[284,93],[332,143],[364,171],[212,246],[375,245],[246,322],[354,330],[246,494],[380,494]],
  [[149,91],[166,205],[197,58],[229,137],[245,73],[285,136],[343,172],[209,249],[368,223],[240,313],[354,321],[245,494],[366,494]],
  [[164,91],[191,206],[201,62],[241,136],[244,51],[290,74],[336,137],[211,248],[369,243],[236,325],[348,323],[247,494],[371,494]],
  [[157,93],[183,205],[196,65],[232,137],[238,56],[286,80],[337,140],[205,250],[372,252],[234,328],[347,325],[245,494],[371,494]],
  [[155,92],[181,204],[192,63],[229,134],[237,52],[284,74],[335,136],[201,247],[367,244],[232,322],[345,319],[240,494],[367,494]],
].map(points)
const releases = points([[226,139],[218,148],[201,149],[221,153],[214,153],[212,150]])
export const clampUnit = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0))
export function handPose(opening: number) {
  const value = clampUnit(opening) * 5, a = Math.min(4, Math.floor(value))
  return { a, b: a + 1, mix: value - a }
}
export function releaseAnchor(opening: number): HandPoint {
  const { a, b, mix } = handPose(opening)
  return { x: releases[a].x * (1 - mix) + releases[b].x * mix, y: releases[a].y * (1 - mix) + releases[b].y * mix }
}
function warped(p: HandPoint, pose: number): HandPoint {
  let x = 0, y = 0, total = .045
  for (let i = 0; i < landmarks[0].length; i++) {
    const origin = landmarks[0][i], target = landmarks[pose][i]
    const weight = Math.exp(-((p.x-origin.x)**2+(p.y-origin.y)**2)/.023)
    x += (target.x-origin.x)*weight; y += (target.y-origin.y)*weight; total += weight
  }
  // 图集边缘固定，腕部的截断面保持在画布下方。
  const edge = Math.min(1, Math.min(p.x,1-p.x,p.y,1-p.y)*12)
  return { x:p.x+x/total*edge, y:p.y+y/total*edge }
}
export const meshPoints: HandPoint[] = []
export const meshTriangles: number[] = []
const columns=18, rows=20
for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++)meshPoints.push({x:column/columns,y:row/rows})
for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
  const a=row*(columns+1)+column,b=a+1,c=a+columns+1,d=c+1
  meshTriangles.push(a,b,c,b,d,c)
}
export const poseMeshes = landmarks.map((_,pose)=>meshPoints.map(p=>warped(p,pose)))

const vertex = `#version 300 es
in vec2 position; in vec2 uvA; in vec2 uvB;
out vec2 texA; out vec2 texB;
void main(){texA=uvA;texB=uvB;
  // 仅延展腕部以下的前臂，掌指比例保持；前臂连接台沿而非悬空截断。
  float y=position.y>0.64?0.64+(position.y-0.64)*4.0:position.y;
  gl_Position=vec4(position.x*2.0-1.0,1.0-y,0.0,1.0);}`
const fragment = `#version 300 es
precision highp float;
uniform sampler2D atlas; uniform float phase;
in vec2 texA; in vec2 texB; out vec4 color;
void main(){
  vec4 a=texture(atlas,texA),b=texture(atlas,texB);
  // 在对应形状上混合预乘颜色，避免透明边缘出现黑色光晕。
  color=mix(vec4(a.rgb*a.a,a.a),vec4(b.rgb*b.a,b.a),phase);
}`

export class GeneratedHand {
  readonly canvas = document.createElement('canvas')
  readonly image: HTMLImageElement
  private gl: WebGL2RenderingContext|null
  private program: WebGLProgram|undefined
  private buffer: WebGLBuffer|undefined
  private texture: WebGLTexture|undefined
  private last = -1
  private lost = false
  get morphAvailable(){return !!this.gl&&!this.lost}
  private constructor(image: HTMLImageElement) {
    this.image=image;this.canvas.width=512;this.canvas.height=1024
    this.gl=this.canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:true})
    if(!this.gl)return
    const gl=this.gl
    const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('手部过渡着色器初始化失败。');return shader}
    const v=compile(gl.VERTEX_SHADER,vertex),f=compile(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram()!
    gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f)
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('手部过渡初始化失败。')
    this.program=program;this.buffer=gl.createBuffer()!;this.texture=gl.createTexture()!
    gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer)
    for(const [name,offset] of [['position',0],['uvA',8],['uvB',16]] as const){const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,24,offset)}
    gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false)
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
    gl.uniform1i(gl.getUniformLocation(program,'atlas'),0)
    this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.lost=true;this.last=-1})
  }
  static async load(url:string) {
    const image=new Image()
    await new Promise<void>((resolve,reject)=>{
      const timer=window.setTimeout(()=>{image.onload=null;image.onerror=null;reject(new Error('手部素材载入超时，请重试。'))},15000)
      image.onload=()=>{clearTimeout(timer);resolve()};image.onerror=()=>{clearTimeout(timer);reject(new Error('手部素材未能载入，请重试。'))};image.src=url
    })
    if(image.naturalWidth!==1536||image.naturalHeight!==1024)throw new Error('手部图集尺寸不匹配。')
    return new GeneratedHand(image)
  }
  draw(ctx:CanvasRenderingContext2D,opening:number,x:number,y:number,size:number,angle:number,lift:number) {
    const phase=clampUnit(opening),anchor=releaseAnchor(phase)
    if(this.morphAvailable&&phase!==this.last){
      const gl=this.gl!,{a,b,mix}=handPose(phase),data=new Float32Array(meshTriangles.length*6)
      let offset=0
      for(const index of meshTriangles){
        const p=poseMeshes[a][index],q=poseMeshes[b][index]
        data.set([p.x*(1-mix)+q.x*mix,p.y*(1-mix)+q.y*mix,(a%3+p.x)/3,(Math.floor(a/3)+p.y)/2,(b%3+q.x)/3,(Math.floor(b/3)+q.y)/2],offset);offset+=6
      }
      gl.useProgram(this.program!);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer!);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW)
      gl.bindTexture(gl.TEXTURE_2D,this.texture!);gl.uniform1f(gl.getUniformLocation(this.program!,'phase'),mix)
      gl.viewport(0,0,512,1024);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,meshTriangles.length)
      this.last=phase
    }
    ctx.save();ctx.translate(x,y);ctx.rotate(angle)
    ctx.shadowColor=`rgba(54,33,15,${.10-lift*.025})`;ctx.shadowBlur=4+lift*22;ctx.shadowOffsetX=3+lift*7;ctx.shadowOffsetY=5+lift*11
    if(this.morphAvailable)ctx.drawImage(this.canvas,-anchor.x*size,-anchor.y*size,size,size*2)
    else {const frame=Math.round(phase*5),sx=frame%3*512,sy=Math.floor(frame/3)*512
      ctx.drawImage(this.image,sx,sy,512,328,-anchor.x*size,-anchor.y*size,size,size*.64)
      ctx.drawImage(this.image,sx,sy+328,512,184,-anchor.x*size,(.64-anchor.y)*size,size,size*1.4375)
    }
    ctx.restore()
  }
  dispose(){if(this.gl){this.gl.deleteBuffer(this.buffer??null);this.gl.deleteTexture(this.texture??null);this.gl.deleteProgram(this.program??null);this.gl.getExtension('WEBGL_lose_context')?.loseContext();this.gl=null}}
}
