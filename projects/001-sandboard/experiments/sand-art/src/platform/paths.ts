import pages from './pages.json'

export const groups:Record<string,string>={create:'创作平台',showcase:'效果演示',hands:'手与沙试验',keepsake:'纪念短片',research:'研究档案'}
export const appRoot=(()=>{
  const hint=document.querySelector<HTMLMetaElement>('meta[name="sand-platform-root"]')?.content??'./'
  const url=new URL(hint,document.baseURI)
  // Keep standalone upstream/dev previews connected to the unified local platform.
  if((location.hostname==='127.0.0.1'||location.hostname==='localhost')&&location.port==='4173')url.port='4174'
  if((location.hostname==='127.0.0.1'||location.hostname==='localhost')&&location.port==='5173')return new URL(`${location.protocol}//${location.hostname}:5174/`)
  return url
})()
export const homeURL=new URL('home/',appRoot).href
export const pageURL=(page:(typeof pages)[number])=>new URL(page.path,appRoot).href
export const currentPage=pages.find(page=>page.id===document.body.dataset.platformPage)??pages.find(page=>new URL(pageURL(page)).pathname===location.pathname)
export const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as Record<string,string>)[char])
export {pages}
