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
  getAccountInfoSync?(): { miniProgram?: { appId?: string } };
  createCanvas(): WxCanvas;
  createImage?(): WxImage;
  onTouchEnd(cb: (e: { changedTouches?: WxTouch[] }) => void): void;
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, value: string): void;
  startDeviceMotionListening?(opts: WxListenOpts): void;
  authorize?(opts: { scope: string; success?: () => void; fail?: (err?: { errMsg?: string }) => void }): void;
  getSetting?(opts: {
    success?: (res: { authSetting?: Record<string, boolean> }) => void;
    fail?: () => void;
  }): void;
  getPrivacySetting?(opts: {
    success?: (res: { needAuthorization?: boolean }) => void;
    fail?: () => void;
  }): void;
  requirePrivacyAuthorize?(opts: { success?: () => void; fail?: () => void }): void;
  openSetting?(opts: { success?: () => void; fail?: () => void }): void;
  openAppAuthorizeSetting?(opts: { success?: () => void; fail?: () => void }): void;
  stopDeviceMotionListening?(opts?: { success?: () => void; fail?: () => void }): void;
  onDeviceMotionChange?(cb: (res: { alpha?: unknown; beta?: unknown; gamma?: unknown; x?: unknown; y?: unknown; z?: unknown }) => void): void;
  offDeviceMotionChange?(cb: (res: { alpha?: unknown; beta?: unknown; gamma?: unknown; x?: unknown; y?: unknown; z?: unknown }) => void): void;
  startAccelerometer?(opts: WxListenOpts): void;
  stopAccelerometer?(opts?: { success?: () => void; fail?: () => void }): void;
  onAccelerometerChange?(cb: (res: { x?: unknown; y?: unknown; z?: unknown }) => void): void;
  offAccelerometerChange?(cb: (res: { x?: unknown; y?: unknown; z?: unknown }) => void): void;
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
  createRewardedVideoAd?(opts: { adUnitId: string }): WxRewardedVideoAd;
  cloud?: {
    callFunction(opts: { name: string; data?: Record<string, unknown> }): Promise<{ result?: unknown }>;
  };
}

/** 对齐 wx.createRewardedVideoAd 返回值。 */
export interface WxRewardedVideoAd {
  load(): Promise<void>;
  show(): Promise<void>;
  onLoad(cb: () => void): void;
  onError(cb: (err: { errMsg?: string; errCode?: number }) => void): void;
  onClose(cb: (res?: { isEnded?: boolean }) => void): void;
}

export interface WxListenOpts {
  interval?: 'game' | 'ui' | 'normal';
  success?: () => void;
  fail?: (err: { errMsg?: string }) => void;
}
