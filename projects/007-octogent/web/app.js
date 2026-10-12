import { renderInteractiveSections } from './interactive-sections.mjs';
import { screens, source, capabilities, workers, stages, layers, meta } from './content.js';
const $ = (query) => document.querySelector(query);
const tabs = $('.screen-tabs');
let selectedScreen = 0;
screens.forEach((screen, index) => {
  const button = document.createElement('button');
  button.type = 'button'; button.role = 'tab'; button.id = `screen-tab-${index}`;
  button.setAttribute('aria-controls', 'screen-description');
  button.innerHTML = `<span class="screen-number">${screen.number}</span>${screen.short}`;
  button.addEventListener('click', () => selectScreen(index));
  button.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? screens.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + screens.length) % screens.length;
    selectScreen(next); tabs.children[next].focus();
  });
  tabs.append(button);
});
function selectScreen(index) {
  selectedScreen = index;
  const screen = screens[index];
  [...tabs.children].forEach((button, i) => { button.setAttribute('aria-selected', String(i === index)); button.tabIndex = i === index ? 0 : -1; });
  $('#screen-image').src = `./assets/${screen.image}`; $('#screen-image').alt = screen.alt;
  $('#screen-caption').textContent = `作者真实截图 ${screen.number} / ${screen.title} · 点击放大`;
  $('#screen-description').setAttribute('aria-labelledby', `screen-tab-${index}`);
  $('#screen-description').innerHTML = `<p class="eyebrow">SCREEN ${screen.number} / 06</p><h3>${screen.title}</h3><p class="screen-lead">${screen.lead}</p><p>${screen.description}</p><ul>${screen.details.map(text => `<li>${text}</li>`).join('')}</ul><a class="evidence-link" href="${source(screen.file)}" target="_blank" rel="noopener noreferrer">对应源码与说明</a>`;
}
function openImage(index) { const screen = screens[index]; $('#full-image').src = `./assets/${screen.image}`; $('#full-image').alt = screen.alt; $('#image-dialog-title').textContent = screen.title; $('#full-caption').textContent = screen.alt + '。来源：hesamsheikh/octogent，固定提交 07cfc4e。'; $('#image-dialog').showModal(); }
$('#screen-open').addEventListener('click', () => openImage(selectedScreen));
document.querySelectorAll('[data-open-image]').forEach(button => button.addEventListener('click', () => openImage(Number(button.dataset.openImage))));
$('#close-image').addEventListener('click', () => $('#image-dialog').close());
$('#image-dialog').addEventListener('click', event => { if (event.target === $('#image-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); } });
selectScreen(0);

if (!$('#research-sections').children.length) $('#research-sections').innerHTML = renderInteractiveSections();

let step = 0, mode = 'worktree', workerId = 'api', playTimer = null;
const stateLabels = { pending: '待分配', processing: '处理中', blocked: '等待字段确认', done: '已报告 DONE', reviewed: '已审查整合' };
function renderWorkflow() {
  const stage = stages[step];
  $('#step-counter').textContent = `0${step + 1} / 06`;
  $('#stage-title').textContent = stage.title;
  $('#stage-explanation').textContent = stage.explanation;
  $('#parent-state').textContent = stage.coordinator;
  $('#todo-count').textContent = stage.done ? '3 / 3' : '0 / 3';
  document.querySelectorAll('[data-stage]').forEach(button => button.setAttribute('aria-current', Number(button.dataset.stage) === step ? 'step' : 'false'));
  document.querySelectorAll('[data-todo]').forEach(check => { check.textContent = stage.done ? '✓' : ''; check.classList.toggle('checked', stage.done); });
  $('#workspace-title').textContent = mode === 'worktree' ? '每个 worker 有独立工作区' : '所有 worker 共用主目录';
  $('#workspace-description').textContent = mode === 'worktree' ? '各自在分支上提交；协调者审查、合并并运行测试。' : '按范围分工，避免重叠编辑；协调者审查整体改动，最终提交需用户批准。';
  workers.forEach((worker, index) => { const status = $(`#status-${worker.id}`); status.textContent = stateLabels[stage.states[index]]; status.dataset.state = stage.states[index]; });
  renderWorker();
  $('#channel-log').replaceChildren(...stage.messages.map((text, index) => { const p = document.createElement('p'); const number = document.createElement('span'); number.textContent = `0${index + 1}`; p.append(number, document.createTextNode(text)); return p; }));
  $('#previous').disabled = step === 0;
  $('#next').disabled = step === stages.length - 1;
  $('#play').textContent = playTimer ? '暂停播放' : step === stages.length - 1 ? '重新播放' : '播放过程';
}
function renderWorker() {
  const worker = workers.find(item => item.id === workerId);
  document.querySelectorAll('[data-worker]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.worker === workerId)));
  $('#terminal-name').textContent = `CLAUDE CODE / ${worker.terminal}`;
  $('#terminal-task').textContent = `任务：${worker.task}`;
  $('#terminal-path').textContent = mode === 'worktree' ? `工作目录：.octogent/worktrees/${worker.terminal}/ · 分支：octogent/${worker.terminal}` : '工作目录：项目主目录 · 全部 worker 共享同一份文件';
  $('#terminal-log').textContent = `> ${worker.logs[step]}`;
  $('#terminal-log').classList.toggle('blocked-log', workerId === 'ui' && step === 3);
}
function stopPlayback() { if (playTimer) clearInterval(playTimer); playTimer = null; }
function goStep(index) { stopPlayback(); step = index; renderWorkflow(); }
document.querySelectorAll('[data-stage]').forEach(button => button.addEventListener('click', () => goStep(Number(button.dataset.stage))));
document.querySelectorAll('[data-worker]').forEach(button => button.addEventListener('click', () => { workerId = button.dataset.worker; renderWorker(); }));
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode; document.querySelectorAll('[data-mode]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.mode === mode))); renderWorkflow(); }));
$('#previous').addEventListener('click', () => goStep(Math.max(0, step - 1)));
$('#next').addEventListener('click', () => goStep(Math.min(stages.length - 1, step + 1)));
$('#reset').addEventListener('click', () => goStep(0));
$('#play').addEventListener('click', () => {
  if (playTimer) { stopPlayback(); renderWorkflow(); return; }
  if (step === stages.length - 1) step = 0;
  playTimer = setInterval(() => { step++; if (step === stages.length - 1) stopPlayback(); renderWorkflow(); }, 4000);
  renderWorkflow();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && playTimer) { stopPlayback(); renderWorkflow(); } });
renderWorkflow();
function selectLayer(index) {
  const layer = layers[index];
  document.querySelectorAll('[data-layer]').forEach(button => { const selected = Number(button.dataset.layer) === index; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
  $('#layer-detail').setAttribute('aria-labelledby', `layer-tab-${index}`);
  $('#layer-detail').innerHTML = `<p class="eyebrow">${layer.technology}</p><h3>${layer.title}</h3><p>${layer.text}</p><pre><code></code></pre><a class="evidence-link" href="${source(layer.file)}" target="_blank" rel="noopener noreferrer">阅读这一层的源码</a>`;
  $('#layer-detail code').textContent = layer.example;
}
document.querySelectorAll('[data-layer]').forEach(button => {
  button.addEventListener('click', () => selectLayer(Number(button.dataset.layer)));
  button.addEventListener('keydown', event => { if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const index = Number(button.dataset.layer); const next = event.key === 'Home' ? 0 : event.key === 'End' ? layers.length - 1 : (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + layers.length) % layers.length; selectLayer(next); $(`#layer-tab-${next}`).focus(); });
});
const layerOrientation = window.matchMedia('(max-width:760px)');
const updateLayerOrientation = () => $('.layer-list').setAttribute('aria-orientation', layerOrientation.matches ? 'horizontal' : 'vertical');
updateLayerOrientation();
layerOrientation.addEventListener('change', updateLayerOrientation);
selectLayer(0);
