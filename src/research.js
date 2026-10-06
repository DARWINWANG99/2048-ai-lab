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
