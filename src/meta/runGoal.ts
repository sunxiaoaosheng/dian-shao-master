import {
  GRADUATION_MERGES,
  GRADUATION_MS,
  didGraduate,
  pickProfile,
  type HeatId,
} from './difficulty';

/** 火候条到这里就该提醒颠勺。 */
export const BURN_WARN_METER = 75;
/** 单块熟度到这里，锅沿还没满也提醒。0 到 1。 */
export const PIECE_WARN_COOK = 0.8;

export type BurnWarnKind = 'pot' | 'piece' | 'none';

export interface GoalProgress {
  merges: number;
  needMerges: number;
  elapsedMs: number;
  needMs: number;
  cards: number;
  graduated: boolean;
  heatId: HeatId;
  /** 现在收锅会进入的火候。还没出师时就是这一口。 */
  nextHeatId: HeatId;
  /** 这一口出师之后的火候。局中用来写出目标，不等到结算才出现。 */
  aheadHeatId: HeatId;
}

export function goalProgress(opts: {
  runsCompleted: number;
  heatId: HeatId;
  merges: number;
  elapsedMs: number;
  cards: number;
}): GoalProgress {
  const graduated = didGraduate(opts.merges, opts.elapsedMs, opts.cards);
  const nextRuns = graduated ? opts.runsCompleted + 1 : opts.runsCompleted;
  return {
    merges: opts.merges,
    needMerges: GRADUATION_MERGES,
    elapsedMs: opts.elapsedMs,
    needMs: GRADUATION_MS,
    cards: opts.cards,
    graduated,
    heatId: opts.heatId,
    nextHeatId: pickProfile(nextRuns).id,
    aheadHeatId: pickProfile(opts.runsCompleted + 1).id,
  };
}

export function burnWarnKind(meter: number, hottestCook: number): BurnWarnKind {
  if (meter >= BURN_WARN_METER) return 'pot';
  if (hottestCook >= PIECE_WARN_COOK) return 'piece';
  return 'none';
}
