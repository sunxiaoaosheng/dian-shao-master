export type AdResult = 'reward' | 'skip' | 'unavailable';

export interface RewardedAdHook {
  /** 广告位还是空的时候必须返回 false，调用方不得发奖。 */
  isConfigured(): boolean;
  show(): Promise<AdResult>;
}

/**
 * 激励视频广告位。
 * TODO(owner): 流量主开通后，把广告位 ID 填进 REWARDED_AD_UNIT_ID，
 * 再用 wx.createRewardedVideoAd 替换 createReservedRewardedAd。
 * 看完才发奖；玩家关掉不算。不要把广告做成开局门槛。
 */
export const REWARDED_AD_UNIT_ID = '';

export function createReservedRewardedAd(): RewardedAdHook {
  return {
    isConfigured: () => REWARDED_AD_UNIT_ID.length > 0,
    show: () => Promise.resolve('unavailable'),
  };
}
