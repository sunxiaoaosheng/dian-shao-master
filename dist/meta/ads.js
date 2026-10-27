"use strict";
/**
 * 激励视频。形状对齐 wx.createRewardedVideoAd。
 * ADS_ENABLED 关掉时不创建广告对象，也不调用任何回调，更不会发奖。
 * TODO(owner)：流量主开通后把广告位 ID 填上，并把 ADS_ENABLED 改成 true。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REWARDED_AD_UNIT_ID = exports.ADS_ENABLED = void 0;
exports.createRewardedAd = createRewardedAd;
exports.ADS_ENABLED = false;
exports.REWARDED_AD_UNIT_ID = '';
function createRewardedAd(opts) {
    let ad = null;
    let finish = null;
    const configured = () => opts.enabled && opts.adUnitId.length > 0;
    return {
        isConfigured: configured,
        show() {
            if (!configured())
                return Promise.resolve('unavailable');
            if (!ad) {
                ad = opts.create();
                if (!ad)
                    return Promise.resolve('unavailable');
                const created = ad;
                created.onError(() => {
                    if (finish)
                        finish('unavailable');
                });
                created.onClose((res) => {
                    if (!finish)
                        return;
                    if (res && res.isEnded === false)
                        finish('skip');
                    else
                        finish('reward');
                });
            }
            const current = ad;
            return new Promise((resolve) => {
                let settled = false;
                finish = (result) => {
                    if (settled)
                        return;
                    settled = true;
                    resolve(result);
                };
                current.show().catch(() => current.load().then(() => current.show())).catch(() => {
                    if (finish)
                        finish('unavailable');
                });
            });
        },
    };
}
