import type { SensitivityTier } from '../input/gyro';
import type { HeatId } from '../meta/difficulty';

/** 所有玩家能看见的句子都放这里，方便对着厨房口吻改，也方便测试挡住跑题的词。 */
export const COPY = {
  title: '颠勺王',
  subtitle: '同级食材挨在一起，就颠成下一味',
  start: '开炒',
  album: '招牌菜册',
  back: '回灶台',
  again: '再炒一锅',
  shareButton: '给同乡看一眼（自愿，再领一锅）',
  shareHome: '自愿分享，多一锅',
  saveClip: '保存这一颠（9:16）',
  adButton: '看火候广告再领一锅（待接）',
  toss: '手动颠勺',
  noPlays: '今天的免费锅用完了',
  playsHint: '每天 3 锅免费。分享自愿，不分享也能明天再来。',
  hint: '点空位下锅。上下左右同级、还没糊的，并成下一味。斜着不算。',
  sensorLive: '握紧手机，向上颠一下',
  sensorFallback: '没拿到晃动权限，用手动颠勺',
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
  boardTitle: '各地灶口（本地示例）',
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

export const HEAT_NAME: Record<HeatId, string> = {
  tutorial: '试火',
  simmer: '小火',
  stir: '中火',
  hell: '地狱火',
};

export const TIER_NAME: Record<SensitivityTier, string> = {
  gentle: COPY.tierGentle,
  standard: COPY.tierStandard,
  fierce: COPY.tierFierce,
};

export function playsLeftLabel(n: number): string {
  return `今天还能炒 ${n} 锅`;
}

export function heatStart(name: string): string {
  return `这锅是${name}`;
}

export function cardBody(name: string): string {
  return `招牌「${name}」夹进手账了。`;
}

export function cardToast(name: string): string {
  return `招牌「${name}」进手账了`;
}

export function scoreLabel(n: number): string {
  return `${n} 分`;
}

export function chargesLabel(n: number): string {
  return `还能颠 ${n} 下`;
}

export function tossedLabel(n: number): string {
  return `这锅颠了 ${n} 下`;
}

export function roundRecap(seconds: number, merges: number, tosses: number): string {
  return `这口 ${seconds} 秒，合成 ${merges} 次，颠了 ${tosses} 下`;
}

export function cooldownLabel(tierName: string, waitMs: number): string {
  const sec = (Math.max(0, waitMs) / 1000).toFixed(1);
  return `${tierName}手感，还要等 ${sec} 秒`;
}

export function pickLine(lines: readonly string[], seed: number): string {
  if (!lines.length) return '';
  const i = Math.abs(Math.floor(seed)) % lines.length;
  return lines[i];
}
