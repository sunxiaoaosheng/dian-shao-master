import { ASSETS, assetById } from '../content/manifest';
import type { Ctx } from './ctx';

export interface CollageImage {
  src: string;
  width: number;
  height: number;
  onload: null | (() => void);
  onerror: null | (() => void);
}

interface Slot {
  image: CollageImage | null;
  ready: boolean;
}

export interface SpritePlacement {
  id: string;
  /** 锚点。图片的 pivot 对齐到这里。 */
  ax: number;
  ay: number;
  w: number;
  h: number;
  alpha?: number;
  tx?: number;
  ty?: number;
  rot?: number;
  clip?: { x: number; y: number; w: number; h: number } | null;
  fallback?: (ctx: Ctx) => void;
}

interface Queued extends SpritePlacement {
  alpha: number;
  tx: number;
  ty: number;
  rot: number;
}

const slots = new Map<string, Slot>();
const queue: Queued[] = [];
let started = false;

/** 按清单 path 加载。图还没到时绘制会退回矢量剪贴，不挡开局。 */
export function loadCollage(createImage: () => CollageImage | null): void {
  if (started) return;
  started = true;
  for (let i = 0; i < ASSETS.length; i += 1) {
    const item = ASSETS[i];
    const slot: Slot = { image: null, ready: false };
    slots.set(item.id, slot);
    const image = createImage();
    if (!image) continue;
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

export function spriteReady(id: string): boolean {
  const slot = slots.get(id);
  return Boolean(slot && slot.ready && slot.image);
}

/** 锚点减去 pivot × 尺寸，得到 drawImage 的左上角。 */
export function spriteOrigin(id: string, anchorX: number, anchorY: number, w: number, h: number): { x: number; y: number } {
  const item = assetById(id);
  return {
    x: anchorX - item.pivot[0] * w,
    y: anchorY - item.pivot[1] * h,
  };
}

export function drawSprite(ctx: Ctx, id: string, anchorX: number, anchorY: number, w: number, h: number): boolean {
  const slot = slots.get(id);
  if (!slot || !slot.ready || !slot.image || !ctx.drawImage) return false;
  const origin = spriteOrigin(id, anchorX, anchorY, w, h);
  ctx.drawImage(slot.image, origin.x, origin.y, w, h);
  return true;
}

export function beginSprites(): void {
  queue.length = 0;
}

/** 盒子左上角进，锚点按清单 pivot 算。 */
export function queueBox(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  extra?: Omit<SpritePlacement, 'id' | 'ax' | 'ay' | 'w' | 'h'>,
): void {
  const item = assetById(id);
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

export function queueSprite(placement: SpritePlacement): void {
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
export function flushSprites(ctx: Ctx): string[] {
  const batch = queue.splice(0);
  batch.sort((a, b) => assetById(a.id).z - assetById(b.id).z);
  const drawn: string[] = [];
  for (let i = 0; i < batch.length; i += 1) {
    const cmd = batch[i];
    drawn.push(cmd.id);
    ctx.save();
    if (cmd.tx || cmd.ty) ctx.translate(cmd.tx, cmd.ty);
    if (cmd.rot) ctx.rotate(cmd.rot);
    ctx.globalAlpha = cmd.alpha;
    if (cmd.clip) {
      ctx.beginPath();
      ctx.rect(cmd.clip.x, cmd.clip.y, cmd.clip.w, cmd.clip.h);
      ctx.clip();
    }
    const ok = drawSprite(ctx, cmd.id, cmd.ax, cmd.ay, cmd.w, cmd.h);
    if (!ok && cmd.fallback) cmd.fallback(ctx);
    ctx.restore();
  }
  return drawn;
}

/** 测试里换一套假图时用。正式运行不要调用。 */
export function resetCollageForTests(): void {
  slots.clear();
  queue.length = 0;
  started = false;
}
