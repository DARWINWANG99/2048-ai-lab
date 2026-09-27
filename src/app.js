import { addRandomTile, isGameOver, maxTile, moveBoard, newGame } from "./engine.js";
import { cornerMove, expectimaxMove, randomMove } from "./ai.js";

let board = newGame();
let score = 0;
let moves = 0;
let running = false;
let timer = null;
let batchResults = [];

const boardEl = document.querySelector("#board");
const scoreEl = document.querySelector("#score");
const maxEl = document.querySelector("#max-tile");
const movesEl = document.querySelector("#moves");
const statusEl = document.querySelector("#status");
const modeEl = document.querySelector("#ai-mode");
const speedEl = document.querySelector("#speed");
const depthEl = document.querySelector("#depth");
const batchOutputEl = document.querySelector("#batch-output");

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
  if (timer) clearTimeout(timer);
  timer = null;
  render();
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
  let state = newGame(rng);
  let localScore = 0;
  let localMoves = 0;
  const maxSteps = 20000;

  while (!isGameOver(state) && localMoves < maxSteps) {
    let direction;
    if (mode === "random") direction = randomMove(state, rng);
    else if (mode === "corner") direction = cornerMove(state);
    else direction = expectimaxMove(state, depth);
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
  stopAI();
  const mode = modeEl.value;
  const selectedDepth = Number(depthEl.value);
  const depth = mode === "expectimax" ? 1 : selectedDepth;
  batchResults = [];
  const depthNote = mode === "expectimax" ? "（批量固定 depth 1）" : "";
  batchOutputEl.textContent = `正在跑 ${count} 局 ${mode}${depthNote}…`;

  for (let i = 0; i < count; i += 1) {
    batchResults.push(playOne(mode, 20261024 + i, depth));
    if ((i + 1) % 5 === 0) {
      batchOutputEl.textContent = `已完成 ${i + 1}/${count} 局…`;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  const avg = key => Math.round(batchResults.reduce((s, x) => s + x[key], 0) / batchResults.length);
  const pct = target => Math.round(100 * batchResults.filter(x => x.max >= target).length / batchResults.length);
  const best = Math.max(...batchResults.map(x => x.max));

  batchOutputEl.innerHTML = `
    <strong>${mode} · ${count} 局${mode === "expectimax" ? " · depth 1" : ""}</strong><br>
    平均分：${avg("score").toLocaleString()}<br>
    平均步数：${avg("moves").toLocaleString()}<br>
    最高方块：${best.toLocaleString()}<br>
    ≥512：${pct(512)}%　≥1024：${pct(1024)}%　≥2048：${pct(2048)}%
  `;
}

window.addEventListener("keydown", event => {
  const map = { ArrowLeft: "left", ArrowDown: "down", ArrowRight: "right", ArrowUp: "up" };
  if (!map[event.key]) return;
  event.preventDefault();
  stopAI();
  applyMove(map[event.key]);
});

let touchStart = null;
boardEl.addEventListener("touchstart", event => {
  const t = event.changedTouches[0];
  touchStart = [t.clientX, t.clientY];
}, { passive: true });
boardEl.addEventListener("touchend", event => {
  if (!touchStart) return;
  const t = event.changedTouches[0];
  const dx = t.clientX - touchStart[0];
  const dy = t.clientY - touchStart[1];
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  stopAI();
  applyMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
}, { passive: true });

document.querySelector("#new-game").addEventListener("click", reset);
document.querySelector("#ai-start").addEventListener("click", startAI);
document.querySelector("#ai-step").addEventListener("click", () => { stopAI(); aiStep(); });
document.querySelector("#ai-stop").addEventListener("click", stopAI);
document.querySelector("#batch-10").addEventListener("click", () => runBatch(10));
document.querySelector("#batch-100").addEventListener("click", () => runBatch(100));
modeEl.addEventListener("change", () => {
  depthEl.disabled = modeEl.value !== "expectimax";
});
depthEl.disabled = modeEl.value !== "expectimax";

render();
