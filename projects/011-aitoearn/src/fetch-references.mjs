// 本项目原创研究工具。只获取固定提交的公开参考资料；不执行上游代码。
import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const commit = '3581f511293236044e56fad67958cfcea0def6b5';
const upstream = path.join(root, 'upstream');
await mkdir(upstream, { recursive: true });
async function fetchBuffer(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'AiToEarn-research' }, signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`${response.status}: ${url}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) { if (attempt === 2) throw error; }
  }
}
const treeFile = path.join(upstream, 'tree.json');
let tree;
try { tree = JSON.parse(await readFile(treeFile, 'utf8')); }
catch { tree = JSON.parse((await fetchBuffer(`https://api.github.com/repos/yikart/AiToEarn/git/trees/${commit}?recursive=1`)).toString()); await writeFile(treeFile, JSON.stringify(tree)); }
const ai = 'project/aitoearn-backend/apps/aitoearn-ai/src/core/';
const server = 'project/aitoearn-backend/apps/aitoearn-server/src/core/';
const exact = [
  'README.md', 'LICENSE', 'DOCKER_DEPLOYMENT_CN.md', 'docker-compose.yml',
  'project/aitoearn-web/package.json', 'project/aitoearn-backend/apps/aitoearn-ai/package.json',
  'project/aitoearn-backend/libs/aitoearn-ai-shared/src/dtos/draft-generation.dto.ts',
  'project/aitoearn-backend/libs/aitoearn-queue/package.json',
  'project/aitoearn-web/src/store/plugin/plats/douyin/index.ts',
  'project/aitoearn-web/src/store/plugin/plats/xhs/index.ts',
  'project/aitoearn-web/src/store/plugin/plats/README.md',
  'project/aitoearn-web/src/api/materials/material.types.ts',
  'project/aitoearn-web/src/app/[lng]/ai-social/components/PromptGallery/data.ts',
  'project/aitoearn-electron/server/src/modules/task/user-task.service.ts',
  'project/aitoearn-electron/server/src/modules/finance/finance.service.ts',
  ...['agent/agent.constants.ts','agent/services/agent-runtime.service.ts','agent/claude-code-router/claude-code-router.service.ts','agent/skill-init.service.ts','draft-generation/draft-generation.service.ts','draft-generation/draft-generation-planner.service.ts','draft-generation/draft-generation-memory.service.ts','draft-generation/draft-generation-platforms.ts'].map(x => ai+x),
  ...['channels/mcp/channels.mcp.controller.ts','channels/accounts/account-group.service.ts','channels/analytics/analytics.vo.ts','channels/engagement/engagement.service.ts','channels/media/media.service.ts','channels/platforms/platforms.interface.ts','channels/publish/tasks/publish-task.service.ts','channels/publish/tasks/publish-queue.service.ts','channels/publish/flows/publish-flow.service.ts','channels/platforms/douyin/douyin-publish.provider.ts','channels/platforms/rednote/rednote-publish.provider.ts','channels/platforms/twitter/twitter-engagement.provider.ts','content/content.mcp.controller.ts','unified-mcp/draft-generation.mcp.controller.ts'].map(x=>server+x),
];
const paths = tree.tree.filter(x=>x.type==='blob' && (exact.includes(x.path) || (x.path.startsWith(ai+'agent/skills/') && x.path.endsWith('/SKILL.md')) || (x.path.startsWith(ai+'agent/mcp/') && !x.path.includes('.spec.') && x.path.endsWith('.mcp.ts')) || (x.path.startsWith(server+'channels/platforms/') && x.path.endsWith('.constants.ts')))).map(x=>x.path);
const assets = [
 ['presentation/display-1.5.2png.png','author-create.png'],
 ['presentation/publish-cn.png','author-publish.png'],
 ['presentation/channel-cn.png','author-channels.png'],
 ['presentation/engage-thumbnail-cn.png','author-engage.png'],
 ['presentation/monetize-cn.png','author-monetize.png'],
 ['project/aitoearn-web/public/assets/promptGallery/cover01.png','example-restaurant.png'],
];
const items = [...paths.map(source=>({ source, target:path.join(upstream, source), kind:'reference' })), ...assets.map(([source,name])=>({source,target:path.join(root,'assets',name),kind:'asset'}))];
const records=[];
let cursor=0;
await Promise.all(Array.from({length:6},async()=>{
 while(cursor<items.length) {
  const item=items[cursor++]; let bytes;
  try { bytes=await readFile(item.target); } catch { bytes=await fetchBuffer(`https://raw.githubusercontent.com/yikart/AiToEarn/${commit}/${encodeURI(item.source)}`); await mkdir(path.dirname(item.target),{recursive:true}); await writeFile(item.target,bytes); }
  records.push({path:item.source,kind:item.kind,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),url:`https://github.com/yikart/AiToEarn/blob/${commit}/${encodeURI(item.source)}`,local:path.relative(root,item.target).replaceAll('\\','/')});
 }
}));
records.sort((a,b)=>a.path.localeCompare(b.path));
await writeFile(path.join(root,'src/source-manifest.json'),JSON.stringify({repository:'https://github.com/yikart/AiToEarn',commit,researchDate:'2026-10-09',records},null,2)+'\n');
await copyFile(path.join(upstream,'LICENSE'),path.join(root,'src/LICENSE.upstream.txt'));
console.log(`固定版本资料已保存：${paths.length} 份参考文件、${assets.length} 张真实上游图片。`);
