"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLoop = runLoop;
function runLoop(step, now) {
    let last = now();
    const frame = () => {
        const t = now();
        const dt = Math.max(0, Math.min(48, t - last));
        last = t;
        step(dt);
        nextFrame(frame);
    };
    frame();
}
function nextFrame(cb) {
    const host = globalThis;
    if (typeof host.requestAnimationFrame === 'function')
        host.requestAnimationFrame(cb);
    else
        setTimeout(cb, 16);
}
