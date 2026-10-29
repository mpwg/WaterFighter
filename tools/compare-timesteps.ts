/** Compare real-scenario results under two maximum integration steps. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {damPath} from '../src/simulation/path';
import {validateScenario} from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
if(fixture.scenario!==scenario.version)throw new Error('Szenarioversion stimmt nicht');
const maxStep=Number(process.argv[2]), mode=process.argv[3]??'baseline';
if(!(maxStep>0)||!['baseline','bank'].includes(mode))throw new Error('Argumente: maximale Schrittweite, baseline | bank');
const game=new Game(scenario),s=game.solver,initial=s.volume();
if(mode==='bank')for(const [i,segment] of fixture.segments.entries()) {
 const result=game.apply(`bank-${i}`,{kind:'dam',faces:damPath(segment[0],segment[1],s.width)});
 if(!result.ok)throw new Error(result.reason);
}
while(s.time<scenario.parameters.duration-1e-9){const t=s.time,dt=s.step(Math.min(maxStep,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);}
console.log(JSON.stringify({version:scenario.version,maxStep,mode,steps:s.steps,finalVolume:s.volume(),inflow:s.inflow,outflow:s.outflow,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),budget:game.budget,...game.totals()}));
