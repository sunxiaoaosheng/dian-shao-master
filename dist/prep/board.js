"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREP_MAX_WRONG = void 0;
exports.createPrep = createPrep;
exports.tapPrep = tapPrep;
exports.tickPrep = tickPrep;
exports.prepPenalty = prepPenalty;
exports.PREP_MAX_WRONG = 3;
function createPrep(dish, enforce, includeDecoys) {
    const pieces = [];
    pushAll(pieces, dish.need, 'need');
    if (includeDecoys) {
        pushAll(pieces, dish.decoys, 'decoy');
        if (dish.taboo && dish.tabooPiece)
            pushAll(pieces, [dish.tabooPiece], 'taboo');
    }
    const total = Math.round(dish.prepSeconds * 1000 * dish.pace);
    return {
        pieces,
        wrong: 0,
        maxWrong: exports.PREP_MAX_WRONG,
        leftMs: total,
        totalMs: total,
        enforce,
        status: 'working',
        missId: '',
    };
}
function tapPrep(state, id) {
    if (state.status !== 'working')
        return state;
    const pieces = state.pieces.map((piece) => Object.assign({}, piece));
    let found = null;
    for (let i = 0; i < pieces.length; i += 1) {
        if (pieces[i].id === id)
            found = pieces[i];
    }
    if (!found || found.got)
        return state;
    if (found.role === 'need') {
        found.got = true;
        const ready = pieces.every((piece) => piece.role !== 'need' || piece.got);
        return Object.assign({}, state, { pieces, status: ready ? 'ready' : 'working', missId: '' });
    }
    const wrong = state.wrong + 1;
    const failed = state.enforce && wrong >= state.maxWrong;
    return Object.assign({}, state, {
        pieces,
        wrong,
        status: failed ? 'wrong' : state.status,
        missId: found.id,
    });
}
function tickPrep(state, dtMs) {
    if (state.status !== 'working')
        return state;
    const left = state.leftMs - Math.max(0, dtMs);
    if (left <= 0 && state.enforce) {
        return Object.assign({}, state, { leftMs: 0, status: 'timeout' });
    }
    return Object.assign({}, state, { leftMs: Math.max(0, left) });
}
function prepPenalty(state) {
    return state.wrong * 6;
}
function pushAll(pieces, list, role) {
    for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        pieces.push({ id: item.id, name: item.name, ink: item.ink, role, got: false });
    }
}
