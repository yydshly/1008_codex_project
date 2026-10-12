import { readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { meta, categories, topics, learningPaths } from '../content.js';

// 独立审计工具：只比较本地固定来源快照和中文数据，不请求网络、不执行上游代码。
const webRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceRoot = path.resolve(webRoot, '../src');
const strictEnrichment = process.argv.includes('--require-enrichment');
const errors = [];
const warnings = [];
const fail = (code, message, topicId = null) => errors.push({ code, message, topicId });
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const strings = values => Array.isArray(values) && values.every(nonempty);
const unique = values => [...new Set(values)];
const shaPattern = /^[a-f0-9]{40}$/i;
const allowedKinds = ['tutorial', 'resource-guide'];
const expectedTutorialIds = new Set(['complexity', 'clean-architecture', 'dry', 'grasp', 'kiss', 'law-of-demeter', 'solid', 'yagni', 'prototype-chain', 'call-apply-bind', 'object-creation']);

async function optionalJson(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function optionalModule(name) {
  const file = path.join(webRoot, name);
  try { await stat(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  return import(pathToFileURL(file).href);
}

function cleanUrl(value) {
  return value.replace(/&amp;/g, '&').replace(/[.,;]+$/, '');
}

function httpUrls(raw) {
  return unique((raw.match(/https?:\/\/[^\s<>"'`]+/g) ?? []).map(value => {
    let url = cleanUrl(value);
    for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
      const count = character => [...url].filter(item => item === character).length;
      while (url.endsWith(close) && count(close) > count(open)) url = url.slice(0, -1);
    }
    return url;
  }));
}

function textOnly(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|amp|lt|gt|quot);/g, ' ').replace(/\s+/g, ' ').trim();
}

function bodyLinks(body) {
  const links = [];
  for (const match of body.matchAll(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g)) {
    links.push({ label: match[1], url: cleanUrl(match[2]) });
  }
  for (const match of body.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(https?:\/\/.*?)\1[^>]*>([\s\S]*?)<\/a>/g)) {
    links.push({ label: textOnly(match[3]), url: cleanUrl(match[2]) });
  }
  return links;
}

function bodyStructure(body, raw) {
  const headings = [];
  const codeLanguages = [];
  const proseLines = [];
  let fence = null;
  let codeBlocks = 0;
  for (const line of body.split(/\r?\n/)) {
    const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (marker) {
      if (!fence) { fence = marker[1][0]; codeBlocks++; codeLanguages.push(marker[2].trim() || 'plain'); }
      else if (marker[1][0] === fence) fence = null;
      continue;
    }
    if (fence) continue;
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) headings.push({ level: heading[1].length, title: heading[2] });
    if (!line.startsWith('import ')) proseLines.push(line);
  }
  const tables = [...body.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)].map(match => {
    const rows = [...match[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(row => [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)].map(cell => textOnly(cell[1])));
    return { columns: rows[0] ?? [], rows: rows.slice(1) };
  });
  const internalLinks = [];
  for (const match of body.matchAll(/href\s*=\s*(["'])(\/guia\/[^"']+)\1/g)) internalLinks.push(match[2]);
  const prose = textOnly(proseLines.join('\n'));
  return {
    headingCount: headings.length,
    headings,
    codeBlocks,
    codeLanguages,
    bodyCharacters: body.length,
    bodyWords: (prose.match(/[\p{L}\p{N}_]+(?:['’-][\p{L}\p{N}_]+)*/gu) ?? []).length,
    bodyLinks: bodyLinks(body),
    bodyUniqueHttpUrls: httpUrls(body),
    rawUniqueHttpUrls: httpUrls(raw),
    internalLinks: unique(internalLinks),
    tableCount: tables.length,
    tableRowCount: tables.reduce((sum, table) => sum + table.rows.length, 0),
    tables,
  };
}

function frontmatterField(raw, field) {
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const value = frontmatter?.[1].match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  if (!value) return null;
  if (value.startsWith('"')) { try { return JSON.parse(value); } catch { return null; } }
  return value.replace(/^'|'$/g, '');
}

function rawReferencePairs(raw) {
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const pairs = [];
  for (const match of frontmatter.matchAll(/^\s*-\s+label:\s*(.+)\r?\n\s+url:\s*(.+)$/gm)) {
    const parse = value => { const trimmed = value.trim(); return trimmed.startsWith('"') ? JSON.parse(trimmed) : trimmed.replace(/^'|'$/g, ''); };
    pairs.push({ label: parse(match[1]), url: parse(match[2]) });
  }
  return pairs;
}

function isHttpUrl(value) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
}

const snapshot = JSON.parse(await readFile(path.join(sourceRoot, 'upstream-guide.json'), 'utf8'));
const latestInput = await optionalJson(path.join(sourceRoot, 'upstream-latest.json'));
const sourcePages = snapshot.pages;
if (!Array.isArray(sourcePages)) throw new Error('固定来源快照缺少 pages 数组。');
if (snapshot.repo !== meta.repo || snapshot.commit !== meta.commit) fail('baseline-mismatch', '快照与网页仓库或固定提交不一致。');
if (!shaPattern.test(meta.commit)) fail('invalid-commit', '研究提交必须为完整 40 位 Git SHA。');
const sourceMap = new Map(sourcePages.map(page => [page.path, page]));
const topicMap = new Map(topics.map(topic => [topic.id, topic]));
const categoryIds = new Set(categories.map(category => category.id));
if (sourceMap.size !== sourcePages.length) fail('duplicate-source-path', '快照存在重复来源路径。');
if (topicMap.size !== topics.length) fail('duplicate-topic-id', '主题 ID 重复。');
if (categoryIds.size !== categories.length) fail('duplicate-category-id', '分类 ID 重复。');
if (new Set(topics.map(topic => topic.sourcePath)).size !== topics.length) fail('duplicate-topic-source', '多个主题对应了同一上游页面。');
if (sourcePages.length !== topics.length) fail('page-count', '上游页面数量与主题数量不一致。');

const modules = await Promise.all([optionalModule('enrichment-foundations.js'), optionalModule('enrichment-practice.js'), optionalModule('extra-resources.js')]);
const detailMaps = [modules[0]?.foundationDetails, modules[1]?.practiceDetails].filter(Boolean);
const details = {};
for (const detailMap of detailMaps) {
  if (!detailMap || typeof detailMap !== 'object' || Array.isArray(detailMap)) { fail('enrichment-export', '补充模块应导出按 topic.id 索引的对象。'); continue; }
  for (const [id, detail] of Object.entries(detailMap)) {
    if (details[id]) fail('duplicate-enrichment', '两个补充模块重复定义主题。', id);
    details[id] = detail;
    if (!topicMap.has(id)) fail('unknown-enrichment-topic', '补充内容引用不存在的主题。', id);
  }
}
const allDetailsAvailable = Boolean(modules[0]?.foundationDetails && modules[1]?.practiceDetails);
if (!allDetailsAvailable) {
  const message = '详细补充模块尚未齐全；当前报告标注未覆盖主题。';
  if (strictEnrichment) fail('missing-enrichment-module', message); else warnings.push({ code: 'partial-enrichment', message });
}
const extraResources = modules[2]?.extraResources ?? [];
if (!Array.isArray(extraResources)) throw new Error('extraResources 应为数组。');
for (const extra of extraResources) {
  if (!nonempty(extra.label) || !isHttpUrl(extra.url) || !Array.isArray(extra.topicIds) || !extra.topicIds.length) fail('extra-resource-schema', '额外资源缺少名称、有效网址或主题关联。');
  if (extra.topicIds?.some(id => !topicMap.has(id))) fail('extra-resource-topic', '额外资源引用了不存在的主题。');
  if (!extra.sourceUrl?.startsWith(`${meta.repo}/blob/${meta.commit}/`)) fail('extra-resource-source', '额外资源来源没有固定到研究提交。');
}

const rows = [];
for (const source of sourcePages) {
  const topic = topics.find(item => item.sourcePath === source.path);
  const structure = bodyStructure(source.body ?? '', source.raw ?? '');
  if (!topic) { fail('missing-topic', `没有对应中文主题：${source.path}`); rows.push({ id: null, sourcePath: source.path, source: structure, coverage: { topicMapped: false } }); continue; }
  const expectedSourceUrl = `${meta.repo}/blob/${meta.commit}/${source.path}`;
  const sourceKind = expectedTutorialIds.has(topic.id) ? 'tutorial' : 'resource-guide';
  const detail = details[topic.id];
  const refsMatch = JSON.stringify(source.references) === JSON.stringify(topic.references);
  const matchedBodyLinks = structure.bodyLinks.map(reference => ({ ...reference, mapped: topic.references.some(item => item.url === reference.url) || extraResources.some(item => item.url === reference.url && item.topicIds.includes(topic.id) && item.sourceUrl === expectedSourceUrl) }));
  const bodyMapped = matchedBodyLinks.every(reference => reference.mapped);
  if (!categoryIds.has(topic.category)) fail('topic-category', '主题引用了不存在的分类。', topic.id);
  for (const field of ['title', 'originalTitle', 'summary', 'sourcePath', 'sourceUrl']) if (!nonempty(topic[field])) fail('topic-schema', `主题缺少 ${field}。`, topic.id);
  for (const field of ['points', 'questions', 'tags']) if (!strings(topic[field]) || !topic[field].length) fail('topic-schema', `主题 ${field} 应为非空字符串数组。`, topic.id);
  if (topic.originalTitle !== source.title) fail('original-title', '主题原始标题与快照不一致。', topic.id);
  if (topic.sourceUrl !== expectedSourceUrl) fail('source-url', '原文入口没有固定到对应来源路径和提交。', topic.id);
  if (!refsMatch) fail('frontmatter-reference-mismatch', '上游 references 与主题引用不完全一致。', topic.id);
  if (JSON.stringify(rawReferencePairs(source.raw)) !== JSON.stringify(source.references)) fail('raw-references', '快照引用字段与保留原文的 references 不一致。', topic.id);
  if (frontmatterField(source.raw, 'title') !== source.title || frontmatterField(source.raw, 'description') !== source.description || frontmatterField(source.raw, 'category') !== source.category) fail('raw-frontmatter', '快照提取元数据与保留原文不一致。', topic.id);
  const originalBody = source.raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/)?.[1]?.trim();
  if (originalBody !== source.body.trim()) fail('raw-body', '快照正文与完整原文的正文不一致。', topic.id);
  if (!Array.isArray(topic.references) || topic.references.some(reference => !nonempty(reference.label) || !isHttpUrl(reference.url))) fail('reference-schema', '主题引用缺少名称或合法 http(s) 链接。', topic.id);
  const representedRawUrls = new Set([...source.references.map(reference => reference.url), ...structure.bodyUniqueHttpUrls]);
  if (structure.rawUniqueHttpUrls.some(url => !representedRawUrls.has(url))) fail('raw-url-unmapped', '原文中的 http(s) 地址未被引用字段或正文链接统计覆盖。', topic.id);
  if (!bodyMapped) {
    const message = 'MDX 正文存在未进入网页资源关联的外部链接。';
    if (modules[2] || strictEnrichment) fail('missing-body-reference', message, topic.id); else warnings.push({ code: 'missing-body-reference', message, topicId: topic.id });
  }
  if (sourceKind === 'tutorial' && (!structure.codeBlocks || !structure.headingCount)) fail('tutorial-evidence', '原文教程分类缺少章节或代码示例证据。', topic.id);
  let answersMatch = false;
  let relatedValid = false;
  if (!detail) { if (allDetailsAvailable || strictEnrichment) fail('missing-enrichment', '没有该主题的中文详细补充。', topic.id); }
  else {
    if (!allowedKinds.includes(detail.kind) || detail.kind !== sourceKind) fail('enrichment-kind', '补充内容 kind 与原文类型不对应。', topic.id);
    if (!Array.isArray(detail.sections) || !detail.sections.length || detail.sections.some(section => !nonempty(section.title) || !strings(section.paragraphs) || !section.paragraphs.length)) fail('enrichment-sections', '详细讲解必须有带标题的非空段落。', topic.id);
    if (!strings(detail.pitfalls) || !detail.pitfalls.length) fail('enrichment-pitfalls', '主题缺少常见误区。', topic.id);
    answersMatch = strings(detail.answers) && detail.answers.length === topic.questions.length;
    if (!answersMatch) fail('enrichment-answers', '参考答法数量或类型与复习问题不对应。', topic.id);
    relatedValid = Array.isArray(detail.related) && detail.related.length > 0 && detail.related.every(id => topicMap.has(id) && id !== topic.id) && new Set(detail.related).size === detail.related.length;
    if (!relatedValid) fail('enrichment-related', '相关主题需为不重复、非自身的有效主题 ID。', topic.id);
    if (!Array.isArray(detail.examples) || detail.examples.some(example => ['title', 'language', 'code', 'explanation'].some(field => !nonempty(example[field])))) fail('enrichment-examples', '例子字段缺失或格式错误。', topic.id);
    const tablesValid = !detail.tables || (Array.isArray(detail.tables) && detail.tables.every(table => nonempty(table.title) && strings(table.columns) && table.columns.length > 0 && Array.isArray(table.rows) && table.rows.every(row => strings(row) && row.length === table.columns.length)));
    if (!tablesValid) fail('enrichment-tables', '中文表格列数与行数据不一致。', topic.id);
    if (topic.id === 'interview-index' && (!tablesValid || detail.tables?.length !== structure.tableCount || structure.tables.some((table, index) => detail.tables[index]?.rows?.length !== table.rows.length))) fail('interview-index-tables', '面试总索引应对应原文的 13 种语言、8 个前端框架和 15 个后端框架。', topic.id);
  }
  rows.push({
    id: topic.id, title: topic.title, originalTitle: topic.originalTitle, category: topic.category, sourcePath: source.path, sourceUrl: expectedSourceUrl, kind: sourceKind,
    source: { ...structure, bodyLinks: matchedBodyLinks },
    enrichment: { sectionCount: detail?.sections?.length ?? 0, exampleCount: detail?.examples?.length ?? 0, answerCount: detail?.answers?.length ?? 0, relatedCount: detail?.related?.length ?? 0, tableCount: detail?.tables?.length ?? 0, tableRowCount: detail?.tables?.reduce((sum, table) => sum + (table.rows?.length ?? 0), 0) ?? 0 },
    coverage: { topicMapped: true, frontmatterReferencesMatch: refsMatch, bodyReferencesMapped: bodyMapped, enriched: Boolean(detail), answersMatchQuestions: answersMatch, relatedValid },
  });
}
for (const topic of topics) if (!sourceMap.has(topic.sourcePath)) fail('unknown-source-path', '主题来源路径不存在于固定快照。', topic.id);
for (const learningPath of learningPaths) {
  if (!nonempty(learningPath.id) || !nonempty(learningPath.title) || !Array.isArray(learningPath.steps) || !learningPath.steps.length) fail('learning-path-schema', '学习路线信息不完整。');
  for (const step of learningPath.steps ?? []) if (!Array.isArray(step.topicIds) || step.topicIds.some(id => !topicMap.has(id))) fail('learning-path-topic', `学习路线 ${learningPath.id} 包含不存在的主题。`);
}
const sourceReferences = sourcePages.flatMap(page => page.references);
const bodyReferenceRecords = rows.flatMap(row => row.source.bodyLinks);
const allResources = [...sourceReferences, ...extraResources];
if (meta.pageCount !== sourcePages.length || meta.referenceCount !== sourceReferences.length || meta.uniqueReferenceCount !== new Set(sourceReferences.map(reference => reference.url)).size) fail('meta-count', 'content.js 基础统计与快照不一致。');
const latestCommit = latestInput?.commit ?? latestInput?.latestCommit ?? latestInput?.latestSha ?? latestInput?.sha ?? null;
if (latestCommit && !shaPattern.test(latestCommit)) fail('latest-commit', '最新提交记录应为完整 SHA。');
if (latestCommit === meta.commit && latestInput?.guidePageCount !== undefined && latestInput.guidePageCount !== sourcePages.length) fail('latest-page-count', '已核对的最新提交目录页数与固定快照不一致。');
let readmeBody = null;
try { readmeBody = await readFile(path.join(sourceRoot, 'upstream-readme.md'), 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const readmeLinks = readmeBody ? bodyLinks(readmeBody) : [];
const mdxBodyUrls = new Set(bodyReferenceRecords.map(reference => reference.url));
const readmeExtraLinks = readmeLinks.filter(reference => !sourceReferences.some(item => item.url === reference.url) && mdxBodyUrls.has(reference.url));
const readmeOtherLinks = readmeLinks.filter(reference => !sourceReferences.some(item => item.url === reference.url) && !mdxBodyUrls.has(reference.url) && !reference.url.startsWith(meta.repo));
const report = {
  schemaVersion: 1,
  generatedOn: meta.date,
  repo: meta.repo,
  baseline: { commit: meta.commit, date: snapshot.date },
  latest: { commit: latestCommit, checkedOn: latestInput?.checkedOn ?? latestInput?.date ?? latestInput?.checkedAt ?? null, guidePageCount: latestInput?.guidePageCount ?? null, isCurrent: latestCommit ? latestCommit === meta.commit : null },
  summary: {
    sourcePages: sourcePages.length, mappedTopics: rows.filter(row => row.coverage.topicMapped).length,
    frontmatterReferenceRecords: sourceReferences.length, frontmatterUniqueUrls: new Set(sourceReferences.map(reference => reference.url)).size,
    bodyReferenceRecords: bodyReferenceRecords.length, bodyUniqueUrls: new Set(bodyReferenceRecords.map(reference => reference.url)).size,
    bodyReferenceRecordsMapped: bodyReferenceRecords.filter(reference => reference.mapped).length,
    extraResourceRecords: extraResources.length, readmeExtraResourceRecords: readmeExtraLinks.length,
    allResourceRecords: allResources.length, allUniqueResourceUrls: new Set(allResources.map(reference => reference.url)).size,
    sourceTutorialPages: rows.filter(row => row.kind === 'tutorial').length, sourceResourceGuidePages: rows.filter(row => row.kind === 'resource-guide').length,
    sourceCodeBlocks: rows.reduce((sum, row) => sum + row.source.codeBlocks, 0), sourceTablePages: rows.filter(row => row.source.tableCount).length, sourceTables: rows.reduce((sum, row) => sum + row.source.tableCount, 0), sourceTableRows: rows.reduce((sum, row) => sum + row.source.tableRowCount, 0),
    enrichedTopics: rows.filter(row => row.coverage.enriched).length,
    enrichmentExamples: rows.reduce((sum, row) => sum + (row.enrichment?.exampleCount ?? 0), 0),
    answerRecords: rows.reduce((sum, row) => sum + (row.enrichment?.answerCount ?? 0), 0),
  },
  methodology: {
    sourceKinds: '依据原文内容逐页分类：11 篇包含概念解释与代码例子的教程，其余为资源入口、目录或技术对照指南。分类不是按字符阈值自动推定。',
    referenceRecords: 'frontmatter.references 保留逐页原记录；MDX 正文链接另外记录和关联。README 重复链接只用于对照，不重复计入资源记录。',
    coverageMeaning: '主题和参考记录覆盖反映固定快照的登记情况；不代表第三方资源全文、技术课程或全部面试知识的完成比例。',
    contentOwnership: '中文讲解、例子、常见误区与参考答法为研究项目独立补充；原文及外部资料通过固定出处访问。',
    validationLimit: '本工具核查结构、固定来源、引用与主题关联，不验证每个外部网址可达性，也不自动判定讲解语义或例子运行正确性。',
  },
  checks: { passed: errors.length === 0, enrichmentComplete: rows.every(row => row.coverage.enriched), errors, warnings },
  pages: rows,
  extraResources,
  readmeComparison: { available: Boolean(readmeBody), extraLinks: readmeExtraLinks, otherLinks: readmeOtherLinks, note: '两个 MDX 正文新增资料也存在于 README；README 网站入口和作者主页单列，不计为课程资源。' },
};
const output = JSON.stringify(report, null, 2) + '\n';
await Promise.all([writeFile(path.join(webRoot, 'coverage.json'), output), writeFile(path.join(sourceRoot, 'content-audit.json'), output)]);
console.log(JSON.stringify({ passed: report.checks.passed, summary: report.summary, errors, warnings }, null, 2));
if (errors.length) process.exitCode = 1;
