import type { WechatMiniGame } from './wxTypes';

export type SensorStart = 'ok' | 'denied' | 'unsupported';

export interface MotionSink {
  motion?(res: { alpha: number; beta: number; gamma: number }): void;
  accel?(res: { x: number; y: number; z: number }): void;
}

/**
 * 颠勺以设备方向为准：wx.startDeviceMotionListening / onDeviceMotionChange。
 * 方向打开之后才补加速度计，失败不另走一套授权。
 * 采样交给 src/input/gyro.ts，这里不判断颠勺。
 */

/** 隐私弹窗可能压着 success。太短会在玩家点同意前被当成拒绝。 */
export const MOTION_START_MS = 8000;
export function createMotionBridge(wx: WechatMiniGame) {
  let motionToken = 0;
  let accelToken = 0;
  let motionHandler: ((res: { alpha?: number; beta?: number; gamma?: number }) => void) | null = null;
  let accelHandler: ((res: { x?: number; y?: number; z?: number }) => void) | null = null;
  const sink: MotionSink = {};

  function stop(): void {
    motionToken += 1;
    accelToken += 1;
    if (motionHandler && wx.offDeviceMotionChange) wx.offDeviceMotionChange(motionHandler);
    if (accelHandler && wx.offAccelerometerChange) wx.offAccelerometerChange(accelHandler);
    motionHandler = null;
    accelHandler = null;
    if (wx.stopDeviceMotionListening) wx.stopDeviceMotionListening({});
    if (wx.stopAccelerometer) wx.stopAccelerometer({});
  }

  function startMotion(): Promise<SensorStart> {
    if (!wx.startDeviceMotionListening || !wx.onDeviceMotionChange) return Promise.resolve('unsupported');
    const token = ++motionToken;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: SensorStart) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      };
      const timer = setTimeout(() => {
        console.warn('[颠勺] 方向传感器没有在时限内回应');
        finish('denied');
      }, MOTION_START_MS);
      wx.startDeviceMotionListening?.({
        interval: 'game',
        success: () => {
          if (token !== motionToken) {
            finish('denied');
            return;
          }
          if (motionHandler && wx.offDeviceMotionChange) wx.offDeviceMotionChange(motionHandler);
          motionHandler = (res) => {
            if (token !== motionToken) return;
            sink.motion?.({
              alpha: res.alpha || 0,
              beta: res.beta || 0,
              gamma: res.gamma || 0,
            });
          };
          wx.onDeviceMotionChange?.(motionHandler);
          finish('ok');
        },
        fail: (err) => {
          console.warn('[颠勺] 方向传感器不可用', err && err.errMsg);
          finish('denied');
        },
      });
    });
  }

  function startAccel(): Promise<SensorStart> {
    if (!wx.startAccelerometer || !wx.onAccelerometerChange) return Promise.resolve('unsupported');
    const token = ++accelToken;
    return new Promise((resolve) => {
      wx.startAccelerometer?.({
        interval: 'game',
        success: () => {
          if (token !== accelToken) {
            resolve('denied');
            return;
          }
          if (accelHandler && wx.offAccelerometerChange) wx.offAccelerometerChange(accelHandler);
          accelHandler = (res) => {
            if (token !== accelToken) return;
            sink.accel?.({
              x: res.x || 0,
              y: res.y || 0,
              z: res.z || 0,
            });
          };
          wx.onAccelerometerChange?.(accelHandler);
          resolve('ok');
        },
        fail: (err) => {
          console.warn('[颠勺] 加速度计不可用', err && err.errMsg);
          resolve('denied');
        },
      });
    });
  }

  return { sink, startMotion, startAccel, stop };
}
