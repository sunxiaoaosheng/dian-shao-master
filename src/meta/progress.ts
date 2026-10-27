import type { SensitivityTier } from '../input/gyro';

export interface MetaState {
  runsCompleted: number;
  tier: SensitivityTier;
}

export function defaultMeta(): MetaState {
  return { runsCompleted: 0, tier: 'standard' };
}

export function parseMeta(raw: string | null): MetaState {
  if (!raw) return defaultMeta();
  try {
    const value = JSON.parse(raw) as Partial<MetaState>;
    const runs = typeof value.runsCompleted === 'number' && value.runsCompleted > 0
      ? Math.floor(value.runsCompleted)
      : 0;
    return { runsCompleted: runs, tier: normalizeTier(value.tier) };
  } catch {
    return defaultMeta();
  }
}

export function serializeMeta(state: MetaState): string {
  return JSON.stringify(state);
}

function normalizeTier(value: unknown): SensitivityTier {
  if (value === 'gentle' || value === 'standard' || value === 'fierce') return value;
  return 'standard';
}
