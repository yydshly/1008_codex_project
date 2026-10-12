import { StructuredPainting,type PortraitPlan } from './structured-painting'
import { TABLE_WIDTH as W,TABLE_DEPTH as D } from './contact-score'
import { PhotoTiming } from './photo-timing'

export type PhotoFocus='face'|'hands'|'coat'
const focusPoints={face:{x:.646,y:.325},hands:{x:.593,y:.643},coat:{x:.738,y:.691}}
/** 复用已校验的动作谱与材料，不把它转换成低分辨率试验场。 */
export class PhotoStudy {
  readonly painting:StructuredPainting
  readonly timing:PhotoTiming
  focus:PhotoFocus='face'
  private lastPoint={x:.646,y:.325}
  constructor(plan:PortraitPlan){this.painting=new StructuredPainting(plan);this.timing=new PhotoTiming(plan)}
  get material(){return this.painting.material}
  get tick(){return this.painting.tick}
  get ticks(){return this.painting.totalTicks}
  get label(){const note=this.painting.toolNote;return this.tick===0?'空台 · 等待第一笔':this.tick===this.ticks?'雨窗与茶杯 · 沙已落定':this.painting.plan.motion?note.replace('细流添沙','沿曲线撒沙').replace('指腹收沙',this.painting.plan.motion!=='flow'?'沿迹带走沙粒':'收沙留光').replace('抬手落沙','停沙落定'):note}
  get anchor(){const p=this.lastPoint;return {x:(p.x-.5)*W,z:(p.y-.5)*D}}
  get focalPoint(){const p=focusPoints[this.focus];return {x:(p.x-.5)*W,z:(p.y-.5)*D}}
  reset(){this.rewindTo(0)}
  rewindTo(tick:number){const to=this.painting.rewindTo(tick);this.lastPoint=focusPoints[this.focus];return to}
  step(){const result=this.painting.step();if(this.painting.hand)this.lastPoint={x:this.painting.hand.x,y:this.painting.hand.y};return result}
}
