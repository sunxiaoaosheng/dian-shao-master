"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.go = go;
/** 场景只按这张表走，避免各按钮各写一套跳转。 */
function go(screen, event) {
    if (event === 'home')
        return 'home';
    if (screen === 'home' && event === 'pick')
        return 'order';
    if (screen === 'home' && event === 'album')
        return 'album';
    if (screen === 'home' && event === 'clear')
        return 'clear';
    if (screen === 'order' && event === 'accept')
        return 'prep';
    if (screen === 'prep' && event === 'ready')
        return 'cook';
    if (screen === 'cook' && event === 'plate')
        return 'plate';
    if (screen === 'plate' && event === 'retry')
        return 'order';
    if (screen === 'plate' && event === 'album')
        return 'album';
    return screen;
}
