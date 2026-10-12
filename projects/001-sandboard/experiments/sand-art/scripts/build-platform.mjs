import { spawn } from 'node:child_process'
import { cp, mkdir, readFile, rm, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app=fileURLToPath(new URL('../',import.meta.url))
const upstream=path.resolve(app,'../../web')
async function build(cwd){
  await new Promise((resolve,reject)=>{
    const child=process.platform==='win32'
      ?spawn(process.env.ComSpec??'cmd.exe',['/d','/s','/c','npm.cmd run build'],{cwd,stdio:'inherit',windowsHide:true})
      :spawn('npm',['run','build'],{cwd,stdio:'inherit'})
    child.on('error',reject)
    child.on('exit',code=>code===0?resolve():reject(new Error(`构建失败: ${cwd} (${code})`)))
  })
}
if(!process.argv.includes('--pack-only')){await build(upstream);await build(app)}
await access(path.join(upstream,'dist/index.html'));await access(path.join(app,'dist/home/index.html'))
const cache=path.resolve(app,'.cache'),site=path.resolve(cache,'platform-site')
// Only replace this named, generated directory; never remove source builds or assets.
if(path.dirname(site)!==cache||path.basename(site)!=='platform-site')throw new Error('生成目录路径不符合预期')
await rm(site,{recursive:true,force:true});await mkdir(site,{recursive:true})
await cp(path.join(upstream,'dist'),path.join(site,'original'),{recursive:true})
await cp(path.join(app,'dist'),path.join(site,'art'),{recursive:true})
await cp(path.join(upstream,'LICENSE'),path.join(site,'original/LICENSE'))
await cp(path.join(app,'LICENSE'),path.join(site,'art/LICENSE'))
const originalIndex=path.join(site,'original/index.html')
const originalHtml=await readFile(originalIndex,'utf8')
if(!originalHtml.includes('name="sand-platform-root" content="./art/"'))throw new Error('原版构建缺少平台路径提示')
await writeFile(originalIndex,originalHtml.replace('name="sand-platform-root" content="./art/"','name="sand-platform-root" content="../art/"'))
await writeFile(path.join(site,'index.html'),`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=./art/home/"><title>光阴沙画 · 平台首页</title></head><body><h1>光阴沙画</h1><p><a href="./art/home/">打开平台首页</a> · <a href="./art/memories/">照片作品</a> · <a href="./original/">原版沙盘</a> · <a href="./art/research/">研究历程</a></p></body></html>`)
console.log('统一站点已构建：平台首页 + 15 个功能页，原有 art/ 路径保留。')
