export const SIZE = 4;

export function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

export function cloneBoard(board) {
  return board.map(row => [...row]);
}

export function slideLine(line) {
  const values = line.filter(v => v !== 0);
  const out = [];
  let scoreDelta = 0;

  for (let i = 0; i < values.length; i += 1) {
    if (i + 1 < values.length && values[i] === values[i + 1]) {
      const merged = values[i] * 2;
      out.push(merged);
      scoreDelta += merged;
      i += 1;
    } else {
      out.push(values[i]);
    }
  }

  while (out.length < SIZE) out.push(0);
  return { line: out, scoreDelta };
}

function rotateClockwise(board) {
  return board[0].map((_, c) => board.map((row, r) => board[SIZE - 1 - r][c]));
}

function rotate(board, turns) {
  let out = cloneBoard(board);
  for (let i = 0; i < ((turns % 4) + 4) % 4; i += 1) out = rotateClockwise(out);
  return out;
}

function arraysEqual(a, b) {
  return a.every((row, r) => row.every((v, c) => v === b[r][c]));
}

export function moveBoard(board, direction) {
  const turnsToLeft = { left: 0, down: 1, right: 2, up: 3 }[direction];
  if (turnsToLeft === undefined) throw new Error(`Unknown direction: ${direction}`);

  const rotated = rotate(board, turnsToLeft);
  let scoreDelta = 0;
  const moved = rotated.map(row => {
    const result = slideLine(row);
    scoreDelta += result.scoreDelta;
    return result.line;
  });
  const restored = rotate(moved, -turnsToLeft);

  return {
    board: restored,
    scoreDelta,
    moved: !arraysEqual(board, restored)
  };
}

export function emptyCells(board) {
  const cells = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (board[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

export function addRandomTile(board, rng = Math.random) {
  const cells = emptyCells(board);
  if (!cells.length) return cloneBoard(board);
  const next = cloneBoard(board);
  const [r, c] = cells[Math.floor(rng() * cells.length)];
  next[r][c] = rng() < 0.9 ? 2 : 4;
  return next;
}

export function newGame(rng = Math.random) {
  return addRandomTile(addRandomTile(emptyBoard(), rng), rng);
}

export function validMoves(board) {
  return ["left", "down", "right", "up"].filter(d => moveBoard(board, d).moved);
}

export function isGameOver(board) {
  return validMoves(board).length === 0;
}

export function maxTile(board) {
  return Math.max(...board.flat());
}
