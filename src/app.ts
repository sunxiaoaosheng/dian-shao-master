import { COPY } from './content/copy';
import { DISHES, phaseAt } from './content/dishes';
import type { Dish } from './content/dishes';
import { clampScore, ratingFor } from './cook/score';
import type { Rating } from './cook/score';
import { go } from './flow/scenes';
import type { ScreenId } from './flow/scenes';
import { hitTest } from './input/pointer';
import { runLoop } from './loop';
import { KEY_SAVE } from './meta/keys';
import { applyPlate, isUnlocked, parseSave, serializeSave } from './meta/save';
import type { SaveState } from './meta/save';
import { acceptOrder, createOrder, tickOrder } from './order/ticket';
import type { OrderState } from './order/ticket';
import type { Platform } from './platform/types';
import { createPrep, tapPrep, tickPrep } from './prep/board';
import type { PrepState } from './prep/board';
import { compose } from './ui/compose';
import type { PlateView, StubCook } from './ui/compose';
import { paint } from './ui/paint';
import { loadCollage } from './ui/sprites';
import type { ViewModel } from './ui/types';

/** v1 先把流程走通。v3 再打开限时和错料。 */
const ENFORCE = false;
const SHOW_DECOYS = false;

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
  private cook: StubCook | null = null;
  private plate: PlateView | null = null;
  private teach = '';
  private qa = false;
  private sealTaps = 0;
  private sealWindow = 0;
  private lastView: ViewModel | null = null;

  constructor(platform: Platform) {
    this.platform = platform;
    this.save = parseSave(platform.storageGet(KEY_SAVE), platform.now());
    if (platform.launchQuery().qa === '1') this.qa = true;
    platform.onPointer((point) => this.onPointer(point.x, point.y));
    platform.setMenuShare({ title: COPY.menuShare, query: 'from=menu' });
    loadCollage(() => platform.createImage());
  }

  tick(dt: number): void {
    if (this.screen === 'order' && this.order) this.order = tickOrder(this.order, dt);
    if (this.screen === 'prep' && this.prep) this.prep = tickPrep(this.prep, dt);
    if (this.screen === 'cook' && this.cook && this.cook.leftMs > 0) {
      const left = Math.max(0, this.cook.leftMs - dt);
      const elapsed = this.cook.totalMs - left;
      const hint = this.dish ? phaseAt(this.dish, elapsed / this.cook.totalMs).hint : this.cook.hint;
      this.cook = Object.assign({}, this.cook, { leftMs: left, hint });
      if (left <= 0) this.finishCook();
    }
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
      cook: this.cook,
      plate: this.plate,
      teach: this.teach,
      debugLines: this.debugLines(),
    };
  }

  private debugLines(): string[] {
    if (!this.qa || !this.cook || !this.dish) return [];
    const elapsed = this.cook.totalMs - this.cook.leftMs;
    const phase = phaseAt(this.dish, elapsed / this.cook.totalMs);
    return [
      `段 ${phase.want} 均匀/秒 ${phase.evenPerSec}`,
      `糊边/秒 ${phase.burnPerSec} 闲置 ${phase.idleBurnPerSec}`,
      `现在 ${Math.round(this.cook.even)} / ${Math.round(this.cook.burn)}`,
    ];
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
    else if (id === 'retry') this.retry();
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
    const total = Math.round(this.dish.cookSeconds * 1000 * this.dish.pace);
    this.cook = {
      even: 0,
      burn: 0,
      leftMs: total,
      totalMs: total,
      hint: this.dish.phases[0] ? this.dish.phases[0].hint : COPY.cookHint,
    };
    this.screen = go('prep', 'ready');
  }

  private toss(): void {
    if (!this.cook || this.screen !== 'cook') return;
    this.cook = Object.assign({}, this.cook, { even: Math.min(100, this.cook.even + 22) });
    this.platform.vibrate();
  }

  private finishCook(): void {
    if (!this.dish || !this.cook || this.screen !== 'cook') return;
    const score = clampScore(this.cook.even);
    this.publish(score, ratingFor(score), score >= 60 ? '' : '这盘还没颠匀。');
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
    this.plate = { dish: this.dish, score, rating, kept: applied.kept, reason: note };
    this.screen = 'plate';
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
