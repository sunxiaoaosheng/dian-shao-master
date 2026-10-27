"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOTION_START_MS = void 0;
exports.createMotionBridge = createMotionBridge;
/**
 * 方向和加速度一起开。后开的那路不能挡住先开的那路。
 * iOS 上 `interval: 'game'` 有时直接失败，就改试 ui、normal。
 * 采样交给 src/input/gyro.ts，这里不判断颠勺。
 */
/** 隐私弹窗可能压着 success。太短会在玩家点同意前被当成拒绝。 */
exports.MOTION_START_MS = 8000;
const INTERVALS = ['game', 'ui', 'normal'];
function num(value) {
    if (typeof value === 'number' && isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (isFinite(parsed))
            return parsed;
    }
    return undefined;
}
function createMotionBridge(wx) {
    let motionToken = 0;
    let accelToken = 0;
    let motionHandler = null;
    let accelHandler = null;
    const sink = {};
    function stop() {
        motionToken += 1;
        accelToken += 1;
        if (motionHandler && wx.offDeviceMotionChange)
            wx.offDeviceMotionChange(motionHandler);
        if (accelHandler && wx.offAccelerometerChange)
            wx.offAccelerometerChange(accelHandler);
        motionHandler = null;
        accelHandler = null;
        if (wx.stopDeviceMotionListening)
            wx.stopDeviceMotionListening({});
        if (wx.stopAccelerometer)
            wx.stopAccelerometer({});
    }
    function emitMotion(res) {
        var _a;
        const alpha = num(res.alpha);
        const beta = num(res.beta);
        const gamma = num(res.gamma);
        if (alpha !== undefined || beta !== undefined || gamma !== undefined) {
            (_a = sink.motion) === null || _a === void 0 ? void 0 : _a.call(sink, {
                alpha: alpha !== null && alpha !== void 0 ? alpha : 0,
                beta: beta !== null && beta !== void 0 ? beta : 0,
                gamma: gamma !== null && gamma !== void 0 ? gamma : 0,
            });
        }
        emitAccel(res);
    }
    function emitAccel(res) {
        var _a;
        const x = num(res.x);
        const y = num(res.y);
        const z = num(res.z);
        if (x === undefined && y === undefined && z === undefined)
            return;
        (_a = sink.accel) === null || _a === void 0 ? void 0 : _a.call(sink, { x: x !== null && x !== void 0 ? x : 0, y: y !== null && y !== void 0 ? y : 0, z: z !== null && z !== void 0 ? z : 0 });
    }
    function listen(kind, still, start, attach) {
        if (!start)
            return Promise.resolve('unsupported');
        return new Promise((resolve) => {
            let settled = false;
            const finish = (result) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
                resolve(result);
            };
            const timer = setTimeout(() => {
                console.warn(`[颠勺] ${kind === 'motion' ? '方向' : '加速度'}没有在时限内回应`);
                finish('denied');
            }, exports.MOTION_START_MS);
            const attempt = (index) => {
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
                        if (settled)
                            return;
                        console.warn(`[颠勺] ${INTERVALS[index]} 没打开`, err && err.errMsg);
                        attempt(index + 1);
                    },
                });
            };
            attempt(0);
        });
    }
    function startMotion() {
        if (!wx.startDeviceMotionListening || !wx.onDeviceMotionChange)
            return Promise.resolve('unsupported');
        const token = ++motionToken;
        return listen('motion', () => token === motionToken, (opts) => { var _a; return (_a = wx.startDeviceMotionListening) === null || _a === void 0 ? void 0 : _a.call(wx, opts); }, () => {
            var _a;
            if (motionHandler && wx.offDeviceMotionChange)
                wx.offDeviceMotionChange(motionHandler);
            motionHandler = (res) => {
                if (token !== motionToken)
                    return;
                emitMotion(res);
            };
            (_a = wx.onDeviceMotionChange) === null || _a === void 0 ? void 0 : _a.call(wx, motionHandler);
        });
    }
    function startAccel() {
        if (!wx.startAccelerometer || !wx.onAccelerometerChange)
            return Promise.resolve('unsupported');
        const token = ++accelToken;
        return listen('accel', () => token === accelToken, (opts) => { var _a; return (_a = wx.startAccelerometer) === null || _a === void 0 ? void 0 : _a.call(wx, opts); }, () => {
            var _a;
            if (accelHandler && wx.offAccelerometerChange)
                wx.offAccelerometerChange(accelHandler);
            accelHandler = (res) => {
                if (token !== accelToken)
                    return;
                emitAccel(res);
            };
            (_a = wx.onAccelerometerChange) === null || _a === void 0 ? void 0 : _a.call(wx, accelHandler);
        });
    }
    return { sink, startMotion, startAccel, stop };
}
