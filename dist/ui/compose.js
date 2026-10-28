"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compose = compose;
const copy_1 = require("../content/copy");
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
        hint: input.teach,
        even: null,
        burn: null,
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
    const done = (0, save_1.clearedCount)(input.save, input.catalog);
    const show = (0, save_1.showcaseOf)(input.save);
    const showDish = show ? dishName(input.catalog, show.dishId) : '';
    vm.lines = [
        (0, copy_1.clearLine)(done, dishes_1.SERVICE_COUNT),
        (0, copy_1.todayLine)(input.save.today.score, dishName(input.catalog, input.save.today.dishId)),
        (0, copy_1.windowLine)(show ? show.rating : null, showDish, show ? show.score : 0),
    ];
    let y = input.safeTop + 168;
    const catalog = input.catalog;
    for (let i = 0; i < catalog.length; i += 1) {
        const dish = catalog[i];
        const open = (0, save_1.isUnlocked)(input.save, dish, catalog);
        vm.buttons.push(button(`dish:${dish.id}`, open ? dish.name : `${dish.name} · 未开`, 18, y, input.width - 36, 48, open, !open));
        y += 58;
    }
    vm.buttons.push(button('album', copy_1.COPY.album, 18, y, input.width - 36, 44, false, false));
}
function layoutOrder(input, vm) {
    const order = input.order;
    vm.title = order ? order.dishName : copy_1.COPY.title;
    vm.subtitle = order ? order.region : '';
    vm.lines = order ? [order.line, (0, copy_1.clockLabel)(order.leftMs)] : [];
    vm.hint = input.teach || copy_1.COPY.orderHint;
    const y = input.safeTop + 220;
    vm.buttons.push(button('accept', copy_1.COPY.accept, 18, y, input.width - 36, 48, true, false));
    vm.buttons.push(button('home', copy_1.COPY.back, 18, y + 60, input.width - 36, 44, false, false));
}
function layoutPrep(input, vm) {
    const prep = input.prep;
    vm.title = '砧板';
    vm.subtitle = prep ? (0, copy_1.clockLabel)(prep.leftMs) : '';
    vm.lines = prep ? [`点错 ${prep.wrong}/${prep.maxWrong}`] : [];
    vm.hint = input.teach || copy_1.COPY.prepHint;
    const pieces = prep ? prep.pieces : [];
    const colW = (input.width - 36 - 16) / 2;
    for (let i = 0; i < pieces.length; i += 1) {
        const piece = pieces[i];
        const col = i % 2;
        const row = Math.floor(i / 2);
        const chip = {
            id: `ing:${piece.id}`,
            label: piece.name,
            ink: piece.ink,
            x: 18 + col * (colW + 16),
            y: input.safeTop + 180 + row * 78,
            w: colW,
            h: 66,
            got: piece.got,
            bad: piece.role !== 'need',
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
    vm.hint = input.teach || (cook ? cook.hint : copy_1.COPY.cookHint);
    vm.lines = cook ? [`均匀 ${Math.round(cook.even)}  糊边 ${Math.round(cook.burn)}`] : [];
    let y = input.height - input.safeBottom - 120;
    if (input.offerRetry) {
        vm.buttons.push(button('retryListen', copy_1.COPY.retryListen, 18, y - 52, 120, 40, false, false));
    }
    if (input.qa) {
        vm.buttons.push(button('scale-down', '火轻一点', input.width - 250, y - 52, 110, 40, false, false));
        vm.buttons.push(button('scale-up', '火猛一点', input.width - 132, y - 52, 110, 40, false, false));
    }
    vm.buttons.push(button('toss', copy_1.COPY.toss, 18, y, input.width - 36, 48, true, false));
    vm.buttons.push(button('plate', copy_1.COPY.plate, 18, y + 58, input.width - 36, 44, false, false));
}
function layoutPlate(input, vm) {
    const plate = input.plate;
    vm.title = plate ? (0, copy_1.ratingLabel)(plate.rating) : '';
    vm.subtitle = plate ? plate.dish.name : '';
    vm.lines = plate
        ? [`${plate.score} 分`, plate.dish.quips[plate.rating], plate.dish.science, plate.reason]
        : [];
    let y = input.safeTop + 280;
    if (plate && plate.rating === 'wreck') {
        vm.buttons.push(button('retry', copy_1.COPY.retry, 18, y, input.width - 36, 48, true, false));
        y += 58;
    }
    if (input.justCleared) {
        vm.buttons.push(button('clear', '看今晚六桌', 18, y, input.width - 36, 48, true, false));
        y += 58;
    }
    vm.buttons.push(button('home', copy_1.COPY.next, 18, y, input.width - 36, 46, plate ? plate.rating !== 'wreck' && !input.justCleared : true, false));
    y += 54;
    vm.buttons.push(button('share', copy_1.COPY.share, 18, y, input.width - 36, 44, false, false));
    vm.buttons.push(button('save', copy_1.COPY.save, 18, y + 52, input.width - 36, 44, false, false));
    vm.buttons.push(button('album', copy_1.COPY.album, 18, y + 104, input.width - 36, 44, false, false));
}
function layoutAlbum(input, vm) {
    vm.title = copy_1.COPY.album;
    vm.subtitle = copy_1.COPY.subtitle;
    const lines = [];
    for (let i = 0; i < input.catalog.length; i += 1) {
        const dish = input.catalog[i];
        const best = input.save.plates[dish.id];
        lines.push(best ? `${dish.name} · ${(0, copy_1.ratingLabel)(best.rating)} ${best.score}` : `${dish.name} · 还没做出及格`);
        lines.push(dish.science);
        lines.push(dish.album);
    }
    vm.lines = lines;
    vm.buttons.push(button('home', copy_1.COPY.back, 18, input.height - input.safeBottom - 64, input.width - 36, 44, true, false));
}
function layoutClear(input, vm) {
    vm.title = copy_1.COPY.clearTitle;
    vm.subtitle = copy_1.COPY.subtitle;
    vm.lines = [copy_1.COPY.clearBody, (0, copy_1.clearLine)((0, save_1.clearedCount)(input.save, input.catalog), dishes_1.SERVICE_COUNT)];
    vm.buttons.push(button('home', copy_1.COPY.back, 18, input.safeTop + 240, input.width - 36, 48, true, false));
}
function button(id, label, x, y, w, h, primary, disabled) {
    return { id, label, x, y, w, h, primary, disabled };
}
function dishName(catalog, id) {
    for (let i = 0; i < catalog.length; i += 1) {
        if (catalog[i].id === id)
            return catalog[i].name;
    }
    return '';
}
