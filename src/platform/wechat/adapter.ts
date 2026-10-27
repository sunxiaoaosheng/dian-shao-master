import type { Ctx } from '../../ui/ctx';
import { createMotionBridge } from './motion';
import { readStorage, writeStorage } from './storage';
import type { Platform } from '../types';
import type { WechatMiniGame, WxCanvas } from './wxTypes';

export function createWechatPlatform(): Platform {
  const wx = getWx();
  const sys = wx.getSystemInfoSync();
  const width = sys.windowWidth || 375;
  const height = sys.windowHeight || 667;
  const dpr = Math.min(3, sys.pixelRatio || 2);
  const canvas = wx.createCanvas();
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.textBaseline = 'top';

  const safeTop = sys.safeArea && typeof sys.safeArea.top === 'number' ? sys.safeArea.top : 0;
  const safeBottom = sys.safeArea && typeof sys.safeArea.bottom === 'number'
    ? Math.max(0, height - sys.safeArea.bottom)
    : 0;

  const bridge = createMotionBridge(wx);
  let pointer: (p: { x: number; y: number }) => void = () => undefined;
  wx.onTouchEnd((event) => {
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    const x = typeof touch.clientX === 'number' ? touch.clientX : touch.x || 0;
    const y = typeof touch.clientY === 'number' ? touch.clientY : touch.y || 0;
    pointer({ x, y });
  });

  let onShow: () => void = () => undefined;
  let onHide: () => void = () => undefined;
  if (wx.onShow) wx.onShow(() => onShow());
  if (wx.onHide) wx.onHide(() => onHide());

  return {
    kind: 'wechat',
    isDevtools: sys.platform === 'devtools',
    ctx,
    width,
    height,
    safeTop,
    safeBottom,
    now: () => Date.now(),
    onPointer: (cb) => {
      pointer = cb;
    },
    storageGet: (key) => readStorage(wx, key),
    storageSet: (key, value) => writeStorage(wx, key, value),
    startMotion: () => bridge.startMotion(),
    startAccel: () => bridge.startAccel(),
    setMotionHandler: (cb) => {
      bridge.sink.motion = cb;
    },
    setAccelHandler: (cb) => {
      bridge.sink.accel = cb;
    },
    stopSensors: () => bridge.stop(),
    share: (payload) => shareMessage(wx, sys.platform === 'devtools', payload),
    vibrate: () => {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'medium' });
    },
    createOffscreen: (w, h) => makeOffscreen(wx, w, h),
    saveImage: (path) => saveToAlbum(wx, path),
    onShow: (cb) => {
      onShow = cb;
    },
    onHide: (cb) => {
      onHide = cb;
    },
    launchQuery: () => {
      try {
        const query = wx.getLaunchOptionsSync ? wx.getLaunchOptionsSync().query : undefined;
        return query || {};
      } catch {
        return {};
      }
    },
    setMenuShare: (payload) => {
      try {
        if (wx.showShareMenu) wx.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage'] });
        if (wx.onShareAppMessage) {
          wx.onShareAppMessage(() => ({
            title: payload.title,
            query: payload.query || 'from=menu',
          }));
        }
      } catch (err) {
        console.warn('[颠勺] 菜单分享没挂上', err);
      }
    },
  };
}

function getWx(): WechatMiniGame {
  const host = globalThis as unknown as { wx?: WechatMiniGame };
  if (!host.wx) throw new Error('找不到 wx，请用微信开发者工具打开本项目');
  return host.wx;
}

function makeOffscreen(wx: WechatMiniGame, w: number, h: number): { ctx: Ctx; capture: () => Promise<string | null> } | null {
  try {
    const canvas = wx.createCanvas();
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    return {
      ctx,
      capture: () => captureCanvas(canvas, w, h),
    };
  } catch (err) {
    console.warn('[颠勺] 离屏画布失败', err);
    return null;
  }
}

function captureCanvas(canvas: WxCanvas, w: number, h: number): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (path: string | null) => {
      if (settled) return;
      settled = true;
      resolve(path);
    };
    if (!canvas.toTempFilePath) {
      finish(null);
      return;
    }
    canvas.toTempFilePath({
      destWidth: w,
      destHeight: h,
      fileType: 'png',
      success: (res) => finish(res.tempFilePath || null),
      fail: () => finish(null),
    });
    setTimeout(() => finish(null), 1500);
  });
}

function saveToAlbum(wx: WechatMiniGame, path: string): Promise<'ok' | 'fail'> {
  return new Promise((resolve) => {
    if (!wx.saveImageToPhotosAlbum) {
      resolve('fail');
      return;
    }
    wx.saveImageToPhotosAlbum({
      filePath: path,
      success: () => resolve('ok'),
      fail: () => resolve('fail'),
    });
  });
}

/**
 * 微信基础库经常不回调分享成功或失败。
 * 开发者工具里点了自愿按钮就算发起，方便验收加锅。
 * 真机若 800ms 内收到 fail（多半是取消）则不加锅；两边都不回调就视为面板已拉起。
 * 开局不会走到这里。
 */
function shareMessage(
  wx: WechatMiniGame,
  devtools: boolean,
  payload: { title: string; imageUrl?: string; query?: string },
): Promise<'ok' | 'fail'> {
  return new Promise((resolve) => {
    if (!wx.shareAppMessage) {
      resolve('fail');
      return;
    }
    let settled = false;
    const done = (status: 'ok' | 'fail') => {
      if (settled) return;
      settled = true;
      resolve(status);
    };
    if (devtools) {
      try {
        wx.shareAppMessage({
          title: payload.title,
          imageUrl: payload.imageUrl,
          query: payload.query,
        });
      } catch {
        done('fail');
        return;
      }
      done('ok');
      return;
    }
    const timer = setTimeout(() => done('ok'), 800);
    try {
      wx.shareAppMessage({
        title: payload.title,
        imageUrl: payload.imageUrl,
        query: payload.query,
        success: () => {
          clearTimeout(timer);
          done('ok');
        },
        fail: () => {
          clearTimeout(timer);
          done('fail');
        },
      });
    } catch {
      clearTimeout(timer);
      done('fail');
    }
  });
}
