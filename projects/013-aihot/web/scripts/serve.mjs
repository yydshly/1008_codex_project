// Local-only static preview with an explicit deployment subpath.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const options = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  if (!['--dir','--port','--base'].includes(process.argv[i]) || !process.argv[i+1]) throw new Error('参数：--dir <目录> --port <端口> --base <子路径>');
  options.set(process.argv[i],process.argv[i+1]);
}
const root = path.resolve(fileURLToPath(new URL('../',import.meta.url)),options.get('--dir') ?? 'dist');
const port = Number(options.get('--port') ?? 4213);
const base = options.get('--base') ?? '/1008_codex_project/013-aihot/';
if (!base.startsWith('/') || !base.endsWith('/') || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('无效端口或子路径。');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.csv':'text/csv; charset=utf-8'};
const server = http.createServer(async(request,response) => {
  try {
    const url = new URL(request.url,`http://127.0.0.1:${port}`);
    if (base !== '/' && url.pathname === base.slice(0,-1)) { response.writeHead(302,{location:base}); response.end(); return; }
    if (!url.pathname.startsWith(base)) { response.writeHead(404); response.end('Not found'); return; }
    let file = path.resolve(root,decodeURIComponent(url.pathname.slice(base.length)) || 'index.html');
    if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403); response.end('Forbidden'); return; }
    if ((await stat(file)).isDirectory()) file = path.join(file,'index.html');
    const bytes = await readFile(file);
    response.writeHead(200,{'content-type':mime[path.extname(file)] ?? 'application/octet-stream','cache-control':'no-cache'});
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch(error) {response.writeHead(error.code === 'ENOENT' ? 404 : 400);response.end('Not found');}
});
server.on('error',error => {console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',() => console.log(`AIHOT 研究预览：http://127.0.0.1:${port}${base}`));
