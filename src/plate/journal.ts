import { ratingLabel } from '../content/copy';
import type { Rating } from '../cook/score';
import type { Ctx } from '../ui/ctx';
import { drawWrapped } from '../ui/draw';
import { drawMenuFrame, drawMenuRule, drawRoundSeal, drawWoodWok, paintSheet } from '../ui/press';
import { PALETTE, font } from '../ui/theme';

/** 出锅强制的一帧手账。9:16，老字号竖版传单。 */
export const JOURNAL_W = 540;
export const JOURNAL_H = 960;

export interface JournalCard {
  dish: string;
  region: string;
  rating: Rating;
  quip: string;
  science: string;
  score: number;
}

export function paintJournal(ctx: Ctx, card: JournalCard): void {
  paintSheet(ctx, JOURNAL_W, JOURNAL_H);
  drawMenuFrame(ctx, JOURNAL_W, JOURNAL_H);
  ctx.fillStyle = PALETTE.chili;
  ctx.font = font(16, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('老字号 · 颠勺王', JOURNAL_W / 2, 36);
  drawMenuRule(ctx, 70, 64, JOURNAL_W - 140);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(42, true);
  ctx.fillText(card.dish, JOURNAL_W / 2, 84);
  ctx.fillStyle = PALETTE.chili;
  ctx.font = font(16, false);
  ctx.fillText(card.region, JOURNAL_W / 2, 136);
  drawWoodWok(ctx, 50, 160, JOURNAL_W - 100, 420, 0.8, card.rating === 'wreck' ? 0.85 : 0.15, false);
  drawRoundSeal(ctx, JOURNAL_W - 110, 500, 58, ratingLabel(card.rating));
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(28, true);
  ctx.fillText(`${card.score} 分`, JOURNAL_W / 2, 600);
  ctx.font = font(20, false);
  ctx.textAlign = 'left';
  drawWrapped(ctx, card.quip, 64, 650, JOURNAL_W - 128, 28);
  drawMenuRule(ctx, 64, 720, JOURNAL_W - 128);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = font(16, false);
  drawWrapped(ctx, card.science, 64, 736, JOURNAL_W - 128, 26);
  ctx.fillStyle = PALETTE.chili;
  ctx.font = font(14, true);
  ctx.textAlign = 'center';
  ctx.fillText('今晚六桌', JOURNAL_W / 2, 880);
}
