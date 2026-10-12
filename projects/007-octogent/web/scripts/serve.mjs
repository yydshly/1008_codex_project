// 本项目原创、本机静态服务；支持完整部署子路径。
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  if (!['--dir', '--port', '--base'].includes(process.argv[i]) || !process.argv[i + 1]) throw new Error('参数：--dir、--port、--base');
  args.set(process.argv[i], process.argv[i + 1]);
}
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)), args.get('--dir') ?? '.');
const projectAssets = path.resolve(root, '../assets');
const port = Number(args.get('--port') ?? 4193);
const base = args.get('--base') ?? '/';
if (!base.startsWith('/') || !base.endsWith('/') || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('端口或子路径无效');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    if (url.pathname === base.slice(0, -1)) { response.writeHead(302, { location: base }); response.end(); return; }
    if (!url.pathname.startsWith(base)) { response.writeHead(404); response.end('Not found'); return; }
    const relative = decodeURIComponent(url.pathname.slice(base.length)) || 'index.html';
    let file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403); response.end('Forbidden'); return; }
    if (args.get('--dir') === '.' && relative.startsWith('assets/')) {
      file = path.resolve(projectAssets, relative.slice(7));
      if (!file.startsWith(projectAssets + path.sep)) { response.writeHead(403); response.end('Forbidden'); return; }
    }
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const buffer = await readFile(file);
    response.writeHead(200, { 'content-type': mime[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
    response.end(request.method === 'HEAD' ? undefined : buffer);
  } catch (error) { response.writeHead(error.code === 'ENOENT' ? 404 : 400); response.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Octogent 研究页：http://127.0.0.1:${port}${base}`));
