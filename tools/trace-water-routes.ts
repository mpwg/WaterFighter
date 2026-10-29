/** Offline passive-dye experiment over separately reconstructed solver mass fluxes. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const mode=process.argv[2]??'baseline';
if(!['baseline','0','1'].includes(mode))throw Error('Argument: baseline | 0 | 1');
const game=new Game(scenario),s=game.solver,w=s.width,h=s.height,n=w*h,area=s.cellSize**2,initialVolume=s.volume();
const gates=[{axis:'y' as const,index:42*w+58},{axis:'y' as const,index:89*w+95}];
if(mode!=='baseline'){const action=game.apply('probe',{kind:'dam',faces:[gates[Number(mode)]]});if(!action.ok)throw Error(action.reason);}
const dye=[new Float64Array(n),new Float64Array(n)],change=[new Float64Array(n),new Float64Array(n)];
const tagged=[0,0],exited=[0,0],peakLand=[0,0];
function flux(a:number,b:number,axis:'x'|'y',crest:number){
 const ha=s.h[a],hb=s.h[b],z=Math.max(s.bed[a],s.bed[b],crest),aa=Math.max(0,ha+s.bed[a]-z),ab=Math.max(0,hb+s.bed[b]-z),q=axis==='x'?s.qx:s.qy;
 const na=ha>1e-10?q[a]*aa/ha:0,nb=hb>1e-10?q[b]*ab/hb:0,ua=aa>1e-10?na/aa:0,ub=ab>1e-10?nb/ab:0;
 return 0.5*(na+nb-Math.max(Math.abs(ua)+Math.sqrt(s.gravity*aa),Math.abs(ub)+Math.sqrt(s.gravity*ab))*(ab-aa))*s.cellSize;
}
function concentration(k:number,i:number){const v=s.h[i]*area;return v>1e-10?dye[k][i]/v:0;}
function transfer(a:number,b:number,rate:number,dt:number,gate:number){
 if(rate===0)return;const donor=rate>0?a:b,receiver=rate>0?b:a,volume=Math.abs(rate)*dt;
 const c0=concentration(0,donor),c1=concentration(1,donor);
 for(let k=0;k<2;k++){const amount=volume*(k===0?c0:c1);change[k][donor]-=amount;change[k][receiver]+=amount;}
 // Mark only previously unmarked water passing a selected face in the landward direction.
 if(gate>=0 && rate>0){const amount=volume*Math.max(0,1-c0-c1);change[gate][receiver]+=amount;tagged[gate]+=amount;}
}
function exit(cell:number,rate:number,dt:number){
 if(rate<=0)return;
 for(let k=0;k<2;k++){const amount=rate*dt*concentration(k,cell);change[k][cell]-=amount;exited[k]+=amount;}
}
let maxBoundError=0;
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,maxDt=Math.min(1,scenario.parameters.duration-t),dt=s.stableStep(maxDt);
 change[0].fill(0);change[1].fill(0);
 for(let y=0;y<h;y++)for(let x=1;x<w;x++){
  const a=y*w+x-1,b=a+1,index=y*(w+1)+x;transfer(a,b,flux(a,b,'x',s.crestX[index]),dt,-1);
 }
 for(let y=1;y<h;y++)for(let x=0;x<w;x++){
  const b=y*w+x,a=b-w,index=y*w+x,gate=index===gates[0].index?0:index===gates[1].index?1:-1;
  transfer(a,b,flux(a,b,'y',s.crestY[index]),dt,gate);
 }
 for(let y=0;y<h;y++){const left=y*w,right=left+w-1;if(s.openBoundary.left)exit(left,Math.max(0,-s.qx[left])*s.cellSize,dt);if(s.openBoundary.right)exit(right,Math.max(0,s.qx[right])*s.cellSize,dt);}
 for(let x=0;x<w;x++){const top=x,bottom=(h-1)*w+x;if(s.openBoundary.top)exit(top,Math.max(0,-s.qy[top])*s.cellSize,dt);if(s.openBoundary.bottom)exit(bottom,Math.max(0,s.qy[bottom])*s.cellSize,dt);}
 if(s.step(maxDt)!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,dt);game.updateDamage(dt);
 const land=[0,0];
 for(let i=0;i<n;i++){
  for(let k=0;k<2;k++)dye[k][i]+=change[k][i];
  const bound=Math.max(0,-dye[0][i],-dye[1][i],dye[0][i]+dye[1][i]-s.h[i]*area);maxBoundError=Math.max(maxBoundError,bound);
  if(bound>1e-7)throw Error(`Tracer außerhalb der Wasserbilanz in Zelle ${i}: ${bound}`);
  if(!scenario.waterMask[i]){land[0]+=dye[0][i];land[1]+=dye[1][i];}
 }
 for(let k=0;k<2;k++)peakLand[k]=Math.max(peakLand[k],land[k]);
}
const markers=gates.map((gate,k)=>{const remaining=dye[k].reduce((a,b)=>a+b,0);return {gate,tagged:tagged[k],exited:exited[k],remaining,peakLand:peakLand[k],balanceError:remaining+exited[k]-tagged[k]};});
console.log(JSON.stringify({scenario:scenario.version,mode,time:s.time,budget:game.budget,...game.totals(),markers,maxBoundError,waterBalance:Math.abs(s.volume()-initialVolume-s.inflow+s.outflow-s.roundoffVolume)/(initialVolume+s.inflow)},null,2));
