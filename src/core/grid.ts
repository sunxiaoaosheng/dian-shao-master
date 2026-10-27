import type { Piece } from './types';

export function emptyPiece(): Piece {
  return { id: 0, level: 0, cookMs: 0, burnt: false };
}

export function createGrid(cols: number, rows: number): Piece[] {
  const cells: Piece[] = [];
  const n = cols * rows;
  for (let i = 0; i < n; i += 1) cells.push(emptyPiece());
  return cells;
}

export function neighbors4(index: number, cols: number, rows: number): number[] {
  const x = index % cols;
  const y = (index / cols) | 0;
  const out: number[] = [];
  if (x > 0) out.push(index - 1);
  if (x + 1 < cols) out.push(index + 1);
  if (y > 0) out.push(index - cols);
  if (y + 1 < rows) out.push(index + cols);
  return out;
}

export function countEmpty(cells: readonly Piece[]): number {
  let n = 0;
  for (let i = 0; i < cells.length; i += 1) {
    if (cells[i].level <= 0) n += 1;
  }
  return n;
}

export function emptyIndices(cells: readonly Piece[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < cells.length; i += 1) {
    if (cells[i].level <= 0) out.push(i);
  }
  return out;
}

export function clonePieces(cells: readonly Piece[]): Piece[] {
  return cells.map((cell) => ({
    id: cell.id,
    level: cell.level,
    cookMs: cell.cookMs,
    burnt: cell.burnt,
  }));
}
