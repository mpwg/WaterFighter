/** Sample building exposure in each reference strategy without changing solver step boundaries. */
import {readFileSync} from 'node:fs';
import {Game,type Action} from '../src/simulation/game';
import {damPath,trenchPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const name=process.argv[2];
if(!['north-control','land-divert','south-control','south-divert'].includes(name))throw Error('Strategie: north-control | land-divert | south-control | south-divert');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/review-strategies.json','utf8'));
if(fixture.scenario!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const steps=name==='north-control'?fixture.strategies['land-divert'].filter((x:{kind:string})=>x.kind!=='trench'):fixture.strategies[name];
const game=new Game(scenario),s=game.solver,initial=s.volume();
for(const [i,step] of steps.entries()) {
 let action:Action;
 if(step.kind==='dam')action={kind:'dam',faces:damPath(step.start,step.end,s.width)};
 else if(step.kind==='trench')action={kind:'trench',cells:trenchPath(step.start,step.end,s.width)};
 else throw Error('Unbekannte Referenzaktion');
 const result=game.apply(`reference-${i}`,action);if(!result.ok)throw Error(result.reason);
}
const times=[60,90,120,150,180,210,240,270,300],samples=[];
let next=0;
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);
 if(next<times.length&&s.time>=times[next]-1e-9){samples.push({target:times[next++],time:s.time,totalDamage:game.totals().totalDamage,buildings:game.status()});}
}
console.log(JSON.stringify({scenario:scenario.version,strategy:name,budget:game.budget,...game.totals(),relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),samples},null,2));
