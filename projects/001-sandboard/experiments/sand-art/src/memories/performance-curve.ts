import type {StagePoint} from '../stage/material'

const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
/** 离线沿影调等高线找连续动作；力度只存每个路径节点，运行时仍由撒/收沙改变材料。 */
export function performanceCurve(target:Float32Array,current:Float32Array,x:number,y:number,sigma:number,w:number,h:number){
  const read=(f:Float32Array,a:number,b:number)=>f[clamp(Math.round(b),0,h-1)*w+clamp(Math.round(a),0,w-1)]
  const smooth=(f:Float32Array,a:number,b:number)=>{
    let sum=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)sum+=read(f,a+dx*sigma*.45,b+dy*sigma*.45)*(dx?1:2)*(dy?1:2)
    return sum/16
  }
  const residue=(a:number,b:number)=>read(target,a,b)-smooth(current,a,b)
  const seed=residue(x,y),sign=Math.sign(seed),centre=read(target,x,y)
  const gradient=(a:number,b:number)=>[read(target,a+2,b)-read(target,a-2,b),read(target,a,b+2)-read(target,a,b-2)]
  const g=gradient(x,y),angle=Math.hypot(...g)>.012?Math.atan2(g[1],g[0])+Math.PI/2:.7+Math.sin(x*.017+y*.021)*.4
  const walk=(direction:number)=>{
    const points:StagePoint[]=[];let px=x,py=y,previous=angle
    const distance=Math.max(.9,sigma*.85)
    for(let n=0;n<28;n++){
      const [gx,gy]=gradient(px,py);let a=Math.hypot(gx,gy)>.012?Math.atan2(gy,gx)+Math.PI/2:previous
      if(Math.cos(a-previous)<0)a+=Math.PI
      a=previous+Math.atan2(Math.sin(a-previous),Math.cos(a-previous))*.32
      let chosen: {x:number,y:number,a:number,cost:number}|undefined
      for(const turn of [0,-.25,.25]){
        const heading=a+turn,nx=px+Math.cos(heading)*distance*direction,ny=py+Math.sin(heading)*distance*direction
        const error=residue(nx,ny)*sign,tone=read(target,nx,ny)
        if(nx<2||ny<2||nx>w-3||ny>h-3||error<Math.abs(seed)*.04||Math.abs(tone-centre)>.55)continue
        const cost=Math.abs(tone-read(target,px,py))+Math.abs(turn)*.055-Math.min(Math.abs(seed),error)*.15
        if(!chosen||cost<chosen.cost)chosen={x:nx,y:ny,a:heading,cost}
      }
      if(!chosen)break
      px=chosen.x;py=chosen.y;previous=chosen.a;points.push({x:px/w,y:py/h})
    }
    return points
  }
  const path=[...walk(-1).reverse(),{x:x/w,y:y/h},...walk(1)]
  const strength=path.map(p=>clamp(residue(p.x*w,p.y*h)*sign/Math.max(.02,Math.abs(seed)),.12,1.8))
  // 避免力度跟随单个像素抖动；首尾渐收由运行时包络处理。
  const pressure=strength.map((v,i)=>(strength[Math.max(0,i-1)]+2*v+strength[Math.min(strength.length-1,i+1)])/4)
  return {path,pressure}
}
