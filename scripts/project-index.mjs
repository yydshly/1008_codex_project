import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readCatalog, updatedReadme, validateCatalog } from './catalog.mjs';

try {
  if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('用法：node scripts/project-index.mjs [--check]');
  const projects = validateCatalog(readCatalog());
  const readmePath = path.join(ROOT, 'README.md');
  const current = fs.readFileSync(readmePath, 'utf8');
  const expected = updatedReadme(current, projects);
  if (process.argv.includes('--check')) {
    if (current !== expected) throw new Error('首页索引尚未同步，请运行 npm run index:build 并提交 README.md。');
    console.log(`检查通过：${projects.length} 个项目，编号、目录、元数据、图片路径和首页索引一致。`);
  } else {
    fs.writeFileSync(readmePath, expected, 'utf8');
    console.log(`已更新首页索引：${projects.length} 个项目。`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
