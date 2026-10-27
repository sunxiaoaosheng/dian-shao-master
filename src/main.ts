import { startGame } from './app';
import { createWechatPlatform } from './platform/wechat/adapter';

try {
  startGame(createWechatPlatform());
} catch (err) {
  console.error('[颠勺] 启动失败', err);
}
