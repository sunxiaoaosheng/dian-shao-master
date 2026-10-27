# 《颠勺王》实拍剪贴风资源规格
目录：`assets/ui/` · `assets/food/` · `assets/fx/` · `assets/type/`

## 总规范
- PNG-24 + Alpha；sRGB；撕纸毛边 1–2px
- kebab-case：`ui-` / `food-` / `fx-` / `type-`
- 出 @2x（逻辑×2）；单图尽量 ≤512²；sprite 可 1024² + 2px padding
- 阴影/胶带单独半透明层；禁止职场/办公室元素

## UI (`assets/ui/`)
- ui-paper-bg.png 375×667 → 750×1334
- ui-panel-torn.png 320×180 → 640×360
- ui-tape-strip.png 96×28 → 192×56
- ui-score-chip.png 120×40 → 240×80
- ui-btn-primary.png / ui-btn-ghost.png 160×56 → 320×112
- ui-heart.png / ui-heart-empty.png 32×32 → 64×64
- ui-progress-track.png / ui-progress-fill.png 200×12 → 400×24

## Food (`assets/food/`) 叠放：wok-base → oil-sheen → 主料 → 点缀 → fx
- food-wok-base.png 220×140 → 440×280
- food-oil-sheen.png 180×100 → 360×200
- food-veg-green.png 96×96 → 192×192
- food-meat-slice.png 96×72 → 192×144
- food-egg.png 72×72 → 144×144
- food-chili.png 48×64 → 96×128
- food-scallion.png 64×40 → 128×80
- food-wok-handle.png 80×160 → 160×320
- food-plate-done.png 160×120 → 320×240

## FX (`assets/fx/`)
- fx-paper-scrap-01..03.png 48×48 → 96×96
- fx-oil-star-01..04.png 32×32 → 64×64
- fx-flame-lick.png 64×96 → 128×192
- fx-smoke-puff.png 96×96 → 192×192
- fx-perfect-burst.png 128×128 → 256×256
- fx-miss-drip.png 40×64 → 80×128

## Type (`assets/type/`)
- type-toast-01..08.png 宽≤280 @2x
- type-perfect.png / type-burnt.png 宽≤160 @2x

### 吐槽文案
1. 火候？我跟火候不熟。
2. 颠勺不是甩锅，别误会。
3. 油花比我命还欢。
4. 这菜：差点完美，完美差点。
5. 锅在飞，心在颤。
6. 盐放多了就叫「个性」。
7. 糊了也是烟火气。
8. 再颠一下，信我。

## 仓库落地

上表是正式图的规格。仓库里同名 PNG 是灶台配色的占位：牛皮纸、铁锅、油光、青菜、肉片、蛋、辣椒、葱花、火舌和烟。换正式实拍时只替换文件，不要改文件名。

运行时以 `assets/manifest.json` 为准。清单里的 `path` 相对 `assets/`，和这些占位图是同一条路径。游戏用 `id` 取图，用 `pivot` 对齐锚点，用 `z` 决定叠放，再用 `wx.createImage` 加载 `assets/` + `path`。图还没到时，画面退回矢量剪贴。八句吐槽写在清单的 `text` 上，`src/content/toasts.ts` 从这里读出来。占位图没有汉字点阵，对局里仍会把这八句画在纸条上。

重新生成占位：`npm run assets`。
