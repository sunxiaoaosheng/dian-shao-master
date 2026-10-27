/**
 * 读剪贴清单。微信小游戏不能 require .json（会去找 manifest.json.js）。
 * 路径从代码包根目录写：/assets/manifest.json。
 */
'use strict';

var MANIFEST_KEY = '__DIANSHAO_MANIFEST__';
var MANIFEST_PATHS = ['/assets/manifest.json', 'assets/manifest.json'];

function readManifestText(readFileSync) {
  var lastError = null;
  for (var i = 0; i < MANIFEST_PATHS.length; i += 1) {
    try {
      var data = readFileSync(MANIFEST_PATHS[i], 'utf8');
      if (typeof data !== 'string') throw new Error('清单不是文本 ' + MANIFEST_PATHS[i]);
      return data;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('读不到 assets/manifest.json');
}

function installManifest(readFileSync) {
  var manifest = JSON.parse(readManifestText(readFileSync));
  if (!manifest || !manifest.items) throw new Error('清单缺少 items');
  if (typeof globalThis !== 'undefined') globalThis[MANIFEST_KEY] = manifest;
  if (typeof GameGlobal !== 'undefined') GameGlobal[MANIFEST_KEY] = manifest;
  return manifest;
}

module.exports = {
  MANIFEST_KEY: MANIFEST_KEY,
  MANIFEST_PATHS: MANIFEST_PATHS,
  readManifestText: readManifestText,
  installManifest: installManifest,
};
