import type { PortraitPlan } from './structured-painting'
import { CONTACT_DT } from './contact-score'
import {photoHeroWindows} from './photo-actions'
import {gestureLength} from './gesture-photo-plan'

export type PhotoPace = 'guided' | .25 | 1 | 4 | 10
const rates = [6, 6, 2, 3, 18, 1]
const chapterHold = .8

/** 只重排观看时间，每个材料时间步都执行；章节之间停留，不跳过细笔。 */
export class PhotoTiming {
  private readonly time: Float64Array
  constructor(plan: PortraitPlan) {
    const phaseRates=plan.motion==='sculpt'?[6,6,4,4,10,1]:plan.motion==='flow'?[8,8,5,5,10,1]:rates
    const heroes=plan.motion==='sculpt'?photoHeroWindows(plan):[]
    const costs=plan.motion==='performance'?new Float64Array(plan.totalTicks):undefined
    if(costs){
      let start=0,previous=plan.strokes[0].path[0]
      for(const s of plan.strokes){
        const length=gestureLength(s,plan.width??768,plan.height??512)
        const seconds=s.phase===4&&s.sigma<2?Math.max(.24,Math.min(.55,.22+length*.0045)):s.ticks*CONTACT_DT/([12,12,6,6,8][s.phase])
        const travel=Math.hypot((s.path[0].x-previous.x)*768,(s.path[0].y-previous.y)*512)
        const rest=Math.min(.085,.04+travel*.0001)
        for(let n=0;n<s.ticks;n++)costs[start+n]=seconds/s.ticks
        for(let n=0;n<10;n++)costs[start+s.ticks+n]=rest/10
        start+=s.ticks+10;previous=s.path.at(-1)!
      }
      costs.fill(CONTACT_DT,start)
    }
    this.time = new Float64Array(plan.totalTicks + 1)
    let phase = 0
    for (let tick = 0; tick < plan.totalTicks; tick++) {
      while (phase < 5 && tick >= plan.phaseStarts[phase + 1]) phase++
      const hold = phase > 0 && tick === plan.phaseStarts[phase] ? chapterHold : 0
      const rate=heroes.some(w=>tick>=w.start&&tick<w.end)?1:phaseRates[phase]
      this.time[tick + 1] = this.time[tick] + (costs?.[tick]??CONTACT_DT / rate) + hold
    }
  }
  elapsed(tick: number, pace: PhotoPace) {
    const at = Math.max(0, Math.min(this.time.length - 1, Math.floor(tick)))
    return pace === 'guided' ? this.time[at] : at * CONTACT_DT / pace
  }
  stepSeconds(tick: number, pace: PhotoPace) {
    return this.elapsed(tick + 1, pace) - this.elapsed(tick, pace)
  }
  duration(pace: PhotoPace) { return this.elapsed(this.time.length - 1, pace) }
}
