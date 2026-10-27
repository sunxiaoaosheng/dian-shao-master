import { COPY, HEAT_NAME, TIER_NAME, cardToast, heatStart } from './content/copy';
import { TOAST_LINES, pickToast } from './content/toasts';
import { recipeForRun } from './content/recipes';
import type { Recipe } from './content/recipes';
import type { GameEvent } from './core/types';
import { applyToss, createSession, place, tick } from './core/session';
import type { Session } from './core/session';
import {
  canAcceptToss,
  cooldownMsFor,
  createTossDetector,
  nextReadyAt,
} from './input/gyro';
import type { SensitivityTier, TossDetector } from './input/gyro';
import { hitTest } from './input/pointer';
import { SensorMux } from './input/sensors';
import { runLoop } from './loop';
import { createReservedRewardedAd } from './meta/ads';
import type { RewardedAdHook } from './meta/ads';
import { grantCard, parseAlbum, serializeAlbum } from './meta/cards';
import type { AlbumState } from './meta/cards';
import {
  canStart,
  consumePlay,
  formatDay,
  grantAdBonus,
  grantShareBonus,
  parseDaily,
  playsRemaining,
  rollDaily,
  serializeDaily,
} from './meta/daily';
import type { DailyState } from './meta/daily';
import { pickProfile } from './meta/difficulty';
import { KEY_ALBUM, KEY_DAILY, KEY_META } from './meta/keys';
import { getRegionalBoard } from './meta/leaderboard';
import { parseMeta, serializeMeta } from './meta/progress';
import type { MetaState } from './meta/progress';
import { shareQuery, shareTitle } from './meta/share';
import type { Platform } from './platform/types';
import { composeView } from './ui/compose';
import type { ToastState } from './ui/compose';
import { paint } from './ui/paint';
import { loadCollage } from './ui/sprites';
import type { ScreenId, ViewModel } from './ui/types';
import { CLIP_H, CLIP_W, paintClip } from './viral/clip';
import { momentLine } from './viral/moment';
import type { TossMoment } from './viral/moment';
import { CARD_H, CARD_W, paintShareCard } from './viral/shareCard';

type SensorPhase = 'pending' | 'live' | 'fallback';

export function startGame(platform: Platform): void {
  const app = new GameApp(platform);
  runLoop((dt) => {
    app.tick(dt);
    app.draw();
  }, () => platform.now());
}

class GameApp {
  private readonly platform: Platform;
  private readonly ad: RewardedAdHook;
  private readonly mux = new SensorMux();
  private screen: ScreenId = 'home';
  private daily: DailyState;
  private album: AlbumState;
  private meta: MetaState;
  private session: Session | null = null;
  private recipe: Recipe | null = null;
  private detector: TossDetector;
  private toasts: ToastState[] = [];
  private lastView: ViewModel | null = null;
  private sensorPhase: SensorPhase = 'pending';
  private sensorGen = 0;
  private sensorWaitUntil = 0;
  private tossReadyAt = 0;
  private shake = 0;
  private detectedTosses = 0;
  private qaMode = false;
  private sealTaps = 0;
  private sealWindow = 0;
  private ended = false;
  private announcedSensor = false;
  private toldFallback = false;
  private toldNoCharge = false;
  private loggedLive = false;
  private lastMoment: TossMoment | null = null;
  private lastClipPath: string | null = null;
  private result: { reason: 'burnt_out' | 'grid_full'; score: number; cardName: string | null } | null = null;

  constructor(platform: Platform) {
    this.platform = platform;
    const today = formatDay(platform.now());
    this.daily = rollDaily(parseDaily(platform.storageGet(KEY_DAILY)), today);
    this.album = parseAlbum(platform.storageGet(KEY_ALBUM));
    this.meta = parseMeta(platform.storageGet(KEY_META));
    this.detector = createTossDetector(this.meta.tier);
    this.ad = createReservedRewardedAd();
    if (platform.launchQuery().qa === '1') this.qaMode = true;

    platform.onPointer((point) => this.onPointer(point.x, point.y));
    platform.onShow(() => {
      this.refreshDate();
      if (this.screen === 'play') this.beginSensors();
    });
    platform.onHide(() => {
      if (this.screen === 'play') this.platform.stopSensors();
    });
    platform.setMotionHandler((res) => {
      if (this.screen !== 'play' || !this.session) return;
      this.feed(this.mux.motion(res, this.platform.now()));
    });
    platform.setAccelHandler((res) => {
      if (this.screen !== 'play' || !this.session) return;
      this.feed(this.mux.accel(res, this.platform.now()));
    });
    platform.setMenuShare({ title: COPY.menuShare, query: 'from=menu' });
    loadCollage(() => platform.createImage());
  }

  tick(dt: number): void {
    this.refreshDate();
    if (this.shake > 0) this.shake *= Math.exp(-dt / 160);
    if (this.screen === 'play' && this.session) {
      this.consumeEvents(tick(this.session, dt));
      this.watchSensor();
    }
  }

  draw(): void {
    const vm = composeView(this.snapshot());
    this.lastView = vm;
    paint(this.platform.ctx, vm);
  }

  private snapshot() {
    const peek = this.detector.peek();
    const nextHeat = pickProfile(this.meta.runsCompleted).id;
    return {
      screen: this.screen,
      width: this.platform.width,
      height: this.platform.height,
      safeTop: this.platform.safeTop,
      safeBottom: this.platform.safeBottom,
      now: this.platform.now(),
      playsLeft: playsRemaining(this.daily),
      tier: this.meta.tier,
      heatId: this.session && this.screen !== 'home' ? this.session.heatId : nextHeat,
      recipe: this.recipe,
      session: this.session,
      album: this.album,
      board: getRegionalBoard(),
      toasts: this.toasts,
      showTossButton: this.platform.isDevtools || this.sensorPhase !== 'live',
      sensorLabel: this.sensorLabel(),
      result: this.result,
      shake: this.shake,
      canSave: Boolean(this.lastClipPath),
      qa: this.qaMode
        ? {
            detected: this.detectedTosses,
            impulse: peek.impulse,
            angle: peek.angle,
            unit: peek.unit,
            phase: this.sensorPhase,
          }
        : null,
    };
  }

  private onPointer(x: number, y: number): void {
    if (!this.lastView) return;
    const id = hitTest(this.lastView.hits, x, y);
    if (!id) return;
    if (id === 'seal') {
      this.onSeal();
      return;
    }
    if (id.indexOf('tier:') === 0) {
      this.setTier(id.slice(5));
      return;
    }
    if (id.indexOf('cell:') === 0) {
      this.onCell(Number(id.slice(5)));
      return;
    }
    if (id === 'start' || id === 'again') this.startRun();
    else if (id === 'album') this.screen = 'album';
    else if (id === 'home') this.goHome();
    else if (id === 'toss') this.tryToss('button');
    else if (id === 'share') void this.shareVoluntary();
    else if (id === 'ad') void this.watchAd();
    else if (id === 'save') void this.saveClip();
  }

  private startRun(): void {
    this.refreshDate();
    if (!canStart(this.daily)) {
      this.toast(COPY.noPlays);
      return;
    }
    this.daily = consumePlay(this.daily);
    this.saveDaily();
    const profile = pickProfile(this.meta.runsCompleted);
    this.recipe = recipeForRun(this.meta.runsCompleted);
    this.session = createSession({
      recipeId: this.recipe.id,
      maxLevel: this.recipe.levels.length,
      profile,
      seed: this.platform.now() >>> 0,
    });
    this.screen = 'play';
    this.result = null;
    this.ended = false;
    this.toldFallback = false;
    this.toldNoCharge = false;
    this.tossReadyAt = 0;
    this.lastMoment = null;
    this.lastClipPath = null;
    this.toast(profile.hint ? COPY.hint : heatStart(HEAT_NAME[profile.id]));
    this.beginSensors();
  }

  private goHome(): void {
    this.sensorGen += 1;
    this.platform.stopSensors();
    this.screen = 'home';
  }

  private onCell(index: number): void {
    if (!this.session || this.screen !== 'play' || !Number.isFinite(index)) return;
    const result = place(this.session, index);
    if (!result.ok) return;
    this.consumeEvents(result.events);
  }

  private tryToss(source: 'gyro' | 'button'): void {
    if (!this.session || this.screen !== 'play') return;
    const now = this.platform.now();
    if (!canAcceptToss(now, this.tossReadyAt)) {
      if (source === 'button') this.toast(COPY.tossSoon);
      return;
    }
    const result = applyToss(this.session);
    if (!result.ok) {
      if (result.reason === 'empty' && (source === 'button' || !this.toldNoCharge)) {
        this.toldNoCharge = true;
        this.toast(COPY.noCharges);
      }
      return;
    }
    this.tossReadyAt = nextReadyAt(now, this.meta.tier);
    this.shake = 1;
    this.platform.vibrate();
    this.toast(pickToast(now).text);
    this.captureMoment(source === 'gyro' ? 1 : 0.65);
    this.consumeEvents(result.events);
  }

  private feed(sample: Parameters<TossDetector['push']>[0]): void {
    const event = this.detector.push(sample);
    if (this.detector.isLive() && !this.platform.isDevtools) this.sensorPhase = 'live';
    if (!this.loggedLive && this.detector.isLive()) {
      this.loggedLive = true;
      console.log('[颠勺] 传感器就绪', this.detector.peek().unit, '冷却ms', cooldownMsFor(this.meta.tier));
    }
    if (!event) return;
    this.detectedTosses += 1;
    console.log('[颠勺] 识别', this.detectedTosses);
    this.tryToss('gyro');
  }

  private beginSensors(): void {
    const gen = ++this.sensorGen;
    this.platform.stopSensors();
    this.mux.reset();
    this.detector = createTossDetector(this.meta.tier);
    this.detectedTosses = 0;
    this.loggedLive = false;
    if (this.platform.isDevtools) {
      this.sensorPhase = 'fallback';
      if (!this.announcedSensor) {
        this.announcedSensor = true;
        this.toast(COPY.sensorDevtools);
      }
    } else {
      this.sensorPhase = 'pending';
      this.sensorWaitUntil = this.platform.now() + 1200;
    }
    void this.openSensors(gen);
  }

  private async openSensors(gen: number): Promise<void> {
    const motion = await this.platform.startMotion();
    const accel = await this.platform.startAccel();
    if (gen !== this.sensorGen) return;
    if (motion !== 'ok' && accel !== 'ok') {
      this.sensorPhase = 'fallback';
      if (!this.platform.isDevtools && !this.toldFallback) {
        this.toldFallback = true;
        this.toast(COPY.sensorFallback);
      }
    }
  }

  private watchSensor(): void {
    if (this.platform.isDevtools || this.sensorPhase !== 'pending') return;
    if (this.platform.now() <= this.sensorWaitUntil) return;
    if (this.detector.isLive()) {
      this.sensorPhase = 'live';
      return;
    }
    this.sensorPhase = 'fallback';
    if (!this.toldFallback) {
      this.toldFallback = true;
      this.toast(COPY.sensorFallback);
    }
  }

  private captureMoment(energy: number): void {
    const dish = this.recipe ? this.recipe.name : '';
    const moment: TossMoment = {
      dish,
      region: this.recipe ? this.recipe.region : '',
      line: momentLine(dish),
      score: this.session ? this.session.score : 0,
      energy,
      ink: this.recipe ? this.recipe.ink : '#c4452d',
    };
    this.lastMoment = moment;
    const board = this.platform.createOffscreen(CLIP_W, CLIP_H);
    if (!board) return;
    paintClip(board.ctx, moment);
    void board.capture().then((path) => {
      if (path) this.lastClipPath = path;
    });
  }

  private async shareVoluntary(): Promise<void> {
    const dish = (this.result && this.result.cardName) || (this.recipe ? this.recipe.name : '');
    const score = this.session ? this.session.score : 0;
    const moment: TossMoment = this.lastMoment || {
      dish,
      region: this.recipe ? this.recipe.region : '',
      line: momentLine(dish),
      score,
      energy: 0.6,
      ink: this.recipe ? this.recipe.ink : '#c4452d',
    };
    let image: string | undefined;
    const card = this.platform.createOffscreen(CARD_W, CARD_H);
    if (card) {
      paintShareCard(card.ctx, moment);
      const path = await card.capture();
      if (path) image = path;
    }
    const status = await this.platform.share({ title: shareTitle(dish, score), imageUrl: image, query: shareQuery() });
    if (status !== 'ok') {
      this.toast(COPY.shareFail);
      return;
    }
    this.refreshDate();
    const granted = grantShareBonus(this.daily);
    this.daily = granted.state;
    this.saveDaily();
    this.toast(granted.granted ? COPY.shareOk : COPY.shareCap);
  }

  private async watchAd(): Promise<void> {
    if (!this.ad.isConfigured()) {
      this.toast(COPY.adPending);
      return;
    }
    const result = await this.ad.show();
    if (result !== 'reward') {
      this.toast(COPY.adSkip);
      return;
    }
    this.refreshDate();
    const granted = grantAdBonus(this.daily);
    this.daily = granted.state;
    this.saveDaily();
    this.toast(granted.granted ? COPY.adOk : COPY.shareCap);
  }

  private async saveClip(): Promise<void> {
    if (!this.lastClipPath) {
      this.toast(COPY.saveFail);
      return;
    }
    const status = await this.platform.saveImage(this.lastClipPath);
    this.toast(status === 'ok' ? COPY.saveOk : COPY.saveFail);
  }

  private consumeEvents(events: readonly GameEvent[]): void {
    let merged = false;
    let burnt = false;
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];
      if (event.type === 'merge') merged = true;
      else if (event.type === 'signature') this.onSignature();
      else if (event.type === 'plate') this.toast(COPY.plate);
      else if (event.type === 'burn_warn') this.toast(COPY.warn);
      else if (event.type === 'overflow') this.toast(COPY.overflow);
      else if (event.type === 'burnt_piece') burnt = true;
      else if (event.type === 'fail') this.finishRun(event.reason);
    }
    if (merged) this.toast(pickToast(this.platform.now() + 3).text);
    if (burnt) this.toast(COPY.burntPiece);
  }

  private onSignature(): void {
    if (!this.recipe) return;
    const granted = grantCard(this.album, {
      recipeId: this.recipe.id,
      name: this.recipe.name,
      region: this.recipe.region,
      blurb: this.recipe.blurb,
      unlockedAt: this.platform.now(),
    });
    this.album = granted.album;
    if (!granted.isNew) return;
    this.saveAlbum();
    this.toast(cardToast(this.recipe.name));
  }

  private finishRun(reason: 'burnt_out' | 'grid_full'): void {
    if (this.ended || !this.session) return;
    this.ended = true;
    const session = this.session;
    if (session.merges >= 1 || session.elapsedMs >= 20000 || session.cardsThisRun > 0) {
      this.meta.runsCompleted += 1;
      this.saveMeta();
    }
    this.result = {
      reason,
      score: session.score,
      cardName: session.cardsThisRun > 0 && this.recipe ? this.recipe.name : null,
    };
    this.screen = 'result';
    if (reason === 'burnt_out') this.toast(TOAST_LINES[6].text);
    this.sensorGen += 1;
    this.platform.stopSensors();
  }

  private setTier(raw: string): void {
    if (raw !== 'gentle' && raw !== 'standard' && raw !== 'fierce') return;
    const tier: SensitivityTier = raw;
    this.meta.tier = tier;
    this.detector.setTier(tier);
    this.saveMeta();
    this.toast(`${COPY.tierTitle}：${TIER_NAME[tier]}`);
  }

  private onSeal(): void {
    const now = this.platform.now();
    if (now - this.sealWindow > 1600) this.sealTaps = 0;
    this.sealWindow = now;
    this.sealTaps += 1;
    if (this.sealTaps < 5) return;
    this.sealTaps = 0;
    this.qaMode = !this.qaMode;
    this.toast(this.qaMode ? COPY.qaOn : COPY.qaOff);
  }

  private sensorLabel(): string {
    if (this.platform.isDevtools) return COPY.sensorDevtools;
    if (this.sensorPhase === 'fallback') return COPY.sensorFallback;
    if (this.sensorPhase === 'live') return COPY.sensorLive;
    return COPY.sensorPending;
  }

  private toast(text: string): void {
    const now = this.platform.now();
    this.toasts.push({ text, seed: now % 9973, born: now, until: now + 1700 });
    if (this.toasts.length > 3) this.toasts.shift();
  }

  private refreshDate(): void {
    const today = formatDay(this.platform.now());
    if (this.daily.date === today) return;
    this.daily = rollDaily(this.daily, today);
    this.saveDaily();
  }

  private saveDaily(): void {
    this.platform.storageSet(KEY_DAILY, serializeDaily(this.daily));
  }

  private saveAlbum(): void {
    this.platform.storageSet(KEY_ALBUM, serializeAlbum(this.album));
  }

  private saveMeta(): void {
    this.platform.storageSet(KEY_META, serializeMeta(this.meta));
  }
}
