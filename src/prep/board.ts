import type { Dish, Ingredient } from '../content/dishes';

export interface PrepPiece {
  id: string;
  name: string;
  ink: string;
  role: 'need' | 'decoy' | 'taboo';
  got: boolean;
}

export interface PrepState {
  pieces: PrepPiece[];
  wrong: number;
  maxWrong: number;
  leftMs: number;
  totalMs: number;
  enforce: boolean;
  status: 'working' | 'ready' | 'wrong' | 'timeout';
  /** 最近一次点错的原料，用来画红叉。 */
  missId: string;
}

export const PREP_MAX_WRONG = 3;

export function createPrep(dish: Dish, enforce: boolean, includeDecoys: boolean): PrepState {
  const pieces: PrepPiece[] = [];
  pushAll(pieces, dish.need, 'need');
  if (includeDecoys) {
    pushAll(pieces, dish.decoys, 'decoy');
    if (dish.taboo && dish.tabooPiece) pushAll(pieces, [dish.tabooPiece], 'taboo');
  }
  const total = Math.round(dish.prepSeconds * 1000 * dish.pace);
  return {
    pieces,
    wrong: 0,
    maxWrong: PREP_MAX_WRONG,
    leftMs: total,
    totalMs: total,
    enforce,
    status: 'working',
    missId: '',
  };
}

export function tapPrep(state: PrepState, id: string): PrepState {
  if (state.status !== 'working') return state;
  const pieces = state.pieces.map((piece) => Object.assign({}, piece));
  let found: PrepPiece | null = null;
  for (let i = 0; i < pieces.length; i += 1) {
    if (pieces[i].id === id) found = pieces[i];
  }
  if (!found || found.got) return state;
  if (found.role === 'need') {
    found.got = true;
    const ready = pieces.every((piece) => piece.role !== 'need' || piece.got);
    return Object.assign({}, state, { pieces, status: ready ? 'ready' : 'working', missId: '' });
  }
  const wrong = state.wrong + 1;
  const failed = state.enforce && wrong >= state.maxWrong;
  return Object.assign({}, state, {
    pieces,
    wrong,
    status: failed ? 'wrong' : state.status,
    missId: found.id,
  });
}

export function tickPrep(state: PrepState, dtMs: number): PrepState {
  if (state.status !== 'working') return state;
  const left = state.leftMs - Math.max(0, dtMs);
  if (left <= 0 && state.enforce) {
    return Object.assign({}, state, { leftMs: 0, status: 'timeout' });
  }
  return Object.assign({}, state, { leftMs: Math.max(0, left) });
}

export function prepPenalty(state: PrepState): number {
  return state.wrong * 6;
}

function pushAll(pieces: PrepPiece[], list: readonly Ingredient[], role: PrepPiece['role']): void {
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    pieces.push({ id: item.id, name: item.name, ink: item.ink, role, got: false });
  }
}
