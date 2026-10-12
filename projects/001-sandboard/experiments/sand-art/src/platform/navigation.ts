import {pages,groups,homeURL,pageURL,currentPage,escape} from './paths'

// A shadow root isolates navigation from the historical experiments' global CSS.
const host=document.createElement('sand-platform-nav')
const shadow=host.attachShadow({mode:'open'})
shadow.innerHTML=`<style>
 :host{display:block;position:sticky;top:0;z-index:1000;height:56px;font:12px "Microsoft YaHei",system-ui,sans-serif;color:#293d31;letter-spacing:normal}
 *{box-sizing:border-box}a{color:inherit;text-decoration:none}button{font:inherit;color:inherit;cursor:pointer}a:focus-visible,button:focus-visible{outline:3px solid #a77d40;outline-offset:2px}
 .bar{height:56px;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:0 28px;border-bottom:1px solid #d8ddce;background:#f4f3ebf5;backdrop-filter:blur(12px)}
 .home{display:flex;align-items:center;gap:9px;min-height:44px;white-space:nowrap;font-weight:600}.mark{display:grid;place-items:center;width:28px;height:28px;background:#344c3c;color:#eee6c8;font:19px serif;border-radius:3px}.home small{font-size:10px;font-weight:400;color:#667361}.current{margin-right:auto;font-size:11px;color:#77816e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .links{display:flex;align-items:center;gap:21px;white-space:nowrap}.links>a{display:flex;align-items:center;min-height:44px}.links [aria-current=page]{color:#9d783b;border-bottom:2px solid #9d783b}.toggle{min-height:44px;padding:8px 12px;border:1px solid #bcc7b3;border-radius:4px;background:#fffdf4}.toggle[aria-expanded=true]{background:#344c3c;color:white}
 .panel{position:fixed;right:20px;top:64px;width:min(920px,calc(100vw - 40px));max-height:calc(100dvh - 84px);overflow:auto;padding:24px;background:#faf9f1;border:1px solid #c8d1be;border-radius:5px;box-shadow:0 16px 60px #15281935;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.panel[hidden]{display:none}.panel h2{font-size:11px;font-weight:500;color:#96723a;margin:0 0 10px}.panel a{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;padding:8px 4px;border-bottom:1px solid #e2e5d8;font-size:12px;line-height:1.7}.panel a:hover{background:#e8eddc}.panel small{font-size:9px;color:#7c866f;white-space:nowrap}.panel [aria-current=page]{background:#e5eadb}.panel p{grid-column:1/-1;margin:0;font-size:10px;line-height:1.8;color:#758169}
 @media(max-width:760px){.bar{padding:0 14px;gap:10px}.home small,.current,.links>a{display:none}.links{gap:0}.panel{grid-template-columns:1fr;right:10px;top:62px;width:calc(100vw - 20px);padding:20px;gap:20px}.panel p{grid-column:1}.home{font-size:12px}}
</style><nav class="bar" aria-label="沙画平台统一导航"><a class="home" href="${homeURL}"><span class="mark" aria-hidden="true">沙</span>光阴沙画 · 首页<small>全部平台与尝试</small></a><span class="current">${escape(currentPage?.title??'平台总览')}</span><div class="links">${['gallery','memories','studio','research'].map(id=>{const page=pages.find(item=>item.id===id)!;return `<a href="${pageURL(page)}" ${currentPage?.id===id?'aria-current="page"':''}>${id==='gallery'?'作品集':id==='memories'?'照片平台':id==='studio'?'手绘沙台':'研究历程'}</a>`}).join('')}<button class="toggle" type="button" aria-expanded="false" aria-controls="platform-directory">全部入口 <span aria-hidden="true">▾</span></button></div></nav><div class="panel" id="platform-directory" hidden aria-label="全部平台页面">${Object.entries(groups).map(([key,title])=>`<section><h2>${title}</h2>${pages.filter(page=>page.group===key).map(page=>`<a href="${pageURL(page)}" ${currentPage?.id===page.id?'aria-current="page"':''}>${escape(page.title)}<small>${page.version}</small></a>`).join('')}</section>`).join('')}<p>旧平台、试验和各版纪念短片均保留。版本号表示先后顺序，视觉质量请对照实际产物与过程。</p></div>`
document.body.prepend(host)
const button=shadow.querySelector<HTMLButtonElement>('button')!
const panel=shadow.querySelector<HTMLElement>('.panel')!
const close=()=>{panel.hidden=true;button.setAttribute('aria-expanded','false')}
button.addEventListener('click',()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden))})
document.addEventListener('click',event=>{if(!event.composedPath().includes(host))close()})
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){close();button.focus()}})
shadow.addEventListener('click',event=>{if((event.target as Element).closest('a'))close()})
function connectLegacyLinks(){
  const original=pageURL(pages.find(page=>page.id==='original')!)
  const destinations:Record<string,string>={'baseline-link':original,'stage-baseline-link':original,'original-link':original,'art-link':pageURL(pages.find(page=>page.id==='studio')!)}
  const selector=Object.keys(destinations).map(id=>`#${id}`).join(',')
  const fix=(element:Element)=>{
    if(element instanceof HTMLAnchorElement&&destinations[element.id]&&element.href!==destinations[element.id])element.href=destinations[element.id]
  }
  document.querySelectorAll(selector).forEach(fix)
  // Historical apps create their interfaces and assign links after asynchronous setup.
  // Follow only inserted elements and href changes; canvas frames and text updates are ignored.
  new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='attributes')fix(record.target as Element)
      else for(const node of record.addedNodes)if(node instanceof Element){fix(node);node.querySelectorAll(selector).forEach(fix)}
    }
  }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']})
}
connectLegacyLinks()

