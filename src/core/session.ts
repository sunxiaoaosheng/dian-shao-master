import { advanceBurn } from './burn';
import { countEmpty, createGrid, emptyIndices, emptyPiece } from './grid';
import { resolveMerges } from './merge';
import { mulberry32 } from './rng';
import type { FailReason, GameEvent, Piece, Rng } from './types';
import type { HeatProfile } from '../meta/difficulty';

export interface Session {
  recipeId: string;
  maxLevel: number;
  cols: number;
  rows: number;
  cells: Piece[];
  meter: number;
  charges: number;
  maxCharges: number;
  spawnLeftMs: number;
  spawnIntervalMs: number;
  spawnFloor: number;
  overflowLeftMs: number | null;
  status: 'playing' | FailReason;
  score: number;
  merges: number;
  cardsThisRun: number;
  plated: number;
  nextId: number;
  nextLevel: number;
  heatId: HeatProfile['id'];
  hint: boolean;
  passivePerSec: number;
  cookScale: number;
  baseBurnMs: number;
  burnPerLevelMs: number;
  burnChunk: number;
  tossRelief: number;
  heatRampEvery: number;
  level2Chance: number;
  warned: boolean;
  signatureGranted: boolean;
  tossLockMs: number;
  tossCount: number;
  elapsedMs: number;
  rng: Rng;
}

export interface ActionResult {
  ok: boolean;
  reason?: 'occupied' | 'over' | 'bad_index' | 'empty' | 'lock';
  events: GameEvent[];
}

const OVERFLOW_MS = 1500;

export function createSession(opts: {
  recipeId: string;
  maxLevel: number;
  profile: HeatProfile;
  seed: number;
}): Session {
  const profile = opts.profile;
  const cols = profile.cols;
  const rows = profile.rows;
  const cells = createGrid(cols, rows);
  const starter = Math.floor((cols * rows) / 2);
  cells[starter] = { id: 1, level: 1, cookMs: 0, burnt: false };

  const session: Session = {
    recipeId: opts.recipeId,
    maxLevel: Math.max(2, opts.maxLevel),
    cols,
    rows,
    cells,
    meter: 0,
    charges: profile.tossCharges,
    maxCharges: profile.tossCharges,
    spawnLeftMs: profile.spawnIntervalMs,
    spawnIntervalMs: profile.spawnIntervalMs,
    spawnFloor: profile.spawnFloor,
    overflowLeftMs: null,
    status: 'playing',
    score: 0,
    merges: 0,
    cardsThisRun: 0,
    plated: 0,
    nextId: 2,
    nextLevel: 1,
    heatId: profile.id,
    hint: profile.hint,
    passivePerSec: profile.passivePerSec,
    cookScale: profile.cookScale,
    baseBurnMs: profile.baseBurnMs,
    burnPerLevelMs: profile.burnPerLevelMs,
    burnChunk: profile.burnChunk,
    tossRelief: profile.tossRelief,
    heatRampEvery: profile.heatRampEvery,
    level2Chance: profile.level2Chance,
    warned: false,
    signatureGranted: false,
    tossLockMs: 0,
    tossCount: 0,
    elapsedMs: 0,
    rng: mulberry32(opts.seed || 1),
  };
  return session;
}

export function place(session: Session, index: number): ActionResult {
  if (session.status !== 'playing') return { ok: false, reason: 'over', events: [] };
  if (index < 0 || index >= session.cells.length) return { ok: false, reason: 'bad_index', events: [] };
  if (session.cells[index].level > 0) return { ok: false, reason: 'occupied', events: [] };

  putPiece(session, index, rollSpawnLevel(session));
  rollNext(session);
  return { ok: true, events: absorb(session, index) };
}

export function tick(session: Session, dtMs: number): GameEvent[] {
  if (session.status !== 'playing') return [];
  const dt = Math.max(0, Math.min(100, dtMs));
  const events: GameEvent[] = [];
  session.elapsedMs += dt;
  if (session.tossLockMs > 0) session.tossLockMs = Math.max(0, session.tossLockMs - dt);

  const burn = advanceBurn(session.cells, {
    dtMs: dt,
    cookScale: session.cookScale,
    baseBurnMs: session.baseBurnMs,
    burnPerLevelMs: session.burnPerLevelMs,
    burnChunk: session.burnChunk,
    passivePerSec: session.passivePerSec,
  });
  session.cells = burn.cells;
  if (burn.newlyBurnt > 0) events.push({ type: 'burnt_piece' });
  session.meter = clampMeter(session.meter + burn.meterDelta);
  if (!session.warned && session.meter >= 75) {
    session.warned = true;
    events.push({ type: 'burn_warn' });
  }
  if (session.meter >= 100) {
    session.meter = 100;
    session.status = 'burnt_out';
    events.push({ type: 'fail', reason: 'burnt_out' });
    return events;
  }

  if (session.overflowLeftMs !== null) {
    session.overflowLeftMs -= dt;
    if (countEmpty(session.cells) > 0) {
      session.overflowLeftMs = null;
    } else if (session.overflowLeftMs <= 0) {
      session.status = 'grid_full';
      events.push({ type: 'fail', reason: 'grid_full' });
      return events;
    }
  }

  session.spawnLeftMs -= dt;
  let spawned = 0;
  while (session.spawnLeftMs <= 0 && spawned < 3 && session.status === 'playing') {
    session.spawnLeftMs += session.spawnIntervalMs;
    spawned += 1;
    const index = spawnIntoEmpty(session);
    if (index === null) {
      if (session.charges > 0) {
        if (session.overflowLeftMs === null) {
          session.overflowLeftMs = OVERFLOW_MS;
          events.push({ type: 'overflow' });
        }
      } else {
        session.status = 'grid_full';
        events.push({ type: 'fail', reason: 'grid_full' });
      }
      break;
    }
    const merged = absorb(session, index);
    for (let i = 0; i < merged.length; i += 1) events.push(merged[i]);
  }

  return events;
}

/** 颠勺救援：糊块扔出锅，剩下的重新落位，火候回一截。次数用完就不再救援。 */
export function applyToss(session: Session): ActionResult {
  if (session.status !== 'playing') return { ok: false, reason: 'over', events: [] };
  if (session.charges <= 0) return { ok: false, reason: 'empty', events: [] };
  if (session.tossLockMs > 0) return { ok: false, reason: 'lock', events: [] };

  const kept: Piece[] = [];
  for (let i = 0; i < session.cells.length; i += 1) {
    const cell = session.cells[i];
    if (cell.level > 0 && !cell.burnt) {
      kept.push({
        id: cell.id,
        level: cell.level,
        cookMs: cell.cookMs * 0.35,
        burnt: false,
      });
    }
  }

  const spots: number[] = [];
  for (let i = 0; i < session.cells.length; i += 1) spots.push(i);
  for (let i = spots.length - 1; i > 0; i -= 1) {
    const j = Math.floor(session.rng() * (i + 1));
    const tmp = spots[i];
    spots[i] = spots[j];
    spots[j] = tmp;
  }

  const fresh = createGrid(session.cols, session.rows);
  for (let k = 0; k < kept.length; k += 1) fresh[spots[k]] = kept[k];
  session.cells = fresh;
  session.charges -= 1;
  session.tossCount += 1;
  session.meter = clampMeter(session.meter - session.tossRelief);
  session.tossLockMs = 280;
  session.score += 15;
  if (session.meter < 60) session.warned = false;
  if (countEmpty(fresh) > 0) session.overflowLeftMs = null;

  return { ok: true, events: absorb(session, -1) };
}

export function overflowRatio(session: Session): number | null {
  if (session.overflowLeftMs === null) return null;
  const ratio = session.overflowLeftMs / OVERFLOW_MS;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return ratio;
}

function absorb(session: Session, anchor: number): GameEvent[] {
  const resolved = resolveMerges(session.cells, session.cols, session.rows, session.maxLevel, anchor);
  session.cells = resolved.cells;
  session.score += resolved.scoreGained;
  const before = session.merges;
  session.merges += resolved.mergeCount;
  session.plated += resolved.plated;
  if (session.heatRampEvery > 0 && resolved.mergeCount > 0) {
    const step = session.heatRampEvery;
    if (Math.floor(session.merges / step) > Math.floor(before / step)) {
      session.spawnIntervalMs = Math.max(session.spawnFloor, Math.round(session.spawnIntervalMs * 0.88));
      session.passivePerSec *= 1.12;
      session.cookScale *= 1.08;
    }
  }

  const events: GameEvent[] = [];
  for (let i = 0; i < resolved.events.length; i += 1) {
    const event = resolved.events[i];
    if (event.type !== 'signature') {
      events.push(event);
      continue;
    }
    if (session.signatureGranted) continue;
    session.signatureGranted = true;
    session.cardsThisRun += 1;
    events.push(event);
  }
  return events;
}

function spawnIntoEmpty(session: Session): number | null {
  const open = emptyIndices(session.cells);
  if (!open.length) return null;
  const index = open[Math.floor(session.rng() * open.length)];
  putPiece(session, index, rollSpawnLevel(session));
  rollNext(session);
  return index;
}

function putPiece(session: Session, index: number, level: number): void {
  session.cells[index] = {
    id: session.nextId,
    level,
    cookMs: 0,
    burnt: false,
  };
  session.nextId += 1;
}

function rollSpawnLevel(session: Session): number {
  return session.nextLevel;
}

function rollNext(session: Session): void {
  const cap = Math.max(1, session.maxLevel - 1);
  let level = 1;
  if (session.rng() < session.level2Chance) level = 2;
  if (level > cap) level = cap;
  session.nextLevel = level;
}

function clampMeter(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function clearCell(session: Session, index: number): void {
  session.cells[index] = emptyPiece();
}
