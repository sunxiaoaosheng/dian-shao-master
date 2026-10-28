/** 六道菜的配置表。玩法只读这里，不要在场景里再写一套菜名或曲线。 */

export type DishId =
  | 'fanqie'
  | 'youmai'
  | 'chaofan'
  | 'yuxiang'
  | 'gongbao'
  | 'yangrou';

export type Gate = 'open' | 'back';
export type Want = 'toss' | 'hold';
export type DropKind = 'drop' | 'starch' | 'late';

export interface Ingredient {
  id: string;
  name: string;
  ink: string;
}

export interface CookPhase {
  /** 本段结束时，炒制进度 0–1。最后一段必须是 1。 */
  until: number;
  want: Want;
  evenPerSec: number;
  burnPerSec: number;
  idleBurnPerSec: number;
  hint: string;
}

export interface DropCue {
  id: string;
  /** 进度 0–1 */
  at: number;
  /** 窗口半宽，也是进度 */
  window: number;
  label: string;
  kind: DropKind;
}

export interface Dish {
  id: DishId;
  name: string;
  region: string;
  style: string;
  gate: Gate;
  /** 出锅一句，不超过 30 字。 */
  science: string;
  album: string;
  quips: { wreck: string; pass: string; sign: string; god: string };
  orderSeconds: number;
  /** 1 是标准。小于 1 更赶。 */
  pace: number;
  taboo: string | null;
  prepSeconds: number;
  need: Ingredient[];
  decoys: Ingredient[];
  /** 忌口时多放上来、点了算错的那一块。 */
  tabooPiece: Ingredient | null;
  cookSeconds: number;
  phases: CookPhase[];
  drops: DropCue[];
}

const EGG: Ingredient = { id: 'egg', name: '鸡蛋', ink: '#e3b23c' };
const TOMATO: Ingredient = { id: 'tomato', name: '番茄', ink: '#c4452d' };
const SCALLION: Ingredient = { id: 'scallion', name: '葱', ink: '#3f7d45' };
const PEPPER: Ingredient = { id: 'pepper', name: '干辣椒', ink: '#8d2b1c' };
const POTATO: Ingredient = { id: 'potato', name: '土豆', ink: '#c4a574' };
const GARLIC: Ingredient = { id: 'garlic', name: '蒜', ink: '#f3e6cf' };
const LETTUCE: Ingredient = { id: 'lettuce', name: '油麦菜', ink: '#3f7d45' };
const RICE: Ingredient = { id: 'rice', name: '米饭', ink: '#f6efe2' };

/** 今晚六桌。配置还没齐的时候，主页分母也按六算。 */
export const SERVICE_COUNT = 6;

export const DISHES: readonly Dish[] = [
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
  {
    id: 'youmai',
    name: '蒜蓉油麦菜',
    region: '粤',
    style: '大火快颠，断生即出',
    gate: 'open',
    science: '油麦菜断生就出，多颠几下叶子会塌、会黄。',
    album: '粤式快手：蒜片先下，油麦菜跟着下，大火颠到叶子刚软就出。停在锅里会出汤，颜色发暗。',
    quips: {
      wreck: '叶子塌了，蒜也糊了。',
      pass: '断生了，还是脆的。',
      sign: '这碟青菜能上台。',
      god: '火候卡在刚好断生。',
    },
    orderSeconds: 12,
    pace: 0.85,
    taboo: null,
    prepSeconds: 14,
    need: [GARLIC, LETTUCE],
    decoys: [POTATO],
    tabooPiece: PEPPER,
    cookSeconds: 9,
    phases: [
      { until: 0.72, want: 'toss', evenPerSec: 24, burnPerSec: 36, idleBurnPerSec: 14, hint: '颠：大火快颠，求断生' },
      { until: 1, want: 'hold', evenPerSec: 6, burnPerSec: 70, idleBurnPerSec: 4, hint: '停：马上出，再颠就糊' },
    ],
    drops: [
      { id: 'garlic-in', at: 0.12, window: 0.08, label: '下蒜', kind: 'drop' },
      { id: 'lettuce-in', at: 0.28, window: 0.08, label: '下油麦菜', kind: 'drop' },
    ],
  },
  {
    id: 'chaofan',
    name: '扬州炒饭',
    region: '淮扬',
    style: '颠匀，粒粒分明',
    gate: 'open',
    science: '饭粒要先散开再下蛋，葱花留到最后。',
    album: '淮扬主食：隔夜饭下锅颠散，蛋液沿着锅边走，饭粒分开后再下葱。一直闷着会结块。',
    quips: {
      wreck: '饭结块了。',
      pass: '粒粒还分得开。',
      sign: '这锅饭能上桌。',
      god: '粒粒分明，葱香刚到。',
    },
    orderSeconds: 16,
    pace: 1,
    taboo: null,
    prepSeconds: 18,
    need: [RICE, EGG, SCALLION],
    decoys: [POTATO],
    tabooPiece: PEPPER,
    cookSeconds: 14,
    phases: [
      { until: 0.22, want: 'toss', evenPerSec: 18, burnPerSec: 32, idleBurnPerSec: 8, hint: '颠：先把饭粒颠散' },
      { until: 0.38, want: 'hold', evenPerSec: 4, burnPerSec: 36, idleBurnPerSec: 2, hint: '停：让蛋沿锅边走' },
      { until: 0.62, want: 'toss', evenPerSec: 16, burnPerSec: 30, idleBurnPerSec: 7, hint: '颠：饭和蛋要分开' },
      { until: 0.76, want: 'hold', evenPerSec: 4, burnPerSec: 34, idleBurnPerSec: 2, hint: '停：别把饭颠糊' },
      { until: 0.92, want: 'toss', evenPerSec: 14, burnPerSec: 28, idleBurnPerSec: 6, hint: '颠：葱花下了，颠匀' },
      { until: 1, want: 'hold', evenPerSec: 3, burnPerSec: 40, idleBurnPerSec: 2, hint: '停：出锅' },
    ],
    drops: [
      { id: 'rice-in', at: 0.1, window: 0.08, label: '下米饭', kind: 'drop' },
      { id: 'egg-in', at: 0.32, window: 0.07, label: '下蛋液', kind: 'drop' },
      { id: 'scallion-in', at: 0.84, window: 0.07, label: '下葱花', kind: 'late' },
    ],
  },
];

export function phaseAt(dish: Dish, progress: number): CookPhase {
  const p = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  for (let i = 0; i < dish.phases.length; i += 1) {
    if (p <= dish.phases[i].until) return dish.phases[i];
  }
  return dish.phases[dish.phases.length - 1];
}

export function dishById(id: string): Dish | null {
  for (let i = 0; i < DISHES.length; i += 1) {
    if (DISHES[i].id === id) return DISHES[i];
  }
  return null;
}

export function validateDishes(dishes: readonly Dish[]): string[] {
  const errors: string[] = [];
  const seen: Record<string, boolean> = {};
  for (let i = 0; i < dishes.length; i += 1) {
    const dish = dishes[i];
    if (seen[dish.id]) errors.push(`${dish.id} 重复`);
    seen[dish.id] = true;
    if (!dish.name) errors.push(`${dish.id} 没有菜名`);
    if (countChars(dish.science) > 30) errors.push(`${dish.name} 科普超过 30 字`);
    if (countChars(dish.science) < 4) errors.push(`${dish.name} 科普太短`);
    if (dish.orderSeconds < 5 || dish.prepSeconds < 5 || dish.cookSeconds < 5) {
      errors.push(`${dish.name} 时限太短`);
    }
    if (!(dish.pace > 0)) errors.push(`${dish.name} 节奏不对`);
    if (!dish.need.length) errors.push(`${dish.name} 没有原料`);
    checkPieces(dish, errors);
    checkPhases(dish, errors);
    checkDrops(dish, errors);
  }
  return errors;
}

function checkPieces(dish: Dish, errors: string[]): void {
  const ids: Record<string, boolean> = {};
  const all = dish.need.concat(dish.decoys);
  if (dish.tabooPiece) all.push(dish.tabooPiece);
  for (let i = 0; i < all.length; i += 1) {
    const piece = all[i];
    if (!piece.id || !piece.name) errors.push(`${dish.name} 有空原料`);
    if (ids[piece.id]) errors.push(`${dish.name} 原料 ${piece.id} 重复`);
    ids[piece.id] = true;
  }
}

function checkPhases(dish: Dish, errors: string[]): void {
  if (!dish.phases.length) {
    errors.push(`${dish.name} 没有火候段`);
    return;
  }
  let prev = 0;
  for (let i = 0; i < dish.phases.length; i += 1) {
    const phase = dish.phases[i];
    if (phase.want !== 'toss' && phase.want !== 'hold') errors.push(`${dish.name} 火候段意图不对`);
    if (!(phase.until > prev) || phase.until > 1) errors.push(`${dish.name} 火候段没有往前走`);
    if (phase.evenPerSec < 0 || phase.burnPerSec < 0 || phase.idleBurnPerSec < 0) {
      errors.push(`${dish.name} 火候数字是负的`);
    }
    if (!phase.hint) errors.push(`${dish.name} 火候段没有提示`);
    prev = phase.until;
  }
  const last = dish.phases[dish.phases.length - 1];
  if (Math.abs(last.until - 1) > 0.001) errors.push(`${dish.name} 最后一段没盖到出锅`);
}

function checkDrops(dish: Dish, errors: string[]): void {
  for (let i = 0; i < dish.drops.length; i += 1) {
    const drop = dish.drops[i];
    if (!(drop.at > 0) || drop.at >= 1) errors.push(`${dish.name} 下料点不在锅里`);
    if (!(drop.window > 0) || drop.window > 0.25) errors.push(`${dish.name} 下料窗口不合理`);
    if (!drop.label) errors.push(`${dish.name} 下料没有名字`);
  }
}

function countChars(text: string): number {
  return Array.from(text).length;
}
