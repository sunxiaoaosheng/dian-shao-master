import { COPY } from '../content/copy';
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
import { PALETTE, font } from './theme';
import type { ViewModel } from './types';

export function paint(ctx: Ctx, vm: ViewModel): void {
  ctx.save();
  if (vm.shake > 0.04) {
    const mag = vm.shake * 8;
    ctx.translate(Math.sin(vm.now / 28) * mag, Math.cos(vm.now / 22) * mag * 0.65);
  }
  paintPaper(ctx, vm.width, vm.height);
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
  fillTorn(ctx, cardW, cardH, 11, PALETTE.white, 0.04);
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
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'right';
  ctx.font = font(16, true);
  ctx.fillText(play.scoreText, vm.width - 16, 16);
  ctx.font = font(12, false);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText(play.chargesText, vm.width - 16, 38);

  drawMeter(ctx, 16, 64, vm.width - 32, 12, play.meter);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.textAlign = 'left';
  ctx.font = font(11, true);
  ctx.fillText(COPY.meter, 16, 50);

  drawWok(ctx, play.wok.x, play.wok.y, play.wok.w, play.wok.h);
  drawSteam(ctx, play.wok.x + play.wok.w / 2, play.wok.y + 6, vm.now);

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
    drawPolaroid(ctx, cell.x, cell.y, cell.w, cell.h, cell.seed, cell.level, cell.ink, cell.name, cell.burnt, cell.cook);
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
    ctx.save();
    ctx.globalAlpha = vm.shake * 0.8;
    ctx.strokeStyle = PALETTE.white;
    ctx.lineWidth = 2;
    const cx = play.wok.x + play.wok.w / 2;
    const cy = play.wok.y + play.wok.h * 0.4;
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
    drawButton(ctx, button.x, button.y, button.w, button.h, button.label, button.primary, button.disabled, button.selected);
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
    fillTorn(ctx, w, 34, toast.seed || 3, '#fffaf1', 0.06);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(15, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(toast.text, w / 2, 18);
    ctx.restore();
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
