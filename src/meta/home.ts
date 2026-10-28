import { clearLine, todayLine, windowLine } from '../content/copy';
import type { Dish } from '../content/dishes';
import { SERVICE_COUNT } from '../content/dishes';
import type { SaveState } from './save';
import { clearedCount, showcaseOf } from './save';

/** 主页三行：通关、今日最佳、橱窗。 */
export function homeLines(save: SaveState, catalog: readonly Dish[]): string[] {
  const show = showcaseOf(save);
  let showName = '';
  if (show) {
    for (let i = 0; i < catalog.length; i += 1) {
      if (catalog[i].id === show.dishId) showName = catalog[i].name;
    }
  }
  let todayName = '';
  if (save.today.dishId) {
    for (let i = 0; i < catalog.length; i += 1) {
      if (catalog[i].id === save.today.dishId) todayName = catalog[i].name;
    }
  }
  return [
    clearLine(clearedCount(save, catalog), SERVICE_COUNT),
    todayLine(save.today.score, todayName),
    windowLine(show ? show.rating : null, showName, show ? show.score : 0),
  ];
}
