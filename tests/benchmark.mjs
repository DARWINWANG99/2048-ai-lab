import { addRandomTile, isGameOver, maxTile, moveBoard, newGame } from "../src/engine.js";
import { cornerMove, expectimaxMove, strongMove } from "../src/ai.js";

function rng(seed){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/2**32;};}
function play(mode,seed){
  const random=rng(seed); let board=newGame(random),score=0,moves=0;
  while(!isGameOver(board)&&moves<30000){
    const d=mode==="corner"?cornerMove(board):mode==="expectimax"?expectimaxMove(board,1):strongMove(board,2);
    if(!d)break; const x=moveBoard(board,d); if(!x.moved)break;
    board=addRandomTile(x.board,random); score+=x.scoreDelta; moves++;
  }
  return {mode,seed,score,max:maxTile(board),moves};
}
const count=Math.max(1,Number(process.argv[2]||10));
for(const mode of ["corner","expectimax","strong"]){
  const rows=[]; for(let i=0;i<count;i++)rows.push(play(mode,20261024+i));
  const best=rows.reduce((a,b)=>b.score>a.score?b:a);
  const avg=Math.round(rows.reduce((s,x)=>s+x.score,0)/rows.length);
  console.log(JSON.stringify({mode,count,avgScore:avg,best}));
}
