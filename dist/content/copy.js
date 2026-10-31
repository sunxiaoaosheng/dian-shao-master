"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATING_NAME = exports.COPY = void 0;
exports.ratingLabel = ratingLabel;
exports.clearLine = clearLine;
exports.todayLine = todayLine;
exports.windowLine = windowLine;
exports.clockLabel = clockLabel;
/** 玩家能看见的句子。厨房口吻，不往系统设置页指。 */
exports.COPY = {
    title: '颠勺王',
    subtitle: '今晚六桌',
    album: '菜册',
    back: '回灶台',
    accept: '接单',
    toss: '手动颠勺',
    plate: '出锅',
    next: '下一单',
    retry: '再做这道',
    share: '把这张手账给同乡（自愿）',
    save: '保存手账',
    shareOk: '手账送出去了',
    shareFail: '分享没完成',
    saveOk: '手账已存进相册',
    saveFail: '没存成',
    sensorLive: '握紧手机，该颠时向上颠一下',
    sensorDeaf: '没收到晃动数据，先用手动颠勺',
    sensorFallback: '这台设备听不到晃动，用手动颠勺',
    sensorDevtools: '模拟器没有真陀螺仪，先手动颠',
    sensorPending: '正在听锅的晃动…',
    retryListen: '再听一次',
    menuShare: '颠勺王：今晚六桌你来一桌',
    emptyToday: '今日最佳还没有',
    emptyWindow: '橱窗还空着',
    prepHint: '点对这道菜要的料。点错会扣。',
    orderHint: '客人只等这一会儿。',
    cookHint: '看均匀和糊边，不是数颠了几下。',
    teachOrder: '先接这一单。客人点了名，时限写在上面。',
    teachPrep: '只点这道菜要的料。点错三次，这单就得重做。',
    teachCook: '字说「颠」的时候再颠。字说「停」还猛颠，糊边会涨。',
    journalNote: '手账在这一页，分享自愿，也可以存进相册。',
    clearTitle: '六桌都过了',
    clearBody: '今晚这六桌，你都至少做出了及格的一盘。',
    failTimeout: '这单超时了，可以免费重做。',
    failBurn: '糊边过了，这盘不算，可以免费重做。',
    failPrep: '料点岔了，这盘不算，可以免费重做。',
    kept: '这盘记进最高分了。',
    skipped: '没有盖过这道菜的最高分。',
    locked: '前三道都及格后才开',
};
exports.RATING_NAME = {
    wreck: '翻车',
    pass: '及格',
    sign: '招牌',
    god: '神菜',
};
function ratingLabel(rating) {
    return exports.RATING_NAME[rating];
}
function clearLine(done, total) {
    return `通关 ${done}/${total}`;
}
function todayLine(score, dishName) {
    if (score <= 0 || !dishName)
        return exports.COPY.emptyToday;
    return `今日最佳 ${score} · ${dishName}`;
}
function windowLine(rating, dishName, score) {
    if (!rating || !dishName)
        return exports.COPY.emptyWindow;
    return `橱窗 ${ratingLabel(rating)} · ${dishName} ${score}`;
}
function clockLabel(ms) {
    const sec = Math.max(0, Math.ceil(ms / 1000));
    return `${sec} 秒`;
}
