"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeLines = homeLines;
const copy_1 = require("../content/copy");
const dishes_1 = require("../content/dishes");
const save_1 = require("./save");
/** 主页三行：通关、今日最佳、橱窗。 */
function homeLines(save, catalog) {
    const show = (0, save_1.showcaseOf)(save);
    let showName = '';
    if (show) {
        for (let i = 0; i < catalog.length; i += 1) {
            if (catalog[i].id === show.dishId)
                showName = catalog[i].name;
        }
    }
    let todayName = '';
    if (save.today.dishId) {
        for (let i = 0; i < catalog.length; i += 1) {
            if (catalog[i].id === save.today.dishId)
                todayName = catalog[i].name;
        }
    }
    return [
        (0, copy_1.clearLine)((0, save_1.clearedCount)(save, catalog), dishes_1.SERVICE_COUNT),
        (0, copy_1.todayLine)(save.today.score, todayName),
        (0, copy_1.windowLine)(show ? show.rating : null, showName, show ? show.score : 0),
    ];
}
