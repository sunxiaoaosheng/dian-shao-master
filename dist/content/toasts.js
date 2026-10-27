"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOAST_LINES = void 0;
exports.pickToast = pickToast;
exports.toastImageFor = toastImageFor;
const manifest_1 = require("./manifest");
exports.TOAST_LINES = (0, manifest_1.assetsByPrefix)('type.toast.').map((image) => ({
    text: image.text,
    image,
}));
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
