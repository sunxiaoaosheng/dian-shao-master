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
  tossedText: string;
  cells: CellVM[];
  nextName: string;
  nextLevel: number;
  nextInk: string;
  showTossButton: boolean;
  overflowText: string;
  hint: string;
  wok: { x: number; y: number; w: number; h: number };
  nextBox: { x: number; y: number; w: number; h: number };
}

export interface ResultVM {
  title: string;
  body: string;
  scoreText: string;
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
  sensorLabel: string;
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
