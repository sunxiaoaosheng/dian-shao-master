'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { resolveMerges } = require('../dist/core/merge');
const { createSession, place, tick, applyToss, clearCell } = require('../dist/core/session');
const { HEAT, pickProfile } = require('../dist/meta/difficulty');
const {
  emptyDaily,
  canStart,
  consumePlay,
  playsRemaining,
  grantShareBonus,
  grantAdBonus,
  rollDaily,
  parseDaily,
  FREE_PLAYS_PER_DAY,
  MAX_SHARE_BONUS,
} = require('../dist/meta/daily');
const { emptyAlbum, grantCard } = require('../dist/meta/cards');
const { createReservedRewardedAd, REWARDED_AD_UNIT_ID } = require('../dist/meta/ads');
const { getRegionalBoard } = require('../dist/meta/leaderboard');
const { COPY, roundRecap, cooldownLabel } = require('../dist/content/copy');
const { ASSETS, LAYERS, MANIFEST_VERSION, assetById, foodIdForLevel } = require('../dist/content/manifest');
const { TOAST_LINES, toastImageFor } = require('../dist/content/toasts');
const { loadCollage, resetCollageForTests, spriteReady, spriteOrigin, beginSprites, queueBox, flushSprites } = require('../dist/ui/sprites');
const { RECIPES, recipeForRun } = require('../dist/content/recipes');
const {
  createTossDetector,
  cooldownMsFor,
  TIERS,
  COOLDOWN_MIN_MS,
  COOLDOWN_MAX_MS,
  wrapDeg,
} = require('../dist/input/gyro');
const { hitTest } = require('../dist/input/pointer');
const { composeView } = require('../dist/ui/compose');
const { paint } = require('../dist/ui/paint');
const { paintClip, CLIP_W, CLIP_H } = require('../dist/viral/clip');
const { paintShareCard, CARD_W, CARD_H } = require('../dist/viral/shareCard');

const AYS = [0.1, 0.6, 1.6, 2.8, 3.1, 1.4, 0.3, 0.05];
const BETAS = [38, 44, 54, 66, 76, 64, 48, 38];
const GAMMAS = [-6, -2, 4, 10, 16, 8, 0, -6];

function piece(id, level, burnt) {
  return { id, level, cookMs: 0, burnt: Boolean(burnt) };
}

function restSample(t, scale) {
  return {
    t,
    alpha: 12,
    beta: 38 + Math.sin(t / 500) * 0.12,
    gamma: -6 + Math.cos(t / 450) * 0.1,
    ax: Math.sin(t / 40) * 0.02 * scale,
    ay: Math.cos(t / 36) * 0.02 * scale,
    az: (1 + Math.sin(t / 50) * 0.012) * scale,
  };
}

function burst(t0, scale, strength) {
  const samples = [];
  for (let i = 0; i < BETAS.length; i += 1) {
    samples.push({
      t: t0 + i * 20,
      alpha: 12,
      beta: BETAS[i],
      gamma: GAMMAS[i],
      ax: 0.04 * scale,
      ay: AYS[i] * strength * scale,
      az: scale,
    });
  }
  return samples;
}

function script(scale, bursts) {
  const end = bursts.length ? bursts[bursts.length - 1].t + 400 : 800;
  const overlay = new Map();
  for (let n = 0; n < bursts.length; n += 1) {
    const spec = bursts[n];
    const chunk = burst(spec.t, scale, spec.strength);
    for (let i = 0; i < chunk.length; i += 1) overlay.set(chunk[i].t, chunk[i]);
  }
  const samples = [];
  for (let t = 0; t <= end; t += 20) samples.push(overlay.get(t) || restSample(t, scale));
  return samples;
}

function pushAll(det, samples) {
  let fires = 0;
  let maxI = 0;
  let maxA = 0;
  for (let i = 0; i < samples.length; i += 1) {
    if (det.push(samples[i])) fires += 1;
    const peek = det.peek();
    if (peek.impulse > maxI) maxI = peek.impulse;
    if (peek.angle > maxA) maxA = peek.angle;
  }
  return { fires, maxI, maxA, unit: det.peek().unit };
}

function tiny(overrides) {
  return Object.assign({
    id: 'tutorial',
    spawnIntervalMs: 100000,
    spawnFloor: 800,
    baseBurnMs: 8000,
    burnPerLevelMs: 1000,
    passivePerSec: 0,
    burnChunk: 30,
    tossCharges: 2,
    tossRelief: 25,
    cols: 3,
    rows: 1,
    heatRampEvery: 0,
    level2Chance: 0,
    hint: false,
    cookScale: 1,
  }, overrides);
}

function testMerge() {
  const pair = resolveMerges([
    piece(1, 1),
    piece(2, 1),
    piece(0, 0),
  ], 3, 1, 4, 1);
  const levels = pair.cells.map((cell) => cell.level).sort();
  assert.deepEqual(levels, [0, 0, 2]);
  assert.equal(pair.mergeCount, 1);
  assert.ok(pair.events.some((event) => event.type === 'merge' && event.level === 2));

  const chain = resolveMerges([
    piece(1, 1),
    piece(2, 1),
    piece(3, 2),
  ], 3, 1, 3, 1);
  assert.ok(chain.cells.some((cell) => cell.level === 3));
  assert.ok(chain.events.some((event) => event.type === 'signature'));

  const burnt = resolveMerges([
    piece(1, 1),
    piece(2, 1, true),
  ], 2, 1, 4, 0);
  assert.equal(burnt.mergeCount, 0);

  const plate = resolveMerges([
    piece(1, 4),
    piece(2, 4),
  ], 2, 1, 4, 0);
  assert.equal(plate.plated, 1);
  assert.ok(plate.cells.every((cell) => cell.level === 0));

  const mismatch = resolveMerges([
    piece(1, 1),
    piece(2, 2),
  ], 2, 1, 4, 0);
  assert.equal(mismatch.mergeCount, 0);

  const triple = resolveMerges([
    piece(1, 1),
    piece(2, 1),
    piece(3, 1),
  ], 3, 1, 4, 1);
  assert.equal(triple.mergeCount, 1);
  assert.equal(triple.cells.filter((cell) => cell.level === 2).length, 1);

  const diagonal = resolveMerges([
    piece(1, 1), piece(2, 2),
    piece(3, 2), piece(4, 1),
  ], 2, 2, 4, 0);
  assert.equal(diagonal.mergeCount, 0, '斜着的同级不合成');

  const vertical = resolveMerges([
    piece(1, 1), piece(2, 3),
    piece(3, 1), piece(4, 2),
  ], 2, 2, 4, 0);
  assert.equal(vertical.mergeCount, 1);
}

function testSession() {
  const session = createSession({
    recipeId: 'huiguo',
    maxLevel: 4,
    profile: tiny({ cols: 3, rows: 1 }),
    seed: 3,
  });
  assert.equal(session.cells[1].level, 1);
  const placed = place(session, 0);
  assert.equal(placed.ok, true);
  assert.ok(session.merges >= 1);
  assert.ok(session.score > 0);
  const blocked = place(session, 0);
  if (session.cells[0].level > 0) assert.equal(blocked.ok, false);

  const burn = createSession({
    recipeId: 'huiguo',
    maxLevel: 4,
    profile: tiny({ baseBurnMs: 1000, burnPerLevelMs: 0, burnChunk: 40, passivePerSec: 0 }),
    seed: 1,
  });
  for (let i = 0; i < 11; i += 1) tick(burn, 100);
  assert.ok(burn.cells.some((cell) => cell.burnt));
  const meter = burn.meter;
  assert.ok(meter >= 40);
  for (let i = 0; i < 10; i += 1) tick(burn, 100);
  assert.equal(burn.meter, meter);

  const heat = createSession({
    recipeId: 'huiguo',
    maxLevel: 4,
    profile: tiny({ passivePerSec: 80, baseBurnMs: 999999, cols: 2, rows: 1 }),
    seed: 1,
  });
  for (let i = 0; i < 10; i += 1) tick(heat, 100);
  assert.equal(heat.status, 'playing');
  assert.ok(heat.meter >= 75);
  for (let i = 0; i < 5; i += 1) tick(heat, 100);
  assert.equal(heat.status, 'burnt_out');

  const full = createSession({
    recipeId: 'huiguo',
    maxLevel: 4,
    profile: tiny({ cols: 2, rows: 1, tossCharges: 0, spawnIntervalMs: 100 }),
    seed: 1,
  });
  full.cells[0] = piece(8, 2);
  full.cells[1] = piece(9, 3);
  full.spawnLeftMs = 10;
  tick(full, 30);
  assert.equal(full.status, 'grid_full');

  const grace = createSession({
    recipeId: 'huiguo',
    maxLevel: 4,
    profile: tiny({ cols: 2, rows: 1, tossCharges: 2, spawnIntervalMs: 100 }),
    seed: 1,
  });
  grace.cells[0] = piece(8, 2);
  grace.cells[1] = piece(9, 3);
  grace.spawnLeftMs = 10;
  tick(grace, 30);
  assert.equal(grace.status, 'playing');
  assert.ok(grace.overflowLeftMs !== null);
  for (let i = 0; i < 16; i += 1) tick(grace, 100);
  assert.equal(grace.status, 'grid_full');

  const rescue = createSession({
    recipeId: 'huiguo',
    maxLevel: 4,
    profile: tiny({ cols: 3, rows: 1, tossCharges: 2, tossRelief: 25 }),
    seed: 9,
  });
  rescue.meter = 50;
  rescue.cells[0] = piece(4, 1, true);
  const tossed = applyToss(rescue);
  assert.equal(tossed.ok, true);
  assert.equal(rescue.charges, 1);
  assert.equal(rescue.tossCount, 1);
  assert.ok(rescue.meter <= 25);
  assert.ok(rescue.cells.every((cell) => !cell.burnt));
  const locked = applyToss(rescue);
  assert.equal(locked.ok, false);
  assert.equal(locked.reason, 'lock');
  for (let i = 0; i < 3; i += 1) tick(rescue, 100);
  clearCell(rescue, 0);
  assert.equal(rescue.overflowLeftMs, null);

  const before = HEAT[3].spawnIntervalMs;
  const hell = createSession({
    recipeId: 'huiguo',
    maxLevel: 4,
    profile: pickProfile(9),
    seed: 4,
  });
  for (let i = 0; i < hell.cells.length; i += 1) {
    if (hell.cells[i].level === 0) place(hell, i);
  }
  assert.equal(HEAT[3].spawnIntervalMs, before);
  assert.equal(hell.heatId, 'hell');
  assert.equal(hell.maxCharges, 1);

  const shortRound = createSession({
    recipeId: 'huiguo',
    maxLevel: 4,
    profile: HEAT[0],
    seed: 2,
  });
  let steps = 0;
  while (shortRound.status === 'playing' && steps < 400) {
    tick(shortRound, 100);
    steps += 1;
  }
  assert.equal(shortRound.status, 'burnt_out', `试火应糊锅，实际 ${shortRound.status} ${shortRound.elapsedMs}ms`);
  assert.ok(
    shortRound.elapsedMs >= 12000 && shortRound.elapsedMs <= 28000,
    `试火应是短局，实际 ${shortRound.elapsedMs}ms`,
  );
}

function testDaily() {
  let state = emptyDaily('2026-10-27');
  assert.equal(canStart(state), true);
  assert.equal(playsRemaining(state), FREE_PLAYS_PER_DAY);
  state = consumePlay(consumePlay(consumePlay(state)));
  assert.equal(playsRemaining(state), 0);
  assert.equal(canStart(state), false);
  const stuck = consumePlay(state);
  assert.equal(stuck.playsUsed, 3);
  const shared = grantShareBonus(state);
  assert.equal(shared.granted, true);
  assert.equal(canStart(shared.state), true);
  let bonus = shared.state;
  bonus = grantShareBonus(bonus).state;
  const capped = grantShareBonus(bonus);
  assert.equal(capped.granted, false);
  assert.equal(capped.state.shareBonus, MAX_SHARE_BONUS);
  const ad = grantAdBonus(capped.state);
  assert.equal(ad.granted, true);
  assert.equal(grantAdBonus(ad.state).granted, false);
  const next = rollDaily(ad.state, '2026-10-28');
  assert.equal(next.playsUsed, 0);
  assert.equal(playsRemaining(next), FREE_PLAYS_PER_DAY);
  assert.equal(parseDaily('{').date, '1970-01-01');
  assert.equal(createReservedRewardedAd().isConfigured(), false);
  assert.equal(REWARDED_AD_UNIT_ID, '');
  assert.ok(COPY.shareButton.includes('自愿'));
  assert.ok(COPY.playsHint.includes('不分享'));
  assert.equal(getRegionalBoard().length >= 4, true);
  assert.equal(recipeForRun(0).id, RECIPES[0].id);
  assert.equal(pickProfile(0).id, 'tutorial');
  assert.equal(pickProfile(1).id, 'simmer');
  assert.equal(pickProfile(2).id, 'stir');
  assert.equal(pickProfile(3).id, 'hell');
  assert.equal(pickProfile(8).id, 'hell');

  const appSrc = fs.readFileSync(path.join(__dirname, '../src/app.ts'), 'utf8');
  const start = appSrc.slice(appSrc.indexOf('private startRun'), appSrc.indexOf('private goHome'));
  assert.ok(!start.includes('share('), '开局不能拉起分享');
  assert.ok(!start.includes('shareAppMessage'));
  const adapter = fs.readFileSync(path.join(__dirname, '../src/platform/wechat/adapter.ts'), 'utf8');
  assert.ok(!adapter.includes('grantShareBonus'));
}

function testGyro() {
  assert.equal(wrapDeg(359 - 1), -2);
  for (const tier of ['gentle', 'standard', 'fierce']) {
    const ms = cooldownMsFor(tier);
    assert.ok(ms >= COOLDOWN_MIN_MS && ms <= COOLDOWN_MAX_MS, tier);
    assert.equal(ms, TIERS[tier].cooldownMs);
  }

  const still = createTossDetector('standard');
  const quiet = [];
  for (let t = 0; t <= 6000; t += 20) {
    const tilt = t > 2500 && t < 4500 ? ((t - 2500) / 2000) * 36 : 0;
    quiet.push({
      t,
      alpha: 20 + Math.sin(t / 80) * 0.15,
      beta: 42 + tilt + Math.sin(t / 90) * 0.12,
      gamma: -8 + Math.cos(t / 70) * 0.1,
      ax: Math.sin(t / 33) * 0.02,
      ay: Math.sin(t / 180) * 0.55,
      az: 1 + Math.cos(t / 40) * 0.015,
    });
  }
  const stillResult = pushAll(still, quiet);
  assert.equal(stillResult.fires, 0, `静置误触发 ${stillResult.fires} impulse ${stillResult.maxI} angle ${stillResult.maxA}`);

  const one = createTossDetector('standard');
  const oneResult = pushAll(one, script(1, [{ t: 800, strength: 1 }]));
  assert.equal(oneResult.fires, 1, `单次颠勺应只记 1 下，实际 ${oneResult.fires} impulse ${oneResult.maxI} angle ${oneResult.maxA}`);

  const tenSpec = [];
  for (let n = 0; n < 10; n += 1) tenSpec.push({ t: 900 + n * 1200, strength: 1 });
  const ten = pushAll(createTossDetector('standard'), script(1, tenSpec));
  assert.ok(ten.fires >= 8 && ten.fires <= 10, `故意颠勺 ${ten.fires}/10 impulse ${ten.maxI} angle ${ten.maxA}`);

  const cooled = pushAll(createTossDetector('standard'), script(1, [
    { t: 800, strength: 1 },
    { t: 1000, strength: 1 },
  ]));
  assert.equal(cooled.fires, 1, `冷却内第二下不该算，实际 ${cooled.fires}`);

  const gentle = pushAll(createTossDetector('gentle'), script(1, [{ t: 800, strength: 0.5 }]));
  const fierce = pushAll(createTossDetector('fierce'), script(1, [{ t: 800, strength: 0.5 }]));
  assert.equal(gentle.fires, 1, `轻颠应认出中等那一下 impulse ${gentle.maxI} angle ${gentle.maxA}`);
  assert.equal(fierce.fires, 0, `猛火不该认出中等那一下 impulse ${fierce.maxI} angle ${fierce.maxA}`);

  const mps = pushAll(createTossDetector('standard'), script(9.80665, [{ t: 900, strength: 1 }]));
  assert.equal(mps.fires, 1, `m/s² 颠勺 impulse ${mps.maxI} unit ${mps.unit}`);
  assert.equal(mps.unit, 'mps2');

  const accelOnly = createTossDetector('standard');
  const accelSamples = [];
  for (let t = 0; t <= 520; t += 20) {
    accelSamples.push({ t, ax: 0, ay: 0, az: 1 });
  }
  for (let i = 0; i < AYS.length; i += 1) {
    accelSamples.push({ t: 800 + i * 20, ax: 0.05, ay: AYS[i], az: 1 });
  }
  const accelResult = pushAll(accelOnly, accelSamples);
  assert.equal(accelResult.fires, 1, `只有加速度计也应认出猛颠 impulse ${accelResult.maxI}`);
}

function pngInfo(buf) {
  assert.equal(buf[0], 137, 'PNG 签名');
  assert.equal(buf.toString('ascii', 1, 4), 'PNG');
  assert.equal(buf.toString('ascii', 12, 16), 'IHDR');
  assert.equal(buf[24], 8, '位深');
  assert.equal(buf[25], 6, 'RGBA');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function testCollage() {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/manifest.json'), 'utf8'));
  assert.equal(manifest.version, 1);
  assert.equal(MANIFEST_VERSION, 1);
  assert.equal(ASSETS.length, manifest.items.length);
  const lines = [
    '火候？我跟火候不熟。',
    '颠勺不是甩锅，别误会。',
    '油花比我命还欢。',
    '这菜：差点完美，完美差点。',
    '锅在飞，心在颤。',
    '盐放多了就叫「个性」。',
    '糊了也是烟火气。',
    '再颠一下，信我。',
  ];
  assert.equal(TOAST_LINES.length, 8);
  for (let i = 0; i < lines.length; i += 1) {
    assert.equal(TOAST_LINES[i].text, lines[i]);
    assert.equal(TOAST_LINES[i].image.id, `type.toast.${i + 1}`);
    assert.equal(TOAST_LINES[i].image.path, `type/type-toast-0${i + 1}.png`);
    assert.equal(TOAST_LINES[i].image.file, `assets/type/type-toast-0${i + 1}.png`);
    assert.equal(TOAST_LINES[i].image.z, LAYERS.toast);
    assert.deepEqual(TOAST_LINES[i].image.pivot, [0.5, 0.5]);
  }
  assert.equal(toastImageFor(lines[6]).id, 'type.toast.7');
  assert.equal(toastImageFor('糊了'), null);
  assert.equal(assetById('type.perfect').text, '颠漂亮了');
  assert.equal(assetById('type.burnt').text, '糊了！');
  assert.equal(assetById('type.perfect').w <= 160, true);
  assert.equal(foodIdForLevel(4, 0), 'food.plateDone');
  assert.ok(assetById('food.wokHandle').z <= LAYERS.wok);
  assert.ok(assetById('fx.flameLick').z >= LAYERS.fxCook);
  assert.ok(assetById('ui.heart').z >= LAYERS.ui);
  assert.ok(assetById('fx.perfectBurst').z >= LAYERS.fxBurst);

  const flame = spriteOrigin('fx.flameLick', 100, 200, 64, 96);
  assert.equal(flame.x, 100 - 0.5 * 64);
  assert.equal(flame.y, 200 - 1 * 96);
  const track = spriteOrigin('ui.progressTrack', 16, 70, 200, 12);
  assert.equal(track.x, 16);
  assert.equal(track.y, 70 - 0.5 * 12);

  const seen = new Set();
  for (let i = 0; i < manifest.items.length; i += 1) {
    const raw = manifest.items[i];
    const item = ASSETS[i];
    assert.equal(item.id, raw.id);
    assert.equal(item.path, raw.path);
    assert.equal(item.z, raw.z);
    assert.deepEqual(item.pivot, raw.pivot);
    assert.equal(item.file, `assets/${raw.path}`);
    assert.ok(!seen.has(item.id), item.id);
    seen.add(item.id);
    assert.match(item.file, /^assets\/(ui|food|fx|type)\/(ui|food|fx|type)-[a-z0-9-]+\.png$/);
    const folder = item.path.split('/')[0];
    const prefix = path.basename(item.path).split('-')[0];
    assert.equal(prefix, folder, item.path);
    pngInfo(fs.readFileSync(path.join(__dirname, '..', item.file)));
  }

  resetCollageForTests();
  const srcs = [];
  loadCollage(() => {
    let src = '';
    let onload = null;
    return {
      width: 4,
      height: 4,
      onerror: null,
      get onload() { return onload; },
      set onload(fn) { onload = fn; },
      get src() { return src; },
      set src(value) {
        src = value;
        srcs.push(value);
        if (onload) onload();
      },
    };
  });
  assert.equal(srcs.length, ASSETS.length);
  for (let i = 0; i < ASSETS.length; i += 1) {
    assert.equal(srcs[i], ASSETS[i].file);
    assert.equal(spriteReady(ASSETS[i].id), true);
  }

  beginSprites();
  queueBox('fx.perfectBurst', 0, 0, 32, 32);
  queueBox('food.wokHandle', 0, 0, 20, 40);
  queueBox('food.wokBase', 0, 0, 40, 20);
  queueBox('ui.paperBg', 0, 0, 10, 10);
  const order = flushSprites({
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    beginPath() {},
    rect() {},
    clip() {},
    drawImage() {},
    globalAlpha: 1,
  });
  assert.deepEqual(order, ['ui.paperBg', 'food.wokHandle', 'food.wokBase', 'fx.perfectBurst']);
  resetCollageForTests();
}

function testName() {
  assert.equal(COPY.title, '颠勺王');
  assert.ok(COPY.menuShare.startsWith('颠勺王'));
  const files = [
    'README.md',
    'docs/COLLAGE_ART_SPEC.md',
    'package.json',
    'project.config.json',
    'game.json',
    'src/content/copy.ts',
    'src/viral/clip.ts',
    'src/viral/shareCard.ts',
    'src/meta/share.ts',
  ];
  for (let i = 0; i < files.length; i += 1) {
    const text = fs.readFileSync(path.join(__dirname, '..', files[i]), 'utf8');
    const oldName = `颠勺${'大师'}`;
    assert.ok(!text.includes(oldName), `${files[i]} 还写着旧展示名`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  assert.equal(pkg.name, 'dian-shao-master');
  const project = JSON.parse(fs.readFileSync(path.join(__dirname, '../project.config.json'), 'utf8'));
  assert.equal(project.projectname, 'dian-shao-master');
  assert.ok(project.description.includes('颠勺王'));
}

function testWords() {
  const banned = /工位|周报|KPI|OKR|打卡|同事|老板|会议|PPT|职场|格子间|加班|最后一格|需求文档|排期|考勤/;
  const root = path.join(__dirname, '../src');
  const files = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (full.endsWith('.ts')) files.push(full);
    }
  };
  walk(root);
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(!banned.test(text), `${path.relative(root, file)} 出现了不该有的词`);
  }
}

function mockCtx() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === 'measureText') return (text) => ({ width: String(text).length * 12 });
      if (prop === 'createLinearGradient') return () => gradient;
      return () => undefined;
    },
    set() {
      return true;
    },
  });
}

function testPaint() {
  const recipe = recipeForRun(0);
  const session = createSession({
    recipeId: recipe.id,
    maxLevel: recipe.levels.length,
    profile: HEAT[0],
    seed: 1,
  });
  const base = {
    width: 375,
    height: 667,
    safeTop: 24,
    safeBottom: 12,
    now: 5000,
    playsLeft: 2,
    tier: 'standard',
    heatId: 'tutorial',
    recipe,
    session,
    album: { cards: [{ recipeId: recipe.id, name: recipe.name, region: recipe.region, blurb: recipe.blurb, unlockedAt: 1 }] },
    board: getRegionalBoard(),
    toasts: [{ text: '颠起来了！', seed: 3, born: 4000, until: 6000 }],
    showTossButton: true,
    sensorLabel: '模拟器没有真陀螺仪，先手动颠',
    result: {
      reason: 'burnt_out',
      score: 40,
      cardName: recipe.name,
      seconds: 18,
      merges: 2,
      tosses: 1,
      quip: '糊了也是烟火气。',
    },
    tossWaitMs: 0,
    shake: 0.6,
    canSave: true,
    qa: { detected: 2, impulse: 1.8, angle: 30, unit: 'g', phase: 'fallback' },
  };
  for (const screen of ['home', 'play', 'result', 'album']) {
    paint(mockCtx(), composeView(Object.assign({}, base, { screen })));
  }
  paint(mockCtx(), composeView(Object.assign({}, base, { screen: 'play', width: 320, height: 568, showTossButton: false })));
  const moment = { dish: '回锅肉', region: '川渝', line: '颠到「回锅肉」的那一下', score: 40, energy: 1, ink: '#c4552a' };
  paintClip(mockCtx(), moment);
  paintShareCard(mockCtx(), moment);
  assert.equal(CLIP_W * 16, CLIP_H * 9);
  assert.equal(CARD_W / CARD_H, 1.25);
  assert.equal(hitTest([{ id: 'a', x: 0, y: 0, w: 10, h: 10 }], 3, 4), 'a');
  assert.equal(hitTest([{ id: 'a', x: 0, y: 0, w: 10, h: 10 }], 12, 4), null);

  const settled = composeView(Object.assign({}, base, { screen: 'result' }));
  assert.equal(settled.title, '颠勺王');
  assert.ok(settled.result.recap.includes('18'));
  assert.ok(settled.result.recap.includes('合成 2'));
  assert.ok(settled.result.body.includes('糊了也是烟火气'));
  assert.equal(roundRecap(18, 2, 1), settled.result.recap);
  const cooling = composeView(Object.assign({}, base, { screen: 'play', tossWaitMs: 600 }));
  assert.ok(cooling.play.cooldownText.includes('0.6'));
  assert.equal(cooldownLabel('家常', 600), cooling.play.cooldownText);
}

function testBoot() {
  const g = globalThis;
  g.requestAnimationFrame = () => 0;
  g.wx = {
    getSystemInfoSync() {
      return { windowWidth: 375, windowHeight: 667, pixelRatio: 2, platform: 'devtools', safeArea: { top: 20, bottom: 640, left: 0, right: 375 } };
    },
    createCanvas() {
      return {
        width: 10,
        height: 10,
        getContext() { return mockCtx(); },
        toTempFilePath(opts) { if (opts && opts.success) opts.success({ tempFilePath: 'wxfile://toss.png' }); },
      };
    },
    onTouchEnd() {},
    getStorageSync() { return ''; },
    setStorageSync() {},
    startDeviceMotionListening(opts) { if (opts && opts.fail) opts.fail({ errMsg: 'devtools' }); },
    stopDeviceMotionListening() {},
    onDeviceMotionChange() {},
    offDeviceMotionChange() {},
    startAccelerometer(opts) { if (opts && opts.fail) opts.fail({ errMsg: 'devtools' }); },
    stopAccelerometer() {},
    onAccelerometerChange() {},
    offAccelerometerChange() {},
    shareAppMessage(opts) { if (opts && opts.success) opts.success(); },
    showShareMenu() {},
    onShareAppMessage() {},
    vibrateShort() {},
    onShow() {},
    onHide() {},
    getLaunchOptionsSync() { return { query: {} }; },
    saveImageToPhotosAlbum(opts) { if (opts && opts.success) opts.success(); },
    createImage() {
      let src = '';
      let onload = null;
      return {
        width: 4,
        height: 4,
        onerror: null,
        get onload() { return onload; },
        set onload(fn) { onload = fn; },
        get src() { return src; },
        set src(value) {
          src = value;
          if (onload) onload();
        },
      };
    },
  };
  require('../dist/main.js');
}

testMerge();
testSession();
testDaily();
testGyro();
testCollage();
testName();
testWords();
testPaint();
testBoot();
console.log('颠勺王测试通过');
