import type { Ctx } from './ctx';
import { PALETTE, font } from './theme';

/** 老字号菜单共用的版式：宣纸、回纹边、朱印、木刻锅和食材。 */

export function paintSheet(ctx: Ctx, w: number, h: number): void {
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = PALETTE.fiber;
  ctx.lineWidth = 1;
  for (let y = 18; y < h; y += 7) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = PALETTE.soy;
  for (let i = 0; i < 40; i += 1) {
    const x = ((i * 97) % w);
    const y = ((i * 53) % h);
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  ctx.restore();
}

export function drawMenuFrame(ctx: Ctx, w: number, h: number): void {
  ctx.save();
  ctx.strokeStyle = PALETTE.chili;
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 16, w - 32, h - 32);
  drawFret(ctx, 18, 18, 22);
  drawFret(ctx, w - 40, 18, 22);
  drawFret(ctx, 18, h - 40, 22);
  drawFret(ctx, w - 40, h - 40, 22);
  drawChopstick(ctx, 46, 28, -0.7);
  drawChopstick(ctx, w - 46, 28, 0.7);
  drawChopstick(ctx, 46, h - 28, 0.7);
  drawChopstick(ctx, w - 46, h - 28, -0.7);
  ctx.restore();
}

export function drawRoundSeal(ctx: Ctx, x: number, y: number, r: number, text: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.08);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.chili;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f3d2c4';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f8e6df';
  ctx.font = font(Math.max(14, r * 0.42), true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);
  ctx.restore();
}

export function drawMenuRule(ctx: Ctx, x: number, y: number, w: number): void {
  ctx.strokeStyle = PALETTE.chili;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.fillStyle = PALETTE.chili;
  ctx.beginPath();
  ctx.arc(x + w / 2, y, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawMenuMeter(ctx: Ctx, x: number, y: number, w: number, label: string, ratio: number): void {
  const clamped = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, 36);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(14, true);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 8, y + 18);
  const barX = x + 52;
  const barW = w - 64;
  ctx.strokeRect(barX, y + 12, barW, 12);
  ctx.fillStyle = clamped > 0.75 ? PALETTE.chili : PALETTE.ink;
  ctx.fillRect(barX + 2, y + 14, Math.max(0, (barW - 4) * clamped), 8);
}

export function drawPressButton(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  primary: boolean,
  disabled: boolean,
): void {
  ctx.save();
  ctx.fillStyle = primary && !disabled ? PALETTE.chili : PALETTE.paper;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = primary && !disabled ? PALETTE.chiliDeep : PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = primary && !disabled ? '#f7f1e4' : disabled ? PALETTE.inkSoft : PALETTE.ink;
  ctx.font = font(h >= 60 ? 22 : 16, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

export function drawWoodWok(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  even: number,
  burn: number,
  tossing: boolean,
): void {
  const cx = x + w * 0.46;
  const cy = y + h * 0.62;
  const rx = w * 0.4;
  const ry = h * 0.22;
  fillOval(ctx, cx + 10, cy + ry * 0.45, rx, ry * 0.28, 'rgba(28,20,15,0.18)');
  fillOval(ctx, cx, cy, rx, ry, '#14171a');
  ctx.save();
  ctx.beginPath();
  ovalPath(ctx, cx, cy - ry * 0.05, rx * 0.86, ry * 0.72);
  ctx.clip();
  ctx.strokeStyle = burn > 0.6 ? '#3a3028' : '#2a3036';
  ctx.lineWidth = 1;
  for (let i = -rx; i < rx; i += 5) {
    ctx.beginPath();
    ctx.moveTo(cx + i, cy - ry);
    ctx.lineTo(cx + i + ry, cy + ry);
    ctx.stroke();
  }
  ctx.restore();
  strokeOval(ctx, cx, cy, rx, ry, '#3e444a', 7);
  strokeOval(ctx, cx, cy - ry * 0.02, rx * 0.9, ry * 0.78, '#8d8376', 1.5);
  ctx.strokeStyle = '#2c3136';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + rx * 0.82, cy - ry * 0.35);
  ctx.lineTo(cx + rx + 78, cy - ry * 1.35);
  ctx.stroke();
  fillOval(ctx, cx + rx + 78, cy - ry * 1.35, 12, 7, '#1c140f');

  const lift = tossing ? -14 : 0;
  const foods = ['pork', 'scallion', 'pepper', 'tomato', 'egg'];
  const n = 3 + Math.round(Math.min(1, Math.max(0, even)) * 2);
  for (let i = 0; i < n; i += 1) {
    const ang = i * 1.2;
    const fx = cx + Math.cos(ang) * rx * 0.36;
    const fy = cy - ry * 0.25 + Math.sin(ang) * ry * 0.22 + lift;
    ctx.save();
    ctx.globalAlpha = burn > 0.8 ? 0.45 : 1;
    drawWoodFood(ctx, foods[i % foods.length], fx, fy, 26 + (i % 2) * 6);
    ctx.restore();
  }
  if (burn > 0.15 || tossing) steam(ctx, cx, cy - ry - 8, burn);
}

export function drawWoodFood(ctx: Ctx, shape: string, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  if (shape === 'egg') egg(ctx, size);
  else if (shape === 'tomato') tomato(ctx, size);
  else if (shape === 'scallion' || shape === 'lettuce') stalks(ctx, size, PALETTE.scallion);
  else if (shape === 'potato' || shape === 'peanut') wedge(ctx, size, '#c4a574');
  else if (shape === 'garlic' || shape === 'rice') cloves(ctx, size);
  else if (shape === 'pepper') chili(ctx, size);
  else if (shape === 'pork' || shape === 'lamb' || shape === 'chicken') chunks(ctx, size, shape === 'chicken' ? '#d7b15a' : '#8d4034');
  else if (shape === 'bamboo') stalks(ctx, size, '#d9c89a');
  else if (shape === 'ear') ear(ctx, size);
  else chunks(ctx, size, PALETTE.chili);
  ctx.restore();
}

export function drawEmptyBowl(ctx: Ctx, x: number, y: number, w: number): void {
  ctx.save();
  ctx.translate(x + w / 2, y + w * 0.35);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ovalStroke(ctx, 0, 0, w * 0.42, w * 0.14);
  ovalStroke(ctx, 0, -w * 0.04, w * 0.3, w * 0.08);
  ctx.restore();
}

export function drawCrossMark(ctx: Ctx, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = PALETTE.chili;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-size, -size);
  ctx.lineTo(size, size);
  ctx.moveTo(size, -size);
  ctx.lineTo(-size, size);
  ctx.stroke();
  ctx.restore();
}

function drawFret(ctx: Ctx, x: number, y: number, s: number): void {
  ctx.strokeStyle = PALETTE.chili;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, s, s);
  ctx.strokeRect(x + 4, y + 4, s - 8, s - 8);
}

function drawChopstick(ctx: Ctx, x: number, y: number, rot: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(-34, -4, 68, 3);
  ctx.fillRect(-30, 2, 60, 2);
  ctx.restore();
}

function steam(ctx: Ctx, x: number, y: number, burn: number): void {
  ctx.save();
  ctx.strokeStyle = burn > 0.5 ? '#6a5c50' : '#b7ab9c';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    ctx.globalAlpha = 0.45 + burn * 0.3;
    ctx.beginPath();
    ctx.moveTo(x - 16 + i * 16, y);
    ctx.quadraticCurveTo(x - 24 + i * 18, y - 28, x - 8 + i * 14, y - 52);
    ctx.stroke();
  }
  ctx.restore();
}

function egg(ctx: Ctx, size: number): void {
  fillOval(ctx, 0, 0, size * 0.28, size * 0.38, '#f4efe4');
  strokeOval(ctx, 0, 0, size * 0.28, size * 0.38, PALETTE.ink, 1.5);
  fillOval(ctx, size * 0.04, 0, size * 0.12, size * 0.12, '#d7b15a');
}

function tomato(ctx: Ctx, size: number): void {
  fillOval(ctx, 0, size * 0.04, size * 0.32, size * 0.32, PALETTE.chili);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.22);
  ctx.lineTo(-size * 0.12, -size * 0.4);
  ctx.moveTo(0, -size * 0.22);
  ctx.lineTo(size * 0.12, -size * 0.4);
  ctx.stroke();
}

function stalks(ctx: Ctx, size: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo((i - 1) * size * 0.16, size * 0.36);
    ctx.lineTo((i - 1) * size * 0.1, -size * 0.38);
    ctx.stroke();
  }
}

function wedge(ctx: Ctx, size: number, color: string): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-size * 0.28, size * 0.2);
  ctx.lineTo(0, -size * 0.32);
  ctx.lineTo(size * 0.3, size * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function cloves(ctx: Ctx, size: number): void {
  for (let i = 0; i < 3; i += 1) {
    fillOval(ctx, (i - 1) * size * 0.16, 0, size * 0.1, size * 0.22, '#f6efe2');
    strokeOval(ctx, (i - 1) * size * 0.16, 0, size * 0.1, size * 0.22, PALETTE.ink, 1);
  }
}

function chili(ctx: Ctx, size: number): void {
  ctx.strokeStyle = PALETTE.chiliDeep;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-size * 0.2, size * 0.28);
  ctx.quadraticCurveTo(size * 0.1, 0, 0, -size * 0.34);
  ctx.stroke();
}

function chunks(ctx: Ctx, size: number, color: string): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    const x = -size * 0.28 + i * size * 0.2;
    const y = (i % 2) * size * 0.08;
    ctx.fillRect(x, y, size * 0.18, size * 0.16);
    ctx.strokeRect(x, y, size * 0.18, size * 0.16);
  }
}

function ear(ctx: Ctx, size: number): void {
  ctx.fillStyle = '#241c18';
  ctx.beginPath();
  ctx.moveTo(-size * 0.24, size * 0.1);
  ctx.quadraticCurveTo(-size * 0.3, -size * 0.28, 0, -size * 0.1);
  ctx.quadraticCurveTo(size * 0.32, -size * 0.3, size * 0.22, size * 0.12);
  ctx.quadraticCurveTo(0, size * 0.28, -size * 0.24, size * 0.1);
  ctx.fill();
}

function fillOval(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, color: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(Math.max(0.01, rx), Math.max(0.01, ry));
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function strokeOval(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, color: string, width: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(Math.max(0.01, rx), Math.max(0.01, ry));
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width / Math.max(rx, ry);
  ctx.stroke();
  ctx.restore();
}

function ovalPath(ctx: Ctx, cx: number, cy: number, rx: number, ry: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(Math.max(0.01, rx), Math.max(0.01, ry));
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.restore();
}

function ovalStroke(ctx: Ctx, cx: number, cy: number, rx: number, ry: number): void {
  strokeOval(ctx, cx, cy, rx, ry, PALETTE.ink, 2);
}
