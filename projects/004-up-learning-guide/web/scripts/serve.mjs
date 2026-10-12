// 独立的本机静态预览服务；只暴露指定目录与子路径。
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const options = new Map();
for (let i=2;i<process.argv.length;i+=2) {
  if (!['--dir','--port','--base'].includes(process.argv[i]) || !process.argv[i+1]) throw new Error('参数：--dir <目录> --port <端口> --base <子路径>');
  options.set(process.argv[i], process.argv[i+1]);
}
const root = path.resolve(fileURLToPath(new URL('../',import.meta.url)), options.get('--dir') || 'dist');
const port = Number(options.get('--port') || 4194);
const base = options.get('--base') || '/';
if (!base.startsWith('/') || !base.endsWith('/') || !Number.isInteger(port) || port<1 || port>65535) throw new Error('无效端口或子路径');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
http.createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,`http://127.0.0.1:${port}`);
    if (base!=='/' && url.pathname===base.slice(0,-1)) { res.writeHead(302,{location:base});res.end();return; }
    if (!url.pathname.startsWith(base)) { res.writeHead(404);res.end('Not found');return; }
    const file=path.resolve(root,decodeURIComponent(url.pathname.slice(base.length)) || 'index.html');
    if (file!==root && !file.startsWith(root+path.sep)) {res.writeHead(403);res.end('Forbidden');return;}
    if (!(await fs.stat(file)).isFile()) throw Object.assign(new Error(),{code:'ENOENT'});
    const data=await fs.readFile(file);
    res.writeHead(200,{'content-type':types[path.extname(file)] || 'application/octet-stream','cache-control':'no-cache'});
    res.end(req.method==='HEAD'?undefined:data);
  }catch(error){res.writeHead(error.code==='ENOENT'?404:400);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Up 知识地图：http://127.0.0.1:${port}${base}`)).on('error',error=>{console.error(error.message);process.exitCode=1;});
