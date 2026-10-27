import type { MotionSample } from './gyro';

export interface Attitude {
  alpha: number;
  beta: number;
  gamma: number;
}

export interface Accel {
  x: number;
  y: number;
  z: number;
}

/** 姿态和加速度是两条回调，合成一份给检测器。没到的那路不要填 0，免得把重力校准带歪。 */
export class SensorMux {
  private alpha = 0;
  private beta = 0;
  private gamma = 0;
  private ax = 0;
  private ay = 0;
  private az = 0;
  private hasMotion = false;
  private hasAccel = false;

  reset(): void {
    this.alpha = 0;
    this.beta = 0;
    this.gamma = 0;
    this.ax = 0;
    this.ay = 0;
    this.az = 0;
    this.hasMotion = false;
    this.hasAccel = false;
  }

  motion(sample: Attitude, t: number): MotionSample {
    this.alpha = sample.alpha;
    this.beta = sample.beta;
    this.gamma = sample.gamma;
    this.hasMotion = true;
    return this.snapshot(t);
  }

  accel(sample: Accel, t: number): MotionSample {
    this.ax = sample.x;
    this.ay = sample.y;
    this.az = sample.z;
    this.hasAccel = true;
    return this.snapshot(t);
  }

  private snapshot(t: number): MotionSample {
    const sample: MotionSample = { t };
    if (this.hasMotion) {
      sample.alpha = this.alpha;
      sample.beta = this.beta;
      sample.gamma = this.gamma;
    }
    if (this.hasAccel) {
      sample.ax = this.ax;
      sample.ay = this.ay;
      sample.az = this.az;
    }
    return sample;
  }
}
