"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.momentLine = momentLine;
function momentLine(dish) {
    if (dish)
        return `颠到「${dish}」的那一下`;
    return '就这一下，锅气起来了';
}
