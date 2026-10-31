import type { WechatMiniGame } from './wxTypes';

export type SensorStart = 'ok' | 'denied' | 'unsupported';

export interface MotionSink {
  motion?(res: { alpha: number; beta: number; gamma: number }): void;
  accel?(res: { x: number; y: number; z: number }): void;
}

/**
 * 方向和加速度一起开。后开的那路不能挡住先开的那路。
 * iOS 上 `interval: 'game'` 有时直接失败，就改试 ui、normal。
 * 采样交给 src/input/gyro.ts，这里不判断颠勺。
 */

/** 隐私弹窗可能压着 success。太短会在玩家点同意前被当成拒绝。 */
export const MOTION_START_MS = 8000;
const INTERVALS: Array<'game' | 'ui' | 'normal'> = ['game', 'ui', 'normal'];

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function createMotionBridge(wx: WechatMiniGame) {
  let motionToken = 0;
  let accelToken = 0;
  let motionHandler: ((res: { alpha?: unknown; beta?: unknown; gamma?: unknown; x?: unknown; y?: unknown; z?: unknown }) => void) | null = null;
  let accelHandler: ((res: { x?: unknown; y?: unknown; z?: unknown }) => void) | null = null;
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

  function emitMotion(res: { alpha?: unknown; beta?: unknown; gamma?: unknown; x?: unknown; y?: unknown; z?: unknown }): void {
    const alpha = num(res.alpha);
    const beta = num(res.beta);
    const gamma = num(res.gamma);
    if (alpha !== undefined || beta !== undefined || gamma !== undefined) {
      sink.motion?.({
        alpha: alpha ?? 0,
        beta: beta ?? 0,
        gamma: gamma ?? 0,
      });
    }
    emitAccel(res);
  }

  function emitAccel(res: { x?: unknown; y?: unknown; z?: unknown }): void {
    const x = num(res.x);
    const y = num(res.y);
    const z = num(res.z);
    if (x === undefined && y === undefined && z === undefined) return;
    sink.accel?.({ x: x ?? 0, y: y ?? 0, z: z ?? 0 });
  }

  function listen(
    kind: 'motion' | 'accel',
    still: () => boolean,
    start: ((opts: { interval?: 'game' | 'ui' | 'normal'; success?: () => void; fail?: (err?: { errMsg?: string }) => void }) => void) | undefined,
    attach: () => void,
  ): Promise<SensorStart> {
    if (!start) return Promise.resolve('unsupported');
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: SensorStart) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      };
      const timer = setTimeout(() => {
        console.warn(`[颠勺] ${kind === 'motion' ? '方向' : '加速度'}没有在时限内回应`);
        finish('denied');
      }, MOTION_START_MS);
      const attempt = (index: number) => {
        if (!still()) {
          finish('denied');
          return;
        }
        if (index >= INTERVALS.length) {
          finish('denied');
          return;
        }
        start({
          interval: INTERVALS[index],
          success: () => {
            if (!still()) {
              finish('denied');
              return;
            }
            attach();
            finish('ok');
          },
          fail: (err) => {
            if (settled) return;
            console.warn(`[颠勺] ${INTERVALS[index]} 没打开`, err && err.errMsg);
            attempt(index + 1);
          },
        });
      };
      attempt(0);
    });
  }

  function startMotion(): Promise<SensorStart> {
    if (!wx.startDeviceMotionListening || !wx.onDeviceMotionChange) return Promise.resolve('unsupported');
    const token = ++motionToken;
    return listen(
      'motion',
      () => token === motionToken,
      (opts) => wx.startDeviceMotionListening?.(opts),
      () => {
        if (motionHandler && wx.offDeviceMotionChange) wx.offDeviceMotionChange(motionHandler);
        motionHandler = (res) => {
          if (token !== motionToken) return;
          emitMotion(res);
        };
        wx.onDeviceMotionChange?.(motionHandler);
      },
    );
  }

  function startAccel(): Promise<SensorStart> {
    if (!wx.startAccelerometer || !wx.onAccelerometerChange) return Promise.resolve('unsupported');
    const token = ++accelToken;
    return listen(
      'accel',
      () => token === accelToken,
      (opts) => wx.startAccelerometer?.(opts),
      () => {
        if (accelHandler && wx.offAccelerometerChange) wx.offAccelerometerChange(accelHandler);
        accelHandler = (res) => {
          if (token !== accelToken) return;
          emitAccel(res);
        };
        wx.onAccelerometerChange?.(accelHandler);
      },
    );
  }

  return { sink, startMotion, startAccel, stop };
}
