"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARD_H = exports.CARD_W = void 0;
exports.paintShareCard = paintShareCard;
const draw_1 = require("../ui/draw");
const theme_1 = require("../ui/theme");
/** 分享图用 5:4，避免会话里把竖图裁坏。文案跟片段是同一下颠勺。 */
exports.CARD_W = 500;
exports.CARD_H = 400;
function paintShareCard(ctx, moment) {
    (0, draw_1.paintPaper)(ctx, exports.CARD_W, exports.CARD_H);
    ctx.save();
    ctx.translate(24, 36);
    (0, draw_1.fillTorn)(ctx, 452, 320, 4, theme_1.PALETTE.white, 0.04);
    (0, draw_1.drawPolaroid)(ctx, 24, 36, 160, 200, 12, 4, moment.ink || theme_1.PALETTE.chili, moment.dish || '颠勺', false, 0);
    ctx.fillStyle = theme_1.PALETTE.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0, theme_1.font)(28, true);
    ctx.fillText('颠勺大师', 210, 48);
    ctx.font = (0, theme_1.font)(18, true);
    ctx.fillStyle = theme_1.PALETTE.chiliDeep;
    const dish = moment.dish || '这口锅';
    ctx.fillText(dish, 210, 100);
    ctx.font = (0, theme_1.font)(16, false);
    ctx.fillStyle = theme_1.PALETTE.inkSoft;
    ctx.fillText(moment.line, 210, 146);
    ctx.fillText(moment.region ? `${moment.region}灶口` : '灶口', 210, 176);
    if (moment.score > 0) {
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.font = (0, theme_1.font)(20, true);
        ctx.fillText(`${moment.score} 分`, 210, 230);
    }
    ctx.restore();
}
