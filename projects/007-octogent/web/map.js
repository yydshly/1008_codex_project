const stage = document.querySelector('#map-stage');
const image = document.querySelector('#understanding-map');
const label = document.querySelector('#zoom-label');
const sectionSelect = document.querySelector('#section-select');
let zoom = window.matchMedia('(max-width:760px)').matches ? 4 : 1.5;
let baseWidth = stage.clientWidth;
const layout = await fetch('./assets/octogent-understanding-map-layout.json').then(response => {
  if (!response.ok) throw new Error('图解章节数据无法读取');
  return response.json();
});
for (const section of layout.sections) {
  const option = document.createElement('option');
  option.value = String(section.y);
  option.textContent = `${section.number} / ${section.title.split('：')[0]}`;
  sectionSelect.append(option);
}
image.width = layout.width;
image.height = layout.height;
function renderZoom(next, preservePosition = true) {
  const oldWidth = parseFloat(image.style.width) || baseWidth * zoom;
  const oldX = stage.scrollLeft;
  const oldY = stage.scrollTop;
  zoom = Math.min(8, Math.max(.5, next));
  const newWidth = baseWidth * zoom;
  image.style.width = `${newWidth}px`;
  label.value = `${Math.round(zoom * 100)}%`;
  document.querySelector('#zoom-out').disabled = zoom <= .5;
  document.querySelector('#zoom-in').disabled = zoom >= 8;
  if (preservePosition) {
    stage.scrollLeft = oldX * newWidth / oldWidth;
    stage.scrollTop = oldY * newWidth / oldWidth;
  }
}
document.querySelector('#zoom-in').addEventListener('click', () => renderZoom(zoom+.25));
document.querySelector('#zoom-out').addEventListener('click', () => renderZoom(zoom-.25));
document.querySelector('#fit-width').addEventListener('click', () => { renderZoom(1); stage.scrollLeft = 0; });
sectionSelect.addEventListener('change', () => {
  stage.scrollTop = Number(sectionSelect.value) * baseWidth * zoom / layout.width;
  stage.scrollLeft = 0;
});
window.addEventListener('resize', () => { baseWidth = stage.clientWidth; renderZoom(zoom, false); });
renderZoom(zoom, false);
