import type { Controls } from '../game/contracts';

const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);
const controlKeys = new Set([...movementKeys, 'ShiftLeft', 'ShiftRight', 'Space']);

function required<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`缺少输入控件：${id}`);
  return node as T;
}

/** Keyboard and pointer input both produce the same world-space controls. */
export class HarborInput {
  private readonly abort = new AbortController();
  private readonly app = required<HTMLElement>('app');
  private readonly stick = required<HTMLElement>('harbor-stick');
  private readonly knob = required<HTMLElement>('harbor-knob');
  private readonly boostButton = required<HTMLButtonElement>('harbor-boost');
  private readonly pulseButton = required<HTMLButtonElement>('harbor-pulse');
  private readonly keys = new Set<string>();
  private readonly boostPointers = new Set<number>();
  private readonly pulsePointers = new Set<number>();
  private stickPointer: number | null = null;
  private stickX = 0;
  private stickZ = 0;
  private pulseQueued = false;

  constructor() {
    const options = { signal: this.abort.signal };
    window.addEventListener('keydown', (event) => {
      if (!controlKeys.has(event.code) || !this.playing() || this.isInterfaceTarget(event.target)) return;
      event.preventDefault();
      if (event.code === 'Space' && !this.keys.has('Space') && !event.repeat) this.pulseQueued = true;
      this.keys.add(event.code);
    }, options);
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      if (controlKeys.has(event.code) && this.playing() && !this.isInterfaceTarget(event.target)) event.preventDefault();
    }, options);
    this.stick.addEventListener('pointerdown', (event) => {
      if (!this.playing() || this.stickPointer !== null) return;
      event.preventDefault();
      this.stickPointer = event.pointerId;
      this.stick.setPointerCapture(event.pointerId);
      this.updateStick(event);
    }, options);
    this.stick.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.stickPointer) return;
      event.preventDefault(); this.updateStick(event);
    }, options);
    const releaseStick = (event: PointerEvent): void => {
      if (event.pointerId === this.stickPointer) this.resetStick();
    };
    this.stick.addEventListener('pointerup', releaseStick, options);
    this.stick.addEventListener('pointercancel', releaseStick, options);
    this.stick.addEventListener('lostpointercapture', releaseStick, options);
    this.boostButton.addEventListener('pointerdown', (event) => {
      if (!this.playing() || this.boostButton.disabled) return;
      event.preventDefault();
      this.boostPointers.add(event.pointerId);
      this.boostButton.setPointerCapture(event.pointerId);
      this.boostButton.classList.add('is-held');
    }, options);
    const releaseBoost = (event: PointerEvent): void => {
      this.boostPointers.delete(event.pointerId);
      this.boostButton.classList.toggle('is-held', this.boostPointers.size > 0);
    };
    this.boostButton.addEventListener('pointerup', releaseBoost, options);
    this.boostButton.addEventListener('pointercancel', releaseBoost, options);
    this.boostButton.addEventListener('lostpointercapture', releaseBoost, options);
    this.pulseButton.addEventListener('pointerdown', (event) => {
      if (!this.playing() || this.pulseButton.disabled) return;
      event.preventDefault(); this.pulseQueued = true;
      this.pulsePointers.add(event.pointerId);
      this.pulseButton.setPointerCapture(event.pointerId);
      this.pulseButton.classList.add('is-held');
    }, options);
    const releasePulse = (event: PointerEvent): void => {
      this.pulsePointers.delete(event.pointerId);
      this.pulseButton.classList.toggle('is-held', this.pulsePointers.size > 0);
    };
    this.pulseButton.addEventListener('pointerup', releasePulse, options);
    this.pulseButton.addEventListener('pointercancel', releasePulse, options);
    this.pulseButton.addEventListener('lostpointercapture', releasePulse, options);
    window.addEventListener('pointerup', (event) => { releaseStick(event); releaseBoost(event); releasePulse(event); }, options);
    window.addEventListener('pointercancel', (event) => { releaseStick(event); releaseBoost(event); releasePulse(event); }, options);
    window.addEventListener('blur', () => this.clear(), options);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clear(); }, options);
  }

  private playing(): boolean { return this.app.dataset.mode === 'playing'; }

  private isInterfaceTarget(target: EventTarget | null): boolean {
    return target instanceof Element && !!target.closest('button, a, input, textarea, select, [contenteditable="true"]');
  }

  private updateStick(event: PointerEvent): void {
    const rect = this.stick.getBoundingClientRect();
    const travel = Math.min(rect.width, rect.height) * .32;
    const dx = event.clientX - rect.left - rect.width / 2;
    const dz = event.clientY - rect.top - rect.height / 2;
    const length = Math.hypot(dx, dz);
    const scale = length > travel ? travel / length : 1;
    const x = dx * scale;
    const z = dz * scale;
    this.stickX = Math.abs(x / travel) < .08 ? 0 : x / travel;
    this.stickZ = Math.abs(z / travel) < .08 ? 0 : z / travel;
    this.knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${z}px))`;
  }

  private resetStick(): void {
    const pointer = this.stickPointer;
    this.stickPointer = null;
    this.stickX = 0; this.stickZ = 0;
    this.knob.style.transform = 'translate(-50%, -50%)';
    if (pointer !== null && this.stick.hasPointerCapture(pointer)) this.stick.releasePointerCapture(pointer);
  }

  read(): Controls {
    if (!this.playing()) { this.clear(); return { x: 0, z: 0, boost: false, pulse: false }; }
    const right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    const down = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    const up = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    let x = Number(right) - Number(left) + this.stickX;
    let z = Number(down) - Number(up) + this.stickZ;
    const length = Math.hypot(x, z);
    if (length > 1) { x /= length; z /= length; }
    const pulse = this.pulseQueued;
    this.pulseQueued = false;
    const boost = !this.boostButton.disabled && (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.boostPointers.size > 0);
    return { x, z, boost, pulse };
  }

  clear(): void {
    this.keys.clear();
    this.pulseQueued = false;
    this.resetStick();
    for (const pointer of this.boostPointers) if (this.boostButton.hasPointerCapture(pointer)) this.boostButton.releasePointerCapture(pointer);
    this.boostPointers.clear();
    for (const pointer of this.pulsePointers) if (this.pulseButton.hasPointerCapture(pointer)) this.pulseButton.releasePointerCapture(pointer);
    this.pulsePointers.clear();
    this.boostButton.classList.remove('is-held');
    this.pulseButton.classList.remove('is-held');
  }

  dispose(): void { this.clear(); this.abort.abort(); }
}
