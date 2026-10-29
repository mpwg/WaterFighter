/** Reproducible comparison of a simple intervention in the Wiener scenario. */
import { readFileSync } from 'node:fs';
import { Game, type Action } from '../src/simulation/game';
import { trenchPath } from '../src/simulation/path';
import { validateScenario } from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8'))), game=new Game(scenario), s=game.solver;
let action:Action;
if(process.argv[2]==='demolish')action={kind:'demolish',buildingId:process.argv[3]};
else if(process.argv[2]==='trench') {const [x,y0,y1]=process.argv.slice(3).map(Number); action={kind:'trench',cells:trenchPath([x,y0],[x,y1],s.width)};}
else throw new Error('Aufruf: trench X Y0 Y1 | demolish GEBÄUDE-ID');
const result=game.apply('reference',action);if(!result.ok)throw new Error(result.reason);
const initial=s.volume();let maxDepth=0;
while(s.time<scenario.parameters.duration-1e-9){const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);for(const h of s.h)maxDepth=Math.max(maxDepth,h);}
console.log(JSON.stringify({scenario:scenario.version,action,result,maxDepth,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),...game.totals()},null,2));
