"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const adapter_1 = require("./platform/wechat/adapter");
try {
    (0, app_1.startGame)((0, adapter_1.createWechatPlatform)());
}
catch (err) {
    console.error('[颠勺] 启动失败', err);
}
