"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIP_H = exports.CLIP_W = void 0;
exports.paintClip = paintClip;
const draw_1 = require("../ui/draw");
const theme_1 = require("../ui/theme");
/** 竖屏 9:16，主体放在画面中部，对准颠起来的那一下。 */
exports.CLIP_W = 540;
exports.CLIP_H = 960;
function paintClip(ctx, moment) {
    (0, draw_1.paintPaper)(ctx, exports.CLIP_W, exports.CLIP_H);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(18, false);
    ctx.fillText('颠勺大师', exports.CLIP_W / 2, 72);
    ctx.save();
    ctx.translate(70, 150);
    (0, draw_1.fillTorn)(ctx, exports.CLIP_W - 140, 120, 7, theme_1.PALETTE.white, 0.05);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(28, true);
    ctx.textAlign = 'center';
    ctx.fillText(moment.line, (exports.CLIP_W - 140) / 2, 36);
    ctx.font = (0, theme_1.font)(16, false);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.fillText(moment.region ? `${moment.region}灶口` : '灶口手账', (exports.CLIP_W - 140) / 2, 78);
    ctx.restore();
    const wokX = 70;
    const wokY = 340;
    const wokW = 400;
    const wokH = 280;
    (0, draw_1.drawWok)(ctx, wokX, wokY, wokW, wokH);
    (0, draw_1.drawSteam)(ctx, exports.CLIP_W / 2, wokY + 20, 400);
    const energy = moment.energy < 0 ? 0 : moment.energy > 1 ? 1 : moment.energy;
    ctx.save();
    ctx.globalAlpha = 0.35 + energy * 0.6;
    ctx.strokeStyle = theme_1.PALETTE.white;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i += 1) {
        const spread = 24 + i * 16;
        ctx.beginPath();
        ctx.moveTo(exports.CLIP_W / 2 - 20, wokY + 80);
        ctx.lineTo(exports.CLIP_W / 2 - spread, wokY + 20 - i * 8);
        ctx.moveTo(exports.CLIP_W / 2 + 20, wokY + 80);
        ctx.lineTo(exports.CLIP_W / 2 + spread, wokY + 20 - i * 8);
        ctx.stroke();
    }
    ctx.restore();
    (0, draw_1.drawPolaroid)(ctx, exports.CLIP_W / 2 - 70, 470, 140, 160, 19, 4, moment.ink || theme_1.PALETTE.chili, moment.dish || '这一颠', false, 0);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.font = (0, theme_1.font)(22, true);
    ctx.textAlign = 'center';
    ctx.fillText(moment.score > 0 ? `${moment.score} 分` : '锅气起来了', exports.CLIP_W / 2, 820);
}
