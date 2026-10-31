export interface HitRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 后画的在上面，所以从末尾往前找。 */
export function hitTest(rects: readonly HitRect[], x: number, y: number): string | null {
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const rect = rects[i];
    if (x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h) return rect.id;
  }
  return null;
}
