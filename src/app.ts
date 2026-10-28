import { COPY } from './content/copy';
import { DISHES, SERVICE_COUNT } from './content/dishes';
import type { Dish } from './content/dishes';
import { createCook, cueLabel, debugCook, plateCook, scoreCook, tickCook, tossCook } from './cook/model';
import type { CookState } from './cook/model';
import type { Rating } from './cook/score';
import { isPassing } from './cook/score';
import { go } from './flow/scenes';
import type { ScreenId } from './flow/scenes';
import { createTossDetector } from './input/gyro';
import type { TossDetector } from './input/gyro';
import { hitTest } from './input/pointer';
import { SensorMux } from './input/sensors';
import { runLoop } from './loop';
import { KEY_SAVE } from './meta/keys';
import { applyPlate, clearedCount, isUnlocked, parseSave, serializeSave } from './meta/save';
import type { SaveState } from './meta/save';
import { acceptOrder, createOrder, tickOrder } from './order/ticket';
import type { OrderState } from './order/ticket';
import type { Platform } from './platform/types';
import { createPrep, tapPrep, tickPrep } from './prep/board';
import type { PrepState } from './prep/board';
import { compose } from './ui/compose';
import type { PlateView, StubCook } from './ui/compose';
import { JOURNAL_H, JOURNAL_W, paintJournal } from './plate/journal';
import { paint } from './ui/paint';
import { loadCollage } from './ui/sprites';
import type { ViewModel } from './ui/types';

/** 接单和备料都计时。错点满三次，或时间到还没备齐，这单失败。 */
const ENFORCE = true;
const SHOW_DECOYS = true;

export function startGame(platform: Platform): void {
  const app = new Game(platform);
  runLoop((dt) => {
    app.tick(dt);
    app.draw();
  }, () => platform.now());
}

class Game {
  private readonly platform: Platform;
  private screen: ScreenId = 'home';
  private save: SaveState;
  private dish: Dish | null = null;
  private order: OrderState | null = null;
  private prep: PrepState | null = null;
  private prepWrong = 0;
  private cook: CookState | null = null;
  private burnScale = 1;
  private plate: PlateView | null = null;
  private teach = '';
  private justCleared = false;
  private journalPath: string | null = null;
  private qa = false;
  private sealTaps = 0;
  private sealWindow = 0;
  private lastView: ViewModel | null = null;
  private readonly mux = new SensorMux();
  private detector: TossDetector;
  private sensorPhase: 'pending' | 'live' | 'fallback' | 'deaf' = 'pending';
  private sensorGen = 0;
  private sensorWaitUntil = 0;
  private samplesSeen = 0;

  constructor(platform: Platform) {
    this.platform = platform;
    this.save = parseSave(platform.storageGet(KEY_SAVE), platform.now());
    this.detector = createTossDetector('standard');
    if (platform.launchQuery().qa === '1') this.qa = true;
    platform.onPointer((point) => this.onPointer(point.x, point.y));
    platform.setMotionHandler((res) => this.onMotion(res));
    platform.setAccelHandler((res) => this.onAccel(res));
    platform.setMenuShare({ title: COPY.menuShare, query: 'from=menu' });
    loadCollage(() => platform.createImage());
  }

  tick(dt: number): void {
    if (this.screen === 'order' && this.order) this.order = tickOrder(this.order, dt);
    if (this.screen === 'prep' && this.prep) this.prep = tickPrep(this.prep, dt);
    this.stepCook(dt);
    this.advance();
  }

  draw(): void {
    const vm = compose(this.snapshot());
    this.lastView = vm;
    paint(this.platform.ctx, vm);
  }

  private snapshot() {
    return {
      screen: this.screen,
      width: this.platform.width,
      height: this.platform.height,
      safeTop: this.platform.safeTop,
      safeBottom: this.platform.safeBottom,
      save: this.save,
      catalog: DISHES,
      order: this.order,
      prep: this.prep,
      cook: this.cookView(),
      plate: this.plate,
      justCleared: this.justCleared,
      teach: this.sensorTeach(),
      debugLines: this.qa && this.cook ? debugCook(this.cook) : [],
      qa: this.qa && this.screen === 'cook',
      offerRetry: !this.platform.isDevtools && this.screen === 'cook' && (this.sensorPhase === 'deaf' || this.sensorPhase === 'fallback'),
    };
  }

  private cookView(): StubCook | null {
    if (!this.cook) return null;
    const cue = cueLabel(this.cook);
    return {
      even: this.cook.even,
      burn: this.cook.burn,
      leftMs: Math.max(0, this.cook.durationMs - this.cook.elapsedMs),
      totalMs: this.cook.durationMs,
      hint: cue ? `下料：${cue}` : this.cook.hint,
    };
  }

  private sensorTeach(): string {
    if (this.teach) return this.teach;
    if (this.screen !== 'cook') return '';
    if (this.platform.isDevtools) return COPY.sensorDevtools;
    if (this.sensorPhase === 'deaf') return COPY.sensorDeaf;
    if (this.sensorPhase === 'fallback') return COPY.sensorFallback;
    if (this.sensorPhase === 'live') return COPY.sensorLive;
    return COPY.sensorPending;
  }

  private onPointer(x: number, y: number): void {
    if (!this.lastView) return;
    const id = hitTest(this.lastView.hits, x, y);
    if (!id) return;
    if (id === 'seal') {
      this.onSeal();
      return;
    }
    const button = findButton(this.lastView, id);
    if (button && button.disabled) return;
    if (id.indexOf('dish:') === 0) this.beginOrder(id.slice(5));
    else if (id === 'accept') this.accept();
    else if (id.indexOf('ing:') === 0) this.tapIngredient(id.slice(4));
    else if (id === 'toss') this.toss();
    else if (id === 'plate') this.finishCook();
    else if (id === 'scale-up') this.nudgeScale(0.2);
    else if (id === 'scale-down') this.nudgeScale(-0.2);
    else if (id === 'retryListen') this.beginSensors();
    else if (id === 'retry') this.retry();
    else if (id === 'clear') this.showClear();
    else if (id === 'share') void this.shareJournal();
    else if (id === 'save') void this.saveJournal();
    else if (id === 'album') this.screen = go(this.screen, 'album');
    else if (id === 'home') this.goHome();
  }

  private beginOrder(id: string): void {
    const dish = findDish(id);
    if (!dish || !isUnlocked(this.save, dish, DISHES)) return;
    this.dish = dish;
    this.order = createOrder(dish, ENFORCE);
    this.prep = null;
    this.cook = null;
    this.plate = null;
    this.teach = '';
    this.screen = go('home', 'pick');
  }

  private accept(): void {
    if (!this.dish || !this.order || this.screen !== 'order') return;
    this.order = acceptOrder(this.order);
    if (this.order.status !== 'accepted') return;
    this.prep = createPrep(this.dish, ENFORCE, SHOW_DECOYS);
    this.screen = go('order', 'accept');
  }

  private tapIngredient(id: string): void {
    if (!this.prep || this.screen !== 'prep') return;
    this.prep = tapPrep(this.prep, id);
    this.advance();
  }

  private beginCook(): void {
    if (!this.dish) return;
    this.prepWrong = this.prep ? this.prep.wrong : 0;
    this.cook = createCook(this.dish, this.burnScale);
    this.screen = go('prep', 'ready');
    this.beginSensors();
  }

  private stepCook(dt: number): void {
    if (!this.cook || !this.dish || this.screen !== 'cook') return;
    this.watchSensor();
    this.cook = tickCook(this.cook, dt, this.dish);
    if (this.cook.status !== 'cooking') this.settle();
  }

  private toss(): void {
    if (!this.cook || this.screen !== 'cook' || this.cook.status !== 'cooking') return;
    this.cook = tossCook(this.cook);
    this.platform.vibrate();
  }

  private finishCook(): void {
    if (!this.cook || this.screen !== 'cook' || this.cook.status !== 'cooking') return;
    this.cook = plateCook(this.cook);
    this.settle();
  }

  private settle(): void {
    if (!this.dish || !this.cook || this.screen !== 'cook') return;
    const graded = scoreCook(this.cook, this.prepWrong * 6);
    const reason = this.cook.status === 'burnt'
      ? COPY.failBurn
      : graded.rating === 'wreck'
        ? '这盘还没颠匀。'
        : '';
    this.publish(graded.score, graded.rating, reason);
  }

  private nudgeScale(delta: number): void {
    const next = Math.round((this.burnScale + delta) * 10) / 10;
    this.burnScale = next < 0.4 ? 0.4 : next > 1.8 ? 1.8 : next;
    if (this.cook && this.cook.status === 'cooking') {
      this.cook = Object.assign({}, this.cook, { burnScale: this.burnScale });
    }
  }

  private fail(reason: string): void {
    this.cook = null;
    this.publish(0, 'wreck', reason);
  }

  private publish(score: number, rating: Rating, reason: string): void {
    if (!this.dish) return;
    const applied = applyPlate(
      this.save,
      { dishId: this.dish.id, score, rating, at: this.platform.now() },
      this.platform.now(),
    );
    this.save = applied.save;
    this.platform.storageSet(KEY_SAVE, serializeSave(this.save));
    const note = rating === 'wreck' ? reason : applied.kept ? COPY.kept : COPY.skipped;
    this.justCleared = isPassing(rating) && clearedCount(this.save, DISHES) >= SERVICE_COUNT && !applied.save.clearSeen;
    this.plate = { dish: this.dish, score, rating, kept: applied.kept, reason: note };
    this.screen = 'plate';
    this.stopEars();
    this.captureJournal();
  }

  private captureJournal(): void {
    if (!this.plate) return;
    const board = this.platform.createOffscreen(JOURNAL_W, JOURNAL_H);
    if (!board) {
      this.journalPath = null;
      return;
    }
    const plate = this.plate;
    paintJournal(board.ctx, {
      dish: plate.dish.name,
      region: plate.dish.region,
      rating: plate.rating,
      quip: plate.dish.quips[plate.rating],
      science: plate.dish.science,
      score: plate.score,
    });
    this.journalPath = null;
    void board.capture().then((path) => {
      if (path) this.journalPath = path;
    });
  }

  private async shareJournal(): Promise<void> {
    if (!this.plate) return;
    const status = await this.platform.share({
      title: `${this.plate.dish.name} · ${this.plate.score}分`,
      imageUrl: this.journalPath || undefined,
      query: 'from=journal',
    });
    this.teach = status === 'ok' ? COPY.shareOk : COPY.shareFail;
  }

  private async saveJournal(): Promise<void> {
    if (!this.journalPath) {
      this.teach = COPY.saveFail;
      return;
    }
    const status = await this.platform.saveImage(this.journalPath);
    this.teach = status === 'ok' ? COPY.saveOk : COPY.saveFail;
  }

  private showClear(): void {
    this.save = Object.assign({}, this.save, { clearSeen: true });
    this.platform.storageSet(KEY_SAVE, serializeSave(this.save));
    this.justCleared = false;
    this.screen = go('plate', 'clear');
  }

  private retry(): void {
    if (!this.dish) return;
    this.order = createOrder(this.dish, ENFORCE);
    this.prep = null;
    this.cook = null;
    this.plate = null;
    this.screen = go('plate', 'retry');
  }

  private goHome(): void {
    this.order = null;
    this.prep = null;
    this.cook = null;
    this.plate = null;
    this.teach = '';
    this.screen = go(this.screen, 'home');
    this.stopEars();
  }

  private beginSensors(): void {
    const gen = ++this.sensorGen;
    this.platform.stopSensors();
    this.mux.reset();
    this.detector = createTossDetector('standard');
    this.samplesSeen = 0;
    if (this.platform.isDevtools) {
      this.sensorPhase = 'fallback';
      return;
    }
    this.sensorPhase = 'pending';
    this.sensorWaitUntil = Number.POSITIVE_INFINITY;
    void this.openSensors(gen);
  }

  private async openSensors(gen: number): Promise<void> {
    if (this.platform.isDevtools) return;
    const motionPromise = this.platform.startMotion();
    const accelPromise = this.platform.startAccel();
    const motion = await motionPromise;
    const accel = await accelPromise;
    if (gen !== this.sensorGen || this.screen !== 'cook') return;
    if (motion === 'ok' || accel === 'ok') {
      if (this.sensorPhase !== 'live') {
        this.sensorPhase = 'pending';
        this.sensorWaitUntil = this.platform.now() + 1500;
      }
      return;
    }
    if (motion === 'unsupported' && accel === 'unsupported') {
      this.sensorPhase = 'fallback';
      return;
    }
    const consent = await this.platform.requestMotionConsent();
    if (gen !== this.sensorGen || this.screen !== 'cook') return;
    if (consent === 'granted') {
      const againMotion = await this.platform.startMotion();
      const againAccel = await this.platform.startAccel();
      if (gen !== this.sensorGen || this.screen !== 'cook') return;
      if (againMotion === 'ok' || againAccel === 'ok') {
        this.sensorPhase = 'pending';
        this.sensorWaitUntil = this.platform.now() + 1500;
        return;
      }
    }
    this.sensorPhase = 'deaf';
  }

  private watchSensor(): void {
    if (this.platform.isDevtools || this.sensorPhase !== 'pending') return;
    if (this.platform.now() <= this.sensorWaitUntil) return;
    if (this.samplesSeen > 0 && this.detector.isLive()) {
      this.sensorPhase = 'live';
      return;
    }
    this.sensorPhase = 'deaf';
  }

  private onMotion(res: { alpha: number; beta: number; gamma: number }): void {
    if (this.screen !== 'cook') return;
    this.feed(this.mux.motion(res, this.platform.now()));
  }

  private onAccel(res: { x: number; y: number; z: number }): void {
    if (this.screen !== 'cook') return;
    this.feed(this.mux.accel(res, this.platform.now()));
  }

  private feed(sample: Parameters<TossDetector['push']>[0]): void {
    this.samplesSeen += 1;
    const event = this.detector.push(sample);
    if (this.detector.isLive()) this.sensorPhase = 'live';
    if (event) this.toss();
  }

  private stopEars(): void {
    this.sensorGen += 1;
    this.platform.stopSensors();
  }

  private advance(): void {
    if (!this.prep || this.screen !== 'prep') {
      if (this.order && this.screen === 'order' && this.order.status === 'timeout') this.fail(COPY.failTimeout);
      return;
    }
    if (this.prep.status === 'ready') this.beginCook();
    else if (this.prep.status === 'wrong') this.fail(COPY.failPrep);
    else if (this.prep.status === 'timeout') this.fail(COPY.failTimeout);
  }

  private onSeal(): void {
    const now = this.platform.now();
    if (now - this.sealWindow > 1600) this.sealTaps = 0;
    this.sealWindow = now;
    this.sealTaps += 1;
    if (this.sealTaps < 5) return;
    this.sealTaps = 0;
    this.qa = !this.qa;
  }
}

function findDish(id: string): Dish | null {
  for (let i = 0; i < DISHES.length; i += 1) {
    if (DISHES[i].id === id) return DISHES[i];
  }
  return null;
}

function findButton(vm: ViewModel, id: string): { disabled: boolean } | null {
  for (let i = 0; i < vm.buttons.length; i += 1) {
    if (vm.buttons[i].id === id) return vm.buttons[i];
  }
  return null;
}
