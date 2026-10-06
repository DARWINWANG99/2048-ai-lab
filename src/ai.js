import { emptyCells, maxTile, moveBoard, validMoves } from "./engine.js";

const DIRECTIONS = ["left", "down", "right", "up"];
const SNAKES = [
  [15,14,13,12,8,9,10,11,7,6,5,4,0,1,2,3],
  [12,13,14,15,11,10,9,8,4,5,6,7,3,2,1,0],
  [3,2,1,0,4,5,6,7,11,10,9,8,12,13,14,15],
  [0,1,2,3,7,6,5,4,8,9,10,11,15,14,13,12]
];

const lg = v => v ? Math.log2(v) : 0;

function smoothness(board) {
  let p=0;
  for(let r=0;r<4;r++) for(let c=0;c<4;c++) {
    if(!board[r][c]) continue;
    if(c<3&&board[r][c+1]) p+=Math.abs(lg(board[r][c])-lg(board[r][c+1]));
    if(r<3&&board[r+1][c]) p+=Math.abs(lg(board[r][c])-lg(board[r+1][c]));
  }
  return -p;
}

function monotonicity(board) {
  let total=0;
  const lines=[...board,...[0,1,2,3].map(c=>board.map(r=>r[c]))];
  for(const line of lines){
    let inc=0,dec=0;
    for(let i=0;i<3;i++){const a=lg(line[i]),b=lg(line[i+1]); if(a>b)dec+=a-b; else inc+=b-a;}
    total-=Math.min(inc,dec);
  }
  return total;
}

function mergePotential(board) {
  let n=0;
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    if(!board[r][c])continue;
    if(c<3&&board[r][c]===board[r][c+1])n++;
    if(r<3&&board[r][c]===board[r+1][c])n++;
  }
  return n;
}

function snakeScore(board) {
  const flat=board.flat().map(lg);
  let best=-Infinity;
  for(const weights of SNAKES) {
    let s=0;
    for(let i=0;i<16;i++) s+=flat[i]*Math.pow(1.45,weights[i]);
    best=Math.max(best,s);
  }
  return best;
}

export function evaluateBoard(board) {
  const empties=emptyCells(board).length;
  const max=maxTile(board);
  const corners=[board[0][0],board[0][3],board[3][0],board[3][3]];
  const corner=corners.includes(max)?lg(max):0;
  return empties*360 + monotonicity(board)*55 + smoothness(board)*12 +
    mergePotential(board)*70 + corner*650 + snakeScore(board)*0.18;
}

export function randomMove(board,rng=Math.random){
  const m=validMoves(board); return m.length?m[Math.floor(rng()*m.length)]:null;
}

export function cornerMove(board){
  const moves=validMoves(board); if(!moves.length)return null;
  let best=moves[0],score=-Infinity;
  for(const d of moves){const x=moveBoard(board,d);const s=evaluateBoard(x.board)+x.scoreDelta*.4;if(s>score){score=s;best=d;}}
  return best;
}

const key=b=>b.flat().map(v=>v?lg(v):0).join(",");

function searchMove(board, depth, options={}) {
  const cache=new Map();
  const probabilityCutoff=options.probabilityCutoff ?? 0;
  const maxChanceCells=options.maxChanceCells ?? 16;

  function maxNode(state,d){
    const k="M"+d+key(state); if(cache.has(k))return cache.get(k);
    if(d<=0)return evaluateBoard(state);
    let best=-Infinity, any=false;
    for(const dir of DIRECTIONS){
      const x=moveBoard(state,dir); if(!x.moved)continue; any=true;
      best=Math.max(best,chanceNode(x.board,d-1,1)+x.scoreDelta*.45);
    }
    const v=any?best:evaluateBoard(state)-1e7; cache.set(k,v); return v;
  }

  function chanceNode(state,d,pathProb){
    const cells=emptyCells(state); if(!cells.length)return maxNode(state,d);
    if(pathProb<probabilityCutoff)return evaluateBoard(state);
    // Deep search spends effort on the most constraining empty cells first.
    const chosen=cells.length>maxChanceCells?cells.slice(0,maxChanceCells):cells;
    let sum=0,weight=0;
    for(const [r,c] of chosen) for(const [value,p] of [[2,.9],[4,.1]]){
      const next=state.map(row=>[...row]); next[r][c]=value;
      const w=p/chosen.length; sum+=w*maxNode(next,d); weight+=w;
    }
    return sum/weight;
  }

  let best=null,bestValue=-Infinity;
  for(const dir of DIRECTIONS){
    const x=moveBoard(board,dir); if(!x.moved)continue;
    const v=chanceNode(x.board,depth-1,1)+x.scoreDelta*.45;
    if(v>bestValue){bestValue=v;best=dir;}
  }
  return best;
}

export function expectimaxMove(board,depth=3){ return searchMove(board,depth); }

// Strong AI: adaptive depth + probability pruning. Sparse boards are searched
// deeper; crowded endgames retain a strong positional evaluation without
// freezing a phone browser.
export function strongMove(board, level=2) {
  const empties=emptyCells(board).length;
  const depth = level>=3 ? (empties<=5 ? 3 : 2) : 2;
  const cutoff = level>=3 ? 0.0005 : 0.002;
  return searchMove(board,depth,{probabilityCutoff:cutoff,maxChanceCells:16});
}
