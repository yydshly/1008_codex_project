// 本项目原创静态预览服务；仅监听本机，支持完整子路径和目录入口。
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const args = new Map();
for (let index=2;index<process.argv.length;index+=2) {
  if(!['--dir','--port','--base'].includes(process.argv[index])||!process.argv[index+1]) throw new Error('参数：--dir、--port、--base');
  args.set(process.argv[index],process.argv[index+1]);
}
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)),args.get('--dir')??'.');
const port=Number(args.get('--port')??4191); const base=args.get('--base')??'/';
if(!base.startsWith('/')||!base.endsWith('/')||!Number.isInteger(port)||port<1||port>65535)throw new Error('无效端口或子路径');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webm':'video/webm','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(request,response)=>{
  try {
    const url=new URL(request.url,`http://127.0.0.1:${port}`);
    if(base!=='/'&&url.pathname===base.slice(0,-1)){response.writeHead(302,{location:base});response.end();return;}
    if(!url.pathname.startsWith(base)){response.writeHead(404);response.end('Not found');return;}
    let file=path.resolve(root,decodeURIComponent(url.pathname.slice(base.length))||'index.html');
    if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403);response.end('Forbidden');return;}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    const buffer=await readFile(file);response.writeHead(200,{'content-type':mime[path.extname(file)]??'application/octet-stream','cache-control':'no-cache'});response.end(request.method==='HEAD'?undefined:buffer);
  }catch(error){response.writeHead(error.code==='ENOENT'?404:400);response.end('Not found');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Three.js 技能研究：http://127.0.0.1:${port}${base}\n目录：${root}`));
