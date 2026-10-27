/** 锅里的一格。level 0 表示空位。 */
export interface Piece {
  id: number;
  level: number;
  cookMs: number;
  burnt: boolean;
}

export type FailReason = 'burnt_out' | 'grid_full';

export type GameEvent =
  | { type: 'merge'; level: number }
  | { type: 'signature' }
  | { type: 'plate' }
  | { type: 'burn_warn' }
  | { type: 'overflow' }
  | { type: 'fail'; reason: FailReason }
  | { type: 'burnt_piece' };

export type Rng = () => number;
