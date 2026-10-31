"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptySave = emptySave;
exports.formatDay = formatDay;
exports.applyPlate = applyPlate;
exports.bestOf = bestOf;
exports.passed = passed;
exports.isUnlocked = isUnlocked;
exports.clearedCount = clearedCount;
exports.showcaseOf = showcaseOf;
exports.serializeSave = serializeSave;
exports.parseSave = parseSave;
const dishes_1 = require("../content/dishes");
const score_1 = require("../cook/score");
function emptySave(nowMs) {
    return {
        plates: {},
        today: { date: formatDay(nowMs), score: 0, dishId: '' },
        tutorialDone: false,
        clearSeen: false,
    };
}
function formatDay(nowMs) {
    const d = new Date(nowMs);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const mm = m < 10 ? `0${m}` : String(m);
    const dd = day < 10 ? `0${day}` : String(day);
    return `${d.getFullYear()}-${mm}-${dd}`;
}
/** 翻车不写入。分数没有更高也不覆盖。 */
function applyPlate(save, plate, nowMs) {
    const today = rollToday(save, nowMs);
    if (!(0, score_1.isPassing)(plate.rating) || plate.score <= 0) {
        return { save: today, kept: false };
    }
    const prev = today.plates[plate.dishId];
    if (prev && prev.score >= plate.score) {
        return { save: today, kept: false };
    }
    const plates = Object.assign({}, today.plates);
    plates[plate.dishId] = {
        dishId: plate.dishId,
        score: plate.score,
        rating: plate.rating,
        at: plate.at,
    };
    let nextToday = today.today;
    if (plate.score > today.today.score) {
        nextToday = { date: today.today.date, score: plate.score, dishId: plate.dishId };
    }
    return {
        save: { plates, today: nextToday, tutorialDone: today.tutorialDone, clearSeen: today.clearSeen },
        kept: true,
    };
}
function bestOf(save, id) {
    return save.plates[id] || null;
}
function passed(save, id) {
    const plate = save.plates[id];
    return Boolean(plate && (0, score_1.isPassing)(plate.rating));
}
function isUnlocked(save, dish, catalog) {
    if (dish.gate === 'open')
        return true;
    for (let i = 0; i < catalog.length; i += 1) {
        const item = catalog[i];
        if (item.gate === 'open' && !passed(save, item.id))
            return false;
    }
    return true;
}
function clearedCount(save, catalog) {
    let n = 0;
    for (let i = 0; i < catalog.length; i += 1) {
        if (passed(save, catalog[i].id))
            n += 1;
    }
    return n;
}
function showcaseOf(save) {
    let best = null;
    const ids = Object.keys(save.plates);
    for (let i = 0; i < ids.length; i += 1) {
        const plate = save.plates[ids[i]];
        if (!plate || !(0, score_1.entersWindow)(plate.rating))
            continue;
        if (!best || plate.score > best.score)
            best = plate;
    }
    return best;
}
function serializeSave(save) {
    return JSON.stringify(save);
}
function parseSave(raw, nowMs) {
    if (!raw)
        return emptySave(nowMs);
    try {
        const value = JSON.parse(raw);
        const base = emptySave(nowMs);
        const plates = {};
        const rawPlates = value.plates || {};
        const ids = Object.keys(rawPlates);
        for (let i = 0; i < ids.length; i += 1) {
            const plate = rawPlates[ids[i]];
            if (!plate || !(0, dishes_1.dishById)(plate.dishId))
                continue;
            if (!isRating(plate.rating))
                continue;
            plates[plate.dishId] = {
                dishId: plate.dishId,
                score: clamp(plate.score),
                rating: plate.rating,
                at: typeof plate.at === 'number' ? plate.at : 0,
            };
        }
        const date = value.today && typeof value.today.date === 'string' ? value.today.date : base.today.date;
        const score = value.today ? clamp(value.today.score) : 0;
        const dishId = value.today && (0, dishes_1.dishById)(value.today.dishId) ? value.today.dishId : '';
        return rollToday({
            plates,
            today: { date, score, dishId },
            tutorialDone: Boolean(value.tutorialDone),
            clearSeen: Boolean(value.clearSeen),
        }, nowMs);
    }
    catch (_a) {
        return emptySave(nowMs);
    }
}
function rollToday(save, nowMs) {
    const date = formatDay(nowMs);
    if (save.today.date === date)
        return save;
    return {
        plates: save.plates,
        today: { date, score: 0, dishId: '' },
        tutorialDone: save.tutorialDone,
        clearSeen: save.clearSeen,
    };
}
function isRating(value) {
    return value === 'wreck' || value === 'pass' || value === 'sign' || value === 'god';
}
function clamp(value) {
    const n = typeof value === 'number' ? value : 0;
    if (!isFinite(n) || n < 0)
        return 0;
    if (n > 100)
        return 100;
    return Math.round(n);
}
