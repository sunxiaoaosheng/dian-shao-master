import { COPY } from '../content/copy';
import type { Ctx } from '../ui/ctx';
import { drawPolaroid, fillTorn, paintPaper } from '../ui/draw';
import { PALETTE, font } from '../ui/theme';
import type { TossMoment } from './moment';

/** 分享图用 5:4，避免会话里把竖图裁坏。文案跟片段是同一下颠勺。 */
export const CARD_W = 500;
export const CARD_H = 400;

export function paintShareCard(ctx: Ctx, moment: TossMoment): void {
  paintPaper(ctx, CARD_W, CARD_H);
  ctx.save();
  ctx.translate(24, 36);
  fillTorn(ctx, 452, 320, 4, PALETTE.white, 0.04);
  drawPolaroid(ctx, 24, 36, 160, 200, 12, 4, moment.ink || PALETTE.chili, moment.dish || '颠勺', false, 0);
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(28, true);
  ctx.fillText(COPY.title, 210, 48);
  ctx.font = font(18, true);
  ctx.fillStyle = PALETTE.chiliDeep;
  const dish = moment.dish || '这口锅';
  ctx.fillText(dish, 210, 100);
  ctx.font = font(16, false);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText(moment.line, 210, 146);
  ctx.fillText(moment.region ? `${moment.region}灶口` : '灶口', 210, 176);
  if (moment.score > 0) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(20, true);
    ctx.fillText(`${moment.score} 分`, 210, 230);
  }
  ctx.restore();
}
