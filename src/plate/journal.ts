import { COPY, ratingLabel } from '../content/copy';
import type { Rating } from '../cook/score';
import type { Ctx } from '../ui/ctx';
import { drawWrapped, fillTorn, paintPaper } from '../ui/draw';
import { PALETTE, font } from '../ui/theme';

/** 出锅强制的一帧手账。9:16，方便分享。 */
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
  paintPaper(ctx, JOURNAL_W, JOURNAL_H);
  ctx.save();
  ctx.translate(36, 48);
  fillTorn(ctx, JOURNAL_W - 72, JOURNAL_H - 96, 7, PALETTE.white, 0.04);
  ctx.restore();
  ctx.fillStyle = PALETTE.chiliDeep;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(22, false);
  ctx.fillText(COPY.title, 64, 88);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = font(18, false);
  ctx.fillText(card.region, 64, 124);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(42, true);
  ctx.fillText(card.dish, 64, 168);
  ctx.fillStyle = PALETTE.chili;
  ctx.font = font(36, true);
  ctx.fillText(ratingLabel(card.rating), 64, 240);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(28, true);
  ctx.fillText(`${card.score} 分`, 64, 300);
  ctx.font = font(22, false);
  ctx.fillStyle = PALETTE.ink;
  drawWrapped(ctx, card.quip, 64, 360, JOURNAL_W - 128, 32);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = font(18, false);
  drawWrapped(ctx, card.science, 64, 470, JOURNAL_W - 128, 28);
}
