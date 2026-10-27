"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGame = startGame;
const copy_1 = require("./content/copy");
const toasts_1 = require("./content/toasts");
const recipes_1 = require("./content/recipes");
const session_1 = require("./core/session");
const gyro_1 = require("./input/gyro");
const pointer_1 = require("./input/pointer");
const sensors_1 = require("./input/sensors");
const loop_1 = require("./loop");
const ads_1 = require("./meta/ads");
const cards_1 = require("./meta/cards");
const daily_1 = require("./meta/daily");
const difficulty_1 = require("./meta/difficulty");
const keys_1 = require("./meta/keys");
const leaderboard_1 = require("./meta/leaderboard");
const progress_1 = require("./meta/progress");
const share_1 = require("./meta/share");
const compose_1 = require("./ui/compose");
const paint_1 = require("./ui/paint");
const sprites_1 = require("./ui/sprites");
const clip_1 = require("./viral/clip");
const moment_1 = require("./viral/moment");
const shareCard_1 = require("./viral/shareCard");
function startGame(platform) {
    const app = new GameApp(platform);
    (0, loop_1.runLoop)((dt) => {
        app.tick(dt);
        app.draw();
    }, () => platform.now());
}
class GameApp {
    constructor(platform) {
        this.mux = new sensors_1.SensorMux();
        this.screen = 'home';
        this.session = null;
        this.recipe = null;
        this.toasts = [];
        this.lastView = null;
        this.sensorPhase = 'pending';
        this.sensorGen = 0;
        this.sensorWaitUntil = 0;
        this.tossReadyAt = 0;
        this.shake = 0;
        this.detectedTosses = 0;
        this.qaMode = false;
        this.sealTaps = 0;
        this.sealWindow = 0;
        this.ended = false;
        this.announcedSensor = false;
        this.toldFallback = false;
        this.toldNoCharge = false;
        this.loggedLive = false;
        this.lastMoment = null;
        this.lastClipPath = null;
        this.result = null;
        this.platform = platform;
        const today = (0, daily_1.formatDay)(platform.now());
        this.daily = (0, daily_1.rollDaily)((0, daily_1.parseDaily)(platform.storageGet(keys_1.KEY_DAILY)), today);
        this.album = (0, cards_1.parseAlbum)(platform.storageGet(keys_1.KEY_ALBUM));
        this.meta = (0, progress_1.parseMeta)(platform.storageGet(keys_1.KEY_META));
        this.detector = (0, gyro_1.createTossDetector)(this.meta.tier);
        this.ad = (0, ads_1.createReservedRewardedAd)();
        if (platform.launchQuery().qa === '1')
            this.qaMode = true;
        platform.onPointer((point) => this.onPointer(point.x, point.y));
        platform.onShow(() => {
            this.refreshDate();
            if (this.screen === 'play')
                this.beginSensors();
        });
        platform.onHide(() => {
            if (this.screen === 'play')
                this.platform.stopSensors();
        });
        platform.setMotionHandler((res) => {
            if (this.screen !== 'play' || !this.session)
                return;
            this.feed(this.mux.motion(res, this.platform.now()));
        });
        platform.setAccelHandler((res) => {
            if (this.screen !== 'play' || !this.session)
                return;
            this.feed(this.mux.accel(res, this.platform.now()));
        });
        platform.setMenuShare({ title: copy_1.COPY.menuShare, query: 'from=menu' });
        (0, sprites_1.loadCollage)(() => platform.createImage());
    }
    tick(dt) {
        this.refreshDate();
        if (this.shake > 0)
            this.shake *= Math.exp(-dt / 160);
        if (this.screen === 'play' && this.session) {
            this.consumeEvents((0, session_1.tick)(this.session, dt));
            this.watchSensor();
        }
    }
    draw() {
        const vm = (0, compose_1.composeView)(this.snapshot());
        this.lastView = vm;
        (0, paint_1.paint)(this.platform.ctx, vm);
    }
    snapshot() {
        const peek = this.detector.peek();
        const nextHeat = (0, difficulty_1.pickProfile)(this.meta.runsCompleted).id;
        return {
            screen: this.screen,
            width: this.platform.width,
            height: this.platform.height,
            safeTop: this.platform.safeTop,
            safeBottom: this.platform.safeBottom,
            now: this.platform.now(),
            playsLeft: (0, daily_1.playsRemaining)(this.daily),
            tier: this.meta.tier,
            heatId: this.session && this.screen !== 'home' ? this.session.heatId : nextHeat,
            recipe: this.recipe,
            session: this.session,
            album: this.album,
            board: (0, leaderboard_1.getRegionalBoard)(),
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
        if (id.indexOf('tier:') === 0) {
            this.setTier(id.slice(5));
            return;
        }
        if (id.indexOf('cell:') === 0) {
            this.onCell(Number(id.slice(5)));
            return;
        }
        if (id === 'start' || id === 'again')
            this.startRun();
        else if (id === 'album')
            this.screen = 'album';
        else if (id === 'home')
            this.goHome();
        else if (id === 'toss')
            this.tryToss('button');
        else if (id === 'share')
            void this.shareVoluntary();
        else if (id === 'ad')
            void this.watchAd();
        else if (id === 'save')
            void this.saveClip();
    }
    startRun() {
        this.refreshDate();
        if (!(0, daily_1.canStart)(this.daily)) {
            this.toast(copy_1.COPY.noPlays);
            return;
        }
        this.daily = (0, daily_1.consumePlay)(this.daily);
        this.saveDaily();
        const profile = (0, difficulty_1.pickProfile)(this.meta.runsCompleted);
        this.recipe = (0, recipes_1.recipeForRun)(this.meta.runsCompleted);
        this.session = (0, session_1.createSession)({
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
        this.toast(profile.hint ? copy_1.COPY.hint : (0, copy_1.heatStart)(copy_1.HEAT_NAME[profile.id]));
        this.beginSensors();
    }
    goHome() {
        this.sensorGen += 1;
        this.platform.stopSensors();
        this.screen = 'home';
    }
    onCell(index) {
        if (!this.session || this.screen !== 'play' || !Number.isFinite(index))
            return;
        const result = (0, session_1.place)(this.session, index);
        if (!result.ok)
            return;
        this.consumeEvents(result.events);
    }
    tryToss(source) {
        if (!this.session || this.screen !== 'play')
            return;
        const now = this.platform.now();
        if (!(0, gyro_1.canAcceptToss)(now, this.tossReadyAt)) {
            if (source === 'button')
                this.toast(copy_1.COPY.tossSoon);
            return;
        }
        const result = (0, session_1.applyToss)(this.session);
        if (!result.ok) {
            if (result.reason === 'empty' && (source === 'button' || !this.toldNoCharge)) {
                this.toldNoCharge = true;
                this.toast(copy_1.COPY.noCharges);
            }
            return;
        }
        this.tossReadyAt = (0, gyro_1.nextReadyAt)(now, this.meta.tier);
        this.shake = 1;
        this.platform.vibrate();
        this.toast((0, toasts_1.pickToast)(now).text);
        this.captureMoment(source === 'gyro' ? 1 : 0.65);
        this.consumeEvents(result.events);
    }
    feed(sample) {
        const event = this.detector.push(sample);
        if (this.detector.isLive() && !this.platform.isDevtools)
            this.sensorPhase = 'live';
        if (!this.loggedLive && this.detector.isLive()) {
            this.loggedLive = true;
            console.log('[颠勺] 传感器就绪', this.detector.peek().unit, '冷却ms', (0, gyro_1.cooldownMsFor)(this.meta.tier));
        }
        if (!event)
            return;
        this.detectedTosses += 1;
        console.log('[颠勺] 识别', this.detectedTosses);
        this.tryToss('gyro');
    }
    beginSensors() {
        const gen = ++this.sensorGen;
        this.platform.stopSensors();
        this.mux.reset();
        this.detector = (0, gyro_1.createTossDetector)(this.meta.tier);
        this.detectedTosses = 0;
        this.loggedLive = false;
        if (this.platform.isDevtools) {
            this.sensorPhase = 'fallback';
            if (!this.announcedSensor) {
                this.announcedSensor = true;
                this.toast(copy_1.COPY.sensorDevtools);
            }
        }
        else {
            this.sensorPhase = 'pending';
            this.sensorWaitUntil = this.platform.now() + 1200;
        }
        void this.openSensors(gen);
    }
    async openSensors(gen) {
        const motion = await this.platform.startMotion();
        const accel = await this.platform.startAccel();
        if (gen !== this.sensorGen)
            return;
        if (motion !== 'ok' && accel !== 'ok') {
            this.sensorPhase = 'fallback';
            if (!this.platform.isDevtools && !this.toldFallback) {
                this.toldFallback = true;
                this.toast(copy_1.COPY.sensorFallback);
            }
        }
    }
    watchSensor() {
        if (this.platform.isDevtools || this.sensorPhase !== 'pending')
            return;
        if (this.platform.now() <= this.sensorWaitUntil)
            return;
        if (this.detector.isLive()) {
            this.sensorPhase = 'live';
            return;
        }
        this.sensorPhase = 'fallback';
        if (!this.toldFallback) {
            this.toldFallback = true;
            this.toast(copy_1.COPY.sensorFallback);
        }
    }
    captureMoment(energy) {
        const dish = this.recipe ? this.recipe.name : '';
        const moment = {
            dish,
            region: this.recipe ? this.recipe.region : '',
            line: (0, moment_1.momentLine)(dish),
            score: this.session ? this.session.score : 0,
            energy,
            ink: this.recipe ? this.recipe.ink : '#c4452d',
        };
        this.lastMoment = moment;
        const board = this.platform.createOffscreen(clip_1.CLIP_W, clip_1.CLIP_H);
        if (!board)
            return;
        (0, clip_1.paintClip)(board.ctx, moment);
        void board.capture().then((path) => {
            if (path)
                this.lastClipPath = path;
        });
    }
    async shareVoluntary() {
        const dish = (this.result && this.result.cardName) || (this.recipe ? this.recipe.name : '');
        const score = this.session ? this.session.score : 0;
        const moment = this.lastMoment || {
            dish,
            region: this.recipe ? this.recipe.region : '',
            line: (0, moment_1.momentLine)(dish),
            score,
            energy: 0.6,
            ink: this.recipe ? this.recipe.ink : '#c4452d',
        };
        let image;
        const card = this.platform.createOffscreen(shareCard_1.CARD_W, shareCard_1.CARD_H);
        if (card) {
            (0, shareCard_1.paintShareCard)(card.ctx, moment);
            const path = await card.capture();
            if (path)
                image = path;
        }
        const status = await this.platform.share({ title: (0, share_1.shareTitle)(dish, score), imageUrl: image, query: (0, share_1.shareQuery)() });
        if (status !== 'ok') {
            this.toast(copy_1.COPY.shareFail);
            return;
        }
        this.refreshDate();
        const granted = (0, daily_1.grantShareBonus)(this.daily);
        this.daily = granted.state;
        this.saveDaily();
        this.toast(granted.granted ? copy_1.COPY.shareOk : copy_1.COPY.shareCap);
    }
    async watchAd() {
        if (!this.ad.isConfigured()) {
            this.toast(copy_1.COPY.adPending);
            return;
        }
        const result = await this.ad.show();
        if (result !== 'reward') {
            this.toast(copy_1.COPY.adSkip);
            return;
        }
        this.refreshDate();
        const granted = (0, daily_1.grantAdBonus)(this.daily);
        this.daily = granted.state;
        this.saveDaily();
        this.toast(granted.granted ? copy_1.COPY.adOk : copy_1.COPY.shareCap);
    }
    async saveClip() {
        if (!this.lastClipPath) {
            this.toast(copy_1.COPY.saveFail);
            return;
        }
        const status = await this.platform.saveImage(this.lastClipPath);
        this.toast(status === 'ok' ? copy_1.COPY.saveOk : copy_1.COPY.saveFail);
    }
    consumeEvents(events) {
        let merged = false;
        let burnt = false;
        for (let i = 0; i < events.length; i += 1) {
            const event = events[i];
            if (event.type === 'merge')
                merged = true;
            else if (event.type === 'signature')
                this.onSignature();
            else if (event.type === 'plate')
                this.toast(copy_1.COPY.plate);
            else if (event.type === 'burn_warn')
                this.toast(copy_1.COPY.warn);
            else if (event.type === 'overflow')
                this.toast(copy_1.COPY.overflow);
            else if (event.type === 'burnt_piece')
                burnt = true;
            else if (event.type === 'fail')
                this.finishRun(event.reason);
        }
        if (merged)
            this.toast((0, toasts_1.pickToast)(this.platform.now() + 3).text);
        if (burnt)
            this.toast(copy_1.COPY.burntPiece);
    }
    onSignature() {
        if (!this.recipe)
            return;
        const granted = (0, cards_1.grantCard)(this.album, {
            recipeId: this.recipe.id,
            name: this.recipe.name,
            region: this.recipe.region,
            blurb: this.recipe.blurb,
            unlockedAt: this.platform.now(),
        });
        this.album = granted.album;
        if (!granted.isNew)
            return;
        this.saveAlbum();
        this.toast((0, copy_1.cardToast)(this.recipe.name));
    }
    finishRun(reason) {
        if (this.ended || !this.session)
            return;
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
        if (reason === 'burnt_out')
            this.toast(toasts_1.TOAST_LINES[6].text);
        this.sensorGen += 1;
        this.platform.stopSensors();
    }
    setTier(raw) {
        if (raw !== 'gentle' && raw !== 'standard' && raw !== 'fierce')
            return;
        const tier = raw;
        this.meta.tier = tier;
        this.detector.setTier(tier);
        this.saveMeta();
        this.toast(`${copy_1.COPY.tierTitle}：${copy_1.TIER_NAME[tier]}`);
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
        this.qaMode = !this.qaMode;
        this.toast(this.qaMode ? copy_1.COPY.qaOn : copy_1.COPY.qaOff);
    }
    sensorLabel() {
        if (this.platform.isDevtools)
            return copy_1.COPY.sensorDevtools;
        if (this.sensorPhase === 'fallback')
            return copy_1.COPY.sensorFallback;
        if (this.sensorPhase === 'live')
            return copy_1.COPY.sensorLive;
        return copy_1.COPY.sensorPending;
    }
    toast(text) {
        const now = this.platform.now();
        this.toasts.push({ text, seed: now % 9973, born: now, until: now + 1700 });
        if (this.toasts.length > 3)
            this.toasts.shift();
    }
    refreshDate() {
        const today = (0, daily_1.formatDay)(this.platform.now());
        if (this.daily.date === today)
            return;
        this.daily = (0, daily_1.rollDaily)(this.daily, today);
        this.saveDaily();
    }
    saveDaily() {
        this.platform.storageSet(keys_1.KEY_DAILY, (0, daily_1.serializeDaily)(this.daily));
    }
    saveAlbum() {
        this.platform.storageSet(keys_1.KEY_ALBUM, (0, cards_1.serializeAlbum)(this.album));
    }
    saveMeta() {
        this.platform.storageSet(keys_1.KEY_META, (0, progress_1.serializeMeta)(this.meta));
    }
}
