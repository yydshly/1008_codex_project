// 生成自包含的可编辑图源；读取本项目已有的原创架构 SVG。
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createOverviewHtml } from '../overview.js';
const assets = new URL('../../assets/',import.meta.url);
const svg = await readFile(new URL('architecture-system.svg',assets),'utf8');
await writeFile(new URL('cove-overview.html',assets),createOverviewHtml(svg));
console.log('总览图图源：'+fileURLToPath(new URL('cove-overview.html',assets)));
