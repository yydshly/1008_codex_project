// Progressive enhancements: all research and sources are already in the HTML.
const controls = document.querySelector('.source-controls');
const search = document.querySelector('#source-search');
const group = document.querySelector('#source-group');
const format = document.querySelector('#source-format');
const cards = [...document.querySelectorAll('[data-source-id]')];
function filterSources() {
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  for (const card of cards) {
    card.hidden = !(card.dataset.search.includes(query) && (group.value === 'all' || card.dataset.group === group.value) && (format.value === 'all' || card.dataset.format === format.value));
    if (!card.hidden) visible++;
  }
  document.querySelector('#source-count').textContent = `显示 ${visible} / ${cards.length} 个示范信源`;
  document.querySelector('#source-empty').hidden = visible > 0;
}
controls.hidden = false;
for (const field of [search, group, format]) field.addEventListener('input', filterSources);
document.querySelector('#reset-filters').addEventListener('click', () => { search.value = ''; group.value = 'all'; format.value = 'all'; filterSources(); search.focus(); });
const status = document.querySelector('#copy-status');
let statusTimer;
function announce(message) {
  status.textContent = message; status.hidden = false;
  clearTimeout(statusTimer); statusTimer = setTimeout(() => { status.hidden = true; }, 2600);
}
for (const button of document.querySelectorAll('[data-copy]')) {
  button.hidden = false;
  button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(button.dataset.copy); announce('订阅地址已复制'); }
    catch {
      const link = button.previousElementSibling;
      const range = document.createRange(); range.selectNodeContents(link);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      announce('已选中订阅地址，请使用复制快捷键');
    }
  });
}
const dialog = document.querySelector('#guide-dialog');
const zoom = document.querySelector('#guide-zoom');
if (typeof dialog.showModal === 'function') {
  for (const link of document.querySelectorAll('.guide-open')) link.addEventListener('click', event => { event.preventDefault(); dialog.showModal(); document.body.classList.add('dialog-open'); });
  document.querySelector('#guide-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); dialog.classList.remove('original-size'); zoom.setAttribute('aria-pressed','false'); zoom.textContent = '按原尺寸阅读'; });
  zoom.addEventListener('click', () => { const original = dialog.classList.toggle('original-size'); zoom.setAttribute('aria-pressed',String(original)); zoom.textContent = original ? '适应窗口' : '按原尺寸阅读'; });
}
const tocLinks = [...document.querySelectorAll('.toc nav a')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const entry = entries.find(item => item.isIntersecting);
    if (entry) for (const link of tocLinks) { const active = link.hash === '#' + entry.target.id; link.classList.toggle('active',active); if (active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); }
  }, { rootMargin: '-12% 0px -65% 0px' });
  for (const section of document.querySelectorAll('.reading-content > section')) observer.observe(section);
}
