import type { Dish } from '../content/dishes';

export interface OrderState {
  dishId: string;
  dishName: string;
  region: string;
  line: string;
  taboo: string | null;
  leftMs: number;
  totalMs: number;
  enforce: boolean;
  status: 'waiting' | 'accepted' | 'timeout';
}

export function createOrder(dish: Dish, enforce: boolean): OrderState {
  const total = Math.round(dish.orderSeconds * 1000 * dish.pace);
  let line = `${dish.region}来客点了${dish.name}。`;
  if (dish.taboo) line += `交代一句：${dish.taboo}。`;
  return {
    dishId: dish.id,
    dishName: dish.name,
    region: dish.region,
    line,
    taboo: dish.taboo,
    leftMs: total,
    totalMs: total,
    enforce,
    status: 'waiting',
  };
}

export function tickOrder(state: OrderState, dtMs: number): OrderState {
  if (state.status !== 'waiting') return state;
  const left = state.leftMs - Math.max(0, dtMs);
  if (left <= 0 && state.enforce) {
    return Object.assign({}, state, { leftMs: 0, status: 'timeout' });
  }
  return Object.assign({}, state, { leftMs: Math.max(0, left) });
}

export function acceptOrder(state: OrderState): OrderState {
  if (state.status !== 'waiting') return state;
  return Object.assign({}, state, { status: 'accepted' });
}
