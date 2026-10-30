/** Compare the scenario with an elevated overlapping building part omitted in memory. */
import {readFileSync} from 'node:fs';
import {Game,type Action} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2],excluded=process.argv.includes('--exclude');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(scenario.version!=='1.6-draft'||fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
if(!scenario.buildings.some(b=>b.id==='w672557666-0'))throw Error('Gebäudeteil fehlt');
const withPart=new Game(scenario),withoutPart=new Game({...scenario,buildings:scenario.buildings.filter(b=>b.id!=='w672557666-0')});
const part=withPart.buildings.find(b=>b.id==='w672557666-0'),parent=withPart.buildings.find(b=>b.id==='r9350494-0');
if(!part||!parent)throw Error('Gebäudeteil oder überlappendes Gebäude fehlt');
const diff=(a:Float64Array,b:Float64Array)=>a.reduce((n,value,i)=>n+(value===b[i]?0:1),0);
const coverage={cells:part.cells.length,coveredByParent:part.cells.filter(i=>parent.cells.includes(i)).length,
  changedCrestX:diff(withPart.solver.crestX,withoutPart.solver.crestX),changedCrestY:diff(withPart.solver.crestY,withoutPart.solver.crestY)};
if(excluded)scenario.buildings=scenario.buildings.filter(b=>b.id!=='w672557666-0');
const steps=fixture.strategies[mode];if(!Array.isArray(steps))throw Error('Unbekannte Strategie');
const game=new Game(scenario),solver=game.solver,initial=solver.volume(),actions=[];
for(const [i,step] of steps.entries()){
 let action:Action;
 if(step.kind==='dam')action={kind:'dam',faces:damPath(step.start,step.end,solver.width)};
 else if(step.kind==='trench')action={kind:'trench',cells:trenchPath(step.start,step.end,solver.width)};
 else if(step.kind==='demolish')action={kind:'demolish',buildingId:step.buildingId};
 else throw Error('Unbekannte Aktion');
 const result=game.apply(`action-${i}`,action);if(!result.ok){console.log(JSON.stringify({mode,excluded,invalidAction:i,reason:result.reason}));process.exit(0);}actions.push(result);
}
while(solver.time<scenario.parameters.duration-1e-9){const time=solver.time,dt=solver.step(Math.min(1,scenario.parameters.duration-time));game.addInflow(time,dt);game.updateDamage(dt);}
const balance=Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow);if(balance>=0.001)throw Error('Bilanzabweichung');
console.log(JSON.stringify({scenario:scenario.version,mode,excluded,coverage,budget:game.budget,...game.totals(),actions,relativeBalance:balance}));
