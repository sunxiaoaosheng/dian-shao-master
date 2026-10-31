"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashSeed = hashSeed;
exports.paintPaper = paintPaper;
exports.fillTorn = fillTorn;
exports.drawTape = drawTape;
exports.drawSeal = drawSeal;
exports.drawWok = drawWok;
exports.drawSteam = drawSteam;
exports.drawIngredient = drawIngredient;
exports.drawPolaroid = drawPolaroid;
exports.drawButton = drawButton;
exports.drawMeter = drawMeter;
exports.drawWrapped = drawWrapped;
const theme_1 = require("./theme");
const tornCache = new Map();
let speckKey = '';
let specks = [];
function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function hashSeed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function paintPaper(ctx, w, h) {
    ctx.fillStyle = theme_1.PALETTE.paper;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = theme_1.PALETTE.fiber;
    ctx.lineWidth = 1;
    for (let x = -h; x < w + h; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h * 0.28, h);
        ctx.stroke();
    }
    ctx.restore();
    const key = `${Math.round(w)}x${Math.round(h)}`;
    if (key !== speckKey) {
        speckKey = key;
        const rand = mulberry32(w * 13 + h);
        specks = [];
        const count = Math.max(40, Math.floor((w * h) / 14000));
        for (let i = 0; i < count; i += 1) {
            specks.push({
                x: rand() * w,
                y: rand() * h,
                r: 0.6 + rand() * 1.4,
                a: 0.08 + rand() * 0.18,
            });
        }
    }
    for (let i = 0; i < specks.length; i += 1) {
        const speck = specks[i];
        ctx.beginPath();
        ctx.fillStyle = theme_1.PALETTE.soy;
        ctx.globalAlpha = speck.a;
        ctx.arc(speck.x, speck.y, speck.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#8a5a32';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(w * 0.86, h * 0.16, Math.min(36, w * 0.09), 0.2, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
    drawTape(ctx, w * 0.22, 18, 78, -0.4);
    drawTape(ctx, w * 0.72, h - 16, 90, 0.25);
    drawChili(ctx, 18, h - 46);
}
function fillTorn(ctx, w, h, seed, color, amp = 0.05) {
    traceTorn(ctx, w, h, seed, amp);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = theme_1.PALETTE.inkSoft;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}
function drawTape(ctx, x, y, w, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = theme_1.PALETTE.tape;
    ctx.fillRect(-w / 2, -7, w, 14);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = theme_1.PALETTE.tapeEdge;
    ctx.fillRect(-w / 2, -7, w, 2);
    ctx.fillRect(-w / 2, 5, w, 2);
    ctx.restore();
}
function drawSeal(ctx, x, y, size, text) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(-0.08);
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.46, 0, Math.PI * 2);
    ctx.fillStyle = theme_1.PALETTE.seal;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f3d2c4';
    ctx.stroke();
    ctx.fillStyle = '#f8e6df';
    ctx.font = (0, theme_1.font)(size * 0.42, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1);
    ctx.restore();
}
function drawWok(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.58;
    const rx = w * 0.48;
    const ry = Math.max(18, h * 0.22);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx, ry);
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fillStyle = theme_1.PALETTE.iron;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy - ry * 0.15);
    ctx.scale(rx * 0.72, ry * 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#3c4248';
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = theme_1.PALETTE.ironLite;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 4, cy);
    ctx.lineTo(x - 8, cy - 6);
    ctx.moveTo(x + w - 4, cy);
    ctx.lineTo(x + w + 8, cy - 6);
    ctx.stroke();
}
function drawSteam(ctx, x, y, t) {
    ctx.save();
    ctx.strokeStyle = theme_1.PALETTE.steam;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
        const phase = (t / 700 + i * 0.33) % 1;
        ctx.globalAlpha = (1 - phase) * 0.7;
        ctx.beginPath();
        ctx.moveTo(x + i * 10 - 10, y);
        ctx.quadraticCurveTo(x + i * 10 - 16, y - 18 * phase, x + i * 10 - 8, y - 36 * phase);
        ctx.stroke();
    }
    ctx.restore();
}
function drawIngredient(ctx, x, y, w, h, level, ink, burnt) {
    const cx = x + w / 2;
    const bowl = y + h * 0.72;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.16, bowl);
    ctx.quadraticCurveTo(cx, y + h * 0.98, x + w * 0.84, bowl);
    ctx.strokeStyle = burnt ? '#6d6258' : theme_1.PALETTE.soy;
    ctx.lineWidth = Math.max(1.5, w * 0.04);
    ctx.stroke();
    const colors = burnt ? ['#5c5148', '#3e3832', '#6a5e54'] : flavorColors(level, ink);
    const count = 2 + Math.min(3, Math.max(0, level - 1));
    for (let i = 0; i < count; i += 1) {
        const px = x + w * (0.3 + (i % 3) * 0.2);
        const py = y + h * (0.34 + (i % 2) * 0.16);
        ctx.beginPath();
        if (level <= 1 && !burnt) {
            ctx.strokeStyle = colors[0];
            ctx.lineWidth = Math.max(2, w * 0.06);
            ctx.moveTo(px, py + 8);
            ctx.lineTo(px + 2, py - 8);
            ctx.stroke();
        }
        else {
            ctx.arc(px, py, Math.max(3, w * 0.09), 0, Math.PI * 2);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
        }
    }
}
function drawPolaroid(ctx, x, y, w, h, seed, level, ink, caption, burnt, cook = 0) {
    ctx.save();
    ctx.translate(x + 3, y + 4);
    ctx.globalAlpha = 0.14;
    fillTorn(ctx, w, h, seed + 3, theme_1.PALETTE.soy, 0.04);
    ctx.restore();
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((((seed % 5) - 2) * Math.PI) / 140);
    ctx.translate(-w / 2, -h / 2);
    fillTorn(ctx, w, h, seed, theme_1.PALETTE.photo, 0.045);
    const pad = Math.max(4, w * 0.1);
    const photoH = h * 0.58;
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad, pad, w - pad * 2, photoH);
    ctx.clip();
    ctx.fillStyle = burnt ? '#d9cfc3' : ink;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(pad, pad, w - pad * 2, photoH);
    ctx.globalAlpha = 1;
    drawIngredient(ctx, pad, pad, w - pad * 2, photoH, level, ink, burnt);
    if (burnt) {
        ctx.fillStyle = 'rgba(43,33,24,0.45)';
        ctx.fillRect(pad, pad, w - pad * 2, photoH);
        ctx.fillStyle = '#f6efe2';
        ctx.font = (0, theme_1.font)(Math.max(14, Math.min(28, w * 0.34)), true);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('糊', w / 2, pad + photoH / 2);
    }
    ctx.restore();
    if (caption) {
        ctx.fillStyle = theme_1.PALETTE.ink;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const size = Math.max(10, Math.min(16, w * 0.2));
        ctx.font = (0, theme_1.font)(size, true);
        ctx.fillText(caption, w / 2, h * 0.82);
    }
    if (cook > 0.04 && !burnt) {
        ctx.beginPath();
        ctx.strokeStyle = cook > 0.72 ? theme_1.PALETTE.chili : theme_1.PALETTE.yolk;
        ctx.lineWidth = 2.5;
        ctx.arc(w - 11, 12, 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cook);
        ctx.stroke();
    }
    drawTape(ctx, w / 2, 1, Math.max(16, w * 0.42), -0.12);
    ctx.restore();
}
function drawButton(ctx, x, y, w, h, label, primary, disabled, selected) {
    ctx.save();
    ctx.translate(x, y);
    fillTorn(ctx, w, h, hashSeed(label + primary), primary ? theme_1.PALETTE.chili : theme_1.PALETTE.white, 0.04);
    if (selected) {
        ctx.strokeStyle = theme_1.PALETTE.chiliDeep;
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, w - 4, h - 4);
    }
    ctx.fillStyle = primary ? theme_1.PALETTE.white : theme_1.PALETTE.ink;
    ctx.globalAlpha = disabled ? 0.45 : 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = h >= 46 ? 18 : 15;
    ctx.font = (0, theme_1.font)(size, true);
    while (size > 11 && ctx.measureText(label).width > w - 18) {
        size -= 1;
        ctx.font = (0, theme_1.font)(size, true);
    }
    ctx.fillText(label, w / 2, h / 2 + 1);
    ctx.restore();
}
function drawMeter(ctx, x, y, w, h, ratio) {
    const clamped = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
    ctx.fillStyle = '#f3e6cf';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = theme_1.PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = clamped > 0.75 ? theme_1.PALETTE.chili : clamped > 0.45 ? theme_1.PALETTE.yolk : theme_1.PALETTE.scallion;
    ctx.fillRect(x + 2, y + 2, Math.max(0, (w - 4) * clamped), h - 4);
}
function drawWrapped(ctx, text, x, y, maxW, lineH) {
    let line = '';
    let yy = y;
    for (let i = 0; i < text.length; i += 1) {
        const next = line + text.charAt(i);
        if (line && ctx.measureText(next).width > maxW) {
            ctx.fillText(line, x, yy);
            yy += lineH;
            line = text.charAt(i);
        }
        else {
            line = next;
        }
    }
    if (line) {
        ctx.fillText(line, x, yy);
        yy += lineH;
    }
    return yy;
}
function traceTorn(ctx, w, h, seed, amp) {
    const pts = tornPolygon(w, h, seed, amp);
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2)
        ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
}
function tornPolygon(w, h, seed, amp) {
    const key = `${Math.round(w * 2)}|${Math.round(h * 2)}|${seed}|${amp}`;
    const cached = tornCache.get(key);
    if (cached)
        return cached;
    const rand = mulberry32(seed || 1);
    const pts = [];
    const steps = 6;
    const edge = (x0, y0, x1, y1) => {
        for (let i = 0; i <= steps; i += 1) {
            if (i === 0 && pts.length)
                continue;
            const t = i / steps;
            const px = x0 + (x1 - x0) * t;
            const py = y0 + (y1 - y0) * t;
            const nx = -(y1 - y0);
            const ny = x1 - x0;
            const len = Math.hypot(nx, ny) || 1;
            const corner = i === 0 || i === steps ? 0.25 : 1;
            const j = (rand() - 0.5) * Math.min(w, h) * amp * corner;
            pts.push(px + (nx / len) * j, py + (ny / len) * j);
        }
    };
    edge(0, 0, w, 0);
    edge(w, 0, w, h);
    edge(w, h, 0, h);
    edge(0, h, 0, 0);
    if (tornCache.size > 240)
        tornCache.clear();
    tornCache.set(key, pts);
    return pts;
}
function flavorColors(level, ink) {
    if (level <= 1)
        return [theme_1.PALETTE.scallion, '#8fbf6a'];
    if (level === 2)
        return ['#f4efe4', ink, theme_1.PALETTE.yolk];
    if (level === 3)
        return [theme_1.PALETTE.chili, ink, theme_1.PALETTE.yolk];
    return [ink, theme_1.PALETTE.yolk, theme_1.PALETTE.scallion, theme_1.PALETTE.chili];
}
function drawChili(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.6);
    ctx.fillStyle = theme_1.PALETTE.chili;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(10, -8, 16, 2);
    ctx.quadraticCurveTo(8, 8, 0, 0);
    ctx.fill();
    ctx.strokeStyle = theme_1.PALETTE.scallion;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, -2);
    ctx.quadraticCurveTo(18, -10, 12, -14);
    ctx.stroke();
    ctx.restore();
}
