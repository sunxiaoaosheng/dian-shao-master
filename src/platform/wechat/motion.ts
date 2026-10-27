import type { WechatMiniGame } from './wxTypes';

export type SensorStart = 'ok' | 'denied' | 'unsupported';

export interface MotionSink {
  motion?(res: { alpha: number; beta: number; gamma: number }): void;
  accel?(res: { x: number; y: number; z: number }): void;
}

/**
 * 只负责 wx.startDeviceMotionListening / onDeviceMotionChange
 * 和加速度计。采样交给 src/input/gyro.ts，这里不判断颠勺。
 */
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
      wx.startDeviceMotionListening?.({
        interval: 'game',
        success: () => {
          if (token !== motionToken) {
            resolve('denied');
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
          resolve('ok');
        },
        fail: (err) => {
          console.warn('[颠勺] 动作传感器不可用', err && err.errMsg);
          resolve('denied');
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
