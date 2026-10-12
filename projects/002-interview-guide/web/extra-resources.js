// 从固定版本 MDX 的正文补回，原 frontmatter.references 的 273 条记录保持原样。
// 同一个前端资料在两个正文页面出现，保留三条引用记录并在界面按 URL 去重。
const base = 'https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/';
export const extraResources = [
  {
    label: 'System Design Interview Questions and Answers [2025]',
    url: 'https://www.geeksforgeeks.org/system-design/top-10-system-design-interview-questions-and-answers',
    topicIds: ['system-design'],
    sourcePath: 'src/content/guide/diseno-de-sistemas.mdx',
    sourceUrl: base + 'src/content/guide/diseno-de-sistemas.mdx',
    origin: 'body',
  },
  {
    label: 'Frontend Interview Questions [Top 250+]',
    url: 'https://frontendinterviewquestions.medium.com/frontend-interview-questions-top-250-92ba361cbbbd',
    topicIds: ['interview-index'],
    sourcePath: 'src/content/guide/preguntas-frecuentes.mdx',
    sourceUrl: base + 'src/content/guide/preguntas-frecuentes.mdx',
    origin: 'body',
  },
  {
    label: 'Frontend Interview Questions [Top 250+]',
    url: 'https://frontendinterviewquestions.medium.com/frontend-interview-questions-top-250-92ba361cbbbd',
    topicIds: ['frontend-interview'],
    sourcePath: 'src/content/guide/preguntas-frontend.mdx',
    sourceUrl: base + 'src/content/guide/preguntas-frontend.mdx',
    origin: 'body',
  },
];
