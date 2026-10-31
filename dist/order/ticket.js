"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.tickOrder = tickOrder;
exports.acceptOrder = acceptOrder;
function createOrder(dish, enforce) {
    const total = Math.round(dish.orderSeconds * 1000 * dish.pace);
    let line = `${dish.region}来客点了${dish.name}。`;
    if (dish.taboo)
        line += `交代一句：${dish.taboo}。`;
    return {
        dishId: dish.id,
        dishName: dish.name,
        region: dish.region,
        line,
        taboo: dish.taboo,
        leftMs: total,
        totalMs: total,
        enforce,
        status: 'waiting',
    };
}
function tickOrder(state, dtMs) {
    if (state.status !== 'waiting')
        return state;
    const left = state.leftMs - Math.max(0, dtMs);
    if (left <= 0 && state.enforce) {
        return Object.assign({}, state, { leftMs: 0, status: 'timeout' });
    }
    return Object.assign({}, state, { leftMs: Math.max(0, left) });
}
function acceptOrder(state) {
    if (state.status !== 'waiting')
        return state;
    return Object.assign({}, state, { status: 'accepted' });
}
