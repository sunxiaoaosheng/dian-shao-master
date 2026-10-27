"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOTION_START_MS = void 0;
exports.createMotionBridge = createMotionBridge;
/**
 * 颠勺以设备方向为准：wx.startDeviceMotionListening / onDeviceMotionChange。
 * 方向打开之后才补加速度计，失败不另走一套授权。
 * 采样交给 src/input/gyro.ts，这里不判断颠勺。
 */
/** 隐私弹窗可能压着 success。太短会在玩家点同意前被当成拒绝。 */
exports.MOTION_START_MS = 8000;
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
    function startMotion() {
        if (!wx.startDeviceMotionListening || !wx.onDeviceMotionChange)
            return Promise.resolve('unsupported');
        const token = ++motionToken;
        return new Promise((resolve) => {
            var _a;
            let settled = false;
            const finish = (result) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
                resolve(result);
            };
            const timer = setTimeout(() => {
                console.warn('[颠勺] 方向传感器没有在时限内回应');
                finish('denied');
            }, exports.MOTION_START_MS);
            (_a = wx.startDeviceMotionListening) === null || _a === void 0 ? void 0 : _a.call(wx, {
                interval: 'game',
                success: () => {
                    var _a;
                    if (token !== motionToken) {
                        finish('denied');
                        return;
                    }
                    if (motionHandler && wx.offDeviceMotionChange)
                        wx.offDeviceMotionChange(motionHandler);
                    motionHandler = (res) => {
                        var _a;
                        if (token !== motionToken)
                            return;
                        (_a = sink.motion) === null || _a === void 0 ? void 0 : _a.call(sink, {
                            alpha: res.alpha || 0,
                            beta: res.beta || 0,
                            gamma: res.gamma || 0,
                        });
                    };
                    (_a = wx.onDeviceMotionChange) === null || _a === void 0 ? void 0 : _a.call(wx, motionHandler);
                    finish('ok');
                },
                fail: (err) => {
                    console.warn('[颠勺] 方向传感器不可用', err && err.errMsg);
                    finish('denied');
                },
            });
        });
    }
    function startAccel() {
        if (!wx.startAccelerometer || !wx.onAccelerometerChange)
            return Promise.resolve('unsupported');
        const token = ++accelToken;
        return new Promise((resolve) => {
            var _a;
            (_a = wx.startAccelerometer) === null || _a === void 0 ? void 0 : _a.call(wx, {
                interval: 'game',
                success: () => {
                    var _a;
                    if (token !== accelToken) {
                        resolve('denied');
                        return;
                    }
                    if (accelHandler && wx.offAccelerometerChange)
                        wx.offAccelerometerChange(accelHandler);
                    accelHandler = (res) => {
                        var _a;
                        if (token !== accelToken)
                            return;
                        (_a = sink.accel) === null || _a === void 0 ? void 0 : _a.call(sink, {
                            x: res.x || 0,
                            y: res.y || 0,
                            z: res.z || 0,
                        });
                    };
                    (_a = wx.onAccelerometerChange) === null || _a === void 0 ? void 0 : _a.call(wx, accelHandler);
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
