import { publication, guide } from '../publication.mjs';
import { source } from '../content.js';
export const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const section = (id,label,title,intro,body) => '<section id="'+id+'"><div class="section-heading"><div><span class="eyebrow">'+label+'</span><h2>'+title+'</h2></div><p>'+intro+'</p></div>'+body+'</section>';
const cards = (items,type) => '<div class="publication-grid">'+items.map(item=>'<article class="publication-card" data-'+type+'><h3>'+escape(item.title)+'</h3><p>'+escape(item.text)+'</p>'+(item.entry?'<p class="card-detail"><b>接入位置</b>'+escape(item.entry)+'</p>':'')+(item.acceptance?'<p class="card-detail"><b>建议验收</b>'+escape(item.acceptance)+'</p>':'')+(item.files?'<div class="source-links">'+item.files.map(file=>'<a href="'+escape(source(file))+'" target="_blank" rel="noopener noreferrer">'+escape(file)+'</a>').join('')+'</div>':'')+'</article>').join('')+'</div>';
export function renderPublication(){
  return {
    PUBLICATION_SUMMARY:section('summary','理解摘要 / 12 项','把我们的理解说完整','从定位、模块与原理，到产品选择、复用和适配。','<div class="publication-summary">'+publication.summaryItems.map(item=>'<p><strong>'+escape(item.title)+'</strong><span>'+escape(item.text)+'</span></p>').join('')+'</div>'),
    MODULES:section('modules','模块 / 8 组职责','每个模块负责哪一段','按源码职责归纳；与下方四张可点击架构图相互对应。',cards(publication.modules,'system-module')),
    VALUES:section('value','价值 / 6 个方面','基础接线，怎样帮助自己的开发','价值是基于机制的判断；实际省时和性能收益尚未量化。',cards(publication.values,'value')),
    REUSE:section('reuse','复用 / 4 条路线','先选入口，再决定投入','完整使用、参考方法、择取模块或建立研究工作区。',cards(publication.reuse,'reuse')),
    INTERFACES:section('interfaces','接口 / 8 处入口','把“可扩展”落实到位置与 API','真实框架 API / 配置约定；建议新增路径属于后续设计。','<p class="interface-note">固定源码中未发现 Cove 专用的业务插件注册系统。业务 server function 适合应用内部调用，对外 HTTP 端点使用 API 路由；每条路径都需要自己的输入、身份与授权规则。</p><div class="file-table-wrap"><table class="interface-table"><thead><tr><th scope="col">扩展层</th><th scope="col">文件 / 目录</th><th scope="col">API / 模式</th><th scope="col">适配工作</th></tr></thead><tbody>'+publication.interfaces.map(row=>'<tr data-extension-point>'+row.map((cell,i)=>'<'+(i?'td':'th scope="row"')+'>'+escape(cell)+'</'+(i?'td':'th')+'>').join('')+'</tr>').join('')+'</tbody></table></div>'),
    ADAPTATION:section('adaptation','适配 / 6 个步骤','从起步工程到一个可验收的产品','先完成一条页面到数据库的业务闭环，再增加复杂服务。','<div class="publication-grid">'+publication.adaptation.map(([number,title,text])=>'<article class="publication-card" data-adaptation><span class="eyebrow">'+number+'</span><h3>'+escape(title)+'</h3><p>'+escape(text)+'</p></article>').join('')+'</div><div class="startup-reference"><h3>固定 README 的启动参考</h3><p>先准备 Node.js ≥24、pnpm ≥12、Vite+ 和 PostgreSQL；创建工程后进入项目目录，依据 .env.schema 填写未提交的 .env.local，包括 base URL、数据库 URL 与认证密钥。OAuth 需要另配凭据及回调。</p><pre>pnpm create cove\n# 进入新项目目录，准备数据库并填写 .env.local\nvpr env:load\nvpr db generate\nvpr db migrate\nvpr dev</pre><p>以上为固定源码的参考流程。本轮没有执行原模板安装、认证或数据库迁移；使用当前 CLI 时请核对所生成版本。</p></div>'),
    EXTENSIONS:cards(publication.extensions,'extension-direction'),
    FAQS:section('faq','判断 / 边界与来源','采用之前，把这些区别看清','已有功能、生态扩展、业务规划与静态网站验证分别说明。','<div class="publication-faq">'+publication.faqs.map(item=>'<details><summary>'+escape(item.title)+'</summary><p>'+escape(item.text)+'</p></details>').join('')+'</div><div class="publication-downloads"><a href="./understanding.md">下载完整理解 Markdown</a><a href="./publication.json">下载结构化研究 JSON</a><a href="./assets/cove-overview-render.json">原图生成记录</a><a href="./assets/verification.json">网页验收记录</a></div>'),
  };
}
export function renderGuide(render){
  return '<figure class="summary-figure" id="summary-figure"><a class="summary-preview" href="./map.html" aria-label="打开 Cove 完整总览缩放阅读器"><img src="./assets/'+guide.file+'" width="'+guide.width+'" height="'+guide.height+'" loading="lazy" decoding="async" alt="Cove 完整中文引导图：模板定位、能力、六类场景、模块架构、底层原理、八处接口和六步适配"></a><figcaption><span class="eyebrow">一图完整理解 / 沿用已有原图</span><h3>Cove 是模板，业务在这些入口上继续开发。</h3><div class="guide-introduction" data-publication-introduction>'+publication.overviewItems.map(item=>'<p><strong>'+escape(item.title)+'</strong>：'+escape(item.text)+'</p>').join('')+'</div><div class="summary-actions"><a href="./map.html">放大阅读 ↗</a><a href="./assets/'+guide.file+'" download>下载完整 PNG</a><a href="./assets/cove-overview.html" target="_blank" rel="noopener noreferrer">可编辑图源</a></div><p class="summary-baseline">2026-10-09 原创中文架构解读 · '+render.width+' × '+render.height+' · 固定 e7d40d5 · 本轮原始图片保持不变</p></figcaption></figure>';
}
export function renderSiteCard(project){
  const base='./009-cove/';
  return '<section class="project-block" id="cove"><div class="eyebrow">009 / FULL STACK TEMPLATE · ARCHITECTURE · ADAPTATION</div><h2 class="project-heading">009 · '+escape(project.name)+'</h2><div class="project-introduction" data-project-introduction="009">'+project.overviewItems.map(item=>'<p><strong>'+escape(item.title)+'</strong>：'+escape(item.text)+'</p>').join('')+'</div><div class="actions"><a class="button primary" href="'+base+'">阅读能力、模块、原理与价值 ↗</a><a class="button" href="'+base+'map.html">可缩放一图阅读</a><a class="button" href="'+base+'#interfaces">八处扩展接口</a><a class="button" href="'+base+'#adaptation">六步业务适配</a><a class="button" href="'+escape(project.upstream)+'">源库 cove</a></div><figure class="project-map"><a class="guide-frame" href="'+base+'map.html"><img src="'+base+'assets/'+guide.file+'" width="'+guide.width+'" height="'+guide.height+'" alt="'+escape(project.coverAlt)+'" loading="lazy" decoding="async"></a><figcaption>'+escape(project.coverCaption)+'<br><a href="'+base+'assets/'+guide.file+'" download>下载完整原图</a> · <a href="'+base+'understanding.md">下载完整理解</a></figcaption></figure></section>';
}
export function renderUnderstanding(){
  const lines=['# 009 · Cove 完整理解','', '上游：'+publication.meta.upstream,'固定提交：'+publication.meta.commit,'研究基线：2026-10-09；完整整理与发布：2026-10-12。','上游许可：Unlicense。','',publication.meta.scope,''];
  const add=(title,items)=>{lines.push('## '+title,'');for(const item of items){lines.push('### '+item.title,'',item.text,'');if(item.entry)lines.push('接入位置：'+item.entry,'');if(item.acceptance)lines.push('建议验收：'+item.acceptance,'');if(item.files)lines.push(...item.files.map(file=>'- ['+file+']('+source(file)+')'), '');}};
  add('十二项摘要',publication.summaryItems);add('图前介绍',publication.overviewItems);
  lines.push('## 完整引导图','','![Cove 完整原图](./assets/'+guide.file+')','',guide.width+' × '+guide.height+'；SHA-256：'+guide.sha256,'');
  add('八类能力',publication.capabilities);add('八组模块',publication.modules);
  lines.push('## 六个执行原理','');for(const [title,text,files] of publication.principles)lines.push('### '+title,'',text,'',...files.map(file=>'- ['+file+']('+source(file)+')'),'');
  lines.push('## 六类使用场景','');for(const item of publication.scenarios)lines.push('### '+item.title,'',item.examples,'',item.why,'','继续开发：'+item.add,'');
  add('六项价值',publication.values);add('四条复用路线',publication.reuse);
  lines.push('## 八处扩展入口（新增路径为建议）','');for(const [title,files,api,text] of publication.interfaces)lines.push('### '+title,'','位置：'+files,'','接口：'+api,'',text,'');
  lines.push('## 六步适配','');for(const [number,title,text] of publication.adaptation)lines.push('### '+number+' '+title,'',text,'');
  add('八项扩展方向（待开发）',publication.extensions);add('采用判断与边界',publication.faqs);
  lines.push('## 源码职责','');for(const [file,role,text] of publication.directory)lines.push('- '+file+'：'+role+'。'+text);
  lines.push('','## 固定依赖','',...publication.versions.map(([name,version])=>'- '+name+'：'+version),'','## 来源','',...publication.references.map(([file,note])=>'- ['+file+']('+source(file)+')：'+note),...publication.docs.map(([title,url,note])=>'- ['+title+']('+url+')：'+note),'');
  // 能力的正文使用 text，其边界和技术也写入独立资料。
  for(const item of publication.capabilities)lines.push('**'+item.title+' 技术与边界**：'+item.tech+'；'+item.boundary,'');
  return lines.join('\n').trimEnd()+'\n';
}
