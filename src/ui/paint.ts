import { foodIdForLevel, assetById } from '../content/manifest';
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
import { beginSprites, flushSprites, queueBox, spriteReady } from './sprites';
import { PALETTE, font } from './theme';
import type { ViewModel } from './types';

export function paint(ctx: Ctx, vm: ViewModel): void {
  ctx.save();
  if (vm.shake > 0.04) {
    const mag = vm.shake * 8;
    ctx.translate(Math.sin(vm.now / 28) * mag, Math.cos(vm.now / 22) * mag * 0.65);
  }
  beginSprites();
  queueBox('ui.paperBg', 0, 0, vm.width, vm.height, {
    fallback: (paperCtx) => paintPaper(paperCtx, vm.width, vm.height),
  });
  if (vm.screen === 'home') queueHome(vm);
  else if (vm.screen === 'play') queuePlay(vm);
  else queueButtons(vm);
  queueToasts(vm);
  flushSprites(ctx);
  if (vm.screen === 'home') paintHomeText(ctx, vm);
  else if (vm.screen === 'play') paintPlayText(ctx, vm);
  else if (vm.screen === 'result') paintResult(ctx, vm);
  else paintAlbum(ctx, vm);
  if (vm.screen !== 'home') paintButtonLabels(ctx, vm);
  paintToastText(ctx, vm);
  if (vm.qaLines.length) paintQa(ctx, vm);
  ctx.restore();
}

function queueHome(vm: ViewModel): void {
  const cardY = vm.seal ? vm.seal.y : 16;
  const cardW = vm.width - 112;
  const cardH = 118;
  queueBox('ui.panelTorn', 0, 0, cardW, cardH, {
    tx: 16,
    ty: cardY,
    fallback: (panelCtx) => fillTorn(panelCtx, cardW, cardH, 11, PALETTE.white, 0.04),
  });
  queueBox('ui.tapeStrip', 18, -8, 78, 22, { tx: 16, ty: cardY });
  queueButtons(vm);
}

function paintHomeText(ctx: Ctx, vm: ViewModel): void {
  const cardY = vm.seal ? vm.seal.y : 16;
  const cardW = vm.width - 112;
  ctx.save();
  ctx.translate(16, cardY);
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
    drawWrapped(ctx, `${COPY.tierTitle} · 下锅是${vm.heatLabel}。${vm.goalText}`, 20, tierButton.y - 36, vm.width - 40, 16);
  }

  paintButtonLabels(ctx, vm);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = font(12, false);
  ctx.textAlign = 'left';
  const hintY = tierButton ? tierButton.y + 42 : cardY + 118 + 8;
  let playsY = hintY;
  if (vm.feelText) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(12, true);
    drawWrapped(ctx, vm.feelText, 20, hintY, vm.width - 40, 14);
    playsY = hintY + 16;
  }
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = font(12, false);
  drawWrapped(ctx, vm.playsHint, 20, playsY, vm.width - 40, 16);

  if (vm.showBoard) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(14, true);
    ctx.textAlign = 'left';
    ctx.fillText(vm.boardTitle, 20, vm.boardTop);
    ctx.font = font(13, false);
    if (!vm.board.length) {
      ctx.fillStyle = PALETTE.inkSoft;
      drawWrapped(ctx, vm.boardNote, 20, vm.boardTop + 22, vm.width - 40, 18);
    }
    for (let i = 0; i < vm.board.length; i += 1) {
      const row = vm.board[i];
      ctx.fillStyle = PALETTE.chiliDeep;
      ctx.fillText(row.region, 20, vm.boardTop + 22 + i * 18);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.fillText(row.line, 62, vm.boardTop + 22 + i * 18);
    }
  }
}

function queuePlay(vm: ViewModel): void {
  const play = vm.play;
  if (!play) return;
  const wokX = play.wok.x;
  const wokY = play.wok.y + play.wok.h * 0.35;
  const wokW = play.wok.w;
  const wokH = play.wok.h * 0.55;
  queueBox('food.wokHandle', wokX - 18, play.wok.y + play.wok.h * 0.2, 28, 72);
  queueBox('food.wokBase', wokX, wokY, wokW, wokH, {
    fallback: (wokCtx) => drawWok(wokCtx, play.wok.x, play.wok.y, play.wok.w, play.wok.h),
  });
  queueBox('food.oilSheen', play.wok.x + play.wok.w * 0.18, play.wok.y + play.wok.h * 0.42, play.wok.w * 0.64, play.wok.h * 0.28);
  if (play.meter > 0.72) queueBox('fx.flameLick', vm.width - 48, 48, 28, 42);

  for (let i = 0; i < play.cells.length; i += 1) {
    const cell = play.cells[i];
    if (cell.level <= 0) continue;
    const foodId = foodIdForLevel(cell.level, cell.seed);
    queueBox(foodId, cell.x + 4, cell.y + 4, cell.w - 8, cell.h - 22, {
      fallback: (foodCtx) => {
        drawPolaroid(foodCtx, cell.x, cell.y, cell.w, cell.h, cell.seed, cell.level, cell.ink, cell.name, cell.burnt, cell.cook);
      },
    });
    if (spriteReady(foodId) && cell.level >= 2) {
      queueBox('food.scallion', cell.x + cell.w - 18, cell.y + 2, 16, 10);
    }
    if (spriteReady(foodId) && cell.burnt) {
      queueBox('fx.smokePuff', cell.x, cell.y, cell.w, cell.h * 0.7);
      queueBox('fx.missDrip', cell.x + cell.w * 0.35, cell.y + cell.h * 0.4, 14, 22);
    }
  }

  if (spriteReady('ui.progressTrack') && spriteReady('ui.progressFill')) {
    const x = 16;
    const y = 64;
    const w = vm.width - 32;
    const h = 12;
    const clamped = play.meter < 0 ? 0 : play.meter > 1 ? 1 : play.meter;
    queueBox('ui.progressTrack', x, y, w, h);
    queueBox('ui.progressFill', x, y, w, h, {
      clip: { x, y, w: Math.max(0, w * clamped), h },
    });
  }
  queueBox('ui.scoreChip', vm.width - 104, 8, 88, 30);
  queueHearts(vm.width - 16, 56, play.charges, play.maxCharges);

  if (vm.shake > 0.2) {
    const scraps = ['fx.paperScrap.1', 'fx.paperScrap.2', 'fx.paperScrap.3'];
    const stars = ['fx.oilStar.1', 'fx.oilStar.2', 'fx.oilStar.3', 'fx.oilStar.4'];
    const cx = play.wok.x + play.wok.w / 2;
    const cy = play.wok.y + play.wok.h * 0.35;
    const alpha = Math.max(0.35, vm.shake);
    for (let i = 0; i < scraps.length; i += 1) {
      queueBox(scraps[i], cx - 70 + i * 36, cy - 28 - i * 10, 22, 22, { alpha });
    }
    for (let i = 0; i < stars.length; i += 1) {
      queueBox(stars[i], cx - 40 + (i % 2) * 48, cy - 10 - i * 8, 16, 16, { alpha });
    }
    if (vm.shake > 0.65) queueBox('fx.perfectBurst', cx - 48, cy - 48, 96, 96, { alpha });
  }
  if (play.showPerfect) queueBox('type.perfect', play.wok.x + play.wok.w - 54, play.wok.y, 48, 28);
  if (play.showBurnt) queueBox('type.burnt', play.wok.x + 8, play.wok.y, 48, 28);
  queueButtons(vm);
}

function paintPlayText(ctx: Ctx, vm: ViewModel): void {
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
  ctx.fillStyle = PALETTE.ink;
  if (spriteReady('ui.scoreChip')) ctx.fillText(play.scoreText, vm.width - 60, 14);
  else ctx.fillText(play.scoreText, vm.width - 16, 16);
  ctx.font = font(16, true);
  ctx.fillStyle = PALETTE.chiliDeep;
  ctx.fillText(play.tossedText, vm.width - 16, 38);
  ctx.font = font(11, false);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText(play.chargesText, vm.width - 16, 58);
  const feelLine = play.cooldownText || play.feelText;
  if (feelLine) {
    ctx.font = font(11, false);
    ctx.fillStyle = play.cooldownText ? PALETTE.chiliDeep : PALETTE.inkSoft;
    ctx.fillText(feelLine, vm.width - 16, 72);
  }

  if (!spriteReady('ui.progressTrack') || !spriteReady('ui.progressFill')) {
    drawMeter(ctx, 16, 64, vm.width - 32, 12, play.meter);
  }
  ctx.fillStyle = play.warnText ? PALETTE.chiliDeep : PALETTE.inkSoft;
  ctx.textAlign = 'left';
  ctx.font = font(11, true);
  ctx.fillText(play.warnText || COPY.meter, 16, 50);
  if (play.mergeRule) {
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = font(11, false);
    drawWrapped(ctx, play.mergeRule, 16, 78, vm.width - 32, 14);
  }
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
    if (!spriteReady(foodIdForLevel(cell.level, cell.seed))) continue;
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(11, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(cell.name, cell.x + cell.w / 2, cell.y + cell.h - 1);
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
  const authNote = vm.motionNeedsSetting ? vm.sensorLabel : '';
  const note = play.overflowText || authNote || play.hint || vm.sensorLabel;
  ctx.fillStyle = play.overflowText || authNote ? PALETTE.chiliDeep : PALETTE.inkSoft;
  const noteX = play.nextBox.x + play.nextBox.w + 8;
  const noteW = play.showTossButton ? vm.width - noteX - 160 : vm.width - noteX - 16;
  drawWrapped(ctx, note, noteX, play.nextBox.y, Math.max(80, noteW), 16);
  ctx.fillStyle = PALETTE.chiliDeep;
  ctx.font = font(16, true);
  ctx.fillText(play.tossedText, noteX, play.nextBox.y + 34);
  if (play.goalText) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(12, true);
    drawWrapped(ctx, play.goalText, 16, play.nextBox.y - 52, vm.width - 32, 15);
  }

  if (vm.shake > 0.2) {
    const cx = play.wok.x + play.wok.w / 2;
    const cy = play.wok.y + play.wok.h * 0.35;
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
  paintStamp(ctx, 'type.perfect', play.showPerfect, play.wok.x + play.wok.w - 54, play.wok.y, 48, 28);
  paintStamp(ctx, 'type.burnt', play.showBurnt, play.wok.x + 8, play.wok.y, 48, 28);
}

function paintStamp(ctx: Ctx, id: string, show: boolean, x: number, y: number, w: number, h: number): void {
  if (!show || !spriteReady(id)) return;
  const text = assetById(id).text;
  if (!text) return;
  ctx.fillStyle = PALETTE.chiliDeep;
  ctx.font = font(12, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
}

function paintResult(ctx: Ctx, vm: ViewModel): void {
  const result = vm.result;
  if (!result) return;
  ctx.save();
  ctx.translate(20, 28);
  fillTorn(ctx, vm.width - 40, 220, 21, PALETTE.white, 0.05);
  ctx.fillStyle = PALETTE.chiliDeep;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(36, true);
  ctx.fillText(result.title, 18, 16);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(16, true);
  ctx.fillText(result.scoreText, 18, 58);
  ctx.font = font(14, true);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(result.recap, 18, 82);
  ctx.font = font(14, true);
  ctx.fillStyle = PALETTE.chiliDeep;
  drawWrapped(ctx, result.nextLine, 18, 104, vm.width - 78, 18);
  ctx.font = font(15, false);
  ctx.fillStyle = PALETTE.inkSoft;
  drawWrapped(ctx, result.body, 18, 142, vm.width - 78, 22);
  ctx.restore();
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
}

function queueButtons(vm: ViewModel): void {
  for (let i = 0; i < vm.buttons.length; i += 1) {
    const button = vm.buttons[i];
    const id = button.primary ? 'ui.btnPrimary' : 'ui.btnGhost';
    queueBox(id, button.x, button.y, button.w, button.h, {
      alpha: button.disabled ? 0.45 : 1,
      fallback: (buttonCtx) => {
        drawButton(buttonCtx, button.x, button.y, button.w, button.h, button.label, button.primary, button.disabled, button.selected);
      },
    });
  }
}

function paintButtonLabels(ctx: Ctx, vm: ViewModel): void {
  for (let i = 0; i < vm.buttons.length; i += 1) {
    const button = vm.buttons[i];
    const id = button.primary ? 'ui.btnPrimary' : 'ui.btnGhost';
    if (!spriteReady(id)) continue;
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

function queueToasts(vm: ViewModel): void {
  for (let i = 0; i < vm.toasts.length; i += 1) {
    const toast = vm.toasts[i];
    const plate = toastImageFor(toast.text);
    if (!plate) continue;
    const w = Math.min(vm.width - 48, 240);
    const x = (vm.width - w) / 2;
    const y = vm.toastY - i * 42;
    queueBox(plate.id, 0, 0, w, 34, {
      tx: x,
      ty: y,
      rot: -0.03,
      alpha: Math.max(0.2, toast.life),
    });
  }
}

function paintToastText(ctx: Ctx, vm: ViewModel): void {
  for (let i = 0; i < vm.toasts.length; i += 1) {
    const toast = vm.toasts[i];
    const w = Math.min(vm.width - 48, 240);
    const x = (vm.width - w) / 2;
    const y = vm.toastY - i * 42;
    const plate = toastImageFor(toast.text);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.03);
    ctx.globalAlpha = Math.max(0.2, toast.life);
    if (!plate || !spriteReady(plate.id)) fillTorn(ctx, w, 34, toast.seed || 3, '#fffaf1', 0.06);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(15, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(toast.text, w / 2, 18);
    ctx.restore();
  }
}

function queueHearts(right: number, y: number, charges: number, maxCharges: number): void {
  const size = 14;
  const gap = 2;
  const count = Math.max(0, Math.min(6, maxCharges));
  for (let i = 0; i < count; i += 1) {
    const id = i < charges ? 'ui.heart' : 'ui.heartEmpty';
    const x = right - (count - i) * (size + gap);
    queueBox(id, x, y, size, size);
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
