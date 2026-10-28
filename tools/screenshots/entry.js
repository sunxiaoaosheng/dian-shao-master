/**
 * 把游戏现有的 compose / paint / paintJournal 画到页面画布上。
 * 状态用同一套配置、存档和炒菜模型算出来，不再另画一版界面。
 */
const { COPY } = require('../../dist/content/copy');
const { DISHES, dishById, phaseAt } = require('../../dist/content/dishes');
const { createCook, cueLabel, tickCook, tossCook } = require('../../dist/cook/model');
const { applyPlate, emptySave } = require('../../dist/meta/save');
const { createOrder } = require('../../dist/order/ticket');
const { createPrep, tapPrep } = require('../../dist/prep/board');
const { compose } = require('../../dist/ui/compose');
const { paint } = require('../../dist/ui/paint');
const { JOURNAL_H, JOURNAL_W, paintJournal } = require('../../dist/plate/journal');

const W = 750;
const H = 1334;
const SAFE_TOP = 47;
const SAFE_BOTTOM = 34;
const NOW = Date.parse('2026-10-28T18:00:00');

function blank() {
  return {
    screen: 'home',
    width: W,
    height: H,
    safeTop: SAFE_TOP,
    safeBottom: SAFE_BOTTOM,
    save: emptySave(NOW),
    catalog: DISHES,
    order: null,
    prep: null,
    cook: null,
    plate: null,
    justCleared: false,
    teach: '',
    albumPage: 0,
    debugLines: [],
    qa: false,
    offerRetry: false,
  };
}

function cookView(cook) {
  const cue = cueLabel(cook);
  return {
    even: cook.even,
    burn: cook.burn,
    leftMs: Math.max(0, cook.durationMs - cook.elapsedMs),
    totalMs: cook.durationMs,
    hint: cue ? `下料：${cue}` : cook.hint,
    tossing: cook.pulseMs > 0,
  };
}

function advance(dish, target, tossInHold) {
  let cook = createCook(dish, 1);
  let guard = 0;
  while (cook.status === 'cooking' && cook.elapsedMs / cook.durationMs < target && guard < 4000) {
    const progress = cook.durationMs <= 0 ? 1 : cook.elapsedMs / cook.durationMs;
    const phase = phaseAt(dish, progress);
    const toss = phase.want === 'toss' || (tossInHold && phase.want === 'hold');
    if (toss && cook.pulseMs <= 0) cook = tossCook(cook);
    cook = tickCook(cook, 50, dish);
    guard += 1;
  }
  return cook;
}

function passedSave() {
  let save = emptySave(NOW);
  for (let i = 0; i < DISHES.length; i += 1) {
    const rating = i === 0 ? 'god' : i === 1 ? 'sign' : 'pass';
    const score = rating === 'god' ? 95 : rating === 'sign' ? 86 : 70;
    save = applyPlate(save, { dishId: DISHES[i].id, score, rating, at: NOW }, NOW).save;
  }
  return save;
}

function scenes() {
  const fanqie = dishById('fanqie');
  const home = blank();

  const order = blank();
  order.screen = 'order';
  order.order = createOrder(fanqie, true);
  order.teach = COPY.teachOrder;

  const prep = blank();
  prep.screen = 'prep';
  prep.prep = tapPrep(tapPrep(createPrep(fanqie, true, true), 'egg'), 'potato');
  prep.teach = COPY.teachPrep;

  const tossing = tossCook(advance(fanqie, 0.12, false));
  const cookToss = blank();
  cookToss.screen = 'cook';
  cookToss.cook = cookView(tossing);

  const holding = advance(fanqie, 0.34, false);
  const cookHold = blank();
  cookHold.screen = 'cook';
  cookHold.cook = cookView(holding);

  const plate = blank();
  plate.screen = 'plate';
  plate.plate = {
    dish: fanqie,
    score: 88,
    rating: 'sign',
    kept: true,
    reason: COPY.kept,
  };
  plate.save = applyPlate(emptySave(NOW), {
    dishId: 'fanqie',
    score: 88,
    rating: 'sign',
    at: NOW,
  }, NOW).save;

  const album = blank();
  album.screen = 'album';
  album.save = plate.save;

  const clear = blank();
  clear.screen = 'clear';
  clear.save = passedSave();

  return {
    '01-home-v3': { w: W, h: H, draw: (ctx) => paint(ctx, compose(home)) },
    '02-order-v3': { w: W, h: H, draw: (ctx) => paint(ctx, compose(order)) },
    '03-prep-v3': { w: W, h: H, draw: (ctx) => paint(ctx, compose(prep)) },
    '04-cook-toss-v3': { w: W, h: H, draw: (ctx) => paint(ctx, compose(cookToss)) },
    '05-cook-hold-v3': { w: W, h: H, draw: (ctx) => paint(ctx, compose(cookHold)) },
    '06-plate-v3': { w: W, h: H, draw: (ctx) => paint(ctx, compose(plate)) },
    '07-journal-v3': {
      w: JOURNAL_W,
      h: JOURNAL_H,
      draw: (ctx) => paintJournal(ctx, {
        dish: fanqie.name,
        region: fanqie.region,
        rating: 'sign',
        quip: fanqie.quips.sign,
        science: fanqie.science,
        score: 88,
      }),
    },
    '08-album-v3': { w: W, h: H, draw: (ctx) => paint(ctx, compose(album)) },
    '09-clear-v3': { w: W, h: H, draw: (ctx) => paint(ctx, compose(clear)) },
  };
}

const ALL = scenes();

globalThis.renderScreen = function renderScreen(name) {
  const scene = ALL[name];
  const canvas = document.getElementById('screen');
  canvas.width = scene.w;
  canvas.height = scene.h;
  const ctx = canvas.getContext('2d');
  scene.draw(ctx);
  return { w: scene.w, h: scene.h };
};

globalThis.screenNames = Object.keys(ALL);
