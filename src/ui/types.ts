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
  shape: string;
  role: 'need' | 'decoy' | 'taboo';
  x: number;
  y: number;
  w: number;
  h: number;
  got: boolean;
  bad: boolean;
  crossed: boolean;
}

export interface ViewModel {
  width: number;
  height: number;
  screen: ScreenId;
  title: string;
  subtitle: string;
  lines: string[];
  /** 这一屏的主提示，例如「颠」或「停」。 */
  hint: string;
  /** 带教或传感器说明，不盖住主提示。 */
  note: string;
  even: number | null;
  burn: number | null;
  tossing: boolean;
  stickers: string[];
  albumPage: number;
  albumPages: number;
  buttons: ButtonVM[];
  chips: ChipVM[];
  hits: HitRect[];
  debugLines: string[];
}
