"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HEAT = exports.GRADUATION_MS = exports.GRADUATION_MERGES = void 0;
exports.didGraduate = didGraduate;
exports.pickProfile = pickProfile;
/** 试火出师：合成够次数，或这口撑过这么久，或收了招牌。否则下一锅仍是试火。 */
exports.GRADUATION_MERGES = 1;
exports.GRADUATION_MS = 20000;
function didGraduate(merges, elapsedMs, cards) {
    return merges >= exports.GRADUATION_MERGES || elapsedMs >= exports.GRADUATION_MS || cards > 0;
}
/**
 * 第一锅试火很松。出师之后小火、中火、地狱火一档比一档赶。
 * 数值只放这里，玩法代码按档位读，不要在别处再写一套。
 */
exports.HEAT = [
    {
        id: 'tutorial',
        spawnIntervalMs: 2600,
        spawnFloor: 2000,
        baseBurnMs: 8000,
        burnPerLevelMs: 2200,
        passivePerSec: 2.8,
        burnChunk: 12,
        tossCharges: 5,
        tossRelief: 32,
        cols: 4,
        rows: 5,
        heatRampEvery: 0,
        level2Chance: 0,
        hint: true,
        cookScale: 1,
    },
    {
        id: 'simmer',
        spawnIntervalMs: 1500,
        spawnFloor: 900,
        baseBurnMs: 6000,
        burnPerLevelMs: 1400,
        passivePerSec: 4.4,
        burnChunk: 16,
        tossCharges: 3,
        tossRelief: 22,
        cols: 4,
        rows: 5,
        heatRampEvery: 4,
        level2Chance: 0.08,
        hint: false,
        cookScale: 1,
    },
    {
        id: 'stir',
        spawnIntervalMs: 1200,
        spawnFloor: 760,
        baseBurnMs: 6000,
        burnPerLevelMs: 1000,
        passivePerSec: 4,
        burnChunk: 16,
        tossCharges: 2,
        tossRelief: 20,
        cols: 4,
        rows: 4,
        heatRampEvery: 3,
        level2Chance: 0.15,
        hint: false,
        cookScale: 1,
    },
    {
        id: 'hell',
        spawnIntervalMs: 780,
        spawnFloor: 480,
        baseBurnMs: 3800,
        burnPerLevelMs: 600,
        passivePerSec: 7,
        burnChunk: 24,
        tossCharges: 1,
        tossRelief: 14,
        cols: 4,
        rows: 4,
        heatRampEvery: 2,
        level2Chance: 0.28,
        hint: false,
        cookScale: 1,
    },
];
function pickProfile(runsCompleted) {
    if (runsCompleted <= 0)
        return exports.HEAT[0];
    if (runsCompleted === 1)
        return exports.HEAT[1];
    if (runsCompleted === 2)
        return exports.HEAT[2];
    return exports.HEAT[3];
}
