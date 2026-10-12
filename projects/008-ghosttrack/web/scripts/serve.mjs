// 本项目原创本地预览服务。只绑定 127.0.0.1，支持完整子路径，不提供信息查询接口。
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  if (!['--dir', '--port', '--base'].includes(process.argv[i]) || !process.argv[i + 1]) throw new Error('参数：--dir、--port、--base');
  args.set(process.argv[i], process.argv[i + 1]);
}
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)), args.get('--dir') ?? 'dist');
const port = Number(args.get('--port') ?? 4195);
const base = args.get('--base') ?? '/1008_codex_project/008-ghosttrack/';
if (!base.startsWith('/') || !base.endsWith('/') || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('端口或子路径无效');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png' };
http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    if (base !== '/' && url.pathname === base.slice(0, -1)) { response.writeHead(302, { location: base }); response.end(); return; }
    if (!url.pathname.startsWith(base)) { response.writeHead(404); response.end('Not found'); return; }
    const relative = decodeURIComponent(url.pathname.slice(base.length)) || 'index.html';
    let file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403); response.end('Forbidden'); return; }
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': mime[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) { response.writeHead(error.code === 'ENOENT' ? 404 : 400); response.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`GhostTrack 研究页：http://127.0.0.1:${port}${base}`));
