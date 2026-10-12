export type GameMode='menu'|'playing'|'paused'|'won'|'lost';
export type PlayerAction='idle'|'attack'|'parry'|'dodge'|'hurt';
export type EnemyAction='approach'|'windup'|'strike'|'recover'|'stagger'|'defeated';
export type UiIntent='start'|'pause'|'resume'|'retry'|'menu'|'mute'|'motion';
export interface Controls {x:number;attack:boolean;parry:boolean;dodge:boolean;}
export interface FighterFrame {x:number;facing:1|-1;action:PlayerAction|EnemyAction;progress:number;moving:number;}
export interface WorldFrame {time:number;mode:GameMode;stage:number;player:FighterFrame;enemy:FighterFrame;telegraph:number;heavy:boolean;impact:number;parryFlash:number;slash:number;enemySlash:number;reducedMotion:boolean;}
export interface UiFrame {mode:GameMode;stage:number;cleared:number;enemyName:string;enemyHp:number;enemyMaxHp:number;playerHp:number;energy:number;remaining:number;parries:number;reason:string;toast:string;muted:boolean;reducedMotion:boolean;counterReady:boolean;telegraph:string;}
