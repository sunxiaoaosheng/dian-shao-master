"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_NAME = exports.HEAT_NAME = exports.COPY = void 0;
exports.playsLeftLabel = playsLeftLabel;
exports.heatStart = heatStart;
exports.heatGoal = heatGoal;
exports.nextPotLine = nextPotLine;
exports.againLabel = againLabel;
exports.restartLine = restartLine;
exports.goalProgressLine = goalProgressLine;
exports.burnWarnLine = burnWarnLine;
exports.tossFeelLine = tossFeelLine;
exports.tossAck = tossAck;
exports.cardBody = cardBody;
exports.cardToast = cardToast;
exports.scoreLabel = scoreLabel;
exports.chargesLabel = chargesLabel;
exports.tossedLabel = tossedLabel;
exports.roundRecap = roundRecap;
exports.cooldownLabel = cooldownLabel;
exports.pickLine = pickLine;
const gyro_1 = require("../input/gyro");
const difficulty_1 = require("../meta/difficulty");
/** 所有玩家能看见的句子都放这里，方便对着厨房口吻改，也方便测试挡住跑题的词。 */
exports.COPY = {
    title: '颠勺王',
    subtitle: '同级食材挨在一起，就颠成下一味',
    start: '开炒',
    album: '招牌菜册',
    back: '回灶台',
    again: '再炒一锅',
    shareButton: '给同乡看一眼（自愿，再领一锅）',
    shareHome: '自愿分享，多一锅',
    saveClip: '保存这一颠（9:16）',
    adButton: '看火候广告再领一锅',
    toss: '手动颠勺',
    noPlays: '今天的免费锅用完了',
    playsHint: '每天 3 锅免费。分享自愿，不分享也能明天再来。',
    hint: '点空位下锅。上下左右同级、还没糊的，并成下一味。斜着不算。',
    sensorLive: '握紧手机，向上颠一下',
    sensorFallback: '这台设备听不到晃动，用手动颠勺',
    sensorNeedAuth: '需要运动与方向权限才能颠勺',
    motionSetting: '去设置',
    sensorDevtools: '模拟器没有真陀螺仪，先手动颠',
    sensorPending: '正在听锅的晃动…',
    tossSoon: '勺还在空中',
    noCharges: '这锅的颠勺次数用完了',
    shareOk: '多给你一锅，谢了',
    shareCap: '今天的分享加锅到顶了',
    shareFail: '分享没完成，锅数没变',
    adPending: '激励视频位还没接上',
    adSkip: '广告没看完，锅数没变',
    adOk: '广告看完了，多一锅',
    saveOk: '这一颠已存进相册',
    saveFail: '没存成，检查一下相册权限',
    burnFailTitle: '糊锅了',
    fullFailTitle: '锅满了',
    burnFailBody: '红油漫过锅沿，这口收了。',
    fullFailBody: '锅里挤得颠不开，这口收了。',
    noCardBody: '这锅还没颠出招牌。',
    overflow: '要溢出来了，快颠！',
    plate: '装盘出锅了',
    warn: '要糊了，颠一下',
    burntPiece: '有一块糊边了',
    tierTitle: '颠勺手感',
    boardTitle: '各地灶口',
    boardOff: '各地灶口还没接上。',
    albumTitle: '招牌菜册',
    albumEmpty: '还没颠出来',
    meter: '火候',
    next: '下一手下锅',
    qaOn: '验收角标开了',
    qaOff: '验收角标关了',
    menuShare: '颠勺王：今晚这口锅你来',
    seal: '勺',
    mergeLines: ['并成一味了', '火候叠上了', '香气拢到一块儿'],
    tossLines: ['颠起来了！', '锅气回来了', '糊味散了'],
    tierGentle: '轻颠',
    tierStandard: '家常',
    tierFierce: '猛火',
};
exports.HEAT_NAME = {
    tutorial: '试火',
    simmer: '小火',
    stir: '中火',
    hell: '地狱火',
};
exports.TIER_NAME = {
    gentle: exports.COPY.tierGentle,
    standard: exports.COPY.tierStandard,
    fierce: exports.COPY.tierFierce,
};
function playsLeftLabel(n) {
    return `今天还能炒 ${n} 锅`;
}
function heatStart(name) {
    return `这锅是${name}`;
}
function heatGoal(id, cols, rows, charges) {
    if (id === 'tutorial') {
        const seconds = Math.round(difficulty_1.GRADUATION_MS / 1000);
        return `出师：合成 ${difficulty_1.GRADUATION_MERGES} 次，或撑过 ${seconds} 秒。否则下一锅仍是试火。`;
    }
    return `${exports.HEAT_NAME[id]}：${cols}×${rows} 锅，还能颠 ${charges} 下。落子和糊边都比上一火赶。`;
}
function nextPotLine(graduated, heatName) {
    if (graduated)
        return `下一锅是${heatName}，火更赶。`;
    return `这口还没出师，再炒仍是${heatName}。`;
}
function againLabel(graduated, heatName) {
    if (graduated)
        return `炒下一火 · ${heatName}`;
    return `再试这一火 · ${heatName}`;
}
function restartLine(playsLeft, graduated, heatName, shareLeft = 0) {
    if (playsLeft > 0)
        return nextPotLine(graduated, heatName);
    if (shareLeft > 0)
        return '今天的免费锅用完了。自愿分享可以再领一锅，也可以明天再来。';
    return '今天的锅和分享加锅都用完了。回灶台，明天再来。';
}
function goalProgressLine(progress) {
    const heatName = exports.HEAT_NAME[progress.heatId];
    const nextName = exports.HEAT_NAME[progress.nextHeatId];
    const aheadName = exports.HEAT_NAME[progress.aheadHeatId];
    const needSec = Math.round(progress.needMs / 1000);
    const sec = Math.min(needSec, Math.floor(progress.elapsedMs / 1000));
    if (progress.heatId === 'tutorial' && !progress.graduated) {
        return `出师 ${progress.merges}/${progress.needMerges}·${sec}/${needSec}秒。下一火是${aheadName}，未出师仍是${nextName}。`;
    }
    if (progress.heatId === 'tutorial') {
        return `出师了。收锅后下一火是${nextName}。`;
    }
    if (progress.graduated) {
        return `${heatName}这口算过。收锅后下一火是${nextName}。`;
    }
    return `${heatName}未过。下一火才是${aheadName}，现在收锅仍是${heatName}。`;
}
function burnWarnLine(kind) {
    if (kind === 'pot')
        return '火候要满了，颠一下';
    if (kind === 'piece')
        return '有一块快糊边';
    return '';
}
function tossFeelLine(tier) {
    const sec = ((0, gyro_1.tossFeel)(tier).cooldownMs / 1000).toFixed(1);
    return `${exports.TIER_NAME[tier]}：冷却 ${sec} 秒`;
}
function tossAck(tier) {
    return `${exports.TIER_NAME[tier]}认下了`;
}
function cardBody(name) {
    return `招牌「${name}」夹进手账了。`;
}
function cardToast(name) {
    return `招牌「${name}」进手账了`;
}
function scoreLabel(n) {
    return `${n} 分`;
}
function chargesLabel(n) {
    return `还能颠 ${n} 下`;
}
function tossedLabel(n) {
    return `这锅颠了 ${n} 下`;
}
function roundRecap(seconds, merges, tosses) {
    return `这口 ${seconds} 秒，合成 ${merges} 次，颠了 ${tosses} 下`;
}
function cooldownLabel(tierName, waitMs) {
    const sec = (Math.max(0, waitMs) / 1000).toFixed(1);
    return `${tierName}手感，还要等 ${sec} 秒`;
}
function pickLine(lines, seed) {
    if (!lines.length)
        return '';
    const i = Math.abs(Math.floor(seed)) % lines.length;
    return lines[i];
}
