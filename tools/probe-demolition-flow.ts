/** Compare finite-volume fluxes across one building footprint before and after demolition. */
import { readFileSync } from 'node:fs';
import { Game } from '../src/simulation/game';
import { validateScenario } from '../src/scenario';

const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const mode=process.argv[2]??'baseline', id=process.argv[3]??'w316294474-0';
if(mode!=='baseline' && mode!=='demolish') throw new Error('Aufruf: baseline|demolish [GEBÄUDE-ID]');
const game=new Game(scenario),s=game.solver,w=s.width,h=s.height;
const building=game.buildings.find(b=>b.id===id);if(!building)throw new Error('Gebäude nicht gefunden');
const cells=new Set(building.cells);
if([...cells].some(i=>i%w===0||i%w===w-1||Math.floor(i/w)===0||Math.floor(i/w)===h-1||scenario.parameters.inflowCells.includes(i))) throw new Error('Gebäude am Rand oder Zufluss wird von dieser Bilanz nicht unterstützt');
if(mode==='demolish'){const result=game.apply('probe',{kind:'demolish',buildingId:id});if(!result.ok)throw new Error(result.reason);}
function volume(){let v=0;for(const i of cells)v+=s.h[i]*s.cellSize**2;return v;}
function flux(a:number,b:number,axis:'x'|'y',crest:number){
 const ha=s.h[a],hb=s.h[b],z=Math.max(s.bed[a],s.bed[b],crest),aa=Math.max(0,ha+s.bed[a]-z),ab=Math.max(0,hb+s.bed[b]-z),q=axis==='x'?s.qx:s.qy;
 const na=ha>1e-10?q[a]*aa/ha:0,nb=hb>1e-10?q[b]*ab/hb:0,ua=aa>1e-10?na/aa:0,ub=ab>1e-10?nb/ab:0;
 return 0.5*(na+nb-Math.max(Math.abs(ua)+Math.sqrt(s.gravity*aa),Math.abs(ub)+Math.sqrt(s.gravity*ab))*(ab-aa))*s.cellSize;
}
const initial=volume(),initialGlobal=s.volume();let inward=0,outward=0;
while(s.time<scenario.parameters.duration-1e-9){
 const maxDt=Math.min(1,scenario.parameters.duration-s.time),dt=s.stableStep(maxDt),t=s.time;
 function add(rate:number){inward+=Math.max(0,rate)*dt;outward+=Math.max(0,-rate)*dt;}
 for(const i of cells){const x=i%w,y=Math.floor(i/w);
  if(!cells.has(i-1))add(flux(i-1,i,'x',s.crestX[y*(w+1)+x]));
  if(!cells.has(i+1))add(-flux(i,i+1,'x',s.crestX[y*(w+1)+x+1]));
  if(!cells.has(i-w))add(flux(i-w,i,'y',s.crestY[y*w+x]));
  if(!cells.has(i+w))add(-flux(i,i+w,'y',s.crestY[(y+1)*w+x]));
 }
 const actual=s.step(maxDt);if(actual!==dt)throw new Error('Zeitschritt stimmt nicht');game.addInflow(t,actual);game.updateDamage(actual);
}
const final=volume();
console.log(JSON.stringify({scenario:scenario.version,mode,buildingId:id,cells:cells.size,initial,final,inward,outward,localBalanceError:final-initial-inward+outward,globalRelativeBalance:Math.abs(s.volume()-initialGlobal-s.inflow+s.outflow-s.roundoffVolume)/(initialGlobal+s.inflow),budget:game.budget,...game.totals()},null,2));
