"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMeta = defaultMeta;
exports.parseMeta = parseMeta;
exports.serializeMeta = serializeMeta;
function defaultMeta() {
    return { runsCompleted: 0, tier: 'standard' };
}
function parseMeta(raw) {
    if (!raw)
        return defaultMeta();
    try {
        const value = JSON.parse(raw);
        const runs = typeof value.runsCompleted === 'number' && value.runsCompleted > 0
            ? Math.floor(value.runsCompleted)
            : 0;
        return { runsCompleted: runs, tier: normalizeTier(value.tier) };
    }
    catch (_a) {
        return defaultMeta();
    }
}
function serializeMeta(state) {
    return JSON.stringify(state);
}
function normalizeTier(value) {
    if (value === 'gentle' || value === 'standard' || value === 'fierce')
        return value;
    return 'standard';
}
