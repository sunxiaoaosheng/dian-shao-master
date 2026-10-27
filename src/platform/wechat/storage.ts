import type { WechatMiniGame } from './wxTypes';

export function readStorage(wx: WechatMiniGame, key: string): string | null {
  try {
    const value = wx.getStorageSync(key);
    if (value === undefined || value === null || value === '') return null;
    return String(value);
  } catch {
    return null;
  }
}

export function writeStorage(wx: WechatMiniGame, key: string, value: string): void {
  try {
    wx.setStorageSync(key, value);
  } catch (err) {
    console.warn('[颠勺] 存档失败', err);
  }
}
