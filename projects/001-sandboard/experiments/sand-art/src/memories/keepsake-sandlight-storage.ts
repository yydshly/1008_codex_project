import {validateDraft,type KeepsakeDraft} from './keepsake-model'
let database:Promise<IDBDatabase>|undefined
function open(){
  return database??=new Promise<IDBDatabase>((resolve,reject)=>{
    const r=indexedDB.open('sandboard-keepsake-sandlight-film',1)
    r.onupgradeneeded=()=>r.result.createObjectStore('drafts')
    r.onsuccess=()=>resolve(r.result)
    r.onerror=()=>{database=undefined;reject(r.error||new Error('本机保存不可用。'))}
  })
}
export async function saveKeepsake(draft:KeepsakeDraft){
  const value=validateDraft(draft),db=await open()
  return new Promise<void>((resolve,reject)=>{
    const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(value,'current')
    tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error||new Error('本机保存失败。'))
  })
}
export async function readKeepsake():Promise<KeepsakeDraft|undefined>{
  const db=await open()
  return new Promise((resolve,reject)=>{
    const r=db.transaction('drafts','readonly').objectStore('drafts').get('current')
    r.onsuccess=()=>{try{resolve(r.result?validateDraft(r.result):undefined)}catch(e){reject(e)}}
    r.onerror=()=>reject(r.error)
  })
}
