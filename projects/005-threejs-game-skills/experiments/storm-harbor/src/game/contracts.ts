export type GameMode = 'menu' | 'playing' | 'paused' | 'won' | 'lost';
export interface Vec { x: number; z: number }
export interface Hazard extends Vec { stunned: number; phase: number }
export interface GameState {
  mode: GameMode; player: Vec & { vx: number; vz: number }; delivered: number;
  cargo: number[]; collected: boolean[]; hull: number; remaining: number; time: number;
  heat: number; overheated: boolean; pulseCooldown: number; invulnerable: number;
  pulse: number; impact: number; boosting: boolean; reason: string; hazards: Hazard[];
}
export interface WorldFrame {
  x: number; z: number; vx: number; vz: number; heading: number; speed: number;
  boosting: boolean; heat: number; hull: number; time: number; collected: boolean[];
  cargoCount: number; delivered: number; hazards: { x: number; z: number; stunned: boolean }[];
  pulse: number; impact: number; mode: GameMode; reducedMotion: boolean;
}
export interface UiFrame {
  mode: GameMode; delivered: number; cargo: number; hull: number; remaining: number;
  heat: number; overheated: boolean; pulseCooldown: number; wave: number; speed: number;
  reason: string; toast: string; muted: boolean; reducedMotion: boolean;
  player: Vec; pickups: (Vec & { collected: boolean })[]; hazards: (Vec & { stunned: boolean })[];
}
export type UiIntent = 'start' | 'pause' | 'resume' | 'retry' | 'menu' | 'mute' | 'motion';
export interface Controls { x: number; z: number; boost: boolean; pulse: boolean }
