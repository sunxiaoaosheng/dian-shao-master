"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensorMux = void 0;
/** 姿态和加速度是两条回调，合成一份给检测器。没到的那路不要填 0，免得把重力校准带歪。 */
class SensorMux {
    constructor() {
        this.alpha = 0;
        this.beta = 0;
        this.gamma = 0;
        this.ax = 0;
        this.ay = 0;
        this.az = 0;
        this.hasMotion = false;
        this.hasAccel = false;
    }
    reset() {
        this.alpha = 0;
        this.beta = 0;
        this.gamma = 0;
        this.ax = 0;
        this.ay = 0;
        this.az = 0;
        this.hasMotion = false;
        this.hasAccel = false;
    }
    motion(sample, t) {
        this.alpha = sample.alpha;
        this.beta = sample.beta;
        this.gamma = sample.gamma;
        this.hasMotion = true;
        return this.snapshot(t);
    }
    accel(sample, t) {
        this.ax = sample.x;
        this.ay = sample.y;
        this.az = sample.z;
        this.hasAccel = true;
        return this.snapshot(t);
    }
    snapshot(t) {
        const sample = { t };
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
exports.SensorMux = SensorMux;
