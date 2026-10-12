export const CONTACT_DT = 1 / 60
export const CONTACT_TICKS = 1200
export const TABLE_WIDTH = 0.58
export const TABLE_DEPTH = 0.4
export type ContactPose = 'pinch' | 'scatter' | 'palm' | 'finger' | 'scoop'
export interface ContactAction {
  time: number
  grip: number
  pressure: number
  wristTilt: number
  wristRoll: number
  pose: ContactPose
  nextPose: ContactPose
  blend: number
  x: number
  z: number
  elevation: number
  yaw: number
  flow: number
  touching: boolean
  label: string
  /** 独立取沙流程。0–1 取沙意图与绕前臂翻掌角度；旧动作省略。 */
  pickup?: number
  palmTurn?: number
  /** 无手落沙的小流口；旧手部动作省略，沿用原参数。 */
  flowSpread?: number
  flowRadius?: number
  flowCluster?: number
  flowInertia?: number
  continuousEmission?: boolean
}
const smooth = (t: number) => { const v = Math.max(0, Math.min(1, t)); return v * v * (3 - 2 * v) }

/** 动作谱只描述手，不包含目标图或显影遮罩。手的蒙皮接触点决定沙的作用位置。 */
export function contactAction(tick: number): ContactAction {
  const t = Math.max(0, Math.min(CONTACT_TICKS, tick)) * CONTACT_DT
  const base: ContactAction = { time:t, grip:.94, pressure:0, wristTilt:0, wristRoll:0, pose: 'pinch', nextPose: 'pinch', blend: 0, x: -.09, z: -.03, elevation: .06, yaw: -.15, flow: 0, touching: false, label: '收指入场' }
  if (t < 2) return { ...base, grip:.54+.4*smooth(t/2), wristTilt:.035*(1-smooth(t/2)), elevation: .14 - .08 * smooth(t / 2), x: -.17 + .08 * smooth(t / 2), z: -.03 + .01 * smooth(t / 2) }
  if (t < 6) {
    const u = (t - 2) / 4
    const flow=.48*smooth(u*10)*smooth((1-u)*8)*(.88+.12*Math.sin(t*5.2))
    return { ...base, grip:.94-.28*flow/.48, wristTilt:.015*Math.sin(u*Math.PI*2), x: -.09 + .17 * smooth(u), z: -.02 + .04 * Math.sin(u * Math.PI), flow, label: '松指 · 细流落沙' }
  }
  if (t < 7) return { ...base, grip:.94-.34*smooth(t-6), nextPose: 'scatter', blend: smooth(t - 6), x: .08, z: -.02 + .015 * smooth(t - 6), elevation: .06 + .035 * smooth(t - 6), label: '收指停沙 · 抬手' }
  if (t < 11) {
    const u = (t - 7) / 4
    const flow=1.8*smooth(u*8)*smooth((1-u)*10)*(.85+.15*Math.sin(t*7.8))
    return { ...base, grip:.6-.24*flow/1.8, wristTilt:.025*Math.sin(u*Math.PI*2), wristRoll:-.025*Math.sin(u*Math.PI), pose: 'scatter', nextPose: 'scatter', x: .08 - .19 * smooth(u), z: -.005 + .045 * Math.sin(u * Math.PI * 2), elevation: .095, flow, label: '松开指缝 · 多股散沙' }
  }
  if (t < 12) return { ...base, grip:.6-.48*smooth(t-11), pose: 'scatter', nextPose: 'palm', blend: smooth(t - 11), x: -.11 + .005 * smooth(t - 11), z: -.005 + .01 * smooth(t - 11), elevation: .095 * (1 - smooth(t - 11)), yaw: -.15 * (1 - smooth(t - 11)), label: '张掌 · 降到沙面' }
  if (t < 15) { const u=(t-12)/3; return { ...base, grip:.12,pressure:smooth((t-12)/.2)*smooth((15-t)/.24)*(.8+.2*Math.sin(u*Math.PI)),wristRoll:.035*Math.sin(u*Math.PI), pose: 'palm', nextPose: 'palm', x: -.105 + .19 * smooth(u), z: .005+.012*Math.sin(u*Math.PI), elevation: 0, yaw:.045*Math.sin(u*Math.PI*2), touching: true, label: '掌缘推沙 · 逐渐下压再松开' } }
  if (t < 16) return { ...base, grip:.12+.53*smooth(t-15), pose: 'palm', nextPose: 'finger', blend: smooth(t - 15), x: .085 - .14 * smooth(t - 15), z: .005 - .025 * smooth(t - 15), elevation: .045 * Math.sin((t - 15) * Math.PI), yaw: 0, label: '抬掌 · 伸出食指' }
  if (t < 18.5) {
    const u = (t - 16) / 2.5
    return { ...base, grip:.65,pressure:smooth((t-16)/.18)*smooth((18.5-t)/.22)*(.7+.3*Math.sin(u*Math.PI)),wristTilt:-.025*Math.sin(u*Math.PI), pose: 'finger', nextPose: 'finger', x: -.055 + .17 * smooth(u), z: -.02 + .009 * Math.sin(u * Math.PI), elevation: 0, yaw: 0, touching: true, label: '指腹划线 · 压力改变接触范围' }
  }
  return { ...base, grip:.65, pose: 'finger', nextPose: 'finger', x: .115 + .06 * smooth((t - 18.5) / 1.5), z: -.02, elevation: .16 * smooth((t - 18.5) / 1.5), yaw: 0, label: '抬手离开 · 余沙落定' }
}
