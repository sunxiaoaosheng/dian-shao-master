import { clonePieces } from './grid';
import type { Piece } from './types';

export interface BurnConfig {
  dtMs: number;
  cookScale: number;
  baseBurnMs: number;
  burnPerLevelMs: number;
  burnChunk: number;
  passivePerSec: number;
}

export interface BurnTick {
  cells: Piece[];
  meterDelta: number;
  newlyBurnt: number;
}

export function burnLimitMs(level: number, baseBurnMs: number, burnPerLevelMs: number): number {
  const safe = level <= 1 ? 1 : level;
  return baseBurnMs + (safe - 1) * burnPerLevelMs;
}

/** 火候：放着不管会糊，糊一次锅沿就涨一截；另外整口锅会自己慢慢升温。 */
export function advanceBurn(cells: readonly Piece[], cfg: BurnConfig): BurnTick {
  const next = clonePieces(cells);
  let meterDelta = cfg.passivePerSec * (cfg.dtMs / 1000);
  let newlyBurnt = 0;

  for (let i = 0; i < next.length; i += 1) {
    const cell = next[i];
    if (cell.level <= 0 || cell.burnt) continue;
    cell.cookMs += cfg.dtMs * cfg.cookScale;
    const limit = burnLimitMs(cell.level, cfg.baseBurnMs, cfg.burnPerLevelMs);
    if (cell.cookMs >= limit) {
      cell.burnt = true;
      meterDelta += cfg.burnChunk;
      newlyBurnt += 1;
    }
  }

  return { cells: next, meterDelta, newlyBurnt };
}

export function cookRatio(cell: Piece, baseBurnMs: number, burnPerLevelMs: number): number {
  if (cell.level <= 0) return 0;
  if (cell.burnt) return 1;
  const limit = burnLimitMs(cell.level, baseBurnMs, burnPerLevelMs);
  if (limit <= 0) return 1;
  const ratio = cell.cookMs / limit;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return ratio;
}
