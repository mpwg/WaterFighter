/** Sensitivity experiment: omit selected survey-derived crests, without modifying the scenario file. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const mode=process.argv[2]??'baseline';
if(!['baseline','one','all'].includes(mode))throw Error('Aufruf: baseline|one|all [KREUZUNGEN.json]');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const geometry=JSON.parse(readFileSync(process.argv[3]??'/tmp/waterfighter-crossing-overlap.json','utf8'));
if(geometry.version!==scenario.version)throw Error('Szenarioversion stimmt nicht');
const available=new Set(scenario.surveyCrests.map(f=>`${f.axis}:${f.index}`));
const crossed=new Set<string>();
for(const c of geometry.crossings)for(const f of c.intersectingCrests){const key=`${f.axis}:${f.index}`;if(!available.has(key))throw Error('Unbekannte Schnittkante');crossed.add(key);}
if(!crossed.has('y:2435'))throw Error('Ausgewählte Schnittkante fehlt');
const selected=mode==='baseline'?new Set<string>():mode==='one'?new Set(['y:2435']):crossed;
scenario.surveyCrests=scenario.surveyCrests.filter(f=>!selected.has(`${f.axis}:${f.index}`));
const game=new Game(scenario),s=game.solver,initial=s.volume();let maxDepth=0;
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);
 for(const h of s.h)maxDepth=Math.max(maxDepth,h);
}
console.log(JSON.stringify({scenario:scenario.version,mode,removed:[...selected].sort(),seconds:s.time,steps:s.steps,initialVolume:initial,inflow:s.inflow,outflow:s.outflow,finalVolume:s.volume(),maxDepth,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),budget:game.budget,...game.totals()},null,2));
