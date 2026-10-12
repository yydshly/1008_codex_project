// 原创展示交互：四张架构图切换、模块详情与章节导航，不连接 Cove 后端。
document.querySelectorAll('.diagram-panel').forEach(panel => {
  const nodes = [...panel.querySelectorAll('.diagram-node')];
  const details = [...panel.querySelectorAll('.node-detail')];
  nodes.forEach(button => button.addEventListener('click', () => {
    nodes.forEach(node => node.setAttribute('aria-pressed', String(node === button)));
    details.forEach(detail => { detail.hidden = detail.id !== button.getAttribute('aria-controls'); });
  }));
});
const tabs = [...document.querySelectorAll('.diagram-tab')];
const panels = [...document.querySelectorAll('.diagram-panel')];
function selectTab(tab, focus = false) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = tabs.length - 1;
    if (target !== undefined) {
      event.preventDefault();
      selectTab(tabs[target], true);
    }
  });
});
const navLinks = [...document.querySelectorAll('.sidebar nav a')];
const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
const activate = id => navLinks.forEach(link => link.classList.toggle('active', link.hash === '#' + id));
activate(location.hash.slice(1) || 'overview');
const visible = new Map();
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting));
  const current = sections.find(section => visible.get(section.id));
  if (current) activate(current.id);
}, { rootMargin: '-12% 0px -55% 0px', threshold: 0 });
sections.forEach(section => observer.observe(section));
navLinks.forEach(link => link.addEventListener('click', () => activate(link.hash.slice(1))));
