"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOAST_LINES = void 0;
exports.pickToast = pickToast;
exports.toastImageFor = toastImageFor;
const collage_1 = require("./collage");
exports.TOAST_LINES = [
    { text: '火候？我跟火候不熟。', image: collage_1.TYPE.toast01 },
    { text: '颠勺不是甩锅，别误会。', image: collage_1.TYPE.toast02 },
    { text: '油花比我命还欢。', image: collage_1.TYPE.toast03 },
    { text: '这菜：差点完美，完美差点。', image: collage_1.TYPE.toast04 },
    { text: '锅在飞，心在颤。', image: collage_1.TYPE.toast05 },
    { text: '盐放多了就叫「个性」。', image: collage_1.TYPE.toast06 },
    { text: '糊了也是烟火气。', image: collage_1.TYPE.toast07 },
    { text: '再颠一下，信我。', image: collage_1.TYPE.toast08 },
];
function pickToast(seed) {
    const i = Math.abs(Math.floor(seed)) % exports.TOAST_LINES.length;
    return exports.TOAST_LINES[i];
}
function toastImageFor(text) {
    for (let i = 0; i < exports.TOAST_LINES.length; i += 1) {
        if (exports.TOAST_LINES[i].text === text)
            return exports.TOAST_LINES[i].image;
    }
    return null;
}
