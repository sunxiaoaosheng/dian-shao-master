/** 分享文案。真正发不发由玩家点按钮决定，开局不会调用分享。 */

export function shareTitle(dish: string, score: number): string {
  if (dish) return `我把「${dish}」颠出锅气了`;
  if (score > 0) return `这口锅我颠了 ${score} 分`;
  return '今晚这口锅，你来颠一下';
}

export function clipCaption(dish: string): string {
  if (dish) return `颠到「${dish}」的那一下`;
  return '就这一下，锅气起来了';
}

export function shareQuery(): string {
  return 'from=voluntary';
}
