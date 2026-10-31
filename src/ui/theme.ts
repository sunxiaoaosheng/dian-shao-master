/** 老字号菜单：宣纸、朱印、墨线。标题粗，正文细。 */
export const PALETTE = {
  paper: '#f3e6c8',
  paperDeep: '#e4d0a4',
  fiber: '#c4a882',
  ink: '#1c140f',
  inkSoft: '#5c4636',
  chili: '#9c2b1f',
  chiliDeep: '#6e1c14',
  scallion: '#3d4a28',
  yolk: '#d7b15a',
  soy: '#3a241c',
  iron: '#1a1c1f',
  ironLite: '#8d8376',
  steam: '#d9d0c2',
  photo: '#f7f0df',
  tape: '#e6d07a',
  tapeEdge: '#c9b15a',
  white: '#f7f1e4',
  burnt: '#3a3028',
  seal: '#9c2b1f',
};

export function font(size: number, bold = false): string {
  const weight = bold ? '700' : '400';
  return `${weight} ${size}px "Songti SC","STSong","SimSun","Noto Serif CJK SC","Source Han Serif SC",serif`;
}
