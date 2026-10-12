import type { GameMode, UiFrame, UiIntent } from '../game/contracts';

function required<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`缺少水墨界面元素：${id}`);
  return node as T;
}

function timeText(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const intents = new Set<UiIntent>(['start', 'pause', 'resume', 'retry', 'menu', 'mute', 'motion']);
const rounds = ['第一阵', '第二阵', '第三阵'];

/** Presents the simulation's UiFrame and dispatches intents; no gameplay rules live here. */
export class InkUI {
  private readonly abort = new AbortController();
  private readonly app = required('app');
  private readonly canvas = required<HTMLCanvasElement>('game-canvas');
  private readonly overlay = required('ink-overlay');
  private readonly sheet = this.overlay.querySelector<HTMLElement>('.scroll-sheet')!;
  private readonly hud = required('ink-hud');
  private readonly touch = required('ink-touch');
  private readonly feedback = required('ink-feedback');
  private readonly colophon = required('ink-colophon');
  private readonly keyGuide = required('ink-key-guide');
  private readonly pauseButton = required<HTMLButtonElement>('ink-pause');
  private readonly primary = required<HTMLButtonElement>('ink-primary');
  private readonly secondary = required<HTMLButtonElement>('ink-secondary');
  private readonly life = required('ink-life');
  private readonly lifeMarks = Array.from(this.life.querySelectorAll('i'));
  private readonly playerStatus = this.life.closest<HTMLElement>('.player-status')!;
  private readonly energy = required('ink-energy');
  private readonly energyFill = this.energy.querySelector<HTMLElement>('i')!;
  private readonly enemyHealth = required('ink-enemy-health');
  private readonly enemyFill = this.enemyHealth.querySelector<HTMLElement>('i')!;
  private readonly roundMarks = required('ink-round-marks');
  private readonly roundTicks = Array.from(this.roundMarks.querySelectorAll('i'));
  private readonly roundStatus = this.roundMarks.closest<HTMLElement>('.round-status')!;
  private readonly danger = required('ink-danger');
  private readonly toast = required('ink-toast');
  private readonly attack = required<HTMLButtonElement>('ink-attack');
  private readonly actions = ['ink-left', 'ink-right', 'ink-attack', 'ink-parry', 'ink-dodge'].map((id) => required<HTMLButtonElement>(id));
  private readonly mute = required<HTMLButtonElement>('ink-mute');
  private readonly motion = required<HTMLButtonElement>('ink-motion');
  private mode: GameMode | null = null;
  private lastLife = 5;

  constructor(private readonly onIntent: (intent: UiIntent) => void) {
    const options = { signal: this.abort.signal };
    this.canvas.tabIndex = -1;
    required('ink-ui').addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-intent]') : null;
      const intent = target?.dataset.intent as UiIntent | undefined;
      if (intent && intents.has(intent)) this.onIntent(intent);
    }, options);
    this.pauseButton.addEventListener('click', () => this.onIntent('pause'), options);
    window.addEventListener('keydown', (event) => {
      // Escape belongs to this view alone; the game's P shortcut is separate.
      if (event.code === 'Escape' && !event.repeat) {
        if (this.mode === 'playing' || this.mode === 'paused') {
          event.preventDefault();
          this.onIntent(this.mode === 'playing' ? 'pause' : 'resume');
        }
        return;
      }
      if (event.code !== 'Tab' || this.overlay.hidden) return;
      const controls = Array.from(this.sheet.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]'))
        .filter((control) => !control.hidden && control.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !this.sheet.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !this.sheet.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }, options);
  }

  update(frame: UiFrame): void {
    if (this.mode !== frame.mode) this.changeMode(frame);
    this.app.dataset.reducedMotion = String(frame.reducedMotion);
    const life = Math.max(0, Math.min(5, frame.playerHp));
    this.life.setAttribute('aria-valuenow', String(life));
    this.life.setAttribute('aria-valuetext', `${life} 格，最多 5 格`);
    this.setText('ink-life-number', `${life} / 5`);
    this.lifeMarks.forEach((mark, index) => mark.classList.toggle('filled', index < life));
    this.playerStatus.classList.toggle('urgent', life <= 1);
    const energy = Math.max(0, Math.min(100, frame.energy));
    this.energyFill.style.transform = `scaleX(${energy / 100})`;
    this.energy.setAttribute('aria-valuenow', String(Math.round(energy)));
    this.setText('ink-energy-value', String(Math.round(energy)));
    this.energy.closest<HTMLElement>('.energy-row')!.classList.toggle('empty', energy < 20);
    const enemyMax = Math.max(1, frame.enemyMaxHp);
    const enemyHp = Math.max(0, frame.enemyHp);
    this.enemyFill.style.transform = `scaleX(${Math.min(1, enemyHp / enemyMax)})`;
    this.enemyHealth.setAttribute('aria-valuemax', String(enemyMax));
    this.enemyHealth.setAttribute('aria-valuenow', String(enemyHp));
    this.enemyHealth.setAttribute('aria-valuetext', `${frame.enemyName}，生命 ${enemyHp} / ${enemyMax}`);
    this.setText('ink-enemy-name', frame.enemyName);
    this.setText('ink-enemy-health-value', `${enemyHp} / ${enemyMax}`);
    this.setText('ink-round', rounds[Math.max(0, Math.min(2, frame.stage))]!);
    this.setText('ink-scene-chapter', `${rounds[Math.max(0, Math.min(2, frame.stage))]} · ${frame.enemyName}`);
    this.roundTicks.forEach((tick, index) => tick.classList.toggle('filled', index < frame.cleared));
    this.roundMarks.setAttribute('aria-label', `已过 ${frame.cleared} 阵，共三阵`);
    this.setText('ink-time', timeText(frame.remaining));
    this.roundStatus.classList.toggle('urgent', frame.remaining <= 30);
    const threatText = frame.counterReady ? '破绽已开 · 立即攻击' : frame.telegraph || '观势 · 候机';
    if (this.danger.textContent !== threatText) this.danger.textContent = threatText;
    this.danger.classList.toggle('danger', Boolean(frame.telegraph) && !frame.counterReady);
    this.danger.classList.toggle('counter', frame.counterReady);
    if (this.toast.textContent !== frame.toast) this.toast.textContent = frame.toast;
    this.attack.classList.toggle('counter-ready', frame.counterReady);
    this.attack.setAttribute('aria-label', frame.counterReady ? '攻击，反击机会已开启' : '攻击');
    this.mute.setAttribute('aria-pressed', String(frame.muted));
    this.mute.querySelector('strong')!.textContent = frame.muted ? '静音' : '开启';
    this.motion.setAttribute('aria-pressed', String(frame.reducedMotion));
    this.motion.querySelector('strong')!.textContent = frame.reducedMotion ? '开启' : '关闭';
    if (frame.mode === 'won' || frame.mode === 'lost') {
      this.setText('ink-result-rounds', `${frame.cleared} / 3`);
      this.setText('ink-result-parries', String(frame.parries));
      this.setText('ink-result-time', timeText(frame.remaining));
      if (frame.mode === 'lost' && frame.reason) this.setText('ink-menu-message', frame.reason);
    }
    if (frame.mode === 'playing' && life < this.lastLife && !frame.reducedMotion) {
      this.life.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 190 });
    }
    this.lastLife = life;
  }

  private setText(id: string, text: string): void {
    const target = required(id);
    if (target.textContent !== text) target.textContent = text;
  }

  private changeMode(frame: UiFrame): void {
    this.mode = frame.mode;
    this.app.dataset.mode = frame.mode;
    this.hud.hidden = frame.mode === 'menu';
    this.touch.hidden = frame.mode !== 'playing';
    this.feedback.hidden = frame.mode !== 'playing';
    this.colophon.hidden = frame.mode !== 'playing';
    this.keyGuide.hidden = frame.mode !== 'playing';
    this.pauseButton.hidden = frame.mode !== 'playing';
    this.overlay.hidden = frame.mode === 'playing';
    this.actions.forEach((action) => { action.disabled = frame.mode !== 'playing'; });
    if (frame.mode === 'playing') {
      this.canvas.focus({ preventScroll: true });
      return;
    }
    const menu = frame.mode === 'menu';
    const paused = frame.mode === 'paused';
    const won = frame.mode === 'won';
    this.setText('ink-menu-overline', menu ? '竹深处 · 一剑候知音' : paused ? '歇剑片刻 · 风声依旧' : won ? '三阵皆过 · 此剑有声' : '胜负未定 · 再问一剑');
    this.setText('ink-menu-title', menu ? '竹影问剑' : paused ? '暂歇锋芒' : won ? '剑过竹林' : '收剑再来');
    this.setText('ink-menu-subtitle', menu ? '水墨剑客' : paused ? '交锋已暂停' : won ? '三轮交锋已完成' : '此局交锋结束');
    this.setText('ink-menu-message', menu ? '听风辨势，见招拆招。于竹林中迎战三位剑客，以格挡与反击问一场胜负。' : paused ? '双方动作与计时均已暂停。调整音效或动态设置，准备好后继续交锋。' : won ? '三位剑客皆已退场，竹林归于寂静。记住接招的一瞬，也记住出剑的时机。' : frame.reason || '一时失招，无妨再来。留意朱红蓄力，等对手出剑前接招，再趁失衡反击。');
    this.primary.dataset.intent = menu ? 'start' : paused ? 'resume' : 'retry';
    this.primary.innerHTML = `${menu ? '执剑入场' : paused ? '继续交锋' : '再战一回'} <span aria-hidden="true">→</span>`;
    this.secondary.hidden = menu;
    required('ink-brief').hidden = !menu;
    required('ink-result').hidden = menu || paused;
    this.sheet.scrollTop = 0;
    this.primary.focus({ preventScroll: true });
  }

  dispose(): void { this.abort.abort(); }
}
