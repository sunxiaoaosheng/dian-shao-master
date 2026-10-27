import { RECIPES, levelShort } from '../content/recipes';
import {
  COPY,
  HEAT_NAME,
  TIER_NAME,
  cardBody,
  chargesLabel,
  cooldownLabel,
  playsLeftLabel,
  roundRecap,
  scoreLabel,
  tossedLabel,
} from '../content/copy';
import { cookRatio } from '../core/burn';
import type { Session } from '../core/session';
import { overflowRatio } from '../core/session';
import type { Recipe } from '../content/recipes';
import type { SensitivityTier } from '../input/gyro';
import type { HitRect } from '../input/pointer';
import type { AlbumState } from '../meta/cards';
import type { FailReason } from '../core/types';
import type { HeatId } from '../meta/difficulty';
import type { RegionChef } from '../meta/leaderboard';
import type { AlbumCardVM, ButtonVM, ScreenId, ViewModel } from './types';

export interface ToastState {
  text: string;
  seed: number;
  born: number;
  until: number;
}

export interface ComposeInput {
  screen: ScreenId;
  width: number;
  height: number;
  safeTop: number;
  safeBottom: number;
  now: number;
  playsLeft: number;
  tier: SensitivityTier;
  heatId: HeatId;
  recipe: Recipe | null;
  session: Session | null;
  album: AlbumState;
  board: RegionChef[];
  toasts: ToastState[];
  showTossButton: boolean;
  sensorLabel: string;
  result: {
    reason: FailReason;
    score: number;
    cardName: string | null;
    seconds: number;
    merges: number;
    tosses: number;
    quip: string;
  } | null;
  /** 颠勺手感冷却还剩的毫秒。0 表示这下可以颠。 */
  tossWaitMs: number;
  shake: number;
  canSave: boolean;
  qa: { detected: number; impulse: number; angle: number; unit: string; phase: string } | null;
}

const TIERS: SensitivityTier[] = ['gentle', 'standard', 'fierce'];

export function composeView(input: ComposeInput): ViewModel {
  const vm: ViewModel = {
    width: input.width,
    height: input.height,
    now: input.now,
    shake: input.shake,
    screen: input.screen,
    title: COPY.title,
    subtitle: COPY.subtitle,
    playsLabel: playsLeftLabel(input.playsLeft),
    playsHint: COPY.playsHint,
    heatLabel: HEAT_NAME[input.heatId],
    sensorLabel: input.sensorLabel,
    buttons: [],
    hits: [],
    toasts: liveToasts(input),
    toastY: input.height * 0.62,
    board: input.board.slice(0, 4).map((row) => ({
      region: row.region,
      line: `${row.chef} · ${row.dish}`,
    })),
    boardTitle: COPY.boardTitle,
    showBoard: false,
    boardTop: 0,
    seal: null,
    play: null,
    result: null,
    album: null,
    albumTitle: COPY.albumTitle,
    qaLines: input.qa
      ? [
          `识别 ${input.qa.detected}`,
          `冲量 ${input.qa.impulse.toFixed(2)}  转角 ${input.qa.angle.toFixed(0)}°`,
          `${input.qa.unit} · ${input.qa.phase}`,
        ]
      : [],
  };

  if (input.screen === 'home') layoutHome(input, vm);
  else if (input.screen === 'play') layoutPlay(input, vm);
  else if (input.screen === 'result') layoutResult(input, vm);
  else layoutAlbum(input, vm);

  for (let i = 0; i < vm.buttons.length; i += 1) {
    const button = vm.buttons[i];
    vm.hits.push({ id: button.id, x: button.x, y: button.y, w: button.w, h: button.h });
  }
  if (vm.seal) vm.hits.push(vm.seal);
  return vm;
}

function layoutHome(input: ComposeInput, vm: ViewModel): void {
  const pad = 18;
  const bw = input.width - pad * 2;
  vm.seal = { id: 'seal', x: input.width - 72, y: input.safeTop + 16, w: 54, h: 54 };
  let y = input.safeTop + 176;
  const tw = (bw - 16) / 3;
  for (let i = 0; i < TIERS.length; i += 1) {
    const tier = TIERS[i];
    vm.buttons.push(button(`tier:${tier}`, TIER_NAME[tier], pad + i * (tw + 8), y, tw, 36, false, false, tier === input.tier));
  }
  y += 78;
  const stack = [
    { id: 'start', label: COPY.start, primary: true, disabled: input.playsLeft <= 0 },
    { id: 'share', label: COPY.shareHome, primary: false, disabled: false },
    { id: 'album', label: COPY.album, primary: false, disabled: false },
    { id: 'ad', label: COPY.adButton, primary: false, disabled: false },
  ];
  for (let i = 0; i < stack.length; i += 1) {
    const item = stack[i];
    vm.buttons.push(button(item.id, item.label, pad, y, bw, 46, item.primary, item.disabled, false));
    y += 54;
  }
  vm.toastY = Math.min(input.height * 0.72, y);
  if (y < input.height - input.safeBottom - 120) {
    vm.showBoard = true;
    vm.boardTop = y + 6;
  }
}

function layoutPlay(input: ComposeInput, vm: ViewModel): void {
  const session = input.session;
  const recipe = input.recipe;
  if (!session || !recipe) return;
  const top = input.safeTop + 8;
  const bottom = 112 + input.safeBottom;
  const gap = 6;
  const availW = input.width - 28;
  const availH = input.height - bottom - (top + 86);
  let cell = Math.floor(Math.min(
    (availW - gap * (session.cols - 1)) / session.cols,
    (availH - gap * (session.rows - 1)) / session.rows,
  ));
  if (cell > 86) cell = 86;
  if (cell < 40) cell = 40;
  const gridW = cell * session.cols + gap * (session.cols - 1);
  const gridH = cell * session.rows + gap * (session.rows - 1);
  const gx = (input.width - gridW) / 2;
  const gy = top + 86 + Math.max(0, (availH - gridH) / 2);
  const cells = [];
  for (let i = 0; i < session.cells.length; i += 1) {
    const piece = session.cells[i];
    const col = i % session.cols;
    const row = (i / session.cols) | 0;
    const x = gx + col * (cell + gap);
    const y = gy + row * (cell + gap);
    const hit: HitRect = { id: `cell:${i}`, x, y, w: cell, h: cell };
    vm.hits.push(hit);
    cells.push({
      hitId: hit.id,
      x,
      y,
      w: cell,
      h: cell,
      name: piece.level > 0 ? levelShort(recipe, piece.level) : '',
      level: piece.level,
      burnt: piece.burnt,
      cook: cookRatio(piece, session.baseBurnMs, session.burnPerLevelMs),
      seed: piece.id || i + 1,
      ink: recipe.ink,
    });
  }
  const overflow = overflowRatio(session);
  vm.play = {
    recipeName: recipe.name,
    region: recipe.region,
    scoreText: scoreLabel(session.score),
    meter: session.meter / 100,
    chargesText: chargesLabel(session.charges),
    charges: session.charges,
    maxCharges: session.maxCharges,
    tossedText: tossedLabel(session.tossCount),
    cooldownText: input.tossWaitMs > 0 ? cooldownLabel(TIER_NAME[input.tier], input.tossWaitMs) : '',
    showPerfect: session.cardsThisRun > 0,
    showBurnt: session.meter >= 85,
    cells,
    nextName: levelShort(recipe, session.nextLevel),
    nextLevel: session.nextLevel,
    nextInk: recipe.ink,
    showTossButton: input.showTossButton,
    overflowText: overflow === null ? '' : COPY.overflow,
    hint: session.hint && session.merges === 0 ? COPY.hint : '',
    wok: { x: gx - 18, y: gy - 8, w: gridW + 36, h: gridH + 22 },
    nextBox: { x: 16, y: input.height - input.safeBottom - 92, w: 68, h: 76 },
  };
  if (input.showTossButton) {
    vm.buttons.push(button(
      'toss',
      COPY.toss,
      input.width - 156,
      input.height - input.safeBottom - 70,
      140,
      46,
      true,
      session.charges <= 0,
      false,
    ));
  }
  vm.toastY = gy + gridH * 0.42;
}

function layoutResult(input: ComposeInput, vm: ViewModel): void {
  const result = input.result;
  const card = result && result.cardName ? cardBody(result.cardName) : COPY.noCardBody;
  const reason = result && result.reason === 'grid_full' ? COPY.fullFailTitle : COPY.burnFailTitle;
  const detail = result && result.reason === 'grid_full' ? COPY.fullFailBody : COPY.burnFailBody;
  const quip = result && result.quip ? result.quip : '';
  vm.result = {
    title: reason,
    body: `${detail}${quip}${card}`,
    scoreText: scoreLabel(result ? result.score : 0),
    recap: result ? roundRecap(result.seconds, result.merges, result.tosses) : '',
  };
  const pad = 18;
  const bw = input.width - pad * 2;
  let y = input.safeTop + 236;
  const stack: { id: string; label: string; primary: boolean }[] = [];
  if (input.playsLeft > 0) stack.push({ id: 'again', label: COPY.again, primary: true });
  if (input.canSave) stack.push({ id: 'save', label: COPY.saveClip, primary: false });
  stack.push({ id: 'share', label: COPY.shareButton, primary: false });
  stack.push({ id: 'ad', label: COPY.adButton, primary: false });
  stack.push({ id: 'home', label: COPY.back, primary: false });
  for (let i = 0; i < stack.length; i += 1) {
    const item = stack[i];
    vm.buttons.push(button(item.id, item.label, pad, y, bw, 44, item.primary, false, false));
    y += 52;
  }
  vm.toastY = input.safeTop + 168;
}

function layoutAlbum(input: ComposeInput, vm: ViewModel): void {
  const owned = new Set<string>();
  for (let i = 0; i < input.album.cards.length; i += 1) owned.add(input.album.cards[i].recipeId);
  const pad = 16;
  const gap = 10;
  const cols = 2;
  const rows = Math.ceil(RECIPES.length / cols);
  const cardW = (input.width - pad * 2 - gap) / cols;
  const available = input.height - input.safeTop - input.safeBottom - 78 - 74;
  const cardH = Math.max(92, Math.min(150, (available - gap * (rows - 1)) / rows));
  const cards: AlbumCardVM[] = [];
  for (let i = 0; i < RECIPES.length; i += 1) {
    const recipe = RECIPES[i];
    const col = i % cols;
    const row = (i / cols) | 0;
    const has = owned.has(recipe.id);
    cards.push({
      name: has ? recipe.name : COPY.albumEmpty,
      region: recipe.region,
      blurb: has ? recipe.blurb : '',
      owned: has,
      ink: recipe.ink,
      x: pad + col * (cardW + gap),
      y: input.safeTop + 78 + row * (cardH + gap),
      w: cardW,
      h: cardH,
      level: recipe.levels.length,
    });
  }
  vm.album = cards;
  vm.buttons.push(button(
    'home',
    COPY.back,
    18,
    input.height - input.safeBottom - 62,
    input.width - 36,
    46,
    true,
    false,
    false,
  ));
}

function button(
  id: string,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  primary: boolean,
  disabled: boolean,
  selected: boolean,
): ButtonVM {
  return { id, label, x, y, w, h, primary, disabled, selected };
}

function liveToasts(input: ComposeInput): { text: string; seed: number; life: number }[] {
  const out = [];
  for (let i = 0; i < input.toasts.length; i += 1) {
    const toast = input.toasts[i];
    if (toast.until <= input.now) continue;
    const span = Math.max(1, toast.until - toast.born);
    out.push({ text: toast.text, seed: toast.seed, life: (toast.until - input.now) / span });
  }
  return out;
}
