"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PALETTE = void 0;
exports.font = font;
/** 实拍剪贴：牛皮纸、红油、葱花、酱油。不要换成办公文具色。 */
exports.PALETTE = {
    paper: '#e7d3ae',
    paperDeep: '#d4b48a',
    fiber: '#b08960',
    ink: '#2b2118',
    inkSoft: '#5c4a3a',
    chili: '#c4452d',
    chiliDeep: '#8d2b1c',
    scallion: '#3f7d45',
    yolk: '#e3b23c',
    soy: '#3a241c',
    iron: '#2a2e32',
    ironLite: '#8b9298',
    steam: '#f7f1e6',
    photo: '#f6efe2',
    tape: '#e6d07a',
    tapeEdge: '#c9b15a',
    white: '#fbf6ec',
    burnt: '#4a4038',
    seal: '#b4332a',
};
function font(size, bold = false) {
    const weight = bold ? '700' : '500';
    return `${weight} ${size}px "KaiTi","STKaiti","Kaiti SC","Songti SC","SimSun",serif`;
}
