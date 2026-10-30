/** Area and exposure duration of modelled land-cell depths in the untreated round. */
import {readFileSync} from 'node:fs';
import {Game} from '../src/simulation/game';
import {validateScenario} from '../src/scenario';

const scenario=validateScenario(JSON.parse(readFileSync('public/scenarios/brigittenau-v1.json','utf8')));
const maxStep=process.argv[2]===undefined?1:Number(process.argv[2]);
if(!Number.isFinite(maxStep)||maxStep<=0)throw Error('Maximale Schrittweite muss positiv und endlich sein.');
const game=new Game(scenario),solver=game.solver,initial=solver.volume(),cellArea=scenario.grid.cellSize**2;
const thresholds=[0.5,1,2],durations=thresholds.map(()=>new Float64Array(solver.h.length));
const maxArea=thresholds.map(()=>({all:0,awayFromInlet:0}));
const integratedArea=thresholds.map(()=>({all:0,awayFromInlet:0}));
while(solver.time<scenario.parameters.duration-1e-9){
  const t=solver.time,dt=solver.step(Math.min(maxStep,scenario.parameters.duration-t));
  game.addInflow(t,dt);game.updateDamage(dt);
  const counts=thresholds.map(()=>({all:0,awayFromInlet:0}));
  for(let i=0;i<solver.h.length;i++) {
    if(scenario.waterMask[i])continue;
    for(let k=0;k<thresholds.length;k++)if(solver.h[i]>=thresholds[k]){
      durations[k][i]+=dt;counts[k].all++;
      if(Math.floor(i/solver.width)>=5)counts[k].awayFromInlet++;
    }
  }
  for(let k=0;k<thresholds.length;k++)for(const scope of ['all','awayFromInlet'] as const){
    const area=counts[k][scope]*cellArea;
    maxArea[k][scope]=Math.max(maxArea[k][scope],area);
    integratedArea[k][scope]+=area*dt;
  }
}
const statistics=thresholds.map((depth,k)=>{
  const durationCounts=[1,10,60].map(seconds=>({seconds,cells:[...durations[k]].filter(d=>d>=seconds).length}));
  return {depth,maxAreaM2:maxArea[k],areaSecondsM2:integratedArea[k],durationCounts};
});
console.log(JSON.stringify({scenario:scenario.version,...(process.argv[2]===undefined?{}:{maxStep}),seconds:solver.time,cellSize:scenario.grid.cellSize,awayFromInlet:'Zeile >= 5',statistics,totalDamage:game.totals().totalDamage,relativeBalance:Math.abs(solver.volume()-initial-solver.inflow+solver.outflow-solver.roundoffVolume)/(initial+solver.inflow)},null,2));
