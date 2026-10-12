import { expect, test } from 'vitest'
import { photoToSnapshot, settingsFor, validSettings } from '../src/memories/model'
import { PhotoPainting, planPhotoPainting } from '../src/memories/painting'
import { decodePhotoProject, encodePhotoProject } from '../src/memories/export'

function fixture(width=96,height=64) {
  const pixels=new Uint8ClampedArray(width*height*4)
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const nx=x/width,ny=y/height,i=(y*width+x)*4
    let gray=220+15*Math.sin(nx*45)*Math.cos(ny*23)
    if(nx<.22)gray=130+15*Math.sin(ny*15)
    if(((nx-.63)/.16)**2+((ny-.42)/.23)**2<1)gray=70+100*Math.max(0,1-(nx-.49)/.29)
    if(nx>.42&&nx<.85&&ny>.64)gray=45+ny*30
    if(((nx-.57)/.07)**2+((ny-.73)/.07)**2<1)gray=185
    pixels[i]=pixels[i+1]=pixels[i+2]=gray;pixels[i+3]=255
  }
  return pixels
}
const settings={...settingsFor(),style:'portrait' as const,focusX:.63,focusY:.53,focusSize:.32}
test('留白人像减淡外围、保留主体，并与情绪选择独立',()=>{
  const pixels=fixture(),plain=photoToSnapshot(pixels,96,64,settingsFor()),portrait=photoToSnapshot(pixels,96,64,settings)
  expect(portrait.density[32*96+5]).toBeLessThan(plain.density[32*96+5]*.3)
  expect(portrait.density[35*96+60]).toBeGreaterThan(portrait.density[35*96+5]*4)
  expect(portrait.density).not.toEqual(photoToSnapshot(pixels,96,64,{...settings,focusX:.1}).density)
  expect(validSettings({...settings,focusSize:2})).toBe(false)
  expect(validSettings({...settings,style:'unknown'})).toBe(false)
})
test('旧照片工程继续按旧影调处理，新风格与主体设置完整往返',()=>{
  const project={format:'sandboard-photo' as const,version:1 as const,title:'一刻',caption:'',sourceKind:'photo' as const,settings,
    snapshot:photoToSnapshot(fixture(),96,64,settings)}
  expect(decodePhotoProject(encodePhotoProject(project))).toEqual(project)
  expect(validSettings(settingsFor())).toBe(true)
})
test('编排使用连续曲线与局部换位，章节和有限供料确定',()=>{
  const target=photoToSnapshot(fixture(),96,64,settings),a=planPhotoPainting(target,settings),b=planPhotoPainting(target,settings)
  expect(a).toEqual(b)
  expect(a.some(s=>s.path.length>=4)).toBe(true)
  expect(a.some(s=>s.tool==='rub')).toBe(true)
  expect(a.filter(s=>s.tool==='pour').every(s=>s.budget>0&&Number.isFinite(s.budget))).toBe(true)
  expect(a.every(s=>s.path.every(p=>p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1))).toBe(true)
  const phases=a.map(s=>s.phase);expect(phases).toEqual([...phases].sort((a,b)=>a-b))
})
test('演出从空台经真实供料形成，没有末尾覆盖；落定与质量核算一致',()=>{
  const target=photoToSnapshot(fixture(),96,64,settings),painting=new PhotoPainting(target,settings)
  expect(painting.material.mass).toBe(0)
  for(let n=0;n<18;n++)painting.step()
  expect(painting.material.suppliedMass).toBeGreaterThan(0)
  expect(painting.material.mass).toBeGreaterThan(0)
  expect(painting.hand).not.toBeNull()
  while(painting.tick<painting.phaseStarts[3])painting.step()
  const lightError=()=>painting.material.density.reduce((sum,n,i)=>sum+Math.abs(Math.exp(-n*1.35)-Math.exp(-target.density[i]*1.35)),0)/target.density.length
  const coarseError=lightError()
  while(painting.tick<painting.totalTicks-1)painting.step()
  const before=painting.material.density.slice();painting.step()
  expect(painting.material.density).toEqual(before)
  expect(painting.material.pending).toBe(false)
  expect(painting.material.mass).toBeGreaterThan(100)
  expect(painting.material.mass+painting.material.removedMass).toBeCloseTo(painting.material.suppliedMass,2)
  expect(lightError()).toBeLessThan(coarseError*.8)
  expect(painting.step()).toBe(false)
},15000)
test('检查点包含余沙和粒子，中途回跳续算与完整演出逐值一致',()=>{
  const target=photoToSnapshot(fixture(),96,64,settings),a=new PhotoPainting(target,settings),b=new PhotoPainting(target,settings)
  for(let n=0;n<113;n++)a.step()
  const at=a.read();b.restore(at)
  while(a.step()){};while(b.step()){}
  expect(b.material.read()).toEqual(a.material.read())
  const end=a.material.read(),destination=Math.floor(a.totalTicks*.37)
  a.rewindTo(destination);while(a.tick<destination)a.step();while(a.step()){}
  expect(a.material.read()).toEqual(end)
  const chapter=a.phaseStarts[4]
  a.rewindTo(chapter);while(a.tick<chapter)a.step()
  expect(a.phase).toBe(4)
},20000)
