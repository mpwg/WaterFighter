/** Recalculate the untreated and two reference strategies on the delivered scenario. */
import {readFileSync} from 'node:fs';
import {Game,type Action} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const westClosed=process.argv.includes('--closed-west'),wide=process.argv.includes('--wide');
if(westClosed)scenario.parameters.outflowEdges=scenario.parameters.outflowEdges.filter(edge=>edge!=='left');
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const name=process.argv[2];const steps=name==='north-control'?fixture.strategies['land-divert'].slice(0,-1):fixture.strategies[name];if(!Array.isArray(steps))throw Error('Strategie: baseline | shield | divert | land-divert | south-control | south-divert');
const game=new Game(scenario),s=game.solver,initial=s.volume(),results=[];
for(const [i,step] of steps.entries()){
 let action:Action;
 if(step.kind==='dam')action={kind:'dam',faces:damPath(step.start,step.end,s.width),wide};
 else if(step.kind==='trench')action={kind:'trench',cells:trenchPath(step.start,step.end,s.width),wide};
 else if(step.kind==='demolish')action={kind:'demolish',buildingId:step.buildingId};
 else throw Error('Unbekannte Aktion');
 const result=game.apply(`reference-${i}`,action);if(!result.ok)throw Error(result.reason);results.push(result);
}
while(s.time<scenario.parameters.duration-1e-9){const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);}
console.log(JSON.stringify({scenario:scenario.version,strategy:name,wide,...(westClosed?{westClosed}:{}),time:s.time,results,budget:game.budget,...game.totals(),inflow:s.inflow,outflow:s.outflow,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),buildings:game.status()},null,2));
