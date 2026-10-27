import type { Ctx } from '../../ui/ctx';

export interface WxTouch {
  clientX?: number;
  clientY?: number;
  x?: number;
  y?: number;
}

export interface WxCanvas {
  width: number;
  height: number;
  getContext(kind: '2d'): Ctx;
  toTempFilePath?(opts: {
    destWidth?: number;
    destHeight?: number;
    fileType?: string;
    success?: (res: { tempFilePath?: string }) => void;
    fail?: (err: { errMsg?: string }) => void;
  }): void;
}

export interface WxImage {
  src: string;
  width: number;
  height: number;
  onload: null | (() => void);
  onerror: null | (() => void);
}

export interface WxSystemInfo {
  windowWidth: number;
  windowHeight: number;
  pixelRatio?: number;
  platform?: string;
  safeArea?: { top: number; bottom: number; left: number; right: number };
}

export interface WechatMiniGame {
  getSystemInfoSync(): WxSystemInfo;
  createCanvas(): WxCanvas;
  createImage?(): WxImage;
  onTouchEnd(cb: (e: { changedTouches?: WxTouch[] }) => void): void;
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, value: string): void;
  startDeviceMotionListening?(opts: WxListenOpts): void;
  stopDeviceMotionListening?(opts?: { success?: () => void; fail?: () => void }): void;
  onDeviceMotionChange?(cb: (res: { alpha?: number; beta?: number; gamma?: number }) => void): void;
  offDeviceMotionChange?(cb: (res: { alpha?: number; beta?: number; gamma?: number }) => void): void;
  startAccelerometer?(opts: WxListenOpts): void;
  stopAccelerometer?(opts?: { success?: () => void; fail?: () => void }): void;
  onAccelerometerChange?(cb: (res: { x?: number; y?: number; z?: number }) => void): void;
  offAccelerometerChange?(cb: (res: { x?: number; y?: number; z?: number }) => void): void;
  shareAppMessage?(opts: {
    title?: string;
    imageUrl?: string;
    query?: string;
    success?: () => void;
    fail?: () => void;
  }): void;
  showShareMenu?(opts: { withShareTicket?: boolean; menus?: string[] }): void;
  onShareAppMessage?(cb: () => { title: string; query?: string; imageUrl?: string }): void;
  vibrateShort?(opts?: { type?: string }): void;
  onShow?(cb: () => void): void;
  onHide?(cb: () => void): void;
  getLaunchOptionsSync?(): { query?: Record<string, string> };
  saveImageToPhotosAlbum?(opts: {
    filePath: string;
    success?: () => void;
    fail?: () => void;
  }): void;
}

export interface WxListenOpts {
  interval?: 'game' | 'ui' | 'normal';
  success?: () => void;
  fail?: (err: { errMsg?: string }) => void;
}
