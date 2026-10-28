import { COPY, clearLine, clockLabel, ratingLabel, todayLine, windowLine } from '../content/copy';
import type { Dish } from '../content/dishes';
import { ratingFor } from '../cook/score';
import type { Rating } from '../cook/score';
import type { ScreenId } from '../flow/scenes';
import type { SaveState } from '../meta/save';
import { clearedCount, isUnlocked, showcaseOf } from '../meta/save';
import { DISHES, SERVICE_COUNT } from '../content/dishes';
import type { OrderState } from '../order/ticket';
import type { PrepState } from '../prep/board';
import type { ButtonVM, ChipVM, ViewModel } from './types';

export interface StubCook {
  even: number;
  burn: number;
  leftMs: number;
  totalMs: number;
  hint: string;
}

export interface PlateView {
  dish: Dish;
  score: number;
  rating: Rating;
  kept: boolean;
  reason: string;
}

export interface ComposeInput {
  screen: ScreenId;
  width: number;
  height: number;
  safeTop: number;
  safeBottom: number;
  save: SaveState;
  catalog: readonly Dish[];
  order: OrderState | null;
  prep: PrepState | null;
  cook: StubCook | null;
  plate: PlateView | null;
  teach: string;
  debugLines: string[];
}

export function compose(input: ComposeInput): ViewModel {
  const vm: ViewModel = {
    width: input.width,
    height: input.height,
    screen: input.screen,
    title: COPY.title,
    subtitle: COPY.subtitle,
    lines: [],
    hint: input.teach,
    even: null,
    burn: null,
    buttons: [],
    chips: [],
    hits: [],
    debugLines: input.debugLines,
  };
  if (input.screen === 'home') layoutHome(input, vm);
  else if (input.screen === 'order') layoutOrder(input, vm);
  else if (input.screen === 'prep') layoutPrep(input, vm);
  else if (input.screen === 'cook') layoutCook(input, vm);
  else if (input.screen === 'plate') layoutPlate(input, vm);
  else if (input.screen === 'clear') layoutClear(input, vm);
  else layoutAlbum(input, vm);
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

function layoutHome(input: ComposeInput, vm: ViewModel): void {
  const done = clearedCount(input.save, input.catalog);
  const show = showcaseOf(input.save);
  const showDish = show ? dishName(input.catalog, show.dishId) : '';
  vm.lines = [
    clearLine(done, SERVICE_COUNT),
    todayLine(input.save.today.score, dishName(input.catalog, input.save.today.dishId)),
    windowLine(show ? show.rating : null, showDish, show ? show.score : 0),
  ];
  let y = input.safeTop + 168;
  const catalog = input.catalog.length ? input.catalog : DISHES;
  for (let i = 0; i < catalog.length; i += 1) {
    const dish = catalog[i];
    const open = isUnlocked(input.save, dish, catalog);
    vm.buttons.push(button(
      `dish:${dish.id}`,
      open ? dish.name : `${dish.name} · 未开`,
      18,
      y,
      input.width - 36,
      48,
      open,
      !open,
    ));
    y += 58;
  }
  vm.buttons.push(button('album', COPY.album, 18, y, input.width - 36, 44, false, false));
}

function layoutOrder(input: ComposeInput, vm: ViewModel): void {
  const order = input.order;
  vm.title = order ? order.dishName : COPY.title;
  vm.subtitle = order ? order.region : '';
  vm.lines = order ? [order.line, clockLabel(order.leftMs)] : [];
  vm.hint = input.teach || COPY.orderHint;
  const y = input.safeTop + 220;
  vm.buttons.push(button('accept', COPY.accept, 18, y, input.width - 36, 48, true, false));
  vm.buttons.push(button('home', COPY.back, 18, y + 60, input.width - 36, 44, false, false));
}

function layoutPrep(input: ComposeInput, vm: ViewModel): void {
  const prep = input.prep;
  vm.title = '砧板';
  vm.subtitle = prep ? clockLabel(prep.leftMs) : '';
  vm.lines = prep ? [`点错 ${prep.wrong}/${prep.maxWrong}`] : [];
  vm.hint = input.teach || COPY.prepHint;
  const pieces = prep ? prep.pieces : [];
  const colW = (input.width - 36 - 16) / 2;
  for (let i = 0; i < pieces.length; i += 1) {
    const piece = pieces[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const chip: ChipVM = {
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
  vm.buttons.push(button('home', COPY.back, 18, input.height - input.safeBottom - 64, input.width - 36, 44, false, false));
}

function layoutCook(input: ComposeInput, vm: ViewModel): void {
  const cook = input.cook;
  vm.title = '颠勺';
  vm.subtitle = cook ? clockLabel(cook.leftMs) : '';
  vm.even = cook ? cook.even / 100 : 0;
  vm.burn = cook ? cook.burn / 100 : 0;
  vm.hint = input.teach || (cook ? cook.hint : COPY.cookHint);
  vm.lines = cook ? [`这下大约 ${ratingLabel(ratingFor(cook.even))}`] : [];
  const y = input.height - input.safeBottom - 120;
  vm.buttons.push(button('toss', COPY.toss, 18, y, input.width - 36, 48, true, false));
  vm.buttons.push(button('plate', COPY.plate, 18, y + 58, input.width - 36, 44, false, false));
}

function layoutPlate(input: ComposeInput, vm: ViewModel): void {
  const plate = input.plate;
  vm.title = plate ? ratingLabel(plate.rating) : '';
  vm.subtitle = plate ? plate.dish.name : '';
  vm.lines = plate
    ? [`${plate.score} 分`, plate.dish.quips[plate.rating], plate.dish.science, plate.reason]
    : [];
  let y = input.safeTop + 250;
  if (plate && plate.rating === 'wreck') {
    vm.buttons.push(button('retry', COPY.retry, 18, y, input.width - 36, 48, true, false));
    y += 58;
  }
  vm.buttons.push(button('home', COPY.next, 18, y, input.width - 36, 46, plate ? plate.rating !== 'wreck' : true, false));
  vm.buttons.push(button('album', COPY.album, 18, y + 56, input.width - 36, 44, false, false));
}

function layoutAlbum(input: ComposeInput, vm: ViewModel): void {
  vm.title = COPY.album;
  vm.subtitle = COPY.subtitle;
  const lines: string[] = [];
  for (let i = 0; i < input.catalog.length; i += 1) {
    const dish = input.catalog[i];
    lines.push(dish.name);
    lines.push(dish.science);
    lines.push(dish.album);
  }
  vm.lines = lines;
  vm.buttons.push(button('home', COPY.back, 18, input.height - input.safeBottom - 64, input.width - 36, 44, true, false));
}

function layoutClear(input: ComposeInput, vm: ViewModel): void {
  vm.title = COPY.clearTitle;
  vm.subtitle = COPY.subtitle;
  vm.lines = [COPY.clearBody, clearLine(clearedCount(input.save, input.catalog), input.catalog.length)];
  vm.buttons.push(button('home', COPY.back, 18, input.safeTop + 240, input.width - 36, 48, true, false));
}

function button(id: string, label: string, x: number, y: number, w: number, h: number, primary: boolean, disabled: boolean): ButtonVM {
  return { id, label, x, y, w, h, primary, disabled };
}

function dishName(catalog: readonly Dish[], id: string): string {
  for (let i = 0; i < catalog.length; i += 1) {
    if (catalog[i].id === id) return catalog[i].name;
  }
  return '';
}
