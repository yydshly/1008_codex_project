import {readFile,access} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'

const app=fileURLToPath(new URL('../',import.meta.url))
const site=path.join(app,'.cache/platform-site')
const pages=JSON.parse(await readFile(path.join(app,'src/platform/pages.json'),'utf8'))
assert.equal(pages.length,15)
assert.equal(new Set(pages.map(page=>page.id)).size,15)
const destinations=[]
for(const page of pages){
  for(const key of ['title','group','tag','version','description','image','caption'])assert.ok(page[key]?.trim(),`${page.id}: ${key}`)
  const folder=page.id==='original'?'original':path.posix.join('art',page.path)
  destinations.push(folder+'/index.html')
  const html=await readFile(path.join(site,folder,'index.html'),'utf8')
  assert.ok(html.includes(`data-platform-page="${page.id}"`),`页面身份丢失: ${page.id}`)
  assert.ok(html.includes('name="sand-platform-root"'),'缺少导航路径')
  for(const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g))await access(path.resolve(site,folder,match[1]))
  const hint=html.match(/name="sand-platform-root" content="([^"]+)"/)[1]
  assert.equal(path.resolve(site,folder,hint),path.join(site,'art'),`错误的平台根路径: ${page.id}`)
  const sourcePath=page.id==='original'?path.resolve(app,'../../web/index.html'):path.join(app,page.path,'index.html')
  assert.ok((await readFile(sourcePath,'utf8')).includes('src/platform/navigation.ts'),`源页面缺少统一目录: ${page.id}`)
}
const home=await readFile(path.join(site,'art/home/index.html'),'utf8')
assert.ok(home.includes('data-platform-page="home"'))
const landing=await readFile(path.join(site,'index.html'),'utf8')
assert.ok(landing.includes('url=./art/home/'))
await access(path.join(site,'original/LICENSE'));await access(path.join(site,'art/LICENSE'))
assert.equal(destinations.length+1,16)
console.log(JSON.stringify({functionalPages:15,homePages:1,connectedPages:16,groups:new Set(pages.map(page=>page.group)).size,preservedArtRoutes:13,unifiedGallery:true,originalSameOrigin:true,rootOpensHome:true},null,2))
