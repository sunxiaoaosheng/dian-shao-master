"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mulberry32 = mulberry32;
/** 可复现的小随机数，给洗牌和撕纸边缘用。 */
function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
