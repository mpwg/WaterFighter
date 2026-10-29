/** Diagnostic of the game's imposed inflow magnitude; does not change scenario data. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';
const scale=Number(process.argv[2]);if(!Number.isFinite(scale)||scale<=0)throw Error('Positive Zuflussskala erforderlich');
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
scenario.parameters.inflowCurve=scenario.parameters.inflowCurve.map(([t,q])=>[t,q*scale]);
const game=new Game(scenario),s=game.solver,initial=s.volume(),inlet=new Set(scenario.parameters.inflowCells);
let peak=0,peakInlet=0,peakOther=0,peakBoundary=0;
while(s.time<scenario.parameters.duration-1e-9){
 const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);
 for(let i=0;i<s.h.length;i++){
  peak=Math.max(peak,s.h[i]);if(inlet.has(i))peakInlet=Math.max(peakInlet,s.h[i]);else peakOther=Math.max(peakOther,s.h[i]);
 }
 for(const b of game.buildings)for(const i of b.neighbours)peakBoundary=Math.max(peakBoundary,s.h[i]);
}
console.log(JSON.stringify({version:scenario.version,scale,inflow:s.inflow,outflow:s.outflow,peak,peakInlet,peakOther,peakBoundary,...game.totals(),relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow)}));
