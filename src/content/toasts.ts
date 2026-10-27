import { assetsByPrefix, type AssetItem } from './manifest';

/** 手写吐槽。文案和图片都来自 assets/manifest.json 的 type.toast.*。 */
export interface ToastLine {
  text: string;
  image: AssetItem;
}

export const TOAST_LINES: readonly ToastLine[] = assetsByPrefix('type.toast.').map((image) => ({
  text: image.text,
  image,
}));

export function pickToast(seed: number): ToastLine {
  const i = Math.abs(Math.floor(seed)) % TOAST_LINES.length;
  return TOAST_LINES[i];
}

export function toastImageFor(text: string): AssetItem | null {
  for (let i = 0; i < TOAST_LINES.length; i += 1) {
    if (TOAST_LINES[i].text === text) return TOAST_LINES[i].image;
  }
  return null;
}
