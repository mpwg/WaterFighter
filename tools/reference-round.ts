import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { Game } from '../src/simulation/game';
import { validateScenario } from '../src/scenario';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const multiplier=Number(process.argv[2]??1); scenario.parameters.inflowCurve=scenario.parameters.inflowCurve.map(([t,q])=>[t,q*multiplier]);
const game=new Game(scenario), s=game.solver, initial=s.volume(), start=performance.now();
let maxBoundaryDepth=0,maxElevation=0;
while(s.time<scenario.parameters.duration-1e-9){const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);for(const building of game.buildings) for(const i of building.neighbours) maxBoundaryDepth=Math.max(maxBoundaryDepth,s.h[i]);for(let i=0;i<s.h.length;i++) maxElevation=Math.max(maxElevation,s.h[i]+s.bed[i]);}
console.log(JSON.stringify({scenario:scenario.version, time:s.time, steps:s.steps, maxBoundaryDepth,maxElevation, wallSeconds:(performance.now()-start)/1000, initialVolume:initial, inflow:s.inflow,outflow:s.outflow,finalVolume:s.volume(),roundoff:s.roundoffVolume,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),...game.totals(),budget:game.budget, worstBuildings:game.buildings.filter(b=>b.damage>0).sort((a,b)=>b.damage-a.damage).slice(0,8).map(b=>({id:b.id,value:b.value,damage:b.damage,cells:b.cells,neighbours:b.neighbours}))},null,2));
