/** Compare the delivered scenario against exclusion of one roof relation in memory. */
import {readFileSync} from 'node:fs';
import {Game,type Action} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2],excluded=process.argv.includes('--exclude');
const raw=JSON.parse(readFileSync(process.env.WATERFIGHTER_SCENARIO??'public/scenarios/brigittenau-v1.json','utf8'));
if(raw.version!=='1.5-draft')throw Error('Historisches 1.5-Paket als WATERFIGHTER_SCENARIO angeben');
const scenario=validateScenario({...raw,version:'1.6-draft'});
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
if(!scenario.buildings.some(b=>b.id==='r4257449-0'))throw Error('Dachrelation fehlt');
if(excluded)scenario.buildings=scenario.buildings.filter(b=>b.id!=='r4257449-0');
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
console.log(JSON.stringify({mode,excluded,budget:game.budget,...game.totals(),actions,relativeBalance:balance}));
