"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECIPES = void 0;
exports.recipeForRun = recipeForRun;
exports.getRecipe = getRecipe;
exports.levelShort = levelShort;
exports.RECIPES = [
    {
        id: 'huiguo',
        name: '回锅肉',
        region: '川渝',
        blurb: '灯盏窝起来了，蒜苗还脆。',
        ink: '#c4552a',
        levels: [
            { level: 1, name: '蒜苗段', short: '蒜苗' },
            { level: 2, name: '五花肉片', short: '肉片' },
            { level: 3, name: '郫县豆瓣', short: '豆瓣' },
            { level: 4, name: '回锅肉', short: '回锅' },
        ],
    },
    {
        id: 'fanqie',
        name: '番茄炒蛋',
        region: '家常',
        blurb: '酸甜刚刚好，蛋还是嫩的。',
        ink: '#d1882c',
        levels: [
            { level: 1, name: '蛋液', short: '蛋液' },
            { level: 2, name: '番茄块', short: '番茄' },
            { level: 3, name: '小火翻炒', short: '翻炒' },
            { level: 4, name: '番茄炒蛋', short: '炒蛋' },
        ],
    },
    {
        id: 'mapo',
        name: '麻婆豆腐',
        region: '川渝',
        blurb: '红油盖住豆腐，花椒是亮的。',
        ink: '#a33a2c',
        levels: [
            { level: 1, name: '嫩豆腐', short: '豆腐' },
            { level: 2, name: '牛肉末', short: '肉末' },
            { level: 3, name: '花椒面', short: '花椒' },
            { level: 4, name: '麻婆豆腐', short: '麻婆' },
        ],
    },
    {
        id: 'guotie',
        name: '锅贴',
        region: '北方',
        blurb: '底是脆的，一口汤还在。',
        ink: '#c48a3a',
        levels: [
            { level: 1, name: '面皮', short: '面皮' },
            { level: 2, name: '肉馅', short: '肉馅' },
            { level: 3, name: '生饺', short: '生饺' },
            { level: 4, name: '锅贴', short: '锅贴' },
        ],
    },
    {
        id: 'tangcu',
        name: '糖醋排骨',
        region: '江南',
        blurb: '汁挂得住，酸甜不腻。',
        ink: '#b5523a',
        levels: [
            { level: 1, name: '排骨', short: '排骨' },
            { level: 2, name: '薄糊', short: '挂糊' },
            { level: 3, name: '糖醋汁', short: '糖醋' },
            { level: 4, name: '糖醋排骨', short: '亮汁' },
        ],
    },
    {
        id: 'congyou',
        name: '葱油拌面',
        region: '江南',
        blurb: '葱香扑一下，面就亮了。',
        ink: '#3f7a45',
        levels: [
            { level: 1, name: '葱段', short: '葱段' },
            { level: 2, name: '热油', short: '热油' },
            { level: 3, name: '葱油', short: '葱油' },
            { level: 4, name: '葱油拌面', short: '拌面' },
        ],
    },
];
function recipeForRun(runsCompleted) {
    const i = ((runsCompleted % exports.RECIPES.length) + exports.RECIPES.length) % exports.RECIPES.length;
    return exports.RECIPES[i];
}
function getRecipe(id) {
    for (let i = 0; i < exports.RECIPES.length; i += 1) {
        if (exports.RECIPES[i].id === id)
            return exports.RECIPES[i];
    }
    return undefined;
}
function levelShort(recipe, level) {
    const found = recipe.levels[level - 1];
    if (found)
        return found.short;
    return recipe.levels[0].short;
}
