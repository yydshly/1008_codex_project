import { GeneratedHandsDemo } from './generated-hands-demo'
document.body.className='generated-hands-page'
const root=document.querySelector<HTMLElement>('#app')!
root.innerHTML='<header class="gh-page-header"><span>光阴沙画 / 手与沙</span><nav><a href="./contact/">三维接触试验 ↗</a> · <a href="../">返回照片创作 ↗</a></nav></header><main class="gh-page-main"></main><footer class="gh-page-footer">生成手部素材与数字沙台 · 独立试验，不需要上传照片</footer>'
const demo=new GeneratedHandsDemo(root.querySelector<HTMLElement>('main')!)
try{await demo.load()}catch(error){root.querySelector<HTMLElement>('[data-status]')!.textContent=error instanceof Error?error.message:'演示载入失败。';root.querySelector<HTMLElement>('.gh-loading')!.hidden=true}
window.addEventListener('pagehide',event=>{if(!event.persisted)demo.stop()})
