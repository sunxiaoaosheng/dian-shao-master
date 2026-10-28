"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGame = startGame;
const copy_1 = require("./content/copy");
const dishes_1 = require("./content/dishes");
const score_1 = require("./cook/score");
const scenes_1 = require("./flow/scenes");
const pointer_1 = require("./input/pointer");
const loop_1 = require("./loop");
const keys_1 = require("./meta/keys");
const save_1 = require("./meta/save");
const ticket_1 = require("./order/ticket");
const board_1 = require("./prep/board");
const compose_1 = require("./ui/compose");
const paint_1 = require("./ui/paint");
const sprites_1 = require("./ui/sprites");
/** v1 先把流程走通。v3 再打开限时和错料。 */
const ENFORCE = false;
const SHOW_DECOYS = false;
function startGame(platform) {
    const app = new Game(platform);
    (0, loop_1.runLoop)((dt) => {
        app.tick(dt);
        app.draw();
    }, () => platform.now());
}
class Game {
    constructor(platform) {
        this.screen = 'home';
        this.dish = null;
        this.order = null;
        this.prep = null;
        this.cook = null;
        this.plate = null;
        this.teach = '';
        this.qa = false;
        this.sealTaps = 0;
        this.sealWindow = 0;
        this.lastView = null;
        this.platform = platform;
        this.save = (0, save_1.parseSave)(platform.storageGet(keys_1.KEY_SAVE), platform.now());
        if (platform.launchQuery().qa === '1')
            this.qa = true;
        platform.onPointer((point) => this.onPointer(point.x, point.y));
        platform.setMenuShare({ title: copy_1.COPY.menuShare, query: 'from=menu' });
        (0, sprites_1.loadCollage)(() => platform.createImage());
    }
    tick(dt) {
        if (this.screen === 'order' && this.order)
            this.order = (0, ticket_1.tickOrder)(this.order, dt);
        if (this.screen === 'prep' && this.prep)
            this.prep = (0, board_1.tickPrep)(this.prep, dt);
        if (this.screen === 'cook' && this.cook && this.cook.leftMs > 0) {
            const left = Math.max(0, this.cook.leftMs - dt);
            const elapsed = this.cook.totalMs - left;
            const hint = this.dish ? (0, dishes_1.phaseAt)(this.dish, elapsed / this.cook.totalMs).hint : this.cook.hint;
            this.cook = Object.assign({}, this.cook, { leftMs: left, hint });
            if (left <= 0)
                this.finishCook();
        }
        this.advance();
    }
    draw() {
        const vm = (0, compose_1.compose)(this.snapshot());
        this.lastView = vm;
        (0, paint_1.paint)(this.platform.ctx, vm);
    }
    snapshot() {
        return {
            screen: this.screen,
            width: this.platform.width,
            height: this.platform.height,
            safeTop: this.platform.safeTop,
            safeBottom: this.platform.safeBottom,
            save: this.save,
            catalog: dishes_1.DISHES,
            order: this.order,
            prep: this.prep,
            cook: this.cook,
            plate: this.plate,
            teach: this.teach,
            debugLines: this.debugLines(),
        };
    }
    debugLines() {
        if (!this.qa || !this.cook || !this.dish)
            return [];
        const elapsed = this.cook.totalMs - this.cook.leftMs;
        const phase = (0, dishes_1.phaseAt)(this.dish, elapsed / this.cook.totalMs);
        return [
            `段 ${phase.want} 均匀/秒 ${phase.evenPerSec}`,
            `糊边/秒 ${phase.burnPerSec} 闲置 ${phase.idleBurnPerSec}`,
            `现在 ${Math.round(this.cook.even)} / ${Math.round(this.cook.burn)}`,
        ];
    }
    onPointer(x, y) {
        if (!this.lastView)
            return;
        const id = (0, pointer_1.hitTest)(this.lastView.hits, x, y);
        if (!id)
            return;
        if (id === 'seal') {
            this.onSeal();
            return;
        }
        const button = findButton(this.lastView, id);
        if (button && button.disabled)
            return;
        if (id.indexOf('dish:') === 0)
            this.beginOrder(id.slice(5));
        else if (id === 'accept')
            this.accept();
        else if (id.indexOf('ing:') === 0)
            this.tapIngredient(id.slice(4));
        else if (id === 'toss')
            this.toss();
        else if (id === 'plate')
            this.finishCook();
        else if (id === 'retry')
            this.retry();
        else if (id === 'album')
            this.screen = (0, scenes_1.go)(this.screen, 'album');
        else if (id === 'home')
            this.goHome();
    }
    beginOrder(id) {
        const dish = findDish(id);
        if (!dish || !(0, save_1.isUnlocked)(this.save, dish, dishes_1.DISHES))
            return;
        this.dish = dish;
        this.order = (0, ticket_1.createOrder)(dish, ENFORCE);
        this.prep = null;
        this.cook = null;
        this.plate = null;
        this.teach = '';
        this.screen = (0, scenes_1.go)('home', 'pick');
    }
    accept() {
        if (!this.dish || !this.order || this.screen !== 'order')
            return;
        this.order = (0, ticket_1.acceptOrder)(this.order);
        if (this.order.status !== 'accepted')
            return;
        this.prep = (0, board_1.createPrep)(this.dish, ENFORCE, SHOW_DECOYS);
        this.screen = (0, scenes_1.go)('order', 'accept');
    }
    tapIngredient(id) {
        if (!this.prep || this.screen !== 'prep')
            return;
        this.prep = (0, board_1.tapPrep)(this.prep, id);
        this.advance();
    }
    beginCook() {
        if (!this.dish)
            return;
        const total = Math.round(this.dish.cookSeconds * 1000 * this.dish.pace);
        this.cook = {
            even: 0,
            burn: 0,
            leftMs: total,
            totalMs: total,
            hint: this.dish.phases[0] ? this.dish.phases[0].hint : copy_1.COPY.cookHint,
        };
        this.screen = (0, scenes_1.go)('prep', 'ready');
    }
    toss() {
        if (!this.cook || this.screen !== 'cook')
            return;
        this.cook = Object.assign({}, this.cook, { even: Math.min(100, this.cook.even + 22) });
        this.platform.vibrate();
    }
    finishCook() {
        if (!this.dish || !this.cook || this.screen !== 'cook')
            return;
        const score = (0, score_1.clampScore)(this.cook.even);
        this.publish(score, (0, score_1.ratingFor)(score), score >= 60 ? '' : '这盘还没颠匀。');
    }
    fail(reason) {
        this.cook = null;
        this.publish(0, 'wreck', reason);
    }
    publish(score, rating, reason) {
        if (!this.dish)
            return;
        const applied = (0, save_1.applyPlate)(this.save, { dishId: this.dish.id, score, rating, at: this.platform.now() }, this.platform.now());
        this.save = applied.save;
        this.platform.storageSet(keys_1.KEY_SAVE, (0, save_1.serializeSave)(this.save));
        const note = rating === 'wreck' ? reason : applied.kept ? copy_1.COPY.kept : copy_1.COPY.skipped;
        this.plate = { dish: this.dish, score, rating, kept: applied.kept, reason: note };
        this.screen = 'plate';
    }
    retry() {
        if (!this.dish)
            return;
        this.order = (0, ticket_1.createOrder)(this.dish, ENFORCE);
        this.prep = null;
        this.cook = null;
        this.plate = null;
        this.screen = (0, scenes_1.go)('plate', 'retry');
    }
    goHome() {
        this.order = null;
        this.prep = null;
        this.cook = null;
        this.plate = null;
        this.teach = '';
        this.screen = (0, scenes_1.go)(this.screen, 'home');
    }
    advance() {
        if (!this.prep || this.screen !== 'prep') {
            if (this.order && this.screen === 'order' && this.order.status === 'timeout')
                this.fail(copy_1.COPY.failTimeout);
            return;
        }
        if (this.prep.status === 'ready')
            this.beginCook();
        else if (this.prep.status === 'wrong')
            this.fail(copy_1.COPY.failPrep);
        else if (this.prep.status === 'timeout')
            this.fail(copy_1.COPY.failTimeout);
    }
    onSeal() {
        const now = this.platform.now();
        if (now - this.sealWindow > 1600)
            this.sealTaps = 0;
        this.sealWindow = now;
        this.sealTaps += 1;
        if (this.sealTaps < 5)
            return;
        this.sealTaps = 0;
        this.qa = !this.qa;
    }
}
function findDish(id) {
    for (let i = 0; i < dishes_1.DISHES.length; i += 1) {
        if (dishes_1.DISHES[i].id === id)
            return dishes_1.DISHES[i];
    }
    return null;
}
function findButton(vm, id) {
    for (let i = 0; i < vm.buttons.length; i += 1) {
        if (vm.buttons[i].id === id)
            return vm.buttons[i];
    }
    return null;
}
