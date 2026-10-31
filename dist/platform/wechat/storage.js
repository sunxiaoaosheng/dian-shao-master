"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readStorage = readStorage;
exports.writeStorage = writeStorage;
function readStorage(wx, key) {
    try {
        const value = wx.getStorageSync(key);
        if (value === undefined || value === null || value === '')
            return null;
        return String(value);
    }
    catch (_a) {
        return null;
    }
}
function writeStorage(wx, key, value) {
    try {
        wx.setStorageSync(key, value);
    }
    catch (err) {
        console.warn('[颠勺] 存档失败', err);
    }
}
