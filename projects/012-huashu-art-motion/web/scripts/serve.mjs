// 原创预览服务，只监听回环地址，使用相对资源验证完整发布子路径。
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const args = process.argv.slice(2);
const option = (key, fallback) => { const i=args.indexOf(key); return i<0?fallback:args[i+1]; };
const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(web, option('--dir','dist'));
const port = Number(option('--port','4212'));
const base = option('--base','/1008_codex_project/012-huashu-art-motion/');
if (!base.startsWith('/') || !base.endsWith('/') || !Number.isInteger(port)) throw new Error('无效端口或子路径');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.gif':'image/gif','.woff':'font/woff','.mp4':'video/mp4','.wav':'audio/wav','.m4a':'audio/mp4','.mp3':'audio/mpeg'};
const server = http.createServer(async (req,res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
    const url=new URL(req.url,'http://127.0.0.1:'+port);
    if(url.pathname===base.slice(0,-1)){res.writeHead(302,{location:base});res.end();return;}
    if(!url.pathname.startsWith(base)){res.writeHead(404);res.end('Not found');return;}
    let file=path.resolve(root,decodeURIComponent(url.pathname.slice(base.length))||'index.html');
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    const bytes=await readFile(file);
    const headers={'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-cache','x-content-type-options':'nosniff','accept-ranges':'bytes'};
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if(range){const start=Number(range[1]),end=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);if(start> end||start>=bytes.length){res.writeHead(416,{'content-range':`bytes */${bytes.length}`});res.end();return;}res.writeHead(206,{...headers,'content-range':`bytes ${start}-${end}/${bytes.length}`,'content-length':end-start+1});res.end(req.method==='HEAD'?undefined:bytes.subarray(start,end+1));return;}
    res.writeHead(200,{...headers,'content-length':bytes.length});
    res.end(req.method==='HEAD'?undefined:bytes);
  } catch(error) {res.writeHead(error.code==='ENOENT'?404:400);res.end('Not found');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`艺术动画研究：http://127.0.0.1:${port}${base}`));
