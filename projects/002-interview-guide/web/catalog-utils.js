import { extraResources } from './extra-resources.js';

export const normalize = value => String(value ?? '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()
  .replace(/依赖倒置/g, '依赖反转').replace(/开闭原则/g, '开放封闭')
  .replace(/最少知识原则|迪米特原则/g, '迪米特法则');

export function matches(text, query) {
  const haystack = normalize(text);
  return normalize(query).trim().split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}

export function topicReferences(topic) {
  return [
    ...topic.references.map(reference => ({ ...reference, origin: 'frontmatter' })),
    ...extraResources.filter(reference => reference.topicIds.includes(topic.id)),
  ];
}

export function topicSearchText(topic, detail = {}) {
  return [topic.title, topic.originalTitle, topic.summary, ...topic.points, ...topic.tags, ...topic.questions,
    ...(detail.sections ?? []).flatMap(section => [section.title, ...section.paragraphs]),
    ...(detail.tables ?? []).flatMap(table => [table.title, ...table.columns, ...table.rows.flat()]),
    ...(detail.examples ?? []).flatMap(example => [example.title, example.code, example.explanation]),
    ...(detail.pitfalls ?? []), ...(detail.answers ?? []),
    ...topicReferences(topic).map(reference => `${reference.label} ${reference.url}`),
  ].join(' ');
}

export const resourceTypes = [
  { id: 'all', name: '全部类型' }, { id: 'docs', name: '官方文档' },
  { id: 'repo', name: '代码仓库' }, { id: 'practice', name: '练习平台' },
  { id: 'visual', name: '可视化工具' }, { id: 'video', name: '视频' },
  { id: 'article', name: '文章与教程' }, { id: 'other', name: '其他学习资源' },
];

export function resourceType(url) {
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  if (['leetcode.com', 'codewars.com', 'hackerrank.com', 'coderbyte.com', 'exercism.org'].includes(host)) return 'practice';
  if (host === 'visualgo.net') return 'visual';
  if (host === 'youtube.com' || host === 'youtu.be') return 'video';
  if (host === 'github.com' || host === 'gist.github.com') return 'repo';
  if (host.startsWith('docs.') || [
    'developer.mozilla.org', 'react.dev', 'vuejs.org', 'angular.dev', 'angular.io', 'typescriptlang.org',
    'dart.dev', 'docs.flutter.dev', 'learn.microsoft.com', 'w3.org', 'docs.python.org', 'docs.oracle.com',
  ].includes(host)) return 'docs';
  if (host.endsWith('medium.com') || ['dev.to', 'freecodecamp.org', 'geeksforgeeks.org', 'refactoring.guru', 'patterns.dev'].includes(host)) return 'article';
  return 'other';
}
