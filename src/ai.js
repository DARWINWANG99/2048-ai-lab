import { emptyCells, maxTile, moveBoard, validMoves } from "./engine.js";

const DIRECTIONS = ["left", "down", "right", "up"];

function log2(v) {
  return v > 0 ? Math.log2(v) : 0;
}

function smoothness(board) {
  let penalty = 0;
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const v = board[r][c];
      if (!v) continue;
      if (c + 1 < 4 && board[r][c + 1]) penalty += Math.abs(log2(v) - log2(board[r][c + 1]));
      if (r + 1 < 4 && board[r + 1][c]) penalty += Math.abs(log2(v) - log2(board[r + 1][c]));
    }
  }
  return -penalty;
}

function monotonicity(board) {
  let score = 0;
  const lines = [
    ...board,
    ...[0, 1, 2, 3].map(c => board.map(row => row[c]))
  ];
  for (const line of lines) {
    const logs = line.map(log2);
    let inc = 0;
    let dec = 0;
    for (let i = 0; i < 3; i += 1) {
      if (logs[i] >= logs[i + 1]) dec += logs[i] - logs[i + 1];
      else inc += logs[i + 1] - logs[i];
    }
    score += Math.max(inc, dec);
  }
  return score;
}

function mergePotential(board) {
  let pairs = 0;
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      if (!board[r][c]) continue;
      if (c + 1 < 4 && board[r][c] === board[r][c + 1]) pairs += 1;
      if (r + 1 < 4 && board[r][c] === board[r + 1][c]) pairs += 1;
    }
  }
  return pairs;
}

function bottomLeftSnake(board) {
  const weights = [
    [1, 2, 4, 8],
    [128, 64, 32, 16],
    [256, 512, 1024, 2048],
    [32768, 16384, 8192, 4096]
  ];
  let score = 0;
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) score += log2(board[r][c]) * weights[r][c];
  }
  return score;
}

export function evaluateBoard(board) {
  const empties = emptyCells(board).length;
  const max = maxTile(board);
  const corner = board[3][0] === max ? log2(max) : 0;
  return (
    empties * 320 +
    monotonicity(board) * 24 +
    smoothness(board) * 7 +
    mergePotential(board) * 55 +
    corner * 500 +
    bottomLeftSnake(board) * 0.02
  );
}

export function randomMove(board, rng = Math.random) {
  const moves = validMoves(board);
  if (!moves.length) return null;
  return moves[Math.floor(rng() * moves.length)];
}

export function cornerMove(board) {
  const moves = validMoves(board);
  if (!moves.length) return null;
  let best = moves[0];
  let bestScore = -Infinity;
  for (const direction of moves) {
    const result = moveBoard(board, direction);
    let score = evaluateBoard(result.board) + result.scoreDelta * 0.4;
    if (direction === "left") score += 160;
    if (direction === "down") score += 180;
    if (direction === "up") score -= 120;
    if (score > bestScore) {
      bestScore = score;
      best = direction;
    }
  }
  return best;
}

function boardKey(board) {
  return board.flat().join(",");
}

export function expectimaxMove(board, depth = 3) {
  const memo = new Map();

  function maxNode(state, d) {
    const key = `M:${d}:${boardKey(state)}`;
    if (memo.has(key)) return memo.get(key);
    if (d <= 0) return evaluateBoard(state);

    const moves = validMoves(state);
    if (!moves.length) return evaluateBoard(state) - 100000;

    let best = -Infinity;
    for (const direction of DIRECTIONS) {
      const result = moveBoard(state, direction);
      if (!result.moved) continue;
      const value = chanceNode(result.board, d - 1) + result.scoreDelta * 0.35;
      if (value > best) best = value;
    }
    memo.set(key, best);
    return best;
  }

  function chanceNode(state, d) {
    const key = `C:${d}:${boardKey(state)}`;
    if (memo.has(key)) return memo.get(key);
    const cells = emptyCells(state);
    if (!cells.length) return maxNode(state, d);

    const cellProbability = 1 / cells.length;
    let expected = 0;
    for (const [r, c] of cells) {
      for (const [value, probability] of [[2, 0.9], [4, 0.1]]) {
        const next = state.map(row => [...row]);
        next[r][c] = value;
        expected += cellProbability * probability * maxNode(next, d);
      }
    }
    memo.set(key, expected);
    return expected;
  }

  const moves = validMoves(board);
  if (!moves.length) return null;

  let bestDirection = moves[0];
  let bestValue = -Infinity;
  for (const direction of DIRECTIONS) {
    const result = moveBoard(board, direction);
    if (!result.moved) continue;
    const value = chanceNode(result.board, depth - 1) + result.scoreDelta * 0.35;
    if (value > bestValue) {
      bestValue = value;
      bestDirection = direction;
    }
  }
  return bestDirection;
}
