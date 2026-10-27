"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyPiece = emptyPiece;
exports.createGrid = createGrid;
exports.neighbors4 = neighbors4;
exports.countEmpty = countEmpty;
exports.emptyIndices = emptyIndices;
exports.clonePieces = clonePieces;
function emptyPiece() {
    return { id: 0, level: 0, cookMs: 0, burnt: false };
}
function createGrid(cols, rows) {
    const cells = [];
    const n = cols * rows;
    for (let i = 0; i < n; i += 1)
        cells.push(emptyPiece());
    return cells;
}
function neighbors4(index, cols, rows) {
    const x = index % cols;
    const y = (index / cols) | 0;
    const out = [];
    if (x > 0)
        out.push(index - 1);
    if (x + 1 < cols)
        out.push(index + 1);
    if (y > 0)
        out.push(index - cols);
    if (y + 1 < rows)
        out.push(index + cols);
    return out;
}
function countEmpty(cells) {
    let n = 0;
    for (let i = 0; i < cells.length; i += 1) {
        if (cells[i].level <= 0)
            n += 1;
    }
    return n;
}
function emptyIndices(cells) {
    const out = [];
    for (let i = 0; i < cells.length; i += 1) {
        if (cells[i].level <= 0)
            out.push(i);
    }
    return out;
}
function clonePieces(cells) {
    return cells.map((cell) => ({
        id: cell.id,
        level: cell.level,
        cookMs: cell.cookMs,
        burnt: cell.burnt,
    }));
}
