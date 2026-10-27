"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeView = composeView;
const recipes_1 = require("../content/recipes");
const copy_1 = require("../content/copy");
const burn_1 = require("../core/burn");
const session_1 = require("../core/session");
const TIERS = ['gentle', 'standard', 'fierce'];
function composeView(input) {
    const vm = {
        width: input.width,
        height: input.height,
        now: input.now,
        shake: input.shake,
        screen: input.screen,
        title: copy_1.COPY.title,
        subtitle: copy_1.COPY.subtitle,
        playsLabel: (0, copy_1.playsLeftLabel)(input.playsLeft),
        playsHint: copy_1.COPY.playsHint,
        heatLabel: copy_1.HEAT_NAME[input.heatId],
        sensorLabel: input.sensorLabel,
        buttons: [],
        hits: [],
        toasts: liveToasts(input),
        toastY: input.height * 0.62,
        board: input.board.slice(0, 4).map((row) => ({
            region: row.region,
            line: `${row.chef} · ${row.dish}`,
        })),
        boardTitle: copy_1.COPY.boardTitle,
        showBoard: false,
        boardTop: 0,
        seal: null,
        play: null,
        result: null,
        album: null,
        albumTitle: copy_1.COPY.albumTitle,
        qaLines: input.qa
            ? [
                `识别 ${input.qa.detected}`,
                `冲量 ${input.qa.impulse.toFixed(2)}  转角 ${input.qa.angle.toFixed(0)}°`,
                `${input.qa.unit} · ${input.qa.phase}`,
            ]
            : [],
    };
    if (input.screen === 'home')
        layoutHome(input, vm);
    else if (input.screen === 'play')
        layoutPlay(input, vm);
    else if (input.screen === 'result')
        layoutResult(input, vm);
    else
        layoutAlbum(input, vm);
    for (let i = 0; i < vm.buttons.length; i += 1) {
        const button = vm.buttons[i];
        vm.hits.push({ id: button.id, x: button.x, y: button.y, w: button.w, h: button.h });
    }
    if (vm.seal)
        vm.hits.push(vm.seal);
    return vm;
}
function layoutHome(input, vm) {
    const pad = 18;
    const bw = input.width - pad * 2;
    vm.seal = { id: 'seal', x: input.width - 72, y: input.safeTop + 16, w: 54, h: 54 };
    let y = input.safeTop + 176;
    const tw = (bw - 16) / 3;
    for (let i = 0; i < TIERS.length; i += 1) {
        const tier = TIERS[i];
        vm.buttons.push(button(`tier:${tier}`, copy_1.TIER_NAME[tier], pad + i * (tw + 8), y, tw, 36, false, false, tier === input.tier));
    }
    y += 78;
    const stack = [
        { id: 'start', label: copy_1.COPY.start, primary: true, disabled: input.playsLeft <= 0 },
        { id: 'share', label: copy_1.COPY.shareHome, primary: false, disabled: false },
        { id: 'album', label: copy_1.COPY.album, primary: false, disabled: false },
        { id: 'ad', label: copy_1.COPY.adButton, primary: false, disabled: false },
    ];
    for (let i = 0; i < stack.length; i += 1) {
        const item = stack[i];
        vm.buttons.push(button(item.id, item.label, pad, y, bw, 46, item.primary, item.disabled, false));
        y += 54;
    }
    vm.toastY = Math.min(input.height * 0.72, y);
    if (y < input.height - input.safeBottom - 120) {
        vm.showBoard = true;
        vm.boardTop = y + 6;
    }
}
function layoutPlay(input, vm) {
    const session = input.session;
    const recipe = input.recipe;
    if (!session || !recipe)
        return;
    const top = input.safeTop + 8;
    const bottom = 112 + input.safeBottom;
    const gap = 6;
    const availW = input.width - 28;
    const availH = input.height - bottom - (top + 86);
    let cell = Math.floor(Math.min((availW - gap * (session.cols - 1)) / session.cols, (availH - gap * (session.rows - 1)) / session.rows));
    if (cell > 86)
        cell = 86;
    if (cell < 40)
        cell = 40;
    const gridW = cell * session.cols + gap * (session.cols - 1);
    const gridH = cell * session.rows + gap * (session.rows - 1);
    const gx = (input.width - gridW) / 2;
    const gy = top + 86 + Math.max(0, (availH - gridH) / 2);
    const cells = [];
    for (let i = 0; i < session.cells.length; i += 1) {
        const piece = session.cells[i];
        const col = i % session.cols;
        const row = (i / session.cols) | 0;
        const x = gx + col * (cell + gap);
        const y = gy + row * (cell + gap);
        const hit = { id: `cell:${i}`, x, y, w: cell, h: cell };
        vm.hits.push(hit);
        cells.push({
            hitId: hit.id,
            x,
            y,
            w: cell,
            h: cell,
            name: piece.level > 0 ? (0, recipes_1.levelShort)(recipe, piece.level) : '',
            level: piece.level,
            burnt: piece.burnt,
            cook: (0, burn_1.cookRatio)(piece, session.baseBurnMs, session.burnPerLevelMs),
            seed: piece.id || i + 1,
            ink: recipe.ink,
        });
    }
    const overflow = (0, session_1.overflowRatio)(session);
    vm.play = {
        recipeName: recipe.name,
        region: recipe.region,
        scoreText: (0, copy_1.scoreLabel)(session.score),
        meter: session.meter / 100,
        chargesText: (0, copy_1.chargesLabel)(session.charges),
        charges: session.charges,
        maxCharges: session.maxCharges,
        tossedText: (0, copy_1.tossedLabel)(session.tossCount),
        showPerfect: session.cardsThisRun > 0,
        showBurnt: session.meter >= 85,
        cells,
        nextName: (0, recipes_1.levelShort)(recipe, session.nextLevel),
        nextLevel: session.nextLevel,
        nextInk: recipe.ink,
        showTossButton: input.showTossButton,
        overflowText: overflow === null ? '' : copy_1.COPY.overflow,
        hint: session.hint && session.merges === 0 ? copy_1.COPY.hint : '',
        wok: { x: gx - 18, y: gy - 8, w: gridW + 36, h: gridH + 22 },
        nextBox: { x: 16, y: input.height - input.safeBottom - 92, w: 68, h: 76 },
    };
    if (input.showTossButton) {
        vm.buttons.push(button('toss', copy_1.COPY.toss, input.width - 156, input.height - input.safeBottom - 70, 140, 46, true, session.charges <= 0, false));
    }
    vm.toastY = gy + gridH * 0.42;
}
function layoutResult(input, vm) {
    const result = input.result;
    const card = result && result.cardName ? (0, copy_1.cardBody)(result.cardName) : copy_1.COPY.noCardBody;
    const reason = result && result.reason === 'grid_full' ? copy_1.COPY.fullFailTitle : copy_1.COPY.burnFailTitle;
    const detail = result && result.reason === 'grid_full' ? copy_1.COPY.fullFailBody : copy_1.COPY.burnFailBody;
    vm.result = {
        title: reason,
        body: `${detail}${card}`,
        scoreText: (0, copy_1.scoreLabel)(result ? result.score : 0),
    };
    const pad = 18;
    const bw = input.width - pad * 2;
    let y = input.safeTop + 210;
    const stack = [];
    if (input.playsLeft > 0)
        stack.push({ id: 'again', label: copy_1.COPY.again, primary: true });
    if (input.canSave)
        stack.push({ id: 'save', label: copy_1.COPY.saveClip, primary: false });
    stack.push({ id: 'share', label: copy_1.COPY.shareButton, primary: false });
    stack.push({ id: 'ad', label: copy_1.COPY.adButton, primary: false });
    stack.push({ id: 'home', label: copy_1.COPY.back, primary: false });
    for (let i = 0; i < stack.length; i += 1) {
        const item = stack[i];
        vm.buttons.push(button(item.id, item.label, pad, y, bw, 44, item.primary, false, false));
        y += 52;
    }
    vm.toastY = input.safeTop + 168;
}
function layoutAlbum(input, vm) {
    const owned = new Set();
    for (let i = 0; i < input.album.cards.length; i += 1)
        owned.add(input.album.cards[i].recipeId);
    const pad = 16;
    const gap = 10;
    const cols = 2;
    const rows = Math.ceil(recipes_1.RECIPES.length / cols);
    const cardW = (input.width - pad * 2 - gap) / cols;
    const available = input.height - input.safeTop - input.safeBottom - 78 - 74;
    const cardH = Math.max(92, Math.min(150, (available - gap * (rows - 1)) / rows));
    const cards = [];
    for (let i = 0; i < recipes_1.RECIPES.length; i += 1) {
        const recipe = recipes_1.RECIPES[i];
        const col = i % cols;
        const row = (i / cols) | 0;
        const has = owned.has(recipe.id);
        cards.push({
            name: has ? recipe.name : copy_1.COPY.albumEmpty,
            region: recipe.region,
            blurb: has ? recipe.blurb : '',
            owned: has,
            ink: recipe.ink,
            x: pad + col * (cardW + gap),
            y: input.safeTop + 78 + row * (cardH + gap),
            w: cardW,
            h: cardH,
            level: recipe.levels.length,
        });
    }
    vm.album = cards;
    vm.buttons.push(button('home', copy_1.COPY.back, 18, input.height - input.safeBottom - 62, input.width - 36, 46, true, false, false));
}
function button(id, label, x, y, w, h, primary, disabled, selected) {
    return { id, label, x, y, w, h, primary, disabled, selected };
}
function liveToasts(input) {
    const out = [];
    for (let i = 0; i < input.toasts.length; i += 1) {
        const toast = input.toasts[i];
        if (toast.until <= input.now)
            continue;
        const span = Math.max(1, toast.until - toast.born);
        out.push({ text: toast.text, seed: toast.seed, life: (toast.until - input.now) / span });
    }
    return out;
}
