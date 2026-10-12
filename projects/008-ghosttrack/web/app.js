// 本项目原创：可访问的能力标签页与片段导航，不访问任何查询接口。
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
function activate(id, focus = false) {
  if (!tabs.some(tab => tab.dataset.capability === id)) return;
  for (const tab of tabs) {
    const selected = tab.dataset.capability === id;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  }
  for (const panel of panels) panel.hidden = panel.id !== id;
}
function select(id, focus = false) {
  activate(id, focus);
  if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
}
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => select(tab.dataset.capability));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    select(tabs[next].dataset.capability, true);
  });
}
const sync = () => activate(location.hash.slice(1));
addEventListener('hashchange', sync);
addEventListener('popstate', sync);
sync();
