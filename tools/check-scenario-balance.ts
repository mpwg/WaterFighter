/** Ten simulated minutes on the real scenario draft, not a scientific model. */
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { Game } from '../src/simulation/game';
import { validateScenario } from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const game=new Game(scenario),s=game.solver,initial=s.volume(),start=performance.now();
let minimum=Infinity,maximum=0;
while(s.time<600-1e-9){const t=s.time,dt=s.step(Math.min(1,600-t));game.addInflow(t,dt);game.updateDamage(dt);for(let i=0;i<s.h.length;i++){if(!Number.isFinite(s.h[i])||!Number.isFinite(s.qx[i])||!Number.isFinite(s.qy[i]))throw new Error(`Nicht endlicher Wert in Zelle ${i}`);minimum=Math.min(minimum,s.h[i]);maximum=Math.max(maximum,s.h[i]);}}
const denominator=initial+s.inflow, error=Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/denominator;
console.log(JSON.stringify({scenario:scenario.version,seconds:s.time,wallSeconds:(performance.now()-start)/1000,steps:s.steps,initialVolume:initial,inflow:s.inflow,outflow:s.outflow,finalVolume:s.volume(),roundoff:s.roundoffVolume,relativeBalanceError:error,minDepth:minimum,maxDepth:maximum},null,2));
if(error>=.001 || minimum<0)throw new Error('Bilanz oder Positivität außerhalb der Abnahmeschranke');
