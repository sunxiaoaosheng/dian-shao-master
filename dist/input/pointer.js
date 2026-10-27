"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hitTest = hitTest;
/** 后画的在上面，所以从末尾往前找。 */
function hitTest(rects, x, y) {
    for (let i = rects.length - 1; i >= 0; i -= 1) {
        const rect = rects[i];
        if (x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h)
            return rect.id;
    }
    return null;
}
