# 剪贴资源

正式规格在 `docs/COLLAGE_ART_SPEC.md`。这里的 PNG 是同名占位，PNG-24、直通 alpha、@2x。换实拍时保留文件名。

画面叠放：`food-wok-base` → `food-oil-sheen` → 主料 → 葱花点缀 → `assets/fx/`。胶带、油光、烟是单独的半透明层。没有职场或办公室图案。

| 目录 | 文件 |
| --- | --- |
| `ui/` | `ui-paper-bg` `ui-panel-torn` `ui-tape-strip` `ui-score-chip` `ui-btn-primary` `ui-btn-ghost` `ui-heart` `ui-heart-empty` `ui-progress-track` `ui-progress-fill` |
| `food/` | `food-wok-base` `food-oil-sheen` `food-veg-green` `food-meat-slice` `food-egg` `food-chili` `food-scallion` `food-wok-handle` `food-plate-done` |
| `fx/` | `fx-paper-scrap-01..03` `fx-oil-star-01..04` `fx-flame-lick` `fx-smoke-puff` `fx-perfect-burst` `fx-miss-drip` |
| `type/` | `type-toast-01..08` `type-perfect` `type-burnt` |

八句吐槽不写进图片像素，字符串在 `src/content/toasts.ts`。
