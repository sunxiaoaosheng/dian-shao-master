import { TYPE, type CollageFrame } from './collage';

/** 手写吐槽。顺序对应 assets/type/type-toast-01.png … 08.png。 */
export interface ToastLine {
  text: string;
  image: CollageFrame;
}

export const TOAST_LINES: readonly ToastLine[] = [
  { text: '火候？我跟火候不熟。', image: TYPE.toast01 },
  { text: '颠勺不是甩锅，别误会。', image: TYPE.toast02 },
  { text: '油花比我命还欢。', image: TYPE.toast03 },
  { text: '这菜：差点完美，完美差点。', image: TYPE.toast04 },
  { text: '锅在飞，心在颤。', image: TYPE.toast05 },
  { text: '盐放多了就叫「个性」。', image: TYPE.toast06 },
  { text: '糊了也是烟火气。', image: TYPE.toast07 },
  { text: '再颠一下，信我。', image: TYPE.toast08 },
];

export function pickToast(seed: number): ToastLine {
  const i = Math.abs(Math.floor(seed)) % TOAST_LINES.length;
  return TOAST_LINES[i];
}

export function toastImageFor(text: string): CollageFrame | null {
  for (let i = 0; i < TOAST_LINES.length; i += 1) {
    if (TOAST_LINES[i].text === text) return TOAST_LINES[i].image;
  }
  return null;
}
