import type { Ctx } from '../ui/ctx';
import { drawPolaroid, drawSteam, drawWok, fillTorn, paintPaper } from '../ui/draw';
import { PALETTE, font } from '../ui/theme';
import type { TossMoment } from './moment';

/** 竖屏 9:16，主体放在画面中部，对准颠起来的那一下。 */
export const CLIP_W = 540;
export const CLIP_H = 960;

export function paintClip(ctx: Ctx, moment: TossMoment): void {
  paintPaper(ctx, CLIP_W, CLIP_H);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = font(18, false);
  ctx.fillText('颠勺大师', CLIP_W / 2, 72);

  ctx.save();
  ctx.translate(70, 150);
  fillTorn(ctx, CLIP_W - 140, 120, 7, PALETTE.white, 0.05);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(28, true);
  ctx.textAlign = 'center';
  ctx.fillText(moment.line, (CLIP_W - 140) / 2, 36);
  ctx.font = font(16, false);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText(moment.region ? `${moment.region}灶口` : '灶口手账', (CLIP_W - 140) / 2, 78);
  ctx.restore();

  const wokX = 70;
  const wokY = 340;
  const wokW = 400;
  const wokH = 280;
  drawWok(ctx, wokX, wokY, wokW, wokH);
  drawSteam(ctx, CLIP_W / 2, wokY + 20, 400);

  const energy = moment.energy < 0 ? 0 : moment.energy > 1 ? 1 : moment.energy;
  ctx.save();
  ctx.globalAlpha = 0.35 + energy * 0.6;
  ctx.strokeStyle = PALETTE.white;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i += 1) {
    const spread = 24 + i * 16;
    ctx.beginPath();
    ctx.moveTo(CLIP_W / 2 - 20, wokY + 80);
    ctx.lineTo(CLIP_W / 2 - spread, wokY + 20 - i * 8);
    ctx.moveTo(CLIP_W / 2 + 20, wokY + 80);
    ctx.lineTo(CLIP_W / 2 + spread, wokY + 20 - i * 8);
    ctx.stroke();
  }
  ctx.restore();

  drawPolaroid(ctx, CLIP_W / 2 - 70, 470, 140, 160, 19, 4, moment.ink || PALETTE.chili, moment.dish || '这一颠', false, 0);

  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(22, true);
  ctx.textAlign = 'center';
  ctx.fillText(moment.score > 0 ? `${moment.score} 分` : '锅气起来了', CLIP_W / 2, 820);
}
