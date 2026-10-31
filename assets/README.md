# 剪贴资源

正式规格在 `docs/COLLAGE_ART_SPEC.md`。游戏按 `manifest.json` 的 `id`、`path`、`pivot`、`z` 加载。`path` 相对本目录，占位 PNG 就在这些路径上。换实拍时保留文件名。

叠放顺序以清单里的 `z` 为准：底纸、锅柄、锅、油光、主料、点缀、火和烟，然后是界面、纸屑和吐槽。胶带、油光、烟是单独的半透明层。没有职场或办公室图案。

| 目录 | 文件 |
| --- | --- |
| `ui/` | `ui-paper-bg` `ui-panel-torn` `ui-tape-strip` `ui-score-chip` `ui-btn-primary` `ui-btn-ghost` `ui-heart` `ui-heart-empty` `ui-progress-track` `ui-progress-fill` |
| `food/` | `food-wok-base` `food-oil-sheen` `food-veg-green` `food-meat-slice` `food-egg` `food-chili` `food-scallion` `food-wok-handle` `food-plate-done` |
| `fx/` | `fx-paper-scrap-01..03` `fx-oil-star-01..04` `fx-flame-lick` `fx-smoke-puff` `fx-perfect-burst` `fx-miss-drip` |
| `type/` | `type-toast-01..08` `type-perfect` `type-burnt` |

八句吐槽不写进图片像素，字符串在 `src/content/toasts.ts`。
