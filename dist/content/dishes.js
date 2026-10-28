"use strict";
/** 六道菜的配置表。玩法只读这里，不要在场景里再写一套菜名或曲线。 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISHES = exports.SERVICE_COUNT = void 0;
exports.phaseAt = phaseAt;
exports.dishById = dishById;
exports.validateDishes = validateDishes;
const EGG = { id: 'egg', name: '鸡蛋', ink: '#e3b23c' };
const TOMATO = { id: 'tomato', name: '番茄', ink: '#c4452d' };
const SCALLION = { id: 'scallion', name: '葱', ink: '#3f7d45' };
const PEPPER = { id: 'pepper', name: '干辣椒', ink: '#8d2b1c' };
const POTATO = { id: 'potato', name: '土豆', ink: '#c4a574' };
/** 今晚六桌。配置还没齐的时候，主页分母也按六算。 */
exports.SERVICE_COUNT = 6;
exports.DISHES = [
    {
        id: 'fanqie',
        name: '番茄炒蛋',
        region: '家常',
        style: '火候分段，蛋出锅再回',
        gate: 'open',
        science: '番茄的酸让鸡蛋更嫩，出锅前再把蛋回颠两下。',
        album: '家常做法：热油里先把蛋液颠散，盛出。番茄下锅炒出汁，再把蛋回锅，轻轻颠匀就出。蛋在锅里停太久会老。',
        quips: {
            wreck: '蛋散了，汁也没挂住。',
            pass: '家常味出来了。',
            sign: '这盘能上台面。',
            god: '今晚就吃这一盘。',
        },
        orderSeconds: 18,
        pace: 1,
        taboo: null,
        prepSeconds: 20,
        need: [EGG, TOMATO, SCALLION],
        decoys: [POTATO],
        tabooPiece: PEPPER,
        cookSeconds: 16,
        phases: [
            { until: 0.25, want: 'toss', evenPerSec: 16, burnPerSec: 34, idleBurnPerSec: 7, hint: '颠：先把蛋液颠散' },
            { until: 0.45, want: 'hold', evenPerSec: 5, burnPerSec: 42, idleBurnPerSec: 2, hint: '停：蛋要定型' },
            { until: 0.7, want: 'toss', evenPerSec: 15, burnPerSec: 30, idleBurnPerSec: 8, hint: '颠：番茄下锅，颠匀' },
            { until: 0.85, want: 'hold', evenPerSec: 4, burnPerSec: 40, idleBurnPerSec: 2, hint: '停：收汁，勺放轻' },
            { until: 1, want: 'toss', evenPerSec: 14, burnPerSec: 28, idleBurnPerSec: 6, hint: '颠：蛋回锅，马上出' },
        ],
        drops: [
            { id: 'egg-in', at: 0.18, window: 0.08, label: '下蛋液', kind: 'drop' },
            { id: 'tomato-in', at: 0.5, window: 0.08, label: '下番茄', kind: 'drop' },
            { id: 'egg-back', at: 0.88, window: 0.07, label: '蛋回锅', kind: 'late' },
        ],
    },
];
function phaseAt(dish, progress) {
    const p = progress < 0 ? 0 : progress > 1 ? 1 : progress;
    for (let i = 0; i < dish.phases.length; i += 1) {
        if (p <= dish.phases[i].until)
            return dish.phases[i];
    }
    return dish.phases[dish.phases.length - 1];
}
function dishById(id) {
    for (let i = 0; i < exports.DISHES.length; i += 1) {
        if (exports.DISHES[i].id === id)
            return exports.DISHES[i];
    }
    return null;
}
function validateDishes(dishes) {
    const errors = [];
    const seen = {};
    for (let i = 0; i < dishes.length; i += 1) {
        const dish = dishes[i];
        if (seen[dish.id])
            errors.push(`${dish.id} 重复`);
        seen[dish.id] = true;
        if (!dish.name)
            errors.push(`${dish.id} 没有菜名`);
        if (countChars(dish.science) > 30)
            errors.push(`${dish.name} 科普超过 30 字`);
        if (countChars(dish.science) < 4)
            errors.push(`${dish.name} 科普太短`);
        if (dish.orderSeconds < 5 || dish.prepSeconds < 5 || dish.cookSeconds < 5) {
            errors.push(`${dish.name} 时限太短`);
        }
        if (!(dish.pace > 0))
            errors.push(`${dish.name} 节奏不对`);
        if (!dish.need.length)
            errors.push(`${dish.name} 没有原料`);
        checkPieces(dish, errors);
        checkPhases(dish, errors);
        checkDrops(dish, errors);
    }
    return errors;
}
function checkPieces(dish, errors) {
    const ids = {};
    const all = dish.need.concat(dish.decoys);
    if (dish.tabooPiece)
        all.push(dish.tabooPiece);
    for (let i = 0; i < all.length; i += 1) {
        const piece = all[i];
        if (!piece.id || !piece.name)
            errors.push(`${dish.name} 有空原料`);
        if (ids[piece.id])
            errors.push(`${dish.name} 原料 ${piece.id} 重复`);
        ids[piece.id] = true;
    }
}
function checkPhases(dish, errors) {
    if (!dish.phases.length) {
        errors.push(`${dish.name} 没有火候段`);
        return;
    }
    let prev = 0;
    for (let i = 0; i < dish.phases.length; i += 1) {
        const phase = dish.phases[i];
        if (phase.want !== 'toss' && phase.want !== 'hold')
            errors.push(`${dish.name} 火候段意图不对`);
        if (!(phase.until > prev) || phase.until > 1)
            errors.push(`${dish.name} 火候段没有往前走`);
        if (phase.evenPerSec < 0 || phase.burnPerSec < 0 || phase.idleBurnPerSec < 0) {
            errors.push(`${dish.name} 火候数字是负的`);
        }
        if (!phase.hint)
            errors.push(`${dish.name} 火候段没有提示`);
        prev = phase.until;
    }
    const last = dish.phases[dish.phases.length - 1];
    if (Math.abs(last.until - 1) > 0.001)
        errors.push(`${dish.name} 最后一段没盖到出锅`);
}
function checkDrops(dish, errors) {
    for (let i = 0; i < dish.drops.length; i += 1) {
        const drop = dish.drops[i];
        if (!(drop.at > 0) || drop.at >= 1)
            errors.push(`${dish.name} 下料点不在锅里`);
        if (!(drop.window > 0) || drop.window > 0.25)
            errors.push(`${dish.name} 下料窗口不合理`);
        if (!drop.label)
            errors.push(`${dish.name} 下料没有名字`);
    }
}
function countChars(text) {
    return Array.from(text).length;
}
