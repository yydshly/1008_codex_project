import './home.css'
import {pages,groups,pageURL,appRoot,escape} from './paths'
import {media} from '../research/media'
import collectionPreview from '../../../../assets/unified-gallery/mixed-collection.png?url'

const get=<E extends HTMLElement>(id:string)=>document.getElementById(id) as E
get<HTMLImageElement>('hero-image').src=media['photo-memory-v12/exhibit.jpg']
get<HTMLAnchorElement>('photo-entry').href=pageURL(pages.find(page=>page.id==='memories')!)+'#create'
get<HTMLAnchorElement>('research-entry').href=pageURL(pages.find(page=>page.id==='research')!)
get<HTMLAnchorElement>('gallery-entry').href=new URL('gallery/',appRoot).href
get<HTMLAnchorElement>('examples-entry').href=new URL('gallery/#examples',appRoot).href
const handTools=[
  {id:'rake',title:'沙耙',note:'拖出并行沙纹',mode:'surface',icon:'<path d="M8 21 16 8M9 7l9 5M9 7l-3 5m6-3-3 5m6-3-3 5m6-3-3 5"/>'},
  {id:'pour',title:'撒沙',note:'细漏、散撒与一把沙',mode:'lightbox',icon:'<path d="M7 3h10l-3 8h-4L7 3Z"/><path d="M11 15v1m3 2v1m-6 0v1m4 2v1m5-9v1"/>'},
  {id:'push',title:'推沙',note:'推拢沙层，堆起沙脊',mode:'surface',icon:'<path d="M3 12h11m-4-4 4 4-4 4m7-9 2 5-2 5m4-10 2 5-2 5"/>'},
  {id:'scrape',title:'刮线',note:'沿着指尖留下线条',mode:'surface',icon:'<path d="m5 19 7-7m-5 9 7-7m-4-4 8-8 4 4-8 8-4-4Z"/>'},
  {id:'stamp',title:'印章',note:'按下，留下心形印痕',mode:'surface',icon:'<circle cx="12" cy="15" r="7"/><path d="M9 7V3h6v4M6 15h12"/>'},
  {id:'smooth',title:'抹平',note:'轻抚局部沙面',mode:'surface',icon:'<path d="M3 7h18M3 12h18M3 17h18"/>'},
  {id:'palm',title:'掌形',note:'用掌面塑出宽幅明暗',mode:'surface',icon:'<path d="M8 21 4 12q-1-3 2-2l2 3V5q0-3 2-1v7-8q2-2 3 0v8-7q3-1 3 2v6-5q3-1 3 2v8l-3 4H8Z"/>'}
]
get('hand-tool-links').innerHTML=handTools.map(tool=>`<a class="tool-entry" href="${new URL(`#mode=${tool.mode}&tool=${tool.id}`,appRoot).href}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${tool.icon}</svg><strong>${tool.title}</strong><span>${tool.note}</span><i aria-hidden="true">↗</i></a>`).join('')
get('recommended-grid').innerHTML=pages.filter(page=>'recommended' in page&&page.recommended).map(page=>`<a href="${pageURL(page)}" class="recommended-card"><span>${page.tag}</span><h3>${page.title} <i aria-hidden="true">↗</i></h3><p>${page.description}</p><small>${page.version} · 保留平台</small></a>`).join('')
const quick=[{title:'理解总览图',path:'research/#overview'},{title:'手绘示例作品',path:'gallery/#examples'},{title:'历史作品与过程',path:'gallery/#history'},{title:'统一作品集',path:'gallery/'},{title:'手绘作品',path:'gallery/#type=hand'},{title:'照片作品',path:'gallery/#type=photo'},{title:'照片风格与情绪',path:'memories/#create'},{title:'雨窗实际成画',path:'memories/#study'},{title:'另一张照片的尝试',path:'memories/#postcard-study'},{title:'实拍手部小样',path:'memories/#hands'},{title:'照片与故事的短片',path:'memories/keepsake/'}]
get('quick-links').innerHTML=quick.map(link=>`<a href="${new URL(link.path,appRoot).href}">${link.title} ↗</a>`).join('')
get('filters').innerHTML=[['all','全部'],...Object.entries(groups)].map(([id,title])=>`<button data-group="${id}" aria-pressed="${id==='all'}">${title}</button>`).join('')
let group='all',query=''
function render(){
  const matches=pages.filter(page=>(group==='all'||group===page.group)&&[page.title,page.tag,page.description,page.version,groups[page.group]].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
  get('page-grid').innerHTML=matches.map(page=>`<article><a class="card-image" href="${pageURL(page)}" aria-label="进入 ${escape(page.title)}"><img src="${page.id==='gallery'?collectionPreview:media[page.image]}" width="1536" height="1024" loading="lazy" alt="${escape(page.caption)}"><span>${page.version}</span></a><div class="card-body"><p class="card-tag">${groups[page.group]} / ${page.tag}</p><h3>${page.title}</h3><p>${page.description}</p><small>${page.caption}</small><a href="${pageURL(page)}" class="card-link">进入 ${page.title} <span aria-hidden="true">↗</span></a></div></article>`).join('')
  get('result-count').textContent=`显示 ${matches.length} / ${pages.length} 个入口`
  get('empty').hidden=matches.length>0;get('clear').hidden=group==='all'&&!query
  document.querySelectorAll<HTMLButtonElement>('[data-group]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.group===group)))
}
get('filters').addEventListener('click',event=>{const button=(event.target as Element).closest<HTMLButtonElement>('[data-group]');if(button){group=button.dataset.group!;render()}})
get('search').addEventListener('input',()=>{query=get<HTMLInputElement>('search').value;render()})
get('clear').addEventListener('click',()=>{group='all';query='';get<HTMLInputElement>('search').value='';render()})
render()
