import { emptyCells, maxTile, moveBoard, validMoves } from "./engine.js";

const DIRECTIONS = ["left", "down", "right", "up"];
const SNAKES = [
  [[15,14,13,12],[8,9,10,11],[7,6,5,4],[0,1,2,3]],
  [[12,13,14,15],[11,10,9,8],[4,5,6,7],[3,2,1,0]],
  [[3,2,1,0],[4,5,6,7],[11,10,9,8],[12,13,14,15]],
  [[0,1,2,3],[7,6,5,4],[8,9,10,11],[15,14,13,12]]
];

const lg = v => v ? Math.log2(v) : 0;
function smoothness(b){let p=0;for(let r=0;r<4;r++)for(let c=0;c<4;c++){if(!b[r][c])continue;if(c<3&&b[r][c+1])p+=Math.abs(lg(b[r][c])-lg(b[r][c+1]));if(r<3&&b[r+1][c])p+=Math.abs(lg(b[r][c])-lg(b[r+1][c]));}return-p;}
function mergePotential(b){let n=0;for(let r=0;r<4;r++)for(let c=0;c<4;c++){if(!b[r][c])continue;if(c<3&&b[r][c]===b[r][c+1])n++;if(r<3&&b[r][c]===b[r+1][c])n++;}return n;}
function monotonicity(b){let s=0;for(const line of [...b,...[0,1,2,3].map(c=>b.map(r=>r[c]))]){const a=line.filter(Boolean).map(lg);let x=0,y=0;for(let i=0;i<a.length-1;i++){if(a[i]>=a[i+1])x+=a[i]-a[i+1];else y+=a[i+1]-a[i];}s-=Math.min(x,y);}return s;}
function snakeScore(b){
  let best=-Infinity;
  for(const w of SNAKES){let s=0;for(let r=0;r<4;r++)for(let c=0;c<4;c++)s+=lg(b[r][c])*Math.pow(1.55,w[r][c]);best=Math.max(best,s);}
  return best;
}
export function evaluateBoard(b){
  const e=emptyCells(b).length,m=maxTile(b),corners=[b[0][0],b[0][3],b[3][0],b[3][3]];
  const corner=corners.includes(m)?lg(m):0;
  return e*420+monotonicity(b)*55+smoothness(b)*12+mergePotential(b)*90+corner*650+snakeScore(b)*0.75;
}
export function randomMove(b,rng=Math.random){const m=validMoves(b);return m.length?m[Math.floor(rng()*m.length)]:null;}
export function cornerMove(b){let best=null,v=-Infinity;for(const d of DIRECTIONS){const x=moveBoard(b,d);if(!x.moved)continue;const q=evaluateBoard(x.board)+x.scoreDelta*.4;if(q>v){v=q;best=d;}}return best;}
function key(b){return b.flat().map(lg).join("");}

function searchMove(board, depth, strong=false){
  const memo=new Map();
  let nodes=0;
  function maxNode(s,d){
    const k="M"+d+key(s); if(memo.has(k))return memo.get(k); nodes++;
    if(d<=0)return evaluateBoard(s);
    let best=-Infinity,any=false;
    for(const dir of DIRECTIONS){const x=moveBoard(s,dir);if(!x.moved)continue;any=true;best=Math.max(best,chanceNode(x.board,d-1)+x.scoreDelta*.45);}
    const v=any?best:evaluateBoard(s)-1e7; memo.set(k,v);return v;
  }
  function chanceNode(s,d){
    const cells=emptyCells(s);if(!cells.length)return maxNode(s,d);
    const k="C"+d+key(s);if(memo.has(k))return memo.get(k);
    let expected=0;
    // Strong mode keeps exact chance expansion in tight positions, but samples
    // symmetric empty cells when the board is open so deeper search stays fast.
    const stride=strong&&cells.length>8?2:1;
    const chosen=cells.filter((_,i)=>i%stride===0);
    const cp=1/chosen.length;
    for(const [r,c] of chosen)for(const [value,p] of [[2,.9],[4,.1]]){const n=s.map(row=>[...row]);n[r][c]=value;expected+=cp*p*maxNode(n,d);}
    memo.set(k,expected);return expected;
  }
  let best=null,bv=-Infinity;
  for(const d of DIRECTIONS){const x=moveBoard(board,d);if(!x.moved)continue;const v=chanceNode(x.board,depth-1)+x.scoreDelta*.45;if(v>bv){bv=v;best=d;}}
  return {direction:best,nodes};
}
export function expectimaxMove(board,depth=3){return searchMove(board,depth,false).direction;}
export function strongMove(board,depth=3){
  const empties=emptyCells(board).length;
  // Adaptive depth: open boards are cheap/forgiving; tight endgames deserve more look-ahead.
  const adaptive=Math.max(depth, empties<=3?4:empties<=6?3:2);
  return searchMove(board,adaptive,true).direction;
}
