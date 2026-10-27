/** 颠勺那一下的快照。竖屏片段和分享卡都从这里取，不各自拼文案。 */
export interface TossMoment {
  dish: string;
  region: string;
  line: string;
  score: number;
  energy: number;
  ink: string;
}

export function momentLine(dish: string): string {
  if (dish) return `颠到「${dish}」的那一下`;
  return '就这一下，锅气起来了';
}
