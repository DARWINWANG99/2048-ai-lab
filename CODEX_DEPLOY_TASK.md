# Codex task — pre-deploy review, repair, then deploy

## Outcome

Take the current `main` branch of `DARWINWANG99/2048-ai-lab`, independently review it, fix only material issues, and deploy a usable static preview **only after the review gate passes**.

This is a small learning experiment for Teresa, not a school competition automation tool.

## Recommended execution model

Use the current capable coding model with **Medium reasoning**. This task is mostly browser QA, JavaScript correctness, performance sanity, and static deployment; maximum reasoning is unnecessary.

## Non-negotiable boundaries

- Do **not** automate, log into, scrape, or submit scores to `2048.gaojihe.cn` or any school system.
- Do **not** add account/password logic.
- Do **not** change repository visibility without Darwin's approval.
- Do **not** add a backend, database, framework, agent architecture, or other infrastructure unless a demonstrated blocker requires it.
- Keep this a simple static HTML/CSS/JavaScript application.
- Do not optimize visual polish before functional correctness.

## Gate 1 — independent code review before deployment

Do not assume the current implementation is correct because tests exist.

Inspect:
- `src/engine.js`
- `src/ai.js`
- `src/app.js`
- `index.html`
- `styles.css`
- `tests/run-tests.mjs`

Check independently:

1. Standard 2048 merge semantics:
   - tiles merge at most once per move;
   - left/right/up/down transformations are correct;
   - score delta is correct;
   - one random tile appears only after a valid move;
   - game-over detection is correct.

2. AI behavior:
   - Random AI selects only valid moves;
   - Corner AI is truly heuristic, not a hard-coded move loop;
   - Expectimax has MAX and CHANCE behavior;
   - chance nodes model random empty position plus 90% 2 / 10% 4;
   - Expectimax returns only valid moves;
   - evaluation function rewards useful board properties without obvious sign/inversion errors.

3. Browser behavior:
   - keyboard controls work;
   - touch swipe works in an iPad/mobile viewport;
   - AI start / step / stop / new game work;
   - switching AI modes and Expectimax depth works;
   - no console errors;
   - status, score, max tile, and move count update correctly.

4. Batch experiments:
   - deterministic seeds really make cross-AI comparisons reproducible;
   - 10-game batch works for all three modes;
   - 100-game Random and Corner batches complete;
   - Expectimax batch does not freeze the page unacceptably;
   - the UI truthfully labels any reduced search depth used for batch mode.

5. Performance:
   - manually profile Expectimax depths 1, 2, and 3 on representative early/mid-game boards;
   - if depth 3 causes unacceptable blocking, keep it available only if clearly labeled as slow, or make the smallest reliable repair;
   - do not introduce workers or a framework unless blocking is materially harmful to the experience.

## Gate 2 — automated + browser verification

Run at minimum:

```bash
npm test
```

Then run the app locally and perform browser smoke tests at:
- desktop viewport;
- iPad/tablet-like viewport.

Add/fix tests if the review finds a material gap, especially direction transforms or merge edge cases.

## Repair rule

Fix material correctness, usability, or performance issues found in the review.

Do not refactor for style alone.
Do not expand scope.
After repairs, rerun all relevant checks.

## Deployment gate

Deploy only if:
- automated tests pass;
- browser smoke test passes;
- no material correctness issue remains;
- no school-site integration exists;
- mobile/tablet interaction is usable.

Prefer the simplest already-authorized static deployment path.

GitHub Pages is acceptable **only if it can be used without changing repository visibility or exposing something Darwin did not approve**. If the current account/repository configuration prevents safe deployment, stop after the validated local build and report the blocker instead of changing privacy or adding a new service.

## Completion evidence

Return only:
1. review findings;
2. repairs made;
3. test results;
4. browser QA result;
5. deployment URL, if deployed;
6. any remaining warning/blocker.

