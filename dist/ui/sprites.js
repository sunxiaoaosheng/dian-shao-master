"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCollage = loadCollage;
exports.spriteReady = spriteReady;
exports.spriteOrigin = spriteOrigin;
exports.drawSprite = drawSprite;
exports.beginSprites = beginSprites;
exports.queueBox = queueBox;
exports.queueSprite = queueSprite;
exports.flushSprites = flushSprites;
exports.resetCollageForTests = resetCollageForTests;
const manifest_1 = require("../content/manifest");
const slots = new Map();
const queue = [];
let started = false;
/** 按清单 path 加载。图还没到时绘制会退回矢量剪贴，不挡开局。 */
function loadCollage(createImage) {
    if (started)
        return;
    started = true;
    for (let i = 0; i < manifest_1.ASSETS.length; i += 1) {
        const item = manifest_1.ASSETS[i];
        const slot = { image: null, ready: false };
        slots.set(item.id, slot);
        const image = createImage();
        if (!image)
            continue;
        image.onload = () => {
            slot.ready = true;
        };
        image.onerror = () => {
            slot.ready = false;
        };
        image.src = item.file;
        slot.image = image;
    }
}
function spriteReady(id) {
    const slot = slots.get(id);
    return Boolean(slot && slot.ready && slot.image);
}
/** 锚点减去 pivot × 尺寸，得到 drawImage 的左上角。 */
function spriteOrigin(id, anchorX, anchorY, w, h) {
    const item = (0, manifest_1.assetById)(id);
    return {
        x: anchorX - item.pivot[0] * w,
        y: anchorY - item.pivot[1] * h,
    };
}
function drawSprite(ctx, id, anchorX, anchorY, w, h) {
    const slot = slots.get(id);
    if (!slot || !slot.ready || !slot.image || !ctx.drawImage)
        return false;
    const origin = spriteOrigin(id, anchorX, anchorY, w, h);
    ctx.drawImage(slot.image, origin.x, origin.y, w, h);
    return true;
}
function beginSprites() {
    queue.length = 0;
}
/** 盒子左上角进，锚点按清单 pivot 算。 */
function queueBox(id, x, y, w, h, extra) {
    const item = (0, manifest_1.assetById)(id);
    queueSprite({
        id,
        ax: x + item.pivot[0] * w,
        ay: y + item.pivot[1] * h,
        w,
        h,
        alpha: extra && extra.alpha !== undefined ? extra.alpha : 1,
        tx: extra && extra.tx !== undefined ? extra.tx : 0,
        ty: extra && extra.ty !== undefined ? extra.ty : 0,
        rot: extra && extra.rot !== undefined ? extra.rot : 0,
        clip: extra ? extra.clip : null,
        fallback: extra ? extra.fallback : undefined,
    });
}
function queueSprite(placement) {
    queue.push({
        id: placement.id,
        ax: placement.ax,
        ay: placement.ay,
        w: placement.w,
        h: placement.h,
        alpha: placement.alpha !== undefined ? placement.alpha : 1,
        tx: placement.tx || 0,
        ty: placement.ty || 0,
        rot: placement.rot || 0,
        clip: placement.clip,
        fallback: placement.fallback,
    });
}
/** 按清单 z 从低到高画。同一 z 保持入队顺序。 */
function flushSprites(ctx) {
    const batch = queue.splice(0);
    batch.sort((a, b) => (0, manifest_1.assetById)(a.id).z - (0, manifest_1.assetById)(b.id).z);
    const drawn = [];
    for (let i = 0; i < batch.length; i += 1) {
        const cmd = batch[i];
        drawn.push(cmd.id);
        ctx.save();
        if (cmd.tx || cmd.ty)
            ctx.translate(cmd.tx, cmd.ty);
        if (cmd.rot)
            ctx.rotate(cmd.rot);
        ctx.globalAlpha = cmd.alpha;
        if (cmd.clip) {
            ctx.beginPath();
            ctx.rect(cmd.clip.x, cmd.clip.y, cmd.clip.w, cmd.clip.h);
            ctx.clip();
        }
        const ok = drawSprite(ctx, cmd.id, cmd.ax, cmd.ay, cmd.w, cmd.h);
        if (!ok && cmd.fallback)
            cmd.fallback(ctx);
        ctx.restore();
    }
    return drawn;
}
/** 测试里换一套假图时用。正式运行不要调用。 */
function resetCollageForTests() {
    slots.clear();
    queue.length = 0;
    started = false;
}
