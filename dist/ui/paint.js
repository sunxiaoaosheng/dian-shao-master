"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paint = paint;
const manifest_1 = require("../content/manifest");
const copy_1 = require("../content/copy");
const toasts_1 = require("../content/toasts");
const draw_1 = require("./draw");
const sprites_1 = require("./sprites");
const theme_1 = require("./theme");
function paint(ctx, vm) {
    ctx.save();
    if (vm.shake > 0.04) {
        const mag = vm.shake * 8;
        ctx.translate(Math.sin(vm.now / 28) * mag, Math.cos(vm.now / 22) * mag * 0.65);
    }
    (0, sprites_1.beginSprites)();
    (0, sprites_1.queueBox)('ui.paperBg', 0, 0, vm.width, vm.height, {
        fallback: (paperCtx) => (0, draw_1.paintPaper)(paperCtx, vm.width, vm.height),
    });
    if (vm.screen === 'home')
        queueHome(vm);
    else if (vm.screen === 'play')
        queuePlay(vm);
    else
        queueButtons(vm);
    queueToasts(vm);
    (0, sprites_1.flushSprites)(ctx);
    if (vm.screen === 'home')
        paintHomeText(ctx, vm);
    else if (vm.screen === 'play')
        paintPlayText(ctx, vm);
    else if (vm.screen === 'result')
        paintResult(ctx, vm);
    else
        paintAlbum(ctx, vm);
    if (vm.screen !== 'home')
        paintButtonLabels(ctx, vm);
    paintToastText(ctx, vm);
    if (vm.qaLines.length)
        paintQa(ctx, vm);
    ctx.restore();
}
function queueHome(vm) {
    const cardY = vm.seal ? vm.seal.y : 16;
    const cardW = vm.width - 112;
    const cardH = 118;
    (0, sprites_1.queueBox)('ui.panelTorn', 0, 0, cardW, cardH, {
        tx: 16,
        ty: cardY,
        fallback: (panelCtx) => (0, draw_1.fillTorn)(panelCtx, cardW, cardH, 11, theme_1.PALETTE.white, 0.04),
    });
    (0, sprites_1.queueBox)('ui.tapeStrip', 18, -8, 78, 22, { tx: 16, ty: cardY });
    queueButtons(vm);
}
function paintHomeText(ctx, vm) {
    const cardY = vm.seal ? vm.seal.y : 16;
    const cardW = vm.width - 112;
    ctx.save();
    ctx.translate(16, cardY);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(30, true);
    ctx.fillText(vm.title, 14, 12);
    ctx.font = (0, theme_1.font)(13, false);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    (0, draw_1.drawWrapped)(ctx, vm.subtitle, 14, 48, cardW - 26, 16);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(15, true);
    ctx.fillText(vm.playsLabel, 14, 86);
    ctx.restore();
    if (vm.seal)
        (0, draw_1.drawSeal)(ctx, vm.seal.x, vm.seal.y, vm.seal.w, copy_1.COPY.seal);
    const tierButton = vm.buttons[0];
    if (tierButton) {
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(13, true);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        (0, draw_1.drawWrapped)(ctx, `${copy_1.COPY.tierTitle} · 下锅是${vm.heatLabel}。${vm.goalText}`, 20, tierButton.y - 36, vm.width - 40, 16);
    }
    paintButtonLabels(ctx, vm);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.font = (0, theme_1.font)(12, false);
    ctx.textAlign = 'left';
    const hintY = tierButton ? tierButton.y + 42 : cardY + 118 + 8;
    (0, draw_1.drawWrapped)(ctx, vm.playsHint, 20, hintY, vm.width - 40, 16);
    if (vm.showBoard) {
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(14, true);
        ctx.textAlign = 'left';
        ctx.fillText(vm.boardTitle, 20, vm.boardTop);
        ctx.font = (0, theme_1.font)(13, false);
        if (!vm.board.length) {
            ctx.fillStyle = theme_1.PALETTE.inkSoft;
            (0, draw_1.drawWrapped)(ctx, vm.boardNote, 20, vm.boardTop + 22, vm.width - 40, 18);
        }
        for (let i = 0; i < vm.board.length; i += 1) {
            const row = vm.board[i];
            ctx.fillStyle = theme_1.PALETTE.chiliDeep;
            ctx.fillText(row.region, 20, vm.boardTop + 22 + i * 18);
            ctx.fillStyle = theme_1.PALETTE.inkSoft;
            ctx.fillText(row.line, 62, vm.boardTop + 22 + i * 18);
        }
    }
}
function queuePlay(vm) {
    const play = vm.play;
    if (!play)
        return;
    const wokX = play.wok.x;
    const wokY = play.wok.y + play.wok.h * 0.35;
    const wokW = play.wok.w;
    const wokH = play.wok.h * 0.55;
    (0, sprites_1.queueBox)('food.wokHandle', wokX - 18, play.wok.y + play.wok.h * 0.2, 28, 72);
    (0, sprites_1.queueBox)('food.wokBase', wokX, wokY, wokW, wokH, {
        fallback: (wokCtx) => (0, draw_1.drawWok)(wokCtx, play.wok.x, play.wok.y, play.wok.w, play.wok.h),
    });
    (0, sprites_1.queueBox)('food.oilSheen', play.wok.x + play.wok.w * 0.18, play.wok.y + play.wok.h * 0.42, play.wok.w * 0.64, play.wok.h * 0.28);
    if (play.meter > 0.72)
        (0, sprites_1.queueBox)('fx.flameLick', vm.width - 48, 48, 28, 42);
    for (let i = 0; i < play.cells.length; i += 1) {
        const cell = play.cells[i];
        if (cell.level <= 0)
            continue;
        const foodId = (0, manifest_1.foodIdForLevel)(cell.level, cell.seed);
        (0, sprites_1.queueBox)(foodId, cell.x + 4, cell.y + 4, cell.w - 8, cell.h - 22, {
            fallback: (foodCtx) => {
                (0, draw_1.drawPolaroid)(foodCtx, cell.x, cell.y, cell.w, cell.h, cell.seed, cell.level, cell.ink, cell.name, cell.burnt, cell.cook);
            },
        });
        if ((0, sprites_1.spriteReady)(foodId) && cell.level >= 2) {
            (0, sprites_1.queueBox)('food.scallion', cell.x + cell.w - 18, cell.y + 2, 16, 10);
        }
        if ((0, sprites_1.spriteReady)(foodId) && cell.burnt) {
            (0, sprites_1.queueBox)('fx.smokePuff', cell.x, cell.y, cell.w, cell.h * 0.7);
            (0, sprites_1.queueBox)('fx.missDrip', cell.x + cell.w * 0.35, cell.y + cell.h * 0.4, 14, 22);
        }
    }
    if ((0, sprites_1.spriteReady)('ui.progressTrack') && (0, sprites_1.spriteReady)('ui.progressFill')) {
        const x = 16;
        const y = 64;
        const w = vm.width - 32;
        const h = 12;
        const clamped = play.meter < 0 ? 0 : play.meter > 1 ? 1 : play.meter;
        (0, sprites_1.queueBox)('ui.progressTrack', x, y, w, h);
        (0, sprites_1.queueBox)('ui.progressFill', x, y, w, h, {
            clip: { x, y, w: Math.max(0, w * clamped), h },
        });
    }
    (0, sprites_1.queueBox)('ui.scoreChip', vm.width - 104, 8, 88, 30);
    queueHearts(vm.width - 16, 56, play.charges, play.maxCharges);
    if (vm.shake > 0.2) {
        const scraps = ['fx.paperScrap.1', 'fx.paperScrap.2', 'fx.paperScrap.3'];
        const stars = ['fx.oilStar.1', 'fx.oilStar.2', 'fx.oilStar.3', 'fx.oilStar.4'];
        const cx = play.wok.x + play.wok.w / 2;
        const cy = play.wok.y + play.wok.h * 0.35;
        const alpha = Math.max(0.35, vm.shake);
        for (let i = 0; i < scraps.length; i += 1) {
            (0, sprites_1.queueBox)(scraps[i], cx - 70 + i * 36, cy - 28 - i * 10, 22, 22, { alpha });
        }
        for (let i = 0; i < stars.length; i += 1) {
            (0, sprites_1.queueBox)(stars[i], cx - 40 + (i % 2) * 48, cy - 10 - i * 8, 16, 16, { alpha });
        }
        if (vm.shake > 0.65)
            (0, sprites_1.queueBox)('fx.perfectBurst', cx - 48, cy - 48, 96, 96, { alpha });
    }
    if (play.showPerfect)
        (0, sprites_1.queueBox)('type.perfect', play.wok.x + play.wok.w - 54, play.wok.y, 48, 28);
    if (play.showBurnt)
        (0, sprites_1.queueBox)('type.burnt', play.wok.x + 8, play.wok.y, 48, 28);
    queueButtons(vm);
}
function paintPlayText(ctx, vm) {
    const play = vm.play;
    if (!play)
        return;
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(22, true);
    ctx.fillText(play.recipeName, 16, 12);
    ctx.font = (0, theme_1.font)(13, false);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.fillText(`${play.region} · ${vm.heatLabel}`, 16, 40);
    ctx.textAlign = 'right';
    ctx.font = (0, theme_1.font)(16, true);
    ctx.fillStyle = theme_1.PALETTE.ink;
    if ((0, sprites_1.spriteReady)('ui.scoreChip'))
        ctx.fillText(play.scoreText, vm.width - 60, 14);
    else
        ctx.fillText(play.scoreText, vm.width - 16, 16);
    ctx.font = (0, theme_1.font)(12, false);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.fillText(play.chargesText, vm.width - 16, 40);
    if (!(0, sprites_1.spriteReady)('ui.progressTrack') || !(0, sprites_1.spriteReady)('ui.progressFill')) {
        (0, draw_1.drawMeter)(ctx, 16, 64, vm.width - 32, 12, play.meter);
    }
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.textAlign = 'left';
    ctx.font = (0, theme_1.font)(11, true);
    ctx.fillText(copy_1.COPY.meter, 16, 50);
    (0, draw_1.drawSteam)(ctx, play.wok.x + play.wok.w / 2, play.wok.y + 6, vm.now);
    for (let i = 0; i < play.cells.length; i += 1) {
        const cell = play.cells[i];
        if (cell.level <= 0) {
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = theme_1.PALETTE.ironLite;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(cell.x + 6, cell.y + 6, cell.w - 12, cell.h - 12);
            ctx.restore();
            continue;
        }
        if (!(0, sprites_1.spriteReady)((0, manifest_1.foodIdForLevel)(cell.level, cell.seed)))
            continue;
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(11, true);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(cell.name, cell.x + cell.w / 2, cell.y + cell.h - 1);
    }
    (0, draw_1.drawPolaroid)(ctx, play.nextBox.x, play.nextBox.y, play.nextBox.w, play.nextBox.h, 9, play.nextLevel, play.nextInk, play.nextName, false, 0);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.textAlign = 'left';
    ctx.font = (0, theme_1.font)(11, false);
    ctx.fillText(copy_1.COPY.next, play.nextBox.x, play.nextBox.y - 16);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(12, false);
    const note = play.overflowText || play.hint || vm.sensorLabel;
    ctx.fillStyle = play.overflowText ? theme_1.PALETTE.chiliDeep : theme_1.PALETTE.inkSoft;
    const noteX = play.nextBox.x + play.nextBox.w + 8;
    const noteW = play.showTossButton ? vm.width - noteX - 160 : vm.width - noteX - 16;
    (0, draw_1.drawWrapped)(ctx, note, noteX, play.nextBox.y, Math.max(80, noteW), 16);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.fillText(play.tossedText, noteX, play.nextBox.y + 36);
    if (play.goalText) {
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(12, true);
        (0, draw_1.drawWrapped)(ctx, play.goalText, noteX, play.nextBox.y - 34, Math.max(80, noteW), 16);
    }
    if (play.cooldownText) {
        ctx.fillStyle = theme_1.PALETTE.chiliDeep;
        ctx.fillText(play.cooldownText, noteX, play.nextBox.y + 52);
    }
    if (vm.shake > 0.2) {
        const cx = play.wok.x + play.wok.w / 2;
        const cy = play.wok.y + play.wok.h * 0.35;
        ctx.save();
        ctx.globalAlpha = vm.shake * 0.8;
        ctx.strokeStyle = theme_1.PALETTE.white;
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
function paintStamp(ctx, id, show, x, y, w, h) {
    if (!show || !(0, sprites_1.spriteReady)(id))
        return;
    const text = (0, manifest_1.assetById)(id).text;
    if (!text)
        return;
    ctx.fillStyle = theme_1.PALETTE.chiliDeep;
    ctx.font = (0, theme_1.font)(12, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
}
function paintResult(ctx, vm) {
    const result = vm.result;
    if (!result)
        return;
    ctx.save();
    ctx.translate(20, 28);
    (0, draw_1.fillTorn)(ctx, vm.width - 40, 220, 21, theme_1.PALETTE.white, 0.05);
    ctx.fillStyle = theme_1.PALETTE.chiliDeep;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(36, true);
    ctx.fillText(result.title, 18, 16);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(16, true);
    ctx.fillText(result.scoreText, 18, 58);
    ctx.font = (0, theme_1.font)(14, true);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.fillText(result.recap, 18, 82);
    ctx.font = (0, theme_1.font)(14, true);
    ctx.fillStyle = theme_1.PALETTE.chiliDeep;
    (0, draw_1.drawWrapped)(ctx, result.nextLine, 18, 104, vm.width - 78, 18);
    ctx.font = (0, theme_1.font)(15, false);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    (0, draw_1.drawWrapped)(ctx, result.body, 18, 142, vm.width - 78, 22);
    ctx.restore();
}
function paintAlbum(ctx, vm) {
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(28, true);
    ctx.fillText(vm.albumTitle, 18, 20);
    const cards = vm.album || [];
    for (let i = 0; i < cards.length; i += 1) {
        const card = cards[i];
        if (!card.owned) {
            ctx.save();
            ctx.translate(card.x, card.y);
            (0, draw_1.fillTorn)(ctx, card.w, card.h, 40 + i, '#efe4d0', 0.05);
            ctx.fillStyle = theme_1.PALETTE.inkSoft;
            ctx.font = (0, theme_1.font)(14, true);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(card.name, card.w / 2, card.h / 2);
            ctx.restore();
            continue;
        }
        (0, draw_1.drawPolaroid)(ctx, card.x, card.y, card.w, card.h - 28, 80 + i, card.level, card.ink, card.name, false, 0);
        ctx.fillStyle = theme_1.PALETTE.inkSoft;
        ctx.font = (0, theme_1.font)(11, false);
        ctx.textAlign = 'left';
        ctx.fillText(`${card.region} · ${card.blurb}`, card.x, card.y + card.h - 16);
    }
}
function queueButtons(vm) {
    for (let i = 0; i < vm.buttons.length; i += 1) {
        const button = vm.buttons[i];
        const id = button.primary ? 'ui.btnPrimary' : 'ui.btnGhost';
        (0, sprites_1.queueBox)(id, button.x, button.y, button.w, button.h, {
            alpha: button.disabled ? 0.45 : 1,
            fallback: (buttonCtx) => {
                (0, draw_1.drawButton)(buttonCtx, button.x, button.y, button.w, button.h, button.label, button.primary, button.disabled, button.selected);
            },
        });
    }
}
function paintButtonLabels(ctx, vm) {
    for (let i = 0; i < vm.buttons.length; i += 1) {
        const button = vm.buttons[i];
        const id = button.primary ? 'ui.btnPrimary' : 'ui.btnGhost';
        if (!(0, sprites_1.spriteReady)(id))
            continue;
        ctx.save();
        ctx.globalAlpha = button.disabled ? 0.45 : 1;
        ctx.fillStyle = button.primary ? theme_1.PALETTE.white : theme_1.PALETTE.ink;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let size = button.h >= 46 ? 18 : 15;
        ctx.font = (0, theme_1.font)(size, true);
        while (size > 11 && ctx.measureText(button.label).width > button.w - 18) {
            size -= 1;
            ctx.font = (0, theme_1.font)(size, true);
        }
        ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
        if (button.selected) {
            ctx.strokeStyle = theme_1.PALETTE.chiliDeep;
            ctx.lineWidth = 2;
            ctx.strokeRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
        }
        ctx.restore();
    }
}
function queueToasts(vm) {
    for (let i = 0; i < vm.toasts.length; i += 1) {
        const toast = vm.toasts[i];
        const plate = (0, toasts_1.toastImageFor)(toast.text);
        if (!plate)
            continue;
        const w = Math.min(vm.width - 48, 240);
        const x = (vm.width - w) / 2;
        const y = vm.toastY - i * 42;
        (0, sprites_1.queueBox)(plate.id, 0, 0, w, 34, {
            tx: x,
            ty: y,
            rot: -0.03,
            alpha: Math.max(0.2, toast.life),
        });
    }
}
function paintToastText(ctx, vm) {
    for (let i = 0; i < vm.toasts.length; i += 1) {
        const toast = vm.toasts[i];
        const w = Math.min(vm.width - 48, 240);
        const x = (vm.width - w) / 2;
        const y = vm.toastY - i * 42;
        const plate = (0, toasts_1.toastImageFor)(toast.text);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.03);
        ctx.globalAlpha = Math.max(0.2, toast.life);
        if (!plate || !(0, sprites_1.spriteReady)(plate.id))
            (0, draw_1.fillTorn)(ctx, w, 34, toast.seed || 3, '#fffaf1', 0.06);
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(15, true);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(toast.text, w / 2, 18);
        ctx.restore();
    }
}
function queueHearts(right, y, charges, maxCharges) {
    const size = 14;
    const gap = 2;
    const count = Math.max(0, Math.min(6, maxCharges));
    for (let i = 0; i < count; i += 1) {
        const id = i < charges ? 'ui.heart' : 'ui.heartEmpty';
        const x = right - (count - i) * (size + gap);
        (0, sprites_1.queueBox)(id, x, y, size, size);
    }
}
function paintQa(ctx, vm) {
    ctx.save();
    ctx.fillStyle = theme_1.PALETTE.chiliDeep;
    ctx.font = (0, theme_1.font)(11, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let i = 0; i < vm.qaLines.length; i += 1) {
        ctx.fillText(vm.qaLines[i], 8, 4 + i * 13);
    }
    ctx.restore();
}
