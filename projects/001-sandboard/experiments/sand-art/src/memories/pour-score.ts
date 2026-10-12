import { CONTACT_DT, type ContactAction } from './contact-score'

export const POUR_TICKS = 720
export const POUR_HEIGHT = .29
const smooth = (value: number) => { const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t) }
const gate = (u: number) => smooth(u*15)*smooth((1-u)*15)

/** 原创无手落沙小样。曲线只规定撒沙口轨迹，没有目标灰度、显影遮罩或移沙动作。 */
export function pourAction(tick: number): ContactAction {
  const t=Math.max(0,Math.min(POUR_TICKS,tick))*CONTACT_DT
  const base:ContactAction={time:t,grip:0,pressure:0,wristTilt:0,wristRoll:0,pose:'pinch',nextPose:'pinch',blend:0,
    x:-.065,z:.13,elevation:POUR_HEIGHT,yaw:0,flow:0,touching:false,label:'空台 · 等待第一缕沙',flowSpread:.075,flowRadius:.0012,flowCluster:.25,flowInertia:.1,continuousEmission:true}
  if(t>=.65&&t<4.15){
    const u=(t-.65)/3.5
    return {...base,x:-.065+.042*u+.016*Math.sin(u*Math.PI),z:.13-.245*u,
      flow:.40*(1-.45*u)*gate(u)*(.87+.13*Math.sin(t*11)),label:'细流落沙 · 一笔主干'}
  }
  if(t>=4.45&&t<7.25){
    const u=(t-4.45)/2.8
    return {...base,x:-.03+.115*u-.025*Math.sin(u*Math.PI),z:.13-.205*u,
      flow:.36*(1-.45*u)*gate(u)*(.89+.11*Math.sin(t*13.7)),label:'第二笔 · 随风弯曲'}
  }
  if(t>=7.55&&t<10.45){
    // 两个穗部，各由连续的短弧构成；换穗先关沙，再移动撒沙口。
    const group=t<8.95?0:1,start=group===0?7.55:9.05
    if(t<start)return {...base,x:.085,z:-.075,label:'收沙 · 移到另一穗'}
    const u=Math.min(.999999,(t-start)/1.4)
    const bx=group===0?-.023:.085,bz=group===0?-.115:-.075
    // 连续往返的短弧，端点不瞬移，避免每笔重启把沙甩到两侧形成空心环。
    return {...base,x:bx+.008*Math.sin(u*Math.PI)*Math.sin(u*16*Math.PI),z:bz+.026-.048*u,
      flow:.48*gate(u)*(.65+.35*Math.sin(t*19)**2),flowSpread:.18,flowCluster:.55,label:'短弧聚沙 · 留出穗部纹理'}
  }
  if(t>=10.45)return {...base,x:.085,z:-.075,label:'停止供沙 · 余沙落定'}
  return {...base,x:t<4.45?-.023:.085,z:t<4.45?-.115:-.075,label:t<.65?base.label:'关沙换笔 · 保留落沙间隙'}
}
