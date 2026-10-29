import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { Game } from '../src/simulation/game';
import { validateScenario } from '../src/scenario';
import { damPath } from '../src/simulation/path';
const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const multiplier=Number(process.argv[2]??1); scenario.parameters.inflowCurve=scenario.parameters.inflowCurve.map(([t,q])=>[t,q*multiplier]);
const game=new Game(scenario), s=game.solver, initial=s.volume(), start=performance.now();
if(process.argv[3]==='bank') {
  const fixture=JSON.parse(readFileSync('tests/fixtures/strategy.json','utf8'));
  if(fixture.scenario!==scenario.version) throw new Error('Szenarioversion stimmt nicht');
  let count=0;
  for(const [i,segment] of fixture.segments.entries()) {
    const faces=damPath(segment[0],segment[1],scenario.grid.width); count+=faces.length;
    const result=game.apply(`bank-${i}`,{kind:'dam',faces});
    if(!result.ok) throw new Error(`Schutzlinie ${i}: ${result.reason}`);
  }
  console.error('Schutzlinie',count,'Budgetrest',game.budget);
}
let maxBoundaryDepth=0,maxElevation=0;const firstFlood=new Map<string,{time:number;cell:number}>();
while(s.time<scenario.parameters.duration-1e-9){const t=s.time,dt=s.step(Math.min(1,scenario.parameters.duration-t));game.addInflow(t,dt);game.updateDamage(dt);for(const building of game.buildings) if(building.damage>0 && !firstFlood.has(building.id)){const cell=building.neighbours.reduce((best,i)=>s.h[i]>s.h[best]?i:best,building.neighbours[0]);firstFlood.set(building.id,{time:s.time,cell});}for(const building of game.buildings) for(const i of building.neighbours) maxBoundaryDepth=Math.max(maxBoundaryDepth,s.h[i]);for(let i=0;i<s.h.length;i++) maxElevation=Math.max(maxElevation,s.h[i]+s.bed[i]);}
console.log(JSON.stringify({scenario:scenario.version, time:s.time, steps:s.steps, maxBoundaryDepth,maxElevation, wallSeconds:(performance.now()-start)/1000, initialVolume:initial, inflow:s.inflow,outflow:s.outflow,finalVolume:s.volume(),roundoff:s.roundoffVolume,relativeBalance:Math.abs(s.volume()-initial-s.inflow+s.outflow-s.roundoffVolume)/(initial+s.inflow),...game.totals(),budget:game.budget, worstBuildings:game.buildings.filter(b=>b.damage>0).sort((a,b)=>b.damage-a.damage).slice(0,8).map(b=>({id:b.id,value:b.value,damage:b.damage,firstFlood:firstFlood.get(b.id),cells:b.cells,neighbours:b.neighbours}))},null,2));
