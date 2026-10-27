"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIECE_WARN_COOK = exports.BURN_WARN_METER = void 0;
exports.goalProgress = goalProgress;
exports.burnWarnKind = burnWarnKind;
const difficulty_1 = require("./difficulty");
/** 火候条到这里就该提醒颠勺。 */
exports.BURN_WARN_METER = 75;
/** 单块熟度到这里，锅沿还没满也提醒。0 到 1。 */
exports.PIECE_WARN_COOK = 0.8;
function goalProgress(opts) {
    const graduated = (0, difficulty_1.didGraduate)(opts.merges, opts.elapsedMs, opts.cards);
    const nextRuns = graduated ? opts.runsCompleted + 1 : opts.runsCompleted;
    return {
        merges: opts.merges,
        needMerges: difficulty_1.GRADUATION_MERGES,
        elapsedMs: opts.elapsedMs,
        needMs: difficulty_1.GRADUATION_MS,
        cards: opts.cards,
        graduated,
        heatId: opts.heatId,
        nextHeatId: (0, difficulty_1.pickProfile)(nextRuns).id,
        aheadHeatId: (0, difficulty_1.pickProfile)(opts.runsCompleted + 1).id,
    };
}
function burnWarnKind(meter, hottestCook) {
    if (meter >= exports.BURN_WARN_METER)
        return 'pot';
    if (hottestCook >= exports.PIECE_WARN_COOK)
        return 'piece';
    return 'none';
}
