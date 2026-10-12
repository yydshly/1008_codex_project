import { expect,test } from 'vitest'
import { mkdirSync,writeFileSync,readFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { sandPixels,settingsFor } from '../src/memories/model'
import { photoToSnapshot } from '../src/memories/model'
import { decodePortraitPlan,planStructuredPortrait,StructuredPainting } from '../src/memories/structured-painting'
import { windowGuides } from '../src/memories/structure'

// 仅在显式取证运行中输出实际材料渲染；不读取或编辑参考图片。
function png(width:number,height:number,rgba:Uint8ClampedArray){
  const crc=(data:Uint8Array)=>{let c=0xffffffff;for(const b of data){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
  const chunk=(name:string,data:Buffer)=>{const body=Buffer.concat([Buffer.from(name),data]),size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);sum.writeUInt32BE(crc(body));return Buffer.concat([size,body,sum])}
  const head=Buffer.alloc(13);head.writeUInt32BE(width);head.writeUInt32BE(height,4);head[8]=8;head[9]=6
  const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)rows.set(rgba.subarray(y*width*4,(y+1)*width*4),y*(width*4+1)+1)
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))])
}
const score=readFileSync('../../assets/photo-structure-v14/window-score.json','utf8')
test('单图动作拒绝成品厚度、坏路径和错误时间轴',()=>{
  const plan=decodePortraitPlan(score)
  expect(plan.strokes.some(s=>s.tool==='collect')).toBe(true)
  expect(plan.strokes.some(s=>s.tool==='rub')).toBe(true)
  expect(()=>decodePortraitPlan(JSON.stringify({...plan,density:[1]}))).toThrow()
  const bad=JSON.parse(score);bad.strokes[0].path[0].x=2
  expect(()=>decodePortraitPlan(JSON.stringify(bad))).toThrow()
  expect(()=>decodePortraitPlan(JSON.stringify({...plan,totalTicks:plan.totalTicks+1}))).toThrow()
})
test('完整单图演出从空台执行，落定、守恒、结束后不覆盖成品，回跳逐值一致',()=>{
  const painting=new StructuredPainting(decodePortraitPlan(score));expect(painting.material.mass).toBe(0)
  while(painting.step()){}
  const finished=painting.material.read()
  expect(painting.material.pending).toBe(false)
  expect(painting.material.mass+painting.material.removedMass).toBeCloseTo(painting.material.suppliedMass,0)
  expect(finished.density.every(n=>Number.isFinite(n)&&n>=0)).toBe(true)
  expect(painting.step()).toBe(false)
  expect(Buffer.from(painting.material.density.buffer).equals(Buffer.from(finished.density.buffer))).toBe(true)
  const target=painting.rewindTo(painting.phaseStarts[3]+213)
  while(painting.tick<target)painting.step()
  expect(painting.tick).toBe(target)
  while(painting.step()){}
  expect(Buffer.from(painting.material.density.buffer).equals(Buffer.from(finished.density.buffer))).toBe(true)
  expect(painting.material.suppliedMass).toBe(finished.suppliedMass)
  expect(painting.material.removedMass).toBe(finished.removedMass)
},30000)
test('无效检查点不会破坏当前实际沙层',()=>{
  const painting=new StructuredPainting(decodePortraitPlan(score));for(let n=0;n<90;n++)painting.step()
  const before=painting.read()
  expect(()=>painting.restore({...before,index:-1})).toThrow()
  expect(painting.read()).toEqual(before)
})
test('公园人物动作来自自己的左侧标注，整段真实材料可保存、重播且终点不覆盖',()=>{
  const plan=decodePortraitPlan(readFileSync('../../assets/photo-guided-v15/postcard-score.json','utf8'))
  expect(plan.guides?.find(g=>g.kind==='face')?.bounds[2]).toBeLessThan(.5)
  expect(plan.strokes.some(s=>s.tool==='collect'&&s.region==='hands')).toBe(true)
  const painting=new StructuredPainting(plan);expect(painting.material.mass).toBe(0)
  const middle=plan.phaseStarts[4];while(painting.tick<middle)painting.step()
  const resumed=new StructuredPainting(plan);resumed.resumeAt(painting.tick,painting.material.read())
  while(painting.step()){}while(resumed.step()){}
  expect(resumed.material.read()).toEqual(painting.material.read())
  expect(resumed.material.pending).toBe(false)
  const finished=painting.material.read()
  expect(painting.material.mass+painting.material.removedMass).toBeCloseTo(finished.suppliedMass,0)
  const to=resumed.rewindTo(plan.phaseStarts[2]+27);while(resumed.tick<to)resumed.step();while(resumed.step()){}
  expect(resumed.material.read()).toEqual(finished)
  expect(resumed.step()).toBe(false);expect(resumed.material.read()).toEqual(finished)
},40000)

test.skipIf(process.env.SAND_ART_PROOF!=='1')('生产照片引导的实际动作质量取证',async()=>{
  mkdirSync('node_modules/.cache/portrait-study',{recursive:true})
  const raw=readFileSync('node_modules/.cache/portrait-study/source.rgba')
  const target=photoToSnapshot(new Uint8ClampedArray(raw),768,512,{...settingsFor(),style:'portrait',focusX:.67,focusY:.57,focusSize:.34,detail:.8,contrast:1.1,grain:.35})
  const plan=await planStructuredPortrait(target),painting=new StructuredPainting(plan);while(painting.step()){}
  writeFileSync('node_modules/.cache/portrait-study/target.png',png(768,512,sandPixels(target,settingsFor())))
  writeFileSync('node_modules/.cache/portrait-study/structured.png',png(768,512,sandPixels(painting.material.read(),settingsFor())))
  writeFileSync('node_modules/.cache/portrait-study/structured-plan.json',JSON.stringify(plan))
  expect(plan.finalError).toBeLessThan(plan.initialError*.4)
},180000)
test.skipIf(process.env.SAND_TOUCH_PROOF!=='1')('细笔落定方案的完整照片材料取证',async()=>{
  const raw=readFileSync('node_modules/.cache/portrait-study/source.rgba')
  const settings={...settingsFor(),style:'portrait' as const,focusX:.67,focusY:.57,focusSize:.34,detail:.8,contrast:1.1,grain:.35}
  const target=photoToSnapshot(new Uint8ClampedArray(raw),768,512,settings)
  const plan=await planStructuredPortrait(target,undefined,{guides:windowGuides,quality:'fine',touch:'natural'})
  const checked=decodePortraitPlan(JSON.stringify(plan)),painting=new StructuredPainting(checked);while(painting.step()){}
  mkdirSync('../../assets/material-realism-v17',{recursive:true})
  writeFileSync('../../assets/material-realism-v17/natural-window-score.json',JSON.stringify(plan))
  writeFileSync('../../assets/material-realism-v17/actual-natural-window.png',png(768,512,sandPixels(painting.material.read(),settings)))
  expect(plan.strokes.some(s=>s.finish==='settle')).toBe(true)
  expect(plan.finalError).toBeLessThan(plan.initialError*.4)
},300000)
