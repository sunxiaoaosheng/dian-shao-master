import type { HitRect } from '../input/pointer';
import type { ScreenId } from '../flow/scenes';

export interface ButtonVM {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  primary: boolean;
  disabled: boolean;
}

export interface ChipVM {
  id: string;
  label: string;
  ink: string;
  x: number;
  y: number;
  w: number;
  h: number;
  got: boolean;
  bad: boolean;
}

export interface ViewModel {
  width: number;
  height: number;
  screen: ScreenId;
  title: string;
  subtitle: string;
  lines: string[];
  hint: string;
  even: number | null;
  burn: number | null;
  buttons: ButtonVM[];
  chips: ChipVM[];
  hits: HitRect[];
  debugLines: string[];
}
