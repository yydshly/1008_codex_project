import {expect,test} from 'vitest'
import {buildKeepsakePlan,DEFAULT_SHAPE,validateDraft,escapeHTML,storyLines,FILM_TICKS,type KeepsakeDraft} from '../src/memories/keepsake-model'
import {KeepsakeStudy} from '../src/memories/keepsake-material'
import {giftHTML} from '../src/memories/keepsake-film'
import 'fake-indexeddb/auto'
import {saveKeepsake,readKeepsake} from '../src/memories/keepsake-storage'
const draft:KeepsakeDraft={version:1,title:'母亲的杯子',recipient:'妈妈',story:'那天，你泡了一杯茶。',dedication:'愿你平安。',mood:'warm',sourceKind:'upload',photo:'data:image/png;base64,AAAA',imageWidth:1200,imageHeight:900,shape:{...DEFAULT_SHAPE}}
test('照片框选改变实际动作比例，左杯把与无碟模板各自生成',()=>{
  const a=buildKeepsakePlan(draft)
  const wide=buildKeepsakePlan({...draft,shape:{...draft.shape,width:.6,height:.3}})
  expect(wide.actions[1].path).not.toEqual(a.actions[1].path)
  const left=buildKeepsakePlan({...draft,shape:{...draft.shape,handle:'left'}})
  expect(Math.max(...left.actions[5].path.map(p=>p.x))).toBeLessThan(Math.min(...a.actions[5].path.map(p=>p.x)))
  const plain=buildKeepsakePlan({...draft,shape:{...draft.shape,handle:'none',saucer:false}})
  expect(plain.actions).toHaveLength(6);expect(a.actions).toHaveLength(9)
  const shallow=buildKeepsakePlan({...draft,shape:{...draft.shape,lip:.06}})
  expect(shallow.actions[4].radius).toBeLessThan(a.actions[4].radius)
  for(const plan of [a,wide,left,plain]){
    expect(plan.ticks).toBe(2700);expect(plan.starts[0]).toBe(240)
    expect(plan.starts.at(-1)).toBeLessThanOrEqual(2225)
    for(const action of plan.actions)for(const p of action.path){expect(p.x).toBeGreaterThanOrEqual(.08);expect(p.y).toBeLessThanOrEqual(.9)}
  }
})
test('工程拒绝非法坐标、非图像链接和超长文字，合法数据复制独立',()=>{
  const valid=validateDraft(draft);expect(valid).toEqual(draft);expect(valid.shape).not.toBe(draft.shape)
  for(const bad of [{...draft,photo:'javascript:alert(1)'},{...draft,shape:{...draft.shape,x:NaN}},{...draft,shape:{...draft.shape,width:2}},{...draft,title:'a'.repeat(37)}])
    expect(()=>validateDraft(bad)).toThrow()
  expect(escapeHTML('<script>"&')).toBe('&lt;script&gt;&quot;&amp;')
  expect(storyLines('')).toHaveLength(1);expect(storyLines('你好。第二句！')).toEqual(['你好。','第二句！'])
  const many='记住。'.repeat(80)
  expect(storyLines(many).join('')).toBe(many);expect(storyLines(many)).toHaveLength(8)
})
test('片头为空，移动和停驻不删沙，拾起后才移出台面',()=>{
  const plan=buildKeepsakePlan(draft),study=new KeepsakeStudy(plan,192,128)
  while(study.tick<plan.intro)study.step()
  expect(study.sand.mass).toBe(0);expect(study.sand.suppliedMass).toBe(0)
  const i=2,a=plan.actions[i]
  while(study.tick<plan.starts[i])study.step()
  const out=study.sand.removedMass
  while(study.tick<plan.starts[i]+Math.round((a.seconds-.85)*60))study.step()
  expect(study.state).toBe('holding');expect(study.sand.removedMass).toBe(out)
  while(study.tick<plan.starts[i+1])study.step()
  expect(study.sand.removedMass).toBeGreaterThan(out)
  expect(study.sand.mass+study.sand.inAirMass+study.sand.removedMass).toBeCloseTo(study.sand.suppliedMass,2)
})
test('整部短片实际材料可重复，结尾不换图、不增沙，所有粒子落定',()=>{
  const plan=buildKeepsakePlan({...draft,shape:{...draft.shape,handle:'none',saucer:false}}),study=new KeepsakeStudy(plan,192,128)
  while(study.tick<plan.outro)study.step()
  const bed=study.sand.density.slice(),out=study.sand.removedMass
  while(study.tick<FILM_TICKS)study.step()
  expect(study.sand.pending).toBe(false);expect(study.sand.density).toEqual(bed);expect(study.sand.removedMass).toBe(out)
  const end=study.sand.read();study.reset();while(study.tick<FILM_TICKS)study.step();expect(study.sand.read()).toEqual(end)
  expect(study.sand.mass+study.sand.removedMass).toBeCloseTo(study.sand.suppliedMass,2)
})
test('本机工程完整保存照片与文字，读取仍须通过输入校验',async()=>{
  await saveKeepsake(draft);expect(await readKeepsake()).toEqual(draft)
})
test('赠礼网页嵌入真实视频并转义用户文字，原照默认不附带',async()=>{
  const input={...draft,title:'<script>alert(1)</script>',story:'<img src=x onerror=alert(1)>',dedication:'与你一起 & 慢慢长大'}
  const video=new Blob([new Uint8Array([1,2,3,4])],{type:'video/webm'}),poster='data:image/png;base64,AQID'
  const html=await giftHTML(input,video,poster)
  expect(html).toContain('data:video/webm;base64,AQIDBA==')
  expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>')
  expect(html).not.toContain(input.photo);expect(html).toContain('与你一起 &amp; 慢慢长大')
  expect(await giftHTML(input,video,poster,true)).toContain(input.photo)
  await expect(giftHTML(input,new Blob([],{type:'text/html'}),poster)).rejects.toThrow()
})
