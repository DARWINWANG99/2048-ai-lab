# Teresa 2048 AI Lab

一个给 1024 数学节准备的小型学习实验：用同一个 2048 游戏比较三种“玩家”。

- **Random AI**：随机选择合法方向，作为基线。
- **Corner AI**：使用最大方块守左下角、空格、可合并性、平滑度和蛇形排序等启发式规则。
- **Expectimax AI**：把玩家动作与随机生成的 `2 / 4` 一起向未来搜索，选择期望价值最高的方向。

这不是用于学校正式比赛自动刷榜的工具。它不会登录学校网站，也不会向学校排行榜提交成绩。

## 本地运行

无需安装依赖：

```bash
python3 -m http.server 8080
```

然后打开 `http://localhost:8080`。

## 测试

需要 Node.js 18+：

```bash
npm test
```

## 建议实验

1. Random / Corner / Expectimax 各跑 10 局，观察差距。
2. 再各跑 100 局，比较平均分与达到 512 / 1024 / 2048 的比例。
3. Teresa 先猜哪一种会最好，再解释为什么。
4. 把 Expectimax 单局演示深度从 1 改到 2 或 3，观察“想得更远”是否值得更长计算时间。批量实验固定使用 depth 1，以避免浏览器长时间卡住。

## 部署前检查

在部署 GitHub Pages 或其他静态站点前，应至少完成：

- `npm test` 全部通过；
- 桌面键盘操作检查；
- 手机/平板滑动操作检查；
- Random / Corner / Expectimax 各至少跑一局；
- 10 局 batch 检查；
- Expectimax depth 1/2/3 响应时间检查；
- 确认没有学校账号、学校站点 URL、自动提交排行榜或登录逻辑。


## Strong AI v0.2

The lab now has a fourth learning stage: **Strong AI**. It keeps Expectimax's chance model, adds a stronger snake/corner evaluation, a collision-safe transposition cache, adaptive search and probability pruning.

Reproducible CI smoke benchmark (seed `20261024`, 2026-10-06):

| AI | Score | Max tile | Moves |
|---|---:|---:|---:|
| Corner | 14,396 | 1,024 | 873 |
| Expectimax depth 1 | 16,828 | 1,024 | 1,017 |
| Strong level 2 | **33,212** | **2,048** | 1,725 |

This is a browser-friendly teaching upgrade, not a claim to reproduce research-grade 700k+ solvers. The next research step would be bitboards/row lookup and an endgame tablebase; those approaches trade substantially more implementation/data complexity for strength.

## Research AI (experimental)

The Research AI stage uses a precomputed 20-bit row-move/evaluation lookup and a bounded expectimax search with a transposition cache. The four legal directions expose **heuristic utilities**, not probabilities. This is an independent experimental implementation inspired by [macroxue/2048-ai](https://github.com/macroxue/2048-ai) and the tablebase ideas of [2048EndgameTablebase](https://github.com/game-difficulty/2048EndgameTablebase). **No endgame tablebase is included; neither a 707,376 score nor a 700k average has been verified for this repository.**

Reproducible local test: `node tests/research-benchmark.mjs 1 2 20261024`. Outputs seed, score, max tile, moves, runtime and commit when `GITHUB_SHA` is supplied. Runtime varies by machine; score and moves should reproduce for the same code/seed. The default CI smoke test runs a lower-cost level 1 game.
