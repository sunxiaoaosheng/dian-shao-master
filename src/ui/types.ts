import type { HitRect } from '../input/pointer';

export type ScreenId = 'home' | 'play' | 'result' | 'album';

export interface ButtonVM {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  primary: boolean;
  disabled: boolean;
  selected: boolean;
}

export interface CellVM {
  hitId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  level: number;
  burnt: boolean;
  cook: number;
  seed: number;
  ink: string;
}

export interface PlayVM {
  recipeName: string;
  region: string;
  scoreText: string;
  meter: number;
  chargesText: string;
  charges: number;
  maxCharges: number;
  tossedText: string;
  showPerfect: boolean;
  showBurnt: boolean;
  cells: CellVM[];
  nextName: string;
  nextLevel: number;
  nextInk: string;
  showTossButton: boolean;
  overflowText: string;
  hint: string;
  /** 整局都在，提醒上下左右同级才合成。 */
  mergeRule: string;
  goalText: string;
  /** 火候条或单块快糊时留在画面上，不跟着短句一起消失。 */
  warnText: string;
  feelText: string;
  wok: { x: number; y: number; w: number; h: number };
  nextBox: { x: number; y: number; w: number; h: number };
  cooldownText: string;
}

export interface ResultVM {
  title: string;
  body: string;
  scoreText: string;
  recap: string;
  nextLine: string;
}

export interface AlbumCardVM {
  name: string;
  region: string;
  blurb: string;
  owned: boolean;
  ink: string;
  x: number;
  y: number;
  w: number;
  h: number;
  level: number;
}

export interface ViewModel {
  width: number;
  height: number;
  now: number;
  shake: number;
  screen: ScreenId;
  title: string;
  subtitle: string;
  playsLabel: string;
  playsHint: string;
  heatLabel: string;
  goalText: string;
  feelText: string;
  sensorLabel: string;
  boardNote: string;
  buttons: ButtonVM[];
  hits: HitRect[];
  toasts: { text: string; seed: number; life: number }[];
  toastY: number;
  board: { region: string; line: string }[];
  boardTitle: string;
  showBoard: boolean;
  boardTop: number;
  seal: HitRect | null;
  play: PlayVM | null;
  result: ResultVM | null;
  album: AlbumCardVM[] | null;
  albumTitle: string;
  qaLines: string[];
}
