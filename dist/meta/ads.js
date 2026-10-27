"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REWARDED_AD_UNIT_ID = void 0;
exports.createReservedRewardedAd = createReservedRewardedAd;
/**
 * 激励视频广告位。
 * TODO(owner): 流量主开通后，把广告位 ID 填进 REWARDED_AD_UNIT_ID，
 * 再用 wx.createRewardedVideoAd 替换 createReservedRewardedAd。
 * 看完才发奖；玩家关掉不算。不要把广告做成开局门槛。
 */
exports.REWARDED_AD_UNIT_ID = '';
function createReservedRewardedAd() {
    return {
        isConfigured: () => exports.REWARDED_AD_UNIT_ID.length > 0,
        show: () => Promise.resolve('unavailable'),
    };
}
