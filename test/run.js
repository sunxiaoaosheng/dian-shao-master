'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { installManifest, MANIFEST_PATHS } = require('../loadManifest');

const manifestJsonPath = path.join(__dirname, '../assets/manifest.json');
let manifestReads = [];
installManifest((filePath, encoding) => {
  manifestReads.push([filePath, encoding]);
  if (filePath !== MANIFEST_PATHS[0]) throw new Error(`清单路径应从代码包根目录写，收到 ${filePath}`);
  if (encoding !== 'utf8') throw new Error(`清单编码应为 utf8，收到 ${encoding}`);
  return fs.readFileSync(manifestJsonPath, 'utf8');
});

const { resolveMerges } = require('../dist/core/merge');
const { createSession, place, tick, applyToss, clearCell } = require('../dist/core/session');
const { HEAT, pickProfile, practiceProfile } = require('../dist/meta/difficulty');
const {
  emptyDaily,
  canStart,
  consumePlay,
  playsRemaining,
  grantShareBonus,
  grantAdBonus,
  rollDaily,
  parseDaily,
  shareSlotsLeft,
  resetToday,
  usesTestPotQuota,
  freePlaysFor,
  FREE_PLAYS_PER_DAY,
  TEST_FREE_PLAYS_PER_DAY,
  TEST_APP_ID,
  MAX_SHARE_BONUS,
} = require('../dist/meta/daily');
const { emptyAlbum, grantCard } = require('../dist/meta/cards');
const { createRewardedAd, adSwitchOpen, ADS_ENABLED, REWARDED_AD_UNIT_ID } = require('../dist/meta/ads');
const { fetchRegionalBoard, readBoard, boardSwitchOpen, BOARD_ENABLED, BOARD_FUNCTION_NAME } = require('../dist/meta/leaderboard');
const { didGraduate, GRADUATION_MS, GRADUATION_MERGES } = require('../dist/meta/difficulty');
const { goalProgress, burnWarnKind } = require('../dist/meta/runGoal');
const {
  COPY,
  roundRecap,
  cooldownLabel,
  againLabel,
  heatGoal,
  restartLine,
  goalProgressLine,
  burnWarnLine,
  tossFeelLine,
  tossAck,
  testPlaysHint,
  tossedLabel,
} = require('../dist/content/copy');
const { SHARE_STICKER_ID } = require('../dist/viral/shareCard');
const { ASSETS, LAYERS, MANIFEST_VERSION, assetById, foodIdForLevel } = require('../dist/content/manifest');
const { TOAST_LINES, toastImageFor } = require('../dist/content/toasts');
const { loadCollage, resetCollageForTests, spriteReady, spriteOrigin, beginSprites, queueBox, flushSprites } = require('../dist/ui/sprites');
const { RECIPES, recipeForRun } = require('../dist/content/recipes');
const {
  createTossDetector,
  cooldownMsFor,
  tossFeel,
  TIERS,
  COOLDOWN_MIN_MS,
  COOLDOWN_MAX_MS,
  wrapDeg,
} = require('../dist/input/gyro');
const { hitTest } = require('../dist/input/pointer');
const { requestMotionConsent, openMotionSettings, MOTION_SCOPE } = require('../dist/platform/wechat/motionConsent');
const { MOTION_START_MS } = require('../dist/platform/wechat/motion');
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
  assert.equal(playsRemaining(state, TEST_FREE_PLAYS_PER_DAY), TEST_FREE_PLAYS_PER_DAY - 3);
  assert.equal(canStart(state, TEST_FREE_PLAYS_PER_DAY), true);
  assert.equal(freePlaysFor(true), TEST_FREE_PLAYS_PER_DAY);
  assert.equal(freePlaysFor(false), FREE_PLAYS_PER_DAY);
  assert.equal(usesTestPotQuota(TEST_APP_ID, false), true);
  assert.equal(usesTestPotQuota('wx0000000000000000', false), false);
  assert.equal(usesTestPotQuota('', false), true);
  assert.equal(usesTestPotQuota('wx0000000000000000', true), true);
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
  const wiped = resetToday(ad.state);
  assert.equal(wiped.playsUsed, 0);
  assert.equal(wiped.shareBonus, ad.state.shareBonus);
  assert.equal(wiped.adBonus, ad.state.adBonus);
  assert.equal(wiped.date, ad.state.date);
  assert.equal(playsRemaining(wiped, TEST_FREE_PLAYS_PER_DAY), TEST_FREE_PLAYS_PER_DAY + wiped.shareBonus + wiped.adBonus);
  assert.ok(COPY.resetDaily.includes('测试'));
  assert.ok(COPY.probeStart.includes('颠勺'));
  assert.ok(testPlaysHint().includes(String(TEST_FREE_PLAYS_PER_DAY)));
  assert.equal(parseDaily('{').date, '1970-01-01');
  assert.equal(ADS_ENABLED, false);
  assert.equal(REWARDED_AD_UNIT_ID, '');
  assert.equal(BOARD_ENABLED, false);
  assert.ok(COPY.shareButton.includes('自愿'));
  assert.ok(COPY.playsHint.includes('不分享'));
  assert.equal(didGraduate(0, GRADUATION_MS - 1, 0), false);
  assert.equal(didGraduate(GRADUATION_MERGES, 0, 0), true);
  assert.equal(didGraduate(0, GRADUATION_MS, 0), true);
  assert.equal(didGraduate(0, 0, 1), true);
  assert.ok(HEAT[1].spawnIntervalMs < HEAT[0].spawnIntervalMs);
  assert.ok(HEAT[1].passivePerSec > HEAT[0].passivePerSec);
  assert.ok(HEAT[1].tossCharges < HEAT[0].tossCharges);
  assert.ok(HEAT[2].spawnIntervalMs < HEAT[1].spawnIntervalMs);
  assert.ok(HEAT[3].tossCharges < HEAT[2].tossCharges);
  assert.ok(heatGoal('tutorial', 4, 5, 5).includes('20'));
  assert.equal(recipeForRun(0).id, RECIPES[0].id);
  assert.equal(pickProfile(0).id, 'tutorial');
  assert.equal(pickProfile(1).id, 'simmer');
  assert.equal(pickProfile(2).id, 'stir');
  assert.equal(pickProfile(3).id, 'hell');
  assert.equal(pickProfile(8).id, 'hell');
  const eased = practiceProfile(HEAT[3]);
  assert.equal(eased.id, 'hell');
  assert.ok(eased.baseBurnMs >= 18000);
  assert.ok(eased.tossCharges >= 20);
  assert.ok(eased.passivePerSec <= 2);
  const rawHell = createSession({
    recipeId: 'huiguo',
    maxLevel: 4,
    profile: HEAT[3],
    seed: 1,
  });
  let rawSteps = 0;
  while (rawHell.status === 'playing' && rawSteps < 120) {
    tick(rawHell, 100);
    rawSteps += 1;
  }
  assert.equal(rawHell.status, 'burnt_out');
  assert.ok(rawHell.elapsedMs < 12000, `正式地狱火应很快糊，实际 ${rawHell.elapsedMs}`);
  const practiceHell = createSession({
    recipeId: 'huiguo',
    maxLevel: 4,
    profile: eased,
    seed: 1,
  });
  let practiceSteps = 0;
  while (practiceHell.status === 'playing' && practiceSteps < 200) {
    tick(practiceHell, 100);
    practiceSteps += 1;
  }
  assert.equal(practiceHell.status, 'playing', `测试态地狱火 20 秒内不该收锅 ${practiceHell.elapsedMs}`);
  assert.ok(practiceHell.elapsedMs >= 20000);
  assert.equal(tossedLabel(0), '已颠 0 下');
  assert.ok(COPY.sensorDeaf.includes('手动颠勺'));
  assert.ok(!COPY.sensorDeaf.includes('设置'));
  assert.equal(COPY.retryListen, '再听一次');

  const appSrc = fs.readFileSync(path.join(__dirname, '../src/app.ts'), 'utf8');
  const start = appSrc.slice(appSrc.indexOf('private startRun'), appSrc.indexOf('private goHome'));
  assert.ok(!start.includes('share('), '开局不能拉起分享');
  assert.ok(!start.includes('shareAppMessage'));
  assert.ok(start.indexOf('probeStart') < start.indexOf('noPlays'));
  assert.ok(start.indexOf('noPlays') < start.indexOf('return'));
  assert.ok(start.indexOf('return') < start.indexOf('beginSensors'), '没锅时测试号仍要进局再听传感器');
  assert.ok(appSrc.includes('usesTestPotQuota'));
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

  const deadMotion = script(1, [{ t: 900, strength: 1 }]).map((sample) => Object.assign({}, sample, {
    alpha: 0,
    beta: 0,
    gamma: 0,
  }));
  const rescued = pushAll(createTossDetector('standard'), deadMotion);
  assert.equal(rescued.fires, 1, `方向一直是 0 时加速度仍应认出颠勺 impulse ${rescued.maxI}`);

  const jerk = [];
  for (let t = 0; t <= 700; t += 20) {
    jerk.push({ t, alpha: 12, beta: 40, gamma: -6, ax: 0, ay: 0.04, az: 1 });
  }
  const spike = [0.2, 0.9, 1.7, 2.2, 1.1, 0.25];
  for (let i = 0; i < spike.length; i += 1) {
    jerk.push({
      t: 820 + i * 20,
      alpha: 12,
      beta: 40,
      gamma: -6,
      ax: 0.02,
      ay: spike[i],
      az: 1,
    });
  }
  const jerked = pushAll(createTossDetector('standard'), jerk);
  assert.equal(jerked.fires, 1, `转角几乎不变时冲量仍应颠勺 impulse ${jerked.maxI} angle ${jerked.maxA}`);
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
  const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
  assert.deepEqual(manifestReads, [['/assets/manifest.json', 'utf8']]);
  const manifestJs = fs.readFileSync(path.join(__dirname, '../dist/content/manifest.js'), 'utf8');
  assert.ok(!/require\([^)]*\.json/.test(manifestJs), '清单不能再被 require');
  const gameJs = fs.readFileSync(path.join(__dirname, '../game.js'), 'utf8');
  assert.ok(gameJs.includes('getFileSystemManager'));
  assert.ok(gameJs.includes('readFileSync'));
  assert.ok(!/require\([^)]*manifest\.json/.test(gameJs));
  assert.throws(() => installManifest(() => {
    throw new Error('no such file');
  }));
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
  assert.equal(project.appid, 'wx2ffe6f213fe9c05b');
  assert.equal(project.isGameTourist, false);
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
    practiceStart: false,
    playsHint: COPY.playsHint,
    shareLeft: 2,
    runsCompleted: 0,
    tier: 'standard',
    heatId: 'tutorial',
    recipe,
    session,
    album: { cards: [{ recipeId: recipe.id, name: recipe.name, region: recipe.region, blurb: recipe.blurb, unlockedAt: 1 }] },
    board: [],
    goalText: heatGoal('tutorial', 4, 5, 5),
    adsOn: false,
    toasts: [{ text: '颠起来了！', seed: 3, born: 4000, until: 6000 }],
    showTossButton: true,
    sensorLabel: '模拟器没有真陀螺仪，先手动颠',
    motionNeedsSetting: false,
    result: {
      reason: 'burnt_out',
      score: 40,
      cardName: recipe.name,
      seconds: 18,
      merges: 2,
      tosses: 1,
      quip: '糊了也是烟火气。',
      graduated: true,
      nextHeatId: 'simmer',
    },
    tossWaitMs: 0,
    gyroHits: 0,
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
  assert.ok(settled.result.nextLine.includes('小火'));
  assert.ok(settled.buttons.some((button) => button.id === 'again' && button.label === againLabel(true, '小火')));
  assert.ok(!settled.buttons.some((button) => button.id === 'ad'));
  const stay = composeView(Object.assign({}, base, {
    screen: 'result',
    result: Object.assign({}, base.result, { graduated: false, nextHeatId: 'tutorial' }),
  }));
  assert.ok(stay.result.nextLine.includes('仍是试火'));
  assert.ok(stay.buttons.some((button) => button.label.indexOf('再试这一火') === 0));
  assert.equal(assetById(SHARE_STICKER_ID).file, 'assets/type/type-toast-05.png');
  assert.equal(CLIP_W, 540);
  assert.equal(CLIP_H, 960);
  const needAuth = composeView(Object.assign({}, base, {
    screen: 'play',
    motionNeedsSetting: true,
    sensorLabel: COPY.sensorDeaf,
  }));
  assert.equal(needAuth.sensorLabel, '没收到晃动数据，先用手动颠勺');
  assert.ok(needAuth.buttons.some((button) => button.id === 'retryListen' && button.label === '再听一次'));
  assert.ok(!needAuth.buttons.some((button) => button.label.indexOf('去设置') >= 0));
  assert.ok(needAuth.buttons.some((button) => button.id === 'toss'));
  const devtools = composeView(Object.assign({}, base, { screen: 'play', motionNeedsSetting: false }));
  assert.ok(!devtools.buttons.some((button) => button.id === 'retryListen'));

  const cooling = composeView(Object.assign({}, base, { screen: 'play', tossWaitMs: 600, practiceStart: true }));
  assert.ok(cooling.play.cooldownText.includes('0.6'));
  assert.equal(cooldownLabel('家常', 600), cooling.play.cooldownText);
  assert.equal(cooling.buttons.find((button) => button.id === 'toss').disabled, true);
  const readyAgain = composeView(Object.assign({}, base, { screen: 'play', tossWaitMs: 0, practiceStart: true }));
  assert.equal(readyAgain.buttons.find((button) => button.id === 'toss').disabled, false);
  const spent = createSession({
    recipeId: recipe.id,
    maxLevel: recipe.levels.length,
    profile: HEAT[3],
    seed: 4,
  });
  spent.charges = 0;
  const practiceSpent = composeView(Object.assign({}, base, {
    screen: 'play',
    tossWaitMs: 0,
    practiceStart: true,
    session: spent,
    gyroHits: 2,
  }));
  assert.equal(practiceSpent.buttons.find((button) => button.id === 'toss').disabled, false);
  assert.equal(practiceSpent.play.tossedText, '已颠 2 下');
  const productSpent = composeView(Object.assign({}, base, {
    screen: 'play',
    tossWaitMs: 0,
    practiceStart: false,
    session: spent,
  }));
  assert.equal(productSpent.buttons.find((button) => button.id === 'toss').disabled, true);

  const playing = composeView(Object.assign({}, base, { screen: 'play' }));
  assert.equal(playing.play.tossedText, '已颠 0 下');
  assert.equal(playing.play.mergeRule, COPY.hint);
  assert.ok(playing.play.goalText.includes('出师'));
  assert.ok(playing.play.goalText.includes('下一火'));
  assert.ok(playing.play.goalText.includes('小火'));
  assert.ok(playing.play.feelText.includes('0.6'));
  const hot = createSession({
    recipeId: recipe.id,
    maxLevel: recipe.levels.length,
    profile: HEAT[0],
    seed: 2,
  });
  hot.meter = 75;
  const warned = composeView(Object.assign({}, base, { screen: 'play', session: hot }));
  assert.equal(warned.play.warnText, burnWarnLine('pot'));
  assert.ok(warned.play.warnText.includes('颠'));
  const piece = createSession({
    recipeId: recipe.id,
    maxLevel: recipe.levels.length,
    profile: HEAT[0],
    seed: 3,
  });
  const occupied = piece.cells.find((cell) => cell.level > 0);
  occupied.cookMs = piece.baseBurnMs;
  piece.meter = 10;
  const edge = composeView(Object.assign({}, base, { screen: 'play', session: piece }));
  assert.equal(edge.play.warnText, burnWarnLine('piece'));

  const home = composeView(Object.assign({}, base, { screen: 'home' }));
  assert.ok(home.feelText.includes('家常'));
  assert.ok(home.buttons.some((button) => button.id === 'start'));
  assert.equal(home.playsHint, COPY.playsHint);
  const locked = composeView(Object.assign({}, base, { screen: 'home', playsLeft: 0 }));
  assert.equal(locked.buttons.find((button) => button.id === 'start').disabled, true);
  assert.ok(!locked.buttons.some((button) => button.id === 'resetDaily'));
  const practice = composeView(Object.assign({}, base, {
    screen: 'home',
    playsLeft: 0,
    practiceStart: true,
    playsHint: testPlaysHint(),
  }));
  assert.equal(practice.buttons.find((button) => button.id === 'start').disabled, false);
  assert.ok(practice.buttons.some((button) => button.id === 'resetDaily' && button.label === COPY.resetDaily));
  assert.ok(practice.playsHint.includes('99'));
  const probeResult = composeView(Object.assign({}, base, {
    screen: 'result',
    playsLeft: 0,
    shareLeft: 0,
    practiceStart: true,
  }));
  assert.ok(probeResult.buttons.some((button) => button.id === 'again'));

  const shareOnly = composeView(Object.assign({}, base, { screen: 'result', playsLeft: 0, shareLeft: 1 }));
  assert.equal(shareOnly.result.nextLine, restartLine(0, true, '小火', 1));
  assert.ok(shareOnly.result.nextLine.includes('分享'));
  assert.ok(!shareOnly.buttons.some((button) => button.id === 'again'));
  assert.ok(shareOnly.buttons.some((button) => button.id === 'home'));
  const tomorrow = composeView(Object.assign({}, base, { screen: 'result', playsLeft: 0, shareLeft: 0 }));
  assert.ok(tomorrow.result.nextLine.includes('明天'));
  assert.ok(tomorrow.buttons.some((button) => button.id === 'home'));
  assert.ok(!tomorrow.buttons.some((button) => button.id === 'again'));
}

function testFeel() {
  const gentle = tossFeel('gentle');
  const standard = tossFeel('standard');
  const fierce = tossFeel('fierce');
  assert.equal(gentle.cooldownMs, 800);
  assert.equal(standard.cooldownMs, 600);
  assert.equal(fierce.cooldownMs, 400);
  assert.ok(gentle.shake < standard.shake && standard.shake < fierce.shake);
  const lines = [tossFeelLine('gentle'), tossFeelLine('standard'), tossFeelLine('fierce')];
  assert.equal(new Set(lines).size, 3);
  assert.ok(tossAck('fierce').includes('猛火'));

  assert.equal(burnWarnKind(74, 0.79), 'none');
  assert.equal(burnWarnKind(75, 0), 'pot');
  assert.equal(burnWarnKind(10, 0.8), 'piece');
  assert.equal(burnWarnKind(80, 0.95), 'pot');
  assert.equal(burnWarnLine('none'), '');

  const fresh = goalProgress({ runsCompleted: 0, heatId: 'tutorial', merges: 0, elapsedMs: 0, cards: 0 });
  assert.equal(fresh.graduated, false);
  assert.equal(fresh.nextHeatId, 'tutorial');
  assert.equal(fresh.aheadHeatId, 'simmer');
  const merged = goalProgress({ runsCompleted: 0, heatId: 'tutorial', merges: 1, elapsedMs: 0, cards: 0 });
  assert.equal(merged.graduated, true);
  assert.equal(merged.nextHeatId, 'simmer');
  const waited = goalProgress({ runsCompleted: 0, heatId: 'tutorial', merges: 0, elapsedMs: 20000, cards: 0 });
  assert.equal(waited.graduated, true);
  assert.equal(waited.nextHeatId, 'simmer');
  const line = goalProgressLine(fresh);
  assert.ok(line.includes('出师'));
  assert.ok(line.includes('下一火'));
  assert.ok(line.includes('小火'));
  assert.ok(goalProgressLine(merged).includes('小火'));
  const simmer = goalProgress({ runsCompleted: 1, heatId: 'simmer', merges: 0, elapsedMs: 0, cards: 0 });
  assert.equal(simmer.graduated, false);
  assert.equal(simmer.nextHeatId, 'simmer');
  assert.equal(simmer.aheadHeatId, 'stir');
  assert.ok(goalProgressLine(simmer).includes('中火'));
  assert.ok(goalProgressLine(simmer).includes('仍是小火'));

  assert.equal(adSwitchOpen(false, 'x'), false);
  assert.equal(adSwitchOpen(true, ''), false);
  assert.equal(adSwitchOpen(true, 'ad'), true);
  assert.equal(boardSwitchOpen(false), false);
  assert.equal(boardSwitchOpen(true), true);
  assert.equal(shareSlotsLeft(emptyDaily('2026-10-27')), MAX_SHARE_BONUS);
  const spent = grantShareBonus(grantShareBonus(emptyDaily('2026-10-27')).state).state;
  assert.equal(shareSlotsLeft(spent), 0);
  assert.ok(restartLine(2, true, '小火').includes('小火'));
  assert.ok(restartLine(2, false, '试火').includes('仍是试火'));
  assert.ok(restartLine(0, false, '试火', 1).includes('分享'));
  assert.ok(restartLine(0, false, '试火', 0).includes('明天'));
}

function testMotionAuth() {
  assert.equal(MOTION_SCOPE, 'scope.accelerometer');
  assert.ok(MOTION_START_MS >= 5000);
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/app.ts'), 'utf8');
  const begin = appSrc.slice(appSrc.indexOf('private beginSensors'), appSrc.indexOf('private retryListen'));
  assert.ok(begin.includes('isDevtools'));
  assert.ok(begin.indexOf('isDevtools') < begin.indexOf('openSensors'));
  const open = appSrc.slice(appSrc.indexOf('private async openSensors'), appSrc.indexOf('private armMotionWait'));
  assert.ok(open.includes('startMotion('));
  assert.ok(open.includes('startAccel('));
  assert.ok(open.includes('requestMotionConsent'));
  assert.ok(open.indexOf('startMotion') < open.indexOf('startAccel'));
  assert.ok(!appSrc.includes('openMotionSettings'));
  assert.ok(appSrc.includes('practiceProfile'));
  assert.ok(!fs.readFileSync(path.join(__dirname, '../src/content/copy.ts'), 'utf8').includes('去设置'));
  const motionSrc = fs.readFileSync(path.join(__dirname, '../src/platform/wechat/motion.ts'), 'utf8');
  assert.ok(motionSrc.includes('startDeviceMotionListening'));

  let privacy = false;
  let authorized = false;
  let settingReads = 0;
  return requestMotionConsent({
    getPrivacySetting(opts) {
      opts.success({ needAuthorization: true });
    },
    requirePrivacyAuthorize(opts) {
      privacy = true;
      opts.success();
    },
    authorize() {
      authorized = true;
    },
  }).then((consent) => {
    assert.equal(consent, 'granted');
    assert.equal(privacy, true);
    assert.equal(authorized, false);
    return requestMotionConsent({
      getPrivacySetting(opts) {
        opts.success({ needAuthorization: false });
      },
      getSetting(opts) {
        settingReads += 1;
        opts.success({ authSetting: {} });
      },
      authorize(opts) {
        assert.equal(opts.scope, 'scope.accelerometer');
        opts.success();
      },
    });
  }).then((consent) => {
    assert.equal(consent, 'granted');
    assert.equal(settingReads, 1);
    return requestMotionConsent({
      getSetting(opts) {
        opts.success({ authSetting: { 'scope.accelerometer': false } });
      },
      authorize() {
        throw new Error('已经拒绝过的 scope 不应再弹 authorize');
      },
    });
  }).then((consent) => {
    assert.equal(consent, 'settings');
    let opened = '';
    return openMotionSettings({
      openAppAuthorizeSetting(opts) {
        opened = 'app';
        opts.success();
      },
      openSetting() {
        opened = 'mini';
      },
    }).then(() => {
      assert.equal(opened, 'app');
    });
  });
}

function testMotionBridge() {
  const { createMotionBridge } = require('../dist/platform/wechat/motion');
  const motionSamples = [];
  const accelSamples = [];
  const starts = [];
  const wx = {
    startDeviceMotionListening(opts) {
      starts.push(opts.interval);
      if (opts.interval === 'game') opts.fail({ errMsg: 'game unsupported' });
      else opts.success();
    },
    onDeviceMotionChange(cb) {
      cb({ alpha: '12.5', beta: 30, gamma: 0, y: '1.25' });
    },
    offDeviceMotionChange() {},
    stopDeviceMotionListening() {},
    startAccelerometer(opts) {
      opts.success();
    },
    onAccelerometerChange(cb) {
      cb({ x: '0', y: 0.2, z: 9.8 });
    },
    offAccelerometerChange() {},
    stopAccelerometer() {},
  };
  const bridge = createMotionBridge(wx);
  bridge.sink.motion = (sample) => motionSamples.push(sample);
  bridge.sink.accel = (sample) => accelSamples.push(sample);
  return bridge.startMotion().then((motion) => {
    assert.equal(motion, 'ok');
    assert.deepEqual(starts, ['game', 'ui']);
    assert.equal(motionSamples[0].alpha, 12.5);
    assert.equal(motionSamples[0].gamma, 0);
    assert.equal(accelSamples[0].y, 1.25);
    return bridge.startAccel();
  }).then((accel) => {
    assert.equal(accel, 'ok');
    const last = accelSamples[accelSamples.length - 1];
    assert.equal(last.x, 0);
    assert.equal(last.z, 9.8);
  });
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

function testHooks() {
  let created = 0;
  const off = createRewardedAd({
    enabled: false,
    adUnitId: 'ad-unit',
    create: () => {
      created += 1;
      return null;
    },
  });
  assert.equal(off.isConfigured(), false);
  return off.show().then((offResult) => {
    assert.equal(offResult, 'unavailable');
    assert.equal(created, 0);
    const watched = createRewardedAd({
      enabled: true,
      adUnitId: 'ad-unit',
      create: () => ({
        load: () => Promise.resolve(),
        show() {
          this.onClose({ isEnded: true });
          return Promise.resolve();
        },
        onLoad() {},
        onError() {},
        onClose(cb) { this.onClose = cb; },
      }),
    });
    return watched.show();
  }).then((reward) => {
    assert.equal(reward, 'reward');
    const skipped = createRewardedAd({
      enabled: true,
      adUnitId: 'ad-unit',
      create: () => ({
        load: () => Promise.resolve(),
        show() {
          this.onClose({ isEnded: false });
          return Promise.resolve();
        },
        onLoad() {},
        onError() {},
        onClose(cb) { this.onClose = cb; },
      }),
    });
    return skipped.show();
  }).then((skip) => {
    assert.equal(skip, 'skip');
    let called = 0;
    return fetchRegionalBoard(() => {
      called += 1;
      return Promise.resolve([]);
    }).then((rows) => {
      assert.equal(BOARD_ENABLED, false);
      assert.deepEqual(rows, []);
      assert.equal(called, 0);
      assert.equal(BOARD_FUNCTION_NAME, 'regionalBoard');
      assert.deepEqual(readBoard({ list: [{ region: '川渝', dish: '回锅肉', heat: 3 }] }), [
        { region: '川渝', chef: '', dish: '回锅肉', heat: 3 },
      ]);
      assert.deepEqual(readBoard({ list: [{ nope: true }] }), []);
    });
  });
}

testMerge();
testSession();
testDaily();
testGyro();
testCollage();
testName();
testWords();
testPaint();
testFeel();
testBoot();
testMotionAuth().then(() => testMotionBridge()).then(() => testHooks()).then(() => {
  console.log('颠勺王测试通过');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
