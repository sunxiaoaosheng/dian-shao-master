import type { Ctx } from './ctx';
import { fillTorn } from './draw';
import { PALETTE, font } from './theme';

/** 一种原料一块剪纸，形状跟着 id 走，不靠同一套方块。 */
export function drawFood(ctx: Ctx, shape: string, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  if (shape === 'egg') egg(ctx, size);
  else if (shape === 'tomato') tomato(ctx, size);
  else if (shape === 'scallion') stalk(ctx, size, PALETTE.scallion);
  else if (shape === 'lettuce') leaf(ctx, size, '#2f6b3a');
  else if (shape === 'garlic') garlic(ctx, size);
  else if (shape === 'potato') wedge(ctx, size, '#c4a574');
  else if (shape === 'rice') grains(ctx, size);
  else if (shape === 'pepper') chili(ctx, size);
  else if (shape === 'pork') strips(ctx, size, '#e7b2a4');
  else if (shape === 'bamboo') stalk(ctx, size, '#e6d7a8');
  else if (shape === 'ear') ear(ctx, size);
  else if (shape === 'chicken') cubes(ctx, size, PALETTE.yolk);
  else if (shape === 'peanut') peanuts(ctx, size);
  else if (shape === 'lamb') cubes(ctx, size, '#a33b32');
  else blob(ctx, size, PALETTE.chili);
  ctx.restore();
}

export function drawWokStage(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  even: number,
  burn: number,
  tossing: boolean,
): void {
  const cx = x + w / 2;
  const cy = y + h * 0.62;
  const rx = w * 0.46;
  const ry = h * 0.28;
  fillOval(ctx, cx + 8, cy + ry * 0.35, rx * 0.92, ry * 0.38, 'rgba(43,33,24,0.18)');
  fillOval(ctx, cx, cy, rx, ry, '#1c2126');
  strokeOval(ctx, cx, cy, rx, ry, '#4a5158', 8);
  fillOval(ctx, cx, cy - ry * 0.08, rx * 0.78, ry * 0.62, burn > 0.72 ? '#2a211c' : '#2e353c');
  fillOval(ctx, cx - rx * 0.22, cy - ry * 0.55, rx * 0.28, ry * 0.16, 'rgba(247,241,230,0.28)');

  ctx.strokeStyle = PALETTE.ironLite;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - rx + 6, cy);
  ctx.lineTo(cx - rx - 28, cy - 10);
  ctx.moveTo(cx + rx - 6, cy);
  ctx.lineTo(cx + rx + 36, cy - 18);
  ctx.stroke();

  const lift = tossing ? -16 : 0;
  const foods = ['egg', 'tomato', 'scallion', 'pork', 'rice', 'pepper'];
  const count = 3 + Math.round(Math.min(1, Math.max(0, even)) * (foods.length - 3));
  for (let i = 0; i < count; i += 1) {
    const ang = i * 1.05 + (tossing ? 0.4 : 0);
    const fx = cx + Math.cos(ang) * rx * 0.38;
    const fy = cy - ry * 0.2 + Math.sin(ang) * ry * 0.28 + lift;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(tossing ? -0.3 : i * 0.2);
    ctx.globalAlpha = burn > 0.85 ? 0.55 : 1;
    drawFood(ctx, foods[i], 0, 0, 28 + (i % 3) * 4);
    if (burn > 0.35) {
      ctx.globalAlpha = burn * 0.45;
      blob(ctx, 22, PALETTE.burnt);
    }
    ctx.restore();
  }
  if (burn > 0.2 || tossing) smoke(ctx, cx, cy - ry - 10, burn, tossing);
}

export function drawEmptyPlate(ctx: Ctx, x: number, y: number, w: number): void {
  fillOval(ctx, x + w / 2, y + w * 0.42, w * 0.46, w * 0.18, '#d9c3a2');
  fillOval(ctx, x + w / 2, y + w * 0.38, w * 0.34, w * 0.12, PALETTE.photo);
  strokeOval(ctx, x + w / 2, y + w * 0.38, w * 0.34, w * 0.12, PALETTE.inkSoft, 2);
}

export function drawCross(ctx: Ctx, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.2);
  ctx.strokeStyle = PALETTE.chiliDeep;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-size, -size);
  ctx.lineTo(size, size);
  ctx.moveTo(size, -size);
  ctx.lineTo(-size, size);
  ctx.stroke();
  ctx.restore();
}

export function drawNote(ctx: Ctx, x: number, y: number, w: number, h: number, text: string, seed: number): void {
  ctx.save();
  ctx.translate(x, y);
  fillTorn(ctx, w, h, seed, '#f7f1e4', 0.04);
  ctx.fillStyle = PALETTE.chiliDeep;
  ctx.font = font(Math.min(16, h * 0.38), true);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(trim(ctx, text, w - 20), 12, h / 2);
  ctx.restore();
}

function trim(ctx: Ctx, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW) out = out.slice(0, -1);
  return `${out}…`;
}

function egg(ctx: Ctx, size: number): void {
  fillOval(ctx, 0, 0, size * 0.42, size * 0.56, '#f4efe4');
  strokeOval(ctx, 0, 0, size * 0.42, size * 0.56, PALETTE.ink, 2);
  ctx.beginPath();
  ctx.arc(size * 0.05, size * 0.02, size * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.yolk;
  ctx.fill();
}

function tomato(ctx: Ctx, size: number): void {
  ctx.beginPath();
  ctx.arc(0, size * 0.06, size * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.chili;
  ctx.fill();
  ctx.strokeStyle = PALETTE.chiliDeep;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.scallion;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.28);
  ctx.lineTo(-size * 0.16, -size * 0.48);
  ctx.lineTo(size * 0.14, -size * 0.46);
  ctx.fill();
}

function stalk(ctx: Ctx, size: number, color: string): void {
  for (let i = 0; i < 3; i += 1) {
    fillOval(ctx, (i - 1) * size * 0.16, 0, size * 0.08, size * 0.46, color);
  }
}

function leaf(ctx: Ctx, size: number, color: string): void {
  fillOval(ctx, 0, 0, size * 0.22, size * 0.5, color);
  fillOval(ctx, size * 0.12, size * 0.05, size * 0.18, size * 0.42, color);
}

function garlic(ctx: Ctx, size: number): void {
  for (let i = 0; i < 3; i += 1) {
    const gx = (i - 1) * size * 0.22;
    fillOval(ctx, gx, 0, size * 0.16, size * 0.32, '#f6efe2');
    strokeOval(ctx, gx, 0, size * 0.16, size * 0.32, PALETTE.inkSoft, 1.5);
  }
}

function wedge(ctx: Ctx, size: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size * 0.4, size * 0.2);
  ctx.lineTo(0, -size * 0.4);
  ctx.lineTo(size * 0.42, size * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a6a3e';
  ctx.stroke();
}

function grains(ctx: Ctx, size: number): void {
  for (let i = 0; i < 5; i += 1) {
    fillOval(ctx, ((i % 3) - 1) * size * 0.22, (i > 2 ? 1 : -1) * size * 0.12, size * 0.1, size * 0.16, '#f3e6c8');
  }
}

function chili(ctx: Ctx, size: number): void {
  ctx.strokeStyle = PALETTE.chiliDeep;
  ctx.lineWidth = size * 0.16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-size * 0.3, size * 0.3);
  ctx.quadraticCurveTo(size * 0.1, 0, size * 0.05, -size * 0.4);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.scallion;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size * 0.05, -size * 0.4);
  ctx.lineTo(size * 0.2, -size * 0.52);
  ctx.stroke();
}

function strips(ctx: Ctx, size: number, color: string): void {
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i += 1) {
    ctx.save();
    ctx.rotate(-0.4 + i * 0.25);
    ctx.fillRect(-size * 0.08, -size * 0.4, size * 0.16, size * 0.8);
    ctx.restore();
  }
}

function ear(ctx: Ctx, size: number): void {
  ctx.fillStyle = '#2a2e32';
  ctx.beginPath();
  ctx.moveTo(-size * 0.3, size * 0.2);
  ctx.quadraticCurveTo(-size * 0.4, -size * 0.3, 0, -size * 0.2);
  ctx.quadraticCurveTo(size * 0.4, -size * 0.35, size * 0.3, size * 0.15);
  ctx.quadraticCurveTo(0, size * 0.4, -size * 0.3, size * 0.2);
  ctx.fill();
}

function cubes(ctx: Ctx, size: number, color: string): void {
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(-size * 0.35 + i * size * 0.24, -size * 0.15 + (i % 2) * size * 0.12, size * 0.22, size * 0.22);
  }
}

function peanuts(ctx: Ctx, size: number): void {
  for (let i = 0; i < 3; i += 1) {
    fillOval(ctx, (i - 1) * size * 0.24, 0, size * 0.12, size * 0.2, '#c4a574');
  }
}

function blob(ctx: Ctx, size: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
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
  ctx.lineWidth = width / Math.max(rx, ry);
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function smoke(ctx: Ctx, x: number, y: number, burn: number, tossing: boolean): void {
  ctx.save();
  ctx.strokeStyle = burn > 0.45 ? '#6d6258' : PALETTE.steam;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const n = tossing ? 4 : 3;
  for (let i = 0; i < n; i += 1) {
    ctx.globalAlpha = 0.35 + burn * 0.4;
    ctx.beginPath();
    ctx.moveTo(x - 20 + i * 14, y);
    ctx.quadraticCurveTo(x - 30 + i * 16, y - 24, x - 10 + i * 12, y - 48 - i * 6);
    ctx.stroke();
  }
  ctx.restore();
}
