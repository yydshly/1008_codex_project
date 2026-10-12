import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(projectRoot, 'out');
const base = (process.env.PASCAL_BASE_PATH ?? '/1008_codex_project/003-pascal-editor').replace(/\/$/, '');
const port = Number(process.env.PORT ?? 4187);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.ktx2': 'image/ktx2', '.wasm': 'application/wasm', '.hdr': 'application/octet-stream', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
if (!fs.existsSync(path.join(outputRoot, 'index.html'))) throw new Error('缺少生产产物，请先运行 npm run build。');

http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/' || pathname === base) {
    response.writeHead(302, { Location: `${base}/` }); response.end(); return;
  }
  if (!pathname.startsWith(`${base}/`)) { response.writeHead(404); response.end('Not found'); return; }
  let relative;
  try { relative = decodeURIComponent(pathname.slice(base.length + 1)); }
  catch { response.writeHead(400); response.end('Bad URL'); return; }
  const filePath = path.resolve(outputRoot, relative || '.');
  if (filePath !== outputRoot && !filePath.startsWith(`${outputRoot}${path.sep}`)) { response.writeHead(403); response.end('Forbidden'); return; }
  const target = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory() ? path.join(filePath, 'index.html') : filePath;
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'Content-Type': types[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
  if (request.method === 'HEAD') response.end(); else fs.createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`Pascal 展示：http://127.0.0.1:${port}${base}/`));
