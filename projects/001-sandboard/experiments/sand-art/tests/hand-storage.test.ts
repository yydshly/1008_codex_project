import { beforeEach, expect, test } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { readHandRecords, saveHandRecords } from '../src/memories/hand-storage'
import type { HandRecord } from '../src/memories/filmed-hand'
beforeEach(()=>{globalThis.indexedDB=new IDBFactory()})
test('各手法视频与逐帧标定可跨连接恢复，移除一项不会混用其他手法',async()=>{
  const pour:HandRecord={role:'pour',name:'真实撒沙.webm',blob:new Blob(['fixture'],{type:'video/webm'}),calibration:{key:'alpha',width:.4,start:.2,end:1.3,anchors:[{progress:0,x:.2,y:.3},{progress:1,x:.4,y:.5}]}}
  const finger={...pour,role:'finger' as const,name:'真实指尖.webm'}
  await saveHandRecords([pour,finger]);const saved=await readHandRecords()
  expect(saved.map(r=>r.role).sort()).toEqual(['finger','pour'])
  expect(saved.find(r=>r.role==='pour')!.calibration).toEqual(pour.calibration)
  expect(await saved[0].blob.text()).toBe('fixture')
  await saveHandRecords([finger]);expect((await readHandRecords()).map(r=>r.role)).toEqual(['finger'])
})
