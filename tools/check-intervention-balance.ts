/** Ten-minute scenario balance with construction and demolition after flood onset. */
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {Game, type Action} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';

const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(scenario.version!=='1.4-draft'||fixture.scenario!==scenario.version)throw Error('Szenario oder Referenzversion stimmt nicht');
const game=new Game(scenario),s=game.solver,initial=s.volume(),started=performance.now();
const actions:{name:string;time:number;cost:number;reusedCells:number;volumeBefore:number;volumeAfter:number}[]=[];
function apply(name:string,action:Action){
 const before=s.volume(),budget=game.budget,preview=game.preview(action);
 if(!preview.ok)throw Error(`${name}: ${preview.reason}`);
 const result=game.apply(name,action),after=s.volume();
 if(!result.ok||JSON.stringify(result)!==JSON.stringify(preview))throw Error(`${name}: Bestätigung weicht von Vorschau ab`);
 if(Math.abs(after-before)>1e-8||game.budget!==budget-result.cost)throw Error(`${name}: Wasser- oder Budgetänderung`);
 const repeated=game.apply(name,action);
 if(JSON.stringify(repeated)!==JSON.stringify(result)||s.volume()!==after||game.budget!==budget-result.cost)throw Error(`${name}: Wiederholung verändert Zustand`);
 actions.push({name,time:s.time,cost:result.cost,reusedCells:result.reusedCells??0,volumeBefore:before,volumeAfter:after});
}
for(const [i,segment] of fixture.segments.slice(0,3).entries())apply(`dam-${i}`,{kind:'dam',faces:damPath(segment[0],segment[1],s.width)});
let acted=false,minimum=Infinity,maximum=0;
while(s.time<600-1e-9){
 const t=s.time,dt=s.step(Math.min(1,600-t,acted?Infinity:150-t));game.addInflow(t,dt);game.updateDamage(dt);
 for(let i=0;i<s.h.length;i++){
  if(!Number.isFinite(s.h[i])||!Number.isFinite(s.qx[i])||!Number.isFinite(s.qy[i]))throw Error(`Nicht endlicher Wert in Zelle ${i}`);
  minimum=Math.min(minimum,s.h[i]);maximum=Math.max(maximum,s.h[i]);
 }
 if(!acted&&s.time>=150-1e-9){
  apply('trench-first',{kind:'trench',cells:trenchPath([0,4],[25,4],s.width)});
  apply('trench-connected',{kind:'trench',cells:trenchPath([0,3],[38,11],s.width)});
  if(actions.at(-1)?.reusedCells!==6)throw Error('Unerwartete Überlappung der Gräben');
  const building=game.buildings.find(b=>b.id==='w316294474-0');if(!building)throw Error('Gebäude fehlt');
  const before=game.totals().totalDamage,damage=building.damage,value=building.value;
  apply('demolish',{kind:'demolish',buildingId:building.id});
  if(Math.abs(game.totals().totalDamage-before-(value-damage))>1e-6)throw Error('Abrissverlust doppelt gezählt');
  acted=true;
 }
}
const error=Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow);
const report={scenario:scenario.version,seconds:s.time,wallSeconds:(performance.now()-started)/1000,steps:s.steps,actions,budget:game.budget,...game.totals(),initialVolume:initial,inflow:s.inflow,outflow:s.outflow,finalVolume:s.volume(),roundoff:s.roundoffVolume,relativeBalanceError:error,minDepth:minimum,maxDepth:maximum};
console.log(JSON.stringify(report,null,2));
if(!acted||error>=.001||minimum<0)throw Error('Bilanz oder Positivität außerhalb der Abnahmeschranke');
