import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const START = '<!-- PROJECT_INDEX:START -->';
export const END = '<!-- PROJECT_INDEX:END -->';
const STATUSES = new Set(['待研究', '研究中', '已完成', '已归档']);

export function projectDirectory(project) {
  return `projects/${project.id}-${project.slug}`;
}

export function readCatalog(root = ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, 'projects.json'), 'utf8'));
}

function singleLine(value) {
  return typeof value === 'string' && value.trim().length > 0 && !/[\u0000-\u001f\u007f]/.test(value);
}

function httpsUrl(value, upstream = false) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      !/[\s<>"\\]/.test(value) && (!upstream || (
        url.hostname === 'github.com' && !url.port && !url.search && !url.hash &&
        /^\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.pathname)
      ));
  } catch {
    return false;
  }
}

export function validateCatalog(catalog, root = ROOT, { requireFiles = true } = {}) {
  if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.projects)) {
    throw new Error('projects.json 必须包含 schemaVersion: 1 和 projects 数组。');
  }
  const errors = [];
  const ids = new Set();
  const slugs = new Set();
  const directories = new Set();
  for (const [index, project] of catalog.projects.entries()) {
    const label = `projects[${index}]`;
    if (!project || typeof project !== 'object' || Array.isArray(project)) {
      errors.push(`${label} 必须是项目对象。`);
      continue;
    }
    const validId = typeof project.id === 'string' && /^\d{3,}$/.test(project.id) &&
      Number.isSafeInteger(Number(project.id)) && Number(project.id) > 0 &&
      String(Number(project.id)).padStart(3, '0') === project.id;
    const validSlug = typeof project.slug === 'string' && project.slug.length <= 64 &&
      /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(project.slug);
    if (!validId) errors.push(`${label}.id 必须是从 001 开始的固定编号。`);
    if (!validSlug) errors.push(`${label}.slug 必须是小写英文、数字和连字符，长度不超过 64。`);
    if (ids.has(project.id)) errors.push(`${label}.id 重复：${project.id}`);
    if (slugs.has(project.slug)) errors.push(`${label}.slug 重复：${project.slug}`);
    ids.add(project.id);
    slugs.add(project.slug);
    for (const field of ['name', 'summary']) {
      if (!singleLine(project[field])) errors.push(`${label}.${field} 必须是非空单行文本。`);
    }
    if (!httpsUrl(project.upstream, true)) errors.push(`${label}.upstream 必须是 GitHub 仓库的 HTTPS URL。`);
    if (!STATUSES.has(project.status)) errors.push(`${label}.status 必须是待研究、研究中、已完成或已归档。`);
    if (!Array.isArray(project.tags) || project.tags.some(tag => !singleLine(tag))) {
      errors.push(`${label}.tags 必须是单行文本数组。`);
    }
    for (const field of ['cover', 'coverAlt', 'coverCaption', 'demo']) {
      if (typeof project[field] !== 'string' || /[\u0000-\u001f\u007f]/.test(project[field])) {
        errors.push(`${label}.${field} 必须是单行字符串；暂无内容时填空字符串。`);
      }
    }
    if (project.demo && !httpsUrl(project.demo)) errors.push(`${label}.demo 必须是 HTTPS URL。`);
    if (!validId || !validSlug) continue;

    const directory = projectDirectory(project);
    directories.add(path.basename(directory));
    if (project.cover) {
      const prefix = `${directory}/assets/`;
      const validCover = typeof project.cover === 'string' && project.cover.startsWith(prefix) &&
        !project.cover.includes('\\') && !project.cover.split('/').some(part => !part || part === '.' || part === '..') &&
        /\.(png|jpe?g|webp|gif|svg)$/i.test(project.cover) && !/[<>"?#%:]/.test(project.cover);
      if (!validCover) errors.push(`${label}.cover 必须是本项目 assets/ 内的图片路径。`);
      else if (requireFiles && (!fs.existsSync(path.join(root, project.cover)) || !fs.statSync(path.join(root, project.cover)).isFile())) {
        errors.push(`${label}.cover 图片文件不存在：${project.cover}`);
      }
      if (!singleLine(project.coverAlt)) errors.push(`${label}.coverAlt 有封面时必须填写画面描述。`);
      if (!singleLine(project.coverCaption)) errors.push(`${label}.coverCaption 有封面时必须填写图注。`);
    }
    if (requireFiles) {
      for (const file of ['README.md', 'notes.md']) {
        const target = path.join(root, directory, file);
        if (!fs.existsSync(target) || !fs.statSync(target).isFile()) errors.push(`${directory}/${file} 不存在。`);
      }
      for (const folder of ['assets', 'src', 'web']) {
        const target = path.join(root, directory, folder);
        if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) errors.push(`${directory}/${folder}/ 不存在。`);
      }
    }
  }
  if (requireFiles && fs.existsSync(path.join(root, 'projects'))) {
    for (const entry of fs.readdirSync(path.join(root, 'projects'), { withFileTypes: true })) {
      if (entry.isDirectory() && !directories.has(entry.name)) errors.push(`projects/${entry.name}/ 尚未登记到 projects.json。`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return [...catalog.projects].sort((a, b) => Number(a.id) - Number(b.id));
}

export function markdownText(value) {
  return value.replace(/([\\`*_{}\[\]<>|])/g, '\\$1');
}

function markdownUrl(value) {
  return encodeURI(value).replace(/%25([0-9a-f]{2})/gi, '%$1').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

export function renderIndex(projects) {
  if (!projects.length) {
    return '> 暂无研究项目。首个项目将从 `001` 开始；添加方法见下方说明。';
  }
  const lines = [
    '| 序号 | 项目 / 来源 | 研究摘要 | 状态 | 演示 |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const project of projects) {
    const directory = projectDirectory(project);
    const demo = project.demo ? `[访问](${markdownUrl(project.demo)})` : '—';
    lines.push(`| ${project.id} | [${markdownText(project.name)}](${directory}/README.md) · [原仓库](${markdownUrl(project.upstream)}) | ${markdownText(project.summary)} | ${project.status} | ${demo} |`);
  }
  for (const project of projects.filter(project => project.cover)) {
    lines.push('', `### ${project.id} · ${markdownText(project.name)}`, '',
      `![${markdownText(project.coverAlt)}](${markdownUrl(project.cover)})`, '',
      markdownText(project.coverCaption));
  }
  return lines.join('\n');
}

export function updatedReadme(readme, projects) {
  if (readme.split(START).length !== 2 || readme.split(END).length !== 2 || readme.indexOf(START) > readme.indexOf(END)) {
    throw new Error('README.md 必须包含一对顺序正确的 PROJECT_INDEX 标记。');
  }
  const before = readme.slice(0, readme.indexOf(START) + START.length);
  const after = readme.slice(readme.indexOf(END));
  return `${before}\n\n${renderIndex(projects)}\n\n${after}`;
}
