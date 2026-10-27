"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TossDetector = exports.TIERS = exports.COOLDOWN_MAX_MS = exports.COOLDOWN_MIN_MS = exports.CALIBRATION_MS = exports.WINDOW_MS = void 0;
exports.tossFeel = tossFeel;
exports.cooldownMsFor = cooldownMsFor;
exports.canAcceptToss = canAcceptToss;
exports.nextReadyAt = nextReadyAt;
exports.createTossDetector = createTossDetector;
exports.wrapDeg = wrapDeg;
exports.WINDOW_MS = 200;
exports.CALIBRATION_MS = 360;
exports.COOLDOWN_MIN_MS = 400;
exports.COOLDOWN_MAX_MS = 800;
exports.TIERS = {
    gentle: { id: 'gentle', accelG: 1.12, angleDeg: 14, cooldownMs: 800 },
    standard: { id: 'standard', accelG: 1.55, angleDeg: 18, cooldownMs: 600 },
    fierce: { id: 'fierce', accelG: 2.05, angleDeg: 24, cooldownMs: 400 },
};
const GRAVITY_TAU_S = 0.4;
const RELAX_ACCEL_G = 0.45;
const RELAX_ANGLE = 8;
const MPS2_MEDIAN = 4;
const GRAVITY_G = 9.80665;
/** 三档手感的可见反馈。冷却和阈值都从 TIERS 来，晃动幅度只影响画面。 */
function tossFeel(tier) {
    const cfg = exports.TIERS[tier];
    const shake = tier === 'gentle' ? 0.72 : tier === 'fierce' ? 1.2 : 1;
    return { cooldownMs: cfg.cooldownMs, shake, accelG: cfg.accelG, angleDeg: cfg.angleDeg };
}
function cooldownMsFor(tier) {
    const ms = exports.TIERS[tier].cooldownMs;
    if (ms < exports.COOLDOWN_MIN_MS)
        return exports.COOLDOWN_MIN_MS;
    if (ms > exports.COOLDOWN_MAX_MS)
        return exports.COOLDOWN_MAX_MS;
    return ms;
}
function canAcceptToss(now, readyAt) {
    return now >= readyAt;
}
function nextReadyAt(now, tier) {
    return now + cooldownMsFor(tier);
}
function createTossDetector(tier) {
    return new TossDetector(tier);
}
class TossDetector {
    constructor(tier) {
        this.gx = 0;
        this.gy = 0;
        this.gz = 0;
        this.gravityReady = false;
        this.lastT = 0;
        this.lastAlpha = 0;
        this.lastBeta = 0;
        this.lastGamma = 0;
        this.anglesReady = false;
        this.angleBuf = [];
        this.magBuf = [];
        this.armed = true;
        this.cooldownUntil = 0;
        this.readyAt = -1;
        this.calibMags = [];
        this.unit = 'unknown';
        this.unitScale = 1;
        this.seenAccel = false;
        this.seenMotion = false;
        this.motionNonZero = false;
        this.lastMag = 0;
        this.lastImpulse = 0;
        this.lastAngle = 0;
        this.tier = exports.TIERS[tier];
    }
    setTier(tier) {
        this.tier = exports.TIERS[tier];
    }
    peek() {
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
    isLive() {
        if (this.unit !== 'unknown') {
            const g = Math.hypot(this.gx, this.gy, this.gz);
            if (g > 0.45 && g < 1.8)
                return true;
        }
        if (!this.seenAccel && this.motionNonZero)
            return true;
        return false;
    }
    push(sample) {
        var _a, _b, _c, _d, _e, _f;
        if (this.readyAt < 0)
            this.readyAt = sample.t + exports.CALIBRATION_MS;
        const rawAx = (_a = sample.ax) !== null && _a !== void 0 ? _a : 0;
        const rawAy = (_b = sample.ay) !== null && _b !== void 0 ? _b : 0;
        const rawAz = (_c = sample.az) !== null && _c !== void 0 ? _c : 0;
        const hasAccel = sample.ax !== undefined || sample.ay !== undefined || sample.az !== undefined;
        const hasAngles = sample.alpha !== undefined || sample.beta !== undefined || sample.gamma !== undefined;
        if (hasAccel)
            this.seenAccel = true;
        if (hasAngles) {
            this.seenMotion = true;
            const abs = Math.abs((_d = sample.alpha) !== null && _d !== void 0 ? _d : 0) + Math.abs((_e = sample.beta) !== null && _e !== void 0 ? _e : 0) + Math.abs((_f = sample.gamma) !== null && _f !== void 0 ? _f : 0);
            if (abs > 1)
                this.motionNonZero = true;
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
            }
            else {
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
        if (sample.t < this.readyAt)
            return null;
        if (this.seenAccel && this.unit === 'unknown')
            return null;
        if (sample.t < this.cooldownUntil)
            return null;
        if (!this.armed) {
            if (mag < RELAX_ACCEL_G && angle < RELAX_ANGLE)
                this.armed = true;
            return null;
        }
        if (!this.matches(this.lastImpulse, angle))
            return null;
        this.armed = false;
        this.cooldownUntil = sample.t + this.tier.cooldownMs;
        return {
            t: sample.t,
            impulse: this.lastImpulse,
            angleDeg: angle,
            tier: this.tier.id,
        };
    }
    lockUnit() {
        const med = median(this.calibMags);
        if (med >= MPS2_MEDIAN) {
            this.unit = 'mps2';
            this.unitScale = 1 / GRAVITY_G;
            this.gx *= this.unitScale;
            this.gy *= this.unitScale;
            this.gz *= this.unitScale;
        }
        else {
            this.unit = 'g';
            this.unitScale = 1;
        }
        this.magBuf = [];
        this.angleBuf = [];
    }
    matches(impulse, angle) {
        const accelNeed = this.tier.accelG;
        const angleNeed = this.tier.angleDeg;
        if (this.seenMotion && this.seenAccel) {
            return impulse >= accelNeed && angle >= angleNeed;
        }
        if (this.seenAccel)
            return impulse >= accelNeed * 1.25;
        if (this.seenMotion)
            return angle >= angleNeed * 1.35;
        return false;
    }
    pushMag(t, mag) {
        this.magBuf.push({ t, mag });
        const start = t - exports.WINDOW_MS;
        while (this.magBuf.length && this.magBuf[0].t < start)
            this.magBuf.shift();
    }
    impulseOf(mag) {
        let min = mag;
        for (let i = 0; i < this.magBuf.length; i += 1) {
            if (this.magBuf[i].mag < min)
                min = this.magBuf[i].mag;
        }
        return mag - min;
    }
    pushAngle(sample) {
        var _a, _b, _c;
        const a = (_a = sample.alpha) !== null && _a !== void 0 ? _a : this.lastAlpha;
        const b = (_b = sample.beta) !== null && _b !== void 0 ? _b : this.lastBeta;
        const g = (_c = sample.gamma) !== null && _c !== void 0 ? _c : this.lastGamma;
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
        if (step > 0)
            this.angleBuf.push({ t: sample.t, deg: step });
        return this.angleInWindow(sample.t);
    }
    angleInWindow(now) {
        const start = now - exports.WINDOW_MS;
        while (this.angleBuf.length && this.angleBuf[0].t < start)
            this.angleBuf.shift();
        let sum = 0;
        for (let i = 0; i < this.angleBuf.length; i += 1)
            sum += this.angleBuf[i].deg;
        return sum;
    }
}
exports.TossDetector = TossDetector;
function wrapDeg(d) {
    let x = d % 360;
    if (x > 180)
        x -= 360;
    if (x < -180)
        x += 360;
    return x;
}
function median(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2)
        return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
}
