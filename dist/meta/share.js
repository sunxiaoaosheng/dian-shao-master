"use strict";
/** 分享文案。真正发不发由玩家点按钮决定，开局不会调用分享。 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareTitle = shareTitle;
exports.clipCaption = clipCaption;
exports.shareQuery = shareQuery;
function shareTitle(dish, score) {
    if (dish)
        return `我把「${dish}」颠出锅气了`;
    if (score > 0)
        return `这口锅我颠了 ${score} 分`;
    return '今晚这口锅，你来颠一下';
}
function clipCaption(dish) {
    if (dish)
        return `颠到「${dish}」的那一下`;
    return '就这一下，锅气起来了';
}
function shareQuery() {
    return 'from=voluntary';
}
