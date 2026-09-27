import assert from "node:assert/strict";
import { addRandomTile, emptyBoard, isGameOver, maxTile, moveBoard, slideLine, validMoves } from "../src/engine.js";
import { cornerMove, evaluateBoard, expectimaxMove, randomMove } from "../src/ai.js";

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (err) { console.error(`✗ ${name}`); throw err; }
}

test("slideLine merges once per move", () => {
  assert.deepEqual(slideLine([2,2,2,2]), { line:[4,4,0,0], scoreDelta:8 });
  assert.deepEqual(slideLine([4,4,8,0]), { line:[8,8,0,0], scoreDelta:8 });
});

test("move left matches standard 2048 rules", () => {
  const board = [[2,0,2,2],[4,4,8,8],[0,0,0,0],[2,4,8,16]];
  const result = moveBoard(board, "left");
  assert.deepEqual(result.board, [[4,2,0,0],[8,16,0,0],[0,0,0,0],[2,4,8,16]]);
  assert.equal(result.scoreDelta, 28);
  assert.equal(result.moved, true);
});

test("move directions rotate correctly", () => {
  const board = [[2,0,0,0],[2,0,0,0],[4,0,0,0],[4,0,0,0]];
  assert.deepEqual(moveBoard(board,"down").board.map(r=>r[0]), [0,0,4,8]);
  assert.deepEqual(moveBoard(board,"up").board.map(r=>r[0]), [4,8,0,0]);
});

test("full checkerboard is game over", () => {
  const board = [[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]];
  assert.equal(isGameOver(board), true);
  assert.deepEqual(validMoves(board), []);
});

test("addRandomTile adds exactly one 2 or 4", () => {
  const board = emptyBoard();
  const rngValues = [0.2,0.2];
  let i = 0;
  const next = addRandomTile(board, () => rngValues[i++]);
  assert.equal(next.flat().filter(Boolean).length, 1);
  assert.ok([2,4].includes(maxTile(next)));
});

test("AI selectors always return a valid move", () => {
  const board = [[0,0,0,0],[0,0,0,0],[0,0,2,0],[8,4,2,0]];
  const moves = validMoves(board);
  assert.ok(moves.includes(randomMove(board, () => 0.1)));
  assert.ok(moves.includes(cornerMove(board)));
  assert.ok(moves.includes(expectimaxMove(board, 2)));
});

test("heuristic prefers an ordered bottom-left board", () => {
  const ordered = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[256,128,64,32]];
  const messy = [[0,0,0,0],[0,0,0,0],[64,0,256,0],[32,128,0,0]];
  assert.ok(evaluateBoard(ordered) > evaluateBoard(messy));
});

console.log("\nAll tests passed.");
