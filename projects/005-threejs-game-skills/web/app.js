import { meta, source, demos, skills, tools, constraints, comparisons } from './content.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const sourceLink = path => `<a href="${escape(source(path))}" target="_blank" rel="noopener noreferrer">${escape(path.split('/').slice(-2).join('/'))}</a>`;
let currentDemo = demos[0];
let demoFrame;

function stopDemo() {
  demoFrame?.remove(); demoFrame = undefined;
  $('#demo-image').hidden = false;
  $('#stop-demo').hidden = true;
  $('#play-demo').disabled = false;
  $('#stage-label').textContent = '作者在线演示 · 实际截图';
  $('#embed-note').textContent = '试玩会连接作者站点；若无法嵌入，可打开原站。';
}
function selectDemo(id, focus = false) {
  const demo = demos.find(item => item.id === id);
  if (!demo) return;
  stopDemo(); currentDemo = demo;
  $('#demo-image').src = `./assets/${demo.image}`;
  $('#demo-image').alt = demo.alt;
  $('#demo-genre').textContent = demo.genre;
  $('#demo-chinese').textContent = demo.chinese;
  $('#demo-name').textContent = demo.name;
  $('#demo-description').textContent = demo.description;
  $('#demo-features').innerHTML = demo.features.map(feature => `<li>${escape(feature)}</li>`).join('');
  $('#demo-observation').textContent = demo.observation;
  $('#demo-controls').textContent = demo.controls;
  $('#external-demo').href = demo.url;
  $('#game-stage').setAttribute('aria-labelledby', `demo-${demo.id}`);
  for (const button of $('#demo-strip').querySelectorAll('button')) {
    const selected = button.dataset.demo === id;
    button.setAttribute('aria-selected', selected); button.tabIndex = selected ? 0 : -1;
    if (selected && focus) { button.focus(); button.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }
}
$('#demo-strip').innerHTML = demos.map(demo => `<button class="demo-choice" id="demo-${demo.id}" role="tab" aria-controls="game-stage" data-demo="${demo.id}"><img src="./assets/${demo.image}" alt="" loading="lazy"><span><strong>${escape(demo.chinese)}</strong><small>${escape(demo.genre)}</small></span></button>`).join('');
$('#game-stage').setAttribute('role', 'tabpanel');
$('#demo-strip').addEventListener('click', event => { const button = event.target.closest('button[data-demo]'); if (button) selectDemo(button.dataset.demo); });
$('#play-demo').addEventListener('click', () => {
  if (demoFrame) return;
  const frame = document.createElement('iframe');
  frame.src = currentDemo.url; frame.title = `${currentDemo.chinese}：作者在线试玩`;
  frame.allow = 'autoplay; fullscreen; gamepad'; frame.allowFullscreen = true;
  frame.referrerPolicy = 'no-referrer';
  $('#demo-image').hidden = true; $('#game-stage').prepend(frame); demoFrame = frame;
  $('#stop-demo').hidden = false; $('#play-demo').disabled = true;
  $('#stage-label').textContent = '正在连接作者站点';
  $('#embed-note').textContent = '作者页面正在加载。若停在空白或加载画面，可打开作者演示。';
  frame.addEventListener('load', () => {
    if (demoFrame !== frame) return;
    $('#stage-label').textContent = '作者站点 · 嵌入试玩';
    $('#embed-note').textContent = '已载入作者页面；跨站加载事件无法保证游戏内部资源成功。可返回截图释放资源。';
  });
});
$('#stop-demo').addEventListener('click', stopDemo);
selectDemo(demos[0].id);

function selectSkill(id, focus = false) {
  const skill = skills.find(item => item.id === id);
  if (!skill) return;
  $('#skill-panel').setAttribute('aria-labelledby', `skill-${id}`);
  $('#skill-panel').innerHTML = `<div class="skill-heading"><div><h3>${escape(skill.name)}</h3><code>${escape(skill.skill)}</code></div><span class="tag">${escape(skill.type)}</span></div><p class="skill-question">${escape(skill.question)}</p><div class="skill-content">${[['沉淀的判断',skill.insight],['怎么做出来',skill.mechanism],['对应的功能与产物',skill.output],['如何约束',skill.enforcement]].map(([label,text])=>`<div class="skill-block"><h4>${label}</h4><p>${escape(text)}</p></div>`).join('')}</div><div class="skill-boundary"><strong>做到这里的限制</strong>${escape(skill.limit)}</div><div class="source-links">${skill.paths.map(sourceLink).join('')}</div>`;
  for (const button of $('#skill-tabs').querySelectorAll('button')) {
    const selected = button.dataset.skill === id;
    button.setAttribute('aria-selected', selected); button.tabIndex = selected ? 0 : -1;
    if (selected && focus) button.focus();
  }
}
$('#skill-tabs').innerHTML = skills.map((skill,index) => `<button id="skill-${skill.id}" class="skill-tab" role="tab" aria-controls="skill-panel" data-skill="${skill.id}"><span class="ordinal">${String(index + 1).padStart(2,'0')}</span>${escape(skill.name)}</button>`).join('');
$('#skill-tabs').addEventListener('click', event => { const button = event.target.closest('button[data-skill]'); if (button) selectSkill(button.dataset.skill); });
selectSkill(skills[0].id);
function keyboardTabs(container, selector, key, onSelect) {
  container.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    const buttons = [...container.querySelectorAll(selector)]; const index = buttons.indexOf(event.target);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (['ArrowLeft','ArrowUp'].includes(event.key) ? -1 : 1) + buttons.length) % buttons.length;
    onSelect(buttons[next].dataset[key], true);
  });
}
keyboardTabs($('#demo-strip'),'button','demo',selectDemo);
keyboardTabs($('#skill-tabs'),'button','skill',selectSkill);
$('#starter-source').href = source('skills/threejs-gameplay-systems/assets/threejs-vite-game/src/game/Game.ts');
$('#evaluation-source').href = source('skills/threejs-game-director/references/workflow-evaluations.md');
$('#tool-rows').innerHTML = tools.map(tool => `<tr><td><strong>${escape(tool.name)}</strong><a href="${escape(source(tool.path))}" target="_blank" rel="noopener noreferrer"><code>${escape(tool.file)}</code></a></td><td>${escape(tool.flow)}</td><td>${escape(tool.check)}</td><td>${escape(tool.result)}</td></tr>`).join('');
$('#constraint-list').innerHTML = constraints.map(item => `<article class="constraint-row"><div class="constraint-title"><span class="tag">${escape(item.strength)}</span><h3>${escape(item.name)}</h3></div><div><h4>如何实现</h4><p>${escape(item.how)}</p></div><div><h4>检查不到什么</h4><p>${escape(item.boundary)}</p></div></article>`).join('');
$('#comparison-grid').innerHTML = comparisons.map(item => `<article class="comparison-card"><h3>${escape(item.setup)}</h3><p>${escape(item.added)}</p><p>${escape(item.cost)}</p><span class="tag">${escape(item.measured)}</span></article>`).join('');
try {
  const response = await fetch('./data/constraint-cases.json');
  if (!response.ok) throw new Error('实验记录未载入');
  const { cases } = await response.json();
  function selectCase(id, focus = false) {
    const item = cases.find(entry => entry.id === id); if (!item) return;
    $('#case-output').setAttribute('aria-labelledby',`case-${id}`);
    $('#case-output').innerHTML = `<span class="result ${escape(item.tone)}">${escape(item.result)}</span><h4>${escape(item.name)}</h4><p>${escape(item.input)}</p><pre>${escape(item.output)}</pre><p>${escape(item.meaning)}</p>`;
    for (const button of $('#case-tabs').querySelectorAll('button')) {
      const selected = button.dataset.case === id; button.setAttribute('aria-selected',selected); button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    }
  }
  $('#case-tabs').innerHTML = cases.map(item=>`<button class="case-tab" id="case-${item.id}" role="tab" aria-controls="case-output" data-case="${item.id}">${escape(item.name)}</button>`).join('');
  $('#case-tabs').addEventListener('click',event=>{const button=event.target.closest('button[data-case]');if(button)selectCase(button.dataset.case);});
  keyboardTabs($('#case-tabs'),'button','case',selectCase); selectCase(cases[0].id);
} catch(error) { $('#case-output').textContent = `${error.message}。可阅读复现记录。`; }
try {
  const response = await fetch('./data/verification.json'); if (!response.ok) throw new Error('验证记录未载入');
  const verification = await response.json();
  $('#verification-grid').innerHTML = verification.checks.map(check=>`<article class="verification-item"><h4>${escape(check.name)}</h4><strong>${escape(check.result)}</strong><p>${escape(check.detail)}</p></article>`).join('');
} catch(error) { $('#verification-grid').textContent = error.message; }
window.addEventListener('pagehide',()=>demoFrame?.remove());
