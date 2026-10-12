import { CONTACT_DT, type ContactAction } from './contact-score'

export const PICKUP_TICKS = 1440
export const PILE_X = -.125, PILE_Z = -.035
const smooth = (t: number) => { const u=Math.max(0,Math.min(1,t));return u*u*(3-2*u) }

/** 动作只控制手；取到多少沙由当前台面与蒙皮接触决定。 */
export function pickupAction(tick: number): ContactAction {
  const t=Math.max(0,Math.min(PICKUP_TICKS,tick))*CONTACT_DT
  const base:ContactAction={time:t,grip:.08,pressure:0,wristTilt:0,wristRoll:0,pose:'scoop',nextPose:'scoop',blend:0,
    x:PILE_X,z:PILE_Z,elevation:0,yaw:0,flow:0,touching:false,label:'张指靠近沙堆',pickup:0,palmTurn:0}
  if(t<1.4) {const u=smooth(t/1.4);return {...base,x:PILE_X-.025*u,z:PILE_Z-.018*u,elevation:.12*(1-u)} }
  if(t<4) { const u=smooth((t-1.4)/2.6);return {...base,grip:.08+.88*u,x:PILE_X-.025+.05*u,z:PILE_Z-.018+.03*u,touching:true,pickup:1,label:'指腹收拢 · 从台上取沙'} }
  if(t<5.5) { const u=smooth((t-4)/1.5);return {...base,grip:.96-.28*u,x:PILE_X+.025+.036*u,z:PILE_Z+.012,elevation:.11*u,palmTurn:Math.PI*u,wristTilt:.28*u,label:'收指抬起 · 翻掌握持'} }
  if(t<7.5) return {...base,grip:.68,x:PILE_X+.061,z:PILE_Z+.012,elevation:.11,palmTurn:Math.PI,wristTilt:.28+.015*Math.sin((t-5.5)*Math.PI),label:'掌内握持 · 看这一把沙'}
  if(t<8.5) {const u=smooth(t-7.5);return {...base,grip:.68+.26*u,pose:'scoop',nextPose:'pinch',blend:u,x:PILE_X+.061,z:PILE_Z+.012+.055*u,elevation:.11-.045*u,palmTurn:Math.PI*(1-u),wristTilt:.28*(1-u),label:'转腕 · 准备松指'} }
  if(t<12.5) {const u=(t-8.5)/4,flow=.32*smooth(u*10)*smooth((1-u)*10)*(.87+.13*Math.sin(t*5.2));return {...base,pose:'pinch',nextPose:'pinch',grip:.94-.27*flow/.32,x:-.064+.16*smooth(u),z:.032-.04*smooth(u),elevation:.065,flow,label:'松指细漏 · 掌内沙量减少'} }
  if(t<13.5) {const u=smooth(t-12.5);return {...base,pose:'pinch',nextPose:'scatter',blend:u,grip:.94-.4*u,x:.096,z:-.008,elevation:.065+.03*u,label:'停流抬手 · 张开指缝'} }
  if(t<18) {const u=(t-13.5)/4.5,flow=1.1*smooth(u*8)*smooth((1-u)*8)*(.85+.15*Math.sin(t*7.8));return {...base,pose:'scatter',nextPose:'scatter',grip:.54-.3*flow/1.1,x:.096-.16*smooth(u),z:-.008+.07*Math.sin(u*Math.PI),elevation:.095,flow,palmTurn:.35*Math.sin(u*Math.PI),label:'张指散漏 · 余沙落回台面'} }
  if(t<19) {const u=smooth(t-18);return {...base,pose:'scatter',nextPose:'palm',blend:u,grip:.12,x:-.064-.041*u,z:-.008+.013*u,elevation:.095*(1-u),label:'张掌 · 降到沙面'} }
  if(t<21.5) {const u=(t-19)/2.5;return {...base,pose:'palm',nextPose:'palm',grip:.12,pressure:smooth((t-19)/.2)*smooth((21.5-t)/.24),x:-.105+.19*smooth(u),z:.005+.012*Math.sin(u*Math.PI),touching:true,label:'掌缘推沙 · 移动已有沙层'} }
  return {...base,pose:'palm',nextPose:'palm',grip:.12,x:.085+.06*smooth((t-21.5)/2.5),z:.005,elevation:.16*smooth((t-21.5)/2.5),label:'抬手离开 · 余沙落定'}
}

/** 将实际取到的一把沙分配给细漏、散漏，不使用预装供应量。 */
export const PICKUP_FLOW_WEIGHT=Array.from({length:PICKUP_TICKS},(_,i)=>pickupAction(i+1).flow*CONTACT_DT).reduce((sum,amount)=>sum+amount,0)
