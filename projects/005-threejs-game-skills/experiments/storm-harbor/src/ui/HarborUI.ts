import type { GameMode, UiFrame, UiIntent } from '../game/contracts';
import { HOME, LIMITS, WALLS } from '../game/level';

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`缺少游戏界面元素：${id}`);
  return value as T;
}

const intentNames = new Set<UiIntent>(['start', 'pause', 'resume', 'retry', 'menu', 'mute', 'motion']);

/** Single-source-of-truth view. Only UiIntent leaves this class. */
export class HarborUI {
  private readonly abort = new AbortController();
  private readonly app = element('app');
  private readonly hud = element('harbor-hud');
  private readonly overlay = element('harbor-overlay');
  private readonly panel = this.overlay.querySelector<HTMLElement>('.command-panel')!;
  private readonly pause = element<HTMLButtonElement>('harbor-pause');
  private readonly touch = element('harbor-touch');
  private readonly primary = element<HTMLButtonElement>('harbor-primary');
  private readonly secondary = element<HTMLButtonElement>('harbor-secondary');
  private readonly hull = element('harbor-hull');
  private readonly hullTicks = Array.from(this.hull.querySelectorAll('i'));
  private readonly progressTicks = Array.from(element('harbor-progress').querySelectorAll('i'));
  private readonly cargoTicks = Array.from(element('harbor-cargo-slots').querySelectorAll('i'));
  private readonly delivered = element('harbor-delivered');
  private readonly cargo = element('harbor-cargo');
  private readonly time = element('harbor-time');
  private readonly toast = element('harbor-toast');
  private readonly heat = element('harbor-heat');
  private readonly heatFill = this.heat.querySelector<HTMLElement>('i')!;
  private readonly engine = this.heat.closest<HTMLElement>('.engine-line')!;
  private readonly survival = this.hull.closest<HTMLElement>('.survival-line')!;
  private readonly pulseFill = element('harbor-pulse-meter');
  private readonly boostButton = element<HTMLButtonElement>('harbor-boost');
  private readonly pulseButton = element<HTMLButtonElement>('harbor-pulse');
  private readonly muteButton = element<HTMLButtonElement>('harbor-mute');
  private readonly motionButton = element<HTMLButtonElement>('harbor-motion');
  private readonly map = element<HTMLCanvasElement>('harbor-map');
  private readonly mapContext = this.map.getContext('2d');
  private mode: GameMode | null = null;
  private lastDelivered = 0;
  private lastCargo = 0;
  private lastHull = LIMITS.hull;

  constructor(private readonly onIntent: (intent: UiIntent) => void) {
    const options = { signal: this.abort.signal };
    element('game-canvas').setAttribute('tabindex', '-1');
    element('harbor-ui').addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-intent]') : null;
      const intent = target?.dataset.intent as UiIntent | undefined;
      if (intent && intentNames.has(intent)) this.onIntent(intent);
    }, options);
    this.pause.addEventListener('click', () => this.onIntent('pause'), options);
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape' && !event.repeat) {
        if (this.mode === 'playing' || this.mode === 'paused') {
          event.preventDefault();
          this.onIntent(this.mode === 'playing' ? 'pause' : 'resume');
        }
        return;
      }
      if (event.code !== 'Tab' || this.overlay.hidden) return;
      const controls = Array.from(this.panel.querySelectorAll<HTMLButtonElement>('button:not([hidden]):not(:disabled)'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !this.panel.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !this.panel.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }, options);
  }

  update(frame: UiFrame): void {
    if (this.mode !== frame.mode) this.changeMode(frame);
    this.app.dataset.reducedMotion = String(frame.reducedMotion);
    const deliveredText = String(frame.delivered);
    const cargoText = String(frame.cargo);
    const remaining = Math.max(0, Math.ceil(frame.remaining));
    this.setNumber(this.delivered, deliveredText);
    this.setNumber(this.cargo, cargoText);
    this.setNumber(this.time, String(remaining));
    this.hull.setAttribute('aria-valuenow', String(frame.hull));
    this.hull.setAttribute('aria-valuetext', `${frame.hull} 格，最多 ${LIMITS.hull} 格`);
    this.hullTicks.forEach((tick, index) => tick.classList.toggle('filled', index < frame.hull));
    this.progressTicks.forEach((tick, index) => tick.classList.toggle('filled', index < frame.delivered));
    this.cargoTicks.forEach((tick, index) => tick.classList.toggle('filled', index < frame.cargo));
    this.survival.classList.toggle('urgent', remaining <= 30 || frame.hull <= 1);
    const heat = Math.min(1, Math.max(0, frame.heat));
    const percentage = Math.round(heat * 100);
    this.heatFill.style.transform = `scaleX(${heat})`;
    this.heat.setAttribute('aria-valuenow', String(percentage));
    element('harbor-heat-value').textContent = `${percentage}%`;
    element('harbor-heat-label').textContent = frame.overheated ? '过热冷却' : '引擎热量';
    this.engine.classList.toggle('overheated', frame.overheated);
    const cooldown = Math.max(0, frame.pulseCooldown);
    const pulseText = cooldown > .05 ? `${cooldown.toFixed(1)}s` : '就绪';
    element('harbor-pulse-state').textContent = pulseText;
    element('harbor-touch-pulse-state').textContent = pulseText;
    this.pulseFill.style.transform = `scaleX(${1 - Math.min(1, cooldown / LIMITS.pulseCooldown)})`;
    this.boostButton.disabled = frame.overheated || frame.mode !== 'playing';
    this.pulseButton.disabled = cooldown > .05 || frame.mode !== 'playing';
    this.boostButton.setAttribute('aria-label', frame.overheated ? '引擎过热，加速冷却中' : '按住加速');
    this.pulseButton.setAttribute('aria-label', cooldown > .05 ? `EMP 冷却中，剩余 ${pulseText}` : '释放 EMP');
    this.muteButton.setAttribute('aria-pressed', String(frame.muted));
    this.muteButton.querySelector('strong')!.textContent = frame.muted ? '静音' : '开启';
    this.motionButton.setAttribute('aria-pressed', String(frame.reducedMotion));
    this.motionButton.querySelector('strong')!.textContent = frame.reducedMotion ? '开启' : '关闭';
    if (this.toast.textContent !== frame.toast) this.toast.textContent = frame.toast;
    if (frame.mode === 'won' || frame.mode === 'lost') {
      element('harbor-result-delivered').textContent = `${frame.delivered} / 6`;
      element('harbor-result-time').textContent = `${remaining} s`;
      element('harbor-result-hull').textContent = `${frame.hull} / 4`;
      if (frame.mode === 'lost') element('harbor-menu-message').textContent = frame.reason || '救援任务中断。重新出航，调整航线与加速时机。';
    }
    if (!frame.reducedMotion && frame.mode === 'playing') {
      if (frame.delivered > this.lastDelivered) this.punch(this.delivered);
      if (frame.cargo > this.lastCargo) this.punch(this.cargo);
      if (frame.hull < this.lastHull) this.hull.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 220 });
    }
    this.lastDelivered = frame.delivered;
    this.lastCargo = frame.cargo;
    this.lastHull = frame.hull;
    this.drawMap(frame);
  }

  private setNumber(target: HTMLElement, text: string): void {
    const node = target.firstChild;
    if (node && node.nodeType === Node.TEXT_NODE && node.nodeValue !== text) node.nodeValue = text;
  }

  private punch(target: HTMLElement): void {
    target.animate([{ transform: 'scale(1.16)' }, { transform: 'scale(1)' }], { duration: 140, easing: 'ease-out' });
  }

  private changeMode(frame: UiFrame): void {
    this.mode = frame.mode;
    this.app.dataset.mode = frame.mode;
    this.hud.hidden = frame.mode === 'menu';
    this.touch.hidden = frame.mode !== 'playing';
    this.pause.hidden = frame.mode !== 'playing';
    this.overlay.hidden = frame.mode === 'playing';
    if (frame.mode === 'playing') {
      element('game-canvas').focus({ preventScroll: true });
      return;
    }
    const menu = frame.mode === 'menu';
    const paused = frame.mode === 'paused';
    const won = frame.mode === 'won';
    element('harbor-menu-overline').textContent = menu ? '港区应急指挥' : paused ? '航行已暂停' : won ? '救援任务完成' : '救援任务中断';
    element('harbor-menu-title').textContent = menu ? '暴风港' : paused ? '暂驻水域' : won ? '能源已送达' : '重新整备';
    element('harbor-menu-subtitle').textContent = menu ? '能源运输' : paused ? '等你继续出航' : won ? '六枚能源 · 全部交付' : '每次返航，都是新机会';
    element('harbor-menu-message').textContent = menu ? '风暴即将封港。驾驶救援艇，将散落港区的六枚应急能源运回西南基地。' : paused ? '航行与封港计时已暂停。可以调整音效和动态设置，准备好后继续任务。' : won ? '应急能源安全入库，港区恢复供电。救援艇完成了这次风暴前的运输任务。' : frame.reason || '救援任务中断。重新出航，调整航线与加速时机。';
    this.primary.dataset.intent = menu ? 'start' : paused ? 'resume' : 'retry';
    this.primary.innerHTML = `${menu ? '开始救援' : paused ? '继续出航' : '再次出航'} <span aria-hidden="true">→</span>`;
    this.secondary.hidden = menu;
    element('harbor-brief').hidden = !menu;
    element('harbor-result').hidden = menu || paused;
    this.panel.scrollTop = 0;
    this.primary.focus({ preventScroll: true });
  }

  private drawMap(frame: UiFrame): void {
    const ctx = this.mapContext;
    if (!ctx || frame.mode === 'menu') return;
    const width = this.map.width;
    const height = this.map.height;
    const margin = 9;
    const sx = (width - margin * 2) / (LIMITS.x * 2);
    const sz = (height - margin * 2) / (LIMITS.z * 2);
    const px = (x: number): number => margin + (x + LIMITS.x) * sx;
    const pz = (z: number): number => margin + (z + LIMITS.z) * sz;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0b2634'; ctx.fillRect(margin, margin, width - margin * 2, height - margin * 2);
    ctx.strokeStyle = 'rgba(139,194,207,.12)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -16; x <= 16; x += 8) { ctx.moveTo(px(x), margin); ctx.lineTo(px(x), height - margin); }
    for (let z = -8; z <= 8; z += 8) { ctx.moveTo(margin, pz(z)); ctx.lineTo(width - margin, pz(z)); }
    ctx.stroke();
    ctx.fillStyle = '#466575';
    for (const wall of WALLS) ctx.fillRect(px(wall.x - wall.width / 2), pz(wall.z - wall.depth / 2), wall.width * sx, wall.depth * sz);
    ctx.strokeStyle = '#5c8798'; ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    ctx.fillStyle = '#60e2c4'; ctx.fillRect(px(HOME.x) - 6, pz(HOME.z) - 5, 12, 10);
    ctx.strokeStyle = 'rgba(96,226,196,.5)'; ctx.beginPath(); ctx.arc(px(HOME.x), pz(HOME.z), 11, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#60e2c4';
    for (const pickup of frame.pickups) {
      if (pickup.collected) continue;
      const x = px(pickup.x), z = pz(pickup.z);
      ctx.beginPath(); ctx.moveTo(x, z - 4); ctx.lineTo(x + 4, z); ctx.lineTo(x, z + 4); ctx.lineTo(x - 4, z); ctx.closePath(); ctx.fill();
    }
    for (const hazard of frame.hazards) {
      ctx.fillStyle = hazard.stunned ? '#7197a3' : '#ff8277';
      ctx.strokeStyle = hazard.stunned ? '#7197a3' : 'rgba(255,130,119,.55)';
      ctx.beginPath(); ctx.arc(px(hazard.x), pz(hazard.z), 6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px(hazard.x), pz(hazard.z), 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#19394a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px(frame.player.x), pz(frame.player.z), 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  dispose(): void { this.abort.abort(); }
}
