import { addRandomTile, isGameOver, maxTile, moveBoard, newGame } from "../src/engine.js";
import { strongMove } from "../src/ai.js";
function rng(seed){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/2**32;};}
function play(seed){const r=rng(seed);let b=newGame(r),score=0,moves=0;const started=Date.now();while(!isGameOver(b)&&moves<30000){const d=strongMove(b,2);if(!d)break;const x=moveBoard(b,d);if(!x.moved)break;b=addRandomTile(x.board,r);score+=x.scoreDelta;moves++;}return{seed,score,max:maxTile(b),moves,seconds:+((Date.now()-started)/1000).toFixed(2)};}
const seeds=[20261024,20261025,20261026];
const out=seeds.map(s=>{const x=play(s);console.log(JSON.stringify(x));return x;});
const best=out.reduce((a,b)=>a.score>b.score?a:b);
console.log("BEST "+JSON.stringify(best));
