/** Exploratory comparison: omit the identified OSM building=roof objects in memory. */
import { readFileSync } from 'node:fs';
import { Game, type Action } from '../src/simulation/game';
import { damPath, trenchPath } from '../src/simulation/path';
import { validateScenario } from '../src/scenario';

const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const roofs=['w219815193-0','w243958257-0','w316294474-0','w1193005551-0','w1343275154-0',
  'w1508204653-0','w1537035387-0','w1537035388-0','w1537035389-0','w1537035391-0'];
if(roofs.some(id=>!scenario.buildings.some(b=>b.id===id)))throw Error('Erwartetes Dach fehlt');
if(process.argv.includes('--without-roofs'))scenario.buildings=scenario.buildings.filter(b=>!roofs.includes(b.id));
const name=process.argv[2],steps=fixture.strategies[name];
if(!Array.isArray(steps))throw Error('Strategie fehlt');
const game=new Game(scenario),solver=game.solver,initial=solver.volume();
for(const [i,step] of steps.entries()) {
  let action:Action;
  if(step.kind==='dam')action={kind:'dam',faces:damPath(step.start,step.end,solver.width)};
  else if(step.kind==='trench')action={kind:'trench',cells:trenchPath(step.start,step.end,solver.width)};
  else if(step.kind==='demolish')action={kind:'demolish',buildingId:step.buildingId};
  else throw Error('Unbekanntes Werkzeug');
  const result=game.apply(`experiment-${i}`,action);
  if(!result.ok)throw Error(`Aktion ${i}: ${result.reason}`);
}
while(solver.time<scenario.parameters.duration-1e-9) {
  const t=solver.time,dt=solver.step(Math.min(1,scenario.parameters.duration-t));
  game.addInflow(t,dt);game.updateDamage(dt);
}
console.log(JSON.stringify({scenario:scenario.version,strategy:name,excluded:process.argv.includes('--without-roofs')?roofs:[],
  budget:game.budget,...game.totals(),outflow:solver.outflow,
  relativeBalance:Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow)}));
