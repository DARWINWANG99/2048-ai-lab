// Rank-encoded research search. No tablebase; utilities are not probabilities.
const D=["left","down","right","up"],N=1<<20;
const M=new Int32Array(N),S=new Float64Array(N);
let ready=false;
function init(){
 if(ready)return;
 const w=Array.from({length:32},(_,r)=>r*2**r);
 for(let x=0;x<N;x++){
  const a=[x&31,(x>>>5)&31,(x>>>10)&31,(x>>>15)&31],v=a.filter(Boolean),o=[];
  for(let i=0;i<v.length;i++){if(i+1<v.length&&v[i]===v[i+1]){o.push(v[i]+1);i++;}else o.push(v[i]);}
  while(o.length<4)o.push(0);
  M[x]=o[0]|o[1]<<5|o[2]<<10|o[3]<<15;
  let s=w[a[0]];
  for(let i=0;i<3;i++){const p=w[a[i]],q=w[a[i+1]];s+=p>=q?p+q:(p-q)*12;if(p===q)s+=p;}
  S[x]=s;
 }
 ready=true;
}
const row=(b,i,d)=>b[i]|b[i+d]<<5|b[i+2*d]<<10|b[i+3*d]<<15;
function slide(b,d){
 const n=new Uint8Array(16);let changed=false;
 const h=d===0||d===2,rev=d===1||d===2;
 for(let k=0;k<4;k++){
  const i=h?k*4:k,step=h?1:4;
  let v=M[rev?row(b,i+3*step,-step):row(b,i,step)];
  for(let j=0;j<4;j++){const p=i+(rev?3-j:j)*step;n[p]=v&31;if(n[p]!==b[p])changed=true;v>>>=5;}
 }
 return changed?n:null;
}
function evalBoard(b){let s=0;for(let i=0;i<4;i++)s+=S[row(b,i*4,1)]+S[row(b,i,4)];return s;}
const boardKey=b=>Array.from(b).join(",");
function choose(board,level,detail){
 init();const depth=Math.min(4,Math.max(1,Number(level)+1));
 const state=Uint8Array.from(board.flat(),v=>v?Math.log2(v):0);
 const cache=new Map(),cutoff=1/2**(depth+6);
 const stats={depth,nodes:0,cacheHits:0,cacheSize:0,tablebase:false};
 function max(b,d,p){
  stats.nodes++;if(d<=0)return evalBoard(b);
  const k=d+"|"+Math.floor(Math.log2(Math.max(p,1e-12))*2)+"|"+boardKey(b);
  const cached=cache.get(k);if(cached!==undefined){stats.cacheHits++;return cached;}
  let best=-Infinity;
  for(let i=0;i<4;i++){const n=slide(b,i);if(n)best=Math.max(best,chance(n,d-1,p));}
  if(best===-Infinity)best=-1e12;
  if(cache.size<50000)cache.set(k,best);return best;
 }
 function chance(b,d,p){
  stats.nodes++;if(d<0||p<cutoff)return evalBoard(b);
  const empty=[];for(let i=0;i<16;i++)if(!b[i])empty.push(i);
  if(!empty.length)return max(b,d,p);
  let sum=0,q=p/empty.length;
  for(const i of empty){b[i]=1;sum+=.9*max(b,d,q*.9);b[i]=2;sum+=.1*max(b,d,q*.1);b[i]=0;}
  return sum/empty.length;
 }
 let direction=null,best=-Infinity;const choices=[];
 for(let i=0;i<4;i++){
  const n=slide(state,i);
  if(!n){choices.push({direction:D[i],legal:false,value:null});continue;}
  const v=chance(n,depth-1,1);choices.push({direction:D[i],legal:true,value:Math.round(v)});
  if(v>best){best=v;direction=D[i];}
 }
 stats.cacheSize=cache.size;
 return detail?{direction,choices,stats}:direction;
}
export const researchMove=(board,level=2)=>choose(board,level,false);
export const researchExplain=(board,level=2)=>choose(board,level,true);
