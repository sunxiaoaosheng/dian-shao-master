"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWechatPlatform = createWechatPlatform;
const motionConsent_1 = require("./motionConsent");
const motion_1 = require("./motion");
const storage_1 = require("./storage");
function createWechatPlatform() {
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
    const bridge = (0, motion_1.createMotionBridge)(wx);
    let pointer = () => undefined;
    wx.onTouchEnd((event) => {
        const touch = event.changedTouches && event.changedTouches[0];
        if (!touch)
            return;
        const x = typeof touch.clientX === 'number' ? touch.clientX : touch.x || 0;
        const y = typeof touch.clientY === 'number' ? touch.clientY : touch.y || 0;
        pointer({ x, y });
    });
    let onShow = () => undefined;
    let onHide = () => undefined;
    if (wx.onShow)
        wx.onShow(() => onShow());
    if (wx.onHide)
        wx.onHide(() => onHide());
    return {
        kind: 'wechat',
        isDevtools: sys.platform === 'devtools',
        ctx,
        width,
        height,
        safeTop,
        safeBottom,
        now: () => Date.now(),
        appId: () => readAppId(wx),
        onPointer: (cb) => {
            pointer = cb;
        },
        storageGet: (key) => (0, storage_1.readStorage)(wx, key),
        storageSet: (key, value) => (0, storage_1.writeStorage)(wx, key, value),
        startMotion: () => bridge.startMotion(),
        startAccel: () => bridge.startAccel(),
        requestMotionConsent: () => (0, motionConsent_1.requestMotionConsent)(wx),
        openMotionSettings: () => (0, motionConsent_1.openMotionSettings)(wx),
        setMotionHandler: (cb) => {
            bridge.sink.motion = cb;
        },
        setAccelHandler: (cb) => {
            bridge.sink.accel = cb;
        },
        stopSensors: () => bridge.stop(),
        share: (payload) => shareMessage(wx, sys.platform === 'devtools', payload),
        vibrate: () => {
            if (wx.vibrateShort)
                wx.vibrateShort({ type: 'medium' });
        },
        createOffscreen: (w, h) => makeOffscreen(wx, w, h),
        createImage: () => (wx.createImage ? wx.createImage() : null),
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
            }
            catch (_a) {
                return {};
            }
        },
        createRewardedVideoAd: (adUnitId) => {
            if (!wx.createRewardedVideoAd || !adUnitId)
                return null;
            return wx.createRewardedVideoAd({ adUnitId });
        },
        callCloud: (name, data) => {
            const cloud = wx.cloud;
            if (!cloud || !cloud.callFunction)
                return Promise.reject(new Error('cloud'));
            return cloud.callFunction({ name, data }).then((res) => (res ? res.result : null));
        },
        setMenuShare: (payload) => {
            try {
                if (wx.showShareMenu)
                    wx.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage'] });
                if (wx.onShareAppMessage) {
                    wx.onShareAppMessage(() => ({
                        title: payload.title,
                        query: payload.query || 'from=menu',
                    }));
                }
            }
            catch (err) {
                console.warn('[颠勺] 菜单分享没挂上', err);
            }
        },
    };
}
function readAppId(wx) {
    try {
        const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : undefined;
        const id = info && info.miniProgram ? info.miniProgram.appId : '';
        return typeof id === 'string' ? id : '';
    }
    catch (_a) {
        return '';
    }
}
function getWx() {
    const host = globalThis;
    if (!host.wx)
        throw new Error('找不到 wx，请用微信开发者工具打开本项目');
    return host.wx;
}
function makeOffscreen(wx, w, h) {
    try {
        const canvas = wx.createCanvas();
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        return {
            ctx,
            capture: () => captureCanvas(canvas, w, h),
        };
    }
    catch (err) {
        console.warn('[颠勺] 离屏画布失败', err);
        return null;
    }
}
function captureCanvas(canvas, w, h) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (path) => {
            if (settled)
                return;
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
function saveToAlbum(wx, path) {
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
function shareMessage(wx, devtools, payload) {
    return new Promise((resolve) => {
        if (!wx.shareAppMessage) {
            resolve('fail');
            return;
        }
        let settled = false;
        const done = (status) => {
            if (settled)
                return;
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
            }
            catch (_a) {
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
        }
        catch (_b) {
            clearTimeout(timer);
            done('fail');
        }
    });
}
