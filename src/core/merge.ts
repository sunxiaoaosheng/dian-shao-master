import { clonePieces, emptyPiece, neighbors4 } from './grid';
import type { GameEvent, Piece } from './types';

export interface MergeOutcome {
  cells: Piece[];
  events: GameEvent[];
  scoreGained: number;
  mergeCount: number;
  plated: number;
}

/**
 * 四向相邻、同等级、没糊的食材合成下一级。
 * 两组及以上顶级菜会装盘离锅，给后面的食材腾位。
 */
export function resolveMerges(
  cells: readonly Piece[],
  cols: number,
  rows: number,
  maxLevel: number,
  anchor: number,
): MergeOutcome {
  const next = clonePieces(cells);
  const events: GameEvent[] = [];
  let scoreGained = 0;
  let mergeCount = 0;
  let plated = 0;
  let currentAnchor = anchor;
  let guard = 0;

  while (guard < 16) {
    guard += 1;
    const groups = collectGroups(next, cols, rows, maxLevel);
    if (!groups.length) break;

    for (let g = 0; g < groups.length; g += 1) {
      const group = groups[g].slice().sort((a, b) => a - b);
      const level = next[group[0]].level;
      if (level >= maxLevel) {
        for (let i = 0; i < group.length; i += 1) next[group[i]] = emptyPiece();
        plated += 1;
        scoreGained += 80;
        events.push({ type: 'plate' });
        continue;
      }

      let survivor = group[0];
      if (group.indexOf(currentAnchor) >= 0) survivor = currentAnchor;
      for (let i = 0; i < group.length; i += 1) {
        if (group[i] !== survivor) next[group[i]] = emptyPiece();
      }
      const born = next[survivor];
      born.level = level + 1;
      born.cookMs = 0;
      born.burnt = false;
      currentAnchor = survivor;
      scoreGained += 10 * born.level;
      mergeCount += 1;
      events.push({ type: 'merge', level: born.level });
      if (born.level >= maxLevel) events.push({ type: 'signature' });
    }
  }

  return { cells: next, events, scoreGained, mergeCount, plated };
}

function collectGroups(cells: readonly Piece[], cols: number, rows: number, maxLevel: number): number[][] {
  const seen: boolean[] = [];
  for (let i = 0; i < cells.length; i += 1) seen.push(false);
  const groups: number[][] = [];

  for (let i = 0; i < cells.length; i += 1) {
    if (seen[i]) continue;
    const piece = cells[i];
    if (piece.level <= 0 || piece.burnt || piece.level > maxLevel) {
      seen[i] = true;
      continue;
    }
    const stack = [i];
    const group: number[] = [];
    seen[i] = true;
    while (stack.length) {
      const cur = stack.pop() as number;
      group.push(cur);
      const near = neighbors4(cur, cols, rows);
      for (let n = 0; n < near.length; n += 1) {
        const j = near[n];
        if (seen[j]) continue;
        const other = cells[j];
        if (other.burnt || other.level !== piece.level) continue;
        seen[j] = true;
        stack.push(j);
      }
    }
    if (group.length >= 2) groups.push(group);
  }

  return groups;
}
