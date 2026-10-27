"use strict";
/**
 * 地区灶口榜。形状对齐 wx.cloud.callFunction({ name, data })。
 * BOARD_ENABLED 关掉时不请求，也不填示例名。
 * TODO(owner)：云函数 regionalBoard 能返回 { list: [{ region, chef, dish, heat }] } 后，把 BOARD_ENABLED 改成 true。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOARD_FUNCTION_NAME = exports.BOARD_ENABLED = void 0;
exports.readBoard = readBoard;
exports.fetchRegionalBoard = fetchRegionalBoard;
exports.BOARD_ENABLED = false;
exports.BOARD_FUNCTION_NAME = 'regionalBoard';
function readBoard(result) {
    let rows = [];
    if (Array.isArray(result))
        rows = result;
    else if (result && typeof result === 'object' && Array.isArray(result.list)) {
        rows = result.list;
    }
    const out = [];
    for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        if (!row || typeof row !== 'object')
            continue;
        const item = row;
        if (typeof item.region !== 'string' || typeof item.dish !== 'string')
            continue;
        out.push({
            region: item.region,
            chef: typeof item.chef === 'string' ? item.chef : '',
            dish: item.dish,
            heat: typeof item.heat === 'number' ? item.heat : 0,
        });
    }
    return out;
}
/** 开关关掉或没有云函数时直接空列表，不会去调用 call。 */
function fetchRegionalBoard(call) {
    if (!exports.BOARD_ENABLED || !call)
        return Promise.resolve([]);
    return call(exports.BOARD_FUNCTION_NAME, {}).then((result) => readBoard(result)).catch(() => []);
}
