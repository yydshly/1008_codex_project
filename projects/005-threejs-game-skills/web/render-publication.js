import { summaryItems, moduleParts, reuseRoutes, expansionDirections } from './publication-content.js';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const publicationMarkup = {
  'publication-summary': summaryItems.map(item=>`<article><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></article>`).join(''),
  'module-parts': moduleParts.map(item=>`<article><h3>${escape(item.name)}</h3><p>${escape(item.function)}</p><dl><dt>输入</dt><dd>${escape(item.input)}</dd><dt>产物</dt><dd>${escape(item.output)}</dd></dl><p class="method-limit">${escape(item.boundary)}</p></article>`).join(''),
  'reuse-routes': reuseRoutes.map(item=>`<article><h3>${escape(item.title)}</h3><p>${escape(item.detail)}</p></article>`).join(''),
  'expansion-directions': expansionDirections.map(item=>`<article><span class="method-label">可继续开发 / 研究规划</span><h3>${escape(item.title)}</h3><p><strong>从哪里切入：</strong>${escape(item.entry)}</p><p>${escape(item.work)}</p><p class="method-limit"><strong>先验证：</strong>${escape(item.validation)}</p></article>`).join(''),
};
