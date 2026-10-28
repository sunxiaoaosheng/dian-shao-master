"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paint = paint;
const draw_1 = require("./draw");
const scraps_1 = require("./scraps");
const theme_1 = require("./theme");
function paint(ctx, vm) {
    (0, draw_1.paintPaper)(ctx, vm.width, vm.height);
    if (vm.screen === 'cook')
        paintCook(ctx, vm);
    else if (vm.screen === 'prep')
        paintPrep(ctx, vm);
    else if (vm.screen === 'home')
        paintHome(ctx, vm);
    else if (vm.screen === 'order')
        paintOrder(ctx, vm);
    else if (vm.screen === 'plate')
        paintPlate(ctx, vm);
    else if (vm.screen === 'album')
        paintAlbum(ctx, vm);
    else
        paintClear(ctx, vm);
    paintButtons(ctx, vm);
    paintDebug(ctx, vm);
    const seal = findSeal(vm);
    if (seal)
        (0, draw_1.drawSeal)(ctx, seal.x, seal.y, seal.w, '勺');
}
function paintHome(ctx, vm) {
    headerCard(ctx, vm, 176, vm.width - 250);
    const plateX = vm.width - 210;
    (0, scraps_1.drawEmptyPlate)(ctx, plateX, 86, 118);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.font = (0, theme_1.font)(13, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const caption = vm.lines.some((line) => line.indexOf('空') >= 0) ? '空橱窗' : '橱窗';
    ctx.fillText(caption, plateX + 59, 168);
}
function paintOrder(ctx, vm) {
    const top = 36;
    const foot = firstButtonY(vm) - 18;
    ctx.save();
    ctx.translate(28, top);
    ctx.rotate(-0.02);
    const cardH = Math.min(foot - top, 620);
    (0, draw_1.fillTorn)(ctx, vm.width - 56, cardH, 4, theme_1.PALETTE.white, 0.035);
    ctx.restore();
    (0, draw_1.drawTape)(ctx, vm.width * 0.5, top + 6, 90, -0.1);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(40, true);
    ctx.fillText(vm.title, 52, top + 36);
    ctx.fillStyle = theme_1.PALETTE.chiliDeep;
    ctx.font = (0, theme_1.font)(18, true);
    ctx.fillText(vm.subtitle, 54, top + 86);
    let y = top + 120;
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(18, false);
    for (let i = 0; i < vm.lines.length; i += 1) {
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[i], 52, y, vm.width - 110, 26);
        y += 6;
    }
    if (vm.hint) {
        (0, scraps_1.drawNote)(ctx, 48, y + 12, vm.width - 96, 52, vm.hint, 6);
        y += 72;
    }
    const artTop = y + 24;
    const artBottom = foot - 24;
    if (artBottom - artTop > 80) {
        (0, scraps_1.drawEmptyPlate)(ctx, vm.width / 2 - 170, artTop, 340);
        (0, scraps_1.drawFood)(ctx, 'tomato', vm.width / 2 - 30, artTop + 70, 86);
        (0, scraps_1.drawFood)(ctx, 'egg', vm.width / 2 + 50, artTop + 82, 76);
        (0, scraps_1.drawFood)(ctx, 'scallion', vm.width / 2 + 10, artTop + 48, 64);
    }
}
function paintPrep(ctx, vm) {
    headerCard(ctx, vm, 132);
    const boardTop = 150;
    const boardBottom = firstButtonY(vm) - 16;
    ctx.save();
    ctx.translate(24, boardTop);
    (0, draw_1.fillTorn)(ctx, vm.width - 48, boardBottom - boardTop, 8, '#c4a574', 0.03);
    ctx.restore();
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.font = (0, theme_1.font)(14, false);
    ctx.textAlign = 'center';
    ctx.fillText('砧板上的料', vm.width / 2, boardTop + 16);
    for (let i = 0; i < vm.chips.length; i += 1)
        paintChip(ctx, vm.chips[i], i);
    const got = vm.chips.filter((chip) => chip.got);
    const pileY = Math.min(boardBottom - 80, boardTop + 280);
    for (let i = 0; i < got.length; i += 1) {
        const chip = got[i];
        ctx.save();
        ctx.translate(vm.width / 2 + (i - (got.length - 1) / 2) * 48, pileY);
        ctx.rotate((i - 1) * 0.25);
        (0, scraps_1.drawFood)(ctx, chip.shape, 0, 0, 72);
        ctx.restore();
    }
}
function paintCook(ctx, vm) {
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(28, true);
    ctx.fillText(vm.title, 20, 22);
    ctx.font = (0, theme_1.font)(16, false);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.fillText(vm.subtitle, 22, 56);
    const foot = firstButtonY(vm);
    const wokW = vm.width * 0.86;
    const wokH = Math.max(360, foot - 230);
    const wokX = (vm.width - wokW) / 2;
    const wokY = 78;
    (0, scraps_1.drawWokStage)(ctx, wokX, wokY, wokW, Math.max(280, wokH), vm.even || 0, vm.burn || 0, vm.tossing);
    const word = cueWord(vm.hint);
    ctx.save();
    ctx.translate(wokX + wokW - 36, wokY + 36);
    ctx.rotate(0.12);
    (0, draw_1.fillTorn)(ctx, 92, 92, 3, word === '停' ? '#f6e0d4' : theme_1.PALETTE.white, 0.06);
    ctx.fillStyle = word === '停' ? theme_1.PALETTE.chiliDeep : theme_1.PALETTE.scallion;
    ctx.font = (0, theme_1.font)(48, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, 46, 48);
    ctx.restore();
    const stripY = wokY + Math.max(280, wokH) - 8;
    meterStrip(ctx, 28, stripY, (vm.width - 70) / 2, '均匀', vm.even || 0, 2);
    meterStrip(ctx, vm.width / 2 + 8, stripY, (vm.width - 70) / 2, '糊边', vm.burn || 0, 5);
    if (vm.hint)
        (0, scraps_1.drawNote)(ctx, 24, stripY + 58, vm.width - 48, 44, vm.hint, 9);
    if (vm.note)
        (0, scraps_1.drawNote)(ctx, 24, foot - 50, vm.width - 48, 42, vm.note, 11);
}
function paintPlate(ctx, vm) {
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.font = (0, theme_1.font)(16, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('出锅', 28, 28);
    const cx = vm.width / 2;
    const cy = 250;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.08);
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.fillStyle = theme_1.PALETTE.seal;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f3d2c4';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 66, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f8e6df';
    ctx.font = (0, theme_1.font)(36, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(vm.title, 0, 2);
    ctx.restore();
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(22, true);
    ctx.textAlign = 'center';
    ctx.fillText(vm.subtitle, cx, cy + 108);
    let y = cy + 130;
    ctx.font = (0, theme_1.font)(18, false);
    ctx.textAlign = 'left';
    for (let i = 0; i < vm.lines.length; i += 1) {
        (0, scraps_1.drawNote)(ctx, 36, y, vm.width - 72, 46, vm.lines[i], 12 + i);
        y += 54;
    }
    const gapTop = y + 8;
    const gapBottom = firstButtonY(vm) - 12;
    if (gapBottom - gapTop > 70) {
        ctx.save();
        ctx.translate(48, gapTop);
        ctx.rotate(-0.02);
        (0, draw_1.fillTorn)(ctx, vm.width - 96, gapBottom - gapTop, 15, '#efe2cc', 0.04);
        (0, scraps_1.drawFood)(ctx, 'tomato', (vm.width - 96) * 0.35, (gapBottom - gapTop) * 0.45, 64);
        (0, scraps_1.drawFood)(ctx, 'egg', (vm.width - 96) * 0.55, (gapBottom - gapTop) * 0.5, 58);
        ctx.restore();
    }
}
function paintAlbum(ctx, vm) {
    headerCard(ctx, vm, 78);
    const top = 96;
    const bottom = firstButtonY(vm) - 12;
    ctx.save();
    ctx.translate(22, top);
    (0, draw_1.fillTorn)(ctx, vm.width - 44, Math.max(80, bottom - top), 6, theme_1.PALETTE.white, 0.03);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(36, top + 16, vm.width - 72, Math.max(40, bottom - top - 28));
    ctx.clip();
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(26, true);
    let y = top + 28;
    if (vm.lines[0]) {
        ctx.fillText(vm.lines[0], 40, y);
        y += 40;
    }
    ctx.fillStyle = theme_1.PALETTE.chiliDeep;
    ctx.font = (0, theme_1.font)(16, true);
    if (vm.lines[1])
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[1], 40, y, vm.width - 80, 24);
    y += 12;
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(16, false);
    if (vm.lines[2])
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[2], 40, y, vm.width - 80, 24);
    if (vm.lines[3]) {
        y += 10;
        ctx.fillStyle = theme_1.PALETTE.inkSoft;
        (0, draw_1.drawWrapped)(ctx, vm.lines[3], 40, y, vm.width - 80, 22);
    }
    ctx.restore();
    (0, scraps_1.drawFood)(ctx, 'tomato', vm.width * 0.32, bottom - 150, 72);
    (0, scraps_1.drawFood)(ctx, 'egg', vm.width * 0.5, bottom - 140, 64);
    (0, scraps_1.drawFood)(ctx, 'scallion', vm.width * 0.66, bottom - 156, 60);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.font = (0, theme_1.font)(13, false);
    ctx.textAlign = 'right';
    if (vm.albumPages)
        ctx.fillText(`${vm.albumPage + 1}/${vm.albumPages}`, vm.width - 28, top + 8);
}
function paintClear(ctx, vm) {
    headerCard(ctx, vm, 120);
    const cols = 2;
    const gap = 16;
    const cardW = (vm.width - 48 - gap) / cols;
    const top = 176;
    const rows = Math.max(1, Math.ceil(vm.stickers.length / cols));
    const cardH = Math.max(120, (firstButtonY(vm) - top - 16 - gap * (rows - 1)) / rows);
    for (let i = 0; i < vm.stickers.length; i += 1) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 24 + col * (cardW + gap);
        const y = top + row * (cardH + gap);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((i % 2 === 0 ? -1 : 1) * 0.04);
        (0, draw_1.fillTorn)(ctx, cardW, cardH, 20 + i, theme_1.PALETTE.white, 0.05);
        (0, draw_1.drawTape)(ctx, cardW / 2, 8, 70, -0.2);
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(22, true);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vm.stickers[i], cardW / 2, cardH * 0.58);
        ctx.restore();
    }
}
function headerCard(ctx, vm, h, textW) {
    ctx.save();
    ctx.translate(12, 12);
    (0, draw_1.fillTorn)(ctx, vm.width - 78, h, 3, theme_1.PALETTE.white, 0.03);
    ctx.restore();
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(30, true);
    ctx.fillText(vm.title, 28, 28);
    ctx.font = (0, theme_1.font)(15, false);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.fillText(vm.subtitle, 30, 66);
    let y = 94;
    const showLines = vm.screen === 'home' || vm.screen === 'clear' || vm.screen === 'prep';
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(15, false);
    if (showLines) {
        for (let i = 0; i < vm.lines.length; i += 1) {
            y = (0, draw_1.drawWrapped)(ctx, vm.lines[i], 30, y, textW || vm.width - 140, 22);
            y += 2;
        }
    }
    if (vm.hint && vm.screen !== 'cook') {
        ctx.fillStyle = theme_1.PALETTE.chiliDeep;
        ctx.font = (0, theme_1.font)(14, true);
        (0, draw_1.drawWrapped)(ctx, vm.hint, 30, y + 4, vm.width - 120, 20);
    }
}
function paintChip(ctx, chip, index) {
    ctx.save();
    ctx.translate(chip.x, chip.y);
    ctx.rotate((index % 2 === 0 ? -1 : 1) * 0.03);
    (0, draw_1.fillTorn)(ctx, chip.w, chip.h, index + 4, chip.role === 'taboo' ? '#f6d5cc' : chip.got ? '#efe2cc' : theme_1.PALETTE.white, 0.05);
    (0, scraps_1.drawFood)(ctx, chip.shape, 42, chip.h / 2, 36);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(18, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(chip.got ? '已上板' : chip.label, 78, chip.h / 2);
    if (chip.role === 'taboo') {
        ctx.fillStyle = theme_1.PALETTE.chiliDeep;
        ctx.font = (0, theme_1.font)(12, true);
        ctx.fillText('忌口', chip.w - 36, 16);
    }
    if (chip.crossed)
        (0, scraps_1.drawCross)(ctx, chip.w - 28, chip.h / 2, 14);
    ctx.restore();
}
function meterStrip(ctx, x, y, w, label, ratio, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(seed === 2 ? -0.03 : 0.03);
    (0, draw_1.fillTorn)(ctx, w, 48, seed, theme_1.PALETTE.white, 0.05);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.font = (0, theme_1.font)(13, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, 10, 6);
    const clamped = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
    ctx.fillStyle = '#f3e6cf';
    ctx.fillRect(10, 26, w - 20, 12);
    ctx.fillStyle = clamped > 0.75 ? theme_1.PALETTE.chili : clamped > 0.45 ? theme_1.PALETTE.yolk : theme_1.PALETTE.scallion;
    ctx.fillRect(12, 28, Math.max(0, (w - 24) * clamped), 8);
    ctx.restore();
}
function paintButtons(ctx, vm) {
    for (let i = 0; i < vm.buttons.length; i += 1) {
        const button = vm.buttons[i];
        if (button.id.indexOf('dish:') === 0) {
            paintDishCard(ctx, button, i);
            continue;
        }
        ctx.save();
        ctx.translate(button.x + button.w / 2, button.y + button.h / 2);
        ctx.rotate((i % 2 === 0 ? -1 : 1) * 0.012);
        (0, draw_1.drawButton)(ctx, -button.w / 2, -button.h / 2, button.w, button.h, button.label, button.primary, button.disabled, false);
        ctx.restore();
    }
}
function paintDishCard(ctx, button, index) {
    ctx.save();
    ctx.translate(button.x, button.y);
    ctx.rotate((index % 2 === 0 ? -1 : 1) * 0.012);
    (0, draw_1.fillTorn)(ctx, button.w, button.h, index + 2, button.primary ? theme_1.PALETTE.chili : theme_1.PALETTE.white, 0.045);
    ctx.fillStyle = button.primary ? theme_1.PALETTE.white : theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(26, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(button.label, button.w / 2, button.disabled ? button.h * 0.68 : button.h * 0.55);
    if (button.disabled) {
        (0, draw_1.drawTape)(ctx, button.w / 2, button.h * 0.32, button.w * 0.82, -0.18);
        ctx.fillStyle = theme_1.PALETTE.chiliDeep;
        ctx.font = (0, theme_1.font)(18, true);
        ctx.fillText('未开', button.w / 2, button.h * 0.32);
    }
    ctx.restore();
}
function paintDebug(ctx, vm) {
    if (!vm.debugLines.length)
        return;
    ctx.fillStyle = theme_1.PALETTE.soy;
    ctx.font = (0, theme_1.font)(11, false);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let y = 8;
    for (let i = 0; i < vm.debugLines.length; i += 1) {
        ctx.fillText(vm.debugLines[i], vm.width - 180, y);
        y += 14;
    }
}
function firstButtonY(vm) {
    let y = vm.height;
    for (let i = 0; i < vm.buttons.length; i += 1) {
        if (vm.buttons[i].y < y)
            y = vm.buttons[i].y;
    }
    return y;
}
function findSeal(vm) {
    for (let i = 0; i < vm.hits.length; i += 1) {
        if (vm.hits[i].id === 'seal')
            return vm.hits[i];
    }
    return null;
}
function cueWord(hint) {
    if (hint.indexOf('下料') === 0)
        return '下';
    if (hint.indexOf('停') === 0)
        return '停';
    return '颠';
}
