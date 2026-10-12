// 汇总登记使用网页同源内容；只改 012 与明确归属的文档块。
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {summaryItems,overviewItems,guide,renderMarkdown} from '../web/publication.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=path.resolve(project,'../..');
export const publicBase='https://yydshly.github.io/1008_codex_project/012-huashu-art-motion/';
const file=path.join(root,'projects.json'),catalog=JSON.parse(await readFile(file,'utf8'));
const entry=catalog.projects.find(p=>p.id==='012');
if(!entry)throw new Error('012 尚未登记');
let verified;
try{verified=JSON.parse(await readFile(path.join(project,'src/publication-verification.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(verified&&(!verified.passed||verified.base!==publicBase))throw new Error('公开发布记录无效');
Object.assign(entry,{
 summary:'AI 理解内容并选择画风与表达方式，Skill 和现成工程组织绘画、动画、合成与出片；完整汇总九项能力、35 风格、九种解说、17 代码库、机制、场景、模型对比、复用及八个扩展方向，沿用原始引导图和真实效果。',
 summaryItems,overviewItems,
 cover:'projects/012-huashu-art-motion/'+guide.file,
 coverFull:'projects/012-huashu-art-motion/'+guide.file,
 coverAlt:'Huashu 完整能力与价值引导图：原版艺术效果、Skill 制作链路、能力、风格、解说、场景、模型对比与扩展方向',
 coverCaption:'沿用 2026-10-09 生成的完整 3200×8524 PNG，2026-10-12 整理发布，原图字节与 SHA-256 保持不变。图含固定上游代码静帧与作者解说研究截图；网页补全模块、机制、复用和八条扩展路线，事实、独立制作与建议分别说明。',
 status:'已完成',
});
if(verified)entry.demo=publicBase;
await writeFile(file,JSON.stringify(catalog,null,2)+'\n');
const upsert=(text,name,body)=>{
 const start='<!-- '+name+':START -->',end='<!-- '+name+':END -->',block=start+'\n'+body.trim()+'\n'+end+'\n';
 const a=text.indexOf(start),b=text.indexOf(end);
 return a>=0&&b>a?text.slice(0,a)+block+text.slice(b+end.length).replace(/^\r?\n/,''):text.replace(/^(# [^\n]+\n)/,'$1\n'+block+'\n');
};
const readmeFile=path.join(project,'README.md');let readme=await readFile(readmeFile,'utf8');
const links=`[完整研究网页](${publicBase}) · [高清图与完整理解](${publicBase}overview/) · [七部新增作品](${publicBase}scenarios/) · [原图](assets/understanding/overview.png)`;
const publicationNote=verified?`公开网页已实际核验；${verified.browserChecks} 项真实浏览器检查、${verified.httpChecks} 项页面与媒体检查通过，既有项目入口正常，原图哈希一致。部署运行：[${verified.runId}](${verified.runUrl})。详见 [发布记录](src/publication-verification.json)、[HTTP 明细](src/public-http-checks.json)、[浏览器明细](src/public-browser-checks.json)。`:'本次已接入统一构建；公开 demo 仅在实际部署并核验后登记。';
readme=upsert(readme,'HUASHU_PUBLICATION',links+'\n\n'+publicationNote+'\n\n'+renderMarkdown());
// 原研究日期、内容、验证记录保留；查看入口与实际发布目标保持一致。
readme=readme.replaceAll('http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/overview/',publicBase+'overview/').replaceAll('[打开应用作品集](http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/scenarios/)','[打开应用作品集]('+publicBase+'scenarios/)');
await writeFile(readmeFile,readme);
const docFile=path.join(root,'docs/DEPLOYMENT.md');
const body=`## Huashu 完整理解、原始引导图与场景效果（2026-10-12）\n\n012 沿用现有 GitHub Pages Actions，保留其余项目独立构建和入口。发布中文静态研究、35 个原版 Canvas 场景、九种解说资料和七部独立制作的 30 秒 1080p 作品。网页本身不调用模型或语音服务。\n\n内容包含十二项摘要、六段图前引导、九项能力、九个职责模块、17 个代码库、六个制作机制、六类场景、四条复用路线和八个扩展方向。每个扩展写明输入、交付目标、新增工程和验收依据。事实按上游 57d67608ab458f57d9b153b1a2831b921e22498b 核对；价值与模型提升影响是研究判断，尚无同模型对照收益。\n\n沿用 ${guide.file}，${guide.width}×${guide.height}，${guide.bytes} 字节，SHA-256：${guide.sha256}。不重新生成、裁切或覆盖原图。overview/ 支持 100%–400% 缩放、下载、手机与无脚本文字阅读；补全的模块、原理和复用说明不改变既有图。\n\n~~~powershell\nnpm.cmd run build --prefix projects/012-huashu-art-motion/web\nnpm.cmd run check --prefix projects/012-huashu-art-motion/web\nnpm.cmd run index:build\nnpm.cmd run check\nnpm.cmd test\nnpm.cmd run build:site\nnode scripts/validate-site.mjs\n~~~\n\nNode.js 22+，012 独立网页没有第三方依赖，无需 npm ci。完整 web/dist/ 复制至 .cache/pages-site/012-huashu-art-motion/；所有页面、字体和媒体采用相对资源路径。CI 检查摘要同源、固定引擎完整性、原图字节、35 场景、七部 MP4、脚本语法与 HTML 资源。真实浏览器核验另见 src/verify-publication.mjs。\n\nMIT 代码与文档、OFL 字体分别保留许可；作者人物与解说素材仅作 Skill 示范研究，配乐保留 Kevin MacLeod / CC BY 4.0 署名。新增美术与作品是本研究独立制作，不能作为原库稳定品质优势证据。\n\n${publicationNote}\n\n${links}`;
let deployment=upsert(await readFile(docFile,'utf8'),'HUASHU_PUBLICATION',body.replace('[原图](assets/understanding/overview.png)','[原图](../projects/012-huashu-art-motion/assets/understanding/overview.png)'));
for(const file of ['publication-verification.json','public-http-checks.json','public-browser-checks.json'])deployment=deployment.replace('(src/'+file+')','(../projects/012-huashu-art-motion/src/'+file+')');
deployment=deployment.replace(/## 012 · Huashu 艺术动画与风格研究[\s\S]*?(?=### 001 ·|$)/,
 '## 012 · Huashu 艺术动画与风格研究\n\n'+
 '[完整发布说明见本文开头](#huashu-完整理解原始引导图与场景效果2026-10-12)。本地可用 `npm.cmd run preview --prefix projects/012-huashu-art-motion/web`，默认 http://127.0.0.1:4212/1008_codex_project/012-huashu-art-motion/ 。完整 dist/ 发布至 .cache/pages-site/012-huashu-art-motion/，保留 engine/、assets/、data/、研究文档和许可。\n\n'+
 '历史研究记录（2026-10-09）：35 个场景、34 个转场、七部实际影片与 37 项原图阅读流程已分别验证。新增作品是本研究独立制作，媒体来源与配乐署名保留；其品质不能全部归因于原库。2026-10-12 发布核验、全面摘要及后续状态以本文开头的 HUASHU_PUBLICATION 记录为准。\n\n');
await writeFile(docFile,deployment);
console.log('012 完整摘要、原图登记、研究文档与发布说明已同步。');
