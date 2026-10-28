import { COPY, ratingLabel } from '../content/copy';
import type { Rating } from '../cook/score';
import type { Ctx } from '../ui/ctx';
import { drawTape, drawWrapped, fillTorn, paintPaper } from '../ui/draw';
import { drawFood } from '../ui/scraps';
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
  ctx.translate(28, 36);
  ctx.rotate(-0.015);
  fillTorn(ctx, JOURNAL_W - 56, JOURNAL_H - 72, 7, PALETTE.white, 0.045);
  ctx.restore();
  drawTape(ctx, 160, 48, 120, -0.35);
  drawTape(ctx, 400, 70, 90, 0.2);

  ctx.save();
  ctx.translate(70, 110);
  ctx.rotate(0.03);
  fillTorn(ctx, 400, 430, 4, '#efe2cc', 0.04);
  ctx.fillStyle = card.rating === 'wreck' ? '#5c5148' : PALETTE.chili;
  ctx.fillRect(28, 28, 344, 250);
  drawFood(ctx, 'tomato', 120, 150, 70);
  drawFood(ctx, 'egg', 210, 160, 64);
  drawFood(ctx, 'scallion', 280, 150, 60);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(16, false);
  ctx.textAlign = 'center';
  ctx.fillText(card.region, 200, 310);
  ctx.restore();

  ctx.save();
  ctx.translate(390, 250);
  ctx.rotate(-0.12);
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.seal;
  ctx.fill();
  ctx.strokeStyle = '#f3d2c4';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#f8e6df';
  ctx.font = font(26, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ratingLabel(card.rating), 0, 0);
  ctx.restore();

  ctx.fillStyle = PALETTE.chiliDeep;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(18, false);
  ctx.fillText(COPY.title, 64, 560);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(40, true);
  ctx.fillText(card.dish, 64, 590);
  ctx.font = font(26, true);
  ctx.fillText(`${card.score} 分`, 64, 648);
  ctx.font = font(22, false);
  drawWrapped(ctx, card.quip, 64, 700, JOURNAL_W - 128, 32);
  ctx.save();
  ctx.translate(48, 780);
  ctx.rotate(-0.02);
  fillTorn(ctx, JOURNAL_W - 96, 110, 9, '#f7f1e4', 0.04);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = font(18, false);
  drawWrapped(ctx, card.science, 16, 18, JOURNAL_W - 130, 26);
  ctx.restore();
}
