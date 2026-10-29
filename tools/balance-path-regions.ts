/** Regional finite-volume flux accounting around the two selected land-entry faces. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const game=new Game(scenario),s=game.solver,w=s.width,initialGlobal=s.volume();
const mode=process.argv[2]??'baseline',damFaces=[{axis:'y' as const,index:42*w+58},{axis:'y' as const,index:89*w+95}];
if(mode==='0'||mode==='1'){const r=game.apply('dam',{kind:'dam',faces:[damFaces[Number(mode)]]});if(!r.ok)throw Error(r.reason);}else if(mode!=='baseline')throw Error('Argument: baseline | 0 | 1');
const regions=[[54,42,62,50],[91,89,99,97]] as const;
const stats=regions.map(()=>({inward:0,outward:0,selectedInward:0,otherInward:0}));
function volume(box:readonly number[]){let v=0;for(let y=box[1];y<=box[3];y++)for(let x=box[0];x<=box[2];x++)v+=s.h[y*w+x]*s.cellSize**2;return v;}
const initial=regions.map(volume);
function flux(a:number,b:number,axis:'x'|'y',crest:number){
 const ha=s.h[a],hb=s.h[b],z=Math.max(s.bed[a],s.bed[b],crest),aa=Math.max(0,ha+s.bed[a]-z),ab=Math.max(0,hb+s.bed[b]-z),q=axis==='x'?s.qx:s.qy;
 const na=ha>1e-10?q[a]*aa/ha:0,nb=hb>1e-10?q[b]*ab/hb:0,ua=aa>1e-10?na/aa:0,ub=ab>1e-10?nb/ab:0;
 return 0.5*(na+nb-Math.max(Math.abs(ua)+Math.sqrt(s.gravity*aa),Math.abs(ub)+Math.sqrt(s.gravity*ab))*(ab-aa))*s.cellSize;
}
while(s.time<scenario.parameters.duration-1e-9){
 const maxDt=Math.min(1,scenario.parameters.duration-s.time),dt=s.stableStep(maxDt),t=s.time;
 regions.forEach(([x0,y0,x1,y1],k)=>{
  function add(rate:number,selected=false){const inward=Math.max(0,rate)*dt;stats[k].inward+=inward;stats[k].outward+=Math.max(0,-rate)*dt;if(selected)stats[k].selectedInward+=inward;else stats[k].otherInward+=inward;}
  for(let y=y0;y<=y1;y++){
   let b=y*w+x0;add(flux(b-1,b,'x',s.crestX[y*(w+1)+x0]));
   let a=y*w+x1;add(-flux(a,a+1,'x',s.crestX[y*(w+1)+x1+1]));
  }
  for(let x=x0;x<=x1;x++){
   let b=y0*w+x;add(flux(b-w,b,'y',s.crestY[y0*w+x]),y0*w+x===damFaces[k].index);
   let a=y1*w+x;add(-flux(a,a+w,'y',s.crestY[(y1+1)*w+x]));
  }
 });
 const actual=s.step(maxDt);if(actual!==dt)throw Error('Zeitschritt stimmt nicht');game.addInflow(t,actual);game.updateDamage(actual);
}
const out=regions.map((box,k)=>{const final=volume(box),r=stats[k];return {box,initial:initial[k],final,...r,balanceErrorM3:final-initial[k]-r.inward+r.outward};});
console.log(JSON.stringify({version:scenario.version,mode,budget:game.budget,...game.totals(),regions:out,globalBalance:Math.abs(s.volume()-initialGlobal-s.inflow+s.outflow-s.roundoffVolume)/(initialGlobal+s.inflow)},null,2));
