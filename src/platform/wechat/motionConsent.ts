/**
 * 方向传感器没有单独的 wx.authorize scope。
 * 小游戏权限表里和运动最接近、调用方点名要试的是 scope.accelerometer。
 * 方向本身还要先过隐私同意。iOS「设置 → 微信」里没有运动开关，对局不要打开那一页。
 */

export const MOTION_SCOPE = 'scope.accelerometer';

export interface MotionConsentApi {
  getPrivacySetting?(opts: {
    success?: (res: { needAuthorization?: boolean }) => void;
    fail?: () => void;
  }): void;
  requirePrivacyAuthorize?(opts: { success?: () => void; fail?: () => void }): void;
  getSetting?(opts: {
    success?: (res: { authSetting?: Record<string, boolean> }) => void;
    fail?: () => void;
  }): void;
  authorize?(opts: { scope: string; success?: () => void; fail?: () => void }): void;
  openSetting?(opts: { success?: () => void; fail?: () => void }): void;
  openAppAuthorizeSetting?(opts: { success?: () => void; fail?: () => void }): void;
}

export type MotionConsent = 'granted' | 'settings';

function ask(run: ((opts: { success?: () => void; fail?: () => void }) => void) | undefined): Promise<boolean> {
  if (!run) return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      run({
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    } catch {
      resolve(false);
    }
  });
}

function privacyNeeded(wx: MotionConsentApi): Promise<boolean> {
  const read = wx.getPrivacySetting;
  if (!read) return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      read({
        success: (res) => resolve(Boolean(res && res.needAuthorization)),
        fail: () => resolve(false),
      });
    } catch {
      resolve(false);
    }
  });
}

function accelScope(wx: MotionConsentApi): Promise<'granted' | 'denied' | 'unknown'> {
  const read = wx.getSetting;
  if (!read) return Promise.resolve('unknown');
  return new Promise((resolve) => {
    try {
      read({
        success: (res) => {
          const value = res && res.authSetting ? res.authSetting[MOTION_SCOPE] : undefined;
          if (value === true) resolve('granted');
          else if (value === false) resolve('denied');
          else resolve('unknown');
        },
        fail: () => resolve('unknown'),
      });
    } catch {
      resolve('unknown');
    }
  });
}

/** 先隐私弹窗，再试 scope.accelerometer。已经拒绝过的 scope 不再调 authorize。 */
export async function requestMotionConsent(wx: MotionConsentApi): Promise<MotionConsent> {
  if (wx.getPrivacySetting && wx.requirePrivacyAuthorize) {
    const needed = await privacyNeeded(wx);
    if (needed) {
      const agreed = await ask(wx.requirePrivacyAuthorize.bind(wx));
      return agreed ? 'granted' : 'settings';
    }
  }
  const scope = await accelScope(wx);
  if (scope === 'granted') return 'granted';
  if (scope === 'denied' || !wx.authorize) return 'settings';
  const ok = await ask((opts) => wx.authorize?.({ scope: MOTION_SCOPE, success: opts.success, fail: opts.fail }));
  return ok ? 'granted' : 'settings';
}

/** 系统权限页。对局不调用：iOS 微信设置里没有运动开关。 */
export function openMotionSettings(wx: MotionConsentApi): Promise<void> {
  return new Promise((resolve) => {
    const done = () => resolve();
    try {
      if (wx.openAppAuthorizeSetting) {
        wx.openAppAuthorizeSetting({
          success: done,
          fail: () => {
            if (wx.openSetting) wx.openSetting({ success: done, fail: done });
            else done();
          },
        });
        return;
      }
      if (wx.openSetting) {
        wx.openSetting({ success: done, fail: done });
        return;
      }
    } catch {
      // 设置页打不开时，界面上的说明还在。
    }
    done();
  });
}
