export type HeatId = 'tutorial' | 'simmer' | 'stir' | 'hell';

export interface HeatProfile {
  id: HeatId;
  spawnIntervalMs: number;
  spawnFloor: number;
  baseBurnMs: number;
  burnPerLevelMs: number;
  passivePerSec: number;
  burnChunk: number;
  tossCharges: number;
  tossRelief: number;
  cols: number;
  rows: number;
  /** 0 表示这锅中途不加火。 */
  heatRampEvery: number;
  level2Chance: number;
  hint: boolean;
  cookScale: number;
}

/** 试火出师：合成够次数，或这口撑过这么久，或收了招牌。否则下一锅仍是试火。 */
export const GRADUATION_MERGES = 1;
export const GRADUATION_MS = 20000;

export function didGraduate(merges: number, elapsedMs: number, cards: number): boolean {
  return merges >= GRADUATION_MERGES || elapsedMs >= GRADUATION_MS || cards > 0;
}

/**
 * 第一锅试火很松。出师之后小火、中火、地狱火一档比一档赶。
 * 数值只放这里，玩法代码按档位读，不要在别处再写一套。
 */
export const HEAT: readonly HeatProfile[] = [
  {
    id: 'tutorial',
    spawnIntervalMs: 2600,
    spawnFloor: 2000,
    baseBurnMs: 8000,
    burnPerLevelMs: 2200,
    passivePerSec: 2.8,
    burnChunk: 12,
    tossCharges: 5,
    tossRelief: 32,
    cols: 4,
    rows: 5,
    heatRampEvery: 0,
    level2Chance: 0,
    hint: true,
    cookScale: 1,
  },
  {
    id: 'simmer',
    spawnIntervalMs: 1500,
    spawnFloor: 900,
    baseBurnMs: 6000,
    burnPerLevelMs: 1400,
    passivePerSec: 4.4,
    burnChunk: 16,
    tossCharges: 3,
    tossRelief: 22,
    cols: 4,
    rows: 5,
    heatRampEvery: 4,
    level2Chance: 0.08,
    hint: false,
    cookScale: 1,
  },
  {
    id: 'stir',
    spawnIntervalMs: 1200,
    spawnFloor: 760,
    baseBurnMs: 6000,
    burnPerLevelMs: 1000,
    passivePerSec: 4,
    burnChunk: 16,
    tossCharges: 2,
    tossRelief: 20,
    cols: 4,
    rows: 4,
    heatRampEvery: 3,
    level2Chance: 0.15,
    hint: false,
    cookScale: 1,
  },
  {
    id: 'hell',
    spawnIntervalMs: 780,
    spawnFloor: 480,
    baseBurnMs: 3800,
    burnPerLevelMs: 600,
    passivePerSec: 7,
    burnChunk: 24,
    tossCharges: 1,
    tossRelief: 14,
    cols: 4,
    rows: 4,
    heatRampEvery: 2,
    level2Chance: 0.28,
    hint: false,
    cookScale: 1,
  },
];

export function pickProfile(runsCompleted: number): HeatProfile {
  if (runsCompleted <= 0) return HEAT[0];
  if (runsCompleted === 1) return HEAT[1];
  if (runsCompleted === 2) return HEAT[2];
  return HEAT[3];
}

/**
 * 测试号和开发者工具用来验颠勺。
 * 正式档的地狱火几秒就糊，而且只有 1 次颠勺，真机还没甩起来锅已经收了。
 */
export function practiceProfile(profile: HeatProfile): HeatProfile {
  return {
    id: profile.id,
    spawnIntervalMs: Math.max(profile.spawnIntervalMs, 2200),
    spawnFloor: Math.max(profile.spawnFloor, 1600),
    baseBurnMs: Math.max(profile.baseBurnMs, 18000),
    burnPerLevelMs: Math.max(profile.burnPerLevelMs, 5000),
    passivePerSec: Math.min(profile.passivePerSec, 2),
    burnChunk: Math.min(profile.burnChunk, 6),
    tossCharges: Math.max(profile.tossCharges, 20),
    tossRelief: Math.max(profile.tossRelief, 28),
    cols: profile.cols,
    rows: profile.rows,
    heatRampEvery: 0,
    level2Chance: 0,
    hint: profile.hint,
    cookScale: 1,
  };
}
