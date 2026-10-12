import { source } from './content.js';
import { layers, workflow, enforcement, division, lessons, scenarios, personalValues, usageBrief } from './extension-content.js';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const render = (id, items, template) => { document.getElementById(id).innerHTML = items.map(template).join(''); };

render('method-layers', layers, item => `<article class="method-card"><span class="method-label">${escape(item.object)}</span><h3>${escape(item.name)}</h3><p>${escape(item.detail)}</p><p class="method-limit">${escape(item.limit)}</p><a href="${escape(source(item.path))}" target="_blank" rel="noopener noreferrer">固定版本出处 ↗</a></article>`);
render('workflow-steps', workflow, (item, index) => `<li><span class="step-number">0${index + 1}</span><h3>${escape(item.name)}</h3><strong>${escape(item.output)}</strong><p>${escape(item.explanation)}</p></li>`);
render('enforcement-cards', enforcement, item => `<article><span class="method-label">${escape(item.strength)}</span><h3>${escape(item.name)}</h3><p>${escape(item.example)}</p><p class="method-limit">${escape(item.scope)}</p></article>`);
render('division-rows', division, item => `<tr><th scope="row">${escape(item.topic)}</th><td>${escape(item.library)}</td><td>${escape(item.ours)}</td></tr>`);
render('lesson-cards', lessons, (item, index) => `<article><span class="lesson-number">0${index + 1}</span><h3>${escape(item.title)}</h3><p>${escape(item.fact)}</p><p class="lesson-meaning">${escape(item.meaning)}</p></article>`);
render('scenario-cards', scenarios, item => `<article><h3>${escape(item.name)}</h3><p class="scenario-example">${escape(item.example)}</p><p>${escape(item.fit)}</p><p class="method-limit">${escape(item.limit)}</p></article>`);
render('personal-value-cards', personalValues, item => `<article><h3>${escape(item.name)}</h3><p>${escape(item.description)}</p></article>`);
document.getElementById('usage-brief').textContent = usageBrief;

const dialog = document.getElementById('overview-viewer');
const zoom = document.getElementById('overview-zoom');
const scrollArea = document.getElementById('overview-scroll');
let trigger;
function setZoom(enabled) {
  scrollArea.classList.toggle('is-zoomed', enabled);
  zoom.setAttribute('aria-pressed', String(enabled));
  zoom.textContent = enabled ? '适应窗口' : '按原图放大';
  scrollArea.scrollTo({ top:0, left:0 });
}
document.querySelectorAll('[data-open-overview]').forEach(button => button.addEventListener('click', () => {
  trigger = button;
  setZoom(false);
  dialog.showModal();
  document.body.classList.add('viewer-open');
}));
zoom.addEventListener('click', () => setZoom(zoom.getAttribute('aria-pressed') !== 'true'));
document.getElementById('overview-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  document.body.classList.remove('viewer-open');
  trigger?.focus({ preventScroll:true });
});

document.getElementById('copy-brief').addEventListener('click', async () => {
  const status = document.getElementById('copy-brief-status');
  try { await navigator.clipboard.writeText(usageBrief); status.textContent = '需求示例已复制。'; }
  catch { status.textContent = '浏览器未允许复制，请选择上方文本复制。'; }
});
