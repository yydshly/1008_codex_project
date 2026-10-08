import fs from 'node:fs';
import path from 'node:path';
import { ROOT, markdownText, projectDirectory, readCatalog, updatedReadme, validateCatalog } from './catalog.mjs';

export function addProject(root, options) {
  const catalog = readCatalog(root);
  const existing = validateCatalog(catalog, root);
  const next = existing.reduce((max, project) => Math.max(max, Number(project.id)), 0) + 1;
  if (!Number.isSafeInteger(next)) throw new Error('项目编号超出安全整数范围。');
  const project = {
    id: String(next).padStart(3, '0'),
    slug: options.slug,
    name: options.name,
    summary: options.summary,
    upstream: options.upstream,
    status: '待研究',
    tags: [],
    cover: '',
    coverAlt: '',
    coverCaption: '',
    demo: '',
  };
  const updated = { ...catalog, projects: [...catalog.projects, project] };
  const ordered = validateCatalog(updated, root, { requireFiles: false });
  const readmePath = path.join(root, 'README.md');
  const nextReadme = updatedReadme(fs.readFileSync(readmePath, 'utf8'), ordered);
  const destination = path.join(root, projectDirectory(project));
  if (fs.existsSync(destination)) throw new Error(`项目目录已存在：${projectDirectory(project)}`);
  const substitutions = {
    __ID__: project.id,
    __SLUG__: project.slug,
    __NAME__: markdownText(project.name),
    __UPSTREAM__: project.upstream,
    __SUMMARY__: markdownText(project.summary),
  };
  // Read the complete template before changing the working tree.
  const files = [];
  function collect(directory, relative = '') {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      const nextRelative = path.join(relative, entry.name);
      if (entry.isDirectory()) collect(target, nextRelative);
      else {
        let contents = fs.readFileSync(target, 'utf8');
        contents = contents.replace(/__(ID|SLUG|NAME|UPSTREAM|SUMMARY)__/g, token => substitutions[token]);
        files.push({ relative: nextRelative, contents });
      }
    }
  }
  collect(path.join(root, 'templates', 'project'));
  for (const file of files) {
    const target = path.join(destination, file.relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.contents, 'utf8');
  }
  fs.writeFileSync(path.join(root, 'projects.json'), `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  fs.writeFileSync(readmePath, nextReadme, 'utf8');
  return project;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.join(ROOT, 'scripts', 'new-project.mjs')) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === '--help') {
      console.log('用法：npm run project:add -- --slug repo-name --name "项目名称" --upstream https://github.com/owner/repo --summary "一句话研究摘要"');
    } else {
      const options = {};
      const allowed = new Set(['--slug', '--name', '--upstream', '--summary']);
      for (let index = 0; index < args.length; index += 2) {
        const key = args[index];
        if (!allowed.has(key) || !args[index + 1] || args[index + 1].startsWith('--') || key.slice(2) in options) {
          throw new Error('参数缺失、重复或未知；运行 npm run project:add -- --help 查看用法。');
        }
        options[key.slice(2)] = args[index + 1];
      }
      if (Object.keys(options).length !== allowed.size) throw new Error('必须提供 --slug、--name、--upstream 和 --summary。');
      const project = addProject(ROOT, options);
      console.log(`已添加 ${project.id} · ${project.name}：${projectDirectory(project)}/`);
      console.log('已同步 projects.json 与 README.md；接下来填写研究版本、许可证和研究笔记。');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
