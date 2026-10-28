"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGame = startGame;
const copy_1 = require("./content/copy");
const dishes_1 = require("./content/dishes");
const model_1 = require("./cook/model");
const score_1 = require("./cook/score");
const scenes_1 = require("./flow/scenes");
const gyro_1 = require("./input/gyro");
const pointer_1 = require("./input/pointer");
const sensors_1 = require("./input/sensors");
const loop_1 = require("./loop");
const keys_1 = require("./meta/keys");
const save_1 = require("./meta/save");
const ticket_1 = require("./order/ticket");
const board_1 = require("./prep/board");
const compose_1 = require("./ui/compose");
const journal_1 = require("./plate/journal");
const paint_1 = require("./ui/paint");
const sprites_1 = require("./ui/sprites");
/** 接单和备料都计时。错点满三次，或时间到还没备齐，这单失败。 */
const ENFORCE = true;
const SHOW_DECOYS = true;
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
        this.prepWrong = 0;
        this.cook = null;
        this.burnScale = 1;
        this.plate = null;
        this.teach = '';
        this.justCleared = false;
        this.journalPath = null;
        this.journalWait = Promise.resolve();
        this.qa = false;
        this.sealTaps = 0;
        this.sealWindow = 0;
        this.lastView = null;
        this.mux = new sensors_1.SensorMux();
        this.sensorPhase = 'pending';
        this.sensorGen = 0;
        this.sensorWaitUntil = 0;
        this.samplesSeen = 0;
        this.platform = platform;
        this.save = (0, save_1.parseSave)(platform.storageGet(keys_1.KEY_SAVE), platform.now());
        this.detector = (0, gyro_1.createTossDetector)('standard');
        if (platform.launchQuery().qa === '1')
            this.qa = true;
        platform.onPointer((point) => this.onPointer(point.x, point.y));
        platform.setMotionHandler((res) => this.onMotion(res));
        platform.setAccelHandler((res) => this.onAccel(res));
        platform.setMenuShare({ title: copy_1.COPY.menuShare, query: 'from=menu' });
        (0, sprites_1.loadCollage)(() => platform.createImage());
    }
    tick(dt) {
        if (this.screen === 'order' && this.order)
            this.order = (0, ticket_1.tickOrder)(this.order, dt);
        if (this.screen === 'prep' && this.prep)
            this.prep = (0, board_1.tickPrep)(this.prep, dt);
        this.stepCook(dt);
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
            cook: this.cookView(),
            plate: this.plate,
            justCleared: this.justCleared,
            teach: this.sensorTeach(),
            debugLines: this.qa && this.cook ? (0, model_1.debugCook)(this.cook) : [],
            qa: this.qa && this.screen === 'cook',
            offerRetry: !this.platform.isDevtools && this.screen === 'cook' && (this.sensorPhase === 'deaf' || this.sensorPhase === 'fallback'),
        };
    }
    cookView() {
        if (!this.cook)
            return null;
        const cue = (0, model_1.cueLabel)(this.cook);
        return {
            even: this.cook.even,
            burn: this.cook.burn,
            leftMs: Math.max(0, this.cook.durationMs - this.cook.elapsedMs),
            totalMs: this.cook.durationMs,
            hint: cue ? `下料：${cue}` : this.cook.hint,
        };
    }
    sensorLine() {
        if (this.platform.isDevtools)
            return copy_1.COPY.sensorDevtools;
        if (this.sensorPhase === 'deaf')
            return copy_1.COPY.sensorDeaf;
        if (this.sensorPhase === 'fallback')
            return copy_1.COPY.sensorFallback;
        if (this.sensorPhase === 'live')
            return copy_1.COPY.sensorLive;
        return copy_1.COPY.sensorPending;
    }
    sensorTeach() {
        if (this.screen === 'cook') {
            const sensor = this.sensorLine();
            return this.teach ? `${this.teach}${sensor}` : sensor;
        }
        return this.teach;
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
        else if (id === 'scale-up')
            this.nudgeScale(0.2);
        else if (id === 'scale-down')
            this.nudgeScale(-0.2);
        else if (id === 'retryListen')
            this.beginSensors();
        else if (id === 'retry')
            this.retry();
        else if (id === 'clear')
            this.showClear();
        else if (id === 'share')
            void this.shareJournal();
        else if (id === 'save')
            void this.saveJournal();
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
        this.teach = this.save.tutorialDone ? '' : copy_1.COPY.teachOrder;
        this.screen = (0, scenes_1.go)('home', 'pick');
    }
    accept() {
        if (!this.dish || !this.order || this.screen !== 'order')
            return;
        this.order = (0, ticket_1.acceptOrder)(this.order);
        if (this.order.status !== 'accepted')
            return;
        this.prep = (0, board_1.createPrep)(this.dish, ENFORCE, SHOW_DECOYS);
        if (!this.save.tutorialDone)
            this.teach = copy_1.COPY.teachPrep;
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
        this.prepWrong = this.prep ? this.prep.wrong : 0;
        this.cook = (0, model_1.createCook)(this.dish, this.burnScale);
        if (!this.save.tutorialDone)
            this.teach = copy_1.COPY.teachCook;
        this.screen = (0, scenes_1.go)('prep', 'ready');
        this.beginSensors();
    }
    stepCook(dt) {
        if (!this.cook || !this.dish || this.screen !== 'cook')
            return;
        this.watchSensor();
        this.cook = (0, model_1.tickCook)(this.cook, dt, this.dish);
        if (this.cook.status !== 'cooking')
            this.settle();
    }
    toss() {
        if (!this.cook || this.screen !== 'cook' || this.cook.status !== 'cooking')
            return;
        this.cook = (0, model_1.tossCook)(this.cook);
        this.platform.vibrate();
    }
    finishCook() {
        if (!this.cook || this.screen !== 'cook' || this.cook.status !== 'cooking')
            return;
        this.cook = (0, model_1.plateCook)(this.cook);
        this.settle();
    }
    settle() {
        if (!this.dish || !this.cook || this.screen !== 'cook')
            return;
        const graded = (0, model_1.scoreCook)(this.cook, this.prepWrong * 6);
        const reason = this.cook.status === 'burnt'
            ? copy_1.COPY.failBurn
            : graded.rating === 'wreck'
                ? '这盘还没颠匀。'
                : '';
        this.publish(graded.score, graded.rating, reason);
    }
    nudgeScale(delta) {
        const next = Math.round((this.burnScale + delta) * 10) / 10;
        this.burnScale = next < 0.4 ? 0.4 : next > 1.8 ? 1.8 : next;
        if (this.cook && this.cook.status === 'cooking') {
            this.cook = Object.assign({}, this.cook, { burnScale: this.burnScale });
        }
    }
    fail(reason) {
        this.cook = null;
        this.publish(0, 'wreck', reason);
    }
    publish(score, rating, reason) {
        if (!this.dish)
            return;
        const applied = (0, save_1.applyPlate)(this.save, { dishId: this.dish.id, score, rating, at: this.platform.now() }, this.platform.now());
        let next = applied.save;
        if (!next.tutorialDone)
            next = Object.assign({}, next, { tutorialDone: true });
        this.save = next;
        this.teach = '';
        this.platform.storageSet(keys_1.KEY_SAVE, (0, save_1.serializeSave)(this.save));
        const note = rating === 'wreck' ? reason : applied.kept ? copy_1.COPY.kept : copy_1.COPY.skipped;
        this.justCleared = (0, score_1.isPassing)(rating) && (0, save_1.clearedCount)(this.save, dishes_1.DISHES) >= dishes_1.SERVICE_COUNT && !applied.save.clearSeen;
        this.plate = { dish: this.dish, score, rating, kept: applied.kept, reason: note };
        this.screen = 'plate';
        this.stopEars();
        this.captureJournal();
    }
    captureJournal() {
        if (!this.plate)
            return;
        let board = null;
        try {
            board = this.platform.createOffscreen(journal_1.JOURNAL_W, journal_1.JOURNAL_H);
            if (!board) {
                this.journalPath = null;
                this.journalWait = Promise.resolve();
                return;
            }
            const plate = this.plate;
            (0, journal_1.paintJournal)(board.ctx, {
                dish: plate.dish.name,
                region: plate.dish.region,
                rating: plate.rating,
                quip: plate.dish.quips[plate.rating],
                science: plate.dish.science,
                score: plate.score,
            });
        }
        catch (err) {
            console.warn('[颠勺] 手账没画成', err);
            this.journalPath = null;
            this.journalWait = Promise.resolve();
            return;
        }
        this.journalPath = null;
        this.journalWait = board.capture().then((path) => {
            if (path)
                this.journalPath = path;
        });
    }
    async shareJournal() {
        if (!this.plate)
            return;
        await this.journalWait;
        const status = await this.platform.share({
            title: `${this.plate.dish.name} · ${this.plate.score}分`,
            imageUrl: this.journalPath || undefined,
            query: 'from=journal',
        });
        this.teach = status === 'ok' ? copy_1.COPY.shareOk : copy_1.COPY.shareFail;
    }
    async saveJournal() {
        await this.journalWait;
        if (!this.journalPath) {
            this.teach = copy_1.COPY.saveFail;
            return;
        }
        const status = await this.platform.saveImage(this.journalPath);
        this.teach = status === 'ok' ? copy_1.COPY.saveOk : copy_1.COPY.saveFail;
    }
    showClear() {
        this.save = Object.assign({}, this.save, { clearSeen: true });
        this.platform.storageSet(keys_1.KEY_SAVE, (0, save_1.serializeSave)(this.save));
        this.justCleared = false;
        this.screen = (0, scenes_1.go)('plate', 'clear');
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
        this.stopEars();
    }
    beginSensors() {
        const gen = ++this.sensorGen;
        this.platform.stopSensors();
        this.mux.reset();
        this.detector = (0, gyro_1.createTossDetector)('standard');
        this.samplesSeen = 0;
        if (this.platform.isDevtools) {
            this.sensorPhase = 'fallback';
            return;
        }
        this.sensorPhase = 'pending';
        this.sensorWaitUntil = Number.POSITIVE_INFINITY;
        void this.openSensors(gen);
    }
    async openSensors(gen) {
        if (this.platform.isDevtools)
            return;
        const motionPromise = this.platform.startMotion();
        const accelPromise = this.platform.startAccel();
        const motion = await motionPromise;
        const accel = await accelPromise;
        if (gen !== this.sensorGen || this.screen !== 'cook')
            return;
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
        if (gen !== this.sensorGen || this.screen !== 'cook')
            return;
        if (consent === 'granted') {
            const againMotion = await this.platform.startMotion();
            const againAccel = await this.platform.startAccel();
            if (gen !== this.sensorGen || this.screen !== 'cook')
                return;
            if (againMotion === 'ok' || againAccel === 'ok') {
                this.sensorPhase = 'pending';
                this.sensorWaitUntil = this.platform.now() + 1500;
                return;
            }
        }
        this.sensorPhase = 'deaf';
    }
    watchSensor() {
        if (this.platform.isDevtools || this.sensorPhase !== 'pending')
            return;
        if (this.platform.now() <= this.sensorWaitUntil)
            return;
        if (this.samplesSeen > 0 && this.detector.isLive()) {
            this.sensorPhase = 'live';
            return;
        }
        this.sensorPhase = 'deaf';
    }
    onMotion(res) {
        if (this.screen !== 'cook')
            return;
        this.feed(this.mux.motion(res, this.platform.now()));
    }
    onAccel(res) {
        if (this.screen !== 'cook')
            return;
        this.feed(this.mux.accel(res, this.platform.now()));
    }
    feed(sample) {
        this.samplesSeen += 1;
        const event = this.detector.push(sample);
        if (this.detector.isLive())
            this.sensorPhase = 'live';
        if (event)
            this.toss();
    }
    stopEars() {
        this.sensorGen += 1;
        this.platform.stopSensors();
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
