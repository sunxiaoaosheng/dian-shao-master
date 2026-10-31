"use strict";
/**
 * 方向传感器没有单独的 wx.authorize scope。
 * 小游戏权限表里和运动最接近、调用方点名要试的是 scope.accelerometer。
 * 方向本身还要先过隐私同意。iOS「设置 → 微信」里没有运动开关，对局不要打开那一页。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOTION_SCOPE = void 0;
exports.requestMotionConsent = requestMotionConsent;
exports.openMotionSettings = openMotionSettings;
exports.MOTION_SCOPE = 'scope.accelerometer';
function ask(run) {
    if (!run)
        return Promise.resolve(false);
    return new Promise((resolve) => {
        try {
            run({
                success: () => resolve(true),
                fail: () => resolve(false),
            });
        }
        catch (_a) {
            resolve(false);
        }
    });
}
function privacyNeeded(wx) {
    const read = wx.getPrivacySetting;
    if (!read)
        return Promise.resolve(false);
    return new Promise((resolve) => {
        try {
            read({
                success: (res) => resolve(Boolean(res && res.needAuthorization)),
                fail: () => resolve(false),
            });
        }
        catch (_a) {
            resolve(false);
        }
    });
}
function accelScope(wx) {
    const read = wx.getSetting;
    if (!read)
        return Promise.resolve('unknown');
    return new Promise((resolve) => {
        try {
            read({
                success: (res) => {
                    const value = res && res.authSetting ? res.authSetting[exports.MOTION_SCOPE] : undefined;
                    if (value === true)
                        resolve('granted');
                    else if (value === false)
                        resolve('denied');
                    else
                        resolve('unknown');
                },
                fail: () => resolve('unknown'),
            });
        }
        catch (_a) {
            resolve('unknown');
        }
    });
}
/** 先隐私弹窗，再试 scope.accelerometer。已经拒绝过的 scope 不再调 authorize。 */
async function requestMotionConsent(wx) {
    if (wx.getPrivacySetting && wx.requirePrivacyAuthorize) {
        const needed = await privacyNeeded(wx);
        if (needed) {
            const agreed = await ask(wx.requirePrivacyAuthorize.bind(wx));
            return agreed ? 'granted' : 'settings';
        }
    }
    const scope = await accelScope(wx);
    if (scope === 'granted')
        return 'granted';
    if (scope === 'denied' || !wx.authorize)
        return 'settings';
    const ok = await ask((opts) => { var _a; return (_a = wx.authorize) === null || _a === void 0 ? void 0 : _a.call(wx, { scope: exports.MOTION_SCOPE, success: opts.success, fail: opts.fail }); });
    return ok ? 'granted' : 'settings';
}
/** 系统权限页。对局不调用：iOS 微信设置里没有运动开关。 */
function openMotionSettings(wx) {
    return new Promise((resolve) => {
        const done = () => resolve();
        try {
            if (wx.openAppAuthorizeSetting) {
                wx.openAppAuthorizeSetting({
                    success: done,
                    fail: () => {
                        if (wx.openSetting)
                            wx.openSetting({ success: done, fail: done });
                        else
                            done();
                    },
                });
                return;
            }
            if (wx.openSetting) {
                wx.openSetting({ success: done, fail: done });
                return;
            }
        }
        catch (_a) {
            // 设置页打不开时，界面上的说明还在。
        }
        done();
    });
}
