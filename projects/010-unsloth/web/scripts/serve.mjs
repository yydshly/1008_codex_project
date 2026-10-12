import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const root = path.resolve(option('--dir', 'dist'));
const port = Number(option('--port', '4197'));
const rawBase = option('--base', '/1008_codex_project/010-unsloth/');
const base = `/${rawBase.split('/').filter(Boolean).join('/')}/`;
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('端口必须是 1～65535 的整数');
await stat(path.join(root, 'index.html'));
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
};
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/' || pathname === base.slice(0, -1)) {
      res.writeHead(302, { Location: base }).end();
      return;
    }
    if (!pathname.startsWith(base)) { res.writeHead(404).end('Not found'); return; }
    const relative = pathname.slice(base.length) || 'index.html';
    const file = path.resolve(root, relative);
    const inside = path.relative(root, file);
    if (inside.startsWith('..') || path.isAbsolute(inside)) { res.writeHead(403).end('Forbidden'); return; }
    if (!(await stat(file)).isFile()) { res.writeHead(404).end('Not found'); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : 404).end(error instanceof URIError ? 'Bad request' : 'Not found');
  }
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Unsloth 研究网页：http://127.0.0.1:${port}${base}`);
  console.log(`生产产物：${root}`);
});
