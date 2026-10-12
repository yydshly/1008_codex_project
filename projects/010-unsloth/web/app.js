// 只增强阅读交互；网页不下载权重、不连接模型、不执行训练。
const widgets = [...document.querySelectorAll('[data-tabs]')].map(root => {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const select = (index, { focus = false, history = false } = {}) => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
    if (history && location.hash !== `#${panels[index].id}`) {
      window.history.pushState(null, '', `#${panels[index].id}`);
    }
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index, { history: true }));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(next, { focus: true, history: true });
    });
  });
  select(0);
  return { panels, select };
});

function restorePanel() {
  const id = location.hash.slice(1);
  const target = document.getElementById(id);
  if (target instanceof HTMLDetailsElement) target.open = true;
  for (const widget of widgets) {
    const index = widget.panels.findIndex(panel => panel.id === id);
    if (index >= 0) widget.select(index);
  }
}
restorePanel();
window.addEventListener('hashchange', restorePanel);
window.addEventListener('popstate', restorePanel);
if (location.hash) {
  requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
}

const numberFormat = new Intl.NumberFormat('zh-CN');
const dimInput = document.getElementById('matrix-dim');
const rankInput = document.getElementById('lora-rank');
function updateLoRA() {
  const dim = Number(dimInput.value);
  const rank = Number(rankInput.value);
  const base = dim * dim;
  const adapter = 2 * dim * rank;
  const ratio = adapter / base * 100;
  document.getElementById('rank-value').value = String(rank);
  document.getElementById('base-count').textContent = numberFormat.format(base);
  document.getElementById('adapter-count').textContent = numberFormat.format(adapter);
  document.getElementById('adapter-bar').style.width = `${ratio}%`;
  document.getElementById('parameter-ratio').textContent = `${ratio.toFixed(2)}%`;
}
dimInput.addEventListener('change', updateLoRA);
rankInput.addEventListener('input', updateLoRA);
updateLoRA();

const shortInput = document.getElementById('short-length');
const longInput = document.getElementById('long-length');
const packingNote = document.getElementById('packing-input-note');
function updatePacking() {
  const values = [shortInput.valueAsNumber, longInput.valueAsNumber];
  if (values.some(value => !Number.isInteger(value) || value < 1 || value > 1000)) {
    packingNote.textContent = '请输入 1～1000 之间的整数；下方暂时保留上一次有效结果。';
    return;
  }
  const [short, long] = [...values].sort((a, b) => a - b);
  packingNote.textContent = values[0] > values[1] ? '已按长度重新排列示意：上方显示较短样本，下方显示较长样本。' : '';
  const padded = long * 2;
  const valid = short + long;
  const shortPercent = short / long * 100;
  document.getElementById('short-fill').style.width = `${shortPercent}%`;
  document.getElementById('padding-fill').style.width = `${100 - shortPercent}%`;
  document.getElementById('padded-count').textContent = numberFormat.format(padded);
  document.getElementById('valid-count').textContent = numberFormat.format(valid);
  document.getElementById('padding-ratio').textContent = `${((padded - valid) / padded * 100).toFixed(1)}%`;
}
shortInput.addEventListener('input', updatePacking);
longInput.addEventListener('input', updatePacking);
updatePacking();

const navLinks = [...document.querySelectorAll('.sidebar nav a')];
const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
let scheduled = false;
function updateNavigation() {
  scheduled = false;
  const threshold = innerWidth <= 760 ? 170 : 140;
  let selected = 0;
  sections.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= threshold) selected = index;
  });
  navLinks.forEach((link, index) => {
    link.classList.toggle('active', index === selected);
    if (index === selected) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function scheduleNavigation() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(updateNavigation);
}
window.addEventListener('scroll', scheduleNavigation, { passive: true });
window.addEventListener('resize', scheduleNavigation);
updateNavigation();
