/**
 * 按 src/content/collage.ts 的路径和 @2x 尺寸写 PNG-24 占位。
 * 直通 alpha，厨房配色，撕纸边 1–2px。没有职场图案，也没有汉字点阵。
 * 用法：npm run assets
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { ALL_FRAMES } = require(path.join(root, 'dist/content/collage.js'));

const KRAFT = [230, 211, 176, 255];
const CREAM = [255, 250, 241, 255];
const CHILI = [196, 69, 42, 255];
const INK = [58, 36, 22, 255];
const IRON = [48, 42, 38, 255];
const OIL = [232, 176, 64, 150];
const VEG = [74, 140, 62, 255];
const MEAT = [168, 78, 52, 255];
const EGG = [244, 214, 92, 255];
const WOOD = [146, 96, 52, 255];
const GOLD = [232, 184, 74, 220];

function hash(x, y, s) {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1274126177)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return n >>> 0;
}

function ragged(x, y, w, h, seed) {
  const d = Math.min(x, y, w - 1 - x, h - 1 - y);
  if (d >= 2) return 255;
  const n = hash(x, y, seed) % 3;
  if (d === 0) return n === 2 ? 200 : 0;
  return n === 0 ? 0 : 220;
}

function ellipse(x, y, cx, cy, rx, ry) {
  const dx = (x + 0.5 - cx) / rx;
  const dy = (y + 0.5 - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    Math.round(a[3] + (b[3] - a[3]) * t),
  ];
}

function paintOf(kind, fileSeed) {
  return (x, y, w, h) => {
    const u = x / Math.max(1, w - 1);
    const v = y / Math.max(1, h - 1);
    if (kind === 'paper') {
      const fiber = (hash(x, Math.floor(y / 3), 3) % 17 === 0) ? 12 : 0;
      const speck = hash(x, y, 9) % 90 === 0 ? -18 : 0;
      return [KRAFT[0] - fiber + speck, KRAFT[1] - fiber, KRAFT[2] - Math.floor(fiber / 2), 255];
    }
    if (kind === 'panel' || kind === 'toast') {
      const base = hash(x, y, 4) % 40 === 0 ? [246, 236, 214, 255] : CREAM;
      if (kind === 'toast' && v > 0.72 && v < 0.84 && u > 0.12 && u < 0.88) return CHILI;
      return base;
    }
    if (kind === 'tape') {
      if (Math.floor(y / 7) % 2 === 0) return [214, 168, 74, 150];
      return [232, 196, 110, 120];
    }
    if (kind === 'chip') {
      if (u < 0.12) return CHILI;
      return CREAM;
    }
    if (kind === 'btnPrimary') {
      if (!ellipse(x, y, w / 2, h / 2, w * 0.46, h * 0.42)) return null;
      return u < 0.5 ? CHILI : [176, 52, 32, 255];
    }
    if (kind === 'btnGhost') {
      const inside = ellipse(x, y, w / 2, h / 2, w * 0.46, h * 0.42);
      const ring = ellipse(x, y, w / 2, h / 2, w * 0.46, h * 0.42)
        && !ellipse(x, y, w / 2, h / 2, w * 0.42, h * 0.32);
      if (ring) return CHILI;
      if (inside) return [255, 250, 241, 230];
      return null;
    }
    if (kind === 'heart' || kind === 'heartEmpty') {
      const left = ellipse(x, y, w * 0.35, h * 0.38, w * 0.22, h * 0.22);
      const right = ellipse(x, y, w * 0.65, h * 0.38, w * 0.22, h * 0.22);
      const body = y > h * 0.34 && Math.abs(x - w / 2) < (h - y) * 0.72;
      const on = left || right || body;
      if (!on) return null;
      const edge = (left && !ellipse(x, y, w * 0.35, h * 0.38, w * 0.15, h * 0.15))
        || (right && !ellipse(x, y, w * 0.65, h * 0.38, w * 0.15, h * 0.15))
        || (body && Math.abs(x - w / 2) > (h - y) * 0.5);
      if (kind === 'heartEmpty') return edge ? CHILI : null;
      return CHILI;
    }
    if (kind === 'track') {
      if (!ellipse(x, y, w / 2, h / 2, w * 0.48, h * 0.46)) return null;
      return [90, 58, 36, 255];
    }
    if (kind === 'fill') {
      if (!ellipse(x, y, w / 2, h / 2, w * 0.48, h * 0.46)) return null;
      return mix(GOLD, CHILI, u);
    }
    if (kind === 'wok') {
      if (!ellipse(x, y, w / 2, h * 0.58, w * 0.46, h * 0.36)) return null;
      const lip = !ellipse(x, y, w / 2, h * 0.56, w * 0.38, h * 0.26);
      return lip ? [72, 64, 58, 255] : IRON;
    }
    if (kind === 'oil') {
      if (!ellipse(x, y, w / 2, h / 2, w * 0.42, h * 0.32)) return null;
      return OIL;
    }
    if (kind === 'veg') {
      const a = ellipse(x, y, w * 0.38, h * 0.42, w * 0.22, h * 0.18);
      const b = ellipse(x, y, w * 0.62, h * 0.58, w * 0.2, h * 0.16);
      if (!a && !b) return null;
      return VEG;
    }
    if (kind === 'meat') {
      if (!ellipse(x, y, w / 2, h / 2, w * 0.4, h * 0.32)) return null;
      return hash(x, y, 6) % 5 === 0 ? [120, 48, 36, 255] : MEAT;
    }
    if (kind === 'egg') {
      if (!ellipse(x, y, w / 2, h / 2, w * 0.4, h * 0.4)) return null;
      if (ellipse(x, y, w * 0.55, h * 0.48, w * 0.16, h * 0.16)) return [232, 160, 42, 255];
      return EGG;
    }
    if (kind === 'chili') {
      const taper = 0.18 + v * 0.28;
      if (Math.abs(u - 0.5) > taper || v < 0.08) return null;
      return v < 0.22 ? VEG : CHILI;
    }
    if (kind === 'scallion') {
      const band = Math.abs((u * 1.4 - v) % 0.34);
      if (band > 0.12) return null;
      return [96, 168, 72, 255];
    }
    if (kind === 'handle') {
      if (Math.abs(u - 0.5) > 0.28) return null;
      return v < 0.12 ? IRON : WOOD;
    }
    if (kind === 'plate') {
      if (!ellipse(x, y, w / 2, h / 2, w * 0.44, h * 0.4)) return null;
      const rim = !ellipse(x, y, w / 2, h / 2, w * 0.34, h * 0.28);
      if (rim) return [236, 228, 214, 255];
      if (ellipse(x, y, w * 0.42, h * 0.48, w * 0.08, h * 0.08)) return VEG;
      if (ellipse(x, y, w * 0.58, h * 0.52, w * 0.07, h * 0.07)) return MEAT;
      return CREAM;
    }
    if (kind === 'scrap') {
      const wobble = (hash(y, fileSeed, 2) % 5) - 2;
      if (x < 8 + wobble || x > w - 10 - wobble || y < 10 || y > h - 8) return null;
      return fileSeed % 2 === 0 ? KRAFT : CREAM;
    }
    if (kind === 'star') {
      const cx = w / 2;
      const cy = h / 2;
      const ax = Math.abs(x - cx);
      const ay = Math.abs(y - cy);
      const r = w * 0.42;
      const cross = ax + ay * 0.45 < r * 0.55 || ay + ax * 0.45 < r * 0.55;
      if (!cross) return null;
      return [GOLD[0], GOLD[1], GOLD[2], 180 + (fileSeed % 4) * 12];
    }
    if (kind === 'flame') {
      const reach = 0.12 + (1 - v) * 0.34;
      if (Math.abs(u - 0.5) > reach) return null;
      return v > 0.62 ? [232, 92, 36, 230] : [255, 196, 64, 210];
    }
    if (kind === 'smoke') {
      const puff = ellipse(x, y, w * 0.45, h * 0.5, w * 0.28, h * 0.24)
        || ellipse(x, y, w * 0.62, h * 0.42, w * 0.2, h * 0.18);
      if (!puff) return null;
      return [186, 176, 166, 96];
    }
    if (kind === 'burst') {
      const dx = (x + 0.5 - w / 2) / (w * 0.42);
      const dy = (y + 0.5 - h / 2) / (h * 0.42);
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > 1 || r < 0.55) return null;
      return [GOLD[0], GOLD[1], GOLD[2], 170];
    }
    if (kind === 'drip') {
      const neck = v < 0.35 ? 0.12 : 0.16 + (v - 0.35) * 0.2;
      if (Math.abs(u - 0.5) > neck) return null;
      return [120, 72, 28, 210];
    }
    if (kind === 'perfect') {
      if (!ellipse(x, y, w / 2, h / 2, w * 0.36, h * 0.36)) return null;
      const ring = !ellipse(x, y, w / 2, h / 2, w * 0.24, h * 0.24);
      return ring ? CHILI : GOLD;
    }
    if (kind === 'burnt') {
      if (!ellipse(x, y, w / 2, h / 2, w * 0.36, h * 0.36)) return null;
      return [54, 42, 36, 230];
    }
    return KRAFT;
  };
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}

function encodePng(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function render(frame) {
  const { pxW: w, pxH: h, paint, path: filePath } = frame;
  let seed = 0;
  for (let i = 0; i < filePath.length; i += 1) seed = (seed + filePath.charCodeAt(i) * (i + 1)) >>> 0;
  const sample = paintOf(paint, seed);
  const torn = paint !== 'paper';
  const rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const px = sample(x, y, w, h);
      if (!px) continue;
      const edge = torn ? ragged(x, y, w, h, seed) : 255;
      const a = Math.round(px[3] * edge / 255);
      if (a <= 0) continue;
      const i = (y * w + x) * 4;
      rgba[i] = px[0];
      rgba[i + 1] = px[1];
      rgba[i + 2] = px[2];
      rgba[i + 3] = a;
    }
  }
  return encodePng(w, h, rgba);
}

let count = 0;
for (const frame of ALL_FRAMES) {
  const dest = path.join(root, frame.path);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, render(frame));
  count += 1;
}
console.log(`写了 ${count} 张剪贴占位图`);
