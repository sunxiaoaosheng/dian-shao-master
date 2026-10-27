/**
 * 颠勺识别。只吃采样，不碰 wx。
 *
 * 真机验收（默认「家常」档）看 README：
 * - 静置不得误触发
 * - 故意上颠 10 次，至少认出 8 次
 *
 * 冷却落在 0.4–0.8 秒：越灵敏的档，冷却越长，避免一下颠被算成两下。
 * 加速度单位会在开局校准里自判：静止模长约 1 当 g，约 9.8 当 m/s²。
 */

export type SensitivityTier = 'gentle' | 'standard' | 'fierce';

export interface MotionSample {
  /** 单调递增的毫秒时间戳 */
  t: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  /** 加速度。单位可以是 g，也可以是 m/s²，检测器会自己看。 */
  ax?: number;
  ay?: number;
  az?: number;
}

export interface TierConfig {
  id: SensitivityTier;
  /** 去重力后的冲量阈值，单位 g */
  accelG: number;
  /** 200ms 窗口里累计转角，单位度 */
  angleDeg: number;
  /** 触发后的冷却，必须在 400–800ms */
  cooldownMs: number;
}

export const WINDOW_MS = 200;
export const CALIBRATION_MS = 360;
export const COOLDOWN_MIN_MS = 400;
export const COOLDOWN_MAX_MS = 800;

export const TIERS: Record<SensitivityTier, TierConfig> = {
  gentle: { id: 'gentle', accelG: 1.12, angleDeg: 14, cooldownMs: 800 },
  standard: { id: 'standard', accelG: 1.55, angleDeg: 18, cooldownMs: 600 },
  fierce: { id: 'fierce', accelG: 2.05, angleDeg: 24, cooldownMs: 400 },
};

const GRAVITY_TAU_S = 0.4;
const RELAX_ACCEL_G = 0.45;
const RELAX_ANGLE = 8;
const MPS2_MEDIAN = 4;
const GRAVITY_G = 9.80665;

export interface TossEvent {
  t: number;
  impulse: number;
  angleDeg: number;
  tier: SensitivityTier;
}

export interface GyroPeek {
  impulse: number;
  angle: number;
  mag: number;
  unit: 'unknown' | 'g' | 'mps2';
  live: boolean;
  armed: boolean;
}

export function cooldownMsFor(tier: SensitivityTier): number {
  const ms = TIERS[tier].cooldownMs;
  if (ms < COOLDOWN_MIN_MS) return COOLDOWN_MIN_MS;
  if (ms > COOLDOWN_MAX_MS) return COOLDOWN_MAX_MS;
  return ms;
}

export function canAcceptToss(now: number, readyAt: number): boolean {
  return now >= readyAt;
}

export function nextReadyAt(now: number, tier: SensitivityTier): number {
  return now + cooldownMsFor(tier);
}

export function createTossDetector(tier: SensitivityTier): TossDetector {
  return new TossDetector(tier);
}

export class TossDetector {
  private tier: TierConfig;
  private gx = 0;
  private gy = 0;
  private gz = 0;
  private gravityReady = false;
  private lastT = 0;
  private lastAlpha = 0;
  private lastBeta = 0;
  private lastGamma = 0;
  private anglesReady = false;
  private angleBuf: { t: number; deg: number }[] = [];
  private magBuf: { t: number; mag: number }[] = [];
  private armed = true;
  private cooldownUntil = 0;
  private readyAt = -1;
  private calibMags: number[] = [];
  private unit: 'unknown' | 'g' | 'mps2' = 'unknown';
  private unitScale = 1;
  private seenAccel = false;
  private seenMotion = false;
  private motionNonZero = false;
  private lastMag = 0;
  private lastImpulse = 0;
  private lastAngle = 0;

  constructor(tier: SensitivityTier) {
    this.tier = TIERS[tier];
  }

  setTier(tier: SensitivityTier): void {
    this.tier = TIERS[tier];
  }

  peek(): GyroPeek {
    return {
      impulse: this.lastImpulse,
      angle: this.lastAngle,
      mag: this.lastMag,
      unit: this.unit,
      live: this.isLive(),
      armed: this.armed,
    };
  }

  /**
   * 真机静置时重力约 1g（或 9.8 m/s²），模拟器常年吐 0。
   * 只有认得出重力，或只有姿态且姿态不是全 0，才算传感器活着。
   */
  isLive(): boolean {
    if (this.unit !== 'unknown') {
      const g = Math.hypot(this.gx, this.gy, this.gz);
      if (g > 0.45 && g < 1.8) return true;
    }
    if (!this.seenAccel && this.motionNonZero) return true;
    return false;
  }

  push(sample: MotionSample): TossEvent | null {
    if (this.readyAt < 0) this.readyAt = sample.t + CALIBRATION_MS;

    const rawAx = sample.ax ?? 0;
    const rawAy = sample.ay ?? 0;
    const rawAz = sample.az ?? 0;
    const hasAccel = sample.ax !== undefined || sample.ay !== undefined || sample.az !== undefined;
    const hasAngles = sample.alpha !== undefined || sample.beta !== undefined || sample.gamma !== undefined;

    if (hasAccel) this.seenAccel = true;
    if (hasAngles) {
      this.seenMotion = true;
      const abs =
        Math.abs(sample.alpha ?? 0) + Math.abs(sample.beta ?? 0) + Math.abs(sample.gamma ?? 0);
      if (abs > 1) this.motionNonZero = true;
    }

    if (hasAccel && this.unit === 'unknown') {
      this.calibMags.push(Math.hypot(rawAx, rawAy, rawAz));
    }

    if (this.unit === 'unknown' && hasAccel && sample.t >= this.readyAt && this.calibMags.length > 0) {
      this.lockUnit();
    }

    const scale = this.unit === 'unknown' ? 1 : this.unitScale;
    const ax = rawAx * scale;
    const ay = rawAy * scale;
    const az = rawAz * scale;

    const dt = this.lastT > 0 ? Math.max(0, Math.min(0.05, (sample.t - this.lastT) / 1000)) : 0.02;
    this.lastT = sample.t;

    if (hasAccel) {
      if (!this.gravityReady) {
        this.gx = ax;
        this.gy = ay;
        this.gz = az;
        this.gravityReady = true;
      } else {
        const k = 1 - Math.exp(-dt / GRAVITY_TAU_S);
        this.gx += (ax - this.gx) * k;
        this.gy += (ay - this.gy) * k;
        this.gz += (az - this.gz) * k;
      }
    }

    const mag = hasAccel ? Math.hypot(ax - this.gx, ay - this.gy, az - this.gz) : 0;
    this.lastMag = mag;
    this.pushMag(sample.t, mag);
    const angle = hasAngles ? this.pushAngle(sample) : this.angleInWindow(sample.t);
    this.lastAngle = angle;
    this.lastImpulse = this.impulseOf(mag);

    if (sample.t < this.readyAt) return null;
    if (this.seenAccel && this.unit === 'unknown') return null;
    if (sample.t < this.cooldownUntil) return null;

    if (!this.armed) {
      if (mag < RELAX_ACCEL_G && angle < RELAX_ANGLE) this.armed = true;
      return null;
    }

    if (!this.matches(this.lastImpulse, angle)) return null;

    this.armed = false;
    this.cooldownUntil = sample.t + this.tier.cooldownMs;
    return {
      t: sample.t,
      impulse: this.lastImpulse,
      angleDeg: angle,
      tier: this.tier.id,
    };
  }

  private lockUnit(): void {
    const med = median(this.calibMags);
    if (med >= MPS2_MEDIAN) {
      this.unit = 'mps2';
      this.unitScale = 1 / GRAVITY_G;
      this.gx *= this.unitScale;
      this.gy *= this.unitScale;
      this.gz *= this.unitScale;
    } else {
      this.unit = 'g';
      this.unitScale = 1;
    }
    this.magBuf = [];
    this.angleBuf = [];
  }

  private matches(impulse: number, angle: number): boolean {
    const accelNeed = this.tier.accelG;
    const angleNeed = this.tier.angleDeg;
    if (this.seenMotion && this.seenAccel) {
      return impulse >= accelNeed && angle >= angleNeed;
    }
    if (this.seenAccel) return impulse >= accelNeed * 1.25;
    if (this.seenMotion) return angle >= angleNeed * 1.35;
    return false;
  }

  private pushMag(t: number, mag: number): void {
    this.magBuf.push({ t, mag });
    const start = t - WINDOW_MS;
    while (this.magBuf.length && this.magBuf[0].t < start) this.magBuf.shift();
  }

  private impulseOf(mag: number): number {
    let min = mag;
    for (let i = 0; i < this.magBuf.length; i += 1) {
      if (this.magBuf[i].mag < min) min = this.magBuf[i].mag;
    }
    return mag - min;
  }

  private pushAngle(sample: MotionSample): number {
    const a = sample.alpha ?? this.lastAlpha;
    const b = sample.beta ?? this.lastBeta;
    const g = sample.gamma ?? this.lastGamma;
    let step = 0;
    if (this.anglesReady) {
      const dA = wrapDeg(a - this.lastAlpha);
      const dB = wrapDeg(b - this.lastBeta);
      const dG = wrapDeg(g - this.lastGamma);
      step = Math.hypot(dB, dG, dA * 0.35);
    }
    this.lastAlpha = a;
    this.lastBeta = b;
    this.lastGamma = g;
    this.anglesReady = true;
    if (step > 0) this.angleBuf.push({ t: sample.t, deg: step });
    return this.angleInWindow(sample.t);
  }

  private angleInWindow(now: number): number {
    const start = now - WINDOW_MS;
    while (this.angleBuf.length && this.angleBuf[0].t < start) this.angleBuf.shift();
    let sum = 0;
    for (let i = 0; i < this.angleBuf.length; i += 1) sum += this.angleBuf[i].deg;
    return sum;
  }
}

export function wrapDeg(d: number): number {
  let x = d % 360;
  if (x > 180) x -= 360;
  if (x < -180) x += 360;
  return x;
}

function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}
