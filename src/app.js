import { addRandomTile, isGameOver, maxTile, moveBoard, newGame } from "./engine.js";
import { cornerMove, expectimaxMove, randomMove, strongMove } from "./ai.js";

let board = newGame();
let score = 0;
let moves = 0;
let running = false;
let timer = null;
let batchResults = [];
let batchRunning = false;
let challengeTimer = null;
let challengeEndsAt = 0;

const boardEl = document.querySelector("#board");
const scoreEl = document.querySelector("#score");
const maxEl = document.querySelector("#max-tile");
const movesEl = document.querySelector("#moves");
const statusEl = document.querySelector("#status");
const modeEl = document.querySelector("#ai-mode");
const speedEl = document.querySelector("#speed");
const depthEl = document.querySelector("#depth");
const batchOutputEl = document.querySelector("#batch-output");
const challengeOutputEl = document.querySelector("#challenge-output");
const batchButtons = [document.querySelector("#batch-10"), document.querySelector("#batch-100")];

function tileClass(v) {
  return v ? `tile tile-${Math.min(v, 8192)}` : "tile tile-empty";
}

function render() {
  boardEl.innerHTML = "";
  for (const value of board.flat()) {
    const cell = document.createElement("div");
    cell.className = tileClass(value);
    cell.textContent = value || "";
    boardEl.appendChild(cell);
  }
  scoreEl.textContent = score.toLocaleString();
  maxEl.textContent = maxTile(board).toLocaleString();
  movesEl.textContent = moves.toLocaleString();
  statusEl.textContent = isGameOver(board) ? "本局结束" : (running ? "AI 正在思考…" : "准备就绪");
}

function reset() {
  stopAI();
  board = newGame();
  score = 0;
  moves = 0;
  batchOutputEl.textContent = "";
  render();
}

function applyMove(direction) {
  const result = moveBoard(board, direction);
  if (!result.moved) return false;
  board = addRandomTile(result.board);
  score += result.scoreDelta;
  moves += 1;
  render();
  return true;
}

function chooseMove(state) {
  switch (modeEl.value) {
    case "random": return randomMove(state);
    case "corner": return cornerMove(state);
    case "expectimax": return expectimaxMove(state, Number(depthEl.value));
    case "strong": return strongMove(state, Number(depthEl.value));
    default: return null;
  }
}

function aiStep() {
  if (isGameOver(board)) {
    stopAI();
    render();
    return;
  }
  const direction = chooseMove(board);
  if (!direction || !applyMove(direction)) {
    stopAI();
    render();
  }
}

function startAI() {
  if (running) return;
  running = true;
  const loop = () => {
    if (!running) return;
    aiStep();
    if (!running) return;
    timer = setTimeout(loop, Number(speedEl.value));
  };
  render();
  loop();
}

function stopAI() {
  running = false;
  if (challengeTimer) clearTimeout(challengeTimer);
  challengeTimer = null;
  challengeEndsAt = 0;
  if (timer) clearTimeout(timer);
  timer = null;
  render();
}


function startThreeMinuteChallenge() {
  stopAI();
  board = newGame();
  score = 0;
  moves = 0;
  running = true;
  challengeEndsAt = Date.now() + 180000;
  challengeOutputEl.textContent = "3 分钟挑战进行中…";

  const loop = () => {
    if (!running) return;
    const remaining = challengeEndsAt - Date.now();
    if (remaining <= 0 || isGameOver(board)) {
      const endedByGameOver = isGameOver(board);
      running = false;
      if (challengeTimer) clearTimeout(challengeTimer);
      challengeTimer = null;
      challengeEndsAt = 0;
      challengeOutputEl.innerHTML = `<strong>3 分钟挑战结果</strong><br>得分：${score.toLocaleString()}<br>最高方块：${maxTile(board).toLocaleString()}<br>有效步数：${moves.toLocaleString()}<br>${endedByGameOver ? "棋盘提前结束" : "时间到"}`;
      render();
      return;
    }
    aiStep();
    if (!running) return;
    challengeTimer = setTimeout(loop, Number(speedEl.value));
  };
  render();
  loop();
}

function seededRandom(seed) {
  let x = seed >>> 0;
  return () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 2 ** 32;
  };
}

function playOne(mode, seed, depth) {
  const rng = seededRandom(seed);
  const moveRng = seededRandom(seed ^ 0x9e3779b9);
  let state = newGame(rng);
  let localScore = 0;
  let localMoves = 0;
  const maxSteps = 20000;

  while (!isGameOver(state) && localMoves < maxSteps) {
    let direction;
    if (mode === "random") direction = randomMove(state, moveRng);
    else if (mode === "corner") direction = cornerMove(state);
    else if (mode === "expectimax") direction = expectimaxMove(state, depth);
    else direction = strongMove(state, depth);
    if (!direction) break;
    const result = moveBoard(state, direction);
    if (!result.moved) break;
    state = addRandomTile(result.board, rng);
    localScore += result.scoreDelta;
    localMoves += 1;
  }

  return { score: localScore, max: maxTile(state), moves: localMoves };
}

async function runBatch(count) {
  if (batchRunning) return;
  batchRunning = true;
  batchButtons.forEach(button => { button.disabled = true; });
  try {
  stopAI();
  const mode = modeEl.value;
  const selectedDepth = Number(depthEl.value);
  const depth = mode === "expectimax" ? 1 : (mode === "strong" ? Math.min(2, selectedDepth) : selectedDepth);
  batchResults = [];
  const depthNote = mode === "expectimax" ? "（批量固定 depth 1）" : (mode === "strong" ? "（批量最高 level 2）" : "");
  batchOutputEl.textContent = `正在跑 ${count} 局 ${mode}${depthNote}…`;

  for (let i = 0; i < count; i += 1) {
    batchResults.push(playOne(mode, 20261024 + i, depth));
    batchOutputEl.textContent = `已完成 ${i + 1}/${count} 局…`;
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  const avg = key => Math.round(batchResults.reduce((s, x) => s + x[key], 0) / batchResults.length);
  const pct = target => Math.round(100 * batchResults.filter(x => x.max >= target).length / batchResults.length);
  const best = Math.max(...batchResults.map(x => x.max));

  batchOutputEl.innerHTML = `
    <strong>${mode} · ${count} 局${mode === "expectimax" ? " · depth 1" : (mode === "strong" ? " · Strong" : "")}</strong><br>
    平均分：${avg("score").toLocaleString()}<br>
    平均步数：${avg("moves").toLocaleString()}<br>
    最高方块：${best.toLocaleString()}<br>
    ≥512：${pct(512)}%　≥1024：${pct(1024)}%　≥2048：${pct(2048)}%
  `;
  } finally {
    batchRunning = false;
    batchButtons.forEach(button => { button.disabled = false; });
  }
}

window.addEventListener("keydown", event => {
  const map = { ArrowLeft: "left", ArrowDown: "down", ArrowRight: "right", ArrowUp: "up" };
  if (!map[event.key]) return;
  event.preventDefault();
  stopAI();
  applyMove(map[event.key]);
});

let swipeStart = null;
boardEl.addEventListener("pointerdown", event => {
  swipeStart = [event.pointerId, event.clientX, event.clientY];
  boardEl.setPointerCapture(event.pointerId);
});
boardEl.addEventListener("pointerup", event => {
  if (!swipeStart || event.pointerId !== swipeStart[0]) return;
  const dx = event.clientX - swipeStart[1];
  const dy = event.clientY - swipeStart[2];
  swipeStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  stopAI();
  applyMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
});
boardEl.addEventListener("pointercancel", () => { swipeStart = null; });

document.querySelector("#new-game").addEventListener("click", reset);
document.querySelector("#ai-start").addEventListener("click", startAI);
document.querySelector("#challenge-3m").addEventListener("click", startThreeMinuteChallenge);
document.querySelector("#ai-step").addEventListener("click", () => { stopAI(); aiStep(); });
document.querySelector("#ai-stop").addEventListener("click", stopAI);
document.querySelector("#batch-10").addEventListener("click", () => runBatch(10));
document.querySelector("#batch-100").addEventListener("click", () => runBatch(100));
modeEl.addEventListener("change", () => {
  depthEl.disabled = !["expectimax","strong"].includes(modeEl.value);
});
depthEl.disabled = !["expectimax","strong"].includes(modeEl.value);

render();
