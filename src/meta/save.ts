import type { Dish, DishId } from '../content/dishes';
import { dishById } from '../content/dishes';
import type { Rating } from '../cook/score';
import { entersWindow, isPassing } from '../cook/score';

export interface PlateRecord {
  dishId: DishId;
  score: number;
  rating: Rating;
  at: number;
}

export interface SaveState {
  plates: Partial<Record<DishId, PlateRecord>>;
  today: { date: string; score: number; dishId: DishId | '' };
  tutorialDone: boolean;
  clearSeen: boolean;
}

export function emptySave(nowMs: number): SaveState {
  return {
    plates: {},
    today: { date: formatDay(nowMs), score: 0, dishId: '' },
    tutorialDone: false,
    clearSeen: false,
  };
}

export function formatDay(nowMs: number): string {
  const d = new Date(nowMs);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const mm = m < 10 ? `0${m}` : String(m);
  const dd = day < 10 ? `0${day}` : String(day);
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** 翻车不写入。分数没有更高也不覆盖。 */
export function applyPlate(
  save: SaveState,
  plate: PlateRecord,
  nowMs: number,
): { save: SaveState; kept: boolean } {
  const today = rollToday(save, nowMs);
  if (!isPassing(plate.rating) || plate.score <= 0) {
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

export function bestOf(save: SaveState, id: DishId): PlateRecord | null {
  return save.plates[id] || null;
}

export function passed(save: SaveState, id: DishId): boolean {
  const plate = save.plates[id];
  return Boolean(plate && isPassing(plate.rating));
}

export function isUnlocked(save: SaveState, dish: Dish, catalog: readonly Dish[]): boolean {
  if (dish.gate === 'open') return true;
  for (let i = 0; i < catalog.length; i += 1) {
    const item = catalog[i];
    if (item.gate === 'open' && !passed(save, item.id)) return false;
  }
  return true;
}

export function clearedCount(save: SaveState, catalog: readonly Dish[]): number {
  let n = 0;
  for (let i = 0; i < catalog.length; i += 1) {
    if (passed(save, catalog[i].id)) n += 1;
  }
  return n;
}

export function showcaseOf(save: SaveState): PlateRecord | null {
  let best: PlateRecord | null = null;
  const ids = Object.keys(save.plates);
  for (let i = 0; i < ids.length; i += 1) {
    const plate = save.plates[ids[i] as DishId];
    if (!plate || !entersWindow(plate.rating)) continue;
    if (!best || plate.score > best.score) best = plate;
  }
  return best;
}

export function serializeSave(save: SaveState): string {
  return JSON.stringify(save);
}

export function parseSave(raw: string | null, nowMs: number): SaveState {
  if (!raw) return emptySave(nowMs);
  try {
    const value = JSON.parse(raw) as Partial<SaveState>;
    const base = emptySave(nowMs);
    const plates: SaveState['plates'] = {};
    const rawPlates = value.plates || {};
    const ids = Object.keys(rawPlates);
    for (let i = 0; i < ids.length; i += 1) {
      const plate = rawPlates[ids[i] as DishId];
      if (!plate || !dishById(plate.dishId)) continue;
      if (!isRating(plate.rating)) continue;
      plates[plate.dishId] = {
        dishId: plate.dishId,
        score: clamp(plate.score),
        rating: plate.rating,
        at: typeof plate.at === 'number' ? plate.at : 0,
      };
    }
    const date = value.today && typeof value.today.date === 'string' ? value.today.date : base.today.date;
    const score = value.today ? clamp(value.today.score) : 0;
    const dishId = value.today && dishById(value.today.dishId) ? value.today.dishId : '';
    return rollToday(
      {
        plates,
        today: { date, score, dishId },
        tutorialDone: Boolean(value.tutorialDone),
        clearSeen: Boolean(value.clearSeen),
      },
      nowMs,
    );
  } catch {
    return emptySave(nowMs);
  }
}

function rollToday(save: SaveState, nowMs: number): SaveState {
  const date = formatDay(nowMs);
  if (save.today.date === date) return save;
  return {
    plates: save.plates,
    today: { date, score: 0, dishId: '' },
    tutorialDone: save.tutorialDone,
    clearSeen: save.clearSeen,
  };
}

function isRating(value: unknown): value is Rating {
  return value === 'wreck' || value === 'pass' || value === 'sign' || value === 'god';
}

function clamp(value: unknown): number {
  const n = typeof value === 'number' ? value : 0;
  if (!isFinite(n) || n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}
