'use client';

import { ArrowRight, ArrowUpRight, Check, Expand, X } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import research from './research.json';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const editorUrl = `${basePath}/`;
const imageUrl = (file: string) => `${basePath}/research/${file}`;
const sourceCommit = 'c5eaf51e161ba8653204d543666f5839d6020874';
const sourceUrl = `https://github.com/pascalorg/editor/tree/${sourceCommit}`;

const screenshots = [
  { file: 'cover.jpg', label: '平面＋立体', alt: '本地 Pascal 住宅样板，左侧中文建造工具，中间平面图，右侧真实材质与家具的立体视图', title: '同一套场景，同时看平面与空间', caption: '原创住宅样板在原库中运行。2D 与 3D 共用节点数据，便于对照布局和立体效果。' },
  { file: 'edit-wall.jpg', label: '参数编辑', alt: '选中住宅西墙，原生属性面板显示墙厚为 0.3 米', title: '修改尺寸，构件随参数更新', caption: '实测墙厚从 0.200 m 改为 0.300 m；原生撤销恢复 0.200 m，重做回到 0.300 m。' },
  { file: 'place-item.jpg', label: '家具放置', alt: '通过原生放置工具新增 Sofa 后，在真实三维住宅场景中选中沙发', title: '家具成为可继续编辑的场景对象', caption: '本地目录交给原生 item 工具放置。已验证新增 Sofa、退出工具后选取，家具数量从 20 件变为 21 件。' },
  { file: 'official.jpg', label: '楼层展开', alt: '上游 demo_1 在本地编辑器运行，两个楼层与屋顶段呈展开状态', title: '多层结构可以展开观察', caption: '上游 demo_1 经格式适配后在本地运行，已验证楼层展开与显式屋顶段显示。' },
] as const;

const capabilities = research.capabilities;
const steps = research.steps;
const useCases = research.useCases;

type LargeImage = { file: string; alt: string; label: string };

function SectionHeading({ id, number, eyebrow, title, children }: { id: string; number: string; eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="ov-section-heading"><div><p className="ov-eyebrow"><span>{number}</span> {eyebrow}</p><h2 id={id}>{title}</h2></div>{children && <p className="ov-section-intro">{children}</p>}</div>;
}

export default function Overview() {
  const [screenshotIndex, setScreenshotIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [largeImage, setLargeImage] = useState<LargeImage | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const screenshot = screenshots[screenshotIndex];
  const step = steps[stepIndex];

  function openImage(photo: LargeImage) {
    setLargeImage(photo);
    dialog.current?.showModal();
  }

  return <main className="pascal-overview">
    <header className="ov-header">
      <a className="ov-brand" href="#overview-top" aria-label="Pascal 项目理解，回到顶部"><span>003</span><strong>PASCAL<span>项目理解</span></strong></a>
      <nav aria-label="总结页章节"><a href="#capabilities">效果与能力</a><a href="#modules">模块</a><a href="#principles">原理</a><a href="#scenarios">场景</a><a href="#value">价值</a><a href="#extensions">扩展</a></nav>
      <a className="ov-editor-link" href={editorUrl}>体验编辑器 <ArrowUpRight size={16} /></a>
    </header>

    <div className="ov-content">
      <section className="ov-hero" id="overview-top" aria-labelledby="hero-title">
        <div className="ov-hero-copy">
          <p className="ov-eyebrow"><span className="ov-live-dot" /> OPEN SOURCE · 空间设计</p>
          <h1 id="hero-title">房间设计平台的<br /><em>编辑器底座</em></h1>
          <p className="ov-hero-lead">Pascal 把“画房间、摆家具、看效果、改方案”串在同一个浏览器编辑器里。</p>
          <p className="ov-hero-explanation">{research.meta.conclusion}</p>
          <div className="ov-hero-actions"><a className="ov-primary-link" href={editorUrl}>打开真实演示 <ArrowUpRight size={17} /></a><a className="ov-text-link" href="#principles">看看它如何工作 <ArrowRight size={16} /></a></div>
          <div className="ov-version"><span>运行包 <strong>1.0.3</strong></span><span>研究基线 <a href={sourceUrl} target="_blank" rel="noreferrer">c5eaf51 <ArrowUpRight size={11} /></a></span><span>10.08 观察 · 10.12 整理</span></div>
        </div>
        <figure className="ov-guide">
          <div className="ov-gallery-bar"><span><i /> 沿用我们生成的完整引导图</span><button type="button" onClick={() => openImage({ file: 'pascal-summary.png', alt: 'Pascal 效果与能力、底层原理、使用场景及产品意义的完整 AI 总结图', label: 'Pascal 完整引导图' })} aria-label="放大完整引导图"><Expand size={15} /> 放大</button></div>
          <img className="ov-guide-image" src={imageUrl('pascal-summary.png')} alt="我们于 2026-10-08 生成的 Pascal 完整引导图，包含真实效果参考、能力、原理、场景与价值" width={1536} height={1024} fetchPriority="high" />
          <figcaption><strong>先看全图，再沿章节理解</strong><p>AI 信息图依据真实截图与研究生成；用途与价值为分析。原始 PNG 完整保留，详细结论和验证边界见下文。</p><div><a href={imageUrl('pascal-summary.png')} target="_blank" rel="noreferrer">打开原图 <ArrowUpRight size={12} /></a><a href={imageUrl('pascal-summary.png')} download="pascal-summary.png">下载原图 <ArrowUpRight size={12} /></a></div></figcaption>
        </figure>
      </section>

      <details className="ov-brief"><summary>完整摘要：能力、模块、原理、价值、复用路线与边界</summary><dl>{research.summaryItems.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.text}</dd></div>)}</dl></details>

      <section className="ov-section" id="capabilities" aria-labelledby="capabilities-title">
        <SectionHeading id="capabilities-title" number="01" eyebrow="效果与能力" title="从一个房间，开始设计空间">九类能力来自原库、固定源码与实际演示。先看真实运行画面，再区分已经验证的操作和仍需评估的路线。</SectionHeading>
        <figure className="ov-gallery ov-effects-gallery">
          <div className="ov-gallery-bar"><span><i /> 本地真实演示</span><button type="button" onClick={() => openImage(screenshot)} aria-label={`放大查看：${screenshot.label}`}><Expand size={15} /> 放大</button></div>
          <img className="ov-demo-image" src={imageUrl(screenshot.file)} alt={screenshot.alt} width={1280} height={720} loading="lazy" />
          <div className="ov-gallery-tabs" role="group" aria-label="切换真实演示截图">{screenshots.map((photo, index) => <button type="button" key={photo.file} aria-pressed={screenshotIndex === index} onClick={() => setScreenshotIndex(index)}>{photo.label}</button>)}</div>
          <figcaption aria-live="polite"><strong>{screenshot.title}</strong><p>{screenshot.caption}</p><span>2026-10-08 · 本地生产构建截图</span></figcaption>
        </figure>
        <div className="ov-capability-grid">{capabilities.map(item => <article className="ov-capability" key={item.number}><span className="ov-card-number">{item.number}</span><h3>{item.title}</h3><p>{item.description}</p><span className="ov-capability-tag">{item.tag}</span></article>)}</div>
        <div className="ov-host-note"><span>本次宿主</span><p>住宅样板、中文面板、本地资产目录、示例切换、浏览器草稿和理解页由我们添加。进入编辑器优先恢复当前来源的草稿；「还原示例」可回到截图样板。公开站点和本机草稿按来源隔离。</p></div>
      </section>

      <section className="ov-section" id="modules" aria-labelledby="modules-title">
        <SectionHeading id="modules-title" number="02" eyebrow="模块架构" title="八个模块，各自负责一层">前四个包以 1.0.3 在本次编辑器运行。其他模块按固定仓库说明整理，没有把源码阅读当作服务已部署。</SectionHeading>
        <div className="ov-module-grid">{research.modules.map(item => <article key={item.name}><div className="ov-module-top"><code>{item.name}</code><span>{item.status}</span></div><h3>{item.title}</h3><p>{item.role}</p><p className="ov-module-relation">{item.relation}</p><a href={`${sourceUrl}/${item.path}`} target="_blank" rel="noreferrer">查看固定源码 <ArrowUpRight size={12} /></a></article>)}</div>
      </section>

      <section className="ov-section ov-principles" id="principles" aria-labelledby="principles-title">
        <SectionHeading id="principles-title" number="03" eyebrow="底层原理" title="改一个参数，空间就跟着更新">点击流程中的任一步，查看“墙厚从 0.200 m 改成 0.300 m”如何传到立体画面。</SectionHeading>
        <div className="ov-pipeline-label"><span>3D 更新链</span><span>四个核心包协作</span></div>
        <div className="ov-pipeline" role="group" aria-label="底层原理分步说明">{steps.map((item, index) => <button type="button" className="ov-step" key={item.title} aria-pressed={stepIndex === index} onClick={() => setStepIndex(index)}><span className="ov-step-order">0{index + 1}</span><strong>{item.title}</strong><code>@pascal-app/{item.package}</code>{index < steps.length - 1 && <ArrowRight className="ov-step-arrow" size={18} aria-hidden="true" />}</button>)}</div>
        <div className="ov-mechanism-detail" aria-live="polite"><div><span className="ov-detail-label">0{stepIndex + 1} / 05</span><h3>{step.title}</h3><p>{step.description}</p></div><div className="ov-step-result"><span>这一环节的作用</span><strong>{step.result}</strong></div></div>
        <div className="ov-plan-branch"><span className="ov-branch-source">参数节点</span><ArrowRight size={20} aria-hidden="true" /><span className="ov-branch-target">2D 平面图</span><p>平面图直接使用场景节点数据；它与 3D 共用方案，因此能对照同一次编辑的结果。</p></div>
        <div className="ov-node-example"><div><p className="ov-eyebrow">真实数据的简化字段</p><h3>保存“这是一面墙”</h3><p>住宅西墙保留类型、父楼层、端点、高度与厚度。JSON 可以承接继续编辑和业务关联；导出的三角网格通常不具备相同的参数化语义。</p><a href={`${basePath}/demos/house.json`} target="_blank" rel="noreferrer">查看完整住宅数据 <ArrowUpRight size={12} /></a></div><pre><code>{JSON.stringify(research.nodeExample, null, 2)}</code></pre></div>
        <p className="ov-principle-takeaway">对我们而言，关键是复用“参数 → 几何 → 视图”的完整编辑链路，并以场景数据承接自己的业务。</p>
      </section>

      <section className="ov-section" id="scenarios" aria-labelledby="scenarios-title">
        <SectionHeading id="scenarios-title" number="04" eyebrow="使用场景" title="这些能力，可以用在哪些地方？">六类用途是基于能力的分析。业务规则、内容资源与专业流程仍需建设；扫描与维护方向不作为本次已交付功能。</SectionHeading>
        <div className="ov-use-case-grid">{useCases.map((item, index) => <article className="ov-use-case" key={item.title}><div><span className="ov-scenario-index">S0{index + 1}</span><span className="ov-audience">{item.audience}</span></div><h3>{item.title}</h3><p>{item.text}</p><span className="ov-scenario-support">{item.support}</span></article>)}</div>
      </section>

      <section className="ov-section ov-value" id="value" aria-labelledby="value-title">
        <SectionHeading id="value-title" number="05" eyebrow="价值与复用" title="把精力放在自己的产品上">复用编辑链路，让开发重点落到内容、项目管理和业务体验。节省多少工作、性能与工程精度都应由自己的用例测量。</SectionHeading>
        <div className="ov-value-grid">
          <article><span className="ov-value-label">可以复用</span><h3>空间编辑基础</h3><ul><li>构件工具与参数属性面板</li><li>几何生成、开洞和家具放置</li><li>2D / 3D 视图与编辑历史</li><li>场景层级和插件机制</li></ul><p>减少从零实现基础编辑器的工作。</p></article>
          <article><span className="ov-value-label">我们建设</span><h3>完整产品体验</h3><ul><li>账号、项目与云端保存</li><li>自己的家具 / 商品资产目录</li><li>方案管理、分享与协作</li><li>按业务接入报价或设计流程</li></ul><p>这些能力决定产品如何服务用户。</p></article>
          <article><span className="ov-value-label">继续验证</span><h3>产品化适配</h3><ul><li>更大场景下的性能与稳定性</li><li>目标设备、真实触摸与浏览器</li><li>导出格式、数据交换与集成</li><li>AI / MCP 的完整连接和流程</li></ul><p>原仓库存在 AI / MCP 代码，本地尚未接通。</p></article>
        </div>
        <h3 className="ov-subheading">四条复用路线，按产品需求选择</h3><div className="ov-route-grid">{research.reuseRoutes.map(item => <article key={item.title}><span>{item.status}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
        <div className="ov-next-step"><span>建议下一步</span><p>以这个可运行的编辑器为起点，先做“创建项目 → 编辑房间 → 保存与重新打开”的业务闭环，再接入自己的资产目录与分享流程。</p><a href={editorUrl}>从演示开始 <ArrowUpRight size={16} /></a></div>
      </section>

      <section className="ov-section" id="extensions" aria-labelledby="extensions-title">
        <SectionHeading id="extensions-title" number="06" eyebrow="可扩展方向" title="从可运行的底座，走向自己的产品">八个方向均为待开发建议。每个方向说明已有基础、需要建设的部分和验收方法，帮助判断投入顺序。</SectionHeading>
        <div className="ov-extension-grid">{research.extensions.map(item => <article key={item.title}><span className="ov-extension-phase">{item.phase}</span><h3>{item.title}</h3><dl><div><dt>基础</dt><dd>{item.basis}</dd></div><div><dt>建设</dt><dd>{item.build}</dd></div><div><dt>验收</dt><dd>{item.verify}</dd></div></dl></article>)}</div>
      </section>

      <section className="ov-section ov-evidence" id="evidence" aria-labelledby="evidence-title">
        <SectionHeading id="evidence-title" number="07" eyebrow="验证与边界" title="理解建立在实际运行之上" />
        <div className="ov-evidence-grid"><article><span className="ov-evidence-label"><Check size={16} /> 已在本地验证</span><ul><li>住宅 2D / 3D 分屏与真实材质显示</li><li>墙厚修改、撤销与重做</li><li>楼层高度 2.8 → 3.5 m，刷新恢复，还原回 2.8 m</li><li>新增 Sofa 后选取，以及官方示例楼层展开</li></ul></article><article><span className="ov-evidence-label">理解与验证的边界</span><ul><li>全部建造工具、导出格式及真实触摸未逐项验收</li><li>专业施工图、报价和 IFC 交换需另行评估</li><li>本地草稿由宿主实现，云端项目与协作需要建设</li><li>官方 Next 完整托管体验尚未属于开源发行版</li></ul></article></div>
        <details className="ov-brief ov-limit-details"><summary>查看版本、部署、保存与许可的完整边界</summary><ul>{research.limits.map(item => <li key={item}>{item}</li>)}</ul></details>
      </section>

      <section className="ov-section ov-reference-section" id="references" aria-labelledby="references-title"><SectionHeading id="references-title" number="08" eyebrow="来源与阅读资料" title="保留依据，方便继续研究">2026-10-08 的观察与实际验收作为基线，2026-10-12 整理发布。引导图保留原始字节，正文可下载为 Markdown 或结构化 JSON。</SectionHeading><div className="ov-downloads"><a href={imageUrl('pascal-summary.png')} download="pascal-summary.png">下载完整引导图 <ArrowUpRight size={14} /></a><a href={imageUrl('understanding.md')} download="pascal-understanding.md">下载理解全文 <ArrowUpRight size={14} /></a><a href={imageUrl('research.json')} download="pascal-research.json">下载研究 JSON <ArrowUpRight size={14} /></a></div><ul className="ov-reference-list">{research.references.map(item => <li key={item.path}><a href={`https://github.com/pascalorg/editor/blob/${sourceCommit}/${item.path}`} target="_blank" rel="noreferrer">{item.title} <ArrowUpRight size={12} /></a></li>)}</ul><p className="ov-reference-note">源码说明与 npm 包运行结果分别记录。源码中 capture、CLI 或 MCP 的接口与工作流，需要在目标发行版本中单独核对。</p><noscript><p className="ov-reference-note">完整正文可无脚本阅读；大图请使用「打开原图」，交互截图切换和编辑器需要 JavaScript。</p></noscript></section>

      <footer className="ov-footer"><div><strong>003 / PASCAL 项目理解</strong><p>运行包固定 1.0.3；源码研究固定 c5eaf51。两者未逐文件核对一致性。<br />上游代码 MIT；材质单独许可尚未逐项核实。Basis 解码器保留 Apache 2.0。<br />用途、产品价值与扩展方向为研究分析，不等于这些产品已经交付。</p></div><div className="ov-source-links"><a href={sourceUrl} target="_blank" rel="noreferrer">固定源码基线 <ArrowUpRight size={13} /></a><a href={`${basePath}/LICENSE.upstream.txt`} target="_blank" rel="noreferrer">上游 MIT 许可 <ArrowUpRight size={13} /></a><a href={`${basePath}/basis/LICENSE`} target="_blank" rel="noreferrer">解码器许可 <ArrowUpRight size={13} /></a><a href="#overview-top">回到顶部 ↑</a></div></footer>
    </div>

    <dialog ref={dialog} className="ov-image-dialog" aria-labelledby="ov-dialog-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}><div className="ov-dialog-bar"><strong id="ov-dialog-title">{largeImage?.label ?? '查看图片'}</strong><button type="button" aria-label="关闭大图" autoFocus onClick={() => dialog.current?.close()}><X size={20} /></button></div>{largeImage && <img src={imageUrl(largeImage.file)} alt={largeImage.alt} width={largeImage.file === 'pascal-summary.png' ? 1536 : 1280} height={largeImage.file === 'pascal-summary.png' ? 1024 : 720} />}</dialog>
  </main>;
}
