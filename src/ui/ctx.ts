export interface CtxGradient {
  addColorStop(offset: number, color: string): void;
}

/** 微信小游戏 canvas 2d 用到的那一小部分，避免把 DOM 类型引进来。 */
export interface Ctx {
  fillStyle: string | CtxGradient;
  strokeStyle: string;
  lineWidth: number;
  font: string;
  textAlign: 'left' | 'center' | 'right' | 'start' | 'end';
  textBaseline: 'top' | 'middle' | 'bottom' | 'alphabetic';
  globalAlpha: number;
  lineCap: 'butt' | 'round' | 'square';
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  closePath(): void;
  rect(x: number, y: number, w: number, h: number): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  arc(x: number, y: number, r: number, a0: number, a1: number): void;
  fill(): void;
  stroke(): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(rad: number): void;
  scale(x: number, y: number): void;
  clip(): void;
  setLineDash(segments: number[]): void;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CtxGradient;
  /** 剪贴 PNG。占位图没加载完时调用方会改画矢量。 */
  drawImage?(image: unknown, dx: number, dy: number, dw: number, dh: number): void;
}
