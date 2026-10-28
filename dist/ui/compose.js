"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compose = compose;
const copy_1 = require("../content/copy");
const home_1 = require("../meta/home");
const save_1 = require("../meta/save");
const dishes_1 = require("../content/dishes");
function compose(input) {
    const vm = {
        width: input.width,
        height: input.height,
        screen: input.screen,
        title: copy_1.COPY.title,
        subtitle: copy_1.COPY.subtitle,
        lines: [],
        hint: '',
        note: input.teach,
        even: null,
        burn: null,
        tossing: false,
        stickers: [],
        albumPage: 0,
        albumPages: 0,
        buttons: [],
        chips: [],
        hits: [],
        debugLines: input.debugLines,
    };
    if (input.screen === 'home')
        layoutHome(input, vm);
    else if (input.screen === 'order')
        layoutOrder(input, vm);
    else if (input.screen === 'prep')
        layoutPrep(input, vm);
    else if (input.screen === 'cook')
        layoutCook(input, vm);
    else if (input.screen === 'plate')
        layoutPlate(input, vm);
    else if (input.screen === 'clear')
        layoutClear(input, vm);
    else
        layoutAlbum(input, vm);
    for (let i = 0; i < vm.buttons.length; i += 1) {
        const button = vm.buttons[i];
        vm.hits.push({ id: button.id, x: button.x, y: button.y, w: button.w, h: button.h });
    }
    for (let i = 0; i < vm.chips.length; i += 1) {
        const chip = vm.chips[i];
        vm.hits.push({ id: chip.id, x: chip.x, y: chip.y, w: chip.w, h: chip.h });
    }
    vm.hits.push({ id: 'seal', x: input.width - 72, y: input.safeTop + 12, w: 54, h: 54 });
    return vm;
}
function layoutHome(input, vm) {
    vm.lines = (0, home_1.homeLines)(input.save, input.catalog);
    const catalog = input.catalog;
    const gap = 14;
    const top = input.safeTop + 196;
    const footer = input.safeBottom + 72;
    const rows = Math.max(1, Math.ceil(catalog.length / 2));
    const avail = input.height - footer - top;
    const cardH = (avail - gap * (rows - 1)) / rows;
    const cardW = (input.width - 36 - gap) / 2;
    for (let i = 0; i < catalog.length; i += 1) {
        const dish = catalog[i];
        const open = (0, save_1.isUnlocked)(input.save, dish, catalog);
        const col = i % 2;
        const row = Math.floor(i / 2);
        vm.buttons.push(button(`dish:${dish.id}`, open ? dish.name : dish.name, 18 + col * (cardW + gap), top + row * (cardH + gap), cardW, cardH, open, !open));
    }
    vm.buttons.push(button('album', copy_1.COPY.album, 18, input.height - input.safeBottom - 58, input.width - 36, 48, false, false));
}
function layoutOrder(input, vm) {
    const order = input.order;
    vm.title = order ? order.dishName : copy_1.COPY.title;
    vm.subtitle = order ? order.region : '';
    vm.lines = order ? [order.line, (0, copy_1.clockLabel)(order.leftMs)] : [];
    vm.hint = input.teach || copy_1.COPY.orderHint;
    const y = input.height - input.safeBottom - 132;
    vm.buttons.push(button('accept', copy_1.COPY.accept, 18, y, input.width - 36, 64, true, false));
    vm.buttons.push(button('home', copy_1.COPY.back, 18, y + 74, input.width - 36, 48, false, false));
}
function layoutPrep(input, vm) {
    const prep = input.prep;
    vm.title = '砧板';
    vm.subtitle = prep ? (0, copy_1.clockLabel)(prep.leftMs) : '';
    vm.lines = prep ? [`点错 ${prep.wrong}/${prep.maxWrong}`] : [];
    vm.hint = input.teach || copy_1.COPY.prepHint;
    const pieces = prep ? prep.pieces : [];
    const missId = prep ? prep.missId : '';
    const colW = (input.width - 36 - 16) / 2;
    for (let i = 0; i < pieces.length; i += 1) {
        const piece = pieces[i];
        const col = i % 2;
        const row = Math.floor(i / 2);
        const chip = {
            id: `ing:${piece.id}`,
            label: piece.name,
            ink: piece.ink,
            shape: piece.id,
            role: piece.role,
            x: 18 + col * (colW + 16),
            y: input.safeTop + 248 + row * 92,
            w: colW,
            h: 80,
            got: piece.got,
            bad: piece.role !== 'need',
            crossed: piece.id === missId,
        };
        vm.chips.push(chip);
    }
    vm.buttons.push(button('home', copy_1.COPY.back, 18, input.height - input.safeBottom - 64, input.width - 36, 44, false, false));
}
function layoutCook(input, vm) {
    const cook = input.cook;
    vm.title = '颠勺';
    vm.subtitle = cook ? (0, copy_1.clockLabel)(cook.leftMs) : '';
    vm.even = cook ? cook.even / 100 : 0;
    vm.burn = cook ? cook.burn / 100 : 0;
    vm.tossing = Boolean(cook && cook.tossing);
    vm.hint = cook ? cook.hint : copy_1.COPY.cookHint;
    vm.note = input.teach;
    vm.lines = [];
    const noteH = input.teach ? 46 : 0;
    let y = input.height - input.safeBottom - 132 - noteH;
    if (input.offerRetry) {
        vm.buttons.push(button('retryListen', copy_1.COPY.retryListen, 18, y - 52, 120, 40, false, false));
    }
    if (input.qa) {
        vm.buttons.push(button('scale-down', '火轻一点', input.width - 250, y - 52, 110, 40, false, false));
        vm.buttons.push(button('scale-up', '火猛一点', input.width - 132, y - 52, 110, 40, false, false));
    }
    vm.buttons.push(button('toss', copy_1.COPY.toss, 18, y, input.width - 36, 72, true, false));
    vm.buttons.push(button('plate', copy_1.COPY.plate, 48, y + 80, input.width - 96, 46, false, false));
}
function layoutPlate(input, vm) {
    const plate = input.plate;
    vm.title = plate ? (0, copy_1.ratingLabel)(plate.rating) : '';
    vm.subtitle = plate ? plate.dish.name : '';
    vm.lines = plate
        ? [`${plate.score} 分`, plate.dish.quips[plate.rating], plate.dish.science, copy_1.COPY.journalNote, plate.reason]
        : [];
    const stack = [];
    if (plate && plate.rating === 'wreck')
        stack.push({ id: 'retry', label: copy_1.COPY.retry, primary: true });
    if (input.justCleared)
        stack.push({ id: 'clear', label: '看今晚六桌', primary: true });
    stack.push({ id: 'home', label: copy_1.COPY.next, primary: Boolean(plate && plate.rating !== 'wreck' && !input.justCleared) });
    stack.push({ id: 'share', label: copy_1.COPY.share, primary: false });
    stack.push({ id: 'save', label: copy_1.COPY.save, primary: false });
    stack.push({ id: 'album', label: copy_1.COPY.album, primary: false });
    let y = input.height - input.safeBottom - stack.length * 58;
    for (let i = 0; i < stack.length; i += 1) {
        const item = stack[i];
        vm.buttons.push(button(item.id, item.label, 18, y, input.width - 36, i === 0 ? 52 : 46, item.primary, false));
        y += 58;
    }
}
function layoutAlbum(input, vm) {
    vm.title = copy_1.COPY.album;
    vm.subtitle = copy_1.COPY.subtitle;
    const total = input.catalog.length;
    const page = total ? Math.max(0, Math.min(total - 1, input.albumPage)) : 0;
    vm.albumPage = page;
    vm.albumPages = total;
    const dish = total ? input.catalog[page] : null;
    if (dish) {
        const best = input.save.plates[dish.id];
        vm.lines = [
            best ? `${dish.name} · ${(0, copy_1.ratingLabel)(best.rating)} ${best.score}` : `${dish.name} · 还没做出及格`,
            dish.science,
            dish.album,
            dish.style,
        ];
    }
    const foot = input.height - input.safeBottom - 58;
    if (page > 0)
        vm.buttons.push(button('album-prev', '上一味', 18, foot - 58, (input.width - 48) / 2, 46, false, false));
    if (page < total - 1) {
        vm.buttons.push(button('album-next', '下一位', input.width / 2 + 6, foot - 58, (input.width - 48) / 2, 46, false, false));
    }
    vm.buttons.push(button('home', copy_1.COPY.back, 18, foot, input.width - 36, 48, true, false));
}
function layoutClear(input, vm) {
    vm.title = copy_1.COPY.clearTitle;
    vm.subtitle = copy_1.COPY.subtitle;
    vm.lines = [copy_1.COPY.clearBody, (0, copy_1.clearLine)((0, save_1.clearedCount)(input.save, input.catalog), dishes_1.SERVICE_COUNT)];
    vm.stickers = input.catalog.map((dish) => dish.name);
    vm.buttons.push(button('home', copy_1.COPY.back, 18, input.height - input.safeBottom - 72, input.width - 36, 56, true, false));
}
function button(id, label, x, y, w, h, primary, disabled) {
    return { id, label, x, y, w, h, primary, disabled };
}
