/** 出锅分数和评级。只看结果，不碰微信。 */

export type Rating = 'wreck' | 'pass' | 'sign' | 'god';

export const PASS_SCORE = 60;
export const SIGN_SCORE = 80;
export const GOD_SCORE = 92;

export function ratingFor(score: number): Rating {
  const safe = clampScore(score);
  if (safe >= GOD_SCORE) return 'god';
  if (safe >= SIGN_SCORE) return 'sign';
  if (safe >= PASS_SCORE) return 'pass';
  return 'wreck';
}

export function isPassing(rating: Rating): boolean {
  return rating === 'pass' || rating === 'sign' || rating === 'god';
}

/** 招牌和神菜才能进主页橱窗。及格只记通关进度。 */
export function entersWindow(rating: Rating): boolean {
  return rating === 'sign' || rating === 'god';
}

export function clampScore(score: number): number {
  if (!isFinite(score) || score <= 0) return 0;
  if (score >= 100) return 100;
  return Math.round(score);
}
