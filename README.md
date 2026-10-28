# 颠勺王

微信小游戏。客人点菜，你备料、颠勺、出锅。副标题是「今晚六桌」。

测试 AppID：`wx2ffe6f213fe9c05b`。仓库名和 `projectname` 仍是 `dian-shao-master`。

```bash
npm test
```

开发者工具选 **小游戏**，导入仓库根目录，点编译。首页应是灶台，而不是旧的合成锅。进度和每一版怎么验，写在 `docs/ROADMAP.md`。取舍写在 `docs/DECISIONS.md`。

清单 `assets/manifest.json` 由 `game.js` 用 `readFileSync` 从代码包根目录读取，不要 `require` 这个 json。`dist/` 要提交，开发者工具读的是编译结果。
