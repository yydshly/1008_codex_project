import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const data = JSON.parse(await readFile(path.join(root, 'app/overview/research.json'), 'utf8'));
const output = path.join(root, 'public/research');
await mkdir(output, { recursive: true });
const guide = await readFile(path.join(root, '../assets', data.meta.guide.file));
if (createHash('sha256').update(guide).digest('hex') !== data.meta.guide.sha256) throw new Error('引导图与固定原图不一致。');
for (const file of ['cover.jpg', 'edit-wall.jpg', 'place-item.jpg', 'official.jpg', data.meta.guide.file]) {
  await copyFile(path.join(root, '../assets', file), path.join(output, file));
}
await writeFile(path.join(output, 'research.json'), JSON.stringify(data, null, 2) + '\n');
const source = `${data.meta.upstream}/blob/${data.meta.commit}/`;
const items = (list, render) => list.map(render).join('\n\n');
const markdown = `# ${data.meta.title}

${data.meta.conclusion}

源码研究：${data.meta.commit}；运行包：${data.meta.runtimeVersion}；观察日期：${data.meta.observedAt}；整理日期：${data.meta.organizedAt}。

## 全面摘要

${items(data.summaryItems, item => `- **${item.title}**：${item.text}`)}

## 能力

${items(data.capabilities, item => `### ${item.title}\n\n${item.description}\n\n${item.tag}`)}

## 模块

${items(data.modules, item => `### ${item.name} · ${item.title}\n\n${item.role}\n\n${item.relation}\n\n状态：${item.status}。源码：[${item.path}](${source}${item.path})。`)}

## 原理

${items(data.steps, item => `### ${item.title} · ${item.package}\n\n${item.description}\n\n${item.result}`)}

2D 平面图直接投影同一场景节点数据，不从已三角化的 3D 网格反推房间。

住宅样板实际墙节点的简化字段：

\`\`\`json
${JSON.stringify(data.nodeExample, null, 2)}
\`\`\`

## 使用场景（用途分析）

${items(data.useCases, item => `### ${item.title}\n\n${item.audience}。${item.text}\n\n${item.support}`)}

## 复用路线

${items(data.reuseRoutes, item => `### ${item.title}\n\n${item.text}\n\n${item.status}。`)}

## 可扩展方向（待开发）

${items(data.extensions, item => `### ${item.title}\n\n基础：${item.basis}\n\n建设：${item.build}\n\n验收：${item.verify}\n\n推进：${item.phase}。`)}

## 边界

${items(data.limits, item => `- ${item}`)}

## 原图与来源

引导图沿用 2026-10-08 生成的完整 PNG，${data.meta.guide.width} × ${data.meta.guide.height}，SHA-256：${data.meta.guide.sha256}。它是依据实际截图与研究生成的 AI 信息图，使用场景与价值属于分析。

${items(data.references, item => `- [${item.title}](${source}${item.path})`)}
`;
await writeFile(path.join(output, 'understanding.md'), markdown);
console.log('研究发布资料已准备：固定引导图、4 张真实截图、JSON 与 Markdown。');
