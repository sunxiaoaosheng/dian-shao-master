import type { Ctx } from '../ui/ctx';
import type { CollageImage } from '../ui/sprites';

export interface Offscreen {
  ctx: Ctx;
  capture(): Promise<string | null>;
}

export interface Platform {
  readonly kind: 'wechat';
  readonly isDevtools: boolean;
  readonly ctx: Ctx;
  readonly width: number;
  readonly height: number;
  readonly safeTop: number;
  readonly safeBottom: number;
  now(): number;
  onPointer(cb: (p: { x: number; y: number }) => void): void;
  storageGet(key: string): string | null;
  storageSet(key: string, value: string): void;
  startMotion(): Promise<'ok' | 'denied' | 'unsupported'>;
  startAccel(): Promise<'ok' | 'denied' | 'unsupported'>;
  setMotionHandler(cb: (res: { alpha: number; beta: number; gamma: number }) => void): void;
  setAccelHandler(cb: (res: { x: number; y: number; z: number }) => void): void;
  stopSensors(): void;
  share(payload: { title: string; imageUrl?: string; query?: string }): Promise<'ok' | 'fail'>;
  vibrate(): void;
  createOffscreen(w: number, h: number): Offscreen | null;
  /** 用来加载 assets/ 下的剪贴 PNG。没有这个接口时游戏继续用矢量。 */
  createImage(): CollageImage | null;
  saveImage(path: string): Promise<'ok' | 'fail'>;
  onShow(cb: () => void): void;
  onHide(cb: () => void): void;
  launchQuery(): Record<string, string>;
  /** 右上角菜单分享。不发加锅，避免玩家只是点开菜单就被算成自愿分享。 */
  setMenuShare(payload: { title: string; query?: string }): void;
}
