"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCollage = loadCollage;
exports.spriteReady = spriteReady;
exports.drawSprite = drawSprite;
exports.resetCollageForTests = resetCollageForTests;
const collage_1 = require("../content/collage");
const slots = new Map();
let started = false;
/** 按规格路径加载。图还没到时绘制会退回矢量剪贴，不挡开局。 */
function loadCollage(createImage) {
    if (started)
        return;
    started = true;
    for (let i = 0; i < collage_1.ALL_FRAMES.length; i += 1) {
        const frame = collage_1.ALL_FRAMES[i];
        const slot = { frame, image: null, ready: false };
        slots.set(frame.path, slot);
        const image = createImage();
        if (!image)
            continue;
        image.onload = () => {
            slot.ready = true;
        };
        image.onerror = () => {
            slot.ready = false;
        };
        image.src = frame.path;
        slot.image = image;
    }
}
function spriteReady(frame) {
    const slot = slots.get(frame.path);
    return Boolean(slot && slot.ready && slot.image);
}
function drawSprite(ctx, frame, x, y, w, h) {
    const slot = slots.get(frame.path);
    if (!slot || !slot.ready || !slot.image || !ctx.drawImage)
        return false;
    ctx.drawImage(slot.image, x, y, w, h);
    return true;
}
/** 测试里换一套假图时用。正式运行不要调用。 */
function resetCollageForTests() {
    slots.clear();
    started = false;
}
