"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.burnLimitMs = burnLimitMs;
exports.advanceBurn = advanceBurn;
exports.cookRatio = cookRatio;
const grid_1 = require("./grid");
function burnLimitMs(level, baseBurnMs, burnPerLevelMs) {
    const safe = level <= 1 ? 1 : level;
    return baseBurnMs + (safe - 1) * burnPerLevelMs;
}
/** 火候：放着不管会糊，糊一次锅沿就涨一截；另外整口锅会自己慢慢升温。 */
function advanceBurn(cells, cfg) {
    const next = (0, grid_1.clonePieces)(cells);
    let meterDelta = cfg.passivePerSec * (cfg.dtMs / 1000);
    let newlyBurnt = 0;
    for (let i = 0; i < next.length; i += 1) {
        const cell = next[i];
        if (cell.level <= 0 || cell.burnt)
            continue;
        cell.cookMs += cfg.dtMs * cfg.cookScale;
        const limit = burnLimitMs(cell.level, cfg.baseBurnMs, cfg.burnPerLevelMs);
        if (cell.cookMs >= limit) {
            cell.burnt = true;
            meterDelta += cfg.burnChunk;
            newlyBurnt += 1;
        }
    }
    return { cells: next, meterDelta, newlyBurnt };
}
function cookRatio(cell, baseBurnMs, burnPerLevelMs) {
    if (cell.level <= 0)
        return 0;
    if (cell.burnt)
        return 1;
    const limit = burnLimitMs(cell.level, baseBurnMs, burnPerLevelMs);
    if (limit <= 0)
        return 1;
    const ratio = cell.cookMs / limit;
    if (ratio < 0)
        return 0;
    if (ratio > 1)
        return 1;
    return ratio;
}
