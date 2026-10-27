"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_AD_BONUS = exports.MAX_SHARE_BONUS = exports.TEST_APP_ID = exports.TEST_FREE_PLAYS_PER_DAY = exports.FREE_PLAYS_PER_DAY = void 0;
exports.emptyDaily = emptyDaily;
exports.formatDay = formatDay;
exports.rollDaily = rollDaily;
exports.shareSlotsLeft = shareSlotsLeft;
exports.usesTestPotQuota = usesTestPotQuota;
exports.freePlaysFor = freePlaysFor;
exports.playsRemaining = playsRemaining;
exports.canStart = canStart;
exports.resetToday = resetToday;
exports.consumePlay = consumePlay;
exports.grantShareBonus = grantShareBonus;
exports.grantAdBonus = grantAdBonus;
exports.parseDaily = parseDaily;
exports.serializeDaily = serializeDaily;
/** 每天免费开局次数。分享和广告都是额外加锅，不是开门条件。 */
exports.FREE_PLAYS_PER_DAY = 3;
/** 测试号阶段把免费锅放大，避免真机把当天次数用完后进不了局。 */
exports.TEST_FREE_PLAYS_PER_DAY = 99;
/** 当前用来真机验收的小游戏 AppID。正式号上线后再把日限收紧。 */
exports.TEST_APP_ID = 'wx2ffe6f213fe9c05b';
exports.MAX_SHARE_BONUS = 2;
exports.MAX_AD_BONUS = 1;
function emptyDaily(date) {
    return { date, playsUsed: 0, shareBonus: 0, adBonus: 0 };
}
function formatDay(nowMs) {
    const d = new Date(nowMs);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const mm = m < 10 ? `0${m}` : String(m);
    const dd = day < 10 ? `0${day}` : String(day);
    return `${d.getFullYear()}-${mm}-${dd}`;
}
function rollDaily(state, today) {
    if (state.date !== today)
        return emptyDaily(today);
    return state;
}
function shareSlotsLeft(state) {
    const left = exports.MAX_SHARE_BONUS - state.shareBonus;
    return left > 0 ? left : 0;
}
/** 开发者工具、测试 AppID，或还读不到 AppID 时，不让日限把验颠勺卡住。 */
function usesTestPotQuota(appId, devtools) {
    if (devtools)
        return true;
    if (appId === exports.TEST_APP_ID)
        return true;
    return appId.length === 0;
}
function freePlaysFor(practice) {
    return practice ? exports.TEST_FREE_PLAYS_PER_DAY : exports.FREE_PLAYS_PER_DAY;
}
function playsRemaining(state, freePlays = exports.FREE_PLAYS_PER_DAY) {
    return freePlays + state.shareBonus + state.adBonus - state.playsUsed;
}
function canStart(state, freePlays = exports.FREE_PLAYS_PER_DAY) {
    return playsRemaining(state, freePlays) > 0;
}
/** 只清今天已经用掉的锅，不改出师进度和菜册。 */
function resetToday(state) {
    return {
        date: state.date,
        playsUsed: 0,
        shareBonus: state.shareBonus,
        adBonus: state.adBonus,
    };
}
function consumePlay(state, freePlays = exports.FREE_PLAYS_PER_DAY) {
    if (!canStart(state, freePlays))
        return state;
    return {
        date: state.date,
        playsUsed: state.playsUsed + 1,
        shareBonus: state.shareBonus,
        adBonus: state.adBonus,
    };
}
/** 玩家主动分享成功后才调用。到顶就不再加，取消分享不要调这里。 */
function grantShareBonus(state) {
    if (state.shareBonus >= exports.MAX_SHARE_BONUS)
        return { state, granted: false };
    return {
        state: {
            date: state.date,
            playsUsed: state.playsUsed,
            shareBonus: state.shareBonus + 1,
            adBonus: state.adBonus,
        },
        granted: true,
    };
}
/** 激励视频完整观看后才调用。广告位未接时不要调用。 */
function grantAdBonus(state) {
    if (state.adBonus >= exports.MAX_AD_BONUS)
        return { state, granted: false };
    return {
        state: {
            date: state.date,
            playsUsed: state.playsUsed,
            shareBonus: state.shareBonus,
            adBonus: state.adBonus + 1,
        },
        granted: true,
    };
}
function parseDaily(raw) {
    if (!raw)
        return emptyDaily('1970-01-01');
    try {
        const value = JSON.parse(raw);
        if (!value || typeof value.date !== 'string')
            return emptyDaily('1970-01-01');
        return {
            date: value.date,
            playsUsed: clampCount(value.playsUsed),
            shareBonus: clampCount(value.shareBonus),
            adBonus: clampCount(value.adBonus),
        };
    }
    catch (_a) {
        return emptyDaily('1970-01-01');
    }
}
function serializeDaily(state) {
    return JSON.stringify(state);
}
function clampCount(value) {
    const n = typeof value === 'number' ? value : 0;
    if (!isFinite(n) || n < 0)
        return 0;
    return Math.floor(n);
}
