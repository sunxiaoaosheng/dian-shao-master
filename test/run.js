'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { installManifest, MANIFEST_PATHS } = require('../loadManifest');

const manifestJsonPath = path.join(__dirname, '../assets/manifest.json');
const manifestReads = [];
installManifest((filePath, encoding) => {
  manifestReads.push([filePath, encoding]);
  if (filePath !== MANIFEST_PATHS[0]) throw new Error(`清单路径应从代码包根目录写，收到 ${filePath}`);
  if (encoding !== 'utf8') throw new Error(`清单编码应为 utf8，收到 ${encoding}`);
  return fs.readFileSync(manifestJsonPath, 'utf8');
});

const { DISHES, SERVICE_COUNT, validateDishes, dishById, phaseAt } = require('../dist/content/dishes');
const { ratingFor, isPassing, entersWindow, PASS_SCORE, SIGN_SCORE, GOD_SCORE } = require('../dist/cook/score');
const {
  emptySave,
  applyPlate,
  parseSave,
  serializeSave,
  isUnlocked,
  clearedCount,
  showcaseOf,
  passed,
} = require('../dist/meta/save');
const { go } = require('../dist/flow/scenes');
const { createOrder, tickOrder, acceptOrder } = require('../dist/order/ticket');
const { createPrep, tapPrep, tickPrep, PREP_MAX_WRONG } = require('../dist/prep/board');
const { createCook, tickCook, tossCook, scoreCook, plateCook } = require('../dist/cook/model');
const { phaseAt: phaseOf } = require('../dist/content/dishes');

function testDishes() {
  assert.equal(validateDishes(DISHES).length, 0, validateDishes(DISHES).join('；'));
  assert.equal(SERVICE_COUNT, 6);
  assert.equal(DISHES[0].id, 'fanqie');
  assert.equal(DISHES[0].name, '番茄炒蛋');
  assert.deepEqual(DISHES.map((dish) => dish.id), ['fanqie', 'youmai', 'chaofan']);
  const youmai = dishById('youmai');
  assert.ok(createOrder(youmai, true).totalMs < youmai.orderSeconds * 1000);
  assert.ok(phaseAt(DISHES[0], 0).hint.includes('蛋'));
  assert.equal(phaseAt(DISHES[0], 1).want, 'toss');
  const broken = [Object.assign({}, DISHES[0], { science: '菜'.repeat(31) })];
  assert.ok(validateDishes(broken).length > 0);
}

function testScore() {
  assert.equal(ratingFor(59), 'wreck');
  assert.equal(ratingFor(PASS_SCORE), 'pass');
  assert.equal(ratingFor(SIGN_SCORE), 'sign');
  assert.equal(ratingFor(GOD_SCORE), 'god');
  assert.equal(isPassing('wreck'), false);
  assert.equal(isPassing('pass'), true);
  assert.equal(entersWindow('pass'), false);
  assert.equal(entersWindow('sign'), true);
  assert.equal(entersWindow('god'), true);
}

function testSave() {
  const now = Date.parse('2026-10-28T12:00:00');
  let save = emptySave(now);
  const low = applyPlate(save, { dishId: 'fanqie', score: 40, rating: 'wreck', at: now }, now);
  assert.equal(low.kept, false);
  assert.equal(passed(low.save, 'fanqie'), false);
  const mid = applyPlate(save, { dishId: 'fanqie', score: 70, rating: 'pass', at: now }, now);
  assert.equal(mid.kept, true);
  assert.equal(mid.save.today.score, 70);
  const again = applyPlate(mid.save, { dishId: 'fanqie', score: 66, rating: 'pass', at: now + 10 }, now);
  assert.equal(again.kept, false);
  assert.equal(again.save.plates.fanqie.score, 70);
  const better = applyPlate(again.save, { dishId: 'fanqie', score: 90, rating: 'sign', at: now + 20 }, now);
  assert.equal(better.kept, true);
  assert.equal(showcaseOf(better.save).score, 90);
  const round = parseSave(serializeSave(better.save), now);
  assert.equal(round.plates.fanqie.rating, 'sign');
  assert.equal(parseSave('{', now).today.score, 0);
  const nextDay = parseSave(serializeSave(better.save), Date.parse('2026-10-29T08:00:00'));
  assert.equal(nextDay.today.score, 0);
  assert.equal(nextDay.plates.fanqie.score, 90);
  assert.equal(isUnlocked(save, DISHES[0], DISHES), true);
  assert.equal(clearedCount(better.save, DISHES), 1);
}

function testFlow() {
  assert.equal(go('home', 'pick'), 'order');
  assert.equal(go('order', 'accept'), 'prep');
  assert.equal(go('prep', 'ready'), 'cook');
  assert.equal(go('cook', 'plate'), 'plate');
  assert.equal(go('plate', 'retry'), 'order');
  assert.equal(go('plate', 'home'), 'home');
  assert.equal(go('home', 'album'), 'album');
  const dish = dishById('fanqie');
  let order = createOrder(dish, false);
  order = tickOrder(order, order.totalMs + 1000);
  assert.equal(order.status, 'waiting');
  const strict = tickOrder(createOrder(dish, true), dish.orderSeconds * 1000 + 50);
  assert.equal(strict.status, 'timeout');
  assert.equal(acceptOrder(createOrder(dish, true)).status, 'accepted');
  let prep = createPrep(dish, false, false);
  assert.equal(prep.pieces.length, dish.need.length);
  for (let i = 0; i < dish.need.length; i += 1) prep = tapPrep(prep, dish.need[i].id);
  assert.equal(prep.status, 'ready');
  assert.equal(PREP_MAX_WRONG, 3);
  const shown = createPrep(dish, true, true);
  assert.ok(shown.pieces.some((piece) => piece.role === 'decoy'));
  assert.ok(!shown.pieces.some((piece) => piece.role === 'taboo'));
  const spicy = Object.assign({}, dish, { taboo: '少辣' });
  let wrong = createPrep(spicy, true, true);
  assert.ok(wrong.pieces.some((piece) => piece.role === 'taboo' && piece.id === 'pepper'));
  wrong = tapPrep(wrong, 'pepper');
  wrong = tapPrep(wrong, 'pepper');
  wrong = tapPrep(wrong, 'pepper');
  assert.equal(wrong.status, 'wrong');
  const slow = tickPrep(createPrep(dish, true, true), dish.prepSeconds * 1000 + 40);
  assert.equal(slow.status, 'timeout');
  let partial = createPrep(dish, true, true);
  partial = tapPrep(partial, 'potato');
  assert.equal(partial.wrong, 1);
  assert.equal(partial.status, 'working');
}

function playDish(dish, policy) {
  let cook = createCook(dish, 1);
  let guard = 0;
  while (cook.status === 'cooking' && guard < 800) {
    const progress = cook.durationMs <= 0 ? 1 : cook.elapsedMs / cook.durationMs;
    const phase = phaseOf(dish, progress);
    const inDrop = cook.drops.some((drop) => {
      if (drop.hit || drop.missed) return false;
      const center = drop.at * cook.durationMs;
      const half = drop.window * cook.durationMs;
      return Math.abs(cook.elapsedMs - center) <= half;
    });
    const shouldToss = policy === 'always' || (policy === 'follow' && (phase.want === 'toss' || inDrop));
    if (shouldToss && cook.pulseMs <= 0) cook = tossCook(cook);
    cook = tickCook(cook, 50, dish);
    guard += 1;
  }
  return cook;
}

function testCook() {
  const dish = dishById('fanqie');
  for (let i = 0; i < DISHES.length; i += 1) {
    const followed = playDish(DISHES[i], 'follow');
    const followedGrade = scoreCook(followed, 0);
    assert.equal(followed.status, 'plated', `${DISHES[i].name} 跟着曲线应出锅`);
    assert.ok(followedGrade.score >= 60, `${DISHES[i].name} 跟着曲线应及格，实际 ${followedGrade.score}`);
  }
  const good = playDish(dish, 'follow');
  const goodGrade = scoreCook(good, 0);
  assert.equal(good.status, 'plated', `跟着曲线应能出锅，实际 ${good.status} 糊边 ${good.burn}`);
  assert.ok(goodGrade.score >= 60, `跟着曲线至少及格，实际 ${goodGrade.score} 均匀 ${good.even} 糊边 ${good.burn} 下料 ${goodGrade.dropsHit}/${goodGrade.dropsTotal}`);
  assert.equal(goodGrade.dropsHit, dish.drops.length);
  const bad = playDish(dish, 'always');
  assert.equal(bad.status, 'burnt', `一直猛颠应该糊，糊边 ${bad.burn}`);
  assert.equal(scoreCook(bad, 0).rating, 'wreck');
  assert.equal(scoreCook(bad, 0).score, 0);
  const quiet = playDish(dish, 'never');
  assert.equal(quiet.status, 'plated');
  assert.equal(scoreCook(quiet, 0).rating, 'wreck');
  const early = plateCook(createCook(dish, 1));
  assert.equal(early.status, 'plated');
  assert.equal(scoreCook(early, 0).rating, 'wreck');
  const now = Date.parse('2026-10-28T12:00:00');
  const save = emptySave(now);
  const kept = applyPlate(save, { dishId: 'fanqie', score: 88, rating: 'sign', at: now }, now);
  const retry = applyPlate(kept.save, { dishId: 'fanqie', score: 0, rating: 'wreck', at: now + 1 }, now);
  assert.equal(retry.kept, false);
  assert.equal(retry.save.plates.fanqie.score, 88);
}

function testProject() {
  const root = path.join(__dirname, '..');
  const project = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'));
  assert.equal(project.appid, 'wx2ffe6f213fe9c05b');
  assert.equal(project.projectname, 'dian-shao-master');
  assert.equal(project.isGameTourist, false);
  const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
  assert.ok(game.includes('readFileSync'));
  assert.ok(game.includes('getFileSystemManager'));
  assert.ok(!game.includes("require('./assets/manifest.json')"));
  assert.ok(!game.includes('require("../../assets/manifest.json")'));
  assert.equal(manifestReads[0][0], '/assets/manifest.json');
  assert.ok(!fs.existsSync(path.join(root, 'src/core/session.ts')));
  assert.ok(!fs.existsSync(path.join(root, 'src/meta/difficulty.ts')));
  const app = fs.readFileSync(path.join(root, 'src/app.ts'), 'utf8');
  assert.ok(!app.includes('createSession'));
  assert.ok(!app.includes('resolveMerges'));
  const banned = /工位|周报|KPI|OKR|打卡|同事|老板|会议|PPT|职场|格子间|加班|最后一格|需求文档|排期|考勤/;
  const files = walk(path.join(root, 'src'));
  for (let i = 0; i < files.length; i += 1) {
    const text = fs.readFileSync(files[i], 'utf8');
    assert.ok(!banned.test(text), `${path.relative(root, files[i])} 出现了不该有的词`);
  }
}

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.ts')) out.push(full);
  }
  return out;
}

function mockCtx() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === 'measureText') return () => ({ width: 12 });
      if (prop === 'createLinearGradient') return () => gradient;
      return () => undefined;
    },
    set() {
      return true;
    },
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
      return { width: 10, height: 10, getContext() { return mockCtx(); } };
    },
    onTouchEnd() {},
    getStorageSync() { return ''; },
    setStorageSync() {},
    showShareMenu() {},
    onShareAppMessage() {},
    onShow() {},
    onHide() {},
    getLaunchOptionsSync() { return { query: {} }; },
    createImage() {
      let onload = null;
      return {
        width: 4,
        height: 4,
        onerror: null,
        get onload() { return onload; },
        set onload(fn) { onload = fn; },
        set src(_value) { if (onload) onload(); },
      };
    },
  };
  require('../dist/main.js');
}

testDishes();
testScore();
testSave();
testFlow();
testCook();
testProject();
testBoot();
console.log('颠勺王测试通过');
