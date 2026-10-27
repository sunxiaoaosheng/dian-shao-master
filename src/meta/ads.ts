/**
 * 激励视频。形状对齐 wx.createRewardedVideoAd。
 * ADS_ENABLED 关掉时不创建广告对象，也不调用任何回调，更不会发奖。
 * TODO(owner)：流量主开通后把广告位 ID 填上，并把 ADS_ENABLED 改成 true。
 */

export const ADS_ENABLED = false;
export const REWARDED_AD_UNIT_ID = '';

export type AdResult = 'reward' | 'skip' | 'unavailable';

/** 与微信 RewardedVideoAd 对齐的那几个方法。 */
export interface WxRewardedVideoAd {
  load(): Promise<void>;
  show(): Promise<void>;
  onLoad(cb: () => void): void;
  onError(cb: (err: { errMsg?: string; errCode?: number }) => void): void;
  onClose(cb: (res?: { isEnded?: boolean }) => void): void;
}

export interface RewardedAdHook {
  /** 开关关掉或广告位还是空的，必须返回 false。调用方不得发奖。 */
  isConfigured(): boolean;
  show(): Promise<AdResult>;
}

/** 开关关掉或广告位是空的，都不算接上。 */
export function adSwitchOpen(enabled: boolean, adUnitId: string): boolean {
  return enabled && adUnitId.length > 0;
}

export function createRewardedAd(opts: {
  enabled: boolean;
  adUnitId: string;
  create: () => WxRewardedVideoAd | null;
}): RewardedAdHook {
  let ad: WxRewardedVideoAd | null = null;
  let finish: ((result: AdResult) => void) | null = null;

  const configured = () => adSwitchOpen(opts.enabled, opts.adUnitId);

  return {
    isConfigured: configured,
    show() {
      if (!configured()) return Promise.resolve('unavailable');
      if (!ad) {
        ad = opts.create();
        if (!ad) return Promise.resolve('unavailable');
        const created = ad;
        created.onError(() => {
          if (finish) finish('unavailable');
        });
        created.onClose((res) => {
          if (!finish) return;
          if (res && res.isEnded === false) finish('skip');
          else finish('reward');
        });
      }
      const current = ad;
      return new Promise((resolve) => {
        let settled = false;
        finish = (result) => {
          if (settled) return;
          settled = true;
          resolve(result);
        };
        current.show().catch(() => current.load().then(() => current.show())).catch(() => {
          if (finish) finish('unavailable');
        });
      });
    },
  };
}
