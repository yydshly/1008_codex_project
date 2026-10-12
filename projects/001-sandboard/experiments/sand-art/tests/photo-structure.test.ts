import { afterEach,expect,test,vi } from 'vitest'
import { StageMaterial } from '../src/stage/material'
import { validSettings,settingsFor } from '../src/memories/model'
import { encodePhotoProject,decodePhotoProject } from '../src/memories/export'
import { guideBounds,validGuides,postcardGuides,windowGuides,type StructureGuide } from '../src/memories/structure'
import { regionsForGuides,planStructuredPortrait,decodePortraitPlan,StructuredPainting } from '../src/memories/structured-painting'
import { requestStructurePlan } from '../src/memories/structure-client'
import { restorePerformance } from '../src/memories/performance'

test('区域标注允许多个脸和手，拒绝反向、越界、重复 ID 和第二个主体',()=>{
  expect(validGuides(postcardGuides)).toBe(true)
  expect(guideBounds({x:.8,y:.6},{x:.2,y:.1})).toEqual([.2,.1,.8,.6])
  expect(validGuides([...postcardGuides,{id:'face-two',kind:'face',bounds:[.7,.2,.9,.4]}])).toBe(true)
  for(const bounds of [[.5,.1,.2,.3],[0,0,1.1,1],[.2,.1,.21,.4],[0,0,1,NaN]])expect(validGuides([{id:'x',kind:'face',bounds}])).toBe(false)
  expect(validGuides([...postcardGuides,postcardGuides[1]])).toBe(false)
  expect(validGuides([...postcardGuides,{...postcardGuides[0],id:'another-subject'}])).toBe(false)
  expect(validGuides([{id:'<script>',kind:'face',bounds:[0,0,1,1]}])).toBe(false)
})
test('区域跟随照片标注，不套用固定右侧人像，缺少角色时跳过',()=>{
  const left=regionsForGuides(postcardGuides),right=regionsForGuides(windowGuides)
  expect(left.face[0][2]).toBeLessThan(right.face[0][0])
  expect(left.hair[0][2]).toBeLessThan(.5)
  const object=regionsForGuides([{id:'obj',kind:'object',bounds:[.1,.2,.4,.8]}])
  expect(object.face).toEqual([]);expect(object.hands).toEqual([]);expect(object.hair).toEqual([])
  expect(object.cup).toEqual([[.1,.2,.4,.8]])
})
test('旧作品继续兼容，新作品保存人工标注，坏标注在导入时被拒绝',()=>{
  const legacy=settingsFor(),settings={...legacy,structure:postcardGuides}
  expect(validSettings(legacy)).toBe(true);expect(validSettings(settings)).toBe(true)
  const work={format:'sandboard-photo' as const,version:1 as const,title:'公园里的一封信',caption:'测试',sourceKind:'ai-sample' as const,settings,snapshot:new StageMaterial(32,24).read()}
  expect(decodePhotoProject(encodePhotoProject(work)).settings.structure).toEqual(postcardGuides)
  expect(()=>decodePhotoProject(encodePhotoProject({...work,settings:{...settings,structure:[{id:'bad',kind:'face',bounds:[0,0,2,1]}]}}))).toThrow()
})

test.each([[96,64],[64,80]])('实际工具在 %i×%i 画幅按左侧脸部成画，守恒且可精确回放',async(width,height)=>{
  const face:StructureGuide={id:'left-face',kind:'face',bounds:[.12,.2,.42,.55]}
  const material=new StageMaterial(width,height),target=material.read()
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const a=x/width,b=y/height
    target.density[y*width+x]=Math.exp(-((a-.27)**2/.009+(b-.38)**2/.025))*.8
  }
  const plan=await planStructuredPortrait(target,undefined,{guides:[face],quality:'balanced'})
  const checked=decodePortraitPlan(JSON.stringify(plan)),painting=new StructuredPainting(checked)
  expect(painting.material.mass).toBe(0);expect(painting.material.width).toBe(width)
  expect(plan.finalError).toBeLessThan(plan.initialError*.7)
  expect(plan.strokes.some(s=>s.region==='hands'||s.region==='cup')).toBe(false)
  expect(plan.strokes.filter(s=>s.region==='face').every(s=>s.path.some(p=>p.x<.5))).toBe(true)
  while(painting.step()){}
  const final=painting.material.read()
  expect(painting.material.pending).toBe(false)
  expect(final.density.every(n=>Number.isFinite(n)&&n>=0)).toBe(true)
  expect(painting.material.mass+painting.material.removedMass).toBeCloseTo(painting.material.suppliedMass,3)
  const performance={plan,tick:painting.tick},work={format:'sandboard-photo' as const,version:1 as const,title:'重播',caption:'',sourceKind:'photo' as const,settings:settingsFor(),snapshot:final,performance}
  const imported=decodePhotoProject(encodePhotoProject(work)),resumed=restorePerformance(imported.performance!,imported.snapshot)
  expect(resumed.tick).toBe(plan.totalTicks);expect(resumed.material.read()).toEqual(final)
  const middle=resumed.rewindTo(plan.phaseStarts[2]+9);while(resumed.tick<middle)resumed.step()
  const halfway=restorePerformance({plan,tick:resumed.tick},resumed.material.read());while(halfway.step()){}
  expect(halfway.material.read()).toEqual(final)
  expect(()=>restorePerformance({plan,tick:plan.totalTicks+1},final)).toThrow()
  expect(()=>restorePerformance(performance,new StageMaterial(32,24).read())).toThrow()
  const end=painting.rewindTo(plan.phaseStarts[2]+7);while(painting.tick<end)painting.step();while(painting.step()){}
  expect(painting.material.density).toEqual(final.density)
  expect(painting.step()).toBe(false);expect(painting.material.density).toEqual(final.density)
},30000)

class WorkerDouble {
  static last:WorkerDouble
  onmessage:((event:{data:unknown})=>void)|null=null
  onerror:(()=>void)|null=null
  onmessageerror:(()=>void)|null=null
  postMessage=vi.fn()
  terminate=vi.fn()
  constructor(){WorkerDouble.last=this}
}
afterEach(()=>vi.unstubAllGlobals())
test('后台取消结束 Worker，迟到消息不会再更新进度或覆盖作品',async()=>{
  vi.stubGlobal('Worker',WorkerDouble)
  const onProgress=vi.fn(),target=new StageMaterial(32,24).read(),before=target.density.slice()
  const job=requestStructurePlan(target,{guides:postcardGuides},onProgress),worker=WorkerDouble.last
  const rejected=expect(job.promise).rejects.toMatchObject({name:'AbortError'})
  worker.onmessage!({data:{kind:'progress',fraction:.3,phase:2}});expect(onProgress).toHaveBeenCalledWith(.3,2)
  job.cancel();await rejected
  worker.onmessage!({data:{kind:'progress',fraction:1,phase:4}})
  expect(onProgress).toHaveBeenCalledTimes(1);expect(worker.terminate).toHaveBeenCalledOnce()
  expect(target.density).toEqual(before)
})
test('后台动作必须通过校验，错误和坏时间轴会终止 Worker',async()=>{
  vi.stubGlobal('Worker',WorkerDouble)
  const job=requestStructurePlan(new StageMaterial(32,24).read(),{guides:postcardGuides},()=>{})
  const rejected=expect(job.promise).rejects.toThrow()
  WorkerDouble.last.onmessage!({data:{kind:'ready',plan:{density:[1],totalTicks:1}}});await rejected
  expect(WorkerDouble.last.terminate).toHaveBeenCalledOnce()
  const broken=requestStructurePlan(new StageMaterial(32,24).read(),{guides:postcardGuides},()=>{}),failed=expect(broken.promise).rejects.toThrow('后台规划失败')
  WorkerDouble.last.onerror!();await failed
})
