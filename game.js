/**
 * 微信小游戏入口。
 * 逻辑在 src/（TypeScript），编译产物按同样的模块边界放在 dist/。
 * 不要把 dist 再捆成单文件。
 *
 * 清单是 assets/manifest.json。小游戏不能把它当模块 require，
 * 所以在启动 dist 之前，从代码包根目录读出来。
 */
'use strict';

var loadManifest = require('./loadManifest.js');

loadManifest.installManifest(function (filePath, encoding) {
  return wx.getFileSystemManager().readFileSync(filePath, encoding);
});

require('./dist/main.js');
