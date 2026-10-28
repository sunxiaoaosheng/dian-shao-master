import type { Ctx } from './ctx';
import { drawButton, drawIngredient, drawMeter, drawSeal, drawWrapped, fillTorn, paintPaper } from './draw';
import { PALETTE, font } from './theme';
import type { ViewModel } from './types';

export function paint(ctx: Ctx, vm: ViewModel): void {
  paintPaper(ctx, vm.width, vm.height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, vm.width, vm.height);
  ctx.clip();
  fillTorn(ctx, vm.width - 24, 132, 3, PALETTE.white, 0.035);
  ctx.restore();

  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(28, true);
  ctx.fillText(vm.title, 20, 28);
  ctx.font = font(14, false);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText(vm.subtitle, 20, 64);

  let y = 96;
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(15, false);
  for (let i = 0; i < vm.lines.length; i += 1) {
    y = drawWrapped(ctx, vm.lines[i], 20, y, vm.width - 40, 22);
    y += 4;
  }
  if (vm.hint) {
    ctx.fillStyle = PALETTE.chiliDeep;
    ctx.font = font(14, true);
    y = drawWrapped(ctx, vm.hint, 20, y + 6, vm.width - 40, 20);
  }
  if (vm.even !== null) {
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = font(12, false);
    ctx.fillText('均匀', 20, y + 16);
    drawMeter(ctx, 64, y + 18, vm.width - 88, 14, vm.even);
    ctx.fillText('糊边', 20, y + 40);
    drawMeter(ctx, 64, y + 42, vm.width - 88, 14, vm.burn || 0);
  }
  for (let i = 0; i < vm.chips.length; i += 1) {
    const chip = vm.chips[i];
    ctx.save();
    ctx.translate(chip.x, chip.y);
    ctx.globalAlpha = chip.got ? 0.45 : 1;
    fillTorn(ctx, chip.w, chip.h, i + 2, chip.bad ? '#f6e0d4' : PALETTE.white, 0.05);
    drawIngredient(ctx, 8, 6, 36, 36, 2, chip.ink, false);
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(16, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(chip.got ? `${chip.label} · 已备` : chip.label, 50, chip.h / 2);
    ctx.restore();
  }
  for (let i = 0; i < vm.buttons.length; i += 1) {
    const button = vm.buttons[i];
    drawButton(ctx, button.x, button.y, button.w, button.h, button.label, button.primary, button.disabled, false);
  }
  if (vm.debugLines.length) {
    ctx.fillStyle = PALETTE.soy;
    ctx.font = font(11, false);
    ctx.textAlign = 'left';
    let dy = vm.height - 16 - vm.debugLines.length * 14;
    for (let i = 0; i < vm.debugLines.length; i += 1) {
      ctx.fillText(vm.debugLines[i], 12, dy);
      dy += 14;
    }
  }
  for (let i = 0; i < vm.hits.length; i += 1) {
    const hit = vm.hits[i];
    if (hit.id === 'seal') drawSeal(ctx, hit.x, hit.y, hit.w, '勺');
  }
}
