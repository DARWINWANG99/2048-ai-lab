// Reproducible no-undo local benchmark. The published upstream scores are not ours.
import { addRandomTile, isGameOver, maxTile, moveBoard, newGame } from "../src/engine.js";
import { researchMove } from "../src/research.js";
const count=Math.max(1,Math.min(100,Number(process.argv[2]||1)));
const level=Math.max(1,Math.min(2,Number(process.argv[3]||1)));
const firstSeed=Number(process.argv[4]||20261024);
function rng(seed){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/2**32;};}
const results=[];
for(let i=0;i<count;i++){
 const seed=firstSeed+i,random=rng(seed),started=performance.now();
 let board=newGame(random),score=0,moves=0;
 while(!isGameOver(board)&&moves<30000){
  const dir=researchMove(board,level);
  if(!dir)break;
  const next=moveBoard(board,dir);
  if(!next.moved)throw Error("Research AI selected illegal move: "+dir);
  board=addRandomTile(next.board,random);
  score+=next.scoreDelta;moves++;
 }
 const result={seed,score,maxTile:maxTile(board),moves,runtimeMs:Math.round(performance.now()-started),commit:process.env.GITHUB_SHA||"local"};
 results.push(result);console.log(JSON.stringify({mode:"research",level,...result}));
}
const averageScore=Math.round(results.reduce((s,r)=>s+r.score,0)/results.length);
console.log(JSON.stringify({summary:true,count,level,averageScore,passed707376:results.some(r=>r.score>707376)}));
