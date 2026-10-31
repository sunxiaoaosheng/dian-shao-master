"use strict";
/** 出锅分数和评级。只看结果，不碰微信。 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOD_SCORE = exports.SIGN_SCORE = exports.PASS_SCORE = void 0;
exports.ratingFor = ratingFor;
exports.isPassing = isPassing;
exports.entersWindow = entersWindow;
exports.clampScore = clampScore;
exports.PASS_SCORE = 60;
exports.SIGN_SCORE = 80;
exports.GOD_SCORE = 92;
function ratingFor(score) {
    const safe = clampScore(score);
    if (safe >= exports.GOD_SCORE)
        return 'god';
    if (safe >= exports.SIGN_SCORE)
        return 'sign';
    if (safe >= exports.PASS_SCORE)
        return 'pass';
    return 'wreck';
}
function isPassing(rating) {
    return rating === 'pass' || rating === 'sign' || rating === 'god';
}
/** 招牌和神菜才能进主页橱窗。及格只记通关进度。 */
function entersWindow(rating) {
    return rating === 'sign' || rating === 'god';
}
function clampScore(score) {
    if (!isFinite(score) || score <= 0)
        return 0;
    if (score >= 100)
        return 100;
    return Math.round(score);
}
