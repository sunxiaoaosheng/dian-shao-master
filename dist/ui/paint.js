"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paint = paint;
const draw_1 = require("./draw");
const theme_1 = require("./theme");
function paint(ctx, vm) {
    (0, draw_1.paintPaper)(ctx, vm.width, vm.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, vm.width, vm.height);
    ctx.clip();
    (0, draw_1.fillTorn)(ctx, vm.width - 24, 132, 3, theme_1.PALETTE.white, 0.035);
    ctx.restore();
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(28, true);
    ctx.fillText(vm.title, 20, 28);
    ctx.font = (0, theme_1.font)(14, false);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.fillText(vm.subtitle, 20, 64);
    let y = 96;
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(15, false);
    for (let i = 0; i < vm.lines.length; i += 1) {
        y = (0, draw_1.drawWrapped)(ctx, vm.lines[i], 20, y, vm.width - 40, 22);
        y += 4;
    }
    if (vm.hint) {
        ctx.fillStyle = theme_1.PALETTE.chiliDeep;
        ctx.font = (0, theme_1.font)(14, true);
        y = (0, draw_1.drawWrapped)(ctx, vm.hint, 20, y + 6, vm.width - 40, 20);
    }
    if (vm.even !== null) {
        ctx.fillStyle = theme_1.PALETTE.inkSoft;
        ctx.font = (0, theme_1.font)(12, false);
        ctx.fillText('均匀', 20, y + 16);
        (0, draw_1.drawMeter)(ctx, 64, y + 18, vm.width - 88, 14, vm.even);
        ctx.fillText('糊边', 20, y + 40);
        (0, draw_1.drawMeter)(ctx, 64, y + 42, vm.width - 88, 14, vm.burn || 0);
    }
    for (let i = 0; i < vm.chips.length; i += 1) {
        const chip = vm.chips[i];
        ctx.save();
        ctx.translate(chip.x, chip.y);
        ctx.globalAlpha = chip.got ? 0.45 : 1;
        (0, draw_1.fillTorn)(ctx, chip.w, chip.h, i + 2, chip.bad ? '#f6e0d4' : theme_1.PALETTE.white, 0.05);
        (0, draw_1.drawIngredient)(ctx, 8, 6, 36, 36, 2, chip.ink, false);
        ctx.globalAlpha = 1;
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(16, true);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(chip.got ? `${chip.label} · 已备` : chip.label, 50, chip.h / 2);
        ctx.restore();
    }
    for (let i = 0; i < vm.buttons.length; i += 1) {
        const button = vm.buttons[i];
        (0, draw_1.drawButton)(ctx, button.x, button.y, button.w, button.h, button.label, button.primary, button.disabled, false);
    }
    if (vm.debugLines.length) {
        ctx.fillStyle = theme_1.PALETTE.soy;
        ctx.font = (0, theme_1.font)(11, false);
        ctx.textAlign = 'left';
        let dy = vm.height - 16 - vm.debugLines.length * 14;
        for (let i = 0; i < vm.debugLines.length; i += 1) {
            ctx.fillText(vm.debugLines[i], 12, dy);
            dy += 14;
        }
    }
    for (let i = 0; i < vm.hits.length; i += 1) {
        const hit = vm.hits[i];
        if (hit.id === 'seal')
            (0, draw_1.drawSeal)(ctx, hit.x, hit.y, hit.w, '勺');
    }
}
