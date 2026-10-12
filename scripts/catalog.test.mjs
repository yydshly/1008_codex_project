import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { ROOT, START, END, readCatalog, renderIndex, updatedReadme, validateCatalog } from './catalog.mjs';
import { addProject } from './new-project.mjs';

function entry(id = '001', slug = 'sample') {
  return {
    id, slug, name: '示例项目', summary: '理解核心实现。',
    upstream: 'https://github.com/example/sample', status: '待研究', tags: [],
    cover: '', coverAlt: '', coverCaption: '', demo: '',
  };
}

function fixture(t) {
  const prefix = path.join(os.tmpdir(), 'codex-catalog-test-');
  const root = fs.mkdtempSync(prefix);
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.resolve(root).startsWith(path.resolve(prefix)));
    fs.rmSync(root, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, 'projects'));
  fs.mkdirSync(path.join(root, 'templates'));
  fs.cpSync(path.join(ROOT, 'templates', 'project'), path.join(root, 'templates', 'project'), { recursive: true });
  fs.writeFileSync(path.join(root, 'projects.json'), JSON.stringify({ schemaVersion: 1, projects: [] }));
  fs.writeFileSync(path.join(root, 'README.md'), `# 自定义首页\n\n${START}\n${END}\n\n保留手写介绍。\n`);
  return root;
}

const options = { slug: 'sample', name: '示例项目', upstream: 'https://github.com/example/sample', summary: '理解核心实现。' };

test('空索引不添加虚构项目，保留首页手写内容', () => {
  const readme = `# 标题\n${START}\n旧内容\n${END}\n手写说明\n`;
  const updated = updatedReadme(readme, []);
  assert.match(updated, /暂无研究项目/);
  assert.ok(updated.startsWith('# 标题\n'));
  assert.ok(updated.endsWith('\n手写说明\n'));
  assert.equal(updatedReadme(updated, []), updated);
  assert.throws(() => updatedReadme(`${START}${START}${END}`, []), /一对/);
  assert.throws(() => updatedReadme(`${END}${START}`, []), /一对/);
});

test('按数值编号排序，支持三位以上编号', () => {
  const catalog = { schemaVersion: 1, projects: [entry('1000', 'thousand'), entry('010', 'ten'), entry('002', 'two')] };
  const projects = validateCatalog(catalog, ROOT, { requireFiles: false });
  assert.deepEqual(projects.map(project => project.id), ['002', '010', '1000']);
  const rendered = renderIndex(projects);
  assert.ok(rendered.indexOf('| 002 |') < rendered.indexOf('| 010 |'));
  assert.ok(rendered.indexOf('| 010 |') < rendered.indexOf('| 1000 |'));
});

test('拒绝重复编号、重复名称路径和非法元数据', () => {
  for (const projects of [
    [entry(), entry('001', 'another')],
    [entry(), entry('002', 'sample')],
    [{ ...entry(), id: '000' }],
    [{ ...entry(), slug: '../outside' }],
    [{ ...entry(), upstream: 'https://github.com/example/sample/issues' }],
    [{ ...entry(), demo: 'javascript:alert(1)' }],
    [{ ...entry(), summary: '首行\n下一行' }],
  ]) {
    assert.throws(() => validateCatalog({ schemaVersion: 1, projects }, ROOT, { requireFiles: false }));
  }
});

test('新增项目生成模板、顺延编号并同步首页', t => {
  const root = fixture(t);
  const first = addProject(root, options);
  const second = addProject(root, { ...options, slug: 'second', name: '第二项' });
  assert.equal(first.id, '001');
  assert.equal(second.id, '002');
  const projects = validateCatalog(readCatalog(root), root);
  assert.equal(projects.length, 2);
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.equal(updatedReadme(readme, projects), readme);
  assert.match(readme, /保留手写介绍/);
  const projectReadme = fs.readFileSync(path.join(root, 'projects', '001-sample', 'README.md'), 'utf8');
  assert.match(projectReadme, /001 · 示例项目/);
  assert.doesNotMatch(projectReadme, /__(ID|SLUG|NAME|UPSTREAM|SUMMARY)__/);
  const webReadme = fs.readFileSync(path.join(root, 'projects', '001-sample', 'web', 'README.md'), 'utf8');
  assert.match(webReadme, /\/1008_codex_project\/001-sample\//);
});

test('非法新增在写文件前失败，不改已有索引', t => {
  const root = fixture(t);
  addProject(root, options);
  const beforeCatalog = fs.readFileSync(path.join(root, 'projects.json'), 'utf8');
  const beforeReadme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.throws(() => addProject(root, options), /重复/);
  assert.throws(() => addProject(root, { ...options, slug: '../bad' }), /slug/);
  assert.equal(fs.readFileSync(path.join(root, 'projects.json'), 'utf8'), beforeCatalog);
  assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), beforeReadme);
  assert.deepEqual(fs.readdirSync(path.join(root, 'projects')), ['001-sample']);
});

test('封面必须真实存在于当前项目，包含替代文字和图注', t => {
  const root = fixture(t);
  addProject(root, options);
  const catalog = readCatalog(root);
  const project = catalog.projects[0];
  project.cover = 'projects/001-sample/assets/cover.svg';
  project.coverAlt = '项目界面';
  project.coverCaption = '研究版本的运行截图。';
  assert.throws(() => validateCatalog(catalog, root), /不存在/);
  fs.writeFileSync(path.join(root, project.cover), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  assert.equal(validateCatalog(catalog, root).length, 1);
  assert.match(renderIndex([project]), /!\[项目界面\]\(projects\/001-sample\/assets\/cover.svg\)/);
  project.cover = 'projects/001-sample/assets/../README.md';
  assert.throws(() => validateCatalog(catalog, root), /图片路径/);
  project.cover = 'projects/001-sample/assets/cover.svg';
  project.coverAlt = '';
  assert.throws(() => validateCatalog(catalog, root), /画面描述/);
});

test('遗漏登记的项目目录触发校验，归档项目仍保留编号', t => {
  const root = fixture(t);
  addProject(root, options);
  const catalog = readCatalog(root);
  catalog.projects[0].id = '003';
  catalog.projects[0].status = '已归档';
  fs.renameSync(path.join(root, 'projects', '001-sample'), path.join(root, 'projects', '003-sample'));
  fs.writeFileSync(path.join(root, 'projects.json'), JSON.stringify(catalog));
  const project = addProject(root, { ...options, slug: 'next' });
  assert.equal(project.id, '004');
  fs.mkdirSync(path.join(root, 'projects', '005-unregistered'));
  assert.throws(() => validateCatalog(readCatalog(root), root), /尚未登记/);
});

test('真实 CLI 从临时仓库运行，参数含中文和空格', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'package.json'), '{"type":"module"}');
  fs.mkdirSync(path.join(root, 'scripts'));
  for (const file of ['catalog.mjs', 'new-project.mjs', 'project-index.mjs']) {
    fs.copyFileSync(path.join(ROOT, 'scripts', file), path.join(root, 'scripts', file));
  }
  const result = execFileSync(process.execPath, [path.join(root, 'scripts', 'new-project.mjs'),
    '--slug', 'cli-sample', '--name', '中文项目 名称', '--upstream', options.upstream, '--summary', options.summary,
  ], { cwd: root, encoding: 'utf8' });
  assert.match(result, /已添加 001/);
  assert.equal(readCatalog(root).projects[0].name, '中文项目 名称');
  const check = execFileSync(process.execPath, [path.join(root, 'scripts', 'project-index.mjs'), '--check'], { cwd: root, encoding: 'utf8' });
  assert.match(check, /检查通过/);
});

test('项目文本不会破坏 Markdown 表格和标题', () => {
  const rendered = renderIndex([{ ...entry(), name: '[项目] <测试>', summary: '输入 | 输出 *描述*', demo: 'https://example.com/demo(test)' }]);
  assert.ok(rendered.includes('输入 \\| 输出 \\*描述\\*'));
  assert.ok(rendered.includes('\\[项目\\] \\<测试\\>'));
  assert.ok(rendered.includes('https://example.com/demo%28test%29'));
});

test('已编码的演示 URL 保持原有路径和查询参数', () => {
  const demo = 'https://example.com/demo%20page?q=%E4%B8%AD%E6%96%87&literal=%25';
  const project = { ...entry(), demo };
  validateCatalog({ schemaVersion: 1, projects: [project] }, ROOT, { requireFiles: false });
  assert.ok(renderIndex([project]).includes(`[访问](${demo})`));
});

test('来源链接显示源库自己的名称，兼容末尾斜线与 Markdown 转义', () => {
  const project = { ...entry(), upstream: 'https://github.com/scottstts/Sandboard/' };
  assert.ok(renderIndex([project]).includes('[Sandboard](https://github.com/scottstts/Sandboard/)'));
  assert.ok(!renderIndex([project]).includes('[原仓库]'));
  assert.ok(renderIndex([{ ...project, upstream: 'https://github.com/example/sand_board' }]).includes('[sand\\_board]'));
});

test('分项摘要以加粗标题和换行呈现，兼容旧摘要并转义输入', () => {
  const project = { ...entry(), summaryItems: [
    { title: '能力', text: '交互沙盘' },
    { title: '输入 *输出*', text: '照片 | <效果>' },
  ] };
  validateCatalog({ schemaVersion: 1, projects: [project] }, ROOT, { requireFiles: false });
  const rendered = renderIndex([project, entry('002', 'legacy')]);
  assert.ok(rendered.includes('**能力**：交互沙盘<br>**输入 \\*输出\\***：照片 \\| \\<效果\\>'));
  assert.ok(rendered.includes('| 理解核心实现。 |'));
  assert.equal(rendered.split('\n').filter(line => line.startsWith('| 001 |')).length, 1);
  for (const summaryItems of [[], null, [{ title: '', text: '内容' }], [{ title: '能力', text: '第一行\n第二行' }], [null]]) {
    assert.throws(() => validateCatalog({ schemaVersion: 1, projects: [{ ...entry(), summaryItems }] }, ROOT, { requireFiles: false }), /summaryItems/);
  }
});

test('完整引导图与预览都必须是本项目素材，首页只显示一张并提供入口', t => {
  const root = fixture(t);
  addProject(root, options);
  const project = readCatalog(root).projects[0];
  Object.assign(project, {
    cover: 'projects/001-sample/assets/preview.svg',
    coverFull: 'projects/001-sample/assets/overview.svg',
    coverAlt: '完整研究引导图', coverCaption: '能力、原理与探索。',
    demo: 'https://example.com/sample/',
  });
  fs.writeFileSync(path.join(root, project.cover), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const catalog = { schemaVersion: 1, projects: [project] };
  assert.throws(() => validateCatalog(catalog, root), /coverFull 图片文件不存在/);
  fs.copyFileSync(path.join(root, project.cover), path.join(root, project.coverFull));
  validateCatalog(catalog, root);
  const rendered = renderIndex([project]);
  assert.equal((rendered.match(/!\[/g) || []).length, 1);
  assert.ok(rendered.includes(`[![完整研究引导图](${project.cover})](${project.coverFull})`));
  assert.ok(rendered.includes('[研究说明](projects/001-sample/README.md) · [在线体验](https://example.com/sample/)'));
  for (const coverFull of ['projects/002-other/assets/overview.svg', 'projects/001-sample/assets/../overview.svg', 'https://example.com/image.png']) {
    assert.throws(() => validateCatalog({ schemaVersion: 1, projects: [{ ...project, coverFull }] }, root), /coverFull/);
  }
  assert.throws(() => validateCatalog({ schemaVersion: 1, projects: [{ ...project, cover: '' }] }, root), /coverFull/);
});
