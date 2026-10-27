"use strict";
/**
 * 实拍剪贴资源表。路径和 @2x 像素跟 docs/COLLAGE_ART_SPEC.md 一致。
 * 仓库里的 PNG 是同名占位，换正式图时只替换文件。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_FRAMES = exports.TYPE = exports.FX = exports.FOOD = exports.UI = void 0;
exports.frameByPath = frameByPath;
exports.foodForLevel = foodForLevel;
function frame(path, pxW, pxH, paint) {
    return { path, pxW, pxH, paint };
}
exports.UI = {
    paperBg: frame('assets/ui/ui-paper-bg.png', 750, 1334, 'paper'),
    panelTorn: frame('assets/ui/ui-panel-torn.png', 640, 360, 'panel'),
    tapeStrip: frame('assets/ui/ui-tape-strip.png', 192, 56, 'tape'),
    scoreChip: frame('assets/ui/ui-score-chip.png', 240, 80, 'chip'),
    btnPrimary: frame('assets/ui/ui-btn-primary.png', 320, 112, 'btnPrimary'),
    btnGhost: frame('assets/ui/ui-btn-ghost.png', 320, 112, 'btnGhost'),
    heart: frame('assets/ui/ui-heart.png', 64, 64, 'heart'),
    heartEmpty: frame('assets/ui/ui-heart-empty.png', 64, 64, 'heartEmpty'),
    progressTrack: frame('assets/ui/ui-progress-track.png', 400, 24, 'track'),
    progressFill: frame('assets/ui/ui-progress-fill.png', 400, 24, 'fill'),
};
exports.FOOD = {
    wokBase: frame('assets/food/food-wok-base.png', 440, 280, 'wok'),
    oilSheen: frame('assets/food/food-oil-sheen.png', 360, 200, 'oil'),
    vegGreen: frame('assets/food/food-veg-green.png', 192, 192, 'veg'),
    meatSlice: frame('assets/food/food-meat-slice.png', 192, 144, 'meat'),
    egg: frame('assets/food/food-egg.png', 144, 144, 'egg'),
    chili: frame('assets/food/food-chili.png', 96, 128, 'chili'),
    scallion: frame('assets/food/food-scallion.png', 128, 80, 'scallion'),
    wokHandle: frame('assets/food/food-wok-handle.png', 160, 320, 'handle'),
    plateDone: frame('assets/food/food-plate-done.png', 320, 240, 'plate'),
};
exports.FX = {
    scrap01: frame('assets/fx/fx-paper-scrap-01.png', 96, 96, 'scrap'),
    scrap02: frame('assets/fx/fx-paper-scrap-02.png', 96, 96, 'scrap'),
    scrap03: frame('assets/fx/fx-paper-scrap-03.png', 96, 96, 'scrap'),
    star01: frame('assets/fx/fx-oil-star-01.png', 64, 64, 'star'),
    star02: frame('assets/fx/fx-oil-star-02.png', 64, 64, 'star'),
    star03: frame('assets/fx/fx-oil-star-03.png', 64, 64, 'star'),
    star04: frame('assets/fx/fx-oil-star-04.png', 64, 64, 'star'),
    flameLick: frame('assets/fx/fx-flame-lick.png', 128, 192, 'flame'),
    smokePuff: frame('assets/fx/fx-smoke-puff.png', 192, 192, 'smoke'),
    perfectBurst: frame('assets/fx/fx-perfect-burst.png', 256, 256, 'burst'),
    missDrip: frame('assets/fx/fx-miss-drip.png', 80, 128, 'drip'),
};
exports.TYPE = {
    toast01: frame('assets/type/type-toast-01.png', 280, 80, 'toast'),
    toast02: frame('assets/type/type-toast-02.png', 280, 80, 'toast'),
    toast03: frame('assets/type/type-toast-03.png', 280, 80, 'toast'),
    toast04: frame('assets/type/type-toast-04.png', 280, 80, 'toast'),
    toast05: frame('assets/type/type-toast-05.png', 280, 80, 'toast'),
    toast06: frame('assets/type/type-toast-06.png', 280, 80, 'toast'),
    toast07: frame('assets/type/type-toast-07.png', 280, 80, 'toast'),
    toast08: frame('assets/type/type-toast-08.png', 280, 80, 'toast'),
    perfect: frame('assets/type/type-perfect.png', 160, 96, 'perfect'),
    burnt: frame('assets/type/type-burnt.png', 160, 96, 'burnt'),
};
exports.ALL_FRAMES = [
    exports.UI.paperBg,
    exports.UI.panelTorn,
    exports.UI.tapeStrip,
    exports.UI.scoreChip,
    exports.UI.btnPrimary,
    exports.UI.btnGhost,
    exports.UI.heart,
    exports.UI.heartEmpty,
    exports.UI.progressTrack,
    exports.UI.progressFill,
    exports.FOOD.wokBase,
    exports.FOOD.oilSheen,
    exports.FOOD.vegGreen,
    exports.FOOD.meatSlice,
    exports.FOOD.egg,
    exports.FOOD.chili,
    exports.FOOD.scallion,
    exports.FOOD.wokHandle,
    exports.FOOD.plateDone,
    exports.FX.scrap01,
    exports.FX.scrap02,
    exports.FX.scrap03,
    exports.FX.star01,
    exports.FX.star02,
    exports.FX.star03,
    exports.FX.star04,
    exports.FX.flameLick,
    exports.FX.smokePuff,
    exports.FX.perfectBurst,
    exports.FX.missDrip,
    exports.TYPE.toast01,
    exports.TYPE.toast02,
    exports.TYPE.toast03,
    exports.TYPE.toast04,
    exports.TYPE.toast05,
    exports.TYPE.toast06,
    exports.TYPE.toast07,
    exports.TYPE.toast08,
    exports.TYPE.perfect,
    exports.TYPE.burnt,
];
const BY_PATH = new Map();
for (let i = 0; i < exports.ALL_FRAMES.length; i += 1)
    BY_PATH.set(exports.ALL_FRAMES[i].path, exports.ALL_FRAMES[i]);
function frameByPath(path) {
    return BY_PATH.get(path);
}
/** 锅里一层层叠：底锅和油光由画面另画，这里是主料。 */
function foodForLevel(level, seed) {
    if (level >= 4)
        return exports.FOOD.plateDone;
    if (level === 3)
        return exports.FOOD.chili;
    if (level === 2)
        return seed % 2 === 0 ? exports.FOOD.meatSlice : exports.FOOD.egg;
    return seed % 2 === 0 ? exports.FOOD.vegGreen : exports.FOOD.scallion;
}
