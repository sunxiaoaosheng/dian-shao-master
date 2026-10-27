/**
 * 地区灶口榜。形状对齐 wx.cloud.callFunction({ name, data })。
 * BOARD_ENABLED 关掉时不请求，也不填示例名。
 * TODO(owner)：云函数 regionalBoard 能返回 { list: [{ region, chef, dish, heat }] } 后，把 BOARD_ENABLED 改成 true。
 */

export const BOARD_ENABLED = false;
export const BOARD_FUNCTION_NAME = 'regionalBoard';

export interface BoardEntry {
  region: string;
  chef: string;
  dish: string;
  heat: number;
}

export type CloudCall = (name: string, data?: Record<string, unknown>) => Promise<unknown>;

export function readBoard(result: unknown): BoardEntry[] {
  let rows: unknown[] = [];
  if (Array.isArray(result)) rows = result;
  else if (result && typeof result === 'object' && Array.isArray((result as { list?: unknown }).list)) {
    rows = (result as { list: unknown[] }).list;
  }
  const out: BoardEntry[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || typeof row !== 'object') continue;
    const item = row as { region?: unknown; chef?: unknown; dish?: unknown; heat?: unknown };
    if (typeof item.region !== 'string' || typeof item.dish !== 'string') continue;
    out.push({
      region: item.region,
      chef: typeof item.chef === 'string' ? item.chef : '',
      dish: item.dish,
      heat: typeof item.heat === 'number' ? item.heat : 0,
    });
  }
  return out;
}

/** 开关关掉或没有云函数时直接空列表，不会去调用 call。 */
export function fetchRegionalBoard(call: CloudCall | null): Promise<BoardEntry[]> {
  if (!BOARD_ENABLED || !call) return Promise.resolve([]);
  return call(BOARD_FUNCTION_NAME, {}).then((result) => readBoard(result)).catch(() => []);
}
