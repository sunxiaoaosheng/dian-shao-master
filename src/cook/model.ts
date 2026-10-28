import type { Dish, Want } from '../content/dishes';
import { phaseAt } from '../content/dishes';
import type { Rating } from './score';
import { clampScore, ratingFor } from './score';

export const TOSS_PULSE_MS = 320;

export interface DropState {
  id: string;
  at: number;
  window: number;
  label: string;
  kind: string;
  hit: boolean;
  missed: boolean;
}

export interface CookState {
  dishId: string;
  elapsedMs: number;
  durationMs: number;
  even: number;
  burn: number;
  pulseMs: number;
  drops: DropState[];
  status: 'cooking' | 'burnt' | 'plated';
  want: Want;
  hint: string;
  burnScale: number;
}

export interface Grade {
  score: number;
  rating: Rating;
  even: number;
  burn: number;
  dropsHit: number;
  dropsTotal: number;
}

export function createCook(dish: Dish, burnScale = 1): CookState {
  const phase = dish.phases[0];
  return {
    dishId: dish.id,
    elapsedMs: 0,
    durationMs: Math.round(dish.cookSeconds * 1000 * dish.pace),
    even: 0,
    burn: 0,
    pulseMs: 0,
    drops: dish.drops.map((drop) => ({
      id: drop.id,
      at: drop.at,
      window: drop.window,
      label: drop.label,
      kind: drop.kind,
      hit: false,
      missed: false,
    })),
    status: 'cooking',
    want: phase ? phase.want : 'hold',
    hint: phase ? phase.hint : '',
    burnScale: burnScale > 0 ? burnScale : 1,
  };
}

export function tossCook(state: CookState): CookState {
  if (state.status !== 'cooking') return state;
  return Object.assign({}, state, { pulseMs: TOSS_PULSE_MS });
}

export function plateCook(state: CookState): CookState {
  if (state.status !== 'cooking') return state;
  return Object.assign({}, state, { status: 'plated' });
}

export function tickCook(state: CookState, dtMs: number, dish: Dish): CookState {
  if (state.status !== 'cooking') return state;
  const dt = Math.max(0, Math.min(100, dtMs));
  const tossing = state.pulseMs > 0;
  const elapsed = state.elapsedMs + dt;
  const progress = state.durationMs <= 0 ? 1 : elapsed / state.durationMs;
  const phase = phaseAt(dish, Math.min(1, progress));
  const scale = state.burnScale;
  let even = state.even;
  let burn = state.burn;
  if (tossing && phase.want === 'toss') even += phase.evenPerSec * (dt / 1000);
  else if (tossing && phase.want === 'hold') burn += phase.burnPerSec * scale * (dt / 1000);
  else if (!tossing && phase.want === 'toss') burn += phase.idleBurnPerSec * scale * (dt / 1000);
  else even += phase.evenPerSec * (dt / 1000);

  const drops = state.drops.map((drop) => Object.assign({}, drop));
  for (let i = 0; i < drops.length; i += 1) {
    const drop = drops[i];
    if (drop.hit || drop.missed) continue;
    const center = drop.at * state.durationMs;
    const half = drop.window * state.durationMs;
    if (tossing && Math.abs(elapsed - center) <= half) drop.hit = true;
    else if (elapsed > center + half) drop.missed = true;
  }

  even = clampBar(even);
  burn = clampBar(burn);
  let status: CookState['status'] = 'cooking';
  if (burn >= 100) status = 'burnt';
  else if (elapsed >= state.durationMs) status = 'plated';

  return {
    dishId: state.dishId,
    elapsedMs: Math.min(elapsed, state.durationMs),
    durationMs: state.durationMs,
    even,
    burn,
    pulseMs: Math.max(0, state.pulseMs - dt),
    drops,
    status,
    want: phase.want,
    hint: phase.hint,
    burnScale: state.burnScale,
  };
}

export function cueLabel(state: CookState): string {
  for (let i = 0; i < state.drops.length; i += 1) {
    const drop = state.drops[i];
    if (drop.hit || drop.missed) continue;
    const center = drop.at * state.durationMs;
    const half = drop.window * state.durationMs;
    if (Math.abs(state.elapsedMs - center) <= half) return drop.label;
  }
  return '';
}

export function scoreCook(state: CookState, prepPenalty = 0): Grade {
  const dropsTotal = state.drops.length;
  let hits = 0;
  for (let i = 0; i < state.drops.length; i += 1) {
    if (state.drops[i].hit) hits += 1;
  }
  if (state.status === 'burnt') {
    return { score: 0, rating: 'wreck', even: state.even, burn: state.burn, dropsHit: hits, dropsTotal };
  }
  const dropRatio = dropsTotal === 0 ? 1 : hits / dropsTotal;
  const raw = state.even * 0.72 + (100 - state.burn) * 0.13 + dropRatio * 15 - Math.max(0, prepPenalty);
  const score = clampScore(raw);
  return { score, rating: ratingFor(score), even: state.even, burn: state.burn, dropsHit: hits, dropsTotal };
}

export function debugCook(state: CookState): string[] {
  return [
    `段 ${state.want} 均匀 ${Math.round(state.even)} 糊边 ${Math.round(state.burn)}`,
    `火候倍率 ${state.burnScale.toFixed(1)} 脉冲 ${Math.round(state.pulseMs)}`,
    state.hint,
  ];
}

function clampBar(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
