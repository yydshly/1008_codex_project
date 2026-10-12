import {buildKeepsakePlan,type KeepsakeDraft,type KeepsakePlan} from './keepsake-model'

/** v33 只调整动作与供料，参考照片像素仍不进入沙层。 */
export function buildNaturalPlan(d:Pick<KeepsakeDraft,'shape'|'imageWidth'|'imageHeight'>):KeepsakePlan {
  const plan=buildKeepsakePlan(d)
  const actions=plan.actions.map((a,i)=>{
    const fine=a.name==='细撒杯口'||a.name==='弯撒杯把'||a.name==='落沙成碟'
    const path=a.path.map(p=>({...p}))
    if(i===1){
      // 绕过杯底后，整把余沙向杯身内侧铺开。只有两次宽幅运动，不逐行填色。
      const first=path[0],last=path.at(-1)!,cx=(first.x+last.x)*.5,w=last.x-first.x,
        h=Math.max(...path.map(p=>p.y))-last.y
      const b={x:cx+w*.32,y:last.y+h*.28},c={x:cx+w*.25,y:last.y+h*.64},end={x:cx,y:last.y+h*.62}
      for(let k=1;k<=48;k++){
        const t=k/48,u=1-t
        path.push({x:u*u*u*last.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*end.x,
          y:u*u*u*last.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*end.y})
      }
    }
    return {...a,path,
      radius:a.radius*(i===0?.85:i===1?.86:fine?.88:1),
      strength:a.strength*(i===0?.50:i===1?1.02:fine?1.03:.86),
      spread:i===0?.40:i===1?.14:fine?.07:a.spread,
      height:i===0?.095:i===1?.042:fine?.028:a.height}
  })
  return {...plan,actions}
}

/** 起落速度带停顿，起笔和收笔减速；不能靠格点顺序逐点显影。 */
export function naturalProgress(t:number,phase:number){
  const clamped=Math.max(0,Math.min(1,t))
  return clamped+.055*Math.sin(Math.PI*2*clamped+phase*.4)*Math.sin(Math.PI*clamped)**2
}
