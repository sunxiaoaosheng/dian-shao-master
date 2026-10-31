"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paint = paint;
const draw_1 = require("./draw");
const press_1 = require("./press");
const theme_1 = require("./theme");
function paint(ctx, vm) {
    (0, press_1.paintSheet)(ctx, vm.width, vm.height);
    (0, press_1.drawMenuFrame)(ctx, vm.width, vm.height);
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
    for (let i = 0; i < vm.buttons.length; i += 1) {
        const button = vm.buttons[i];
        if (button.id.indexOf('dish:') === 0)
            paintDishRow(ctx, button);
        else
            (0, press_1.drawPressButton)(ctx, button.x, button.y, button.w, button.h, button.label, button.primary, button.disabled);
    }
    if (vm.debugLines.length) {
        ctx.fillStyle = theme_1.PALETTE.inkSoft;
        ctx.font = (0, theme_1.font)(11, false);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        for (let i = 0; i < vm.debugLines.length; i += 1) {
            ctx.fillText(vm.debugLines[i], 28, 28 + i * 14);
        }
    }
    for (let i = 0; i < vm.hits.length; i += 1) {
        const hit = vm.hits[i];
        if (hit.id === 'seal')
            (0, press_1.drawRoundSeal)(ctx, hit.x + hit.w / 2, hit.y + hit.h / 2, hit.w * 0.46, '勺');
    }
}
function paintHome(ctx, vm) {
    mast(ctx, '老字号', vm.title, vm.subtitle);
    ctx.font = (0, theme_1.font)(15, false);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let y = 118;
    for (let i = 0; i < vm.lines.length; i += 1) {
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[i], 36, y, vm.width - 210, 22);
    }
    (0, press_1.drawEmptyBowl)(ctx, vm.width - 150, 108, 90);
    ctx.font = (0, theme_1.font)(12, true);
    ctx.fillStyle = theme_1.PALETTE.chili;
    ctx.textAlign = 'center';
    ctx.fillText(vm.lines.some((line) => line.indexOf('空') >= 0) ? '空橱窗' : '橱窗', vm.width - 105, 176);
    (0, press_1.drawMenuRule)(ctx, 36, 196, vm.width - 72);
}
function paintOrder(ctx, vm) {
    mast(ctx, '来单', vm.title, vm.subtitle);
    let y = 132;
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(18, false);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let i = 0; i < vm.lines.length; i += 1) {
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[i], 40, y, vm.width - 80, 26);
        y += 4;
    }
    if (vm.hint) {
        ctx.fillStyle = theme_1.PALETTE.chili;
        ctx.font = (0, theme_1.font)(15, true);
        y = (0, draw_1.drawWrapped)(ctx, vm.hint, 40, y + 8, vm.width - 80, 22);
    }
    const foot = firstButtonY(vm);
    const art = Math.max(200, foot - y - 28);
    if (art > 140)
        (0, press_1.drawWoodWok)(ctx, 40, y + 16, vm.width - 80, art, 0.6, 0.1, false);
}
function paintPrep(ctx, vm) {
    mast(ctx, '备料', vm.title, vm.subtitle);
    ctx.font = (0, theme_1.font)(15, false);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    let y = 118;
    for (let i = 0; i < vm.lines.length; i += 1)
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[i], 36, y, vm.width - 80, 22);
    if (vm.hint) {
        ctx.fillStyle = theme_1.PALETTE.chili;
        ctx.font = (0, theme_1.font)(14, true);
        (0, draw_1.drawWrapped)(ctx, vm.hint, 36, y + 6, vm.width - 80, 20);
    }
    ctx.strokeStyle = theme_1.PALETTE.ink;
    ctx.lineWidth = 1.5;
    const top = 210;
    const bottom = firstButtonY(vm) - 16;
    ctx.strokeRect(28, top, vm.width - 56, bottom - top);
    ctx.font = (0, theme_1.font)(13, false);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.textAlign = 'center';
    ctx.fillText('砧 板', vm.width / 2, top + 22);
    for (let i = 0; i < vm.chips.length; i += 1)
        paintChip(ctx, vm.chips[i]);
    const got = vm.chips.filter((chip) => chip.got);
    for (let i = 0; i < got.length; i += 1) {
        (0, press_1.drawWoodFood)(ctx, got[i].shape, vm.width / 2 + (i - (got.length - 1) / 2) * 54, top + 460, 72);
    }
}
function paintCook(ctx, vm) {
    ctx.fillStyle = theme_1.PALETTE.chili;
    ctx.font = (0, theme_1.font)(14, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('本店在炒', 48, 32);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(28, true);
    ctx.fillText(vm.title, 48, 52);
    ctx.font = (0, theme_1.font)(15, false);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.fillText(vm.subtitle, 50, 88);
    const foot = firstButtonY(vm);
    const wokTop = 118;
    const wokH = Math.max(280, foot - 280);
    (0, press_1.drawWoodWok)(ctx, 24, wokTop, vm.width - 48, wokH, vm.even || 0, vm.burn || 0, vm.tossing);
    const word = cueWord(vm.hint);
    ctx.fillStyle = word === '停' ? theme_1.PALETTE.ink : theme_1.PALETTE.chili;
    ctx.font = (0, theme_1.font)(64, true);
    ctx.textAlign = 'left';
    const wordY = wokTop + wokH + 6;
    ctx.fillText(word, 36, wordY);
    if (vm.hint) {
        ctx.font = (0, theme_1.font)(16, true);
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.fillText(vm.hint, 120, wordY + 22);
    }
    const barY = wordY + 92;
    const barW = (vm.width - 64) / 2;
    (0, press_1.drawMenuMeter)(ctx, 28, barY, barW, '均匀', vm.even || 0);
    (0, press_1.drawMenuMeter)(ctx, 36 + barW, barY, barW, '糊边', vm.burn || 0);
    if (vm.note) {
        ctx.font = (0, theme_1.font)(13, false);
        ctx.fillStyle = theme_1.PALETTE.inkSoft;
        ctx.textAlign = 'left';
        (0, draw_1.drawWrapped)(ctx, vm.note, 32, foot - 36, vm.width - 64, 16);
    }
}
function paintPlate(ctx, vm) {
    ctx.fillStyle = theme_1.PALETTE.chili;
    ctx.font = (0, theme_1.font)(14, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('出 锅', vm.width / 2, 36);
    (0, press_1.drawRoundSeal)(ctx, vm.width / 2, 150, 72, vm.title || '印');
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(28, true);
    ctx.fillText(vm.subtitle, vm.width / 2, 236);
    let y = 280;
    ctx.textAlign = 'left';
    ctx.font = (0, theme_1.font)(16, false);
    for (let i = 0; i < vm.lines.length; i += 1) {
        (0, press_1.drawMenuRule)(ctx, 40, y, vm.width - 80);
        ctx.fillStyle = i === 0 ? theme_1.PALETTE.chili : theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(i === 0 ? 18 : 16, i < 2);
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[i], 40, y + 8, vm.width - 80, 24);
        y += 10;
    }
}
function paintAlbum(ctx, vm) {
    mast(ctx, '菜谱', vm.title, `${vm.albumPage + 1}/${vm.albumPages || 1}`);
    const top = 120;
    const bottom = firstButtonY(vm) - 12;
    ctx.strokeStyle = theme_1.PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, top, vm.width - 56, Math.max(40, bottom - top));
    ctx.save();
    ctx.beginPath();
    ctx.rect(40, top + 16, vm.width - 80, Math.max(20, bottom - top - 28));
    ctx.clip();
    let y = top + 24;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    if (vm.lines[0]) {
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(26, true);
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[0], 44, y, vm.width - 100, 32);
        y += 8;
    }
    if (vm.lines[1]) {
        ctx.fillStyle = theme_1.PALETTE.chili;
        ctx.font = (0, theme_1.font)(16, true);
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[1], 44, y, vm.width - 100, 24);
        y += 10;
    }
    if (vm.lines[2]) {
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(16, false);
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[2], 44, y, vm.width - 100, 26);
    }
    if (vm.lines[3]) {
        y += 12;
        ctx.fillStyle = theme_1.PALETTE.inkSoft;
        ctx.font = (0, theme_1.font)(14, false);
        (0, draw_1.drawWrapped)(ctx, vm.lines[3], 44, y, vm.width - 100, 22);
    }
    ctx.restore();
}
function paintClear(ctx, vm) {
    mast(ctx, '收市', '今晚六桌', vm.subtitle);
    ctx.font = (0, theme_1.font)(16, false);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    let y = 130;
    for (let i = 0; i < vm.lines.length; i += 1) {
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[i], 36, y, vm.width - 72, 24);
        y += 4;
    }
    (0, press_1.drawMenuRule)(ctx, 36, y + 6, vm.width - 72);
    const cols = 2;
    const gap = 12;
    const top = y + 22;
    const rows = Math.max(1, Math.ceil(vm.stickers.length / cols));
    const cardW = (vm.width - 56 - gap) / cols;
    const cardH = Math.max(88, (firstButtonY(vm) - top - 12 - gap * (rows - 1)) / rows);
    for (let i = 0; i < vm.stickers.length; i += 1) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 28 + col * (cardW + gap);
        const yy = top + row * (cardH + gap);
        ctx.strokeStyle = theme_1.PALETTE.chili;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, yy, cardW, cardH);
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(22, true);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vm.stickers[i], x + cardW / 2, yy + cardH / 2);
    }
}
function mast(ctx, kicker, title, sub) {
    ctx.fillStyle = theme_1.PALETTE.chili;
    ctx.font = (0, theme_1.font)(13, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(kicker, 48, 30);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(36, true);
    ctx.fillText(title, 48, 50);
    ctx.fillStyle = theme_1.PALETTE.chili;
    ctx.font = (0, theme_1.font)(14, false);
    ctx.fillText(sub, 50, 96);
}
function paintChip(ctx, chip) {
    ctx.strokeStyle = chip.role === 'taboo' ? theme_1.PALETTE.chili : theme_1.PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(chip.x, chip.y, chip.w, chip.h);
    (0, press_1.drawWoodFood)(ctx, chip.shape, chip.x + 36, chip.y + chip.h / 2, 34);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(16, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(chip.got ? `${chip.label} · 已上` : chip.label, chip.x + 68, chip.y + chip.h / 2);
    if (chip.role === 'taboo') {
        ctx.fillStyle = theme_1.PALETTE.chili;
        ctx.font = (0, theme_1.font)(12, true);
        ctx.fillText('忌口', chip.x + chip.w - 36, chip.y + 14);
    }
    if (chip.crossed)
        (0, press_1.drawCrossMark)(ctx, chip.x + chip.w - 22, chip.y + chip.h / 2, 10);
}
function paintDishRow(ctx, button) {
    ctx.fillStyle = theme_1.PALETTE.paper;
    ctx.fillRect(button.x, button.y, button.w, button.h);
    ctx.strokeStyle = button.disabled ? theme_1.PALETTE.inkSoft : theme_1.PALETTE.chili;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(button.x, button.y, button.w, button.h);
    ctx.fillStyle = button.primary ? theme_1.PALETTE.chili : theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(22, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h * (button.disabled ? 0.62 : 0.5));
    if (button.disabled) {
        ctx.strokeStyle = theme_1.PALETTE.chili;
        ctx.strokeRect(button.x + 16, button.y + button.h * 0.28, button.w - 32, 28);
        ctx.font = (0, theme_1.font)(14, true);
        ctx.fillStyle = theme_1.PALETTE.chili;
        ctx.fillText('未开', button.x + button.w / 2, button.y + button.h * 0.28 + 14);
    }
}
function firstButtonY(vm) {
    let y = vm.height - 80;
    for (let i = 0; i < vm.buttons.length; i += 1) {
        if (vm.buttons[i].y < y)
            y = vm.buttons[i].y;
    }
    return y;
}
function cueWord(hint) {
    if (hint.indexOf('下料') === 0)
        return '下';
    if (hint.indexOf('停') === 0)
        return '停';
    return '颠';
}
