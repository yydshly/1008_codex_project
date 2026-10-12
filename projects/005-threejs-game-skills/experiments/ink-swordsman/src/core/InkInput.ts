import type { Controls } from '../game/contracts';

type Action = 'attack' | 'parry' | 'dodge';
type PointerBinding = { button: HTMLButtonElement; direction: number };
const actionKeys: Partial<Record<string, Action>> = { KeyJ: 'attack', KeyK: 'parry', KeyL: 'dodge', Space: 'dodge' };
const controlKeys = new Set(['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', ...Object.keys(actionKeys)]);

function required<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`缺少水墨输入控件：${id}`);
  return node as T;
}

/** Keyboard edges and captured touch pointers feed the same fixed-step Controls. */
export class InkInput {
  private readonly abort = new AbortController();
  private readonly app = required<HTMLElement>('app');
  private readonly keys = new Set<string>();
  private readonly pointers = new Map<number, PointerBinding>();
  private readonly queued: Record<Action, boolean> = { attack: false, parry: false, dodge: false };

  constructor() {
    const options = { signal: this.abort.signal };
    window.addEventListener('keydown', (event) => {
      if (!controlKeys.has(event.code) || !this.playing() || this.interfaceTarget(event.target)) return;
      event.preventDefault();
      const action = actionKeys[event.code];
      if (action && !event.repeat && !this.keys.has(event.code)) this.queued[action] = true;
      this.keys.add(event.code);
    }, options);
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      if (controlKeys.has(event.code) && this.playing() && !this.interfaceTarget(event.target)) event.preventDefault();
    }, options);
    this.bindButton('ink-left', -1);
    this.bindButton('ink-right', 1);
    this.bindButton('ink-attack', 0, 'attack');
    this.bindButton('ink-parry', 0, 'parry');
    this.bindButton('ink-dodge', 0, 'dodge');
    window.addEventListener('pointerup', (event) => this.releasePointer(event.pointerId), options);
    window.addEventListener('pointercancel', (event) => this.releasePointer(event.pointerId), options);
    window.addEventListener('blur', () => this.clear(), options);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clear(); }, options);
    document.addEventListener('focusin', (event) => { if (this.interfaceTarget(event.target)) this.clearKeyboard(); }, options);
  }

  private playing(): boolean { return this.app.dataset.mode === 'playing'; }

  private interfaceTarget(target: EventTarget | null): boolean {
    return target instanceof Element && Boolean(target.closest('button, a, input, textarea, select, [contenteditable="true"]'));
  }

  private bindButton(id: string, direction: number, action?: Action): void {
    const button = required<HTMLButtonElement>(id);
    const options = { signal: this.abort.signal };
    button.addEventListener('pointerdown', (event) => {
      if (!this.playing() || button.disabled || event.button !== 0 || this.pointers.has(event.pointerId)) return;
      event.preventDefault();
      this.pointers.set(event.pointerId, { button, direction });
      button.setPointerCapture(event.pointerId);
      button.classList.add('is-held');
      if (action) this.queued[action] = true;
    }, options);
    const release = (event: PointerEvent): void => this.releasePointer(event.pointerId);
    button.addEventListener('pointerup', release, options);
    button.addEventListener('pointercancel', release, options);
    button.addEventListener('lostpointercapture', release, options);
    button.addEventListener('contextmenu', (event) => event.preventDefault(), options);
  }

  private releasePointer(id: number): void {
    const binding = this.pointers.get(id);
    if (!binding) return;
    this.pointers.delete(id);
    const stillHeld = Array.from(this.pointers.values()).some((pointer) => pointer.button === binding.button);
    binding.button.classList.toggle('is-held', stillHeld);
    if (binding.button.hasPointerCapture(id)) binding.button.releasePointerCapture(id);
  }

  private clearKeyboard(): void {
    this.keys.clear();
    this.queued.attack = false;
    this.queued.parry = false;
    this.queued.dodge = false;
  }

  read(): Controls {
    if (!this.playing()) { this.clear(); return { x: 0, attack: false, parry: false, dodge: false }; }
    const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    const right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    const pointerDirection = Array.from(this.pointers.values()).reduce((sum, binding) => sum + binding.direction, 0);
    const controls: Controls = {
      x: Math.max(-1, Math.min(1, Number(right) - Number(left) + pointerDirection)),
      attack: this.queued.attack,
      parry: this.queued.parry,
      dodge: this.queued.dodge,
    };
    this.queued.attack = false;
    this.queued.parry = false;
    this.queued.dodge = false;
    return controls;
  }

  clear(): void {
    this.clearKeyboard();
    for (const id of Array.from(this.pointers.keys())) this.releasePointer(id);
  }

  dispose(): void { this.clear(); this.abort.abort(); }
}
