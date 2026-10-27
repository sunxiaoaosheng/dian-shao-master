import { FOOD, FX, TYPE, UI, foodForLevel } from '../content/collage';
import { COPY } from '../content/copy';
import { toastImageFor } from '../content/toasts';
import type { Ctx } from './ctx';
import {
  drawButton,
  drawMeter,
  drawPolaroid,
  drawSeal,
  drawSteam,
  drawWok,
  drawWrapped,
  fillTorn,
  paintPaper,
} from './draw';
import { drawSprite } from './sprites';
import { PALETTE, font } from './theme';
import type { ViewModel } from './types';

export function paint(ctx: Ctx, vm: ViewModel): void {
  ctx.save();
  if (vm.shake > 0.04) {
    const mag = vm.shake * 8;
    ctx.translate(Math.sin(vm.now / 28) * mag, Math.cos(vm.now / 22) * mag * 0.65);
  }
  if (!drawSprite(ctx, UI.paperBg, 0, 0, vm.width, vm.height)) paintPaper(ctx, vm.width, vm.height);
  if (vm.screen === 'home') paintHome(ctx, vm);
  else if (vm.screen === 'play') paintPlay(ctx, vm);
  else if (vm.screen === 'result') paintResult(ctx, vm);
  else paintAlbum(ctx, vm);
  paintToasts(ctx, vm);
  if (vm.qaLines.length) paintQa(ctx, vm);
  ctx.restore();
}

function paintHome(ctx: Ctx, vm: ViewModel): void {
  const cardY = vm.seal ? vm.seal.y : 16;
  const cardW = vm.width - 112;
  const cardH = 118;
  ctx.save();
  ctx.translate(16, cardY);
  if (!drawSprite(ctx, UI.panelTorn, 0, 0, cardW, cardH)) fillTorn(ctx, cardW, cardH, 11, PALETTE.white, 0.04);
  drawSprite(ctx, UI.tapeStrip, 18, -8, 78, 22);
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(30, true);
  ctx.fillText(vm.title, 14, 12);
  ctx.font = font(13, false);
  ctx.fillStyle = PALETTE.inkSoft;
  drawWrapped(ctx, vm.subtitle, 14, 48, cardW - 26, 16);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(15, true);
  ctx.fillText(vm.playsLabel, 14, 86);
  ctx.restore();

  if (vm.seal) drawSeal(ctx, vm.seal.x, vm.seal.y, vm.seal.w, COPY.seal);

  const tierButton = vm.buttons[0];
  if (tierButton) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(13, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${COPY.tierTitle} · 下锅是${vm.heatLabel}`, 20, tierButton.y - 18);
  }

  paintButtons(ctx, vm);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = font(12, false);
  ctx.textAlign = 'left';
  const hintY = tierButton ? tierButton.y + 42 : cardY + cardH + 8;
  drawWrapped(ctx, vm.playsHint, 20, hintY, vm.width - 40, 16);

  if (vm.showBoard) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(14, true);
    ctx.textAlign = 'left';
    ctx.fillText(vm.boardTitle, 20, vm.boardTop);
    ctx.font = font(13, false);
    for (let i = 0; i < vm.board.length; i += 1) {
      const row = vm.board[i];
      ctx.fillStyle = PALETTE.chiliDeep;
      ctx.fillText(row.region, 20, vm.boardTop + 22 + i * 18);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.fillText(row.line, 62, vm.boardTop + 22 + i * 18);
    }
  }
}

function paintPlay(ctx: Ctx, vm: ViewModel): void {
  const play = vm.play;
  if (!play) return;
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(22, true);
  ctx.fillText(play.recipeName, 16, 12);
  ctx.font = font(13, false);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText(`${play.region} · ${vm.heatLabel}`, 16, 40);
  ctx.textAlign = 'right';
  ctx.font = font(16, true);
  if (drawSprite(ctx, UI.scoreChip, vm.width - 104, 8, 88, 30)) {
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(play.scoreText, vm.width - 60, 14);
  } else {
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(play.scoreText, vm.width - 16, 16);
  }
  ctx.font = font(12, false);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText(play.chargesText, vm.width - 16, 40);
  paintHearts(ctx, vm.width - 16, 56, play.charges, play.maxCharges);

  if (!paintMeter(ctx, 16, 64, vm.width - 32, 12, play.meter)) {
    drawMeter(ctx, 16, 64, vm.width - 32, 12, play.meter);
  }
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.textAlign = 'left';
  ctx.font = font(11, true);
  ctx.fillText(COPY.meter, 16, 50);

  if (!drawSprite(ctx, FOOD.wokBase, play.wok.x, play.wok.y + play.wok.h * 0.35, play.wok.w, play.wok.h * 0.55)) {
    drawWok(ctx, play.wok.x, play.wok.y, play.wok.w, play.wok.h);
  }
  drawSprite(ctx, FOOD.oilSheen, play.wok.x + play.wok.w * 0.18, play.wok.y + play.wok.h * 0.42, play.wok.w * 0.64, play.wok.h * 0.28);
  drawSprite(ctx, FOOD.wokHandle, play.wok.x - 18, play.wok.y + play.wok.h * 0.2, 28, 72);
  drawSteam(ctx, play.wok.x + play.wok.w / 2, play.wok.y + 6, vm.now);
  if (play.meter > 0.72) {
    drawSprite(ctx, FX.flameLick, vm.width - 48, 48, 28, 42);
  }

  for (let i = 0; i < play.cells.length; i += 1) {
    const cell = play.cells[i];
    if (cell.level <= 0) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = PALETTE.ironLite;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(cell.x + 6, cell.y + 6, cell.w - 12, cell.h - 12);
      ctx.restore();
      continue;
    }
    const food = foodForLevel(cell.level, cell.seed);
    if (!drawSprite(ctx, food, cell.x + 4, cell.y + 4, cell.w - 8, cell.h - 22)) {
      drawPolaroid(ctx, cell.x, cell.y, cell.w, cell.h, cell.seed, cell.level, cell.ink, cell.name, cell.burnt, cell.cook);
    } else {
      ctx.fillStyle = PALETTE.ink;
      ctx.font = font(11, true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(cell.name, cell.x + cell.w / 2, cell.y + cell.h - 1);
      if (cell.level >= 2) drawSprite(ctx, FOOD.scallion, cell.x + cell.w - 18, cell.y + 2, 16, 10);
      if (cell.burnt) {
        drawSprite(ctx, FX.smokePuff, cell.x, cell.y, cell.w, cell.h * 0.7);
        drawSprite(ctx, FX.missDrip, cell.x + cell.w * 0.35, cell.y + cell.h * 0.4, 14, 22);
      }
    }
  }

  drawPolaroid(
    ctx,
    play.nextBox.x,
    play.nextBox.y,
    play.nextBox.w,
    play.nextBox.h,
    9,
    play.nextLevel,
    play.nextInk,
    play.nextName,
    false,
    0,
  );
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.textAlign = 'left';
  ctx.font = font(11, false);
  ctx.fillText(COPY.next, play.nextBox.x, play.nextBox.y - 16);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(12, false);
  const note = play.overflowText || play.hint || vm.sensorLabel;
  ctx.fillStyle = play.overflowText ? PALETTE.chiliDeep : PALETTE.inkSoft;
  const noteX = play.nextBox.x + play.nextBox.w + 8;
  const noteW = play.showTossButton ? vm.width - noteX - 160 : vm.width - noteX - 16;
  drawWrapped(ctx, note, noteX, play.nextBox.y, Math.max(80, noteW), 16);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText(play.tossedText, noteX, play.nextBox.y + 36);

  if (vm.shake > 0.2) {
    const scraps = [FX.scrap01, FX.scrap02, FX.scrap03];
    const stars = [FX.star01, FX.star02, FX.star03, FX.star04];
    const cx = play.wok.x + play.wok.w / 2;
    const cy = play.wok.y + play.wok.h * 0.35;
    ctx.save();
    ctx.globalAlpha = Math.max(0.35, vm.shake);
    for (let i = 0; i < scraps.length; i += 1) {
      drawSprite(ctx, scraps[i], cx - 70 + i * 36, cy - 28 - i * 10, 22, 22);
    }
    for (let i = 0; i < stars.length; i += 1) {
      drawSprite(ctx, stars[i], cx - 40 + (i % 2) * 48, cy - 10 - i * 8, 16, 16);
    }
    if (vm.shake > 0.65) drawSprite(ctx, FX.perfectBurst, cx - 48, cy - 48, 96, 96);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = vm.shake * 0.8;
    ctx.strokeStyle = PALETTE.white;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cx - 30 - i * 8, cy);
      ctx.lineTo(cx - 48 - i * 10, cy - 16);
      ctx.moveTo(cx + 30 + i * 8, cy);
      ctx.lineTo(cx + 48 + i * 10, cy - 16);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (play.showPerfect) {
    drawSprite(ctx, TYPE.perfect, play.wok.x + play.wok.w - 54, play.wok.y, 48, 28);
  }
  if (play.showBurnt) {
    drawSprite(ctx, TYPE.burnt, play.wok.x + 8, play.wok.y, 48, 28);
  }

  paintButtons(ctx, vm);
}

function paintResult(ctx: Ctx, vm: ViewModel): void {
  const result = vm.result;
  if (!result) return;
  ctx.save();
  ctx.translate(20, 28);
  fillTorn(ctx, vm.width - 40, 168, 21, PALETTE.white, 0.05);
  ctx.fillStyle = PALETTE.chiliDeep;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(36, true);
  ctx.fillText(result.title, 18, 18);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(16, true);
  ctx.fillText(result.scoreText, 18, 64);
  ctx.font = font(15, false);
  ctx.fillStyle = PALETTE.inkSoft;
  drawWrapped(ctx, result.body, 18, 96, vm.width - 78, 22);
  ctx.restore();
  paintButtons(ctx, vm);
}

function paintAlbum(ctx: Ctx, vm: ViewModel): void {
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(28, true);
  ctx.fillText(vm.albumTitle, 18, 20);
  const cards = vm.album || [];
  for (let i = 0; i < cards.length; i += 1) {
    const card = cards[i];
    if (!card.owned) {
      ctx.save();
      ctx.translate(card.x, card.y);
      fillTorn(ctx, card.w, card.h, 40 + i, '#efe4d0', 0.05);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = font(14, true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.name, card.w / 2, card.h / 2);
      ctx.restore();
      continue;
    }
    drawPolaroid(ctx, card.x, card.y, card.w, card.h - 28, 80 + i, card.level, card.ink, card.name, false, 0);
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = font(11, false);
    ctx.textAlign = 'left';
    ctx.fillText(`${card.region} · ${card.blurb}`, card.x, card.y + card.h - 16);
  }
  paintButtons(ctx, vm);
}

function paintButtons(ctx: Ctx, vm: ViewModel): void {
  for (let i = 0; i < vm.buttons.length; i += 1) {
    const button = vm.buttons[i];
    const plate = button.primary ? UI.btnPrimary : UI.btnGhost;
    if (!drawSprite(ctx, plate, button.x, button.y, button.w, button.h)) {
      drawButton(ctx, button.x, button.y, button.w, button.h, button.label, button.primary, button.disabled, button.selected);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = button.disabled ? 0.45 : 1;
    ctx.fillStyle = button.primary ? PALETTE.white : PALETTE.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = button.h >= 46 ? 18 : 15;
    ctx.font = font(size, true);
    while (size > 11 && ctx.measureText(button.label).width > button.w - 18) {
      size -= 1;
      ctx.font = font(size, true);
    }
    ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
    if (button.selected) {
      ctx.strokeStyle = PALETTE.chiliDeep;
      ctx.lineWidth = 2;
      ctx.strokeRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
    }
    ctx.restore();
  }
}

function paintToasts(ctx: Ctx, vm: ViewModel): void {
  for (let i = 0; i < vm.toasts.length; i += 1) {
    const toast = vm.toasts[i];
    const w = Math.min(vm.width - 48, 240);
    const x = (vm.width - w) / 2;
    const y = vm.toastY - i * 42;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.03);
    ctx.globalAlpha = Math.max(0.2, toast.life);
    const plate = toastImageFor(toast.text);
    if (!plate || !drawSprite(ctx, plate, 0, 0, w, 34)) fillTorn(ctx, w, 34, toast.seed || 3, '#fffaf1', 0.06);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(15, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(toast.text, w / 2, 18);
    ctx.restore();
  }
}

function paintMeter(ctx: Ctx, x: number, y: number, w: number, h: number, ratio: number): boolean {
  if (!drawSprite(ctx, UI.progressTrack, x, y, w, h)) return false;
  const clamped = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, Math.max(0, w * clamped), h);
  ctx.clip();
  drawSprite(ctx, UI.progressFill, x, y, w, h);
  ctx.restore();
  return true;
}

function paintHearts(ctx: Ctx, right: number, y: number, charges: number, maxCharges: number): void {
  const size = 14;
  const gap = 2;
  const count = Math.max(0, Math.min(6, maxCharges));
  for (let i = 0; i < count; i += 1) {
    const frame = i < charges ? UI.heart : UI.heartEmpty;
    const x = right - (count - i) * (size + gap);
    drawSprite(ctx, frame, x, y, size, size);
  }
}

function paintQa(ctx: Ctx, vm: ViewModel): void {
  ctx.save();
  ctx.fillStyle = PALETTE.chiliDeep;
  ctx.font = font(11, true);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (let i = 0; i < vm.qaLines.length; i += 1) {
    ctx.fillText(vm.qaLines[i], 8, 4 + i * 13);
  }
  ctx.restore();
}
