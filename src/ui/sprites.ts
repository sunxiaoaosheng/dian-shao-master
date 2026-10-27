import { ALL_FRAMES, type CollageFrame } from '../content/collage';
import type { Ctx } from './ctx';

export interface CollageImage {
  src: string;
  width: number;
  height: number;
  onload: null | (() => void);
  onerror: null | (() => void);
}

interface Slot {
  frame: CollageFrame;
  image: CollageImage | null;
  ready: boolean;
}

const slots = new Map<string, Slot>();
let started = false;

/** 按规格路径加载。图还没到时绘制会退回矢量剪贴，不挡开局。 */
export function loadCollage(createImage: () => CollageImage | null): void {
  if (started) return;
  started = true;
  for (let i = 0; i < ALL_FRAMES.length; i += 1) {
    const frame = ALL_FRAMES[i];
    const slot: Slot = { frame, image: null, ready: false };
    slots.set(frame.path, slot);
    const image = createImage();
    if (!image) continue;
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

export function spriteReady(frame: CollageFrame): boolean {
  const slot = slots.get(frame.path);
  return Boolean(slot && slot.ready && slot.image);
}

export function drawSprite(ctx: Ctx, frame: CollageFrame, x: number, y: number, w: number, h: number): boolean {
  const slot = slots.get(frame.path);
  if (!slot || !slot.ready || !slot.image || !ctx.drawImage) return false;
  ctx.drawImage(slot.image, x, y, w, h);
  return true;
}

/** 测试里换一套假图时用。正式运行不要调用。 */
export function resetCollageForTests(): void {
  slots.clear();
  started = false;
}
