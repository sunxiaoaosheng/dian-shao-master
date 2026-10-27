/** 每天免费开局次数。分享和广告都是额外加锅，不是开门条件。 */
export const FREE_PLAYS_PER_DAY = 3;
export const MAX_SHARE_BONUS = 2;
export const MAX_AD_BONUS = 1;

export interface DailyState {
  date: string;
  playsUsed: number;
  shareBonus: number;
  adBonus: number;
}

export function emptyDaily(date: string): DailyState {
  return { date, playsUsed: 0, shareBonus: 0, adBonus: 0 };
}

export function formatDay(nowMs: number): string {
  const d = new Date(nowMs);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const mm = m < 10 ? `0${m}` : String(m);
  const dd = day < 10 ? `0${day}` : String(day);
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function rollDaily(state: DailyState, today: string): DailyState {
  if (state.date !== today) return emptyDaily(today);
  return state;
}

export function shareSlotsLeft(state: DailyState): number {
  const left = MAX_SHARE_BONUS - state.shareBonus;
  return left > 0 ? left : 0;
}

export function playsRemaining(state: DailyState): number {
  return FREE_PLAYS_PER_DAY + state.shareBonus + state.adBonus - state.playsUsed;
}

export function canStart(state: DailyState): boolean {
  return playsRemaining(state) > 0;
}

export function consumePlay(state: DailyState): DailyState {
  if (!canStart(state)) return state;
  return {
    date: state.date,
    playsUsed: state.playsUsed + 1,
    shareBonus: state.shareBonus,
    adBonus: state.adBonus,
  };
}

/** 玩家主动分享成功后才调用。到顶就不再加，取消分享不要调这里。 */
export function grantShareBonus(state: DailyState): { state: DailyState; granted: boolean } {
  if (state.shareBonus >= MAX_SHARE_BONUS) return { state, granted: false };
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
export function grantAdBonus(state: DailyState): { state: DailyState; granted: boolean } {
  if (state.adBonus >= MAX_AD_BONUS) return { state, granted: false };
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

export function parseDaily(raw: string | null): DailyState {
  if (!raw) return emptyDaily('1970-01-01');
  try {
    const value = JSON.parse(raw) as Partial<DailyState>;
    if (!value || typeof value.date !== 'string') return emptyDaily('1970-01-01');
    return {
      date: value.date,
      playsUsed: clampCount(value.playsUsed),
      shareBonus: clampCount(value.shareBonus),
      adBonus: clampCount(value.adBonus),
    };
  } catch {
    return emptyDaily('1970-01-01');
  }
}

export function serializeDaily(state: DailyState): string {
  return JSON.stringify(state);
}

function clampCount(value: unknown): number {
  const n = typeof value === 'number' ? value : 0;
  if (!isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}
