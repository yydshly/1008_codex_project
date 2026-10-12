// Aggregate independently built projects; the root has no frontend dependencies.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { ROOT, readCatalog, validateCatalog, projectDirectory } from './catalog.mjs';

const projects = validateCatalog(readCatalog());
const project = projects.find(project => project.id === '001' && project.slug === 'sandboard');
if (!project) throw new Error('发布清单缺少 001 Sandboard。');
const directory = projectDirectory(project);
const app = path.join(ROOT, directory, 'experiments/sand-art');
await new Promise((resolve, reject) => {
  const script = path.join(app, 'scripts/build-platform.mjs');
  const child = spawn(process.execPath, [script, ...(process.argv.includes('--pack-only') ? ['--pack-only'] : [])], { stdio: 'inherit', windowsHide: true });
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`子项目构建失败 (${code})`)));
});
const site = path.resolve(ROOT, '.cache/pages-site');
if (path.dirname(site) !== path.resolve(ROOT, '.cache') || path.basename(site) !== 'pages-site') throw new Error('发布目录越界。');
await rm(site, { recursive: true, force: true });
await mkdir(path.join(site, 'assets'), { recursive: true });
await cp(path.join(app, '.cache/platform-site'), path.join(site, '001-sandboard'), { recursive: true });
await cp(path.join(ROOT, project.cover), path.join(site, 'assets/original.jpg'));
await cp(path.join(ROOT, directory, 'assets/understanding/preview.jpg'), path.join(site, 'assets/understanding.jpg'));
const research = JSON.parse(await readFile(path.join(ROOT, directory, 'assets/understanding/publication.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const repository = 'https://github.com/yydshly/1008_codex_project';
const entrance = './001-sandboard/';
const links = research.entries.map(entry => `<a class="entry" href="${entrance}${escape(entry.path)}"><strong>${escape(entry.label)} ↗</strong><span>${escape(entry.note)}</span></a>`).join('');
const sections = research.sections.map((section, index) => `<article><span class="number">0${index + 1}</span><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></article>`).join('');
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(project.summary)}"><title>Sandboard · 沙画研究与产品探索</title><style>
:root{color-scheme:dark;font-family:system-ui,"Microsoft YaHei",sans-serif;background:#141310;color:#ece5d7}*{box-sizing:border-box}body{margin:0}main{max-width:1200px;margin:auto;padding:36px 28px 70px}a{color:#f0c37d;text-decoration:none}a:hover{text-decoration:underline}nav{display:flex;gap:20px;justify-content:space-between;font-size:14px;border-bottom:1px solid #393328;padding-bottom:22px}.eyebrow{color:#cfaa72;font-size:13px;letter-spacing:.16em;margin-top:50px}h1{font-size:clamp(32px,5vw,58px);line-height:1.2;max-width:850px;margin:20px 0}p{line-height:1.9;color:#c9c0ae}.lead{max-width:900px;font-size:18px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0 40px}.button{padding:13px 18px;border:1px solid #807052;border-radius:6px}.button.primary{background:#e1b673;color:#201a11;border-color:#e1b673}.table-wrap{overflow:auto;border:1px solid #454033;border-radius:8px}table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.8}th,td{text-align:left;padding:16px;vertical-align:top;border-bottom:1px solid #393328}th{color:#b5a787;background:#211e18}td.summary{min-width:310px}.visual{display:grid;grid-template-columns:1.15fr 1fr;gap:28px;margin:35px 0}figure{margin:0;border:1px solid #393328;padding:12px;border-radius:8px;background:#1b1915}figure img{display:block;width:100%;height:auto;border-radius:4px}figcaption{color:#a89d89;line-height:1.8;font-size:13px;margin-top:12px}.guide-frame{display:block;max-height:490px;overflow:hidden;border-radius:4px}.guide-frame img{width:100%;height:auto}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.entry{display:flex;flex-direction:column;gap:12px;border:1px solid #494033;border-radius:8px;padding:20px;background:#201c16}.entry span{font-size:13px;line-height:1.7;color:#b6aa97}.number{font-size:13px;color:#cba972}article{border-top:1px solid #393328;padding:25px 0 13px;margin-top:24px}article h2{font-size:23px;margin:12px 0}footer{border-top:1px solid #393328;margin-top:40px;padding-top:24px;color:#958b79;font-size:13px;line-height:1.9}@media(max-width:700px){main{padding:24px 17px 45px}.visual,.grid{grid-template-columns:1fr}.eyebrow{margin-top:35px}.lead{font-size:16px}.guide-frame{max-height:420px}nav{font-size:12px;gap:10px}}
</style></head><body><main><nav><span>GitHub 项目研究集 / 001</span><a href="${repository}">仓库与研究文档 ↗</a></nav><div class="eyebrow">WEBGPU · MATERIAL · SAND ART</div><h1>${escape(research.title)}</h1><p class="lead">${escape(research.intro)}</p><div class="actions"><a class="button primary" href="${entrance}art/home/">进入光阴沙画平台 ↗</a><a class="button" href="${entrance}art/research/#overview">放大阅读完整总览图</a><a class="button" href="${escape(project.upstream)}">源库 Sandboard</a></div><div class="table-wrap"><table><thead><tr><th>编号 / 研究</th><th>源库</th><th>摘要</th><th>Web 演示</th></tr></thead><tbody><tr><td>001<br><a href="${repository}/blob/main/${directory}/README.md">${escape(project.name)}</a></td><td><a href="${escape(project.upstream)}">Sandboard</a></td><td class="summary">${escape(project.summary)}</td><td><a href="${entrance}">打开平台</a></td></tr></tbody></table></div><div class="visual"><figure><a href="${entrance}original/"><img src="./assets/original.jpg" alt="${escape(project.coverAlt)}"></a><figcaption>${escape(project.coverCaption)}<br><a href="${entrance}original/">操作 Sandboard 原版效果 ↗</a></figcaption></figure><figure><a class="guide-frame" href="${entrance}art/research/#overview"><img src="./assets/understanding.jpg" alt="Sandboard 能力、原理、输入输出、历史探索与七类产品方向的完整总览图"></a><figcaption>${escape(research.guideCaption)}<br><a href="${entrance}art/research/#overview">展开全部七个章节与高清图 ↗</a></figcaption></figure></div><h2>先看效果，再看研究</h2><div class="grid">${links}</div>${sections}<footer>研究基线：<a href="${escape(project.upstream)}/tree/${research.baseline}">${research.baseline}</a><br>上游和对应衍生代码遵循 ${escape(research.license)}；照片、手部与其他引用素材分别保留署名。AI 目标和材料概念图明确标注。<br><a href="${repository}/blob/main/${directory}/experiments/sand-art/ATTRIBUTION.md">来源、许可与改动范围</a> · <a href="${repository}/blob/main/docs/DEPLOYMENT.md">构建与发布方式</a></footer></main></body></html>`;
await writeFile(path.join(site, 'index.html'), html);
await writeFile(path.join(site, '.nojekyll'), '');
console.log(`发布站点：${site}；总入口 + Sandboard 十六页，所有原版路径保留。`);
