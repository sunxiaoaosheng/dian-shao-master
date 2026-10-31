"use strict";
/**
 * 剪贴清单。运行时只认 assets/manifest.json 里的 id、path、pivot、z。
 * path 相对 assets/，占位图就在对应文件上。
 *
 * 小游戏不能 require 这个 json。game.js 用文件系统从代码包根目录读入，
 * 放到全局 __DIANSHAO_MANIFEST__，这里只取已经读好的对象。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSETS = exports.LAYERS = exports.SCALE_DEFAULT = exports.MANIFEST_VERSION = void 0;
exports.assetById = assetById;
exports.assetsByPrefix = assetsByPrefix;
exports.foodIdForLevel = foodIdForLevel;
const MANIFEST_KEY = '__DIANSHAO_MANIFEST__';
function installedManifest() {
    const slots = [];
    if (typeof globalThis !== 'undefined')
        slots.push(globalThis);
    if (typeof GameGlobal !== 'undefined')
        slots.push(GameGlobal);
    for (let i = 0; i < slots.length; i += 1) {
        const raw = slots[i][MANIFEST_KEY];
        if (raw && typeof raw === 'object')
            return raw;
    }
    throw new Error('剪贴清单还没读入。入口要先读代码包根目录的 assets/manifest.json');
}
const raw = installedManifest();
function readItems(file) {
    const items = [];
    const seen = new Set();
    for (let i = 0; i < file.items.length; i += 1) {
        const item = file.items[i];
        if (!item || !item.id || seen.has(item.id))
            throw new Error('清单条目缺少 id');
        if (!item.path || item.path.indexOf('..') >= 0)
            throw new Error(`清单路径无效 ${item.id}`);
        if (!item.pivot || item.pivot.length < 2)
            throw new Error(`清单锚点无效 ${item.id}`);
        seen.add(item.id);
        items.push({
            id: item.id,
            path: item.path,
            file: `assets/${item.path}`,
            w: item.w,
            h: item.h,
            pivot: [item.pivot[0], item.pivot[1]],
            z: item.z,
            text: item.text || '',
        });
    }
    return items;
}
exports.MANIFEST_VERSION = raw.version;
exports.SCALE_DEFAULT = raw.scaleDefault;
exports.LAYERS = raw.layers;
exports.ASSETS = readItems(raw);
const BY_ID = new Map();
for (let i = 0; i < exports.ASSETS.length; i += 1)
    BY_ID.set(exports.ASSETS[i].id, exports.ASSETS[i]);
function assetById(id) {
    const item = BY_ID.get(id);
    if (!item)
        throw new Error(`清单里没有 ${id}`);
    return item;
}
function assetsByPrefix(prefix) {
    const list = [];
    for (let i = 0; i < exports.ASSETS.length; i += 1) {
        if (exports.ASSETS[i].id.indexOf(prefix) === 0)
            list.push(exports.ASSETS[i]);
    }
    return list;
}
/** 锅里的主料。底锅、油光和葱花由画面按各自的 z 另放。 */
function foodIdForLevel(level, seed) {
    if (level >= 4)
        return 'food.plateDone';
    if (level === 3)
        return 'food.chili';
    if (level === 2)
        return seed % 2 === 0 ? 'food.meatSlice' : 'food.egg';
    return seed % 2 === 0 ? 'food.vegGreen' : 'food.scallion';
}
